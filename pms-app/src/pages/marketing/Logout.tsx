import React, { useEffect, useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Box, Typography, Paper, Container, Button, CircularProgress } from '@mui/material';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';

const Logout: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(true);

  useEffect(() => {
    const performLogout = async () => {
      try {
        setIsLoggingOut(true);
        await logout();
        console.log('User successfully logged out');
        
        // Brief delay to show the success message
        setTimeout(() => {
          navigate('/login', { 
            replace: true,
            state: { message: "You've been successfully logged out" } 
          });
        }, 1500);
      } catch (error: any) {
        console.error('Logout error:', error);
        setError('Failed to log out. Please try again.');
        setIsLoggingOut(false);
      }
    };

    performLogout();
  }, [logout, navigate]);

  const handleRetryLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      navigate('/login', { 
        replace: true,
        state: { message: "You've been successfully logged out" } 
      });
    } catch (error: any) {
      console.error('Retry logout error:', error);
      setError('Failed to log out. Please try again.');
      setIsLoggingOut(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Paper elevation={3} sx={{ p: 4, width: '100%', textAlign: 'center' }}>
          <ExitToAppIcon color="primary" sx={{ fontSize: 60, mb: 2 }} />
          
          <Typography variant="h5" component="h1" gutterBottom>
            {isLoggingOut && !error ? 'Logging Out...' : error ? 'Logout Failed' : 'Logged Out Successfully'}
          </Typography>
          
          {isLoggingOut && !error && (
            <>
              <CircularProgress size={36} sx={{ my: 2 }} />
              <Typography variant="body1" color="text.secondary">
                Please wait while we securely log you out...
              </Typography>
            </>
          )}
          
          {error && (
            <>
              <Typography variant="body1" color="error" paragraph>
                {error}
              </Typography>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={handleRetryLogout}
                sx={{ mt: 2 }}
              >
                Try Again
              </Button>
            </>
          )}
          
          {!isLoggingOut && !error && (
            <>
              <Typography variant="body1" color="text.secondary" paragraph>
                You have been successfully logged out.
              </Typography>
              <Button 
                component={RouterLink} 
                to="/login" 
                variant="contained" 
                color="primary"
                sx={{ mt: 2 }}
              >
                Back to Login
              </Button>
            </>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default Logout; 