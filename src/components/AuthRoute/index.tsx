import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

interface AuthRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

const AuthRoute: React.FC<AuthRouteProps> = ({ children, requiredRole }) => {
  const { token, roles } = useAuthStore();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && !roles.includes(requiredRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default AuthRoute;
