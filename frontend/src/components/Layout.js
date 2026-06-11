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
    <div className="min-vh-100 bg-light mesh-gradient-bg">
      
      {/* Sidebar Overlay on mobile */}
      {sidebarOpen && (
        <div 
          className="jsc-sidebar-overlay" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 1. Persistent Sidebar */}
      <nav className={`jsc-sidebar shadow-sm ${sidebarOpen ? 'open' : ''}`} style={{ backgroundColor: '#0B0D14', borderRight: '1px solid rgba(255, 255, 255, 0.05)' }}>
        {/* Brand Logo Header */}
        <div className="p-4">
          <h1 className="font-headline-lg text-headline-lg text-white font-bold mb-0" style={{ fontSize: '24px', letterSpacing: '-0.5px' }}>JSC SportPass</h1>
          <p className="text-jsc-lime text-sm mt-1 mb-0 font-semibold">{currentUser ? currentUser.role : 'Guest'} Console</p>
        </div>



        {/* Sidebar Navigation Menu */}
        <div className="d-flex flex-column gap-1 flex-grow-1">
          {/* Menu for Penyewa */}
          {currentUser && currentUser.role === 'Penyewa' && (
            <>
              <Link 
                className={`sidebar-link ${location.pathname === '/' ? 'active' : ''}`}
                to="/"
                onClick={() => setSidebarOpen(false)}
              >
                <span className="material-symbols-outlined">dashboard</span>
                <span>Dashboard</span>
              </Link>
              <Link 
                className={`sidebar-link ${location.pathname === '/bookings' ? 'active' : ''}`}
                to="/bookings"
                onClick={() => setSidebarOpen(false)}
              >
                <span className="material-symbols-outlined">event_available</span>
                <span>Bookings</span>
              </Link>
            </>
          )}

          {/* Menu for Staff */}
          {currentUser && currentUser.role === 'Staff' && (
            <>
              <Link 
                className={`sidebar-link ${location.pathname === '/admin/schedule' ? 'active' : ''}`}
                to="/admin/schedule"
                onClick={() => setSidebarOpen(false)}
              >
                <span className="material-symbols-outlined">event_available</span>
                <span>Bookings</span>
              </Link>
              <Link 
                className={`sidebar-link ${location.pathname === '/staff/scan' ? 'active' : ''}`}
                to="/staff/scan"
                onClick={() => setSidebarOpen(false)}
              >
                <span className="material-symbols-outlined">qr_code_scanner</span>
                <span>Scan E-Ticket</span>
              </Link>
            </>
          )}

          {/* Menu for Admin */}
          {currentUser && currentUser.role === 'Admin' && (
            <>
              <Link 
                className={`sidebar-link ${location.pathname === '/admin' && location.hash !== '#finances' ? 'active' : ''}`}
                to="/admin"
                onClick={() => {
                  setSidebarOpen(false);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                <span className="material-symbols-outlined">dashboard</span>
                <span>Dashboard</span>
              </Link>
              
              <Link 
                className={`sidebar-link ${location.pathname === '/admin/fields' ? 'active' : ''}`}
                to="/admin/fields"
                onClick={() => setSidebarOpen(false)}
              >
                <span className="material-symbols-outlined">sports_tennis</span>
                <span>Facilities</span>
              </Link>

              <Link 
                className={`sidebar-link ${location.pathname === '/admin/schedule' ? 'active' : ''}`}
                to="/admin/schedule"
                onClick={() => setSidebarOpen(false)}
              >
                <span className="material-symbols-outlined">event_available</span>
                <span>Bookings</span>
              </Link>

              <Link 
                className={`sidebar-link ${location.pathname === '/admin/staff' ? 'active' : ''}`}
                to="/admin/staff"
                onClick={() => setSidebarOpen(false)}
              >
                <span className="material-symbols-outlined">group</span>
                <span>Members</span>
              </Link>

              <Link 
                className={`sidebar-link ${location.hash === '#finances' ? 'active' : ''}`}
                to="/admin#finances"
                onClick={() => {
                  setSidebarOpen(false);
                  setTimeout(() => {
                    const el = document.getElementById('finances-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                }}
              >
                <span className="material-symbols-outlined">payments</span>
                <span>Finances</span>
              </Link>
            </>
          )}
        </div>

        {/* Bottom Section: Settings & Logout */}
        <div className="p-3 mt-auto border-top border-secondary border-opacity-10">
          <Link 
            className={`sidebar-link ${location.pathname === '/profile' ? 'active' : ''}`}
            to="/profile"
            onClick={() => setSidebarOpen(false)}
            style={{ margin: '2px 0' }}
          >
            <span className="material-symbols-outlined">settings</span>
            <span>Settings</span>
          </Link>
          <a 
            href="#logout"
            className="sidebar-link text-danger"
            onClick={handleLogoutClick}
            style={{ margin: '2px 0' }}
          >
            <span className="material-symbols-outlined text-danger">logout</span>
            <span className="text-danger">Log Out</span>
          </a>

          {/* User Profile Footer */}
          <div className="d-flex align-items-center gap-3 px-3 pt-3 mt-3 border-top border-secondary border-opacity-10">
            <img 
              alt="User Profile" 
              className="rounded-circle"
              style={{ width: '40px', height: '40px', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.1)' }}
              src={getAvatarUrl()}
            />
            <div className="text-truncate" style={{ lineHeight: '1.2' }}>
              <p className="text-white text-sm fw-semibold mb-0 text-truncate">{currentUser ? currentUser.nama : 'Guest'}</p>
              <p className="text-white-50 text-xs mb-0 mt-1">{currentUser ? currentUser.role : ''}</p>
            </div>
          </div>
        </div>
      </nav>

      {/* 2. TopBar */}
      <header className="jsc-topbar shadow-sm" style={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
        <div className="d-flex align-items-center gap-2">
          {/* Menu Toggle Button for Mobile */}
          <button 
            type="button" 
            className="btn btn-link text-dark p-0 d-lg-none d-flex align-items-center justify-content-center border-0"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{ width: '40px', height: '40px', textDecoration: 'none' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>
              menu
            </span>
          </button>
          <h2 className="font-headline-md text-dark mb-0" style={{ fontSize: '1.15rem', fontFamily: 'Plus Jakarta Sans', fontWeight: '800', letterSpacing: '-0.5px' }}>
            JSC SportPass
          </h2>
        </div>

        <div className="d-flex align-items-center gap-3">


          {/* Loyalty Points display for Tenant */}
          {currentUser && currentUser.role === 'Penyewa' && (
            <div className="badge bg-jsc-lime text-jsc-primary font-label-caps py-2 px-3 d-flex align-items-center gap-1 shadow-sm">
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
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
              style={{ width: '28px', height: '28px', objectFit: 'cover' }}
            />
            <span className="text-sm font-semibold text-dark d-none d-md-block">
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

      {/* 4. Mobile Bottom Navigation Bar */}
      {currentUser && (
        <nav className="mobile-bottom-nav">
          {currentUser.role === 'Penyewa' && (
            <>
              <Link 
                className={`mobile-nav-link ${location.pathname === '/' ? 'active' : ''}`}
                to="/"
              >
                <div className="mobile-icon-wrapper">
                  <span className="material-symbols-outlined">calendar_month</span>
                </div>
                <span>Jadwal</span>
              </Link>
              <Link 
                className={`mobile-nav-link ${location.pathname === '/bookings' ? 'active' : ''}`}
                to="/bookings"
              >
                <div className="mobile-icon-wrapper">
                  <span className="material-symbols-outlined">history</span>
                </div>
                <span>Riwayat</span>
              </Link>
            </>
          )}

          {currentUser.role === 'Staff' && (
            <>
              <Link 
                className={`mobile-nav-link ${location.pathname === '/admin/schedule' ? 'active' : ''}`}
                to="/admin/schedule"
              >
                <div className="mobile-icon-wrapper">
                  <span className="material-symbols-outlined">calendar_month</span>
                </div>
                <span>Jadwal</span>
              </Link>
              <Link 
                className={`mobile-nav-link ${location.pathname === '/staff/scan' ? 'active' : ''}`}
                to="/staff/scan"
              >
                <div className="mobile-icon-wrapper">
                  <span className="material-symbols-outlined">qr_code_scanner</span>
                </div>
                <span>Scan</span>
              </Link>
            </>
          )}

          {currentUser.role === 'Admin' && (
            <>
              <Link 
                className={`mobile-nav-link ${location.pathname === '/admin' ? 'active' : ''}`}
                to="/admin"
              >
                <div className="mobile-icon-wrapper">
                  <span className="material-symbols-outlined">monitoring</span>
                </div>
                <span>Dasbor</span>
              </Link>
              <Link 
                className={`mobile-nav-link ${location.pathname === '/admin/schedule' ? 'active' : ''}`}
                to="/admin/schedule"
              >
                <div className="mobile-icon-wrapper">
                  <span className="material-symbols-outlined">calendar_month</span>
                </div>
                <span>Jadwal</span>
              </Link>
              <Link 
                className={`mobile-nav-link ${location.pathname === '/admin/fields' ? 'active' : ''}`}
                to="/admin/fields"
              >
                <div className="mobile-icon-wrapper">
                  <span className="material-symbols-outlined">sports_soccer</span>
                </div>
                <span>Lapangan</span>
              </Link>
              <Link 
                className={`mobile-nav-link ${location.pathname === '/admin/staff' ? 'active' : ''}`}
                to="/admin/staff"
              >
                <div className="mobile-icon-wrapper">
                  <span className="material-symbols-outlined">badge</span>
                </div>
                <span>Staf</span>
              </Link>
            </>
          )}

          <Link 
            className={`mobile-nav-link ${location.pathname === '/profile' ? 'active' : ''}`}
            to="/profile"
          >
            <div className="mobile-icon-wrapper">
              <span className="material-symbols-outlined">person</span>
            </div>
            <span>Profil</span>
          </Link>
        </nav>
      )}

    </div>
  );
}
