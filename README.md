# Test Failure Sound 🔔

A VS Code extension that **automatically plays a sound** whenever any test case fails in the integrated terminal — no matter what language or framework you use.

## Features

- 🎵 **Plays your custom sound** the moment a test failure is detected
- 🌍 **Works with all languages and frameworks**: Jest, Pytest, Go test, Cargo/Rust, RSpec, PHPUnit, JUnit, Mocha, Vitest, Cypress, Playwright, dotnet test, ExUnit, and more
- ⚡ **Zero configuration** — works out of the box
- 🔇 **Configurable**: enable/disable and adjust volume from VS Code settings
- 🛑 **Auto-stops** after the sound finishes playing

## Requirements

- VS Code **1.93.0** or later (Shell Integration must be enabled — it is by default)

## How It Works

The extension uses VS Code's **Shell Integration API** to stream terminal output for every command you run. It scans the output for failure patterns (like `FAILED`, `AssertionError`, `test(s) failed`, `✕`, etc.) and plays the sound as soon as a failure is detected.

## Settings

| Setting | Default | Description |
|---|---|---|
| `testFailureSound.enabled` | `true` | Enable or disable the sound |
| `testFailureSound.volume` | `1.0` | Volume from `0.0` (silent) to `1.0` (full) |

You can change these in **File → Preferences → Settings** and search for `Test Failure Sound`.

## Supported Test Frameworks (non-exhaustive)

| Language | Frameworks |
|---|---|
| JavaScript/TypeScript | Jest, Mocha, Vitest, Jasmine, Cypress, Playwright |
| Python | Pytest, unittest |
| Go | `go test` |
| Rust | `cargo test` |
| Ruby | RSpec, Minitest |
| PHP | PHPUnit |
| Java/Kotlin | JUnit (Maven/Gradle) |
| C#/.NET | dotnet test, NUnit, xUnit |
| Elixir | ExUnit |

## Known Limitations

- Requires [Shell Integration](https://code.visualstudio.com/docs/terminal/shell-integration) to be active in the terminal (enabled by default in VS Code 1.93+)
- Sound plays in a hidden WebView panel — if VS Code is in a restricted environment without WebViews, sound won't play

## License

MIT
