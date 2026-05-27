import { useApp } from '../contexts/AppContext';

export default function Dashboard() {
  const { currentUser, orders, products, inventory, maintenance, users } = useApp();
  const d = new Date();
  const todayLocal = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const tom = new Date(d);
  tom.setDate(tom.getDate() + 1);
  const tomorrowLocal = `${tom.getFullYear()}-${String(tom.getMonth() + 1).padStart(2, '0')}-${String(tom.getDate()).padStart(2, '0')}`;
  const currentMonth = d.toISOString().slice(0, 7);

  const monthlyOrders = orders.filter(order => order.createdAt.startsWith(currentMonth));
  const completedOrders = monthlyOrders.filter(order => order.status === 'DONE');
  const revenue = completedOrders.reduce((sum, order) => sum + order.totalCost, 0);
  const pendingOrders = monthlyOrders.filter(order =>
    ['ORDER', 'PROCESS', 'PENDING', 'OUTSTANDING'].includes(order.status)
  );
  const lowStockProducts = products.filter(product => product.stock <= product.minStock);

  const monthlyExpenses = inventory
    .filter(e => e.type === 'IN' && e.date?.startsWith(currentMonth))
    .reduce((sum, e) => sum + (e.quantity * (e.product?.purchasePrice || 0)), 0);

  const statCards = [
    { label: 'Total Order Bulan Ini', value: monthlyOrders.length, sub: `${completedOrders.length} selesai`, icon: '📋', gradient: 'from-blue-600 to-blue-700', textColor: 'text-blue-100', subColor: 'text-blue-200' },
    { label: 'Pendapatan Bulan Ini', value: revenue.toLocaleString('id-ID'), sub: 'Dari service & penjualan', icon: '💰', gradient: 'from-green-500 to-green-600', textColor: 'text-green-100', subColor: 'text-green-200' },
    { label: 'Pengeluaran Bulan Ini', value: monthlyExpenses.toLocaleString('id-ID'), sub: 'Biaya pembelian stok', icon: '💸', gradient: 'from-orange-500 to-orange-600', textColor: 'text-orange-100', subColor: 'text-orange-200' },
    { label: 'Order Aktif', value: pendingOrders.length, sub: 'Dalam proses / menunggu', icon: '⚡', gradient: 'from-purple-600 to-purple-700', textColor: 'text-purple-100', subColor: 'text-purple-200' },
  ];

  const getStatusBadge = (status) => {
    const map = {
      ORDER: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
      PROCESS: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
      PENDING: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
      OUTSTANDING: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300',
      DONE: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
      RESCHEDULE: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    };
    return map[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Dashboard</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Ringkasan operasional AirCool</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {statCards.map((card, i) => (
          <div
            key={i}
            className={`bg-gradient-to-br ${card.gradient} rounded-xl p-5 lg:p-6 text-white shadow-lg hover:shadow-xl transition-all duration-200`}
          >
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className={`${card.textColor} text-xs lg:text-sm font-medium mb-1`}>{card.label}</p>
                <p className="text-2xl lg:text-3xl font-bold truncate">{card.value}</p>
                <p className={`${card.subColor} text-xs mt-1`}>{card.sub}</p>
              </div>
              <div className="w-12 h-12 lg:w-14 lg:h-14 bg-white/20 rounded-full flex items-center justify-center shrink-0 ml-3">
                <span className="text-2xl lg:text-3xl">{card.icon}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Secondary Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
        {/* Low Stock */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md dark:shadow-gray-900 p-5 lg:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base lg:text-lg font-semibold text-gray-800 dark:text-gray-100">Stok Hampir Habis</h3>
            {lowStockProducts.length > 0 && (
              <span className="px-2 py-1 bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300 rounded-full text-xs font-medium">
                {lowStockProducts.length} item
              </span>
            )}
          </div>
          {lowStockProducts.length > 0 ? (
            <div className="space-y-2">
              {lowStockProducts.map(product => (
                <div key={product.id} className="flex items-center justify-between p-2.5 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{product.name}</p>
                    <p className="text-xs text-red-600 dark:text-red-400">Stok: {product.stock} / min: {product.minStock}</p>
                  </div>
                  <span className="text-red-500 text-lg ml-2 shrink-0">⚠️</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-green-600 dark:text-green-400 flex items-center gap-2 text-sm">
              <span className="text-lg">✓</span> Semua stok aman
            </p>
          )}
        </div>

        {/* Today Schedule */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md dark:shadow-gray-900 p-5 lg:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base lg:text-lg font-semibold text-gray-800 dark:text-gray-100">Jadwal Hari Ini</h3>
          </div>
          {orders.filter(o => o.scheduledDate === new Date().toISOString().slice(0, 10)).length > 0 ? (
            <div className="space-y-2">
              {orders.filter(o => o.scheduledDate === new Date().toISOString().slice(0, 10)).slice(0, 5).map(order => (
                <div key={order.id} className="flex items-center justify-between p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{order.customerName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{order.type === 'service' ? 'Service' : 'Penjualan'}</p>
                  </div>
                  <span className="text-blue-500 text-lg ml-2 shrink-0">📅</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 flex items-center gap-2 text-sm">
              <span className="text-lg">✓</span> Tidak ada jadwal hari ini
            </p>
          )}
        </div>

        {/* Maintenance */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md dark:shadow-gray-900 p-5 lg:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base lg:text-lg font-semibold text-gray-800 dark:text-gray-100">Maintenance Jatuh Tempo</h3>
          </div>
          {maintenance.filter(m => m.isActive && m.nextService <= tomorrowLocal).length > 0 ? (
            <div className="space-y-2">
              {maintenance.filter(m => m.isActive && m.nextService <= tomorrowLocal).slice(0, 5).map(m => (
                <div key={m.id} className="flex items-center justify-between p-2.5 bg-orange-50 dark:bg-orange-900/20 rounded-lg border-l-4 border-orange-500">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{m.customerName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{m.unit}</p>
                  </div>
                  <span className="text-orange-500 text-lg ml-2 shrink-0">🔄</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-green-600 dark:text-green-400 flex items-center gap-2 text-sm">
              <span className="text-lg">✓</span> Tidak ada maintenance jatuh tempo
            </p>
          )}
        </div>
      </div>

      {/* Active Orders Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md dark:shadow-gray-900 overflow-hidden">
        <div className="px-5 lg:px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-base lg:text-lg font-semibold text-gray-800 dark:text-gray-100">Order Aktif</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                {['ID', 'Customer', 'Tanggal', 'Total', 'Status', 'Teknisi'].map(h => (
                  <th key={h} className="px-5 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {pendingOrders.slice(0, 5).map(order => (
                <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-5 lg:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">#{order.id}</td>
                  <td className="px-5 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">{order.customerName}</td>
                  <td className="px-5 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{order.scheduledDate}</td>
                  <td className="px-5 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">{order.totalCost.toLocaleString('id-ID')}</td>
                  <td className="px-5 lg:px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(order.status)}`}>{order.status}</span>
                  </td>
                  <td className="px-5 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {order.technicianIds?.map(id => {
                      const u = users.find(u => u.id === id);
                      return <span key={id} className="block">{u?.name || `Teknisi #${id}`}</span>;
                    })}
                  </td>
                </tr>
              ))}
              {pendingOrders.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-5 lg:px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">Tidak ada order aktif</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}