import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, requiredRole = null, requiredModule = null }) => {
  const { user, token, loading, isAllowed } = useAuth();

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Check if token exists (either in state or localStorage)
  const hasToken = token || localStorage.getItem('token');

  // Redirect to login if not authenticated (no token or no user)
  if (!hasToken || !user) {
    return <Navigate to="/login" replace />;
  }

  // Check role requirement
  if (requiredRole && user.role !== requiredRole && user.role !== 'superadmin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">
            You don't have permission to access this page. Required role: {requiredRole}
          </p>
        </div>
      </div>
    );
  }

  // Check module requirement using isAllowed from context
  if (requiredModule && !isAllowed(requiredModule)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">
            You don't have access to the {requiredModule} module.
          </p>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;

