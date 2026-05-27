import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './contexts/AppContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import Inventory from './pages/Inventory';
import POS from './pages/POS';
import Maintenance from './pages/Maintenance';
import Users from './pages/Users';
import Settings from './pages/Settings';
import Customers from './pages/Customers';
import Reports from './pages/Reports';
import Tools from './pages/Tools';
import Layout from './components/Layout';

function ProtectedRoute({ children }) {
  const { currentUser } = useApp();
  return currentUser ? children : <Navigate to="/login" replace />;
}

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="orders" element={<Orders />} />
            <Route path="orders/:id" element={<Orders />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="pos" element={<POS />} />
            <Route path="maintenance" element={<Maintenance />} />
            <Route path="users" element={<Users />} />
            <Route path="settings" element={<Settings />} />
            <Route path="customers" element={<Customers />} />
            <Route path="reports" element={<Reports />} />
            <Route path="tools" element={<Tools />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;