import { useState } from 'react'
import { Outlet, Link, NavLink } from 'react-router-dom'

const year = new Date().getFullYear()

export default function Layout({ data }) {
  const [open, setOpen] = useState(false)
  const p = data.permissions || {}
  const close = () => setOpen(false)

  const menu = [
    { to: '/dashboard', icon: 'fas fa-home', label: 'Dashboard', show: true },
    { to: '/user', icon: 'fa-solid fa-user', label: 'Users', show: p.users },
    { to: '/projects', icon: 'fas fa-briefcase', label: 'Projects', show: p.projects },
    { to: '/report', icon: 'fas fa-file-alt', label: 'Report', show: true },
  ].filter((m) => m.show)

  return (
    <>
      <div className={`spa-drawer ${open ? 'is-open' : ''}`}>
        <div className="bg-light">
          <div className="nav-item bg-white" style={{ textAlign: 'center', padding: '0.5rem 0' }}>
            <Link to="/dashboard" onClick={close} style={{ backgroundColor: '#fff' }}>
              <img src="/assets/images/logo.png" width="110" alt="" />
            </Link>
          </div>
        </div>

        <nav className="mt-2">
          <ul className="nav nav-pills nav-sidebar flex-column">
            {menu.map((m) => (
              <li className="nav-item" key={m.to}>
                <NavLink
                  to={m.to}
                  className={({ isActive }) =>
                    `nav-link text-white text-center ${isActive ? 'active' : ''}`
                  }
                  onClick={close}
                >
                  <i className={`nav-icon ${m.icon}`} /><br />
                  <p id="menu-name">{m.label}</p>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className={`spa-backdrop ${open ? 'is-open' : ''}`} onClick={close} />

      <div className="topbar">
        <button className="hamburger-menu" onClick={() => setOpen(!open)}>
          <i className="fa fa-bars" />
        </button>
        <div className="topbar-left">CSPL Software Release</div>
        <div className="topbar-right">
          <div className="welcome-message">
            Welcome, <span className="text-danger">{data.user.name}</span>
          </div>
          <a href="/global-logout" className="btn btn-link logout-btn">
            <i className="fa fa-sign-out-alt fa-2x" />
          </a>
        </div>
      </div>

      <div className="main-content">
        <Outlet context={data} />
      </div>

      <div className="app-footer">
        <span>CSPL Single Sign On</span>
        <span>Copyright &copy; {year} Condot Systems Pvt. Ltd. All rights reserved.</span>
      </div>
    </>
  )
}