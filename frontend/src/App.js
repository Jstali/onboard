import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Login from "./components/Login";
import PasswordReset from "./components/PasswordReset";
import HRDashboard from "./components/HRDashboard";
import EmployeeDashboard from "./components/EmployeeDashboard";
import AttendancePortal from "./components/AttendancePortal";
import ProtectedRoute from "./components/ProtectedRoute";
import EmployeeLeaveRequest from "./components/EmployeeLeaveRequest";
import ManagerLeaveApproval from "./components/ManagerLeaveApproval";
import HRLeaveApproval from "./components/HRLeaveApproval";
import ManagerDashboard from "./components/ManagerDashboard";
import Profile from "./components/Profile";

function AppRoutes() {
  const { user, loading } = useAuth();

  // Debug logging
  console.log("🔍 AppRoutes - User:", user, "Loading:", loading);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
      <Route path="/reset-password" element={<PasswordReset />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            {user?.role === "hr" ? (
              <Navigate to="/hr" />
            ) : (
              <Navigate to="/employee" />
            )}
          </ProtectedRoute>
        }
      />

      {/* Employee Routes */}
      <Route
        path="/employee"
        element={
          <ProtectedRoute role="employee">
            <EmployeeDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/attendance"
        element={
          <ProtectedRoute role="employee">
            <AttendancePortal />
          </ProtectedRoute>
        }
      />
      <Route
        path="/leave-request"
        element={
          <ProtectedRoute role="employee">
            <EmployeeLeaveRequest />
          </ProtectedRoute>
        }
      />

      {/* Manager Routes */}
      <Route
        path="/manager"
        element={
          <ProtectedRoute role="manager">
            <ManagerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/leave-requests"
        element={
          <ProtectedRoute role="manager">
            <ManagerLeaveApproval />
          </ProtectedRoute>
        }
      />

      {/* HR Routes */}
      <Route
        path="/hr"
        element={
          <ProtectedRoute role="hr">
            <HRDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/hr/leave-requests"
        element={
          <ProtectedRoute role="hr">
            <HRLeaveApproval />
          </ProtectedRoute>
        }
      />
      <Route
        path="/hr/employees"
        element={
          <ProtectedRoute role="hr">
            <HRDashboard />
          </ProtectedRoute>
        }
      />

      {/* Profile Route - Available to all authenticated users */}
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <AppRoutes />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: "#363636",
                color: "#fff",
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: "#22c55e",
                  secondary: "#fff",
                },
              },
              error: {
                duration: 5000,
                iconTheme: {
                  primary: "#ef4444",
                  secondary: "#fff",
                },
              },
            }}
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
