import { useCms } from "../../cms/CmsProvider"
import { Icon, IconName } from "../../components/ui"

type Props = { onNavigate: (section: string) => void }

export default function OverviewSection({ onNavigate }: Props) {
  const { content, updatedAt } = useCms()
  const stats: {
    label: string
    value: string | number
    note: string
    icon: IconName
  }[] = [
    {
      label: "Published news",
      value: content.news.filter((item) => item.status === "published").length,
      note: `${content.news.filter((item) => item.status === "draft").length} drafts`,
      icon: "news",
    },
    {
      label: "Public documents",
      value: content.documents.filter((item) => item.isPublic).length,
      note: `${content.documents.length} uploaded records`,
      icon: "document",
    },
    {
      label: "Active appeals",
      value: content.fundraising.campaigns.filter(
        (item) => item.status === "active",
      ).length,
      note: "Managed from Fund Raising",
      icon: "heart",
    },
    {
      label: "Published reports",
      value: content.reports.filter((item) => item.status === "published")
        .length,
      note: "Gateway data not connected",
      icon: "reports",
    },
  ]
  return (
    <>
      <div className="admin-section-head">
        <div>
          <h2>Dashboard overview</h2>
          <p>Review public content and integration readiness.</p>
        </div>
      </div>
      <div className="admin-grid">
        {stats.map((stat) => (
          <button
            className="admin-stat admin-card--third"
            style={{ textAlign: "left", cursor: "pointer" }}
            onClick={() =>
              onNavigate(
                stat.icon === "news"
                  ? "news"
                  : stat.icon === "document"
                    ? "documents"
                    : stat.icon === "reports"
                      ? "reports"
                      : "fundraising",
              )
            }
            key={stat.label}
          >
            <div className="admin-stat__top">
              <span>{stat.label}</span>
              <span className="admin-stat__icon">
                <Icon name={stat.icon} size={18} />
              </span>
            </div>
            <strong>{stat.value}</strong>
            <span>{stat.note}</span>
          </button>
        ))}
        <section className="admin-card admin-card--half">
          <h3>Publishing status</h3>
          <p>Content is securely saved to the shared PostgreSQL database.</p>
          <div className="admin-list">
            <div className="admin-toggle">
              <div>
                <span>Homepage announcement</span>
                <small>
                  {content.announcement.enabled
                    ? "Visible on the public site"
                    : "Currently hidden"}
                </small>
              </div>
              <span
                className={`admin-badge ${
                  content.announcement.enabled ? "" : "admin-badge--draft"
                }`}
              >
                {content.announcement.enabled ? "Live" : "Hidden"}
              </span>
            </div>
            <div className="admin-toggle">
              <div>
                <span>Donation details</span>
                <small>
                  {content.donation.qrImageUrl || content.donation.accountNumber
                    ? "At least one payment method is configured"
                    : "QR and bank details are still empty"}
                </small>
              </div>
              <span
                className={`admin-badge ${
                  content.donation.qrImageUrl || content.donation.accountNumber
                    ? ""
                    : "admin-badge--draft"
                }`}
              >
                {content.donation.qrImageUrl || content.donation.accountNumber
                  ? "Ready"
                  : "Needs setup"}
              </span>
            </div>
            <div className="admin-toggle">
              <div>
                <span>Payment gateway</span>
                <small>Server-side order, webhook and ledger integration</small>
              </div>
              <span className="admin-badge admin-badge--offline">
                Not connected
              </span>
            </div>
          </div>
        </section>
        <section className="admin-card admin-card--half">
          <h3>Recent workspace activity</h3>
          <p>Last published database revision.</p>
          <div className="admin-empty">
            <Icon name="clock" size={28} />
            <h3>
              {new Intl.DateTimeFormat("en-IN", {
                dateStyle: "medium",
                timeStyle: "short",
              }).format(new Date(updatedAt))}
            </h3>
            <p>
              Use Backup & settings to export a JSON copy of the current
              published content.
            </p>
          </div>
        </section>
        <section className="admin-card">
          <h3>Backend status</h3>
          <p>
            Core publishing services are connected. Payment processing remains
            intentionally pending until a gateway is selected.
          </p>
          <div className="admin-integration-list">
            <div className="admin-integration-step">
              <span>
                <Icon name="check" size={14} />
              </span>
              <div>
                <strong>Authenticated PostgreSQL CMS</strong>
                <small>
                  API authorization, protected publishing and revision history
                  are active.
                </small>
              </div>
            </div>
            <div className="admin-integration-step">
              <span>
                <Icon name="check" size={14} />
              </span>
              <div>
                <strong>Durable asset storage</strong>
                <small>
                  Images and documents are stored in PostgreSQL through
                  authenticated API uploads.
                </small>
              </div>
            </div>
            <div className="admin-integration-step">
              <span>3</span>
              <div>
                <strong>Payment provider pending</strong>
                <small>
                  The protected donation ledger and monthly/yearly report views
                  are ready for verified webhooks.
                </small>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
