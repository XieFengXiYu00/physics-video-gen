# PHYSIQ.AI · 理科解题视频生成器

AI 双 Agent 驱动，把初高中理科题目（物理 / 数学 / 化学）的截图或文字一键变成动画解题视频。

- **Agent 1 — Teacher** · Gemini Flash 视觉模型分析题目，输出结构化 JSON
- **Agent 2 — Video Planner** · 把 JSON 转成 Remotion 场景脚本
- **Remotion 4** · 浏览器内实时渲染受力箭头、解题步骤动画

## 快速开始（本地）

### 1. 配置 API Key

编辑 `.env.local`：

```env
DEEPSEEK_API_KEY=sk-.....
REMBG_API_KEY=你的 rembg.com API Key
# 可选：如果切换到 Gemini
# GEMINI_API_KEY=AIzaSy.....
# GEMINI_MODEL=gemini-flash-latest
# 可选：公司网络代理
# HTTPS_PROXY=http://10.158.100.2:8080
# HTTP_PROXY=http://10.158.100.2:8080
```

去 [DeepSeek](https://platform.deepseek.com/) 配置默认生成模型 Key；人像去背景需要在 [rembg.com](https://www.rembg.com/en/api-usage) 获取 `REMBG_API_KEY`。

### 2. 启动（本地 npm）

```bash
npm install
npm run dev
```

访问 http://localhost:3000

### 3. 启动（Docker）

**需要：** Docker 与 Docker Compose

```bash
# 方式 1：本机 3000 端口可用
docker compose up -d

# 方式 2：本机 3000 端口被占用，改用 3001
# （docker-compose.yml 已配置 "3001:3000"）
docker compose up -d
# 访问 http://localhost:3001
```

查看日志：
```bash
docker compose logs -f
```

停止：
```bash
docker compose down
```

### 4. API 测试

**测试 Agent 2（纯函数，无需 Gemini API Key）：**

```bash
curl -X POST http://localhost:3001/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "plan": {
      "problem_summary": "质量为2kg的物体从10m高处自由落下，求落地速度",
      "subject": "physics",
      "problem_type": "kinematics",
      "difficulty": "high_school",
      "given": {"h": "10 m", "g": "9.8 m/s²"},
      "unknowns": ["v"],
      "objects": [{"id": "ball", "label": "物体", "shape": "block", "position": {"x": 0.5, "y": 0.3}}],
      "forces": [{"on": "ball", "type": "gravity", "magnitude": "19.6N", "angle_deg": 270}],
      "solution_steps": [{"step": 1, "description": "v²=2gh", "equation": "v²=2×9.8×10=196", "result": "v=14m/s"}],
      "answer": "落地速度为14 m/s"
    }
  }'
```

**测试 Agent 1（需要 GEMINI_API_KEY）：**

```bash
curl -X POST http://localhost:3001/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "problemText": "有五位同学收集汽车票，他们共有3张1元，3张2元，2张5元和4张10元的车票，这五位同学每人收集的车票钱数各不相同。收集汽车票价钱最多的同学最少收集了多少元的汽车票？",
    "referenceAnswer": "15元"
  }'
```

## 部署到 Vercel

配置好环境变量后可部署。本地 Docker 开发和 Vercel 云部署**互不影响**：

1. 把代码 push 到 GitHub
   ```bash
   git push origin main
   ```
2. 去 [vercel.com/new](https://vercel.com/new) 选这个仓库
3. **Environment Variables** 填：
   - `DEEPSEEK_API_KEY` = 你的 DeepSeek Key
   - `REMBG_API_KEY` = 你的 rembg.com API Key
   - `GEMINI_API_KEY` = 你的 Gemini Key（可选，切换到 Gemini 时需要）
   - （Vercel 服务器走公网，不需要 `HTTPS_PROXY`）
4. Deploy

> ⚠ `.env.local` 不会被推到 Git（已在 `.gitignore`）。Vercel 上的环境变量在 Project Settings → Environment Variables 配置。

本地继续用 Docker 开发，Vercel 是生产环境，两者独立运行。

## 项目结构

```
src/
├── app/
│   ├── page.tsx                  # 入口（仅装配）
│   ├── layout.tsx                # 全局 + TechBackground
│   ├── globals.css               # 科技风样式 + 动画
│   └── api/
│       ├── analyze/route.ts      # Agent 1
│       └── generate/route.ts     # Agent 2
├── agents/
│   ├── teacher.ts                # Gemini function-calling
│   └── videoPlanner.ts           # 计划 → 场景配置
├── components/
│   ├── TechBackground.tsx        # 动画网格 + 光晕 + 扫描线
│   ├── Header.tsx / Hero.tsx
│   ├── InputCard.tsx             # dropzone + 粘贴 + 取消按钮
│   ├── PlanSummary.tsx
│   ├── VideoPanel.tsx            # @remotion/player
│   └── ui/Badge.tsx
├── lib/
│   ├── constants.ts              # 颜色 / 时长 / 类型枚举（单一来源）
│   ├── schemas.ts                # zod 校验
│   ├── llm.ts                    # Gemini 客户端 + 代理支持
│   ├── image.ts                  # 客户端图片压缩
│   └── usePipeline.ts            # 双 Agent 流水线 + AbortController
└── remotion/
    ├── Root.tsx                  # CLI 渲染入口
    ├── PhysicsVideo.tsx          # <Series> 场景路由
    └── components/
        ├── SceneShell.tsx
        ├── ProblemScene.tsx
        ├── ForceArrow.tsx
        ├── FreeBodyDiagram.tsx
        ├── SolutionStep.tsx
        └── AnswerScene.tsx
```

## 命令

```bash
npm run dev                  # Next.js 开发服务器
npm run build                # 生产构建
npm run remotion:preview     # Remotion Studio 预览
npm run remotion:render      # 渲染为 MP4 → out/physics.mp4
```

## 架构

```
截图 / 文字
    ↓ base64 + text
[Agent 1] teacher.ts  →  Gemini Flash function-calling
    ↓ TeacherPlan JSON（zod 校验）
[Agent 2] videoPlanner.ts（纯函数）
    ↓ SceneConfig JSON
@remotion/player（浏览器实时渲染）
    ↓ 每帧 useCurrentFrame() → spring/interpolate → SVG
解题动画视频
```

## 技术栈

- **Next.js 16** · App Router · Turbopack
- **Tailwind CSS 4** · 自定义动画
- **Remotion 4** · React 视频
- **Google Gemini Flash** · 视觉分析（支持 function calling）
- **undici** · proxy-aware fetch
- **zod** · 运行时校验
- **react-dropzone** · 图片拖拽
