
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";
import api from "../api/axios";

export default function AccessRights() {
    const [users, setUsers] = useState([]);
    const [menus, setMenus] = useState([]);
    const [userId, setUserId] = useState("");
    const [checkedMenus, setCheckedMenus] = useState([]);
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
                    error.response?.data?.message ||
                        "Unable to load access rights data.",
                    "error"
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

        if (!selectedId) return;

        setLoading(true);

        try {
            const response = await api.get(
                `/spa/user/access-rights/${selectedId}`
            );

            setCheckedMenus(response.data.assignedMenuIds || []);
        } catch (error) {
            Swal.fire(
                "Error",
                error.response?.data?.message ||
                    "Unable to load assigned permissions.",
                "error"
            );
        } finally {
            setLoading(false);
        }
    };

    // Handle checkbox selection
    const handleCheckboxChange = (menuId) => {
        setCheckedMenus((previous) =>
            previous.includes(menuId)
                ? previous.filter((id) => id !== menuId)
                : [...previous, menuId]
        );
    };

    // Save assigned permissions
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!userId) {
            Swal.fire("Warning", "Please select a user.", "warning");
            return;
        }

        setSaving(true);

        try {
            const response = await api.post(
                "/spa/user/assign-access-rights",
                {
                    userId: Number(userId),
                    projectMenu: checkedMenus,
                }
            );

            Swal.fire(
                "Success",
                response.data.message ||
                    "Access rights updated successfully.",
                "success"
            );
        } catch (error) {
            const validationErrors = error.response?.data?.errors;

            const message = validationErrors
                ? Object.values(validationErrors).flat().join("\n")
                : error.response?.data?.message ||
                    "Unable to update access rights.";

            Swal.fire("Error", message, "error");
        } finally {
            setSaving(false);
        }
    };

    if (pageLoading) {
        return (
            <div className="text-center p-4">
                Loading access rights...
            </div>
        );
    }

    return (
        <div className="container-fluid">

            {/* Breadcrumb */}
            <div className="row mb-3">
                <div className="col-lg-6">
                    <h4 className="dashboard-heading">
                        Access Rights
                    </h4>
                </div>

                <div className="col-lg-6 dashurl text-end">
                    <Link to="/user" className="text-dark">
                        Users
                    </Link>
                    <span className="text-danger">
                        {" / Access Rights"}
                    </span>
                </div>
            </div>

            {/* Access Rights Card */}
            <div className="row">
                <div className="col-12">
                    <div className="card p-3 shadow">

                        <label className="mb-2">
                            User Roles
                        </label>

                        {/* User Dropdown */}
                        <div className="col-md-12 mb-3">
                            <select
                                className="form-control"
                                value={userId}
                                onChange={handleUserChange}
                            >
                                <option value="">
                                    -- Select User --
                                </option>

                                {users.map((user) => (
                                    <option
                                        key={user.id}
                                        value={user.id}
                                    >
                                        {user.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Menu Permissions */}
                        <form onSubmit={handleSubmit}>
                            <div className="table-responsive">
                                <table className="table table-sm table-bordered">
                                    <thead>
                                        <tr
                                            style={{
                                                backgroundColor: "#ed3237",
                                                color: "#ffffff",
                                            }}
                                        >
                                            <th style={{ width: "80%" }}>
                                                Menu
                                            </th>
                                            <th className="text-center">
                                                Show
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {menus.length > 0 ? (
                                            menus.map((menu) => (
                                                <tr key={menu.id}>
                                                    <td>
                                                        {menu.menu_name.replace(
                                                            /_/g,
                                                            " "
                                                        )}
                                                    </td>

                                                    <td className="text-center">
                                                        <input
                                                            type="checkbox"
                                                            className="projectMenuCK"
                                                            value={menu.id}
                                                            checked={checkedMenus.includes(
                                                                Number(menu.id)
                                                            )}
                                                            disabled={
                                                                !userId ||
                                                                loading ||
                                                                saving
                                                            }
                                                            onChange={() =>
                                                                handleCheckboxChange(
                                                                    Number(menu.id)
                                                                )
                                                            }
                                                        />
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td
                                                    colSpan="2"
                                                    className="text-center"
                                                >
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
                                disabled={
                                    !userId ||
                                    loading ||
                                    saving
                                }
                                style={{ marginBottom: "10px" }}
                            >
                                {saving ? "Saving..." : "Assign Rights"}
                            </button>
                        </form>

                    </div>
                </div>
            </div>
        </div>
    );
}
