// MongoDB initialization script for Food Ordering Platform
// This script runs when MongoDB container starts for the first time

// Switch to the application database
db = db.getSiblingDB('food_ordering');

// Create application user
db.createUser({
  user: 'app_user',
  pwd: 'app_password', // Change this in production
  roles: [
    {
      role: 'readWrite',
      db: 'food_ordering'
    }
  ]
});

// Create collections with validation schemas
print('Creating collections with validation...');

// Users collection
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['email', 'password', 'firstName', 'lastName'],
      properties: {
        email: {
          bsonType: 'string',
          pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
          description: 'Must be a valid email address'
        },
        password: {
          bsonType: 'string',
          minLength: 6,
          description: 'Password must be at least 6 characters'
        },
        firstName: {
          bsonType: 'string',
          minLength: 1,
          maxLength: 50,
          description: 'First name is required and must be 1-50 characters'
        },
        lastName: {
          bsonType: 'string',
          minLength: 1,
          maxLength: 50,
          description: 'Last name is required and must be 1-50 characters'
        },
        phone: {
          bsonType: ['string', 'null'],
          description: 'Phone number is optional'
        },
        address: {
          bsonType: ['object', 'null'],
          properties: {
            street: { bsonType: 'string' },
            city: { bsonType: 'string' },
            state: { bsonType: 'string' },
            zipCode: { bsonType: 'string' }
          }
        },
        createdAt: {
          bsonType: 'date',
          description: 'Creation timestamp'
        },
        updatedAt: {
          bsonType: 'date',
          description: 'Last update timestamp'
        }
      }
    }
  }
});

// Food items collection
db.createCollection('fooditems', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'category', 'price', 'stock'],
      properties: {
        name: {
          bsonType: 'string',
          minLength: 1,
          maxLength: 100,
          description: 'Item name is required'
        },
        description: {
          bsonType: 'string',
          maxLength: 500,
          description: 'Item description'
        },
        category: {
          enum: ['Fruit', 'Vegetable', 'Non-veg', 'Breads'],
          description: 'Category must be one of the predefined values'
        },
        price: {
          bsonType: 'number',
          minimum: 0,
          description: 'Price must be a positive number'
        },
        stock: {
          bsonType: 'int',
          minimum: 0,
          description: 'Stock must be a non-negative integer'
        },
        imageUrl: {
          bsonType: ['string', 'null'],
          description: 'Optional image URL'
        },
        isActive: {
          bsonType: 'bool',
          description: 'Whether the item is active'
        }
      }
    }
  }
});

// Carts collection
db.createCollection('carts', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['userId', 'items'],
      properties: {
        userId: {
          bsonType: 'objectId',
          description: 'User ID is required'
        },
        items: {
          bsonType: 'array',
          items: {
            bsonType: 'object',
            required: ['itemId', 'quantity', 'priceAtAdd'],
            properties: {
              itemId: {
                bsonType: 'objectId',
                description: 'Food item ID'
              },
              quantity: {
                bsonType: 'int',
                minimum: 1,
                description: 'Quantity must be at least 1'
              },
              priceAtAdd: {
                bsonType: 'number',
                minimum: 0,
                description: 'Price when item was added to cart'
              }
            }
          }
        }
      }
    }
  }
});

// Orders collection
db.createCollection('orders', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['orderId', 'userId', 'items', 'totalAmount', 'status'],
      properties: {
        orderId: {
          bsonType: 'string',
          pattern: '^ORD-[0-9]{4}-[0-9]{3,}$',
          description: 'Order ID must follow the pattern ORD-YYYY-XXX'
        },
        userId: {
          bsonType: 'objectId',
          description: 'User ID is required'
        },
        items: {
          bsonType: 'array',
          minItems: 1,
          items: {
            bsonType: 'object',
            required: ['itemId', 'name', 'quantity', 'price', 'totalPrice'],
            properties: {
              itemId: { bsonType: 'objectId' },
              name: { bsonType: 'string' },
              quantity: { bsonType: 'int', minimum: 1 },
              price: { bsonType: 'number', minimum: 0 },
              totalPrice: { bsonType: 'number', minimum: 0 }
            }
          }
        },
        totalAmount: {
          bsonType: 'number',
          minimum: 0,
          description: 'Total amount must be positive'
        },
        status: {
          enum: ['pending', 'confirmed', 'preparing', 'delivered', 'cancelled'],
          description: 'Order status'
        },
        paymentStatus: {
          enum: ['pending', 'completed', 'failed'],
          description: 'Payment status'
        },
        deliveryAddress: {
          bsonType: 'object',
          required: ['street', 'city', 'state', 'zipCode'],
          properties: {
            street: { bsonType: 'string' },
            city: { bsonType: 'string' },
            state: { bsonType: 'string' },
            zipCode: { bsonType: 'string' }
          }
        }
      }
    }
  }
});

print('Creating indexes...');

// Users indexes
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ createdAt: -1 });

// Food items indexes
db.fooditems.createIndex({ category: 1 });
db.fooditems.createIndex({ name: 'text', description: 'text' });
db.fooditems.createIndex({ isActive: 1, stock: 1 });
db.fooditems.createIndex({ price: 1 });

// Carts indexes
db.carts.createIndex({ userId: 1 }, { unique: true });
db.carts.createIndex({ updatedAt: -1 });

// Orders indexes
db.orders.createIndex({ orderId: 1 }, { unique: true });
db.orders.createIndex({ userId: 1, createdAt: -1 });
db.orders.createIndex({ status: 1 });
db.orders.createIndex({ createdAt: -1 });

print('Database initialization completed successfully!');

// Insert sample data for development
if (db.getName() === 'food_ordering_dev') {
  print('Inserting sample data for development...');
  
  // Sample food items
  db.fooditems.insertMany([
    {
      name: 'Red Apple',
      description: 'Fresh red apples from local farms',
      category: 'Fruit',
      price: 2.99,
      stock: 50,
      imageUrl: 'https://example.com/apple.jpg',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      name: 'Banana',
      description: 'Ripe yellow bananas',
      category: 'Fruit',
      price: 1.99,
      stock: 30,
      imageUrl: 'https://example.com/banana.jpg',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      name: 'Carrot',
      description: 'Fresh organic carrots',
      category: 'Vegetable',
      price: 1.49,
      stock: 25,
      imageUrl: 'https://example.com/carrot.jpg',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      name: 'Chicken Breast',
      description: 'Fresh chicken breast',
      category: 'Non-veg',
      price: 8.99,
      stock: 15,
      imageUrl: 'https://example.com/chicken.jpg',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      name: 'Whole Wheat Bread',
      description: 'Fresh baked whole wheat bread',
      category: 'Breads',
      price: 3.49,
      stock: 20,
      imageUrl: 'https://example.com/bread.jpg',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]);
  
  print('Sample data inserted successfully!');
}