import { useAuth } from "../hooks/useAuth";

export function EmployeeHome() {
  const { user, logout } = useAuth();

  return (
    <main className="page-mobile" style={{ padding: "var(--space-3) 20px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "var(--space-4)",
        }}
      >
        <div>
          <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>Hi, {user?.name}</div>
          <div className="mono" style={{ fontSize: "0.75rem", color: "var(--ink-600)" }}>
            @{user?.username}
          </div>
        </div>
        <button className="btn btn-ghost" onClick={logout}>
          Log out
        </button>
      </div>

      <div
        className="card"
        style={{
          padding: "28px 24px",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 10,
        }}
      >
        <span className="pill pill-holiday">Coming next</span>
        <h1 style={{ fontSize: "1.1rem", color: "var(--navy-900)" }}>Clock in / out</h1>
        <p style={{ color: "var(--ink-600)", fontSize: "0.88rem" }}>
          The camera capture flow lands in the next epic. You're logged in and ready.
        </p>
      </div>
    </main>
  );
}
