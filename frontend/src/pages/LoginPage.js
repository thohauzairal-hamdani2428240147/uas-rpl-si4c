import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiService } from '../services/api';

export default function LoginPage({ onLoginSuccess }) {
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [seedStatus, setSeedStatus] = useState('');
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

  const handleSeedDatabase = async () => {
    setSeedStatus('seeding');
    try {
      await apiService.seedDatabase();
      setSeedStatus('success');
      alert('Database berhasil direset dan diisi data awal (seeder)! Hubungkan ulang sesi tes Anda.');
    } catch (err) {
      console.error(err);
      setSeedStatus('failed');
      const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message;
      alert(`Gagal me-reset database. Error: ${errorMsg}`);
    }
  };

  return (
    <div 
      className="min-vh-100 d-flex align-items-center justify-content-center px-3"
      style={{
        backgroundImage: 'radial-gradient(circle at 10% 20%, rgb(0, 31, 63) 0%, rgb(0, 6, 19) 90.1%)',
        backgroundColor: '#000613'
      }}
    >
      <div className="card border-0 shadow-lg overflow-hidden w-100" style={{ maxWidth: '420px', borderRadius: '16px' }}>
        {/* Header Graphic */}
        <div className="bg-jsc-navy text-white text-center p-4 position-relative">
          <div 
            className="position-absolute top-0 start-0 w-100 h-100 opacity-10" 
            style={{
              backgroundImage: 'radial-gradient(var(--jsc-secondary-lime) 1px, transparent 0)',
              backgroundSize: '16px 16px'
            }}
          />
          <span className="material-symbols-outlined text-jsc-lime mb-2" style={{ fontSize: '48px' }}>
            sports_soccer
          </span>
          <h3 className="font-headline-md font-bold mb-1">JSC Arena Booking</h3>
          <p className="text-white-50 text-xs mb-0">Masuk ke Sistem Manajemen Booking Jakabaring</p>
        </div>

        {/* Card Body */}
        <div className="card-body p-4 bg-white">
          {error && (
            <div className="alert alert-danger border-0 rounded-3 text-xs p-3 mb-3 d-flex align-items-center gap-2">
              <span className="material-symbols-outlined text-base">error</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="mb-3">
              <label className="form-label text-xs fw-bold text-muted uppercase">Email atau Nickname</label>
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0">
                  <span className="material-symbols-outlined text-muted text-sm">person</span>
                </span>
                <input 
                  type="text" 
                  className="form-control bg-light border-start-0 ps-0 text-sm" 
                  placeholder="Masukkan email atau nickname"
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="form-label text-xs fw-bold text-muted uppercase">Password</label>
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0">
                  <span className="material-symbols-outlined text-muted text-sm">lock</span>
                </span>
                <input 
                  type="password" 
                  className="form-control bg-light border-start-0 ps-0 text-sm" 
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-jsc-lime w-100 py-3 font-bold d-flex align-items-center justify-content-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <span>Masuk</span>
                  <span className="material-symbols-outlined text-sm">login</span>
                </>
              )}
            </button>
          </form>

          <div className="text-center mt-4">
            <p className="text-xs text-muted mb-0">
              Belum punya akun? <Link to="/register" className="text-jsc-secondary fw-bold text-decoration-none">Daftar Akun Baru</Link>
            </p>
          </div>
        </div>

        {/* Footer info/seeder */}
        <div className="card-footer bg-light border-top-0 px-4 py-3 text-center">
          <button 
            type="button" 
            className="btn btn-outline-secondary w-100 py-1.5 text-xs d-flex align-items-center justify-content-center gap-1"
            onClick={handleSeedDatabase}
            disabled={seedStatus === 'seeding'}
          >
            <span className={`material-symbols-outlined text-xs ${seedStatus === 'seeding' ? 'spin-icon' : ''}`}>
              sync
            </span>
            <span>{seedStatus === 'seeding' ? 'Sedang mereset...' : 'Reset & Seed Database (MySQL)'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
