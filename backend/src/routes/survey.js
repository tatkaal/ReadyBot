const express = require('express');
const router = express.Router();
const surveyPublicController = require('../controllers/SurveyPublicController');

// @route   GET api/survey/:uniqueId
// @desc    Get public survey by unique ID
// @access  Public
router.get('/:uniqueId', surveyPublicController.getSurveyByUniqueId);

// @route   POST api/survey/:uniqueId/start
// @desc    Start a new survey response session
// @access  Public
router.post('/:uniqueId/start', surveyPublicController.startSurveySession);

// @route   POST api/survey/response/:responseId
// @desc    Submit answer and get next question
// @access  Public
router.post('/response/:responseId', surveyPublicController.submitAnswer);

// @route   POST api/survey/response/:responseId/submit
// @desc    Submit the entire survey
// @access  Public
router.post('/response/:responseId/submit', surveyPublicController.submitSurvey);

module.exports = router;
