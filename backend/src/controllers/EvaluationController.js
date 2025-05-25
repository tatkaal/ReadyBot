const { ModelEvaluation, Admin, sequelize } = require('../models');
const AIService = require('../services/AIService');
const { Op } = require('sequelize');

// Get all model evaluations
exports.getAllEvaluations = async (req, res) => {
  try {
    const evaluations = await ModelEvaluation.findAll({
      where: { createdBy: req.admin.id },
      include: [{ model: Admin, attributes: ['username'] }],
      order: [['createdAt', 'DESC']]
    });
    
    res.json(evaluations);
  } catch (error) {
    console.error('Get evaluations error:', error);
    res.status(500).json({ message: 'Server error retrieving evaluations' });
  }
};

// Get evaluation by ID
exports.getEvaluationById = async (req, res) => {
  try {
    const evaluation = await ModelEvaluation.findOne({
      where: { 
        id: req.params.id,
        createdBy: req.admin.id
      },
      include: [{ model: Admin, attributes: ['username'] }]
    });
    
    if (!evaluation) {
      return res.status(404).json({ message: 'Evaluation not found' });
    }
    
    res.json(evaluation);
  } catch (error) {
    console.error('Get evaluation error:', error);
    res.status(500).json({ message: 'Server error retrieving evaluation' });
  }
};

// Create new model evaluation
exports.createEvaluation = async (req, res) => {
  try {
    const { name, description, models } = req.body;
    
    if (!name || !models || !models.length) {
      return res.status(400).json({ message: 'Name and models are required' });
    }
    
    // Create evaluation record
    const evaluation = await ModelEvaluation.create({
      name,
      description,
      models,
      status: 'running',
      results: [],
      createdBy: req.admin.id
    });
    
    const evaluationWithAdmin = await ModelEvaluation.findByPk(evaluation.id, {
      include: [{ model: Admin, attributes: ['username'] }]
    });
    
    res.status(201).json(evaluationWithAdmin);
  } catch (error) {
    console.error('Create evaluation error:', error);
    res.status(500).json({ message: 'Server error creating evaluation' });
  }
};

// Run evaluation
exports.runEvaluation = async (req, res) => {
  try {
    const evaluation = await ModelEvaluation.findOne({
      where: { 
        id: req.params.id,
        createdBy: req.admin.id
      }
    });
    
    if (!evaluation) {
      return res.status(404).json({ message: 'Evaluation not found' });
    }
    
    // Update status to running
    evaluation.status = 'running';
    await evaluation.save();
    
    // Get API key from environment variable
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key not found in environment variables');
    }
    
    // Simulate evaluation process (replace with actual model comparison logic)
    const results = evaluation.models.map(model => {
      // Use the same API key for all models
      return {
        modelName: model.name,
        averageQualityScore: Math.random() * 2 + 3, // Random score between 3-5
        averageResponseTime: Math.random() * 1000 + 500, // Random time between 500-1500ms
        totalCost: Math.random() * 0.01 // Random cost between 0-0.01
      };
    });
    
    // Update evaluation with results
    evaluation.results = results;
    evaluation.status = 'completed';
    await evaluation.save();
    
    res.json(evaluation);
  } catch (error) {
    console.error('Run evaluation error:', error);
    res.status(500).json({ message: 'Server error running evaluation' });
  }
};

// Delete evaluation
exports.deleteEvaluation = async (req, res) => {
  try {
    const evaluation = await ModelEvaluation.findOne({
      where: { 
        id: req.params.id,
        createdBy: req.admin.id
      }
    });
    
    if (!evaluation) {
      return res.status(404).json({ message: 'Evaluation not found' });
    }
    
    await evaluation.destroy();
    
    res.json({ message: 'Evaluation deleted successfully' });
  } catch (error) {
    console.error('Delete evaluation error:', error);
    res.status(500).json({ message: 'Server error deleting evaluation' });
  }
};
