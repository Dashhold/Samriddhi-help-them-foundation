import { FormEvent, useEffect, useMemo, useState } from "react"
import { useCms } from "../cms/CmsProvider"
import { DonorType } from "../payments/contracts"
import { Icon, PageHero } from "../components/ui"
import { AppLink, resolvePublicAsset, useAppLocation } from "../lib/router"

interface ReceiptRequest {
  id: string
  emailHref: string
  whatsappHref: string
}

interface CopyButtonProps {
  value: string
  label: string
}

function CopyButton({ value, label }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      // Clipboard access can be blocked inside an iframe; selection remains available.
    }
  }
  return (
    <button
      className="copy-button"
      type="button"
      onClick={copy}
      aria-label={`Copy ${label}`}
      title={copied ? "Copied" : `Copy ${label}`}
    >
      <Icon name={copied ? "check" : "copy"} size={15} />
    </button>
  )
}

export default function DonatePage() {
  const { content } = useCms()
  const settings = content.donation
  const location = useAppLocation()
  const activeCampaigns = content.fundraising.enabled
    ? content.fundraising.campaigns.filter(
        (campaign) => campaign.status === "active",
      )
    : []
  const requestedCampaign = new URLSearchParams(location.search).get("campaign")
  const selectedCampaign = activeCampaigns.find(
    (campaign) => campaign.id === requestedCampaign,
  )
  const [purpose, setPurpose] = useState("General donation")
  useEffect(() => {
    if (selectedCampaign) setPurpose(selectedCampaign.title)
  }, [selectedCampaign?.id])
  const [request, setRequest] = useState<ReceiptRequest | null>(null)
  const configuredRows = useMemo(
    () =>
      [
        ["UPI ID", settings.upiId],
        ["Payee", settings.payeeName],
        ["Bank", settings.bankName],
        ["Account name", settings.accountName],
        ["Account number", settings.accountNumber],
        ["IFSC", settings.ifsc],
        ["Branch", settings.branch],
        ["Account type", settings.accountType],
      ].filter(([, value]) => value.trim()),
    [settings],
  )
  const hasPaymentDetails = Boolean(
    settings.qrImageUrl || settings.upiId || settings.accountNumber,
  )

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const donorType = String(data.get("donorType")) as DonorType
    const id = `SHTF-REQ-${Date.now().toString(36).toUpperCase()}`
    const lines = [
      "Donation acknowledgement request",
      `Request ID: ${id}`,
      `Donor type: ${donorType}`,
      `Name: ${data.get("name")}`,
      donorType === "company" ? `Company: ${data.get("company")}` : "",
      `Email: ${data.get("email")}`,
      `Phone: ${data.get("phone")}`,
      `Amount: INR ${data.get("amount")}`,
      `Payment date: ${data.get("date")}`,
      `UTR / transaction reference: ${data.get("reference")}`,
      `Purpose / campaign: ${data.get("purpose")}`,
      "",
      "I understand this is a request for verification and not an official receipt.",
    ].filter(Boolean)
    const body = lines.join("\n")
    const subject = `Donation verification request ${id}`
    setRequest({
      id,
      emailHref: `mailto:${settings.receiptEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
      whatsappHref: `https://wa.me/${content.contact.whatsapp}?text=${encodeURIComponent(body)}`,
    })
  }

  return (
    <>
      <PageHero banner={content.pageBanners.donate} />
      <section className="content-section content-section--gray">
        <div className="page-shell">
          <div className="donate-layout">
            <section className="donation-methods">
              <span className="eyebrow">Step 1 · Make a transfer</span>
              <h2>Verified donation details</h2>
              <p>{settings.instructions}</p>
              {settings.acceptingDonations ? (
                <>
                  {settings.qrImageUrl ? (
                    <div className="qr-panel">
                      <img
                        src={resolvePublicAsset(settings.qrImageUrl)}
                        alt={`Donation QR code for ${settings.payeeName}`}
                      />
                    </div>
                  ) : (
                    <div className="qr-panel">
                      <div className="qr-placeholder">
                        <div>
                          <Icon name="qr" size={42} />
                          <strong>QR code not yet published</strong>
                          <small>
                            The admin can upload the verified QR from Donation
                            settings.
                          </small>
                        </div>
                      </div>
                    </div>
                  )}
                  {configuredRows.length ? (
                    <div className="bank-details">
                      {configuredRows.map(([label, value]) => (
                        <div className="bank-row" key={label}>
                          <span>{label}</span>
                          <strong>{value}</strong>
                          <CopyButton value={value} label={label} />
                        </div>
                      ))}
                    </div>
                  ) : null}
                  {!hasPaymentDetails && (
                    <div className="empty-state">
                      <Icon name="wallet" size={33} />
                      <h3>Payment details are being verified</h3>
                      <p>
                        Do not transfer funds using details received from an
                        unofficial source. Contact the foundation directly until
                        the admin publishes verified details here.
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="empty-state">
                  <Icon name="clock" size={33} />
                  <h3>Donations are temporarily paused</h3>
                  <p>
                    The foundation is updating its verified payment details.
                    Please check back or contact the team.
                  </p>
                </div>
              )}
              {settings.acceptingDonations && settings.payeeName ? (
                <div className="donation-warning">
                  <Icon name="shield" size={18} />
                  <span>
                    Always confirm that the payee name matches{" "}
                    <strong>{settings.payeeName}</strong>. The foundation never
                    asks for your UPI PIN, OTP, card PIN or banking password.
                  </span>
                </div>
              ) : null}
            </section>
            <section className="receipt-request">
              <span className="eyebrow">Step 2 · Request proof</span>
              <h2>Donation acknowledgement</h2>
              <p>
                After transferring, share the transaction reference. Our team
                must verify the credit before issuing an acknowledgement or an
                eligible 80G receipt.
              </p>
              {request ? (
                <div className="receipt-success">
                  <Icon name="check" size={32} />
                  <h3>Request prepared</h3>
                  <p>
                    Reference this request ID when contacting the foundation:
                  </p>
                  <code>{request.id}</code>
                  <p>
                    <strong>
                      This is not an official donation or tax receipt.
                    </strong>{" "}
                    Send the request using one of the options below so the
                    foundation can verify your transfer.
                  </p>
                  <div className="receipt-actions">
                    <a
                      className="button button--primary"
                      href={request.emailHref}
                    >
                      Send by email <Icon name="mail" size={17} />
                    </a>
                    <a
                      className="button button--text"
                      href={request.whatsappHref}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Send on WhatsApp <Icon name="whatsapp" size={17} />
                    </a>
                  </div>
                </div>
              ) : (
                <form className="receipt-form" onSubmit={submit}>
                  <div className="receipt-form__row">
                    <label>
                      Donor type
                      <select name="donorType" required>
                        <option value="individual">Individual person</option>
                        <option value="company">Company / organisation</option>
                      </select>
                    </label>
                    <label>
                      Donation amount (₹)
                      <input
                        name="amount"
                        type="number"
                        min="1"
                        step="1"
                        required
                        placeholder="5000"
                      />
                    </label>
                  </div>
                  <label>
                    Individual / contact name
                    <input name="name" required placeholder="Full legal name" />
                  </label>
                  <label>
                    Company name (if applicable)
                    <input
                      name="company"
                      placeholder="Registered company name"
                    />
                  </label>
                  <div className="receipt-form__row">
                    <label>
                      Email
                      <input
                        name="email"
                        type="email"
                        required
                        placeholder="you@example.com"
                      />
                    </label>
                    <label>
                      Phone
                      <input
                        name="phone"
                        type="tel"
                        required
                        placeholder="+91"
                      />
                    </label>
                  </div>
                  <div className="receipt-form__row">
                    <label>
                      Payment date
                      <input name="date" type="date" required />
                    </label>
                    <label>
                      UTR / transaction reference
                      <input
                        name="reference"
                        required
                        placeholder="Enter reference"
                      />
                    </label>
                  </div>
                  <label>
                    Purpose or fundraising appeal
                    <select
                      name="purpose"
                      value={purpose}
                      onChange={(event) => setPurpose(event.target.value)}
                    >
                      <option value="General donation">General donation</option>
                      {activeCampaigns.map((campaign) => (
                        <option value={campaign.title} key={campaign.id}>
                          {campaign.title}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label
                    style={{
                      display: "flex",
                      gridTemplateColumns: "auto 1fr",
                      alignItems: "start",
                    }}
                  >
                    <input
                      name="consent"
                      type="checkbox"
                      required
                      style={{ width: 17, marginTop: 2 }}
                    />
                    <span>
                      I confirm these details are accurate, consent to the
                      foundation contacting me for verification, and have read
                      the <AppLink to="/privacy-policy">Privacy Policy</AppLink>.
                    </span>
                  </label>
                  <button className="button button--primary" type="submit">
                    Prepare verification request <Icon name="arrow" size={17} />
                  </button>
                </form>
              )}
            </section>
          </div>
        </div>
      </section>
    </>
  )
}
