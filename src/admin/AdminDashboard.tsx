import { useEffect, useState } from "react";
import { AppLink } from "../lib/router";
import { Icon, IconName } from "../components/ui";
import OverviewSection from "./sections/OverviewSection";
import HomeContentSection from "./sections/HomeContentSection";
import NewsSection from "./sections/NewsSection";
import DonationSection from "./sections/DonationSection";
import DocumentsSection from "./sections/DocumentsSection";
import ReportsSection from "./sections/ReportsSection";
import SettingsSection from "./sections/SettingsSection";

type SectionId = "overview" | "home" | "news" | "donation" | "documents" | "reports" | "settings";
const sections: { id: SectionId; label: string; icon: IconName; description: string }[] = [
  { id: "overview", label: "Overview", icon: "home", description: "Content and integration status" },
  { id: "home", label: "Home & banners", icon: "edit", description: "Hero, page banners and campaigns" },
  { id: "news", label: "News", icon: "news", description: "Draft and publish updates" },
  { id: "donation", label: "Donation details", icon: "wallet", description: "QR, UPI and bank account" },
  { id: "documents", label: "Documents", icon: "document", description: "Public governance records" },
  { id: "reports", label: "Reports", icon: "reports", description: "Monthly and yearly exports" },
  { id: "settings", label: "Backup & settings", icon: "settings", description: "Contact and local CMS data" },
];

export default function AdminDashboard() {
  const [active, setActive] = useState<SectionId>("overview");
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState("");
  const current = sections.find((item) => item.id === active) ?? sections[0];
  useEffect(() => { document.title = `${current.label} · Samriddhi Admin`; }, [current.label]);
  useEffect(() => { if (!toast) return; const timer = window.setTimeout(() => setToast(""), 2600); return () => clearTimeout(timer); }, [toast]);
  const navigate = (section: string) => { setActive(section as SectionId); setMenuOpen(false); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const render = () => {
    switch (active) {
      case "home": return <HomeContentSection onSaved={setToast}/>;
      case "news": return <NewsSection onSaved={setToast}/>;
      case "donation": return <DonationSection onSaved={setToast}/>;
      case "documents": return <DocumentsSection onSaved={setToast}/>;
      case "reports": return <ReportsSection onSaved={setToast}/>;
      case "settings": return <SettingsSection onSaved={setToast}/>;
      default: return <OverviewSection onNavigate={navigate}/>;
    }
  };
  return <div className="admin-root"><div className="admin-shell"><aside className={`admin-sidebar ${menuOpen ? "open" : ""}`}><div className="admin-brand"><span className="admin-brand__mark"><Icon name="shield" size={19}/></span><div><strong>Samriddhi CMS</strong><span>Local preview</span></div></div><nav className="admin-nav" aria-label="Admin sections">{sections.map((section) => <button className={active === section.id ? "active" : ""} onClick={() => navigate(section.id)} key={section.id}><Icon name={section.icon} size={17}/>{section.label}</button>)}</nav><div className="admin-sidebar__bottom"><AppLink to="/" target="_blank"><Icon name="external" size={15}/>Open public site</AppLink><button onClick={() => setMenuOpen(false)}><Icon name="close" size={15}/>Close menu</button></div></aside><main className="admin-main"><header className="admin-topbar"><button className="admin-mobile-menu" onClick={() => setMenuOpen((value) => !value)} aria-label="Open admin navigation"><Icon name="menu" size={22}/></button><div className="admin-topbar__title"><h1>{current.label}</h1><p>{current.description}</p></div><div className="admin-topbar__actions"><span className="admin-badge admin-badge--draft">Preview data</span><AppLink className="admin-button admin-button--secondary" to="/" target="_blank">View site <Icon name="external" size={14}/></AppLink></div></header><div className="admin-content"><div className="admin-notice"><Icon name="shield" size={18}/><span><strong>Local CMS preview:</strong> edits are saved only in this browser and are visible to public pages in this browser. Connect authenticated API publishing and asset storage before production administrator access.</span></div>{render()}</div></main></div>{toast && <div className="admin-toast" role="status"><Icon name="check" size={15}/> {toast}</div>}</div>;
}
