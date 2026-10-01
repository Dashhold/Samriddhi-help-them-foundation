import { useMemo, useState } from "react"
import { useCms } from "../cms/CmsProvider"
import { Icon, PageHero, formatDate } from "../components/ui"
import { resolvePublicAsset } from "../lib/router"

export default function DocumentsPage() {
  const { content } = useCms()
  const documents = content.documents.filter((item) => item.isPublic)
  const categories = useMemo(
    () => [
      "All",
      ...Array.from(new Set(documents.map((item) => item.category))),
    ],
    [documents],
  )
  const [category, setCategory] = useState("All")
  const visible =
    category === "All"
      ? documents
      : documents.filter((item) => item.category === category)
  return (
    <>
      <PageHero banner={content.pageBanners.documents} />
      <section className="content-section content-section--gray">
        <div className="page-shell">
          <div className="route-intro">
            <div>
              <span className="eyebrow">Document centre</span>
              <h2>Official organisation records</h2>
            </div>
            <p>
              These files are provided for transparent public reference. Open a
              document in a new tab to view or download the original file.
            </p>
          </div>
          <div className="document-filters" aria-label="Filter documents">
            {categories.map((item) => (
              <button
                className={category === item ? "active" : ""}
                onClick={() => setCategory(item)}
                key={item}
              >
                {item}
              </button>
            ))}
          </div>
          <div className="document-grid">
            {visible.map((document) => (
              <article className="document-card" key={document.id}>
                <div className="document-card__top">
                  <span className="document-card__icon">
                    <Icon name="document" size={24} />
                  </span>
                  <span className="document-card__type">
                    {document.fileType} · {document.fileSize}
                  </span>
                </div>
                <span>{document.category}</span>
                <h2>{document.title}</h2>
                <p>{document.description}</p>
                <dl>
                  <div>
                    <dt>Reference</dt>
                    <dd>{document.reference}</dd>
                  </div>
                  <div>
                    <dt>Issued</dt>
                    <dd>{formatDate(document.issuedAt)}</dd>
                  </div>
                </dl>
                <a
                  href={resolvePublicAsset(document.url)}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open document <Icon name="external" size={17} />
                </a>
              </article>
            ))}
          </div>
          <div className="document-note">
            <Icon name="shield" size={20} />
            <span>
              Registration and approval remain subject to the terms, validity
              periods and conditions stated in each original document. Website
              summaries do not replace the official records.
            </span>
          </div>
        </div>
      </section>
    </>
  )
}
