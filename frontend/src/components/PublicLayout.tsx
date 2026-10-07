import { ReactNode, useEffect, useState } from "react"
import { useCms } from "../cms/CmsProvider"
import { AppLink, useAppLocation } from "../lib/router"
import { Icon, Logo } from "./ui"

const navigation = [
  ["Home", "/"],
  ["About", "/about"],
  ["Our work", "/#work"],
  ["Team", "/team"],
  ["News", "/news"],
  ["Documents", "/documents"],
  ["Reports", "/reports"],
  ["Join us", "/join"],
  ["Contact", "/#contact"],
] as const

function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const location = useAppLocation()
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])
  useEffect(() => setOpen(false), [location.pathname, location.hash])
  return (
    <header className={`navbar ${scrolled ? "navbar--scrolled" : ""}`}>
      <div className="nav-inner">
        <Logo />
        <nav className="nav-links" aria-label="Main navigation">
          {navigation.map(([label, to]) => (
            <AppLink
              key={label}
              to={to}
              className={location.pathname === to ? "active" : undefined}
            >
              {label}
            </AppLink>
          ))}
        </nav>
        <div className="nav-actions">
          <AppLink className="donate-button" to="/donate">
            Donate now
          </AppLink>
          <button
            className="menu-button"
            onClick={() => setOpen((value) => !value)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            <Icon name={open ? "close" : "menu"} size={24} />
          </button>
        </div>
      </div>
      <div className={`mobile-menu ${open ? "mobile-menu--open" : ""}`}>
        {navigation.map(([label, to]) => (
          <AppLink key={label} to={to}>
            {label}
            <Icon name="arrow" size={18} />
          </AppLink>
        ))}
      </div>
    </header>
  )
}

function AnnouncementBar() {
  const { content } = useCms()
  const item = content.announcement
  if (!item.enabled) return null
  return (
    <aside
      className={`site-announcement site-announcement--${item.tone}`}
      aria-label="Current announcement"
    >
      <div className="page-shell">
        <span>{item.label}</span>
        <p>{item.message}</p>
        {item.link.label && (
          <AppLink to={item.link.href}>
            {item.link.label}
            <Icon name="arrow" size={15} />
          </AppLink>
        )}
      </div>
    </aside>
  )
}

function Footer() {
  const { content } = useCms()
  const { contact } = content
  return (
    <footer className="footer" id="footer">
      <div className="page-shell footer-main">
        <div className="footer-brand">
          <Logo light />
          <p>Compassion, community support and responsible action.</p>
          <span>Section 8 Company · Hisar, Haryana</span>
        </div>
        <div className="footer-column">
          <h3>Explore</h3>
          <AppLink to="/">Home</AppLink>
          <AppLink to="/about">About us</AppLink>
          <AppLink to="/about#leadership">Our founders</AppLink>
          <AppLink to="/#work">Our work</AppLink>
          <AppLink to="/team">Our team</AppLink>
          <AppLink to="/news">News</AppLink>
        </div>
        <div className="footer-column">
          <h3>Transparency</h3>
          <AppLink to="/documents">Documents</AppLink>
          <AppLink to="/reports">Reports</AppLink>
          <AppLink to="/documents">Compliance</AppLink>
        </div>
        <div className="footer-column">
          <h3>Support</h3>
          <AppLink to="/donate">Donate</AppLink>
          <AppLink to="/join">Volunteer</AppLink>
          <AppLink to="/join?type=organization">Partner with us</AppLink>
        </div>
        <div className="footer-column footer-contact">
          <h3>Contact</h3>
          <a href={`mailto:${contact.email}`}>{contact.email}</a>
          <a href={`tel:${contact.phone.replace(/\s/g, "")}`}>
            {contact.phone}
          </a>
          <span>{contact.shortAddress}</span>
        </div>
      </div>
      <div className="page-shell footer-bottom">
        <span>© 2026 Samriddhi Help Team Foundation. All rights reserved.</span>
        <div>
          <AppLink to="/privacy-policy">Privacy Policy</AppLink>
          <AppLink to="/refund-cancellation-policy">
            Refund / Cancellation Policy
          </AppLink>
          <AppLink to="/terms-and-conditions">Terms &amp; Conditions</AppLink>
          <AppLink to="/documents">Transparency</AppLink>
          <AppLink to="/reports">Reports</AppLink>
        </div>
      </div>
    </footer>
  )
}

function FloatingActions() {
  const { content } = useCms()
  return (
    <>
      <a
        className="whatsapp"
        href={`https://wa.me/${content.contact.whatsapp}`}
        target="_blank"
        rel="noreferrer"
        aria-label="Contact Samriddhi on WhatsApp"
      >
        <Icon name="whatsapp" size={26} />
        <span>Chat with us</span>
      </a>
      <div className="mobile-donate">
        <span>Help turn compassion into action</span>
        <AppLink to="/donate">
          Donate now <Icon name="arrow" size={17} />
        </AppLink>
      </div>
    </>
  )
}

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Navbar />
      <AnnouncementBar />
      <main className="public-main">{children}</main>
      <Footer />
      <FloatingActions />
    </>
  )
}
