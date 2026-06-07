import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';

export default function AdminFields() {
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  
  const [formData, setFormData] = useState({
    namaLapangan: '',
    kategori: 'Futsal',
    hargaPerJam: '',
    status: 'Available'
  });

  const [message, setMessage] = useState({ type: '', text: '' });
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch all fields
  const loadFields = async () => {
    setLoading(true);
    try {
      const data = await apiService.getFields();
      setFields(data || []);
    } catch (err) {
      console.error(err);
      setMessage({ type: 'danger', text: 'Gagal memuat data lapangan.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFields();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleOpenCreate = () => {
    setFormData({
      namaLapangan: '',
      kategori: 'Futsal',
      hargaPerJam: '',
      status: 'Available'
    });
    setEditMode(false);
    setModalOpen(true);
    setMessage({ type: '', text: '' });
  };

  const handleOpenEdit = (field) => {
    setFormData({
      namaLapangan: field.namaLapangan,
      kategori: field.kategori,
      hargaPerJam: parseInt(field.hargaPerJam),
      status: field.status
    });
    setCurrentId(field.id);
    setEditMode(true);
    setModalOpen(true);
    setMessage({ type: '', text: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { namaLapangan, kategori, hargaPerJam } = formData;
    if (!namaLapangan || !kategori || !hargaPerJam) {
      setMessage({ type: 'danger', text: 'Semua kolom wajib diisi.' });
      return;
    }

    setActionLoading(true);
    setMessage({ type: '', text: '' });

    try {
      if (editMode) {
        await apiService.updateField(currentId, formData);
        setMessage({ type: 'success', text: 'Lapangan berhasil diperbarui!' });
      } else {
        await apiService.createField(formData);
        setMessage({ type: 'success', text: 'Lapangan baru berhasil ditambahkan!' });
      }
      setModalOpen(false);
      loadFields();
    } catch (err) {
      console.error(err);
      setMessage({ 
        type: 'danger', 
        text: err.response?.data?.message || 'Gagal menyimpan data lapangan.' 
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus lapangan "${name}"?`)) {
      return;
    }

    try {
      await apiService.deleteField(id);
      setMessage({ type: 'success', text: 'Lapangan berhasil dihapus!' });
      loadFields();
    } catch (err) {
      console.error(err);
      setMessage({ 
        type: 'danger', 
        text: err.response?.data?.message || 'Gagal menghapus lapangan.' 
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
        <h1 className="font-headline-lg mb-1">Kelola Lapangan Arena</h1>
        <p className="text-white-50 font-body-md mb-0">Atur ketersediaan, jenis kategori olahraga, nama lapangan, dan tarif per jam</p>
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
        <h5 className="font-bold text-jsc-primary mb-0">Daftar Lapangan Terdaftar</h5>
        <button 
          className="btn btn-jsc-lime font-bold d-flex align-items-center gap-1.5"
          onClick={handleOpenCreate}
        >
          <span className="material-symbols-outlined">add_circle</span>
          <span>Tambah Lapangan Baru</span>
        </button>
      </div>

      {/* Fields List */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
          <p className="text-muted mt-3 mb-0">Memuat daftar lapangan...</p>
        </div>
      ) : fields.length === 0 ? (
        <div className="card shadow-sm border rounded-3 p-5 text-center text-muted bg-white">
          <span className="material-symbols-outlined text-headline-lg mb-3" style={{ fontSize: '56px' }}>sports_soccer</span>
          <h5 className="fw-semibold text-jsc-navy mb-1">Belum Ada Lapangan</h5>
          <p className="text-sm mb-3">Klik tombol di atas untuk menambahkan lapangan olahraga baru.</p>
        </div>
      ) : (
        <div className="row g-4">
          {fields.map((field) => (
            <div className="col-12 col-md-6 col-lg-4" key={field.id}>
              <div className="card h-100 shadow-sm border rounded-3 overflow-hidden bg-white">
                <div className="bg-jsc-navy p-3 text-white d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-2">
                    <span className="material-symbols-outlined text-jsc-lime">
                      {field.kategori === 'Futsal' ? 'sports_soccer' : field.kategori === 'Basket' ? 'sports_basketball' : 'sports_tennis'}
                    </span>
                    <span className="badge bg-light text-jsc-navy font-label-caps text-[9px]">{field.kategori}</span>
                  </div>
                  <span className={`badge py-1 px-2.5 rounded-pill text-[9px] font-label-caps ${field.status === 'Available' ? 'bg-success' : 'bg-warning text-dark'}`}>
                    {field.status}
                  </span>
                </div>
                <div className="card-body p-4">
                  <h5 className="card-title font-bold text-jsc-primary mb-2">{field.namaLapangan}</h5>
                  <h4 className="font-bold text-jsc-secondary mb-3">
                    Rp {parseInt(field.hargaPerJam).toLocaleString()} <span className="text-xs text-muted font-normal">/ jam</span>
                  </h4>
                  
                  <div className="d-flex gap-2 mt-4">
                    <button 
                      type="button" 
                      className="btn btn-outline-primary btn-sm flex-grow-1 font-bold d-flex align-items-center justify-content-center gap-1"
                      onClick={() => handleOpenEdit(field)}
                    >
                      <span className="material-symbols-outlined text-sm">edit</span>
                      <span>Edit</span>
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-outline-danger btn-sm flex-grow-1 font-bold d-flex align-items-center justify-content-center gap-1"
                      onClick={() => handleDelete(field.id, field.namaLapangan)}
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                      <span>Hapus</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '12px' }}>
              <div className="modal-header bg-jsc-navy text-white py-3">
                <h5 className="modal-title font-headline-md">
                  {editMode ? 'Edit Lapangan' : 'Tambah Lapangan Baru'}
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setModalOpen(false)}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label text-xs fw-bold text-muted uppercase">Nama Lapangan</label>
                    <input 
                      type="text" 
                      name="namaLapangan" 
                      className="form-control text-sm" 
                      placeholder="Contoh: Futsal Arena A"
                      value={formData.namaLapangan}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label text-xs fw-bold text-muted uppercase">Kategori Olahraga</label>
                    <select 
                      name="kategori" 
                      className="form-select text-sm"
                      value={formData.kategori}
                      onChange={handleChange}
                    >
                      <option value="Futsal">Futsal</option>
                      <option value="Basket">Basket</option>
                      <option value="Badminton">Badminton</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label text-xs fw-bold text-muted uppercase">Harga per Jam (Rp)</label>
                    <input 
                      type="number" 
                      name="hargaPerJam" 
                      className="form-control text-sm" 
                      placeholder="Contoh: 150000"
                      value={formData.hargaPerJam}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label text-xs fw-bold text-muted uppercase">Status Operasional</label>
                    <select 
                      name="status" 
                      className="form-select text-sm"
                      value={formData.status}
                      onChange={handleChange}
                    >
                      <option value="Available">Available (Bisa Dibooking)</option>
                      <option value="Maintenance">Maintenance (Dalam Perbaikan)</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer bg-light border-0 py-3">
                  <button type="button" className="btn btn-light px-4" onClick={() => setModalOpen(false)}>Batal</button>
                  <button 
                    type="submit" 
                    className="btn btn-jsc-navy px-4 font-bold"
                    disabled={actionLoading}
                  >
                    {actionLoading ? 'Menyimpan...' : 'Simpan'}
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
