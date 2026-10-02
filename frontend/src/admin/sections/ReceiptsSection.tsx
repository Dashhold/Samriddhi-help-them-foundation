import { FormEvent, useEffect, useRef, useState } from "react"
import { useCms } from "../../cms/CmsProvider"
import DonationReceipt from "../../components/DonationReceipt"
import { Icon } from "../../components/ui"
import { printElement } from "../../lib/print"
import {
  paymentModes,
  type PaymentMode,
  type ReceiptDraft,
  type ReceiptRecord,
  type ReceiptView,
} from "../../receipts/contracts"
import { formatInr, formatReceiptDate } from "../../receipts/format"
import {
  deleteReceipt,
  issueReceipt,
  loadReceipts,
} from "../../receipts/repository"
import { useAdminFeedback } from "../components/AdminFeedback"

type Props = { onSaved: (message: string) => void }

function todayIso() {
  const now = new Date()
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-")
}

function emptyDraft(): ReceiptDraft {
  return {
    donorType: "individual",
    donorName: "",
    companyName: "",
    email: "",
    phone: "",
    pan: "",
    address: "",
    amount: 0,
    paymentDate: todayIso(),
    paymentMode: "UPI",
    paymentReference: "",
    purpose: "General donation",
    notes: "",
  }
}

function toView(record: ReceiptRecord): ReceiptView {
  return {
    donorType: record.donorType,
    donorName: record.donorName,
    companyName: record.companyName,
    email: record.email,
    phone: record.phone,
    pan: record.pan,
    address: record.address,
    amount: record.amount,
    paymentDate: record.paymentDate,
    paymentMode: (paymentModes as readonly string[]).includes(
      record.paymentMode,
    )
      ? record.paymentMode as PaymentMode
      : "Other",
    paymentReference: record.paymentReference,
    purpose: record.purpose,
    notes: record.notes,
    receiptNumber: record.receiptNumber,
    issuedAt: record.issuedAt,
  }
}

function emailLink(record: ReceiptRecord, organizationEmail: string) {
  const subject = `Donation receipt ${record.receiptNumber}`
  const body = [
    `Dear ${record.donorName},`,
    "",
    `Thank you for your donation of ${formatInr(record.amount)} received on ${formatReceiptDate(record.paymentDate)}.`,
    `Your receipt number is ${record.receiptNumber}. The receipt is attached to this email.`,
    "",
    "With gratitude,",
    "Samriddhi Help Team Foundation",
    organizationEmail,
  ].join("\n")
  return `mailto:${record.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

function ReceiptModal({
  record,
  onClose,
}: {
  record: ReceiptRecord
  onClose: () => void
}) {
  const sheet = useRef<HTMLDivElement>(null)
  const { content } = useCms()
  return (
    <div
      className="admin-modal-backdrop"
      role="presentation"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div
        className="admin-modal admin-modal--receipt"
        role="dialog"
        aria-modal="true"
        aria-label={`Receipt ${record.receiptNumber}`}
      >
        <div className="admin-modal__head">
          <h2>Receipt {record.receiptNumber}</h2>
          <button type="button" onClick={onClose} aria-label="Close">
            <Icon name="close" size={20} />
          </button>
        </div>
        <div ref={sheet}>
          <DonationReceipt receipt={toView(record)} />
        </div>
        <div className="admin-form-actions">
          {record.email ? (
            <a
              className="admin-button admin-button--secondary"
              href={emailLink(record, content.contact.email)}
            >
              <Icon name="mail" size={14} /> Email donor
            </a>
          ) : null}
          <button
            className="admin-button"
            type="button"
            onClick={() => printElement(sheet.current)}
          >
            <Icon name="download" size={14} /> Print / save as PDF
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ReceiptsSection({ onSaved }: Props) {
  const { content } = useCms()
  const { confirm, notify } = useAdminFeedback()
  const [draft, setDraft] = useState<ReceiptDraft>(emptyDraft)
  const [issued, setIssued] = useState<ReceiptRecord | null>(null)
  const [issuing, setIssuing] = useState(false)
  const [receipts, setReceipts] = useState<ReceiptRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState("")
  const [viewing, setViewing] = useState<ReceiptRecord | null>(null)
  const preview = useRef<HTMLDivElement>(null)
  const campaigns = content.fundraising.campaigns.filter(
    (campaign) => campaign.status !== "draft",
  )

  useEffect(() => {
    let active = true
    loadReceipts()
      .then((result) => {
        if (active) setReceipts(result)
      })
      .catch((error) => {
        if (active)
          setLoadError(
            error instanceof Error
              ? error.message
              : "Issued receipts could not be loaded.",
          )
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const field = <K extends keyof ReceiptDraft,>(
    key: K,
    value: ReceiptDraft[K],
  ) => setDraft((current) => ({ ...current, [key]: value }))

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setIssuing(true)
    try {
      const record = await issueReceipt({
        ...draft,
        companyName: draft.donorType === "company" ? draft.companyName : "",
      })
      setIssued(record)
      setReceipts((current) => [record, ...current])
      onSaved(`Receipt ${record.receiptNumber} issued.`)
    } catch (error) {
      notify(
        error instanceof Error
          ? error.message
          : "The receipt could not be issued.",
        "error",
      )
    } finally {
      setIssuing(false)
    }
  }

  const startNew = () => {
    setIssued(null)
    setDraft(emptyDraft())
  }

  const remove = async (record: ReceiptRecord) => {
    const approved = await confirm({
      title: `Delete receipt ${record.receiptNumber}?`,
      message: `The receipt for ${record.donorName} (${formatInr(record.amount)}) will be removed from the records and donation reports. Its number will not be reused. This cannot be undone.`,
      confirmLabel: "Delete receipt",
    })
    if (!approved) return
    try {
      await deleteReceipt(record.id)
      setReceipts((current) => current.filter((item) => item.id !== record.id))
      if (issued?.id === record.id) startNew()
      onSaved(`Receipt ${record.receiptNumber} deleted.`)
    } catch (error) {
      notify(
        error instanceof Error
          ? error.message
          : "The receipt could not be deleted.",
        "error",
      )
    }
  }

  const previewReceipt: ReceiptView = issued
    ? toView(issued)
    : { ...draft, receiptNumber: "", issuedAt: "" }

  return (
    <>
      <div className="admin-section-head">
        <div>
          <h2>Donation receipts</h2>
          <p>
            Issue an 80G donation receipt for money received by UPI, bank
            transfer, cheque or cash. The preview updates as you type.
          </p>
        </div>
      </div>

      <div className="admin-grid">
        <form className="admin-card admin-receipt-editor" onSubmit={submit}>
          <h3>{issued ? "Receipt issued" : "New receipt"}</h3>
          {issued ? (
            <div className="admin-receipt-issued">
              <Icon name="check" size={22} />
              <div>
                <strong>{issued.receiptNumber}</strong>
                <span>
                  {formatInr(issued.amount)} from {issued.donorName}
                </span>
              </div>
            </div>
          ) : (
            <p>Check the details against your bank statement before issuing.</p>
          )}
          <fieldset
            className="admin-form"
            disabled={Boolean(issued) || issuing}
          >
            <div className="admin-form-grid">
              <label className="admin-field">
                <span>Donor type</span>
                <select
                  value={draft.donorType}
                  onChange={(event) =>
                    field(
                      "donorType",
                      event.target.value as ReceiptDraft["donorType"],
                    )
                  }
                >
                  <option value="individual">Individual</option>
                  <option value="company">Company / organisation</option>
                </select>
              </label>
              <label className="admin-field">
                <span>Amount (₹)</span>
                <input
                  type="number"
                  required
                  min="1"
                  step="0.01"
                  value={draft.amount || ""}
                  onChange={(event) =>
                    field("amount", Number(event.target.value))
                  }
                />
              </label>
              {draft.donorType === "company" ? (
                <label className="admin-field admin-field--full">
                  <span>Company name</span>
                  <input
                    required
                    maxLength={160}
                    value={draft.companyName}
                    onChange={(event) =>
                      field("companyName", event.target.value)
                    }
                  />
                </label>
              ) : null}
              <label className="admin-field admin-field--full">
                <span>
                  {draft.donorType === "company"
                    ? "Contact person"
                    : "Donor name"}
                </span>
                <input
                  required
                  minLength={2}
                  maxLength={160}
                  value={draft.donorName}
                  onChange={(event) => field("donorName", event.target.value)}
                />
              </label>
              <label className="admin-field">
                <span>PAN (for 80G)</span>
                <input
                  maxLength={10}
                  pattern="[A-Za-z]{5}[0-9]{4}[A-Za-z]"
                  title="10-character PAN, for example ABCDE1234F"
                  value={draft.pan}
                  onChange={(event) =>
                    field("pan", event.target.value.toUpperCase())
                  }
                />
              </label>
              <label className="admin-field">
                <span>Phone</span>
                <input
                  type="tel"
                  maxLength={20}
                  value={draft.phone}
                  onChange={(event) => field("phone", event.target.value)}
                />
              </label>
              <label className="admin-field admin-field--full">
                <span>Email</span>
                <input
                  type="email"
                  maxLength={160}
                  value={draft.email}
                  onChange={(event) => field("email", event.target.value)}
                />
              </label>
              <label className="admin-field admin-field--full">
                <span>Address</span>
                <textarea
                  maxLength={300}
                  value={draft.address}
                  onChange={(event) => field("address", event.target.value)}
                />
              </label>
              <label className="admin-field">
                <span>Payment date</span>
                <input
                  type="date"
                  required
                  max={todayIso()}
                  value={draft.paymentDate}
                  onChange={(event) => field("paymentDate", event.target.value)}
                />
              </label>
              <label className="admin-field">
                <span>Payment mode</span>
                <select
                  value={draft.paymentMode}
                  onChange={(event) =>
                    field("paymentMode", event.target.value as PaymentMode)
                  }
                >
                  {paymentModes.map((mode) => (
                    <option key={mode} value={mode}>
                      {mode}
                    </option>
                  ))}
                </select>
              </label>
              <label className="admin-field admin-field--full">
                <span>UTR / transaction / cheque number</span>
                <input
                  maxLength={80}
                  value={draft.paymentReference}
                  onChange={(event) =>
                    field("paymentReference", event.target.value)
                  }
                />
              </label>
              <label className="admin-field admin-field--full">
                <span>Purpose</span>
                <input
                  required
                  minLength={2}
                  maxLength={160}
                  list="receipt-purposes"
                  value={draft.purpose}
                  onChange={(event) => field("purpose", event.target.value)}
                />
                <datalist id="receipt-purposes">
                  <option value="General donation" />
                  {campaigns.map((campaign) => (
                    <option key={campaign.id} value={campaign.title} />
                  ))}
                </datalist>
              </label>
              <label className="admin-field admin-field--full">
                <span>Notes printed on the receipt (optional)</span>
                <input
                  maxLength={500}
                  value={draft.notes}
                  onChange={(event) => field("notes", event.target.value)}
                />
              </label>
            </div>
          </fieldset>
          <div className="admin-form-actions">
            {issued ? (
              <>
                {issued.email ? (
                  <a
                    className="admin-button admin-button--secondary"
                    href={emailLink(issued, content.contact.email)}
                  >
                    <Icon name="mail" size={14} /> Email donor
                  </a>
                ) : null}
                <button
                  className="admin-button admin-button--secondary"
                  type="button"
                  onClick={() => printElement(preview.current)}
                >
                  <Icon name="download" size={14} /> Print / save as PDF
                </button>
                <button
                  className="admin-button"
                  type="button"
                  onClick={startNew}
                >
                  <Icon name="plus" size={14} /> New receipt
                </button>
              </>
            ) : (
              <>
                <button
                  className="admin-button admin-button--secondary"
                  type="button"
                  onClick={() => setDraft(emptyDraft())}
                  disabled={issuing}
                >
                  Clear
                </button>
                <button
                  className="admin-button"
                  type="submit"
                  disabled={issuing}
                >
                  {issuing ? "Issuing…" : "Issue receipt"}
                </button>
              </>
            )}
          </div>
        </form>

        <section className="admin-card admin-receipt-preview">
          <div className="admin-receipt-preview__head">
            <h3>{issued ? "Issued receipt" : "Live preview"}</h3>
            <span
              className={`admin-badge ${issued ? "" : "admin-badge--draft"}`}
            >
              {issued ? "Issued" : "Draft"}
            </span>
          </div>
          <div className="admin-receipt-preview__sheet" ref={preview}>
            <DonationReceipt receipt={previewReceipt} draft={!issued} />
          </div>
        </section>

        <section className="admin-card">
          <h3>Issued receipts</h3>
          <p>
            Receipts are also included in the monthly and yearly donation
            reports.
          </p>
          {loadError ? (
            <div className="admin-auth-error" style={{ marginBottom: 14 }}>
              {loadError}
            </div>
          ) : null}
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Receipt no.</th>
                  <th>Donor</th>
                  <th>Amount</th>
                  <th>Paid on</th>
                  <th>Mode</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {receipts.map((record) => (
                  <tr key={record.id}>
                    <td>
                      <strong>{record.receiptNumber}</strong>
                    </td>
                    <td>
                      {record.donorType === "company" && record.companyName
                        ? record.companyName
                        : record.donorName}
                    </td>
                    <td>{formatInr(record.amount)}</td>
                    <td>{formatReceiptDate(record.paymentDate)}</td>
                    <td>{record.paymentMode}</td>
                    <td>
                      <div className="admin-list-item__actions">
                        <button
                          className="admin-icon-button"
                          type="button"
                          onClick={() => setViewing(record)}
                          aria-label={`View receipt ${record.receiptNumber}`}
                          title="View and print"
                        >
                          <Icon name="document" size={15} />
                        </button>
                        {record.source === "offline" ? (
                          <button
                            className="admin-icon-button admin-icon-button--danger"
                            type="button"
                            onClick={() => void remove(record)}
                            aria-label={`Delete receipt ${record.receiptNumber}`}
                            title="Delete"
                          >
                            <Icon name="trash" size={15} />
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading && !receipts.length && !loadError ? (
              <div className="admin-empty">
                <Icon name="document" size={28} />
                <h3>No receipts issued yet</h3>
                <p>Receipts you issue above will be listed here.</p>
              </div>
            ) : null}
          </div>
        </section>
      </div>

      {viewing ? (
        <ReceiptModal record={viewing} onClose={() => setViewing(null)} />
      ) : null}
    </>
  )
}
