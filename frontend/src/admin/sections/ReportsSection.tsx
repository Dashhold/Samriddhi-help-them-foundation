import { FormEvent, useEffect, useState } from "react"
import { useCms } from "../../cms/CmsProvider"
import { PublicReport } from "../../cms/types"
import { Icon } from "../../components/ui"
import { DonationRecord, donationRecordsToCsv } from "../../payments/contracts"
import { loadDonationRecords } from "../../payments/repository"
import AssetUpload from "../components/AssetUpload"
import { useAdminFeedback } from "../components/AdminFeedback"
import { createId, downloadText } from "../utils"

type Props = { onSaved: (message: string) => void }

function emptyReport(): PublicReport {
  return {
    id: createId("report"),
    title: "",
    periodType: "monthly",
    periodLabel: "",
    summary: "",
    documentUrl: "",
    publishedAt: new Date().toISOString().slice(0, 10),
    status: "draft",
  }
}

export default function ReportsSection({ onSaved }: Props) {
  const { content, update } = useCms()
  const [period, setPeriod] = useState<"monthly" | "yearly">("monthly")
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7))
  const [year, setYear] = useState(String(new Date().getFullYear()))
  const [records, setRecords] = useState<DonationRecord[]>([])
  const [loadingRecords, setLoadingRecords] = useState(false)
  const [recordsError, setRecordsError] = useState("")
  const [editing, setEditing] = useState<PublicReport | null>(null)
  const [saving, setSaving] = useState(false)
  const { confirm, notify } = useAdminFeedback()
  const selectedPeriod = period === "monthly" ? month : year
  useEffect(() => {
    let active = true
    setLoadingRecords(true)
    setRecordsError("")
    loadDonationRecords(period, selectedPeriod)
      .then((data) => {
        if (active) setRecords(data)
      })
      .catch((error) => {
        if (active) {
          setRecords([])
          setRecordsError(
            error instanceof Error
              ? error.message
              : "Donation records could not be loaded.",
          )
        }
      })
      .finally(() => {
        if (active) setLoadingRecords(false)
      })
    return () => {
      active = false
    }
  }, [period, selectedPeriod])
  const total = records
    .filter((record) => record.status === "paid")
    .reduce((sum, record) => sum + record.amount, 0)
  const saveReport = async (event: FormEvent) => {
    event.preventDefault()
    if (!editing) return
    if (!editing.documentUrl) {
      alert("Upload the approved report PDF before saving.")
      return
    }
    setSaving(true)
    try {
      await update((next) => ({
        ...next,
        reports: next.reports.some((item) => item.id === editing.id)
          ? next.reports.map((item) =>
              item.id === editing.id ? editing : item,
            )
          : [...next.reports, editing],
      }))
      setEditing(null)
      onSaved("Public report published.")
    } catch (error) {
      alert(
        error instanceof Error ? error.message : "Report could not be saved.",
      )
    } finally {
      setSaving(false)
    }
  }
  const removeReport = async (report: PublicReport) => {
    const name = report.title.trim()
    const approved = await confirm({
      title: name ? `Remove “${name}”?` : "Remove this report?",
      message:
        "This report will be removed from the public Reports page straight away. This cannot be undone.",
      confirmLabel: "Remove report",
    })
    if (!approved) return
    try {
      await update((next) => ({
        ...next,
        reports: next.reports.filter((item) => item.id !== report.id),
      }))
      onSaved(`${name ? `“${name}”` : "Public report"} removed.`)
    } catch (error) {
      notify(
        error instanceof Error ? error.message : "Report could not be removed.",
        "error",
      )
    }
  }
  const exportCsv = () =>
    downloadText(
      `donations-${selectedPeriod}.csv`,
      donationRecordsToCsv(records),
      "text/csv;charset=utf-8",
    )
  return (
    <>
      <div className="admin-section-head">
        <div>
          <h2>Donation reports</h2>
          <p>
            Monthly and yearly reporting reads directly from the protected
            PostgreSQL ledger.
          </p>
        </div>
        <button
          className="admin-button"
          disabled={!records.length}
          onClick={exportCsv}
        >
          <Icon name="download" size={15} />
          Export CSV
        </button>
      </div>
      <div className="admin-grid">
        <section className="admin-card">
          <div className="admin-toggle">
            <div>
              <span>Payment ledger database</span>
              <small>
                Database and API authorization are connected; rows will arrive
                only from a future verified payment integration.
              </small>
            </div>
            <span className="admin-badge">Database ready</span>
          </div>
          <div className="admin-report-controls" style={{ marginTop: 18 }}>
            <select
              value={period}
              onChange={(event) =>
                setPeriod(event.target.value as typeof period)
              }
            >
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
            {period === "monthly" ? (
              <input
                type="month"
                value={month}
                onChange={(event) => setMonth(event.target.value)}
              />
            ) : (
              <input
                type="number"
                min="2025"
                max="2100"
                value={year}
                onChange={(event) => setYear(event.target.value)}
              />
            )}
          </div>
          {recordsError && (
            <div className="admin-auth-error" style={{ marginTop: 14 }}>
              {recordsError}
            </div>
          )}
        </section>
        <div className="admin-stat admin-card--third">
          <div className="admin-stat__top">
            <span>Verified donations</span>
            <span className="admin-stat__icon">
              <Icon name="heart" size={18} />
            </span>
          </div>
          <strong>{loadingRecords ? "…" : records.length}</strong>
          <span>For selected period</span>
        </div>
        <div className="admin-stat admin-card--third">
          <div className="admin-stat__top">
            <span>Amount received</span>
            <span className="admin-stat__icon">
              <Icon name="wallet" size={18} />
            </span>
          </div>
          <strong>₹{total.toLocaleString("en-IN")}</strong>
          <span>Paid records only</span>
        </div>
        <div className="admin-stat admin-card--third">
          <div className="admin-stat__top">
            <span>Receipts issued</span>
            <span className="admin-stat__icon">
              <Icon name="document" size={18} />
            </span>
          </div>
          <strong>{records.filter((item) => item.receiptNumber).length}</strong>
          <span>Receipt numbers on record</span>
        </div>
        <section className="admin-card">
          <h3>Verified transaction ledger</h3>
          <p>
            Only paid records already present in PostgreSQL are returned; the
            browser has no ledger write operation.
          </p>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Donor</th>
                  <th>Type</th>
                  <th>Purpose</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Receipt</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.id}>
                    <td>
                      {new Date(
                        record.paidAt ?? record.createdAt,
                      ).toLocaleDateString("en-IN")}
                    </td>
                    <td>{record.donorName}</td>
                    <td>{record.donorType}</td>
                    <td>{record.purpose}</td>
                    <td>₹{record.amount.toLocaleString("en-IN")}</td>
                    <td>{record.status}</td>
                    <td>{record.receiptNumber ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loadingRecords && !records.length && (
              <div className="admin-empty">
                <Icon name="chart" size={30} />
                <h3>No verified donation data</h3>
                <p>
                  This is expected before a payment provider webhook starts
                  writing to the protected ledger.
                </p>
              </div>
            )}
          </div>
        </section>
        <section className="admin-card admin-card--half">
          <h3>Current API boundary</h3>
          <p>
            No payment gateway or browser donation-write endpoint is configured.
          </p>
          <div className="admin-integration-list">
            <div className="admin-integration-step">
              <span>
                <Icon name="check" size={14} />
              </span>
              <div>
                <strong>Protected report read</strong>
                <small>
                  <code>GET /api/admin/donations</code> requires a valid
                  administrator bearer session.
                </small>
              </div>
            </div>
            <div className="admin-integration-step">
              <span>
                <Icon name="check" size={14} />
              </span>
              <div>
                <strong>No public ledger mutations</strong>
                <small>
                  The current frontend cannot create orders, accept webhooks or
                  mark donations as paid.
                </small>
              </div>
            </div>
          </div>
        </section>
        <section className="admin-card admin-card--half">
          <h3>Reporting safeguards</h3>
          <p>Exports reflect only the selected protected ledger response.</p>
          <div className="admin-integration-list">
            <div className="admin-integration-step">
              <span>1</span>
              <div>
                <strong>Paid records only</strong>
                <small>
                  The API filters out created, pending, failed and refunded
                  rows.
                </small>
              </div>
            </div>
            <div className="admin-integration-step">
              <span>2</span>
              <div>
                <strong>Bounded report reads</strong>
                <small>
                  Each monthly or yearly request is capped at 5,000 records.
                </small>
              </div>
            </div>
            <div className="admin-integration-step">
              <span>3</span>
              <div>
                <strong>Reviewed public reports</strong>
                <small>
                  Public report PDFs remain separate CMS entries uploaded by an
                  administrator.
                </small>
              </div>
            </div>
          </div>
        </section>
        <section className="admin-card">
          <div className="admin-section-head">
            <div>
              <h3>Public report library</h3>
              <p>
                Upload a reviewed monthly or yearly PDF for the public Reports
                page.
              </p>
            </div>
            <button
              className="admin-button admin-button--secondary"
              onClick={() => setEditing(emptyReport())}
            >
              <Icon name="plus" size={15} />
              Add report
            </button>
          </div>
          <div className="admin-list">
            {content.reports.map((report) => (
              <article className="admin-list-item" key={report.id}>
                <span
                  className="admin-preview-image"
                  style={{ display: "grid", placeItems: "center", height: 52 }}
                >
                  <Icon name="reports" size={23} />
                </span>
                <div>
                  <span
                    className={`admin-badge ${
                      report.status === "draft" ? "admin-badge--draft" : ""
                    }`}
                  >
                    {report.status}
                  </span>
                  <h4>{report.title}</h4>
                  <p>
                    {report.periodType} · {report.periodLabel}
                  </p>
                </div>
                <div className="admin-list-item__actions">
                  <button
                    className="admin-icon-button"
                    onClick={() => setEditing(structuredClone(report))}
                    aria-label={`Edit ${report.title}`}
                  >
                    <Icon name="edit" size={15} />
                  </button>
                  <button
                    className="admin-icon-button admin-icon-button--danger"
                    onClick={() => void removeReport(report)}
                    aria-label={`Remove ${report.title}`}
                  >
                    <Icon name="trash" size={15} />
                  </button>
                </div>
              </article>
            ))}
            {!content.reports.length && (
              <div className="admin-empty">
                <Icon name="reports" size={28} />
                <h3>No public reports yet</h3>
                <p>
                  This is expected until verified financial reporting is
                  available.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
      {editing && (
        <div
          className="admin-modal-backdrop"
          onMouseDown={(event) =>
            event.target === event.currentTarget && setEditing(null)
          }
        >
          <form className="admin-modal" onSubmit={saveReport}>
            <div className="admin-modal__head">
              <h2>Public report entry</h2>
              <button type="button" onClick={() => setEditing(null)}>
                <Icon name="close" size={20} />
              </button>
            </div>
            <div className="admin-form-grid">
              <label className="admin-field admin-field--full">
                <span>Report title</span>
                <input
                  required
                  value={editing.title}
                  onChange={(event) =>
                    setEditing({ ...editing, title: event.target.value })
                  }
                />
              </label>
              <label className="admin-field">
                <span>Period type</span>
                <select
                  value={editing.periodType}
                  onChange={(event) =>
                    setEditing({
                      ...editing,
                      periodType: event.target
                        .value as PublicReport["periodType"],
                    })
                  }
                >
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </label>
              <label className="admin-field">
                <span>Period label</span>
                <input
                  required
                  placeholder="January 2027"
                  value={editing.periodLabel}
                  onChange={(event) =>
                    setEditing({ ...editing, periodLabel: event.target.value })
                  }
                />
              </label>
              <label className="admin-field admin-field--full">
                <span>Summary</span>
                <textarea
                  value={editing.summary}
                  onChange={(event) =>
                    setEditing({ ...editing, summary: event.target.value })
                  }
                />
              </label>
              <div className="admin-field admin-field--full">
                <AssetUpload
                  label="Approved report PDF"
                  value={editing.documentUrl}
                  folder="reports"
                  document
                  accept="application/pdf"
                  onChange={(documentUrl) =>
                    setEditing({ ...editing, documentUrl })
                  }
                />
              </div>
              <label className="admin-field">
                <span>Published date</span>
                <input
                  type="date"
                  value={editing.publishedAt}
                  onChange={(event) =>
                    setEditing({ ...editing, publishedAt: event.target.value })
                  }
                />
              </label>
              <label className="admin-field">
                <span>Status</span>
                <select
                  value={editing.status}
                  onChange={(event) =>
                    setEditing({
                      ...editing,
                      status: event.target.value as PublicReport["status"],
                    })
                  }
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </label>
            </div>
            <div className="admin-form-actions">
              <button
                className="admin-button admin-button--secondary"
                type="button"
                onClick={() => setEditing(null)}
              >
                Cancel
              </button>
              <button className="admin-button" type="submit" disabled={saving}>
                {saving ? "Saving…" : "Save report"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
