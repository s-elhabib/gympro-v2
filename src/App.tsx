import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import Sidebar from './components/layout/Sidebar';
import Navbar from './components/layout/Navbar';
import Login from './pages/Login';
import SignUp from './pages/SignUp';

// Lazy load pages
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Members = React.lazy(() => import('./pages/Members'));
const MemberProfile = React.lazy(() => import('./pages/MemberProfile'));
const Payments = React.lazy(() => import('./pages/Payments'));
const Attendance = React.lazy(() => import('./pages/Attendance'));
const Staff = React.lazy(() => import('./pages/Staff'));
const Reports = React.lazy(() => import('./pages/Reportsold'));
const Settings = React.lazy(() => import('./pages/Settings'));
const Classes = React.lazy(() => import('./pages/Classes'));


const ProtectedLayout = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

const AppRoutes = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" replace />} />
      <Route path="/signup" element={!isAuthenticated ? <SignUp /> : <Navigate to="/dashboard" replace />} />
      <Route
        path="/*"
        element={
          <ProtectedLayout>
            <React.Suspense
              fallback={
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              }
            >
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/members" element={<Members />} />
                <Route path="/members/:id" element={<MemberProfile />} />
                <Route path="/payments/*" element={<Payments />} />
                <Route path="/attendance/*" element={<Attendance />} />
                <Route path="/classes/*" element={<Classes />} />
                <Route path="/staff/*" element={<Staff />} />
                <Route path="/reports/*" element={<Reports />} />
                <Route path="/settings/*" element={<Settings />} />
              </Routes>
            </React.Suspense>
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
          <AppRoutes />
        </AuthProvider>
      </NotificationProvider>
    </Router>
  );
}

export default App;