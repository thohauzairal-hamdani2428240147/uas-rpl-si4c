import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import BookingPage from './pages/BookingPage';
import AdminDashboard from './pages/AdminDashboard';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import AdminSchedule from './pages/AdminSchedule';
import StaffScan from './pages/StaffScan';
import AdminFields from './pages/AdminFields';
import AdminStaff from './pages/AdminStaff';
import MyBookings from './pages/MyBookings';
import { apiService } from './services/api';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [appReady, setAppReady] = useState(false);

  // Sync user details (points/avatar/info) from DB using JWT
  const refreshUserPoints = useCallback(async () => {
    if (!token) return;
    try {
      const res = await apiService.getProfile();
      setCurrentUser(res.data);
      localStorage.setItem('user', JSON.stringify(res.data));
    } catch (error) {
      console.error('Failed to sync user profile:', error);
      if (error.response && error.response.status === 401) {
        // Token invalid or expired
        handleLogout();
      }
    }
  }, [token]);

  // Handle successful login or registration
  const handleLoginSuccess = (newToken, userDetails) => {
    setToken(newToken);
    setCurrentUser(userDetails);
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setCurrentUser(null);
  };

  // Handle profile update
  const handleProfileUpdated = (updatedUser) => {
    setCurrentUser(updatedUser);
  };

  // Verify and sync profile on initial mount
  useEffect(() => {
    async function initAuth() {
      if (token) {
        try {
          const res = await apiService.getProfile();
          setCurrentUser(res.data);
          localStorage.setItem('user', JSON.stringify(res.data));
        } catch (error) {
          console.error('Session validation failed:', error);
          handleLogout();
        }
      }
      setAppReady(true);
    }
    initAuth();
  }, [token]);

  if (!appReady) {
    return (
      <div className="min-vh-100 bg-light d-flex align-items-center justify-content-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // Redirect to login if token or user session is missing
  if (!token || !currentUser) {
    return (
      <Router>
        <Routes>
          <Route path="/register" element={<RegisterPage onLoginSuccess={handleLoginSuccess} />} />
          <Route path="/login" element={<LoginPage onLoginSuccess={handleLoginSuccess} />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    );
  }

  return (
    <Router>
      <Layout currentUser={currentUser} onLogout={handleLogout}>
        <Routes>
          <Route 
            path="/" 
            element={
              currentUser.role === 'Admin' ? (
                <Navigate to="/admin" replace />
              ) : currentUser.role === 'Staff' ? (
                <Navigate to="/admin/schedule" replace />
              ) : (
                <BookingPage 
                  currentUser={currentUser} 
                  refreshUserPoints={refreshUserPoints} 
                />
              )
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProfilePage 
                currentUser={currentUser} 
                onProfileUpdated={handleProfileUpdated} 
              />
            } 
          />
          <Route 
            path="/bookings" 
            element={
              currentUser.role === 'Penyewa' ? (
                <MyBookings currentUser={currentUser} />
              ) : (
                <Navigate to="/" replace />
              )
            } 
          />

          {/* Admin & Staff Shared Routes */}
          {(currentUser.role === 'Admin' || currentUser.role === 'Staff') && (
            <>
              <Route 
                path="/admin/schedule" 
                element={<AdminSchedule currentUser={currentUser} />} 
              />
              <Route 
                path="/staff/scan" 
                element={<StaffScan />} 
              />
            </>
          )}

          {/* Admin-only Routes */}
          {currentUser.role === 'Admin' && (
            <>
              <Route 
                path="/admin" 
                element={<AdminDashboard currentUser={currentUser} />} 
              />
              <Route 
                path="/admin/fields" 
                element={<AdminFields />} 
              />
              <Route 
                path="/admin/staff" 
                element={<AdminStaff />} 
              />
            </>
          )}

          {/* Role-based Redirection for Unauthorized Routes */}
          <Route 
            path="/admin/*" 
            element={
              currentUser.role === 'Staff' 
                ? <Navigate to="/admin/schedule" replace /> 
                : <Navigate to="/" replace />
            } 
          />
          <Route 
            path="/staff/*" 
            element={
              currentUser.role === 'Staff' 
                ? <Navigate to="/admin/schedule" replace /> 
                : <Navigate to="/" replace />
            } 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}
