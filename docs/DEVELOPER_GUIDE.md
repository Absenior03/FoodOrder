# Developer Guide - Food Ordering Platform

This guide provides comprehensive information for developers working on the Food Ordering Platform.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Development Setup](#development-setup)
3. [Code Structure](#code-structure)
4. [Development Workflow](#development-workflow)
5. [Testing Strategy](#testing-strategy)
6. [API Development](#api-development)
7. [Frontend Development](#frontend-development)
8. [Database Management](#database-management)
9. [Security Guidelines](#security-guidelines)
10. [Performance Optimization](#performance-optimization)
11. [Deployment](#deployment)

## Architecture Overview

### System Architecture

The application follows a modern full-stack architecture:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Database      │
│   React.js      │◄──►│   Express.js    │◄──►│   MongoDB       │
│   TypeScript    │    │   TypeScript    │    │   Redis         │
│   Tailwind CSS  │    │   JWT Auth      │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Technology Stack

**Frontend:**

- React.js 19+ with TypeScript
- Tailwind CSS for styling
- React Router for navigation
- Axios for API communication
- Socket.io Client for real-time features
- React Hook Form for form handling

**Backend:**

- Node.js with Express.js
- TypeScript for type safety
- MongoDB with Mongoose ODM
- Redis for caching and sessions
- JWT for authentication
- Socket.io for WebSocket communication

**Development Tools:**

- Jest for testing
- ESLint for code linting
- Prettier for code formatting
- Nodemon for development server
- Concurrently for running multiple processes

## Development Setup

### Prerequisites

```bash
# Required software
node --version    # v16 or higher
npm --version     # v8 or higher
git --version     # Latest stable
```

### Initial Setup

```bash
# Clone repository
git clone <repository-url>
cd food-ordering-platform

# Install all dependencies
npm run install:all

# Copy environment files
cp backend/.env.example backend/.env

# Start MongoDB (local development)
mongod --dbpath /path/to/your/db

# Start Redis (optional)
redis-server

# Seed database with sample data
cd backend && npm run seed:inventory
```

### Environment Configuration

**Backend Environment Variables (.env):**

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/food-ordering-platform
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your-development-secret-key
JWT_EXPIRES_IN=24h
REFRESH_TOKEN_EXPIRES_IN=7d

# Security
BCRYPT_SALT_ROUNDS=12
CORS_ORIGIN=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Development Commands

```bash
# Start development servers
npm run dev                 # Both frontend and backend
npm run dev:frontend        # Frontend only (port 3000)
npm run dev:backend         # Backend only (port 5000)

# Build for production
npm run build              # Build both
npm run build:frontend     # Build frontend only
npm run build:backend      # Build backend only

# Testing
npm test                   # Run all tests
npm run test:frontend      # Frontend tests only
npm run test:backend       # Backend tests only
npm run test:coverage      # Backend tests with coverage

# Database operations
npm run seed:inventory     # Seed sample data
npm run cart:cleanup       # Clean expired carts
```

## Code Structure

### Project Organization

```
food-ordering-platform/
├── frontend/                    # React.js application
│   ├── public/                  # Static assets
│   ├── src/
│   │   ├── components/          # React components
│   │   │   ├── auth/           # Authentication components
│   │   │   ├── cart/           # Shopping cart components
│   │   │   ├── checkout/       # Checkout process
│   │   │   ├── common/         # Shared components
│   │   │   ├── inventory/      # Food inventory
│   │   │   ├── layout/         # Layout components
│   │   │   ├── orders/         # Order management
│   │   │   └── pages/          # Page components
│   │   ├── context/            # React Context providers
│   │   ├── hooks/              # Custom React hooks
│   │   ├── services/           # API service functions
│   │   ├── types/              # TypeScript definitions
│   │   └── utils/              # Utility functions
│   └── package.json
├── backend/                     # Node.js application
│   ├── src/
│   │   ├── controllers/        # Route controllers
│   │   ├── middleware/         # Express middleware
│   │   ├── models/             # Mongoose models
│   │   ├── routes/             # API route definitions
│   │   ├── scripts/            # Database scripts
│   │   ├── services/           # Business logic
│   │   ├── utils/              # Utility functions
│   │   ├── __tests__/          # Test files
│   │   └── index.ts            # Application entry
│   └── package.json
├── docs/                       # Documentation
└── package.json                # Root package.json
```

### Naming Conventions

**Files and Directories:**

- Use **camelCase** for file names: `userService.ts`
- Use **PascalCase** for React components: `UserProfile.tsx`
- Use **kebab-case** for directories: `user-management/`
- Use **UPPER_CASE** for constants: `API_ENDPOINTS.ts`

**Code Conventions:**

- **Interfaces**: PascalCase with 'I' prefix: `IUser`
- **Types**: PascalCase: `UserRole`
- **Enums**: PascalCase: `OrderStatus`
- **Functions**: camelCase: `getUserById`
- **Variables**: camelCase: `currentUser`
- **Constants**: UPPER_SNAKE_CASE: `MAX_RETRY_ATTEMPTS`

### Component Structure

**React Component Template:**

```typescript
// UserProfile.tsx
import React, { useState, useEffect } from "react";
import { User } from "../types/auth";
import { userService } from "../services/userService";

interface UserProfileProps {
  userId: string;
  onUpdate?: (user: User) => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({
  userId,
  onUpdate,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUser();
  }, [userId]);

  const loadUser = async () => {
    try {
      setLoading(true);
      const userData = await userService.getUser(userId);
      setUser(userData);
    } catch (err) {
      setError("Failed to load user");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!user) return <div>User not found</div>;

  return <div className="user-profile">{/* Component JSX */}</div>;
};

export default UserProfile;
```

**Backend Controller Template:**

```typescript
// userController.ts
import { Request, Response } from "express";
import { userService } from "../services/userService";
import { ApiResponse } from "../types/api";

export class UserController {
  /**
   * Get user profile
   * @route GET /api/users/profile
   */
  static async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "User not authenticated",
          },
        });
        return;
      }

      const user = await userService.getUserById(userId);

      const response: ApiResponse = {
        success: true,
        data: { user },
        message: "Profile retrieved successfully",
      };

      res.json(response);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: "Failed to retrieve profile",
        },
      });
    }
  }
}
```

## Development Workflow

### Git Workflow

**Branch Naming:**

- `feature/user-authentication`
- `bugfix/cart-sync-issue`
- `hotfix/security-patch`
- `refactor/api-structure`

**Commit Messages:**

```
feat: add user authentication system
fix: resolve cart synchronization issue
docs: update API documentation
test: add unit tests for order service
refactor: improve error handling structure
```

**Pull Request Process:**

1. Create feature branch from `main`
2. Implement changes with tests
3. Run full test suite
4. Update documentation if needed
5. Create pull request with description
6. Code review and approval
7. Merge to main branch

### Code Review Guidelines

**What to Review:**

- Code functionality and logic
- TypeScript type safety
- Error handling
- Security considerations
- Performance implications
- Test coverage
- Documentation updates

**Review Checklist:**

- [ ] Code follows project conventions
- [ ] All tests pass
- [ ] No security vulnerabilities
- [ ] Performance is acceptable
- [ ] Documentation is updated
- [ ] Error handling is comprehensive

### Development Best Practices

**TypeScript:**

```typescript
// Use strict typing
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

// Avoid 'any' type
const processUser = (user: User): string => {
  return `${user.firstName} ${user.lastName}`;
};

// Use utility types
type UserUpdate = Partial<Pick<User, "firstName" | "lastName">>;
```

**Error Handling:**

```typescript
// Frontend error handling
try {
  const result = await apiCall();
  return result;
} catch (error) {
  if (error instanceof ApiError) {
    throw new UserFriendlyError(error.message);
  }
  throw new UnexpectedError("Something went wrong");
}

// Backend error handling
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error("Unhandled error:", error);

  res.status(500).json({
    success: false,
    error: {
      code: "SERVER_ERROR",
      message: "Internal server error",
    },
  });
});
```

## Testing Strategy

### Test Structure

```
src/
├── __tests__/              # Integration tests
├── components/
│   └── __tests__/          # Component tests
├── services/
│   └── __tests__/          # Service tests
└── utils/
    └── __tests__/          # Utility tests
```

### Frontend Testing

**Component Testing:**

```typescript
// UserProfile.test.tsx
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UserProfile } from "./UserProfile";
import { userService } from "../services/userService";

jest.mock("../services/userService");

describe("UserProfile", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("displays user information when loaded", async () => {
    const mockUser = {
      id: "1",
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
    };

    (userService.getUser as jest.Mock).mockResolvedValue(mockUser);

    render(<UserProfile userId="1" />);

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });
  });

  it("handles loading state", () => {
    (userService.getUser as jest.Mock).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<UserProfile userId="1" />);

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });
});
```

**Service Testing:**

```typescript
// userService.test.ts
import { userService } from "./userService";
import axios from "axios";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("UserService", () => {
  it("fetches user successfully", async () => {
    const userData = { id: "1", name: "John Doe" };
    mockedAxios.get.mockResolvedValue({ data: { data: userData } });

    const result = await userService.getUser("1");

    expect(result).toEqual(userData);
    expect(mockedAxios.get).toHaveBeenCalledWith("/api/users/1");
  });
});
```

### Backend Testing

**Controller Testing:**

```typescript
// userController.test.ts
import request from "supertest";
import app from "../app";
import { User } from "../models/User";

describe("User Controller", () => {
  beforeEach(async () => {
    await User.deleteMany({});
  });

  describe("GET /api/users/profile", () => {
    it("returns user profile when authenticated", async () => {
      const user = await User.create({
        email: "test@example.com",
        firstName: "John",
        lastName: "Doe",
      });

      const token = generateJWT(user._id);

      const response = await request(app)
        .get("/api/users/profile")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe("test@example.com");
    });

    it("returns 401 when not authenticated", async () => {
      await request(app).get("/api/users/profile").expect(401);
    });
  });
});
```

**Model Testing:**

```typescript
// User.test.ts
import { User } from "./User";
import { connectDB, disconnectDB } from "../config/testDatabase";

describe("User Model", () => {
  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await disconnectDB();
  });

  beforeEach(async () => {
    await User.deleteMany({});
  });

  it("creates user with valid data", async () => {
    const userData = {
      email: "test@example.com",
      password: "password123",
      firstName: "John",
      lastName: "Doe",
    };

    const user = await User.create(userData);

    expect(user.email).toBe(userData.email);
    expect(user.password).not.toBe(userData.password); // Should be hashed
  });

  it("validates required fields", async () => {
    const user = new User({});

    await expect(user.save()).rejects.toThrow();
  });
});
```

### Test Coverage Goals

- **Unit Tests**: 80% minimum coverage
- **Integration Tests**: Cover all API endpoints
- **E2E Tests**: Cover critical user journeys
- **Component Tests**: All interactive components

## API Development

### API Design Principles

1. **RESTful Design**: Use standard HTTP methods and status codes
2. **Consistent Response Format**: All responses follow the same structure
3. **Proper Error Handling**: Meaningful error messages and codes
4. **Input Validation**: Validate all inputs on the server side
5. **Authentication**: Secure endpoints appropriately
6. **Rate Limiting**: Prevent abuse with rate limiting
7. **Documentation**: Keep API docs up to date

### Endpoint Implementation

**Route Definition:**

```typescript
// routes/userRoutes.ts
import { Router } from "express";
import { UserController } from "../controllers/UserController";
import { authMiddleware } from "../middleware/authMiddleware";
import { validateInput } from "../middleware/validationMiddleware";
import { userValidationRules } from "../validation/userValidation";

const router = Router();

router.get("/profile", authMiddleware, UserController.getProfile);

router.put(
  "/profile",
  authMiddleware,
  validateInput(userValidationRules.updateProfile),
  UserController.updateProfile
);

export default router;
```

**Validation Rules:**

```typescript
// validation/userValidation.ts
import { body } from "express-validator";

export const userValidationRules = {
  updateProfile: [
    body("firstName")
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage("First name must be 1-50 characters"),

    body("lastName")
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage("Last name must be 1-50 characters"),

    body("phone")
      .optional()
      .isMobilePhone("any")
      .withMessage("Invalid phone number format"),
  ],
};
```

**Middleware Implementation:**

```typescript
// middleware/authMiddleware.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/User";

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      res.status(401).json({
        success: false,
        error: {
          code: "NO_TOKEN",
          message: "Access token required",
        },
      });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      res.status(401).json({
        success: false,
        error: {
          code: "INVALID_TOKEN",
          message: "Invalid access token",
        },
      });
      return;
    }

    req.user = {
      id: user._id.toString(),
      email: user.email,
    };

    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: {
        code: "TOKEN_ERROR",
        message: "Token verification failed",
      },
    });
  }
};
```

## Frontend Development

### Component Development

**Component Guidelines:**

1. Use functional components with hooks
2. Implement proper TypeScript interfaces
3. Handle loading and error states
4. Use React.memo for performance optimization
5. Implement proper accessibility features

**State Management:**

```typescript
// context/AuthContext.tsx
import React, { createContext, useContext, useReducer, useEffect } from "react";
import { User } from "../types/auth";
import { authService } from "../services/authService";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

type AuthAction =
  | { type: "LOGIN_START" }
  | { type: "LOGIN_SUCCESS"; payload: User }
  | { type: "LOGIN_FAILURE"; payload: string }
  | { type: "LOGOUT" };

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case "LOGIN_START":
      return { ...state, loading: true, error: null };
    case "LOGIN_SUCCESS":
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        loading: false,
      };
    case "LOGIN_FAILURE":
      return {
        ...state,
        error: action.payload,
        loading: false,
      };
    case "LOGOUT":
      return {
        user: null,
        isAuthenticated: false,
        loading: false,
        error: null,
      };
    default:
      return state;
  }
};

const AuthContext = createContext<{
  state: AuthState;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
} | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    isAuthenticated: false,
    loading: false,
    error: null,
  });

  const login = async (email: string, password: string) => {
    dispatch({ type: "LOGIN_START" });
    try {
      const { user, token } = await authService.login(email, password);
      localStorage.setItem("token", token);
      dispatch({ type: "LOGIN_SUCCESS", payload: user });
    } catch (error) {
      dispatch({
        type: "LOGIN_FAILURE",
        payload: error.message || "Login failed",
      });
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    dispatch({ type: "LOGOUT" });
  };

  return (
    <AuthContext.Provider value={{ state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
```

**Custom Hooks:**

```typescript
// hooks/useApi.ts
import { useState, useEffect } from "react";

interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useApi = <T>(
  apiCall: () => Promise<T>,
  dependencies: any[] = []
): UseApiResult<T> => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiCall();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, dependencies);

  return { data, loading, error, refetch: fetchData };
};
```

### Styling Guidelines

**Tailwind CSS Usage:**

```typescript
// Use consistent spacing and colors
const Button: React.FC<ButtonProps> = ({ variant, children, ...props }) => {
  const baseClasses = "px-4 py-2 rounded-md font-medium transition-colors";
  const variantClasses = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "bg-gray-200 text-gray-900 hover:bg-gray-300",
    danger: "bg-red-600 text-white hover:bg-red-700",
  };

  return (
    <button className={`${baseClasses} ${variantClasses[variant]}`} {...props}>
      {children}
    </button>
  );
};
```

**Responsive Design:**

```typescript
// Use Tailwind responsive prefixes
<div
  className="
  grid 
  grid-cols-1 
  md:grid-cols-2 
  lg:grid-cols-3 
  gap-4 
  p-4
"
>
  {items.map((item) => (
    <ItemCard key={item.id} item={item} />
  ))}
</div>
```

## Database Management

### MongoDB Schema Design

**User Schema:**

```typescript
// models/User.ts
import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends Document {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  createdAt: Date;
  updatedAt: Date;
  comparePassword(password: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ createdAt: -1 });

// Pre-save middleware for password hashing
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || "12");
  this.password = await bcrypt.hash(this.password, saltRounds);
  next();
});

// Instance method for password comparison
userSchema.methods.comparePassword = async function (
  password: string
): Promise<boolean> {
  return bcrypt.compare(password, this.password);
};

export const User = mongoose.model<IUser>("User", userSchema);
```

### Database Operations

**Service Layer:**

```typescript
// services/userService.ts
import { User, IUser } from "../models/User";
import { CreateUserData, UpdateUserData } from "../types/user";

export class UserService {
  static async createUser(userData: CreateUserData): Promise<IUser> {
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      throw new Error("User already exists");
    }

    const user = new User(userData);
    await user.save();
    return user;
  }

  static async getUserById(id: string): Promise<IUser | null> {
    return User.findById(id).select("-password");
  }

  static async getUserByEmail(email: string): Promise<IUser | null> {
    return User.findOne({ email: email.toLowerCase() });
  }

  static async updateUser(
    id: string,
    updateData: UpdateUserData
  ): Promise<IUser | null> {
    return User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).select("-password");
  }

  static async deleteUser(id: string): Promise<boolean> {
    const result = await User.findByIdAndDelete(id);
    return !!result;
  }
}
```

### Database Migrations

**Migration Script Example:**

```typescript
// scripts/migrations/001_add_user_indexes.ts
import mongoose from "mongoose";
import { User } from "../models/User";

export const up = async (): Promise<void> => {
  console.log("Adding indexes to User collection...");

  await User.collection.createIndex({ email: 1 }, { unique: true });
  await User.collection.createIndex({ createdAt: -1 });

  console.log("User indexes added successfully");
};

export const down = async (): Promise<void> => {
  console.log("Removing indexes from User collection...");

  await User.collection.dropIndex({ email: 1 });
  await User.collection.dropIndex({ createdAt: -1 });

  console.log("User indexes removed successfully");
};
```

## Security Guidelines

### Authentication Security

**JWT Implementation:**

```typescript
// utils/jwt.ts
import jwt from "jsonwebtoken";

interface TokenPayload {
  id: string;
  email: string;
}

export const generateToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN || "24h",
    issuer: "food-ordering-platform",
    audience: "food-ordering-users",
  });
};

export const verifyToken = (token: string): TokenPayload => {
  return jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
};
```

**Input Validation:**

```typescript
// middleware/validationMiddleware.ts
import { Request, Response, NextFunction } from "express";
import { validationResult, ValidationChain } from "express-validator";

export const validateInput = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Run all validations
    await Promise.all(validations.map((validation) => validation.run(req)));

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid input data",
          details: errors.array(),
        },
      });
    }

    next();
  };
};
```

**Rate Limiting:**

```typescript
// middleware/rateLimitMiddleware.ts
import rateLimit from "express-rate-limit";

export const rateLimitConfigs = {
  general: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
      success: false,
      error: {
        code: "RATE_LIMIT_EXCEEDED",
        message: "Too many requests, please try again later",
      },
    },
  }),

  auth: rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5, // Stricter limit for auth endpoints
    message: {
      success: false,
      error: {
        code: "AUTH_RATE_LIMIT_EXCEEDED",
        message: "Too many authentication attempts",
      },
    },
  }),
};
```

### Data Protection

**Input Sanitization:**

```typescript
// middleware/sanitizationMiddleware.ts
import { Request, Response, NextFunction } from "express";
import validator from "validator";

export const sanitizeInput = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Sanitize string inputs
  const sanitizeObject = (obj: any): any => {
    if (typeof obj === "string") {
      return validator.escape(obj.trim());
    }

    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }

    if (obj && typeof obj === "object") {
      const sanitized: any = {};
      for (const key in obj) {
        sanitized[key] = sanitizeObject(obj[key]);
      }
      return sanitized;
    }

    return obj;
  };

  req.body = sanitizeObject(req.body);
  req.query = sanitizeObject(req.query);
  req.params = sanitizeObject(req.params);

  next();
};
```

## Performance Optimization

### Frontend Optimization

**Code Splitting:**

```typescript
// Lazy load components
import { lazy, Suspense } from "react";

const OrderHistory = lazy(() => import("./components/orders/OrderHistory"));
const CheckoutPage = lazy(() => import("./pages/CheckoutPage"));

// Use in routes
<Route
  path="/orders"
  element={
    <Suspense fallback={<div>Loading...</div>}>
      <OrderHistory />
    </Suspense>
  }
/>;
```

**Memoization:**

```typescript
// Memoize expensive calculations
import { useMemo } from "react";

const CartSummary: React.FC<{ items: CartItem[] }> = ({ items }) => {
  const summary = useMemo(() => {
    return items.reduce(
      (acc, item) => ({
        totalItems: acc.totalItems + item.quantity,
        totalAmount: acc.totalAmount + item.price * item.quantity,
      }),
      { totalItems: 0, totalAmount: 0 }
    );
  }, [items]);

  return (
    <div>
      <p>Items: {summary.totalItems}</p>
      <p>Total: ${summary.totalAmount.toFixed(2)}</p>
    </div>
  );
};
```

### Backend Optimization

**Database Query Optimization:**

```typescript
// Use proper indexing and projection
const getOrderHistory = async (
  userId: string,
  page: number = 1,
  limit: number = 10
) => {
  return Order.find({ userId })
    .select("orderId totalAmount status createdAt") // Only select needed fields
    .sort({ createdAt: -1 }) // Use indexed field for sorting
    .limit(limit)
    .skip((page - 1) * limit)
    .lean(); // Return plain objects instead of Mongoose documents
};
```

**Caching Strategy:**

```typescript
// Redis caching
import Redis from "redis";

const redis = Redis.createClient(process.env.REDIS_URL);

export const cacheService = {
  async get<T>(key: string): Promise<T | null> {
    const cached = await redis.get(key);
    return cached ? JSON.parse(cached) : null;
  },

  async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    await redis.setex(key, ttl, JSON.stringify(value));
  },

  async del(key: string): Promise<void> {
    await redis.del(key);
  },
};

// Use in service
const getFoodItems = async (category?: string) => {
  const cacheKey = `food-items:${category || "all"}`;

  let items = await cacheService.get(cacheKey);
  if (!items) {
    items = await FoodItem.find(category ? { category } : {});
    await cacheService.set(cacheKey, items, 300); // Cache for 5 minutes
  }

  return items;
};
```

## Deployment

### Production Build

**Environment Variables:**

```env
# Production .env
NODE_ENV=production
PORT=5000

# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/production
REDIS_URL=redis://production-redis:6379

# Security
JWT_SECRET=super-secure-production-secret
BCRYPT_SALT_ROUNDS=12

# CORS
CORS_ORIGIN=https://yourdomain.com
FRONTEND_URL=https://yourdomain.com
```

**Build Scripts:**

```json
{
  "scripts": {
    "build": "npm run build:frontend && npm run build:backend",
    "build:frontend": "cd frontend && npm run build",
    "build:backend": "cd backend && npm run build",
    "start:prod": "cd backend && npm start"
  }
}
```

### Docker Configuration

**Dockerfile (Backend):**

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY backend/package*.json ./backend/

# Install dependencies
RUN npm ci --only=production
RUN cd backend && npm ci --only=production

# Copy source code
COPY backend/ ./backend/

# Build application
RUN cd backend && npm run build

# Expose port
EXPOSE 5000

# Start application
CMD ["npm", "run", "start:prod"]
```

**Docker Compose:**

```yaml
version: "3.8"

services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongo:27017/foodordering
      - REDIS_URL=redis://redis:6379
    depends_on:
      - mongo
      - redis

  mongo:
    image: mongo:5
    volumes:
      - mongo_data:/data/db
    ports:
      - "27017:27017"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  mongo_data:
```

### Monitoring and Logging

**Application Logging:**

```typescript
// utils/logger.ts
import winston from "winston";

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: "logs/error.log", level: "error" }),
    new winston.transports.File({ filename: "logs/combined.log" }),
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  ],
});
```

**Health Check Endpoint:**

```typescript
// routes/healthRoutes.ts
import { Router, Request, Response } from "express";
import mongoose from "mongoose";

const router = Router();

router.get("/health", async (req: Request, res: Response) => {
  const health = {
    status: "OK",
    timestamp: new Date().toISOString(),
    services: {
      database:
        mongoose.connection.readyState === 1 ? "connected" : "disconnected",
      memory: process.memoryUsage(),
      uptime: process.uptime(),
    },
  };

  res.json(health);
});

export default router;
```

This developer guide provides comprehensive information for working on the Food Ordering Platform. Keep it updated as the project evolves and new patterns emerge.
