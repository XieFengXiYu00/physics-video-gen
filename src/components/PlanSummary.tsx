import { TeacherPlan } from "@/types/plan";
import {
  FORCE_COLORS,
  PROBLEM_TYPE_LABELS_ZH,
  ProblemType,
} from "@/lib/constants";
import { Badge } from "./ui/Badge";

interface PlanSummaryProps {
  plan: TeacherPlan;
}

export function PlanSummary({ plan }: PlanSummaryProps) {
  return (
    <div className="glass-panel rounded-2xl p-5 flex flex-col gap-4 overflow-y-auto max-h-[460px]">
      <div className="flex items-center justify-between">
        <span className="section-label text-emerald-300">Teacher Agent · Output</span>
        <span className="text-[10px] text-slate-500 font-mono-tech tracking-widest uppercase">
          {plan.objects.length} obj · {plan.forces.length} fc · {plan.solution_steps.length} step
        </span>
      </div>

      <div>
        <p className="text-slate-200 text-sm font-semibold leading-relaxed">
          {plan.problem_summary}
        </p>
        <div className="flex gap-2 mt-2.5 flex-wrap">
          <Badge color="cyan">{plan.difficulty === "high_school" ? "高中" : "初中"}</Badge>
          <Badge color="purple">
            {PROBLEM_TYPE_LABELS_ZH[plan.problem_type as ProblemType] ?? plan.problem_type}
          </Badge>
          <Badge color="slate">{plan.subject}</Badge>
        </div>
      </div>

      <Section title="Given · 已知量">
        <div className="grid grid-cols-2 gap-1.5">
          {Object.entries(plan.given).map(([k, v]) => (
            <div
              key={k}
              className="bg-slate-950/50 border border-cyan-500/10 rounded-lg px-3 py-1.5 text-sm"
            >
              <span className="text-slate-500">{k} = </span>
              <span className="text-cyan-200 font-mono-tech">{v}</span>
            </div>
          ))}
        </div>
      </Section>

      {plan.forces.length > 0 && (
        <Section title={`Forces · 受力 (${plan.forces.length})`}>
          <div className="flex flex-col gap-1.5">
            {plan.forces.map((f, i) => (
              <div
                key={i}
                className="flex items-center gap-2 text-sm py-1 px-2 rounded-md bg-slate-950/30 border border-slate-700/30"
              >
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0 shadow-[0_0_8px_currentColor]"
                  style={{
                    background: f.color ?? FORCE_COLORS[f.type],
                    color: f.color ?? FORCE_COLORS[f.type],
                  }}
                />
                <span className="text-slate-200">{f.label ?? f.type}</span>
                <span className="text-slate-500 ml-auto font-mono-tech text-xs">
                  {f.magnitude}
                </span>
              </div>
            ))}
          </div>
        </Section>
      )}

      <div className="border border-emerald-500/30 bg-emerald-500/5 rounded-xl p-3 shadow-[0_0_24px_rgba(16,185,129,0.1)]">
        <div className="text-[10px] text-emerald-300 uppercase tracking-widest mb-1 font-mono-tech">
          ✓ Final Answer
        </div>
        <div className="text-emerald-100 text-sm font-medium leading-relaxed">
          {plan.answer}
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] text-slate-500 mb-2 uppercase tracking-widest font-mono-tech">
        {title}
      </div>
      {children}
    </div>
  );
}
