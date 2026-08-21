import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { useNavigate } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { useAuth } from "../hooks/useAuth";
import { errorMessage as getErrorMessage } from "../lib/errorMessage";

type Stage = "requesting" | "live" | "denied" | "preview" | "uploading" | "error";

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function formatHours(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h <= 0) return `${m}m`;
  return `${h}h ${m}m`;
}

export function ClockCapture() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const status = useQuery(api.clockEvents.myStatus, token ? { token } : "skip");
  const generateUploadUrl = useMutation(api.clockEvents.generateUploadUrl);
  const clockIn = useMutation(api.clockEvents.clockIn);
  const clockOut = useMutation(api.clockEvents.clockOut);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [stage, setStage] = useState<Stage>("requesting");
  const [errorMessage, setErrorMessage] = useState("");
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [result, setResult] = useState<{
    type: "IN" | "OUT";
    timestamp: number;
    totalHours: number | null;
  } | null>(null);

  const mode: "IN" | "OUT" = status?.openSince ? "OUT" : "IN";

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setStage("live");
      } catch {
        if (!cancelled) setStage("denied");
      }
    }
    start();
    return () => {
      cancelled = true;
      stopStream();
    };
  }, [stopStream]);

  useEffect(() => {
    return () => {
      if (photoUrl) URL.revokeObjectURL(photoUrl);
    };
  }, [photoUrl]);

  function handleCapture() {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        setPhotoBlob(blob);
        setPhotoUrl(URL.createObjectURL(blob));
        setStage("preview");
      },
      "image/jpeg",
      0.85,
    );
  }

  function handleRetake() {
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    setPhotoUrl(null);
    setPhotoBlob(null);
    setStage("live");
  }

  async function handleConfirm() {
    if (!token || !photoBlob) return;
    setStage("uploading");
    try {
      const uploadUrl = await generateUploadUrl({ token });
      const uploadRes = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": photoBlob.type },
        body: photoBlob,
      });
      if (!uploadRes.ok) throw new Error("Upload failed. Try again.");
      const { storageId } = (await uploadRes.json()) as { storageId: Id<"_storage"> };

      stopStream();

      if (mode === "IN") {
        const r = await clockIn({ token, photoStorageId: storageId });
        setResult({ type: "IN", timestamp: r.timestamp, totalHours: null });
      } else {
        const r = await clockOut({ token, photoStorageId: storageId });
        setResult({ type: "OUT", timestamp: r.timestamp, totalHours: r.totalHours });
      }
    } catch (err) {
      setErrorMessage(getErrorMessage(err, "Something went wrong. Try again."));
      setStage("error");
    }
  }

  if (result) {
    return (
      <main className="page-mobile" style={{ justifyContent: "center", padding: "28px" }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 18,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: "var(--success-bg)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--success)"
              strokeWidth="2.5"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div style={{ textAlign: "center" }}>
            <h1 style={{ fontSize: "1.3rem", color: "var(--navy-900)" }}>
              Clocked {result.type === "IN" ? "in" : "out"}
            </h1>
            <p style={{ color: "var(--ink-600)", marginTop: 4 }}>
              Your photo and time have been recorded.
            </p>
          </div>

          <div
            className="card"
            style={{
              width: "100%",
              padding: 20,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 14,
            }}
          >
            {photoUrl && (
              <img
                src={photoUrl}
                alt=""
                style={{
                  width: 120,
                  height: 150,
                  borderRadius: 14,
                  objectFit: "cover",
                  border: "3px solid #fff",
                  boxShadow: "0 2px 10px rgba(11,30,57,0.12)",
                }}
              />
            )}
            <span
              className="pill"
              style={{ background: "var(--blue-100)", color: "var(--blue-700)" }}
            >
              {result.type}
            </span>
            <div
              className="mono"
              style={{ fontSize: "1.5rem", fontWeight: 500, color: "var(--navy-900)" }}
            >
              {formatTime(result.timestamp)}
            </div>
            {result.totalHours !== null && (
              <div
                style={{
                  width: "100%",
                  borderTop: "1px solid var(--ink-300)",
                  paddingTop: 14,
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <span style={{ fontSize: "0.85rem", color: "var(--ink-600)" }}>
                  Total this shift
                </span>
                <span className="mono" style={{ fontWeight: 600, color: "var(--navy-900)" }}>
                  {formatHours(result.totalHours)}
                </span>
              </div>
            )}
          </div>

          <button
            className="btn btn-primary btn-block"
            onClick={() => navigate("/app", { replace: true })}
          >
            Done
          </button>
        </div>
      </main>
    );
  }

  if (stage === "denied") {
    return (
      <main className="page-mobile" style={{ justifyContent: "center", padding: "28px" }}>
        <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 14 }}>
          <h1 style={{ fontSize: "1.15rem", color: "var(--navy-900)" }}>Camera access needed</h1>
          <p style={{ color: "var(--ink-600)" }}>
            In-Out only accepts a live photo — allow camera access in your browser settings, then
            try again.
          </p>
          <button className="btn btn-secondary btn-block" onClick={() => navigate("/app")}>
            Back
          </button>
        </div>
      </main>
    );
  }

  if (stage === "error") {
    return (
      <main className="page-mobile" style={{ justifyContent: "center", padding: "28px" }}>
        <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 14 }}>
          <h1 style={{ fontSize: "1.15rem", color: "var(--navy-900)" }}>Couldn't record that</h1>
          <p className="error-text">{errorMessage}</p>
          <button className="btn btn-primary btn-block" onClick={() => setStage("preview")}>
            Try again
          </button>
          <button className="btn btn-secondary btn-block" onClick={() => navigate("/app")}>
            Cancel
          </button>
        </div>
      </main>
    );
  }

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 480,
        margin: "0 auto",
        minHeight: "100%",
        background: "#0B1E39",
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: stage === "live" ? "block" : "none",
        }}
      />

      {stage === "preview" && photoUrl && (
        <img
          src={photoUrl}
          alt="Captured preview"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      )}

      {(stage === "requesting" || stage === "uploading") && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "rgba(255,255,255,0.7)",
            fontSize: "0.9rem",
          }}
        >
          {stage === "requesting" ? "Starting camera…" : "Recording your punch…"}
        </div>
      )}

      <div
        style={{
          position: "relative",
          zIndex: 1,
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.75rem",
            background: "rgba(255,255,255,0.14)",
            color: "#fff",
            padding: "6px 12px",
            borderRadius: 999,
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span
            style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--blue-500)" }}
          />
          Clocking {mode}
        </span>
        <button
          onClick={() => navigate("/app")}
          aria-label="Cancel"
          style={{ background: "none", border: "none", cursor: "pointer", padding: 6 }}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="rgba(255,255,255,0.85)"
            strokeWidth="2"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div style={{ flex: 1 }} />

      {stage === "live" && (
        <div
          style={{
            position: "relative",
            zIndex: 1,
            padding: "0 0 44px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <button
            onClick={handleCapture}
            aria-label="Capture photo"
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              background: "#fff",
              border: "5px solid rgba(255,255,255,0.35)",
              cursor: "pointer",
            }}
          />
        </div>
      )}

      {stage === "preview" && (
        <div
          style={{
            position: "relative",
            zIndex: 1,
            padding: "0 24px 40px",
            display: "flex",
            gap: 12,
          }}
        >
          <button className="btn btn-secondary" style={{ flex: 1 }} onClick={handleRetake}>
            Retake
          </button>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleConfirm}>
            Use photo
          </button>
        </div>
      )}

      <div style={{ position: "relative", zIndex: 1, textAlign: "center", paddingBottom: 20 }}>
        <p style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.45)" }}>
          Live camera only — photos can&apos;t be uploaded from your gallery
        </p>
      </div>
    </div>
  );
}
