import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './routes/api.routes';
import { connectMongoDB, pgPool } from './config/database';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api', apiRoutes);

async function startServer() {
  await connectMongoDB();
  
  try {
    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        booking_id VARCHAR(50) NOT NULL,
        user_id VARCHAR(50) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        status VARCHAR(20) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('PostgreSQL tables initialized');
  } catch (err) {
    console.error('Failed to initialize PostgreSQL table:', err);
  }

  app.listen(PORT, () => {
    console.log(`GOtravel API Server is running on port ${PORT}`);
  });
}

startServer();