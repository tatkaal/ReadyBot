const express = require('express');
const router = express.Router();
const surveyController = require('../controllers/SurveyController');
const auth = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(auth);

// @route   GET api/surveys
// @desc    Get all surveys
// @access  Private
router.get('/', surveyController.getAllSurveys);

// @route   GET api/surveys/:id
// @desc    Get survey by ID
// @access  Private
router.get('/:id', surveyController.getSurveyById);

// @route   POST api/surveys
// @desc    Create a new survey
// @access  Private
router.post('/', surveyController.createSurvey);

// @route   PUT api/surveys/:id
// @desc    Update a survey
// @access  Private
router.put('/:id', surveyController.updateSurvey);

// @route   DELETE api/surveys/:id
// @desc    Delete a survey
// @access  Private
router.delete('/:id', surveyController.deleteSurvey);

// @route   POST api/surveys/:id/generate-link
// @desc    Generate new shareable link
// @access  Private
router.post('/:id/generate-link', surveyController.generateShareableLink);

module.exports = router;
