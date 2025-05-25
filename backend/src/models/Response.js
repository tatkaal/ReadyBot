const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Response = sequelize.define('Response', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    surveyId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'surveys',
        key: 'id'
      }
    },
    participantId: {
      type: DataTypes.STRING,
      allowNull: false
    },
    answers: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: []
    },
    startedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    sessionData: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {
        currentQuestionIndex: 0,
        completedQuestions: [],
        skippedQuestions: []
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
    tableName: 'responses',
    timestamps: true
  });

  return Response;
};
