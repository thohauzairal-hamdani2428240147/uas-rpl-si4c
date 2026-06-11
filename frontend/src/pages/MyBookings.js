import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { QRCodeSVG } from 'qrcode.react';

export default function MyBookings({ currentUser }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const fetchBookings = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await apiService.getMyBookings();
      setBookings(res.data || []);
    } catch (err) {
      console.error("Gagal mengambil riwayat booking:", err);
      setMessage({ type: 'danger', text: 'Gagal memuat riwayat pemesanan lapangan Anda.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser && currentUser.role === 'Penyewa') {
      fetchBookings();
    } else {
      setLoading(false);
    }
  }, [currentUser]);

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
          Penyewa Lapangan
        </span>
        <h1 className="font-headline-lg mb-1" style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: '800' }}>
          Riwayat Booking Anda
        </h1>
        <p className="text-white-50 font-body-md mb-0">Lihat seluruh riwayat sewa lapangan, status pembayaran, dan E-Tiket masuk arena</p>
      </div>

      {message.text && (
        <div className={`alert alert-${message.type} border-0 rounded-3 text-sm p-3 mb-4 d-flex align-items-center gap-2`} style={{ borderRadius: '8px' }}>
          <span className="material-symbols-outlined">
            {message.type === 'success' ? 'check_circle' : 'error'}
          </span>
          <span>{message.text}</span>
        </div>
      )}

      {/* Booking History Section */}
      <div className="glass-panel p-4 rounded-4 shadow-sm" style={{ borderRadius: '16px' }}>
        <div className="d-flex align-items-center justify-content-between mb-4">
          <h5 className="mb-0 font-headline-md text-jsc-primary d-flex align-items-center gap-2" style={{ fontFamily: 'Plus Jakarta Sans' }}>
            <span className="material-symbols-outlined text-jsc-primary">history</span>
            <span>Daftar Pemesanan Lapangan</span>
          </h5>
          <button 
            className="btn btn-jsc-navy btn-sm font-bold d-flex align-items-center gap-1.5 px-3 py-2" 
            onClick={fetchBookings}
          >
            <span className="material-symbols-outlined text-xs">refresh</span>
            <span>Refresh</span>
          </button>
        </div>

        <div className="p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-dark" role="status"></div>
              <p className="text-muted mt-2 mb-0">Memuat riwayat pemesanan...</p>
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <span className="material-symbols-outlined mb-2 text-jsc-primary" style={{ fontSize: '48px' }}>receipt_long</span>
              <p className="mb-0 text-sm">Belum ada riwayat pemesanan lapangan.</p>
            </div>
          ) : (
            <div>
              {/* Desktop Table View */}
              <div className="d-none d-md-block table-responsive">
                <table className="table align-middle mb-0" style={{ backgroundColor: 'transparent' }}>
                  <thead>
                    <tr className="border-bottom border-light">
                      <th className="px-3 py-3 text-xs fw-bold text-muted uppercase">Lapangan</th>
                      <th className="py-3 text-xs fw-bold text-muted uppercase">Tanggal</th>
                      <th className="py-3 text-xs fw-bold text-muted uppercase">Jam</th>
                      <th className="py-3 text-xs fw-bold text-muted uppercase">Total Harga</th>
                      <th className="py-3 text-xs fw-bold text-muted uppercase">Status Pembayaran</th>
                      <th className="py-3 text-xs fw-bold text-muted uppercase">Check-in</th>
                      <th className="px-3 py-3 text-end text-xs fw-bold text-muted uppercase">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((booking) => {
                      const lunas = booking.pembayaran && booking.pembayaran.statusBayar === 'Verified';
                      const kodeBooking = booking.pembayaran ? booking.pembayaran.kodeBooking : null;
                      return (
                        <tr key={booking.id} className="border-bottom border-light-subtle">
                          <td className="px-3 py-3">
                            <div className="d-flex align-items-center gap-2">
                              <div className="bg-dark rounded-circle p-2 d-flex align-items-center justify-content-center text-white" style={{ width: '36px', height: '36px' }}>
                                <span className="material-symbols-outlined text-jsc-lime text-md">
                                  {booking.lapangan?.kategori === 'Futsal' ? 'sports_soccer' : booking.lapangan?.kategori === 'Basket' ? 'sports_basketball' : 'sports_tennis'}
                                </span>
                              </div>
                              <div>
                                <span className="fw-bold text-jsc-primary d-block">{booking.lapangan?.namaLapangan}</span>
                                <span className="badge bg-dark text-white font-label-caps text-[9px] px-2 py-0.5">{booking.lapangan?.kategori}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 text-sm">{booking.tanggal}</td>
                          <td className="py-3 text-sm fw-semibold">{booking.waktuMulai?.substring(0, 5)} - {booking.waktuSelesai?.substring(0, 5)}</td>
                          <td className="py-3 text-sm fw-bold">Rp {parseInt(booking.totalHarga).toLocaleString()}</td>
                          <td className="py-3">
                            <span className={`badge py-1.5 px-2.5 rounded-pill font-label-caps text-[10px] ${
                              booking.status === 'Lunas' ? 'bg-success bg-opacity-10 text-success border border-success' :
                              booking.status === 'Pending' ? 'bg-warning bg-opacity-10 text-warning border border-warning' :
                              booking.status === 'Cancelled' ? 'bg-danger bg-opacity-10 text-danger border border-danger' :
                              'bg-secondary bg-opacity-10 text-secondary'
                            }`}>
                              {booking.status}
                            </span>
                          </td>
                          <td className="py-3">
                            {booking.status === 'Lunas' ? (
                              booking.checkedIn ? (
                                <span className="badge bg-success bg-opacity-10 text-success border border-success py-1.5 px-2.5 rounded-pill text-[10px] d-inline-flex align-items-center gap-1">
                                  <span className="material-symbols-outlined text-xs">done_all</span>
                                  <span>Sudah Masuk</span>
                                </span>
                              ) : (
                                <span className="badge bg-warning bg-opacity-10 text-warning border border-warning py-1.5 px-2.5 rounded-pill text-[10px] d-inline-flex align-items-center gap-1">
                                  <span className="material-symbols-outlined text-xs">schedule</span>
                                  <span>Belum Check-in</span>
                                </span>
                              )
                            ) : (
                              <span className="text-muted text-xs">-</span>
                            )}
                          </td>
                          <td className="px-3 py-3 text-end">
                            {lunas && kodeBooking ? (
                              <button 
                                className="btn btn-jsc-lime btn-sm font-bold d-inline-flex align-items-center gap-1.5 px-3 py-2"
                                onClick={() => {
                                  setSelectedBooking(booking);
                                  setShowTicketModal(true);
                                }}
                              >
                                <span className="material-symbols-outlined text-sm">qr_code</span>
                                <span>E-Tiket QR</span>
                              </button>
                            ) : (
                              <span className="text-xs text-muted">Belum Lunas</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="d-block d-md-none">
                {bookings.map((booking) => {
                  const lunas = booking.pembayaran && booking.pembayaran.statusBayar === 'Verified';
                  const kodeBooking = booking.pembayaran ? booking.pembayaran.kodeBooking : null;
                  return (
                    <div className="card shadow-xs border border-light p-3 bg-white mb-3 text-start animate-slide-up" key={booking.id} style={{ borderRadius: '12px' }}>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="badge bg-dark text-white font-label-caps text-[9px] px-2 py-1">{booking.lapangan?.kategori}</span>
                        <span className={`badge py-1 px-2.5 rounded-pill font-label-caps text-[9px] ${
                          booking.status === 'Lunas' ? 'bg-success bg-opacity-10 text-success border border-success' :
                          booking.status === 'Pending' ? 'bg-warning bg-opacity-10 text-warning border border-warning' :
                          booking.status === 'Cancelled' ? 'bg-danger bg-opacity-10 text-danger border border-danger' :
                          'bg-secondary bg-opacity-10 text-secondary'
                        }`}>
                          {booking.status}
                        </span>
                      </div>
                      
                      <h6 className="fw-bold text-jsc-primary mb-2" style={{ fontSize: '0.95rem' }}>{booking.lapangan?.namaLapangan}</h6>
                      
                      <div className="row g-2 text-xs text-muted mb-3 border-top border-bottom py-2 my-2 bg-light bg-opacity-50 rounded-2 px-1">
                        <div className="col-6">
                          <span className="fw-bold text-secondary text-[9px] d-block uppercase">Tanggal:</span>
                          <span className="fw-semibold text-jsc-primary">{booking.tanggal}</span>
                        </div>
                        <div className="col-6">
                          <span className="fw-bold text-secondary text-[9px] d-block uppercase">Jam Sesi:</span>
                          <span className="fw-semibold text-jsc-primary">{booking.waktuMulai?.substring(0, 5)} - {booking.waktuSelesai?.substring(0, 5)}</span>
                        </div>
                        <div className="col-6 mt-2">
                          <span className="fw-bold text-secondary text-[9px] d-block uppercase">Total Bayar:</span>
                          <span className="fw-semibold text-jsc-primary">Rp {parseInt(booking.totalHarga).toLocaleString()}</span>
                        </div>
                        <div className="col-6 mt-2">
                          <span className="fw-bold text-secondary text-[9px] d-block uppercase">Check-in:</span>
                          {booking.status === 'Lunas' ? (
                            booking.checkedIn ? (
                              <span className="text-success fw-bold">Sudah Masuk</span>
                            ) : (
                              <span className="text-warning fw-bold">Belum Check-in</span>
                            )
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </div>
                      </div>
                      
                      {lunas && kodeBooking ? (
                        <button 
                          className="btn btn-jsc-lime btn-sm font-bold w-100 py-2.5 d-flex align-items-center justify-content-center gap-1.5 mt-1"
                          onClick={() => {
                            setSelectedBooking(booking);
                            setShowTicketModal(true);
                          }}
                        >
                          <span className="material-symbols-outlined text-sm">qr_code</span>
                          <span>E-Tiket QR Code</span>
                        </button>
                      ) : (
                        <div className="text-center text-xs text-muted py-2 bg-light rounded mt-1 border border-dashed">
                          Belum Lunas / Tidak Ada E-Tiket
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal E-Tiket QR Code (Premium ProArena Ticket Pass Design) */}
      {showTicketModal && selectedBooking && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 overflow-hidden" style={{ borderRadius: '20px', background: 'transparent' }}>
              
              {/* Outer ticket frame */}
              <div className="glass-panel p-1 rounded-4 shadow-2xl">
                
                {/* The physical ticket body */}
                <div 
                  className="position-relative overflow-hidden text-white p-4" 
                  style={{ 
                    borderRadius: '16px', 
                    background: '#05070a',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                >
                  {/* Decorative circle punch outs for ticket style (left & right) */}
                  <div className="position-absolute rounded-circle" style={{ width: '24px', height: '24px', left: '-12px', top: '35%', transform: 'translateY(-50%)', backgroundColor: '#0c0e12', borderRight: '1px solid rgba(255, 255, 255, 0.1)' }}></div>
                  <div className="position-absolute rounded-circle" style={{ width: '24px', height: '24px', right: '-12px', top: '35%', transform: 'translateY(-50%)', backgroundColor: '#0c0e12', borderLeft: '1px solid rgba(255, 255, 255, 0.1)' }}></div>

                  {/* Header info */}
                  <div className="text-center mb-4 pb-3 border-bottom border-secondary border-opacity-10">
                    <span 
                      className="badge font-label-caps text-xs mb-2 px-3 py-1.5"
                      style={{ 
                        backgroundColor: 'rgba(121, 255, 91, 0.15)', 
                        color: 'var(--jsc-secondary-lime)', 
                        border: '1px solid rgba(121, 255, 91, 0.3)',
                        borderRadius: '999px'
                      }}
                    >
                      {selectedBooking.lapangan?.kategori} PASS
                    </span>
                    <h3 className="font-headline-md mb-1" style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: '800', letterSpacing: '-0.5px' }}>
                      {selectedBooking.lapangan?.namaLapangan}
                    </h3>
                    <p className="text-white-50 text-xs mb-0">
                      <span className="material-symbols-outlined text-xs align-middle me-1 text-jsc-lime">location_on</span>
                      Jakabaring Sport City, Palembang
                    </p>
                  </div>

                  {/* Booking details grid */}
                  <div className="row g-3 text-center mb-4 py-2" style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div className="col-6 border-end border-secondary border-opacity-10">
                      <p className="text-[9px] text-white-50 fw-bold uppercase mb-1">Tanggal Main</p>
                      <p className="font-bold text-sm mb-0 text-white">{selectedBooking.tanggal}</p>
                    </div>
                    <div className="col-6">
                      <p className="text-[9px] text-white-50 fw-bold uppercase mb-1">Jam Sesi</p>
                      <p className="font-bold text-sm mb-0 text-white">
                        {selectedBooking.waktuMulai?.substring(0, 5)} - {selectedBooking.waktuSelesai?.substring(0, 5)}
                      </p>
                    </div>
                  </div>

                  {/* QR Code SVG */}
                  <div className="d-flex flex-column align-items-center justify-content-center p-4 bg-white bg-opacity-5 rounded-4 mb-4 border border-white border-opacity-5">
                    <div className="bg-white p-3 rounded-3 shadow-sm" style={{ border: '4px solid var(--jsc-secondary-lime)' }}>
                      <QRCodeSVG 
                        value={selectedBooking.pembayaran.kodeBooking} 
                        size={170}
                        bgColor="#ffffff"
                        fgColor="#000000"
                        includeMargin={true}
                      />
                    </div>
                    
                    {/* Booking Code Display */}
                    <div className="text-center mt-3 w-100">
                      <p className="text-[9px] text-white-50 fw-bold uppercase mb-1">KODE BOOKING / VERIFIKASI</p>
                      <h4 
                        className="font-bold tracking-widest mt-1 mb-0 px-3 py-2 text-jsc-primary d-inline-block rounded-3"
                        style={{ 
                          fontFamily: 'JetBrains Mono', 
                          fontWeight: '800', 
                          backgroundColor: 'var(--jsc-secondary-lime)', 
                          fontSize: '18px',
                          boxShadow: '0 0 15px rgba(121, 255, 91, 0.3)'
                        }}
                      >
                        {selectedBooking.pembayaran.kodeBooking}
                      </h4>
                    </div>
                  </div>

                  {/* Dotted Tear Line */}
                  <div className="border-bottom border-dashed border-secondary border-opacity-20 my-3"></div>

                  {/* Footer instruction & checkedIn badge */}
                  <div className="text-center mt-2">
                    {selectedBooking.checkedIn ? (
                      <div 
                        className="badge py-2 px-3 rounded-pill text-xs d-inline-flex align-items-center gap-1.5 font-bold"
                        style={{ 
                          backgroundColor: 'rgba(121, 255, 91, 0.15)', 
                          color: 'var(--jsc-secondary-lime)', 
                          border: '1px solid rgba(121, 255, 91, 0.4)' 
                        }}
                      >
                        <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                        <span>VERIFIKASI SUDAH CHECK-IN</span>
                      </div>
                    ) : (
                      <>
                        <div 
                          className="badge py-2 px-3 rounded-pill text-xs d-inline-flex align-items-center gap-1.5 mb-2 font-bold"
                          style={{ 
                            backgroundColor: 'rgba(250, 204, 21, 0.15)', 
                            color: 'var(--jsc-locked)', 
                            border: '1px solid rgba(250, 204, 21, 0.3)' 
                          }}
                        >
                          <span className="material-symbols-outlined text-sm">qr_code_scanner</span>
                          <span>SIAP PINDAI (BELUM CHECK-IN)</span>
                        </div>
                        <p className="text-[10px] text-white-50 mb-0">
                          Tunjukkan E-Tiket QR Code ini ke petugas staff/kasir lapangan saat Anda tiba di gerbang arena.
                        </p>
                      </>
                    )}
                  </div>
                  
                  {/* Close button in ticket layout */}
                  <div className="mt-4 pt-2 text-center">
                    <button 
                      type="button" 
                      className="btn btn-jsc-lime px-4 py-2 text-xs uppercase font-bold"
                      style={{ letterSpacing: '1px', borderRadius: '6px' }}
                      onClick={() => setShowTicketModal(false)}
                    >
                      Tutup E-Ticket Pass
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

