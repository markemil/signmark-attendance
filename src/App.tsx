import { Navigate, Route, Routes } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { useAuth } from "./hooks/useAuth";
import { RequireRole } from "./routes/RequireRole";
import { Bootstrap } from "./pages/Bootstrap";
import { Login } from "./pages/Login";
import { EmployeeHome } from "./pages/EmployeeHome";
import { ClockCapture } from "./pages/ClockCapture";
import { AdminDashboard } from "./pages/AdminDashboard";
import { AdminNewEmployee } from "./pages/AdminNewEmployee";

function RootRedirect() {
  const needsBootstrap = useQuery(api.auth.needsBootstrap);
  const { status, user } = useAuth();

  if (needsBootstrap === undefined || status === "loading") return null;
  if (needsBootstrap) return <Navigate to="/setup" replace />;
  if (status !== "authed" || !user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === "admin" ? "/admin" : "/app"} replace />;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/setup" element={<Bootstrap />} />
      <Route path="/login" element={<Login />} />

      <Route
        path="/app"
        element={
          <RequireRole role="employee">
            <EmployeeHome />
          </RequireRole>
        }
      />
      <Route
        path="/app/clock"
        element={
          <RequireRole role="employee">
            <ClockCapture />
          </RequireRole>
        }
      />

      <Route
        path="/admin"
        element={
          <RequireRole role="admin">
            <AdminDashboard />
          </RequireRole>
        }
      />
      <Route
        path="/admin/employees/new"
        element={
          <RequireRole role="admin">
            <AdminNewEmployee />
          </RequireRole>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
