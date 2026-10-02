import { ReactNode, useEffect, useRef, useState } from "react"
import logo from "../imports/samriddhi-logo.png"
import { PageBanner } from "../cms/types"
import { AppLink, resolvePublicAsset } from "../lib/router"

export type IconName = "arrow" | "building" | "calendar" | "chart" | "check" | "chevron" | "clock" | "close" | "copy" | "document" | "download" | "edit" | "external" | "heart" | "home" | "hands" | "mail" | "menu" | "news" | "phone" | "pin" | "plus" | "qr" | "reports" | "settings" | "shield" | "trash" | "upload" | "users" | "wallet" | "warning" | "whatsapp"

interface IconProps {
  name: IconName
  size?: number
}

export function Icon({ name, size = 20 }: IconProps) {
  const paths: Record<IconName, ReactNode> = {
    arrow: (
      <>
        <path d="M5 12h14" />
        <path d="m13 6 6 6-6 6" />
      </>
    ),
    building: (
      <>
        <path d="M4 21V7l8-4 8 4v14" />
        <path d="M9 21v-6h6v6M8 9h.01M12 9h.01M16 9h.01M8 12h.01M16 12h.01" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 10h18" />
      </>
    ),
    chart: (
      <>
        <path d="M4 19V9M10 19V5M16 19v-7M22 19V2" />
        <path d="M2 19h22" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    chevron: <path d="m6 9 6 6 6-6" />,
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    close: (
      <>
        <path d="m6 6 12 12M18 6 6 18" />
      </>
    ),
    copy: (
      <>
        <rect x="8" y="8" width="12" height="12" rx="2" />
        <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
      </>
    ),
    document: (
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
        <path d="M14 2v6h6M8 13h8M8 17h6" />
      </>
    ),
    download: (
      <>
        <path d="M12 3v12m0 0 5-5m-5 5-5-5" />
        <path d="M5 21h14" />
      </>
    ),
    edit: (
      <>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
      </>
    ),
    external: (
      <>
        <path d="M15 3h6v6M10 14 21 3" />
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      </>
    ),
    heart: (
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l7.8-7.5a5.5 5.5 0 0 0 1-7.9Z" />
    ),
    home: (
      <>
        <path d="m3 11 9-8 9 8" />
        <path d="M5 10v11h14V10M9 21v-7h6v7" />
      </>
    ),
    hands: (
      <>
        <path d="m8 11-4.5 4.5a2.1 2.1 0 0 0 3 3L11 14" />
        <path d="m16 11 4.5 4.5a2.1 2.1 0 0 1-3 3L13 14" />
        <path d="m7 12 3.4-3.4a2.2 2.2 0 0 1 3.1 0L17 12" />
      </>
    ),
    mail: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3 7 9 6 9-6" />
      </>
    ),
    menu: <path d="M4 7h16M4 12h16M4 17h16" />,
    news: (
      <>
        <path d="M4 4h16v16H4z" />
        <path d="M8 8h8M8 12h8M8 16h5" />
      </>
    ),
    phone: (
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.8a2 2 0 0 1-.4 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z" />
    ),
    pin: (
      <>
        <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="3" />
      </>
    ),
    plus: <path d="M12 5v14M5 12h14" />,
    qr: (
      <>
        <rect x="3" y="3" width="6" height="6" />
        <rect x="15" y="3" width="6" height="6" />
        <rect x="3" y="15" width="6" height="6" />
        <path d="M15 15h2v2h-2zM19 15h2v6h-2M15 19h2v2h-2" />
      </>
    ),
    reports: (
      <>
        <path d="M5 3h14v18H5z" />
        <path d="M9 16v-3M12 16V9M15 16v-5" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" />
      </>
    ),
    shield: (
      <>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
    trash: (
      <>
        <path d="M3 6h18M8 6V4h8v2M6 6l1 15h10l1-15" />
        <path d="M10 11v5M14 11v5" />
      </>
    ),
    upload: (
      <>
        <path d="M12 16V4m0 0L7 9m5-5 5 5" />
        <path d="M5 20h14" />
      </>
    ),
    users: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" />
      </>
    ),
    wallet: (
      <>
        <path d="M4 6h16v14H4a2 2 0 0 1-2-2V6a3 3 0 0 1 3-3h13v3" />
        <path d="M15 11h7v5h-7a2.5 2.5 0 0 1 0-5Z" />
      </>
    ),
    warning: (
      <>
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
        <path d="M12 9v4M12 17h.01" />
      </>
    ),
    whatsapp: (
      <>
        <path d="M20.5 11.7a8.5 8.5 0 0 1-12.6 7.5L3 20.5l1.3-4.7A8.5 8.5 0 1 1 20.5 11.7Z" />
        <path d="M8.4 7.5c.2-.4.4-.4.7-.4h.4c.2 0 .3.1.4.4l.8 1.9c.1.3 0 .5-.1.7l-.6.7c-.2.2-.1.4 0 .6.7 1.3 1.7 2.3 3 3 .2.1.4.2.6 0l.8-1c.2-.2.4-.2.7-.1l1.8.8c.3.1.5.2.5.4 0 .2-.1 1.2-.6 1.7-.5.6-1.3.9-2.1.9-1.4 0-6.3-2.2-8.8-6.1-.6-1-.6-2-.4-2.7.2-.4.5-.8.9-.8Z" />
      </>
    ),
  }
  return (
    <svg
      aria-hidden="true"
      className="icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  )
}

export function Logo({
  light = false,
  to = "/",
}: {
  light?: boolean
  to?: string
}) {
  const [failed, setFailed] = useState(false)
  return (
    <AppLink
      className={`brand-logo ${light ? "brand-logo--light" : ""} ${
        failed ? "brand-logo--fallback" : ""
      }`}
      to={to}
      aria-label="Samriddhi Help Team Foundation home"
    >
      {failed ? (
        <span aria-hidden="true">
          <b>समृद्धि</b>
          <i>Help Team Foundation</i>
        </span>
      ) : (
        <img
          src={logo}
          alt="Samriddhi Help Team Foundation"
          width={851}
          height={388}
          loading={light ? "lazy" : "eager"}
          fetchPriority={light ? "auto" : "high"}
          decoding="async"
          onError={() => setFailed(true)}
        />
      )}
    </AppLink>
  )
}

export function Reveal({
  children,
  className = "",
}: {
  children: ReactNode
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const node = ref.current
    if (!node || !window.IntersectionObserver) {
      node?.classList.add("is-visible")
      return
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          node.classList.add("is-visible")
          observer.unobserve(node)
        }
      },
      { threshold: 0.1 },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])
  return (
    <div ref={ref} className={`reveal ${className}`}>
      {children}
    </div>
  )
}

export function SectionHeading({
  eyebrow,
  title,
  body,
  centered = false,
  light = false,
}: {
  eyebrow: string
  title: string
  body?: string
  centered?: boolean
  light?: boolean
}) {
  return (
    <div
      className={`section-heading ${
        centered ? "section-heading--centered" : ""
      } ${light ? "section-heading--light" : ""}`}
    >
      <span className="eyebrow">{eyebrow}</span>
      <h2>{title}</h2>
      {body && <p>{body}</p>}
    </div>
  )
}

export function ButtonLink({
  to,
  children,
  kind = "primary",
  icon = true,
}: {
  to: string
  children: ReactNode
  kind?: "primary" | "secondary" | "light" | "text"
  icon?: boolean
}) {
  return (
    <AppLink className={`button button--${kind}`} to={to}>
      {children}
      {icon && <Icon name="arrow" size={18} />}
    </AppLink>
  )
}

export function PageHero({ banner }: { banner: PageBanner }) {
  return (
    <section className="page-hero">
      <img src={resolvePublicAsset(banner.imageUrl)} alt={banner.imageAlt} />
      <div className="page-hero__veil" />
      <div className="page-shell page-hero__content">
        <span className="eyebrow">{banner.eyebrow}</span>
        <h1>{banner.title}</h1>
        <p>{banner.body}</p>
      </div>
    </section>
  )
}

export function formatDate(value: string) {
  if (!value) return "Not specified"
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`))
}
