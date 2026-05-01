"use client";

import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { InputCard } from "@/components/InputCard";
import { PlanSummary } from "@/components/PlanSummary";
import { VideoPanel } from "@/components/VideoPanel";
import { usePipeline } from "@/lib/usePipeline";

export default function Home() {
  const { state, plan, sceneConfig, error, run, cancel } = usePipeline();
  const hasResult = !!sceneConfig;

  return (
    <div className="min-h-screen text-white relative">
      <Header />

      <main className="max-w-screen-xl mx-auto px-8 py-8">
        <div className={hasResult ? "grid grid-cols-5 gap-6" : "max-w-2xl mx-auto"}>
          <div
            className={
              hasResult ? "col-span-2 flex flex-col gap-5" : "flex flex-col gap-6"
            }
          >
            {!hasResult && <Hero />}

            <InputCard state={state} onSubmit={run} onCancel={cancel} />

            {error && <ErrorBox message={error} />}

            {plan && <PlanSummary plan={plan} />}
          </div>

          {sceneConfig && (
            <div className="col-span-3">
              <VideoPanel sceneConfig={sceneConfig} />
            </div>
          )}
        </div>

        <Footer />
      </main>
    </div>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="border border-rose-500/40 bg-rose-500/10 rounded-xl p-3 text-rose-200 text-sm shadow-[0_0_24px_rgba(244,63,94,0.15)]">
      <div className="flex items-start gap-2">
        <span className="text-rose-400 font-mono-tech text-xs uppercase tracking-widest mt-0.5">
          ERR
        </span>
        <span className="flex-1">{message}</span>
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="mt-16 text-center text-[10px] text-slate-600 font-mono-tech tracking-widest uppercase">
      <div className="inline-flex items-center gap-3 px-3 py-1.5 rounded-full border border-slate-800 bg-slate-950/40">
        <span className="w-1 h-1 rounded-full bg-cyan-500" />
        Built with Next.js · Remotion · Gemini
        <span className="w-1 h-1 rounded-full bg-fuchsia-500" />
      </div>
    </footer>
  );
}
