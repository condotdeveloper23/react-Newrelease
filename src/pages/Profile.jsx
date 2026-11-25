import { useEffect, useState } from "react";
import api from "../api/axios";

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
        <div className="text-end mb-3">
          <a href={d.sso_password_url} className="btn btn-danger">Change Password</a>
        </div>
        <div className="row">
          <div className="col-md-6"><label className="fw-bold">Name</label><p>{u.name}</p></div>
          <div className="col-md-6"><label className="fw-bold">Access Type</label><p>{u.is_admin ? "Admin" : "User"}</p></div>
          <div className="col-md-6"><label className="fw-bold">Email</label><p>{u.email}</p></div>
        </div>
      </div>
    </>
  );
}