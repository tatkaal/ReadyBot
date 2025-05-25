import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Paper, 
  Grid, 
  Button, 
  Chip, 
  Divider, 
  Card, 
  CardContent, 
  TextField,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Tooltip
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

// Icons
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import LinkIcon from '@mui/icons-material/Link';
import VisibilityIcon from '@mui/icons-material/Visibility';
import BarChartIcon from '@mui/icons-material/BarChart';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';

const SurveyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentAdmin } = useAuth();
  
  const [survey, setSurvey] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [availableQuestions, setAvailableQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    isActive: true
  });
  
  // Dialog states
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openAddQuestionsDialog, setOpenAddQuestionsDialog] = useState(false);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [linkCopied, setLinkCopied] = useState(false);
  const [regeneratingLink, setRegeneratingLink] = useState(false);
  
  useEffect(() => {
    fetchSurveyDetails();
    fetchAvailableQuestions();
  }, [id]);
  
  const fetchSurveyDetails = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/surveys/${id}`, {
        headers: {
          'x-auth-token': localStorage.getItem('token')
        }
      });
      
      setSurvey(res.data);
      setQuestions(res.data.questions || []);
      setFormData({
        title: res.data.title,
        description: res.data.description,
        isActive: res.data.isActive
      });
    } catch (err) {
      console.error('Error fetching survey details:', err);
      setError('Failed to load survey details. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchAvailableQuestions = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/questions`, {
        headers: {
          'x-auth-token': localStorage.getItem('token')
        }
      });
      
      setAvailableQuestions(res.data);
    } catch (err) {
      console.error('Error fetching available questions:', err);
    }
  };
  
  const handleInputChange = (e) => {
    const { name, value, checked } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'isActive' ? checked : value
    });
  };
  
  const handleSaveChanges = async () => {
    try {
      setLoading(true);
      
      const questionIds = questions.map(q => q.id);
      
      const res = await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/surveys/${id}`, {
        ...formData,
        questions: questionIds
      }, {
        headers: {
          'x-auth-token': localStorage.getItem('token')
        }
      });
      
      setSurvey(res.data);
      setEditMode(false);
    } catch (err) {
      console.error('Error updating survey:', err);
      setError('Failed to update survey. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteSurvey = async () => {
    try {
      setLoading(true);
      
      await axios.delete(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/surveys/${id}`, {
        headers: {
          'x-auth-token': localStorage.getItem('token')
        }
      });
      
      navigate('/surveys');
    } catch (err) {
      console.error('Error deleting survey:', err);
      setError('Failed to delete survey. Please try again.');
      setOpenDeleteDialog(false);
    } finally {
      setLoading(false);
    }
  };
  
  const handleAddQuestions = () => {
    if (selectedQuestions.length === 0) {
      setOpenAddQuestionsDialog(false);
      return;
    }
    
    const newQuestions = [
      ...questions,
      ...availableQuestions.filter(q => selectedQuestions.includes(q.id) && !questions.some(existing => existing.id === q.id))
    ];
    
    setQuestions(newQuestions);
    setSelectedQuestions([]);
    setOpenAddQuestionsDialog(false);
  };
  
  const handleRemoveQuestion = (questionId) => {
    setQuestions(questions.filter(q => q.id !== questionId));
  };
  
  const handleQuestionSelection = (questionId) => {
    if (selectedQuestions.includes(questionId)) {
      setSelectedQuestions(selectedQuestions.filter(id => id !== questionId));
    } else {
      setSelectedQuestions([...selectedQuestions, questionId]);
    }
  };
  
  const handleCopyLink = () => {
    if (survey?.shareableLink) {
      navigator.clipboard.writeText(survey.shareableLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  };
  
  const handleRegenerateLink = async () => {
    try {
      setRegeneratingLink(true);
      
      const res = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/surveys/${id}/generate-link`, {}, {
        headers: {
          'x-auth-token': localStorage.getItem('token')
        }
      });
      
      setSurvey({
        ...survey,
        uniqueId: res.data.uniqueId,
        shareableLink: res.data.shareableLink
      });
    } catch (err) {
      console.error('Error regenerating link:', err);
      setError('Failed to regenerate link. Please try again.');
    } finally {
      setRegeneratingLink(false);
    }
  };
  
  const handlePreviewSurvey = () => {
    if (survey?.uniqueId) {
      window.open(`/survey/${survey.uniqueId}`, '_blank');
    }
  };
  
  const handleViewResponses = () => {
    navigate(`/responses/${id}`);
  };
  
  if (loading && !survey) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error && !survey) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
        <Button variant="contained" onClick={() => navigate('/surveys')} sx={{ mt: 2 }}>
          Back to Surveys
        </Button>
      </Box>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Paper elevation={0} sx={{ p: 3, borderRadius: 3, mb: 4, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box>
              <Typography variant="overline" color="text.secondary">
                Survey Details
              </Typography>
              
              {!editMode ? (
                <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
                  {survey?.title}
                </Typography>
              ) : (
                <TextField
                  fullWidth
                  label="Survey Title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  margin="normal"
                  variant="outlined"
                  required
                />
              )}
            </Box>
            
            <Box>
              {!editMode ? (
                <>
                  <Button
                    variant="outlined"
                    startIcon={<EditIcon />}
                    onClick={() => setEditMode(true)}
                    sx={{ mr: 1 }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => setOpenDeleteDialog(true)}
                  >
                    Delete
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setEditMode(false);
                      setFormData({
                        title: survey.title,
                        description: survey.description,
                        isActive: survey.isActive
                      });
                      setQuestions(survey.questions || []);
                    }}
                    sx={{ mr: 1 }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleSaveChanges}
                    disabled={loading}
                  >
                    Save Changes
                  </Button>
                </>
              )}
            </Box>
          </Box>
          
          <Chip 
            label={survey?.isActive ? 'Active' : 'Inactive'} 
            color={survey?.isActive ? 'success' : 'default'}
            icon={survey?.isActive ? <CheckCircleIcon /> : <ErrorIcon />}
            sx={{ mb: 2 }}
          />
          
          {!editMode ? (
            <Typography variant="body1" paragraph>
              {survey?.description}
            </Typography>
          ) : (
            <TextField
              fullWidth
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              margin="normal"
              variant="outlined"
              multiline
              rows={3}
            />
          )}
          
          <Box sx={{ mt: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <LinkIcon color="primary" sx={{ mr: 1 }} />
                      <Typography variant="h6" component="h2">
                        Shareable Link
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <TextField
                        fullWidth
                        value={survey?.shareableLink || 'No link generated yet'}
                        variant="outlined"
                        size="small"
                        InputProps={{
                          readOnly: true,
                        }}
                        sx={{ mr: 1 }}
                      />
                      <Tooltip title="Copy link">
                        <IconButton onClick={handleCopyLink} color={linkCopied ? 'success' : 'default'}>
                          <ContentCopyIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                    
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={handleRegenerateLink}
                        disabled={regeneratingLink}
                        startIcon={regeneratingLink ? <CircularProgress size={20} /> : <LinkIcon />}
                      >
                        Regenerate Link
                      </Button>
                      
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={handlePreviewSurvey}
                        startIcon={<VisibilityIcon />}
                        disabled={!survey?.shareableLink}
                      >
                        Preview
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <BarChartIcon color="primary" sx={{ mr: 1 }} />
                      <Typography variant="h6" component="h2">
                        Survey Stats
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Questions:
                      </Typography>
                      <Typography variant="body1" fontWeight={500}>
                        {questions.length}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Status:
                      </Typography>
                      <Typography variant="body1" fontWeight={500}>
                        {survey?.isActive ? 'Active' : 'Inactive'}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Created:
                      </Typography>
                      <Typography variant="body1" fontWeight={500}>
                        {new Date(survey?.createdAt).toLocaleDateString()}
                      </Typography>
                    </Box>
                    
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={handleViewResponses}
                      startIcon={<BarChartIcon />}
                    >
                      View Responses
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        </Paper>
        
        <Paper elevation={0} sx={{ p: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" component="h2" sx={{ fontWeight: 600 }}>
              Survey Questions
            </Typography>
            
            {editMode && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setOpenAddQuestionsDialog(true)}
              >
                Add Questions
              </Button>
            )}
          </Box>
          
          {questions.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <QuestionAnswerIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No questions added to this survey yet
              </Typography>
              {editMode && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setOpenAddQuestionsDialog(true)}
                  sx={{ mt: 2 }}
                >
                  Add Questions
                </Button>
              )}
            </Box>
          ) : (
            <Box>
              {questions.map((question, index) => (
                <motion.div
                  key={question.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2,
                      mb: 2,
                      borderRadius: 2,
                      position: 'relative',
                      '&:hover': {
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                      <Box
                        sx={{
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          bgcolor: 'primary.main',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mr: 2,
                          mt: 0.5,
                          fontWeight: 600,
                        }}
                      >
                        {index + 1}
                      </Box>
                      
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {question.text}
                        </Typography>
                        
                        {question.qualityGuidelines && (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            <strong>Quality Guidelines:</strong> {question.qualityGuidelines}
                          </Typography>
                        )}
                      </Box>
                      
                      {editMode && (
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleRemoveQuestion(question.id)}
                          sx={{ ml: 1 }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                  </Paper>
                </motion.div>
              ))}
            </Box>
          )}
        </Paper>
      </motion.div>
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
      >
        <DialogTitle>Delete Survey</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this survey? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
          <Button onClick={handleDeleteSurvey} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Add Questions Dialog */}
      <Dialog
        open={openAddQuestionsDialog}
        onClose={() => setOpenAddQuestionsDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Add Questions to Survey</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Select questions to add to your survey. You can select multiple questions.
            </Typography>
          </Box>
          
          {availableQuestions
            .filter(q => !questions.some(existing => existing.id === q.id))
            .length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <Typography variant="body1" color="text.secondary">
                No more questions available. Create new questions in the Questions section.
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={2}>
              {availableQuestions
                .filter(q => !questions.some(existing => existing.id === q.id))
                .map((question) => (
                  <Grid item xs={12} key={question.id}>
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        cursor: 'pointer',
                        bgcolor: selectedQuestions.includes(question.id) ? 'rgba(98, 0, 234, 0.05)' : 'transparent',
                        borderColor: selectedQuestions.includes(question.id) ? 'primary.main' : 'divider',
                        '&:hover': {
                          borderColor: 'primary.main',
                        },
                      }}
                      onClick={() => handleQuestionSelection(question.id)}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {question.text}
                          </Typography>
                          
                          {question.qualityGuidelines && (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                              <strong>Quality Guidelines:</strong> {question.qualityGuidelines}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </Paper>
                  </Grid>
                ))}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddQuestionsDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleAddQuestions} 
            variant="contained"
            disabled={selectedQuestions.length === 0}
          >
            Add Selected ({selectedQuestions.length})
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default SurveyDetail;
