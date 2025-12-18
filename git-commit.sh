#!/bin/bash

# 资质对标管理系统 - 自动提交脚本

# 检查是否提供了 commit message
if [ -z "$1" ]; then
    echo ""
    echo "============================================"
    echo "  错误: 请提供 commit message"
    echo "  用法: ./git-commit.sh \"你的提交信息\""
    echo "============================================"
    echo ""
    exit 1
fi

COMMIT_MSG=$1

# 获取脚本所在目录并切换
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

echo "[INFO] 正在检测更改..."

# 1. 添加所有更改
# git add . 会自动根据 .gitignore 忽略文件
git add .

# 检查是否有内容需要提交
if git diff --cached --quiet; then
    echo "[INFO] 没有发现需要提交的更改。"
else
    # 2. 提交更改
    echo "[INFO] 正在提交代码..."
    echo "[MSG] $COMMIT_MSG"
    git commit -m "$COMMIT_MSG"
    echo "[SUCCESS] 代码提交完成！"
fi

