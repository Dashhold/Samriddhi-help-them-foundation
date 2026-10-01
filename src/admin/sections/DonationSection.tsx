import { FormEvent, useEffect, useState } from "react";
import { useCms } from "../../cms/CmsProvider";
import { DonationSettings } from "../../cms/types";
import { Icon } from "../../components/ui";
import AssetUpload from "../components/AssetUpload";

type Props = { onSaved: (message: string) => void };

export default function DonationSection({ onSaved }: Props) {
  const { content, revision, update } = useCms();
  const [draft, setDraft] = useState<DonationSettings>(() => structuredClone(content.donation));
  const [saving, setSaving] = useState(false);
  useEffect(() => setDraft(structuredClone(content.donation)), [revision]);
  const field = <K extends keyof DonationSettings>(key: K, value: DonationSettings[K]) => setDraft((current) => ({ ...current, [key]: value }));
  const save = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await update((next) => ({ ...next, donation: draft }));
      onSaved("Donation settings published.");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Donation settings could not be saved.");
    } finally {
      setSaving(false);
    }
  };
  return <><div className="admin-section-head"><div><h2>Donation details</h2><p>Control the public QR, UPI, bank transfer and acknowledgement instructions.</p></div></div><form className="admin-grid" onSubmit={save}><section className="admin-card admin-card--half"><h3>Donation availability</h3><p>Pause this while details are being changed or verified.</p><div className="admin-form"><div className="admin-toggle"><div><span>Accept direct donations</span><small>Shows QR, UPI and bank details on the Donate page</small></div><input type="checkbox" checked={draft.acceptingDonations} onChange={(event) => field("acceptingDonations", event.target.checked)}/></div><label className="admin-field"><span>Minimum suggested amount (₹)</span><input type="number" min="1" value={draft.minimumAmount} onChange={(event) => field("minimumAmount", Number(event.target.value))}/></label><label className="admin-field"><span>Public instructions</span><textarea value={draft.instructions} onChange={(event) => field("instructions", event.target.value)}/></label><label className="admin-field"><span>Receipt verification email</span><input type="email" required value={draft.receiptEmail} onChange={(event) => field("receiptEmail", event.target.value)}/></label></div></section><section className="admin-card admin-card--half"><h3>Verified QR code</h3><p>Upload the foundation's official donation QR directly to protected CMS Storage.</p><AssetUpload label="Donation QR image" value={draft.qrImageUrl} folder="donations/qr" accept="image/png,image/jpeg,image/webp" onChange={(qrImageUrl) => field("qrImageUrl", qrImageUrl)}/>{!draft.qrImageUrl && <div className="admin-empty"><Icon name="qr" size={32}/><h3>No QR uploaded</h3><p>The public page shows a safe not-configured message until one is uploaded.</p></div>}</section><section className="admin-card"><h3>UPI and bank account</h3><p>Only enter details verified against the foundation's official account.</p><div className="admin-form-grid"><label className="admin-field"><span>UPI ID</span><input value={draft.upiId} onChange={(event) => field("upiId", event.target.value)} placeholder="foundation@bank"/></label><label className="admin-field"><span>Payee name</span><input required value={draft.payeeName} onChange={(event) => field("payeeName", event.target.value)}/></label><label className="admin-field"><span>Bank name</span><input value={draft.bankName} onChange={(event) => field("bankName", event.target.value)}/></label><label className="admin-field"><span>Account name</span><input value={draft.accountName} onChange={(event) => field("accountName", event.target.value)}/></label><label className="admin-field"><span>Account number</span><input value={draft.accountNumber} onChange={(event) => field("accountNumber", event.target.value)}/></label><label className="admin-field"><span>IFSC</span><input value={draft.ifsc} onChange={(event) => field("ifsc", event.target.value.toUpperCase())}/></label><label className="admin-field"><span>Branch</span><input value={draft.branch} onChange={(event) => field("branch", event.target.value)}/></label><label className="admin-field"><span>Account type</span><input value={draft.accountType} onChange={(event) => field("accountType", event.target.value)}/></label></div></section><section className="admin-card"><div className="admin-toggle"><div><span>Payment gateway</span><small>The protected PostgreSQL ledger is ready; checkout remains disabled until a provider and verified webhook are connected.</small></div><span className="admin-badge admin-badge--offline">Provider pending</span></div><div className="admin-form-actions"><button className="admin-button" type="submit" disabled={saving}>{saving ? "Saving…" : "Save donation settings"}</button></div></section></form></>;
}
