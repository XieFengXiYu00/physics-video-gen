FROM node:20-bookworm-slim

WORKDIR /app

# 安装 Python + pip + rembg 依赖（用于人像背景去除）
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 python3-pip python3-venv ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# 创建 Python 虚拟环境，安装 rembg + Pillow（用清华镜像加速）
RUN python3 -m venv /opt/venv \
    && /opt/venv/bin/pip install --no-cache-dir --upgrade pip \
    && /opt/venv/bin/pip install --no-cache-dir \
        -i https://pypi.tuna.tsinghua.edu.cn/simple \
        rembg onnxruntime pillow numpy

# 将 venv 的 python3 加入 PATH，让 child_process.spawn("python3") 命中 venv
ENV PATH="/opt/venv/bin:$PATH"

# 预下载 rembg 模型到镜像中（避免运行时联网下载）
COPY models/u2netp.onnx /root/.u2net/u2netp.onnx

# 安装 Node 依赖
COPY package.json package-lock.json ./
RUN npm ci

# 复制源码
COPY . .

# 生产构建
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start"]
