"use client";

import { useRef, useState } from "react";
import { useLang } from "@/lib/LangContext";
import { WIZARD_STEPS } from "@/lib/wizard-options";

interface StepWizardProps {
  /** Current selections, keyed by step key (e.g. { style: "CeoIntro", color: "dark" }) */
  selections: Record<string, string>;
  onSelect: (stepKey: string, optionId: string | null) => void;
  /** Whether the wizard is expanded or collapsed */
  expanded?: boolean;
}

export function StepWizard({ selections, onSelect, expanded = true }: StepWizardProps) {
  const { lang } = useLang();

  return (
    <div className={`wizard-collapse-wrapper ${expanded ? "wizard-expanded" : "wizard-collapsed"}`}>
      <div className="wizard-container">
        {WIZARD_STEPS.map((step) => {
          const selected = selections[step.key] ?? null;
          const isStyleStep = step.key === "style";

          return (
            <div key={step.key} className="wizard-step">
              <div className="wizard-step-title">
                {lang === "zh" ? step.titleZh : step.titleEn}
              </div>

              {isStyleStep ? (
                <StyleCarousel
                  options={step.options}
                  selected={selected}
                  onSelect={(id) => onSelect(step.key, id)}
                  lang={lang}
                />
              ) : (
                /* Standard pill buttons for color/ratio steps */
                <div className="wizard-options">
                  <button
                    className={`wizard-option ${selected === null ? "wizard-option-active" : ""}`}
                    onClick={() => onSelect(step.key, null)}
                  >
                    <span className="wizard-option-icon">—</span>
                    <span className="wizard-option-label">
                      {lang === "zh" ? "不限" : "Any"}
                    </span>
                  </button>
                  {step.options.map((opt) => (
                    <button
                      key={opt.id}
                      className={`wizard-option ${selected === opt.id ? "wizard-option-active" : ""}`}
                      onClick={() => onSelect(step.key, opt.id)}
                    >
                      {opt.icon && <span className="wizard-option-icon">{opt.icon}</span>}
                      <span className="wizard-option-label">
                        {lang === "zh" ? opt.labelZh : opt.labelEn}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Carousel showing 4 style cards at a time with left/right arrows */
function StyleCarousel({
  options,
  selected,
  onSelect,
  lang,
}: {
  options: typeof WIZARD_STEPS[0]["options"];
  selected: string | null;
  onSelect: (id: string | null) => void;
  lang: string;
}) {
  // Include "AI auto" as first item → total = options.length + 1
  const totalItems = options.length + 1;
  const visibleCount = 4;
  const maxOffset = Math.max(0, totalItems - visibleCount);
  const [offset, setOffset] = useState(0);

  const canPrev = offset > 0;
  const canNext = offset < maxOffset;

  const allItems = [
    { id: null as string | null, isAuto: true },
    ...options.map((o) => ({ id: o.id as string | null, isAuto: false, opt: o })),
  ];

  const visibleItems = allItems.slice(offset, offset + visibleCount);

  return (
    <div className="wizard-carousel">
      {/* Left arrow */}
      <button
        className="wizard-carousel-arrow wizard-carousel-arrow-left"
        onClick={() => setOffset((v) => Math.max(0, v - 1))}
        disabled={!canPrev}
        aria-label="Previous"
      >
        ‹
      </button>

      {/* Cards */}
      <div className="wizard-carousel-track">
        {visibleItems.map((item) => {
          if (item.isAuto) {
            return (
              <button
                key="__auto__"
                className={`wizard-style-card ${selected === null ? "wizard-style-card-active" : ""}`}
                onClick={() => onSelect(null)}
              >
                <div className="wizard-style-card-preview wizard-style-card-any">
                  <span className="wizard-style-card-any-icon">✨</span>
                  <span className="wizard-style-card-any-text">
                    {lang === "zh" ? "AI 自动选择" : "AI Auto"}
                  </span>
                </div>
                <div className="wizard-style-card-info">
                  <div className="wizard-style-card-label">
                    {lang === "zh" ? "不限风格" : "Any Style"}
                  </div>
                </div>
              </button>
            );
          }
          const opt = (item as { opt: typeof options[0] }).opt;
          return (
            <button
              key={opt.id}
              className={`wizard-style-card ${selected === opt.id ? "wizard-style-card-active" : ""}`}
              onClick={() => onSelect(opt.id)}
            >
              <div className="wizard-style-card-preview">
                {opt.preview ? (
                  <img
                    src={opt.preview}
                    alt={lang === "zh" ? opt.labelZh : opt.labelEn}
                    className="wizard-style-card-img"
                    draggable={false}
                  />
                ) : (
                  <span className="wizard-style-card-emoji">{opt.icon}</span>
                )}
              </div>
              <div className="wizard-style-card-info">
                <div className="wizard-style-card-label">
                  {opt.icon} {lang === "zh" ? opt.labelZh : opt.labelEn}
                </div>
                {(opt.descZh || opt.descEn) && (
                  <div className="wizard-style-card-desc">
                    {lang === "zh" ? opt.descZh : opt.descEn}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Right arrow */}
      <button
        className="wizard-carousel-arrow wizard-carousel-arrow-right"
        onClick={() => setOffset((v) => Math.min(maxOffset, v + 1))}
        disabled={!canNext}
        aria-label="Next"
      >
        ›
      </button>
    </div>
  );
}
