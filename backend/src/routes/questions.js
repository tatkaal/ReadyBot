const express = require('express');
const router = express.Router();
const questionController = require('../controllers/QuestionController');
const auth = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(auth);

// @route   GET api/questions
// @desc    Get all questions
// @access  Private
router.get('/', questionController.getAllQuestions);

// @route   GET api/questions/:id
// @desc    Get question by ID
// @access  Private
router.get('/:id', questionController.getQuestionById);

// @route   POST api/questions
// @desc    Create a new question
// @access  Private
router.post('/', questionController.createQuestion);

// @route   PUT api/questions/:id
// @desc    Update a question
// @access  Private
router.put('/:id', questionController.updateQuestion);

// @route   DELETE api/questions/:id
// @desc    Delete a question
// @access  Private
router.delete('/:id', questionController.deleteQuestion);

module.exports = router;
