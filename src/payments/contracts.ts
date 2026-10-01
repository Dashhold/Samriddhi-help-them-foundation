export type DonorType = "individual" | "company";
export type DonationStatus = "created" | "pending" | "paid" | "failed" | "refunded";

export type DonationRecord = {
  id: string;
  providerOrderId: string;
  providerPaymentId?: string;
  donorType: DonorType;
  donorName: string;
  companyName?: string;
  email: string;
  phone?: string;
  amount: number;
  currency: "INR";
  campaignId?: string;
  purpose: string;
  status: DonationStatus;
  receiptNumber?: string;
  receiptUrl?: string;
  createdAt: string;
  paidAt?: string;
};

export type CreateDonationOrder = Pick<
  DonationRecord,
  "donorType" | "donorName" | "companyName" | "email" | "phone" | "amount" | "currency" | "campaignId" | "purpose"
>;

export type PaymentCheckout = {
  orderId: string;
  checkoutToken: string;
  expiresAt: string;
};

/**
 * Provider-neutral payment boundary. A future Razorpay/Stripe/etc. adapter
 * implements this contract, while order creation and webhook verification
 * remain on an authenticated server. Provider secrets must never enter Vite.
 */
export interface PaymentGateway {
  readonly providerName: string;
  createOrder(input: CreateDonationOrder): Promise<PaymentCheckout>;
  openCheckout(checkout: PaymentCheckout): Promise<void>;
}

export const PAYMENT_INTEGRATION_ENDPOINTS = {
  createOrder: "/api/payments/orders",
  webhook: "/api/payments/webhooks/:provider",
  donations: "/api/admin/donations",
  reportExport: "/api/admin/reports/export",
} as const;

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
  ];
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
  ]);
  const escape = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
  return [headers, ...rows].map((row) => row.map(escape).join(",")).join("\n");
}
