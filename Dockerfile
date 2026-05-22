FROM node:20-bookworm-slim

WORKDIR /app

# 安装 Node 依赖
COPY package.json package-lock.json ./
RUN npm ci

# 复制源码
COPY . .

# 生产构建
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start"]
