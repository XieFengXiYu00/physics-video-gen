FROM node:20-alpine

WORKDIR /app

# 安装依赖
COPY package.json package-lock.json ./
RUN npm ci

# 复制源码
COPY . .

# 暴露端口
EXPOSE 3000

# 开发模式启动
CMD ["npm", "run", "dev"]
