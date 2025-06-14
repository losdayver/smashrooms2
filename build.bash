#!/usr/bin/env bash
npm i -g typescript
./build-ws-server.bash &
./build-static-server.bash &
wait
