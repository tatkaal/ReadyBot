import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Card, CardContent, IconButton, Button, TextField, Dialog, DialogActions, DialogContent, DialogTitle, CircularProgress, Snackbar, Alert, Paper, Tooltip, Divider, Chip, FormControl, InputLabel, Select, MenuItem, OutlinedInput, Checkbox, ListItemText } from '@mui/material';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import LLMConfigSelector from '../components/LLMConfigSelector';
import { useNavigate } from 'react-router-dom';

// Icons
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LinkIcon from '@mui/icons-material/Link';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import VisibilityIcon from '@mui/icons-material/Visibility';
import BarChartIcon from '@mui/icons-material/BarChart';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

const Surveys = () => {
  const [surveys, setSurveys] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingSurvey, setEditingSurvey] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    questions: [],
    llmConfigs: {
      intent_classification: null,
      response_generation: null,
      scoring: null,
      hint_generation: null
    }
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState({
    open: false,
    surveyId: null
  });
  const [linkDialog, setLinkDialog] = useState({
    open: false,
    survey: null
  });
  
  const { currentAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        showSnackbar('Please login to view surveys', 'error');
        return;
      }

      const headers = {
        'x-auth-token': token
      };

      const [surveysRes, questionsRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/surveys`, { headers }),
        axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/question`, { headers })
      ]);
      setSurveys(surveysRes.data);
      setQuestions(questionsRes.data);
    } catch (err) {
      console.error('Error fetching data:', err);
      if (err.response?.status === 401) {
        showSnackbar('Session expired. Please login again.', 'error');
      } else {
        showSnackbar('Failed to load data', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (survey = null) => {
    if (survey) {
      setEditingSurvey(survey);
      setFormData({
        title: survey.title,
        description: survey.description || '',
        questions: survey.Questions.map(q => q.id),
        llmConfigs: {
          intent_classification: survey.llmConfigs?.intent_classification || null,
          response_generation: survey.llmConfigs?.response_generation || null,
          scoring: survey.llmConfigs?.scoring || null,
          hint_generation: survey.llmConfigs?.hint_generation || null
        }
      });
    } else {
      setEditingSurvey(null);
      setFormData({
        title: '',
        description: '',
        questions: [],
        llmConfigs: {
          intent_classification: null,
          response_generation: null,
          scoring: null,
          hint_generation: null
        }
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingSurvey(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleQuestionsChange = (event) => {
    const {
      target: { value },
    } = event;
    setFormData({
      ...formData,
      questions: typeof value === 'string' ? value.split(',') : value,
    });
  };

  const handleLLMConfigChange = (task, value) => {
    setFormData(prev => ({
      ...prev,
      llmConfigs: {
        ...prev.llmConfigs,
        [task]: value
      }
    }));
  };

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showSnackbar('Please login to create surveys', 'error');
        return;
      }

      const headers = {
        'x-auth-token': token
      };

      if (editingSurvey) {
        // Update existing survey
        await axios.put(
          `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/surveys/${editingSurvey.id}`, 
          formData,
          { headers }
        );
        showSnackbar('Survey updated successfully');
      } else {
        // Create new survey
        await axios.post(
          `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/surveys`, 
          formData,
          { headers }
        );
        showSnackbar('Survey created successfully');
      }
      handleCloseDialog();
      fetchData();
    } catch (err) {
      console.error('Error saving survey:', err);
      if (err.response?.status === 401) {
        showSnackbar('Session expired. Please login again.', 'error');
      } else {
        showSnackbar(err.response?.data?.message || 'Failed to save survey', 'error');
      }
    }
  };

  const handleDeleteConfirm = (surveyId) => {
    setDeleteConfirmDialog({
      open: true,
      surveyId
    });
  };

  const handleDeleteSurvey = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showSnackbar('Please login to delete surveys', 'error');
        return;
      }

      await axios.delete(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/surveys/${deleteConfirmDialog.surveyId}`,
        {
          headers: {
            'x-auth-token': token
          }
        }
      );
      showSnackbar('Survey deleted successfully');
      fetchData();
    } catch (err) {
      console.error('Error deleting survey:', err);
      if (err.response?.status === 401) {
        showSnackbar('Session expired. Please login again.', 'error');
      } else {
        showSnackbar('Failed to delete survey', 'error');
      }
    } finally {
      setDeleteConfirmDialog({
        open: false,
        surveyId: null
      });
    }
  };

  const handleGenerateLink = async (survey) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showSnackbar('Please login to generate links', 'error');
        return;
      }

      const res = await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/surveys/${survey.id}/generate-link`,
        {},
        {
          headers: {
            'x-auth-token': token
          }
        }
      );
      
      // Update the survey in the state
      const updatedSurveys = surveys.map(s => 
        s.id === survey.id 
          ? { ...s, uniqueId: res.data.uniqueId, shareableLink: res.data.shareableLink } 
          : s
      );
      setSurveys(updatedSurveys);
      
      // Open the link dialog
      setLinkDialog({
        open: true,
        survey: { ...survey, uniqueId: res.data.uniqueId, shareableLink: res.data.shareableLink }
      });
      
      showSnackbar('New link generated successfully');
    } catch (err) {
      console.error('Error generating link:', err);
      if (err.response?.status === 401) {
        showSnackbar('Session expired. Please login again.', 'error');
      } else {
        showSnackbar('Failed to generate link', 'error');
      }
    }
  };

  const handleCopyLink = (link) => {
    navigator.clipboard.writeText(link);
    showSnackbar('Link copied to clipboard');
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

  if (loading && surveys.length === 0) {
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
            Survey Management
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
            disabled={questions.length === 0}
          >
            New Survey
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
            bgcolor: 'rgba(0, 229, 255, 0.05)',
            border: '1px dashed rgba(0, 229, 255, 0.3)'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
            <HelpOutlineIcon sx={{ mr: 2, color: 'secondary.main' }} />
            <Box>
              <Typography variant="h6" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
                About Surveys
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Surveys combine multiple questions into a conversational flow. Share the generated link with participants to collect responses. Each response is scored for quality on a scale of 1-5 by ReadyBot's AI.
              </Typography>
            </Box>
          </Box>
        </Paper>
      </motion.div>
      
      <Grid container spacing={3}>
        {surveys.length > 0 ? (
          surveys.map((survey) => (
            <Grid item xs={12} md={6} key={survey.id}>
              <motion.div variants={itemVariants}>
                <Card 
                  elevation={2} 
                  sx={{ 
                    borderRadius: 3,
                    height: '100%',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)',
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box sx={{ flexGrow: 1, cursor: 'pointer' }} onClick={() => navigate(`/surveys/${survey.id}`)}>
                        <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 600 }}>
                          {survey.title}
                        </Typography>
                        
                        {survey.description && (
                          <Typography variant="body2" color="text.secondary" paragraph>
                            {survey.description}
                          </Typography>
                        )}
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <Chip 
                            label={survey.isActive ? 'Active' : 'Inactive'} 
                            size="small"
                            color={survey.isActive ? 'success' : 'default'}
                            sx={{ mr: 1 }}
                          />
                          
                          <Typography variant="caption" color="text.secondary">
                            {survey.Questions?.length || 0} questions
                          </Typography>
                        </Box>
                        
                        {survey.shareableLink && (
                          <Box 
                            sx={{ 
                              display: 'flex', 
                              alignItems: 'center',
                              p: 1.5,
                              bgcolor: 'background.default',
                              borderRadius: 2,
                              mb: 2
                            }}
                          >
                            <LinkIcon fontSize="small" sx={{ color: 'primary.main', mr: 1 }} />
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                flexGrow: 1,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {survey.shareableLink}
                            </Typography>
                            <IconButton 
                              size="small" 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyLink(survey.shareableLink);
                              }}
                              sx={{ ml: 1 }}
                            >
                              <ContentCopyIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        )}
                      </Box>
                    </Box>
                    
                    <Divider sx={{ my: 2 }} />
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="caption" color="text.secondary">
                        Created: {new Date(survey.createdAt).toLocaleDateString()}
                      </Typography>
                      
                      <Box>
                        <Tooltip title="View Responses">
                          <IconButton 
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/responses/${survey.id}`);
                            }}
                            sx={{ mr: 1 }}
                          >
                            <BarChartIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="Generate Link">
                          <IconButton 
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleGenerateLink(survey);
                            }}
                            sx={{ mr: 1 }}
                          >
                            <LinkIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="Edit Survey">
                          <IconButton 
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDialog(survey);
                            }}
                            sx={{ mr: 1 }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="Delete Survey">
                          <IconButton 
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteConfirm(survey.id);
                            }}
                            color="error"
                          >
                            <DeleteIcon fontSize="small" />
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
                  No surveys found
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {questions.length > 0 
                    ? 'Create your first survey to start collecting responses' 
                    : 'You need to create questions first before creating a survey'}
                </Typography>
                <Button
                  variant="contained"
                  startIcon={questions.length > 0 ? <AddIcon /> : null}
                  onClick={() => questions.length > 0 ? handleOpenDialog() : window.location.href = '/questions'}
                  sx={{ mt: 2 }}
                >
                  {questions.length > 0 ? 'Create Survey' : 'Create Questions First'}
                </Button>
              </Box>
            </motion.div>
          </Grid>
        )}
      </Grid>
      
      {/* Create/Edit Survey Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingSurvey ? 'Edit Survey' : 'Create New Survey'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="title"
            name="title"
            label="Survey Title"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.title}
            onChange={handleInputChange}
            required
            sx={{ mb: 3 }}
          />
          
          <TextField
            margin="dense"
            id="description"
            name="description"
            label="Survey Description"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.description}
            onChange={handleInputChange}
            multiline
            rows={3}
            sx={{ mb: 3 }}
          />
          
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel id="questions-select-label">Questions</InputLabel>
            <Select
              labelId="questions-select-label"
              id="questions-select"
              multiple
              value={formData.questions}
              onChange={handleQuestionsChange}
              input={<OutlinedInput label="Questions" />}
              renderValue={(selected) => {
                return `${selected.length} questions selected`;
              }}
            >
              {questions.map((question) => (
                <MenuItem key={question.id} value={question.id}>
                  <Checkbox checked={formData.questions.indexOf(question.id) > -1} />
                  <ListItemText primary={question.text} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Typography variant="h6" gutterBottom sx={{ mt: 4, mb: 2 }}>
            AI Model Configuration
          </Typography>
          
          <Typography variant="body2" color="text.secondary" paragraph>
            Configure which AI models to use for different tasks in this survey. If not specified, the default model (GPT-3.5-turbo) will be used.
          </Typography>

          <LLMConfigSelector
            task="intent_classification"
            value={formData.llmConfigs.intent_classification}
            onChange={(value) => handleLLMConfigChange('intent_classification', value)}
          />

          <LLMConfigSelector
            task="response_generation"
            value={formData.llmConfigs.response_generation}
            onChange={(value) => handleLLMConfigChange('response_generation', value)}
          />

          <LLMConfigSelector
            task="scoring"
            value={formData.llmConfigs.scoring}
            onChange={(value) => handleLLMConfigChange('scoring', value)}
          />

          <LLMConfigSelector
            task="hint_generation"
            value={formData.llmConfigs.hint_generation}
            onChange={(value) => handleLLMConfigChange('hint_generation', value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!formData.title || formData.questions.length === 0}
          >
            {editingSurvey ? 'Save Changes' : 'Create Survey'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmDialog.open} onClose={() => setDeleteConfirmDialog({ open: false, surveyId: null })}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this survey? This action cannot be undone and all responses will be lost.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmDialog({ open: false, surveyId: null })} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleDeleteSurvey} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Survey Link Dialog */}
      <Dialog open={linkDialog.open} onClose={() => setLinkDialog({ open: false, survey: null })}>
        <DialogTitle>Survey Link</DialogTitle>
        <DialogContent>
          <Typography paragraph>
            Share this link with participants to collect responses:
          </Typography>
          
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center',
              p: 2,
              bgcolor: 'background.default',
              borderRadius: 2,
              mb: 2
            }}
          >
            <Typography 
              variant="body1" 
              sx={{ 
                flexGrow: 1,
                fontFamily: 'monospace',
                wordBreak: 'break-all'
              }}
            >
              {linkDialog.survey?.shareableLink}
            </Typography>
          </Box>
          
          <Button
            variant="contained"
            startIcon={<ContentCopyIcon />}
            onClick={() => handleCopyLink(linkDialog.survey?.shareableLink)}
            fullWidth
            sx={{ mt: 2 }}
          >
            Copy Link
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLinkDialog({ open: false, survey: null })}>
            Close
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

export default Surveys;
