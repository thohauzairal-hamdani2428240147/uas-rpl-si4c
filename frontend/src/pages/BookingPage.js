import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

export default function BookingPage({ currentUser, refreshUserPoints }) {
  const navigate = useNavigate();
  const [fields, setFields] = useState([]);
  const [selectedField, setSelectedField] = useState(null);
  const [date, setDate] = useState('2026-06-10');
  const [bookedSlots, setBookedSlots] = useState([]);
  const [selectedSlots, setSelectedSlots] = useState([]);
  
  // List of predefined 1-hour slots
  const slotsConfig = {
    morning: [
      { id: 'morning_1', label: 'Early Bird Slot', start: '08:00', end: '09:00' },
      { id: 'morning_2', label: 'Morning session', start: '09:00', end: '10:00' },
      { id: 'morning_3', label: 'Morning session', start: '10:00', end: '11:00' },
      { id: 'morning_4', label: 'Standard Rate', start: '11:00', end: '12:00' }
    ],
    afternoon: [
      { id: 'afternoon_1', label: 'Lunch Session', start: '14:00', end: '15:00' },
      { id: 'afternoon_2', label: 'Standard Rate', start: '15:00', end: '16:00' },
      { id: 'afternoon_3', label: 'Peak Hour', start: '16:00', end: '17:00' },
      { id: 'afternoon_4', label: 'Peak Hour', start: '17:00', end: '18:00' },
      { id: 'afternoon_5', label: 'Peak Hour', start: '18:00', end: '19:00' },
      { id: 'afternoon_6', label: 'Peak Hour', start: '19:00', end: '20:00' }
    ]
  };

  // Action loading states
  const [bookingLoading, setBookingLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingBooking, setPendingBooking] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('E-Wallet');
  const [paymentLoading, setPaymentLoading] = useState(false);

  // Load fields on mount
  useEffect(() => {
    async function loadFields() {
      const data = await apiService.getFields();
      setFields(data);
      if (data.length > 0) {
        setSelectedField(data[0]);
      }
    }
    loadFields();
  }, []);

  // Fetch booked slots whenever selected field or date changes
  useEffect(() => {
    if (!selectedField) return;

    async function loadBookedSlots() {
      try {
        const res = await apiService.getBookedSlots(selectedField.id, date);
        setBookedSlots(res.data);
      } catch (err) {
        console.error("Gagal memuat jadwal booking aktif:", err);
      }
    }

    loadBookedSlots();
    setSelectedSlots([]); // Reset selection when date/field changes
    setMessage({ type: '', text: '' });
  }, [selectedField, date]);

  // Determine the status of a slot
  const getSlotStatus = (slot) => {
    // Check if slot overlaps with any active booking in bookedSlots
    const overlapping = bookedSlots.find(booking => {
      const startB = booking.waktuMulai.substring(0, 5);
      const endB = booking.waktuSelesai.substring(0, 5);
      return startB < slot.end && endB > slot.start;
    });

    if (overlapping) {
      if (['Lunas', 'Booked'].includes(overlapping.status)) {
        return 'booked';
      }
      if (['Locked', 'Pending'].includes(overlapping.status)) {
        return 'locked';
      }
      if (overlapping.status === 'Maintenance') {
        return 'maintenance';
      }
    }

    // Check if slot is selected by user
    const isSelected = selectedSlots.some(s => s.id === slot.id);
    if (isSelected) {
      return 'selected';
    }

    return 'available';
  };

  // Handle select field card
  const handleSelectField = (field) => {
    setSelectedField(field);
  };

  // Handle slot click (Allow Non-Contiguous Selections)
  const handleSelectSlot = (slot) => {
    const status = getSlotStatus(slot);
    if (status === 'booked' || status === 'locked' || status === 'maintenance') {
      return; // Ignore clicks on unavailable slots
    }

    let newSelection = [...selectedSlots];
    const index = newSelection.findIndex(s => s.id === slot.id);

    if (index > -1) {
      // Toggle off: just remove it
      newSelection.splice(index, 1);
    } else {
      // Toggle on: add it
      newSelection.push(slot);
    }

    // Keep them sorted by start time for visual neatness in summary
    newSelection.sort((a, b) => a.start.localeCompare(b.start));

    setSelectedSlots(newSelection);
    setMessage({ type: '', text: '' });
  };

  // Process Booking (Kunci slot)
  const handleProceedBooking = async () => {
    if (selectedSlots.length === 0) return;

    if (currentUser.role === 'Admin') {
      alert('Mode Admin tidak dapat memesan lapangan. Silakan login sebagai Penyewa.');
      return;
    }

    setBookingLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const bookingData = {
        userId: currentUser.id,
        lapanganId: selectedField.id,
        tanggal: date,
        slots: selectedSlots.map(s => ({
          waktuMulai: s.start,
          waktuSelesai: s.end
        }))
      };

      const res = await apiService.createBooking(bookingData);
      setPendingBooking(res.data);
      setShowPaymentModal(true);
    } catch (err) {
      console.error(err);
      setMessage({ 
        type: 'danger', 
        text: err.response?.data?.message || 'Gagal memproses penguncian slot lapangan.' 
      });
    } finally {
      setBookingLoading(false);
    }
  };

  // Process payment verification callback simulator
  const handleSimulatePayment = async (status) => {
    if (!pendingBooking) return;
    setPaymentLoading(true);
    
    try {
      const isArray = Array.isArray(pendingBooking);
      const pemesananIds = isArray ? pendingBooking.map(b => b.id) : [pendingBooking.id];
      const totalHarga = isArray 
        ? pendingBooking.reduce((sum, b) => sum + parseFloat(b.totalHarga), 0)
        : parseFloat(pendingBooking.totalHarga);

      // 1. Create payment
      const paymentResponse = await apiService.processPayment({
        pemesananIds,
        jumlahBayar: totalHarga,
        metodePembayaran: paymentMethod
      });

      const paymentId = paymentResponse.data.pembayaranId;

      // 2. Webhook simulation
      const verifyResponse = await apiService.verifyPayment({
        pembayaranId: paymentId,
        statusBayar: status
      });

      if (status === 'Verified') {
        alert('Pembayaran Berhasil! Lapangan terkunci permanen. Anda mendapatkan poin loyalitas sebesar 10% dari total transaksi.');
        refreshUserPoints();
        navigate('/bookings');
      } else {
        alert('Pembayaran gagal disimulasikan. Jadwal dibatalkan kembali.');
      }

      setShowPaymentModal(false);
      setPendingBooking(null);
      setSelectedSlots([]);
      setMessage({
        type: status === 'Verified' ? 'success' : 'danger',
        text: verifyResponse.message
      });

    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Terjadi kesalahan sistem pembayaran.');
    } finally {
      setPaymentLoading(false);
    }
  };

  // Pricing calculations
  const pricePerHour = selectedField ? parseFloat(selectedField.hargaPerJam) : 0;
  const totalSlots = selectedSlots.length;
  const rawTotal = pricePerHour * totalSlots;
  const adminFee = Math.round(rawTotal * 0.05);
  const grandTotal = rawTotal + adminFee;

  return (
    <div className="container py-4">
      {/* Hero Header */}
      <div 
        className="position-relative overflow-hidden text-white rounded-4 mb-4 p-5 d-flex flex-column justify-content-end shadow-sm"
        style={{
          height: '240px',
          backgroundImage: 'linear-gradient(to top, rgba(0, 0, 0, 0.95), rgba(0, 0, 0, 0.3)), url("/images/hero-banner.svg"), url("https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1600")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          borderRadius: '16px'
        }}
      >
        <span 
          className="badge text-jsc-primary font-label-caps align-self-start mb-2 px-3 py-2 d-inline-flex align-items-center gap-1.5 border border-success border-opacity-25" 
          style={{ borderRadius: '999px', backgroundColor: 'rgba(121, 255, 91, 0.2)' }}
        >
          <span className="spinner-grow spinner-grow-sm text-success" style={{ width: '8px', height: '8px', animationDuration: '1.5s' }} role="status"></span>
          Available Now
        </span>
        <h1 className="font-headline-lg mb-1" style={{ fontFamily: 'Plus Jakarta Sans', fontSize: '36px', fontWeight: '800' }}>
          {selectedField ? selectedField.namaLapangan : 'Jakabaring Arena'}
        </h1>
        <p className="text-white-50 font-body-md mb-0">
          <span className="material-symbols-outlined text-sm me-1 align-middle">location_on</span>
          Jakabaring Sport City, Palembang
        </p>
      </div>

      <div className="row g-4 align-items-start">
        {/* Left column: Field selector & slot scheduler */}
        <div className="col-12 col-lg-8 space-y-4">
          
          {/* Step 1: Select Field Card */}
          <div className="glass-panel p-4 rounded-4 mb-4" style={{ borderRadius: '16px' }}>
            <h4 className="font-headline-md text-jsc-primary mb-3" style={{ fontFamily: 'Plus Jakarta Sans' }}>1. Pilih Lapangan Olahraga</h4>
            <div className="row g-3">
              {fields.map((f) => {
                const isSelected = selectedField && selectedField.id === f.id;
                return (
                  <div className="col-12 col-md-4" key={f.id}>
                    <div 
                      className={`card h-100 cursor-pointer border-2 transition-all duration-200 overflow-hidden ${isSelected ? 'neon-ring-lime bg-white' : 'border-light'}`}
                      style={{ cursor: 'pointer', borderRadius: '12px' }}
                      onClick={() => handleSelectField(f)}
                    >
                      {/* Field Image Preview */}
                      <div className="position-relative overflow-hidden" style={{ height: '120px' }}>
                        <img 
                          src={f.kategori === 'Futsal' ? '/images/futsal.svg' : f.kategori === 'Basket' ? '/images/basketball.svg' : '/images/badminton.svg'} 
                          alt={f.namaLapangan} 
                          className="w-100 h-100 object-fit-cover"
                          style={{ objectFit: 'cover' }}
                          onError={(e) => {
                            // Fallback to stock sport photos if local image is not set yet
                            e.target.src = f.kategori === 'Futsal' 
                              ? 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=500' 
                              : f.kategori === 'Basket'
                              ? 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=500'
                              : 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=500';
                          }}
                        />
                        {/* Rating indicator */}
                        <div 
                          className="position-absolute top-2 end-2 px-2 py-0.5 rounded-full d-flex align-items-center gap-0.5 font-bold"
                          style={{ fontSize: '10px', backgroundColor: 'rgba(255,255,255,0.9)', color: '#000', zIndex: 10 }}
                        >
                          <span className="material-symbols-outlined text-warning" style={{ fontSize: '12px', fontVariationSettings: "'FILL' 1" }}>star</span>
                          <span>4.9</span>
                        </div>
                      </div>

                      <div className="card-body p-3">
                        <div className="d-flex align-items-center gap-1.5 mb-2">
                          <span className="material-symbols-outlined text-success" style={{ fontSize: '20px' }}>
                            {getCategoryIcon(f.kategori)}
                          </span>
                          <span className="badge bg-jsc-primary font-label-caps" style={{ fontSize: '9px' }}>{f.kategori}</span>
                        </div>
                        <h6 className="card-title font-bold text-jsc-primary mb-1" style={{ fontSize: '14px' }}>{f.namaLapangan}</h6>
                        <p className="card-text text-muted text-xs mb-0">Rp {parseInt(f.hargaPerJam).toLocaleString()} / jam</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step 2: Date Selector Bar */}
          <div className="glass-panel p-3 rounded-4 d-flex justify-content-between align-items-center mb-4" style={{ borderRadius: '16px' }}>
            <div className="d-flex align-items-center gap-3">
              <span className="material-symbols-outlined text-jsc-primary">calendar_today</span>
              <input 
                type="date" 
                className="form-control form-control-sm border-0 fw-bold p-0 text-jsc-primary bg-transparent"
                style={{ width: '150px', outline: 'none', boxShadow: 'none', fontSize: '15px' }}
                value={date}
                onChange={(e) => { setDate(e.target.value); }}
              />
            </div>
            <span className="badge bg-jsc-primary text-xs px-3 py-2" style={{ borderRadius: '99px' }}>Waktu Lokal Palembang</span>
          </div>

          {/* Legend */}
          <div className="d-flex flex-wrap gap-4 px-2 mb-4">
            <div className="d-flex align-items-center gap-1.5">
              <div className="rounded-circle border" style={{ width: '12px', height: '12px', backgroundColor: '#fff' }}></div>
              <span className="text-xs text-muted fw-semibold">Available</span>
            </div>
            <div className="d-flex align-items-center gap-1.5">
              <div className="rounded-circle" style={{ width: '12px', height: '12px', backgroundColor: '#E11D48' }}></div>
              <span className="text-xs text-muted fw-semibold">Booked</span>
            </div>
            <div className="d-flex align-items-center gap-1.5">
              <div className="rounded-circle hash-pattern" style={{ width: '12px', height: '12px', border: '1px solid #FACC15' }}></div>
              <span className="text-xs text-muted fw-semibold">Processing</span>
            </div>
            <div className="d-flex align-items-center gap-1.5">
              <div className="rounded-circle" style={{ width: '12px', height: '12px', backgroundColor: '#79ff5b', boxShadow: '0 0 8px rgba(121,255,91,0.6)' }}></div>
              <span className="text-xs text-muted fw-semibold">Selected</span>
            </div>
            <div className="d-flex align-items-center gap-1.5">
              <div className="rounded-circle bg-secondary bg-opacity-25" style={{ width: '12px', height: '12px' }}></div>
              <span className="text-xs text-muted fw-semibold">Maintenance</span>
            </div>
          </div>

          {/* Step 3: Slots Grid */}
          <div className="glass-panel p-4 rounded-4" style={{ borderRadius: '16px' }}>
            
            {/* Morning Sessions */}
            <h5 className="font-label-caps text-muted border-bottom pb-2 mb-3">Sesi Pagi (Morning)</h5>
            <div className="row g-3 mb-4">
              {slotsConfig.morning.map((slot) => {
                const slotStatus = getSlotStatus(slot);
                let cardClass = "bg-white border-light";
                let icon = "add_circle";
                let textClass = "text-secondary";

                if (slotStatus === 'booked') {
                  cardClass = "border-jsc-booked bg-light opacity-50";
                  icon = "event_busy";
                  textClass = "text-danger";
                } else if (slotStatus === 'locked') {
                  cardClass = "border-jsc-locked hash-pattern";
                  icon = "sync";
                  textClass = "text-warning";
                } else if (slotStatus === 'selected') {
                  cardClass = "neon-ring-lime bg-white";
                  icon = "check_circle";
                  textClass = "text-success";
                } else if (slotStatus === 'maintenance') {
                  cardClass = "bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-10 opacity-75";
                  icon = "settings";
                  textClass = "text-secondary";
                }

                return (
                  <div className="col-12 col-md-6 col-lg-4" key={slot.id}>
                    <div 
                      className={`card p-3 border-2 position-relative overflow-hidden cursor-pointer transition-all duration-200 ${cardClass}`}
                      style={{ cursor: 'pointer', borderRadius: '12px' }}
                      onClick={() => handleSelectSlot(slot)}
                    >
                      {slotStatus === 'selected' && (
                        <div 
                          className="position-absolute top-0 end-0 text-jsc-primary px-2 py-0.5 rounded-bottom font-bold"
                          style={{ fontSize: '9px', backgroundColor: 'var(--jsc-secondary-lime)' }}
                        >
                          SELECTED
                        </div>
                      )}
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <p className="font-bold text-base mb-0" style={{ fontSize: '15px' }}>{slot.start} - {slot.end}</p>
                          <p className="text-muted text-xs mb-0">{slot.label}</p>
                        </div>
                        <div className={`d-flex flex-column align-items-end ${textClass}`}>
                          <span className="material-symbols-outlined text-lg">
                            {icon}
                          </span>
                          <span className="font-bold text-xs mt-1" style={{ fontFamily: 'JetBrains Mono' }}>Rp {parseInt(pricePerHour).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Afternoon & Evening Sessions */}
            <h5 className="font-label-caps text-muted border-bottom pb-2 mb-3">Sesi Sore &amp; Malam</h5>
            <div className="row g-3">
              {slotsConfig.afternoon.map((slot) => {
                const slotStatus = getSlotStatus(slot);
                let cardClass = "bg-white border-light";
                let icon = "add_circle";
                let textClass = "text-secondary";

                if (slotStatus === 'booked') {
                  cardClass = "border-jsc-booked bg-light opacity-50";
                  icon = "event_busy";
                  textClass = "text-danger";
                } else if (slotStatus === 'locked') {
                  cardClass = "border-jsc-locked hash-pattern";
                  icon = "sync";
                  textClass = "text-warning";
                } else if (slotStatus === 'selected') {
                  cardClass = "neon-ring-lime bg-white";
                  icon = "check_circle";
                  textClass = "text-success";
                } else if (slotStatus === 'maintenance') {
                  cardClass = "bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-10 opacity-75";
                  icon = "settings";
                  textClass = "text-secondary";
                }

                return (
                  <div className="col-12 col-md-6 col-lg-4" key={slot.id}>
                    <div 
                      className={`card p-3 border-2 position-relative overflow-hidden cursor-pointer transition-all duration-200 ${cardClass}`}
                      style={{ cursor: 'pointer', borderRadius: '12px' }}
                      onClick={() => handleSelectSlot(slot)}
                    >
                      {slotStatus === 'selected' && (
                        <div 
                          className="position-absolute top-0 end-0 text-jsc-primary px-2 py-0.5 rounded-bottom font-bold"
                          style={{ fontSize: '9px', backgroundColor: 'var(--jsc-secondary-lime)' }}
                        >
                          SELECTED
                        </div>
                      )}
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <p className="font-bold text-base mb-0" style={{ fontSize: '15px' }}>{slot.start} - {slot.end}</p>
                          <p className="text-muted text-xs mb-0">{slot.label}</p>
                        </div>
                        <div className={`d-flex flex-column align-items-end ${textClass}`}>
                          <span className="material-symbols-outlined text-lg">
                            {icon}
                          </span>
                          <span className="font-bold text-xs mt-1" style={{ fontFamily: 'JetBrains Mono' }}>Rp {parseInt(pricePerHour).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>

          {/* Availability alerts */}
          {message.text && (
            <div className={`alert alert-${message.type} border-0 rounded-3 shadow-xs p-3 mt-3 d-flex align-items-center gap-2`} role="alert">
              <span className="material-symbols-outlined">
                {message.type === 'success' ? 'check_circle' : 'error'}
              </span>
              <span className="text-sm">{message.text}</span>
            </div>
          )}

        </div>

        {/* Right column: Sticky Summary Panel */}
        <div className="col-12 col-lg-4">
          <div className="glass-panel overflow-hidden shadow-sm" style={{ borderRadius: '16px' }}>
            <div className="bg-jsc-primary text-white p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.95)' }}>
              <h5 className="font-headline-md mb-1" style={{ fontFamily: 'Plus Jakarta Sans' }}>Ringkasan Sewa</h5>
              <p className="text-white-50 text-xs mb-0">Tinjau jadwal lapangan pilihan Anda</p>
            </div>
            
            <div className="card-body p-4 bg-white bg-opacity-95">
              <div className="d-flex align-items-center gap-3 mb-4">
                <div 
                  className="bg-light rounded d-flex align-items-center justify-content-center border"
                  style={{ width: '40px', height: '40px', borderRadius: '8px' }}
                >
                  <span className="material-symbols-outlined text-jsc-primary">calendar_today</span>
                </div>
                <div>
                  <p className="text-muted text-xs font-medium uppercase mb-0">Tanggal Main</p>
                  <p className="font-bold text-sm mb-0">{date}</p>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-xs text-muted font-medium uppercase border-bottom pb-1 mb-2">Slot Dipilih</p>
                {selectedSlots.length > 0 ? (
                  selectedSlots.map((slot) => (
                    <div className="d-flex justify-content-between align-items-center py-1.5" key={slot.id}>
                      <div className="d-flex align-items-center gap-2">
                        <span className="rounded-circle bg-jsc-primary" style={{ width: '8px', height: '8px' }}></span>
                        <p className="text-sm font-semibold mb-0">{slot.start} - {slot.end}</p>
                      </div>
                      <div className="d-flex align-items-center gap-3">
                        <p className="text-sm font-bold mb-0" style={{ fontFamily: 'JetBrains Mono' }}>Rp {parseInt(pricePerHour).toLocaleString()}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted italic mb-0">Belum ada slot waktu yang dipilih</p>
                )}
              </div>

              <div className="pt-3 border-top space-y-2">
                <div className="d-flex justify-content-between text-sm mb-2">
                  <span className="text-muted">Subtotal ({totalSlots} Sesi)</span>
                  <span className="fw-semibold">Rp {rawTotal.toLocaleString()}</span>
                </div>
                <div className="d-flex justify-content-between text-sm mb-3">
                  <span className="text-muted">Biaya Layanan (5%)</span>
                  <span className="fw-semibold">Rp {adminFee.toLocaleString()}</span>
                </div>
                <div className="d-flex justify-content-between text-lg font-bold pt-3 border-top border-dashed" style={{ borderTopStyle: 'dashed' }}>
                  <span>Total Bayar</span>
                  <span className="text-jsc-primary" style={{ fontSize: '20px', fontWeight: '800' }}>Rp {grandTotal.toLocaleString()}</span>
                </div>
              </div>

              <button 
                type="button" 
                className="btn btn-jsc-lime w-100 mt-4 py-3 d-flex align-items-center justify-content-center gap-2"
                onClick={handleProceedBooking}
                disabled={selectedSlots.length === 0 || bookingLoading}
              >
                <span>Lanjutkan Pembayaran</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>

              <div className="d-flex align-items-center justify-content-center gap-1 text-muted text-[10px] py-2 bg-light rounded mt-3" style={{ borderRadius: '8px' }}>
                <span className="material-symbols-outlined text-xs">lock</span>
                <span>256-bit Secure Transaction</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Bar on Mobile */}
      {selectedSlots.length > 0 && (
        <div 
          className="fixed-bottom bg-white border-top shadow-lg p-3 d-lg-none d-flex justify-content-between align-items-center animate-slide-up"
          style={{ zIndex: 1020, borderTopLeftRadius: '16px', borderTopRightRadius: '16px', paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
        >
          <div>
            <p className="text-xs text-muted mb-0">{selectedSlots.length} Slot Terpilih</p>
            <h5 className="font-bold text-jsc-primary mb-0">Rp {grandTotal.toLocaleString()}</h5>
          </div>
          <button 
            type="button" 
            className="btn btn-jsc-lime px-4 py-2.5 font-bold d-flex align-items-center gap-1.5"
            onClick={handleProceedBooking}
            disabled={bookingLoading}
          >
            <span>Pesan</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </div>
      )}

      {/* Payment Simulation Modal */}
      {showPaymentModal && pendingBooking && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '16px', overflow: 'hidden' }}>
              <div className="modal-header bg-jsc-primary text-white py-3" style={{ backgroundColor: 'rgba(0,0,0,0.95)' }}>
                <h5 className="modal-title font-headline-md" style={{ fontFamily: 'Plus Jakarta Sans' }}>Checkout Simulator</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowPaymentModal(false)}></button>
              </div>
              <div className="modal-body p-4 bg-light bg-opacity-95">
                <div className="alert alert-warning border-0 rounded-3 text-xs mb-4" style={{ borderRadius: '8px' }}>
                  <strong>Simulasi Finansial:</strong> Integrasi Webhook Simulator. Selesaikan transaksi untuk mendapatkan poin loyalitas.
                </div>
                
                <div className="mb-3">
                  <p className="text-[10px] text-muted font-bold uppercase mb-1">Pesanan ID</p>
                  <p className="font-bold text-sm text-jsc-primary">
                    #{Array.isArray(pendingBooking) ? pendingBooking.map(b => b.id).join(', #') : pendingBooking.id}
                  </p>
                </div>

                <div className="mb-3">
                  <p className="text-[10px] text-muted font-bold uppercase mb-1">Total Tagihan</p>
                  <h3 className="font-bold text-jsc-primary" style={{ fontSize: '26px' }}>
                    Rp {
                      (Array.isArray(pendingBooking)
                        ? pendingBooking.reduce((sum, b) => sum + parseFloat(b.totalHarga), 0)
                        : parseFloat(pendingBooking.totalHarga)
                      ).toLocaleString()
                    }
                  </h3>
                </div>

                <div className="mb-4">
                  <label className="form-label text-xs text-muted font-bold uppercase mb-1">Metode Pembayaran</label>
                  <select 
                    className="form-select text-sm py-2" 
                    value={paymentMethod} 
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    style={{ borderRadius: '8px' }}
                  >
                    <option value="E-Wallet">ShopeePay / GoPay (E-Wallet)</option>
                    <option value="Transfer Bank">Virtual Account Mandiri (Transfer Bank)</option>
                  </select>
                </div>

                <div className="row g-3">
                  <div className="col-6">
                    <button 
                      type="button" 
                      className="btn btn-jsc-lime w-100 py-3 font-bold d-flex align-items-center justify-content-center gap-2"
                      onClick={() => handleSimulatePayment('Verified')}
                      disabled={paymentLoading}
                    >
                      <span className="material-symbols-outlined text-sm">check</span>
                      <span>Bayar (Sukses)</span>
                    </button>
                  </div>
                  <div className="col-6">
                    <button 
                      type="button" 
                      className="btn btn-outline-danger w-100 py-3 font-bold d-flex align-items-center justify-content-center gap-2"
                      onClick={() => handleSimulatePayment('Failed')}
                      disabled={paymentLoading}
                      style={{ borderRadius: '8px' }}
                    >
                      <span className="material-symbols-outlined text-sm">close</span>
                      <span>Gagalkan</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
