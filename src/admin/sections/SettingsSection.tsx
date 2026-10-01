import { FormEvent, useRef, useState } from "react";
import { useCms } from "../../cms/CmsProvider";
import { ContactSettings } from "../../cms/types";
import { Icon } from "../../components/ui";
import { downloadText } from "../utils";

type Props = { onSaved: (message: string) => void };

export default function SettingsSection({ onSaved }: Props) {
  const { content, update, reset, exportSnapshot, importSnapshot } = useCms();
  const [contact, setContact] = useState<ContactSettings>(() => structuredClone(content.contact));
  const inputRef = useRef<HTMLInputElement>(null);
  const save = (event: FormEvent) => {
    event.preventDefault();
    update((next) => ({ ...next, contact }));
    onSaved("Contact settings saved.");
  };
  const importFile = async (file: File | undefined) => {
    if (!file) return;
    try { importSnapshot(await file.text()); onSaved("CMS backup imported."); } catch (error) { alert(error instanceof Error ? error.message : "Import failed"); }
    if (inputRef.current) inputRef.current.value = "";
  };
  return <><div className="admin-section-head"><div><h2>Backup & settings</h2><p>Manage public contact details and this preview workspace.</p></div></div><div className="admin-grid"><form className="admin-card admin-card--half" onSubmit={save}><h3>Foundation contact</h3><p>These details appear in the footer, contact area and donation verification links.</p><div className="admin-form"><label className="admin-field"><span>Email</span><input type="email" required value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })}/></label><label className="admin-field"><span>Phone</span><input required value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })}/></label><label className="admin-field"><span>WhatsApp number</span><input required value={contact.whatsapp} onChange={(e) => setContact({ ...contact, whatsapp: e.target.value.replace(/\D/g, "") })}/><small>Country code plus number, digits only.</small></label><label className="admin-field"><span>Full registered address</span><textarea required value={contact.address} onChange={(e) => setContact({ ...contact, address: e.target.value })}/></label><label className="admin-field"><span>Short location</span><input required value={contact.shortAddress} onChange={(e) => setContact({ ...contact, shortAddress: e.target.value })}/></label><button className="admin-button" type="submit">Save contact details</button></div></form><section className="admin-card admin-card--half"><h3>CMS backup</h3><p>Browser data can be cleared. Export a JSON snapshot after meaningful content changes.</p><div className="admin-form"><button className="admin-button admin-button--secondary" type="button" onClick={() => downloadText(`samriddhi-cms-${new Date().toISOString().slice(0, 10)}.json`, exportSnapshot())}><Icon name="download" size={16}/>Export JSON backup</button><input ref={inputRef} type="file" accept="application/json" hidden onChange={(e) => importFile(e.target.files?.[0])}/><button className="admin-button admin-button--secondary" type="button" onClick={() => inputRef.current?.click()}><Icon name="upload" size={16}/>Import JSON backup</button><button className="admin-button admin-button--danger" type="button" onClick={() => { if (confirm("Reset all local CMS content to the bundled defaults? Export a backup first if needed.")) { reset(); onSaved("CMS reset to bundled defaults."); } }}><Icon name="trash" size={16}/>Reset all preview content</button></div></section><section className="admin-card"><h3>Production readiness</h3><p>This dashboard deliberately avoids fake security. A password embedded in a Vite bundle would be visible to every visitor.</p><div className="admin-integration-list"><div className="admin-integration-step"><span><Icon name="shield" size={14}/></span><div><strong>Admin authentication required</strong><small>Use server-managed sessions, role permissions, CSRF protection, rate limits and an audit log before exposing write APIs.</small></div></div><div className="admin-integration-step"><span><Icon name="upload" size={14}/></span><div><strong>Asset storage required</strong><small>Current file uploads become browser data URLs for preview only. Production images and PDFs need durable object storage.</small></div></div><div className="admin-integration-step"><span><Icon name="wallet" size={14}/></span><div><strong>Payment secrets stay server-side</strong><small>Never add provider secrets to VITE_ environment variables. Connect the payment contract through server endpoints.</small></div></div></div></section></div></>;
}
