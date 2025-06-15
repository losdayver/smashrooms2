#!/usr/bin/env bash
(cd client; npm i; npx webpack --mode production) &
(cd staticServer; npm i) &
wait
