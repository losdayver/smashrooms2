#!/usr/bin/env bash
npm i -g typescript
./scripts/build-ws-server.sh &
./scripts/build-static-server.sh &
wait
