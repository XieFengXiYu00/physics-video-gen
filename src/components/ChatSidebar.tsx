"use client";

import { ChatSession } from "@/lib/useChatStore";
import { useLang } from "@/lib/LangContext";

interface ChatSidebarProps {
  sessions: ChatSession[];
  activeId: string | null;
  onNew: () => void;
  onSwitch: (id: string) => void;
  onDelete: (id: string) => void;
}

export function ChatSidebar({
  sessions,
  activeId,
  onNew,
  onSwitch,
  onDelete,
}: ChatSidebarProps) {
  const { t } = useLang();

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        {/* Logo */}
        <div className="sidebar-logo">
          <img src="/logo.png" alt="Logo" className="sidebar-logo-img" />
        </div>
        <button className="sidebar-new-btn" onClick={onNew}>
          {t("newChat")}
        </button>
      </div>
      <div className="sidebar-list">
        {sessions.map((session) => (
          <div
            key={session.id}
            className={`sidebar-item group ${session.id === activeId ? "active" : ""}`}
            onClick={() => onSwitch(session.id)}
          >
            <div className="flex items-center justify-between">
              <span className="truncate flex-1">{session.title}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(session.id);
                }}
                className="ml-2 opacity-0 group-hover:opacity-100 text-[var(--text-muted)] hover:text-red-500 text-xs"
                title="删除"
              >
                ×
              </button>
            </div>
          </div>
        ))}
        {sessions.length === 0 && (
          <div className="px-3 py-6 text-center text-xs text-[var(--text-muted)]">
            {t("noHistory")}
          </div>
        )}
      </div>
      <div className="p-4 border-t border-[var(--border)] text-xs text-[var(--text-muted)]">
        {t("localSaved")}
      </div>
    </div>
  );
}
