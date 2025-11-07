import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

// User interface based on design document
export interface IUser extends Document {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  profilePicture?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  createdAt: Date;
  updatedAt: Date;
  
  // Instance methods
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// Address subdocument schema
const AddressSchema = new Schema({
  street: {
    type: String,
    required: false, // Optional to allow partial updates
    trim: true,
    maxlength: 200
  },
  city: {
    type: String,
    required: false, // Optional to allow partial updates
    trim: true,
    maxlength: 100
  },
  state: {
    type: String,
    required: false, // Optional to allow partial updates
    trim: true,
    maxlength: 50
  },
  zipCode: {
    type: String,
    required: false, // Optional to allow partial updates
    trim: true,
    match: /^[A-Za-z0-9\s\-]{3,10}$/ // International postal code format (3-10 alphanumeric characters)
  }
}, { _id: false });

// User schema with validation rules
const UserSchema = new Schema<IUser>({
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    match: [
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      'Please provide a valid email address'
    ],
    maxlength: 255
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long'],
    maxlength: 128
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  phone: {
    type: String,
    trim: true,
    match: [
      /^[\+]?[1-9][\d]{0,15}$/,
      'Please provide a valid phone number'
    ]
  },
  profilePicture: {
    type: String,
    trim: true,
    maxlength: [5000000, 'Profile picture data is too large (max 5MB)'] // Base64 images can be large (~4MB base64 = ~3MB file)
  },
  address: {
    type: AddressSchema,
    required: false
  }
}, {
  timestamps: true, // Automatically adds createdAt and updatedAt
  toJSON: {
    transform: function(doc, ret) {
      delete (ret as any).password; // Remove password from JSON output
      return ret;
    }
  }
});

// Create indexes for email uniqueness and performance
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ createdAt: -1 }); // For sorting by creation date

// Pre-save middleware to hash password
UserSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();
  
  try {
    // Hash password with salt rounds of 12
    const saltRounds = 12;
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Instance method to compare password
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Create and export the User model
export const User = mongoose.model<IUser>('User', UserSchema);