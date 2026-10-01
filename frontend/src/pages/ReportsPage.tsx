import { useCms } from "../cms/CmsProvider"
import { ButtonLink, Icon, PageHero, formatDate } from "../components/ui"
import { resolvePublicAsset } from "../lib/router"

export default function ReportsPage() {
  const { content } = useCms()
  const published = content.reports
    .filter((item) => item.status === "published")
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
  const monthly = published.filter(
    (item) => item.periodType === "monthly",
  ).length
  const yearly = published.filter((item) => item.periodType === "yearly").length
  return (
    <>
      <PageHero banner={content.pageBanners.reports} />
      <section className="content-section content-section--gray">
        <div className="page-shell">
          <div className="report-summary-grid">
            <div className="report-summary-card">
              <span>Published reports</span>
              <strong>{published.length}</strong>
            </div>
            <div className="report-summary-card">
              <span>Monthly reports</span>
              <strong>{monthly}</strong>
            </div>
            <div className="report-summary-card">
              <span>Yearly reports</span>
              <strong>{yearly}</strong>
            </div>
          </div>
          {published.length ? (
            <div className="report-list">
              {published.map((report) => (
                <article className="report-item" key={report.id}>
                  <div>
                    <span className="eyebrow">
                      {report.periodType} · {report.periodLabel}
                    </span>
                    <h3>{report.title}</h3>
                    <p>
                      {report.summary} · Published{" "}
                      {formatDate(report.publishedAt)}
                    </p>
                  </div>
                  <a
                    className="button button--primary"
                    href={resolvePublicAsset(report.documentUrl)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Download <Icon name="download" size={17} />
                  </a>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <Icon name="reports" size={38} />
              <h3>Reporting is prepared, awaiting verified data</h3>
              <p>
                The reporting pages and monthly/yearly export model are ready.
                Automatic donation data cannot be published responsibly until a
                payment gateway, verified webhook and server-side ledger are
                connected.
              </p>
              <div style={{ marginTop: 22 }}>
                <ButtonLink to="/documents" kind="text">
                  View governance documents
                </ButtonLink>
              </div>
            </div>
          )}
          <div className="document-note">
            <Icon name="shield" size={20} />
            <span>
              Direct QR and bank transfers are manually verified. They do not
              create automatic public transaction records or reports.
            </span>
          </div>
        </div>
      </section>
    </>
  )
}
