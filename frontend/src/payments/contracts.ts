export type DonorType = "individual" | "company"
export type DonationStatus = "created" | "pending" | "paid" | "failed" | "refunded"

export type DonationRecord = {
  id: string
  providerOrderId: string
  providerPaymentId?: string
  donorType: DonorType
  donorName: string
  companyName?: string
  email: string
  phone?: string
  amount: number
  currency: "INR"
  campaignId?: string
  purpose: string
  status: DonationStatus
  receiptNumber?: string
  receiptUrl?: string
  createdAt: string
  paidAt?: string
}

export function donationRecordsToCsv(records: DonationRecord[]): string {
  const headers = [
    "Donation ID",
    "Date",
    "Donor type",
    "Donor name",
    "Company",
    "Email",
    "Amount",
    "Currency",
    "Purpose",
    "Status",
    "Provider payment ID",
    "Receipt number",
  ]
  const rows = records.map((record) => [
    record.id,
    record.paidAt ?? record.createdAt,
    record.donorType,
    record.donorName,
    record.companyName ?? "",
    record.email,
    record.amount,
    record.currency,
    record.purpose,
    record.status,
    record.providerPaymentId ?? "",
    record.receiptNumber ?? "",
  ])
  const escape = (value: string | number) => {
    const text = String(value)
    const safe = /^[\s\u0000-\u001f]*[=+\-@]/u.test(text) ? `'${text}` : text
    return `"${safe.replace(/"/g, '""')}"`
  }
  return [headers, ...rows].map((row) => row.map(escape).join(",")).join("\n")
}
