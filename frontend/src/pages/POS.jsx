import { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { sendWhatsAppNotification } from '../api/api';

export default function POS() {
  const { products, addOrder, customers, orders, appSettings, addInventoryEntry, updateProductStock } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('tunai');
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState(null);

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addToCart = (product, qty = 1) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.productId === product.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.productId === product.id
            ? { ...item, qty: item.qty + qty, totalPrice: (item.qty + qty) * item.price }
            : item
        );
      }
      return [...prevCart, {
        productId: product.id,
        name: product.name,
        code: product.code,
        price: product.price,
        qty: parseInt(qty),
        totalPrice: product.price * parseInt(qty)
      }];
    });
  };

  const removeFromCart = (productId) => {
    setCart(prevCart => prevCart.filter(item => item.productId !== productId));
  };

  const updateCartQty = (productId, delta) => {
    setCart(prevCart => prevCart.map(item => {
      if (item.productId === productId) {
        const newQty = Math.max(1, item.qty + delta);
        return {
          ...item,
          qty: newQty,
          totalPrice: newQty * item.price
        };
      }
      return item;
    }));
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + item.totalPrice, 0);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    const newOrder = {
      customerId: 1,
      customerName: customerName || 'Walk-in Customer',
      address: 'Walk-in',
      phone: customerPhone,
      type: 'sales',
      status: 'DONE',
      items: cart,
      totalCost: calculateTotal(),
      paidAmount: calculateTotal(),
      paymentMethod,
      paymentDate: new Date().toISOString().split('T')[0],
      report: { description: 'Penjualan langsung', sparesUsed: [] },
      serviceHistory: [
        { status: 'DONE', date: new Date().toISOString().split('T')[0], technician: 'Admin', note: 'Transaksi penjualan langsung' }
      ]
    };

    const createdOrder = await addOrder(newOrder);

    if (appSettings.whatsapp.enabled && appSettings.whatsapp.phoneNumber) {
      sendWhatsAppNotification({
        apiUrl: appSettings.whatsapp.apiUrl,
        apiKey: appSettings.whatsapp.apiKey,
        sessionId: appSettings.whatsapp.sessionId,
        phoneNumber: appSettings.whatsapp.phoneNumber,
        order: createdOrder
      }).catch(() => {});
    }

    cart.forEach(item => {
      updateProductStock(item.productId, item.qty, 'OUT');
      addInventoryEntry({
        productId: item.productId,
        type: 'OUT',
        quantity: item.qty,
        reference: `INV-${String(createdOrder.id).padStart(4, '0')}`,
        date: new Date().toISOString().split('T')[0],
        note: 'Penjualan langsung POS'
      });
    });

    setReceiptData({
      orderId: createdOrder.id,
      customerName: customerName || 'Walk-in Customer',
      items: cart,
      total: calculateTotal(),
      paymentMethod,
      date: new Date().toLocaleString('id-ID'),
      tech: 'Admin',
      company: appSettings?.company || { name: '', address: '', phone: '', email: '', website: '' }
    });

    setCart([]);
    setCustomerName('');
    setCustomerPhone('');
    setPaymentMethod('tunai');
    setShowReceipt(true);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value);
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  const handleNewTransaction = () => {
    setShowReceipt(false);
    setCart([]);
    setCustomerName('');
    setCustomerPhone('');
  };

  return (
    <>
    <div className="space-y-6 print:hidden">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Point of Sale</h2>
          <p className="text-gray-500 dark:text-gray-400">Penjualan langsung kepada customer</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Selection */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari produk berdasarkan nama atau kode..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>

          {/* Products Grid */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Daftar Produk</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredProducts.map(product => (
                <div
                  key={product.id}
                  className={`p-4 border-2 rounded-xl hover:border-blue-500 transition-all cursor-pointer ${
                    cart.some(item => item.productId === product.id) ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700'
                  }`}
                  onClick={() => addToCart(product, 1)}
                >
                  <div className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center mb-3 overflow-hidden">
                    {product.image ? (
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-4xl">❄️</span>
                    )}
                  </div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm mb-1 line-clamp-1">
                    {product.name}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{product.code}</p>
                  <p className="text-blue-600 dark:text-blue-400 font-semibold">
                    {formatCurrency(product.price)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Stok: {product.stock}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Cart & Checkout */}
        <div className="space-y-4">
          {/* Customer Info */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Informasi Customer</h3>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Nama customer (opsional)"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 mb-2"
            />
            <input
              type="tel"
              placeholder="Nomor HP"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>

          {/* Cart */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Keranjang Belanja</h3>
            {cart.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">Keranjang kosong</p>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {cart.map(item => (
                  <div key={item.productId} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate">{item.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{formatCurrency(item.price)} x {item.qty}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateCartQty(item.productId, -1)}
                        className="w-7 h-7 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-500"
                      >
                        <span className="text-sm text-gray-900 dark:text-gray-100">-</span>
                      </button>
                      <span className="w-8 text-center font-semibold text-gray-900 dark:text-gray-100">{item.qty}</span>
                      <button
                        onClick={() => updateCartQty(item.productId, 1)}
                        className="w-7 h-7 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-500"
                      >
                        <span className="text-sm text-gray-900 dark:text-gray-100">+</span>
                      </button>
                      <button
                        onClick={() => removeFromCart(item.productId)}
                        className="w-7 h-7 bg-red-100 rounded-full flex items-center justify-center hover:bg-red-200 text-red-600"
                      >
                        <span className="text-sm">×</span>
                      </button>
                    </div>
                    <p className="font-semibold text-gray-900 ml-2">
                      {formatCurrency(item.totalPrice)}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Total */}
            {cart.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-gray-600 dark:text-gray-400">Total</span>
                  <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {formatCurrency(calculateTotal())}
                  </span>
                </div>

                {/* Payment Method */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Metode Pembayaran
                  </label>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('tunai')}
                      className={`flex-1 py-2 px-4 rounded-lg border-2 transition-all ${
                        paymentMethod === 'tunai'
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300'
                          : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      💵 Tunai
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('transfer')}
                      className={`flex-1 py-2 px-4 rounded-lg border-2 transition-all ${
                        paymentMethod === 'transfer'
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300'
                          : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      💳 Transfer
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('qris')}
                      className={`flex-1 py-2 px-4 rounded-lg border-2 transition-all ${
                        paymentMethod === 'qris'
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300'
                          : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      📱 QRIS
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-semibold"
                >
                  Bayar Sekarang
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Receipt Modal */}
      {showReceipt && receiptData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 print:hidden">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 p-4 rounded-lg">
              <div className="text-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">AirCool</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Struk Transaksi</p>
              </div>

              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Order #</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">{receiptData.orderId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Customer</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{receiptData.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Tanggal</span>
                  <span className="text-gray-900 dark:text-gray-100">{receiptData.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Teknisi</span>
                  <span className="text-gray-900 dark:text-gray-100">{receiptData.tech}</span>
                </div>
              </div>

              <div className="border-t border-b border-gray-200 dark:border-gray-600 py-3 mb-4">
                {receiptData.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm mb-2">
                    <span className="text-gray-900 dark:text-gray-100">{item.name} ({item.qty})</span>
                    <span className="text-gray-900 dark:text-gray-100">{formatCurrency(item.totalPrice)}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between text-lg mb-4">
                <span className="font-bold text-gray-800 dark:text-gray-100">Total</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">{formatCurrency(receiptData.total)}</span>
              </div>

              <div className="flex justify-between text-sm mb-4">
                <span className="text-gray-500 dark:text-gray-400">Metode</span>
                <span className="capitalize text-gray-900 dark:text-gray-100">{receiptData.paymentMethod}</span>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={handlePrintReceipt}
                  className="flex-1 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-all"
                >
                  Cetak
                </button>
                <button
                  onClick={handleNewTransaction}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
                >
                  Transaksi Baru
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>

      {/* Today's Sales List */}
      <div className="print:hidden bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Daftar Penjualan Hari Ini</h3>
        </div>
        {(() => {
          const today = new Date().toISOString().split('T')[0];
          const todaySales = orders.filter(o => o.type === 'sales' && o.createdAt === today);
          return todaySales.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8 text-sm">Belum ada penjualan hari ini</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nota</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Waktu</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Item</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Pembayaran</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {todaySales.map(o => (
                    <tr key={o.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-medium text-gray-900 dark:text-gray-100">INV-{String(o.id).padStart(4, '0')}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{o.createdAt}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{o.customerName}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                        {o.items?.map(i => i.name).join(', ') || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-gray-900 dark:text-gray-100">
                        {(o.totalCost || 0).toLocaleString('id-ID')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className="text-green-600 dark:text-green-400 font-medium capitalize">{o.paymentMethod || 'Lunas'}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })()}
      </div>

      {receiptData && (
        <div className="print-area hidden print:block bg-white p-8">
          <div className="max-w-md mx-auto">
            <div className="text-center border-b-2 border-gray-800 pb-4 mb-4">
              <h1 className="text-2xl font-bold text-gray-900">{receiptData.company.name}</h1>
              <p className="text-sm text-gray-600">{receiptData.company.address}</p>
              <p className="text-sm text-gray-600">Telp: {receiptData.company.phone} | Email: {receiptData.company.email}</p>
              <p className="text-xs text-gray-500 mt-1">{receiptData.company.website}</p>
            </div>

            <div className="text-center mb-4">
              <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wide">Nota Penjualan</h2>
            </div>

            <div className="text-sm mb-4 space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-600">No. Nota</span>
                <span className="font-semibold text-gray-900">INV-{String(receiptData.orderId).padStart(4, '0')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tanggal</span>
                <span className="text-gray-900">{receiptData.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Customer</span>
                <span className="text-gray-900">{receiptData.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Pembayaran</span>
                <span className="capitalize text-gray-900">{receiptData.paymentMethod}</span>
              </div>
            </div>

            <table className="w-full text-sm mb-4">
              <thead>
                <tr className="border-t-2 border-b border-gray-800">
                  <th className="text-left py-2 text-gray-700">Item</th>
                  <th className="text-center py-2 text-gray-700">Qty</th>
                  <th className="text-right py-2 text-gray-700">Harga</th>
                  <th className="text-right py-2 text-gray-700">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {receiptData.items.map((item, idx) => (
                  <tr key={idx} className="border-b border-gray-200">
                    <td className="py-2 text-gray-900">{item.name}</td>
                    <td className="py-2 text-center text-gray-900">{item.qty}</td>
                    <td className="py-2 text-right text-gray-900">{formatCurrency(item.price)}</td>
                    <td className="py-2 text-right text-gray-900">{formatCurrency(item.totalPrice)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-800">
                  <td colSpan="3" className="py-2 text-right font-bold text-gray-900">Total</td>
                  <td className="py-2 text-right font-bold text-lg text-gray-900">{formatCurrency(receiptData.total)}</td>
                </tr>
              </tfoot>
            </table>

            <div className="text-center text-xs text-gray-500 mt-8 pt-4 border-t border-gray-300">
              <p>Terima kasih telah berbelanja di {receiptData.company.name}</p>
              <p className="mt-1">Struk ini adalah bukti pembayaran yang sah</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}