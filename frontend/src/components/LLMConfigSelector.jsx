import React, { useState, useEffect } from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Paper,
  CircularProgress,
  Alert
} from '@mui/material';
import axios from 'axios';

const LLMConfigSelector = ({ value, onChange, task }) => {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/llm-config`);
      setConfigs(res.data.filter(config => config.task === task && config.isActive));
    } catch (err) {
      console.error('Error fetching LLM configs:', err);
      setError('Failed to load LLM configurations');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Paper elevation={0} sx={{ p: 2, mb: 2, bgcolor: 'background.default' }}>
      <Typography variant="subtitle2" gutterBottom>
        {task.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} Model
      </Typography>
      
      <FormControl fullWidth size="small">
        <InputLabel id={`llm-config-${task}-label`}>
          Select Model Configuration
        </InputLabel>
        <Select
          labelId={`llm-config-${task}-label`}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          label="Select Model Configuration"
        >
          <MenuItem value="">
            <em>Use Default (GPT-3.5-turbo)</em>
          </MenuItem>
          {configs.map((config) => (
            <MenuItem key={config.id} value={config.id}>
              {config.name} ({config.model})
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Paper>
  );
};

export default LLMConfigSelector; 