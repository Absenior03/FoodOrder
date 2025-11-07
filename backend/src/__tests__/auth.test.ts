import { JWTUtils } from '../utils/jwt';
import bcrypt from 'bcryptjs';
import { Request, Response } from 'express';
import { AuthController } from '../controllers/authController';

// Mock the User model and database operations
jest.mock('../models/User');
jest.mock('../config/database');

describe('Authentication System', () => {
  describe('JWT Token Generation and Verification', () => {
    it('should generate valid access token', () => {
      const payload = {
        userId: '507f1f77bcf86cd799439011',
        email: 'test@example.com'
      };

      const token = JWTUtils.generateAccessToken(payload);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');

      // Verify the token
      const decoded = JWTUtils.verifyToken(token);
      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.email).toBe(payload.email);
    });

    it('should generate valid refresh token', () => {
      const payload = {
        userId: '507f1f77bcf86cd799439011',
        email: 'test@example.com'
      };

      const token = JWTUtils.generateRefreshToken(payload);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');

      // Verify the token
      const decoded = JWTUtils.verifyToken(token);
      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.email).toBe(payload.email);
    });

    it('should throw error for invalid token', () => {
      const invalidToken = 'invalid.token.here';
      
      expect(() => {
        JWTUtils.verifyToken(invalidToken);
      }).toThrow('Invalid token');
    });

    it('should extract token from Authorization header', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
      const authHeader = `Bearer ${token}`;
      
      const extractedToken = JWTUtils.extractTokenFromHeader(authHeader);
      expect(extractedToken).toBe(token);
    });

    it('should return null for invalid Authorization header format', () => {
      const invalidHeaders = [
        'InvalidFormat token',
        'Bearer',
        'Bearer token1 token2',
        undefined
      ];

      invalidHeaders.forEach(header => {
        const result = JWTUtils.extractTokenFromHeader(header);
        expect(result).toBeNull();
      });
    });
  });

  describe('User Registration Logic', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let mockUser: any;

    beforeEach(() => {
      mockRequest = {
        body: {
          email: 'test@example.com',
          password: 'password123',
          firstName: 'John',
          lastName: 'Doe'
        }
      };

      mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      };

      mockUser = {
        _id: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        save: jest.fn().mockResolvedValue(true)
      };

      // Reset mocks
      jest.clearAllMocks();
    });

    it('should validate required fields for registration', async () => {
      const { User } = require('../models/User');
      User.findOne = jest.fn().mockResolvedValue(null);
      
      // Mock User constructor
      User.mockImplementation(() => mockUser);

      await AuthController.register(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            user: expect.objectContaining({
              email: 'test@example.com',
              firstName: 'John',
              lastName: 'Doe'
            }),
            tokens: expect.objectContaining({
              accessToken: expect.any(String),
              refreshToken: expect.any(String)
            })
          }),
          message: 'User registered successfully'
        })
      );
    });

    it('should reject registration with existing email', async () => {
      const { User } = require('../models/User');
      User.findOne = jest.fn().mockResolvedValue(mockUser);

      await AuthController.register(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'USER_EXISTS',
          message: 'User with this email already exists'
        }
      });
    });
  });

  describe('User Login Logic', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let mockUser: any;

    beforeEach(() => {
      mockRequest = {
        body: {
          email: 'test@example.com',
          password: 'password123'
        }
      };

      mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      };

      mockUser = {
        _id: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        comparePassword: jest.fn().mockResolvedValue(true)
      };

      jest.clearAllMocks();
    });

    it('should login user with valid credentials', async () => {
      const { User } = require('../models/User');
      User.findOne = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      await AuthController.login(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            user: expect.objectContaining({
              email: 'test@example.com'
            }),
            tokens: expect.objectContaining({
              accessToken: expect.any(String),
              refreshToken: expect.any(String)
            })
          }),
          message: 'Login successful'
        })
      );
    });

    it('should reject login with invalid credentials', async () => {
      const { User } = require('../models/User');
      User.findOne = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      });

      await AuthController.login(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        }
      });
    });

    it('should reject login with missing credentials', async () => {
      mockRequest.body = { email: 'test@example.com' }; // Missing password

      await AuthController.login(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'MISSING_CREDENTIALS',
          message: 'Email and password are required'
        }
      });
    });

    it('should reject login with incorrect password', async () => {
      const { User } = require('../models/User');
      mockUser.comparePassword = jest.fn().mockResolvedValue(false);
      
      User.findOne = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      await AuthController.login(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        }
      });
    });
  });

  describe('Password Hashing', () => {
    it('should hash password correctly', async () => {
      const password = 'testpassword123';
      const hashedPassword = await bcrypt.hash(password, 12);
      
      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword.length).toBeGreaterThan(50);
    });

    it('should verify password correctly', async () => {
      const password = 'testpassword123';
      const hashedPassword = await bcrypt.hash(password, 12);
      
      const isValid = await bcrypt.compare(password, hashedPassword);
      expect(isValid).toBe(true);
      
      const isInvalid = await bcrypt.compare('wrongpassword', hashedPassword);
      expect(isInvalid).toBe(false);
    });
  });

  describe('Authentication Middleware Logic', () => {
    const { authMiddleware } = require('../middleware/authMiddleware');
    let mockRequest: any;
    let mockResponse: any;
    let mockNext: jest.Mock;
    let mockUser: any;

    beforeEach(() => {
      mockRequest = {
        headers: {},
        user: undefined
      };

      mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      };

      mockNext = jest.fn();

      mockUser = {
        _id: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe'
      };

      jest.clearAllMocks();
    });

    it('should deny access without token', async () => {
      await authMiddleware(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'NO_TOKEN',
          message: 'Access token is required'
        }
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should deny access with invalid token format', async () => {
      mockRequest.headers.authorization = 'InvalidFormat token';

      await authMiddleware(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'NO_TOKEN',
          message: 'Access token is required'
        }
      });
    });

    it('should allow access with valid token', async () => {
      const { User } = require('../models/User');
      User.findById = jest.fn().mockResolvedValue(mockUser);

      const payload = {
        userId: '507f1f77bcf86cd799439011',
        email: 'test@example.com'
      };
      const validToken = JWTUtils.generateAccessToken(payload);
      mockRequest.headers.authorization = `Bearer ${validToken}`;

      await authMiddleware(mockRequest, mockResponse, mockNext);

      expect(mockRequest.user).toBe(mockUser);
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should deny access when user not found', async () => {
      const { User } = require('../models/User');
      User.findById = jest.fn().mockResolvedValue(null);

      const payload = {
        userId: '507f1f77bcf86cd799439011',
        email: 'test@example.com'
      };
      const validToken = JWTUtils.generateAccessToken(payload);
      mockRequest.headers.authorization = `Bearer ${validToken}`;

      await authMiddleware(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});