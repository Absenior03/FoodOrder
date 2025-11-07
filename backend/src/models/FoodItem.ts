import mongoose, { Document, Schema } from 'mongoose';

// Food categories enum based on requirements
export enum FoodCategory {
  FRUIT = 'Fruit',
  VEGETABLE = 'Vegetable',
  NON_VEG = 'Non-veg',
  BREADS = 'Breads',
  OTHER = 'Other'
}

// FoodItem interface based on design document
export interface IFoodItem extends Document {
  name: string;
  description: string;
  category: FoodCategory;
  price: number;
  stock: number;
  imageUrl?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// FoodItem schema with validation rules
const FoodItemSchema = new Schema<IFoodItem>({
  name: {
    type: String,
    required: [true, 'Food item name is required'],
    trim: true,
    maxlength: [100, 'Food item name cannot exceed 100 characters'],
    minlength: [2, 'Food item name must be at least 2 characters long']
  },
  description: {
    type: String,
    required: [true, 'Food item description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters'],
    minlength: [10, 'Description must be at least 10 characters long']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: {
      values: Object.values(FoodCategory),
      message: 'Category must be one of: Fruit, Vegetable, Non-veg, Breads, Other'
    }
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0.01, 'Price must be greater than 0'],
    max: [9999.99, 'Price cannot exceed $9999.99']
  },
  stock: {
    type: Number,
    required: [true, 'Stock quantity is required'],
    min: [0, 'Stock cannot be negative'],
    max: [99999, 'Stock cannot exceed 99999'],
    validate: {
      validator: Number.isInteger,
      message: 'Stock must be a whole number'
    }
  },
  imageUrl: {
    type: String,
    trim: true,
    maxlength: [500, 'Image URL cannot exceed 500 characters'],
    validate: {
      validator: function(value: string) {
        if (!value) return true; // Optional field
        // Basic URL validation
        try {
          new URL(value);
          return true;
        } catch {
          return false;
        }
      },
      message: 'Please provide a valid image URL'
    }
  },
  isActive: {
    type: Boolean,
    required: true,
    default: true
  }
}, {
  timestamps: true, // Automatically adds createdAt and updatedAt
  toJSON: {
    transform: function(doc, ret) {
      // Round price to 2 decimal places in JSON output
      if (ret.price) {
        ret.price = Math.round(ret.price * 100) / 100;
      }
      return ret;
    }
  }
});

// Create indexes for category and stock queries as specified in requirements
FoodItemSchema.index({ category: 1 }); // For category filtering
FoodItemSchema.index({ stock: 1 }); // For stock availability queries
FoodItemSchema.index({ isActive: 1 }); // For active items filtering
FoodItemSchema.index({ category: 1, isActive: 1 }); // Compound index for category + active filtering
FoodItemSchema.index({ stock: 1, isActive: 1 }); // Compound index for stock + active filtering
FoodItemSchema.index({ name: 'text', description: 'text' }); // Text search index for name and description
FoodItemSchema.index({ createdAt: -1 }); // For sorting by creation date

// Optimistic locking indexes for concurrent operations
FoodItemSchema.index({ _id: 1, stock: 1, isActive: 1 }); // For atomic stock updates
FoodItemSchema.index({ updatedAt: -1 }); // For version-like behavior

// Create and export the FoodItem model
export const FoodItem = mongoose.model<IFoodItem>('FoodItem', FoodItemSchema);