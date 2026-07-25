import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import AuthCallback from "@/pages/AuthCallback";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ForgotPassword from "@/pages/ForgotPassword";
import Summary from "@/pages/Summary";
import Lessons from "@/pages/Lessons";
import Library from "@/pages/Library";
import LessonDetail from "@/pages/LessonDetail";
import LessonForm from "@/pages/LessonForm";
import Groups from "@/pages/Groups";
import GroupDetail from "@/pages/GroupDetail";
import GroupForm from "@/pages/GroupForm";
import Bookings from "@/pages/Bookings";
import BookingDetail from "@/pages/BookingDetail";
import BookingForm from "@/pages/BookingForm";
import Profile from "@/pages/Profile";

const Loader = () => (
  <div className="flex min-h-screen items-center justify-center bg-[#050505]"><div className="h-10 w-10 rounded-full border-2 border-[#0066FF] border-t-transparent animate-spin" /></div>
);

function Protected({ children, teacherOnly }) {
  const { user, loading } = useAuth();
  if (loading) return <Loader />;
  if (!user) return <Navigate to="/login" replace />;
  if (teacherOnly && user.role === "student") return <Navigate to="/dashboard/bookings" replace />;
  return <DashboardLayout>{children}</DashboardLayout>;
}

function RoleHome() {
  const { user } = useAuth();
  if (user?.role === "student") return <Navigate to="/dashboard/bookings" replace />;
  return <Summary />;
}

function AppRouter() {
  const location = useLocation();
  if (location.hash?.includes("session_id=")) return <AuthCallback />;
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      <Route path="/dashboard" element={<Protected><RoleHome /></Protected>} />

      <Route path="/dashboard/lessons" element={<Protected teacherOnly><Lessons /></Protected>} />
      <Route path="/dashboard/library" element={<Protected teacherOnly><Library /></Protected>} />
      <Route path="/dashboard/lessons/new" element={<Protected teacherOnly><LessonForm /></Protected>} />
      <Route path="/dashboard/lessons/:id" element={<Protected teacherOnly><LessonDetail /></Protected>} />
      <Route path="/dashboard/lessons/:id/edit" element={<Protected teacherOnly><LessonForm /></Protected>} />

      <Route path="/dashboard/groups" element={<Protected teacherOnly><Groups /></Protected>} />
      <Route path="/dashboard/groups/new" element={<Protected teacherOnly><GroupForm /></Protected>} />
      <Route path="/dashboard/groups/:id" element={<Protected teacherOnly><GroupDetail /></Protected>} />
      <Route path="/dashboard/groups/:id/edit" element={<Protected teacherOnly><GroupForm /></Protected>} />

      <Route path="/dashboard/bookings" element={<Protected><Bookings /></Protected>} />
      <Route path="/dashboard/bookings/new" element={<Protected teacherOnly><BookingForm /></Protected>} />
      <Route path="/dashboard/bookings/:id" element={<Protected teacherOnly><BookingDetail /></Protected>} />

      <Route path="/dashboard/profile" element={<Protected><Profile /></Protected>} />
      <Route path="/dashboard/profile/:tab" element={<Protected><Profile /></Protected>} />

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
