import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

export const dbPool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'sms_management_system',
  waitForConnections: true,
  connectionLimit: 20,
  queueLimit: 0,
  charset: 'utf8mb4',
});

export const testDatabaseConnection = async (): Promise<{ connected: boolean; message: string }> => {
  try {
    const [result] = await dbPool.query('SELECT 1 AS ok');
    const ok = Array.isArray(result) ? result.length > 0 : Boolean(result);

    return {
      connected: ok,
      message: ok ? 'Database connection successful.' : 'Database did not return a valid response.',
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown database error';
    return {
      connected: false,
      message,
    };
  }
};

export default dbPool;
