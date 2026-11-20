
import { useCallback, useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import api from "../api/axios";
import DataTable from "../components/DataTable";
import "./UserList.css";

export default function UserList() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [showModal, setShowModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [isActive, setIsActive] = useState(false);

    // Fetch users
    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true);

            const response = await api.get("/user/dataUsers");

            setUsers(response.data.data || []);
        } catch (error) {
            console.error("Error fetching users:", error);

            Swal.fire({
                title: "Error",
                text: "Unable to fetch users.",
                icon: "error",
                confirmButtonColor: "#ed3237",
            });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    // Prepare DataTable rows
    const rows = useMemo(() => {
        return users.map((user, index) => ({
            ...user,
            custom_id: index + 1,
            status: Number(user.is_active) === 1 ? "Active" : "Inactive",
        }));
    }, [users]);

    // DataTable columns
    const columns = useMemo(() => [
        {
            title: "ID",
            data: "custom_id",
        },
        {
            title: "Name",
            data: "name",
        },
        {
            title: "Email",
            data: "email",
        },
        {
            title: "Status",
            data: "status",
        },
        {
            title: "Created At",
            data: "created_at",
            defaultContent: "-",
        },
        {
            title: "Updated At",
            data: "updated_at",
            defaultContent: "-",
        },
        {
            title: "",
            data: null,
            orderable: false,
            searchable: false,
            className: "text-center",
            render: (data, type, row) => {
                return `
                    <i class="fas fa-edit edit-icon text-danger"
                       data-id="${Number(row.id)}"
                       title="Edit User"
                       style="font-size:14px; cursor:pointer;">
                    </i>
                `;
            },
        },
    ], []);

    // Open edit modal
    const handleEdit = useCallback(async (id) => {
        try {
            const response = await api.get(`/user/edit/${id}`);

            setSelectedUser(response.data);
            setIsActive(Number(response.data.is_active) === 1);
            setShowModal(true);
        } catch (error) {
            console.error("Error fetching user:", error);

            Swal.fire({
                title: "Error",
                text: "Unable to fetch user details.",
                icon: "error",
                confirmButtonColor: "#ed3237",
            });
        }
    }, []);

    // DataTable edit action
    const handleAction = useCallback((id) => {
        handleEdit(id);
    }, [handleEdit]);

    // Close modal
    const handleClose = () => {
        if (saving) return;

        setShowModal(false);
        setSelectedUser(null);
        setIsActive(false);
    };

    // Update user
    const handleUpdate = async (e) => {
        e.preventDefault();

        if (!selectedUser || saving) return;

        try {
            setSaving(true);

            const formData = new FormData();

            formData.append("id", selectedUser.id);
            formData.append("is_active", isActive ? "on" : "off");

            await api.post("/user/update", formData);

            setShowModal(false);
            setSelectedUser(null);

            await fetchUsers();

            Swal.fire({
                title: "Success",
                text: "User updated successfully!",
                icon: "success",
                confirmButtonColor: "#ed3237",
                confirmButtonText: "Ok",
            });
        } catch (error) {
            console.error("Error updating user:", error);

            Swal.fire({
                title: "Error",
                text: error.response?.data?.message ||
                    "Unable to update user.",
                icon: "error",
                confirmButtonColor: "#ed3237",
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="user-list-page">

            {/* Page Heading */}
            <div className="row mb-3">
                <div className="col-lg-6">
                    <h4 className="dashboard-heading">User</h4>
                </div>

                <div className="col-lg-6 dashurl">
                    <a href="/user" className="text-dark">Users</a>
                    <a href="javascript:;" className="text-danger">
                        {" "} / User
                    </a>
                </div>
            </div>

            {/* User DataTable */}
            <div className="user-datatable-wrapper">
                {loading ? (
                    <div className="text-center py-4">
                        Loading users...
                    </div>
                ) : (
                    <DataTable
                        columns={columns}
                        rows={rows}
                        onAction={handleAction}
                        scrollY={false}
                    />
                )}
            </div>

            {/* Edit User Modal */}
            {showModal && selectedUser && (
                <div
                    className="user-modal-overlay"
                    onMouseDown={(e) => {
                        if (
                            e.target === e.currentTarget &&
                            !saving
                        ) {
                            handleClose();
                        }
                    }}
                >
                    <div className="user-modal">

                        <div className="user-modal-header">
                            <h5>Edit User</h5>

                            <button
                                type="button"
                                onClick={handleClose}
                                disabled={saving}
                            >
                                &times;
                            </button>
                        </div>

                        <form onSubmit={handleUpdate}>

                            <div className="user-modal-body">

                                <div className="mb-3">
                                    <label className="form-label">
                                        Name
                                    </label>

                                    <input
                                        type="text"
                                        className="form-control"
                                        value={selectedUser.name || ""}
                                        readOnly
                                    />
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">
                                        Email
                                    </label>

                                    <input
                                        type="email"
                                        className="form-control"
                                        value={selectedUser.email || ""}
                                        readOnly
                                    />
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">
                                        Is Active
                                    </label>

                                    <input
                                        type="checkbox"
                                        className="form-check-input ms-2"
                                        checked={isActive}
                                        onChange={(e) =>
                                            setIsActive(e.target.checked)
                                        }
                                    />
                                </div>

                            </div>

                            <div className="user-modal-footer">

                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={handleClose}
                                    disabled={saving}
                                >
                                    Close
                                </button>

                                <button
                                    type="submit"
                                    className="btn btn-danger shadow"
                                    disabled={saving}
                                >
                                    {saving ? "Updating..." : "Update"}
                                </button>

                            </div>

                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}
