import { useState, useEffect } from 'react';
import { usersAPI } from '../api/users';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import { MODULES, MODULE_NAMES } from '../utils/modules';
import { formatRole } from '../utils/formatters';

const AdminUsers = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user',
    allowedModules: [],
  });

  // Check if current user is superadmin
  const isSuperadmin = currentUser?.role === 'superadmin';

  useEffect(() => {
    if (isSuperadmin) {
      fetchUsers();
    }
  }, [isSuperadmin]);

  const fetchUsers = async () => {
    try {
      const response = await usersAPI.getAll();
      setUsers(response.data.data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      const userData = {
        ...formData,
        // Only superadmin can create admin users
        role: formData.role === 'admin' && isSuperadmin ? 'admin' : 'user',
      };
      await usersAPI.create(userData);
      fetchUsers();
      resetForm();
    } catch (error) {
      console.error('Error creating user:', error);
      alert(error.response?.data?.error || 'Error creating user');
    }
  };

  const handleEditModules = async (userId, newModules) => {
    try {
      const user = users.find(u => u._id === userId);
      await usersAPI.update(userId, {
        ...user,
        allowedModules: newModules,
      });
      fetchUsers();
      setEditingUser(null);
    } catch (error) {
      console.error('Error updating user modules:', error);
      alert(error.response?.data?.error || 'Error updating user modules');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await usersAPI.delete(id);
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      alert(error.response?.data?.error || 'Error deleting user');
    }
  };

  const handleModuleToggle = (moduleKey) => {
    const currentModules = formData.allowedModules || [];
    if (currentModules.includes(moduleKey)) {
      setFormData({
        ...formData,
        allowedModules: currentModules.filter(m => m !== moduleKey),
      });
    } else {
      setFormData({
        ...formData,
        allowedModules: [...currentModules, moduleKey],
      });
    }
  };

  const handleEditModuleToggle = (moduleKey, currentModules) => {
    if (currentModules.includes(moduleKey)) {
      handleEditModules(editingUser._id, currentModules.filter(m => m !== moduleKey));
    } else {
      handleEditModules(editingUser._id, [...currentModules, moduleKey]);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'user',
      allowedModules: [],
    });
    setShowCreateModal(false);
    setEditingUser(null);
  };

  // Redirect if not superadmin
  if (!isSuperadmin) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">Only superadmin can access this page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  // All available modules
  const allModules = [
    { key: MODULES.HRMS, label: MODULE_NAMES[MODULES.HRMS] },
    { key: MODULES.OPERATIONS, label: MODULE_NAMES[MODULES.OPERATIONS] },
    { key: MODULES.FLIGHT_MANAGEMENT, label: MODULE_NAMES[MODULES.FLIGHT_MANAGEMENT] },
    { key: MODULES.MARKETING, label: MODULE_NAMES[MODULES.MARKETING] },
    { key: MODULES.CRM, label: MODULE_NAMES[MODULES.CRM] },
    { key: MODULES.ACCOUNTING, label: MODULE_NAMES[MODULES.ACCOUNTING] },
    { key: MODULES.TASK_TRACKER, label: MODULE_NAMES[MODULES.TASK_TRACKER] },
    { key: MODULES.ANNOUNCEMENTS, label: MODULE_NAMES[MODULES.ANNOUNCEMENTS] },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-primary text-white font-semibold rounded-md hover:bg-primary-dark transition-colors"
        >
          + Create User
        </button>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto" title="Create New User">
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  minLength="6"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="user">User</option>
                  {isSuperadmin && <option value="admin">Admin</option>}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Allowed Modules</label>
                <div className="grid grid-cols-2 gap-2 p-4 bg-gray-50 rounded-md">
                  {allModules.map((module) => (
                    <label key={module.key} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.allowedModules.includes(module.key)}
                        onChange={() => handleModuleToggle(module.key)}
                        className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                      />
                      <span className="text-sm text-gray-700">{module.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-white font-semibold rounded-md hover:bg-primary-dark transition-colors"
                >
                  Create User
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 bg-gray-300 text-gray-700 font-semibold rounded-md hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Users List */}
      <Card title="All Users">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Modules</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      user.role === 'superadmin' ? 'bg-purple-100 text-purple-800' :
                      user.role === 'admin' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {formatRole(user.role)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {editingUser?._id === user._id ? (
                      <div className="space-y-2">
                        {allModules.map((module) => (
                          <label key={module.key} className="flex items-center space-x-1 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={(user.allowedModules || []).includes(module.key)}
                              onChange={() => handleEditModuleToggle(module.key, user.allowedModules || [])}
                              className="w-3 h-3 text-primary border-gray-300 rounded focus:ring-primary"
                            />
                            <span className="text-xs">{module.label}</span>
                          </label>
                        ))}
                        <button
                          onClick={() => setEditingUser(null)}
                          className="text-xs text-primary hover:text-primary-dark"
                        >
                          Done
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <span className="text-xs">
                          {(user.allowedModules || []).length > 0
                            ? (user.allowedModules || []).map(m => MODULE_NAMES[m] || m).join(', ')
                            : 'No modules'}
                        </span>
                        <button
                          onClick={() => setEditingUser(user)}
                          className="text-xs text-primary hover:text-primary-dark"
                        >
                          Edit
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {user._id !== currentUser.id && (
                      <button
                        onClick={() => handleDelete(user._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default AdminUsers;
