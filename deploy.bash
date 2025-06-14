#!/usr/bin/env bash
git pull
docker compose down -v --rmi all
docker compose build
docker compose up -d
