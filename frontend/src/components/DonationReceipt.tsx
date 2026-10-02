import logo from "../imports/samriddhi-logo.png"
import { useCms } from "../cms/CmsProvider"
import { organizationDetails } from "../lib/organization"
import type { ReceiptView } from "../receipts/contracts"
import {
  amountInWords,
  financialYearLabel,
  formatInr,
  formatReceiptDate,
} from "../receipts/format"

type DonationReceiptProps = {
  receipt: ReceiptView
  /** Drafts are previews of a receipt that has not been issued yet. */
  draft?: boolean
}

export default function DonationReceipt({
  receipt,
  draft = false,
}: DonationReceiptProps) {
  const { content } = useCms()
  const organization = organizationDetails(content)
  const isCompany = receipt.donorType === "company"
  const donorTitle =
    isCompany && receipt.companyName ? receipt.companyName : receipt.donorName
  const amount = Number.isFinite(receipt.amount) ? receipt.amount : 0
  const cashAboveLimit = receipt.paymentMode === "Cash" && amount > 2000
  const contactLine = [
    receipt.pan ? `PAN ${receipt.pan}` : "",
    receipt.email,
    receipt.phone,
  ]
    .filter(Boolean)
    .join(" · ")

  return (
    <article
      className={`donation-receipt ${draft ? "donation-receipt--draft" : ""}`}
      aria-label={
        draft
          ? "Draft donation receipt preview"
          : `Donation receipt ${receipt.receiptNumber}`
      }
    >
      <div className="receipt-ribbon" aria-hidden="true" />
      <header className="receipt-header">
        <img src={logo} alt={organization.name} />
        <div className="receipt-org">
          <strong>{organization.name}</strong>
          <span>
            Section 8 Company
            {organization.licence
              ? ` · Licence No. ${organization.licence}`
              : ""}
          </span>
          {organization.cin ? <span>CIN {organization.cin}</span> : null}
          <span>{organization.address}</span>
          <span>
            {organization.email} · {organization.phone}
          </span>
        </div>
        <div className="receipt-title">
          <h2>Donation receipt</h2>
          <span>FY {financialYearLabel(receipt.paymentDate)}</span>
        </div>
      </header>

      <div className="receipt-numbers">
        <div>
          <span>Receipt no.</span>
          <strong>{receipt.receiptNumber || "Assigned when issued"}</strong>
        </div>
        <div>
          <span>Receipt date</span>
          <strong>
            {formatReceiptDate(receipt.issuedAt || new Date().toISOString())}
          </strong>
        </div>
      </div>

      <section className="receipt-donor">
        <span className="receipt-label">Received with thanks from</span>
        <strong className="receipt-donor-name">
          {donorTitle || "Donor name"}
        </strong>
        {isCompany && receipt.companyName && receipt.donorName ? (
          <span>Represented by {receipt.donorName}</span>
        ) : null}
        {receipt.address ? <span>{receipt.address}</span> : null}
        {contactLine ? <span>{contactLine}</span> : null}
      </section>

      <div className="receipt-amount">
        <div>
          <span className="receipt-label">The sum of</span>
          <strong>{formatInr(amount)}</strong>
        </div>
        <p>{amountInWords(amount)}</p>
      </div>

      <dl className="receipt-details">
        <div>
          <dt>Payment mode</dt>
          <dd>{receipt.paymentMode}</dd>
        </div>
        <div>
          <dt>Payment date</dt>
          <dd>{formatReceiptDate(receipt.paymentDate)}</dd>
        </div>
        <div>
          <dt>Transaction / cheque ref.</dt>
          <dd>{receipt.paymentReference || "—"}</dd>
        </div>
        <div>
          <dt>Purpose</dt>
          <dd>{receipt.purpose || "General donation"}</dd>
        </div>
      </dl>
      {receipt.notes ? (
        <p className="receipt-notes">
          <span className="receipt-label">Notes</span> {receipt.notes}
        </p>
      ) : null}

      <section className="receipt-tax">
        <strong>Tax benefit under section 80G</strong>
        <p>
          Donations to {organization.name} are eligible for deduction under
          section 80G of the Income-tax Act, 1961.
        </p>
        <ul>
          {organization.approval80g ? (
            <li>
              80G provisional approval: URN {organization.approval80g}
              {organization.approval80gValidity
                ? ` (valid through ${organization.approval80gValidity})`
                : ""}
            </li>
          ) : null}
          {organization.registration12ab ? (
            <li>12AB registration: URN {organization.registration12ab}</li>
          ) : null}
          {organization.pan ? (
            <li>PAN of the foundation: {organization.pan}</li>
          ) : null}
        </ul>
        <small>
          The certificate of donation in Form 10BE is issued after the
          foundation files Form 10BD for the financial year.
          {cashAboveLimit
            ? " Cash donations above ₹2,000 are not eligible for the 80G deduction."
            : ""}
        </small>
      </section>

      <footer className="receipt-footer">
        <p>Thank you for your generous support.</p>
        <div className="receipt-sign">
          <span>For {organization.name}</span>
          <i aria-hidden="true" />
          <strong>Authorised signatory</strong>
        </div>
      </footer>
      <small className="receipt-generated">
        This is a computer-generated receipt.
      </small>
      {draft ? (
        <span className="receipt-watermark" aria-hidden="true">
          Draft
        </span>
      ) : null}
    </article>
  )
}
