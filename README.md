# Food Ordering Platform

A full-stack food ordering platform that enables users to browse food items by category, manage a shopping cart, and place orders with secure authentication and real-time inventory management.

## Features

- **User Authentication**: Secure registration and login with JWT tokens
- **Food Inventory**: Browse items by categories (Fruits, Vegetables, Non-veg, Breads)
- **Shopping Cart**: Add items, manage quantities, and sync across devices
- **Order Management**: Place orders with stock validation and track order history
- **Real-time Updates**: WebSocket integration for live stock updates and cart synchronization
- **Responsive Design**: Mobile-friendly interface built with Tailwind CSS

## Tech Stack

### Frontend

- **React.js 19+** with TypeScript
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Axios** for API communication
- **Socket.io Client** for real-time features
- **React Hook Form** for form handling
- **Three.js** for interactive elements

## Hero Section 
<img width="1470" height="834" alt="Screenshot 2025-11-07 at 22 14 55" src="https://github.com/user-attachments/assets/1d3a1d31-87ac-4ec8-b70f-e61d0b088425" />

## Featured section
<img width="1470" height="834" alt="Screenshot 2025-11-07 at 08 54 53" src="https://github.com/user-attachments/assets/ce7482d8-6ad3-480b-92c3-2905b2939966" />

## Menu section
<img width="1470" height="834" alt="Screenshot 2025-11-07 at 13 38 07" src="https://github.com/user-attachments/assets/78e4a39f-cb56-40ad-bb9a-22b235e62886" />

## Cart section
<img width="1470" height="834" alt="Screenshot 2025-11-07 at 13 39 22" src="https://github.com/user-attachments/assets/890f51b3-1f06-4b81-896f-ac22d4ad0dbe" />

## Order Summary
<img width="1470" height="834" alt="Screenshot 2025-11-07 at 13 39 56" src="https://github.com/user-attachments/assets/144f7fce-6128-4df3-a447-f32dce37e44a" />

## Order History
<img width="1470" height="834" alt="Screenshot 2025-11-07 at 13 40 06" src="https://github.com/user-attachments/assets/5c6d833c-b666-4f9a-bc10-10b8c4e0bda4" />

### Backend

- **Node.js** with Express.js framework
- **TypeScript** for type safety
- **MongoDB** with Mongoose ODM
- **Redis** for caching and session management
- **JWT** for authentication
- **bcrypt** for password hashing
- **Socket.io** for real-time communication
- **Express Validator** for input validation

### Database & Infrastructure

- **MongoDB** for primary data storage
- **Redis** for caching and session storage
- **WebSocket** for real-time features

## Prerequisites

Before running this application, ensure you have the following installed:

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **MongoDB** (local installation or MongoDB Atlas)
- **Redis** (optional but recommended for production)

## Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd food-ordering-platform
npm run install:all
```

### 2. Environment Setup

Copy the backend environment example file:

```bash
cp backend/.env.example backend/.env
```

Update the environment variables in `backend/.env`:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/food-ordering-platform

# Redis Configuration (Optional)
REDIS_URL=redis://localhost:6379

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h
REFRESH_TOKEN_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
FRONTEND_URL=http://localhost:3000

# Security Configuration
BCRYPT_SALT_ROUNDS=12
```

### 3. Database Setup

Start MongoDB and optionally seed the database with sample data:

```bash
# Seed inventory with sample food items
npm run seed:inventory

# Clear and reseed inventory (optional)
npm run seed:inventory:clear
```

### 4. Run the Application

**Development Mode** (recommended for development):

```bash
npm run dev
```

This starts both frontend (http://localhost:3000) and backend (http://localhost:5000) concurrently.

**Run Services Separately**:

```bash
# Frontend only
npm run dev:frontend

# Backend only
npm run dev:backend
```

**Production Mode**:

```bash
npm run build
npm start
```

## Available Scripts

### Root Level Scripts

- `npm run dev` - Run both frontend and backend in development mode
- `npm run build` - Build both frontend and backend for production
- `npm start` - Start production server
- `npm test` - Run all tests
- `npm run install:all` - Install dependencies for all packages

### Backend Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Start production server
- `npm test` - Run Jest tests
- `npm run test:coverage` - Run tests with coverage report
- `npm run seed:inventory` - Seed database with sample food items
- `npm run cart:cleanup` - Clean up expired cart sessions

### Frontend Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run React tests

## Project Structure

```
food-ordering-platform/
├── frontend/                     # React.js frontend application
│   ├── public/                   # Static assets
│   ├── src/
│   │   ├── components/           # React components
│   │   │   ├── auth/            # Authentication components
│   │   │   ├── cart/            # Shopping cart components
│   │   │   ├── checkout/        # Checkout process components
│   │   │   ├── common/          # Shared/common components
│   │   │   ├── inventory/       # Food inventory components
│   │   │   ├── layout/          # Layout components
│   │   │   ├── orders/          # Order management components
│   │   │   └── pages/           # Page components
│   │   ├── context/             # React context providers
│   │   ├── hooks/               # Custom React hooks
│   │   ├── services/            # API service functions
│   │   ├── types/               # TypeScript type definitions
│   │   └── utils/               # Utility functions
│   ├── package.json
│   └── tailwind.config.js
├── backend/                      # Node.js backend application
│   ├── src/
│   │   ├── controllers/         # Route controllers
│   │   ├── middleware/          # Express middleware
│   │   ├── models/              # MongoDB/Mongoose models
│   │   ├── routes/              # API route definitions
│   │   ├── scripts/             # Database scripts and utilities
│   │   ├── services/            # Business logic services
│   │   ├── utils/               # Utility functions
│   │   ├── __tests__/           # Test files
│   │   └── index.ts             # Application entry point
│   ├── package.json
│   ├── tsconfig.json
│   └── .env                     # Environment variables
├── .kiro/                       # Kiro specification files
│   └── specs/
│       └── food-ordering-platform/
│           ├── requirements.md   # Feature requirements
│           ├── design.md        # System design document
│           └── tasks.md         # Implementation tasks
├── package.json                 # Root package.json for scripts
└── README.md                    # This file
```

## Testing

The application includes comprehensive test coverage:

### Run All Tests

```bash
npm test
```

### Frontend Tests

```bash
cd frontend && npm test
```

### Backend Tests

```bash
cd backend && npm test

# With coverage report
cd backend && npm run test:coverage
```

### Test Coverage

- Authentication system tests
- Inventory management tests
- Cart functionality tests
- Order processing tests
- Component unit tests
- Integration tests

## Development Guidelines

### Code Style

- Use TypeScript for type safety
- Follow ESLint and Prettier configurations
- Use meaningful variable and function names
- Write comprehensive JSDoc comments for functions

### Git Workflow

- Use meaningful commit messages
- Create feature branches for new functionality
- Test changes before submitting pull requests
- Follow conventional commit format

### API Development

- All endpoints require proper validation
- Use appropriate HTTP status codes
- Implement proper error handling
- Add rate limiting for security

### Frontend Development

- Use functional components with hooks
- Implement proper error boundaries
- Follow responsive design principles
- Optimize for performance and accessibility

## Troubleshooting

### Common Issues

**MongoDB Connection Error**:

- Ensure MongoDB is running
- Check MONGODB_URI in .env file
- Verify network connectivity for MongoDB Atlas

**Redis Connection Error**:

- Redis is optional for development
- Comment out Redis configuration if not using
- Ensure Redis server is running if configured

**Port Already in Use**:

- Change PORT in backend/.env
- Update CORS_ORIGIN and FRONTEND_URL accordingly
- Restart the application

**Build Errors**:

- Clear node_modules and reinstall: `rm -rf node_modules package-lock.json && npm install`
- Check TypeScript errors: `npm run build`
- Verify all dependencies are installed

### Performance Optimization

**Frontend**:

- Images are lazy-loaded
- Components use React.memo where appropriate
- Bundle splitting is configured
- Service worker caching is implemented

**Backend**:

- Database queries are optimized with indexes
- Redis caching reduces database load
- Rate limiting prevents abuse
- Connection pooling is configured

## Security Features

- **Authentication**: JWT-based with refresh tokens
- **Password Security**: bcrypt hashing with salt rounds
- **Input Validation**: Comprehensive validation on all endpoints
- **Rate Limiting**: Protection against brute force attacks
- **CORS**: Configured for specific origins
- **Security Headers**: Helmet.js for security headers
- **Data Sanitization**: Input sanitization to prevent injection attacks

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes and add tests
4. Ensure all tests pass: `npm test`
5. Commit your changes: `git commit -m 'Add some feature'`
6. Push to the branch: `git push origin feature/your-feature-name`
7. Submit a pull request

## License

This project is licensed under the ISC License - see the LICENSE file for details.

## Support

For support and questions:

- Check the troubleshooting section above
- Review the API documentation below
- Create an issue in the repository
- Check existing issues for similar problems
