import * as vscode from "vscode";
import * as path from "path";
import * as os from "os";
import * as fs from "fs";
import { execFile } from "child_process";

// ─── Failure pattern regex ────────────────────────────────────────────────────
// Covers: Jest, Mocha, Vitest, Pytest, Go test, Cargo/Rust, RSpec, PHPUnit,
//         JUnit (Maven/Gradle), dotnet test, ExUnit (Elixir), NUnit, xUnit,
//         Jasmine, Cypress, Playwright CLI, generic "X failed" patterns, etc.
const FAILURE_PATTERNS = [
  /\bFAILED\b/,
  /\bFAILING\b/,
  /\d+\s+failed/i,
  /\btest(s)?\s+failed\b/i,
  /\bfailures?:/i,
  /\bfailed\s+test(s)?\b/i,
  /FAIL\s+[\w./]+/, // Go
  /Tests run:.*Failures: [1-9]/i, // JUnit Maven
  /test result: FAILED/i, // Rust cargo test
  /\bAssertionError\b/,
  /\bAssertException\b/,
  /\bExpect(ationFailedError)?\b.*failed/i,
  /^\s*(Error|FATAL|PANIC):/m,
  /[✕✗✘×]/,
  /●\s+.+/, // Jest
  /FAILURES!/,
  /There (was|were) \d+ failure/i,
  /short test summary info/i,
  /= FAILURES =/,
  /FAILED .+::/,
  /\d+ example.*, \d+ failure/i,
  /Failed:\s*[1-9]/i,
  /Test Run Failed/i,
  /\[FAIL\]/,
  /\d+ (failing|failures)/i,
  /\d+ failed\b/i,
];

function containsFailure(text: string): boolean {
  return FAILURE_PATTERNS.some((re) => re.test(text));
}

// ─── Audio playback via native OS commands ────────────────────────────────────
// We use native OS audio commands instead of a WebView because WebView's
// autoplay policy silently blocks audio.play() without a real user gesture.

let isPlaying = false;

function playFailureSound(context: vscode.ExtensionContext): void {
  const config = vscode.workspace.getConfiguration("testFailureSound");
  if (!config.get<boolean>("enabled", true)) {
    return;
  }

  // Prevent overlapping plays
  if (isPlaying) {
    return;
  }

  // Resolve the sound file: check media/ first (correct location), fallback to root
  const soundInMedia = path.join(
    context.extensionPath,
    "media",
    "modi-ji-bhojyam.mp3",
  );
  const soundInRoot = path.join(context.extensionPath, "modi-ji-bhojyam.mp3");
  const soundPath = fs.existsSync(soundInMedia)
    ? soundInMedia
    : fs.existsSync(soundInRoot)
      ? soundInRoot
      : null;

  if (!soundPath) {
    vscode.window.showErrorMessage(
      "[Test Failure Sound] Sound file not found. " +
        "Expected media/modi-ji-bhojyam.mp3 inside the extension folder.",
    );
    return;
  }

  console.log(`[Test Failure Sound] Using sound file: ${soundPath}`);

  const platform = os.platform();
  isPlaying = true;

  if (platform === "darwin") {
    // macOS: afplay is built-in and natively supports MP3 — no dependencies
    execFile("afplay", [soundPath], (err) => {
      isPlaying = false;
      if (err) {
        vscode.window.showErrorMessage(
          `[Test Failure Sound] afplay error: ${err.message}`,
        );
      }
    });
  } else if (platform === "linux") {
    // Linux: try mpg123 first, fall back to ffplay
    execFile("mpg123", ["-q", soundPath], (err) => {
      if (err) {
        execFile(
          "ffplay",
          ["-nodisp", "-autoexit", "-loglevel", "quiet", soundPath],
          (err2) => {
            isPlaying = false;
            if (err2) {
              vscode.window.showErrorMessage(
                "[Test Failure Sound] No audio player found. Please install mpg123 or ffmpeg.",
              );
            }
          },
        );
      } else {
        isPlaying = false;
      }
    });
  } else if (platform === "win32") {
    // Windows: PowerShell with Windows Media Player COM object
    const ps = `
      Add-Type -AssemblyName presentationCore;
      $p = New-Object system.windows.media.mediaplayer;
      $p.open([uri]'${soundPath.replace(/\\/g, "/")}');
      $p.Play();
      Start-Sleep -Milliseconds 6000;
      $p.Stop();
    `;
    execFile(
      "powershell",
      ["-NoProfile", "-NonInteractive", "-Command", ps],
      (err) => {
        isPlaying = false;
        if (err) {
          vscode.window.showErrorMessage(
            `[Test Failure Sound] PowerShell error: ${err.message}`,
          );
        }
      },
    );
  } else {
    isPlaying = false;
    vscode.window.showWarningMessage(
      "[Test Failure Sound] Unsupported OS for audio playback.",
    );
  }
}

// ─── Main activation ──────────────────────────────────────────────────────────

export function activate(context: vscode.ExtensionContext): void {
  console.log("[Test Failure Sound] Extension activated.");

  // ── Check shell integration status and warn user if it looks inactive ──
  // Shell integration must be active for onDidStartTerminalShellExecution to fire.
  // We delay the check so VS Code has time to attach shell integration on startup.
  setTimeout(() => {
    const terminals = vscode.window.terminals;
    if (terminals.length > 0) {
      const anyActive = terminals.some((t) => t.shellIntegration !== undefined);
      if (!anyActive) {
        vscode.window
          .showWarningMessage(
            "[Test Failure Sound] Shell Integration is not active on any open terminal. " +
              "Please open a new terminal tab — VS Code enables shell integration automatically on new tabs.",
            "Open New Terminal",
          )
          .then((choice) => {
            if (choice === "Open New Terminal") {
              vscode.commands.executeCommand("workbench.action.terminal.new");
            }
          });
      }
    }
  }, 3000);

  // Buffer per terminal to accumulate output between reads
  const terminalBuffers = new Map<vscode.Terminal, string>();

  // onDidStartTerminalShellExecution fires every time the user runs a command
  // in a terminal that has shell integration enabled (VS Code 1.93+, on by default).
  const shellExecDisposable = vscode.window.onDidStartTerminalShellExecution(
    async (event: vscode.TerminalShellExecutionStartEvent) => {
      const { terminal, execution } = event;

      // Clear buffer for this new command run
      terminalBuffers.set(terminal, "");

      const stream = execution.read();
      let triggered = false;

      for await (const chunk of stream) {
        if (triggered) {
          continue;
        }

        const prev = terminalBuffers.get(terminal) ?? "";
        const combined = prev + chunk;
        terminalBuffers.set(terminal, combined.slice(-3000));

        if (containsFailure(combined)) {
          triggered = true;
          playFailureSound(context);
        }
      }

      terminalBuffers.delete(terminal);
    },
  );

  // Clean up buffer when a terminal is closed
  const closeDisposable = vscode.window.onDidCloseTerminal((terminal) => {
    terminalBuffers.delete(terminal);
  });

  // Register a manual test command so you can verify audio works independently
  const testSoundCommand = vscode.commands.registerCommand(
    "testFailureSound.testSound",
    () => {
      playFailureSound(context);
      vscode.window.showInformationMessage(
        "[Test Failure Sound] Playing test sound...",
      );
    },
  );

  context.subscriptions.push(
    shellExecDisposable,
    closeDisposable,
    testSoundCommand,
  );
}

export function deactivate(): void {
  // Nothing to clean up — child_process handles its own lifecycle
}
