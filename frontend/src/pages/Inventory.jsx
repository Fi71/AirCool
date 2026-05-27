import { useState } from 'react';
import { useApp } from '../contexts/AppContext';

export default function Inventory() {
  const { products, inventory, addProduct, updateProduct, addInventoryEntry, updateProductStock } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    code: '',
    name: '',
    category: 'unit',
    price: '',
    purchasePrice: '',
    stock: '0',
    minStock: '5',
    image: null
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editForm, setEditForm] = useState({
    code: '',
    name: '',
    category: 'unit',
    price: '',
    purchasePrice: '',
    stock: '0',
    minStock: '5',
    image: null
  });
  const [editImagePreview, setEditImagePreview] = useState(null);
  const [formData, setFormData] = useState({
    type: 'IN',
    productId: '',
    quantity: '',
    reference: '',
    date: '',
    supplier: ''
  });

  const categoryColors = {
    unit: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
    sparepart: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
    accessories: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
  };

  const handleShowTransactionForm = (product) => {
    setSelectedProduct(product);
    setFormData(prev => ({ ...prev, productId: product.id.toString() }));
    setShowTransactionForm(true);
  };

  const handleInventoryTransaction = async (e) => {
    e.preventDefault();
    const product = products.find(p => p.id === parseInt(formData.productId));
    if (product) {
      await addInventoryEntry({
        productId: product.id,
        product,
        type: formData.type,
        quantity: parseInt(formData.quantity),
        reference: formData.reference,
        date: formData.date,
        supplier: formData.supplier
      });
      setShowTransactionForm(false);
      setFormData({ type: 'IN', productId: '', quantity: '', reference: '', date: '', supplier: '' });
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    await addProduct({
      code: productForm.code,
      name: productForm.name,
      category: productForm.category,
      price: parseInt(productForm.price),
      purchasePrice: parseInt(productForm.purchasePrice),
      stock: parseInt(productForm.stock),
      minStock: parseInt(productForm.minStock),
      image: productForm.image
    });
    setShowForm(false);
    setProductForm({ code: '', name: '', category: 'unit', price: '', purchasePrice: '', stock: '0', minStock: '5', image: null });
    setImagePreview(null);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProductForm({ ...productForm, image: reader.result });
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleShowEditForm = (product) => {
    setEditingProduct(product);
    setEditForm({
      code: product.code,
      name: product.name,
      category: product.category,
      price: product.price.toString(),
      purchasePrice: product.purchasePrice.toString(),
      stock: product.stock.toString(),
      minStock: product.minStock.toString(),
      image: product.image
    });
    setEditImagePreview(product.image);
    setShowEditForm(true);
  };

  const handleEditProduct = async (e) => {
    e.preventDefault();
    await updateProduct(editingProduct.id, {
      name: editForm.name,
      category: editForm.category,
      price: parseInt(editForm.price),
      purchasePrice: parseInt(editForm.purchasePrice),
      minStock: parseInt(editForm.minStock),
      image: editForm.image
    });
    setShowEditForm(false);
    setEditingProduct(null);
    setEditImagePreview(null);
  };

  const handleEditImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditForm({ ...editForm, image: reader.result });
        setEditImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const lowStockProducts = products.filter(p => p.stock <= p.minStock);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Inventory Control</h2>
          <p className="text-gray-500 dark:text-gray-400">Kelola stok produk dan sparepart</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Tambah Produk</span>
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Total Produk</p>
          <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{products.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Total Stok</p>
          <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{products.reduce((sum, p) => sum + p.stock, 0)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
          <p className="text-sm text-red-600 mb-1">Stok Menipis</p>
          <p className="text-2xl font-bold text-red-600">{lowStockProducts.length}</p>
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <div className="text-3xl">⚠️</div>
            <div className="flex-1">
              <h3 className="font-semibold text-red-800">Stok Menipis</h3>
              <p className="text-sm text-red-600">{lowStockProducts.length} produk memiliki stok di bawah minimum</p>
            </div>
          </div>
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Daftar Produk</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Kode
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Gambar
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Nama
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Kategori
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Harga Jual
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Harga Beli
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Stok
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Min Stok
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {products.map(product => (
                <tr key={product.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 ${product.stock <= product.minStock ? 'bg-red-50 dark:bg-red-900/20' : ''}`}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900 dark:text-gray-100">
                    {product.code}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {product.image ? (
                      <img src={product.image} alt={product.name} className="w-12 h-12 object-cover rounded-lg border border-gray-200 dark:border-gray-600" />
                    ) : (
                      <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center text-gray-400">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 font-medium">
                    {product.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${categoryColors[product.category]}`}>
                      {product.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {product.price.toLocaleString('id-ID')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {product.purchasePrice.toLocaleString('id-ID')}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${product.stock <= product.minStock ? 'text-red-600' : 'text-gray-900 dark:text-gray-100'}`}>
                    {product.stock}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {product.minStock}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                    <button
                      onClick={() => handleShowEditForm(product)}
                      className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-all text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleShowTransactionForm(product)}
                      className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-all text-sm"
                    >
                      Transaksi
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction Form Modal */}
      {showTransactionForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                Transaksi Stok - {selectedProduct?.name}
              </h3>
              <button
                onClick={() => {
                  setShowTransactionForm(false);
                  setFormData({ type: 'IN', productId: '', quantity: '', reference: '', date: '', supplier: '' });
                }}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleInventoryTransaction} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tipe Transaksi
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="type"
                      value="IN"
                      checked={formData.type === 'IN'}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm">Stok Masuk (IN)</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="type"
                      value="OUT"
                      checked={formData.type === 'OUT'}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm">Stok Keluar (OUT)</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Jumlah
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nomor Referensi
                </label>
                <input
                  type="text"
                  value={formData.reference}
                  onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Contoh: PO-2026-001"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tanggal
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Supplier (untuk Stok Masuk)
                </label>
                <input
                  type="text"
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nama supplier"
                />
              </div>

              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
                >
                  Simpan Transaksi
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowTransactionForm(false);
                    setFormData({ type: 'IN', productId: '', quantity: '', reference: '', date: '', supplier: '' });
                  }}
                  className="flex-1 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Product Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Tambah Produk Baru</h3>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleAddProduct} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Kode Produk
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: UNIT-001"
                    value={productForm.code}
                    onChange={e => setProductForm({ ...productForm, code: e.target.value })}
                    className="w-full px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Kategori
                  </label>
                  <select
                    value={productForm.category}
                    onChange={e => setProductForm({ ...productForm, category: e.target.value })}
                    className="w-full px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="unit">Unit AC</option>
                    <option value="sparepart">Sparepart</option>
                    <option value="accessories">Aksesoris</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nama Produk
                </label>
                <input
                  type="text"
                  placeholder="Nama lengkap produk"
                  value={productForm.name}
                  onChange={e => setProductForm({ ...productForm, name: e.target.value })}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Harga Jual
                  </label>
                  <input
                    type="number"
                    placeholder="Rp"
                    value={productForm.price}
                    onChange={e => setProductForm({ ...productForm, price: e.target.value })}
                    className="w-full px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Harga Beli
                  </label>
                  <input
                    type="number"
                    placeholder="Rp"
                    value={productForm.purchasePrice}
                    onChange={e => setProductForm({ ...productForm, purchasePrice: e.target.value })}
                    className="w-full px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Stok Awal
                  </label>
                  <input
                    type="number"
                    value={productForm.stock}
                    onChange={e => setProductForm({ ...productForm, stock: e.target.value })}
                    className="w-full px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Min Stok
                  </label>
                  <input
                    type="number"
                    value={productForm.minStock}
                    onChange={e => setProductForm({ ...productForm, minStock: e.target.value })}
                    className="w-full px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Foto Produk
                </label>
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 dark:file:bg-blue-900/30 file:text-blue-700 dark:file:text-blue-300 hover:file:bg-blue-100 dark:hover:file:bg-blue-900/50"
                    />
                  </div>
                  {imagePreview && (
                    <div className="shrink-0">
                      <img src={imagePreview} alt="Preview" className="w-20 h-20 object-cover rounded-lg border border-gray-200 dark:border-gray-600" />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
                >
                  Simpan Produk
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Form Modal */}
      {showEditForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Edit Produk</h3>
              <button
                onClick={() => setShowEditForm(false)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleEditProduct} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Kode Produk
                  </label>
                  <input
                    type="text"
                    value={editForm.code}
                    disabled
                    className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Kategori
                  </label>
                  <select
                    value={editForm.category}
                    onChange={e => setEditForm({ ...editForm, category: e.target.value })}
                    className="w-full px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="unit">Unit AC</option>
                    <option value="sparepart">Sparepart</option>
                    <option value="accessories">Aksesoris</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nama Produk
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Harga Jual
                  </label>
                  <input
                    type="number"
                    value={editForm.price}
                    onChange={e => setEditForm({ ...editForm, price: e.target.value })}
                    className="w-full px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Harga Beli
                  </label>
                  <input
                    type="number"
                    value={editForm.purchasePrice}
                    onChange={e => setEditForm({ ...editForm, purchasePrice: e.target.value })}
                    className="w-full px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Stok
                  </label>
                  <input
                    type="number"
                    value={editForm.stock}
                    disabled
                    className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Min Stok
                  </label>
                  <input
                    type="number"
                    value={editForm.minStock}
                    onChange={e => setEditForm({ ...editForm, minStock: e.target.value })}
                    className="w-full px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Foto Produk
                </label>
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleEditImageChange}
                      className="w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 dark:file:bg-blue-900/30 file:text-blue-700 dark:file:text-blue-300 hover:file:bg-blue-100 dark:hover:file:bg-blue-900/50"
                    />
                  </div>
                  {editImagePreview && (
                    <div className="shrink-0">
                      <img src={editImagePreview} alt="Preview" className="w-20 h-20 object-cover rounded-lg border border-gray-200 dark:border-gray-600" />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-all"
                >
                  Simpan Perubahan
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditForm(false)}
                  className="flex-1 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transaction History */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Riwayat Transaksi Stok</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Tanggal
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Tipe
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Produk
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Jumlah
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Referensi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Supplier
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {inventory.slice(0, 10).map(entry => (
                <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {entry.date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      entry.type === 'IN' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                    }`}>
                      {entry.type === 'IN' ? 'MASUK' : 'KELUAR'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {entry.product.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {entry.quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600 dark:text-gray-300">
                    {entry.reference}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {entry.supplier}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
