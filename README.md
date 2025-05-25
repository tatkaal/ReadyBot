# ReadyBot - AI-Powered Survey Platform

ReadyBot is a comprehensive survey platform that leverages AI to enhance survey creation, response analysis, and model evaluation. The platform provides tools for creating, managing, and analyzing surveys with advanced AI capabilities.

## Features

### Survey Management
- Create and manage surveys with customizable questions
- Support for multiple question types
- Real-time survey status tracking
- Survey response collection and analysis

### AI-Powered Features
- AI-assisted survey question generation
- Response quality scoring and analysis
- Intent classification for user interactions
- Response completeness evaluation
- Model performance comparison

### Model Evaluation System
- Compare different AI models (GPT-4, GPT-3.5-turbo, etc.)
- Evaluate models based on:
  - Response quality
  - Completeness
  - Response time
  - Cost efficiency
- Detailed performance metrics and visualizations
- Side-by-side model comparisons
- Cost-performance analysis

### Authentication & Security
- JWT-based authentication
- Role-based access control
- Secure API endpoints
- Environment variable configuration

## Tech Stack

### Frontend
- React.js
- Material-UI
- Chart.js for visualizations
- Framer Motion for animations
- Axios for API communication

### Backend
- Node.js
- Express.js
- Sequelize ORM
- PostgreSQL database
- OpenAI API integration

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- PostgreSQL
- OpenAI API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/readybot.git
cd readybot
```

2. Install dependencies:
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

3. Configure environment variables:
```bash
# Backend (.env)
DATABASE_URL=postgresql://username:password@localhost:5432/readybot
JWT_SECRET=your_jwt_secret
OPENAI_API_KEY=your_openai_api_key

# Frontend (.env)
VITE_API_URL=http://localhost:5000
```

4. Initialize the database:
```bash
cd backend
npm run migrate
```

5. Start the development servers:
```bash
# Start backend server
cd backend
npm run dev

# Start frontend server
cd frontend
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new admin
- `POST /api/auth/login` - Admin login

### Surveys
- `GET /api/surveys` - Get all surveys
- `POST /api/surveys` - Create new survey
- `GET /api/surveys/:id` - Get survey by ID
- `PUT /api/surveys/:id` - Update survey
- `DELETE /api/surveys/:id` - Delete survey

### Model Evaluation
- `GET /api/evaluation` - Get all evaluations
- `POST /api/evaluation` - Create new evaluation
- `GET /api/evaluation/:id` - Get evaluation by ID
- `POST /api/evaluation/:id/run` - Run evaluation
- `DELETE /api/evaluation/:id` - Delete evaluation

## Model Evaluation Features

### Supported Models
- GPT-4
- GPT-3.5-turbo
- GPT-3.5-turbo-16k

### Evaluation Metrics
- Quality Score (1-5 scale)
- Completeness Score (0-1 scale)
- Response Time
- Token Usage
- Cost Analysis

### Comparison Features
- Side-by-side model comparisons
- Performance charts
- Cost-performance ratios
- Detailed test case results

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- OpenAI for providing the AI models
- Material-UI for the component library
- Chart.js for visualization capabilities
