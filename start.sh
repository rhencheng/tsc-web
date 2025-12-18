#!/bin/bash

# 资质对标管理系统 - 前端服务启动脚本

echo ""
echo "============================================"
echo "  资质对标管理系统 - 前端服务"
echo "============================================"
echo ""

# 获取脚本所在目录
FRONT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$FRONT_DIR"

# 总是尝试安装依赖以确保 package.json 中的新项被安装
echo "[INFO] 检查/安装前端依赖..."
npm install

# 总是重新编译以确保最新代码生效
echo "[INFO] 编译前端代码..."
npm run build

# 启动 Node.js 服务
echo "[INFO] 启动 Node.js 前端服务 (Port: 3000)..."
npm start
