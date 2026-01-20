#!/bin/bash

IMAGE=xxx0209/react-frontend:latest
PORT=80

echo "Pull latest React image..."
docker pull $IMAGE

echo "Stop previous container..."
docker stop react-app 2>/dev/null || true
docker rm react-app 2>/dev/null || true

echo "Run React container..."
docker run -d --name react-app -p ${PORT}:80 $IMAGE

echo "React deployment successful!"