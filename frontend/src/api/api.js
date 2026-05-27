const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const getToken = () => localStorage.getItem('aircool-token');

const request = async (path, options = {}) => {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json();

  if (!res.ok) {
    const err = new Error(data.error || 'Terjadi kesalahan');
    if (data.suggestion) err.suggestion = data.suggestion;
    if (data.version) err.version = data.version;
    throw err;
  }
  return data;
};

// Auth
export const loginApi = (username, password) =>
  request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) });

export const registerApi = (userData) =>
  request('/auth/register', { method: 'POST', body: JSON.stringify(userData) });

export const getMeApi = () => request('/auth/me');

// Users
export const getUsers = () => request('/users');
export const createUser = (data) => request('/users', { method: 'POST', body: JSON.stringify(data) });
export const updateUser = (id, data) => request(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const resetUserPassword = (id, password) => request(`/users/${id}/reset-password`, { method: 'PUT', body: JSON.stringify({ password }) });
export const deleteUser = (id) => request(`/users/${id}`, { method: 'DELETE' });

// Customers
export const getCustomers = () => request('/customers');
export const getCustomer = (id) => request(`/customers/${id}`);
export const createCustomer = (data) => request('/customers', { method: 'POST', body: JSON.stringify(data) });
export const updateCustomer = (id, data) => request(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteCustomer = (id) => request(`/customers/${id}`, { method: 'DELETE' });

// Products
export const getProducts = () => request('/products');
export const getCategories = () => request('/products/categories');
export const createProduct = (data) => request('/products', { method: 'POST', body: JSON.stringify(data) });
export const updateProduct = (id, data) => request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteProduct = (id) => request(`/products/${id}`, { method: 'DELETE' });

// Services
export const getServices = () => request('/services');
export const createService = (data) => request('/services', { method: 'POST', body: JSON.stringify(data) });
export const updateService = (id, data) => request(`/services/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteService = (id) => request(`/services/${id}`, { method: 'DELETE' });

// Orders
export const getOrders = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return request(`/orders${qs ? '?' + qs : ''}`);
};
export const getOrder = (id) => request(`/orders/${id}`);
export const createOrder = (data) => request('/orders', { method: 'POST', body: JSON.stringify(data) });
export const updateOrder = (id, data) => request(`/orders/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const updateOrderStatus = (id, status, note) => request(`/orders/${id}/status`, { method: 'PUT', body: JSON.stringify({ status, note }) });
export const deleteOrder = (id) => request(`/orders/${id}`, { method: 'DELETE' });

// Payments
export const getPayments = () => request('/payments');
export const createPayment = (data) => request('/payments', { method: 'POST', body: JSON.stringify(data) });

// Inventory
export const getInventory = () => request('/inventory');
export const createInventoryEntry = (data) => request('/inventory', { method: 'POST', body: JSON.stringify(data) });

// Maintenance
export const getMaintenance = () => request('/maintenance');
export const createMaintenance = (data) => request('/maintenance', { method: 'POST', body: JSON.stringify(data) });
export const updateMaintenance = (id, data) => request(`/maintenance/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const rescheduleMaintenance = (id, nextService) => request(`/maintenance/${id}/reschedule`, { method: 'PUT', body: JSON.stringify({ nextService }) });
export const deleteMaintenance = (id) => request(`/maintenance/${id}`, { method: 'DELETE' });

// Notifications
export const getNotifications = () => request('/notifications');
export const createNotification = (data) => request('/notifications', { method: 'POST', body: JSON.stringify(data) });

// Dashboard
export const getDashboard = () => request('/dashboard');

// Reports
export const getFinancialReport = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return request(`/reports/financial${qs ? '?' + qs : ''}`);
};
export const getCompletedOrders = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return request(`/reports/completed-orders${qs ? '?' + qs : ''}`);
};
export const getTechnicianPerformance = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return request(`/reports/technician-performance${qs ? '?' + qs : ''}`);
};
// Tools
export const clearTransactions = () => request('/tools/clear-transactions', { method: 'POST' });
export const clearMaster = () => request('/tools/clear-master', { method: 'POST' });

export const getStockMovement = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return request(`/reports/stock-movement${qs ? '?' + qs : ''}`);
};

// WhatsApp
export const sendWhatsAppTest = (data) => request('/whatsapp/test', { method: 'POST', body: JSON.stringify(data) });
export const sendWhatsAppNotification = (data) => request('/whatsapp/send-notification', { method: 'POST', body: JSON.stringify(data) });
export const testWhatsAppConnection = (data) => request('/whatsapp/test-connection', { method: 'POST', body: JSON.stringify(data) });

// Telegram
export const testTelegramConnection = (data) => request('/telegram/test-connection', { method: 'POST', body: JSON.stringify(data) });
export const sendTelegramTest = (data) => request('/telegram/test', { method: 'POST', body: JSON.stringify(data) });
export const sendTelegramNotification = (data) => request('/telegram/send-notification', { method: 'POST', body: JSON.stringify(data) });

// Maintenance notifications
export const checkMaintenanceDue = (data) => request('/maintenance/check-due', { method: 'POST', body: JSON.stringify(data) });
export const sendOverdueNotification = (body) => request('/maintenance/send-overdue', { method: 'POST', body: JSON.stringify(body) });
export const getNotificationConfig = () => request('/maintenance/notification-config');
export const saveNotificationConfig = (data) => request('/maintenance/notification-config', { method: 'PUT', body: JSON.stringify(data) });
export const getSchedulerStatus = () => request('/maintenance/scheduler-status');

// Upload
const API_BASE_URL = API_BASE.replace('/api', '');
export const uploadPhotos = async (files) => {
  const token = getToken();
  const formData = new FormData();
  files.forEach(f => formData.append('photos', f));
  const res = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Gagal upload foto');
  return data;
};
