const { ModelEvaluation, Admin, sequelize } = require('../models');
const aiService = require('../services/AIService');
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
    res.status(500).json({ error: 'Failed to fetch evaluations' });
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
    
    const evaluation = await ModelEvaluation.create({
      name,
      description,
      models,
      createdBy: req.admin.id,
      status: 'running',
      results: [],
      modelComparisons: [],
      testCases: [],
      metrics: {}
    });
    
    const evaluationWithAdmin = await ModelEvaluation.findByPk(evaluation.id, {
      include: [{ model: Admin, attributes: ['username'] }]
    });
    
    res.status(201).json(evaluationWithAdmin);
  } catch (error) {
    console.error('Create evaluation error:', error);
    res.status(500).json({ error: 'Failed to create evaluation' });
  }
};

// Run evaluation
exports.runEvaluation = async (req, res) => {
  let evaluation;
  try {
    const { id } = req.params;
    evaluation = await ModelEvaluation.findOne({
      where: { id, createdBy: req.admin.id }
    });

    if (!evaluation) {
      return res.status(404).json({ message: 'Evaluation not found' });
    }

    // Update status to running
    evaluation.status = 'running';
    await evaluation.save();

    const testCases = [
      {
        question: "What are the key features of a good survey question?",
        expectedKeywords: ["clear", "concise", "unbiased", "specific"],
        complexity: "medium"
      },
      {
        question: "How would you improve the following survey question: 'Do you like our product?'",
        expectedKeywords: ["specific", "detailed", "measurable", "context"],
        complexity: "high"
      },
      {
        question: "What are the best practices for survey response scales?",
        expectedKeywords: ["balanced", "consistent", "clear", "appropriate"],
        complexity: "medium"
      }
    ];

    const results = [];
    const modelComparisons = [];

    // Test each model
    for (const model of evaluation.models) {
      const modelResults = {
        modelName: model.name,
        testResults: [],
        averageQualityScore: 0,
        averageCompleteness: 0,
        averageResponseTime: 0,
        tokenUsage: { prompt: 0, completion: 0, total: 0 },
        totalCost: 0
      };

      for (const testCase of testCases) {
        const startTime = Date.now();
        const response = await aiService.generateResponse(testCase.question, model.name);
        const responseTime = Date.now() - startTime;

        const qualityScore = await aiService.scoreResponseQuality(testCase.question, response);
        const completeness = await aiService.evaluateResponseCompleteness(
          testCase.question, 
          response,
          testCase.expectedKeywords || []
        );

        modelResults.testResults.push({
          question: testCase.question,
          response,
          qualityScore,
          completeness,
          responseTime,
          expectedKeywords: testCase.expectedKeywords || [],
          complexity: testCase.complexity
        });
      }

      // Calculate averages
      modelResults.averageQualityScore = modelResults.testResults.reduce((sum, result) => sum + result.qualityScore, 0) / testCases.length;
      modelResults.averageCompleteness = modelResults.testResults.reduce((sum, result) => sum + result.completeness, 0) / testCases.length;
      modelResults.averageResponseTime = modelResults.testResults.reduce((sum, result) => sum + result.responseTime, 0) / testCases.length;

      // Calculate token usage and cost
      const totalTokens = modelResults.testResults.reduce((sum, result) => {
        const tokens = result.response.split(/\s+/).length;
        return sum + tokens;
      }, 0);

      modelResults.tokenUsage = {
        prompt: totalTokens * 0.7, // Estimate 70% for prompt
        completion: totalTokens * 0.3, // Estimate 30% for completion
        total: totalTokens
      };

      modelResults.totalCost = totalTokens * model.costPerToken;
      results.push(modelResults);
    }

    // Compare models pairwise
    for (let i = 0; i < evaluation.models.length; i++) {
      for (let j = i + 1; j < evaluation.models.length; j++) {
        const modelA = evaluation.models[i];
        const modelB = evaluation.models[j];
        
        const comparison = await aiService.compareModels(
          modelA.name,
          modelB.name,
          "Compare the quality and effectiveness of these two AI models for survey question generation."
        );
        
        modelComparisons.push(comparison);
      }
    }

    // Update evaluation with results
    evaluation.results = results;
    evaluation.modelComparisons = modelComparisons;
    evaluation.testCases = testCases;
    evaluation.status = 'completed';
    await evaluation.save();

    res.json(evaluation);
  } catch (error) {
    console.error('Run evaluation error:', error);
    if (evaluation) {
      evaluation.status = 'failed';
      await evaluation.save();
    }
    res.status(500).json({ message: 'Failed to run evaluation', error: error.message });
  }
};

// Delete evaluation
exports.deleteEvaluation = async (req, res) => {
  try {
    const { id } = req.params;
    const evaluation = await ModelEvaluation.findOne({
      where: { id, createdBy: req.admin.id }
    });

    if (!evaluation) {
      return res.status(404).json({ error: 'Evaluation not found' });
    }

    await evaluation.destroy();
    res.json({ message: 'Evaluation deleted successfully' });
  } catch (error) {
    console.error('Delete evaluation error:', error);
    res.status(500).json({ error: 'Failed to delete evaluation' });
  }
};
