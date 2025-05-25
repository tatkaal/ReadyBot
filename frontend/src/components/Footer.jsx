import React from 'react';
import { Box, Typography, Link } from '@mui/material';

const Footer = () => {
  return (
    <Box 
      component="footer" 
      sx={{ 
        py: 3, 
        mt: 'auto',
        textAlign: 'center',
        borderTop: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Typography variant="body2" color="text.secondary">
        © {new Date().getFullYear()} ReadyBot - Survey Smarter, Not Harder
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
        Powered by AI | <Link href="#" color="inherit">Terms</Link> | <Link href="#" color="inherit">Privacy</Link>
      </Typography>
    </Box>
  );
};

export default Footer;
