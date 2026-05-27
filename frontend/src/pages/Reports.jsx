import { useState, useMemo } from 'react';
import { useApp } from '../contexts/AppContext';

const periods = [
  { value: 'daily', label: 'Harian' },
  { value: 'weekly', label: 'Mingguan' },
  { value: 'monthly', label: 'Bulanan' },
  { value: 'custom', label: 'Custom Range' },
];

const reportTabs = [
  { id: 'summary', label: 'Ringkasan Keuangan', icon: '💰' },
  { id: 'done-orders', label: 'Order Selesai', icon: '✅' },
  { id: 'technician', label: 'Performa Teknisi', icon: '👨‍🔧' },
  { id: 'service-history', label: 'History Transaksi Service', icon: '📋' },
  { id: 'sales-history', label: 'History Penjualan', icon: '🛒' },
  { id: 'stock', label: 'Laporan Stok', icon: '📦' },
];

function formatCurrency(n) {
  return (n || 0).toLocaleString('id-ID');
}

function getDateRange(period, customStart, customEnd) {
  const now = new Date();
  let start, end;

  switch (period) {
    case 'daily':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      end = new Date(start);
      break;
    case 'weekly':
      start = new Date(now);
      start.setDate(now.getDate() - now.getDay());
      end = new Date(now);
      break;
    case 'monthly':
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      break;
    case 'custom':
      return { start: customStart ? new Date(customStart) : new Date(0), end: customEnd ? new Date(customEnd) : new Date() };
    default:
      start = new Date(0);
      end = new Date();
  }

  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function isInRange(dateStr, start, end) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  return d >= start && d <= end;
}

function inPeriod(itemDate, start, end) {
  return isInRange(itemDate, start, end);
}

function csvEscape(val) {
  const s = String(val ?? '');
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function downloadCSV(filename, headers, rows) {
  const csv = [headers.join(','), ...rows.map(r => r.map(csvEscape).join(','))].join('\n');
  const bom = '\uFEFF';
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Reports() {
  const { orders, products, inventory, payments, customers, technicians, services } = useApp();
  const [activeTab, setActiveTab] = useState('summary');
  const [period, setPeriod] = useState('monthly');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [detailModal, setDetailModal] = useState(null);
  const [orderDetail, setOrderDetail] = useState(null);

  const { start: periodStart, end: periodEnd } = getDateRange(period, customStart, customEnd);

  const filteredOrders = useMemo(() =>
    orders.filter(o => inPeriod(o.createdAt, periodStart, periodEnd)),
    [orders, periodStart, periodEnd]
  );

  const doneOrders = useMemo(() =>
    filteredOrders.filter(o => o.status === 'DONE'),
    [filteredOrders]
  );

  const serviceOrders = useMemo(() =>
    filteredOrders.filter(o => o.type === 'service'),
    [filteredOrders]
  );

  const salesOrders = useMemo(() =>
    filteredOrders.filter(o => o.type === 'sales'),
    [filteredOrders]
  );

  const filteredInventory = useMemo(() =>
    inventory.filter(e => inPeriod(e.date, periodStart, periodEnd)),
    [inventory, periodStart, periodEnd]
  );

  const handleExportCSV = (type) => {
    switch (type) {
      case 'summary': {
        const revenue = doneOrders.reduce((s, o) => s + o.totalCost, 0);
        const serviceRev = doneOrders.filter(o => o.type === 'service').reduce((s, o) => s + o.totalCost, 0);
        const salesRev = doneOrders.filter(o => o.type === 'sales').reduce((s, o) => s + o.totalCost, 0);
        const expenses = filteredInventory.filter(e => e.type === 'IN').reduce((s, e) => s + (e.product?.purchasePrice || 0) * e.quantity, 0);
        downloadCSV('ringkasan-keuangan.csv',
          ['Metrik', 'Nilai'],
          [
            ['Total Pendapatan', formatCurrency(revenue)],
            ['Pendapatan Service', formatCurrency(serviceRev)],
            ['Pendapatan Penjualan', formatCurrency(salesRev)],
            ['Total Pengeluaran', formatCurrency(expenses)],
            ['Laba Kotor', formatCurrency(revenue - expenses)],
            ['Jumlah Order Selesai', doneOrders.length],
          ]
        );
        break;
      }
      case 'done-orders':
        downloadCSV('order-selesai.csv',
          ['ID', 'Customer', 'Tipe', 'Tanggal', 'Total', 'Teknisi'],
          doneOrders.map(o => [
            `#${o.id}`,
            o.customerName,
            o.type === 'service' ? 'Service' : 'Penjualan',
            o.createdAt,
            formatCurrency(o.totalCost),
            o.technicianIds?.map(id => technicians.find(t => t.id === id)?.name || '').filter(Boolean).join('; ') || '-',
          ])
        );
        break;
      case 'technician': {
        const techData = technicians.map(tech => {
          const techOrders = doneOrders.filter(o => o.technicianIds?.includes(tech.id));
          return {
            name: tech.name,
            total: techOrders.length,
            revenue: techOrders.reduce((s, o) => s + o.totalCost, 0),
          };
        });
        downloadCSV('performa-teknisi.csv',
          ['Teknisi', 'Jumlah Order Selesai', 'Total Pendapatan'],
          techData.map(t => [t.name, t.total, formatCurrency(t.revenue)])
        );
        break;
      }
      case 'service-history':
        downloadCSV('history-service.csv',
          ['ID', 'Tanggal', 'Customer', 'Status', 'Total', 'Teknisi'],
          serviceOrders.map(o => [
            `#${o.id}`,
            o.createdAt,
            o.customerName,
            o.status,
            formatCurrency(o.totalCost),
            o.technicianIds?.map(id => technicians.find(t => t.id === id)?.name || '').filter(Boolean).join('; ') || '-',
          ])
        );
        break;
      case 'sales-history':
        downloadCSV('history-penjualan.csv',
          ['ID', 'Tanggal', 'Customer', 'Total', 'Pembayaran'],
          salesOrders.map(o => [
            `#${o.id}`,
            o.createdAt,
            o.customerName,
            formatCurrency(o.totalCost),
            o.paidAmount > 0 ? `Lunas (${o.paymentMethod})` : 'Belum',
          ])
        );
        break;
      case 'stock':
        downloadCSV('laporan-stok.csv',
          ['Tanggal', 'Tipe', 'Produk', 'Jumlah', 'Referensi'],
          filteredInventory.map(e => [
            e.date,
            e.type === 'IN' ? 'Masuk' : 'Keluar',
            e.product?.name || '-',
            e.quantity,
            e.reference || '-',
          ])
        );
        break;
    }
  };

  const periodFilter = (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
        {periods.map(p => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              period === p.value
                ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-300 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
      {period === 'custom' && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={customStart}
            onChange={e => setCustomStart(e.target.value)}
            className="px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
          <span className="text-xs text-gray-400">—</span>
          <input
            type="date"
            value={customEnd}
            onChange={e => setCustomEnd(e.target.value)}
            className="px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>
      )}
      <button
        onClick={() => handleExportCSV(activeTab)}
        className="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-all flex items-center gap-1"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Export CSV
      </button>
    </div>
  );

  const tabNav = (
    <div className="flex overflow-x-auto gap-1 bg-white dark:bg-gray-800 rounded-xl shadow-md p-1">
      {reportTabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg whitespace-nowrap transition-all ${
            activeTab === tab.id
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          <span>{tab.icon}</span>
          {tab.label}
        </button>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Laporan</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Laporan keuangan & operasional AirCool</p>
        </div>
        {periodFilter}
      </div>

      {tabNav}

      {/* Report Content */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        {/* LK-01: Ringkasan Keuangan */}
        {activeTab === 'summary' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Ringkasan Keuangan</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <SummaryCard label="Total Pendapatan" value={doneOrders.reduce((s, o) => s + o.totalCost, 0)} color="green" onClick={() => setDetailModal({ title: 'Total Pendapatan', rows: doneOrders.map(o => ({ desc: `#${o.id} - ${o.customerName} (${o.type === 'service' ? 'Service' : 'Penjualan'})`, value: o.totalCost })), total: doneOrders.reduce((s, o) => s + o.totalCost, 0) })} />
              <SummaryCard label="Pendapatan Service" value={doneOrders.filter(o => o.type === 'service').reduce((s, o) => s + o.totalCost, 0)} color="blue" onClick={() => setDetailModal({ title: 'Pendapatan Service', rows: doneOrders.filter(o => o.type === 'service').map(o => ({ desc: `#${o.id} - ${o.customerName}`, value: o.totalCost })), total: doneOrders.filter(o => o.type === 'service').reduce((s, o) => s + o.totalCost, 0) })} />
              <SummaryCard label="Pendapatan Penjualan" value={doneOrders.filter(o => o.type === 'sales').reduce((s, o) => s + o.totalCost, 0)} color="purple" onClick={() => setDetailModal({ title: 'Pendapatan Penjualan', rows: doneOrders.filter(o => o.type === 'sales').map(o => ({ desc: `#${o.id} - ${o.customerName}`, value: o.totalCost })), total: doneOrders.filter(o => o.type === 'sales').reduce((s, o) => s + o.totalCost, 0) })} />
              <SummaryCard label="Total Pengeluaran" value={filteredInventory.filter(e => e.type === 'IN').reduce((s, e) => s + (e.product?.purchasePrice || 0) * e.quantity, 0)} color="orange" onClick={() => setDetailModal({ title: 'Total Pengeluaran', rows: filteredInventory.filter(e => e.type === 'IN').map(e => ({ desc: `${e.product?.name || '-'} x${e.quantity}`, value: (e.product?.purchasePrice || 0) * e.quantity })), total: filteredInventory.filter(e => e.type === 'IN').reduce((s, e) => s + (e.product?.purchasePrice || 0) * e.quantity, 0) })} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <SummaryCard label="Laba Kotor" value={doneOrders.reduce((s, o) => s + o.totalCost, 0) - filteredInventory.filter(e => e.type === 'IN').reduce((s, e) => s + (e.product?.purchasePrice || 0) * e.quantity, 0)} color="emerald" onClick={() => {
                const totalIncome = doneOrders.reduce((s, o) => s + o.totalCost, 0);
                const totalExpense = filteredInventory.filter(e => e.type === 'IN').reduce((s, e) => s + (e.product?.purchasePrice || 0) * e.quantity, 0);
                setDetailModal({ title: 'Laba Kotor', rows: [
                  { desc: 'Total Pendapatan', value: totalIncome },
                  { desc: 'Total Pengeluaran', value: -totalExpense },
                ], total: totalIncome - totalExpense });
              }} />
              <SummaryCard label="Jumlah Order Selesai" value={doneOrders.length} color="indigo" onClick={() => setDetailModal({ title: 'Jumlah Order Selesai', rows: doneOrders.map(o => ({ desc: `#${o.id} - ${o.customerName} (${o.type === 'service' ? 'Service' : 'Penjualan'})`, value: o.totalCost })), total: doneOrders.length })} />
              <SummaryCard label="Order Aktif" value={orders.filter(o => !['DONE'].includes(o.status) && inPeriod(o.createdAt, periodStart, periodEnd)).length} color="rose" onClick={() => setDetailModal({ title: 'Order Aktif', rows: orders.filter(o => !['DONE'].includes(o.status) && inPeriod(o.createdAt, periodStart, periodEnd)).map(o => ({ desc: `#${o.id} - ${o.customerName} (${o.status})`, value: o.totalCost })), total: orders.filter(o => !['DONE'].includes(o.status) && inPeriod(o.createdAt, periodStart, periodEnd)).length })} />
            </div>
          </div>
        )}

        {/* LK-02: Laporan Order Selesai */}
        {activeTab === 'done-orders' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Laporan Order Selesai</h3>
            {doneOrders.length === 0 ? (
              <p className="text-gray-400 text-sm py-8 text-center">Belum ada order selesai periode ini</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipe</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teknisi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {doneOrders.map(o => (
                      <tr key={o.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-4 py-3 text-sm font-mono font-medium">#{o.id}</td>
                        <td className="px-4 py-3 text-sm">{o.customerName}</td>
                        <td className="px-4 py-3 text-sm capitalize">{o.type === 'service' ? 'Service' : 'Penjualan'}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{o.createdAt}</td>
                        <td className="px-4 py-3 text-sm text-right font-semibold">{formatCurrency(o.totalCost)}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {o.technicianIds?.map(id => technicians.find(t => t.id === id)?.name || '').filter(Boolean).join(', ') || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* LK-03: Performa Teknisi */}
        {activeTab === 'technician' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Performa Teknisi</h3>
            {technicians.length === 0 ? (
              <p className="text-gray-400 text-sm py-8 text-center">Belum ada data teknisi</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {technicians.map(tech => {
                  const techOrders = doneOrders.filter(o => o.technicianIds?.includes(tech.id));
                  const revenue = techOrders.reduce((s, o) => s + o.totalCost, 0);
                  return (
                    <div key={tech.id} className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {tech.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800 dark:text-gray-200">{tech.name}</p>
                          <p className="text-xs text-gray-500">{tech.phone}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-center">
                        <div className="p-2 bg-white dark:bg-gray-700 rounded-lg">
                          <p className="text-lg font-bold text-blue-600">{techOrders.length}</p>
                          <p className="text-xs text-gray-500">Order Selesai</p>
                        </div>
                        <div className="p-2 bg-white dark:bg-gray-700 rounded-lg">
                          <p className="text-lg font-bold text-green-600">{formatCurrency(revenue)}</p>
                          <p className="text-xs text-gray-500">Pendapatan</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* LK-04: History Transaksi Service */}
        {activeTab === 'service-history' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">History Transaksi Service</h3>
            {serviceOrders.length === 0 ? (
              <p className="text-gray-400 text-sm py-8 text-center">Belum ada transaksi service periode ini</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teknisi</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pembayaran</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {serviceOrders.map(o => (
                      <tr key={o.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-4 py-3 text-sm font-mono font-medium">#{o.id}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{o.createdAt}</td>
                        <td className="px-4 py-3 text-sm">{o.customerName}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                            o.status === 'DONE' ? 'bg-green-100 text-green-700' :
                            o.status === 'PROCESS' ? 'bg-yellow-100 text-yellow-700' :
                            o.status === 'ORDER' ? 'bg-blue-100 text-blue-700' :
                            o.status === 'OUTSTANDING' ? 'bg-orange-100 text-orange-700' :
                            o.status === 'PENDING' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>{o.status}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-semibold">{formatCurrency(o.totalCost)}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {o.technicianIds?.map(id => technicians.find(t => t.id === id)?.name || '').filter(Boolean).join(', ') || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {o.paidAmount > 0 ? (
                            <span className="text-green-600 font-medium">Lunas</span>
                          ) : (
                            <span className="text-red-500">Belum</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-center">
                          <button
                            onClick={() => setOrderDetail(o)}
                            className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-all"
                          >
                            Detail
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* LK-05: History Transaksi Penjualan */}
        {activeTab === 'sales-history' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">History Transaksi Penjualan</h3>
            {salesOrders.length === 0 ? (
              <p className="text-gray-400 text-sm py-8 text-center">Belum ada transaksi penjualan periode ini</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pembayaran</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {salesOrders.map(o => (
                      <tr key={o.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-4 py-3 text-sm font-mono font-medium">#{o.id}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{o.createdAt}</td>
                        <td className="px-4 py-3 text-sm">{o.customerName}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {o.items.map(i => i.name).join(', ')}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-semibold">{formatCurrency(o.totalCost)}</td>
                        <td className="px-4 py-3 text-sm">
                          {o.paidAmount > 0 ? (
                            <span className="text-green-600 font-medium">{o.paymentMethod || 'Lunas'}</span>
                          ) : (
                            <span className="text-red-500">Belum</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* LK-06: Laporan Stok */}
        {activeTab === 'stock' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Laporan Pergerakan Stok</h3>

            {/* Summary cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                <p className="text-xs text-green-600 dark:text-green-400 mb-1">Stok Masuk</p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                  {filteredInventory.filter(e => e.type === 'IN').reduce((s, e) => s + e.quantity, 0)}
                </p>
              </div>
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                <p className="text-xs text-red-600 dark:text-red-400 mb-1">Stok Keluar</p>
                <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                  {filteredInventory.filter(e => e.type === 'OUT').reduce((s, e) => s + e.quantity, 0)}
                </p>
              </div>
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">Total Produk</p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{products.length}</p>
              </div>
            </div>

            {filteredInventory.length === 0 ? (
              <p className="text-gray-400 text-sm py-8 text-center">Belum ada pergerakan stok periode ini</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipe</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produk</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Jumlah</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Referensi</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {filteredInventory.map(e => (
                      <tr key={e.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-4 py-3 text-sm text-gray-500">{e.date}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                            e.type === 'IN'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                          }`}>
                            {e.type === 'IN' ? 'MASUK' : 'KELUAR'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium">{e.product?.name || '-'}</td>
                        <td className="px-4 py-3 text-sm text-right font-semibold">{e.quantity}</td>
                        <td className="px-4 py-3 text-sm text-gray-500 font-mono">{e.reference || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{e.supplier || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Current stock table */}
            <div className="mt-6">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wider">Stok Saat Ini</h4>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kode</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produk</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kategori</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Stok</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Min Stok</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {products.map(p => (
                      <tr key={p.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 ${p.stock <= p.minStock ? 'bg-red-50 dark:bg-red-900/10' : ''}`}>
                        <td className="px-4 py-3 text-sm font-mono text-gray-500">{p.code}</td>
                        <td className="px-4 py-3 text-sm font-medium">{p.name}</td>
                        <td className="px-4 py-3 text-sm capitalize text-gray-500">{p.category}</td>
                        <td className={`px-4 py-3 text-sm text-right font-semibold ${p.stock <= p.minStock ? 'text-red-600' : ''}`}>{p.stock}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-500">{p.minStock}</td>
                        <td className="px-4 py-3 text-sm">
                          {p.stock <= p.minStock ? (
                            <span className="text-red-600 font-medium">Stok Menipis</span>
                          ) : (
                            <span className="text-green-600 font-medium">Aman</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {detailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setDetailModal(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{detailModal.title}</h3>
              <button onClick={() => setDetailModal(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="overflow-y-auto p-5 space-y-2 flex-1">
              {detailModal.rows.map((row, i) => (
                <div key={i} className="flex justify-between items-center py-2 px-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <span className="text-sm text-gray-700 dark:text-gray-300">{row.desc}</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{typeof row.value === 'number' ? formatCurrency(row.value) : row.value}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center p-5 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30 rounded-b-2xl">
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">Total {detailModal.title}</span>
              <span className="text-lg font-bold text-gray-900 dark:text-gray-100">{typeof detailModal.total === 'number' ? formatCurrency(detailModal.total) : detailModal.total}</span>
            </div>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {orderDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setOrderDetail(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Detail Transaksi Service #{orderDetail.id}</h3>
              <button onClick={() => setOrderDetail(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="overflow-y-auto p-5 space-y-4 flex-1">
              {/* Order Info */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                  <p className="text-gray-500 dark:text-gray-400 text-xs">Customer</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{orderDetail.customerName}</p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                  <p className="text-gray-500 dark:text-gray-400 text-xs">Tanggal</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{orderDetail.createdAt}</p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                  <p className="text-gray-500 dark:text-gray-400 text-xs">Alamat</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{orderDetail.address || '-'}</p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                  <p className="text-gray-500 dark:text-gray-400 text-xs">Telepon</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{orderDetail.phone || '-'}</p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                  <p className="text-gray-500 dark:text-gray-400 text-xs">Status</p>
                  <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full mt-1 ${
                    orderDetail.status === 'DONE' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                    orderDetail.status === 'PROCESS' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' :
                    orderDetail.status === 'ORDER' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                    orderDetail.status === 'OUTSTANDING' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' :
                    orderDetail.status === 'PENDING' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                    'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                  }`}>{orderDetail.status}</span>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                  <p className="text-gray-500 dark:text-gray-400 text-xs">Teknisi</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {orderDetail.technicianIds?.map(id => technicians.find(t => t.id === id)?.name || '').filter(Boolean).join(', ') || '-'}
                  </p>
                </div>
              </div>

              {/* Items */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Item / Jasa</h4>
                <div className="space-y-1">
                  {(orderDetail.items || []).length === 0 ? (
                    <p className="text-xs text-gray-400 italic">Tidak ada item</p>
                  ) : (
                    orderDetail.items.map((item, i) => (
                      <div key={i} className="flex justify-between items-center py-1.5 px-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg text-sm">
                        <span className="text-gray-700 dark:text-gray-300">{item.name} x{item.qty}</span>
                        <span className="font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(item.price * item.qty)}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Spareparts */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Sparepart Digunakan</h4>
                <div className="space-y-1">
                  {(!orderDetail.spareparts || orderDetail.spareparts.length === 0) ? (
                    <p className="text-xs text-gray-400 italic">Tidak ada sparepart</p>
                  ) : (
                    orderDetail.spareparts.map((sp, i) => (
                      <div key={i} className="flex justify-between items-center py-1.5 px-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-sm">
                        <span className="text-gray-700 dark:text-gray-300">{sp.name} x{sp.qty}</span>
                        <span className="font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(sp.price * sp.qty)}</span>
                      </div>
                    ))
                  )}
                  {/* Also check report.sparesUsed if spareparts is empty */}
                  {(!orderDetail.spareparts || orderDetail.spareparts.length === 0) && orderDetail.report?.sparesUsed?.length > 0 && (
                    orderDetail.report.sparesUsed.map((sp, i) => (
                      <div key={i} className="flex justify-between items-center py-1.5 px-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-sm">
                        <span className="text-gray-700 dark:text-gray-300">{sp.name} x{sp.qty}</span>
                        <span className="font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(sp.price * sp.qty)}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Service History */}
              {orderDetail.serviceHistory && orderDetail.serviceHistory.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Riwayat Progress</h4>
                  <div className="space-y-2">
                    {orderDetail.serviceHistory.map((h, i) => (
                      <div key={i} className="flex items-start gap-3 p-2.5 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5">{i + 1}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">{h.status}</span>
                            <span className="text-xs text-gray-400">{h.date}</span>
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{h.note}</p>
                          {h.technician && <p className="text-xs text-gray-400 mt-0.5">oleh: {h.technician}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Payment Info */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-800 dark:text-gray-200">Total Biaya</span>
                  <span className="text-xl font-bold text-blue-600 dark:text-blue-400">{formatCurrency(orderDetail.totalCost)}</span>
                </div>
                <div className="flex justify-between items-center mt-2 text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Pembayaran</span>
                  <span className={orderDetail.paidAmount > 0 ? 'text-green-600 font-medium' : 'text-red-500 font-medium'}>
                    {orderDetail.paidAmount > 0 ? `Lunas (${formatCurrency(orderDetail.paidAmount)})` : 'Belum Dibayar'}
                  </span>
                </div>
                {orderDetail.paidAmount > 0 && (
                  <div className="flex justify-between items-center mt-1 text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Metode</span>
                    <span className="capitalize text-gray-900 dark:text-gray-100">{orderDetail.paymentMethod || '-'}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, color, onClick }) {
  const colorMap = {
    green: 'from-green-500 to-green-600 text-green-100',
    blue: 'from-blue-500 to-blue-600 text-blue-100',
    purple: 'from-purple-500 to-purple-600 text-purple-100',
    orange: 'from-orange-500 to-orange-600 text-orange-100',
    emerald: 'from-emerald-500 to-emerald-600 text-emerald-100',
    indigo: 'from-indigo-500 to-indigo-600 text-indigo-100',
    rose: 'from-rose-500 to-rose-600 text-rose-100',
  };
  return (
    <div
      onClick={onClick}
      className={`bg-gradient-to-br ${colorMap[color] || colorMap.green} rounded-xl p-5 shadow-md ${onClick ? 'cursor-pointer hover:scale-[1.02] transition-transform' : ''}`}
    >
      <p className="text-xs font-medium opacity-80 mb-1">{label}</p>
      <p className="text-2xl font-bold">{typeof value === 'number' ? formatCurrency(value) : value}</p>
    </div>
  );
}
