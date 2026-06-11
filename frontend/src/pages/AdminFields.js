import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';

const getCategoryIcon = (cat) => {
  if (!cat) return 'sports';
  const c = cat.toLowerCase();
  if (c.includes('futsal') || c.includes('bola') || c.includes('soccer') || c.includes('football')) return 'sports_soccer';
  if (c.includes('basket')) return 'sports_basketball';
  if (c.includes('badminton') || c.includes('bulu') || c.includes('tennis') || c.includes('tenis')) return 'sports_tennis';
  if (c.includes('voli') || c.includes('volley')) return 'sports_volleyball';
  if (c.includes('renang') || c.includes('swim')) return 'pool';
  return 'sports';
};

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

  const [customCategoryOpen, setCustomCategoryOpen] = useState(false);
  const [newKategori, setNewKategori] = useState('');

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
    const { name, value } = e.target;
    if (name === 'kategori') {
      if (value === 'Lainnya') {
        setCustomCategoryOpen(true);
      } else {
        setCustomCategoryOpen(false);
      }
    }
    setFormData({ ...formData, [name]: value });
  };

  const handleOpenCreate = () => {
    setFormData({
      namaLapangan: '',
      kategori: 'Futsal',
      hargaPerJam: '',
      status: 'Available'
    });
    setNewKategori('');
    setCustomCategoryOpen(false);
    setEditMode(false);
    setModalOpen(true);
    setMessage({ type: '', text: '' });
  };

  const handleOpenEdit = (field) => {
    const isStandard = ['Futsal', 'Basket', 'Badminton'].includes(field.kategori);
    setFormData({
      namaLapangan: field.namaLapangan,
      kategori: isStandard ? field.kategori : 'Lainnya',
      hargaPerJam: parseInt(field.hargaPerJam),
      status: field.status
    });
    setNewKategori(isStandard ? '' : field.kategori);
    setCustomCategoryOpen(!isStandard);
    setCurrentId(field.id);
    setEditMode(true);
    setModalOpen(true);
    setMessage({ type: '', text: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { namaLapangan, kategori, hargaPerJam, status } = formData;
    const finalKategori = kategori === 'Lainnya' ? newKategori.trim() : kategori;

    if (!namaLapangan || !finalKategori || !hargaPerJam) {
      setMessage({ type: 'danger', text: 'Semua kolom wajib diisi.' });
      return;
    }

    setActionLoading(true);
    setMessage({ type: '', text: '' });

    const submissionData = {
      namaLapangan,
      kategori: finalKategori,
      hargaPerJam,
      status
    };

    try {
      if (editMode) {
        await apiService.updateField(currentId, submissionData);
        setMessage({ type: 'success', text: 'Lapangan berhasil diperbarui!' });
      } else {
        await apiService.createField(submissionData);
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
          Super Admin
        </span>
        <h1 className="font-headline-lg mb-1" style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: '800' }}>
          Kelola Lapangan Arena
        </h1>
        <p className="text-white-50 font-body-md mb-0">Atur ketersediaan, jenis kategori olahraga, nama lapangan, dan tarif per jam</p>
      </div>

      {message.text && (
        <div className={`alert alert-${message.type} border-0 rounded-3 text-sm p-3 mb-4 d-flex align-items-center gap-2`} style={{ borderRadius: '8px' }}>
          <span className="material-symbols-outlined">
            {message.type === 'success' ? 'check_circle' : 'error'}
          </span>
          <span>{message.text}</span>
        </div>
      )}

      {/* Action Bar */}
      <div className="glass-panel p-4 mb-4 shadow-sm d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3" style={{ borderRadius: '16px' }}>
        <h5 className="font-headline-md text-jsc-primary mb-0" style={{ fontFamily: 'Plus Jakarta Sans', fontSize: '18px' }}>Daftar Lapangan Terdaftar</h5>
        <button 
          className="btn btn-jsc-lime font-bold d-flex align-items-center justify-content-center gap-1.5 w-100 w-sm-auto py-2.5 px-4"
          onClick={handleOpenCreate}
        >
          <span className="material-symbols-outlined text-dark">add_circle</span>
          <span className="text-dark">Tambah Lapangan Baru</span>
        </button>
      </div>

      {/* Fields List */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-dark" role="status"></div>
          <p className="text-muted mt-3 mb-0">Memuat daftar lapangan...</p>
        </div>
      ) : fields.length === 0 ? (
        <div className="glass-panel p-5 text-center text-muted" style={{ borderRadius: '16px' }}>
          <span className="material-symbols-outlined text-jsc-primary mb-3" style={{ fontSize: '56px' }}>sports_soccer</span>
          <h5 className="fw-semibold text-jsc-primary mb-1">Belum Ada Lapangan</h5>
          <p className="text-sm mb-3">Klik tombol di atas untuk menambahkan lapangan olahraga baru.</p>
        </div>
      ) : (
        <div className="row g-4">
          {fields.map((field) => (
            <div className="col-12 col-md-6 col-lg-4" key={field.id}>
              <div 
                className="card h-100 shadow-sm border border-light transition-all duration-200 overflow-hidden bg-white"
                style={{ borderRadius: '16px' }}
              >
                {/* Header card */}
                <div 
                  className="p-3 text-white d-flex align-items-center justify-content-between"
                  style={{ backgroundColor: '#000000' }}
                >
                  <div className="d-flex align-items-center gap-2">
                    <span className="material-symbols-outlined text-jsc-lime">
                      {getCategoryIcon(field.kategori)}
                    </span>
                    <span className="badge bg-white bg-opacity-25 text-white font-label-caps text-[9px] px-2 py-0.5">{field.kategori}</span>
                  </div>
                  <span 
                    className="badge py-1.5 px-3 rounded-pill text-[9px] font-label-caps" 
                    style={field.status === 'Available' ? { 
                      backgroundColor: 'rgba(121, 255, 91, 0.15)', 
                      color: 'var(--jsc-secondary-lime)', 
                      border: '1px solid rgba(121, 255, 91, 0.3)' 
                    } : { 
                      backgroundColor: 'rgba(250, 204, 21, 0.15)', 
                      color: 'var(--jsc-locked)', 
                      border: '1px solid rgba(250, 204, 21, 0.3)' 
                    }}
                  >
                    {field.status}
                  </span>
                </div>

                <div className="card-body p-4">
                  <h5 className="card-title font-bold text-jsc-primary mb-2" style={{ fontFamily: 'Plus Jakarta Sans', fontSize: '18px' }}>{field.namaLapangan}</h5>
                  <h4 className="font-bold mb-3" style={{ fontFamily: 'JetBrains Mono', color: 'var(--jsc-secondary-lime-dim)' }}>
                    Rp {parseInt(field.hargaPerJam).toLocaleString()} <span className="text-xs text-muted font-normal">/ jam</span>
                  </h4>
                  
                  <div className="d-flex gap-2 mt-4">
                    <button 
                      type="button" 
                      className="btn btn-jsc-navy btn-sm flex-grow-1 font-bold d-flex align-items-center justify-content-center gap-1.5 py-2"
                      onClick={() => handleOpenEdit(field)}
                    >
                      <span className="material-symbols-outlined text-xs">edit</span>
                      <span>Edit</span>
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-outline-danger btn-sm flex-grow-1 font-bold d-flex align-items-center justify-content-center gap-1.5 py-2"
                      onClick={() => handleDelete(field.id, field.namaLapangan)}
                      style={{ borderRadius: '8px' }}
                    >
                      <span className="material-symbols-outlined text-xs">delete</span>
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
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '16px', overflow: 'hidden' }}>
              
              <div className="bg-jsc-primary text-white p-4 d-flex justify-content-between align-items-center" style={{ backgroundColor: '#000000' }}>
                <h5 className="modal-title font-headline-md mb-0" style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: '800' }}>
                  {editMode ? 'Edit Lapangan' : 'Tambah Lapangan Baru'}
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setModalOpen(false)}></button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="modal-body p-4 bg-light">
                  <div className="mb-3">
                    <label className="form-label text-xs fw-bold text-muted uppercase">Nama Lapangan</label>
                    <input 
                      type="text" 
                      name="namaLapangan" 
                      className="form-control text-sm bg-white bg-opacity-70 border border-light" 
                      placeholder="Contoh: Futsal Arena A"
                      value={formData.namaLapangan}
                      onChange={handleChange}
                      required
                      style={{ borderRadius: '8px', padding: '10px' }}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label text-xs fw-bold text-muted uppercase">Kategori Olahraga</label>
                    <select 
                      name="kategori" 
                      className="form-select text-sm bg-white bg-opacity-70 border border-light"
                      value={formData.kategori}
                      onChange={handleChange}
                      style={{ borderRadius: '8px', padding: '10px' }}
                    >
                      <option value="Futsal">Futsal</option>
                      <option value="Basket">Basket</option>
                      <option value="Badminton">Badminton</option>
                      <option value="Lainnya">Lainnya (Tambah Baru)...</option>
                    </select>
                  </div>

                  {customCategoryOpen && (
                    <div className="mb-3">
                      <label className="form-label text-xs fw-bold text-muted uppercase">Nama Kategori Baru</label>
                      <input 
                        type="text" 
                        className="form-control text-sm bg-white bg-opacity-70 border border-light" 
                        placeholder="Contoh: Tenis, Voli, Renang"
                        value={newKategori}
                        onChange={(e) => setNewKategori(e.target.value)}
                        required
                        style={{ borderRadius: '8px', padding: '10px' }}
                      />
                    </div>
                  )}

                  <div className="mb-3">
                    <label className="form-label text-xs fw-bold text-muted uppercase">Harga per Jam (Rp)</label>
                    <input 
                      type="number" 
                      name="hargaPerJam" 
                      className="form-control text-sm bg-white bg-opacity-70 border border-light" 
                      placeholder="Contoh: 150000"
                      value={formData.hargaPerJam}
                      onChange={handleChange}
                      required
                      style={{ borderRadius: '8px', padding: '10px' }}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label text-xs fw-bold text-muted uppercase">Status Operasional</label>
                    <select 
                      name="status" 
                      className="form-select text-sm bg-white bg-opacity-70 border border-light"
                      value={formData.status}
                      onChange={handleChange}
                      style={{ borderRadius: '8px', padding: '10px' }}
                    >
                      <option value="Available">Available (Bisa Dibooking)</option>
                      <option value="Maintenance">Maintenance (Dalam Perbaikan)</option>
                    </select>
                  </div>
                </div>

                <div className="modal-footer bg-light border-0 py-3">
                  <button type="button" className="btn btn-outline-secondary px-4 py-2 text-xs fw-bold" onClick={() => setModalOpen(false)} style={{ borderRadius: '8px' }}>Batal</button>
                  <button 
                    type="submit" 
                    className="btn btn-jsc-navy px-4 py-2 text-xs font-bold"
                    disabled={actionLoading}
                    style={{ borderRadius: '8px' }}
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
