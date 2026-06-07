import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';

export default function AdminDashboard({ currentUser }) {
  const [report, setReport] = useState({ totalPendapatan: 0, rekapitulasi: [], transactions: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch report data on component mount
  useEffect(() => {
    async function loadReport() {
      if (currentUser.role !== 'Admin') {
        setError('Akses ditolak. Dasbor ini khusus untuk Administrator.');
        setLoading(false);
        return;
      }
      
      try {
        setError('');
        const data = await apiService.getAdminReport();
        setReport(data.data);
      } catch (err) {
        console.error(err);
        setError('Gagal memuat laporan finansial admin.');
      } finally {
        setLoading(false);
      }
    }

    loadReport();
  }, [currentUser]);

  if (currentUser.role !== 'Admin') {
    return (
      <div className="container py-5 text-center">
        <div className="card border-0 shadow-sm p-5 mx-auto" style={{ maxWidth: '450px' }}>
          <span className="material-symbols-outlined text-danger text-5xl mb-3" style={{ fontSize: '48px' }}>lock</span>
          <h4 className="font-headline-md text-jsc-navy mb-2">Akses Terbatas</h4>
          <p className="text-muted text-sm mb-4">
            Halaman ini hanya dapat diakses oleh Administrator. Silakan ubah session Anda menjadi <strong>Admin</strong> pada dropdown di navbar untuk melihat data dasbor.
          </p>
        </div>
      </div>
    );
  }

  // Find top facility by booking count
  const getTopFacility = () => {
    if (!report.rekapitulasi || report.rekapitulasi.length === 0) return 'Tidak ada data';
    let top = report.rekapitulasi[0];
    report.rekapitulasi.forEach(item => {
      if (item.jumlahPemesanan > top.jumlahPemesanan) {
        top = item;
      }
    });
    return top.jumlahPemesanan > 0 ? `Lapangan ${top.kategori}` : 'Tidak ada booking';
  };

  return (
    <div className="container py-4">
      {/* Header section matching Stitch */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-end mb-4 gap-3">
        <div>
          <h2 className="font-headline-lg text-jsc-navy mb-1">Revenue Report</h2>
          <p className="text-muted text-sm mb-0">Financial performance and transaction history for Jakabaring Sport City.</p>
        </div>
        
        {/* Mock Filter Bars */}
        <div className="d-flex flex-wrap gap-2">
          <div className="bg-white border rounded px-3 py-2 d-flex align-items-center gap-2">
            <span className="material-symbols-outlined text-muted text-sm">calendar_today</span>
            <select className="border-0 bg-transparent fw-bold text-xs p-0" style={{ outline: 'none', cursor: 'pointer' }}>
              <option>This Week</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          <div className="bg-white border rounded px-3 py-2 d-flex align-items-center gap-2">
            <span className="material-symbols-outlined text-muted text-sm">sports_tennis</span>
            <select className="border-0 bg-transparent fw-bold text-xs p-0" style={{ outline: 'none', cursor: 'pointer' }}>
              <option>All Facilities</option>
              <option>Futsal Arena</option>
              <option>Basketball Hall</option>
              <option>Badminton Court</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger border-0 rounded-3 mb-4">{error}</div>
      )}

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted text-sm mt-2">Memuat data analitik...</p>
        </div>
      ) : (
        <>
          {/* Bento Stats Grid */}
          <div className="row g-4 mb-4">
            
            {/* Left: Weekly Revenue Trend Chart */}
            <div className="col-12 col-lg-8">
              <div className="card h-100 p-4 border shadow-sm bg-white">
                <div className="d-flex justify-content-between align-items-start mb-4">
                  <div>
                    <p className="font-label-caps text-muted text-xs mb-1">WEEKLY REVENUE TREND</p>
                    <h3 className="font-headline-md text-jsc-navy font-bold">
                      Rp {parseInt(report.totalPendapatan).toLocaleString()}
                    </h3>
                  </div>
                  <span className="badge bg-success bg-opacity-10 text-success font-bold d-flex align-items-center gap-1 py-2 px-3">
                    <span className="material-symbols-outlined text-xs">trending_up</span>
                    <span>+12.5%</span>
                  </span>
                </div>

                {/* Simulated Chart Bars */}
                <div className="d-flex align-items-end justify-content-between px-2 pt-3" style={{ height: '200px' }}>
                  {[
                    { day: 'MON', val: 40 },
                    { day: 'TUE', val: 65 },
                    { day: 'WED', val: 85, active: true },
                    { day: 'THU', val: 55 },
                    { day: 'FRI', val: 75 },
                    { day: 'SAT', val: 95 },
                    { day: 'SUN', val: 80 }
                  ].map((bar, index) => (
                    <div className="d-flex flex-column align-items-center flex-grow-1 mx-1 mx-sm-2" key={index}>
                      <div 
                        className={`w-100 rounded-top transition-all`} 
                        style={{ 
                          height: `${bar.val}%`, 
                          backgroundColor: bar.active ? '#32cd32' : '#eceef0',
                          minHeight: '20px'
                        }}
                      ></div>
                      <span className="font-label-caps text-muted text-[10px] mt-2">{bar.day}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Summary cards stacked */}
            <div className="col-12 col-lg-4">
              <div className="d-flex flex-column h-100 gap-4">
                
                {/* Active Bookings card */}
                <div className="bg-jsc-navy text-white p-4 rounded-3 shadow-sm flex-fill position-relative overflow-hidden">
                  <p className="font-label-caps text-white-50 text-xs mb-1">ACTIVE BOOKINGS</p>
                  <h3 className="font-headline-lg text-white mb-2" style={{ fontSize: '2.5rem' }}>
                    {report.rekapitulasi.reduce((acc, curr) => acc + curr.jumlahPemesanan, 0)}
                  </h3>
                  <div className="mt-4 d-flex align-items-center gap-1 text-jsc-lime text-xs font-bold">
                    <span className="material-symbols-outlined text-xs">bolt</span>
                    <span>High occupancy today</span>
                  </div>
                  {/* Abstract shape */}
                  <div 
                    className="position-absolute bg-jsc-lime rounded-circle opacity-10" 
                    style={{ width: '120px', height: '120px', right: '-40px', bottom: '-40px', filter: 'blur(30px)' }}
                  ></div>
                </div>

                {/* Top Facility Card */}
                <div className="bg-white border p-4 rounded-3 shadow-sm flex-fill">
                  <p className="font-label-caps text-muted text-xs mb-1">TOP FACILITY</p>
                  <h4 className="font-headline-md text-jsc-navy font-bold mt-2 mb-1">{getTopFacility()}</h4>
                  <p className="text-muted text-xs mb-4">Utilitas olahraga tertinggi minggu ini</p>
                  <div className="w-100 bg-light rounded-pill" style={{ height: '8px' }}>
                    <div className="bg-success rounded-pill h-100" style={{ width: '78%' }}></div>
                  </div>
                </div>

              </div>
            </div>

          </div>

          {/* Daily Transactions Table */}
          <div className="card shadow-sm border rounded-3 overflow-hidden mb-4">
            <div className="px-4 py-3 border-bottom d-flex justify-content-between align-items-center bg-white">
              <h5 className="font-headline-md text-jsc-navy mb-0">Daily Transactions</h5>
              <button 
                className="btn btn-link text-jsc-navy font-bold text-xs d-flex align-items-center gap-1 p-0 border-0"
                onClick={() => alert('Fitur ekspor CSV diaktifkan pada Sprint berikutnya!')}
              >
                <span className="material-symbols-outlined text-sm">download</span>
                <span>Export CSV</span>
              </button>
            </div>

            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light font-label-caps text-xs">
                  <tr>
                    <th className="px-4 py-3 text-muted">Transaction ID</th>
                    <th className="px-4 py-3 text-muted">User Name</th>
                    <th className="px-4 py-3 text-muted">Facility</th>
                    <th className="px-4 py-3 text-muted">Tanggal Booking</th>
                    <th className="px-4 py-3 text-muted">Jam Booking</th>
                    <th className="px-4 py-3 text-muted">Amount</th>
                    <th className="px-4 py-3 text-muted">Status</th>
                    <th className="px-4 py-3 text-muted">Tanggal Bayar</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-sm">
                  {report.transactions && report.transactions.length > 0 ? (
                    report.transactions.map((trx) => {
                      const isVerified = trx.statusBayar === 'Verified';
                      const isFailed = trx.statusBayar === 'Failed';
                      
                      let badgeClass = "bg-warning text-dark";
                      let statusText = "Pending";
                      if (isVerified) {
                        badgeClass = "bg-success text-white";
                        statusText = "Success";
                      } else if (isFailed) {
                        badgeClass = "bg-danger text-white";
                        statusText = "Failed";
                      }

                      // Format Date
                      const formattedDate = new Date(trx.createdAt).toLocaleString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      });

                      const hasBookings = Array.isArray(trx.pemesanan) && trx.pemesanan.length > 0;
                      const bookingDate = hasBookings
                        ? [...new Set(trx.pemesanan.map(p => p.tanggal))].join(', ')
                        : (trx.pemesanan && trx.pemesanan.tanggal ? trx.pemesanan.tanggal : '-');
                      const bookingTime = hasBookings
                        ? trx.pemesanan.map(p => `${p.waktuMulai.substring(0, 5)} - ${p.waktuSelesai.substring(0, 5)}`).join(', ')
                        : (trx.pemesanan && trx.pemesanan.waktuMulai ? `${trx.pemesanan.waktuMulai.substring(0, 5)} - ${trx.pemesanan.waktuSelesai.substring(0, 5)}` : '-');
                      const userName = hasBookings && trx.pemesanan[0].user
                        ? trx.pemesanan[0].user.nama
                        : (trx.pemesanan && trx.pemesanan.user ? trx.pemesanan.user.nama : '-');
                      const facilityName = hasBookings
                        ? [...new Set(trx.pemesanan.map(p => p.lapangan ? p.lapangan.namaLapangan : 'Lapangan'))].join(', ')
                        : (trx.pemesanan && trx.pemesanan.lapangan ? trx.pemesanan.lapangan.namaLapangan : 'Lapangan');

                      return (
                        <tr key={trx.id}>
                          <td className="px-4 py-3 font-semibold">#TRX-{10000 + trx.id}</td>
                          <td className="px-4 py-3 text-muted">
                            {userName}
                          </td>
                          <td className="px-4 py-3 font-bold text-jsc-navy">
                            {facilityName}
                          </td>
                          <td className="px-4 py-3 text-muted">{bookingDate}</td>
                          <td className="px-4 py-3 font-semibold text-secondary">{bookingTime}</td>
                          <td className="px-4 py-3 font-bold">Rp {parseFloat(trx.jumlahBayar).toLocaleString()}</td>
                          <td className="px-4 py-3">
                            <span className={`badge rounded-pill ${badgeClass} text-uppercase font-bold`} style={{ fontSize: '10px' }}>
                              {statusText}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-muted text-xs">{formattedDate}</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center py-4 text-muted">Belum ada transaksi pembayaran hari ini.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="px-4 py-3 bg-light d-flex justify-content-between align-items-center">
              <span className="text-muted text-xs">
                Showing {report.transactions ? report.transactions.length : 0} of {report.transactions ? report.transactions.length : 0} transactions
              </span>
              <div className="btn-group btn-group-sm">
                <button className="btn btn-outline-secondary" disabled>
                  <span className="material-symbols-outlined text-xs align-middle">chevron_left</span>
                </button>
                <button className="btn btn-outline-secondary" disabled>
                  <span className="material-symbols-outlined text-xs align-middle">chevron_right</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
