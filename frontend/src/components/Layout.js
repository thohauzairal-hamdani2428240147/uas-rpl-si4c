import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Layout({ children, currentUser, onLogout }) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogoutClick = (e) => {
    e.preventDefault();
    if (window.confirm("Apakah Anda yakin ingin keluar dari sistem?")) {
      onLogout();
    }
    setSidebarOpen(false);
  };

  const getAvatarUrl = () => {
    if (currentUser && currentUser.avatar) {
      return currentUser.avatar; // Base64 string from DB
    }
    if (currentUser && currentUser.role === 'Admin') {
      return "https://lh3.googleusercontent.com/aida/ADBb0ugeQap6WBUkrjB6aT8PEqfXnw82Q755U28mWdIhqY4KnzUQBhI_OPGOHwqxeLRCuU5Dgc0GEYSMwSPVexlYszRV6zkzV8HomabL-gQi5yl4pvkMqyecGU8IdVR8yFQ4Bo8gQ2D2B_HJAGuOxH3t-9G2EWQnRIC3h4Wht9z1URcekZNgyFIWa01_Z4UxJIhHUULGVG6nyDj1qbdTE5yUdG_u1FJ05xHOxoP-OwUV6wcofb8s4JFedCuCKw";
    }
    return "https://lh3.googleusercontent.com/aida/ADBb0uiotwWAlFrV42tLjIuqgJbuV42Il9Qm8Ca54BPK_dGI2FxAeIOIYygvX5N6__AV5Y68fqi1RE9id89MFGPnq8zigwW3o15SVxwcQjN-lcgmtqt0dCNAbIJc3V_fxQzvlbQY9jYC6W_c7f1TnLUe2hjFZdIfSHM96EprdhAro8yiE2wzBkuGVf5ag5DN2mbK3mMdZQSWEmw3-M_vYx0mza_a9wx4OE0qXZaox8ItsO5yNOnzzz8MzcEd8A";
  };

  return (
    <div className="min-vh-100 bg-light">
      
      {/* Sidebar Overlay on mobile */}
      {sidebarOpen && (
        <div 
          className="jsc-sidebar-overlay" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 1. Persistent Sidebar */}
      <nav className={`jsc-sidebar shadow-sm ${sidebarOpen ? 'open' : ''}`}>
        <div className="mb-4 px-2 border-bottom border-secondary border-opacity-10 pb-3">
          <h1 className="font-headline-md text-headline-md font-bold text-white mb-1">JSC Arena</h1>
          <p className="text-white-50 text-[10px] font-bold uppercase tracking-wider mb-0">Sport City Management</p>
        </div>

        {/* Sidebar Navigation Menu */}
        <div className="d-flex flex-column gap-1 flex-grow-1">
          <Link 
            className={`sidebar-link ${location.pathname === '/' ? 'active' : ''}`}
            to="/"
            onClick={() => setSidebarOpen(false)}
          >
            <span className="material-symbols-outlined">calendar_month</span>
            <span>Jadwal Booking</span>
          </Link>

          {/* Profile Saya Page Link */}
          <Link 
            className={`sidebar-link ${location.pathname === '/profile' ? 'active' : ''}`}
            to="/profile"
            onClick={() => setSidebarOpen(false)}
          >
            <span className="material-symbols-outlined">person</span>
            <span>Profil Saya</span>
          </Link>

          {/* Admin Dashboard - Admin role access only */}
          {currentUser && currentUser.role === 'Admin' && (
            <Link 
              className={`sidebar-link ${location.pathname === '/admin' ? 'active' : ''}`}
              to="/admin"
              onClick={() => setSidebarOpen(false)}
            >
              <span className="material-symbols-outlined">monitoring</span>
              <span>Dasbor Admin</span>
            </Link>
          )}

          <hr className="my-2 border-secondary border-opacity-25" />

          {/* Logout Action */}
          <a 
            href="#logout" 
            className="sidebar-link text-danger"
            onClick={handleLogoutClick}
          >
            <span className="material-symbols-outlined text-danger">logout</span>
            <span>Keluar Sesi</span>
          </a>
        </div>

        {/* User Avatar Info Footer */}
        <div className="mt-auto border-top border-secondary border-opacity-25 pt-3">
          <div className="d-flex align-items-center gap-2 px-2">
            <img 
              alt="User Avatar" 
              className="rounded-circle border border-secondary border-opacity-20"
              style={{ width: '32px', height: '32px', objectFit: 'cover' }}
              src={getAvatarUrl()}
            />
            <div className="text-truncate">
              <p className="text-white text-xs fw-bold leading-none mb-0 text-truncate">{currentUser ? currentUser.nama : 'Guest'}</p>
              <p className="text-white-50 text-[10px] leading-none mb-0 mt-1">{currentUser ? currentUser.role : ''}</p>
            </div>
          </div>
        </div>
      </nav>

      {/* 2. TopBar */}
      <header className="jsc-topbar shadow-sm">
        <div className="d-flex align-items-center gap-2">
          {/* Menu Toggle Button for Mobile */}
          <button 
            type="button" 
            className="btn btn-link text-primary p-0 d-lg-none d-flex align-items-center justify-content-center border-0"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{ width: '40px', height: '40px', textDecoration: 'none' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>
              menu
            </span>
          </button>
          <h2 className="font-headline-md text-primary mb-0" style={{ fontSize: '1.15rem' }}>
            JSC Booking System
          </h2>
        </div>

        <div className="d-flex align-items-center gap-3">
          {/* Loyalty Points display for Tenant */}
          {currentUser && currentUser.role === 'Penyewa' && (
            <div className="badge bg-jsc-lime text-jsc-navy font-label-caps py-2 px-3 d-flex align-items-center gap-1">
              <span className="material-symbols-outlined text-sm">stars</span>
              <span>{currentUser.poinLoyalitas || 0} Pts</span>
            </div>
          )}
          
          {currentUser && currentUser.role === 'Admin' && (
            <div className="badge bg-danger font-label-caps py-2 px-3">
              ADMIN ACCESS
            </div>
          )}

          <div className="border-start ps-3 d-flex align-items-center gap-2">
            <img 
              src={getAvatarUrl()} 
              alt="Avatar Small" 
              className="rounded-circle border"
              style={{ width: '24px', height: '24px', objectFit: 'cover' }}
            />
            <span className="text-sm font-semibold text-primary d-none d-md-block">
              {currentUser ? currentUser.nama : ''}
            </span>
          </div>
        </div>
      </header>

      {/* 3. Main Content Canvas */}
      <main className="jsc-main-content">
        <div className="jsc-canvas">
          {children}
        </div>
      </main>

    </div>
  );
}
