import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import $ from "jquery"; // needed for $.fn.dataTable.render below
import DataTable from "../components/DataTable";

// ---------- API setup (replaces $.ajax + CSRF header) ----------
const api = axios.create({
  headers: {
    "X-CSRF-TOKEN": document.querySelector('meta[name="csrf-token"]')?.content,
    Accept: "application/json",
  },
});

const showSuccess = (text) =>
  Swal.fire({
    title: "Success",
    text,
    icon: "success",
    confirmButtonColor: "#ed3237",
    confirmButtonText: "Ok",
  });

// IMPORTANT: defined OUTSIDE the component so the array reference stays stable.
// DataTable's useEffect depends on [rows, columns]; a new array on every render
// would destroy and rebuild the table each time.
const columns = [
  { title: "ID", data: "customId" },
  { title: "Project", data: "name", render: $.fn.dataTable.render.text() }, // escapes HTML (XSS safe)
  { title: "Created At", data: "created_at" },
  { title: "Updated At", data: "updated_at" },
  {
    title: "",
    data: "id",
    orderable: false,
    searchable: false,
    // DataTable listens for clicks on .edit-icon and reads data-id
    render: (id) =>
      `<i class="fas fa-edit edit-icon text-danger" data-id="${id}" style="cursor:pointer;"></i>`,
  },
];

// ---------- Reusable modal (used for both Add and Edit) ----------
// Everything it needs comes from props. It owns no data of its own.
function ProjectModal({
  show,
  title,
  submitLabel,
  value,
  error,
  onChange,
  onSubmit,
  onClose,
}) {
  if (!show) return null; // Conditional rendering replaces modal('show') / modal('hide')

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
                  onChange={(e) => onChange(e.target.value)} // Controlled input
                  required
                />
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onClose}
                >
                  Close
                </button>
                <button type="submit" className="btn btn-danger shadow">
                  {submitLabel}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ---------- Page (parent) ----------
// Holds the shared state and passes it down to children as props.
export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [addError, setAddError] = useState("");

  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editError, setEditError] = useState("");

  // Fetch list (replaces fetchProductData). useCallback keeps the same
  // function reference between renders so useEffect does not re-run.
  const fetchProjects = useCallback(async () => {
    try {
      const { data } = await api.get("/projects/data"); // same as route('projects.data')
      setProjects(
        data.data.map((item, index) => ({ ...item, customId: index + 1 }))
      );
    } finally {
      setLoading(false); // replaces $('#loader').hide()
    }
  }, []);

  // Runs once after the first render (replaces $(document).ready)
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Auto-clear error messages (replaces setTimeout + .html(''))
  useEffect(() => {
    if (!addError) return;
    const t = setTimeout(() => setAddError(""), 3000);
    return () => clearTimeout(t); // cleanup
  }, [addError]);

  useEffect(() => {
    if (!editError) return;
    const t = setTimeout(() => setEditError(""), 5000);
    return () => clearTimeout(t);
  }, [editError]);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("project_name", newName);
      await api.post("/project/store", formData);

      setAddOpen(false);
      setNewName("");
      await fetchProjects();
      showSuccess("Project created successfully");
    } catch (err) {
      const status = err.response?.status;
      if (status === 422) setAddError("Please fill all the required details");
      else if (status === 409) setAddError("Project name already exists");
      else setAddError("An error occurred. Please try again.");
    }
  };

  // Called by DataTable (onAction) with the clicked row's id
  const openEdit = async (id) => {
    try {
      const { data: record } = await api.get(`/projects/edit/${id}`);
      setEditId(id);
      setEditName(record.name);
      setEditOpen(true);
    } catch {
      alert("Error fetching data for editing.");
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.post("/project/update", {
        id: editId,
        edit_project_name: editName,
      });
      setEditOpen(false);
      await fetchProjects();
      showSuccess("Project updated successfully!");
    } catch (err) {
      if (err.response?.status === 422)
        setEditError(
          "The name is already used by another entry. Please choose a different name"
        );
      else setEditError("An error occurred. Please try again.");
    }
  };

  return (
    <>
      <div className="row mb-3">
        <div className="col-lg-6">
          <h4 className="dashboard-heading">Projects</h4>
        </div>
        <div className="col-lg-6 dashurl">
          <a href="/dashboard" className="text-dark">
            Dashboard
          </a>
          <a href="#" className="text-danger">
            {" "}
            / Project
          </a>
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

      {loading ? (
        <p>Loading...</p>
      ) : (
        <DataTable columns={columns} rows={projects} onAction={openEdit} />
      )}

      <ProjectModal
        show={addOpen}
        title="Add Project"
        submitLabel="Submit"
        value={newName}
        error={addError}
        onChange={setNewName}
        onSubmit={handleAdd}
        onClose={() => setAddOpen(false)}
      />

      <ProjectModal
        show={editOpen}
        title="Edit Project"
        submitLabel="Update"
        value={editName}
        error={editError}
        onChange={setEditName}
        onSubmit={handleUpdate}
        onClose={() => setEditOpen(false)}
      />
    </>
  );
}