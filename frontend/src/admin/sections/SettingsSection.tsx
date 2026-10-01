import { FormEvent, useEffect, useRef, useState } from "react"
import { useCms } from "../../cms/CmsProvider"
import { ContactSettings } from "../../cms/types"
import { Icon } from "../../components/ui"
import { downloadText } from "../utils"

type Props = { onSaved: (message: string) => void }

export default function SettingsSection({ onSaved }: Props) {
  const { content, revision, update, reset, exportSnapshot, importSnapshot } =
    useCms()
  const [contact, setContact] = useState<ContactSettings>(() =>
    structuredClone(content.contact),
  )
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => setContact(structuredClone(content.contact)), [revision])
  const save = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    try {
      await update((next) => ({ ...next, contact }))
      onSaved("Contact settings published.")
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Contact settings could not be saved.",
      )
    } finally {
      setSaving(false)
    }
  }
  const importFile = async (file: File | undefined) => {
    if (!file) return
    try {
      await importSnapshot(await file.text())
      onSaved("CMS backup imported to PostgreSQL.")
    } catch (error) {
      alert(error instanceof Error ? error.message : "Import failed.")
    }
    if (inputRef.current) inputRef.current.value = ""
  }
  const resetRemote = async () => {
    if (
      !confirm(
        "Replace published remote content with bundled defaults? Export a backup first. This creates a database revision.",
      )
    )
      return
    try {
      await reset()
      onSaved("Remote CMS reset to bundled defaults.")
    } catch (error) {
      alert(error instanceof Error ? error.message : "Reset failed.")
    }
  }
  return (
    <>
      <div className="admin-section-head">
        <div>
          <h2>Backup & settings</h2>
          <p>Manage public contact details and shared PostgreSQL content.</p>
        </div>
      </div>
      <div className="admin-grid">
        <form className="admin-card admin-card--half" onSubmit={save}>
          <h3>Foundation contact</h3>
          <p>
            These details appear in the footer, contact area and donation
            verification links.
          </p>
          <div className="admin-form">
            <label className="admin-field">
              <span>Email</span>
              <input
                type="email"
                required
                value={contact.email}
                onChange={(event) =>
                  setContact({ ...contact, email: event.target.value })
                }
              />
            </label>
            <label className="admin-field">
              <span>Phone</span>
              <input
                required
                value={contact.phone}
                onChange={(event) =>
                  setContact({ ...contact, phone: event.target.value })
                }
              />
            </label>
            <label className="admin-field">
              <span>WhatsApp number</span>
              <input
                required
                value={contact.whatsapp}
                onChange={(event) =>
                  setContact({
                    ...contact,
                    whatsapp: event.target.value.replace(/\D/g, ""),
                  })
                }
              />
              <small>Country code plus number, digits only.</small>
            </label>
            <label className="admin-field">
              <span>Full registered address</span>
              <textarea
                required
                value={contact.address}
                onChange={(event) =>
                  setContact({ ...contact, address: event.target.value })
                }
              />
            </label>
            <label className="admin-field">
              <span>Short location</span>
              <input
                required
                value={contact.shortAddress}
                onChange={(event) =>
                  setContact({ ...contact, shortAddress: event.target.value })
                }
              />
            </label>
            <button className="admin-button" type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save contact details"}
            </button>
          </div>
        </form>
        <section className="admin-card admin-card--half">
          <h3>CMS backup and restore</h3>
          <p>
            Exports include the complete published content row. Imports are
            authorized remote writes and create a revision.
          </p>
          <div className="admin-form">
            <button
              className="admin-button admin-button--secondary"
              type="button"
              onClick={() =>
                downloadText(
                  `samriddhi-cms-${new Date().toISOString().slice(0, 10)}.json`,
                  exportSnapshot(),
                )
              }
            >
              <Icon name="download" size={16} />
              Export JSON backup
            </button>
            <input
              ref={inputRef}
              type="file"
              accept="application/json"
              hidden
              onChange={(event) => void importFile(event.target.files?.[0])}
            />
            <button
              className="admin-button admin-button--secondary"
              type="button"
              onClick={() => inputRef.current?.click()}
            >
              <Icon name="upload" size={16} />
              Import trusted JSON backup
            </button>
            <button
              className="admin-button admin-button--danger"
              type="button"
              onClick={() => void resetRemote()}
            >
              <Icon name="trash" size={16} />
              Reset published content
            </button>
          </div>
        </section>
        <section className="admin-card">
          <h3>Backend protections</h3>
          <p>
            The current backend enforces authorization outside the browser
            interface.
          </p>
          <div className="admin-integration-list">
            <div className="admin-integration-step">
              <span>
                <Icon name="check" size={14} />
              </span>
              <div>
                <strong>Opaque API sessions</strong>
                <small>
                  Username/password login returns a short-lived revocable token;
                  protected routes verify it server-side.
                </small>
              </div>
            </div>
            <div className="admin-integration-step">
              <span>
                <Icon name="check" size={14} />
              </span>
              <div>
                <strong>API authorization and revision history</strong>
                <small>
                  Every content write is authenticated, revision-checked and
                  recorded atomically.
                </small>
              </div>
            </div>
            <div className="admin-integration-step">
              <span>
                <Icon name="check" size={14} />
              </span>
              <div>
                <strong>PostgreSQL-backed uploads</strong>
                <small>
                  Public files are readable through immutable API URLs, while
                  uploads require an administrator session.
                </small>
              </div>
            </div>
            <div className="admin-integration-step">
              <span>4</span>
              <div>
                <strong>Payment provider pending</strong>
                <small>
                  Keep future provider and webhook secrets in Railway
                  server-only variables, never Vite variables.
                </small>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
