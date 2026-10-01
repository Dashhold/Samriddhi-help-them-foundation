import { requireSupabase } from "../lib/supabase";
import { DonationRecord, DonationStatus, DonorType } from "./contracts";

type DonationRow = {
  id: string;
  provider_order_id: string;
  provider_payment_id: string | null;
  donor_type: DonorType;
  donor_name: string;
  company_name: string | null;
  email: string;
  phone: string | null;
  amount_minor: number;
  currency: "INR";
  campaign_id: string | null;
  purpose: string;
  status: DonationStatus;
  receipt_number: string | null;
  receipt_url: string | null;
  created_at: string;
  paid_at: string | null;
};

function rangeFor(period: "monthly" | "yearly", value: string) {
  if (period === "monthly") {
    const [year, month] = value.split("-").map(Number);
    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 1));
    return [start.toISOString(), end.toISOString()] as const;
  }
  const year = Number(value);
  return [new Date(Date.UTC(year, 0, 1)).toISOString(), new Date(Date.UTC(year + 1, 0, 1)).toISOString()] as const;
}

export async function loadDonationRecords(period: "monthly" | "yearly", value: string) {
  const [start, end] = rangeFor(period, value);
  const { data, error } = await requireSupabase()
    .from("donations")
    .select("id, provider_order_id, provider_payment_id, donor_type, donor_name, company_name, email, phone, amount_minor, currency, campaign_id, purpose, status, receipt_number, receipt_url, created_at, paid_at")
    .eq("status", "paid")
    .gte("paid_at", start)
    .lt("paid_at", end)
    .order("paid_at", { ascending: false })
    .limit(5000);
  if (error) throw new Error(error.message);
  return (data as DonationRow[]).map<DonationRecord>((row) => ({
    id: row.id,
    providerOrderId: row.provider_order_id,
    providerPaymentId: row.provider_payment_id ?? undefined,
    donorType: row.donor_type,
    donorName: row.donor_name,
    companyName: row.company_name ?? undefined,
    email: row.email,
    phone: row.phone ?? undefined,
    amount: row.amount_minor / 100,
    currency: row.currency,
    campaignId: row.campaign_id ?? undefined,
    purpose: row.purpose,
    status: row.status,
    receiptNumber: row.receipt_number ?? undefined,
    receiptUrl: row.receipt_url ?? undefined,
    createdAt: row.created_at,
    paidAt: row.paid_at ?? undefined,
  }));
}
