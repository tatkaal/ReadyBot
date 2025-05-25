const express = require('express');
const router = express.Router();
const evaluationController = require('../controllers/EvaluationController');
const auth = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(auth);

// @route   GET api/evaluation
// @desc    Get all model evaluations
// @access  Private
router.get('/', evaluationController.getAllEvaluations);

// @route   GET api/evaluation/:id
// @desc    Get evaluation by ID
// @access  Private
router.get('/:id', evaluationController.getEvaluationById);

// @route   POST api/evaluation
// @desc    Create a new model evaluation
// @access  Private
router.post('/', evaluationController.createEvaluation);

// @route   DELETE api/evaluation/:id
// @desc    Delete an evaluation
// @access  Private
router.delete('/:id', evaluationController.deleteEvaluation);

// @route   POST api/evaluation/:id/run
// @desc    Run a model evaluation
// @access  Private
router.post('/:id/run', evaluationController.runEvaluation);

module.exports = router;
