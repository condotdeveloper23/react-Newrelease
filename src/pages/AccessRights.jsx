import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";
import api from "../api/axios";

const headerStyle = {
  fontWeight: 700,
  fontSize: "16px",
  textAlign: "left",
  borderBottom: "1px solid #dee2e6",
};

export default function AccessRights() {
  const [users, setUsers] = useState([]);
  const [menus, setMenus] = useState([]);
  const [userId, setUserId] = useState("");
  const [checkedMenus, setCheckedMenus] = useState([]);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  // Fetch active users and active menus
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get("/spa/user/access-rights");
        setUsers(response.data.users || []);
        setMenus(response.data.menus || []);
      } catch (error) {
        Swal.fire(
          "Error",
          error.response?.data?.message || "Unable to load access rights data.",
          "error",
        );
      } finally {
        setPageLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fetch selected user's assigned permissions
  const handleUserChange = async (e) => {
    const selectedId = e.target.value;

    setUserId(selectedId);
    setCheckedMenus([]);
    setIsAdminUser(false);

    if (!selectedId) return;

    setLoading(true);

    try {
      const response = await api.get(`/spa/user/access-rights/${selectedId}`);
      setCheckedMenus((response.data.assignedMenuIds || []).map(Number));
      setIsAdminUser(Boolean(response.data.is_admin));
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.message || "Unable to load assigned permissions.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCheckboxChange = (menuId) => {
    if (isAdminUser) return;
    setCheckedMenus((previous) =>
      previous.includes(menuId)
        ? previous.filter((id) => id !== menuId)
        : [...previous, menuId],
    );
  };

  // Save assigned permissions
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!userId) {
      Swal.fire({ title: "Warning", text: "Please select a user.", icon: "warning", confirmButtonColor: "#ed3237" });
      return;
    }

    if (isAdminUser) return;

    setSaving(true);

    try {
      const response = await api.post("/spa/user/assign-access-rights", {
        userId: Number(userId),
        projectMenu: checkedMenus,
      });

      // Swal.fire(
      //     "Success",
      //     response.data.message || "Access rights updated successfully.",
      //     "success"
      // );
      Swal.fire({
        title: "Success",
        text: response.data.message || "Access rights updated successfully.",
        icon: "success",
        confirmButtonColor: "#ed3237",
      });
    } catch (error) {
      const validationErrors = error.response?.data?.errors;

      const message = validationErrors
        ? Object.values(validationErrors).flat().join("\n")
        : error.response?.data?.message || "Unable to update access rights.";

      Swal.fire({
        title: "Error",
        text: message,
        icon: "error",
        confirmButtonColor: "#ed3237",
      });
    } finally {
      setSaving(false);
    }
  };

  if (pageLoading) {
    return <div className="text-center p-4">Loading access rights...</div>;
  }

  const locked = !userId || loading || saving || isAdminUser;

  return (
    <div className="container-fluid">
      {/* Heading + Breadcrumb */}
      <div className="row mb-3">
        <div className="col-lg-6">
          <h4 className="dashboard-heading">Access Rights </h4>
        </div>

        <div className="col-lg-6 dashurl text-end">
          <Link to="/user" className="text-dark">
            Users
          </Link>
          <span className="text-danger">{" / Access Rights"}</span>
        </div>
      </div>

      {/* Select Employee Card */}
      <div className="row">
        <div className="col-12">
          <div className="card p-3 shadow mb-4">
            <label className="mb-2 fw-bold">Select Employee</label>

            <select
              className="form-control"
              value={userId}
              onChange={handleUserChange}
            >
              <option value="">-- Select Employee --</option>

              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Menu list */}
      <form onSubmit={handleSubmit}>
        <div className="table-responsive">
          <table className="table table-sm mb-3">
            <thead>
              <tr>
                <th
                  style={{ ...headerStyle, width: "65%" }}
                  className="text-start"
                >
                  Menu
                </th>
                <th style={headerStyle} className="text-start">
                  Show
                </th>
              </tr>
            </thead>

            <tbody style={{ fontSize: "13px" }}>
              {menus.length > 0 ? (
                menus.map((menu) => (
                  <tr key={menu.id}>
                    <td>{menu.menu_name.replace(/_/g, " ")}</td>

                    <td>
                      <input
                        type="checkbox"
                        className="projectMenuCK"
                        value={menu.id}
                        checked={checkedMenus.includes(Number(menu.id))}
                        disabled={locked}
                        onChange={() => handleCheckboxChange(Number(menu.id))}
                      />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="2" className="text-center">
                    No active menus found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {loading && (
          <div className="text-center mb-3">
            Loading assigned permissions...
          </div>
        )}

        <button
          type="submit"
          className="btn btn-danger shadow btn-sm"
          disabled={locked}
          style={{ marginBottom: "10px" }}
        >
          {saving ? "Saving..." : "Assign Rights"}
        </button>
      </form>
    </div>
  );
}
