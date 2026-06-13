import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

export const connectDB = async () => {
  try {
    mongoose.set('strictQuery', true);
    const conn = await mongoose.connect(env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    logger.info(`MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    logger.error(`MongoDB connection error: ${err.message}`);
    process.exit(1);
  }
};

// Graceful shutdown
const shutdownDB = async (signal) => {
  logger.info(`${signal} received. Closing MongoDB connection...`);
  await mongoose.connection.close();
  logger.info('MongoDB connection closed.');
  process.exit(0);
};

process.on('SIGINT', () => shutdownDB('SIGINT'));
process.on('SIGTERM', () => shutdownDB('SIGTERM'));
