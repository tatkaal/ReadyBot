# ReadyBot 🤖

<div align="center">

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node.js](https://img.shields.io/badge/Node.js-v18.x-green)
![React](https://img.shields.io/badge/React-v18.x-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-v14.x-blue)
![Docker](https://img.shields.io/badge/Docker-Enabled-blue)

*Survey Smarter, Not Harder - AI-Powered Conversational Surveys*

</div>

## 📋 Table of Contents
- [Overview](#overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Architecture](#-architecture)
- [API Documentation](#-api-documentation)
- [Development Guide](#-development-guide)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

## Overview

ReadyBot is an innovative survey platform that leverages artificial intelligence to create engaging, conversational survey experiences. It transforms traditional surveys into dynamic, interactive conversations, making the data collection process more engaging and insightful.

### Key Benefits
- 🎯 **Higher Response Rates**: Conversational interface increases participant engagement
- 📊 **Quality Insights**: AI-powered response analysis and scoring
- 🔄 **Real-time Analytics**: Instant access to survey results and trends
- 🛠️ **Flexible Administration**: Comprehensive tools for survey management

## ✨ Features

### For Administrators
- 📝 **Question Management**
  - Create, edit, and organize survey questions
  - Support for multiple question types
  - AI-powered question suggestions

- 📊 **Survey Creation**
  - Dynamic survey builder
  - Customizable survey flows
  - Shareable survey links
  - Real-time response tracking

- 📈 **Analytics Dashboard**
  - Response quality scoring (1-5 scale)
  - Trend analysis
  - Export capabilities
  - Custom report generation

### For Participants
- 💬 **Conversational Interface**
  - Natural language interaction
  - Context-aware responses
  - Progress tracking
  - Mobile-responsive design

## 🛠 Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Sequelize
- **Authentication**: JWT
- **AI Integration**: OpenAI API

### Frontend
- **Framework**: React
- **UI Library**: Material UI
- **Animations**: Framer Motion
- **State Management**: React Context
- **Routing**: React Router

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Version Control**: Git
- **CI/CD**: GitHub Actions

## 🚀 Getting Started

### Prerequisites
- Docker and Docker Compose
- Node.js (v18.x or later)
- PostgreSQL (v14.x or later)
- OpenAI API key

### Quick Start

1. **Clone the Repository**
   ```bash
   git clone https://github.com/yourusername/readybot.git
   cd readybot
   ```

2. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   # Database Configuration
   DB_USERNAME=postgres
   DB_PASSWORD=postgres
   DB_NAME=readybot
   DB_HOST=postgres
   DB_PORT=5432

   # JWT Configuration
   JWT_SECRET=your-secret-key

   # OpenAI Configuration
   OPENAI_API_KEY=your-openai-api-key

   # Server Configuration
   PORT=5000
   NODE_ENV=development
   ```

3. **Launch with Docker**
   ```bash
   docker-compose up -d
   ```

4. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - Default Admin Credentials:
     - Username: admin
     - Password: admin

## 🏗 Architecture

### System Components
```
readybot/
├── frontend/          # React frontend application
├── backend/           # Node.js backend server
├── database/          # Database migrations and seeds
└── docker/           # Docker configuration files
```

### Key Workflows
1. **Survey Creation Flow**
   - Admin creates questions
   - Builds survey structure
   - Generates shareable link

2. **Response Collection Flow**
   - Participant accesses survey
   - Conversational interaction
   - AI-powered response analysis
   - Data storage and scoring

## 📚 API Documentation

### Core Endpoints

#### Authentication
- `POST /api/auth/login` - Admin login
- `POST /api/auth/register` - Admin registration

#### Surveys
- `GET /api/surveys` - List all surveys
- `POST /api/surveys` - Create new survey
- `GET /api/surveys/:id` - Get survey details
- `PUT /api/surveys/:id` - Update survey
- `DELETE /api/surveys/:id` - Delete survey

#### Questions
- `GET /api/questions` - List all questions
- `POST /api/questions` - Create new question
- `PUT /api/questions/:id` - Update question
- `DELETE /api/questions/:id` - Delete question

#### Responses
- `POST /api/responses` - Submit survey response
- `GET /api/responses/:surveyId` - Get survey responses
- `GET /api/responses/analytics` - Get response analytics

## 👨‍💻 Development Guide

### Local Development Setup

1. **Backend Development**
   ```bash
   cd backend
   npm install
   npm run dev
   ```

2. **Frontend Development**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. **Database Management**
   ```bash
   cd backend
   npm run migrate
   npm run seed
   ```

### Testing
```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## 🚢 Deployment

### Production Deployment
1. Set up production environment variables
2. Build frontend assets
3. Configure database
4. Deploy using Docker Compose

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Environment Variables
Ensure all required environment variables are set in production:
- Database credentials
- JWT secret
- OpenAI API key
- Production URLs
- SSL certificates

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines
- Follow the existing code style
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support, please open an issue in the GitHub repository or contact the development team.

---

<div align="center">
Made with ❤️ by the ReadyBot Team
</div>
