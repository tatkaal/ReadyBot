import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Card, CardContent, Paper, CircularProgress, Button, Tabs, Tab, Divider, Chip, Avatar, TextField, FormControl, InputLabel, Select, MenuItem, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Alert } from '@mui/material';
import { motion } from 'framer-motion';
import axios from 'axios';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement } from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { useNavigate } from 'react-router-dom';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloseIcon from '@mui/icons-material/Close';

// Icons
import AssessmentIcon from '@mui/icons-material/Assessment';
import CompareIcon from '@mui/icons-material/Compare';
import SpeedIcon from '@mui/icons-material/Speed';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import StarIcon from '@mui/icons-material/Star';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import AddIcon from '@mui/icons-material/Add';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement);

const Evaluation = () => {
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [selectedEvaluation, setSelectedEvaluation] = useState(null);
  const [newEvaluation, setNewEvaluation] = useState({
    name: '',
    description: '',
    models: [
      { name: 'gpt-4.1', costPerToken: 0.00006 },
      { name: 'gpt-4.1-mini', costPerToken: 0.00003 }
    ]
  });
  const [runningEvaluation, setRunningEvaluation] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const navigate = useNavigate();
  
  const availableModels = [
    { name: 'gpt-4.1', costPerToken: 0.00006, description: 'Full GPT-4 model with maximum capabilities' },
    { name: 'gpt-4.1-mini', costPerToken: 0.00003, description: 'Optimized for faster responses with slightly reduced quality' },
    { name: 'gpt-4.1-nano', costPerToken: 0.000015, description: 'Lightweight version for cost-sensitive applications' }
  ];

  useEffect(() => {
    console.log('Component mounted');
    fetchEvaluations();
  }, []);

  const fetchEvaluations = async () => {
    try {
      console.log('Fetching evaluations...');
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      console.log('Token exists:', !!token);

      if (!token) {
        console.log('No token found');
        setError('Please log in to view evaluations');
        setLoading(false);
        return;
      }

      const apiUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/evaluation`;
      console.log('API URL:', apiUrl);

      const res = await axios.get(apiUrl, {
        headers: {
          'x-auth-token': token
        }
      });
      
      console.log('API Response:', res.data);
      
      if (!res.data) {
        console.log('No data in response');
        setEvaluations([]);
      } else {
        console.log('Setting evaluations:', res.data);
        setEvaluations(Array.isArray(res.data) ? res.data : []);
      }
      
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        console.log('Setting selected evaluation:', res.data[0]);
        setSelectedEvaluation(res.data[0]);
      }
    } catch (err) {
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      
      if (err.response?.status === 401) {
        setError('Please log in to view evaluations');
      } else {
        setError(`Failed to load model evaluations: ${err.message}`);
      }
    } finally {
      console.log('Fetch completed, setting loading to false');
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewEvaluation({
      ...newEvaluation,
      [name]: value
    });
  };

  const handleModelChange = (index, value) => {
    const updatedModels = [...newEvaluation.models];
    const selectedModel = availableModels.find(model => model.name === value);
    updatedModels[index] = {
      ...selectedModel
    };
    
    setNewEvaluation({
      ...newEvaluation,
      models: updatedModels
    });
  };

  const handleCreateEvaluation = async () => {
    try {
      setRunningEvaluation(true);
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in to create evaluations');
        return;
      }
      
      // Create evaluation
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/evaluation`,
        newEvaluation,
        {
          headers: {
            'x-auth-token': token
          }
        }
      );
      
      // Run evaluation
      await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/evaluation/${res.data.id}/run`,
        {},
        {
          headers: {
            'x-auth-token': token
          }
        }
      );
      
      // Refresh evaluations
      fetchEvaluations();
      
      // Reset form
      setNewEvaluation({
        name: '',
        description: '',
        models: [
          { name: 'gpt-4', costPerToken: 0.00006 },
          { name: 'gpt-3.5-turbo', costPerToken: 0.000002 }
        ]
      });
      
      // Switch to results tab
      setTabValue(0);
    } catch (err) {
      console.error('Error creating evaluation:', err);
      if (err.response?.status === 401) {
        setError('Please log in to create evaluations');
      } else {
        setError('Failed to create and run evaluation');
      }
    } finally {
      setRunningEvaluation(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this evaluation?')) {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Please log in to delete evaluations');
          return;
        }

        await axios.delete(
          `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/evaluation/${id}`,
          {
            headers: {
              'x-auth-token': token
            }
          }
        );
        fetchEvaluations();
      } catch (error) {
        console.error('Error deleting evaluation:', error);
        if (error.response?.status === 401) {
          setError('Please log in to delete evaluations');
        } else {
          setError('Failed to delete evaluation');
        }
      }
    }
  };

  const handleRunEvaluation = async (id) => {
    try {
      setRunningEvaluation(true);
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in to run evaluations');
        return;
      }

      await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/evaluation/${id}/run`,
        {},
        {
          headers: {
            'x-auth-token': token
          }
        }
      );
      fetchEvaluations();
    } catch (error) {
      console.error('Error running evaluation:', error);
      if (error.response?.status === 401) {
        setError('Please log in to run evaluations');
      } else {
        setError('Failed to run evaluation');
      }
    } finally {
      setRunningEvaluation(false);
    }
  };

  const handleViewDetails = (evaluation) => {
    setSelectedEvaluation(evaluation);
    setOpenDialog(true);
  };

  const prepareChartData = (evaluation) => {
    if (!evaluation || !evaluation.results) return null;
    
    const models = evaluation.results.map(result => result.modelName);
    const qualityScores = evaluation.results.map(result => result.averageQualityScore || 0);
    const responseTimes = evaluation.results.map(result => result.averageResponseTime || 0);
    const costs = evaluation.results.map(result => result.totalCost || 0);
    
    return {
      labels: models,
      datasets: [
        {
          label: 'Quality Score',
          data: qualityScores,
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1
        },
        {
          label: 'Response Time (ms)',
          data: responseTimes,
          borderColor: 'rgb(255, 99, 132)',
          tension: 0.1
        },
        {
          label: 'Cost ($)',
          data: costs,
          borderColor: 'rgb(54, 162, 235)',
          tension: 0.1
        }
      ]
    };
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Model Performance Comparison'
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
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

  if (loading) {
    console.log('Rendering loading state');
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  console.log('Rendering main component', {
    evaluations,
    selectedEvaluation,
    error,
    tabValue
  });

  const chartData = selectedEvaluation ? prepareChartData(selectedEvaluation) : null;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <Box sx={{ mb: 4 }}>
        <motion.div variants={itemVariants}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
            Model Evaluation
          </Typography>
        </motion.div>
        
        <motion.div variants={itemVariants}>
          <Typography variant="body1" color="text.secondary" paragraph>
            Compare different LLM models to find the best balance of quality, speed, and cost for your surveys.
          </Typography>
        </motion.div>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <motion.div variants={itemVariants}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="evaluation tabs">
            <Tab label="Evaluation Results" />
            <Tab label="Run New Evaluation" />
          </Tabs>
        </Box>
      </motion.div>
      
      {/* Results Tab */}
      {tabValue === 0 && (
        <Box>
          {!evaluations || evaluations.length === 0 ? (
            <motion.div variants={itemVariants}>
              <Paper elevation={0} sx={{ p: 4, textAlign: 'center', borderRadius: 3, bgcolor: 'background.default' }}>
                <Typography variant="h6" gutterBottom>
                  No evaluations yet
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Run your first model evaluation to compare different LLMs.
                </Typography>
                <Button 
                  variant="contained" 
                  onClick={() => setTabValue(1)}
                  sx={{ mt: 2 }}
                >
                  Run New Evaluation
                </Button>
              </Paper>
            </motion.div>
          ) : (
            <Grid container spacing={3}>
              <Grid item xs={12} md={3}>
                <motion.div variants={itemVariants}>
                  <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                      Evaluations
                    </Typography>
                    
                    <Box sx={{ mt: 2 }}>
                      {evaluations.map((evaluation) => (
                        <Card 
                          key={evaluation.id} 
                          elevation={1} 
                          sx={{ 
                            mb: 2, 
                            borderRadius: 2,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            bgcolor: selectedEvaluation?.id === evaluation.id ? 'primary.light' : 'background.paper',
                            color: selectedEvaluation?.id === evaluation.id ? 'white' : 'inherit',
                            '&:hover': {
                              bgcolor: selectedEvaluation?.id === evaluation.id ? 'primary.light' : 'background.default',
                            }
                          }}
                          onClick={() => setSelectedEvaluation(evaluation)}
                        >
                          <CardContent sx={{ p: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <Box>
                                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                  {evaluation.name || 'Unnamed Evaluation'}
                                </Typography>
                                
                                <Typography variant="caption" color={selectedEvaluation?.id === evaluation.id ? 'inherit' : 'text.secondary'}>
                                  {evaluation.createdAt ? new Date(evaluation.createdAt).toLocaleDateString() : 'No date'}
                                </Typography>
                                
                                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                  <Chip 
                                    label={`${evaluation.models?.length || 0} models`} 
                                    size="small"
                                    sx={{ 
                                      mr: 1,
                                      bgcolor: selectedEvaluation?.id === evaluation.id 
                                        ? 'rgba(255,255,255,0.3)'
                                        : undefined
                                    }}
                                  />
                                  
                                  {evaluation.status === 'completed' ? (
                                    <Chip 
                                      label="Completed" 
                                      size="small"
                                      color="success"
                                      sx={{ 
                                        bgcolor: selectedEvaluation?.id === evaluation.id 
                                          ? 'rgba(255,255,255,0.3)'
                                          : undefined
                                      }}
                                    />
                                  ) : evaluation.status === 'running' ? (
                                    <Chip 
                                      label="Running" 
                                      size="small"
                                      color="warning"
                                      sx={{ 
                                        bgcolor: selectedEvaluation?.id === evaluation.id 
                                          ? 'rgba(255,255,255,0.3)'
                                          : undefined
                                      }}
                                    />
                                  ) : (
                                    <Chip 
                                      label="Failed" 
                                      size="small"
                                      color="error"
                                      sx={{ 
                                        bgcolor: selectedEvaluation?.id === evaluation.id 
                                          ? 'rgba(255,255,255,0.3)'
                                          : undefined
                                      }}
                                    />
                                  )}
                                </Box>
                              </Box>
                              
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleViewDetails(evaluation);
                                  }}
                                  sx={{ 
                                    color: selectedEvaluation?.id === evaluation.id ? 'white' : 'inherit'
                                  }}
                                >
                                  <VisibilityIcon fontSize="small" />
                                </IconButton>
                                
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(evaluation.id);
                                  }}
                                  sx={{ 
                                    color: selectedEvaluation?.id === evaluation.id ? 'white' : 'inherit'
                                  }}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Box>
                            </Box>
                          </CardContent>
                        </Card>
                      ))}
                    </Box>
                    
                    <Button 
                      variant="outlined" 
                      fullWidth
                      onClick={() => setTabValue(1)}
                      sx={{ mt: 2 }}
                    >
                      Run New Evaluation
                    </Button>
                  </Paper>
                </motion.div>
              </Grid>
              
              <Grid item xs={12} md={9}>
                {selectedEvaluation ? (
                  <motion.div variants={itemVariants}>
                    <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
                      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                        {selectedEvaluation.name || 'Unnamed Evaluation'}
                      </Typography>
                      
                      {selectedEvaluation.description && (
                        <Typography variant="body2" color="text.secondary" paragraph>
                          {selectedEvaluation.description}
                        </Typography>
                      )}
                      
                      <Divider sx={{ my: 2 }} />
                      
                      {selectedEvaluation.status === 'completed' ? (
                        selectedEvaluation.results && selectedEvaluation.results.length > 0 ? (
                          <Box>
                            <Typography variant="body1" gutterBottom>
                              Evaluation Results
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              This evaluation was run with {selectedEvaluation.results.length} models.
                            </Typography>
                          </Box>
                        ) : (
                          <Box sx={{ textAlign: 'center', py: 4 }}>
                            <Typography variant="body1" color="text.secondary">
                              This evaluation was run before the latest updates. Run a new evaluation to see detailed metrics.
                            </Typography>
                            <Button 
                              variant="contained" 
                              onClick={() => setTabValue(1)}
                              sx={{ mt: 2 }}
                            >
                              Run New Evaluation
                            </Button>
                          </Box>
                        )
                      ) : selectedEvaluation.status === 'running' ? (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                          <CircularProgress size={60} sx={{ mb: 3 }} />
                          <Typography variant="h6" gutterBottom>
                            Evaluation in Progress
                          </Typography>
                          <Typography variant="body2" color="text.secondary" paragraph>
                            The model evaluation is currently running. This may take a few minutes to complete.
                          </Typography>
                          <Button 
                            variant="contained" 
                            onClick={fetchEvaluations}
                            sx={{ mt: 2 }}
                          >
                            Refresh Status
                          </Button>
                        </Box>
                      ) : (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                          <Typography variant="h6" color="error" gutterBottom>
                            Evaluation Failed
                          </Typography>
                          <Typography variant="body2" color="text.secondary" paragraph>
                            The evaluation encountered an error. Please try running it again.
                          </Typography>
                          <Button 
                            variant="contained" 
                            onClick={() => handleRunEvaluation(selectedEvaluation.id)}
                            sx={{ mt: 2 }}
                          >
                            Retry Evaluation
                          </Button>
                        </Box>
                      )}
                    </Paper>
                  </motion.div>
                ) : (
                  <motion.div variants={itemVariants}>
                    <Paper elevation={2} sx={{ p: 4, borderRadius: 3, textAlign: 'center' }}>
                      <Typography variant="h6" gutterBottom>
                        Select an Evaluation
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Please select an evaluation from the list to view detailed results.
                      </Typography>
                    </Paper>
                  </motion.div>
                )}
              </Grid>
            </Grid>
          )}
        </Box>
      )}
      
      {/* Run New Evaluation Tab */}
      {tabValue === 1 && (
        <motion.div variants={itemVariants}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Run New Model Evaluation
            </Typography>
            
            <Typography variant="body2" color="text.secondary" paragraph>
              Compare different LLM models to find the best balance of quality, speed, and cost for your surveys.
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  label="Evaluation Name"
                  name="name"
                  value={newEvaluation.name}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  variant="outlined"
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  label="Description (Optional)"
                  name="description"
                  value={newEvaluation.description}
                  onChange={handleInputChange}
                  fullWidth
                  multiline
                  rows={2}
                  variant="outlined"
                />
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, mt: 2 }}>
                  Models to Compare
                </Typography>
              </Grid>
              
              {newEvaluation.models.map((model, index) => (
                <Grid item xs={12} md={6} key={index}>
                  <FormControl fullWidth>
                    <InputLabel>Model {index + 1}</InputLabel>
                    <Select
                      value={model.name}
                      onChange={(e) => handleModelChange(index, e.target.value)}
                      label={`Model ${index + 1}`}
                    >
                      {availableModels.map((availableModel) => (
                        <MenuItem 
                          key={availableModel.name} 
                          value={availableModel.name}
                          disabled={newEvaluation.models.some(m => m.name === availableModel.name && m !== model)}
                        >
                          <Box>
                            <Typography variant="body1">{availableModel.name}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {availableModel.description}
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              ))}
              
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                  <Button 
                    variant="outlined" 
                    onClick={() => setTabValue(0)}
                    sx={{ mr: 2 }}
                  >
                    Cancel
                  </Button>
                  
                  <Button
                    variant="contained"
                    onClick={handleCreateEvaluation}
                    startIcon={<AddIcon />}
                    sx={{
                      bgcolor: '#26d07c',
                      '&:hover': {
                        bgcolor: '#1a9d5d',
                      },
                    }}
                  >
                    {runningEvaluation ? 'Running...' : 'Run Evaluation'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </motion.div>
      )}

      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedEvaluation?.name || 'Evaluation Details'}
          <IconButton
            aria-label="close"
            onClick={() => setOpenDialog(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedEvaluation && (
            <Box sx={{ mt: 2 }}>
              {selectedEvaluation.status === 'completed' && (
                <>
                  <Box mb={3}>
                    <Typography variant="h6" gutterBottom>Performance Chart</Typography>
                    <Line data={prepareChartData(selectedEvaluation)} options={chartOptions} />
                  </Box>

                  <Typography variant="h6" gutterBottom>Test Cases</Typography>
                  <TableContainer component={Paper}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Question</TableCell>
                          <TableCell>Expected Keywords</TableCell>
                          <TableCell>Complexity</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedEvaluation.testCases?.map((testCase, index) => (
                          <TableRow key={index}>
                            <TableCell>{testCase.question}</TableCell>
                            <TableCell>
                              {testCase.expectedKeywords.map((keyword, i) => (
                                <Chip key={i} label={keyword} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                              ))}
                            </TableCell>
                            <TableCell>{testCase.complexity}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Model Results</Typography>
                  <TableContainer component={Paper}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Model</TableCell>
                          <TableCell>Quality Score</TableCell>
                          <TableCell>Completeness</TableCell>
                          <TableCell>Token Usage</TableCell>
                          <TableCell>Cost</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedEvaluation.results?.map((result, index) => (
                          <TableRow key={index}>
                            <TableCell>{result.modelName || 'Unknown Model'}</TableCell>
                            <TableCell>
                              {result.averageQualityScore ? result.averageQualityScore.toFixed(2) : 'N/A'}
                            </TableCell>
                            <TableCell>
                              {result.averageCompleteness ? result.averageCompleteness.toFixed(2) : 'N/A'}
                            </TableCell>
                            <TableCell>
                              {result.tokenUsage?.total ? result.tokenUsage.total.toLocaleString() : 'N/A'}
                            </TableCell>
                            <TableCell>
                              {result.totalCost ? `$${result.totalCost.toFixed(4)}` : 'N/A'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Model Comparisons</Typography>
                  <TableContainer component={Paper}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Model A</TableCell>
                          <TableCell>Model B</TableCell>
                          <TableCell>Winner</TableCell>
                          <TableCell>Quality Difference</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedEvaluation.modelComparisons?.map((comparison, index) => (
                          <TableRow key={index}>
                            <TableCell>{comparison.modelA || 'Unknown'}</TableCell>
                            <TableCell>{comparison.modelB || 'Unknown'}</TableCell>
                            <TableCell>{comparison.comparison?.winner || 'N/A'}</TableCell>
                            <TableCell>
                              {comparison.comparison?.qualityDifference 
                                ? comparison.comparison.qualityDifference.toFixed(2)
                                : 'N/A'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              )}
              {selectedEvaluation.status === 'running' && (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
                  <CircularProgress />
                  <Typography variant="h6" sx={{ mt: 2 }}>
                    Evaluation in Progress
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    This may take a few minutes to complete.
                  </Typography>
                </Box>
              )}
              {selectedEvaluation.status === 'failed' && (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
                  <Typography variant="h6" color="error">
                    Evaluation Failed
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Please try running the evaluation again.
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </motion.div>
  );
};

export default Evaluation;
