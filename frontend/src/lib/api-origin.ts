type ApiEnvironment = {
  development: boolean
  production: boolean
  configuredUrl?: string
}

function isLoopbackHostname(hostname: string): boolean {
  return (
    hostname === "localhost" ||
    /^127(?:\.\d{1,3}){3}$/.test(hostname) ||
    hostname === "[::1]"
  )
}

export function resolveApiBaseUrl({
  development,
  production,
  configuredUrl,
}: ApiEnvironment): string | null {
  if (!development && !production) return null

  let value = configuredUrl?.trim()
  // Railway shows domains without a scheme, so accept "my-api.up.railway.app" as HTTPS.
  if (value && !/^[a-z][a-z0-9+.-]*:\/\//i.test(value)) value = `https://${value}`
  if (!value || !/^https?:\/\/[^/?#]+\/?$/i.test(value)) return null

  try {
    const url = new URL(value)
    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.username ||
      url.password ||
      url.hostname.includes("*") ||
      (url.protocol === "http:" &&
        !(development && isLoopbackHostname(url.hostname)))
    )
      return null

    return url.origin
  } catch {
    return null
  }
}

export function apiEndpoint(apiBaseUrl: string, path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`
  return `${apiBaseUrl}${normalizedPath}`
}
