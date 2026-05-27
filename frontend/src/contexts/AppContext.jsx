import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as api from '../api/api';
const BACKEND_ORIGIN = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace(/\/api$/, '');
const resolvePhotoUrl = (url) => {
  if (!url) return url;
  if (url.startsWith('http')) return url;
  if (url.startsWith('/uploads/')) return `${BACKEND_ORIGIN}${url}`;
  return url;
};

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};

export const AppProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('aircool-user');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [services, setServices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [users, setUsers] = useState([]);
  const [technicians, setTechnicians] = useState([]);

  const defaultSettings = {
    company: { name: 'AirCool Management', address: 'Jl. Contoh No. 123, Jakarta', phone: '021-12345678', email: 'info@aircool.com', website: 'www.aircool.com' },
    whatsapp: { enabled: false, apiUrl: '', apiKey: '', phoneNumber: '', sessionId: 'default', autoSend: true },
    telegram: { enabled: false, botToken: '', chatId: '', autoSend: true },
  };

  const [appSettings, setAppSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('aircool-settings');
      return saved ? JSON.parse(saved) : defaultSettings;
    } catch { return defaultSettings; }
  });

  const updateSettings = useCallback((section, data) => {
    setAppSettings(prev => {
      const updated = { ...prev, [section]: { ...prev[section], ...data } };
      localStorage.setItem('aircool-settings', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem('aircool-sidebar') === 'collapsed');
  const [theme, setTheme] = useState(() => localStorage.getItem('aircool-theme') || 'light');

  const toggleSidebar = () => setSidebarCollapsed(prev => {
    const next = !prev;
    localStorage.setItem('aircool-sidebar', next ? 'collapsed' : 'expanded');
    return next;
  });

  useEffect(() => { document.documentElement.classList.toggle('dark', theme === 'dark'); }, [theme]);

  const toggleTheme = () => setTheme(prev => {
    const next = prev === 'light' ? 'dark' : 'light';
    localStorage.setItem('aircool-theme', next);
    document.documentElement.classList.toggle('dark', next === 'dark');
    return next;
  });

  useEffect(() => { setTechnicians(users.filter(u => u.role === 'technician')); }, [users]);

  // Load all data from API when user is logged in
  const loadAllData = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const [usersData, customersData, productsData, servicesData, ordersData, paymentsData, inventoryData, maintenanceData, notificationsData] = await Promise.all([
        api.getUsers().catch(() => []),
        api.getCustomers().catch(() => []),
        api.getProducts().catch(() => []),
        api.getServices().catch(() => []),
        api.getOrders().catch(() => []),
        api.getPayments().catch(() => []),
        api.getInventory().catch(() => []),
        api.getMaintenance().catch(() => []),
        api.getNotifications().catch(() => []),
      ]);
      setUsers(usersData);
      setCustomers(customersData.map(c => ({ ...c, joinDate: toDateStr(c.joinDate || c.createdAt) })));
      setProducts(productsData.map(p => ({
        ...p,
        category: (typeof p.category === 'object' && p.category ? p.category.name : p.category || 'sparepart').toLowerCase().replace(/\s+/g, '')
      })));
      setServices(servicesData);
      setOrders(ordersData.map(o => ({
        ...o,
        items: [
          ...(o.items || []).map(i => ({ ...i, productId: i.productId || undefined })),
          ...(o.serviceItems || []).map(si => ({ ...si, serviceId: si.serviceId || undefined }))
        ],
        report: o.report ? {
          description: o.report.description || '',
          photos: (() => { try { return JSON.parse(o.report.photos || '[]').map(resolvePhotoUrl); } catch { return []; } })(),
          sparesUsed: (o.spareparts || []).map(sp => ({ productId: sp.productId, name: sp.name, qty: sp.qty, price: sp.price }))
        } : { description: '', sparesUsed: [] },
        technicianIds: (o.technicians || []).map(t => t.technicianId || t.technician?.id).filter(Boolean),
        serviceHistory: o.serviceHistory || []
      })));
      setPayments(paymentsData);
      setInventory(inventoryData);
      setMaintenance(maintenanceData);
      setNotifications(notificationsData);
    } catch (err) {
      console.warn('Failed to load data from API:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => { loadAllData(); }, [loadAllData]);

  // Auth
  const login = async (username, password) => {
    try {
      const result = await api.loginApi(username, password);
      localStorage.setItem('aircool-token', result.token);
      localStorage.setItem('aircool-user', JSON.stringify(result.user));
      setCurrentUser(result.user);
      return { success: true, user: result.user };
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  const logout = () => {
    localStorage.removeItem('aircool-token');
    localStorage.removeItem('aircool-user');
    setCurrentUser(null);
    setUsers([]);
    setCustomers([]);
    setProducts([]);
    setServices([]);
    setOrders([]);
    setPayments([]);
    setInventory([]);
    setMaintenance([]);
    setNotifications([]);
  };

  // Users
  const addUser = async (userData) => {
    const newUser = await api.createUser(userData);
    setUsers(prev => [newUser, ...prev]);
    return newUser;
  };

  const updateUser = async (userId, userData) => {
    const updated = await api.updateUser(userId, userData);
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updated } : u));
  };

  const resetPassword = async (userId, newPassword) => {
    await api.resetUserPassword(userId, newPassword);
  };

  const deleteUser = async (userId) => {
    await api.deleteUser(userId);
    setUsers(prev => prev.filter(u => u.id !== userId));
  };

  // Customers
  const addCustomer = async (customerData) => {
    const newCustomer = await api.createCustomer(customerData);
    setCustomers(prev => [newCustomer, ...prev]);
    return newCustomer;
  };

  const updateCustomer = async (customerId, customerData) => {
    const updated = await api.updateCustomer(customerId, customerData);
    setCustomers(prev => prev.map(c => c.id === customerId ? { ...c, ...updated } : c));
  };

  const deleteCustomer = async (customerId) => {
    await api.deleteCustomer(customerId);
    setCustomers(prev => prev.filter(c => c.id !== customerId));
  };

  // Products
  const addProduct = async (productData) => {
    const newProduct = await api.createProduct(productData);
    setProducts(prev => [newProduct, ...prev]);
    return newProduct;
  };

  const updateProduct = async (productId, productData) => {
    const updated = await api.updateProduct(productId, productData);
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, ...updated } : p));
  };

  const updateProductStock = (productId, quantity, type) => {
    setProducts(prev => prev.map(p => {
      if (p.id === productId) {
        const newStock = type === 'IN' ? p.stock + quantity : Math.max(0, p.stock - quantity);
        return { ...p, stock: newStock };
      }
      return p;
    }));
  };

  // Orders
  const toDateStr = (d) => d ? (typeof d === 'string' ? d.split('T')[0] : new Date(d).toISOString().split('T')[0]) : '';

  const transformOrder = (o) => ({
    ...o,
    createdAt: toDateStr(o.createdAt),
    updatedAt: toDateStr(o.updatedAt),
    scheduledDate: o.scheduledDate || '',
    paymentDate: o.paymentDate || '',
    items: [
      ...(o.items || []).map(i => ({ ...i, productId: i.productId || undefined })),
      ...(o.serviceItems || []).map(si => ({ ...si, serviceId: si.serviceId || undefined }))
    ],
    report: o.report ? {
      description: o.report.description || '',
      photos: (() => { try { return JSON.parse(o.report.photos || '[]').map(resolvePhotoUrl); } catch { return []; } })(),
      sparesUsed: (o.spareparts || []).map(sp => ({ productId: sp.productId, name: sp.name, qty: sp.qty, price: sp.price }))
    } : { description: '', sparesUsed: [] },
    technicianIds: (o.technicians || []).map(t => t.technicianId || t.technician?.id).filter(Boolean),
    serviceHistory: (o.serviceHistory || []).map(h => ({ ...h, date: toDateStr(h.date || h.createdAt) }))
  });

  const addOrder = async (orderData) => {
    const payload = { ...orderData };
    if (payload.items) {
      payload.items = payload.items.filter(i => i.productId);
      payload.serviceItems = orderData.items.filter(i => i.serviceId);
    }
    const newOrder = await api.createOrder(payload);
    setOrders(prev => [transformOrder(newOrder), ...prev]);
    return transformOrder(newOrder);
  };

  const updateOrderStatus = async (orderId, status, note = '') => {
    const updated = await api.updateOrderStatus(orderId, status, note);
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status, serviceHistory: updated.serviceHistory || o.serviceHistory } : o));
  };

  const updateOrder = async (orderId, orderData) => {
    const updated = await api.updateOrder(orderId, orderData);
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...transformOrder(updated) } : o));
    return transformOrder(updated);
  };

  // Payments
  const addPayment = async (paymentData) => {
    const newPayment = await api.createPayment(paymentData);
    setPayments(prev => [newPayment, ...prev]);
    return newPayment;
  };

  // Inventory
  const addInventoryEntry = async (entryData) => {
    const newEntry = await api.createInventoryEntry(entryData);
    setInventory(prev => [newEntry, ...prev]);
    if (entryData.productId) updateProductStock(entryData.productId, entryData.quantity, entryData.type);
  };

  // Maintenance
  const addMaintenance = async (maintenanceData) => {
    const newMaintenance = await api.createMaintenance(maintenanceData);
    setMaintenance(prev => [newMaintenance, ...prev]);
    return newMaintenance;
  };

  const updateMaintenance = async (maintenanceId, maintenanceData) => {
    const updated = await api.updateMaintenance(maintenanceId, maintenanceData);
    setMaintenance(prev => prev.map(m => m.id === maintenanceId ? { ...m, ...updated } : m));
  };

  const deleteMaintenance = async (maintenanceId) => {
    await api.deleteMaintenance(maintenanceId);
    setMaintenance(prev => prev.filter(m => m.id !== maintenanceId));
  };

  // Notifications
  const addNotification = async (notificationData) => {
    const newNotification = await api.createNotification(notificationData);
    setNotifications(prev => [newNotification, ...prev]);
  };

  const value = {
    currentUser, login, logout, loading,
    appSettings, updateSettings,
    users, products, services, customers, orders, payments, inventory, maintenance, notifications, technicians,
    sidebarCollapsed, theme, toggleSidebar, toggleTheme,
    addUser, updateUser, resetPassword, deleteUser,
    addCustomer, updateCustomer, deleteCustomer,
    addProduct, updateProduct, updateProductStock,
    addOrder, updateOrder, updateOrderStatus,
    addPayment, addInventoryEntry,
    addMaintenance, updateMaintenance, deleteMaintenance,
    addNotification
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
