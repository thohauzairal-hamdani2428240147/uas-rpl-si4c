import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';

export default function AdminDashboard({ currentUser }) {
  const [report, setReport] = useState({ totalPendapatan: 0, rekapitulasi: [], transactions: [], dailyData: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedRange, setSelectedRange] = useState('This Week');
  const [selectedCategory, setSelectedCategory] = useState('All Facilities');

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
        setReport(data.data || { totalPendapatan: 0, rekapitulasi: [], transactions: [], dailyData: [] });
      } catch (err) {
        console.error(err);
        setError('Gagal memuat laporan finansial admin.');
      } finally {
        setLoading(false);
      }
    }

    loadReport();
  }, [currentUser]);

  // Auto-scroll to finances section if hash is present
  useEffect(() => {
    if (!loading && window.location.hash === '#finances') {
      setTimeout(() => {
        const el = document.getElementById('finances-section');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    }
  }, [loading]);

  // Dynamic calculations helpers
  const getTrendData = () => {
    const daily = report.dailyData || [];

    // 1. Filter by category
    const filtered = daily.filter(d => {
      if (selectedCategory === 'All Facilities') return true;
      return d.kategori && d.kategori.toLowerCase() === selectedCategory.toLowerCase();
    });

    // 2. Helper to get dates
    const now = new Date();

    if (selectedRange === 'This Week') {
      // Find current Monday
      const currentDay = now.getDay(); // 0 is Sunday, 1 is Monday...
      const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() + distanceToMonday);
      startOfWeek.setHours(0, 0, 0, 0);

      const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
      const currentWeekRevenues = days.map((day, idx) => {
        const d = new Date(startOfWeek);
        d.setDate(startOfWeek.getDate() + idx);
        const localD = new Date(d.getTime() - (d.getTimezoneOffset() * 60000));
        const dateStr = localD.toISOString().split('T')[0];

        const sum = filtered
          .filter(item => item.date === dateStr)
          .reduce((acc, curr) => acc + curr.amount, 0);

        return { label: day, val: sum };
      });

      const currentTotal = currentWeekRevenues.reduce((acc, curr) => acc + curr.val, 0);

      // Previous week total
      const startOfPrevWeek = new Date(startOfWeek);
      startOfPrevWeek.setDate(startOfWeek.getDate() - 7);
      const prevWeekRevenues = days.map((day, idx) => {
        const d = new Date(startOfPrevWeek);
        d.setDate(startOfPrevWeek.getDate() + idx);
        const localD = new Date(d.getTime() - (d.getTimezoneOffset() * 60000));
        const dateStr = localD.toISOString().split('T')[0];

        return filtered
          .filter(item => item.date === dateStr)
          .reduce((acc, curr) => acc + curr.amount, 0);
      });
      const prevTotal = prevWeekRevenues.reduce((acc, curr) => acc + curr, 0);

      let trendPercent = 0;
      if (prevTotal > 0) {
        trendPercent = ((currentTotal - prevTotal) / prevTotal) * 100;
      } else if (currentTotal > 0) {
        trendPercent = 100;
      }

      const maxVal = Math.max(...currentWeekRevenues.map(r => r.val), 100000);
      const bars = currentWeekRevenues.map(r => ({
        day: r.label,
        val: r.val,
        heightPercent: Math.max(10, Math.min(100, (r.val / maxVal) * 100)),
        active: new Date().getDay() === (days.indexOf(r.label) + 1) % 7 // Highlight current day
      }));

      return {
        total: currentTotal,
        trendPercent: trendPercent.toFixed(1),
        bars
      };
    } else {
      // Last 30 Days (4 weeks trend)
      const weeks = [
        { label: 'Wk 4', daysMin: 0, daysMax: 7 },
        { label: 'Wk 3', daysMin: 8, daysMax: 14 },
        { label: 'Wk 2', daysMin: 15, daysMax: 21 },
        { label: 'Wk 1', daysMin: 22, daysMax: 30 }
      ];

      const currentPeriodRevenues = weeks.map(w => {
        const sum = filtered.filter(item => {
          const [y, m, d] = item.date.split('-').map(Number);
          const itemLocalDate = new Date(y, m - 1, d);
          const todayLocalDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const diffDays = Math.round((todayLocalDate - itemLocalDate) / (1000 * 60 * 60 * 24));
          return diffDays >= w.daysMin && diffDays <= w.daysMax;
        }).reduce((acc, curr) => acc + curr.amount, 0);

        return { label: w.label, val: sum };
      }).reverse(); // Sort Wk 1 -> Wk 4

      const currentTotal = currentPeriodRevenues.reduce((acc, curr) => acc + curr.val, 0);

      // Previous 30 days total
      const prevTotal = filtered.filter(item => {
        const [y, m, d] = item.date.split('-').map(Number);
        const itemLocalDate = new Date(y, m - 1, d);
        const todayLocalDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const diffDays = Math.round((todayLocalDate - itemLocalDate) / (1000 * 60 * 60 * 24));
        return diffDays >= 31 && diffDays <= 60;
      }).reduce((acc, curr) => acc + curr.amount, 0);

      let trendPercent = 0;
      if (prevTotal > 0) {
        trendPercent = ((currentTotal - prevTotal) / prevTotal) * 100;
      } else if (currentTotal > 0) {
        trendPercent = 100;
      }

      const maxVal = Math.max(...currentPeriodRevenues.map(r => r.val), 100000);
      const bars = currentPeriodRevenues.map((r, idx) => ({
        day: r.label,
        val: r.val,
        heightPercent: Math.max(10, Math.min(100, (r.val / maxVal) * 100)),
        active: idx === 3 // Highlight latest week
      }));

      return {
        total: currentTotal,
        trendPercent: trendPercent.toFixed(1),
        bars
      };
    }
  };

  const trend = getTrendData();

  // Render Highcharts dynamically
  useEffect(() => {
    if (loading || !window.Highcharts || currentUser.role !== 'Admin') return;

    const days = trend.bars.map(b => b.day);
    const data = trend.bars.map(b => b.val);

    window.Highcharts.chart('revenue-chart-container', {
      chart: {
        type: 'column',
        backgroundColor: 'transparent',
        style: {
          fontFamily: "'Plus Jakarta Sans', sans-serif"
        },
        height: 220
      },
      title: {
        text: ''
      },
      credits: {
        enabled: false
      },
      xAxis: {
        categories: days,
        crosshair: true,
        labels: {
          style: {
            color: '#75777e',
            fontWeight: '600',
            fontSize: '10px'
          }
        },
        lineColor: 'rgba(0,0,0,0.05)'
      },
      yAxis: {
        min: 0,
        title: {
          text: ''
        },
        labels: {
          formatter: function () {
            if (this.value >= 1000000) {
              return 'Rp ' + (this.value / 1000000) + 'M';
            }
            if (this.value >= 1000) {
              return 'Rp ' + (this.value / 1000) + 'k';
            }
            return 'Rp ' + this.value;
          },
          style: {
            color: '#75777e',
            fontSize: '10px'
          }
        },
        gridLineColor: 'rgba(0,0,0,0.05)'
      },
      legend: {
        enabled: false
      },
      tooltip: {
        headerFormat: '<span style="font-size:10px; font-weight: bold">{point.key}</span><table style="width:150px">',
        pointFormat: '<tr><td style="color:{series.color};padding:0; font-size:11px">{series.name}: </td>' +
          '<td style="padding:0; text-align: right; font-weight: bold; font-size:11px">Rp {point.y:,.0f}</td></tr>',
        footerFormat: '</table>',
        shared: true,
        useHTML: true,
        backgroundColor: 'rgba(11, 13, 20, 0.95)',
        style: {
          color: '#ffffff'
        },
        borderWidth: 0,
        borderRadius: 8
      },
      plotOptions: {
        column: {
          pointPadding: 0.15,
          borderWidth: 0,
          borderRadius: 4
        }
      },
      series: [{
        name: 'Pendapatan',
        data: data.map((val, idx) => {
          const isEven = idx % 2 === 0;
          return {
            y: val,
            color: isEven ? '#0B0D14' : '#79ff5b'
          };
        })
      }]
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, selectedRange, selectedCategory, report, currentUser.role]);

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

  if (currentUser.role !== 'Admin') {
    return (
      <div className="container py-5 text-center">
        <div className="glass-panel p-5 mx-auto" style={{ maxWidth: '450px', borderRadius: '16px' }}>
          <span className="material-symbols-outlined text-danger mb-3 animate-pulse" style={{ fontSize: '48px' }}>lock</span>
          <h4 className="font-headline-md text-jsc-primary mb-2" style={{ fontFamily: 'Plus Jakarta Sans' }}>Akses Terbatas</h4>
          <p className="text-muted text-sm mb-4">
            Halaman ini hanya dapat diakses oleh Administrator. Silakan ubah session Anda menjadi <strong>Admin</strong> pada dropdown di navbar untuk melihat data dasbor.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      {/* Header section matching Stitch */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-end mb-4 gap-3">
        <div>
          <h2 className="font-headline-lg text-jsc-primary mb-1" style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: '800' }}>
            Revenue Report
          </h2>
          <p className="text-muted text-sm mb-0">Financial performance and transaction history for Jakabaring Sport City.</p>
        </div>

        {/* Dynamic Filter Bars */}
        <div className="d-flex flex-wrap gap-2">
          <div className="glass-panel rounded px-3 py-2 d-flex align-items-center gap-2 border border-light">
            <span className="material-symbols-outlined text-muted text-sm">calendar_today</span>
            <select
              className="border-0 bg-transparent fw-bold text-xs p-0 text-jsc-primary"
              style={{ outline: 'none', cursor: 'pointer' }}
              value={selectedRange}
              onChange={(e) => setSelectedRange(e.target.value)}
            >
              <option value="This Week">This Week</option>
              <option value="Last 30 Days">Last 30 Days</option>
            </select>
          </div>
          <div className="glass-panel rounded px-3 py-2 d-flex align-items-center gap-2 border border-light">
            <span className="material-symbols-outlined text-muted text-sm">sports_tennis</span>
            <select
              className="border-0 bg-transparent fw-bold text-xs p-0 text-jsc-primary"
              style={{ outline: 'none', cursor: 'pointer' }}
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="All Facilities">All Facilities</option>
              {report.rekapitulasi && report.rekapitulasi.map(r => (
                <option key={r.kategori} value={r.kategori}>{r.kategori} Arena</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger border-0 rounded-3 mb-4" style={{ borderRadius: '8px' }}>{error}</div>
      )}

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-dark" role="status">
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
              <div className="glass-panel p-4 shadow-sm" style={{ borderRadius: '16px' }}>
                <div className="d-flex justify-content-between align-items-start mb-4">
                  <div>
                    <p className="font-label-caps text-muted text-xs mb-1">
                      {selectedRange === 'This Week' ? 'WEEKLY REVENUE TREND' : '30 DAYS REVENUE TREND'}
                    </p>
                    <h3 className="font-headline-md text-jsc-primary font-bold" style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: '800' }}>
                      Rp {parseInt(trend.total).toLocaleString()}
                    </h3>
                  </div>
                  {(() => {
                    const isPositive = parseFloat(trend.trendPercent) >= 0;
                    const badgeColor = isPositive ? 'var(--jsc-secondary-lime)' : '#ef4444';
                    const badgeBg = isPositive ? 'rgba(121, 255, 91, 0.15)' : 'rgba(239, 68, 68, 0.15)';
                    const badgeBorder = isPositive ? '1px solid rgba(121, 255, 91, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)';
                    return (
                      <span
                        className="badge font-bold d-flex align-items-center gap-1 py-2 px-3"
                        style={{ backgroundColor: badgeBg, color: badgeColor, border: badgeBorder, borderRadius: '8px' }}
                      >
                        <span className="material-symbols-outlined text-xs" style={{ color: badgeColor }}>
                          {isPositive ? 'trending_up' : 'trending_down'}
                        </span>
                        <span>{isPositive ? '+' : ''}{trend.trendPercent}%</span>
                      </span>
                    );
                  })()}
                </div>

                {/* Highcharts Render Container */}
                <div id="revenue-chart-container" style={{ width: '100%', height: '220px' }}></div>
              </div>
            </div>

            {/* Right: Summary cards stacked */}
            <div className="col-12 col-lg-4">
              <div className="d-flex flex-column h-100 gap-4">

                {/* Active Bookings card (Futuristic Sport Pass Design) */}
                <div
                  className="p-4 rounded-4 shadow-sm flex-fill position-relative overflow-hidden text-white"
                  style={{
                    background: 'linear-gradient(135deg, #05070a 0%, #0d121c 100%)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '16px'
                  }}
                >
                  {/* Radial glow */}
                  <div className="position-absolute" style={{ width: '150px', height: '150px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(121, 255, 91, 0.1) 0%, transparent 70%)', top: '-50px', right: '-50px' }}></div>

                  <p className="font-label-caps text-white-50 text-xs mb-1">ACTIVE BOOKINGS</p>
                  <h3 className="font-headline-lg text-white mb-2" style={{ fontSize: '3rem', fontFamily: 'Plus Jakarta Sans', fontWeight: '800' }}>
                    {report.rekapitulasi.reduce((acc, curr) => acc + curr.jumlahPemesanan, 0)}
                  </h3>
                  <div className="mt-4 d-flex align-items-center gap-1.5 text-jsc-lime text-xs font-bold">
                    <span className="material-symbols-outlined text-xs spin-icon" style={{ animationDuration: '2s' }}>bolt</span>
                    <span>High occupancy today</span>
                  </div>
                </div>

                {/* Top Facility Card */}
                <div className="glass-panel p-4 rounded-4 shadow-sm flex-fill" style={{ borderRadius: '16px' }}>
                  <p className="font-label-caps text-muted text-xs mb-1">TOP FACILITY</p>
                  <h4 className="font-headline-md text-jsc-primary font-bold mt-2 mb-1" style={{ fontFamily: 'Plus Jakarta Sans' }}>{getTopFacility()}</h4>
                  <p className="text-muted text-xs mb-4">Utilitas olahraga tertinggi minggu ini</p>

                  <div className="w-100 bg-black bg-opacity-10 rounded-pill mb-1" style={{ height: '8px', overflow: 'hidden' }}>
                    <div className="bg-dark rounded-pill h-100" style={{ width: '78%' }}></div>
                  </div>
                  <div className="d-flex justify-content-between text-[10px] text-muted font-bold">
                    <span>OCCUPANCY RATE</span>
                    <span>78%</span>
                  </div>
                </div>

              </div>
            </div>

          </div>

          {/* Daily Transactions Table */}
          <div id="finances-section" className="glass-panel rounded-4 overflow-hidden mb-4 shadow-sm" style={{ borderRadius: '16px' }}>
            <div className="px-4 py-3 border-bottom border-light-subtle d-flex justify-content-between align-items-center bg-white bg-opacity-40">
              <h5 className="font-headline-md text-jsc-primary mb-0" style={{ fontFamily: 'Plus Jakarta Sans', fontSize: '18px' }}>Daily Transactions</h5>
              <button
                className="btn btn-jsc-navy btn-sm font-bold text-xs d-flex align-items-center gap-1.5 py-2 px-3"
                onClick={() => alert('Fitur ekspor CSV diaktifkan pada Sprint berikutnya!')}
              >
                <span className="material-symbols-outlined text-sm">download</span>
                <span>Export CSV</span>
              </button>
            </div>

            <div className="table-responsive">
              <table className="table align-middle mb-0" style={{ backgroundColor: 'transparent' }}>
                <thead>
                  <tr className="border-bottom border-light">
                    <th className="px-4 py-3 text-xs font-bold text-muted uppercase">Transaction ID</th>
                    <th className="px-4 py-3 text-xs font-bold text-muted uppercase">User Name</th>
                    <th className="px-4 py-3 text-xs font-bold text-muted uppercase">Facility</th>
                    <th className="px-4 py-3 text-xs font-bold text-muted uppercase">Tanggal Booking</th>
                    <th className="px-4 py-3 text-xs font-bold text-muted uppercase">Jam Booking</th>
                    <th className="px-4 py-3 text-xs font-bold text-muted uppercase">Amount</th>
                    <th className="px-4 py-3 text-xs font-bold text-muted uppercase">Status</th>
                    <th className="px-4 py-3 text-xs font-bold text-muted uppercase">Tanggal Bayar</th>
                  </tr>
                </thead>
                <tbody>
                  {report.transactions && report.transactions.length > 0 ? (
                    report.transactions.map((trx) => {
                      const isVerified = trx.statusBayar === 'Verified';
                      const isFailed = trx.statusBayar === 'Failed';

                      let badgeStyle = { backgroundColor: 'rgba(250, 204, 21, 0.15)', color: 'var(--jsc-locked)', border: '1px solid rgba(250, 204, 21, 0.3)' };
                      let statusText = "Pending";
                      if (isVerified) {
                        badgeStyle = { backgroundColor: 'rgba(121, 255, 91, 0.15)', color: '#2ae500', border: '1px solid rgba(121,255,91,0.3)' };
                        statusText = "Success";
                      } else if (isFailed) {
                        badgeStyle = { backgroundColor: 'rgba(225, 29, 72, 0.15)', color: 'var(--jsc-booked)', border: '1px solid rgba(225, 29, 72, 0.3)' };
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
                        <tr key={trx.id} className="border-bottom border-light-subtle">
                          <td className="px-4 py-3 font-semibold text-sm">#TRX-{10000 + trx.id}</td>
                          <td className="px-4 py-3 text-muted text-sm">
                            {userName}
                          </td>
                          <td className="px-4 py-3 font-bold text-jsc-primary text-sm">
                            {facilityName}
                          </td>
                          <td className="px-4 py-3 text-muted text-sm">{bookingDate}</td>
                          <td className="px-4 py-3 font-semibold text-secondary text-sm">{bookingTime}</td>
                          <td className="px-4 py-3 font-bold text-sm">Rp {parseFloat(trx.jumlahBayar).toLocaleString()}</td>
                          <td className="px-4 py-3">
                            <span
                              className="badge rounded-pill text-uppercase font-bold text-[9px] px-2.5 py-1.5"
                              style={badgeStyle}
                            >
                              {statusText}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-muted text-xs">{formattedDate}</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="8" className="text-center py-4 text-muted">Belum ada transaksi pembayaran hari ini.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="px-4 py-3 bg-white bg-opacity-40 d-flex justify-content-between align-items-center border-top border-light-subtle">
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
