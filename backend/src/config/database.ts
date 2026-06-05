import mongoose from 'mongoose';
import { Pool } from 'pg';

export async function connectMongoDB(): Promise<void> {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/gotravel';
    // Use short timeout to fallback quickly if MongoDB is not running
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 2000
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.warn('MongoDB connection failed. Running in JSON Mock mode.');
  }
}

export const pgPool = new Pool({
  host: process.env.PG_HOST || 'localhost',
  user: process.env.PG_USER || 'postgres',
  password: process.env.PG_PASSWORD || 'postgres',
  database: process.env.PG_DATABASE || 'gotravel',
  port: parseInt(process.env.PG_PORT || '5432'),
  connectionTimeoutMillis: 2000
});

pgPool.on('connect', () => {
  console.log('PostgreSQL client connected to pool');
});

pgPool.on('error', (err) => {
  console.warn('PostgreSQL pool connection failed. Transactions will be logged to JSON mockup.');
});
