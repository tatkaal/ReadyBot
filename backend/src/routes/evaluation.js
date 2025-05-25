const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getAllEvaluations,
  createEvaluation,
  runEvaluation,
  deleteEvaluation,
  getEvaluationById
} = require('../controllers/EvaluationController');

// Apply auth middleware to all routes
router.use(auth);

// @route   GET api/evaluation
// @desc    Get all model evaluations
// @access  Private
router.get('/', getAllEvaluations);

// @route   GET api/evaluation/:id
// @desc    Get evaluation by ID
// @access  Private
router.get('/:id', getEvaluationById);

// @route   POST api/evaluation
// @desc    Create a new model evaluation
// @access  Private
router.post('/', createEvaluation);

// @route   DELETE api/evaluation/:id
// @desc    Delete an evaluation
// @access  Private
router.delete('/:id', deleteEvaluation);

// @route   POST api/evaluation/:id/run
// @desc    Run a model evaluation
// @access  Private
router.post('/:id/run', runEvaluation);

module.exports = router;
