# Deployment Guide - Food Ordering Platform

This document provides step-by-step instructions for deploying the Food Ordering Platform in various environments.

## Quick Start

### Prerequisites

- Docker and Docker Compose installed
- Node.js 18+ (for local development)
- Git

### Development Deployment

1. **Clone and Setup:**

```bash
git clone <repository-url>
cd food-ordering-platform
cp .env.production .env
# Edit .env with your configuration
```

2. **Deploy with Docker:**

```bash
npm run docker:build
npm run docker:up
```

3. **Verify Deployment:**

```bash
./scripts/health-check.sh development
```

### Production Deployment

1. **Prepare Environment:**

```bash
cp .env.production .env
# Update .env with production values
cp frontend/.env.production frontend/.env
# Update frontend/.env with production values
```

2. **Deploy:**

```bash
./scripts/deploy.sh production v1.0.0
```

3. **Verify:**

```bash
./scripts/health-check.sh production
```

## Environment Configuration

### Required Environment Variables

**Backend (.env):**

```env
NODE_ENV=production
MONGODB_URI=your-mongodb-connection-string
JWT_SECRET=your-jwt-secret-key
CORS_ORIGIN=https://yourdomain.com
```

**Frontend (.env):**

```env
REACT_APP_API_URL=https://api.yourdomain.com/api
REACT_APP_WEBSOCKET_URL=https://api.yourdomain.com
```

### SSL Certificate Setup

1. **Using Let's Encrypt:**

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

2. **Using Custom Certificate:**

```bash
# Place your certificates in the ssl directory
mkdir -p ssl
cp your-cert.pem ssl/cert.pem
cp your-key.pem ssl/key.pem
```

## Deployment Options

### Option 1: Docker Compose (Recommended)

**Advantages:**

- Easy to deploy and manage
- Consistent across environments
- Built-in service orchestration

**Steps:**

```bash
# Production deployment
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Scale services
docker-compose -f docker-compose.prod.yml up -d --scale backend=3
```

### Option 2: Cloud Deployment

#### AWS ECS

1. **Build and Push Images:**

```bash
# Build images
docker build -t food-ordering/backend -f backend/Dockerfile .
docker build -t food-ordering/frontend -f frontend/Dockerfile .

# Tag for ECR
docker tag food-ordering/backend:latest 123456789012.dkr.ecr.us-east-1.amazonaws.com/food-ordering/backend:latest

# Push to ECR
docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/food-ordering/backend:latest
```

2. **Deploy to ECS:**

```bash
# Create ECS service
aws ecs create-service --cluster food-ordering --service-name backend --task-definition food-ordering-backend:1 --desired-count 2
```

#### Google Cloud Run

```bash
# Build and deploy
gcloud builds submit --tag gcr.io/PROJECT-ID/food-ordering-backend
gcloud run deploy food-ordering-backend --image gcr.io/PROJECT-ID/food-ordering-backend --platform managed
```

### Option 3: Traditional VPS

1. **Install Dependencies:**

```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install MongoDB
sudo apt-get install -y mongodb

# Install Nginx
sudo apt-get install -y nginx
```

2. **Deploy Application:**

```bash
# Clone repository
git clone <repository-url>
cd food-ordering-platform

# Install dependencies
npm run install:all

# Build application
npm run build:prod

# Start with PM2
pm2 start ecosystem.config.js --env production
```

## Database Setup

### MongoDB Atlas (Recommended for Production)

1. **Create Cluster:**

   - Go to MongoDB Atlas
   - Create new cluster
   - Configure network access
   - Create database user

2. **Connection String:**

```
mongodb+srv://username:password@cluster.mongodb.net/food_ordering?retryWrites=true&w=majority
```

### Self-Hosted MongoDB

1. **Install MongoDB:**

```bash
# Ubuntu/Debian
sudo apt-get install -y mongodb

# Start service
sudo systemctl start mongodb
sudo systemctl enable mongodb
```

2. **Initialize Database:**

```bash
# Run initialization script
mongo < scripts/mongo-init/init.js
```

## Monitoring and Maintenance

### Health Monitoring

1. **Automated Health Checks:**

```bash
# Add to crontab
*/5 * * * * /path/to/scripts/health-check.sh production >> /var/log/health-check.log 2>&1
```

2. **Application Monitoring:**

```bash
# View application logs
docker-compose -f docker-compose.prod.yml logs -f backend

# Monitor resource usage
docker stats
```

### Backup Strategy

1. **Database Backup:**

```bash
# Manual backup
./scripts/backup-mongodb.sh

# Automated backup (add to crontab)
0 2 * * * /path/to/scripts/backup-mongodb.sh >> /var/log/backup.log 2>&1
```

2. **Application Backup:**

```bash
# Backup application files
tar -czf app-backup-$(date +%Y%m%d).tar.gz --exclude='node_modules' --exclude='logs' .
```

### Updates and Rollbacks

1. **Update Application:**

```bash
# Pull latest changes
git pull origin main

# Deploy new version
./scripts/deploy.sh production v1.1.0
```

2. **Rollback:**

```bash
# Rollback to previous version
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --scale backend=3
```

## Security Considerations

### SSL/TLS Configuration

1. **Nginx SSL Configuration:**

```nginx
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
ssl_prefer_server_ciphers off;
```

2. **Security Headers:**

```nginx
add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";
add_header X-Frame-Options DENY;
add_header X-Content-Type-Options nosniff;
```

### Firewall Configuration

```bash
# Allow HTTP and HTTPS
sudo ufw allow 80
sudo ufw allow 443

# Allow SSH (be careful!)
sudo ufw allow 22

# Enable firewall
sudo ufw enable
```

### Environment Security

1. **Secure Environment Variables:**

```bash
# Set proper permissions
chmod 600 .env
chown root:root .env
```

2. **Use Secrets Management:**

```bash
# AWS Secrets Manager
aws secretsmanager get-secret-value --secret-id food-ordering/jwt-secret

# Docker Secrets
echo "your-secret" | docker secret create jwt_secret -
```

## Performance Optimization

### Application Performance

1. **Enable Caching:**

```env
REDIS_URL=redis://redis:6379
```

2. **Database Optimization:**

```javascript
// Connection pooling
mongoose.connect(uri, {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
});
```

### Infrastructure Performance

1. **Load Balancing:**

```yaml
# docker-compose.prod.yml
backend:
  deploy:
    replicas: 3
```

2. **CDN Configuration:**

```nginx
# Cache static assets
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
  expires 1y;
  add_header Cache-Control "public, immutable";
}
```

## Troubleshooting

### Common Issues

1. **Application Won't Start:**

```bash
# Check logs
docker-compose logs backend

# Check environment variables
docker exec container_name env
```

2. **Database Connection Issues:**

```bash
# Test MongoDB connection
mongo "mongodb://localhost:27017/food_ordering"

# Check network connectivity
telnet mongodb-host 27017
```

3. **SSL Certificate Issues:**

```bash
# Check certificate
openssl x509 -in cert.pem -text -noout

# Test SSL
openssl s_client -connect yourdomain.com:443
```

### Performance Issues

1. **High Memory Usage:**

```bash
# Monitor memory
docker stats

# Restart services
docker-compose restart backend
```

2. **Slow Database Queries:**

```javascript
// Enable MongoDB profiling
db.setProfilingLevel(2, { slowms: 100 });
db.system.profile.find().sort({ ts: -1 }).limit(5);
```

## Support and Maintenance

### Regular Maintenance Tasks

1. **Weekly:**

   - Review application logs
   - Check disk space
   - Verify backups

2. **Monthly:**

   - Update dependencies
   - Review security patches
   - Performance analysis

3. **Quarterly:**
   - Security audit
   - Capacity planning
   - Disaster recovery testing

### Getting Help

1. **Documentation:**

   - [API Documentation](docs/API.md)
   - [Developer Guide](docs/DEVELOPER_GUIDE.md)
   - [User Guide](docs/USER_GUIDE.md)

2. **Support Channels:**
   - GitHub Issues
   - Email: support@yourdomain.com
   - Documentation: https://docs.yourdomain.com

### Version Management

```bash
# Tag releases
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0

# Deploy specific version
./scripts/deploy.sh production v1.0.0
```

This deployment guide provides comprehensive instructions for deploying the Food Ordering Platform. Adjust configurations based on your specific infrastructure and requirements.
