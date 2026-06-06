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
        className="position-relative overflow-hidden text-white rounded-4 mb-4 p-5 d-flex flex-column justify-content-end shadow-sm"
        style={{
          height: '180px',
          backgroundImage: 'linear-gradient(to top, rgba(0, 6, 19, 0.95), rgba(0, 6, 19, 0.2)), url("https://lh3.googleusercontent.com/aida/AP1WRLsxjKtjytd7fYWMKkifIoVGt1CythKp5sbmRmIu223cCOrl8MVD1_x8YnzUCSnZoZpU84kkb6FH733i-OGdQtiZmGxz9ThmDK7ZQiyNbqtf8JU1X1jIRGMMMyaghsWOyiO-4g_FCmlKj0TkYgXMCLME3Ox07_Lp2sw8zVgIu-uez-eN1n0nx1lIwxxl8Lg_8AylzmvetnlkBgIlzLZkOs06PE87aQyfHo7zvKlV7ThUL8cgpLf5xINs7Q")',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <span className="badge bg-jsc-lime text-jsc-navy font-label-caps align-self-start mb-2 px-3 py-2">
          Akun Pengguna
        </span>
        <h1 className="font-headline-lg mb-1">Pengaturan Profil</h1>
        <p className="text-white-50 font-body-md mb-0">Kelola informasi data diri, foto profil, dan kredensial Anda</p>
      </div>

      <div className="row g-4">
        {/* Left Column: Avatar Display & Loyalty Card */}
        <div className="col-12 col-md-4">
          <div className="card shadow-sm border rounded-3 p-4 mb-4 text-center bg-white">
            <div className="text-center mb-3">
              <img 
                src={avatarBase64 || getDefaultAvatar()} 
                alt="Avatar" 
                className="rounded-circle border border-4 border-light shadow-sm mb-3"
                style={{ width: '150px', height: '150px', objectFit: 'cover' }}
              />
              <div className="px-2">
                <label className="form-label text-[10px] text-muted fw-bold uppercase d-block mb-1.5">Pilih Foto Profil Baru</label>
                <input 
                  type="file" 
                  className="form-control form-control-sm text-xs bg-light border-0" 
                  accept="image/*"
                  onChange={handleFileChange}
                />
                <p className="text-[9px] text-muted mt-1 mb-0">Format: JPG, PNG. Maksimal 2MB.</p>
              </div>
            </div>
            
            <h5 className="font-bold text-jsc-primary mb-1">{currentUser.nama}</h5>
            <p className="text-muted text-sm mb-3">@{currentUser.nickname}</p>

            <span className={`badge ${currentUser.role === 'Admin' ? 'bg-danger' : 'bg-jsc-navy'} font-label-caps py-2 px-3 mb-4`}>
              {currentUser.role}
            </span>

            {/* Loyalty points banner */}
            {currentUser.role === 'Penyewa' && (
              <div 
                className="rounded-3 p-3 border-2 border-dashed border-jsc-lime text-start"
                style={{ backgroundColor: '#fafffa' }}
              >
                <div className="d-flex align-items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-jsc-lime">stars</span>
                  <h6 className="font-bold text-jsc-primary mb-0">Loyalty Rewards</h6>
                </div>
                <p className="text-xs text-muted mb-2">Setiap pemesanan lapangan sukses mengumpulkan koin loyalitas.</p>
                <h3 className="font-bold text-jsc-secondary mb-0">
                  {currentUser.poinLoyalitas} <span className="text-xs font-semibold text-muted">Koin</span>
                </h3>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Profile Form */}
        <div className="col-12 col-md-8">
          <div className="card shadow-sm border rounded-3 p-4 bg-white">
            <h4 className="font-headline-md text-jsc-navy mb-4">Ubah Data Diri</h4>

            {message.text && (
              <div className={`alert alert-${message.type} border-0 rounded-3 text-sm p-3 mb-4 d-flex align-items-center gap-2`}>
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
                    className="form-control text-sm"
                    value={formData.nama}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label text-xs fw-bold text-muted uppercase">Nickname</label>
                  <input 
                    type="text" 
                    name="nickname"
                    className="form-control text-sm"
                    value={formData.nickname}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>

                <div className="col-12">
                  <label className="form-label text-xs fw-bold text-muted uppercase">Email Address</label>
                  <input 
                    type="email" 
                    name="email"
                    className="form-control text-sm"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>

                <hr className="my-4 text-muted" />

                <h5 className="font-bold text-jsc-primary mb-1">Ganti Password (Opsional)</h5>
                <p className="text-xs text-muted mb-3">Kosongkan kolom di bawah jika tidak ingin mengganti password Anda.</p>

                <div className="col-12 col-md-6">
                  <label className="form-label text-xs fw-bold text-muted uppercase">Password Baru</label>
                  <input 
                    type="password" 
                    name="password"
                    className="form-control text-sm"
                    placeholder="Masukkan password baru"
                    value={formData.password}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label text-xs fw-bold text-muted uppercase">Konfirmasi Password Baru</label>
                  <input 
                    type="password" 
                    name="confirmPassword"
                    className="form-control text-sm"
                    placeholder="Konfirmasi password baru"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    disabled={loading}
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
