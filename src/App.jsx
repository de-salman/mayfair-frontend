import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import HRMS from './pages/HRMS';
import Operations from './pages/Operations';
import FlightManagement from './pages/FlightManagement';
import Marketing from './pages/Marketing';
import CRM from './pages/CRM';
import Tasks from './pages/Tasks';
import Announcements from './pages/Announcements';
import AdminUsers from './pages/AdminUsers';
import Accounting from './modules/accounting';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />

      {/* Protected Routes with Layout */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Layout sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

// Layout component for protected routes
const Layout = ({ sidebarOpen, setSidebarOpen }) => {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Navbar */}
        <Navbar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/hrms" element={<ProtectedRoute requiredModule="hrms"><HRMS /></ProtectedRoute>} />
            <Route path="/operations" element={<ProtectedRoute requiredModule="flightManagement"><Operations /></ProtectedRoute>} />
            <Route path="/flights" element={<ProtectedRoute requiredModule="flightManagement"><FlightManagement /></ProtectedRoute>} />
            <Route path="/marketing" element={<ProtectedRoute requiredModule="campaigns"><Marketing /></ProtectedRoute>} />
            <Route path="/crm" element={<ProtectedRoute requiredModule="clients"><CRM /></ProtectedRoute>} />
            <Route path="/accounting" element={<ProtectedRoute requiredModule="accounting"><Accounting /></ProtectedRoute>} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/announcements" element={<Announcements />} />
            <Route path="/admin/users" element={<ProtectedRoute requiredRole="superadmin"><AdminUsers /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default App;
