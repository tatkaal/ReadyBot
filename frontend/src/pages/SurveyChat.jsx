// SurveyChat.jsx
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
  ListItemIcon,
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

  // Revision flow
  const [waitingRevisionConfirmation, setWaitingRevisionConfirmation] = useState(null);
  const [revisionTarget, setRevisionTarget] = useState(null);

  // Add new state for help panel
  const [showHelp, setShowHelp] = useState(false);

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
        // 1. load survey
        const sRes = await axios.get(`${API_URL}/api/survey/${uniqueId}`);
        setSurvey(sRes.data);
        setMessages([
          {
            role: 'bot',
            content: `Welcome to the "${sRes.data.title}" survey! I'm ReadyBot – please answer each question thoughtfully. Let's begin!`
          }
        ]);

        // 2. start session
        const sessRes = await axios.post(`${API_URL}/api/survey/${uniqueId}/start`);
        setResponseSession(sessRes.data);
        // queue first question
        // only enqueue first question if not already present
        setTyping(true);
        setTimeout(() => {
          setMessages(prev => {
            if (prev.some(
              m => m.isQuestion && m.content === sessRes.data.currentQuestion.text
            )) return prev;
            return [
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
    if (
      last &&
      last.role === 'bot' &&
      !last.isQuestion &&
      !last.skipTyped &&
      typedRef.current
    ) {
      const opts = {
        strings: [last.content],
        typeSpeed: 32,
        showCursor: false,
        smartBackspace: false
      };
      typedRef.current._typedInstance?.destroy();
      typedRef.current.innerHTML = '';
      typedRef.current._typedInstance = new Typed(typedRef.current, opts);
      last.skipTyped = true;
    }
  }, [messages]);

  /* -------------------------------------------------- */
  /* update sidebar state                               */
  /* -------------------------------------------------- */
  const updateQuestionStates = (sessionData, answers) => {
    if (!survey) return;
    const completedSet = new Set(sessionData.completedQuestions || []);
    const skippedSet = new Set(sessionData.skippedQuestions || []);
    const states = {};
    survey.Questions.forEach((q, idx) => {
      const ansText = (answers.find(a => a.questionId === q.id)?.answer || '').trim();
      states[idx] = {
        status: completedSet.has(idx)
          ? 'completed'
          : skippedSet.has(idx)
          ? 'skipped'
          : 'pending',
        answer: ansText
      };
    });
    setQuestionStates(states);
    setHasAnswers(completedSet.size > 0);
  };

  /* -------------------------------------------------- */
  /* Submit ANSWER (or revision)                        */
  /* -------------------------------------------------- */
  const handleSubmitAnswer = async (answerText, targetIdx = null) => {
    if (!responseSession || !survey) return;
    try {
      setSubmitting(true);
      setError(null);

      // determine which question to send to
      const questionIndex =
        typeof targetIdx === 'number'
          ? targetIdx
          : responseSession.progress.current - 1;

      // call API
      const res = await axios.post(
        `${API_URL}/api/survey/response/${responseSession.responseId}`,
        {
          answer: answerText,
          participantId: responseSession.participantId,
          action: 'answer',
          targetQuestionIndex: questionIndex
        }
      );

      // update sidebar
      updateQuestionStates(res.data.sessionData, res.data.answers);

      // Check if all questions are handled
      const allQuestionsHandled = 
        res.data.sessionData.completedQuestions.length + 
        res.data.sessionData.skippedQuestions.length === 
        survey.Questions.length;

      // update session and chat
      setResponseSession(prev => ({
        ...prev,
        currentQuestion: allQuestionsHandled ? null : res.data.nextQuestion,
        progress: res.data.progress
      }));

      if (allQuestionsHandled) {
        setMessages(prev => [
          ...prev,
          {
            role: 'bot',
            content: "You've now gone through all questions! Would you like to revise any answer (e.g. \"revise question 3\") or submit the survey now?",
            skipTyped: true
          }
        ]);
      } else if (res.data.nextQuestion) {
        setMessages(prev => [
          ...prev,
          {
            role: 'bot',
            content: res.data.nextQuestion.text,
            isQuestion: true,
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

      // Check if all questions are handled
      const allQuestionsHandled = 
        res.data.sessionData.completedQuestions.length + 
        res.data.sessionData.skippedQuestions.length === 
        survey.Questions.length;

      setResponseSession(prev => ({
        ...prev,
        currentQuestion: allQuestionsHandled ? null : res.data.nextQuestion,
        progress: res.data.progress
      }));

      if (allQuestionsHandled) {
        setMessages(prev => [
          ...prev,
          {
            role: 'bot',
            content: "You've now gone through all questions! Would you like to revise any answer (e.g. \"revise question 3\") or submit the survey now?",
            skipTyped: true
          }
        ]);
      } else if (res.data.nextQuestion) {
        setMessages(prev => [
          ...prev,
          {
            role: 'bot',
            content: res.data.nextQuestion.text,
            isQuestion: true,
            skipTyped: true
          }
        ]);
      }
    } catch (err) {
      console.error(err);
      setError('Unable to skip. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  /* -------------------------------------------------- */
  /* Navigate Question                                  */
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
      
      // show previous answer if any, then new prompt
      const prev = res.data.previousAnswer || '';
      const msgs = [];
      if (prev) {
        msgs.push({
          role: 'bot',
          content: `Your previous answer: "${prev}"\n\nPlease provide a new answer to update it.`,
          skipTyped: true
        });
      }
      msgs.push({
        role: 'bot',
        content: res.data.nextQuestion.text,
        isQuestion: true,
        skipTyped: true
      });
      setMessages(prev => [...prev, ...msgs]);
    } catch (err) {
      console.error(err);
      setError('Failed to navigate to question. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  /* -------------------------------------------------- */
  /* Final Submit                                       */
  /* -------------------------------------------------- */
  const handleFinalSubmit = async () => {
    if (submitting || !responseSession) return;
    const hasValid = Object.values(questionStates).some(s => s.status === 'completed');
    if (!hasValid) {
      setError('Please answer at least one question before submitting.');
      return;
    }
    try {
      setSubmitting(true);
      const res = await axios.post(
        `${API_URL}/api/survey/response/${responseSession.responseId}/submit`,
        { participantId: responseSession.participantId }
      );
      if (res.data.completed) {
        setCompleted(true);
        setMessages(prev => [
          ...prev,
          { role: 'bot', content: res.data.message || 'Thank you—your survey is submitted!' }
        ]);
        setTimeout(() => (window.location.href = '/'), 3000);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to submit survey.');
      setSubmitting(false);
    }
  };

  /* -------------------------------------------------- */
  /* Add help panel component                           */
  /* -------------------------------------------------- */
  const HelpPanel = () => (
    <Paper
      elevation={3}
      sx={{
        position: 'fixed',
        right: 20,
        bottom: 100,
        width: 300,
        p: 2,
        borderRadius: 2,
        bgcolor: 'background.paper',
        zIndex: 1000,
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
      }}
    >
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
        Available Actions
      </Typography>
      <List dense>
        <ListItem>
          <ListItemText 
            primary="Answer Question" 
            secondary="Simply type your answer to the current question"
          />
        </ListItem>
        <ListItem>
          <ListItemText 
            primary="Navigate to Question" 
            secondary="Type 'go to question X' or 'question X'"
          />
        </ListItem>
        <ListItem>
          <ListItemText 
            primary="Revise Answer" 
            secondary="Type 'revise question X' or 'edit question X'"
          />
        </ListItem>
        <ListItem>
          <ListItemText 
            primary="Skip Question" 
            secondary="Type 'skip' or 'next question'"
          />
        </ListItem>
        <ListItem>
          <ListItemText 
            primary="Submit Survey" 
            secondary="Type 'submit' or 'finish survey'"
          />
        </ListItem>
        <ListItem>
          <ListItemText 
            primary="Show Help" 
            secondary="Type 'help' or 'show commands'"
          />
        </ListItem>
      </List>
      <Button
        fullWidth
        variant="outlined"
        onClick={() => setShowHelp(false)}
        sx={{ mt: 1 }}
      >
        Close
      </Button>
    </Paper>
  );

  /* -------------------------------------------------- */
  /* Update handleUserMessage function                   */
  /* -------------------------------------------------- */
  const handleUserMessage = async () => {
    const text = userInput.trim();
    if (!text || submitting) return;

    // echo user
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setUserInput('');

    try {
      // Get current context
      const context = {
        currentQuestionIndex: responseSession?.progress.current - 1 || 0,
        totalQuestions: survey?.Questions.length || 0,
        isCompleted: completed
      };

      // Classify intent
      const { intent, confidence, parameters } = await axios.post(
        `${API_URL}/api/survey/intent`,
        { message: text, context }
      ).then(res => res.data);

      console.log('Intent classification:', { intent, confidence, parameters });

      // Handle intent based on classification
      switch (intent) {
        case 'ANSWER_QUESTION':
          if (revisionTarget !== null) {
            await handleSubmitAnswer(text, revisionTarget);
            setRevisionTarget(null);
          } else {
            await handleSubmitAnswer(text);
          }
          break;

        case 'NAVIGATE_TO_QUESTION':
          const qNum = parameters.question_number;
          if (!survey || qNum < 1 || qNum > survey.Questions.length) {
            setMessages(prev => [
              ...prev,
              {
                role: 'bot',
                content: `Invalid question number. Choose between 1 and ${survey?.Questions.length}.`,
                skipTyped: true
              }
            ]);
          } else {
            setMessages(prev => [
              ...prev,
              { role: 'bot', content: `Navigating to Question ${qNum}...`, skipTyped: true }
            ]);
            await handleNavigateQuestion(qNum - 1);
          }
          break;

        case 'REVISE_ANSWER':
          const revQNum = parameters.question_number;
          if (!survey || revQNum < 1 || revQNum > survey.Questions.length) {
            setMessages(prev => [
              ...prev,
              {
                role: 'bot',
                content: `Invalid question number. Choose between 1 and ${survey?.Questions.length}.`,
                skipTyped: true
              }
            ]);
          } else {
            setMessages(prev => [
              ...prev,
              { role: 'bot', content: `Navigating to Question ${revQNum}...`, skipTyped: true }
            ]);
            await handleNavigateQuestion(revQNum - 1);
          }
          break;

        case 'SKIP_QUESTION':
          setMessages(prev => [...prev, { role: 'bot', content: `Skipping this question...`, skipTyped: true }]);
          await handleSkipQuestion();
          break;

        case 'SUBMIT_SURVEY':
          await handleFinalSubmit();
          break;

        case 'SHOW_HELP':
          setShowHelp(true);
          setMessages(prev => [
            ...prev,
            {
              role: 'bot',
              content: 'Here are the available actions you can take. You can also type "help" anytime to see this list.',
              skipTyped: true
            }
          ]);
          break;

        case 'UNKNOWN':
        default:
          setMessages(prev => [
            ...prev,
            {
              role: 'bot',
              content: "I'm not sure what you want to do. Type 'help' to see available actions.",
              skipTyped: true
            }
          ]);
          // Show the current question again
          if (responseSession?.currentQuestion) {
            setMessages(prev => [
              ...prev,
              {
                role: 'bot',
                content: responseSession.currentQuestion.text,
                isQuestion: true,
                skipTyped: true
              }
            ]);
          }
          break;
      }
    } catch (error) {
      console.error('Error processing message:', error);
      setError('Failed to process your message. Please try again.');
    }
  };

  /* -------------------------------------------------- */
  /* Sidebar                                          */
  /* -------------------------------------------------- */
  const renderQuestionList = () => {
    if (!survey) return null;
    const done = Object.values(questionStates).filter(s => s.status === 'completed').length;
    const total = survey.Questions.length;
    return (
      <Box sx={{ width: 280, display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6">Questions</Typography>
          <Typography variant="body2" color="text.secondary">
            {done} of {total} completed
          </Typography>
        </Box>
        <List sx={{ flexGrow: 1, overflowY: 'auto' }}>
          {survey.Questions.map((q, idx) => {
            const state = questionStates[idx] || { status: 'pending' };
            const current = responseSession?.progress.current === idx + 1;
            let Icon = RadioButtonUncheckedIcon;
            if (state.status === 'completed') Icon = CheckCircleIcon;
            if (state.status === 'skipped') Icon = SkipNextIcon;
            return (
              <ListItem
                key={idx}
                selected={current}
                sx={{
                  bgcolor: current ? 'action.selected' : 'inherit'
                }}
              >
                <ListItemIcon>
                  <Icon color={state.status === 'pending' ? 'disabled' : state.status === 'completed' ? 'success' : 'warning'} />
                </ListItemIcon>
                <ListItemText
                  primary={`Question ${idx + 1}`}
                  secondary={state.status.charAt(0).toUpperCase() + state.status.slice(1)}
                />
              </ListItem>
            );
          })}
        </List>
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
  /* Main Render                                        */
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
      <Box
        sx={{
          display: 'flex',
          height: '100vh',
          justifyContent: 'center',
          alignItems: 'center',
          p: 3
        }}
      >
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
      {/* Sidebar */}
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

      {/* Chat Area */}
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

        {/* inline error */}
        {error && responseSession && (
          <Box sx={{ p: 1, bgcolor: 'error.light', color: 'error.contrastText' }}>
            <Typography variant="body2">{error}</Typography>
          </Box>
        )}

        {/* messages */}
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

        {/* input */}
        {!completed && (
          <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
            <Box sx={{ maxWidth: 800, mx: 'auto', display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                placeholder="Type here… (type 'help' to see available actions)"
                multiline
                maxRows={4}
                value={userInput}
                onChange={e => setUserInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleUserMessage();
                  }
                }}
                disabled={submitting}
                variant="outlined"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
              />
              <Button
                variant="contained"
                disabled={!userInput.trim() || submitting}
                onClick={handleUserMessage}
                sx={{ minWidth: 100 }}
              >
                {submitting ? <CircularProgress size={22} /> : <SendIcon />}
              </Button>
              <Button
                variant="outlined"
                onClick={() => setShowHelp(true)}
                sx={{ minWidth: 100 }}
              >
                Help
              </Button>
            </Box>
          </Box>
        )}
      </Box>

      {/* Help Panel */}
      {showHelp && <HelpPanel />}
    </Box>
  );
};

export default SurveyChat;
