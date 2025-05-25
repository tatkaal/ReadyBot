const express = require('express');
const router = express.Router();
const llmConfigController = require('../controllers/LLMConfigController');
const auth = require('../middleware/auth');

// @route   GET api/llm-config
// @desc    Get all LLM configurations
// @access  Private
router.get('/', auth, llmConfigController.getAllConfigs);

// @route   POST api/llm-config
// @desc    Create new LLM configuration
// @access  Private
router.post('/', auth, llmConfigController.createConfig);

// @route   PUT api/llm-config/:id
// @desc    Update LLM configuration
// @access  Private
router.put('/:id', auth, llmConfigController.updateConfig);

// @route   DELETE api/llm-config/:id
// @desc    Delete LLM configuration
// @access  Private
router.delete('/:id', auth, llmConfigController.deleteConfig);

module.exports = router; 