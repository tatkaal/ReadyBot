import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Card, CardContent, IconButton, Button, TextField, Dialog, DialogActions, DialogContent, DialogTitle, CircularProgress, Snackbar, Alert, Paper, Tooltip, Divider } from '@mui/material';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

// Icons
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

const Questions = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [formData, setFormData] = useState({
    text: '',
    qualityGuidelines: ''
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState({
    open: false,
    questionId: null
  });
  
  const { currentAdmin } = useAuth();

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        showSnackbar('Please login to view questions', 'error');
        return;
      }

      const res = await axios.get(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/question`,
        {
          headers: {
            'x-auth-token': token
          }
        }
      );
      setQuestions(res.data);
    } catch (err) {
      console.error('Error fetching questions:', err);
      if (err.response?.status === 401) {
        showSnackbar('Session expired. Please login again.', 'error');
      } else {
        showSnackbar('Failed to load questions', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (question = null) => {
    if (question) {
      setEditingQuestion(question);
      setFormData({
        text: question.text,
        qualityGuidelines: question.qualityGuidelines || ''
      });
    } else {
      setEditingQuestion(null);
      setFormData({
        text: '',
        qualityGuidelines: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingQuestion(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showSnackbar('Please login to create questions', 'error');
        return;
      }

      const headers = {
        'x-auth-token': token
      };

      if (editingQuestion) {
        // Update existing question
        await axios.put(
          `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/question/${editingQuestion.id}`, 
          formData,
          { headers }
        );
        showSnackbar('Question updated successfully');
      } else {
        // Create new question
        await axios.post(
          `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/question`, 
          formData,
          { headers }
        );
        showSnackbar('Question created successfully');
      }
      handleCloseDialog();
      fetchQuestions();
    } catch (err) {
      console.error('Error saving question:', err);
      if (err.response?.status === 401) {
        showSnackbar('Session expired. Please login again.', 'error');
      } else {
        showSnackbar(err.response?.data?.message || 'Failed to save question', 'error');
      }
    }
  };

  const handleDeleteConfirm = (questionId) => {
    setDeleteConfirmDialog({
      open: true,
      questionId
    });
  };

  const handleDeleteQuestion = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showSnackbar('Please login to delete questions', 'error');
        return;
      }

      await axios.delete(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/question/${deleteConfirmDialog.questionId}`,
        {
          headers: {
            'x-auth-token': token
          }
        }
      );
      showSnackbar('Question deleted successfully');
      fetchQuestions();
    } catch (err) {
      console.error('Error deleting question:', err);
      if (err.response?.status === 401) {
        showSnackbar('Session expired. Please login again.', 'error');
      } else {
        showSnackbar('Failed to delete question', 'error');
      }
    } finally {
      setDeleteConfirmDialog({
        open: false,
        questionId: null
      });
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
    setSnackbar({
      ...snackbar,
      open: false
    });
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

  if (loading && questions.length === 0) {
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
            Question Management
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
            New Question
          </Button>
        </motion.div>
      </Box>
      
      <motion.div variants={itemVariants}>
        <Paper 
          elevation={0} 
          sx={{ 
            p: 3, 
            mb: 4, 
            borderRadius: 3,
            bgcolor: 'rgba(98, 0, 234, 0.05)',
            border: '1px dashed rgba(98, 0, 234, 0.3)'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
            <HelpOutlineIcon sx={{ mr: 2, color: 'primary.main' }} />
            <Box>
              <Typography variant="h6" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
                About Questions
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Questions are the building blocks of your surveys. Each question can have optional quality guidelines that help ReadyBot score participant responses on a scale of 1-5. Create thoughtful questions to get the most insightful responses.
              </Typography>
            </Box>
          </Box>
        </Paper>
      </motion.div>
      
      <Grid container spacing={3}>
        {questions.length > 0 ? (
          questions.map((question) => (
            <Grid item xs={12} key={question.id}>
              <motion.div variants={itemVariants}>
                <Card 
                  elevation={2} 
                  sx={{ 
                    borderRadius: 3,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)',
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box>
                        <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 600 }}>
                          {question.text}
                        </Typography>
                        
                        {question.qualityGuidelines && (
                          <>
                            <Typography variant="subtitle2" color="primary" sx={{ mt: 2, mb: 0.5, fontWeight: 600 }}>
                              Quality Guidelines:
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {question.qualityGuidelines}
                            </Typography>
                          </>
                        )}
                        
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
                          Created: {new Date(question.createdAt).toLocaleDateString()}
                        </Typography>
                      </Box>
                      
                      <Box>
                        <Tooltip title="Edit Question">
                          <IconButton 
                            onClick={() => handleOpenDialog(question)}
                            sx={{ color: 'primary.main' }}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="Delete Question">
                          <IconButton 
                            onClick={() => handleDeleteConfirm(question.id)}
                            sx={{ color: 'error.main' }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))
        ) : (
          <Grid item xs={12}>
            <motion.div variants={itemVariants}>
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No questions found
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Create your first question to get started with surveys
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenDialog()}
                  sx={{ mt: 2 }}
                >
                  Create Question
                </Button>
              </Box>
            </motion.div>
          </Grid>
        )}
      </Grid>
      
      {/* Create/Edit Question Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingQuestion ? 'Edit Question' : 'Create New Question'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="text"
            name="text"
            label="Question Text"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.text}
            onChange={handleInputChange}
            required
            sx={{ mb: 3 }}
          />
          
          <TextField
            margin="dense"
            id="qualityGuidelines"
            name="qualityGuidelines"
            label="Quality Guidelines (Optional)"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.qualityGuidelines}
            onChange={handleInputChange}
            multiline
            rows={4}
            helperText="Guidelines help ReadyBot score responses. Example: 'Look for detailed responses that mention specific experiences.'"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleCloseDialog} color="inherit">
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={!formData.text.trim()}
          >
            {editingQuestion ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmDialog.open} onClose={() => setDeleteConfirmDialog({ open: false, questionId: null })}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this question? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmDialog({ open: false, questionId: null })} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleDeleteQuestion} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar for notifications */}
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

export default Questions;
