import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiService } from '../services/api';

export default function LoginPage({ onLoginSuccess }) {
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!loginIdentifier || !password) {
      setError('Harap isi semua kolom login.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await apiService.login(loginIdentifier, password);
      // Store token and user details
      localStorage.setItem('token', res.token);
      localStorage.setItem('user', JSON.stringify(res.data));
      onLoginSuccess(res.token, res.data);
      
      // Redirect based on role
      if (res.data.role === 'Admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Login gagal. Periksa kembali email/nickname dan password Anda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-vh-100 d-flex align-items-center justify-content-center px-3 py-5"
      style={{
        backgroundImage: 'linear-gradient(to bottom, rgba(9, 13, 22, 0.2), rgba(2, 3, 5, 0.4)), url("/images/hero-banner.svg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundColor: '#020305'
      }}
    >
      <div 
        className="w-100 shadow-2xl" 
        style={{ 
          maxWidth: '420px', 
          borderRadius: '24px', 
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.85) 0%, rgba(121, 255, 91, 0.2) 100%)', 
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.6)',
          overflow: 'hidden'
        }}
      >
        {/* Header Graphic */}
        <div className="text-center pt-5 pb-4 px-4">
          <h3 className="font-headline-md font-bold mb-1" style={{ fontFamily: 'Plus Jakarta Sans', color: '#0B0D14', fontWeight: '800', letterSpacing: '-0.5px' }}>
            JSC SportPass
          </h3>
          <p className="text-muted text-xs mb-0 fw-semibold">Jakabaring Sport City Booking Console</p>
        </div>

        {/* Card Body */}
        <div className="p-4 pt-0">
          {error && (
            <div 
              className="alert alert-danger border-0 text-xs p-3 mb-4 d-flex align-items-center gap-2"
              style={{ borderRadius: '12px', backgroundColor: 'rgba(239, 68, 68, 0.12)', color: '#b30000', border: '1px solid rgba(239, 68, 68, 0.2)' }}
            >
              <span className="material-symbols-outlined text-base">error</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="mb-3">
              <label className="form-label text-xs fw-bold text-dark text-opacity-75 uppercase mb-2" style={{ letterSpacing: '0.5px' }}>Email atau Nickname</label>
              <div 
                className="input-group rounded-3 overflow-hidden" 
                style={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.65)', 
                  border: '1px solid rgba(0, 0, 0, 0.12)' 
                }}
              >
                <span className="input-group-text bg-transparent border-0 pe-1 text-muted">
                  <span className="material-symbols-outlined text-sm">person</span>
                </span>
                <input 
                  type="text" 
                  className="form-control bg-transparent border-0 ps-1 text-sm py-2.5 text-dark" 
                  placeholder="Masukkan email atau nickname"
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  disabled={loading}
                  style={{ boxShadow: 'none', color: '#000' }}
                  required
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="form-label text-xs fw-bold text-dark text-opacity-75 uppercase mb-2" style={{ letterSpacing: '0.5px' }}>Password</label>
              <div 
                className="input-group rounded-3 overflow-hidden" 
                style={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.65)', 
                  border: '1px solid rgba(0, 0, 0, 0.12)' 
                }}
              >
                <span className="input-group-text bg-transparent border-0 pe-1 text-muted">
                  <span className="material-symbols-outlined text-sm">lock</span>
                </span>
                <input 
                  type="password" 
                  className="form-control bg-transparent border-0 ps-1 text-sm py-2.5 text-dark" 
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  style={{ boxShadow: 'none', color: '#000' }}
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="btn w-100 py-2.5 font-bold d-flex align-items-center justify-content-center gap-2 rounded-3 shadow-lg"
              disabled={loading}
              style={{
                backgroundColor: '#0B0D14',
                color: '#ffffff',
                boxShadow: '0 4px 15px rgba(11, 13, 20, 0.25)'
              }}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm text-white" role="status" aria-hidden="true" />
                  <span className="text-white">Memproses...</span>
                </>
              ) : (
                <>
                  <span>Masuk Ke Sistem</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          <div className="text-center mt-4 pt-2 border-top border-dark border-opacity-10">
            <p className="text-xs mb-0" style={{ color: '#1e293b' }}>
              Belum punya akun? <Link to="/register" className="fw-bold text-decoration-none" style={{ color: '#0a58ca' }}>Daftar Akun Baru</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
