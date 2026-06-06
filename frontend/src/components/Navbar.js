import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Navbar({ currentUser, onUserChange }) {
  const location = useLocation();

  const handleSelectUser = (e) => {
    const val = e.target.value;
    onUserChange(val);
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-jsc-navy sticky-top shadow-sm px-3">
      <div className="container-fluid">
        <Link className="navbar-brand d-flex align-items-center gap-2" to="/">
          <span className="material-symbols-outlined text-jsc-lime text-3xl">sports_soccer</span>
          <span className="font-headline-md tracking-tight text-white mb-0" style={{ fontSize: '1.25rem' }}>
            JSC Arena
          </span>
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <Link
                className={`nav-link d-flex align-items-center gap-1 ${location.pathname === '/' ? 'active text-jsc-lime fw-bold' : ''}`}
                to="/"
              >
                <span className="material-symbols-outlined text-sm">calendar_month</span>
                Booking Lapangan
              </Link>
            </li>
            <li className="nav-item">
              <Link
                className={`nav-link d-flex align-items-center gap-1 ${location.pathname === '/admin' ? 'active text-jsc-lime fw-bold' : ''}`}
                to="/admin"
              >
                <span className="material-symbols-outlined text-sm">monitoring</span>
                Dasbor Admin
              </Link>
            </li>
          </ul>

          <div className="d-flex align-items-center gap-3">
            {/* User Session Simulator Dropdown */}
            <div className="d-flex align-items-center bg-dark bg-opacity-25 rounded px-2 py-1 gap-2">
              <span className="material-symbols-outlined text-secondary text-sm text-jsc-lime">account_circle</span>
              <select
                className="form-select form-select-sm bg-transparent border-0 text-white text-xs"
                style={{ width: '170px', outline: 'none', boxShadow: 'none', cursor: 'pointer' }}
                value={currentUser.id}
                onChange={handleSelectUser}
              >
                <option value="1" className="bg-jsc-navy text-white">Ahmad (Penyewa)</option>
                <option value="2" className="bg-jsc-navy text-white">Budi (Penyewa)</option>
                <option value="3" className="bg-jsc-navy text-white">Admin (JSC Admin)</option>
              </select>
            </div>

            {/* Loyalty Points display for Tenant */}
            {currentUser.role === 'Penyewa' && (
              <div className="badge bg-jsc-lime text-jsc-navy font-label-caps py-2 px-3 d-flex align-items-center gap-1">
                <span className="material-symbols-outlined text-sm">stars</span>
                <span>{currentUser.poinLoyalitas} Pts</span>
              </div>
            )}
            
            {currentUser.role === 'Admin' && (
              <div className="badge bg-danger font-label-caps py-2 px-3">
                ADMIN ACCESS
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
