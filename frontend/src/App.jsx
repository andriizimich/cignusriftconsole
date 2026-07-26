import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { ThemeProvider, useTheme } from "@/context/ThemeContext";
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
  <div className="cr-loader-screen"><div className="cr-spinner" /></div>
);

function ProtectedLayout() {
  const { user, loading } = useAuth();
  if (loading) return <Loader />;
  if (!user) return <Navigate to="/login" replace />;
  return <DashboardLayout />;
}

function TeacherGuard() {
  const { user } = useAuth();
  if (user?.role === "student") return <Navigate to="/dashboard/bookings" replace />;
  return <Outlet />;
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

      <Route path="/dashboard" element={<ProtectedLayout />}>
        <Route index element={<RoleHome />} />

        <Route element={<TeacherGuard />}>
          <Route path="lessons" element={<Lessons />} />
          <Route path="library" element={<Library />} />
          <Route path="lessons/new" element={<LessonForm />} />
          <Route path="lessons/:id" element={<LessonDetail />} />
          <Route path="lessons/:id/edit" element={<LessonForm />} />

          <Route path="groups" element={<Groups />} />
          <Route path="groups/new" element={<GroupForm />} />
          <Route path="groups/:id" element={<GroupDetail />} />
          <Route path="groups/:id/edit" element={<GroupForm />} />

          <Route path="bookings/new" element={<BookingForm />} />
          <Route path="bookings/:id" element={<BookingDetail />} />
        </Route>

        <Route path="bookings" element={<Bookings />} />
        <Route path="profile" element={<Profile />} />
        <Route path="profile/:tab" element={<Profile />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

const ThemedToaster = () => {
  const { theme } = useTheme();
  return <Toaster theme={theme} position="bottom-right" />;
};

export default function App() {
  return (
    <div className="App">
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <AppRouter />
            <ThemedToaster />
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </div>
  );
}
