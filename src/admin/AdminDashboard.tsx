import { useEffect, useState } from "react";
import { useAdminAuth } from "../auth/AdminAuthProvider";
import { useCms } from "../cms/CmsProvider";
import { AppLink } from "../lib/router";
import { Icon, IconName } from "../components/ui";
import OverviewSection from "./sections/OverviewSection";
import HomeContentSection from "./sections/HomeContentSection";
import FundRaisingSection from "./sections/FundRaisingSection";
import NewsSection from "./sections/NewsSection";
import DonationSection from "./sections/DonationSection";
import DocumentsSection from "./sections/DocumentsSection";
import ReportsSection from "./sections/ReportsSection";
import SettingsSection from "./sections/SettingsSection";

type SectionId = "overview" | "home" | "fundraising" | "news" | "donation" | "documents" | "reports" | "settings";
const sections: { id: SectionId; label: string; icon: IconName; description: string }[] = [
  { id: "overview", label: "Overview", icon: "home", description: "Content and backend status" },
  { id: "fundraising", label: "Fund Raising", icon: "heart", description: "Public appeals, goals and verified progress" },
  { id: "home", label: "Content & banners", icon: "edit", description: "Page banners, focus areas and secondary content" },
  { id: "news", label: "News", icon: "news", description: "Draft and publish updates" },
  { id: "donation", label: "Donation details", icon: "wallet", description: "QR, UPI and bank account" },
  { id: "documents", label: "Documents", icon: "document", description: "Public governance records" },
  { id: "reports", label: "Reports", icon: "reports", description: "Monthly and yearly exports" },
  { id: "settings", label: "Backup & settings", icon: "settings", description: "Contact and remote CMS data" },
];

export default function AdminDashboard() {
  const auth = useAdminAuth();
  const cms = useCms();
  const [active, setActive] = useState<SectionId>("overview");
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState("");
  const current = sections.find((item) => item.id === active) ?? sections[0];
  useEffect(() => { document.title = `${current.label} · Samriddhi Admin`; }, [current.label]);
  useEffect(() => { if (!toast) return; const timer = window.setTimeout(() => setToast(""), 2600); return () => clearTimeout(timer); }, [toast]);
  const navigate = (section: string) => { setActive(section as SectionId); setMenuOpen(false); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const render = () => {
    switch (active) {
      case "fundraising": return <FundRaisingSection onSaved={setToast}/>;
      case "home": return <HomeContentSection onSaved={setToast}/>;
      case "news": return <NewsSection onSaved={setToast}/>;
      case "donation": return <DonationSection onSaved={setToast}/>;
      case "documents": return <DocumentsSection onSaved={setToast}/>;
      case "reports": return <ReportsSection onSaved={setToast}/>;
      case "settings": return <SettingsSection onSaved={setToast}/>;
      default: return <OverviewSection onNavigate={navigate}/>;
    }
  };
  return <div className="admin-root"><div className="admin-shell"><aside className={`admin-sidebar ${menuOpen ? "open" : ""}`}><div className="admin-brand"><span className="admin-brand__mark"><Icon name="shield" size={19}/></span><div><strong>Samriddhi CMS</strong><span>Secure backend</span></div></div><nav className="admin-nav" aria-label="Admin sections">{sections.map((section) => <button className={active === section.id ? "active" : ""} onClick={() => navigate(section.id)} key={section.id}><Icon name={section.icon} size={17}/>{section.label}</button>)}</nav><div className="admin-sidebar__bottom"><AppLink to="/" target="_blank"><Icon name="external" size={15}/>Open public site</AppLink><button onClick={() => void auth.signOut()}><Icon name="close" size={15}/>Sign out</button></div></aside><main className="admin-main"><header className="admin-topbar"><button className="admin-mobile-menu" onClick={() => setMenuOpen((value) => !value)} aria-label="Open admin navigation"><Icon name="menu" size={22}/></button><div className="admin-topbar__title"><h1>{current.label}</h1><p>{current.description}</p></div><div className="admin-topbar__actions"><span className="admin-user">{auth.user?.email}</span><span className="admin-badge">Database online</span><AppLink className="admin-button admin-button--secondary" to="/" target="_blank">View site <Icon name="external" size={14}/></AppLink></div></header><div className="admin-content"><div className="admin-notice"><Icon name="shield" size={18}/><span><strong>Protected workspace:</strong> changes are persisted to PostgreSQL and update public pages through Realtime. Media uploads go directly to the administrator-only CMS Storage policy.</span></div>{cms.error && <div className="admin-auth-error" style={{ marginBottom: 18 }}>{cms.error}</div>}{render()}</div></main></div>{toast && <div className="admin-toast" role="status"><Icon name="check" size={15}/> {toast}</div>}</div>;
}
