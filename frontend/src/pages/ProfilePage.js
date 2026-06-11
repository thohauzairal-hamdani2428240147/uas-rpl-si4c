import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';

export default function ProfilePage({ currentUser, onProfileUpdated }) {
  const [formData, setFormData] = useState({
    nama: '',
    nickname: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [avatarBase64, setAvatarBase64] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Sync profile details on mount or user update
  useEffect(() => {
    if (currentUser) {
      setFormData({
        nama: currentUser.nama || '',
        nickname: currentUser.nickname || '',
        email: currentUser.email || '',
        password: '',
        confirmPassword: ''
      });
      setAvatarBase64(currentUser.avatar || '');
    }
  }, [currentUser]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Convert uploaded image file to Base64
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: 'danger', text: 'Ukuran file terlalu besar. Maksimal 2MB.' });
      return;
    }

    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'danger', text: 'Format file tidak didukung. Harus berupa file gambar.' });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarBase64(reader.result); // Base64 Data URL
      setMessage({ type: 'success', text: 'Foto profil siap diunggah. Klik "Simpan Perubahan" untuk menyimpan.' });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { nama, nickname, email, password, confirmPassword } = formData;

    if (!nama || !nickname || !email) {
      setMessage({ type: 'danger', text: 'Nama Lengkap, Nickname, dan Email tidak boleh kosong.' });
      return;
    }

    if (password && password !== confirmPassword) {
      setMessage({ type: 'danger', text: 'Konfirmasi password baru tidak cocok.' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const updateData = {
        nama,
        nickname,
        email,
        avatar: avatarBase64
      };

      if (password) {
        updateData.password = password;
      }

      const res = await apiService.updateProfile(updateData);
      
      // Update local storage
      localStorage.setItem('user', JSON.stringify(res.data));
      onProfileUpdated(res.data);
      
      // Clear password inputs
      setFormData(prev => ({
        ...prev,
        password: '',
        confirmPassword: ''
      }));

      setMessage({ type: 'success', text: 'Profil Anda berhasil diperbarui!' });
    } catch (err) {
      console.error(err);
      setMessage({
        type: 'danger',
        text: err.response?.data?.message || 'Gagal memperbarui profil. Nickname atau Email mungkin sudah terpakai.'
      });
    } finally {
      setLoading(false);
    }
  };

  const getDefaultAvatar = () => {
    if (currentUser && currentUser.role === 'Admin') {
      return "https://lh3.googleusercontent.com/aida/ADBb0ugeQap6WBUkrjB6aT8PEqfXnw82Q755U28mWdIhqY4KnzUQBhI_OPGOHwqxeLRCuU5Dgc0GEYSMwSPVexlYszRV6zkzV8HomabL-gQi5yl4pvkMqyecGU8IdVR8yFQ4Bo8gQ2D2B_HJAGuOxH3t-9G2EWQnRIC3h4Wht9z1URcekZNgyFIWa01_Z4UxJIhHUULGVG6nyDj1qbdTE5yUdG_u1FJ05xHOxoP-OwUV6wcofb8s4JFedCuCKw";
    }
    return "https://lh3.googleusercontent.com/aida/ADBb0uiotwWAlFrV42tLjIuqgJbuV42Il9Qm8Ca54BPK_dGI2FxAeIOIYygvX5N6__AV5Y68fqi1RE9id89MFGPnq8zigwW3o15SVxwcQjN-lcgmtqt0dCNAbIJc3V_fxQzvlbQY9jYC6W_c7f1TnLUe2hjFZdIfSHM96EprdhAro8yiE2wzBkuGVf5ag5DN2mbK3mMdZQSWEmw3-M_vYx0mza_a9wx4OE0qXZaox8ItsO5yNOnzzz8MzcEd8A";
  };

  return (
    <div className="container py-4">
      {/* Hero Header */}
      <div 
        className="jsc-hero-header position-relative overflow-hidden text-white rounded-4 mb-4 p-5 d-flex flex-column justify-content-end shadow-sm"
        style={{
          backgroundImage: 'linear-gradient(to top, rgba(0, 0, 0, 0.95), rgba(0, 0, 0, 0.4)), url("/images/hero-banner.svg"), url("https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1600")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          borderRadius: '16px'
        }}
      >
        <span 
          className="badge text-jsc-primary font-label-caps align-self-start mb-2 px-3 py-2 border border-success border-opacity-25"
          style={{ borderRadius: '999px', backgroundColor: 'rgba(121, 255, 91, 0.2)', color: 'var(--jsc-secondary-lime)' }}
        >
          Akun Pengguna
        </span>
        <h1 className="font-headline-lg mb-1" style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: '800' }}>
          Pengaturan Profil
        </h1>
        <p className="text-white-50 font-body-md mb-0">Kelola informasi data diri, foto profil, dan kredensial Anda</p>
      </div>

      <div className="row g-4">
        {/* Left Column: Avatar Display & Loyalty Card */}
        <div className="col-12 col-md-4">
          <div className="glass-panel p-4 mb-4 text-center" style={{ borderRadius: '16px' }}>
            <div className="text-center mb-3">
              <div className="position-relative d-inline-block">
                <img 
                  src={avatarBase64 || getDefaultAvatar()} 
                  alt="Avatar" 
                  className="rounded-circle border border-4 shadow-sm mb-3"
                  style={{ 
                    width: '150px', 
                    height: '150px', 
                    objectFit: 'cover',
                    borderColor: 'var(--jsc-secondary-lime)'
                  }}
                />
              </div>
              <div className="px-2">
                <label className="form-label text-[10px] text-muted fw-bold uppercase d-block mb-1.5">Pilih Foto Profil Baru</label>
                <input 
                  type="file" 
                  className="form-control form-control-sm text-xs bg-white bg-opacity-50 border border-light" 
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ borderRadius: '8px' }}
                />
                <p className="text-[9px] text-muted mt-1 mb-0">Format: JPG, PNG. Maksimal 2MB.</p>
              </div>
            </div>
            
            <h5 className="font-bold text-jsc-primary mb-1" style={{ fontFamily: 'Plus Jakarta Sans', fontSize: '18px' }}>{currentUser.nama}</h5>
            <p className="text-muted text-sm mb-3">@{currentUser.nickname}</p>

            <span className={`badge ${currentUser.role === 'Admin' ? 'bg-danger' : 'bg-dark'} font-label-caps py-2 px-3 mb-4`} style={{ borderRadius: '6px' }}>
              {currentUser.role}
            </span>

            {/* Loyalty points banner (Futuristic Sport Pass Design) */}
            {currentUser.role === 'Penyewa' && (
              <div 
                className="rounded-4 p-3 text-start text-white position-relative overflow-hidden shadow-sm border border-secondary border-opacity-10"
                style={{ 
                  background: 'linear-gradient(135deg, #05070a 0%, #0d121c 100%)',
                  borderRadius: '14px'
                }}
              >
                {/* Radial glowing element in card */}
                <div className="position-absolute" style={{ width: '150px', height: '150px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(121, 255, 91, 0.15) 0%, transparent 70%)', top: '-75px', right: '-75px' }}></div>
                
                <div className="d-flex align-items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-jsc-lime">stars</span>
                  <h6 className="font-label-caps text-white mb-0" style={{ letterSpacing: '1px' }}>LOYALTY MEMBER</h6>
                </div>
                <p className="text-white-50 mb-3" style={{ fontSize: '11px' }}>Setiap transaksi pemesanan lapangan menghasilkan koin bonus.</p>
                
                <div className="d-flex justify-content-between align-items-end">
                  <div>
                    <span className="text-white-50 text-[9px] d-block uppercase font-bold">Saldo Koin</span>
                    <h3 className="font-bold mb-0 text-white" style={{ fontFamily: 'JetBrains Mono', fontSize: '26px' }}>
                      {currentUser.poinLoyalitas}
                    </h3>
                  </div>
                  <span 
                    className="badge text-jsc-primary font-bold text-xs px-2.5 py-1.5"
                    style={{ backgroundColor: 'var(--jsc-secondary-lime)', borderRadius: '6px' }}
                  >
                    PRO ACTIVE
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Profile Form */}
        <div className="col-12 col-md-8">
          <div className="glass-panel p-4" style={{ borderRadius: '16px' }}>
            <h4 className="font-headline-md text-jsc-primary mb-4" style={{ fontFamily: 'Plus Jakarta Sans' }}>Ubah Data Diri</h4>

            {message.text && (
              <div className={`alert alert-${message.type} border-0 rounded-3 text-sm p-3 mb-4 d-flex align-items-center gap-2`} style={{ borderRadius: '8px' }}>
                <span className="material-symbols-outlined">
                  {message.type === 'success' ? 'check_circle' : 'error'}
                </span>
                <span>{message.text}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                <div className="col-12 col-md-6">
                  <label className="form-label text-xs fw-bold text-muted uppercase">Nama Lengkap</label>
                  <input 
                    type="text" 
                    name="nama"
                    className="form-control text-sm bg-white bg-opacity-70 border border-light"
                    value={formData.nama}
                    onChange={handleChange}
                    disabled={loading}
                    style={{ borderRadius: '8px', padding: '10px 12px' }}
                  />
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label text-xs fw-bold text-muted uppercase">Nickname</label>
                  <input 
                    type="text" 
                    name="nickname"
                    className="form-control text-sm bg-white bg-opacity-70 border border-light"
                    value={formData.nickname}
                    onChange={handleChange}
                    disabled={loading}
                    style={{ borderRadius: '8px', padding: '10px 12px' }}
                  />
                </div>

                <div className="col-12">
                  <label className="form-label text-xs fw-bold text-muted uppercase">Email Address</label>
                  <input 
                    type="email" 
                    name="email"
                    className="form-control text-sm bg-white bg-opacity-70 border border-light"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={loading}
                    style={{ borderRadius: '8px', padding: '10px 12px' }}
                  />
                </div>

                <hr className="my-4 text-muted border-light-subtle" />

                <h5 className="font-bold text-jsc-primary mb-1" style={{ fontFamily: 'Plus Jakarta Sans' }}>Ganti Password (Opsional)</h5>
                <p className="text-xs text-muted mb-3">Kosongkan kolom di bawah jika tidak ingin mengganti password Anda.</p>

                <div className="col-12 col-md-6">
                  <label className="form-label text-xs fw-bold text-muted uppercase">Password Baru</label>
                  <input 
                    type="password" 
                    name="password"
                    className="form-control text-sm bg-white bg-opacity-70 border border-light"
                    placeholder="Masukkan password baru"
                    value={formData.password}
                    onChange={handleChange}
                    disabled={loading}
                    style={{ borderRadius: '8px', padding: '10px 12px' }}
                  />
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label text-xs fw-bold text-muted uppercase">Konfirmasi Password Baru</label>
                  <input 
                    type="password" 
                    name="confirmPassword"
                    className="form-control text-sm bg-white bg-opacity-70 border border-light"
                    placeholder="Konfirmasi password baru"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    disabled={loading}
                    style={{ borderRadius: '8px', padding: '10px 12px' }}
                  />
                </div>
              </div>

              <div className="mt-4 pt-2">
                <button 
                  type="submit" 
                  className="btn btn-jsc-navy px-4 py-2.5 font-bold d-flex align-items-center gap-2"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-sm">save</span>
                      <span>Simpan Perubahan</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

    </div>
  );
}
