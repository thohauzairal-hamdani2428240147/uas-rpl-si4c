import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiService } from '../services/api';

export default function RegisterPage({ onLoginSuccess }) {
  const [formData, setFormData] = useState({
    nama: '',
    nickname: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { nama, nickname, email, password, confirmPassword } = formData;

    if (!nama || !nickname || !email || !password || !confirmPassword) {
      setError('Harap isi semua kolom registrasi.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Password dan Konfirmasi Password tidak cocok.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await apiService.register({
        nama,
        nickname,
        email,
        password,
        confirmPassword
      });

      // Auto-login on successful registration
      localStorage.setItem('token', res.token);
      localStorage.setItem('user', JSON.stringify(res.data));
      onLoginSuccess(res.token, res.data);
      
      alert('Registrasi Berhasil! Selamat datang di JSC Arena Booking.');
      navigate('/');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Registrasi gagal. Email atau Nickname mungkin sudah terdaftar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-vh-100 d-flex align-items-center justify-content-center px-3 py-5"
      style={{
        backgroundImage: 'radial-gradient(circle at 10% 20%, rgb(0, 31, 63) 0%, rgb(0, 6, 19) 90.1%)',
        backgroundColor: '#000613'
      }}
    >
      <div className="card border-0 shadow-lg overflow-hidden w-100" style={{ maxWidth: '460px', borderRadius: '16px' }}>
        {/* Header */}
        <div className="bg-jsc-navy text-white text-center p-4 position-relative">
          <div 
            className="position-absolute top-0 start-0 w-100 h-100 opacity-10" 
            style={{
              backgroundImage: 'radial-gradient(var(--jsc-secondary-lime) 1px, transparent 0)',
              backgroundSize: '16px 16px'
            }}
          />
          <span className="material-symbols-outlined text-jsc-lime mb-2" style={{ fontSize: '48px' }}>
            app_registration
          </span>
          <h3 className="font-headline-md font-bold mb-1">Daftar Akun JSC</h3>
          <p className="text-white-50 text-xs mb-0">Bergabung untuk memesan lapangan olahraga premium</p>
        </div>

        {/* Form Body */}
        <div className="card-body p-4 bg-white">
          {error && (
            <div className="alert alert-danger border-0 rounded-3 text-xs p-3 mb-3 d-flex align-items-center gap-2">
              <span className="material-symbols-outlined text-base">error</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="mb-3">
              <label className="form-label text-xs fw-bold text-muted uppercase">Nama Lengkap</label>
              <input 
                type="text" 
                name="nama"
                className="form-control bg-light border-0 text-sm py-2" 
                placeholder="Masukkan nama lengkap Anda"
                value={formData.nama}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div className="mb-3">
              <label className="form-label text-xs fw-bold text-muted uppercase">Nickname</label>
              <input 
                type="text" 
                name="nickname"
                className="form-control bg-light border-0 text-sm py-2" 
                placeholder="Pilih nickname unik (misal: ahmad123)"
                value={formData.nickname}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div className="mb-3">
              <label className="form-label text-xs fw-bold text-muted uppercase">Email</label>
              <input 
                type="email" 
                name="email"
                className="form-control bg-light border-0 text-sm py-2" 
                placeholder="Masukkan alamat email aktif"
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div className="mb-3">
              <label className="form-label text-xs fw-bold text-muted uppercase">Password</label>
              <input 
                type="password" 
                name="password"
                className="form-control bg-light border-0 text-sm py-2" 
                placeholder="Buat password minimal 6 karakter"
                value={formData.password}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div className="mb-4">
              <label className="form-label text-xs fw-bold text-muted uppercase">Konfirmasi Password</label>
              <input 
                type="password" 
                name="confirmPassword"
                className="form-control bg-light border-0 text-sm py-2" 
                placeholder="Masukkan kembali password"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-jsc-lime w-100 py-3 font-bold d-flex align-items-center justify-content-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                  <span>Mendaftarkan...</span>
                </>
              ) : (
                <>
                  <span>Buat Akun & Masuk</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          <div className="text-center mt-4">
            <p className="text-xs text-muted mb-0">
              Sudah memiliki akun? <Link to="/login" className="text-jsc-secondary fw-bold text-decoration-none">Masuk di sini</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
