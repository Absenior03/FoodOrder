import { Request, Response, NextFunction } from 'express';
import validator from 'validator';

// Validation rules interface
interface ValidationRule {
  field: string;
  required?: boolean;
  type?: 'string' | 'email' | 'number' | 'boolean';
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean | string;
}

/**
 * Generic validation middleware factory
 */
export const validateInput = (rules: ValidationRule[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: string[] = [];
    const data = { ...req.body };

    // Sanitize input data
    Object.keys(data).forEach(key => {
      if (typeof data[key] === 'string') {
        // Trim whitespace and escape HTML
        data[key] = validator.escape(data[key].trim());
      }
    });

    // Apply validation rules
    for (const rule of rules) {
      const value = data[rule.field];

      // Check required fields
      if (rule.required && (value === undefined || value === null || value === '')) {
        errors.push(`${rule.field} is required`);
        continue;
      }

      // Skip validation if field is not required and empty
      if (!rule.required && (value === undefined || value === null || value === '')) {
        continue;
      }

      // Type validation
      if (rule.type) {
        switch (rule.type) {
          case 'email':
            if (!validator.isEmail(value)) {
              errors.push(`${rule.field} must be a valid email address`);
            }
            break;
          case 'string':
            if (typeof value !== 'string') {
              errors.push(`${rule.field} must be a string`);
            }
            break;
          case 'number':
            if (isNaN(Number(value))) {
              errors.push(`${rule.field} must be a number`);
            }
            break;
          case 'boolean':
            if (typeof value !== 'boolean') {
              errors.push(`${rule.field} must be a boolean`);
            }
            break;
        }
      }

      // Length validation
      if (rule.minLength && value.length < rule.minLength) {
        errors.push(`${rule.field} must be at least ${rule.minLength} characters long`);
      }

      if (rule.maxLength && value.length > rule.maxLength) {
        errors.push(`${rule.field} cannot exceed ${rule.maxLength} characters`);
      }

      // Pattern validation
      if (rule.pattern && !rule.pattern.test(value)) {
        errors.push(`${rule.field} format is invalid`);
      }

      // Custom validation
      if (rule.custom) {
        const customResult = rule.custom(value);
        if (customResult !== true) {
          errors.push(typeof customResult === 'string' ? customResult : `${rule.field} is invalid`);
        }
      }
    }

    if (errors.length > 0) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Input validation failed',
          details: errors
        }
      });
      return;
    }

    // Update request body with sanitized data
    req.body = data;
    next();
  };
};

// Predefined validation rules for common use cases
export const authValidationRules = {
  register: [
    { field: 'email', required: true, type: 'email' as const, maxLength: 255 },
    { field: 'password', required: true, type: 'string' as const, minLength: 6, maxLength: 128 },
    { field: 'firstName', required: true, type: 'string' as const, maxLength: 50 },
    { field: 'lastName', required: true, type: 'string' as const, maxLength: 50 },
    { 
      field: 'phone', 
      required: false, 
      type: 'string' as const,
      pattern: /^[\+]?[1-9][\d]{0,15}$/
    }
  ],
  login: [
    { field: 'email', required: true, type: 'email' as const },
    { field: 'password', required: true, type: 'string' as const }
  ],
  updateProfile: [
    { field: 'firstName', required: false, type: 'string' as const, maxLength: 50 },
    { field: 'lastName', required: false, type: 'string' as const, maxLength: 50 },
    { 
      field: 'phone', 
      required: false, 
      type: 'string' as const,
      pattern: /^[\+]?[1-9][\d]{0,15}$/
    }
  ]
};

// Inventory validation rules
export const inventoryValidationRules = {
  getItems: [
    { field: 'page', required: false, type: 'number' as const },
    { field: 'limit', required: false, type: 'number' as const },
    { field: 'category', required: false, type: 'string' as const }
  ],
  getItemById: [
    { field: 'id', required: true, type: 'string' as const }
  ],
  searchItems: [
    { field: 'query', required: true, type: 'string' as const, minLength: 1 },
    { field: 'category', required: false, type: 'string' as const }
  ],
  updateStock: [
    { field: 'id', required: true, type: 'string' as const },
    { field: 'quantity', required: true, type: 'number' as const }
  ]
};