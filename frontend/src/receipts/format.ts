// Self-contained so the tests can load it directly.

const ones = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
]
const tens = [
  "",
  "",
  "Twenty",
  "Thirty",
  "Forty",
  "Fifty",
  "Sixty",
  "Seventy",
  "Eighty",
  "Ninety",
]

function belowHundred(value: number): string {
  if (value < 20) return ones[value] ?? ""
  const unit = value % 10
  return `${tens[Math.floor(value / 10)]}${unit ? ` ${ones[unit]}` : ""}`
}

function belowThousand(value: number): string {
  const hundred = Math.floor(value / 100)
  const rest = value % 100
  return [
    hundred ? `${ones[hundred]} Hundred` : "",
    rest ? belowHundred(rest) : "",
  ]
    .filter(Boolean)
    .join(" ")
}

/** Writes a whole number using the Indian system: thousand, lakh and crore. */
export function numberToIndianWords(value: number): string {
  const whole = Math.floor(Math.abs(value))
  if (whole === 0) return "Zero"
  const crore = Math.floor(whole / 10_000_000)
  const lakh = Math.floor((whole % 10_000_000) / 100_000)
  const thousand = Math.floor((whole % 100_000) / 1000)
  const rest = whole % 1000
  return [
    crore ? `${numberToIndianWords(crore)} Crore` : "",
    lakh ? `${belowHundred(lakh)} Lakh` : "",
    thousand ? `${belowHundred(thousand)} Thousand` : "",
    rest ? belowThousand(rest) : "",
  ]
    .filter(Boolean)
    .join(" ")
}

export function amountInWords(amount: number): string {
  const minor = Math.round(Math.max(0, amount) * 100)
  const rupees = Math.floor(minor / 100)
  const paise = minor % 100
  return `Rupees ${numberToIndianWords(rupees)}${
    paise ? ` and ${belowHundred(paise)} Paise` : ""
  } Only`
}

export function formatInr(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/** Indian financial years run from 1 April to 31 March, for example 2026-27. */
export function financialYearLabel(date: string): string {
  const [year = 0, month = 0] = date.split("-").map(Number)
  const start = month >= 4 ? year : year - 1
  return `${start}-${String((start + 1) % 100).padStart(2, "0")}`
}

export function formatReceiptDate(value: string): string {
  if (!value) return ""
  const date = new Date(value.length === 10 ? `${value}T00:00:00.000Z` : value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: value.length === 10 ? "UTC" : "Asia/Kolkata",
  }).format(date)
}
