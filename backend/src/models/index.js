const { Sequelize } = require('sequelize');
const config = require('../../config/database');

// Get the environment configuration
const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

// Create Sequelize instance
const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    logging: dbConfig.logging ? console.log : false,
    pool: dbConfig.pool || {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// Import models
const Admin = require('./Admin')(sequelize);
const Question = require('./Question')(sequelize);
const Survey = require('./Survey')(sequelize);
const Response = require('./Response')(sequelize);
const ModelEvaluation = require('./ModelEvaluation')(sequelize);
const LLMConfig = require('./LLMConfig')(sequelize);

// Define associations
Admin.hasMany(Question, { foreignKey: 'createdBy' });
Question.belongsTo(Admin, { foreignKey: 'createdBy' });

Admin.hasMany(Survey, { foreignKey: 'createdBy' });
Survey.belongsTo(Admin, { foreignKey: 'createdBy' });

Admin.hasMany(LLMConfig, { foreignKey: 'createdBy' });
LLMConfig.belongsTo(Admin, { foreignKey: 'createdBy' });

Survey.belongsToMany(Question, { through: 'SurveyQuestions' });
Question.belongsToMany(Survey, { through: 'SurveyQuestions' });

Survey.hasMany(Response, { foreignKey: 'surveyId' });
Response.belongsTo(Survey, { foreignKey: 'surveyId' });

Admin.hasMany(ModelEvaluation, { foreignKey: 'createdBy' });
ModelEvaluation.belongsTo(Admin, { foreignKey: 'createdBy' });

// Export models and Sequelize instance
module.exports = {
  sequelize,
  Admin,
  Question,
  Survey,
  Response,
  ModelEvaluation,
  LLMConfig
};
