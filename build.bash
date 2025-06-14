#!/bin/bash
npm i -g typescript
(cd ./server; npm i; tsc) &
(cd ./client; npm i; npx webpack --mode production) &
(cd ./staticServer; npm i) &
wait
