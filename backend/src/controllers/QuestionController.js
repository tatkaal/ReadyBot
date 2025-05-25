const { Question, Admin } = require('../models');
const { Op } = require('sequelize');

// Get all questions
exports.getAllQuestions = async (req, res) => {
  try {
    const questions = await Question.findAll({
      where: { createdBy: req.admin.id },
      include: [{ model: Admin, attributes: ['username'] }],
      order: [['createdAt', 'DESC']]
    });
    
    res.json(questions);
  } catch (error) {
    console.error('Get questions error:', error);
    res.status(500).json({ message: 'Server error retrieving questions' });
  }
};

// Get question by ID
exports.getQuestionById = async (req, res) => {
  try {
    const question = await Question.findOne({
      where: { 
        id: req.params.id,
        createdBy: req.admin.id
      },
      include: [{ model: Admin, attributes: ['username'] }]
    });
    
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }
    
    res.json(question);
  } catch (error) {
    console.error('Get question error:', error);
    res.status(500).json({ message: 'Server error retrieving question' });
  }
};

// Create new question
exports.createQuestion = async (req, res) => {
  try {
    const { text, qualityGuidelines } = req.body;
    
    if (!text) {
      return res.status(400).json({ message: 'Question text is required' });
    }
    
    const question = await Question.create({
      text,
      qualityGuidelines: qualityGuidelines || null,
      createdBy: req.admin.id
    });
    
    const questionWithAdmin = await Question.findByPk(question.id, {
      include: [{ model: Admin, attributes: ['username'] }]
    });
    
    res.status(201).json(questionWithAdmin);
  } catch (error) {
    console.error('Create question error:', error);
    res.status(500).json({ message: 'Server error creating question' });
  }
};

// Update question
exports.updateQuestion = async (req, res) => {
  try {
    const { text, qualityGuidelines } = req.body;
    
    if (!text) {
      return res.status(400).json({ message: 'Question text is required' });
    }
    
    const question = await Question.findOne({
      where: { 
        id: req.params.id,
        createdBy: req.admin.id
      }
    });
    
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }
    
    question.text = text;
    question.qualityGuidelines = qualityGuidelines || null;
    await question.save();
    
    const updatedQuestion = await Question.findByPk(question.id, {
      include: [{ model: Admin, attributes: ['username'] }]
    });
    
    res.json(updatedQuestion);
  } catch (error) {
    console.error('Update question error:', error);
    res.status(500).json({ message: 'Server error updating question' });
  }
};

// Delete question
exports.deleteQuestion = async (req, res) => {
  try {
    const question = await Question.findOne({
      where: { 
        id: req.params.id,
        createdBy: req.admin.id
      }
    });
    
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }
    
    await question.destroy();
    
    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    console.error('Delete question error:', error);
    res.status(500).json({ message: 'Server error deleting question' });
  }
};
