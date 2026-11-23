import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import UserList from "./pages/UserList";
import AccessRights from "./pages/AccessRights";
import ReportIndex from "./pages/ReportIndex";
import AuditTrialReport from "./pages/AuditTrialReport";
import Projects from "./pages/Projects";
import UserManagement from "./pages/UserManagement"; 

export default function App() {
  return (
    <Routes>
      {/* Public: no login check, so no redirect loop */}
      <Route
        path="/unauthorized"
        element={<div className="p-5 text-center">You are not authorized to access this site.</div>}
      />

      {/* Protected */}
      <Route
        element={
          <ProtectedRoute>{(data) => <Layout data={data} />}</ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        {/* <Route path="/user" element={<Navigate to="/user/user" replace />} />
         */}
         <Route path="/user" element={<UserManagement />} /> 
        <Route path="/user/user" element={<UserList />} />
        <Route path="/user/access-rights" element={<AccessRights />} />
        <Route path="/report" element={<ReportIndex />} />
        <Route path="/report/audit-trial-report" element={<AuditTrialReport />} />
        <Route path="/projects" element={<Projects />} />
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}