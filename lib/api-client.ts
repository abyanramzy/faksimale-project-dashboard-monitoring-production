/**
 * Thin fetch wrapper around the internal /api/* routes.
 *
 * - Always returns the unwrapped ApiEnvelope.data
 * - Surfaces a readable Error with server-provided message when the server
 *   replies with an error envelope (shape: { error: { message } })
 * - Uses AbortSignal for cancellation (e.g. unmount)
 */

import type { ApiEnvelope } from "./types";

type ErrorEnvelope = { error?: { message?: string; details?: unknown } };

async function parseBody(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

async function request<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const body = (await parseBody(res)) as
    | ApiEnvelope<T>
    | (ErrorEnvelope & Partial<ApiEnvelope<T>>)
    | null;

  if (!res.ok) {
    const message =
      (body && "error" in body && body.error?.message) ||
      `Request failed: ${res.status} ${res.statusText}`;
    throw new Error(message);
  }

  if (body && typeof body === "object" && "data" in body) {
    return (body as ApiEnvelope<T>).data;
  }

  return body as T;
}

export const apiClient = {
  get<T>(path: string, signal?: AbortSignal): Promise<T> {
    return request<T>(path, { method: "GET", signal });
  },

  post<T>(path: string, body?: unknown, signal?: AbortSignal): Promise<T> {
    return request<T>(path, {
      method: "POST",
      signal,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  },
};
