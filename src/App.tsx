import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import Sidebar from "./components/layout/Sidebar";
import Navbar from "./components/layout/Navbar";
import ToastContainer from "./components/ui/toast-container";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";

// Direct imports for smooth SPA experience
import Dashboard from "./pages/Dashboard";
import Members from "./pages/Members";
import MemberProfile from "./pages/MemberProfile";
import Payments from "./pages/Payments";
import Attendance from "./pages/Attendance";
import QRAttendance from "./pages/QRAttendance";
import Staff from "./pages/Staff";
import StaffProfile from "./pages/StaffProfile";
import Reports from "./pages/Reportsold";
import ReportsNew from "./pages/ReportsNew";
import Settings from "./pages/Settings";
import Classes from "./pages/Classes";

const ProtectedLayout = React.memo(({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden bg-gray-100">
        <Navbar />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
          {children}
        </main>
      </div>
    </div>
  );
});

const AppRoutes = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={
          !isAuthenticated ? <Login /> : <Navigate to="/dashboard" replace />
        }
      />
      <Route
        path="/signup"
        element={
          !isAuthenticated ? <SignUp /> : <Navigate to="/dashboard" replace />
        }
      />
      <Route
        path="/*"
        element={
          <ProtectedLayout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/members" element={<Members />} />
              <Route path="/members/:id" element={<MemberProfile />} />
              <Route path="/payments/*" element={<Payments />} />
              <Route path="/attendance/*" element={<Attendance />} />
              <Route path="/qr-attendance" element={<QRAttendance />} />
              <Route path="/classes/*" element={<Classes />} />
              <Route path="/staff" element={<Staff />} />
              <Route path="/staff/:id" element={<StaffProfile />} />
              <Route path="/reports/*" element={<ReportsNew />} />
              <Route path="/reports-old/*" element={<Reports />} />
              <Route path="/settings/*" element={<Settings />} />
            </Routes>
          </ProtectedLayout>
        }
      />
    </Routes>
  );
};

function App() {
  return (
    <Router>
      <NotificationProvider>
        <AuthProvider>
          <Toaster richColors />
          <ToastContainer position="bottom-right" maxToasts={3} />
          <AppRoutes />
        </AuthProvider>
      </NotificationProvider>
    </Router>
  );
}

export default App;
