import mongoose, { Document, Schema, Types } from 'mongoose';

// CartItem interface for individual items in cart
export interface ICartItem {
  itemId: Types.ObjectId;
  quantity: number;
  priceAtAdd: number; // Price when item was added to cart
}

// Cart interface based on design document
export interface ICart extends Document {
  userId: Types.ObjectId;
  items: ICartItem[];
  createdAt: Date;
  updatedAt: Date;
  
  // Instance methods
  calculateTotal(): number;
  getTotalItems(): number;
  findItem(itemId: string | Types.ObjectId): ICartItem | undefined;
  addOrUpdateItem(itemId: string | Types.ObjectId, quantity: number, price: number): void;
  removeItem(itemId: string | Types.ObjectId): boolean;
  clearCart(): void;
}

// CartItem subdocument schema
const CartItemSchema = new Schema<ICartItem>({
  itemId: {
    type: Schema.Types.ObjectId,
    ref: 'FoodItem',
    required: [true, 'Item ID is required']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1'],
    max: [99, 'Quantity cannot exceed 99'],
    validate: {
      validator: Number.isInteger,
      message: 'Quantity must be a whole number'
    }
  },
  priceAtAdd: {
    type: Number,
    required: [true, 'Price at add is required'],
    min: [0.01, 'Price must be greater than 0'],
    max: [9999.99, 'Price cannot exceed $9999.99'],
    validate: {
      validator: function(value: number) {
        // Ensure price has at most 2 decimal places
        return Number.isInteger(value * 100);
      },
      message: 'Price must have at most 2 decimal places'
    }
  }
}, { _id: false });

// Cart schema with validation rules
const CartSchema = new Schema<ICart>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true // Index for efficient user cart lookups
  },
  items: {
    type: [CartItemSchema],
    default: [],
    validate: {
      validator: function(items: ICartItem[]) {
        // Ensure no duplicate items in cart
        const itemIds = items.map(item => item.itemId.toString());
        return itemIds.length === new Set(itemIds).size;
      },
      message: 'Cart cannot contain duplicate items'
    }
  }
}, {
  timestamps: true, // Automatically adds createdAt and updatedAt
  toJSON: {
    transform: function(doc, ret) {
      // Round prices to 2 decimal places in JSON output
      if (ret.items) {
        ret.items.forEach((item: ICartItem) => {
          if (item.priceAtAdd) {
            item.priceAtAdd = Math.round(item.priceAtAdd * 100) / 100;
          }
        });
      }
      return ret;
    }
  }
});

// Create indexes for efficient queries
CartSchema.index({ userId: 1 }, { unique: true }); // One cart per user
CartSchema.index({ updatedAt: -1 }); // For cart cleanup by last update time
CartSchema.index({ 'items.itemId': 1 }); // For finding carts containing specific items

// Instance method to calculate total cart value
CartSchema.methods.calculateTotal = function(): number {
  return this.items.reduce((total: number, item: ICartItem) => {
    return total + (item.quantity * item.priceAtAdd);
  }, 0);
};

// Instance method to get total item count
CartSchema.methods.getTotalItems = function(): number {
  return this.items.reduce((total: number, item: ICartItem) => {
    return total + item.quantity;
  }, 0);
};

// Instance method to find item in cart
CartSchema.methods.findItem = function(itemId: string | Types.ObjectId): ICartItem | undefined {
  return this.items.find((item: ICartItem) => item.itemId.toString() === itemId.toString());
};

// Instance method to add or update item in cart
CartSchema.methods.addOrUpdateItem = function(itemId: string | Types.ObjectId, quantity: number, price: number): void {
  const existingItemIndex = this.items.findIndex((item: ICartItem) => item.itemId.toString() === itemId.toString());
  
  if (existingItemIndex >= 0) {
    // Update existing item quantity
    this.items[existingItemIndex].quantity = quantity;
    this.items[existingItemIndex].priceAtAdd = price; // Update price in case it changed
  } else {
    // Add new item to cart
    this.items.push({
      itemId: new Types.ObjectId(itemId),
      quantity,
      priceAtAdd: price
    });
  }
};

// Instance method to remove item from cart
CartSchema.methods.removeItem = function(itemId: string | Types.ObjectId): boolean {
  const initialLength = this.items.length;
  this.items = this.items.filter((item: ICartItem) => item.itemId.toString() !== itemId.toString());
  return this.items.length < initialLength;
};

// Instance method to clear all items from cart
CartSchema.methods.clearCart = function(): void {
  this.items = [];
};

// Create and export the Cart model
export const Cart = mongoose.model<ICart>('Cart', CartSchema);