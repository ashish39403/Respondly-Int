"use client";

export type EmailKind = "unknown" | "password" | "google" | "both" | "unavailable";
export type SaveResult = "saved" | "failed" | "signed-out";

let apiSessionGeneration = 0;

export function endApiSession(): void {
  apiSessionGeneration += 1;
}

export function apiOrigin(): string {
  return process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
}

export async function emailKind(email: string): Promise<EmailKind> {
  try {
    const response = await fetch(`${apiOrigin()}/identity/email-status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (!response.ok) return "unavailable";
    const body = (await response.json()) as { kind?: string };
    if (
      body.kind === "password" ||
      body.kind === "google" ||
      body.kind === "both" ||
      body.kind === "unknown"
    ) {
      return body.kind;
    }
    return "unavailable";
  } catch {
    return "unavailable";
  }
}

export async function refuseSecondSignInMethod(): Promise<boolean> {
  const generation = apiSessionGeneration;
  const token = await currentToken(generation);
  if (!token) return false;
  try {
    const response = await fetch(`${apiOrigin()}/identity/second-method`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (generation !== apiSessionGeneration) return false;
    if (!response.ok) return false;
    const body = (await response.json()) as { refused?: boolean };
    return body.refused === true;
  } catch {
    return false;
  }
}

export async function saveAccount(): Promise<SaveResult> {
  const generation = apiSessionGeneration;
  const token = await currentToken(generation);
  if (generation !== apiSessionGeneration) return "signed-out";
  if (!token) return "failed";
  try {
    const response = await fetch(`${apiOrigin()}/accounts`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (generation !== apiSessionGeneration) return "signed-out";
    return response.ok ? "saved" : "failed";
  } catch {
    return generation === apiSessionGeneration ? "failed" : "signed-out";
  }
}

async function currentToken(generation: number): Promise<string | null> {
  if (generation !== apiSessionGeneration) return null;
  // The installed client classifies every URL containing "/token" as getSession
  // and can answer authClient.token() with the cached session, which has no JWT.
  const response = await fetch("/api/auth/token", { credentials: "include" });
  if (generation !== apiSessionGeneration || !response.ok) return null;
  const body = (await response.json()) as { token?: string; data?: { token?: string } };
  return body.token ?? body.data?.token ?? null;
}

export function sessionUser(data: unknown): { name?: string; email?: string } | null {
  if (!data || typeof data !== "object") return null;
  const record = data as { user?: unknown; session?: { user?: unknown } };
  const user = record.user ?? record.session?.user;
  if (!user || typeof user !== "object") return null;
  return user as { name?: string; email?: string };
}
