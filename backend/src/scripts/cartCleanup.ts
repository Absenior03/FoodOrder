import { DatabaseConfig } from '../config/database';
import { CartService } from '../services/cartService';

/**
 * Cart cleanup script
 * This script should be run periodically (e.g., daily via cron job) to clean up expired carts
 */
async function runCartCleanup() {
  console.log('Starting cart cleanup process...');
  
  try {
    // Connect to MongoDB
    await DatabaseConfig.connectMongoDB();
    console.log('Connected to MongoDB');

    // Perform cart cleanup
    await CartService.performScheduledCleanup();
    
    console.log('Cart cleanup completed successfully');
  } catch (error) {
    console.error('Cart cleanup failed:', error);
    process.exit(1);
  } finally {
    // Close database connections
    await DatabaseConfig.closeConnections();
    console.log('Database connections closed');
    process.exit(0);
  }
}

// Run cleanup if this script is executed directly
if (require.main === module) {
  runCartCleanup();
}

export { runCartCleanup };