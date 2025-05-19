import React, { Suspense, lazy } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import ToastContainer from "./components/ui/toast-container";
import ProtectedRoute from "./components/ProtectedRoute";
import PersistentLayoutFallback from "./components/layout/PersistentLayoutFallback";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";

// Try to dynamically import the framer-motion layout
// If it fails, we'll use the fallback layout
const PersistentLayout = lazy(() =>
  import("./components/layout/PersistentLayout")
    .catch(() => import("./components/layout/PersistentLayoutFallback"))
);

// Lazy load pages with better naming for code splitting
const Dashboard = React.lazy(() => import("./pages/Dashboard"));
const Members = React.lazy(() => import("./pages/Members"));
const MemberProfile = React.lazy(() => import("./pages/MemberProfile"));
const Payments = React.lazy(() => import("./pages/Payments"));
const Attendance = React.lazy(() => import("./pages/Attendance"));
const QRAttendance = React.lazy(() => import("./pages/QRAttendance"));
const Staff = React.lazy(() => import("./pages/Staff"));
const StaffProfile = React.lazy(() => import("./pages/StaffProfile"));
const Reports = React.lazy(() => import("./pages/Reportsold"));
const ReportsNew = React.lazy(() => import("./pages/ReportsNew"));
const Settings = React.lazy(() => import("./pages/Settings"));
const Classes = React.lazy(() => import("./pages/Classes"));

// Loading fallback for lazy-loaded components
const LoadingFallback = () => (
  <div className="flex items-center justify-center h-full">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

/**
 * Auth guard component that redirects to login if not authenticated
 */
const RequireAuth = () => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

/**
 * Public routes guard that redirects to dashboard if already authenticated
 */
const PublicOnly = () => {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

/**
 * Wraps a component with Suspense for lazy loading
 */
const LazyWrapper = ({ component: Component }: { component: React.ComponentType }) => (
  <Suspense fallback={<LoadingFallback />}>
    <Component />
  </Suspense>
);

/**
 * Main routing configuration
 */
const AppRoutes = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route element={<PublicOnly />}>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
      </Route>

      {/* Protected routes with persistent layout */}
      <Route element={<RequireAuth />}>
        <Route element={
          <Suspense fallback={<LoadingFallback />}>
            <PersistentLayout />
          </Suspense>
        }>
          {/* Dashboard */}
          <Route path="/" element={
            <ProtectedRoute requiredPermission="dashboard:view">
              <LazyWrapper component={Dashboard} />
            </ProtectedRoute>
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute requiredPermission="dashboard:view">
              <LazyWrapper component={Dashboard} />
            </ProtectedRoute>
          } />

          {/* Members */}
          <Route path="/members" element={
            <ProtectedRoute requiredPermission="members:view">
              <LazyWrapper component={Members} />
            </ProtectedRoute>
          } />
          <Route path="/members/:id" element={
            <ProtectedRoute requiredPermission="members:view">
              <LazyWrapper component={MemberProfile} />
            </ProtectedRoute>
          } />

          {/* Payments */}
          <Route path="/payments/*" element={
            <ProtectedRoute requiredPermission="payments:view">
              <LazyWrapper component={Payments} />
            </ProtectedRoute>
          } />

          {/* Attendance */}
          <Route path="/attendance/*" element={
            <ProtectedRoute requiredPermission="attendance:view">
              <LazyWrapper component={Attendance} />
            </ProtectedRoute>
          } />
          <Route path="/qr-attendance" element={
            <ProtectedRoute requiredPermission="attendance:view">
              <LazyWrapper component={QRAttendance} />
            </ProtectedRoute>
          } />

          {/* Classes */}
          <Route path="/classes/*" element={
            <ProtectedRoute requiredPermission="classes:view">
              <LazyWrapper component={Classes} />
            </ProtectedRoute>
          } />

          {/* Staff */}
          <Route path="/staff" element={
            <ProtectedRoute requiredPermission="staff:view">
              <LazyWrapper component={Staff} />
            </ProtectedRoute>
          } />
          <Route path="/staff/:id" element={
            <ProtectedRoute requiredPermission="staff:view">
              <LazyWrapper component={StaffProfile} />
            </ProtectedRoute>
          } />

          {/* Reports */}
          <Route path="/reports/*" element={
            <ProtectedRoute requiredPermission="reports:view">
              <LazyWrapper component={ReportsNew} />
            </ProtectedRoute>
          } />
          <Route path="/reports-old/*" element={
            <ProtectedRoute requiredPermission="reports:view">
              <LazyWrapper component={Reports} />
            </ProtectedRoute>
          } />

          {/* Settings */}
          <Route path="/settings/*" element={
            <ProtectedRoute requiredPermission="settings:view">
              <LazyWrapper component={Settings} />
            </ProtectedRoute>
          } />
        </Route>
      </Route>

      {/* Fallback for unknown routes */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

/**
 * Main App component
 * Sets up the router and context providers
 */
function App() {
  return (
    <Router>
      <NotificationProvider>
        <AuthProvider>
          {/* Toast notifications */}
          <Toaster richColors />
          <ToastContainer position="bottom-right" maxToasts={3} />

          {/* Main routing */}
          <AppRoutes />
        </AuthProvider>
      </NotificationProvider>
    </Router>
  );
}

export default App;
