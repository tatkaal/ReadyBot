const { expect } = require('chai');
const AIService = require('../services/AIService');
const { ModelEvaluation } = require('../models');
const { sequelize } = require('../config/database');

describe('Model Evaluation Tests', () => {
  let aiService;
  const testCases = [
    {
      question: "What are the key features of a good survey?",
      expectedKeywords: ["clear", "concise", "relevant", "unbiased"],
      complexity: "medium"
    },
    {
      question: "How would you improve user engagement in a mobile app?",
      expectedKeywords: ["gamification", "notifications", "personalization"],
      complexity: "high"
    },
    {
      question: "What is your favorite color?",
      expectedKeywords: ["color", "preference"],
      complexity: "low"
    }
  ];

  before(async () => {
    aiService = new AIService();
    await sequelize.sync({ force: true });
  });

  describe('Quality Scoring', () => {
    it('should score responses consistently across models', async () => {
      const modelA = 'gpt-4';
      const modelB = 'gpt-3.5-turbo';
      
      for (const testCase of testCases) {
        const responseA = await aiService.generateResponse(testCase.question, [], modelA);
        const responseB = await aiService.generateResponse(testCase.question, [], modelB);
        
        const scoreA = await aiService.scoreResponseQuality(testCase.question, responseA);
        const scoreB = await aiService.scoreResponseQuality(testCase.question, responseB);
        
        // Scores should be within 1 point of each other for similar quality responses
        expect(Math.abs(scoreA - scoreB)).to.be.lessThan(2);
      }
    });

    it('should detect significant quality differences', async () => {
      const goodResponse = "The key features of a good survey include clear and concise questions, logical flow, appropriate length, and unbiased language. It should also have a mix of question types and proper validation.";
      const poorResponse = "surveys are good";
      
      const goodScore = await aiService.scoreResponseQuality(
        "What makes a good survey?",
        goodResponse
      );
      const poorScore = await aiService.scoreResponseQuality(
        "What makes a good survey?",
        poorResponse
      );
      
      expect(goodScore).to.be.greaterThan(poorScore);
    });
  });

  describe('Cost-Performance Analysis', () => {
    it('should calculate cost-performance ratio', async () => {
      const modelA = 'gpt-4';
      const modelB = 'gpt-3.5-turbo';
      
      const results = await aiService.compareModels(modelA, modelB, testCases);
      
      // Calculate cost-performance ratio
      const costPerfA = results.metrics.qualityDifference / results.metrics.costDifference;
      const costPerfB = -results.metrics.qualityDifference / results.metrics.costDifference;
      
      expect(costPerfA).to.be.a('number');
      expect(costPerfB).to.be.a('number');
    });

    it('should track token usage and costs', async () => {
      const model = 'gpt-3.5-turbo';
      const response = await aiService.generateResponse(testCases[0].question, [], model);
      
      const tokenCount = response.split(/\s+/).length;
      const estimatedCost = tokenCount * 0.000002; // Example cost per token
      
      expect(tokenCount).to.be.greaterThan(0);
      expect(estimatedCost).to.be.greaterThan(0);
    });
  });

  describe('LLM-based Judge Methods', () => {
    it('should use LLM to compare response quality', async () => {
      const responseA = "A good survey should be clear, concise, and relevant to the target audience.";
      const responseB = "Surveys need to be good.";
      
      const comparison = await aiService.compareResponses(
        "What makes a good survey?",
        responseA,
        responseB
      );
      
      expect(comparison).to.have.property('winner');
      expect(comparison).to.have.property('reasoning');
    });

    it('should evaluate response completeness', async () => {
      const response = "The key features of a good survey include clear questions and proper validation.";
      const evaluation = await aiService.evaluateResponseCompleteness(
        "What are the key features of a good survey?",
        response,
        testCases[0].expectedKeywords
      );
      
      expect(evaluation).to.have.property('completenessScore');
      expect(evaluation).to.have.property('missingKeywords');
    });
  });

  describe('Regression Testing', () => {
    it('should maintain consistent performance across model versions', async () => {
      const modelVersions = ['gpt-4', 'gpt-4-0314', 'gpt-4-0613'];
      const baselineScores = {};
      
      // Get baseline scores
      for (const version of modelVersions) {
        const response = await aiService.generateResponse(testCases[0].question, [], version);
        baselineScores[version] = await aiService.scoreResponseQuality(
          testCases[0].question,
          response
        );
      }
      
      // Verify scores are within acceptable range
      const maxDeviation = 0.5;
      const baseline = baselineScores[modelVersions[0]];
      
      for (const version of modelVersions.slice(1)) {
        expect(Math.abs(baselineScores[version] - baseline)).to.be.lessThan(maxDeviation);
      }
    });

    it('should detect significant performance regressions', async () => {
      const model = 'gpt-3.5-turbo';
      const responses = [];
      
      // Generate multiple responses
      for (let i = 0; i < 5; i++) {
        const response = await aiService.generateResponse(testCases[0].question, [], model);
        responses.push(response);
      }
      
      // Calculate standard deviation of quality scores
      const scores = await Promise.all(
        responses.map(r => aiService.scoreResponseQuality(testCases[0].question, r))
      );
      
      const mean = scores.reduce((a, b) => a + b) / scores.length;
      const stdDev = Math.sqrt(
        scores.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / scores.length
      );
      
      // Standard deviation should be less than 1 for consistent performance
      expect(stdDev).to.be.lessThan(1);
    });
  });
}); 