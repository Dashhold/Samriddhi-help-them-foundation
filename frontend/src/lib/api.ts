import { apiEndpoint, resolveApiBaseUrl } from "./api-origin"

const apiBaseUrl = resolveApiBaseUrl({
  development: import.meta.env.DEV,
  production: import.meta.env.PROD,
  configuredUrl: import.meta.env.VITE_API_URL,
})

export const isApiConfigured = apiBaseUrl !== null

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string,
    public readonly requestId?: string,
  ) {
    super(message)
    this.name = "ApiError"
  }
}

type ApiRequestOptions = Omit<RequestInit, "body"> & {
  body?: BodyInit | Record<string, unknown>
  token?: string | null
  timeoutMs?: number
}

interface ErrorDetails {
  message?: unknown
  code?: unknown
  requestId?: unknown
}

type ErrorPayload = {
  error?: ErrorDetails
}

function endpoint(path: string) {
  if (apiBaseUrl) return apiEndpoint(apiBaseUrl, path)
  throw new ApiError(
    "The website API is not configured.",
    0,
    "API_NOT_CONFIGURED",
  )
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const controller = new AbortController()
  const timeout = window.setTimeout(
    () => controller.abort(),
    options.timeoutMs ?? 12_000,
  )
  const headers = new Headers(options.headers)
  if (options.token) headers.set("Authorization", `Bearer ${options.token}`)
  let body = options.body
  if (
    body &&
    !(body instanceof FormData) &&
    !(body instanceof Blob) &&
    typeof body !== "string"
  ) {
    headers.set("Content-Type", "application/json")
    body = JSON.stringify(body)
  }
  try {
    const { token: _token, timeoutMs: _timeoutMs, ...requestOptions } = options
    const response = await fetch(endpoint(path), {
      ...requestOptions,
      body: body as BodyInit | null | undefined,
      headers,
      signal: controller.signal,
      credentials: "omit",
    })
    if (response.status === 204) return undefined as T
    const contentType = response.headers.get("content-type") ?? ""
    const payload = contentType.includes("application/json")
      ? (await response.json()) as unknown
      : null
    if (!response.ok) {
      const error =
        payload && typeof payload === "object" && "error" in payload
          ? (payload as ErrorPayload).error
          : undefined
      throw new ApiError(
        typeof error?.message === "string"
          ? error.message
          : "The service could not complete the request.",
        response.status,
        typeof error?.code === "string" ? error.code : "REQUEST_FAILED",
        typeof error?.requestId === "string" ? error.requestId : undefined,
      )
    }
    return payload as T
  } catch (error) {
    if (error instanceof ApiError) throw error
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError("The service request timed out.", 0, "REQUEST_TIMEOUT")
    }
    throw new ApiError("The service could not be reached.", 0, "NETWORK_ERROR")
  } finally {
    window.clearTimeout(timeout)
  }
}
