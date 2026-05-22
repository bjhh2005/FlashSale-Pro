#!/bin/bash
set -e
echo "[install-deps.sh] 安装前端依赖..."
cd "$(dirname "$0")"
npm install
echo "[install-deps.sh] 前端依赖安装完成!"
