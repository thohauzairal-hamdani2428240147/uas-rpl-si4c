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
            fps: 10,
            qrbox: { width: 250, height: 250 }
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
            // Constant scanning feedback - ignored to avoid console spam
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
          Staf Kasir
        </span>
        <h1 className="font-headline-lg mb-1">Scan E-Ticket QR Code</h1>
        <p className="text-white-50 font-body-md mb-0">Lakukan pemindaian tiket QR Code penyewa atau lakukan verifikasi check-in manual</p>
      </div>

      <div className="row g-4">
        {/* Left Column: QR Code Scanner and Manual Input */}
        <div className="col-12 col-md-5">
          {/* Scanner Card */}
          <div className="card shadow-sm border rounded-3 p-4 mb-4 bg-white text-center">
            <h5 className="font-bold text-jsc-primary mb-3">Pindai dengan Kamera</h5>
            
            {isScanning ? (
              <div className="mb-3">
                <div id="reader" className="mx-auto border rounded-3 overflow-hidden bg-light" style={{ width: '100%', maxWidth: '350px' }}></div>
                <button 
                  type="button" 
                  className="btn btn-danger btn-sm mt-3 font-bold d-inline-flex align-items-center gap-1.5"
                  onClick={stopScanner}
                >
                  <span className="material-symbols-outlined text-sm">videocam_off</span>
                  <span>Matikan Kamera</span>
                </button>
              </div>
            ) : (
              <div className="py-4 my-2 border-2 border-dashed rounded-3 bg-light d-flex flex-column align-items-center justify-content-center">
                <span className="material-symbols-outlined text-muted mb-2" style={{ fontSize: '48px' }}>qr_code_scanner</span>
                <p className="text-xs text-muted mb-3">Aktifkan kamera laptop/HP Anda untuk scan</p>
                <button 
                  type="button" 
                  className="btn btn-jsc-navy font-bold d-inline-flex align-items-center gap-1.5"
                  onClick={startScanner}
                >
                  <span className="material-symbols-outlined text-sm">videocam</span>
                  <span>Aktifkan Kamera</span>
                </button>
              </div>
            )}
          </div>

          {/* Manual Input Card */}
          <div className="card shadow-sm border rounded-3 p-4 bg-white">
            <h5 className="font-bold text-jsc-primary mb-3">Verifikasi Kode Manual</h5>
            <div className="input-group mb-3">
              <span className="input-group-text bg-light text-muted border-end-0">
                <span className="material-symbols-outlined text-sm">confirmation_number</span>
              </span>
              <input 
                type="text" 
                className="form-control text-sm border-start-0 ps-0 fw-bold text-jsc-navy uppercase" 
                placeholder="Contoh: JSC-12345" 
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                disabled={loading}
              />
              <button 
                className="btn btn-jsc-navy font-bold text-sm px-3" 
                type="button"
                onClick={() => handleSearch()}
                disabled={loading}
              >
                {loading ? 'Mencari...' : 'Cari Tiket'}
              </button>
            </div>
            <p className="text-[10px] text-muted mb-0">Ketik kode booking secara manual jika kamera tidak dapat memindai atau tidak diizinkan.</p>
          </div>
        </div>

        {/* Right Column: Ticket / Booking Details Display */}
        <div className="col-12 col-md-7">
          <div className="card shadow-sm border rounded-3 p-4 bg-white h-100">
            <h5 className="font-bold text-jsc-primary mb-4 pb-2 border-bottom">Informasi Detail E-Ticket</h5>

            {message.text && (
              <div className={`alert alert-${message.type} border-0 rounded-3 text-sm p-3 mb-4 d-flex align-items-center gap-2`}>
                <span className="material-symbols-outlined">
                  {message.type === 'success' ? 'check_circle' : message.type === 'danger' ? 'error' : 'info'}
                </span>
                <span>{message.text}</span>
              </div>
            )}

            {loading ? (
              <div className="d-flex flex-column align-items-center justify-content-center py-5 my-5">
                <div className="spinner-border text-primary" role="status"></div>
                <p className="text-muted text-sm mt-3">Mengambil data booking...</p>
              </div>
            ) : bookingDetails ? (
              <div>
                {/* Visual Ticket Layout */}
                <div className="border rounded-4 p-4 mb-4 bg-light position-relative overflow-hidden">
                  
                  {/* Punch out decoration */}
                  <div className="position-absolute bg-white rounded-circle" style={{ width: '20px', height: '20px', left: '-10px', top: '50%', transform: 'translateY(-50%)', borderRight: '1px solid #dee2e6' }}></div>
                  <div className="position-absolute bg-white rounded-circle" style={{ width: '20px', height: '20px', right: '-10px', top: '50%', transform: 'translateY(-50%)', borderLeft: '1px solid #dee2e6' }}></div>

                  {/* Top Header */}
                  <div className="d-flex justify-content-between align-items-start border-bottom border-dashed pb-3 mb-3">
                    <div>
                      <p className="text-[10px] text-muted fw-bold uppercase mb-0">Kode Booking</p>
                      <h4 className="font-bold text-jsc-secondary mb-0">{bookingDetails.kodeBooking}</h4>
                    </div>
                    <div className="text-end">
                      <p className="text-[10px] text-muted fw-bold uppercase mb-0">Status Pembayaran</p>
                      <span className="badge bg-success bg-opacity-10 text-success border border-success py-1 px-2.5 rounded-pill text-[10px]">
                        LUNAS (Verified)
                      </span>
                    </div>
                  </div>

                  {/* User Info */}
                  <div className="mb-4">
                    <p className="text-[10px] text-muted fw-bold uppercase mb-1">Identitas Penyewa</p>
                    <div className="p-3 bg-white border rounded-3">
                      <div className="d-flex align-items-center gap-3">
                        <div 
                          className="bg-jsc-navy text-white rounded-circle d-flex align-items-center justify-content-center font-bold"
                          style={{ width: '40px', height: '40px' }}
                        >
                          {bookingDetails.pemesanan?.[0]?.user?.nama?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <h6 className="font-bold mb-0 text-jsc-primary">{bookingDetails.pemesanan?.[0]?.user?.nama}</h6>
                          <p className="text-xs text-muted mb-0">@{bookingDetails.pemesanan?.[0]?.user?.nickname} &bull; {bookingDetails.pemesanan?.[0]?.user?.email}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Field & Booking details list */}
                  <div className="mb-4">
                    <p className="text-[10px] text-muted fw-bold uppercase mb-1">Daftar Slot Pemesanan</p>
                    <div className="p-3 bg-white border rounded-3 space-y-3">
                      {bookingDetails.pemesanan?.map((slot, index) => (
                        <div key={slot.id} className={`d-flex justify-content-between align-items-center ${index > 0 ? 'border-top pt-2.5 mt-2.5' : ''}`}>
                          <div>
                            <span className="badge bg-jsc-navy text-white font-label-caps text-[9px] mb-1">
                              {slot.lapangan?.kategori}
                            </span>
                            <h6 className="font-bold text-sm mb-0 text-jsc-primary">{slot.lapangan?.namaLapangan}</h6>
                            <p className="text-xs text-muted mb-0">{slot.tanggal} &bull; {slot.waktuMulai?.substring(0, 5)} - {slot.waktuSelesai?.substring(0, 5)}</p>
                          </div>
                          <div className="text-end">
                            <span className={`badge text-xs py-1.5 px-2.5 rounded-pill ${slot.checkedIn ? 'bg-success bg-opacity-10 text-success border border-success' : 'bg-warning bg-opacity-10 text-dark border border-warning'}`}>
                              {slot.checkedIn ? 'Sudah Masuk' : 'Belum Check-in'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Summary Pricing */}
                  <div className="d-flex justify-content-between align-items-center pt-3 border-top border-dashed">
                    <span className="text-xs text-muted fw-semibold">Total Jumlah Pembayaran</span>
                    <h5 className="font-bold text-jsc-navy mb-0">Rp {parseInt(bookingDetails.jumlahBayar).toLocaleString()}</h5>
                  </div>
                </div>

                {/* Confirm Action Button */}
                <div className="pt-2">
                  {bookingDetails.pemesanan?.every(s => s.checkedIn) ? (
                    <div className="alert alert-success border-0 rounded-3 text-center p-3 mb-0 d-flex align-items-center justify-content-center gap-2">
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
                          <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                          <span>Memproses Check-in...</span>
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined">done_all</span>
                          <span>Konfirmasi Check-in Masuk Lapangan</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-5 my-5 text-muted">
                <span className="material-symbols-outlined text-headline-lg mb-2" style={{ fontSize: '48px' }}>qr_code</span>
                <p className="mb-0 text-sm">Pindai tiket QR Code penyewa atau cari dengan kode booking manual di sebelah kiri untuk melihat rincian.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
