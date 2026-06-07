import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';

export default function AdminStaff() {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    nama: '',
    nickname: '',
    email: '',
    password: ''
  });

  const [message, setMessage] = useState({ type: '', text: '' });
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch all staff accounts
  const loadStaff = async () => {
    setLoading(true);
    try {
      const res = await apiService.getStaffList();
      setStaffList(res.data || []);
    } catch (err) {
      console.error(err);
      setMessage({ type: 'danger', text: 'Gagal memuat data akun staf.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleOpenCreate = () => {
    setFormData({
      nama: '',
      nickname: '',
      email: '',
      password: ''
    });
    setModalOpen(true);
    setMessage({ type: '', text: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { nama, nickname, email, password } = formData;
    if (!nama || !nickname || !email || !password) {
      setMessage({ type: 'danger', text: 'Semua kolom wajib diisi.' });
      return;
    }

    setActionLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await apiService.createStaffAccount(formData);
      setMessage({ type: 'success', text: 'Akun staf kasir baru berhasil dibuat!' });
      setModalOpen(false);
      loadStaff();
    } catch (err) {
      console.error(err);
      setMessage({ 
        type: 'danger', 
        text: err.response?.data?.message || 'Gagal membuat akun staf. Nickname/Email mungkin sudah terpakai.' 
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus akun staf "${name}"?`)) {
      return;
    }

    try {
      await apiService.deleteStaffAccount(id);
      setMessage({ type: 'success', text: 'Akun staf berhasil dihapus!' });
      loadStaff();
    } catch (err) {
      console.error(err);
      setMessage({ 
        type: 'danger', 
        text: err.response?.data?.message || 'Gagal menghapus akun staf.' 
      });
    }
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
          Super Admin
        </span>
        <h1 className="font-headline-lg mb-1">Kelola Akun Staf Kasir</h1>
        <p className="text-white-50 font-body-md mb-0">Daftarkan dan kelola hak akses staf kasir untuk memindai tiket QR masuk lapangan</p>
      </div>

      {message.text && (
        <div className={`alert alert-${message.type} border-0 rounded-3 text-sm p-3 mb-4 d-flex align-items-center gap-2`}>
          <span className="material-symbols-outlined">
            {message.type === 'success' ? 'check_circle' : 'error'}
          </span>
          <span>{message.text}</span>
        </div>
      )}

      {/* Action Bar */}
      <div className="bg-white border rounded-3 p-3 mb-4 shadow-sm d-flex justify-content-between align-items-center">
        <h5 className="font-bold text-jsc-primary mb-0">Daftar Akun Staf Aktif</h5>
        <button 
          className="btn btn-jsc-lime font-bold d-flex align-items-center gap-1.5"
          onClick={handleOpenCreate}
        >
          <span className="material-symbols-outlined">person_add</span>
          <span>Buat Akun Staf Baru</span>
        </button>
      </div>

      {/* Staff Table */}
      <div className="card shadow-sm border rounded-3 overflow-hidden bg-white">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status"></div>
              <p className="text-muted mt-3 mb-0">Memuat daftar staf...</p>
            </div>
          ) : staffList.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <span className="material-symbols-outlined text-headline-lg mb-2" style={{ fontSize: '48px' }}>badge</span>
              <p className="mb-0 text-sm">Belum ada akun staf kasir terdaftar.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th className="px-4 py-3 text-xs fw-bold text-muted uppercase">Nama Staf</th>
                    <th className="py-3 text-xs fw-bold text-muted uppercase">Nickname / Username</th>
                    <th className="py-3 text-xs fw-bold text-muted uppercase">Email</th>
                    <th className="py-3 text-xs fw-bold text-muted uppercase">Terdaftar Pada</th>
                    <th className="px-4 py-3 text-end text-xs fw-bold text-muted uppercase">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {staffList.map((staff) => (
                    <tr key={staff.id}>
                      <td className="px-4 py-3">
                        <div className="d-flex align-items-center gap-2">
                          <div 
                            className="bg-jsc-navy text-white rounded-circle d-flex align-items-center justify-content-center font-bold"
                            style={{ width: '32px', height: '32px', fontSize: '13px' }}
                          >
                            {staff.nama.charAt(0)}
                          </div>
                          <span className="fw-bold text-jsc-primary">{staff.nama}</span>
                        </div>
                      </td>
                      <td className="py-3 text-sm fw-semibold">@{staff.nickname}</td>
                      <td className="py-3 text-sm">{staff.email}</td>
                      <td className="py-3 text-sm text-muted">
                        {new Date(staff.createdAt).toLocaleDateString('id-ID', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </td>
                      <td className="px-4 py-3 text-end">
                        <button 
                          className="btn btn-outline-danger btn-sm font-bold d-inline-flex align-items-center gap-1"
                          onClick={() => handleDelete(staff.id, staff.nama)}
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                          <span>Hapus Akun</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {modalOpen && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '12px' }}>
              <div className="modal-header bg-jsc-navy text-white py-3">
                <h5 className="modal-title font-headline-md">Buat Akun Staf Baru</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setModalOpen(false)}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label text-xs fw-bold text-muted uppercase">Nama Lengkap</label>
                    <input 
                      type="text" 
                      name="nama" 
                      className="form-control text-sm" 
                      placeholder="Contoh: Budi Staf Kasir"
                      value={formData.nama}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label text-xs fw-bold text-muted uppercase">Nickname / Username</label>
                    <input 
                      type="text" 
                      name="nickname" 
                      className="form-control text-sm" 
                      placeholder="Contoh: budikasir"
                      value={formData.nickname}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label text-xs fw-bold text-muted uppercase">Alamat Email</label>
                    <input 
                      type="email" 
                      name="email" 
                      className="form-control text-sm" 
                      placeholder="Contoh: budi@jsc.com"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label text-xs fw-bold text-muted uppercase">Password</label>
                    <input 
                      type="password" 
                      name="password" 
                      className="form-control text-sm" 
                      placeholder="Masukkan password akun staf"
                      value={formData.password}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
                <div className="modal-footer bg-light border-0 py-3">
                  <button type="button" className="btn btn-light px-4" onClick={() => setModalOpen(false)}>Batal</button>
                  <button 
                    type="submit" 
                    className="btn btn-jsc-navy px-4 font-bold"
                    disabled={actionLoading}
                  >
                    {actionLoading ? 'Membuat...' : 'Buat Akun'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
