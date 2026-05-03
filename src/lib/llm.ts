import { ProxyAgent, fetch as undiciFetch } from "undici";

/**
 * Proxy-aware fetch wrapper.
 *
 * Reads HTTPS_PROXY / HTTP_PROXY from env at call time so changes during
 * dev (e.g. exporting a new proxy) take effect on the next request.
 */
function makeFetcher() {
  const proxyUrl =
    process.env.HTTPS_PROXY ||
    process.env.HTTP_PROXY ||
    process.env.https_proxy ||
    process.env.http_proxy;

  // No proxy → use Node's native fetch (faster, no extra deps in path)
  if (!proxyUrl) return globalThis.fetch as typeof fetch;

  // Corporate MITM proxies often re-sign TLS with an internal CA.
  // Opt-in to skip verification when INSECURE_PROXY_TLS=1 is set.
  const insecure =
    process.env.INSECURE_PROXY_TLS === "1" ||
    process.env.NODE_TLS_REJECT_UNAUTHORIZED === "0";

  const dispatcher = new ProxyAgent({
    uri: proxyUrl,
    ...(insecure
      ? {
          requestTls: { rejectUnauthorized: false },
          proxyTls: { rejectUnauthorized: false },
        }
      : {}),
  });
  return ((url: RequestInfo | URL, init?: RequestInit) =>
    undiciFetch(url as string, {
      ...(init as Parameters<typeof undiciFetch>[1]),
      dispatcher,
    })) as unknown as typeof fetch;
}

// ─── Gemini types (just what we need) ────────────────────────────────────────

export type GeminiPart =
  | { text: string }
  | { inline_data: { mime_type: string; data: string } }
  | { functionCall: { name: string; args: Record<string, unknown> } };

export interface GeminiContent {
  role?: "user" | "model";
  parts: GeminiPart[];
}

export interface GeminiSchema {
  type: "STRING" | "NUMBER" | "INTEGER" | "BOOLEAN" | "ARRAY" | "OBJECT";
  description?: string;
  enum?: string[];
  format?: string;
  pattern?: string;
  minimum?: number;
  maximum?: number;
  properties?: Record<string, GeminiSchema>;
  required?: string[];
  items?: GeminiSchema;
}

export interface GeminiTool {
  functionDeclarations: Array<{
    name: string;
    description: string;
    parameters: GeminiSchema;
  }>;
}

export interface GeminiRequest {
  contents: GeminiContent[];
  systemInstruction?: { parts: Array<{ text: string }> };
  tools?: GeminiTool[];
  toolConfig?: {
    functionCallingConfig: {
      mode: "AUTO" | "ANY" | "NONE";
      allowedFunctionNames?: string[];
    };
  };
  generationConfig?: {
    temperature?: number;
    maxOutputTokens?: number;
    responseMimeType?: string;
    thinkingConfig?: {
      thinkingBudget?: number;
      includeThoughts?: boolean;
    };
  };
}

export interface GeminiResponse {
  candidates?: Array<{
    content?: GeminiContent;
    finishReason?: string;
  }>;
  promptFeedback?: { blockReason?: string };
  error?: { code: number; message: string; status?: string };
}

// ─── Client ──────────────────────────────────────────────────────────────────

const DEFAULT_MODEL = "gemini-2.5-flash";
const BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";

export interface GeminiCallOptions {
  model?: string;
  signal?: AbortSignal;
}

export async function callGemini(
  body: GeminiRequest,
  opts: GeminiCallOptions = {}
): Promise<GeminiResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("缺少 GEMINI_API_KEY 环境变量");

  const model = opts.model ?? process.env.GEMINI_MODEL ?? DEFAULT_MODEL;
  const url = `${BASE_URL}/${model}:generateContent`;
  const fetcher = makeFetcher();

  const res = await fetcher(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-goog-api-key": apiKey,
    },
    body: JSON.stringify(body),
    signal: opts.signal,
  });

  const json = (await res.json()) as GeminiResponse;

  if (!res.ok || json.error) {
    const msg = json.error?.message ?? `Gemini API ${res.status}`;
    throw new Error(`Gemini 调用失败：${msg}`);
  }
  if (json.promptFeedback?.blockReason) {
    throw new Error(`内容被安全策略拦截：${json.promptFeedback.blockReason}`);
  }

  return json;
}

/** Pull the first functionCall block out of a Gemini response. */
export function extractFunctionCall(
  res: GeminiResponse
): { name: string; args: Record<string, unknown> } | null {
  const parts = res.candidates?.[0]?.content?.parts ?? [];
  for (const p of parts) {
    if ("functionCall" in p) return p.functionCall;
  }
  return null;
}

export function getFinishReason(res: GeminiResponse): string | undefined {
  return res.candidates?.[0]?.finishReason;
}

/** Concatenate plain text parts from the first candidate (JSON mode, errors). */
export function extractModelText(res: GeminiResponse): string {
  const parts = res.candidates?.[0]?.content?.parts ?? [];
  return parts
    .map((p) => ("text" in p ? p.text : ""))
    .filter(Boolean)
    .join("");
}
