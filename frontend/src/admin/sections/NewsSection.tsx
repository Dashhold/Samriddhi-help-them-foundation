import { FormEvent, useState } from "react"
import { useCms } from "../../cms/CmsProvider"
import { NewsItem } from "../../cms/types"
import { Icon } from "../../components/ui"
import { resolvePublicAsset } from "../../lib/router"
import AssetUpload from "../components/AssetUpload"
import { useAdminFeedback } from "../components/AdminFeedback"
import { createId, slugify } from "../utils"

type Props = { onSaved: (message: string) => void }

function emptyNews(): NewsItem {
  return {
    id: createId("news"),
    slug: "",
    title: "",
    summary: "",
    body: "",
    imageUrl: "",
    imageAlt: "",
    category: "News",
    author: "Samriddhi Help Team Foundation",
    publishedAt: new Date().toISOString().slice(0, 10),
    status: "draft",
    featured: false,
  }
}

export default function NewsSection({ onSaved }: Props) {
  const { content, update } = useCms()
  const [editing, setEditing] = useState<NewsItem | null>(null)
  const [saving, setSaving] = useState(false)
  const { confirm, notify } = useAdminFeedback()
  const sorted = [...content.news].sort((a, b) =>
    b.publishedAt.localeCompare(a.publishedAt),
  )
  const save = async (event: FormEvent) => {
    event.preventDefault()
    if (!editing) return
    if (editing.status === "published" && !editing.imageUrl) {
      alert("Upload a cover image before publishing this update.")
      return
    }
    setSaving(true)
    try {
      const item = { ...editing, slug: slugify(editing.slug || editing.title) }
      await update((next) => ({
        ...next,
        news: next.news.some((entry) => entry.id === item.id)
          ? next.news.map((entry) => (entry.id === item.id ? item : entry))
          : [item, ...next.news],
      }))
      setEditing(null)
      onSaved(
        item.status === "published"
          ? "News update published."
          : "News draft saved.",
      )
    } catch (error) {
      alert(error instanceof Error ? error.message : "News could not be saved.")
    } finally {
      setSaving(false)
    }
  }
  const remove = async (item: NewsItem) => {
    const name = item.title.trim()
    const approved = await confirm({
      title: name ? `Delete “${name}”?` : "Delete this news update?",
      message:
        "This news update and its cover image will be removed from the website straight away. This cannot be undone.",
      confirmLabel: "Delete update",
    })
    if (!approved) return
    try {
      await update((next) => ({
        ...next,
        news: next.news.filter((entry) => entry.id !== item.id),
      }))
      onSaved(`${name ? `“${name}”` : "News update"} deleted.`)
    } catch (error) {
      notify(
        error instanceof Error ? error.message : "News could not be deleted.",
        "error",
      )
    }
  }
  return (
    <>
      <div className="admin-section-head">
        <div>
          <h2>News</h2>
          <p>Create public updates or keep work in draft.</p>
        </div>
        <button
          className="admin-button"
          onClick={() => setEditing(emptyNews())}
        >
          <Icon name="plus" size={16} />
          New update
        </button>
      </div>
      <section className="admin-card">
        <div className="admin-list">
          {sorted.map((item) => (
            <article className="admin-list-item" key={item.id}>
              {item.imageUrl ? (
                <img src={resolvePublicAsset(item.imageUrl)} alt="" />
              ) : (
                <span className="admin-preview-image" />
              )}
              <div>
                <span
                  className={`admin-badge ${
                    item.status === "draft" ? "admin-badge--draft" : ""
                  }`}
                >
                  {item.status}
                </span>
                <h4>{item.title}</h4>
                <p>
                  {item.category} · {item.publishedAt} · /news/{item.slug}
                </p>
              </div>
              <div className="admin-list-item__actions">
                <button
                  className="admin-icon-button"
                  onClick={() => setEditing(structuredClone(item))}
                  aria-label={`Edit ${item.title}`}
                >
                  <Icon name="edit" size={15} />
                </button>
                <button
                  className="admin-icon-button admin-icon-button--danger"
                  onClick={() => void remove(item)}
                  aria-label={`Delete ${item.title}`}
                >
                  <Icon name="trash" size={15} />
                </button>
              </div>
            </article>
          ))}
          {!sorted.length && (
            <div className="admin-empty">
              <Icon name="news" size={28} />
              <h3>No news yet</h3>
              <p>Create the first update to start the public news page.</p>
            </div>
          )}
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
          <form className="admin-modal" onSubmit={save}>
            <div className="admin-modal__head">
              <h2>
                {content.news.some((item) => item.id === editing.id)
                  ? "Edit news update"
                  : "Create news update"}
              </h2>
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
                <span>Title</span>
                <input
                  required
                  value={editing.title}
                  onChange={(event) =>
                    setEditing({ ...editing, title: event.target.value })
                  }
                />
              </label>
              <label className="admin-field">
                <span>URL slug</span>
                <input
                  value={editing.slug}
                  placeholder="Generated from title"
                  onChange={(event) =>
                    setEditing({ ...editing, slug: event.target.value })
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
              <label className="admin-field admin-field--full">
                <span>Summary</span>
                <textarea
                  required
                  value={editing.summary}
                  onChange={(event) =>
                    setEditing({ ...editing, summary: event.target.value })
                  }
                />
              </label>
              <label className="admin-field admin-field--full">
                <span>Article body</span>
                <textarea
                  required
                  style={{ minHeight: 180 }}
                  value={editing.body}
                  onChange={(event) =>
                    setEditing({ ...editing, body: event.target.value })
                  }
                />
              </label>
              <div className="admin-field admin-field--full">
                <AssetUpload
                  label="Cover image"
                  value={editing.imageUrl}
                  folder="news"
                  onChange={(imageUrl) =>
                    setEditing({
                      ...editing,
                      imageUrl,
                      imageAlt: editing.imageAlt || editing.title,
                    })
                  }
                />
              </div>
              <label className="admin-field admin-field--full">
                <span>Image description</span>
                <input
                  required
                  value={editing.imageAlt}
                  onChange={(event) =>
                    setEditing({ ...editing, imageAlt: event.target.value })
                  }
                />
              </label>
              <label className="admin-field">
                <span>Author</span>
                <input
                  required
                  value={editing.author}
                  onChange={(event) =>
                    setEditing({ ...editing, author: event.target.value })
                  }
                />
              </label>
              <label className="admin-field">
                <span>Publish date</span>
                <input
                  required
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
                      status: event.target.value as NewsItem["status"],
                    })
                  }
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </label>
              <div className="admin-toggle">
                <div>
                  <span>Featured story</span>
                  <small>Use as the large story on the News page</small>
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
                {saving ? "Saving…" : "Save update"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
