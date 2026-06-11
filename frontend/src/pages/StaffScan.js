import React, { useState, useEffect, useRef } from 'react';
import { apiService } from '../services/api';
import { Html5Qrcode } from 'html5-qrcode';

export default function StaffScan() {
  const [searchCode, setSearchCode] = useState('');
  const [bookingDetails, setBookingDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isScanning, setIsScanning] = useState(false);

  const scannerRef = useRef(null);

  // Search booking detail by booking code
  const handleSearch = async (codeToSearch) => {
    const code = codeToSearch || searchCode;
    if (!code) {
      setMessage({ type: 'danger', text: 'Harap masukkan atau pindai kode booking.' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });
    setBookingDetails(null);

    try {
      const res = await apiService.getBookingDetailsForStaff(code);
      setBookingDetails(res.data);
      setMessage({ type: 'success', text: 'Data tiket ditemukan!' });
    } catch (err) {
      console.error(err);
      setMessage({ 
        type: 'danger', 
        text: err.response?.data?.message || 'Kode booking tidak valid atau tidak ditemukan.' 
      });
    } finally {
      setLoading(false);
    }
  };

  // Start QR Scanner
  const startScanner = () => {
    setIsScanning(true);
    setMessage({ type: 'info', text: 'Kamera scanner diaktifkan. Silakan hadapkan QR Code.' });
    
    setTimeout(() => {
      try {
        const html5QrCode = new Html5Qrcode('reader');
        scannerRef.current = html5QrCode;

        html5QrCode.start(
          { facingMode: 'environment' }, // Prefer rear-facing (back) camera
          {
            fps: 15,
            qrbox: { width: 220, height: 220 }
          },
          (decodedText) => {
            setSearchCode(decodedText);
            html5QrCode.stop().then(() => {
              scannerRef.current = null;
              setIsScanning(false);
              handleSearch(decodedText);
            }).catch(e => console.error("Error stopping scanner on success:", e));
          },
          (errorMessage) => {
            // Constant scanning feedback - ignored
          }
        ).catch(err => {
          console.error("Gagal memulai camera stream:", err);
          setMessage({ type: 'danger', text: 'Gagal membuka kamera. Pastikan izin kamera telah diberikan.' });
          setIsScanning(false);
        });
      } catch (err) {
        console.error("Gagal menginisiasi scanner:", err);
        setMessage({ type: 'danger', text: 'Gagal mengaktifkan kamera.' });
        setIsScanning(false);
      }
    }, 150);
  };

  // Stop QR Scanner
  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.stop().then(() => {
        scannerRef.current = null;
        setIsScanning(false);
        setMessage({ type: '', text: '' });
      }).catch(err => {
        console.error("Error stopping scanner:", err);
        setIsScanning(false);
      });
    } else {
      setIsScanning(false);
    }
  };

  // Clean up scanner on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(err => console.error("Cleanup error:", err));
      }
    };
  }, []);

  // Confirm Check-in
  const handleConfirmCheckIn = async () => {
    if (!bookingDetails || !bookingDetails.kodeBooking) return;
    
    setActionLoading(true);
    try {
      const res = await apiService.processStaffCheckIn(bookingDetails.kodeBooking);
      setMessage({ type: 'success', text: res.message || 'Check-in berhasil dikonfirmasi!' });
      // Refresh details
      handleSearch(bookingDetails.kodeBooking);
    } catch (err) {
      console.error(err);
      setMessage({ 
        type: 'danger', 
        text: err.response?.data?.message || 'Gagal memproses check-in.' 
      });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="container py-4">
      <style>{`
        @keyframes scanPulse {
          0% { top: 10%; }
          50% { top: 90%; }
          100% { top: 10%; }
        }
        .viewfinder-scan-line {
          position: absolute;
          width: 90%;
          left: 5%;
          height: 3px;
          background-color: var(--jsc-secondary-lime);
          box-shadow: 0 0 12px var(--jsc-secondary-lime);
          animation: scanPulse 3s infinite linear;
          z-index: 10;
        }
        .scanner-frame {
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 16px;
          overflow: hidden;
          background-color: #000000;
          height: 280px;
        }
      `}</style>

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
          Staf Kasir
        </span>
        <h1 className="font-headline-lg mb-1" style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: '800' }}>
          Scan E-Ticket QR Code
        </h1>
        <p className="text-white-50 font-body-md mb-0">Lakukan pemindaian tiket QR Code penyewa atau lakukan verifikasi check-in manual</p>
      </div>

      <div className="row g-4">
        {/* Left Column: QR Code Scanner and Manual Input */}
        <div className="col-12 col-md-5">
          {/* Scanner Card */}
          <div className="glass-panel p-4 mb-4 text-center" style={{ borderRadius: '16px' }}>
            <h5 className="font-headline-md text-jsc-primary mb-3" style={{ fontFamily: 'Plus Jakarta Sans', fontSize: '18px' }}>Pindai dengan Kamera</h5>
            
            {isScanning ? (
              <div className="mb-3">
                <div className="position-relative scanner-frame mx-auto" style={{ maxWidth: '320px' }}>
                  {/* Scanner video element */}
                  <div id="reader" style={{ width: '100%', height: '100%' }}></div>
                  
                  {/* Viewfinder Target Corners */}
                  <div className="position-absolute" style={{ top: '24px', left: '24px', width: '20px', height: '20px', borderTop: '4px solid var(--jsc-secondary-lime)', borderLeft: '4px solid var(--jsc-secondary-lime)', zIndex: 11 }}></div>
                  <div className="position-absolute" style={{ top: '24px', right: '24px', width: '20px', height: '20px', borderTop: '4px solid var(--jsc-secondary-lime)', borderRight: '4px solid var(--jsc-secondary-lime)', zIndex: 11 }}></div>
                  <div className="position-absolute" style={{ bottom: '24px', left: '24px', width: '20px', height: '20px', borderBottom: '4px solid var(--jsc-secondary-lime)', borderLeft: '4px solid var(--jsc-secondary-lime)', zIndex: 11 }}></div>
                  <div className="position-absolute" style={{ bottom: '24px', right: '24px', width: '20px', height: '20px', borderBottom: '4px solid var(--jsc-secondary-lime)', borderRight: '4px solid var(--jsc-secondary-lime)', zIndex: 11 }}></div>
                  
                  {/* Scanning laser line animation */}
                  <div className="viewfinder-scan-line"></div>
                </div>
                
                <button 
                  type="button" 
                  className="btn btn-outline-danger btn-sm mt-3 font-bold d-inline-flex align-items-center gap-1.5 px-3 py-2"
                  onClick={stopScanner}
                  style={{ borderRadius: '8px' }}
                >
                  <span className="material-symbols-outlined text-sm">videocam_off</span>
                  <span>Matikan Kamera</span>
                </button>
              </div>
            ) : (
              <div className="py-4 my-2 border-2 border-dashed rounded-3 bg-white bg-opacity-40 d-flex flex-column align-items-center justify-content-center" style={{ borderRadius: '12px', borderColor: 'rgba(0,0,0,0.1)' }}>
                <span className="material-symbols-outlined text-muted mb-2" style={{ fontSize: '48px' }}>qr_code_scanner</span>
                <p className="text-xs text-muted mb-3">Aktifkan kamera perangkat untuk mendeteksi QR</p>
                <button 
                  type="button" 
                  className="btn btn-jsc-lime font-bold d-inline-flex align-items-center gap-1.5 py-2.5 px-4"
                  onClick={startScanner}
                >
                  <span className="material-symbols-outlined text-sm">videocam</span>
                  <span>Aktifkan Kamera</span>
                </button>
              </div>
            )}
          </div>

          {/* Manual Input Card */}
          <div className="glass-panel p-4" style={{ borderRadius: '16px' }}>
            <h5 className="font-headline-md text-jsc-primary mb-3" style={{ fontFamily: 'Plus Jakarta Sans', fontSize: '18px' }}>Verifikasi Kode Manual</h5>
            <div className="input-group mb-3">
              <span className="input-group-text bg-white bg-opacity-70 text-muted border-end-0" style={{ borderRadius: '8px 0 0 8px' }}>
                <span className="material-symbols-outlined text-sm">confirmation_number</span>
              </span>
              <input 
                type="text" 
                className="form-control text-sm bg-white bg-opacity-70 border-start-0 ps-0 fw-bold text-jsc-primary uppercase" 
                placeholder="Contoh: JSC-12345" 
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                disabled={loading}
                style={{ borderRadius: '0 8px 8px 0', borderLeft: 'none', padding: '10px' }}
              />
              <button 
                className="btn btn-jsc-navy font-bold text-sm px-3 ms-2" 
                type="button"
                onClick={() => handleSearch()}
                disabled={loading}
                style={{ borderRadius: '8px' }}
              >
                {loading ? 'Mencari...' : 'Cari Tiket'}
              </button>
            </div>
            <p className="text-[10px] text-muted mb-0">Ketik kode booking secara manual jika kamera tidak dapat memindai atau terkendala masalah izin.</p>
          </div>
        </div>

        {/* Right Column: Ticket / Booking Details Display */}
        <div className="col-12 col-md-7">
          <div className="glass-panel p-4 h-100" style={{ borderRadius: '16px' }}>
            <h5 className="font-headline-md text-jsc-primary mb-4 pb-2 border-bottom border-light-subtle" style={{ fontFamily: 'Plus Jakarta Sans' }}>Informasi Detail E-Ticket</h5>

            {message.text && (
              <div className={`alert alert-${message.type} border-0 rounded-3 text-sm p-3 mb-4 d-flex align-items-center gap-2`} style={{ borderRadius: '8px' }}>
                <span className="material-symbols-outlined">
                  {message.type === 'success' ? 'check_circle' : message.type === 'danger' ? 'error' : 'info'}
                </span>
                <span>{message.text}</span>
              </div>
            )}

            {loading ? (
              <div className="d-flex flex-column align-items-center justify-content-center py-5 my-5">
                <div className="spinner-border text-dark" role="status"></div>
                <p className="text-muted text-sm mt-3">Mengambil data booking...</p>
              </div>
            ) : bookingDetails ? (
              <div>
                {/* Visual Ticket Layout (Premium Dark Design inside details card) */}
                <div 
                  className="position-relative overflow-hidden text-white p-4 mb-4" 
                  style={{ 
                    borderRadius: '16px',
                    background: '#05070a',
                    border: '1px solid rgba(255,255,255,0.08)'
                  }}
                >
                  
                  {/* Punch out decoration */}
                  <div className="position-absolute rounded-circle" style={{ width: '20px', height: '20px', left: '-10px', top: '50%', transform: 'translateY(-50%)', backgroundColor: 'var(--jsc-background)', borderRight: '1px solid rgba(255,255,255,0.08)' }}></div>
                  <div className="position-absolute rounded-circle" style={{ width: '20px', height: '20px', right: '-10px', top: '50%', transform: 'translateY(-50%)', backgroundColor: 'var(--jsc-background)', borderLeft: '1px solid rgba(255,255,255,0.08)' }}></div>

                  {/* Top Header */}
                  <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center border-bottom border-secondary border-opacity-10 pb-3 mb-3 gap-2">
                    <div>
                      <p className="text-[9px] text-white-50 fw-bold uppercase mb-0">Kode Booking</p>
                      <h4 className="font-bold text-white mb-0" style={{ fontFamily: 'JetBrains Mono', color: 'var(--jsc-secondary-lime) !important' }}>{bookingDetails.kodeBooking}</h4>
                    </div>
                    <div className="text-sm-end">
                      <p className="text-[9px] text-white-50 fw-bold uppercase mb-0 mb-sm-1">Status Pembayaran</p>
                      <span className="badge py-1.5 px-3 font-bold text-[9px]" style={{ backgroundColor: 'rgba(121, 255, 91, 0.15)', color: 'var(--jsc-secondary-lime)', border: '1px solid rgba(121,255,91,0.2)', borderRadius: '999px' }}>
                        LUNAS (VERIFIED)
                      </span>
                    </div>
                  </div>

                  {/* User Info */}
                  <div className="mb-4">
                    <p className="text-[9px] text-white-50 fw-bold uppercase mb-1.5">Identitas Penyewa</p>
                    <div className="p-3 rounded-3 border border-secondary border-opacity-10" style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
                      <div className="d-flex align-items-center gap-3">
                        <div 
                          className="text-dark rounded-circle d-flex align-items-center justify-content-center font-bold flex-shrink-0"
                          style={{ width: '40px', height: '40px', backgroundColor: 'var(--jsc-secondary-lime)' }}
                        >
                          {bookingDetails.pemesanan?.[0]?.user?.nama?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <h6 className="font-bold mb-0 text-white">{bookingDetails.pemesanan?.[0]?.user?.nama}</h6>
                          <div className="text-xs text-white-50 d-flex flex-column flex-sm-row flex-wrap align-items-start align-items-sm-center gap-1 mt-0.5">
                            <span>@{bookingDetails.pemesanan?.[0]?.user?.nickname}</span>
                            <span className="d-none d-sm-inline">&bull;</span>
                            <span>{bookingDetails.pemesanan?.[0]?.user?.email}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Field & Booking details list */}
                  <div className="mb-4">
                    <p className="text-[9px] text-white-50 fw-bold uppercase mb-1.5">Daftar Slot Pemesanan</p>
                    <div className="p-3 rounded-3 border border-secondary border-opacity-10 space-y-3" style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
                      {bookingDetails.pemesanan?.map((slot, index) => (
                        <div key={slot.id} className={`d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2 ${index > 0 ? 'border-top border-secondary border-opacity-10 pt-2.5 mt-2.5' : ''}`}>
                          <div>
                            <span 
                              className="badge text-jsc-primary font-label-caps text-[9px] mb-1"
                              style={{ backgroundColor: 'var(--jsc-secondary-lime)' }}
                            >
                              {slot.lapangan?.kategori}
                            </span>
                            <h6 className="font-bold text-sm mb-0 text-white">{slot.lapangan?.namaLapangan}</h6>
                            <p className="text-xs text-white-50 mb-0">{slot.tanggal} &bull; {slot.waktuMulai?.substring(0, 5)} - {slot.waktuSelesai?.substring(0, 5)}</p>
                          </div>
                          <div className="text-sm-end w-100 w-sm-auto mt-1 mt-sm-0">
                            <span 
                              className="badge text-xs py-1.5 px-3 rounded-pill d-inline-block font-bold"
                              style={slot.checkedIn ? { 
                                backgroundColor: 'rgba(42, 229, 0, 0.15)', 
                                color: '#2ae500', 
                                border: '1px solid rgba(42,229,0,0.2)' 
                              } : { 
                                backgroundColor: 'rgba(250, 204, 21, 0.15)', 
                                color: 'var(--jsc-locked)', 
                                border: '1px solid rgba(250, 204, 21, 0.2)' 
                              }}
                            >
                              {slot.checkedIn ? 'Sudah Masuk' : 'Belum Check-in'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Summary Pricing */}
                  <div className="d-flex justify-content-between align-items-center pt-3 border-top border-secondary border-opacity-10">
                    <span className="text-xs text-white-50 fw-semibold">Total Jumlah Pembayaran</span>
                    <h5 className="font-bold mb-0 text-white" style={{ fontFamily: 'JetBrains Mono' }}>Rp {parseInt(bookingDetails.jumlahBayar).toLocaleString()}</h5>
                  </div>
                </div>

                {/* Confirm Action Button */}
                <div className="pt-2">
                  {bookingDetails.pemesanan?.every(s => s.checkedIn) ? (
                    <div className="alert alert-success border-0 rounded-3 text-center p-3 mb-0 d-flex align-items-center justify-content-center gap-2" style={{ borderRadius: '8px' }}>
                      <span className="material-symbols-outlined">verified</span>
                      <span className="fw-bold">Seluruh slot pada tiket ini sudah berhasil check-in.</span>
                    </div>
                  ) : (
                    <button 
                      type="button" 
                      className="btn btn-jsc-lime w-100 py-3 font-bold text-md d-flex align-items-center justify-content-center gap-2"
                      onClick={handleConfirmCheckIn}
                      disabled={actionLoading}
                    >
                      {actionLoading ? (
                        <>
                          <span className="spinner-border spinner-border-sm text-dark" role="status" aria-hidden="true" />
                          <span className="text-dark">Memproses Check-in...</span>
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-dark">done_all</span>
                          <span className="text-dark">Konfirmasi Check-in Masuk Lapangan</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-5 my-5 text-muted">
                <span className="material-symbols-outlined text-headline-lg mb-2 text-jsc-primary" style={{ fontSize: '48px' }}>qr_code</span>
                <p className="mb-0 text-sm">Pindai tiket QR Code penyewa atau cari dengan kode booking manual di sebelah kiri untuk melihat rincian.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
