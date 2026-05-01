import { ReactNode } from "react";

const COLORS = {
  cyan: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30 shadow-[0_0_12px_rgba(34,211,238,0.15)]",
  purple: "bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30 shadow-[0_0_12px_rgba(217,70,239,0.15)]",
  slate: "bg-slate-500/15 text-slate-300 border-slate-500/30",
  green: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.15)]",
  blue: "bg-blue-500/15 text-blue-300 border-blue-500/30 shadow-[0_0_12px_rgba(59,130,246,0.15)]",
} as const;

export type BadgeColor = keyof typeof COLORS;

export function Badge({
  children,
  color = "slate",
}: {
  children: ReactNode;
  color?: BadgeColor;
}) {
  return (
    <span
      className={`px-2.5 py-0.5 rounded-md text-[11px] font-medium border tracking-wider uppercase font-mono-tech ${COLORS[color]}`}
    >
      {children}
    </span>
  );
}
