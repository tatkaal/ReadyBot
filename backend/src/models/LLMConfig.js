const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const LLMConfig = sequelize.define('LLMConfig', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    model: {
      type: DataTypes.STRING,
      allowNull: false
    },
    task: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: [['intent_classification', 'response_generation', 'scoring', 'hint_generation']]
      }
    },
    temperature: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0.7,
      validate: {
        min: 0,
        max: 1
      }
    },
    maxTokens: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 500
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'admins',
        key: 'id'
      }
    }
  }, {
    tableName: 'llm_configs',
    timestamps: true
  });

  return LLMConfig;
}; 