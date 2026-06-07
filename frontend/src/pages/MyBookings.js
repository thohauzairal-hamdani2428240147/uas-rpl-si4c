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
          backgroundImage: 'linear-gradient(to top, rgba(0, 6, 19, 0.95), rgba(0, 6, 19, 0.2)), url("https://lh3.googleusercontent.com/aida/AP1WRLsxjKtjytd7fYWMKkifIoVGt1CythKp5sbmRmIu223cCOrl8MVD1_x8YnzUCSnZoZpU84kkb6FH733i-OGdQtiZmGxz9ThmDK7ZQiyNbqtf8JU1X1jIRGMMMyaghsWOyiO-4g_FCmlKj0TkYgXMCLME3Ox07_Lp2sw8zVgIu-uez-eN1n0nx1lIwxxl8Lg_8AylzmvetnlkBgIlzLZkOs06PE87aQyfHo7zvKlV7ThUL8cgpLf5xINs7Q")'
        }}
      >
        <span className="badge bg-jsc-lime text-jsc-navy font-label-caps align-self-start mb-2 px-3 py-2">
          Penyewa Lapangan
        </span>
        <h1 className="font-headline-lg mb-1">Riwayat Booking Anda</h1>
        <p className="text-white-50 font-body-md mb-0">Lihat seluruh riwayat sewa lapangan, status pembayaran, dan E-Tiket masuk arena</p>
      </div>

      {message.text && (
        <div className={`alert alert-${message.type} border-0 rounded-3 text-sm p-3 mb-4 d-flex align-items-center gap-2`}>
          <span className="material-symbols-outlined">
            {message.type === 'success' ? 'check_circle' : 'error'}
          </span>
          <span>{message.text}</span>
        </div>
      )}

      {/* Booking History Section */}
      <div className="card shadow-sm border rounded-3 bg-white">
        <div className="card-header bg-jsc-navy text-white p-3 d-flex align-items-center justify-content-between">
          <h5 className="mb-0 font-bold d-flex align-items-center gap-2">
            <span className="material-symbols-outlined">history</span>
            <span>Daftar Pemesanan Lapangan</span>
          </h5>
          <button className="btn btn-sm btn-outline-light d-flex align-items-center gap-1" onClick={fetchBookings}>
            <span className="material-symbols-outlined text-xs">refresh</span>
            <span>Refresh</span>
          </button>
        </div>
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status"></div>
              <p className="text-muted mt-2 mb-0">Memuat riwayat pemesanan...</p>
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <span className="material-symbols-outlined text-headline-lg mb-2" style={{ fontSize: '48px' }}>receipt_long</span>
              <p className="mb-0 text-sm">Belum ada riwayat pemesanan lapangan.</p>
            </div>
          ) : (
            <div>
              {/* Desktop Table View */}
              <div className="d-none d-md-block table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="px-4 py-3 text-xs fw-bold text-muted uppercase">Lapangan</th>
                      <th className="py-3 text-xs fw-bold text-muted uppercase">Tanggal</th>
                      <th className="py-3 text-xs fw-bold text-muted uppercase">Jam</th>
                      <th className="py-3 text-xs fw-bold text-muted uppercase">Total Harga</th>
                      <th className="py-3 text-xs fw-bold text-muted uppercase">Status Pembayaran</th>
                      <th className="py-3 text-xs fw-bold text-muted uppercase">Check-in</th>
                      <th className="px-4 py-3 text-end text-xs fw-bold text-muted uppercase">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((booking) => {
                      const lunas = booking.pembayaran && booking.pembayaran.statusBayar === 'Verified';
                      const kodeBooking = booking.pembayaran ? booking.pembayaran.kodeBooking : null;
                      return (
                        <tr key={booking.id}>
                          <td className="px-4 py-3">
                            <div className="d-flex align-items-center gap-2">
                              <span className="material-symbols-outlined text-jsc-navy text-md">
                                {booking.lapangan?.kategori === 'Futsal' ? 'sports_soccer' : booking.lapangan?.kategori === 'Basket' ? 'sports_basketball' : 'sports_tennis'}
                              </span>
                              <div>
                                <span className="fw-bold text-jsc-primary d-block">{booking.lapangan?.namaLapangan}</span>
                                <span className="badge bg-light text-jsc-navy font-label-caps text-[9px]">{booking.lapangan?.kategori}</span>
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
                                <span className="badge bg-success py-1.5 px-2.5 rounded-pill text-[10px] d-inline-flex align-items-center gap-1">
                                  <span className="material-symbols-outlined text-xs">done_all</span>
                                  <span>Sudah Masuk</span>
                                </span>
                              ) : (
                                <span className="badge bg-warning text-dark py-1.5 px-2.5 rounded-pill text-[10px] d-inline-flex align-items-center gap-1">
                                  <span className="material-symbols-outlined text-xs">schedule</span>
                                  <span>Belum Check-in</span>
                                </span>
                              )
                            ) : (
                              <span className="text-muted text-xs">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-end">
                            {lunas && kodeBooking ? (
                              <button 
                                className="btn btn-jsc-lime btn-sm font-bold d-inline-flex align-items-center gap-1.5"
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
              <div className="d-block d-md-none p-3">
                {bookings.map((booking) => {
                  const lunas = booking.pembayaran && booking.pembayaran.statusBayar === 'Verified';
                  const kodeBooking = booking.pembayaran ? booking.pembayaran.kodeBooking : null;
                  return (
                    <div className="card shadow-sm border rounded-3 p-3 bg-white mb-3 text-start animate-slide-up" key={booking.id} style={{ borderRadius: '12px' }}>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="badge bg-light text-jsc-navy font-label-caps text-[9px] px-2 py-1">{booking.lapangan?.kategori}</span>
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
                          className="btn btn-jsc-lime btn-sm font-bold w-100 py-2 d-flex align-items-center justify-content-center gap-1.5 mt-1"
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

      {/* Modal E-Tiket QR Code */}
      {showTicketModal && selectedBooking && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 overflow-hidden" style={{ borderRadius: '16px' }}>
              <div className="modal-header bg-jsc-navy text-white border-0 py-3">
                <h5 className="modal-title font-headline-md d-flex align-items-center gap-2">
                  <span className="material-symbols-outlined text-jsc-lime">confirmation_number</span>
                  <span>E-Tiket Arena JSC</span>
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowTicketModal(false)}></button>
              </div>
              
              <div className="modal-body p-4 bg-light">
                <div className="bg-white border rounded-4 p-4 shadow-sm position-relative overflow-hidden">
                  
                  {/* Decorative circle punch outs for ticket style */}
                  <div className="position-absolute bg-light rounded-circle" style={{ width: '24px', height: '24px', left: '-12px', top: '50%', transform: 'translateY(-50%)', borderRight: '1px solid #dee2e6' }}></div>
                  <div className="position-absolute bg-light rounded-circle" style={{ width: '24px', height: '24px', right: '-12px', top: '50%', transform: 'translateY(-50%)', borderLeft: '1px solid #dee2e6' }}></div>

                  {/* Header info */}
                  <div className="text-center mb-4 pb-3 border-bottom border-dashed">
                    <span className="badge bg-jsc-navy text-white px-3 py-1.5 font-label-caps text-xs mb-2">
                      {selectedBooking.lapangan?.kategori}
                    </span>
                    <h4 className="font-bold text-jsc-primary mb-1">{selectedBooking.lapangan?.namaLapangan}</h4>
                    <p className="text-muted text-xs mb-0">Jakabaring Sport City, Palembang</p>
                  </div>

                  {/* Booking details grid */}
                  <div className="row g-3 text-center mb-4">
                    <div className="col-6">
                      <p className="text-[10px] text-muted fw-bold uppercase mb-0">Tanggal Main</p>
                      <p className="font-bold text-sm text-jsc-navy mb-0">{selectedBooking.tanggal}</p>
                    </div>
                    <div className="col-6">
                      <p className="text-[10px] text-muted fw-bold uppercase mb-0">Jam Sesi</p>
                      <p className="font-bold text-sm text-jsc-navy mb-0">
                        {selectedBooking.waktuMulai?.substring(0, 5)} - {selectedBooking.waktuSelesai?.substring(0, 5)}
                      </p>
                    </div>
                  </div>

                  {/* QR Code SVG */}
                  <div className="d-flex flex-column align-items-center justify-content-center p-3 bg-light rounded-3 mb-4">
                    <div className="bg-white p-3 rounded-2 shadow-xs border">
                      <QRCodeSVG 
                        value={selectedBooking.pembayaran.kodeBooking} 
                        size={180}
                        bgColor="#ffffff"
                        fgColor="#000814"
                        includeMargin={true}
                      />
                    </div>
                    
                    {/* Booking Code Display */}
                    <div className="text-center mt-3">
                      <p className="text-[10px] text-muted fw-bold uppercase mb-0">Kode Booking</p>
                      <h4 className="font-bold text-jsc-secondary tracking-widest mt-1 mb-0">
                        {selectedBooking.pembayaran.kodeBooking}
                      </h4>
                    </div>
                  </div>

                  {/* Footer instruction & checkedIn badge */}
                  <div className="text-center mt-3 pt-3 border-top border-dashed">
                    {selectedBooking.checkedIn ? (
                      <div className="badge bg-success bg-opacity-10 text-success border border-success py-2 px-3 rounded-pill text-xs d-inline-flex align-items-center gap-1">
                        <span className="material-symbols-outlined text-sm">check_circle</span>
                        <span>CHECK-IN BERHASIL / SUDAH MASUK</span>
                      </div>
                    ) : (
                      <>
                        <div className="badge bg-warning bg-opacity-10 text-dark border border-warning py-2 px-3 rounded-pill text-xs d-inline-flex align-items-center gap-1 mb-2">
                          <span className="material-symbols-outlined text-sm">schedule</span>
                          <span>BELUM CHECK-IN</span>
                        </div>
                        <p className="text-[10px] text-muted mb-0">
                          Tunjukkan QR Code ini ke petugas Kasir lapangan untuk dipindai saat check-in kedatangan.
                        </p>
                      </>
                    )}
                  </div>

                </div>
              </div>
              
              <div className="modal-footer bg-light border-0 py-3 d-flex justify-content-center">
                <button 
                  type="button" 
                  className="btn btn-jsc-navy px-4" 
                  onClick={() => setShowTicketModal(false)}
                >
                  Tutup Tiket
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
