import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'

export default function UserManagement() {
  const [s, setS] = useState({ countUser: 0, countProjects: 0 })

  useEffect(() => {
    api.get('/spa/user/summary').then(({ data }) => setS(data)).catch(() => {})
  }, [])

  return (
    <>
      <div className="row mb-3">
        <div className="col-lg-6">
          <h4 className="dashboard-heading">User Management</h4>
        </div>
      </div>

      <div className="row">
        {/* <div className="col-lg-4 col-md-4 col-sm-12">
          <Link to="/user/user" className="text-dark" style={{ textDecoration: 'none' }}>
            <div className="card border-hover shadow p-4 m-2">
              <h2 className="text-center text-danger">{s.countUser}</h2>
              <h5 className="text-center">Users</h5>
            </div>
          </Link>
        </div> */}

        <div className="col-lg-4 col-md-4 col-sm-12">
          <Link to="/user/access-rights" className="text-dark" style={{ textDecoration: 'none' }}>
            <div className="card border-hover shadow p-4 m-2">
              <h2 className="text-center text-danger">{s.countProjects}</h2>
              <h5 className="text-center">Access Rights</h5>
            </div>
          </Link>
        </div>
      </div>
    </>
  )
}