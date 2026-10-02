export const paymentModes = [
  "UPI",
  "Bank transfer",
  "Cheque",
  "Cash",
  "Demand draft",
  "Card / online",
  "Other",
] as const

export type PaymentMode = typeof paymentModes[number]

export type ReceiptRecord = {
  id: string
  receiptNumber: string
  source: "offline" | "online"
  donorType: "individual" | "company"
  donorName: string
  companyName: string
  email: string
  phone: string
  pan: string
  address: string
  amount: number
  currency: "INR"
  paymentDate: string
  paymentMode: string
  paymentReference: string
  purpose: string
  notes: string
  issuedAt: string
}

export type ReceiptDraft = {
  donorType: "individual" | "company"
  donorName: string
  companyName: string
  email: string
  phone: string
  pan: string
  address: string
  amount: number
  paymentDate: string
  paymentMode: PaymentMode
  paymentReference: string
  purpose: string
  notes: string
}

/** What the receipt template needs. Draft previews have no number or issue date yet. */
export type ReceiptView = ReceiptDraft & {
  receiptNumber: string
  issuedAt: string
}
