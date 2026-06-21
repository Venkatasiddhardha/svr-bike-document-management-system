import { useEffect, useMemo, useState } from "react";
import { api, errorMessage } from "../api";

const emptyFrom = (fields = []) => Object.fromEntries(fields.map((field) => [field.name, field.type === "number" ? "" : ""]));
const pretty = (name) => name.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

export default function EntityManager({ title, endpoint, createEndpoint, fixedValues = {}, fields = [], columns, readOnly = false }) {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(emptyFrom(fields));
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [show, setShow] = useState(false);

  const baseEndpoint = createEndpoint || endpoint.split("?")[0];
  const load = async () => {
    const separator = endpoint.includes("?") ? "&" : "?";
    const { data } = await api.get(`${endpoint}${search ? `${separator}search=${encodeURIComponent(search)}` : ""}`);
    setRows(data.results || data);
  };
  useEffect(() => { load(); }, [endpoint, search]);
  const displayColumns = useMemo(() => columns || Object.keys(rows[0] || {}).slice(0, 5), [columns, rows]);

  const openForm = (row = null) => {
    setEditing(row);
    setForm(row ? Object.fromEntries(fields.map((f) => [f.name, row[f.name] ?? ""])) : emptyFrom(fields));
    setShow(true);
    setError("");
  };
  const save = async (event) => {
    event.preventDefault();
    setError("");
    const payload = { ...form, ...fixedValues };
    Object.keys(payload).forEach((key) => payload[key] === "" && delete payload[key]);
    try {
      if (editing) await api.patch(`${baseEndpoint}${editing.id}/`, payload);
      else await api.post(baseEndpoint, payload);
      setShow(false);
      await load();
    } catch (err) { setError(errorMessage(err)); }
  };
  const remove = async (id) => {
    if (!window.confirm("Delete this record? This action cannot be undone.")) return;
    await api.delete(`${baseEndpoint}${id}/`);
    load();
  };

  return (
    <>
      <div className="page-heading"><div><p className="eyebrow">Management</p><h1>{title}</h1><span>Search, review and maintain {title.toLowerCase()}.</span></div>{!readOnly && <button className="btn-primary-custom compact" onClick={() => openForm()}><i className="bi bi-plus-lg" /> Add {title.slice(0, -1)}</button>}</div>
      <section className="panel">
        <div className="table-toolbar"><div className="table-search"><i className="bi bi-search" /><input placeholder={`Search ${title.toLowerCase()}...`} value={search} onChange={(e) => setSearch(e.target.value)} /></div><span>{rows.length} records</span></div>
        <div className="table-responsive"><table className="table modern-table"><thead><tr>{displayColumns.map((column) => <th key={column}>{pretty(column)}</th>)}{!readOnly && <th />}</tr></thead><tbody>{rows.map((row) => <tr key={row.id}>{displayColumns.map((column) => <td key={column}>{column.includes("date") || column === "created_at" ? (row[column] ? new Date(row[column]).toLocaleDateString() : "—") : row[column] ?? "—"}</td>)}{!readOnly && <td className="actions"><button onClick={() => openForm(row)}><i className="bi bi-pencil" /></button><button className="danger" onClick={() => remove(row.id)}><i className="bi bi-trash3" /></button></td>}</tr>)}</tbody></table></div>
        {!rows.length && <div className="empty-state"><i className="bi bi-inbox" />No records found.</div>}
      </section>
      {show && <div className="modal-layer"><div className="form-modal panel"><div className="panel-heading"><div><h2>{editing ? "Edit" : "Add"} {title.slice(0, -1)}</h2><p>Fields marked required must be completed.</p></div><button className="close-button" onClick={() => setShow(false)}><i className="bi bi-x-lg" /></button></div>{error && <div className="alert alert-danger">{error}</div>}<form onSubmit={save} className="form-grid">{fields.map((field) => <label key={field.name} className={field.type === "textarea" ? "full" : ""}><span>{field.label}{field.required && " *"}</span>{field.type === "select" ? <select required={field.required} value={form[field.name]} onChange={(e) => setForm({ ...form, [field.name]: e.target.value })}><option value="">Select...</option>{field.options.map((option) => <option key={option} value={option}>{pretty(option)}</option>)}</select> : field.type === "textarea" ? <textarea rows="3" value={form[field.name]} onChange={(e) => setForm({ ...form, [field.name]: e.target.value })} /> : <input required={field.required} type={field.type || "text"} step={field.type === "number" ? "any" : undefined} value={form[field.name]} onChange={(e) => setForm({ ...form, [field.name]: e.target.value })} />}</label>)}<div className="form-actions full"><button type="button" className="btn-light-custom" onClick={() => setShow(false)}>Cancel</button><button className="btn-primary-custom compact">Save record</button></div></form></div></div>}
    </>
  );
}
