export function Header() {
  return (
    <header className="border-b border-cyan-500/10 px-8 py-4 backdrop-blur-md bg-slate-950/40">
      <div className="max-w-screen-xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo />
          <div>
            <h1 className="text-base font-bold leading-tight text-white tracking-wide">
              PHYSIQ<span className="text-cyan-400 text-glow">.AI</span>
            </h1>
            <p className="text-[10px] text-slate-400 tracking-[0.18em] uppercase font-mono-tech">
              Physics Video Synthesizer
            </p>
          </div>
        </div>

        <div className="flex items-center gap-5 text-[10px] uppercase tracking-[0.18em] font-mono-tech">
          <StatusPill label="Gemini" online />
          <StatusPill label="Remotion" online />
          <span className="text-slate-500">v0.1.0</span>
        </div>
      </div>
    </header>
  );
}

function Logo() {
  return (
    <div className="relative w-9 h-9 grid place-items-center">
      {/* Rotating ring */}
      <svg
        viewBox="0 0 36 36"
        className="absolute inset-0 w-full h-full animate-[spin_8s_linear_infinite]"
        aria-hidden
      >
        <defs>
          <linearGradient id="logo-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="50%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
        </defs>
        <circle
          cx="18"
          cy="18"
          r="15"
          fill="none"
          stroke="url(#logo-grad)"
          strokeWidth="1.5"
          strokeDasharray="50 30"
          strokeLinecap="round"
        />
      </svg>
      {/* Inner solid */}
      <div className="w-6 h-6 rounded-md bg-gradient-to-br from-cyan-500/80 via-indigo-500/80 to-fuchsia-500/80 grid place-items-center text-white text-sm font-bold shadow-[0_0_12px_rgba(34,211,238,0.5)]">
        ⚛
      </div>
    </div>
  );
}

function StatusPill({ label, online }: { label: string; online: boolean }) {
  return (
    <span className="flex items-center gap-2 text-slate-400">
      <span
        className={`pulse-ring w-1.5 h-1.5 rounded-full ${
          online ? "bg-emerald-400 text-emerald-400" : "bg-slate-600 text-slate-600"
        }`}
      />
      {label}
    </span>
  );
}
