import "server-only";

type GeminiErrorCause = {
  name?: string;
  message?: string;
  code?: string | number;
};

export type GeminiErrorInfo = {
  name?: string;
  message: string;
  status?: number;
  statusText?: string;
  code?: string | number;
  errorDetails?: unknown;
  cause?: GeminiErrorCause;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") return null;
  return value as Record<string, unknown>;
}

function toNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function toStringValue(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  return undefined;
}

function extractCause(error: Record<string, unknown>): GeminiErrorCause | undefined {
  const cause = asRecord(error.cause);
  if (!cause) return undefined;
  return {
    name: toStringValue(cause.name),
    message: toStringValue(cause.message),
    code: (cause.code as string | number | undefined) ?? undefined,
  };
}

export function describeGeminiError(error: unknown): GeminiErrorInfo {
  if (!(error instanceof Error)) {
    return { message: String(error) };
  }

  const record = asRecord(error) ?? {};
  const response = asRecord(record.response);
  const status =
    toNumber(record.status) ??
    toNumber(record.statusCode) ??
    toNumber(response?.status);
  const statusText =
    toStringValue(record.statusText) ?? toStringValue(response?.statusText);
  const errorDetails =
    record.errorDetails ?? response?.error ?? response?.data ?? undefined;
  const code =
    (record.code as string | number | undefined) ??
    (response?.code as string | number | undefined) ??
    undefined;

  return {
    name: error.name,
    message: error.message,
    status,
    statusText,
    code,
    errorDetails,
    cause: extractCause(record) ?? undefined,
  };
}

const RETRYABLE_STATUS = new Set([408, 429, 500, 502, 503, 504]);
const NON_RETRY_STATUS = new Set([400, 401, 403, 404, 422]);

export function isRetryableGeminiError(error: unknown): boolean {
  const info = describeGeminiError(error);

  if (info.status && NON_RETRY_STATUS.has(info.status)) {
    return false;
  }

  if (info.status && RETRYABLE_STATUS.has(info.status)) {
    return true;
  }

  const message = info.message.toLowerCase();
  const causeMessage = info.cause?.message?.toLowerCase() ?? "";
  const combined = `${message} ${causeMessage}`;

  if (
    combined.includes("fetch failed") ||
    combined.includes("timeout") ||
    combined.includes("rate limit") ||
    combined.includes("quota") ||
    combined.includes("overloaded") ||
    combined.includes("temporarily") ||
    combined.includes("econnreset") ||
    combined.includes("econnrefused") ||
    combined.includes("eai_again") ||
    combined.includes("enetunreach") ||
    combined.includes("socket hang up")
  ) {
    return true;
  }

  const code = info.code;
  if (typeof code === "string") {
    const normalized = code.toLowerCase();
    if (
      normalized.includes("timeout") ||
      normalized.includes("econnreset") ||
      normalized.includes("econnrefused") ||
      normalized.includes("eai_again")
    ) {
      return true;
    }
  }

  return false;
}
