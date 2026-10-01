import type { Database } from "../db.js";
import { AppError } from "../errors.js";

export type DonationPeriod = "monthly" | "yearly";

export function donationDateRange(period: DonationPeriod, value: string) {
  if (period === "monthly") {
    const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(value);
    if (!match) throw new AppError(400, "BAD_REQUEST", "Use a valid monthly period in YYYY-MM format.");
    const year = Number(match[1]);
    const month = Number(match[2]);
    if (year < 2000 || year > 2100) throw new AppError(400, "BAD_REQUEST", "The requested period is outside the supported range.");
    return [new Date(Date.UTC(year, month - 1, 1)), new Date(Date.UTC(year, month, 1))] as const;
  }
  if (!/^\d{4}$/.test(value)) throw new AppError(400, "BAD_REQUEST", "Use a valid yearly period in YYYY format.");
  const year = Number(value);
  if (year < 2000 || year > 2100) throw new AppError(400, "BAD_REQUEST", "The requested period is outside the supported range.");
  return [new Date(Date.UTC(year, 0, 1)), new Date(Date.UTC(year + 1, 0, 1))] as const;
}

type DonationRow = {
  id: string;
  provider_order_id: string;
  provider_payment_id: string | null;
  donor_type: "individual" | "company";
  donor_name: string;
  company_name: string | null;
  email: string;
  phone: string | null;
  amount_minor: number | string;
  currency: "INR";
  campaign_id: string | null;
  purpose: string;
  status: "paid";
  receipt_number: string | null;
  receipt_url: string | null;
  created_at: Date | string;
  paid_at: Date | string;
};

export async function getDonationRecords(sql: Database, period: DonationPeriod, value: string) {
  const [start, end] = donationDateRange(period, value);
  const rows = await sql<DonationRow[]>`
    SELECT id, provider_order_id, provider_payment_id, donor_type, donor_name, company_name,
           email, phone, amount_minor, currency, campaign_id, purpose, status,
           receipt_number, receipt_url, created_at, paid_at
    FROM donations
    WHERE status = 'paid' AND paid_at >= ${start} AND paid_at < ${end}
    ORDER BY paid_at DESC
    LIMIT 5000
  `;
  return rows.map((row) => ({
    id: row.id,
    providerOrderId: row.provider_order_id,
    ...(row.provider_payment_id ? { providerPaymentId: row.provider_payment_id } : {}),
    donorType: row.donor_type,
    donorName: row.donor_name,
    ...(row.company_name ? { companyName: row.company_name } : {}),
    email: row.email,
    ...(row.phone ? { phone: row.phone } : {}),
    amount: Number(row.amount_minor) / 100,
    currency: row.currency,
    ...(row.campaign_id ? { campaignId: row.campaign_id } : {}),
    purpose: row.purpose,
    status: row.status,
    ...(row.receipt_number ? { receiptNumber: row.receipt_number } : {}),
    ...(row.receipt_url ? { receiptUrl: row.receipt_url } : {}),
    createdAt: new Date(row.created_at).toISOString(),
    paidAt: new Date(row.paid_at).toISOString(),
  }));
}
