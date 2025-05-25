const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ModelEvaluation = sequelize.define('ModelEvaluation', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    models: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
      validate: {
        isValidModels(value) {
          if (!Array.isArray(value)) {
            throw new Error('Models must be an array');
          }
          value.forEach(model => {
            if (!model.name || typeof model.costPerToken !== 'number') {
              throw new Error('Each model must have a name and costPerToken');
            }
          });
        }
      }
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'running',
      validate: {
        isIn: [['running', 'completed', 'failed']]
      }
    },
    results: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
      validate: {
        isValidResults(value) {
          if (!Array.isArray(value)) {
            throw new Error('Results must be an array');
          }
          value.forEach(result => {
            if (!result.modelName || typeof result.averageQualityScore !== 'number') {
              throw new Error('Each result must have a modelName and averageQualityScore');
            }
          });
        }
      }
    },
    modelComparisons: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
      validate: {
        isValidComparisons(value) {
          if (!Array.isArray(value)) {
            throw new Error('Model comparisons must be an array');
          }
          value.forEach(comparison => {
            if (!comparison.modelA || !comparison.modelB || !comparison.comparison) {
              throw new Error('Each comparison must have modelA, modelB, and comparison data');
            }
          });
        }
      }
    },
    testCases: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
      validate: {
        isValidTestCases(value) {
          if (!Array.isArray(value)) {
            throw new Error('Test cases must be an array');
          }
          value.forEach(testCase => {
            if (!testCase.question || !Array.isArray(testCase.expectedKeywords)) {
              throw new Error('Each test case must have a question and expectedKeywords array');
            }
          });
        }
      }
    },
    metrics: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
      validate: {
        isValidMetrics(value) {
          if (typeof value !== 'object') {
            throw new Error('Metrics must be an object');
          }
        }
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
    tableName: 'model_evaluations',
    timestamps: true
  });

  return ModelEvaluation;
};
