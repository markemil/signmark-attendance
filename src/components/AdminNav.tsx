import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export function AdminNav() {
  const { logout } = useAuth();
  const { pathname } = useLocation();

  const isDashboard = pathname === "/admin";
  const isHolidays = pathname.startsWith("/admin/holidays");

  return (
    <nav className="top-nav">
      <div className="top-nav-links">
        <Link to="/admin" className={`top-nav-link ${isDashboard ? "active" : ""}`}>
          Dashboard
        </Link>
        <Link to="/admin/holidays" className={`top-nav-link ${isHolidays ? "active" : ""}`}>
          Holidays
        </Link>
      </div>
      <button className="btn btn-secondary" onClick={logout}>
        Log out
      </button>
    </nav>
  );
}
