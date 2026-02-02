# Migration from Express + PostgreSQL to Next.js + SQLite

This document describes the migration from the separate Express.js backend to Next.js API routes with SQLite.

## What Changed

### Architecture
- **Before**: Separate Express.js backend (port 3001) + React/Vite frontend + PostgreSQL database
- **After**: Single Next.js application with integrated API routes + SQLite database

### Technology Stack
| Component | Before | After |
|-----------|--------|-------|
| Frontend Framework | React + Vite | Next.js 15 (App Router) |
| Backend Framework | Express.js | Next.js API Routes |
| Database | PostgreSQL | SQLite (better-sqlite3) |
| Build Tool | Vite | Next.js |
| Dev Server Port | Frontend: 3000, Backend: 3001 | Single port: 3000 |

### API Endpoints
All endpoints remain the same, now accessible under `/one-of-us/api`:

- `GET /api/health` - Health check
- `GET /api/members/count` - Get total member count
- `GET /api/members/:address` - Get member by address
- `GET /api/members` - List all members (paginated)
- `POST /api/members` - Register new member
- `PUT /api/members/:address/txHash` - Update transaction hash

### Environment Variables
| Before | After |
|--------|-------|
| `VITE_PROGRAM_ID` | `NEXT_PUBLIC_PROGRAM_ID` |
| `VITE_ROUTER_ADDRESS` | `NEXT_PUBLIC_ROUTER_ADDRESS` |
| `VITE_WVARA_ADDRESS` | `NEXT_PUBLIC_WVARA_ADDRESS` |
| `VITE_VARA_ETH_WS` | `NEXT_PUBLIC_VARA_ETH_WS` |
| `VITE_VARA_ETH_HTTP` | `NEXT_PUBLIC_VARA_ETH_HTTP` |
| `VITE_API_URL` | _(removed - API is integrated)_ |
| `DATABASE_URL` (backend) | `DATABASE_PATH` _(optional)_ |

## Benefits of Migration

1. **Simplified Deployment**: Single application instead of two separate services
2. **No Database Server**: SQLite runs in-process, no separate database server needed
3. **Better DX**: Single dev server, unified codebase
4. **Reduced Complexity**: Fewer moving parts, easier to maintain
5. **Built-in Optimizations**: Next.js provides automatic code splitting, image optimization, etc.

## Migration Steps for Existing Deployments

If you have an existing deployment with data in PostgreSQL:

### 1. Export Data from PostgreSQL
```bash
cd backend
psql $DATABASE_URL -c "\COPY members TO '/tmp/members.csv' CSV HEADER"
```

### 2. Import Data to SQLite
```bash
cd ../frontend
node << 'IMPORT'
const Database = require('better-sqlite3');
const fs = require('fs');
const db = new Database('./data/members.db');

// Create table
db.exec(`
  CREATE TABLE IF NOT EXISTS members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    address TEXT UNIQUE NOT NULL,
    tx_hash TEXT,
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Import CSV
const csv = fs.readFileSync('/tmp/members.csv', 'utf-8');
const lines = csv.split('\n').slice(1); // Skip header

const stmt = db.prepare('INSERT INTO members (address, tx_hash, joined_at) VALUES (?, ?, ?)');
for (const line of lines) {
  if (!line.trim()) continue;
  const [id, address, txHash, joinedAt] = line.split(',');
  stmt.run(address, txHash || null, joinedAt);
}
IMPORT
```

### 3. Update Frontend Configuration
```bash
# Copy and update environment variables
cp .env.example .env.local
# Edit .env.local with your values
```

### 4. Test the Migration
```bash
npm install
npm run dev
# Visit http://localhost:3000/one-of-us
# Verify data is accessible
```

### 5. Deploy New Version
```bash
npm run build
npm start
```

## Rollback Plan

If you need to rollback:

1. Keep the old backend running during migration
2. The old backend and database are still in place (`backend/` directory)
3. Restore old environment variables
4. Restart the Express backend: `cd backend && npm start`
5. Rebuild frontend with Vite: `cd frontend && git checkout HEAD~3 && npm install && npm run dev`

## Database Schema Comparison

### PostgreSQL (Before)
```sql
CREATE TABLE members (
  id SERIAL PRIMARY KEY,
  address TEXT UNIQUE NOT NULL,
  tx_hash TEXT,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### SQLite (After)
```sql
CREATE TABLE members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  address TEXT UNIQUE NOT NULL,
  tx_hash TEXT,
  joined_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

The schemas are functionally equivalent. The main differences:
- `SERIAL` → `INTEGER PRIMARY KEY AUTOINCREMENT`
- `TIMESTAMP` → `DATETIME`

## Performance Considerations

### PostgreSQL vs SQLite
- **PostgreSQL**: Better for high-concurrency, multi-user scenarios
- **SQLite**: Better for single-server deployments, excellent for read-heavy workloads
- **SQLite with WAL mode**: Can handle moderate write concurrency

For this application (member registration), SQLite is sufficient and simpler.

## Troubleshooting

### Database Locked Errors
If you see "database is locked" errors:
- SQLite uses WAL mode by default (configured in code)
- Check file permissions on `data/` directory
- Ensure only one process is writing at a time

### Missing Data After Migration
- Verify CSV export completed successfully
- Check import script ran without errors
- Verify database file exists: `ls -la data/members.db`
- Query database: `sqlite3 data/members.db "SELECT COUNT(*) FROM members;"`

### Port Already in Use
- Next.js uses port 3000 by default
- Stop old frontend if still running
- Or change port: `PORT=3001 npm run dev`

## Support

For issues or questions about the migration, please open an issue on GitHub.
