"use client";

import { useCallback, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { compressImage } from "@/lib/image";
import { useLang } from "@/lib/LangContext";
import { WIZARD_STEPS } from "@/lib/wizard-options";

export interface SelectionTag {
  stepKey: string;
  optionId: string;
}

interface ChatInputProps {
  onSend: (input: { text: string; imageBase64?: string }) => void;
  disabled?: boolean;
  disabledReason?: string;
  /** Currently selected wizard options */
  selections?: Record<string, string>;
  /** Called when user removes a selection tag */
  onRemoveSelection?: (stepKey: string) => void;
  /** Whether the wizard panel is currently expanded */
  wizardExpanded?: boolean;
  /** Toggle wizard expand/collapse */
  onToggleWizard?: () => void;
  /** Lifted image state — thumbnail rendered inside the input box */
  imageBase64?: string | null;
  imagePreview?: string | null;
  onImageChange?: (base64: string | null, preview: string | null) => void;
}

export function ChatInput({ onSend, disabled, disabledReason, selections, onRemoveSelection, wizardExpanded, onToggleWizard, imageBase64, imagePreview, onImageChange }: ChatInputProps) {
  const { lang, t } = useLang();
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Build display tags from selections
  const tags: { stepKey: string; label: string }[] = [];
  if (selections) {
    for (const step of WIZARD_STEPS) {
      const val = selections[step.key];
      if (val) {
        const opt = step.options.find((o) => o.id === val);
        if (opt) {
          tags.push({
            stepKey: step.key,
            label: `${opt.icon ?? ""} ${lang === "zh" ? opt.labelZh : opt.labelEn}`.trim(),
          });
        }
      }
    }
  }

  const handleFile = useCallback(async (file: File) => {
    try {
      const { base64, dataUrl } = await compressImage(file);
      onImageChange?.(base64, dataUrl);
    } catch (err) {
      console.error("[image]", err);
    }
  }, [onImageChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (files) => { if (files[0]) handleFile(files[0]); },
    accept: { "image/*": [] },
    multiple: false,
    noClick: true,
    noKeyboard: true,
  });

  const handlePaste = (e: React.ClipboardEvent) => {
    const item = Array.from(e.clipboardData.items).find((i) =>
      i.type.startsWith("image/")
    );
    const file = item?.getAsFile();
    if (file) handleFile(file);
  };

  const submit = () => {
    if (disabled) return;
    const trimmed = text.trim();
    if (!trimmed && !imageBase64) return;
    onSend({ text: trimmed, imageBase64: imageBase64 ?? undefined });
    setText("");
    // 图片清空由 parent (AppShell) 在发送成功后处理
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  };

  return (
    <div className="chat-input-area" {...getRootProps()} onPaste={handlePaste}>
      <div className="chat-input-row">
        {/* Wizard toggle button - always visible, toggles expand/collapse */}
        {onToggleWizard && (
          <button
            type="button"
            className={`wizard-toggle-btn ${wizardExpanded ? "wizard-toggle-btn-active" : ""}`}
            onClick={onToggleWizard}
            title={lang === "zh" ? (wizardExpanded ? "收起风格选择" : "展开风格选择") : (wizardExpanded ? "Collapse options" : "Expand options")}
          >
            <span className="wizard-toggle-icon">🎨</span>
          </button>
        )}

        <div className="chat-input-wrapper">
          <input {...getInputProps()} />

          {/* Reference image thumbnail + selection tags INSIDE the input box */}
          {(tags.length > 0 || imagePreview) && (
            <div className="chat-input-tags">
              {imagePreview && (
                <span className="chat-input-image-chip" title={t("referenceImage")}>
                  <img
                    src={imagePreview}
                    alt="reference"
                    className="chat-input-image-chip-img"
                    draggable={false}
                  />
                  <button
                    type="button"
                    className="chat-input-image-chip-remove"
                    onClick={() => onImageChange?.(null, null)}
                    aria-label="remove image"
                    title={t("removeImage")}
                  >
                    ×
                  </button>
                </span>
              )}
              {tags.map((tag) => (
                <span key={tag.stepKey} className="selection-tag">
                  {tag.label}
                  <button
                    className="selection-tag-remove"
                    onClick={() => onRemoveSelection?.(tag.stepKey)}
                    aria-label="remove"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder={
              disabled
                ? (disabledReason ?? t("inputPlaceholderDisabled"))
                : t("inputPlaceholder")
            }
            rows={1}
            disabled={disabled}
            style={{ height: "auto" }}
          />
          <div className="absolute left-3 bottom-2 flex gap-1">
            <button
              type="button"
              onClick={() => {
                const input = document.createElement("input");
                input.type = "file";
                input.accept = "image/*";
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file) handleFile(file);
                };
                input.click();
              }}
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-lg p-1"
              title={t("uploadImage")}
            >
              +
            </button>
          </div>
          <button
            type="button"
            className="chat-send-btn"
            onClick={submit}
            disabled={disabled || (!text.trim() && !imageBase64)}
          >
            ↑
          </button>
        </div>
      </div>

      {isDragActive && (
        <div className="absolute inset-0 bg-white/90 flex items-center justify-center rounded-2xl border-2 border-dashed border-[var(--accent)] z-10">
          <span className="text-[var(--accent)] font-medium">{t("dragDropHint")}</span>
        </div>
      )}
    </div>
  );
}
