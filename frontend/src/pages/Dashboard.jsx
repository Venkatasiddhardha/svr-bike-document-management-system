import { useEffect, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Bar, BarChart } from "recharts";
import { api } from "../api";


const statConfig = [
  ["vehicles", "Total Vehicles", "bi-car-front", "blue"],
  ["documents", "Documents", "bi-folder2-open", "violet"],
  ["buyers", "Buyers", "bi-people", "cyan"],
  ["transactions", "Transactions", "bi-arrow-left-right", "green"],
];
const colors = ["#2f6fed", "#14b8a6", "#8b5cf6", "#f59e0b"];

export default function Dashboard() {
  const [data, setData] = useState(null);
  useEffect(() => { api.get("/dashboard/").then(({ data }) => setData(data)); }, []);
  if (!data) return <div className="page-loader"><span /></div>;
  const monthly = data.monthly_transactions.map((item) => ({ name: new Date(2024, item.transaction_date__month - 1).toLocaleString("en", { month: "short" }), total: Number(item.total) }));

  return (
    <>
      <div className="page-heading"><div><p className="eyebrow">Overview</p><h1>Dashboard</h1><span>Here is what is happening across your records.</span></div><div className="date-chip"><i className="bi bi-calendar3" />{new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</div></div>
      <div className="stat-grid">
        {statConfig.map(([key, label, icon, color]) => <div className="stat-card glass-card" key={key}><div className={`stat-icon ${color}`}><i className={`bi ${icon}`} /></div><div><span>{label}</span><strong>{data.stats[key]}</strong></div><i className="bi bi-arrow-up-right stat-arrow" /></div>)}
      </div>
      <div className="notification-strip">
        <i className="bi bi-bell-fill" /><strong>Attention needed</strong>
        <span>{data.notifications.expiring_insurance} insurance policies expiring soon</span>
        <span>{data.notifications.missing_rc} vehicles missing RC</span>
        <span>{data.notifications.missing_noc} vehicles missing NOC</span>
      </div>
      <div className="dashboard-grid">
        <section className="panel chart-wide"><div className="panel-heading"><div><h2>Transaction value</h2><p>Monthly performance this year</p></div></div><ResponsiveContainer width="100%" height={280}><BarChart data={monthly}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5eaf2" /><XAxis dataKey="name" axisLine={false} tickLine={false} /><YAxis axisLine={false} tickLine={false} /><Tooltip /><Bar dataKey="total" fill="#2f6fed" radius={[7, 7, 0, 0]} /></BarChart></ResponsiveContainer></section>
        <section className="panel"><div className="panel-heading"><div><h2>Vehicle status</h2><p>Current inventory split</p></div></div><ResponsiveContainer width="100%" height={220}><PieChart><Pie data={data.vehicle_status} dataKey="value" nameKey="status" innerRadius={58} outerRadius={84} paddingAngle={4}>{data.vehicle_status.map((_, index) => <Cell key={index} fill={colors[index % colors.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer><div className="legend-row">{data.vehicle_status.map((item, index) => <span key={item.status}><i style={{ background: colors[index % colors.length] }} />{item.status}: {item.value}</span>)}</div></section>
        <section className="panel activity-panel"><div className="panel-heading"><div><h2>Recent activity</h2><p>Latest changes in your workspace</p></div></div>{data.recent_activities.length ? data.recent_activities.map((item) => <div className="activity-item" key={item.id}><span className="activity-dot"><i className="bi bi-check2" /></span><div><strong>{item.description}</strong><small>{new Date(item.created_at).toLocaleString()}</small></div></div>) : <div className="empty-state">No activity recorded yet.</div>}</section>
      </div>
    </>
  );
}
