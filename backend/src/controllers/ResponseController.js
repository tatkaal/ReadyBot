const { Response, Survey, Question, sequelize } = require('../models');
const { Op } = require('sequelize');

// Get all responses for a survey
exports.getSurveyResponses = async (req, res) => {
  try {
    const { surveyId } = req.params;
    
    // Verify survey exists and belongs to admin
    const survey = await Survey.findOne({
      where: { 
        id: surveyId,
        createdBy: req.admin.id
      }
    });
    
    if (!survey) {
      return res.status(404).json({ message: 'Survey not found' });
    }
    
    // Get responses
    const responses = await Response.findAll({
      where: { surveyId },
      order: [['createdAt', 'DESC']]
    });
    
    res.json(responses);
  } catch (error) {
    console.error('Get responses error:', error);
    res.status(500).json({ message: 'Server error retrieving responses' });
  }
};

// Get response by ID
exports.getResponseById = async (req, res) => {
  try {
    const response = await Response.findByPk(req.params.id);
    
    if (!response) {
      return res.status(404).json({ message: 'Response not found' });
    }
    
    // Verify survey belongs to admin
    const survey = await Survey.findOne({
      where: { 
        id: response.surveyId,
        createdBy: req.admin.id
      }
    });
    
    if (!survey) {
      return res.status(403).json({ message: 'Not authorized to access this response' });
    }
    
    res.json(response);
  } catch (error) {
    console.error('Get response error:', error);
    res.status(500).json({ message: 'Server error retrieving response' });
  }
};

// Get response analytics for a survey
exports.getSurveyAnalytics = async (req, res) => {
  try {
    const { surveyId } = req.params;
    
    // Verify survey exists and belongs to admin
    const survey = await Survey.findOne({
      where: { 
        id: surveyId,
        createdBy: req.admin.id
      },
      include: [{ model: Question }]
    });
    
    if (!survey) {
      return res.status(404).json({ message: 'Survey not found' });
    }
    
    // Get responses
    const responses = await Response.findAll({
      where: { surveyId }
    });
    
    // Calculate analytics
    const totalResponses = responses.length;
    const completedResponses = responses.filter(r => r.completedAt).length;
    const completionRate = totalResponses > 0 ? (completedResponses / totalResponses) * 100 : 0;
    
    // Calculate average scores per question
    const questionScores = {};
    survey.Questions.forEach(question => {
      questionScores[question.id] = {
        questionText: question.text,
        scores: [],
        averageScore: 0
      };
    });
    
    responses.forEach(response => {
      const answers = response.answers;
      answers.forEach(answer => {
        if (questionScores[answer.questionId]) {
          questionScores[answer.questionId].scores.push(answer.qualityScore);
        }
      });
    });
    
    // Calculate averages
    Object.keys(questionScores).forEach(questionId => {
      const scores = questionScores[questionId].scores;
      questionScores[questionId].averageScore = scores.length > 0 
        ? scores.reduce((sum, score) => sum + score, 0) / scores.length 
        : 0;
    });
    
    res.json({
      totalResponses,
      completedResponses,
      completionRate,
      questionScores
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ message: 'Server error retrieving analytics' });
  }
};
