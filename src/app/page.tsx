"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useChatStore } from "@/lib/useChatStore";
import { LangProvider, useLang } from "@/lib/LangContext";
import { ChatSidebar } from "@/components/ChatSidebar";
import { ChatMessageItem } from "@/components/ChatMessageItem";
import { ChatInput } from "@/components/ChatInput";
import { StepWizard } from "@/components/StepWizard";
import { WIZARD_STEPS, RATIO_DIMENSIONS, COLOR_SCHEMES } from "@/lib/wizard-options";

export default function Home() {
  return (
    <LangProvider>
      <AppShell />
    </LangProvider>
  );
}

type Provider = "gemini" | "deepseek";

function AppShell() {
  const { lang, setLang, t, tArr } = useLang();
  const store = useChatStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [usage, setUsage] = useState<{ used: number; limit: number }>({ used: 0, limit: 4 });
  // Wizard selections: { style?: string, color?: string, ratio?: string }
  const [selections, setSelections] = useState<Record<string, string>>({});
  // Wizard expanded/collapsed state
  const [wizardExpanded, setWizardExpanded] = useState(true);
  const hasAutoCollapsed = useRef(false);
  // LLM provider selection
  const [provider, setProvider] = useState<Provider>("gemini");
  // Uploaded reference image — kept at AppShell so it can be shown in the
  // wizard area (next to style/color/ratio boxes) instead of inside ChatInput.
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleImageChange = useCallback(
    (base64: string | null, preview: string | null) => {
      setImageBase64(base64);
      setImagePreview(preview);
    },
    []
  );

  useEffect(() => {
    fetch("/api/usage")
      .then((r) => r.json())
      .then(setUsage)
      .catch(() => { });
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [store.activeSession?.messages, scrollToBottom]);

  // Auto-collapse wizard after first message is sent
  useEffect(() => {
    const msgs = store.activeSession?.messages ?? [];
    if (msgs.length > 0 && !hasAutoCollapsed.current) {
      hasAutoCollapsed.current = true;
      setWizardExpanded(false);
    }
    if (msgs.length === 0) {
      hasAutoCollapsed.current = false;
      setWizardExpanded(true);
    }
  }, [store.activeSession?.messages]);

  const handleSelect = useCallback((stepKey: string, optionId: string | null) => {
    setSelections((prev) => {
      const next = { ...prev };
      if (optionId === null) {
        delete next[stepKey];
      } else {
        next[stepKey] = optionId;
      }
      return next;
    });
    // Auto-collapse wizard after selection if conversation has messages
    const msgs = store.activeSession?.messages ?? [];
    if (msgs.length > 0) {
      setWizardExpanded(false);
    }
  }, [store.activeSession?.messages]);

  const handleRemoveSelection = useCallback((stepKey: string) => {
    setSelections((prev) => {
      const next = { ...prev };
      delete next[stepKey];
      return next;
    });
  }, []);

  const handleSend = useCallback(
    async (input: { text: string; imageBase64?: string }) => {
      // 图片以提升后的 state 为准（也兼容 ChatInput 传过来的 input.imageBase64）
      const effectiveImage = input.imageBase64 ?? imageBase64 ?? undefined;
      let sessionId = store.activeId;
      if (!sessionId) {
        sessionId = store.createSession();
      }

      // Build display text with selections in parentheses
      const selectionLabels: string[] = [];
      for (const step of WIZARD_STEPS) {
        const val = selections[step.key];
        if (val) {
          const opt = step.options.find((o) => o.id === val);
          if (opt) {
            selectionLabels.push(`${lang === "zh" ? step.titleZh : step.titleEn}: ${opt.icon ?? ""}${lang === "zh" ? opt.labelZh : opt.labelEn}`);
          }
        }
      }
      const displayText = selectionLabels.length > 0
        ? `${input.text}\n（${selectionLabels.join(" / ")}）`
        : input.text;

      store.addMessage(sessionId, {
        role: "user",
        content: displayText,
        imageBase64: effectiveImage,
      });

      const assistantId = store.addMessage(sessionId, {
        role: "assistant",
        content: t("stepGenerating"),
        loading: true,
      });

      try {
        const templateId = selections.style || undefined;
        const colorScheme = selections.color ? COLOR_SCHEMES[selections.color] : undefined;
        const ratio = selections.ratio || "16:9";
        const dims = RATIO_DIMENSIONS[ratio] ?? RATIO_DIMENSIONS["16:9"];

        // 如果用户上传了图片且模板是人像类，先做去背景处理
        let portraitDataUrl: string | undefined;
        const portraitTemplates = new Set(["JensenHuangCeoIntro"]);
        const willUsePortrait =
          effectiveImage &&
          (templateId === undefined || portraitTemplates.has(templateId));
        if (willUsePortrait && effectiveImage) {
          try {
            store.updateMessage(sessionId, assistantId, {
              content: t("processingPortrait"),
            });
            const pr = await fetch("/api/process-portrait", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ image: effectiveImage }),
            });
            const pj = await pr.json();
            if (pr.ok && pj.dataUrl) {
              portraitDataUrl = pj.dataUrl as string;
            } else {
              console.warn("[portrait] 处理失败，使用原图:", pj.error);
            }
          } catch (e) {
            console.warn("[portrait] 异常：", e);
          }
        }

        const res = await fetch("/api/generate-video", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: input.text,
            templateId,
            colorScheme,
            dimensions: dims,
            provider,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? t("stepGenerating"));

        // 注入处理后的人像 URL 到模板 props
        const finalProps = { ...(data.templateProps ?? {}) };
        if (portraitDataUrl) {
          // 单一品牌模板：直接挂在顶层
          if (portraitTemplates.has(data.templateId)) {
            finalProps.portraitUrl = portraitDataUrl;
          }
          // 复合视频：人像要挂在 introProps 里（被作为片头的品牌模板 props）
          if (
            data.templateId === "CompositeVideo" &&
            typeof finalProps.introTemplateId === "string" &&
            portraitTemplates.has(finalProps.introTemplateId)
          ) {
            finalProps.introProps = {
              ...((finalProps.introProps as Record<string, unknown>) ?? {}),
              portraitUrl: portraitDataUrl,
            };
          }
        }
        // 强制覆盖配色：用户在向导里选的色系优先级最高（高于 LLM 推荐）
        if (colorScheme) {
          finalProps.accentColor = colorScheme.accent;
          finalProps.backgroundColor = colorScheme.background;
          // CompositeVideo 还要把 introProps 里的配色一起同步
          if (data.templateId === "CompositeVideo" && finalProps.introProps) {
            finalProps.introProps = {
              ...(finalProps.introProps as Record<string, unknown>),
              accentColor: colorScheme.accent,
              backgroundColor: colorScheme.background,
            };
          }
        }
        console.log("[generate-video] templateId:", data.templateId,
          "| introTemplate:", finalProps.introTemplateId,
          "| portraitDataUrl:", Boolean(portraitDataUrl),
          "| colorScheme:", colorScheme,
          "| finalProps colors:", finalProps.accentColor, finalProps.backgroundColor);

        store.updateMessage(sessionId, assistantId, {
          content: t("videoLabel"),
          templateId: data.templateId,
          templateProps: finalProps,
          durationFrames: data.durationFrames,
          fps: data.fps,
          width: data.width ?? dims.width,
          height: data.height ?? dims.height,
          autoUpgradedFrom: data.composedFrom ?? data.autoUpgradedFrom,
          loading: false,
        });

        setUsage((prev) => ({ ...prev, used: prev.used + 1 }));
        // 发送成功后清空 reference image
        setImageBase64(null);
        setImagePreview(null);
      } catch (err) {
        store.updateMessage(sessionId, assistantId, {
          content: "",
          error: err instanceof Error ? err.message : t("stepGenerating"),
          loading: false,
        });
      }
    },
    [store, t, selections, provider, imageBase64]
  );

  if (!store.loaded) {
    return (
      <div className="h-screen flex items-center justify-center text-[var(--text-muted)]">
        {t("loadingApp")}
      </div>
    );
  }

  const messages = store.activeSession?.messages ?? [];
  const isGenerating = messages.some((m) => m.loading);

  return (
    <div className="flex h-screen">
      <ChatSidebar
        sessions={store.sessions}
        activeId={store.activeId}
        onNew={store.createSession}
        onSwitch={store.switchSession}
        onDelete={store.deleteSession}
      />

      <div className="chat-container flex-1">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <img
              src="/logo.png"
              alt="Logo"
              className="h-7 w-auto object-contain"
            />
            <span className="text-base font-semibold text-[var(--text-primary)]">
              {t("appName")}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {/* Provider toggle */}
            <div className="provider-toggle" title={t("providerLabel")}>
              <button
                className={`provider-btn${provider === "gemini" ? " active" : ""}`}
                onClick={() => setProvider("gemini")}
              >
                <span className="provider-dot gemini-dot" />
                {t("providerGemini")}
              </button>
              <button
                className={`provider-btn${provider === "deepseek" ? " active" : ""}`}
                onClick={() => setProvider("deepseek")}
              >
                <span className="provider-dot deepseek-dot" />
                {t("providerDeepSeek")}
              </button>
            </div>
            <button
              onClick={() => setLang(lang === "zh" ? "en" : "zh")}
              className="lang-toggle"
              title="切换语言 / Switch language"
            >
              {lang === "zh" ? "EN" : "中文"}
            </button>
            <span className="usage-badge">
              {t("headerToday")} {usage.used}/{usage.limit}
            </span>
          </div>
        </div>

        {/* Messages */}
        <div className="chat-messages">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <img
                src="/logo.png"
                alt="Logo"
                className="h-14 w-auto object-contain mb-4 opacity-85"
              />
              <h2 className="text-xl font-semibold mb-1">
                {t("emptyHeading")}
                <span className="ml-2 px-2 py-0.5 text-xs font-medium rounded-full bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/30">Demo</span>
              </h2>
              <p className="text-[var(--text-muted)] text-sm max-w-md leading-relaxed mb-6">
                {t("emptySubtext")}
              </p>
            </div>
          )}

          {messages.map((msg) => (
            <ChatMessageItem
              key={msg.id}
              message={msg}
              onRefine={(feedback) => handleSend({ text: feedback })}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Step Wizard */}
        <StepWizard selections={selections} onSelect={handleSelect} expanded={wizardExpanded} />

        {/* Input */}
        <ChatInput
          onSend={handleSend}
          disabled={isGenerating || usage.used >= usage.limit}
          disabledReason={
            usage.used >= usage.limit
              ? t("limitReached")
              : isGenerating
                ? t("stepGenerating")
                : undefined
          }
          selections={selections}
          onRemoveSelection={handleRemoveSelection}
          wizardExpanded={wizardExpanded}
          onToggleWizard={() => setWizardExpanded((v) => !v)}
          imageBase64={imageBase64}
          imagePreview={imagePreview}
          onImageChange={handleImageChange}
        />
      </div>
    </div>
  );
}
