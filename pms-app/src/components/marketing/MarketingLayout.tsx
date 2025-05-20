import React from 'react';
import { Outlet, Link as RouterLink, useLocation } from 'react-router-dom';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Container, 
  Box, 
  Link,
  Stack
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';

const MarketingLayout: React.FC = () => {
  const { currentUser } = useAuth();
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };
  
  // Determine dashboard link based on businessId
  const getDashboardLink = () => {
    if (!currentUser) return '/login';
    return currentUser.businessId ? '/app/dashboard' : '/create-business';
  };
  
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography 
            variant="h6" 
            component={RouterLink} 
            to="/" 
            sx={{ 
              flexGrow: 1, 
              textDecoration: 'none', 
              color: 'inherit' 
            }}
          >
            ProcureFlow
          </Typography>
          
          <Stack direction="row" spacing={2} sx={{ mr: 2 }}>
            <Button 
              color="inherit" 
              component={RouterLink} 
              to="/"
              sx={{ 
                fontWeight: isActive('/') ? 'bold' : 'normal',
                borderBottom: isActive('/') ? '2px solid white' : 'none'
              }}
            >
              Home
            </Button>
            <Button 
              color="inherit" 
              component={RouterLink} 
              to="/features"
              sx={{ 
                fontWeight: isActive('/features') ? 'bold' : 'normal',
                borderBottom: isActive('/features') ? '2px solid white' : 'none'
              }}
            >
              Features
            </Button>
            <Button 
              color="inherit" 
              component={RouterLink} 
              to="/pricing"
              sx={{ 
                fontWeight: isActive('/pricing') ? 'bold' : 'normal',
                borderBottom: isActive('/pricing') ? '2px solid white' : 'none'
              }}
            >
              Pricing
            </Button>
            <Button 
              color="inherit" 
              component={RouterLink} 
              to="/contact"
              sx={{ 
                fontWeight: isActive('/contact') ? 'bold' : 'normal',
                borderBottom: isActive('/contact') ? '2px solid white' : 'none'
              }}
            >
              Contact
            </Button>
          </Stack>
          
          <Box>
            {currentUser ? (
              <Button 
                color="inherit" 
                variant="outlined" 
                component={RouterLink} 
                to={getDashboardLink()}
                sx={{ ml: 1 }}
              >
                Dashboard
              </Button>
            ) : (
              <>
                <Button 
                  color="inherit" 
                  component={RouterLink} 
                  to="/login"
                >
                  Login
                </Button>
                <Button 
                  color="inherit" 
                  variant="outlined" 
                  component={RouterLink} 
                  to="/register"
                  sx={{ ml: 1 }}
                >
                  Sign Up
                </Button>
              </>
            )}
          </Box>
        </Toolbar>
      </AppBar>
      
      <Container component="main" sx={{ flexGrow: 1, py: 4 }}>
        <Outlet />
      </Container>
      
      <Box
        component="footer"
        sx={{
          py: 3,
          px: 2,
          mt: 'auto',
          backgroundColor: (theme) => theme.palette.grey[200],
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <Box>
              <Typography variant="h6" color="text.primary" gutterBottom>
                ProcureFlow
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Streamlining procurement for small and medium businesses
              </Typography>
            </Box>
            
            <Box>
              <Typography variant="h6" gutterBottom>
                Quick Links
              </Typography>
              <Link component={RouterLink} to="/" color="inherit" display="block">
                Home
              </Link>
              <Link component={RouterLink} to="/features" color="inherit" display="block">
                Features
              </Link>
              <Link component={RouterLink} to="/pricing" color="inherit" display="block">
                Pricing
              </Link>
            </Box>
            
            <Box>
              <Typography variant="h6" gutterBottom>
                Contact
              </Typography>
              <Link component={RouterLink} to="/contact" color="inherit" display="block">
                Contact Us
              </Link>
              <Typography variant="body2" color="text.secondary">
                support@procureflow.com
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ mt: 3 }}>
            <Typography variant="body2" color="text.secondary" align="center">
              {'© '}
              {new Date().getFullYear()}
              {' ProcureFlow. All rights reserved.'}
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default MarketingLayout; 