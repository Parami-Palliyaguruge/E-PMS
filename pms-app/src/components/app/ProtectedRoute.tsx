import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Box, CircularProgress, Typography } from '@mui/material';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiresBusiness?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiresBusiness = true 
}) => {
  const { currentUser, loading } = useAuth();
  
  // Add debug logging
  useEffect(() => {
    console.log('ProtectedRoute - Auth State:', { 
      isAuthenticated: !!currentUser, 
      loading,
      userData: currentUser ? {
        id: currentUser.id,
        email: currentUser.email,
        role: currentUser.role,
        businessId: currentUser.businessId || 'none',
        // Add displayName which contains the businessId in Firebase Auth
        displayName: currentUser.displayName || 'none'
      } : 'no user'
    });
  }, [currentUser, loading]);
  
  if (loading) {
    // Show a better loading indicator
    return (
      <Box 
        display="flex" 
        flexDirection="column"
        justifyContent="center" 
        alignItems="center" 
        minHeight="80vh"
      >
        <CircularProgress size={40} />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Verifying authentication...
        </Typography>
      </Box>
    );
  }
  
  // If user is not logged in, redirect to login
  if (!currentUser) {
    console.log('ProtectedRoute - Redirecting to login: No authenticated user');
    return <Navigate to="/login" replace />;
  }
  
  // If route requires business and user doesn't have one, allow access to dashboard anyway
  // but prompt them within the dashboard to set up their business if needed
  if (requiresBusiness && (!currentUser.businessId || currentUser.businessId === '')) {
    console.log('ProtectedRoute - User has no business but allowing access to dashboard');
    // No redirection, just let them through to the dashboard
    return <>{children}</>;
  }
  
  console.log('ProtectedRoute - Access granted to protected route');
  return <>{children}</>;
};

export default ProtectedRoute; 