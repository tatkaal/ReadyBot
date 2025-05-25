const dotenv = require('dotenv');
const { LLMConfig } = require('../models');

// Load environment variables
dotenv.config();

// Initialize OpenAI configuration
const OpenAI = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const intentSchema = {
  name: "IntentClassification",
  strict: true,
  schema: {
    type: "object",
    properties: {
      intent: {
        type: "string",
        enum: [
          "ANSWER_QUESTION",
          "NAVIGATE_TO_QUESTION",
          "REVISE_ANSWER",
          "SKIP_QUESTION",
          "SUBMIT_SURVEY",
          "SHOW_HELP",
          "UNKNOWN"
        ]
      },
      confidence: {
        type: "number",
        minimum: 0,
        maximum: 1
      },
      parameters: {
        type: "object",
        properties: {
          question_number: {
            type: ["integer", "null"],
            minimum: 1,
            description: "The question number to navigate to or revise. Set to null for non-navigation intents."
          }
        },
        required: ["question_number"],
        additionalProperties: false
      }
    },
    required: ["intent", "confidence", "parameters"],
    additionalProperties: false
  }
};

// Service for AI-related operations
class AIService {
  /**
   * Get LLM configuration for a specific task
   * @param {string} task - The task type
   * @param {Object} survey - The survey object
   * @returns {Promise<Object>} - The LLM configuration
   */
  async getLLMConfig(task, survey) {
    try {
      if (!survey.llmConfigs || !survey.llmConfigs[task]) {
        // Return default configuration if none specified
        return {
          model: 'gpt-3.5-turbo',
          temperature: 0.7,
          maxTokens: 500
        };
      }

      const config = await LLMConfig.findByPk(survey.llmConfigs[task]);
      if (!config || !config.isActive) {
        // Return default configuration if config not found or inactive
        return {
          model: 'gpt-3.5-turbo',
          temperature: 0.7,
          maxTokens: 500
        };
      }

      return {
        model: config.model,
        temperature: config.temperature,
        maxTokens: config.maxTokens
      };
    } catch (error) {
      console.error('Error getting LLM config:', error);
      // Return default configuration on error
      return {
        model: 'gpt-3.5-turbo',
        temperature: 0.7,
        maxTokens: 500
      };
    }
  }

  /**
   * Generate a response to a user message in a conversational context
   * @param {string} message - The user's message
   * @param {Array} history - Previous conversation history
   * @param {Object} survey - The survey object
   * @returns {Promise<string>} - The AI-generated response
   */
  async generateResponse(message, history = [], survey) {
    try {
      const config = await this.getLLMConfig('response_generation', survey);

      // Format conversation history for OpenAI
      const messages = [
        { role: 'system', content: 'You are ReadyBot, a helpful survey assistant. Respond conversationally to the user while collecting their survey responses.' },
        ...history.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        { role: 'user', content: message }
      ];

      const response = await openai.chat.completions.create({
        model: config.model,
        messages,
        temperature: config.temperature,
        max_tokens: config.maxTokens,
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('Error generating AI response:', error);
      throw new Error('Failed to generate AI response');
    }
  }

  /**
   * Score the quality of a response on a scale of 1-5
   * @param {string} question - The survey question
   * @param {string} answer - The user's answer
   * @param {string} guidelines - Optional quality guidelines
   * @param {Object} survey - The survey object
   * @returns {Promise<number>} - Quality score from 1-5
   */
  async scoreResponseQuality(question, answer, guidelines = '', survey) {
    try {
      const config = await this.getLLMConfig('scoring', survey);

      const prompt = `
        You are an AI quality evaluator. Your task is to score the quality of a response to a survey question.
        
        Question: ${question}
        
        Response: ${answer}
        
        ${guidelines ? `Quality Guidelines: ${guidelines}` : ''}
        
        Please evaluate the response quality on a scale of 1-5, where:
        1 = Very poor quality (minimal effort, irrelevant)
        2 = Poor quality (short, vague, or partially irrelevant)
        3 = Acceptable quality (addresses the question but lacks depth)
        4 = Good quality (thoughtful, relevant, and somewhat detailed)
        5 = Excellent quality (comprehensive, insightful, and very detailed)
        
        Return only a single number from 1-5 representing your score.
      `;

      const response = await openai.chat.completions.create({
        model: config.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: config.temperature,
        max_tokens: config.maxTokens,
      });

      const scoreText = response.choices[0].message.content.trim();
      const score = parseInt(scoreText.match(/\d+/)[0]);
      
      // Ensure score is within 1-5 range
      return Math.min(Math.max(score, 1), 5);
    } catch (error) {
      console.error('Error scoring response quality:', error);
      // Default to middle score if scoring fails
      return 3;
    }
  }

  /**
   * Compare two AI models on a set of test cases
   * @param {string} modelA - First model to compare (e.g., 'gpt-4')
   * @param {string} modelB - Second model to compare (e.g., 'gpt-3.5-turbo')
   * @param {Array} testCases - Array of test questions
   * @returns {Promise<Object>} - Comparison results
   */
  async compareModels(modelA, modelB, testCases) {
    try {
      const results = {
        modelA,
        modelB,
        testResults: [],
        metrics: {
          averageAgreement: 0,
          costDifference: this.estimateModelCostDifference(modelA, modelB),
          latencyDifference: 0,
          qualityDifference: 0
        }
      };

      const startTime = Date.now();
      
      // Process each test case with both models
      for (const testCase of testCases) {
        const modelAStartTime = Date.now();
        const modelAResponse = await this.generateResponse(testCase, [], modelA);
        const modelATime = Date.now() - modelAStartTime;
        
        const modelBStartTime = Date.now();
        const modelBResponse = await this.generateResponse(testCase, [], modelB);
        const modelBTime = Date.now() - modelBStartTime;
        
        // Score both responses
        const modelAScore = await this.scoreResponseQuality(testCase, modelAResponse);
        const modelBScore = await this.scoreResponseQuality(testCase, modelBResponse);
        
        // Calculate agreement (how similar the responses are)
        const agreement = await this.calculateResponseAgreement(modelAResponse, modelBResponse);
        
        results.testResults.push({
          question: testCase,
          modelAResponse,
          modelBResponse,
          modelAScore,
          modelBScore,
          modelALatency: modelATime,
          modelBLatency: modelBTime,
          agreement
        });
      }
      
      // Calculate aggregate metrics
      const totalTests = results.testResults.length;
      
      if (totalTests > 0) {
        // Average agreement across all test cases
        results.metrics.averageAgreement = results.testResults.reduce(
          (sum, result) => sum + result.agreement, 0
        ) / totalTests;
        
        // Average latency difference
        const avgLatencyA = results.testResults.reduce(
          (sum, result) => sum + result.modelALatency, 0
        ) / totalTests;
        
        const avgLatencyB = results.testResults.reduce(
          (sum, result) => sum + result.modelBLatency, 0
        ) / totalTests;
        
        results.metrics.latencyDifference = avgLatencyA - avgLatencyB;
        
        // Average quality difference
        const avgQualityA = results.testResults.reduce(
          (sum, result) => sum + result.modelAScore, 0
        ) / totalTests;
        
        const avgQualityB = results.testResults.reduce(
          (sum, result) => sum + result.modelBScore, 0
        ) / totalTests;
        
        results.metrics.qualityDifference = avgQualityA - avgQualityB;
      }
      
      return results;
    } catch (error) {
      console.error('Error comparing models:', error);
      throw new Error('Failed to compare AI models');
    }
  }

  /**
   * Calculate agreement between two responses
   * @param {string} responseA - First response
   * @param {string} responseB - Second response
   * @returns {Promise<number>} - Agreement score from 0-1
   */
  async calculateResponseAgreement(responseA, responseB) {
    try {
      const prompt = `
        You are an AI evaluator. Your task is to determine how similar two responses are in terms of their content and meaning.
        
        Response A: ${responseA}
        
        Response B: ${responseB}
        
        Please evaluate the similarity on a scale of 0-1, where:
        0 = Completely different content and meaning
        0.5 = Some overlap in content or meaning
        1 = Very similar content and meaning
        
        Return only a single decimal number from 0-1 representing your similarity score.
      `;

      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 10,
      });

      const scoreText = response.choices[0].message.content.trim();
      const score = parseFloat(scoreText);
      
      // Ensure score is within 0-1 range
      return Math.min(Math.max(score, 0), 1);
    } catch (error) {
      console.error('Error calculating response agreement:', error);
      // Default to middle score if calculation fails
      return 0.5;
    }
  }

  /**
   * Estimate the cost difference between two models
   * @param {string} modelA - First model
   * @param {string} modelB - Second model
   * @returns {number} - Estimated cost ratio (modelA cost / modelB cost)
   */
  estimateModelCostDifference(modelA, modelB) {
    // Approximate cost ratios based on OpenAI pricing
    const modelCosts = {
      'gpt-4o': 10,
      'gpt-3.5-turbo': 1,
      'gpt-3.5-turbo-16k': 2
    };

    const costA = modelCosts[modelA] || 5;
    const costB = modelCosts[modelB] || 1;
    
    return costA / costB;
  }

  /**
   * Classify user intent
   * @param {string} message - The user's message
   * @param {Object} context - The conversation context
   * @param {Object} survey - The survey object
   * @returns {Promise<Object>} - The classified intent
   */
  async classifyIntent(message, context, survey) {
    try {
      const config = await this.getLLMConfig('intent_classification', survey);

      const systemPrompt = `
        You are an AI intent classifier for a survey chatbot. Your task is to classify the user's intent from their message.
        
        Available intents:
        - ANSWER_QUESTION: User is providing an answer to the current question
        - NAVIGATE_TO_QUESTION: User wants to go to a specific question
        - REVISE_ANSWER: User wants to modify their previous answer
        - SKIP_QUESTION: User wants to skip the current question
        - SUBMIT_SURVEY: User wants to submit the survey
        - SHOW_HELP: User wants to see available commands
        - UNKNOWN: Intent cannot be determined
        
        Current context:
        - Current question index: ${context.currentQuestionIndex}
        - Total questions: ${context.totalQuestions}
        - Survey completed: ${context.isCompleted}
        
        Return a JSON object with:
        - intent: The classified intent
        - confidence: A number between 0-1 indicating confidence
        - parameters: An object with any extracted parameters (e.g., question_number for navigation)
      `;

      const response = await openai.chat.completions.create({
        model: config.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        response_format: {
          type: "json_schema",
          json_schema: intentSchema
        },
        temperature: config.temperature,
        max_tokens: config.maxTokens
      });

      const result = JSON.parse(response.choices[0].message.content.trim());
      return result;
    } catch (error) {
      console.error('Error classifying intent:', error);
      return {
        intent: 'UNKNOWN',
        confidence: 0,
        parameters: {
          question_number: null
        }
      };
    }
  }

  /**
   * Generate improvement hint based on answer score and question
   * @param {string} question - The survey question
   * @param {string} answer - The user's answer
   * @param {number} score - The quality score (1-5)
   * @param {string} qualityGuidelines - Optional quality guidelines for the question
   * @param {Object} survey - The survey object
   * @returns {Promise<string>} - Improvement hint or empty string if score is 5
   */
  async generateImprovementHint(question, answer, score, qualityGuidelines = '', survey) {
    if (score === 5) return ''; // No hint needed for perfect score

    try {
      const config = await this.getLLMConfig('hint_generation', survey);

      const prompt = `
        You are an AI mentor helping improve survey responses. Analyze the following:

        Question: ${question}
        User's Answer: ${answer}
        Current Score: ${score}/5
        ${qualityGuidelines ? `Quality Guidelines: ${qualityGuidelines}` : ''}

        Based on the question requirements and the user's answer, provide a specific, actionable suggestion to improve the answer.
        Focus on:
        1. What specific aspects are missing or could be enhanced
        2. How to make the answer more relevant to the question
        3. Concrete examples or details that could be added
        4. Structure or clarity improvements if needed

        Keep the hint concise (1-2 sentences) and directly actionable.
        Start with "To improve your answer:" followed by the specific suggestion.

        Return only the improvement hint, nothing else.
      `;

      const response = await openai.chat.completions.create({
        model: config.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: config.temperature,
        max_tokens: config.maxTokens,
      });

      return response.choices[0].message.content.trim();
    } catch (error) {
      console.error('Error generating improvement hint:', error);
      return ''; // Return empty string if hint generation fails
    }
  }
}

module.exports = new AIService();
