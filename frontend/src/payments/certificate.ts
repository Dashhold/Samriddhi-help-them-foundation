import type { DonationRecord } from "./contracts"

export type CertificateDetails = {
  supporterName: string
  donationDate: string
  reference: string
  purpose: string
  isPreview: boolean
}

const previewDetails: CertificateDetails = {
  supporterName: "Supporter Name",
  donationDate: "2026-01-01",
  reference: "SAMPLE-PREVIEW-001",
  purpose: "Community support",
  isPreview: true,
}

export function certificateDetails(
  donation?: DonationRecord,
): CertificateDetails {
  if (donation?.status !== "paid" || !donation.paidAt) {
    return { ...previewDetails }
  }

  return {
    supporterName:
      donation.donorType === "company" && donation.companyName
        ? donation.companyName
        : donation.donorName,
    donationDate: donation.paidAt.slice(0, 10),
    reference:
      donation.receiptNumber ??
      donation.providerPaymentId ??
      donation.providerOrderId ??
      donation.id,
    purpose: donation.purpose,
    isPreview: false,
  }
}
