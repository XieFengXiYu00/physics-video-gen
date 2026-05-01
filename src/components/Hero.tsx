export function Hero() {
  return (
    <div className="text-center py-10">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/20 bg-cyan-500/5 text-cyan-300 text-[11px] font-mono-tech uppercase tracking-[0.18em] mb-6">
        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
        Powered by Gemini Flash · Remotion 4
      </div>

      <h2 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight">
        <span className="text-white">拍照上传，秒出</span>
        <br />
        <span className="text-gradient">解题动画视频</span>
      </h2>

      <p className="text-slate-400 mt-5 max-w-xl mx-auto leading-relaxed">
        AI 双 Agent 自动识别题目 · 受力分析 · 步骤拆解
        <br />
        <span className="text-slate-500 text-sm font-mono-tech">
          PHYSICS · KINEMATICS · ELECTROMAGNETICS
        </span>
      </p>
    </div>
  );
}
