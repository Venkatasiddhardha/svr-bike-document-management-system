import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../api";

export default function Search() {
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState(params.get("q") || "");
  const [results, setResults] = useState(null);
  const [smart, setSmart] = useState(null);
  const run = async (text = query) => { if (text.trim().length > 1) { const { data } = await api.get(`/search/?q=${encodeURIComponent(text)}`); setResults(data); setParams({ q: text }); } };
  useEffect(() => { if (query) run(query); }, []);
  const voice = () => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) return alert("Voice search is not supported in this browser.");
    const recognition = new Recognition();
    recognition.lang = "en-IN";
    recognition.onresult = (event) => { const text = event.results[0][0].transcript; setQuery(text); run(text); };
    recognition.start();
  };
  const smartRun = async () => { const { data } = await api.post("/smart-search/", { query }); setSmart(data); };
  return (
    <>
      <div className="page-heading"><div><p className="eyebrow">Discovery</p><h1>Smart Search</h1><span>Find records using exact identifiers or natural language.</span></div></div>
      <section className="search-hero panel"><div className="smart-search-box"><i className="bi bi-stars" /><input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && run()} placeholder='Try "insurance for TS09" or a chassis number' /><button onClick={voice} title="Voice search"><i className="bi bi-mic-fill" /></button><button className="search-submit" onClick={() => run()}>Search</button></div><button className="ai-button" onClick={smartRun}><i className="bi bi-lightning-charge-fill" /> Interpret with Smart Search</button></section>
      {smart && <div className="smart-note"><i className="bi bi-stars" />{smart.interpretation} Found {smart.results.length} vehicles.</div>}
      {results && <div className="search-results">{Object.entries(results).map(([group, rows]) => <section className="panel" key={group}><div className="panel-heading"><div><h2>{group}</h2><p>{rows.length} matches</p></div></div>{rows.map((row) => <div className="result-row" key={`${group}-${row.id}`}><span><i className={`bi ${group === "vehicles" ? "bi-car-front" : group === "documents" ? "bi-file-earmark" : "bi-person"}`} /></span><div><strong>{row.registration_number || row.vehicle_registration || row.name || row.reference_number || row.title}</strong><small>{row.engine_number || row.document_number || row.phone || row.transaction_type}</small></div></div>)}{!rows.length && <div className="empty-state py-3">No matches</div>}</section>)}</div>}
    </>
  );
}
