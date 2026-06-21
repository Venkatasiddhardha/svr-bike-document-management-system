import { useEffect, useState } from "react";
import { api, errorMessage } from "../api";

export default function Documents() {
  const [documents, setDocuments] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ vehicle: "", document_type: "rc", title: "", document_number: "", issue_date: "", expiry_date: "", file: null });
  const load = () => Promise.all([api.get("/documents/"), api.get("/vehicles/?page_size=100")]).then(([docs, cars]) => { setDocuments(docs.data.results || docs.data); setVehicles(cars.data.results || cars.data); });
  useEffect(() => { load(); }, []);
  const openFile = async (doc, mode) => {
    const response = await api.get(`/documents/${doc.id}/${mode}/`, { responseType: "blob" });
    const url = URL.createObjectURL(response.data);
    if (mode === "preview") window.open(url, "_blank", "noopener,noreferrer");
    else {
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = doc.file?.split("/").pop() || `${doc.title}.${response.data.type.split("/").pop()}`;
      anchor.click();
    }
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  };
  const save = async (event) => {
    event.preventDefault();
    const payload = new FormData();
    Object.entries(form).forEach(([key, value]) => value && payload.append(key, value));
    try { await api.post("/documents/", payload); setShow(false); load(); } catch (err) { setError(errorMessage(err)); }
  };
  const remove = async (id) => { if (window.confirm("Delete this document?")) { await api.delete(`/documents/${id}/`); load(); } };
  return (
    <>
      <div className="page-heading"><div><p className="eyebrow">Repository</p><h1>Documents</h1><span>RC, NOC, insurance and supporting files in one place.</span></div><button className="btn-primary-custom compact" onClick={() => setShow(true)}><i className="bi bi-cloud-arrow-up" /> Upload document</button></div>
      <div className="document-grid">{documents.map((doc) => <article className="document-card panel" key={doc.id}><div className={`file-icon ${doc.document_type}`}><i className={`bi ${doc.file?.toLowerCase().endsWith(".pdf") ? "bi-file-earmark-pdf" : "bi-file-earmark-image"}`} /></div><div className="document-body"><span className="type-badge">{doc.document_type}</span><h3>{doc.title}</h3><p>{doc.vehicle_registration} · {doc.document_number || "No reference number"}</p><small>{doc.expiry_date ? `Expires ${new Date(doc.expiry_date).toLocaleDateString()}` : "No expiry date"}</small></div><div className="document-actions"><button onClick={() => openFile(doc, "preview")} title="Preview"><i className="bi bi-eye" /></button><button onClick={() => openFile(doc, "download")} title="Download"><i className="bi bi-download" /></button><button onClick={() => remove(doc.id)}><i className="bi bi-trash3" /></button></div></article>)}</div>
      {!documents.length && <div className="panel empty-state"><i className="bi bi-folder2-open" />No documents uploaded yet.</div>}
      {show && <div className="modal-layer"><div className="form-modal panel"><div className="panel-heading"><div><h2>Upload document</h2><p>PDF, JPG or PNG up to 10 MB.</p></div><button className="close-button" onClick={() => setShow(false)}><i className="bi bi-x-lg" /></button></div>{error && <div className="alert alert-danger">{error}</div>}<form className="form-grid" onSubmit={save}><label><span>Vehicle *</span><select required value={form.vehicle} onChange={(e) => setForm({ ...form, vehicle: e.target.value })}><option value="">Select vehicle...</option>{vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.registration_number}</option>)}</select></label><label><span>Document type *</span><select value={form.document_type} onChange={(e) => setForm({ ...form, document_type: e.target.value })}><option value="rc">RC</option><option value="noc">NOC</option><option value="insurance">Insurance</option><option value="other">Other</option></select></label><label><span>Title *</span><input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label><label><span>Document number</span><input value={form.document_number} onChange={(e) => setForm({ ...form, document_number: e.target.value })} /></label><label><span>Issue date</span><input type="date" value={form.issue_date} onChange={(e) => setForm({ ...form, issue_date: e.target.value })} /></label><label><span>Expiry date</span><input type="date" value={form.expiry_date} onChange={(e) => setForm({ ...form, expiry_date: e.target.value })} /></label><label className="full upload-zone"><i className="bi bi-cloud-arrow-up" /><span>{form.file?.name || "Choose PDF, JPG or PNG"}</span><input required type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setForm({ ...form, file: e.target.files[0] })} /></label><div className="form-actions full"><button type="button" className="btn-light-custom" onClick={() => setShow(false)}>Cancel</button><button className="btn-primary-custom compact">Upload</button></div></form></div></div>}
    </>
  );
}
