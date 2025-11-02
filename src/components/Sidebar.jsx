import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import { motion } from 'framer-motion';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, isAllowed } = useAuth();
  const location = useLocation();

  // Navigation items based on user role and modules
  const navItems = [
    { path: '/', label: 'Dashboard', icon: '📊', requiresModule: null },
    { path: '/hrms', label: 'HRMS', icon: '👥', requiresModule: 'hrms' },
    { path: '/operations', label: 'Operations', icon: '⚙️', requiresModule: 'flightManagement' },
    { path: '/flights', label: 'Flight Management', icon: '✈️', requiresModule: 'flightManagement' },
    { path: '/marketing', label: 'Marketing', icon: '📢', requiresModule: 'campaigns' },
    { path: '/crm', label: 'CRM', icon: '💼', requiresModule: 'clients' },
    { path: '/tasks', label: 'Tasks', icon: '✅', requiresModule: null },
    { path: '/announcements', label: 'Announcements', icon: '📣', requiresModule: null },
  ];

  // Add admin users link for admin/superadmin
  if (user && (user.role === 'admin' || user.role === 'superadmin')) {
    navItems.push({
      path: '/admin/users',
      label: 'User Management',
      icon: '👤',
      requiresModule: null,
    });
  }

  // Filter nav items based on user's allowed modules
  // Superadmin sees all items, others only see items they have access to
  const filteredNavItems = navItems.filter((item) => {
    // Items without module requirement are always visible if user is authenticated
    if (!item.requiresModule) return true;
    // Use isAllowed from context to check module access
    return isAllowed(item.requiresModule);
  });

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-primary text-white transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className="p-4 border-b border-primary-light/20">
            <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-3">
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center justify-center w-18 h-18 bg-primary rounded-lg p-2"
              >
                <motion.img
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  src="/logo.webp"
                  alt="Mayfair Jets Logo"
                  className="w-full h-full object-contain"
                />
              </motion.div>
              
            </Link>
              {/* Close button for mobile */}
              <button
                onClick={onClose}
                className="lg:hidden text-white hover:text-primary-light transition-colors"
                aria-label="Close menu"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-1">
              {filteredNavItems.map((item, index) => (
                <motion.div
                  key={item.path}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Link
                    to={item.path}
                    onClick={onClose}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                      isActive(item.path)
                        ? 'bg-primary-light text-white font-semibold shadow-md'
                        : 'text-white hover:bg-primary-light/20 hover:text-white'
                    }`}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span className="text-sm">{item.label}</span>
                  </Link>
                </motion.div>
              ))}
            </div>
          </nav>

          {/* User Info Footer */}
          {user && (
            <div className="p-4 border-t border-primary-light/20">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {user.name}
                  </p>
                  <p className="text-xs text-white/80 truncate">{user.role}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
