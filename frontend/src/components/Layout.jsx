import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';

const menuItems = [
  { path: '/dashboard', icon: '📊', label: 'Dashboard', roles: ['admin', 'technician', 'management'] },
  { path: '/orders', icon: '📋', label: 'Order Service', roles: ['admin', 'technician'] },
  { path: '/inventory', icon: '📦', label: 'Inventory', roles: ['admin'] },
  { path: '/customers', icon: '👤', label: 'Pelanggan', roles: ['admin', 'technician'] },
  { path: '/pos', icon: '🛒', label: 'Penjualan', roles: ['admin'] },
  { path: '/maintenance', icon: '🔧', label: 'Maintenance', roles: ['admin'] },
  { path: '/users', icon: '👥', label: 'User Management', roles: ['admin'] },
  { path: '/settings', icon: '⚙️', label: 'Pengaturan', roles: ['admin'] },
  { path: '/reports', icon: '📈', label: 'Laporan', roles: ['admin', 'management'] },
  { path: '/tools', icon: '🔧', label: 'Tools', roles: ['admin'] },
];

export default function Layout() {
  const { currentUser, logout, sidebarCollapsed, toggleSidebar, theme, toggleTheme } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userMenuItems = menuItems.filter(
    item => item.roles.includes(currentUser?.role || '')
  );

  const sidebarWidth = sidebarCollapsed ? 'w-16' : 'w-64';
  const marginClass = sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 ${sidebarWidth}
        transform transition-all duration-300 ease-in-out
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        <div className="h-full bg-gradient-to-b from-blue-900 to-blue-950 text-white shadow-2xl flex flex-col">
          {/* Logo */}
          <div className="flex items-center h-16 border-b border-blue-800 px-3">
            {sidebarCollapsed ? (
              <div className="w-full flex justify-center">
                <span className="text-2xl">❄️</span>
              </div>
            ) : (
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">❄️</span>
                  <span className="text-lg font-bold tracking-wide">AirCool</span>
                </div>
                <span className="px-2 py-0.5 bg-blue-700 rounded text-xs font-medium">v1.0</span>
              </div>
            )}
          </div>

          {/* User Info */}
          {!sidebarCollapsed && (
            <div className="px-4 py-4 border-b border-blue-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center shrink-0 ring-2 ring-blue-400">
                  <span className="text-base font-bold">
                    {currentUser?.name?.charAt(0)?.toUpperCase() || 'A'}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate">{currentUser?.name || 'User'}</p>
                  <p className="text-xs text-blue-300 capitalize">{currentUser?.role || 'User'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
            {!sidebarCollapsed && (
              <p className="px-3 text-xs font-semibold text-blue-300 uppercase tracking-wider mb-2">
                Menu Utama
              </p>
            )}
            {userMenuItems.map((item) => {
              const isActive = location.pathname.startsWith(item.path);
              return sidebarCollapsed ? (
                <Link
                  key={item.path}
                  to={item.path}
                  title={item.label}
                  className={`
                    flex items-center justify-center w-full py-3 rounded-lg transition-all duration-200
                    ${isActive ? 'bg-blue-600 text-white shadow-lg' : 'text-blue-200 hover:bg-blue-800 hover:text-white'}
                  `}
                >
                  <span className="text-xl">{item.icon}</span>
                </Link>
              ) : (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200
                    ${isActive ? 'bg-blue-600 text-white shadow-lg' : 'text-blue-200 hover:bg-blue-800 hover:text-white'}
                  `}
                >
                  <span className="text-lg w-6 text-center">{item.icon}</span>
                  <span className="font-medium text-sm">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="p-2 border-t border-blue-800 space-y-1">
            {sidebarCollapsed ? (
              <button
                onClick={handleLogout}
                title="Keluar"
                className="flex items-center justify-center w-full py-3 rounded-lg text-red-300 hover:bg-red-600 hover:text-white transition-all duration-200"
              >
                <span className="text-xl">🚪</span>
              </button>
            ) : (
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-red-300 hover:bg-red-600 hover:text-white transition-all duration-200"
              >
                <span className="text-lg w-6 text-center">🚪</span>
                <span className="font-medium text-sm">Keluar</span>
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Sidebar collapse toggle (desktop only) */}
      <button
        onClick={toggleSidebar}
        className="hidden lg:flex fixed top-20 z-40 items-center justify-center w-6 h-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-r-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300"
        style={{ left: sidebarCollapsed ? '4rem' : '16rem' }}
      >
        <svg
          className={`w-3.5 h-3.5 text-gray-500 dark:text-gray-400 transition-transform duration-300 ${sidebarCollapsed ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Main Content */}
      <div className={`${marginClass} flex flex-col min-h-screen transition-all duration-300`}>
        {/* Header */}
        <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30 shadow-sm dark:shadow-gray-900">
          <div className="flex items-center gap-3">
            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <svg className="w-6 h-6 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                AirCool Management System
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Date */}
            <div className="hidden md:flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <span className="text-base">📅</span>
              <span>
                {new Date().toLocaleDateString('id-ID', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>

            {/* Dark mode toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title={theme === 'light' ? 'Mode Gelap' : 'Mode Terang'}
            >
              {theme === 'light' ? (
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              )}
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6">
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="border-t border-gray-200 dark:border-gray-800 py-3 px-6 text-center text-xs text-gray-400 dark:text-gray-600">
          AirCool Management System v1.0 &copy; {new Date().getFullYear()}
        </footer>
      </div>
    </div>
  );
}