"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { compressImage } from "@/lib/image";
import { PipelineState } from "@/lib/usePipeline";

interface InputCardProps {
  state: PipelineState;
  onSubmit: (input: { problemText: string; imageBase64?: string }) => void;
  onCancel: () => void;
}

export function InputCard({ state, onSubmit, onCancel }: InputCardProps) {
  const [text, setText] = useState("");
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleFile = useCallback(async (file: File) => {
    try {
      const { base64, dataUrl } = await compressImage(file);
      setImagePreview(dataUrl);
      setImageBase64(base64);
    } catch (err) {
      console.error("[image]", err);
    }
  }, []);

  const onDrop = useCallback(
    (files: File[]) => {
      const file = files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    multiple: false,
  });

  const handlePaste = (e: React.ClipboardEvent) => {
    const item = Array.from(e.clipboardData.items).find((i) =>
      i.type.startsWith("image/")
    );
    const file = item?.getAsFile();
    if (file) handleFile(file);
  };

  const busy = state === "analyzing" || state === "generating";
  const canSubmit = (!!text.trim() || !!imageBase64) && !busy;

  const clearImage = () => {
    setImagePreview(null);
    setImageBase64(null);
  };

  const submit = () => {
    if (!canSubmit) return;
    onSubmit({ problemText: text, imageBase64: imageBase64 ?? undefined });
  };

  return (
    <div
      className="glow-border rounded-2xl p-6 flex flex-col gap-4"
      onPaste={handlePaste}
    >
      <div className="flex items-center justify-between">
        <span className="section-label text-cyan-300">Problem Input</span>
        <span className="text-[10px] text-slate-500 font-mono-tech uppercase tracking-widest">
          {imageBase64 ? "image + text" : text ? "text" : "empty"}
        </span>
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="粘贴题目文字 · Ctrl+V 粘贴截图 · 或拖拽图片至下方"
        rows={4}
        className="scan-on-focus bg-slate-950/60 border border-cyan-500/15 rounded-xl p-3.5 text-slate-100 placeholder-slate-600 resize-none focus:outline-none transition-all text-base leading-relaxed font-mono-tech text-[15px]"
      />

      <div
        {...getRootProps()}
        className={`relative border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all overflow-hidden ${
          isDragActive
            ? "border-cyan-400 bg-cyan-500/10 shadow-[0_0_24px_rgba(34,211,238,0.3)]"
            : "border-cyan-500/15 hover:border-cyan-500/40 hover:bg-cyan-500/5"
        }`}
      >
        <input {...getInputProps()} />
        {imagePreview ? (
          <div className="relative">
            <img
              src={imagePreview}
              alt="题目截图"
              className="max-h-44 mx-auto object-contain rounded-lg border border-cyan-500/15"
            />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                clearImage();
              }}
              className="absolute -top-2 -right-2 bg-rose-600 hover:bg-rose-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shadow-lg shadow-rose-500/30"
              aria-label="移除图片"
            >
              ✕
            </button>
          </div>
        ) : (
          <div className="text-slate-400 text-sm py-3 select-none">
            <div className="text-2xl mb-1 opacity-70">⬡</div>
            <div className="font-medium">拖拽截图到此处 / 点击上传</div>
            <div className="text-[10px] text-slate-600 mt-1 font-mono-tech tracking-widest uppercase">
              JPG · PNG · GIF · WebP — auto compress
            </div>
          </div>
        )}
      </div>

      {busy ? (
        <button
          type="button"
          onClick={onCancel}
          className="w-full py-3 rounded-xl border border-cyan-500/30 bg-cyan-500/5 hover:bg-cyan-500/10 text-cyan-200 font-medium font-mono-tech tracking-wider uppercase text-sm transition-all flex items-center justify-center gap-3"
        >
          <SpinnerDot />
          {state === "analyzing"
            ? "Teacher Agent · 分析中"
            : "Video Agent · 生成脚本"}
          <span className="text-cyan-500">click to abort</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={submit}
          disabled={!canSubmit}
          className="relative group w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-500 to-fuchsia-500 disabled:from-slate-700 disabled:via-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed font-bold text-white tracking-wider uppercase text-sm shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 transition-all overflow-hidden"
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            <span>⚡</span> 生成解题视频
          </span>
          {/* shimmer */}
          <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        </button>
      )}
    </div>
  );
}

function SpinnerDot() {
  return (
    <span className="relative inline-flex w-3 h-3">
      <span className="absolute inset-0 rounded-full bg-cyan-400 animate-ping opacity-60" />
      <span className="relative w-3 h-3 rounded-full bg-cyan-400" />
    </span>
  );
}
