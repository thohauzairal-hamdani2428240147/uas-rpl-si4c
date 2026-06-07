import React, { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';

export default function AdminSchedule({ currentUser }) {
  const [date, setDate] = useState(() => {
    // Default to today's date in local time YYYY-MM-DD
    const today = new Date();
    const tzOffset = today.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(today - tzOffset)).toISOString().slice(0, 10);
    return localISOTime;
  });

  const [fields, setFields] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState({ totalPendapatan: 0, activeBookings: 0, occupancy: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [tempStatus, setTempStatus] = useState('');

  // Time slots config (10 slots per day matching tenant booking range - excludes 12:00-14:00 break)
  const timeSlots = [
    { id: '1', start: '08:00', end: '09:00', label: '08:00' },
    { id: '2', start: '09:00', end: '10:00', label: '09:00' },
    { id: '3', start: '10:00', end: '11:00', label: '10:00' },
    { id: '4', start: '11:00', end: '12:00', label: '11:00' },
    { id: '7', start: '14:00', end: '15:00', label: '14:00' },
    { id: '8', start: '15:00', end: '16:00', label: '15:00' },
    { id: '9', start: '16:00', end: '17:00', label: '16:00' },
    { id: '10', start: '17:00', end: '18:00', label: '17:00' },
    { id: '11', start: '18:00', end: '19:00', label: '18:00' },
    { id: '12', start: '19:00', end: '20:00', label: '19:00' }
  ];

  // Fetch grid data and statistics
  const loadData = useCallback(async () => {
    if (currentUser.role !== 'Admin' && currentUser.role !== 'Staff') {
      setError('Akses ditolak. Halaman ini khusus untuk Staf Kasir atau Administrator.');
      setLoading(false);
      return;
    }

    try {
      setError('');
      // 1. Fetch grid schedule (fields & bookings)
      const gridRes = await apiService.getAdminScheduleGrid(date);
      setFields(gridRes.data.fields);
      setBookings(gridRes.data.bookings);

      // 2. Fetch reports for bento stats (Admin only)
      if (currentUser.role === 'Admin') {
        const reportRes = await apiService.getAdminReport();
        const reportData = reportRes.data;

        // Compute total bookings
        const totalBookingsCount = reportData.rekapitulasi.reduce((acc, curr) => acc + curr.jumlahPemesanan, 0);

        // Map occupancy percentage
        const occupancyMap = {};
        reportData.rekapitulasi.forEach(item => {
          // Mock occupancy percentage based on booking count: max capacity is 10 slots
          const capacity = 10; // 10 slots max
          const percentage = Math.min(Math.round((item.jumlahPemesanan / capacity) * 100), 100);
          occupancyMap[item.kategori] = percentage;
        });

        setStats({
          totalPendapatan: reportData.totalPendapatan,
          activeBookings: totalBookingsCount,
          occupancy: occupancyMap
        });
      }

    } catch (err) {
      console.error(err);
      setError('Gagal memuat data jadwal lapangan.');
    } finally {
      setLoading(false);
    }
  }, [date, currentUser]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Find booking for a specific field and slot
  const getSlotBooking = (fieldId, slot) => {
    return bookings.find(b => {
      if (b.lapanganId !== fieldId) return false;
      const startB = b.waktuMulai.substring(0, 5);
      const endB = b.waktuSelesai.substring(0, 5);
      return startB < slot.end && endB > slot.start;
    });
  };

  // Determine slot status info
  const getSlotInfo = (fieldId, slot) => {
    const booking = getSlotBooking(fieldId, slot);
    if (!booking) {
      return { status: 'available', booking: null };
    }
    if (booking.status === 'Maintenance') {
      return { status: 'maintenance', booking };
    }
    if (['Lunas', 'Booked'].includes(booking.status)) {
      return { status: 'booked', booking };
    }
    if (['Locked', 'Pending'].includes(booking.status)) {
      return { status: 'locked', booking };
    }
    return { status: 'available', booking: null };
  };

  // Open Edit modal
  const handleCellClick = (field, slot) => {
    const info = getSlotInfo(field.id, slot);
    setSelectedSlot({ field, slot, booking: info.booking });
    
    // Map visual status ('available', 'booked', 'locked', 'maintenance') to database action status
    let currentDbStatus = 'Available';
    if (info.status === 'booked') {
      currentDbStatus = 'Booked';
    } else if (info.status === 'maintenance') {
      currentDbStatus = 'Maintenance';
    }
    setTempStatus(currentDbStatus);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedSlot(null);
    setTempStatus('');
  };

  // Handle status update from modal
  const handleUpdateStatus = async (newStatus) => {
    if (!selectedSlot) return;

    try {
      setSuccessMsg('');
      setError('');
      const payload = {
        lapanganId: selectedSlot.field.id,
        tanggal: date,
        waktuMulai: selectedSlot.slot.start,
        waktuSelesai: selectedSlot.slot.end,
        status: newStatus
      };

      await apiService.updateAdminScheduleSlot(payload);
      setSuccessMsg(`Jadwal ${selectedSlot.field.namaLapangan} pukul ${selectedSlot.slot.start} berhasil diubah menjadi ${newStatus}`);
      closeModal();
      loadData(); // Reload grid
    } catch (err) {
      console.error(err);
      setError('Gagal memperbarui status jadwal slot.');
      closeModal();
    }
  };

  if (currentUser.role !== 'Admin' && currentUser.role !== 'Staff') {
    return (
      <div className="container py-5 text-center">
        <div className="card border-0 shadow-sm p-5 mx-auto" style={{ maxWidth: '450px' }}>
          <span className="material-symbols-outlined text-danger text-5xl mb-3" style={{ fontSize: '48px' }}>lock</span>
          <h4 className="font-headline-md text-jsc-navy mb-2">Akses Terbatas</h4>
          <p className="text-muted text-sm mb-4">
            Halaman ini hanya dapat diakses oleh Staf Kasir atau Administrator.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      {/* Header section matching style */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-end mb-4 gap-3">
        <div>
          <h2 className="font-headline-lg text-jsc-navy mb-1">Jadwal Admin</h2>
          <p className="text-muted text-sm mb-0">Atur ketersediaan lapangan, manual booking, dan jadwal perbaikan (maintenance).</p>
        </div>

        {/* Date Selector */}
        <div className="d-flex gap-2">
          <div className="bg-white border rounded px-3 py-2 d-flex align-items-center gap-2">
            <span className="material-symbols-outlined text-muted text-sm">calendar_today</span>
            <input 
              type="date" 
              className="border-0 bg-transparent fw-bold text-xs p-0" 
              style={{ outline: 'none', cursor: 'pointer' }}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      {error && <div className="alert alert-danger border-0 rounded-3 mb-4">{error}</div>}
      {successMsg && <div className="alert alert-success border-0 rounded-3 mb-4">{successMsg}</div>}

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted text-sm mt-2">Memuat jadwal lapangan...</p>
        </div>
      ) : (
        <>
          {/* Statistics Bento Grid (Admin only) */}
          {currentUser.role === 'Admin' && (
            <div className="row g-4 mb-4">
              {/* Total Revenue Bento */}
              <div className="col-12 col-md-4">
                <div className="card h-100 p-4 border shadow-sm bg-jsc-primary text-white position-relative overflow-hidden">
                  <p className="font-label-caps text-white-50 text-xs mb-1">TOTAL REVENUE (VERIFIED)</p>
                  <h3 className="font-headline-lg text-white mb-2" style={{ fontSize: '2rem' }}>
                    Rp {parseInt(stats.totalPendapatan || 0).toLocaleString('id-ID')}
                  </h3>
                  <div className="mt-3 d-flex align-items-center gap-1 text-jsc-lime text-xs font-bold">
                    <span className="material-symbols-outlined text-xs">trending_up</span>
                    <span>+14% from yesterday</span>
                  </div>
                </div>
              </div>

              {/* Active Bookings Bento */}
              <div className="col-12 col-md-4">
                <div className="card h-100 p-4 border shadow-sm bg-white">
                  <p className="font-label-caps text-muted text-xs mb-1">ACTIVE BOOKINGS</p>
                  <h3 className="font-headline-lg text-jsc-navy mb-2" style={{ fontSize: '2rem' }}>
                    {stats.activeBookings} Bookings
                  </h3>
                  <div className="w-100 bg-light h-2 rounded-full mt-3 overflow-hidden">
                    <div className="bg-success h-full" style={{ width: `${Math.min((stats.activeBookings / 30) * 100, 100)}%` }}></div>
                  </div>
                </div>
              </div>

              {/* Occupancy Bento */}
              <div className="col-12 col-md-4">
                <div className="card h-100 p-4 border shadow-sm bg-white">
                  <p className="font-label-caps text-muted text-xs mb-2">VENUE OCCUPANCY</p>
                  <div className="d-flex flex-column gap-2">
                    <div className="d-flex justify-content-between align-items-center text-xs">
                      <span className="fw-bold">Futsal</span>
                      <span className="text-muted">{stats.occupancy.Futsal || 0}% Capacity</span>
                    </div>
                    <div className="d-flex justify-content-between align-items-center text-xs">
                      <span className="fw-bold">Basketball</span>
                      <span className="text-muted">{stats.occupancy.Basket || 0}% Capacity</span>
                    </div>
                    <div className="d-flex justify-content-between align-items-center text-xs">
                      <span className="fw-bold">Badminton</span>
                      <span className="text-muted">{stats.occupancy.Badminton || 0}% Capacity</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Schedule Grid Table */}
          <div className="card shadow-sm border rounded-3 overflow-hidden bg-white mb-4">
            <div className="px-4 py-3 border-bottom d-flex justify-content-between align-items-center">
              <div>
                <h5 className="font-headline-md text-jsc-navy mb-0">Venue Schedule Grid</h5>
                <p className="text-muted text-xs mb-0">Klik pada sel slot jadwal untuk mengubah status ketersediaan.</p>
              </div>
            </div>

            <div className="table-responsive">
              <table className="table table-bordered align-middle mb-0 text-center" style={{ minWidth: '1000px' }}>
                <thead className="table-light font-label-caps text-xs">
                  <tr>
                    <th className="text-start px-4 sticky-left bg-white z-10" style={{ width: '220px', left: 0 }}>Nama Lapangan</th>
                    {timeSlots.map(slot => (
                      <th key={slot.id} className="py-3 px-2">{slot.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {fields.map(field => (
                    <tr key={field.id}>
                      <td className="text-start font-bold px-4 sticky-left bg-white z-10" style={{ left: 0 }}>
                        {field.namaLapangan}
                        <div className="text-muted font-normal text-xs">{field.kategori}</div>
                      </td>
                      {timeSlots.map(slot => {
                        const { status, booking } = getSlotInfo(field.id, slot);
                        
                        let cellClass = "";
                        let statusText = "AVAILABLE";
                        let iconName = "check_circle";

                        if (status === 'booked') {
                          cellClass = "bg-danger text-white";
                          statusText = booking?.user?.nama ? booking.user.nama.split(' ')[0].toUpperCase() : "BOOKED";
                          iconName = "block";
                        } else if (status === 'locked') {
                          cellClass = "hash-pattern bg-warning text-dark border-jsc-locked";
                          statusText = "LOCKED";
                          iconName = "timer";
                        } else if (status === 'maintenance') {
                          cellClass = "bg-secondary bg-opacity-25 text-secondary border border-secondary border-opacity-25";
                          statusText = "MAINTENANCE";
                          iconName = "settings";
                        } else {
                          cellClass = "border border-success text-success bg-white hover:bg-success hover:bg-opacity-10";
                          statusText = "AVAILABLE";
                          iconName = "check_circle";
                        }

                        return (
                          <td key={slot.id} className="p-2" style={{ width: '100px' }}>
                            <div 
                              className={`rounded d-flex flex-column align-items-center justify-content-center cursor-pointer transition-all ${cellClass}`}
                              style={{ height: '64px', fontSize: '10px', fontWeight: 'bold' }}
                              onClick={() => handleCellClick(field, slot)}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{iconName}</span>
                              <span className="text-truncate px-1 w-100" style={{ fontSize: '9px' }}>{statusText}</span>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Legend and Info Section */}
          <div className="row g-4">
            <div className="col-12 col-md-8">
              <div className="card p-4 border bg-white shadow-sm">
                <h6 className="fw-bold text-jsc-navy mb-3">Legend & Quick Status Guide</h6>
                <div className="row g-3">
                  <div className="col-6 col-sm-3 d-flex align-items-center gap-2">
                    <div className="border border-success text-success bg-white d-flex align-items-center justify-content-center rounded" style={{ width: '24px', height: '24px' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>check_circle</span>
                    </div>
                    <span className="text-xs fw-semibold">Available</span>
                  </div>
                  <div className="col-6 col-sm-3 d-flex align-items-center gap-2">
                    <div className="bg-danger text-white d-flex align-items-center justify-content-center rounded" style={{ width: '24px', height: '24px' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>block</span>
                    </div>
                    <span className="text-xs fw-semibold">Booked / Lunas</span>
                  </div>
                  <div className="col-6 col-sm-3 d-flex align-items-center gap-2">
                    <div className="bg-warning text-dark hash-pattern d-flex align-items-center justify-content-center rounded" style={{ width: '24px', height: '24px' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>timer</span>
                    </div>
                    <span className="text-xs fw-semibold">Temporary Lock</span>
                  </div>
                  <div className="col-6 col-sm-3 d-flex align-items-center gap-2">
                    <div className="bg-secondary bg-opacity-25 text-secondary d-flex align-items-center justify-content-center rounded" style={{ width: '24px', height: '24px' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>settings</span>
                    </div>
                    <span className="text-xs fw-semibold">Maintenance</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-12 col-md-4">
              <div className="card p-4 border" style={{ backgroundColor: 'rgba(112,93,0,0.05)', borderColor: 'rgba(112,93,0,0.2)' }}>
                <div className="d-flex align-items-start gap-2">
                  <span className="material-symbols-outlined text-warning" style={{ fontSize: '20px' }}>info</span>
                  <div>
                    <h6 className="fw-bold text-warning mb-1">Schedule Sync Status</h6>
                    <p className="text-muted text-xs mb-0">Semua perubahan pada grid ini akan segera berimbas langsung ke jadwal yang dilihat oleh Penyewa secara instan.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Edit Slot Status Modal */}
      {modalOpen && selectedSlot && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 1060 }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '400px' }}>
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '12px', overflow: 'hidden' }}>
              
              <div className="bg-jsc-primary text-white p-4 d-flex justify-content-between align-items-center">
                <h5 className="modal-title font-headline-md mb-0">Ubah Status Slot</h5>
                <button 
                  type="button" 
                  className="btn btn-link text-white p-0 border-0" 
                  onClick={closeModal}
                  style={{ textDecoration: 'none' }}
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="modal-body p-4">
                <div className="mb-4">
                  <p className="font-label-caps text-muted text-xs mb-1">TARGET SLOT</p>
                  <p className="fw-bold fs-6 mb-0 text-jsc-navy">
                    {selectedSlot.field.namaLapangan} | {selectedSlot.slot.start} - {selectedSlot.slot.end}
                  </p>
                </div>

                <div className="d-flex flex-column gap-2">
                  <p className="font-label-caps text-muted text-xs mb-1">PILIH STATUS:</p>
                  
                  <button 
                    type="button" 
                    className={`btn text-start d-flex justify-content-between align-items-center py-2 px-3 fw-bold shadow-sm ${tempStatus === 'Available' ? 'btn-success text-white' : 'btn-outline-success'}`}
                    onClick={() => setTempStatus('Available')}
                  >
                    <span>Available (Tersedia)</span>
                    <span className="material-symbols-outlined">check_circle</span>
                  </button>

                  <button 
                    type="button" 
                    className={`btn text-start d-flex justify-content-between align-items-center py-2 px-3 fw-bold shadow-sm ${tempStatus === 'Booked' ? 'btn-danger text-white' : 'btn-outline-danger'}`}
                    onClick={() => setTempStatus('Booked')}
                  >
                    <span>Booked (Manual Booking)</span>
                    <span className="material-symbols-outlined">block</span>
                  </button>

                  <button 
                    type="button" 
                    className={`btn text-start d-flex justify-content-between align-items-center py-2 px-3 fw-bold shadow-sm ${tempStatus === 'Maintenance' ? 'btn-secondary text-white' : 'btn-outline-secondary'}`}
                    onClick={() => setTempStatus('Maintenance')}
                  >
                    <span>Maintenance Lock</span>
                    <span className="material-symbols-outlined">settings</span>
                  </button>
                </div>

                <div className="mt-4 pt-3 border-top d-flex gap-2">
                  <button type="button" className="btn btn-light flex-grow-1 py-2 fw-bold" onClick={closeModal}>Batal</button>
                  <button 
                    type="button" 
                    className="btn btn-jsc-navy flex-grow-1 py-2 fw-bold text-white" 
                    onClick={() => handleUpdateStatus(tempStatus)}
                    disabled={!tempStatus}
                  >
                    Konfirmasi Perubahan
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
