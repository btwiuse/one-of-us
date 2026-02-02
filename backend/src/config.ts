import dotenv from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env') });

const required = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

const optional = (key: string, defaultValue: string = ''): string => {
  return process.env[key] || defaultValue;
};

// Determine database type from environment
const DB_TYPE = (process.env.DB_TYPE || 'postgres').toLowerCase();

export const CONFIG = {
  PORT: parseInt(process.env.BACKEND_PORT || '3001'),
  PROGRAM_ID: required('PROGRAM_ID') as `0x${string}`,
  DB_TYPE: DB_TYPE as 'postgres' | 'redis',
  DATABASE_URL: DB_TYPE === 'postgres' ? required('DATABASE_URL') : optional('DATABASE_URL'),
  REDIS_URL: DB_TYPE === 'redis' ? required('REDIS_URL') : optional('REDIS_URL', 'redis://localhost:6379'),
} as const;
