import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import apiRoutes from './routes/api.routes';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api', apiRoutes);

async function trySetupSchema() {
  const { Pool } = require('pg');
  const pool = new Pool({
    host: process.env.SUPABASE_DB_HOST || 'db.rlklejtsygrtpthhvbhs.supabase.co',
    user: 'postgres',
    password: process.env.SUPABASE_DB_PASS || 'GoTr4v3l!2026Secure',
    database: 'postgres',
    port: parseInt(process.env.SUPABASE_DB_PORT || '5432'),
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000,
  });
  try {
    const sqlPath = path.join(__dirname, '..', 'backend', 'supabase_schema.sql');
    if (fs.existsSync(sqlPath)) {
      const sql = fs.readFileSync(sqlPath, 'utf8');
      await pool.query(sql);
      console.log('Database schema setup complete');
    }
  } catch (err: any) {
    console.log('Auto schema setup skipped:', err.message);
  }
  try { await pool.end(); } catch {}
}

const RUN_SETUP = process.env.RUN_DB_SETUP === 'true';
if (RUN_SETUP) {
  trySetupSchema();
}

export default app;
