#!/bin/bash
if [ ! -t 0 ]; then # script is executed outside the terminal?
  # execute the script inside a terminal window
  x-terminal-emulator -e "$0" "$@"
  # and abort running the rest of it
  exit 0
fi


cd "$(dirname "$0")"
python3 -m http.server 8081

