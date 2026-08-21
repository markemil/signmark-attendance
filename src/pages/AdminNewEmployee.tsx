import { useState, type FormEvent } from "react";
import { useMutation } from "convex/react";
import { useNavigate } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { useAuth } from "../hooks/useAuth";

export function AdminNewEmployee() {
  const { token } = useAuth();
  const generateUploadUrl = useMutation(api.employees.generateUploadUrl);
  const createEmployee = useMutation(api.employees.createEmployee);
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [employeeCode, setEmployeeCode] = useState("");
  const [department, setDepartment] = useState("");
  const [position, setPosition] = useState("");
  const [email, setEmail] = useState("");
  const [dateHired, setDateHired] = useState(() => new Date().toISOString().slice(0, 10));
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setError(null);

    if (!photoFile) {
      setError("A profile photo is required — it's what admins compare against during disputes.");
      return;
    }

    setSubmitting(true);
    try {
      const uploadUrl = await generateUploadUrl({ token });
      const uploadResult = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": photoFile.type },
        body: photoFile,
      });
      if (!uploadResult.ok) throw new Error("Photo upload failed. Try again.");
      const { storageId } = (await uploadResult.json()) as { storageId: Id<"_storage"> };

      await createEmployee({
        token,
        fullName,
        employeeCode,
        department,
        position,
        email,
        dateHired,
        profilePhotoStorageId: storageId,
        username,
        password,
      });

      navigate("/admin", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't create this employee.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="page-desktop" style={{ justifyContent: "center", padding: "40px 24px" }}>
      <form
        onSubmit={handleSubmit}
        className="card"
        style={{
          width: "100%",
          maxWidth: 520,
          padding: "var(--space-5)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-3)",
        }}
      >
        <div>
          <h1 style={{ fontSize: "1.3rem", color: "var(--navy-900)" }}>Add employee</h1>
          <p style={{ color: "var(--ink-600)", marginTop: 4 }}>
            Creates their record and their login in one step.
          </p>
        </div>

        <div className="field">
          <label className="label" htmlFor="fullName">
            Full name
          </label>
          <input
            id="fullName"
            className="input"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
          <div className="field">
            <label className="label" htmlFor="employeeCode">
              Employee code
            </label>
            <input
              id="employeeCode"
              className="input"
              value={employeeCode}
              onChange={(e) => setEmployeeCode(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label className="label" htmlFor="dateHired">
              Date hired
            </label>
            <input
              id="dateHired"
              type="date"
              className="input"
              value={dateHired}
              onChange={(e) => setDateHired(e.target.value)}
              required
            />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
          <div className="field">
            <label className="label" htmlFor="department">
              Department
            </label>
            <input
              id="department"
              className="input"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label className="label" htmlFor="position">
              Position
            </label>
            <input
              id="position"
              className="input"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="field">
          <label className="label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="field">
          <label className="label" htmlFor="photo">
            Profile photo
          </label>
          <input
            id="photo"
            type="file"
            accept="image/*"
            onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
          />
        </div>

        <div style={{ borderTop: "1px solid var(--ink-300)", paddingTop: "var(--space-3)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
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
                autoComplete="off"
              />
            </div>
            <div className="field">
              <label className="label" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="field-error">
            <p className="error-text">{error}</p>
          </div>
        )}

        <div style={{ display: "flex", gap: 10 }}>
          <button type="button" className="btn btn-secondary" onClick={() => navigate("/admin")}>
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            style={{ flex: 1 }}
            disabled={submitting}
          >
            {submitting ? "Creating…" : "Create employee"}
          </button>
        </div>
      </form>
    </main>
  );
}
