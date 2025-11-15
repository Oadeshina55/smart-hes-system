import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { CircularProgress, Box, Typography } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

interface PrivateRouteProps {
  allowedRoles?: string[];
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ allowedRoles }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        bgcolor="#f8f9fa"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        bgcolor="#f8f9fa"
        flexDirection="column"
      >
        <Typography variant="h5" color="error" gutterBottom>
          Access Denied
        </Typography>
        <Typography color="textSecondary">
          You do not have permission to access this page.
        </Typography>
        <Typography color="textSecondary" sx={{ mt: 2 }}>
          Your role: <strong>{user.role}</strong>
        </Typography>
      </Box>
    );
  }

  return <Outlet />;
};

export default PrivateRoute;
