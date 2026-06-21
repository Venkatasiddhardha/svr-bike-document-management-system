import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../auth";
import svrIcon from "../pages/svr-icon.png";


export default function Layout() {
  const { user, logout } = useAuth();
  return (
    <div className="simple-shell">
      <header className="simple-header">
        <NavLink to="/" className="simple-brand">
          <span className="brand-logo">
  <img src={svrIcon} alt="SVR Auto Consultancy" />
</span>
          <div>
            <strong>SVR</strong>
            <small>Bike Records Management</small>
          </div>
        </NavLink>
        <nav className="simple-nav">
          <NavLink to="/" end><i className="bi bi-list-ul" /> Bike Records</NavLink>
          <NavLink to="/add-bike"><i className="bi bi-plus-circle" /> Add Bike</NavLink>
        </nav>
        <div className="simple-owner">
          <span>{user?.username}</span>
          <button onClick={logout} title="Sign out"><i className="bi bi-box-arrow-right" /></button>
        </div>
      </header>
      <main className="simple-content"><Outlet /></main>
    </div>
  );
}
