import { useEffect, useState } from "react";
import { api, errorMessage } from "../api";

export default function Settings() {
  const [settings, setSettings] = useState(null);
  const [passwords, setPasswords] = useState({ current_password: "", new_password: "" });
  const [message, setMessage] = useState("");
  useEffect(() => { api.get("/settings/").then(({ data }) => setSettings(data)); }, []);
  if (!settings) return <div className="page-loader"><span /></div>;
  const save = async (event) => { event.preventDefault(); try { const { data } = await api.put("/settings/", settings); setSettings(data); setMessage("Business details saved."); } catch (err) { setMessage(errorMessage(err)); } };
  const changePassword = async (event) => { event.preventDefault(); try { await api.post("/settings/change-password/", passwords); setPasswords({ current_password: "", new_password: "" }); setMessage("Password changed. Sign in again on your next session."); } catch (err) { setMessage(errorMessage(err)); } };
  const backup = async () => { const { data } = await api.get("/backup/", { responseType: "blob" }); const url = URL.createObjectURL(data); const a = document.createElement("a"); a.href = url; a.download = "svr-backup.json"; a.click(); URL.revokeObjectURL(url); };
  const restore = async (file) => { const body = new FormData(); body.append("file", file); try { await api.post("/restore/", body); setMessage("Backup restored successfully."); } catch (err) { setMessage(errorMessage(err)); } };
  return (
    <>
      <div className="page-heading"><div><p className="eyebrow">Configuration</p><h1>Settings</h1><span>Business identity, security and data portability.</span></div></div>
      {message && <div className="smart-note">{message}</div>}
      <div className="settings-grid">
        <section className="panel"><div className="panel-heading"><div><h2>Business details</h2><p>Used across reports and system records.</p></div></div><form className="form-grid" onSubmit={save}>{[["business_name","Business Name"],["owner_name","Owner Name"],["phone","Phone"],["email","Email"],["tax_number","Tax Number"],["insurance_alert_days","Insurance Alert Days"]].map(([name,label]) => <label key={name}><span>{label}</span><input type={name === "insurance_alert_days" ? "number" : "text"} value={settings[name]} onChange={(e) => setSettings({ ...settings, [name]: e.target.value })} /></label>)}<label className="full"><span>Address</span><textarea rows="3" value={settings.address} onChange={(e) => setSettings({ ...settings, address: e.target.value })} /></label><div className="form-actions full"><button className="btn-primary-custom compact">Save settings</button></div></form></section>
        <div>
          <section className="panel mb-4"><div className="panel-heading"><div><h2>Change password</h2><p>Use at least 8 characters.</p></div></div><form onSubmit={changePassword} className="stack-form"><input required type="password" placeholder="Current password" value={passwords.current_password} onChange={(e) => setPasswords({ ...passwords, current_password: e.target.value })} /><input required type="password" placeholder="New password" value={passwords.new_password} onChange={(e) => setPasswords({ ...passwords, new_password: e.target.value })} /><button className="btn-primary-custom compact">Update password</button></form></section>
          <section className="panel"><div className="panel-heading"><div><h2>Backup & restore</h2><p>Portable JSON database backup.</p></div></div><div className="backup-actions"><button onClick={backup}><i className="bi bi-download" /> Download backup</button><label><i className="bi bi-upload" /> Restore backup<input type="file" accept=".json" onChange={(e) => e.target.files[0] && restore(e.target.files[0])} /></label></div></section>
        </div>
      </div>
    </>
  );
}
