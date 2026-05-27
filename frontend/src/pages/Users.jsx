import { useState } from 'react';
import { useApp } from '../contexts/AppContext';

const defaultForm = {
  name: '',
  username: '',
  password: '',
  role: 'technician',
  phone: '',
  telegramId: '',
};

export default function Users() {
  const { users, currentUser, addUser, updateUser, resetPassword, deleteUser } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [showResetPw, setShowResetPw] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [resettingUser, setResettingUser] = useState(null);
  const [formData, setFormData] = useState(defaultForm);
  const [newPassword, setNewPassword] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  const openAddForm = () => {
    setEditingUser(null);
    setFormData(defaultForm);
    setShowForm(true);
  };

  const openEditForm = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      username: user.username,
      password: '',
      role: user.role,
      phone: user.phone || '',
      telegramId: user.telegramId || '',
    });
    setShowForm(true);
  };

  const openResetPw = (user) => {
    setResettingUser(user);
    setNewPassword('');
    setShowResetPw(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingUser) {
      const payload = {
        role: formData.role,
        phone: formData.phone,
        telegramId: formData.telegramId,
      };
      await updateUser(editingUser.id, payload);
    } else {
      await addUser(formData);
    }
    setShowForm(false);
    setEditingUser(null);
    setFormData(defaultForm);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (resettingUser && newPassword) {
      await resetPassword(resettingUser.id, newPassword);
      setShowResetPw(false);
      setResettingUser(null);
      setNewPassword('');
    }
  };

  const handleDelete = async (userId) => {
    if (userId === currentUser?.id) return;
    await deleteUser(userId);
    setShowDeleteConfirm(null);
  };

  const roleColors = {
    admin: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
    technician: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
    management: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Manajemen User</h2>
          <p className="text-gray-500 dark:text-gray-400">Kelola pengguna dan akses sistem</p>
        </div>
        <button
          onClick={openAddForm}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>Tambah User</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Total User</p>
          <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{users.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Admin</p>
          <p className="text-2xl font-bold text-purple-600">{users.filter(u => u.role === 'admin').length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Teknisi</p>
          <p className="text-2xl font-bold text-blue-600">{users.filter(u => u.role === 'technician').length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Manajemen</p>
          <p className="text-2xl font-bold text-green-600">{users.filter(u => u.role === 'management').length}</p>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Daftar User</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nama</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Username</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Telepon</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Telegram</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                        user.role === 'admin' ? 'bg-purple-500' : 'bg-blue-500'
                      }`}>
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.name}</p>
                        {user.id === currentUser?.id && (
                          <span className="text-xs text-blue-500">(Anda)</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900 dark:text-gray-100">
                    {user.username}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${roleColors[user.role]}`}>
                      {user.role === 'admin' ? 'Admin' : user.role === 'management' ? 'Manajemen' : 'Teknisi'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {user.phone || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {user.telegramId || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => openEditForm(user)}
                        className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-all text-xs"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => openResetPw(user)}
                        className="px-3 py-1 bg-amber-600 text-white rounded hover:bg-amber-700 transition-all text-xs"
                      >
                        Reset Password
                      </button>
                      {user.id !== currentUser?.id && (
                        <button
                          onClick={() => setShowDeleteConfirm(user)}
                          className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-all text-xs"
                        >
                          Hapus
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit User Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                {editingUser ? 'Edit User' : 'Tambah User Baru'}
              </h3>
              <button
                onClick={() => { setShowForm(false); setEditingUser(null); }}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!editingUser && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nama Lengkap</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      placeholder="Nama pengguna"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Username</label>
                      <input
                        type="text"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        className="w-full px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                        placeholder="username"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Password</label>
                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                        placeholder="******"
                      />
                    </div>
                  </div>
                </>
              )}
              {editingUser && (
                <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg space-y-3 text-sm">
                  <p><span className="text-gray-500">Nama:</span> <span className="font-medium text-gray-900 dark:text-gray-100">{editingUser.name}</span></p>
                  <p><span className="text-gray-500">Username:</span> <span className="font-mono text-gray-900 dark:text-gray-100">{editingUser.username}</span></p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="technician">Teknisi</option>
                  <option value="admin">Admin</option>
                  <option value="management">Manajemen</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Telepon</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="08123456789"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Telegram ID</label>
                  <input
                    type="text"
                    value={formData.telegramId}
                    onChange={(e) => setFormData({ ...formData, telegramId: e.target.value })}
                    className="w-full px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="@username"
                  />
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
                >
                  {editingUser ? 'Simpan Perubahan' : 'Tambah User'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setEditingUser(null); }}
                  className="flex-1 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetPw && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                Reset Password
              </h3>
              <button
                onClick={() => { setShowResetPw(false); setResettingUser(null); }}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Reset password untuk <strong className="text-gray-800 dark:text-gray-200">{resettingUser?.name}</strong> (username: {resettingUser?.username})
            </p>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Password Baru
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  placeholder="Masukkan password baru"
                  minLength={4}
                />
              </div>

              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-all"
                >
                  Reset Password
                </button>
                <button
                  type="button"
                  onClick={() => { setShowResetPw(false); setResettingUser(null); }}
                  className="flex-1 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-sm w-full p-6">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Hapus User</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Apakah Anda yakin ingin menghapus <strong>{showDeleteConfirm.name}</strong>?
                Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => handleDelete(showDeleteConfirm.id)}
                className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all"
              >
                Hapus
              </button>
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
