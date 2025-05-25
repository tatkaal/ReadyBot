import React from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Button, 
  Paper,
  Grid
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { motion } from 'framer-motion';

// Icons
import SentimentVeryDissatisfiedIcon from '@mui/icons-material/SentimentVeryDissatisfied';
import HomeIcon from '@mui/icons-material/Home';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

const NotFound = () => {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, rgba(98, 0, 234, 0.05) 0%, rgba(157, 70, 255, 0.05) 100%)',
        py: 4
      }}
    >
      <Container maxWidth="md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Paper
            elevation={0}
            sx={{
              p: 4,
              borderRadius: 3,
              boxShadow: '0 8px 40px rgba(0, 0, 0, 0.12)',
              textAlign: 'center',
              overflow: 'hidden',
              position: 'relative'
            }}
          >
            <Box 
              sx={{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                right: 0, 
                height: '8px', 
                background: 'linear-gradient(90deg, #6200EA 0%, #9D46FF 100%)' 
              }}
            />
            
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <SentimentVeryDissatisfiedIcon 
                sx={{ 
                  fontSize: 120, 
                  color: 'primary.main',
                  mb: 2,
                  opacity: 0.8
                }} 
              />
            </motion.div>
            
            <Typography variant="h2" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
              404
            </Typography>
            
            <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
              Page Not Found
            </Typography>
            
            <Typography variant="body1" color="text.secondary" paragraph sx={{ maxWidth: 600, mx: 'auto', mb: 4 }}>
              The page you are looking for might have been removed, had its name changed, 
              or is temporarily unavailable. Please check the URL or navigate back to the dashboard.
            </Typography>
            
            <Grid container spacing={2} justifyContent="center">
              <Grid item>
                <Button
                  variant="contained"
                  size="large"
                  component={RouterLink}
                  to="/"
                  startIcon={<HomeIcon />}
                  sx={{
                    px: 4,
                    py: 1.5,
                    borderRadius: 2,
                    background: 'linear-gradient(45deg, #6200EA 30%, #9D46FF 90%)',
                    boxShadow: '0 4px 20px rgba(98, 0, 234, 0.4)',
                    '&:hover': {
                      boxShadow: '0 6px 25px rgba(98, 0, 234, 0.5)',
                    }
                  }}
                >
                  Back to Dashboard
                </Button>
              </Grid>
              
              <Grid item>
                <Button
                  variant="outlined"
                  size="large"
                  component={RouterLink}
                  to="/surveys"
                  startIcon={<HelpOutlineIcon />}
                  sx={{
                    px: 4,
                    py: 1.5,
                    borderRadius: 2,
                    borderColor: 'primary.main',
                    '&:hover': {
                      borderColor: 'primary.dark',
                      bgcolor: 'rgba(98, 0, 234, 0.04)',
                    }
                  }}
                >
                  View Surveys
                </Button>
              </Grid>
            </Grid>
            
            <Box sx={{ mt: 6, pt: 4, borderTop: '1px solid', borderColor: 'divider' }}>
              <Typography variant="body2" color="text.secondary">
                ReadyBot - Survey Smarter, Not Harder
              </Typography>
            </Box>
          </Paper>
        </motion.div>
      </Container>
    </Box>
  );
};

export default NotFound;
