#!/bin/bash
tmux new-session './run-ws-server.sh' \; \
     split-window './run-static-server.sh'
