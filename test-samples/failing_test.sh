#!/bin/bash
# 🔵 Instant test — No language/framework required!
# Run with: bash failing_test.sh
# This directly prints a failure message that the extension detects.

echo "Running tests..."
sleep 1
echo ""
echo "  ✕ test: addition should return 3"
echo "  ✕ test: strings should match"
echo ""
echo "Tests: 2 FAILED, 0 passed"
echo ""
echo "FAILED"
exit 1
