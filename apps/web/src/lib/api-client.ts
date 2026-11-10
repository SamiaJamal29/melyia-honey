const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:4000";

interface ApiErrorPayload {
  readonly error?: { readonly message?: string };
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit & { readonly idToken?: string } = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (options.idToken) headers.set("Authorization", `Bearer ${options.idToken}`);

  const response = await fetch(`${apiUrl}${path}`, {
    ...options,
    headers,
  });
  const payload = (await response.json().catch(() => null)) as ApiErrorPayload | T | null;
  if (!response.ok) {
    const message =
      payload &&
      typeof payload === "object" &&
      "error" in payload &&
      payload.error?.message
        ? payload.error.message
        : "The request could not be completed.";
    throw new Error(message);
  }
  return payload as T;
}
