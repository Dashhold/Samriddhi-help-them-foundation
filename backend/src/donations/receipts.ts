import { randomUUID } from "node:crypto";
import type { Database } from "../db.js";

export const PAYMENT_MODES = [
  "UPI",
  "Bank transfer",
  "Cheque",
  "Cash",
  "Demand draft",
  "Card / online",
  "Other",
] as const;

export type ReceiptInput = {
  donorType: "individual" | "company";
  donorName: string;
  companyName: string;
  email: string;
  phone: string;
  pan: string;
  address: string;
  amount: number;
  paymentDate: string;
  paymentMode: (typeof PAYMENT_MODES)[number];
  paymentReference: string;
  purpose: string;
  notes: string;
};

// Indian financial years run from 1 April to 31 March, for example 2026-27.
export function financialYearLabel(date: string) {
  const [year = 0, month = 0] = date.split("-").map(Number);
  const start = month >= 4 ? year : year - 1;
  return `${start}-${String((start + 1) % 100).padStart(2, "0")}`;
}

export function formatReceiptNumber(paymentDate: string, sequence: number) {
  if (!Number.isSafeInteger(sequence) || sequence < 1) throw new Error("Invalid receipt sequence number.");
  return `SHTF/${financialYearLabel(paymentDate)}/${String(sequence).padStart(4, "0")}`;
}

type ReceiptRow = {
  id: string;
  provider: string;
  receipt_number: string | null;
  donor_type: "individual" | "company";
  donor_name: string;
  company_name: string | null;
  email: string | null;
  phone: string | null;
  donor_pan?: string | null;
  donor_address?: string | null;
  amount_minor: number | string;
  currency: "INR";
  purpose: string;
  payment_mode?: string | null;
  payment_reference?: string | null;
  provider_payment_id: string | null;
  notes?: string | null;
  paid_at: Date | string | null;
  receipt_issued_at?: Date | string | null;
  created_at: Date | string;
};

function isoDate(value: Date | string | null | undefined) {
  return value ? new Date(value).toISOString() : "";
}

export function toReceiptRecord(row: ReceiptRow) {
  return {
    id: row.id,
    receiptNumber: row.receipt_number ?? "",
    source: row.provider === "offline" ? "offline" : "online",
    donorType: row.donor_type,
    donorName: row.donor_name,
    companyName: row.company_name ?? "",
    email: row.email ?? "",
    phone: row.phone ?? "",
    pan: row.donor_pan ?? "",
    address: row.donor_address ?? "",
    amount: Number(row.amount_minor) / 100,
    currency: row.currency,
    paymentDate: isoDate(row.paid_at ?? row.created_at).slice(0, 10),
    paymentMode: row.payment_mode ?? "Card / online",
    paymentReference: row.payment_reference ?? row.provider_payment_id ?? "",
    purpose: row.purpose,
    notes: row.notes ?? "",
    issuedAt: isoDate(row.receipt_issued_at ?? row.paid_at ?? row.created_at),
  };
}

export async function issueReceipt(sql: Database, input: ReceiptInput) {
  const next = await sql<{ value: string }[]>`SELECT nextval('donation_receipt_seq') AS value`;
  const receiptNumber = formatReceiptNumber(input.paymentDate, Number(next[0]?.value ?? 0));
  // Stored at UTC midnight so the payment date and monthly reports agree in every time zone.
  const paidAt = new Date(`${input.paymentDate}T00:00:00.000Z`);
  const rows = await sql<ReceiptRow[]>`
    INSERT INTO donations (
      provider, provider_order_id, donor_type, donor_name, company_name, email, phone,
      amount_minor, currency, purpose, status, receipt_number, paid_at,
      donor_pan, donor_address, payment_mode, payment_reference, notes, receipt_issued_at
    ) VALUES (
      'offline', ${`offline-${randomUUID()}`}, ${input.donorType}, ${input.donorName}, ${input.companyName || null},
      ${input.email}, ${input.phone || null}, ${Math.round(input.amount * 100)}, 'INR', ${input.purpose}, 'paid',
      ${receiptNumber}, ${paidAt}, ${input.pan || null}, ${input.address || null}, ${input.paymentMode},
      ${input.paymentReference || null}, ${input.notes || null}, now()
    )
    RETURNING id, provider, receipt_number, donor_type, donor_name, company_name, email, phone, donor_pan,
              donor_address, amount_minor, currency, purpose, payment_mode, payment_reference,
              provider_payment_id, notes, paid_at, receipt_issued_at, created_at
  `;
  const row = rows[0];
  if (!row) throw new Error("The receipt could not be stored.");
  return toReceiptRecord(row);
}

export async function listReceipts(sql: Database) {
  const rows = await sql<ReceiptRow[]>`
    SELECT id, provider, receipt_number, donor_type, donor_name, company_name, email, phone, donor_pan,
           donor_address, amount_minor, currency, purpose, payment_mode, payment_reference,
           provider_payment_id, notes, paid_at, receipt_issued_at, created_at
    FROM donations
    WHERE receipt_number IS NOT NULL
    ORDER BY COALESCE(receipt_issued_at, paid_at, created_at) DESC
    LIMIT 500
  `;
  return rows.map(toReceiptRecord);
}

export async function deleteOfflineReceipt(sql: Database, id: string) {
  const rows = await sql<{ id: string; receipt_number: string | null }[]>`
    DELETE FROM donations WHERE id = ${id} AND provider = 'offline' RETURNING id, receipt_number
  `;
  return rows[0] ?? null;
}
