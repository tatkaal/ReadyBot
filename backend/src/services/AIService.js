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
   * @returns {Promise<Object>} - The LLM configuration
   */
  async getLLMConfig(task) {
    try {
      // Return default configuration
      return {
        model: 'gpt-3.5-turbo',
        temperature: 0.7,
        maxTokens: 500
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
   * @param {string} prompt - The user's message
   * @param {string} model - The AI model to use
   * @param {number} temperature - The temperature for the model
   * @returns {Promise<string>} - The AI-generated response
   */
  async generateResponse(prompt, model, temperature = 0.7) {
    try {
      const config = await this.getLLMConfig('response_generation');
      const messages = [
        { role: 'system', content: 'You are a helpful AI assistant.' },
        { role: 'user', content: prompt }
      ];

      const response = await openai.chat.completions.create({
        model: model,
        messages: messages,
        temperature: temperature,
        max_tokens: config.maxTokens,
        top_p: config.topP,
        frequency_penalty: config.frequencyPenalty,
        presence_penalty: config.presencePenalty
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
      const config = await this.getLLMConfig('scoring');

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
   * @param {string} prompt - The test prompt
   * @returns {Promise<Object>} - Comparison results
   */
  async compareModels(modelA, modelB, prompt) {
    try {
      const responseA = await this.generateResponse(prompt, modelA);
      const responseB = await this.generateResponse(prompt, modelB);

      const comparisonPrompt = `You are an AI model evaluator. Compare these two responses and determine which is better. Consider accuracy, completeness, and clarity.

Response A: ${responseA}

Response B: ${responseB}

You must respond with a valid JSON object in exactly this format, with no additional text:
{
  "winner": "A" or "B",
  "qualityDifference": number between 0 and 1,
  "reasoning": "detailed explanation"
}

Do not include any text before or after the JSON object.`;

      const comparisonResponse = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'You are a JSON-only response generator. You must respond with valid JSON only.' },
          { role: 'user', content: comparisonPrompt }
        ],
        temperature: 0.3,
        max_tokens: 500,
        response_format: { type: "json_object" }
      });
      
      try {
        const comparison = JSON.parse(comparisonResponse.choices[0].message.content);
        
        // Validate the response format
        if (!comparison.winner || !comparison.qualityDifference || !comparison.reasoning) {
          throw new Error('Invalid comparison format');
        }
        
        // Ensure winner is either A or B
        if (comparison.winner !== 'A' && comparison.winner !== 'B') {
          comparison.winner = 'A'; // Default to A if invalid
        }
        
        // Ensure qualityDifference is a number between 0 and 1
        comparison.qualityDifference = Math.min(Math.max(Number(comparison.qualityDifference), 0), 1);
        
        return {
          modelA,
          modelB,
          responseA,
          responseB,
          comparison
        };
      } catch (parseError) {
        console.error('Error parsing comparison response:', parseError);
        // Return a default comparison if parsing fails
        return {
          modelA,
          modelB,
          responseA,
          responseB,
          comparison: {
            winner: 'A',
            qualityDifference: 0.5,
            reasoning: "Unable to determine a clear winner due to technical limitations"
          }
        };
      }
    } catch (error) {
      console.error('Error comparing models:', error);
      // Return a default comparison if the entire process fails
      return {
        modelA,
        modelB,
        responseA: "Error generating response",
        responseB: "Error generating response",
        comparison: {
          winner: 'A',
          qualityDifference: 0.5,
          reasoning: "Comparison failed due to technical limitations"
        }
      };
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
      const config = await this.getLLMConfig('intent_classification');

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
      const config = await this.getLLMConfig('hint_generation');

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

  /**
   * Compare two responses using an LLM judge
   * @param {string} question - The original question
   * @param {string} responseA - First response to compare
   * @param {string} responseB - Second response to compare
   * @returns {Promise<Object>} - Comparison results with winner and reasoning
   */
  async compareResponses(question, responseA, responseB) {
    try {
      const prompt = `
        You are an AI judge comparing two responses to the same question.
        
        Question: ${question}
        
        Response A: ${responseA}
        
        Response B: ${responseB}
        
        Please evaluate which response is better and explain why. Consider:
        1. Relevance to the question
        2. Completeness of the answer
        3. Clarity and organization
        4. Depth of insight
        
        Return your evaluation in the following JSON format:
        {
          "winner": "A" or "B",
          "reasoning": "Detailed explanation of why one response is better",
          "scoreA": number between 1-5,
          "scoreB": number between 1-5
        }
      `;

      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 500,
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error('Error comparing responses:', error);
      throw new Error('Failed to compare responses');
    }
  }

  /**
   * Evaluate the completeness of a response against expected keywords
   * @param {string} question - The original question
   * @param {string} responseText - The response to evaluate
   * @param {Array<string>} expectedKeywords - Keywords that should be present
   * @returns {Promise<Object>} - Completeness evaluation results
   */
  async evaluateResponseCompleteness(question, responseText, expectedKeywords = []) {
    try {
      const prompt = `
        You are an AI evaluator assessing the completeness of a response.
        
        Question: ${question}
        
        Response: ${responseText}
        
        ${expectedKeywords.length > 0 ? `Expected Keywords: ${expectedKeywords.join(', ')}` : ''}
        
        Please evaluate the response's completeness and return your assessment in the following JSON format:
        {
          "completenessScore": number between 0-1,
          "missingKeywords": ["list", "of", "missing", "keywords"],
          "presentKeywords": ["list", "of", "found", "keywords"],
          "analysis": "Brief explanation of the completeness assessment"
        }
      `;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 500,
      });

      return JSON.parse(completion.choices[0].message.content);
    } catch (error) {
      console.error('Error evaluating response completeness:', error);
      // Return a default completeness assessment if evaluation fails
      return {
        completenessScore: 0.5,
        missingKeywords: [],
        presentKeywords: [],
        analysis: "Unable to evaluate completeness due to an error"
      };
    }
  }

  /**
   * Calculate the cost-performance ratio for a model
   * @param {string} model - The model to evaluate
   * @param {Array<Object>} testCases - Array of test cases
   * @returns {Promise<Object>} - Cost-performance metrics
   */
  async calculateCostPerformanceRatio(model, testCases) {
    try {
      const results = {
        totalCost: 0,
        totalQuality: 0,
        averageResponseTime: 0,
        tokenUsage: 0
      };

      for (const testCase of testCases) {
        const startTime = Date.now();
        const response = await this.generateResponse(testCase.question, model);
        const responseTime = Date.now() - startTime;

        const qualityScore = await this.scoreResponseQuality(testCase.question, response);
        const tokenCount = response.split(/\s+/).length;
        const cost = tokenCount * this.getModelCostPerToken(model);

        results.totalCost += cost;
        results.totalQuality += qualityScore;
        results.averageResponseTime += responseTime;
        results.tokenUsage += tokenCount;
      }

      const testCount = testCases.length;
      results.averageResponseTime /= testCount;
      results.averageQuality = results.totalQuality / testCount;
      results.costPerformanceRatio = results.averageQuality / results.totalCost;

      return results;
    } catch (error) {
      console.error('Error calculating cost-performance ratio:', error);
      throw new Error('Failed to calculate cost-performance ratio');
    }
  }

  /**
   * Get the cost per token for a specific model
   * @param {string} model - The model name
   * @returns {number} - Cost per token
   */
  getModelCostPerToken(model) {
    const costs = {
      'gpt-4': 0.00006,
      'gpt-4-0314': 0.00006,
      'gpt-4-0613': 0.00006,
      'gpt-3.5-turbo': 0.000002,
      'gpt-3.5-turbo-0301': 0.000002,
      'gpt-3.5-turbo-0613': 0.000002
    };

    return costs[model] || 0.000002; // Default to gpt-3.5-turbo cost if unknown
  }
}

module.exports = new AIService();
