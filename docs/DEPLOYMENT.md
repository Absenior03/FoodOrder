# Deployment Guide - Food Ordering Platform

This guide covers deployment strategies and configurations for the Food Ordering Platform.

## Table of Contents

1. [Deployment Overview](#deployment-overview)
2. [Environment Setup](#environment-setup)
3. [Docker Deployment](#docker-deployment)
4. [Cloud Deployment](#cloud-deployment)
5. [Database Setup](#database-setup)
6. [SSL/HTTPS Configuration](#sslhttps-configuration)
7. [Monitoring and Logging](#monitoring-and-logging)
8. [Backup and Recovery](#backup-and-recovery)
9. [Performance Optimization](#performance-optimization)
10. [Troubleshooting](#troubleshooting)

## Deployment Overview

### Architecture Components

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Load Balancer │    │   Web Server    │    │   Database      │
│   (Nginx/ALB)   │◄──►│   (Node.js)     │◄──►│   (MongoDB)     │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   Cache Layer   │
                       │   (Redis)       │
                       └─────────────────┘
```

### Deployment Options

1. **Docker Containers** - Recommended for consistency
2. **Cloud Platforms** - AWS, Google Cloud, Azure
3. **VPS/Dedicated Servers** - Traditional hosting
4. **Serverless** - For specific components

## Environment Setup

### Production Environment Variables

Create a `.env.production` file:

```env
# Server Configuration
NODE_ENV=production
PORT=5000
HOST=0.0.0.0

# Database Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/production?retryWrites=true&w=majority
REDIS_URL=redis://redis-server:6379

# Authentication & Security
JWT_SECRET=your-super-secure-jwt-secret-key-min-32-chars
JWT_EXPIRES_IN=24h
REFRESH_TOKEN_EXPIRES_IN=7d
BCRYPT_SALT_ROUNDS=12

# CORS Configuration
CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com
FRONTEND_URL=https://yourdomain.com
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_AUTH_MAX=5
RATE_LIMIT_REGISTER_MAX=3

# Logging
LOG_LEVEL=info
LOG_FILE_PATH=/var/log/food-ordering

# Email Configuration (if implemented)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# File Upload (if implemented)
UPLOAD_MAX_SIZE=5242880
UPLOAD_ALLOWED_TYPES=image/jpeg,image/png,image/webp

# Monitoring
SENTRY_DSN=your-sentry-dsn
NEW_RELIC_LICENSE_KEY=your-newrelic-key
```

### Frontend Environment Variables

Create a `.env.production` file in the frontend directory:

```env
REACT_APP_API_URL=https://api.yourdomain.com
REACT_APP_WEBSOCKET_URL=https://api.yourdomain.com
REACT_APP_ENVIRONMENT=production
REACT_APP_VERSION=1.0.0
REACT_APP_SENTRY_DSN=your-frontend-sentry-dsn
```

## Docker Deployment

### Multi-Stage Dockerfile

**Backend Dockerfile:**

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY backend/package*.json ./backend/

# Install all dependencies (including dev)
RUN npm ci
RUN cd backend && npm ci

# Copy source code
COPY backend/ ./backend/

# Build the application
RUN cd backend && npm run build

# Production stage
FROM node:18-alpine AS production

# Create app user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

WORKDIR /app

# Copy package files
COPY --from=builder /app/backend/package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy built application
COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/backend/src/scripts ./src/scripts

# Change ownership to nodejs user
RUN chown -R nodejs:nodejs /app
USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

EXPOSE 5000

CMD ["node", "dist/index.js"]
```

**Frontend Dockerfile:**

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY frontend/package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY frontend/ ./

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine AS production

# Copy custom nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built application
COPY --from=builder /app/build /usr/share/nginx/html

# Add non-root user
RUN addgroup -g 1001 -S nginx
RUN adduser -S nginx -u 1001

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### Docker Compose Configuration

**docker-compose.prod.yml:**

```yaml
version: "3.8"

services:
  # Frontend Service
  frontend:
    build:
      context: .
      dockerfile: frontend/Dockerfile
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - backend
    restart: unless-stopped
    networks:
      - app-network

  # Backend Service
  backend:
    build:
      context: .
      dockerfile: backend/Dockerfile
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=${MONGODB_URI}
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - mongo
      - redis
    restart: unless-stopped
    volumes:
      - ./logs:/var/log/food-ordering
    networks:
      - app-network

  # MongoDB Service
  mongo:
    image: mongo:6
    ports:
      - "27017:27017"
    environment:
      - MONGO_INITDB_ROOT_USERNAME=${MONGO_ROOT_USERNAME}
      - MONGO_INITDB_ROOT_PASSWORD=${MONGO_ROOT_PASSWORD}
      - MONGO_INITDB_DATABASE=food_ordering
    volumes:
      - mongo_data:/data/db
      - ./mongo-init:/docker-entrypoint-initdb.d:ro
    restart: unless-stopped
    networks:
      - app-network

  # Redis Service
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    restart: unless-stopped
    networks:
      - app-network

  # Nginx Load Balancer
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
      - ./logs/nginx:/var/log/nginx
    depends_on:
      - frontend
      - backend
    restart: unless-stopped
    networks:
      - app-network

volumes:
  mongo_data:
  redis_data:

networks:
  app-network:
    driver: bridge
```

### Nginx Configuration

**nginx.conf:**

```nginx
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server backend:5000;
    }

    upstream frontend {
        server frontend:80;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=auth:10m rate=1r/s;

    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Security Headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";

    # HTTPS Redirect
    server {
        listen 80;
        server_name yourdomain.com www.yourdomain.com;
        return 301 https://$server_name$request_uri;
    }

    # Main HTTPS Server
    server {
        listen 443 ssl http2;
        server_name yourdomain.com www.yourdomain.com;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;

        # Frontend
        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # API Routes
        location /api/ {
            limit_req zone=api burst=20 nodelay;

            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;

            # WebSocket support
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
        }

        # Auth Routes (stricter rate limiting)
        location /api/auth/ {
            limit_req zone=auth burst=5 nodelay;

            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Static files caching
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
```

## Cloud Deployment

### AWS Deployment

**Using AWS ECS with Fargate:**

1. **Create ECR Repositories:**

```bash
aws ecr create-repository --repository-name food-ordering/backend
aws ecr create-repository --repository-name food-ordering/frontend
```

2. **Build and Push Images:**

```bash
# Get login token
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789012.dkr.ecr.us-east-1.amazonaws.com

# Build and tag images
docker build -t food-ordering/backend -f backend/Dockerfile .
docker tag food-ordering/backend:latest 123456789012.dkr.ecr.us-east-1.amazonaws.com/food-ordering/backend:latest

# Push images
docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/food-ordering/backend:latest
```

3. **ECS Task Definition:**

```json
{
  "family": "food-ordering-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::123456789012:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::123456789012:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "123456789012.dkr.ecr.us-east-1.amazonaws.com/food-ordering/backend:latest",
      "portMappings": [
        {
          "containerPort": 5000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "MONGODB_URI",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789012:secret:food-ordering/mongodb-uri"
        },
        {
          "name": "JWT_SECRET",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789012:secret:food-ordering/jwt-secret"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/food-ordering-backend",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

### Google Cloud Platform

**Using Cloud Run:**

1. **Build and Deploy:**

```bash
# Build image
gcloud builds submit --tag gcr.io/PROJECT-ID/food-ordering-backend

# Deploy to Cloud Run
gcloud run deploy food-ordering-backend \
  --image gcr.io/PROJECT-ID/food-ordering-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production \
  --set-secrets MONGODB_URI=mongodb-uri:latest,JWT_SECRET=jwt-secret:latest
```

2. **Cloud Build Configuration (cloudbuild.yaml):**

```yaml
steps:
  # Build backend
  - name: "gcr.io/cloud-builders/docker"
    args:
      [
        "build",
        "-t",
        "gcr.io/$PROJECT_ID/food-ordering-backend",
        "-f",
        "backend/Dockerfile",
        ".",
      ]

  # Build frontend
  - name: "gcr.io/cloud-builders/docker"
    args:
      [
        "build",
        "-t",
        "gcr.io/$PROJECT_ID/food-ordering-frontend",
        "-f",
        "frontend/Dockerfile",
        ".",
      ]

  # Deploy backend
  - name: "gcr.io/cloud-builders/gcloud"
    args:
      [
        "run",
        "deploy",
        "food-ordering-backend",
        "--image",
        "gcr.io/$PROJECT_ID/food-ordering-backend",
        "--region",
        "us-central1",
        "--platform",
        "managed",
      ]

images:
  - "gcr.io/$PROJECT_ID/food-ordering-backend"
  - "gcr.io/$PROJECT_ID/food-ordering-frontend"
```

## Database Setup

### MongoDB Atlas Setup

1. **Create Cluster:**

   - Go to MongoDB Atlas
   - Create new cluster
   - Choose appropriate tier (M10+ for production)
   - Configure network access and database users

2. **Connection String:**

```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/food_ordering?retryWrites=true&w=majority
```

3. **Database Initialization Script:**

```javascript
// mongo-init/init.js
db = db.getSiblingDB("food_ordering");

// Create collections with validation
db.createCollection("users", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["email", "password", "firstName", "lastName"],
      properties: {
        email: {
          bsonType: "string",
          pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+.[a-zA-Z]{2,}$",
        },
        password: { bsonType: "string", minLength: 6 },
        firstName: { bsonType: "string", minLength: 1 },
        lastName: { bsonType: "string", minLength: 1 },
      },
    },
  },
});

// Create indexes
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ createdAt: -1 });

db.fooditems.createIndex({ category: 1 });
db.fooditems.createIndex({ name: "text", description: "text" });

db.orders.createIndex({ userId: 1, createdAt: -1 });
db.orders.createIndex({ orderId: 1 }, { unique: true });

db.carts.createIndex({ userId: 1 }, { unique: true });
```

### Redis Setup

**Redis Configuration:**

```redis
# redis.conf
bind 0.0.0.0
port 6379
requirepass your-redis-password
maxmemory 256mb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
```

## SSL/HTTPS Configuration

### Let's Encrypt with Certbot

1. **Install Certbot:**

```bash
sudo apt update
sudo apt install certbot python3-certbot-nginx
```

2. **Obtain Certificate:**

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

3. **Auto-renewal:**

```bash
sudo crontab -e
# Add this line:
0 12 * * * /usr/bin/certbot renew --quiet
```

### Manual SSL Certificate

1. **Generate Certificate:**

```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/ssl/private/nginx-selfsigned.key \
  -out /etc/ssl/certs/nginx-selfsigned.crt
```

2. **Nginx SSL Configuration:**

```nginx
ssl_certificate /etc/ssl/certs/nginx-selfsigned.crt;
ssl_certificate_key /etc/ssl/private/nginx-selfsigned.key;
```

## Monitoring and Logging

### Application Monitoring

**Health Check Endpoint:**

```typescript
// routes/health.ts
import { Router } from "express";
import mongoose from "mongoose";
import Redis from "redis";

const router = Router();

router.get("/health", async (req, res) => {
  const health = {
    status: "OK",
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version,
    environment: process.env.NODE_ENV,
    services: {
      database: {
        status:
          mongoose.connection.readyState === 1 ? "connected" : "disconnected",
        host: mongoose.connection.host,
        name: mongoose.connection.name,
      },
      cache: {
        status: "checking",
      },
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + " MB",
        total:
          Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + " MB",
      },
      uptime: Math.round(process.uptime()) + " seconds",
    },
  };

  // Check Redis connection
  try {
    const redis = Redis.createClient(process.env.REDIS_URL);
    await redis.ping();
    health.services.cache.status = "connected";
    await redis.quit();
  } catch (error) {
    health.services.cache.status = "disconnected";
  }

  const statusCode =
    health.services.database.status === "connected" ? 200 : 503;
  res.status(statusCode).json(health);
});

export default router;
```

### Logging Configuration

**Winston Logger Setup:**

```typescript
// utils/logger.ts
import winston from "winston";
import path from "path";

const logDir = process.env.LOG_FILE_PATH || "logs";

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: "food-ordering-backend",
    version: process.env.npm_package_version,
  },
  transports: [
    // Error logs
    new winston.transports.File({
      filename: path.join(logDir, "error.log"),
      level: "error",
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),

    // Combined logs
    new winston.transports.File({
      filename: path.join(logDir, "combined.log"),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),

    // Console output
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});

// Handle uncaught exceptions
logger.exceptions.handle(
  new winston.transports.File({ filename: path.join(logDir, "exceptions.log") })
);

// Handle unhandled promise rejections
logger.rejections.handle(
  new winston.transports.File({ filename: path.join(logDir, "rejections.log") })
);
```

### Monitoring with Prometheus

**Metrics Collection:**

```typescript
// middleware/metrics.ts
import promClient from "prom-client";

// Create metrics
const httpRequestDuration = new promClient.Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status_code"],
});

const httpRequestTotal = new promClient.Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status_code"],
});

export const metricsMiddleware = (req: any, res: any, next: any) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path;

    httpRequestDuration
      .labels(req.method, route, res.statusCode)
      .observe(duration);

    httpRequestTotal.labels(req.method, route, res.statusCode).inc();
  });

  next();
};

// Metrics endpoint
export const metricsHandler = (req: any, res: any) => {
  res.set("Content-Type", promClient.register.contentType);
  res.end(promClient.register.metrics());
};
```

## Backup and Recovery

### Database Backup

**MongoDB Backup Script:**

```bash
#!/bin/bash
# backup-mongodb.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/mongodb"
DB_NAME="food_ordering"

# Create backup directory
mkdir -p $BACKUP_DIR

# Perform backup
mongodump --uri="$MONGODB_URI" --db=$DB_NAME --out=$BACKUP_DIR/$DATE

# Compress backup
tar -czf $BACKUP_DIR/mongodb_backup_$DATE.tar.gz -C $BACKUP_DIR $DATE

# Remove uncompressed backup
rm -rf $BACKUP_DIR/$DATE

# Keep only last 7 days of backups
find $BACKUP_DIR -name "mongodb_backup_*.tar.gz" -mtime +7 -delete

echo "Backup completed: mongodb_backup_$DATE.tar.gz"
```

**Automated Backup with Cron:**

```bash
# Add to crontab
0 2 * * * /path/to/backup-mongodb.sh >> /var/log/mongodb-backup.log 2>&1
```

### Application Backup

**File System Backup:**

```bash
#!/bin/bash
# backup-app.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/application"
APP_DIR="/app"

# Create backup
tar -czf $BACKUP_DIR/app_backup_$DATE.tar.gz \
  --exclude='node_modules' \
  --exclude='logs' \
  --exclude='.git' \
  -C $APP_DIR .

echo "Application backup completed: app_backup_$DATE.tar.gz"
```

## Performance Optimization

### Production Optimizations

**PM2 Configuration:**

```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: "food-ordering-backend",
      script: "dist/index.js",
      instances: "max",
      exec_mode: "cluster",
      env: {
        NODE_ENV: "development",
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 5000,
      },
      error_file: "./logs/err.log",
      out_file: "./logs/out.log",
      log_file: "./logs/combined.log",
      time: true,
      max_memory_restart: "1G",
      node_args: "--max-old-space-size=1024",
    },
  ],
};
```

**Database Optimization:**

```javascript
// Database connection optimization
const mongooseOptions = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  bufferMaxEntries: 0,
  bufferCommands: false,
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

mongoose.connect(process.env.MONGODB_URI, mongooseOptions);
```

### CDN Configuration

**CloudFlare Settings:**

```javascript
// Cache rules for static assets
const cacheRules = {
  "*.js": "max-age=31536000", // 1 year
  "*.css": "max-age=31536000", // 1 year
  "*.png": "max-age=31536000", // 1 year
  "*.jpg": "max-age=31536000", // 1 year
  "*.gif": "max-age=31536000", // 1 year
  "*.ico": "max-age=31536000", // 1 year
  "/api/*": "no-cache", // API responses
};
```

## Troubleshooting

### Common Issues

**1. Application Won't Start:**

```bash
# Check logs
docker logs container_name

# Check environment variables
docker exec container_name env

# Check port availability
netstat -tulpn | grep :5000
```

**2. Database Connection Issues:**

```bash
# Test MongoDB connection
mongo "mongodb+srv://cluster.mongodb.net/test" --username username

# Check network connectivity
telnet cluster.mongodb.net 27017
```

**3. SSL Certificate Issues:**

```bash
# Check certificate validity
openssl x509 -in certificate.crt -text -noout

# Test SSL connection
openssl s_client -connect yourdomain.com:443
```

**4. Performance Issues:**

```bash
# Monitor resource usage
docker stats

# Check application metrics
curl http://localhost:5000/metrics

# Monitor database performance
db.runCommand({serverStatus: 1})
```

### Debugging Tools

**Application Debugging:**

```bash
# Enable debug mode
NODE_ENV=development DEBUG=* npm start

# Memory usage analysis
node --inspect dist/index.js

# CPU profiling
node --prof dist/index.js
```

**Database Debugging:**

```javascript
// Enable MongoDB query logging
mongoose.set("debug", true);

// Slow query analysis
db.setProfilingLevel(2, { slowms: 100 });
db.system.profile.find().sort({ ts: -1 }).limit(5);
```

### Rollback Procedures

**Application Rollback:**

```bash
# Docker rollback
docker service update --rollback service_name

# Manual rollback
git checkout previous_commit
docker build -t app:rollback .
docker-compose up -d
```

**Database Rollback:**

```bash
# Restore from backup
mongorestore --uri="$MONGODB_URI" --drop /path/to/backup
```

This deployment guide provides comprehensive instructions for deploying the Food Ordering Platform in production environments. Adjust configurations based on your specific infrastructure and requirements.
