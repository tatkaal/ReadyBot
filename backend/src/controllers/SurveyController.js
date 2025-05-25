const { Survey, Question, Admin, sequelize } = require('../models');
const { Op } = require('sequelize');
const crypto = require('crypto');

// Get all surveys
exports.getAllSurveys = async (req, res) => {
  try {
    const surveys = await Survey.findAll({
      where: { createdBy: req.admin.id },
      include: [
        { model: Admin, attributes: ['username'] },
        { model: Question, through: { attributes: [] } }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    res.json(surveys);
  } catch (error) {
    console.error('Get surveys error:', error);
    res.status(500).json({ message: 'Server error retrieving surveys' });
  }
};

// Get survey by ID
exports.getSurveyById = async (req, res) => {
  try {
    const survey = await Survey.findOne({
      where: { 
        id: req.params.id,
        createdBy: req.admin.id
      },
      include: [
        { model: Admin, attributes: ['username'] },
        { model: Question }
      ]
    });
    
    if (!survey) {
      return res.status(404).json({ message: 'Survey not found' });
    }
    
    res.json(survey);
  } catch (error) {
    console.error('Get survey error:', error);
    res.status(500).json({ message: 'Server error retrieving survey' });
  }
};

// Create new survey
exports.createSurvey = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { title, description, questions } = req.body;
    
    if (!title || !description || !questions || !questions.length) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Title, description, and at least one question are required' });
    }
    
    // Generate unique ID and shareable link
    const uniqueId = crypto.randomBytes(8).toString('hex');
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const shareableLink = `${baseUrl}/survey/${uniqueId}`;
    
    // Create survey
    const survey = await Survey.create({
      title,
      description,
      uniqueId,
      shareableLink,
      createdBy: req.admin.id
    }, { transaction });
    
    // Verify all questions exist and belong to the admin
    const questionRecords = await Question.findAll({
      where: {
        id: { [Op.in]: questions },
        createdBy: req.admin.id
      }
    });
    
    if (questionRecords.length !== questions.length) {
      await transaction.rollback();
      return res.status(400).json({ message: 'One or more questions not found or not owned by you' });
    }
    
    // Add questions to survey
    await survey.addQuestions(questionRecords, { transaction });
    
    await transaction.commit();
    
    // Get the complete survey with questions
    const newSurvey = await Survey.findByPk(survey.id, {
      include: [
        { model: Admin, attributes: ['username'] },
        { model: Question }
      ]
    });
    
    res.status(201).json(newSurvey);
  } catch (error) {
    await transaction.rollback();
    console.error('Create survey error:', error);
    res.status(500).json({ message: 'Server error creating survey' });
  }
};

// Update survey
exports.updateSurvey = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { title, description, questions, isActive } = req.body;
    
    if (!title || !description || !questions || !questions.length) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Title, description, and at least one question are required' });
    }
    
    const survey = await Survey.findOne({
      where: { 
        id: req.params.id,
        createdBy: req.admin.id
      }
    });
    
    if (!survey) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Survey not found' });
    }
    
    // Update survey fields
    survey.title = title;
    survey.description = description;
    if (isActive !== undefined) {
      survey.isActive = isActive;
    }
    
    await survey.save({ transaction });
    
    // Verify all questions exist and belong to the admin
    const questionRecords = await Question.findAll({
      where: {
        id: { [Op.in]: questions },
        createdBy: req.admin.id
      }
    });
    
    if (questionRecords.length !== questions.length) {
      await transaction.rollback();
      return res.status(400).json({ message: 'One or more questions not found or not owned by you' });
    }
    
    // Update questions (remove all and add again)
    await survey.setQuestions([], { transaction });
    await survey.addQuestions(questionRecords, { transaction });
    
    await transaction.commit();
    
    // Get the updated survey with questions
    const updatedSurvey = await Survey.findByPk(survey.id, {
      include: [
        { model: Admin, attributes: ['username'] },
        { model: Question }
      ]
    });
    
    res.json(updatedSurvey);
  } catch (error) {
    await transaction.rollback();
    console.error('Update survey error:', error);
    res.status(500).json({ message: 'Server error updating survey' });
  }
};

// Delete survey
exports.deleteSurvey = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const survey = await Survey.findOne({
      where: { 
        id: req.params.id,
        createdBy: req.admin.id
      }
    });
    
    if (!survey) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Survey not found' });
    }
    
    // Remove question associations
    await survey.setQuestions([], { transaction });
    
    // Delete survey
    await survey.destroy({ transaction });
    
    await transaction.commit();
    
    res.json({ message: 'Survey deleted successfully' });
  } catch (error) {
    await transaction.rollback();
    console.error('Delete survey error:', error);
    res.status(500).json({ message: 'Server error deleting survey' });
  }
};

// Generate new shareable link
exports.generateShareableLink = async (req, res) => {
  try {
    const survey = await Survey.findOne({
      where: { 
        id: req.params.id,
        createdBy: req.admin.id
      }
    });
    
    if (!survey) {
      return res.status(404).json({ message: 'Survey not found' });
    }
    
    // Generate new unique ID and shareable link
    const uniqueId = crypto.randomBytes(8).toString('hex');
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const shareableLink = `${baseUrl}/survey/${uniqueId}`;
    
    survey.uniqueId = uniqueId;
    survey.shareableLink = shareableLink;
    await survey.save();
    
    res.json({ uniqueId, shareableLink });
  } catch (error) {
    console.error('Generate link error:', error);
    res.status(500).json({ message: 'Server error generating shareable link' });
  }
};
