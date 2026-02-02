import Database from 'better-sqlite3';
import { join } from 'path';
import { mkdirSync, existsSync } from 'fs';

let db: Database.Database | null = null;

function getDb(): Database.Database {
  if (!db) {
    const dbPath = process.env.DATABASE_PATH || join(process.cwd(), 'data', 'members.db');
    
    // Ensure data directory exists
    const dbDir = join(process.cwd(), 'data');
    if (!existsSync(dbDir)) {
      mkdirSync(dbDir, { recursive: true });
    }
    
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    
    // Initialize tables
    db.exec(`
      CREATE TABLE IF NOT EXISTS members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        address TEXT UNIQUE NOT NULL,
        tx_hash TEXT,
        joined_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_address ON members(address);
      CREATE INDEX IF NOT EXISTS idx_joined_at ON members(joined_at);
    `);
  }
  
  return db;
}

export interface Member {
  id: number;
  address: string;
  tx_hash: string | null;
  joined_at: string;
}

export function addMember(address: string, txHash?: string): boolean {
  const db = getDb();
  const normalizedAddress = address.toLowerCase();
  
  try {
    const stmt = db.prepare(
      'INSERT INTO members (address, tx_hash) VALUES (?, ?) ON CONFLICT (address) DO NOTHING'
    );
    const result = stmt.run(normalizedAddress, txHash || null);
    return result.changes > 0;
  } catch {
    return false;
  }
}

export function getMember(address: string): Member | null {
  const db = getDb();
  const normalizedAddress = address.toLowerCase();
  
  const stmt = db.prepare('SELECT * FROM members WHERE address = ?');
  const member = stmt.get(normalizedAddress) as Member | undefined;
  return member || null;
}

export function getAllMembers(page = 0, pageSize = 100): Member[] {
  const db = getDb();
  const offset = page * pageSize;
  
  const stmt = db.prepare(
    'SELECT * FROM members ORDER BY joined_at DESC LIMIT ? OFFSET ?'
  );
  return stmt.all(pageSize, offset) as Member[];
}

export function getMemberCount(): number {
  const db = getDb();
  const stmt = db.prepare('SELECT COUNT(*) as count FROM members');
  const result = stmt.get() as { count: number };
  return result.count;
}

export function updateMemberTxHash(address: string, txHash: string): boolean {
  const db = getDb();
  const normalizedAddress = address.toLowerCase();
  
  try {
    const stmt = db.prepare('UPDATE members SET tx_hash = ? WHERE address = ?');
    const result = stmt.run(txHash, normalizedAddress);
    return result.changes > 0;
  } catch {
    return false;
  }
}
