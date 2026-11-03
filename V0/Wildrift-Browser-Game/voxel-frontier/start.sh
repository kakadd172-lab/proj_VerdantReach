#!/usr/bin/env sh
cd "$(dirname "$0")"
if command -v python3 >/dev/null 2>&1; then
  PYTHON=python3
elif command -v python >/dev/null 2>&1; then
  PYTHON=python
else
  echo "Python 3 is required. Install it, then run this script again."
  exit 1
fi
echo "Wildrift is starting at http://127.0.0.1:8000"
echo "Keep this terminal open while playing. Press Ctrl+C to stop the server."
"$PYTHON" -m http.server 8000 --bind 127.0.0.1
