import { Routes, Route, Navigate } from "react-router-dom"; 
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import UserManagement from "./pages/UserManagement";
import UserList from "./pages/UserList";
import AccessRights from "./pages/AccessRights";

import ReportIndex from "./pages/ReportIndex";
import AuditTrialReport from "./pages/AuditTrialReport";

// Temporary debug component



export default function App() {
  return (
    <Routes>
      <Route
        element={
          <ProtectedRoute>{(data) => <Layout data={data} />}</ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/user" element={<UserManagement />} />

        <Route path="/user" element={<Navigate to="/user/user" replace />} />
        <Route path="/user/user" element={<UserList />} />
        <Route path="/user/access-rights" element={<AccessRights />} />
        <Route path="/report" element={<ReportIndex />} />
        <Route path="/report/audit-trial-report" element={<AuditTrialReport />} />
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}