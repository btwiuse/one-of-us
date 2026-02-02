import { CONFIG } from './config.js';
import { PostgresDatabase } from './db-postgres.js';
import { RedisDatabase } from './db-redis.js';
import type { Database } from './db-interface.js';

// Select database implementation based on configuration
const db: Database = CONFIG.DB_TYPE === 'redis' ? RedisDatabase : PostgresDatabase;

// Re-export all database functions
export const initDb = () => db.initDb();
export const addMember = (address: string, txHash?: string) => db.addMember(address, txHash);
export const isMember = (address: string) => db.isMember(address);
export const getMember = (address: string) => db.getMember(address);
export const getAllMembers = (page?: number, pageSize?: number) => db.getAllMembers(page, pageSize);
export const getMemberCount = () => db.getMemberCount();
export const updateMemberTxHash = (address: string, txHash: string) => db.updateMemberTxHash(address, txHash);

// Export types
export type { Member } from './db-interface.js';

