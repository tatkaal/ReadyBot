const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Survey = sequelize.define('Survey', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    uniqueId: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: true
    },
    shareableLink: {
      type: DataTypes.STRING,
      allowNull: false
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    llmConfigs: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {
        intent_classification: null,
        response_generation: null,
        scoring: null,
        hint_generation: null
      }
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'admins',
        key: 'id'
      }
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'surveys',
    timestamps: true
  });

  return Survey;
};
