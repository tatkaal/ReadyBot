import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Alert,
  Snackbar,
  CircularProgress
} from '@mui/material';
import { motion } from 'framer-motion';
import axios from 'axios';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

const LLMConfig = () => {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingConfig, setEditingConfig] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    model: '',
    task: '',
    temperature: 0.7,
    maxTokens: 500
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const availableModels = [
    { name: 'GPT-4', value: 'gpt-4' },
    { name: 'GPT-3.5-turbo', value: 'gpt-3.5-turbo' },
    { name: 'GPT-3.5-turbo-16k', value: 'gpt-3.5-turbo-16k' }
  ];

  const availableTasks = [
    { name: 'Intent Classification', value: 'intent_classification' },
    { name: 'Response Generation', value: 'response_generation' },
    { name: 'Scoring', value: 'scoring' },
    { name: 'Hint Generation', value: 'hint_generation' }
  ];

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/llm-config`);
      setConfigs(res.data);
    } catch (err) {
      console.error('Error fetching LLM configs:', err);
      setError('Failed to load LLM configurations');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (config = null) => {
    if (config) {
      setEditingConfig(config);
      setFormData({
        name: config.name,
        model: config.model,
        task: config.task,
        temperature: config.temperature,
        maxTokens: config.maxTokens
      });
    } else {
      setEditingConfig(null);
      setFormData({
        name: '',
        model: '',
        task: '',
        temperature: 0.7,
        maxTokens: 500
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingConfig(null);
    setFormData({
      name: '',
      model: '',
      task: '',
      temperature: 0.7,
      maxTokens: 500
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async () => {
    try {
      if (editingConfig) {
        await axios.put(
          `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/llm-config/${editingConfig.id}`,
          formData
        );
        showSnackbar('LLM configuration updated successfully');
      } else {
        await axios.post(
          `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/llm-config`,
          formData
        );
        showSnackbar('LLM configuration created successfully');
      }
      fetchConfigs();
      handleCloseDialog();
    } catch (err) {
      console.error('Error saving LLM config:', err);
      showSnackbar('Failed to save LLM configuration', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this configuration?')) return;
    
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/llm-config/${id}`);
      showSnackbar('LLM configuration deleted successfully');
      fetchConfigs();
    } catch (err) {
      console.error('Error deleting LLM config:', err);
      showSnackbar('Failed to delete LLM configuration', 'error');
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.4 }
    }
  };

  if (loading && configs.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <motion.div variants={itemVariants}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
            LLM Configurations
          </Typography>
        </motion.div>
        
        <motion.div variants={itemVariants}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            sx={{
              background: 'linear-gradient(45deg, #6244bb 30%, #9D46FF 90%)',
            }}
          >
            New Configuration
          </Button>
        </motion.div>
      </Box>

      {error && (
        <motion.div variants={itemVariants}>
          <Alert severity="error" sx={{ mb: 4 }}>
            {error}
          </Alert>
        </motion.div>
      )}

      <motion.div variants={itemVariants}>
        <Paper elevation={0} sx={{ p: 3, mb: 4, borderRadius: 3, bgcolor: 'rgba(0, 229, 255, 0.05)', border: '1px dashed rgba(0, 229, 255, 0.3)' }}>
          <Typography variant="body2" color="text.secondary">
            Configure different AI models for various tasks in your surveys. Each configuration can be assigned to specific tasks like intent classification, response generation, scoring, or hint generation.
          </Typography>
        </Paper>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
          {configs.map((config) => (
            <Paper
              key={config.id}
              elevation={1}
              sx={{
                p: 2,
                borderRadius: 2,
                display: 'flex',
                flexDirection: 'column',
                gap: 1
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {config.name}
                </Typography>
                <Box>
                  <IconButton
                    size="small"
                    onClick={() => handleOpenDialog(config)}
                    sx={{ mr: 1 }}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDelete(config.id)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </Box>

              <Typography variant="body2" color="text.secondary">
                Model: {config.model}
              </Typography>

              <Typography variant="body2" color="text.secondary">
                Task: {config.task.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
              </Typography>

              <Typography variant="body2" color="text.secondary">
                Temperature: {config.temperature}
              </Typography>

              <Typography variant="body2" color="text.secondary">
                Max Tokens: {config.maxTokens}
              </Typography>

              <Box sx={{ mt: 'auto', pt: 1 }}>
                <Typography
                  variant="caption"
                  sx={{
                    display: 'inline-block',
                    px: 1,
                    py: 0.5,
                    borderRadius: 1,
                    bgcolor: config.isActive ? 'success.light' : 'error.light',
                    color: config.isActive ? 'success.dark' : 'error.dark'
                  }}
                >
                  {config.isActive ? 'Active' : 'Inactive'}
                </Typography>
              </Box>
            </Paper>
          ))}
        </Box>
      </motion.div>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingConfig ? 'Edit LLM Configuration' : 'Create New LLM Configuration'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="name"
            label="Configuration Name"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.name}
            onChange={handleInputChange}
            required
            sx={{ mb: 2 }}
          />

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="model-select-label">Model</InputLabel>
            <Select
              labelId="model-select-label"
              name="model"
              value={formData.model}
              onChange={handleInputChange}
              label="Model"
              required
            >
              {availableModels.map((model) => (
                <MenuItem key={model.value} value={model.value}>
                  {model.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="task-select-label">Task</InputLabel>
            <Select
              labelId="task-select-label"
              name="task"
              value={formData.task}
              onChange={handleInputChange}
              label="Task"
              required
            >
              {availableTasks.map((task) => (
                <MenuItem key={task.value} value={task.value}>
                  {task.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            margin="dense"
            name="temperature"
            label="Temperature"
            type="number"
            fullWidth
            variant="outlined"
            value={formData.temperature}
            onChange={handleInputChange}
            inputProps={{
              min: 0,
              max: 1,
              step: 0.1
            }}
            sx={{ mb: 2 }}
          />

          <TextField
            margin="dense"
            name="maxTokens"
            label="Max Tokens"
            type="number"
            fullWidth
            variant="outlined"
            value={formData.maxTokens}
            onChange={handleInputChange}
            inputProps={{
              min: 1,
              step: 1
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!formData.name || !formData.model || !formData.task}
          >
            {editingConfig ? 'Save Changes' : 'Create Configuration'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </motion.div>
  );
};

export default LLMConfig; 