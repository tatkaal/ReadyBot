const { Survey, Question, Response, sequelize } = require('../models');
const AIService = require('../services/AIService');
const { Op } = require('sequelize');
const crypto = require('crypto');

/**
 * GET /api/survey/:uniqueId
 * Public fetch of an active survey
 */
exports.getSurveyByUniqueId = async (req, res) => {
  try {
    const { uniqueId } = req.params;

    const survey = await Survey.findOne({
      where: { uniqueId, isActive: true },
      include: [{ model: Question }],
      attributes: ['id', 'title', 'description', 'uniqueId']
    });

    if (!survey) {
      return res.status(404).json({ message: 'Survey not found or inactive' });
    }

    return res.json(survey);
  } catch (err) {
    console.error('Get public survey error:', err);
    return res.status(500).json({ message: 'Server error retrieving survey' });
  }
};

/**
 * POST /api/survey/:uniqueId/start
 * Creates a fresh Response "session"
 */
exports.startSurveySession = async (req, res) => {
  try {
    const { uniqueId } = req.params;

    const survey = await Survey.findOne({
      where: { uniqueId, isActive: true },
      include: [{ model: Question }]
    });

    if (!survey) {
      return res.status(404).json({ message: 'Survey not found or inactive' });
    }

    // eight-byte random participant id
    const participantId = crypto.randomBytes(8).toString('hex');

    const response = await Response.create({
      surveyId: survey.id,
      participantId,
      answers: [],
      startedAt: new Date(),
      sessionData: {
        currentQuestionIndex: 0,
        completedQuestions: [],
        skippedQuestions: []
      }
    });

    return res.status(201).json({
      responseId: response.id,
      participantId,
      surveyTitle: survey.title,
      currentQuestion: survey.Questions[0],
      progress: { current: 1, total: survey.Questions.length }
    });
  } catch (err) {
    console.error('Start survey session error:', err);
    return res.status(500).json({ message: 'Server error starting survey session' });
  }
};

/**
 * POST /api/survey/response/:responseId
 * Handles answer / skip / navigate
 */
exports.submitAnswer = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { responseId } = req.params;
    const { answer, participantId, action, targetQuestionIndex } = req.body;

    if (!participantId) {
      await t.rollback();
      return res.status(400).json({ message: 'Participant ID is required' });
    }

    // locate response row
    const response = await Response.findByPk(responseId, { transaction: t });
    if (!response) {
      await t.rollback();
      return res.status(404).json({ message: 'Response session not found' });
    }

    if (response.participantId !== participantId) {
      await t.rollback();
      return res.status(403).json({ message: 'Invalid participant ID' });
    }

    // accompanying survey & questions
    const survey = await Survey.findByPk(response.surveyId, {
      include: [{ model: Question }],
      transaction: t
    });

    if (!survey) {
      await t.rollback();
      return res.status(404).json({ message: 'Survey not found' });
    }

    // ---------------------------------------------------------------------
    // Which question are we working on?
    // ---------------------------------------------------------------------
    let questionIndex = response.sessionData.currentQuestionIndex;
    let currentQuestion = survey.Questions[questionIndex];

    if (action === 'navigate') {
      if (
        typeof targetQuestionIndex !== 'number' ||
        targetQuestionIndex < 0 ||
        targetQuestionIndex >= survey.Questions.length
      ) {
        await t.rollback();
        return res.status(400).json({ message: 'Invalid question index' });
      }

      questionIndex = targetQuestionIndex;
      currentQuestion = survey.Questions[questionIndex];
      response.sessionData.currentQuestionIndex = questionIndex;
      await response.save({ transaction: t });
      await t.commit();

      const targetQ  = survey.Questions[questionIndex];
      const prevAns  = response.answers.find(a => a.questionId === targetQ.id);

      return res.json({
        completed: false,
        allQuestionsAnswered: false,
        nextQuestion: targetQ,
        previousAnswer: prevAns?.answer || '',
        action: 'navigated',
        sessionData: response.sessionData,
        answers: response.answers,
        progress: { current: questionIndex + 1, total: survey.Questions.length }
      });
    }

    if (!currentQuestion) {
      await t.rollback();
      return res.status(400).json({ message: 'No current question found' });
    }

    /**
     * -----------------------------------------------------------------
     * ACTION: SKIP
     * -----------------------------------------------------------------
     */
    if (action === 'skip') {
      const updatedSkipped = [...new Set([...response.sessionData.skippedQuestions, questionIndex])];
      const nextIdx = questionIndex + 1;

      response.sessionData = {
        currentQuestionIndex: nextIdx,
        completedQuestions: response.sessionData.completedQuestions,
        skippedQuestions: updatedSkipped
      };

      await response.save({ transaction: t });
      await t.commit();

      return res.json({
        completed: false,
        allQuestionsAnswered: false,
        nextQuestion: survey.Questions[nextIdx] ?? null,
        action: 'skipped',
        sessionData: response.sessionData,
        answers: response.answers,
        progress: { current: nextIdx + 1, total: survey.Questions.length }
      });
    }

    /**
     * -----------------------------------------------------------------
     * ACTION: ANSWER
     * -----------------------------------------------------------------
     */
    if (!answer) {
      await t.rollback();
      return res.status(400).json({ message: 'Answer is required for submission' });
    }

    // If targetQuestionIndex is provided, use it for editing previous answer
    if (typeof targetQuestionIndex === 'number' && targetQuestionIndex >= 0 && targetQuestionIndex < survey.Questions.length) {
      questionIndex = targetQuestionIndex;
      currentQuestion = survey.Questions[questionIndex];
    }

    // Generate quality score
    const qualityScore = await AIService.scoreResponseQuality(
      currentQuestion.text,
      answer,
      currentQuestion.qualityGuidelines
    );

    // Generate improvement hint if score is less than 5
    const improvementHint = await AIService.generateImprovementHint(
      currentQuestion.text,
      answer,
      qualityScore,
      currentQuestion.qualityGuidelines
    );

    // Format the AI response with score and hint
    const aiResponse = `Great—thanks! (Score: ${qualityScore}/5)${
      improvementHint ? `\n\n${improvementHint}` : ''
    }`;

    // Save the answer with quality score and hint
    const answers = [...response.answers];
    const existingIdx = answers.findIndex(a => a.questionId === currentQuestion.id);

    const newAnswerObj = {
      questionId: currentQuestion.id,
      questionText: currentQuestion.text,
      answer,
      qualityScore,
      improvementHint,
      timestamp: new Date()
    };

    if (existingIdx !== -1) answers[existingIdx] = newAnswerObj;
    else answers.push(newAnswerObj);

    // recompute completed list
    const updatedCompleted = survey.Questions
      .map((q, idx) => {
        const a = answers.find(ans => ans.questionId === q.id);
        return a && a.answer && a.answer.trim() !== '' ? idx : null;
      })
      .filter(idx => idx !== null);

    // -----------------------------------------------------------------
    // decide where the pointer should go next
    // -----------------------------------------------------------------
    let nextIdx = questionIndex;
    
    // If we're editing a previous answer, stay on the same question
    // Otherwise, move to the next unanswered question
    if (typeof targetQuestionIndex !== 'number' || targetQuestionIndex === questionIndex) {
      nextIdx = questionIndex + 1;
      while (nextIdx < survey.Questions.length && updatedCompleted.includes(nextIdx)) {
        nextIdx += 1;
      }
      // if we ran off the end, keep the pointer on the last question
      if (nextIdx >= survey.Questions.length) nextIdx = questionIndex;
    }

    response.answers = answers;
    response.sessionData = {
      currentQuestionIndex: nextIdx,
      completedQuestions: updatedCompleted,
      skippedQuestions: response.sessionData.skippedQuestions
    };
    await response.save({ transaction: t });
    await t.commit();

    // build reply
    const allQuestionsAnswered = updatedCompleted.length === survey.Questions.length;
    const nextQuestion = allQuestionsAnswered ? null : survey.Questions[nextIdx];

    return res.json({
      completed: false,
      allQuestionsAnswered,
      nextQuestion,
      aiResponse,
      qualityScore,
      improvementHint,
      sessionData: response.sessionData,
      answers: response.answers,
      progress: { current: nextIdx + 1, total: survey.Questions.length }
    });
  } catch (err) {
    await t.rollback();
    console.error('Submit answer error:', err);
    return res.status(500).json({ message: 'Server error processing answer' });
  }
};

/**
 * POST /api/survey/response/:responseId/submit
 * Explicit "Submit Survey" call – marks the response finished
 */
exports.submitSurvey = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { responseId } = req.params;
    const { participantId } = req.body;

    if (!participantId) {
      await t.rollback();
      return res.status(400).json({ message: 'Participant ID is required' });
    }

    const response = await Response.findByPk(responseId, { transaction: t });
    if (!response) {
      await t.rollback();
      return res.status(404).json({ message: 'Response session not found' });
    }

    if (response.participantId !== participantId) {
      await t.rollback();
      return res.status(403).json({ message: 'Invalid participant ID' });
    }

    if (response.completedAt) {
      await t.rollback();
      return res.status(400).json({ message: 'Survey has already been submitted' });
    }

    if (!response.answers || response.answers.length === 0) {
      await t.rollback();
      return res.status(400).json({ message: 'Cannot submit survey without any answers' });
    }

    const hasValidAnswers = response.answers.some(
      a => a.answer && a.answer.trim() !== ''
    );
    if (!hasValidAnswers) {
      await t.rollback();
      return res.status(400).json({ message: 'Please provide at least one answer before submitting the survey' });
    }

    response.completedAt = new Date();
    await response.save({ transaction: t });
    await t.commit();

    return res.json({
      completed: true,
      message: 'Survey completed successfully',
      responseId: response.id,
      participantId: response.participantId,
      completedAt: response.completedAt,
      answerCount: response.answers.length
    });
  } catch (err) {
    await t.rollback();
    console.error('Submit survey error:', err);
    return res.status(500).json({ message: 'Server error submitting survey' });
  }
};

/**
 * Classify user intent
 */
exports.classifyIntent = async (req, res) => {
  try {
    const { message, context } = req.body;
    
    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    const intent = await AIService.classifyIntent(message, context);
    res.json(intent);
  } catch (error) {
    console.error('Intent classification error:', error);
    res.status(500).json({ message: 'Server error classifying intent' });
  }
};
