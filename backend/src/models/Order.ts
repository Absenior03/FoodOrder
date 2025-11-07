import mongoose, { Document, Schema, Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

// Order status enumeration based on design document
export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PREPARING = 'preparing',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled'
}

// Payment status enumeration
export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

// Address interface for delivery address
export interface IAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
}

// OrderItem interface for order line items
export interface IOrderItem {
  itemId: Types.ObjectId;
  name: string;
  quantity: number;
  price: number;
  totalPrice: number;
}

// Order interface based on design document
export interface IOrder extends Document {
  orderId: string; // Unique tracking ID
  userId: Types.ObjectId;
  items: IOrderItem[];
  totalAmount: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  deliveryAddress: IAddress;
  createdAt: Date;
  updatedAt: Date;
  
  // Instance methods
  calculateTotal(): number;
  updateStatus(newStatus: OrderStatus): void;
  updatePaymentStatus(newStatus: PaymentStatus): void;
}

// Address subdocument schema
const AddressSchema = new Schema<IAddress>({
  street: {
    type: String,
    required: [true, 'Street address is required'],
    trim: true,
    maxlength: [200, 'Street address cannot exceed 200 characters']
  },
  city: {
    type: String,
    required: [true, 'City is required'],
    trim: true,
    maxlength: [100, 'City cannot exceed 100 characters']
  },
  state: {
    type: String,
    required: [true, 'State is required'],
    trim: true,
    maxlength: [50, 'State cannot exceed 50 characters']
  },
  zipCode: {
    type: String,
    required: [true, 'PIN code is required'],
    trim: true,
    match: [/^\d{6}$/, 'Please provide a valid PIN code (6 digits)']
  }
}, { _id: false });

// OrderItem subdocument schema
const OrderItemSchema = new Schema<IOrderItem>({
  itemId: {
    type: Schema.Types.ObjectId,
    ref: 'FoodItem',
    required: [true, 'Item ID is required']
  },
  name: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true,
    maxlength: [100, 'Item name cannot exceed 100 characters']
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
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0.01, 'Price must be greater than 0'],
    max: [9999.99, 'Price cannot exceed $9999.99'],
    validate: {
      validator: function(value: number) {
        return Number.isInteger(value * 100);
      },
      message: 'Price must have at most 2 decimal places'
    }
  },
  totalPrice: {
    type: Number,
    required: [true, 'Total price is required'],
    min: [0.01, 'Total price must be greater than 0'],
    validate: {
      validator: function(value: number) {
        return Number.isInteger(value * 100);
      },
      message: 'Total price must have at most 2 decimal places'
    }
  }
}, { _id: false });

// Order schema with validation rules
const OrderSchema = new Schema<IOrder>({
  orderId: {
    type: String,
    required: [true, 'Order ID is required'],
    unique: true,
    index: true,
    default: function() {
      // Generate unique order ID with timestamp prefix for better sorting
      const timestamp = Date.now().toString(36);
      const randomId = uuidv4().replace(/-/g, '').substring(0, 8);
      return `ORD-${timestamp}-${randomId}`.toUpperCase();
    }
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  items: {
    type: [OrderItemSchema],
    required: [true, 'Order items are required'],
    validate: {
      validator: function(items: IOrderItem[]) {
        return items.length > 0;
      },
      message: 'Order must contain at least one item'
    }
  },
  totalAmount: {
    type: Number,
    required: [true, 'Total amount is required'],
    min: [0.01, 'Total amount must be greater than 0'],
    validate: {
      validator: function(value: number) {
        return Number.isInteger(value * 100);
      },
      message: 'Total amount must have at most 2 decimal places'
    }
  },
  status: {
    type: String,
    required: [true, 'Order status is required'],
    enum: {
      values: Object.values(OrderStatus),
      message: 'Status must be one of: pending, confirmed, preparing, delivered, cancelled'
    },
    default: OrderStatus.PENDING,
    index: true
  },
  paymentStatus: {
    type: String,
    required: [true, 'Payment status is required'],
    enum: {
      values: Object.values(PaymentStatus),
      message: 'Payment status must be one of: pending, completed, failed'
    },
    default: PaymentStatus.PENDING,
    index: true
  },
  deliveryAddress: {
    type: AddressSchema,
    required: [true, 'Delivery address is required']
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      // Round monetary values to 2 decimal places in JSON output
      if (ret.totalAmount) {
        ret.totalAmount = Math.round(ret.totalAmount * 100) / 100;
      }
      if (ret.items) {
        ret.items.forEach((item: IOrderItem) => {
          if (item.price) {
            item.price = Math.round(item.price * 100) / 100;
          }
          if (item.totalPrice) {
            item.totalPrice = Math.round(item.totalPrice * 100) / 100;
          }
        });
      }
      return ret;
    }
  }
});

// Create indexes for efficient queries
OrderSchema.index({ userId: 1, createdAt: -1 }); // For user order history
OrderSchema.index({ orderId: 1 }, { unique: true }); // For order lookup by tracking ID
OrderSchema.index({ status: 1, createdAt: -1 }); // For status-based queries
OrderSchema.index({ paymentStatus: 1 }); // For payment status queries
OrderSchema.index({ createdAt: -1 }); // For chronological ordering

// Pre-save middleware to validate total amount matches item totals
OrderSchema.pre('save', function(next) {
  const calculatedTotal = this.calculateTotal();
  const tolerance = 0.01; // Allow for small floating point differences
  
  if (Math.abs(this.totalAmount - calculatedTotal) > tolerance) {
    return next(new Error('Total amount does not match sum of item totals'));
  }
  
  next();
});

// Instance method to calculate total from items
OrderSchema.methods.calculateTotal = function(): number {
  return this.items.reduce((total: number, item: IOrderItem) => {
    return total + item.totalPrice;
  }, 0);
};

// Instance method to update order status
OrderSchema.methods.updateStatus = function(newStatus: OrderStatus): void {
  this.status = newStatus;
};

// Instance method to update payment status
OrderSchema.methods.updatePaymentStatus = function(newStatus: PaymentStatus): void {
  this.paymentStatus = newStatus;
};

// Static method to generate unique order ID
OrderSchema.statics.generateOrderId = function(): string {
  const timestamp = Date.now().toString(36);
  const randomId = uuidv4().replace(/-/g, '').substring(0, 8);
  return `ORD-${timestamp}-${randomId}`.toUpperCase();
};

// Create and export the Order model
export const Order = mongoose.model<IOrder>('Order', OrderSchema);