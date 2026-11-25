import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";
import $ from "jquery"; // needed for $.fn.dataTable.render below
import api from "../api/axios"; // shared instance (cookies + 401 -> SSO)
import DataTable from "../components/DataTable";

const showSuccess = (text) =>
  Swal.fire({
    title: "Success",
    text,
    icon: "success",
    confirmButtonColor: "#ed3237",
    confirmButtonText: "Ok",
  });

// Defined OUTSIDE the component so the reference stays stable
const columns = [
  { title: "ID", data: "customId" },
  { title: "Project", data: "name", render: $.fn.dataTable.render.text() },
  { title: "Created At", data: "created_at" },
  { title: "Updated At", data: "updated_at" },
  { title: "Created By", data: "created_by_name", defaultContent: "-" },
  { title: "Updated By", data: "updated_by_name", defaultContent: "-" },
  {
    title: "Status",
    data: "is_active",
    render: (v) =>
      Number(v) === 1
        ? 'Active'
        : 'Inactive',
  },
  {
    title: "",
    data: "id",
    orderable: false,
    searchable: false,
    render: (id) =>
      `<i class="fas fa-edit edit-icon text-danger" data-id="${Number(id)}" style="cursor:pointer;"></i>`,
  },
];

function ProjectModal({
  show,
  title,
  submitLabel,
  value,
  error,
  saving,
  onChange,
  onSubmit,
  onClose,
  showStatus,
  active,
  onActiveChange,
}) {
  if (!show) return null;

  return (
    <div
      className="modal fade show d-block"
      style={{ background: "rgba(0,0,0,0.5)" }}
      tabIndex="-1"
    >
      <div className="modal-dialog">
        <div className="modal-content">
          <form onSubmit={onSubmit}>
            <div className="modal-body m-3">
              <h5 className="modal-title form-heading">{title}</h5>

              {error && (
                <div className="mt-3">
                  <div className="alert alert-danger">{error}</div>
                </div>
              )}

              <div className="mb-3">
                <label htmlFor="project_name" className="form-label">
                  Project Name <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="project_name"
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  required
                />
              </div>

              {showStatus && (
                <div className="mb-3 form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="p_active"
                    checked={active}
                    onChange={(e) => onActiveChange(e.target.checked)}
                  />
                  <label className="form-check-label" htmlFor="p_active">
                    Active
                  </label>
                </div>
              )}

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onClose}
                  disabled={saving}
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="btn btn-danger shadow"
                  disabled={saving}
                >
                  {saving ? "Please wait..." : submitLabel}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);

  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [addError, setAddError] = useState("");

  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editActive, setEditActive] = useState(true);
  const [editError, setEditError] = useState("");

  const fetchProjects = useCallback(async () => {
    try {
      setLoadError("");
      const { data } = await api.get("/spa/projects/data");
      setProjects(
        (data.data || []).map((item, index) => ({
          ...item,
          customId: index + 1,
        })),
      );
    } catch (err) {
      setLoadError(
        err.response?.status === 403
          ? "You do not have access to this page."
          : "Unable to load projects.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    if (!addError) return;
    const t = setTimeout(() => setAddError(""), 3000);
    return () => clearTimeout(t);
  }, [addError]);

  useEffect(() => {
    if (!editError) return;
    const t = setTimeout(() => setEditError(""), 5000);
    return () => clearTimeout(t);
  }, [editError]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (saving) return;
    try {
      setSaving(true);
      const formData = new FormData();
      formData.append("project_name", newName);
      await api.post("/spa/project/store", formData);

      setAddOpen(false);
      setNewName("");
      await fetchProjects();
      showSuccess("Project created successfully");
    } catch (err) {
      const status = err.response?.status;
      if (status === 422) setAddError("Please fill all the required details");
      else if (status === 409) setAddError("Project name already exists");
      else setAddError("An error occurred. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const openEdit = async (id) => {
    try {
      const { data: record } = await api.get(`/spa/projects/edit/${id}`);
      setEditId(id);
      setEditName(record.name);
      setEditActive(Number(record.is_active) === 1);
      setEditError("");
      setEditOpen(true);
    } catch {
      Swal.fire({
        title: "Error",
        text: "Error fetching data for editing.",
        icon: "error",
        confirmButtonColor: "#ed3237",
      });
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (saving) return;
    try {
      setSaving(true);
      await api.post("/spa/project/update", {
        id: editId,
        edit_project_name: editName,
        is_active: editActive,
      });
      setEditOpen(false);
      await fetchProjects();
      showSuccess("Project updated successfully!");
    } catch (err) {
      if (err.response?.status === 422)
        setEditError(
          "The name is already used by another entry. Please choose a different name",
        );
      else setEditError("An error occurred. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="row mb-3">
        <div className="col-lg-6">
          <h4 className="dashboard-heading">Projects</h4>
        </div>
        <div className="col-lg-6 dashurl">
          <Link to="/dashboard" className="text-dark">
            Dashboard
          </Link>
          <span className="text-danger"> / Project</span>
        </div>
      </div>

      <div className="row mb-3">
        <div className="col-lg-6"></div>
        <div className="col-lg-6" style={{ textAlign: "right" }}>
          <button
            className="btn btn-danger shadow"
            onClick={() => setAddOpen(true)}
          >
            Add Project
          </button>
        </div>
      </div>

      {loading && <p>Loading...</p>}
      {!loading && loadError && (
        <div className="alert alert-danger">{loadError}</div>
      )}
      {!loading && !loadError && (
        <DataTable columns={columns} rows={projects} onAction={openEdit} />
      )}

      <ProjectModal
        show={addOpen}
        title="Add Project"
        submitLabel="Submit"
        value={newName}
        error={addError}
        saving={saving}
        onChange={setNewName}
        onSubmit={handleAdd}
        onClose={() => setAddOpen(false)}
          showStatus={false}
      />

      <ProjectModal
        show={editOpen}
        title="Edit Project"
        submitLabel="Update"
        value={editName}
        error={editError}
        saving={saving}
        onChange={setEditName}
        onSubmit={handleUpdate}
        onClose={() => setEditOpen(false)}
        showStatus={true}
        active={editActive}
        onActiveChange={setEditActive}

      />
    </>
  );
}
