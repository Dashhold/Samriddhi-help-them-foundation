import { FormEvent, useState } from "react"
import { useCms } from "../../cms/CmsProvider"
import { DocumentItem } from "../../cms/types"
import { Icon } from "../../components/ui"
import { resolvePublicAsset } from "../../lib/router"
import AssetUpload from "../components/AssetUpload"
import { createId } from "../utils"

type Props = { onSaved: (message: string) => void }

function emptyDocument(): DocumentItem {
  return {
    id: createId("document"),
    title: "",
    category: "Governance",
    description: "",
    reference: "",
    issuedAt: new Date().toISOString().slice(0, 10),
    validThrough: "Current",
    url: "",
    fileType: "PDF",
    fileSize: "",
    isPublic: false,
    featured: false,
  }
}

export default function DocumentsSection({ onSaved }: Props) {
  const { content, update } = useCms()
  const [editing, setEditing] = useState<DocumentItem | null>(null)
  const [saving, setSaving] = useState(false)
  const commit = async (event: FormEvent) => {
    event.preventDefault()
    if (!editing) return
    if (!editing.url) {
      alert("Upload a document before saving this record.")
      return
    }
    setSaving(true)
    try {
      await update((next) => ({
        ...next,
        documents: next.documents.some((item) => item.id === editing.id)
          ? next.documents.map((item) =>
              item.id === editing.id ? editing : item,
            )
          : [...next.documents, editing],
      }))
      setEditing(null)
      onSaved("Document record published.")
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Document record could not be saved.",
      )
    } finally {
      setSaving(false)
    }
  }
  const quickToggle = async (id: string, key: "isPublic" | "featured") => {
    try {
      await update((next) => ({
        ...next,
        documents: next.documents.map((item) =>
          item.id === id ? { ...item, [key]: !item[key] } : item,
        ),
      }))
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Document could not be updated.",
      )
    }
  }
  const remove = async (id: string) => {
    if (
      !window.confirm(
        "Remove this document from the CMS? Its Storage object is retained for audit and can be cleaned up separately.",
      )
    )
      return
    try {
      await update((next) => ({
        ...next,
        documents: next.documents.filter((item) => item.id !== id),
      }))
      onSaved("Document record removed.")
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Document could not be removed.",
      )
    }
  }
  return (
    <>
      <div className="admin-section-head">
        <div>
          <h2>Documents</h2>
          <p>
            Manage titles, public visibility and directly uploaded governance
            files.
          </p>
        </div>
        <button
          className="admin-button"
          onClick={() => setEditing(emptyDocument())}
        >
          <Icon name="plus" size={16} />
          Add document
        </button>
      </div>
      <section className="admin-card">
        <div className="admin-list">
          {content.documents.map((item) => (
            <article className="admin-list-item" key={item.id}>
              <span
                className="admin-preview-image"
                style={{ display: "grid", placeItems: "center", height: 52 }}
              >
                <Icon name="document" size={23} />
              </span>
              <div>
                <div style={{ display: "flex", gap: 6, marginBottom: 5 }}>
                  <button
                    className={`admin-badge ${
                      item.isPublic ? "" : "admin-badge--draft"
                    }`}
                    style={{ border: 0, cursor: "pointer" }}
                    onClick={() => void quickToggle(item.id, "isPublic")}
                  >
                    {item.isPublic ? "Public" : "Hidden"}
                  </button>
                  {item.featured && (
                    <button
                      className="admin-badge"
                      style={{ border: 0, cursor: "pointer" }}
                      onClick={() => void quickToggle(item.id, "featured")}
                    >
                      Featured
                    </button>
                  )}
                </div>
                <h4>{item.title}</h4>
                <p>
                  {item.category} · {item.reference} · {item.fileType}{" "}
                  {item.fileSize}
                </p>
              </div>
              <div className="admin-list-item__actions">
                <a
                  className="admin-icon-button"
                  href={resolvePublicAsset(item.url)}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Open ${item.title}`}
                >
                  <Icon name="external" size={15} />
                </a>
                <button
                  className="admin-icon-button"
                  onClick={() => setEditing(structuredClone(item))}
                  aria-label={`Edit ${item.title}`}
                >
                  <Icon name="edit" size={15} />
                </button>
                <button
                  className="admin-icon-button admin-icon-button--danger"
                  onClick={() => void remove(item.id)}
                  aria-label={`Remove ${item.title}`}
                >
                  <Icon name="trash" size={15} />
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
      {editing && (
        <div
          className="admin-modal-backdrop"
          role="presentation"
          onMouseDown={(event) =>
            event.target === event.currentTarget && setEditing(null)
          }
        >
          <form className="admin-modal" onSubmit={commit}>
            <div className="admin-modal__head">
              <h2>Document record</h2>
              <button
                type="button"
                onClick={() => setEditing(null)}
                aria-label="Close"
              >
                <Icon name="close" size={20} />
              </button>
            </div>
            <div className="admin-form-grid">
              <label className="admin-field admin-field--full">
                <span>Public title</span>
                <input
                  required
                  value={editing.title}
                  onChange={(event) =>
                    setEditing({ ...editing, title: event.target.value })
                  }
                />
              </label>
              <label className="admin-field">
                <span>Category</span>
                <input
                  required
                  value={editing.category}
                  onChange={(event) =>
                    setEditing({ ...editing, category: event.target.value })
                  }
                />
              </label>
              <label className="admin-field">
                <span>Reference</span>
                <input
                  value={editing.reference}
                  onChange={(event) =>
                    setEditing({ ...editing, reference: event.target.value })
                  }
                />
              </label>
              <label className="admin-field admin-field--full">
                <span>Description</span>
                <textarea
                  required
                  value={editing.description}
                  onChange={(event) =>
                    setEditing({ ...editing, description: event.target.value })
                  }
                />
              </label>
              <div className="admin-field admin-field--full">
                <AssetUpload
                  label="Document file"
                  value={editing.url}
                  folder="documents"
                  document
                  accept="application/pdf,image/jpeg,image/png"
                  onChange={(url, file) =>
                    setEditing({
                      ...editing,
                      url,
                      fileType: file
                        ? file.type === "application/pdf"
                          ? "PDF"
                          : "JPEG"
                        : editing.fileType,
                      fileSize: file
                        ? `${Math.round(file.size / 1024)} KB`
                        : editing.fileSize,
                    })
                  }
                />
              </div>
              <label className="admin-field">
                <span>File type</span>
                <select
                  value={editing.fileType}
                  onChange={(event) =>
                    setEditing({
                      ...editing,
                      fileType: event.target.value as DocumentItem["fileType"],
                    })
                  }
                >
                  <option>PDF</option>
                  <option>JPEG</option>
                </select>
              </label>
              <label className="admin-field">
                <span>Issued date</span>
                <input
                  type="date"
                  value={editing.issuedAt}
                  onChange={(event) =>
                    setEditing({ ...editing, issuedAt: event.target.value })
                  }
                />
              </label>
              <label className="admin-field">
                <span>Valid through</span>
                <input
                  value={editing.validThrough}
                  onChange={(event) =>
                    setEditing({ ...editing, validThrough: event.target.value })
                  }
                />
              </label>
              <label className="admin-field">
                <span>File size</span>
                <input value={editing.fileSize} readOnly />
              </label>
              <div className="admin-toggle">
                <div>
                  <span>Public</span>
                  <small>Show in the document centre</small>
                </div>
                <input
                  type="checkbox"
                  checked={editing.isPublic}
                  onChange={(event) =>
                    setEditing({ ...editing, isPublic: event.target.checked })
                  }
                />
              </div>
              <div className="admin-toggle">
                <div>
                  <span>Featured</span>
                  <small>Show on the homepage</small>
                </div>
                <input
                  type="checkbox"
                  checked={editing.featured}
                  onChange={(event) =>
                    setEditing({ ...editing, featured: event.target.checked })
                  }
                />
              </div>
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
                {saving ? "Saving…" : "Save document"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
