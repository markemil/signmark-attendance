import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export function RequireRole({
  role,
  children,
}: {
  role: "admin" | "employee";
  children: ReactNode;
}) {
  const { status, user } = useAuth();

  if (status === "loading") return null;
  if (status !== "authed" || !user) return <Navigate to="/login" replace />;
  if (user.role !== role) {
    return <Navigate to={user.role === "admin" ? "/admin" : "/app"} replace />;
  }
  return <>{children}</>;
}
