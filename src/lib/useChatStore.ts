"use client";

import { useCallback, useEffect, useState } from "react";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  imageBase64?: string;
  templateId?: string;
  templateProps?: Record<string, unknown>;
  durationFrames?: number;
  fps?: number;
  width?: number;
  height?: number;
  /** 服务端将单屏品牌模板自动升级为 Freeform 多场景时，原本所选模板 ID。 */
  autoUpgradedFrom?: string;
  error?: string;
  loading?: boolean;
  timestamp: number;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = "physiq-chat-sessions";
const MAX_SESSIONS = 30;
const MAX_MESSAGES_PER_SESSION = 40;

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/**
 * 持久化前剥掉 message 里大体积的 base64 / dataURL 字段：
 * - imageBase64：用户上传的原图（用于在 user bubble 里显示缩略图，刷新后丢失可接受）
 * - templateProps.portraitUrl：处理后的透明 PNG dataURL（可达 500KB+）
 * - templateProps.introProps.portraitUrl：复合视频中的人像 dataURL
 *
 * 不剥这些字段 localStorage 会很快爆掉（QuotaExceededError）。
 */
function isLargeDataString(v: unknown): boolean {
  return typeof v === "string" && v.length > 4096 && (v.startsWith("data:") || /^[A-Za-z0-9+/=]{4096,}$/.test(v));
}

function stripHeavyFields(msg: ChatMessage): ChatMessage {
  const cleaned: ChatMessage = { ...msg };
  if (cleaned.imageBase64 && cleaned.imageBase64.length > 4096) {
    delete cleaned.imageBase64;
  }
  if (cleaned.templateProps) {
    const tp = { ...cleaned.templateProps } as Record<string, unknown>;
    if (isLargeDataString(tp.portraitUrl)) delete tp.portraitUrl;
    const intro = tp.introProps as Record<string, unknown> | undefined;
    if (intro && isLargeDataString(intro.portraitUrl)) {
      tp.introProps = { ...intro };
      delete (tp.introProps as Record<string, unknown>).portraitUrl;
    }
    cleaned.templateProps = tp;
  }
  return cleaned;
}

function loadSessions(): ChatSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveSessions(sessions: ChatSession[]) {
  if (typeof window === "undefined") return;
  // 限制会话数 + 每个会话最多 N 条消息 + 剥掉大字段
  const trimmedSessions = sessions.slice(0, MAX_SESSIONS).map((s) => ({
    ...s,
    messages: s.messages
      .slice(-MAX_MESSAGES_PER_SESSION)
      .map(stripHeavyFields),
  }));
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmedSessions));
  } catch (err) {
    console.warn("[useChatStore] localStorage 写入失败（可能超配额），尝试清空旧会话:", err);
    // 降级策略：只保留最近 5 个会话再试一次
    try {
      const minimal = trimmedSessions.slice(0, 5).map((s) => ({
        ...s,
        messages: s.messages.slice(-10).map(stripHeavyFields),
      }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(minimal));
    } catch (err2) {
      console.warn("[useChatStore] 降级保存仍失败，本次跳过持久化:", err2);
    }
  }
}

export function useChatStore() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const s = loadSessions();
    setSessions(s);
    if (s.length > 0) {
      setActiveId(s[0].id);
    }
    setLoaded(true);
  }, []);

  // Persist on change
  useEffect(() => {
    if (loaded) {
      saveSessions(sessions);
    }
  }, [sessions, loaded]);

  const activeSession = sessions.find((s) => s.id === activeId) ?? null;

  const createSession = useCallback(() => {
    const newSession: ChatSession = {
      id: generateId(),
      title: "新对话",
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setSessions((prev) => [newSession, ...prev]);
    setActiveId(newSession.id);
    return newSession.id;
  }, []);

  const switchSession = useCallback((id: string) => {
    setActiveId(id);
  }, []);

  const deleteSession = useCallback(
    (id: string) => {
      setSessions((prev) => {
        const filtered = prev.filter((s) => s.id !== id);
        if (activeId === id) {
          setActiveId(filtered.length > 0 ? filtered[0].id : null);
        }
        return filtered;
      });
    },
    [activeId]
  );

  const addMessage = useCallback(
    (sessionId: string, msg: Omit<ChatMessage, "id" | "timestamp">) => {
      const message: ChatMessage = {
        ...msg,
        id: generateId(),
        timestamp: Date.now(),
      };
      setSessions((prev) =>
        prev.map((s) => {
          if (s.id !== sessionId) return s;
          const messages = [...s.messages, message];
          // Auto-title from first user message
          const title =
            s.messages.length === 0 && msg.role === "user"
              ? msg.content.slice(0, 30) || "图片题目"
              : s.title;
          return { ...s, messages, title, updatedAt: Date.now() };
        })
      );
      return message.id;
    },
    []
  );

  const updateMessage = useCallback(
    (sessionId: string, messageId: string, updates: Partial<ChatMessage>) => {
      setSessions((prev) =>
        prev.map((s) => {
          if (s.id !== sessionId) return s;
          const messages = s.messages.map((m) =>
            m.id === messageId ? { ...m, ...updates } : m
          );
          return { ...s, messages, updatedAt: Date.now() };
        })
      );
    },
    []
  );

  return {
    sessions,
    activeSession,
    activeId,
    loaded,
    createSession,
    switchSession,
    deleteSession,
    addMessage,
    updateMessage,
  };
}
