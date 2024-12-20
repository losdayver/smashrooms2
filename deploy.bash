#!/bin/bash
git pull
sudo docker build -t smashrooms2-image .
sudo docker stop smashrooms2-container
sudo docker rm smashrooms2-container
sudo docker run -d -p 5889:5889 -p 5890:5890 --name smashrooms2-container smashrooms2-image