#!/bin/bash
set -e

echo "🚀 开始部署 new-api 美化版前端..."
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# 检查是否在正确的目录
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}错误: 请在项目根目录运行此脚本${NC}"
    exit 1
fi

# 1. 拉取最新代码
echo "📥 拉取最新代码..."
git pull origin main || {
    echo -e "${RED}错误: Git pull 失败${NC}"
    exit 1
}
echo ""

# 2. 构建 Docker 镜像
echo "🔨 构建 Docker 镜像..."
docker-compose build --no-cache || {
    echo -e "${RED}错误: Docker 构建失败${NC}"
    exit 1
}
echo ""

# 3. 停止旧容器
echo "🛑 停止旧容器..."
docker-compose down || {
    echo -e "${RED}错误: 停止容器失败${NC}"
    exit 1
}
echo ""

# 4. 启动新容器
echo "🚀 启动新容器..."
docker-compose up -d || {
    echo -e "${RED}错误: 启动容器失败${NC}"
    exit 1
}
echo ""

# 5. 查看状态
echo "✅ 部署完成！容器状态："
docker-compose ps
echo ""

# 6. 等待几秒后检查健康状态
echo "⏳ 等待服务启动..."
sleep 5

# 检查服务是否正常运行
if curl -s http://localhost:3000/api/status | grep -q '"success":true'; then
    echo -e "${GREEN}✅ 服务运行正常！访问 http://your-server-ip:3000${NC}"
else
    echo -e "${RED}⚠️  服务可能还未完全启动，请稍后访问 http://your-server-ip:3000${NC}"
fi

echo ""
echo "📋 常用命令："
echo "  查看日志: docker-compose logs -f new-api"
echo "  重启服务: docker-compose restart new-api"
echo "  停止服务: docker-compose down"
