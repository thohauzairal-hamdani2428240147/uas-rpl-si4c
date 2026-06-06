import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import BookingPage from './pages/BookingPage';
import AdminDashboard from './pages/AdminDashboard';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
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
              <BookingPage 
                currentUser={currentUser} 
                refreshUserPoints={refreshUserPoints} 
              />
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
          {currentUser.role === 'Admin' ? (
            <Route 
              path="/admin" 
              element={<AdminDashboard currentUser={currentUser} />} 
            />
          ) : (
            <Route 
              path="/admin" 
              element={<Navigate to="/" replace />} 
            />
          )}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}
