import logo from "../imports/samriddhi-logo.png"
import type { DonationRecord } from "../payments/contracts"
import { certificateDetails } from "../payments/certificate"

type ThankYouCertificateProps = {
  donation?: DonationRecord
}

function formatCertificateDate(value: string) {
  const parsed = new Date(`${value}T00:00:00.000Z`)
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(parsed)
}

export default function ThankYouCertificate({
  donation,
}: ThankYouCertificateProps) {
  const details = certificateDetails(donation)

  return (
    <article
      className={`thank-you-certificate ${
        details.isPreview ? "thank-you-certificate--preview" : ""
      }`}
      aria-label={
        details.isPreview
          ? "Preview of the donor thank-you certificate"
          : `Thank-you certificate for ${details.supporterName}`
      }
    >
      <div className="certificate-ribbon" aria-hidden="true" />
      <header className="certificate-header">
        <img src={logo} alt="Samriddhi Help Team Foundation" />
        <div>
          <strong>SAMRIDDHI HELP TEAM FOUNDATION</strong>
          <span>Section 8 Company · Hisar, Haryana</span>
        </div>
      </header>

      {details.isPreview && (
        <div className="certificate-preview-notice" role="note">
          Preview · Sample details · Not proof of payment
        </div>
      )}

      <div className="certificate-body">
        <span className="certificate-kicker">With heartfelt gratitude</span>
        <h2>Certificate of Appreciation</h2>
        <p>This thank-you is presented to</p>
        <strong className="certificate-supporter">
          {details.supporterName}
        </strong>
        <p className="certificate-message">
          for standing with Samriddhi Help Team Foundation and helping turn
          compassion into responsible community action.
        </p>
        <div className="certificate-meta">
          <div>
            <span>Date</span>
            <strong>{formatCertificateDate(details.donationDate)}</strong>
          </div>
          <div>
            <span>Reference</span>
            <strong>{details.reference}</strong>
          </div>
          <div>
            <span>Purpose</span>
            <strong>{details.purpose}</strong>
          </div>
        </div>
      </div>

      <footer className="certificate-footer">
        <span>Thank you for choosing kindness.</span>
        <small>
          A thank-you certificate is not a tax receipt or independent payment
          verification.
        </small>
      </footer>
      {details.isPreview && (
        <span className="certificate-watermark" aria-hidden="true">
          PREVIEW
        </span>
      )}
    </article>
  )
}
