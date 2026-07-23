import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import AuthCallback from "@/pages/AuthCallback";
import Login from "@/pages/Login";
import Summary from "@/pages/Summary";
import Sessions from "@/pages/Sessions";
import SessionDetail from "@/pages/SessionDetail";
import Groups from "@/pages/Groups";
import GroupDetail from "@/pages/GroupDetail";
import GroupForm from "@/pages/GroupForm";
import Orders from "@/pages/Orders";
import OrderDetail from "@/pages/OrderDetail";
import Checkout from "@/pages/Checkout";
import Profile from "@/pages/Profile";

const Loader = () => (
  <div className="flex min-h-screen items-center justify-center bg-[#050505]">
    <div className="h-10 w-10 rounded-full border-2 border-[#0066FF] border-t-transparent animate-spin" />
  </div>
);

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Loader />;
  if (!user) return <Navigate to="/login" replace />;
  return <DashboardLayout>{children}</DashboardLayout>;
}

function AppRouter() {
  const location = useLocation();
  if (location.hash?.includes("session_id=")) return <AuthCallback />;

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<Protected><Summary /></Protected>} />
      <Route path="/dashboard/sessions" element={<Protected><Sessions /></Protected>} />
      <Route path="/dashboard/sessions/:id" element={<Protected><SessionDetail /></Protected>} />
      <Route path="/dashboard/groups" element={<Protected><Groups /></Protected>} />
      <Route path="/dashboard/groups/new" element={<Protected><GroupForm /></Protected>} />
      <Route path="/dashboard/groups/:id" element={<Protected><GroupDetail /></Protected>} />
      <Route path="/dashboard/groups/:id/edit" element={<Protected><GroupForm /></Protected>} />
      <Route path="/dashboard/orders" element={<Protected><Orders /></Protected>} />
      <Route path="/dashboard/orders/new" element={<Protected><Checkout /></Protected>} />
      <Route path="/dashboard/orders/:id" element={<Protected><OrderDetail /></Protected>} />
      <Route path="/dashboard/profile" element={<Protected><Profile /></Protected>} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <div className="App">
      <AuthProvider>
        <BrowserRouter>
          <AppRouter />
          <Toaster theme="dark" position="bottom-right" />
        </BrowserRouter>
      </AuthProvider>
    </div>
  );
}
