import { useQuery } from "convex/react";
import { Link } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../hooks/useAuth";
import { AdminNav } from "../components/AdminNav";

export function AdminDashboard() {
  const { token } = useAuth();
  const employees = useQuery(api.employees.listEmployees, token ? { token } : "skip");

  return (
    <main className="page-desktop" style={{ flexDirection: "column" }}>
      <AdminNav />

      <div style={{ padding: "28px 36px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: "var(--space-4)",
          }}
        >
          <div>
            <h1 style={{ fontSize: "1.5rem", color: "var(--navy-900)" }}>Dashboard</h1>
            <p style={{ color: "var(--ink-600)", marginTop: 4 }}>
              Here's your team. Click an employee to review their calendar.
            </p>
          </div>
          <Link to="/admin/employees/new" className="btn btn-primary">
            + Add Employee
          </Link>
        </div>

        <div className="card" style={{ overflow: "hidden" }}>
          <div
            style={{
              padding: "16px 20px",
              borderBottom: "1px solid var(--ink-300)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <h2 style={{ fontSize: "1rem" }}>Employees</h2>
            {employees && (
              <span className="mono" style={{ fontSize: "0.8rem", color: "var(--ink-600)" }}>
                {employees.length}
              </span>
            )}
          </div>

          {employees === undefined && (
            <div style={{ padding: "32px 20px", color: "var(--ink-600)" }}>Loading…</div>
          )}

          {employees && employees.length === 0 && (
            <div style={{ padding: "32px 20px", color: "var(--ink-600)" }}>
              No employees yet — add your first one to create their login.
            </div>
          )}

          {employees?.map((emp) => (
            <Link
              key={emp._id}
              to={`/admin/employees/${emp._id}/calendar`}
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr 1fr",
                alignItems: "center",
                padding: "13px 20px",
                borderBottom: "1px solid var(--ink-300)",
                gap: 12,
                color: "inherit",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {emp.profilePhotoUrl ? (
                  <img
                    src={emp.profilePhotoUrl}
                    alt=""
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      objectFit: "cover",
                      border: "1px solid var(--ink-300)",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      background: "var(--blue-100)",
                    }}
                  />
                )}
                <div>
                  <div style={{ fontWeight: 600 }}>{emp.fullName}</div>
                  <div className="mono" style={{ fontSize: "0.72rem", color: "var(--ink-600)" }}>
                    {emp.employeeCode}
                  </div>
                </div>
              </div>
              <div style={{ color: "var(--ink-600)" }}>{emp.department}</div>
              <div>
                <span
                  className={emp.status === "active" ? "pill pill-success" : "pill pill-warning"}
                >
                  {emp.status === "active" ? "Active" : "Inactive"}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
