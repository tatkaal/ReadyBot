const dotenv = require('dotenv');

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
   * Generate a response to a user message in a conversational context
   * @param {string} message - The user's message
   * @param {Array} history - Previous conversation history
   * @param {string} model - The OpenAI model to use (default: gpt-3.5-turbo)
   * @returns {Promise<string>} - The AI-generated response
   */
  async generateResponse(message, history = [], model = 'gpt-3.5-turbo') {
    try {
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
        model,
        messages,
        temperature: 0.7,
        max_tokens: 500,
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
   * @param {string} model - The OpenAI model to use (default: gpt-3.5-turbo)
   * @returns {Promise<number>} - Quality score from 1-5
   */
  async scoreResponseQuality(question, answer, guidelines = '', model = 'gpt-3.5-turbo') {
    try {
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
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 10,
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
   * Classify user intent from their message
   * @param {string} message - The user's message
   * @param {Object} context - Current survey context
   * @returns {Promise<Object>} - Intent classification result
   */
  async classifyIntent(message, context) {
    try {
      const systemPrompt = `
        You are an AI intent classifier for a survey application. Your task is to classify the user's message into one of the following intents:
  
        1. ANSWER_QUESTION - User is providing an answer to the current question (Consider even if it is incomplete or low-quality)
        2. NAVIGATE_TO_QUESTION - User wants to go to a specific question (e.g., "go to question 3")
        3. REVISE_ANSWER - User wants to revise a previous answer (e.g., "revise question 2")
        4. SKIP_QUESTION - User wants to skip the current question
        5. SUBMIT_SURVEY - User wants to submit the survey
        6. SHOW_HELP - User is asking for help or available actions
        7. UNKNOWN - Intent cannot be determined (Irrelevant text)
  
        For NAVIGATE_TO_QUESTION and REVISE_ANSWER intents, you MUST:
        - Extract the question number from the message
        - Include it in the parameters.question_number field
        - Set it to null for all other intents
  
        Examples:
        - "go to question 3" -> NAVIGATE_TO_QUESTION with parameters.question_number = 3
        - "revise question 2" -> REVISE_ANSWER with parameters.question_number = 2
        - "skip" -> SKIP_QUESTION with parameters.question_number = null
  
        Current context:
        - Current question index: ${context.currentQuestionIndex}
        - Total questions: ${context.totalQuestions}
        - Survey completed: ${context.isCompleted}
  
        User message: ${message}
      `;
  
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-2024-08-06',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        response_format: {
          type: "json_schema",
          json_schema: intentSchema
        },
        temperature: 0.3,
        max_tokens: 150
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
    }}
}

module.exports = new AIService();
