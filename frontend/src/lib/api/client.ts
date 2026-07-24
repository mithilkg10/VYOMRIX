export class ApiError extends Error {
  constructor(message: string, public readonly status: number, public readonly details?: unknown) {
    super(message);
    this.name = "ApiError";
  }
}

type ApiRequestOptions = Omit<RequestInit, "body"> & { body?: unknown };

export async function apiRequest<T>(path: string, { body, headers, ...options }: ApiRequestOptions = {}): Promise<T> {
  const response = await fetch("/api/" + path.replace(/^\//, ""), {
    ...options,
    headers: { Accept: "application/json", ...(body === undefined ? {} : { "Content-Type": "application/json" }), ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) {
    const details = await response.json().catch(() => undefined);
    const message = typeof details === "object" && details !== null && "detail" in details ? String(details.detail) : "The security platform could not complete this request.";
    throw new ApiError(message, response.status, details);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
