import { api } from "../api";

const reports = [
  ["vehicles", "Vehicle Register", "Complete vehicle inventory and status", "bi-car-front"],
  ["documents", "Document Register", "Document types, numbers and expiry dates", "bi-folder2-open"],
  ["transactions", "Transaction Report", "Purchase, sale and transfer history", "bi-arrow-left-right"],
];

export default function Reports() {
  const download = async (type, format) => {
    const response = await api.get(`/reports/${type}/${format}/`, { responseType: "blob" });
    const url = URL.createObjectURL(response.data);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${type}.${format === "excel" ? "xlsx" : "pdf"}`;
    anchor.click();
    URL.revokeObjectURL(url);
  };
  return (
    <>
      <div className="page-heading"><div><p className="eyebrow">Analytics</p><h1>Reports</h1><span>Export operational data in presentation-ready formats.</span></div></div>
      <div className="report-grid">{reports.map(([type, title, description, icon]) => <article className="report-card panel" key={type}><div className="report-icon"><i className={`bi ${icon}`} /></div><h2>{title}</h2><p>{description}</p><div><button onClick={() => download(type, "pdf")}><i className="bi bi-file-earmark-pdf" /> PDF</button><button onClick={() => download(type, "excel")}><i className="bi bi-file-earmark-excel" /> Excel</button></div></article>)}</div>
    </>
  );
}
