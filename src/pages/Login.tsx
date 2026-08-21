import { useState, type FormEvent } from "react";
import { useMutation } from "convex/react";
import { useNavigate } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../hooks/useAuth";

export function Login() {
  const login = useMutation(api.auth.login);
  const { setToken } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const result = await login({ username, password });
      if (result.error || !result.token) {
        setError(result.error ?? "Incorrect username or password.");
        return;
      }
      setToken(result.token);
      navigate("/", { replace: true });
    } catch {
      setError("Something went wrong signing you in. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="page-mobile" style={{ justifyContent: "center", padding: "0 28px" }}>
      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}
      >
        <div style={{ marginBottom: "var(--space-3)" }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 9,
              background: "linear-gradient(135deg, var(--blue-500), var(--navy-900))",
            }}
          />
          <h1 style={{ fontSize: "1.5rem", color: "var(--navy-900)", marginTop: 14 }}>In-Out</h1>
          <p style={{ color: "var(--ink-600)", marginTop: 4 }}>Sign in to clock in or out.</p>
        </div>

        <div className="field">
          <label className="label" htmlFor="username">
            Username
          </label>
          <input
            id="username"
            className="input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="username"
            autoFocus
          />
        </div>

        <div className="field">
          <label className="label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>

        {error && (
          <div className="field-error">
            <p className="error-text">{error}</p>
          </div>
        )}

        <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
          {submitting ? "Signing in…" : "Sign in"}
        </button>

        <p style={{ fontSize: "0.78rem", color: "var(--ink-600)", textAlign: "center" }}>
          Forgot your login? Ask your admin — accounts are set up by them, not self-registered.
        </p>
      </form>
    </main>
  );
}
