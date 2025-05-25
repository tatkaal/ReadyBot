import React from 'react';
import { Box, Typography, Container, Button, TextField, Paper, Avatar, Link, CircularProgress } from '@mui/material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import { Link as RouterLink } from 'react-router-dom';

const Login = () => {
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!username || !password) {
      setError('Please enter both username and password');
      return;
    }
    
    try {
      setError('');
      setLoading(true);
      await login(username, password);
      navigate('/');
    } catch (err) {
      console.error('Login error:', err);
      setError('Failed to log in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box
          sx={{
            marginTop: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Avatar 
            sx={{ 
              m: 1, 
              bgcolor: 'primary.main',
              width: 70,
              height: 70
            }}
          >
            <SmartToyIcon fontSize="large" />
          </Avatar>
          
          <Typography component="h1" variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            ReadyBot
          </Typography>
          
          <Typography variant="subtitle1" color="text.secondary" gutterBottom>
            Survey Smarter, Not Harder
          </Typography>
          
          <Paper 
            elevation={3} 
            sx={{ 
              mt: 3, 
              p: 4, 
              width: '100%', 
              borderRadius: 3,
              background: 'linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(245,247,250,1) 100%)'
            }}
          >
            <Typography component="h2" variant="h5" sx={{ mb: 3, fontWeight: 600, textAlign: 'center' }}>
              Admin Login
            </Typography>
            
            <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="username"
                label="Username"
                name="username"
                autoComplete="username"
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                sx={{ mb: 2 }}
              />
              
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                sx={{ mb: 3 }}
              />
              
              {error && (
                <Typography color="error" variant="body2" sx={{ mb: 2, textAlign: 'center' }}>
                  {error}
                </Typography>
              )}
              
              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
                sx={{ 
                  py: 1.5,
                  borderRadius: 2,
                  background: 'linear-gradient(45deg, #6200EA 30%, #9D46FF 90%)',
                  boxShadow: '0 3px 5px 2px rgba(98, 0, 234, .3)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #5000C9 30%, #8A3AE8 90%)',
                  }
                }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
              </Button>
              
              <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Demo credentials: username <strong>admin</strong>, password <strong>admin</strong>
                </Typography>
                <Typography variant="body2" sx={{ mt: 2 }}>
                  Don't have an account?{' '}
                  <Link component={RouterLink} to="/register" sx={{ fontWeight: 600 }}>
                    Register here
                  </Link>
                </Typography>
              </Box>
            </Box>
          </Paper>
          
          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              ReadyBot - AI-powered survey platform
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              © {new Date().getFullYear()} ReadyBot | All rights reserved
            </Typography>
          </Box>
        </Box>
      </motion.div>
    </Container>
  );
};

export default Login;
