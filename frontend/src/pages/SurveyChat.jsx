import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Button,
  Avatar,
  TextField,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Drawer
} from '@mui/material';
import { motion } from 'framer-motion';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import Typed from 'typed.js';

// Icons
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import SkipNextIcon from '@mui/icons-material/SkipNext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const SurveyChat = () => {
  const { uniqueId } = useParams();

  // DATA
  const [survey, setSurvey] = useState(null);
  const [responseSession, setResponseSession] = useState(null);

  // UI STATE
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [typing, setTyping] = useState(false);
  const [questionStates, setQuestionStates] = useState({});
  const [hasAnswers, setHasAnswers] = useState(false);
  const [chatHistory, setChatHistory] = useState({}); // keyed by question index

  // REFS
  const messagesEndRef = useRef(null);
  const typedRef = useRef(null);

  /* -------------------------------------------------- */
  /* Fetch survey + create session                      */
  /* -------------------------------------------------- */
  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);

        // 1. SURVEY
        const sRes = await axios.get(`${API_URL}/api/survey/${uniqueId}`);
        setSurvey(sRes.data);
        setMessages([
          {
            role: 'bot',
            content: `Welcome to the “${sRes.data.title}” survey! ` +
              `I'm ReadyBot – please answer each question thoughtfully. Let's begin!`
          }
        ]);

        // 2. SESSION
        const sessRes = await axios.post(`${API_URL}/api/survey/${uniqueId}/start`);
        setResponseSession(sessRes.data);

        setTyping(true);
        setTimeout(() => {
          setMessages(prev => {
            const already = prev.some(
              m => m.isQuestion && m.content === sessRes.data.currentQuestion.text
            );
            return already
              ? prev
              : [
                  ...prev,
                  {
                    role: 'bot',
                    content: sessRes.data.currentQuestion.text,
                    isQuestion: true,
                    skipTyped: true
                  }
                ];
          });
          setTyping(false);
        }, 1000);
      } catch (err) {
        console.error(err);
        setError('Survey not found or no longer active');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [uniqueId]);

  /* -------------------------------------------------- */
  /* Scroll on new messages                             */
  /* -------------------------------------------------- */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  /* -------------------------------------------------- */
  /* Typed.js for plain bot lines                       */
  /* -------------------------------------------------- */
  useEffect(() => {
    const last = messages[messages.length - 1];
    if (last && last.role === 'bot' && !last.isQuestion && !last.skipTyped && typedRef.current) {
      const opts = {
        strings: [last.content],
        typeSpeed: 32,
        showCursor: false,
        smartBackspace: false
      };
      // cleanup old instance
      typedRef.current._typedInstance?.destroy();
      typedRef.current.innerHTML = '';
      typedRef.current._typedInstance = new Typed(typedRef.current, opts);
      last.skipTyped = true; // prevent re-typing
    }
  }, [messages]);

  /* -------------------------------------------------- */
  /* Helpers                                            */
  /* -------------------------------------------------- */
  const updateQuestionStates = (sessionData, answers) => {
    if (!survey) return;
  
    // authoritative info coming from the API
    const completedSet = new Set(sessionData?.completedQuestions ?? []);
    const skippedSet   = new Set(sessionData?.skippedQuestions   ?? []);
  
    const states = {};
    survey.Questions.forEach((q, idx) => {
      const ansText = (answers.find(a => a.questionId === q.id)?.answer ?? '').trim();
  
      states[idx] = {
        status: completedSet.has(idx)
          ? 'completed'          // ✔  – confirmed by the server
          : skippedSet.has(idx)
            ? 'skipped'          // ↷ – explicitly skipped
            : 'pending',         // ○ – nothing yet
        answer: ansText
      };
    });
  
    setQuestionStates(states);
    setHasAnswers(completedSet.size > 0);   // submit enabled only when *truly* completed
  };

  /* -------------------------------------------------- */
  /* Submit ANSWER                                      */
  /* -------------------------------------------------- */
  const handleSubmitAnswer = async () => {
    if (!userInput.trim() || submitting || !responseSession) return;

    try {
      setSubmitting(true);
      setError(null);

      const userMsg = { role: 'user', content: userInput };
      setMessages(prev => [...prev, userMsg]);
      setUserInput('');

      // Get the actual current question index from the response session's currentQuestion
      const currentQuestionIndex = survey.Questions.findIndex(
        q => q.id === responseSession.currentQuestion.id
      );

      const res = await axios.post(
        `${API_URL}/api/survey/response/${responseSession.responseId}`,
        { 
          answer: userMsg.content, 
          participantId: responseSession.participantId,
          action: 'answer'
        }
      );

      // persist chat history
      setChatHistory(prev => ({
        ...prev,
        [currentQuestionIndex]: [...(prev[currentQuestionIndex] || []), userMsg]
      }));

      // update state flags
      updateQuestionStates(res.data.sessionData, res.data.answers);

      // when ALL questions are answered, just congratulate – do NOT finish
      if (res.data.allQuestionsAnswered) {
        setResponseSession(prev => ({
          ...prev,
          progress: res.data.progress
        }));

        setMessages(prev => [
          ...prev,
          {
            role: 'bot',
            content:
              res.data.aiResponse ||
              'Great job – you have answered every question! You can still review ' +
              'your responses using the list on the left and press "Submit Survey" whenever you are ready.',
            skipTyped: true
          }
        ]);
        return;
      }

      // Move to next question if not all questions are answered
      const nextQuestionIndex = currentQuestionIndex + 1;
      if (nextQuestionIndex < survey.Questions.length) {
        setResponseSession(prev => ({
          ...prev,
          currentQuestion: res.data.nextQuestion,
          progress: { ...prev.progress, current: nextQuestionIndex + 1 }
        }));

        setMessages(prev => [
          ...prev,
          {
            role: 'bot',
            content: res.data.aiResponse,
            skipTyped: true
          },
          {
            role: 'bot',
            content: res.data.nextQuestion.text,
            isQuestion: true,
            skipTyped: true
          }
        ]);
      } else {
        // Stay on current question if it's the last one
        setResponseSession(prev => ({
          ...prev,
          currentQuestion: res.data.nextQuestion,
          progress: res.data.progress
        }));

        setMessages(prev => [
          ...prev,
          {
            role: 'bot',
            content: res.data.aiResponse,
            skipTyped: true
          }
        ]);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to submit answer. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  /* -------------------------------------------------- */
  /* Skip Question                                      */
  /* -------------------------------------------------- */
  const handleSkipQuestion = async () => {
    if (submitting || !responseSession) return;
    try {
      setSubmitting(true);

      const res = await axios.post(
        `${API_URL}/api/survey/response/${responseSession.responseId}`,
        { participantId: responseSession.participantId, action: 'skip' }
      );

      updateQuestionStates(res.data.sessionData, res.data.answers);

      setResponseSession(prev => ({
        ...prev,
        currentQuestion: res.data.nextQuestion,
        progress: res.data.progress
      }));

      // feedback + next question
      setMessages(prev => [
        ...prev,
        {
          role: 'bot',
          content: 'You chose to skip that question – we can return to it later.',
          skipTyped: true
        },
        {
          role: 'bot',
          content: res.data.nextQuestion.text,
          isQuestion: true,
          skipTyped: true
        }
      ]);
    } catch (err) {
      console.error(err);
      setError('Unable to skip. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  /* -------------------------------------------------- */
  /* Navigate                                            */
  /* -------------------------------------------------- */
  const handleNavigateQuestion = async targetIdx => {
    if (submitting || !responseSession) return;

    try {
      setSubmitting(true);
      setError(null);

      const res = await axios.post(
        `${API_URL}/api/survey/response/${responseSession.responseId}`,
        {
          participantId: responseSession.participantId,
          action: 'navigate',
          targetQuestionIndex: targetIdx
        }
      );

      updateQuestionStates(res.data.sessionData, res.data.answers);

      setResponseSession(prev => ({
        ...prev,
        currentQuestion: res.data.nextQuestion,
        progress: res.data.progress
      }));

      // rebuild chat stream for that question
        const past = chatHistory[targetIdx] || [];
        const prevText = (res.data.previousAnswer ?? '').toString();
        const extra =
          prevText !== ''
            ? [
              {
                role: 'bot',
                content: `Previous answer: ${prevText}`,
                skipTyped: true
              }
            ]
          : [];

      setMessages([
        ...past,
        ...extra,
        {
          role: 'bot',
          content: res.data.nextQuestion.text,
          isQuestion: true,
          skipTyped: true
        }
      ]);

      // pre-fill field with previous answer (no prefix) to allow quick editing
      setUserInput(res.data.previousAnswer);
    } catch (err) {
      console.error(err);
      setError('Failed to navigate to question. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  /* -------------------------------------------------- */
  /* FINAL SUBMIT                                       */
  /* -------------------------------------------------- */
  const handleFinalSubmit = async () => {
    if (submitting || !responseSession) return;

    // Validate that we have at least one non-empty answer
    const hasValidAnswers = Object.values(questionStates).some(
      state => state.status === 'completed'
    );

    if (!hasValidAnswers) {
      setError('Please provide at least one answer before submitting the survey.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const res = await axios.post(
        `${API_URL}/api/survey/response/${responseSession.responseId}/submit`,
        { participantId: responseSession.participantId }
      );

      if (res.data.completed) {
        setCompleted(true);
        setMessages(prev => [
          ...prev,
          {
            role: 'bot',
            content: res.data.message || 'Thank you – your survey has been submitted successfully!'
          }
        ]);
        // Redirect to home after 3 seconds
        setTimeout(() => {
          window.location.href = '/';
        }, 3000);
      } else {
        throw new Error('Survey submission was not completed successfully');
      }
    } catch (err) {
      console.error('Survey submission error:', err);
      const errorMessage = err.response?.data?.message || 'Failed to submit survey. Please try again.';
      setError(errorMessage);
      setSubmitting(false);
      
      // If survey is already submitted, redirect to home
      if (err.response?.status === 400 && err.response?.data?.message === 'Survey has already been submitted') {
        setTimeout(() => {
          window.location.href = '/';
        }, 3000);
      }
    }
  };

  /* -------------------------------------------------- */
  /* Render helpers                                     */
  /* -------------------------------------------------- */
  const renderQuestionList = () => {
    if (!survey) return null;

    const done = Object.values(questionStates).filter(s => s.status === 'completed').length;
    const total = survey.Questions.length;

    return (
      <Box sx={{ width: 280, display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* header */}
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6">Questions</Typography>
          <Typography variant="body2" color="text.secondary">
            {done} of {total} completed
          </Typography>
        </Box>

        {/* list */}
        <List sx={{ flexGrow: 1, overflowY: 'auto' }}>
          {survey.Questions.map((q, idx) => {
            const state = questionStates[idx] || { status: 'pending' };
            const current = responseSession?.progress.current === idx + 1;

            return (
              <ListItem key={idx} disablePadding>
                <ListItemButton
                  disabled={!responseSession || submitting || completed}
                  selected={current}
                  onClick={() => handleNavigateQuestion(idx)}
                >
                  {state.status === 'completed' ? (
                    <CheckCircleIcon color="success" sx={{ mr: 1 }} />
                  ) : state.status === 'skipped' ? (
                    <SkipNextIcon color="warning" sx={{ mr: 1 }} />
                  ) : (
                    <RadioButtonUncheckedIcon color="disabled" sx={{ mr: 1 }} />
                  )}

                  <ListItemText
                    primary={`Question ${idx + 1}`}
                    secondary={state.status.charAt(0).toUpperCase() + state.status.slice(1)}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>

        {/* submit button */}
        {hasAnswers && !completed && (
          <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
            <Button
              fullWidth
              variant="contained"
              onClick={handleFinalSubmit}
              disabled={submitting}
            >
              {submitting ? <CircularProgress size={22} /> : 'Submit Survey'}
            </Button>
          </Box>
        )}
      </Box>
    );
  };

  /* -------------------------------------------------- */
  /* MAIN RENDER                                        */
  /* -------------------------------------------------- */
  if (loading) {
    return (
      <Box sx={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && !responseSession) {
    return (
      <Box sx={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', p: 3 }}>
        <Paper sx={{ p: 4, borderRadius: 3, textAlign: 'center', maxWidth: 500 }} elevation={3}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, color: 'error.main' }}>
            Survey Not Available
          </Typography>
          <Typography>{error}</Typography>
          <Button href="/" variant="contained" sx={{ mt: 3 }}>
            Return Home
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* SIDEBAR */}
      <Drawer
        variant="permanent"
        sx={{
          width: 280,
          flexShrink: 0,
          '& .MuiDrawer-paper': { width: 280, boxSizing: 'border-box' }
        }}
      >
        {renderQuestionList()}
      </Drawer>

      {/* CHAT */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {/* header */}
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', maxWidth: 800, mx: 'auto' }}>
            <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
              <SmartToyIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                ReadyBot Survey
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {survey?.title}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* possible inline error */}
        {error && responseSession && (
          <Box sx={{ p: 1, bgcolor: 'error.light', color: 'error.contrastText' }}>
            <Typography variant="body2">{error}</Typography>
          </Box>
        )}

        {/* message area */}
        <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2, bgcolor: '#f5f7fa' }}>
          <Box sx={{ maxWidth: 800, mx: 'auto' }}>
            {messages.map((m, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
              >
                <Box
                  sx={{
                    mb: 2,
                    p: 2,
                    maxWidth: '80%',
                    borderRadius: m.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                    bgcolor:
                      m.role === 'user'
                        ? 'primary.main'
                        : m.isQuestion
                        ? 'rgba(98,0,234,0.05)'
                        : 'white',
                    color: m.role === 'user' ? 'white' : 'text.primary',
                    border: m.isQuestion ? '1px solid rgba(98,0,234,0.2)' : undefined,
                    ml: m.role === 'user' ? 'auto' : 0,
                    mr: m.role === 'user' ? 0 : 'auto',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
                  }}
                >
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                    {m.content}
                  </Typography>
                </Box>
              </motion.div>
            ))}
            <div ref={messagesEndRef} />
          </Box>
        </Box>

        {/* input row */}
        {!completed && (
          <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
            <Box sx={{ maxWidth: 800, mx: 'auto' }}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  placeholder="Type your answer here..."
                  multiline
                  maxRows={4}
                  value={userInput}
                  onChange={e => setUserInput(e.target.value)}
                  disabled={submitting}
                  variant="outlined"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                />
                <Button
                  variant="contained"
                  disabled={!userInput.trim() || submitting}
                  onClick={handleSubmitAnswer}
                  sx={{ minWidth: 100 }}
                >
                  {submitting ? <CircularProgress size={22} /> : <SendIcon />}
                </Button>
              </Box>
              {/* optional skip button */}
              {!questionStates[responseSession?.progress.current - 1]?.status?.startsWith('completed') && (
                <Button
                  onClick={handleSkipQuestion}
                  disabled={submitting}
                  size="small"
                  sx={{ mt: 1 }}
                >
                  Skip this question
                </Button>
              )}
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default SurveyChat;
