type ApiEnvironment = {
  development: boolean
  production: boolean
  configuredUrl?: string
}

export function resolveApiBaseUrl({
  development,
  production,
  configuredUrl,
}: ApiEnvironment): string | null {
  if (production) return ""
  if (!development) return null

  const value = configuredUrl?.trim().replace(/\/+$/, "")
  if (!value) return null
  try {
    const url = new URL(value)
    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.pathname !== "/" ||
      url.search ||
      url.hash
    )
      return null
    return url.origin
  } catch {
    return null
  }
}
