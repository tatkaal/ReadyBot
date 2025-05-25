import React from 'react';
import { Box, Typography, Container, Paper, useTheme, useMediaQuery } from '@mui/material';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import { useAuth } from '../contexts/AuthContext';

const Layout = () => {
  const { currentAdmin } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  return (
    <Box sx={{ 
      display: 'flex', 
      minHeight: '100vh', 
      bgcolor: '#f5f7fa',
      overflow: 'hidden'
    }}>
      {currentAdmin && <Header />}
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${currentAdmin ? 320 : 0}px)` },
          ml: { md: currentAdmin ? `320px` : 0 },
          mt: { xs: '64px', md: 0 },
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Container maxWidth="xl" sx={{ py: 3, flex: 1 }}>
          <Outlet />
        </Container>
        
        {currentAdmin && <Footer />}
      </Box>
    </Box>
  );
};

export default Layout;
