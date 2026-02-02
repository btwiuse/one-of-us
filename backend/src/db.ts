import pg from 'pg';
import Database from 'better-sqlite3';
import { CONFIG } from './config.js';

const { Pool } = pg;

// Database abstraction
interface DbAdapter {
  initDb(): Promise<void>;
  query(sql: string, params?: any[]): Promise<{ rows: any[]; rowCount?: number }>;
}

// PostgreSQL adapter
class PostgresAdapter implements DbAdapter {
  private pool: pg.Pool;

  constructor(connectionString: string) {
    this.pool = new Pool({ connectionString });
  }

  async initDb(): Promise<void> {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS members (
        id SERIAL PRIMARY KEY,
        address TEXT UNIQUE NOT NULL,
        tx_hash TEXT,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_address ON members(address);
      CREATE INDEX IF NOT EXISTS idx_joined_at ON members(joined_at);
    `);
  }

  async query(sql: string, params?: any[]): Promise<{ rows: any[]; rowCount?: number }> {
    const result = await this.pool.query(sql, params);
    return { rows: result.rows, rowCount: result.rowCount || 0 };
  }
}

// SQLite adapter
class SqliteAdapter implements DbAdapter {
  private db: Database.Database;

  constructor(filename: string) {
    this.db = new Database(filename);
  }

  async initDb(): Promise<void> {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        address TEXT UNIQUE NOT NULL,
        tx_hash TEXT,
        joined_at TEXT DEFAULT (datetime('now'))
      );
      
      CREATE INDEX IF NOT EXISTS idx_address ON members(address);
      CREATE INDEX IF NOT EXISTS idx_joined_at ON members(joined_at);
    `);
  }

  async query(sql: string, params: any[] = []): Promise<{ rows: any[]; rowCount?: number }> {
    // Convert PostgreSQL placeholder style ($1, $2) to SQLite style (?, ?)
    const sqliteSql = sql.replace(/\$(\d+)/g, '?');
    
    if (sql.trim().toUpperCase().startsWith('SELECT')) {
      const stmt = this.db.prepare(sqliteSql);
      const rows = stmt.all(...params);
      return { rows, rowCount: rows.length };
    } else if (sql.trim().toUpperCase().startsWith('INSERT') || 
               sql.trim().toUpperCase().startsWith('UPDATE')) {
      const stmt = this.db.prepare(sqliteSql);
      const info = stmt.run(...params);
      return { rows: [], rowCount: info.changes };
    } else {
      // For other queries (like CREATE TABLE)
      this.db.exec(sqliteSql);
      return { rows: [], rowCount: 0 };
    }
  }
}

// Initialize the appropriate adapter
const adapter: DbAdapter = CONFIG.DATABASE_TYPE === 'sqlite'
  ? new SqliteAdapter(CONFIG.DATABASE_URL)
  : new PostgresAdapter(CONFIG.DATABASE_URL);

export async function initDb() {
  await adapter.initDb();
}

export interface Member {
  id: number;
  address: string;
  tx_hash: string | null;
  joined_at: string;
}

export async function addMember(
  address: string,
  txHash?: string
): Promise<boolean> {
  const normalizedAddress = address.toLowerCase();

  try {
    const result = await adapter.query(
      `INSERT INTO members (address, tx_hash) VALUES ($1, $2) ON CONFLICT (address) DO NOTHING`,
      [normalizedAddress, txHash || null]
    );
    return (result.rowCount ?? 0) > 0;
  } catch {
    return false;
  }
}

export async function isMember(address: string): Promise<boolean> {
  const normalizedAddress = address.toLowerCase();
  const result = await adapter.query('SELECT 1 FROM members WHERE address = $1', [
    normalizedAddress,
  ]);
  return result.rows.length > 0;
}

export async function getMember(address: string): Promise<Member | null> {
  const normalizedAddress = address.toLowerCase();
  const result = await adapter.query('SELECT * FROM members WHERE address = $1', [
    normalizedAddress,
  ]);
  return result.rows[0] || null;
}

export async function getAllMembers(
  page = 0,
  pageSize = 100
): Promise<Member[]> {
  const offset = page * pageSize;
  const result = await adapter.query(
    'SELECT * FROM members ORDER BY joined_at DESC LIMIT $1 OFFSET $2',
    [pageSize, offset]
  );
  return result.rows;
}

export async function getMemberCount(): Promise<number> {
  const result = await adapter.query('SELECT COUNT(*) as count FROM members');
  return parseInt(result.rows[0].count);
}

export async function updateMemberTxHash(
  address: string,
  txHash: string
): Promise<boolean> {
  const normalizedAddress = address.toLowerCase();
  try {
    const result = await adapter.query(
      'UPDATE members SET tx_hash = $1 WHERE address = $2',
      [txHash, normalizedAddress]
    );
    return (result.rowCount ?? 0) > 0;
  } catch {
    return false;
  }
}

export default adapter;
