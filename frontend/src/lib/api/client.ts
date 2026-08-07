export class ApiError extends Error {
  constructor(message: string, public readonly status: number, public readonly details?: unknown) {
    super(message);
    this.name = "ApiError";
  }
}

type ApiRequestOptions = Omit<RequestInit, "body"> & { body?: unknown };

export async function apiRequest<T>(path: string, { body, headers, ...options }: ApiRequestOptions = {}): Promise<T> {
  const method = options.method || "GET";
  const csrfToken = method !== "GET" && typeof document !== "undefined" 
    ? document.cookie.split('; ').find(row => row.startsWith('csrf_token='))?.split('=')[1] 
    : undefined;
  
  const response = await fetch("/api/" + path.replace(/^\//, ""), {
    ...options,
    headers: { 
      Accept: "application/json", 
      ...(body === undefined ? {} : { "Content-Type": "application/json" }), 
      ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {}),
      ...headers 
    },
    body: body === undefined ? undefined : (typeof body === "string" ? body : JSON.stringify(body)),
  });
  if (!response.ok) {
    const details = await response.json().catch(() => undefined);
    const message = typeof details === "object" && details !== null && "detail" in details ? String(details.detail) : "The security platform could not complete this request.";
    throw new ApiError(message, response.status, details);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
