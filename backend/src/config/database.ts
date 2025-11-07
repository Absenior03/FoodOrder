import mongoose from 'mongoose';
import { createClient } from 'redis';

export class DatabaseConfig {
  private static redisClient: any = null;

  static async connectMongoDB(): Promise<void> {
    try {
      const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/food-ordering-platform';
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
        socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
      });
      console.log('✅ Connected to MongoDB');
    } catch (error) {
      console.error('❌ MongoDB connection error:', error);
      console.log('ℹ️  Continuing without MongoDB. Some features may not work.');
      // Don't throw error, continue without MongoDB
    }
  }

  static async connectRedis(): Promise<any> {
  try {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    this.redisClient = createClient({
      url: redisUrl,
      socket: {
        connectTimeout: 5000
      }
    });

    this.redisClient.on('error', (err: any) => {
      console.error('❌ Redis Client Error:', err);
    });

    this.redisClient.on('connect', () => {
      console.log('🔄 Connecting to Redis...');
    });

    this.redisClient.on('ready', () => {
      console.log('✅ Connected to Redis');
    });

    await this.redisClient.connect();
    return this.redisClient;
  } catch (error) {
    console.error('❌ Redis connection error:', error);
    console.log('ℹ️  Continuing without Redis. Caching features may not work.');
    return null;
  }
}

  static getRedisClient(): any {
    return this.redisClient;
  }

  static async closeConnections(): Promise<void> {
    try {
      await mongoose.connection.close();
      console.log('✅ MongoDB connection closed');
      
      if (this.redisClient) {
        await this.redisClient.quit();
        console.log('✅ Redis connection closed');
      }
    } catch (error) {
      console.error('❌ Error closing database connections:', error);
      throw error;
    }
  }
}