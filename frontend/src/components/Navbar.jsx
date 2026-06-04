// src/components/Navbar.jsx

import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  if (!user) return null

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark px-4 shadow-sm">
      <Link className="navbar-brand fw-bold text-primary fs-4" to="/dashboard">
        SmartURL Pro
      </Link>
      <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#nav">
        <span className="navbar-toggler-icon" />
      </button>
      <div className="collapse navbar-collapse" id="nav">
        <ul className="navbar-nav ms-auto">
          <li className="nav-item dropdown">
            <a className="nav-link dropdown-toggle d-flex align-items-center" href="#" role="button" data-bs-toggle="dropdown">
              <span
                className="rounded-circle bg-secondary text-white d-inline-flex align-items-center justify-content-center me-2"
                style={{ width: 32, height: 32, fontSize: 14 }}
              >
                {user && user.username ? user.username.charAt(0).toUpperCase() : 'U'}
              </span>
              {user.username}
            </a>
            <ul className="dropdown-menu dropdown-menu-end dropdown-menu-dark">
              <li><span className="dropdown-item-text text-muted small">{user.email}</span></li>
              <li><hr className="dropdown-divider" /></li>
              <li>
                <button className="dropdown-item text-danger" onClick={handleLogout}>
                  Logout
                </button>
              </li>
            </ul>
          </li>
        </ul>
      </div>
    </nav>
  )
}
