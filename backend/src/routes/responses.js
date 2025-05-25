const express = require('express');
const router = express.Router();
const responseController = require('../controllers/ResponseController');
const auth = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(auth);

// @route   GET api/responses/survey/:surveyId
// @desc    Get all responses for a survey
// @access  Private
router.get('/survey/:surveyId', responseController.getSurveyResponses);

// @route   GET api/responses/:id
// @desc    Get response by ID
// @access  Private
router.get('/:id', responseController.getResponseById);

// @route   GET api/responses/analytics/:surveyId
// @desc    Get response analytics for a survey
// @access  Private
router.get('/analytics/:surveyId', responseController.getSurveyAnalytics);

module.exports = router;
