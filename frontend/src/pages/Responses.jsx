import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Card, CardContent, Paper, CircularProgress, Button, Tabs, Tab, Divider, Chip, Avatar } from '@mui/material';
import { motion } from 'framer-motion';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';

// Icons
import AssessmentIcon from '@mui/icons-material/Assessment';
import PeopleIcon from '@mui/icons-material/People';
import StarIcon from '@mui/icons-material/Star';
import StarHalfIcon from '@mui/icons-material/StarHalf';
import StarOutlineIcon from '@mui/icons-material/StarOutline';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PersonIcon from '@mui/icons-material/Person';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const Responses = () => {
  const { surveyId } = useParams();
  const [survey, setSurvey] = useState(null);
  const [responses, setResponses] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [selectedResponse, setSelectedResponse] = useState(null);
  
  useEffect(() => {
    fetchData();
  }, [surveyId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch survey details
      const surveyRes = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/surveys/${surveyId}`);
      setSurvey(surveyRes.data);
      
      // Fetch responses
      const responsesRes = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/responses/survey/${surveyId}`);
      setResponses(responsesRes.data);
      
      // Fetch analytics
      const analyticsRes = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/responses/analytics/${surveyId}`);
      setAnalytics(analyticsRes.data);
      
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load response data');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleViewResponse = (response) => {
    setSelectedResponse(response);
    setTabValue(1); // Switch to individual response tab
  };

  const renderStarRating = (score) => {
    const fullStars = Math.floor(score);
    const hasHalfStar = score % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    return (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        {[...Array(fullStars)].map((_, i) => (
          <StarIcon key={`full-${i}`} sx={{ color: '#FFD700' }} />
        ))}
        {hasHalfStar && <StarHalfIcon sx={{ color: '#FFD700' }} />}
        {[...Array(emptyStars)].map((_, i) => (
          <StarOutlineIcon key={`empty-${i}`} sx={{ color: '#FFD700' }} />
        ))}
        <Typography variant="body2" sx={{ ml: 1 }}>
          {score.toFixed(1)}
        </Typography>
      </Box>
    );
  };

  const prepareChartData = () => {
    if (!analytics || !analytics.questionScores) return null;
    
    const questionIds = Object.keys(analytics.questionScores);
    
    const barData = {
      labels: questionIds.map(id => analytics.questionScores[id].questionText.substring(0, 30) + (analytics.questionScores[id].questionText.length > 30 ? '...' : '')),
      datasets: [
        {
          label: 'Average Quality Score',
          data: questionIds.map(id => analytics.questionScores[id].averageScore),
          backgroundColor: 'rgba(98, 0, 234, 0.6)',
          borderColor: 'rgba(98, 0, 234, 1)',
          borderWidth: 1,
        },
      ],
    };
    
    const pieData = {
      labels: ['Completed', 'Incomplete'],
      datasets: [
        {
          data: [analytics.completedResponses, analytics.totalResponses - analytics.completedResponses],
          backgroundColor: ['rgba(0, 224, 150, 0.6)', 'rgba(255, 61, 113, 0.6)'],
          borderColor: ['rgba(0, 224, 150, 1)', 'rgba(255, 61, 113, 1)'],
          borderWidth: 1,
        },
      ],
    };
    
    return { barData, pieData };
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
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ textAlign: 'center', py: 6 }}>
        <Typography variant="h6" color="error" gutterBottom>
          {error}
        </Typography>
        <Button variant="contained" href="/surveys" sx={{ mt: 2 }}>
          Back to Surveys
        </Button>
      </Box>
    );
  }

  const chartData = prepareChartData();

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <Box sx={{ mb: 4 }}>
        <motion.div variants={itemVariants}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
            Survey Responses
          </Typography>
        </motion.div>
        
        <motion.div variants={itemVariants}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {survey?.title}
          </Typography>
        </motion.div>
        
        <motion.div variants={itemVariants}>
          <Button variant="outlined" href="/surveys" sx={{ mt: 1 }}>
            Back to Surveys
          </Button>
        </motion.div>
      </Box>
      
      <motion.div variants={itemVariants}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="response tabs">
            <Tab label="Overview" />
            <Tab label="Individual Responses" />
          </Tabs>
        </Box>
      </motion.div>
      
      {/* Overview Tab */}
      {tabValue === 0 && (
        <Box>
          {responses.length === 0 ? (
            <motion.div variants={itemVariants}>
              <Paper elevation={0} sx={{ p: 4, textAlign: 'center', borderRadius: 3, bgcolor: 'background.default' }}>
                <Typography variant="h6" gutterBottom>
                  No responses yet
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Share your survey link with participants to collect responses.
                </Typography>
                <Button variant="contained" href={`/surveys/${surveyId}`} sx={{ mt: 2 }}>
                  View Survey Details
                </Button>
              </Paper>
            </motion.div>
          ) : (
            <>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6} lg={3}>
                  <motion.div variants={itemVariants}>
                    <Card elevation={2} sx={{ borderRadius: 3 }}>
                      <CardContent sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              Total Responses
                            </Typography>
                            <Typography variant="h4" component="div" sx={{ fontWeight: 700 }}>
                              {analytics?.totalResponses || 0}
                            </Typography>
                          </Box>
                          
                          <Box 
                            sx={{ 
                              bgcolor: 'primary.light', 
                              opacity: 0.1,
                              borderRadius: '50%', 
                              width: 48, 
                              height: 48, 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              color: 'primary.main'
                            }}
                          >
                            <PeopleIcon />
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>
                
                <Grid item xs={12} md={6} lg={3}>
                  <motion.div variants={itemVariants}>
                    <Card elevation={2} sx={{ borderRadius: 3 }}>
                      <CardContent sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              Completion Rate
                            </Typography>
                            <Typography variant="h4" component="div" sx={{ fontWeight: 700 }}>
                              {analytics?.completionRate?.toFixed(0) || 0}%
                            </Typography>
                          </Box>
                          
                          <Box 
                            sx={{ 
                              bgcolor: 'success.light', 
                              opacity: 0.1,
                              borderRadius: '50%', 
                              width: 48, 
                              height: 48, 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              color: 'success.main'
                            }}
                          >
                            <TrendingUpIcon />
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>
                
                <Grid item xs={12} md={6} lg={3}>
                  <motion.div variants={itemVariants}>
                    <Card elevation={2} sx={{ borderRadius: 3 }}>
                      <CardContent sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              Completed
                            </Typography>
                            <Typography variant="h4" component="div" sx={{ fontWeight: 700 }}>
                              {analytics?.completedResponses || 0}
                            </Typography>
                          </Box>
                          
                          <Box 
                            sx={{ 
                              bgcolor: 'info.light', 
                              opacity: 0.1,
                              borderRadius: '50%', 
                              width: 48, 
                              height: 48, 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              color: 'info.main'
                            }}
                          >
                            <AssessmentIcon />
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>
                
                <Grid item xs={12} md={6} lg={3}>
                  <motion.div variants={itemVariants}>
                    <Card elevation={2} sx={{ borderRadius: 3 }}>
                      <CardContent sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              Avg. Quality Score
                            </Typography>
                            <Typography variant="h4" component="div" sx={{ fontWeight: 700 }}>
                              {(Object.values(analytics?.questionScores || {}).reduce((sum, q) => sum + q.averageScore, 0) / 
                               (Object.values(analytics?.questionScores || {}).length || 1)).toFixed(2)}
                              /5
                            </Typography>
                          </Box>
                          
                          <Box 
                            sx={{ 
                              bgcolor: 'warning.light', 
                              opacity: 0.1,
                              borderRadius: '50%', 
                              width: 48, 
                              height: 48, 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              color: 'warning.main'
                            }}
                          >
                            <StarIcon />
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>
                
                {chartData && (
                  <>
                    <Grid item xs={12} md={8}>
                      <motion.div variants={itemVariants}>
                        <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
                          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                            Quality Scores by Question
                          </Typography>
                          <Box sx={{ height: 300 }}>
                            <Bar 
                              data={chartData.barData}
                              options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                scales: {
                                  y: {
                                    beginAtZero: true,
                                    max: 5,
                                    ticks: {
                                      stepSize: 1
                                    }
                                  }
                                }
                              }}
                            />
                          </Box>
                        </Paper>
                      </motion.div>
                    </Grid>
                    
                    <Grid item xs={12} md={4}>
                      <motion.div variants={itemVariants}>
                        <Paper elevation={2} sx={{ p: 3, borderRadius: 3, height: '100%' }}>
                          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                            Completion Status
                          </Typography>
                          <Box sx={{ height: 250, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <Pie 
                              data={chartData.pieData}
                              options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                  legend: {
                                    position: 'bottom'
                                  }
                                }
                              }}
                            />
                          </Box>
                        </Paper>
                      </motion.div>
                    </Grid>
                  </>
                )}
              </Grid>
            </>
          )}
        </Box>
      )}
      
      {/* Individual Responses Tab */}
      {tabValue === 1 && (
        <Box>
          {responses.length === 0 ? (
            <motion.div variants={itemVariants}>
              <Paper elevation={0} sx={{ p: 4, textAlign: 'center', borderRadius: 3, bgcolor: 'background.default' }}>
                <Typography variant="h6" gutterBottom>
                  No responses yet
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Share your survey link with participants to collect responses.
                </Typography>
                <Button variant="contained" href={`/surveys/${surveyId}`} sx={{ mt: 2 }}>
                  View Survey Details
                </Button>
              </Paper>
            </motion.div>
          ) : (
            <Grid container spacing={3}>
              <Grid item xs={12} md={selectedResponse ? 4 : 12}>
                <motion.div variants={itemVariants}>
                  <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                      All Responses
                    </Typography>
                    
                    <Box sx={{ mt: 2 }}>
                      {responses.map((response) => (
                        <Card 
                          key={response.id} 
                          elevation={1} 
                          sx={{ 
                            mb: 2, 
                            borderRadius: 2,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            bgcolor: selectedResponse?.id === response.id ? 'primary.light' : 'background.paper',
                            color: selectedResponse?.id === response.id ? 'white' : 'inherit',
                            '&:hover': {
                              bgcolor: selectedResponse?.id === response.id ? 'primary.light' : 'background.default',
                            }
                          }}
                          onClick={() => handleViewResponse(response)}
                        >
                          <CardContent sx={{ p: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Avatar 
                                  sx={{ 
                                    bgcolor: selectedResponse?.id === response.id ? 'white' : 'primary.light',
                                    color: selectedResponse?.id === response.id ? 'primary.main' : 'white',
                                    width: 32, 
                                    height: 32,
                                    mr: 1.5
                                  }}
                                >
                                  <PersonIcon fontSize="small" />
                                </Avatar>
                                <Box>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                    Participant {response.participantId.substring(0, 6)}
                                  </Typography>
                                  <Typography variant="caption" color={selectedResponse?.id === response.id ? 'inherit' : 'text.secondary'}>
                                    {new Date(response.startedAt).toLocaleString()}
                                  </Typography>
                                </Box>
                              </Box>
                              
                              <Chip 
                                label={response.completedAt ? 'Completed' : 'In Progress'} 
                                size="small"
                                color={response.completedAt ? 'success' : 'warning'}
                                sx={{ 
                                  bgcolor: selectedResponse?.id === response.id 
                                    ? (response.completedAt ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.2)') 
                                    : undefined
                                }}
                              />
                            </Box>
                          </CardContent>
                        </Card>
                      ))}
                    </Box>
                  </Paper>
                </motion.div>
              </Grid>
              
              {selectedResponse && (
                <Grid item xs={12} md={8}>
                  <motion.div variants={itemVariants}>
                    <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          Response Details
                        </Typography>
                        
                        <Chip 
                          label={selectedResponse.completedAt ? 'Completed' : 'In Progress'} 
                          color={selectedResponse.completedAt ? 'success' : 'warning'}
                        />
                      </Box>
                      
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Participant ID
                        </Typography>
                        <Typography variant="body1">
                          {selectedResponse.participantId}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Started At
                        </Typography>
                        <Typography variant="body1">
                          {new Date(selectedResponse.startedAt).toLocaleString()}
                        </Typography>
                      </Box>
                      
                      {selectedResponse.completedAt && (
                        <Box sx={{ mb: 3 }}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Completed At
                          </Typography>
                          <Typography variant="body1">
                            {new Date(selectedResponse.completedAt).toLocaleString()}
                          </Typography>
                        </Box>
                      )}
                      
                      <Divider sx={{ my: 3 }} />
                      
                      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                        Answers
                      </Typography>
                      
                      {selectedResponse.answers.map((answer, index) => (
                        <Card key={index} elevation={1} sx={{ mb: 3, borderRadius: 2 }}>
                          <CardContent>
                            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                              {answer.questionText}
                            </Typography>
                            
                            <Typography variant="body1" paragraph sx={{ whiteSpace: 'pre-wrap' }}>
                              {answer.answer}
                            </Typography>
                            
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                              <Typography variant="subtitle2" color="text.secondary">
                                Quality Score:
                              </Typography>
                              {renderStarRating(answer.qualityScore)}
                            </Box>
                          </CardContent>
                        </Card>
                      ))}
                    </Paper>
                  </motion.div>
                </Grid>
              )}
            </Grid>
          )}
        </Box>
      )}
    </motion.div>
  );
};

export default Responses;
