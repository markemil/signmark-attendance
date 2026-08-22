import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { useNavigate } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../hooks/useAuth";

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function formatElapsed(ms: number): string {
  const totalMinutes = Math.max(0, Math.floor(ms / 60000));
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}h ${m}m`;
}

export function EmployeeHome() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const status = useQuery(api.clockEvents.myStatus, token ? { token } : "skip");

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!status?.openSince) return;
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, [status?.openSince]);

  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null);

  const isOpen = !!status?.openSince;

  return (
    <main className="page-mobile" style={{ padding: "0 0 var(--space-4)" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 20px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              background: "var(--navy-900)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: 700,
              fontSize: "0.85rem",
            }}
          >
            {user?.name
              .split(" ")
              .map((p) => p[0])
              .slice(0, 2)
              .join("")
              .toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: "0.92rem" }}>Hi, {user?.name}</div>
            <div className="mono" style={{ fontSize: "0.7rem", color: "var(--ink-600)" }}>
              {status?.shiftDate}
            </div>
          </div>
        </div>
        <button className="btn btn-ghost" onClick={logout}>
          Log out
        </button>
      </div>

      <div
        style={{
          padding: "8px 24px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {status === undefined ? (
          <p style={{ color: "var(--ink-600)", padding: "40px 0" }}>Loading…</p>
        ) : (
          <>
            <div
              className="card"
              style={{
                width: "100%",
                padding: "28px 24px",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 14,
              }}
            >
              {isOpen ? (
                <>
                  <span className="pill pill-success">Currently clocked in</span>
                  <div
                    className="mono"
                    style={{ fontSize: "2.1rem", fontWeight: 500, color: "var(--navy-900)" }}
                  >
                    {formatElapsed(now - (status.openSince as number))}
                  </div>
                  <p style={{ fontSize: "0.85rem", color: "var(--ink-600)" }}>
                    Since <span className="mono">{formatTime(status.openSince as number)}</span>
                  </p>
                </>
              ) : (
                <>
                  <span className="pill pill-holiday">Not clocked in</span>
                  <p style={{ fontSize: "0.85rem", color: "var(--ink-600)" }}>
                    {status.events.length > 0
                      ? "Ready for your next shift."
                      : "Tap below when you start your shift."}
                  </p>
                </>
              )}
              <button
                className="btn btn-primary btn-block"
                style={{ marginTop: 10 }}
                onClick={() => navigate("/app/clock")}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="9" />
                  <circle cx="12" cy="12" r="3" fill="white" stroke="none" />
                </svg>
                {isOpen ? "Clock Out" : "Clock In"}
              </button>
            </div>

            <div style={{ width: "100%", marginTop: 28 }}>
              <div
                style={{
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  color: "var(--ink-600)",
                  marginBottom: 10,
                }}
              >
                {status.shiftDate === new Date().toISOString().slice(0, 10)
                  ? "Today"
                  : "This shift"}
              </div>

              {status.events.length === 0 && (
                <p style={{ color: "var(--ink-600)", fontSize: "0.85rem" }}>No punches yet.</p>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {status.events.map((e) => (
                  <div
                    key={e._id}
                    className="card"
                    style={{
                      padding: "14px 16px",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    {e.photoUrl ? (
                      <img
                        src={e.photoUrl}
                        alt="Tap to view full-size"
                        onClick={() => setViewingPhoto(e.photoUrl)}
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: 9,
                          objectFit: "cover",
                          flex: "none",
                          cursor: "pointer",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: 9,
                          background: "var(--blue-100)",
                          flex: "none",
                        }}
                      />
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>
                        Clocked {e.type === "IN" ? "In" : "Out"}
                      </div>
                      <div
                        className="mono"
                        style={{ fontSize: "0.75rem", color: "var(--ink-600)" }}
                      >
                        {formatTime(e.timestamp)}
                      </div>
                    </div>
                    <span className="pill pill-success">On time</span>
                  </div>
                ))}
              </div>

              {status.totalHoursSoFar > 0 && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "12px 4px 0",
                    fontSize: "0.85rem",
                    color: "var(--ink-600)",
                  }}
                >
                  <span>Total so far</span>
                  <span className="mono" style={{ color: "var(--navy-900)", fontWeight: 600 }}>
                    {formatElapsed(status.totalHoursSoFar * 60 * 60 * 1000)}
                  </span>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {viewingPhoto && (
        <div
          onClick={() => setViewingPhoto(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(11,30,57,0.85)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
            zIndex: 50,
          }}
        >
          <button
            onClick={() => setViewingPhoto(null)}
            aria-label="Close"
            style={{
              position: "absolute",
              top: 20,
              right: 20,
              background: "rgba(255,255,255,0.14)",
              border: "none",
              borderRadius: "50%",
              width: 40,
              height: 40,
              color: "#fff",
              fontSize: "1.1rem",
              cursor: "pointer",
            }}
          >
            ✕
          </button>
          <img
            src={viewingPhoto}
            alt="Clock-in/out photo, full size"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "100%",
              maxHeight: "100%",
              borderRadius: 14,
              boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
            }}
          />
        </div>
      )}
    </main>
  );
}
