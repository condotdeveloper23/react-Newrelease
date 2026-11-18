
import { Link } from 'react-router-dom'

export default function ReportIndex() {
  return (
    <>
      <div className="row mb-3">
        <div className="col-lg-6">
          <h4 className="dashboard-heading">Reports</h4>
        </div>
      </div>

      <div className="row">
        <div className="col-lg-4 col-md-6 col-sm-12">
          <Link
            to="/report/audit-trial-report"
            className="text-dark"
          >
            <div className="card border-hover shadow p-4 m-2">
              <h2 className="text-center text-danger">
                <i className="fas fa-chart-line"></i>
              </h2>

              <h5 className="text-center">
                Audit Trial User Report
              </h5>
            </div>
          </Link>
        </div>
      </div>
    </>
  )
}
