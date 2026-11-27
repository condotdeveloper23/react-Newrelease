import { useEffect, useMemo, useRef, useState } from "react";
import api from "../api/axios";

const display = (s) => String(s).replaceAll("_", " ");

// If React runs on a different port than Laravel, set VITE_API_URL in .env
// (leave empty when using the Vite proxy for /spa)
const API_BASE = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
const fileUrl = (u) => (/^https?:\/\//.test(u) ? u : `${API_BASE}${u}`);

const formatSize = (bytes) => {
  if (bytes == null) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
};

const formatDate = (ts) => (ts ? new Date(ts * 1000).toLocaleString() : "");

export default function Dashboard() {
  const [folders, setFolders] = useState([]);
  const [rootLoading, setRootLoading] = useState(true);
  const [rootError, setRootError] = useState(null);

  // stack items: { path, label }
  const [stack, setStack] = useState([]);
  const [content, setContent] = useState(null); // { folders, files }
  const [folderLoading, setFolderLoading] = useState(false);
  const [folderError, setFolderError] = useState(null);
  const [query, setQuery] = useState("");

  const reqId = useRef(0); // ignore stale responses
  const cache = useRef(new Map()); // path -> content
  const [zipping, setZipping] = useState(false);

  useEffect(() => {
    api
      .get("/spa/dashboard")
      .then(({ data }) => setFolders(data.folders || []))
      .catch(() => setRootError("Failed to load projects"))
      .finally(() => setRootLoading(false));
  }, []);

  const load = async (path, newStack, { force = false } = {}) => {
    const id = ++reqId.current;
    setStack(newStack);
    setQuery("");
    setFolderError(null);

    if (!force && cache.current.has(path)) {
      setContent(cache.current.get(path));
      setFolderLoading(false);
      return;
    }

    setFolderLoading(true);
    try {
      const { data } = await api.get("/spa/dashboard/folder", {
        params: { folder_name: path },
      });
      if (id !== reqId.current) return;
      const safe = { folders: data.folders || [], files: data.files || [] };
      cache.current.set(path, safe);
      setContent(safe);
    } catch (e) {
      if (id !== reqId.current) return;
      setContent({ folders: [], files: [] });
      setFolderError(
        e?.response?.status === 403
          ? "You do not have access to this folder."
          : "Failed to load folder. Please try again.",
      );
    } finally {
      if (id === reqId.current) setFolderLoading(false);
    }
  };

  const openRoot = (name) => load(name, [{ path: name, label: display(name) }]);
  const openSub = (sub) =>
    load(sub, [...stack, { path: sub, label: sub.split("/").pop() }]);

  // jump to any breadcrumb level (-1 = root projects list)
  const goTo = (index) => {
    if (index < 0) {
      reqId.current++;
      setStack([]);
      setContent(null);
      setFolderError(null);
      setFolderLoading(false);
      setQuery("");
      return;
    }
    load(stack[index].path, stack.slice(0, index + 1));
  };

  const refresh = () => {
    const cur = stack[stack.length - 1];
    if (cur) load(cur.path, stack, { force: true });
  };

  const downloadZip = async () => {
    const cur = stack[stack.length - 1];
    if (!cur || zipping) return;

    setZipping(true);
    try {
      const res = await api.get("/spa/download-zip", {
        params: { folder_name: cur.path },
        responseType: "blob",
      });

      const blob = new Blob([res.data], { type: "application/zip" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${cur.label}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      alert("Failed to download ZIP. Please try again.");
    } finally {
      setZipping(false);
    }
  };

  const q = query.trim().toLowerCase();

  const shownFolders = useMemo(
    () =>
      (content?.folders || []).filter((s) =>
        s.split("/").pop().toLowerCase().includes(q),
      ),
    [content, q],
  );
  const shownFiles = useMemo(
    () =>
      (content?.files || []).filter((f) =>
        f.filename.toLowerCase().includes(q),
      ),
    [content, q],
  );

  const totalItems =
    (content?.folders.length || 0) + (content?.files.length || 0);

  return (
    <>
      <h4>
        <i
          className="fas fa-folder fa-1x header-icon"
          style={{ color: "#FFB300" }}
        />{" "}
        Projects
      </h4>
      <br />

      {/* Breadcrumbs */}
      {stack.length > 0 && (
        <div className="d-flex align-items-center flex-wrap mb-3 gap-2">
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => goTo(stack.length - 2)}
          >
            ← Back
          </button>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    goTo(-1);
                  }}
                >
                  Projects
                </a>
              </li>
              {stack.map((s, i) => (
                <li
                  key={s.path}
                  className={`breadcrumb-item ${i === stack.length - 1 ? "active" : ""}`}
                >
                  {i === stack.length - 1 ? (
                    s.label
                  ) : (
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        goTo(i);
                      }}
                    >
                      {s.label}
                    </a>
                  )}
                </li>
              ))}
            </ol>
          </nav>
          <button
            className="btn btn-outline-secondary btn-sm ms-auto"
            onClick={refresh}
          >
            <i className="fas fa-sync-alt" /> Refresh
          </button>
          {/* {totalItems > 0 && (
            <button
              className="btn btn-danger btn-sm"
              onClick={downloadZip}
              disabled={zipping}
            >
              {zipping ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-1"
                    role="status"
                    aria-hidden="true"
                  />
                  Preparing ZIP...
                </>
              ) : (
                <>
                  <i className="fas fa-file-archive" /> Download ZIP
                </>
              )}
            </button>
          )} */}
        </div>
      )}

      {/* Search (only inside a folder) */}
      {stack.length > 0 && content && !folderLoading && totalItems > 0 && (
        <input
          className="form-control mb-3"
          style={{ maxWidth: 320 }}
          placeholder="Search in this folder..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      )}

      {/* Root level */}
      {rootLoading && <div>Loading...</div>}
      {rootError && <div className="alert alert-danger">{rootError}</div>}

      {!rootLoading && !rootError && stack.length === 0 && (
        <>
          {folders.length === 0 && (
            <div className="alert alert-warning">
              You do not have access to any folders.
            </div>
          )}
          <div className="release-grid">
            {folders.map((f) => (
              <div
                key={f.id}
                className="release-card"
                title={f.name}
                onClick={() => openRoot(f.name)}
              >
                <div className="release-icon">
                  <i
                    className="fas fa-folder fa-2x"
                    style={{ color: "#FFB300" }}
                  />
                </div>
                <div className="release-name fw-semibold">
                  {display(f.name)}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Folder level */}
      {stack.length > 0 && folderLoading && <div>Loading folder...</div>}
      {stack.length > 0 && folderError && (
        <div className="alert alert-danger">{folderError}</div>
      )}

      {stack.length > 0 && !folderLoading && content && !folderError && (
        <div className="release-grid">
          {shownFolders.map((sub) => {
            const name = sub.split("/").pop();
            return (
              <div
                key={sub}
                className="release-card"
                title={name}
                onClick={() => openSub(sub)}
              >
                <div className="release-icon">
                  <i className="fas fa-folder" style={{ color: "#FFB300" }} />
                </div>
                <div className="release-name">{name}</div>
              </div>
            );
          })}

          {shownFiles.map((file) => (
            <div
              key={file.filename}
              className="release-card"
              title={file.filename}
              style={{ cursor: "default" }}
            >
              <div className="release-icon">
                <i className="fas fa-file" style={{ color: "#6c757d" }} />
              </div>
              <div className="release-name">{file.filename}</div>
              {(file.size != null || file.modified_at) && (
                <div className="text-muted small">
                  {formatSize(file.size)}
                  {file.size != null && file.modified_at ? " · " : ""}
                  {formatDate(file.modified_at)}
                </div>
              )}
              <a
                href={fileUrl(file.download_url)}
                download
                aria-label={`Download ${file.filename}`}
                className="text-danger d-inline-block mt-2"
              >
                <i className="fas fa-download" />
              </a>
            </div>
          ))}

          {totalItems === 0 && (
            <div className="text-muted">This folder is empty.</div>
          )}
          {totalItems > 0 &&
            shownFolders.length === 0 &&
            shownFiles.length === 0 && (
              <div className="text-muted">No results for "{query}".</div>
            )}
        </div>
      )}
    </>
  );
}
