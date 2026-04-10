import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { LandingPage } from "./components/LandingPage";
import { ClientDashboard } from "./components/client/ClientDashboard";
import { CBODashboard } from "./components/cbo/CBODashboard";
import { AdminDashboard } from "./components/admin/AdminDashboard";
import AdminPasskeyPage from "./pages/AdminPasskeyPage";
import AdminLoginPage from "./pages/AdminLoginPage";
import StaffAuthPage from "./pages/StaffAuthPage";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { RequireAuth } from "./routes/RequireAuth";

function AppRoutes() {
  const { isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-9 w-9 border-[3px] border-gray-200 border-t-teal-600" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/admin-passkey" element={<AdminPasskeyPage />} />
      <Route path="/admin-login" element={<AdminLoginPage />} />
      <Route path="/staff-login" element={<StaffAuthPage />} />
      <Route
        path="/client/*"
        element={
          <RequireAuth role="community_member">
            <ClientDashboard />
          </RequireAuth>
        }
      />
      <Route
        path="/cbo/*"
        element={
          <RequireAuth role="organization">
            <CBODashboard />
          </RequireAuth>
        }
      />
      <Route
        path="/admin/*"
        element={
          <RequireAuth role="admin">
            <AdminDashboard />
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
