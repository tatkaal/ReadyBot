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
 * Creates a fresh Response “session”
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

    // convenience handles
    const { currentQuestionIndex, completedQuestions = [], skippedQuestions = [] } = response.sessionData;
    const currentQuestion = survey.Questions[currentQuestionIndex];

    if (!currentQuestion) {
      await t.rollback();
      return res.status(400).json({ message: 'No current question found' });
    }

    /**
     * -----------------
     *  ACTION:  SKIP
     * -----------------
     */
    if (action === 'skip') {
      const updatedSkipped = [...skippedQuestions, currentQuestionIndex];
      const nextIdx = currentQuestionIndex + 1;

      response.sessionData = {
        currentQuestionIndex: nextIdx,
        completedQuestions,
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
     * -----------------
     *  ACTION:  NAVIGATE
     * -----------------
     */
    if (action === 'navigate') {
      if (
        typeof targetQuestionIndex !== 'number' ||
        targetQuestionIndex < 0 ||
        targetQuestionIndex >= survey.Questions.length
      ) {
        await t.rollback();
        return res.status(400).json({ message: 'Invalid question index' });
      }

      response.sessionData.currentQuestionIndex = targetQuestionIndex;
      await response.save({ transaction: t });
      await t.commit();

      const targetQ = survey.Questions[targetQuestionIndex];
      const prevAns = response.answers.find(a => a.questionId === targetQ.id);

      return res.json({
        completed: false,
        allQuestionsAnswered: false,
        nextQuestion: targetQ,
        previousAnswer: prevAns?.answer || '',
        action: 'navigated',
        sessionData: response.sessionData,
        answers: response.answers,
        progress: { current: targetQuestionIndex + 1, total: survey.Questions.length }
      });
    }

    /**
     * -----------------
     *  ACTION:  ANSWER
     * -----------------
     */
    if (!answer) {
      await t.rollback();
      return res.status(400).json({ message: 'Answer is required for submission' });
    }

    // quality scoring
    const qualityScore = await AIService.scoreResponseQuality(
      currentQuestion.text,
      answer,
      currentQuestion.qualityGuidelines
    );

    // save / overwrite answer
    const answers = [...response.answers];
    const existingIdx = answers.findIndex(a => a.questionId === currentQuestion.id);

    const newAnswerObj = {
      questionId: currentQuestion.id,
      questionText: currentQuestion.text,
      answer,
      qualityScore,
      timestamp: new Date()
    };

    if (existingIdx !== -1) answers[existingIdx] = newAnswerObj;
    else answers.push(newAnswerObj);

    // update sessionData
    const updatedCompleted = [...completedQuestions];
    if (!updatedCompleted.includes(currentQuestionIndex)) updatedCompleted.push(currentQuestionIndex);

    // next incomplete
    let nextIdx = currentQuestionIndex + 1;
    while (
      nextIdx < survey.Questions.length &&
      (updatedCompleted.includes(nextIdx) ||
        answers.some(a => a.questionId === survey.Questions[nextIdx].id))
    ) {
      nextIdx += 1;
    }

    response.answers = answers;
    response.sessionData = {
      currentQuestionIndex: nextIdx,
      completedQuestions: updatedCompleted,
      skippedQuestions
    };

    await response.save({ transaction: t });
    await t.commit();

    // Outcome flags / values
    const allQuestionsAnswered = nextIdx >= survey.Questions.length;
    let nextQuestion = null;
    let aiResponse = '';

    if (!allQuestionsAnswered) {
      nextQuestion = survey.Questions[nextIdx];
      aiResponse = await AIService.generateResponse(
        `The user answered "${answer}" to "${currentQuestion.text}". Acknowledge them positively, then present the next question: "${nextQuestion.text}".`,
        [],
        'gpt-3.5-turbo'
      );
    }

    return res.json({
      completed: false,                  // never auto-completes anymore
      allQuestionsAnswered,
      nextQuestion,                      // null when finished
      aiResponse,
      qualityScore,
      sessionData: response.sessionData,
      answers: response.answers,
      progress: {
        current: Math.min(nextIdx + 1, survey.Questions.length),
        total: survey.Questions.length
      }
    });
  } catch (err) {
    await t.rollback();
    console.error('Submit answer error:', err);
    return res.status(500).json({ message: 'Server error processing answer' });
  }
};

/**
 * POST /api/survey/response/:responseId/submit
 * Explicit “Submit Survey” call – marks the response finished
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

    response.completedAt = new Date();
    await response.save({ transaction: t });
    await t.commit();

    return res.json({ completed: true, message: 'Survey completed successfully' });
  } catch (err) {
    await t.rollback();
    console.error('Submit survey error:', err);
    return res.status(500).json({ message: 'Server error submitting survey' });
  }
};
