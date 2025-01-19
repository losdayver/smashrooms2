#!/bin/sh
tmux new-session './runserver.bash' \; \
     split-window './runstaticserver.bash'
