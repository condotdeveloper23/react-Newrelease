import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import DataTable from "../components/DataTable";
import Swal from "sweetalert2";

export default function AuditTrialReport() {
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [auditTrailsCount, setAuditTrailsCount] = useState(0);
  const [searchKey, setSearchKey] = useState(0);
  const filtersRef = useRef(null); // filters applied at the time of search

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pdfMaxRows, setPdfMaxRows] = useState(5000);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);

      const response = await api.get("/spa/report/audit-trial");
      const data = response.data;

      setUsers(data.users || []);
      setFromDate(data.fromDate || "");
      setToDate(data.toDate || "");
      setSelectedUsers(data.userId || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load report data.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedUsers(users.map((user) => String(user.id)));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleUserChange = (userId, checked) => {
    const id = String(userId);

    setSelectedUsers((prev) => {
      if (checked) {
        return prev.includes(id) ? prev : [...prev, id];
      }
      return prev.filter((item) => item !== id);
    });
  };

  const allSelected = users.length > 0 && selectedUsers.length === users.length;

  // Search report: remount DataTable with the applied filters
  const handleSearch = (e) => {
    e.preventDefault();
    setError("");

    if (!fromDate || !toDate) {
      setError("Please fill all the required fields.");
      return;
    }

    if (fromDate > toDate) {
      setError("From date must be less than to date.");
      return;
    }

    if (selectedUsers.length === 0) {
      setError("Please select user.");
      return;
    }

    filtersRef.current = {
      from_date: fromDate,
      to_date: toDate,
      user_id: selectedUsers,
    };

    setAuditTrailsCount(0);
    setSearchKey((k) => k + 1);
  };

  // Called by DataTable for every page / search / sort / length change
  const fetchData = async (dt) => {
     if (!filtersRef.current) {
    return { draw: dt.draw, recordsTotal: 0, recordsFiltered: 0, data: [] }
  }
    try {
      const response = await api.post("/spa/report/search-audit-trail", {
        ...filtersRef.current,
        draw: dt.draw,
        start: dt.start,
        length: dt.length,
        search: { value: dt.search?.value || "" },
        order: dt.order || [],
      });

      setAuditTrailsCount(response.data.recordsTotal || 0);
      setPdfMaxRows(response.data.pdfMaxRows || 5000);

      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || "Unable to search audit report.");
      throw err;
    }
  };

  const columns = useMemo(
    () => [
      {
        data: null,
        title: "Sr. No.",
        width: "10%",
        orderable: false,
        render: (data, type, row, meta) =>
          meta.settings._iDisplayStart + meta.row + 1,
      },
      { data: "email", title: "Email", width: "15%" },
      { data: "accessed_at", title: "DateTime", width: "15%" },
      { data: "reason", title: "Reason" },
    ],
    [],
  );

  // PDF download (uses the filters that were applied at search time)
  const handlePdfDownload = async () => {
    if (auditTrailsCount > pdfMaxRows) {
      Swal.fire({
        icon: "warning",
        title: "Too many records",
        text:
          `Found ${auditTrailsCount} records. PDF supports a maximum of ` +
          `${pdfMaxRows} records. Please reduce the date range or users.`,
        confirmButtonColor: "#ed3237",
      });
      return;
    }

    try {
      setPdfLoading(true);

      const f = filtersRef.current;
      const usersJson = JSON.stringify(f.user_id);

      const response = await api.get(
        `/spa/report/audit-trial/pdf/` +
          `${encodeURIComponent(f.from_date)}/` +
          `${encodeURIComponent(f.to_date)}/` +
          `${encodeURIComponent(usersJson)}`,
        { responseType: "blob" },
      );

      const blobUrl = window.URL.createObjectURL(
        new Blob([response.data], { type: "application/pdf" }),
      );
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `audit_trial_user_report_${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      let message = "Unable to download PDF.";

      try {
        const text = await err.response?.data?.text();
        message = JSON.parse(text)?.message || message;
      } catch (_) {}

      Swal.fire({
        icon: "error",
        title: "PDF download failed",
        text: message,
        confirmButtonColor: "#ed3237",
      });
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <>
      {/* Page Heading */}
      <div className="row mb-3">
        <div className="col-lg-6">
          <h4 className="dashboard-heading">Audit Trial User Reports</h4>
        </div>

        <div className="col-lg-6 dashurl">
          <Link to="/report" className="text-dark">
            Report
          </Link>

          <span className="text-danger"> /Audit Trial Report</span>
        </div>
      </div>

      {/* Filter Section */}
      <div className="row" style={{ padding: "10px" }}>
        <div
          className="col-lg-12 card shadow p-4"
          style={{ border: "1px solid #ed3237" }}
        >
          <form onSubmit={handleSearch}>
            <div className="row">
              {/* Date Fields */}
              <div className="col-md-6">
                <div className="row">
                  <div className="col-md-12">
                    <label>
                      From <span className="text-danger">*</span>
                    </label>

                    <input
                      type="datetime-local"
                      className="form-control mb-2"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      required
                      autoComplete="off"
                    />
                  </div>

                  <div className="col-md-12">
                    <label>
                      To <span className="text-danger">*</span>
                    </label>

                    <input
                      type="datetime-local"
                      className="form-control mb-2"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      required
                      autoComplete="off"
                    />
                  </div>
                </div>
              </div>

              {/* Users */}
              {/* <div className="col-md-6">
                <div
                  className="row"
                  style={{ maxHeight: "150px", overflowY: "auto" }}
                >
                  <div className="col-md-12">
                    <div className="row">
                      <div className="col-2" style={{ fontWeight: "bold" }}>
                        Users
                      </div>

                      <div className="col-10" style={{ fontWeight: "bold" }}>
                        All&nbsp;
                        <input
                          type="checkbox"
                          checked={allSelected}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="col-md-12">
                    <br />
                  </div>

                  <div className="col-md-12">
                    <div className="row">
                      {users.map((user) => (
                        <div className="col-md-12" key={user.id}>
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(String(user.id))}
                            onChange={(e) =>
                              handleUserChange(user.id, e.target.checked)
                            }
                          />
                          &nbsp;
                          <label style={{ fontWeight: 100 }}>
                            {user.name} - {user.email}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div> */}



              {/* Users */}
<div className="col-md-6">
  <div className="d-flex align-items-center justify-content-between mb-2">
    <span style={{ fontWeight: "bold" }}>Users</span>

    <div className="form-check mb-0">
      <input
        type="checkbox"
        className="form-check-input"
        id="selectAllUsers"
        checked={allSelected}
        onChange={(e) => handleSelectAll(e.target.checked)}
      />
      <label
        className="form-check-label"
        htmlFor="selectAllUsers"
        style={{ fontWeight: "bold" }}
      >
        All
      </label>
    </div>
  </div>

  <div className="user-list">
    {users.map((user) => (
      <div className="form-check" key={user.id}>
        <input
          type="checkbox"
          className="form-check-input"
          id={`user-${user.id}`}
          checked={selectedUsers.includes(String(user.id))}
          onChange={(e) => handleUserChange(user.id, e.target.checked)}
        />
        <label
          className="form-check-label"
          htmlFor={`user-${user.id}`}
          style={{ fontWeight: 400, wordBreak: "break-word" }}
        >
          {user.name} - {user.email}
        </label>
      </div>
    ))}
  </div>
</div>



            </div>

            {error && <div className="alert alert-danger mt-2">{error}</div>}

            <button type="submit" className="btn btn-danger" disabled={loading}>
              Search Report
            </button>
          </form>
        </div>
      </div>

      {/* Report Table */}
      <div className="row mt-3">
        {auditTrailsCount > 0 && (
          <div className="col-12 mb-2">
            <button
              type="button"
              className="btn btn-danger"
              onClick={handlePdfDownload}
              disabled={pdfLoading}
            >
              {pdfLoading ? "Generating PDF..." : "PDF"}
            </button>
          </div>
        )}

        <div className="col-12">
          <div className="table-responsive">
         
              <DataTable
                key={searchKey}
                columns={columns}
                serverSide
                fetchData={fetchData}
              />
        
          </div>
        </div>
      </div>
    </>
  );
}