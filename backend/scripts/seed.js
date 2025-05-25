require('dotenv').config();
const bcrypt = require('bcrypt');
const { sequelize, Admin, Question, Survey } = require('../models');

// Sample data for seeding
const adminData = {
  username: 'admin',
  email: 'admin@readybot.com',
  password: 'admin' // Will be hashed before saving
};

const sampleQuestions = [
  {
    text: 'How would you rate your experience with AI-powered chatbots?',
    qualityGuidelines: 'Look for detailed responses that mention specific experiences and provide reasoning for their rating.'
  },
  {
    text: 'What features do you think are most important in a survey tool?',
    qualityGuidelines: 'High-quality answers should mention multiple features and explain why they are important.'
  },
  {
    text: 'How do you feel about AI evaluating the quality of your responses?',
    qualityGuidelines: 'Look for thoughtful considerations of both benefits and potential concerns.'
  },
  {
    text: 'What improvements would you suggest for our ReadyBot survey system?',
    qualityGuidelines: 'Quality responses should be constructive and specific, not vague or generic.'
  },
  {
    text: 'How likely are you to recommend ReadyBot to colleagues or friends?',
    qualityGuidelines: 'Good answers should explain reasoning behind their likelihood to recommend.'
  }
];

// Seed function
async function seedDatabase() {
  try {
    console.log('Starting database seeding...');
    
    // Sync database models (force: true will drop tables if they exist)
    await sequelize.sync({ force: true });
    console.log('Database synchronized');
    
    // Create default admin
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminData.password, salt);
    
    const admin = await Admin.create({
      username: adminData.username,
      email: adminData.email,
      password: hashedPassword
    });
    
    console.log(`Default admin created: ${admin.username}`);
    
    // Create sample questions
    const questions = [];
    for (const questionData of sampleQuestions) {
      const question = await Question.create({
        text: questionData.text,
        qualityGuidelines: questionData.qualityGuidelines,
        createdBy: admin.id
      });
      
      questions.push(question);
      console.log(`Sample question created: ${question.text.substring(0, 30)}...`);
    }
    
    // Create a sample survey
    const survey = await Survey.create({
      title: 'ReadyBot Feedback Survey',
      description: 'Help us improve ReadyBot by sharing your thoughts and experiences with our survey system.',
      uniqueId: 'demo123',
      shareableLink: 'http://localhost:3000/survey/demo123',
      isActive: true,
      createdBy: admin.id
    });
    
    // Add questions to survey
    await survey.addQuestions(questions);
    
    console.log(`Sample survey created: ${survey.title}`);
    console.log('Database seeding completed successfully!');
    
    return {
      admin,
      questions,
      survey
    };
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
}

// Run seeding if this script is executed directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('Seeding completed, exiting...');
      process.exit(0);
    })
    .catch(error => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = seedDatabase;
