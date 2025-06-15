#!/bin/bash
tmux new-session './run-ws-server.bash' \; \
     split-window './run-static-server.bash'
