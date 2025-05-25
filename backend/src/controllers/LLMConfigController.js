const { LLMConfig } = require('../models');

// Get all LLM configurations
exports.getAllConfigs = async (req, res) => {
  try {
    const configs = await LLMConfig.findAll({
      where: { createdBy: req.admin.id },
      order: [['createdAt', 'DESC']]
    });
    
    res.json(configs);
  } catch (error) {
    console.error('Get LLM configs error:', error);
    res.status(500).json({ message: 'Server error retrieving LLM configurations' });
  }
};

// Create new LLM configuration
exports.createConfig = async (req, res) => {
  try {
    const { name, model, task, temperature, maxTokens } = req.body;
    
    if (!name || !model || !task) {
      return res.status(400).json({ message: 'Name, model, and task are required' });
    }
    
    const config = await LLMConfig.create({
      name,
      model,
      task,
      temperature: temperature || 0.7,
      maxTokens: maxTokens || 500,
      createdBy: req.admin.id
    });
    
    res.status(201).json(config);
  } catch (error) {
    console.error('Create LLM config error:', error);
    res.status(500).json({ message: 'Server error creating LLM configuration' });
  }
};

// Update LLM configuration
exports.updateConfig = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, model, task, temperature, maxTokens, isActive } = req.body;
    
    const config = await LLMConfig.findOne({
      where: { 
        id,
        createdBy: req.admin.id
      }
    });
    
    if (!config) {
      return res.status(404).json({ message: 'LLM configuration not found' });
    }
    
    await config.update({
      name: name || config.name,
      model: model || config.model,
      task: task || config.task,
      temperature: temperature !== undefined ? temperature : config.temperature,
      maxTokens: maxTokens || config.maxTokens,
      isActive: isActive !== undefined ? isActive : config.isActive
    });
    
    res.json(config);
  } catch (error) {
    console.error('Update LLM config error:', error);
    res.status(500).json({ message: 'Server error updating LLM configuration' });
  }
};

// Delete LLM configuration
exports.deleteConfig = async (req, res) => {
  try {
    const { id } = req.params;
    
    const config = await LLMConfig.findOne({
      where: { 
        id,
        createdBy: req.admin.id
      }
    });
    
    if (!config) {
      return res.status(404).json({ message: 'LLM configuration not found' });
    }
    
    await config.destroy();
    
    res.json({ message: 'LLM configuration deleted successfully' });
  } catch (error) {
    console.error('Delete LLM config error:', error);
    res.status(500).json({ message: 'Server error deleting LLM configuration' });
  }
}; 