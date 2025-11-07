# API Documentation

This document provides comprehensive documentation for the Food Ordering Platform API endpoints.

## Base URL

- **Development**: `http://localhost:5000/api`
- **Production**: `https://your-domain.com/api`

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Token Expiration

- **Access Token**: 24 hours
- **Refresh Token**: 7 days

## Rate Limiting

The API implements rate limiting to prevent abuse:

- **General endpoints**: 100 requests per 15 minutes
- **Authentication endpoints**: 5 requests per 15 minutes
- **Registration**: 3 requests per 15 minutes
- **Cart operations**: 50 requests per 15 minutes
- **Checkout**: 10 requests per 15 minutes

## Response Format

All API responses follow a consistent format:

### Success Response

```json
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Operation completed successfully"
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {
      // Additional error details
    }
  }
}
```

## Authentication Endpoints

### Register User

**POST** `/auth/register`

Register a new user account.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "user_id",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "phone": "+1234567890",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "jwt_token_here"
  },
  "message": "User registered successfully"
}
```

**Validation Rules:**

- Email must be valid and unique
- Password minimum 6 characters
- First name and last name required
- Phone number optional but must be valid if provided

### Login User

**POST** `/auth/login`

Authenticate user and receive JWT token.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "user_id",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe"
    },
    "token": "jwt_token_here"
  },
  "message": "Login successful"
}
```

### Logout User

**POST** `/auth/logout`

**Authentication Required**: Yes

Logout user and invalidate token.

**Response:**

```json
{
  "success": true,
  "message": "Logout successful"
}
```

### Get User Profile

**GET** `/auth/profile`

**Authentication Required**: Yes

Get current user's profile information.

**Response:**

```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "user_id",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "phone": "+1234567890",
      "address": {
        "street": "123 Main St",
        "city": "Anytown",
        "state": "ST",
        "zipCode": "12345"
      }
    }
  }
}
```

### Update User Profile

**PUT** `/auth/profile`

**Authentication Required**: Yes

Update user profile information.

**Request Body:**

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "address": {
    "street": "123 Main St",
    "city": "Anytown",
    "state": "ST",
    "zipCode": "12345"
  }
}
```

## Inventory Endpoints

### Get All Items

**GET** `/inventory/items`

Get all food items with optional filtering.

**Query Parameters:**

- `category` (optional): Filter by category (Fruit, Vegetable, Non-veg, Breads)
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Items per page (default: 20)
- `sortBy` (optional): Sort field (name, price, createdAt)
- `sortOrder` (optional): Sort order (asc, desc)

**Example Request:**

```
GET /inventory/items?category=Fruit&page=1&limit=10&sortBy=price&sortOrder=asc
```

**Response:**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "_id": "item_id",
        "name": "Apple",
        "description": "Fresh red apples",
        "category": "Fruit",
        "price": 2.99,
        "stock": 50,
        "imageUrl": "https://example.com/apple.jpg",
        "isActive": true,
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 50,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### Get Item by ID

**GET** `/inventory/items/:id`

Get detailed information about a specific food item.

**Response:**

```json
{
  "success": true,
  "data": {
    "item": {
      "_id": "item_id",
      "name": "Apple",
      "description": "Fresh red apples from local farms",
      "category": "Fruit",
      "price": 2.99,
      "stock": 50,
      "imageUrl": "https://example.com/apple.jpg",
      "isActive": true,
      "nutritionalInfo": {
        "calories": 95,
        "protein": "0.5g",
        "carbs": "25g",
        "fat": "0.3g"
      },
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### Get Categories

**GET** `/inventory/categories`

Get all available food categories.

**Response:**

```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "name": "Fruit",
        "count": 15,
        "description": "Fresh fruits and berries"
      },
      {
        "name": "Vegetable",
        "count": 20,
        "description": "Fresh vegetables and greens"
      },
      {
        "name": "Non-veg",
        "count": 12,
        "description": "Meat, poultry, and seafood"
      },
      {
        "name": "Breads",
        "count": 8,
        "description": "Breads, pastries, and baked goods"
      }
    ]
  }
}
```

### Search Items

**GET** `/inventory/search`

Search for food items by name or description.

**Query Parameters:**

- `q` (required): Search query
- `category` (optional): Filter by category
- `page` (optional): Page number
- `limit` (optional): Items per page

**Example Request:**

```
GET /inventory/search?q=apple&category=Fruit&page=1&limit=10
```

### Update Item Stock

**PUT** `/inventory/items/:id/stock`

**Authentication Required**: Yes (Admin only)

Update stock quantity for a food item.

**Request Body:**

```json
{
  "stock": 100,
  "operation": "set" // or "add", "subtract"
}
```

## Cart Endpoints

### Get Cart

**GET** `/cart`

**Authentication Required**: Yes

Get current user's cart contents.

**Response:**

```json
{
  "success": true,
  "data": {
    "cart": {
      "_id": "cart_id",
      "userId": "user_id",
      "items": [
        {
          "itemId": {
            "_id": "item_id",
            "name": "Apple",
            "price": 2.99,
            "stock": 50,
            "imageUrl": "https://example.com/apple.jpg"
          },
          "quantity": 3,
          "priceAtAdd": 2.99,
          "totalPrice": 8.97
        }
      ],
      "totalItems": 3,
      "totalAmount": 8.97,
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### Add Item to Cart

**POST** `/cart/add`

**Authentication Required**: Yes

Add an item to the user's cart.

**Request Body:**

```json
{
  "itemId": "item_id",
  "quantity": 2
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "cartItem": {
      "itemId": "item_id",
      "quantity": 2,
      "priceAtAdd": 2.99,
      "totalPrice": 5.98
    },
    "cartSummary": {
      "totalItems": 5,
      "totalAmount": 14.95
    }
  },
  "message": "Item added to cart successfully"
}
```

### Update Cart Item

**PUT** `/cart/update`

**Authentication Required**: Yes

Update quantity of an item in the cart.

**Request Body:**

```json
{
  "itemId": "item_id",
  "quantity": 5
}
```

### Remove Item from Cart

**DELETE** `/cart/remove/:itemId`

**Authentication Required**: Yes

Remove an item from the cart.

**Response:**

```json
{
  "success": true,
  "data": {
    "cartSummary": {
      "totalItems": 2,
      "totalAmount": 8.97
    }
  },
  "message": "Item removed from cart successfully"
}
```

### Clear Cart

**DELETE** `/cart/clear`

**Authentication Required**: Yes

Remove all items from the cart.

### Sync Cart

**GET** `/cart/sync`

**Authentication Required**: Yes

Synchronize cart across multiple devices.

### Validate Cart

**GET** `/cart/validate`

**Authentication Required**: Yes

Validate cart items against current inventory and pricing.

**Response:**

```json
{
  "success": true,
  "data": {
    "isValid": true,
    "issues": [],
    "updatedItems": [],
    "unavailableItems": []
  }
}
```

## Order Endpoints

### Checkout

**POST** `/orders/checkout`

**Authentication Required**: Yes

Process cart checkout and create an order.

**Request Body:**

```json
{
  "deliveryAddress": {
    "street": "123 Main St",
    "city": "Anytown",
    "state": "ST",
    "zipCode": "12345"
  },
  "paymentMethod": "card",
  "specialInstructions": "Leave at door"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "order": {
      "_id": "order_id",
      "orderId": "ORD-2024-001",
      "userId": "user_id",
      "items": [
        {
          "itemId": "item_id",
          "name": "Apple",
          "quantity": 3,
          "price": 2.99,
          "totalPrice": 8.97
        }
      ],
      "totalAmount": 8.97,
      "status": "pending",
      "paymentStatus": "pending",
      "deliveryAddress": {
        "street": "123 Main St",
        "city": "Anytown",
        "state": "ST",
        "zipCode": "12345"
      },
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  },
  "message": "Order placed successfully"
}
```

### Validate Checkout

**POST** `/orders/validate-checkout`

**Authentication Required**: Yes

Validate cart items before checkout without creating an order.

### Get Order History

**GET** `/orders/history`

**Authentication Required**: Yes

Get user's order history with pagination.

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Orders per page (default: 10)
- `status` (optional): Filter by order status

**Response:**

```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "_id": "order_id",
        "orderId": "ORD-2024-001",
        "totalAmount": 8.97,
        "status": "delivered",
        "itemCount": 3,
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalOrders": 25
    }
  }
}
```

### Get Order by ID

**GET** `/orders/:orderId`

**Authentication Required**: Yes

Get detailed information about a specific order.

### Get Order Tracking

**GET** `/orders/:orderId/tracking`

**Authentication Required**: Yes

Get tracking information for an order.

**Response:**

```json
{
  "success": true,
  "data": {
    "tracking": {
      "orderId": "ORD-2024-001",
      "status": "preparing",
      "estimatedDelivery": "2024-01-01T18:00:00.000Z",
      "timeline": [
        {
          "status": "pending",
          "timestamp": "2024-01-01T12:00:00.000Z",
          "description": "Order received"
        },
        {
          "status": "confirmed",
          "timestamp": "2024-01-01T12:05:00.000Z",
          "description": "Order confirmed"
        },
        {
          "status": "preparing",
          "timestamp": "2024-01-01T12:15:00.000Z",
          "description": "Preparing your order"
        }
      ]
    }
  }
}
```

### Process Payment

**POST** `/orders/:orderId/payment`

**Authentication Required**: Yes

Process payment for an order (simulation).

**Request Body:**

```json
{
  "paymentMethod": "card",
  "cardDetails": {
    "number": "4111111111111111",
    "expiryMonth": "12",
    "expiryYear": "2025",
    "cvv": "123"
  }
}
```

### Update Order Status

**PUT** `/orders/:orderId/status`

**Authentication Required**: Yes (Admin only)

Update order status (admin functionality).

**Request Body:**

```json
{
  "status": "preparing",
  "notes": "Order is being prepared"
}
```

## WebSocket Events

The application supports real-time features through WebSocket connections.

### Connection

Connect to WebSocket server:

```javascript
const socket = io("http://localhost:5000", {
  auth: {
    token: "your-jwt-token",
  },
});
```

### Events

#### Stock Updates

```javascript
// Listen for stock updates
socket.on("stockUpdate", (data) => {
  console.log("Stock updated:", data);
  // { itemId: 'item_id', newStock: 45 }
});
```

#### Cart Synchronization

```javascript
// Listen for cart updates from other devices
socket.on("cartUpdate", (data) => {
  console.log("Cart updated:", data);
  // Updated cart data
});
```

#### Order Status Updates

```javascript
// Listen for order status changes
socket.on("orderStatusUpdate", (data) => {
  console.log("Order status updated:", data);
  // { orderId: 'ORD-2024-001', status: 'preparing' }
});
```

## Error Codes

| Code                   | Description                       |
| ---------------------- | --------------------------------- |
| `VALIDATION_ERROR`     | Request validation failed         |
| `AUTHENTICATION_ERROR` | Authentication required or failed |
| `AUTHORIZATION_ERROR`  | Insufficient permissions          |
| `NOT_FOUND`            | Resource not found                |
| `DUPLICATE_ENTRY`      | Resource already exists           |
| `INSUFFICIENT_STOCK`   | Not enough stock available        |
| `CART_EMPTY`           | Cart is empty                     |
| `ORDER_NOT_FOUND`      | Order not found                   |
| `PAYMENT_FAILED`       | Payment processing failed         |
| `RATE_LIMIT_EXCEEDED`  | Too many requests                 |
| `SERVER_ERROR`         | Internal server error             |

## Status Codes

The API uses standard HTTP status codes:

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Unprocessable Entity
- `429` - Too Many Requests
- `500` - Internal Server Error

## Data Models

### User Model

```typescript
interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: Address;
  createdAt: Date;
  updatedAt: Date;
}
```

### Food Item Model

```typescript
interface FoodItem {
  _id: string;
  name: string;
  description: string;
  category: "Fruit" | "Vegetable" | "Non-veg" | "Breads";
  price: number;
  stock: number;
  imageUrl?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### Cart Model

```typescript
interface Cart {
  _id: string;
  userId: string;
  items: CartItem[];
  createdAt: Date;
  updatedAt: Date;
}

interface CartItem {
  itemId: string | FoodItem;
  quantity: number;
  priceAtAdd: number;
}
```

### Order Model

```typescript
interface Order {
  _id: string;
  orderId: string;
  userId: string;
  items: OrderItem[];
  totalAmount: number;
  status: "pending" | "confirmed" | "preparing" | "delivered" | "cancelled";
  paymentStatus: "pending" | "completed" | "failed";
  deliveryAddress: Address;
  createdAt: Date;
  updatedAt: Date;
}

interface OrderItem {
  itemId: string;
  name: string;
  quantity: number;
  price: number;
  totalPrice: number;
}
```

### Address Model

```typescript
interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
}
```
