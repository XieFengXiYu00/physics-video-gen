# PHYSIQ.AI · 理科解题视频生成器

AI 双 Agent 驱动，把初高中理科题目（物理 / 数学 / 化学）的截图或文字一键变成动画解题视频。

- **Agent 1 — Teacher** · Gemini Flash 视觉模型分析题目，输出结构化 JSON
- **Agent 2 — Video Planner** · 把 JSON 转成 Remotion 场景脚本
- **Remotion 4** · 浏览器内实时渲染受力箭头、解题步骤动画

## 快速开始（本地）

### 1. 配置 Gemini API Key

编辑 `.env.local`：

```env
GEMINI_API_KEY=AIzaSy.....
# 可选：默认 gemini-flash-latest
# GEMINI_MODEL=gemini-flash-latest
# 可选：公司网络代理
# HTTPS_PROXY=http://10.158.100.2:8080
# HTTP_PROXY=http://10.158.100.2:8080
```

去 [Google AI Studio](https://aistudio.google.com/apikey) 领免费 Key（Gemini Flash 有慷慨的免费额度）。

### 2. 启动

```bash
npm install
npm run dev
```

访问 http://localhost:3000

## 部署到 Vercel

完全兼容，零配置：

1. 把代码 push 到 GitHub
2. 去 [vercel.com/new](https://vercel.com/new) 选这个仓库
3. **Environment Variables** 填：
   - `GEMINI_API_KEY` = 你的 Key
   - （Vercel 服务器走公网，不需要 `HTTPS_PROXY`）
4. Deploy

> ⚠ `.env.local` 不会被推到 Git（已在 `.gitignore`）。Vercel 上的环境变量在 Project Settings → Environment Variables 配置。

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
