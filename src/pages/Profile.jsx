import { useEffect, useState } from "react";
import api from "../api/axios";

const label = (t) =>
  t ? t.charAt(0).toUpperCase() + t.slice(1) : "-";

export default function Profile() {
  const [d, setD] = useState(null);

  useEffect(() => {
    api.get("/spa/me").then(({ data }) => setD(data)).catch(() => {});
  }, []);

  if (!d) return <div className="p-4">Loading...</div>;
  const u = d.user;

  return (
    <>
      <h4 className="dashboard-heading mb-3">My Profile</h4>
      <div className="card p-4 shadow">
        {d.sso_password_url && (
          <div className="text-end mb-3">
            <a href={d.sso_password_url} className="btn btn-danger">
              Change Password
            </a>
          </div>
        )}
        <div className="row">
          <div className="col-md-6">
            <label className="fw-bold">Name</label>
            <p>{u.name}</p>
          </div>
          <div className="col-md-6">
            <label className="fw-bold">Access Type</label>
            <p>{label(u.user_access_type || (u.is_admin ? "admin" : "user"))}</p>
          </div>
          <div className="col-md-6">
            <label className="fw-bold">Email</label>
            <p>{u.email}</p>
          </div>
        </div>
      </div>
    </>
  );
}