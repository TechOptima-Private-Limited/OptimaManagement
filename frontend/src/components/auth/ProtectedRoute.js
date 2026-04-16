import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { isAuthenticated, hasPermission } from '../../utils/auth';
import Layout from '../layout/Layout';

const ProtectedRoute = ({ children, requiredRole = null, redirectTo = '/login' }) => {
  const location = useLocation();

  // Check if user is authenticated
  if (!isAuthenticated()) {
    return <Navigate 
      to={redirectTo} 
      state={{ from: location }} 
      replace 
    />;
  }

  // Check role-based permissions if required
  if (requiredRole && !hasPermission(requiredRole)) {
    return <Navigate 
      to="/dashboard" 
      replace 
    />;
  }

  // Render children wrapped in layout
  return <Layout>{children}</Layout>;
};

export default ProtectedRoute;
