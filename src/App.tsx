// (service worker removed)
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import LandingPageRoute from "./pages/LandingPage";
import ClientDashboardPage from "./pages/ClientDashboardPage";
import CBODashboardPage from "./pages/CBODashboardPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import AdminPasskeyPage from "../src/pages/AdminPasskeyPage";
import AdminLoginPage from "../src/pages/AdminLoginPage";
import StaffAuthPage from "./pages/StaffAuthPage";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { RequireAuth } from "./routes/RequireAuth";

function AppRoutes() {
  const { isLoading } = useAuth();
  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          background: "#F9FAFB",
        }}
      >
        <div className="animate-spin rounded-full h-9 w-9 border-[3px] border-gray-200 border-t-teal-600" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<LandingPageRoute />} />
      <Route path="/admin-passkey" element={<AdminPasskeyPage />} />
      <Route path="/admin-login" element={<AdminLoginPage />} />
      <Route path="/staff-login" element={<StaffAuthPage />} />
      <Route
        path="/client/*"
        element={
          <RequireAuth role="community_member">
            <ClientDashboardPage />
          </RequireAuth>
        }
      />
      <Route
        path="/cbo/*"
        element={
          <RequireAuth role="organization">
            <CBODashboardPage />
          </RequireAuth>
        }
      />
      <Route
        path="/admin/*"
        element={
          <RequireAuth role="admin">
            <AdminDashboardPage />
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-white">
            <AppRoutes />
          </div>
        </BrowserRouter>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
