import { useState } from "react";
import { useAuth } from "../auth";
import { errorMessage } from "../api";
import logo from "./login.png";

export default function Login() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login(form.username, form.password);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-orb orb-one" />
      <div className="login-orb orb-two" />
      <div className="login-card glass-card">
        <div className="login-logo">
          <img src={logo} alt="SVR Auto Consultancy" />
        
        </div>
        <h1>Welcome back</h1>
        <p>Secure owner access to your document workspace.</p>
        {error && <div className="alert alert-danger py-2">{error}</div>}
        <form onSubmit={submit}>
          <label>Username</label>
          <div className="input-icon"><i className="bi bi-person" /><input required value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /></div>
          <label>Password</label>
          <div className="input-icon"><i className="bi bi-lock" /><input required type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
          <button className="btn-primary-custom" disabled={loading}>{loading ? "Signing in..." : "Sign in securely"}</button>
        </form>
      </div>
    </div>
  );
}
