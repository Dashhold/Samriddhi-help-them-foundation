// Self-contained so the tests can load it directly.

/** A card is valid through the end of its "valid until" date (compared as calendar dates). */
export function isMembershipExpired(validUntil: string, today = new Date()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(validUntil)) return false
  const localToday = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-")
  return validUntil < localToday
}

export function formatCardDate(value: string) {
  if (!value) return "—"
  const date = new Date(value.length === 10 ? `${value}T00:00:00.000Z` : value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: value.length === 10 ? "UTC" : "Asia/Kolkata",
  }).format(date)
}

export function formatMonthYear(value: string) {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat("en-IN", {
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(date)
}

export function addOneYear(date: Date) {
  const next = new Date(
    Date.UTC(date.getFullYear() + 1, date.getMonth(), date.getDate()),
  )
  return next.toISOString().slice(0, 10)
}
