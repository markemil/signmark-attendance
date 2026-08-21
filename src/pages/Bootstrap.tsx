import { useState, type FormEvent } from "react";
import { useMutation } from "convex/react";
import { useNavigate } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../hooks/useAuth";

export function Bootstrap() {
  const bootstrapAdmin = useMutation(api.auth.bootstrapAdmin);
  const { setToken } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const { token } = await bootstrapAdmin({ name, username, password });
      setToken(token);
      navigate("/admin", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't create the admin account.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "var(--space-4)",
      }}
    >
      <form
        onSubmit={handleSubmit}
        className="card"
        style={{
          width: "100%",
          maxWidth: 420,
          padding: "var(--space-5)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-3)",
        }}
      >
        <div>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 9,
              background: "linear-gradient(135deg, var(--blue-500), var(--navy-900))",
              marginBottom: 14,
            }}
          />
          <h1 style={{ fontSize: "1.4rem", color: "var(--navy-900)" }}>Set up In-Out</h1>
          <p style={{ color: "var(--ink-600)", marginTop: 6 }}>
            No account exists yet. Create the first Admin — this account creates every other login
            from here on, so there's no self-registration for anyone else.
          </p>
        </div>

        <div className="field">
          <label className="label" htmlFor="name">
            Your name
          </label>
          <input
            id="name"
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
          />
        </div>

        <div className="field">
          <label className="label" htmlFor="username">
            Admin username
          </label>
          <input
            id="username"
            className="input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="username"
          />
        </div>

        <div className="field">
          <label className="label" htmlFor="password">
            Admin password
          </label>
          <input
            id="password"
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
          />
          <span style={{ fontSize: "0.78rem", color: "var(--ink-600)" }}>
            At least 8 characters. Nothing is pre-set — choose it now.
          </span>
        </div>

        {error && (
          <div className="field-error">
            <p className="error-text">{error}</p>
          </div>
        )}

        <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
          {submitting ? "Creating account…" : "Create admin account"}
        </button>
      </form>
    </main>
  );
}
