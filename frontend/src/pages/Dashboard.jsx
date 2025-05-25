import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Card, CardContent, CardActionArea, Paper, CircularProgress, Button, IconButton, Tooltip } from '@mui/material';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Icons
import AddIcon from '@mui/icons-material/Add';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import AssessmentIcon from '@mui/icons-material/Assessment';
import BarChartIcon from '@mui/icons-material/BarChart';
import PeopleIcon from '@mui/icons-material/People';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import RefreshIcon from '@mui/icons-material/Refresh';
import SettingsIcon from '@mui/icons-material/Settings';

// Components
import StatCard from '../components/StatCard';
import RecentActivityCard from '../components/RecentActivityCard';

const Dashboard = () => {
  const [stats, setStats] = useState({
    questions: 0,
    surveys: 0,
    responses: 0,
    evaluations: 0
  });
  const [recentSurveys, setRecentSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Please login to view dashboard');
          return;
        }

        const headers = {
          'x-auth-token': token
        };
        
        // Fetch stats
        const [questionsRes, surveysRes, evaluationsRes, responsesRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/question`, { headers }),
          axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/surveys`, { headers }),
          axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/evaluation`, { headers }),
          axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/responses/analytics/all`, { headers })
        ]);
        
        const surveys = surveysRes.data;
        
        // Get recent surveys (last 5)
        const recent = [...surveys].sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        ).slice(0, 5);
        
        setRecentSurveys(recent);
        
        setStats({
          questions: questionsRes.data.length,
          surveys: surveys.length,
          responses: responsesRes.data.totalResponses || 0,
          evaluations: evaluationsRes.data.length
        });
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        if (err.response?.status === 401) {
          setError('Session expired. Please login again.');
        } else if (err.response?.status === 404) {
          setError('Some data could not be found. Please try again.');
        } else {
          setError('Failed to load dashboard data. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

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
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <Typography color="error" gutterBottom>
          {error}
        </Typography>
        <Button 
          variant="contained" 
          onClick={() => window.location.reload()}
          sx={{ mt: 2 }}
        >
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <Box sx={{ mb: 4 }}>
        <motion.div variants={itemVariants}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
            Welcome back, {currentAdmin?.username || 'Admin'}!
          </Typography>
        </motion.div>
        
        <motion.div variants={itemVariants}>
          <Typography variant="body1" color="text.secondary" paragraph>
            Here's an overview of your ReadyBot survey system.
          </Typography>
        </motion.div>
      </Box>
      
      <Grid container spacing={3}>
        {/* Stats Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <motion.div variants={itemVariants}>
            <StatCard 
              title="Questions" 
              value={stats.questions} 
              icon={<QuestionAnswerIcon />} 
              color="#6244bb"
              onClick={() => navigate('/questions')}
            />
          </motion.div>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <motion.div variants={itemVariants}>
            <StatCard 
              title="Surveys" 
              value={stats.surveys} 
              icon={<AssessmentIcon />} 
              color="#00E5FF"
              onClick={() => navigate('/surveys')}
            />
          </motion.div>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <motion.div variants={itemVariants}>
            <StatCard 
              title="Responses" 
              value={stats.responses} 
              icon={<PeopleIcon />} 
              color="#00E096"
            />
          </motion.div>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <motion.div variants={itemVariants}>
            <StatCard 
              title="Evaluations" 
              value={stats.evaluations} 
              icon={<BarChartIcon />} 
              color="#FF3D71"
              onClick={() => navigate('/evaluation')}
            />
          </motion.div>
        </Grid>
        
        {/* Quick Actions */}
        <Grid item xs={12}>
          <motion.div variants={itemVariants}>
            <Paper 
              elevation={2} 
              sx={{ 
                p: 3, 
                borderRadius: 3,
                background: 'linear-gradient(45deg, rgba(98, 0, 234, 0.05) 0%, rgba(0, 229, 255, 0.05) 100%)'
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
                  Quick Actions
                </Typography>
                
                <Tooltip title="Refresh Dashboard">
                  <IconButton onClick={() => window.location.reload()}>
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>
              </Box>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Button 
                    variant="contained" 
                    fullWidth 
                    startIcon={<AddIcon />}
                    onClick={() => navigate('/questions')}
                    sx={{ 
                      py: 1.5,
                      background: 'linear-gradient(45deg, #6244bb 30%, #9D46FF 90%)',
                    }}
                  >
                    New Question
                  </Button>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Button 
                    variant="contained" 
                    fullWidth 
                    startIcon={<AddIcon />}
                    onClick={() => navigate('/surveys')}
                    sx={{ 
                      py: 1.5,
                      background: 'linear-gradient(45deg, #00B2CC 30%, #00E5FF 90%)',
                    }}
                  >
                    New Survey
                  </Button>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Button 
                    variant="contained" 
                    fullWidth 
                    startIcon={<TrendingUpIcon />}
                    onClick={() => navigate('/evaluation')}
                    sx={{ 
                      py: 1.5,
                      background: 'linear-gradient(45deg, #FF3D71 30%, #FF8A8A 90%)',
                    }}
                  >
                    New Evaluation
                  </Button>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Button 
                    variant="contained" 
                    fullWidth 
                    startIcon={<SettingsIcon />}
                    onClick={() => navigate('/llm-config')}
                    sx={{ 
                      py: 1.5,
                      background: 'linear-gradient(45deg, #00E096 30%, #00FFB2 90%)',
                    }}
                  >
                    LLM Config
                  </Button>
                </Grid>
              </Grid>
            </Paper>
          </motion.div>
        </Grid>
        
        {/* Recent Surveys */}
        <Grid item xs={12} md={7}>
          <motion.div variants={itemVariants}>
            <Paper elevation={2} sx={{ p: 3, borderRadius: 3, height: '100%' }}>
              <Typography variant="h6" component="h2" sx={{ fontWeight: 600, mb: 2 }}>
                Recent Surveys
              </Typography>
              
              {recentSurveys.length > 0 ? (
                <Box>
                  {recentSurveys.map((survey) => (
                    <RecentActivityCard 
                      key={survey.id}
                      title={survey.title}
                      description={survey.description}
                      date={new Date(survey.createdAt).toLocaleDateString()}
                      icon={<AssessmentIcon />}
                      onClick={() => navigate(`/surveys/${survey.id}`)}
                    />
                  ))}
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography color="text.secondary">
                    No surveys created yet. Create your first survey!
                  </Typography>
                  <Button 
                    variant="contained" 
                    startIcon={<AddIcon />}
                    onClick={() => navigate('/surveys')}
                    sx={{ mt: 2 }}
                  >
                    Create Survey
                  </Button>
                </Box>
              )}
            </Paper>
          </motion.div>
        </Grid>
        
        {/* Getting Started */}
        <Grid item xs={12} md={5}>
          <motion.div variants={itemVariants}>
            <Paper 
              elevation={2} 
              sx={{ 
                p: 3, 
                borderRadius: 3,
                height: '100%',
                background: 'linear-gradient(135deg, #6244bb 0%, #9D46FF 100%)',
                color: 'white'
              }}
            >
              <Typography variant="h6" component="h2" sx={{ fontWeight: 600, mb: 2 }}>
                Getting Started with ReadyBot
              </Typography>
              
              <Typography variant="body2" paragraph>
                Follow these steps to create your first AI-powered survey:
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                  1. Create Questions
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8, mb: 1.5 }}>
                  Start by creating questions with quality guidelines.
                </Typography>
                
                <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                  2. Create a Survey
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8, mb: 1.5 }}>
                  Combine questions into a survey with a title and description.
                </Typography>
                
                <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                  3. Share the Survey
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8, mb: 1.5 }}>
                  Share the generated link with participants.
                </Typography>
                
                <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                  4. Analyze Responses
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  View and analyze responses with AI-powered quality scoring.
                </Typography>
              </Box>
              
              <Button 
                variant="contained" 
                fullWidth
                onClick={() => navigate('/questions')}
                sx={{ 
                  mt: 2,
                  bgcolor: 'rgba(255, 255, 255, 0.9)',
                  color: '#6244bb',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 1)',
                  }
                }}
              >
                Start Creating
              </Button>
            </Paper>
          </motion.div>
        </Grid>
      </Grid>
    </motion.div>
  );
};

export default Dashboard;
