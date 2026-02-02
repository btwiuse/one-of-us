# One of Us - Next.js Frontend with SQLite Backend

This is the Next.js frontend application with integrated API routes backed by SQLite database.

## Architecture

- **Framework**: Next.js 15 (App Router)
- **Database**: SQLite with better-sqlite3
- **API Routes**: Next.js API routes at `/api/*`
- **Frontend**: React 19 with existing components

## Getting Started

### Prerequisites

- Node.js 18+ (recommended: Node.js 20+)
- npm or yarn

### Installation

```bash
cd frontend
npm install
```

### Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Required environment variables:

```env
NEXT_PUBLIC_PROGRAM_ID=0x91e4e67e86f3dd87eff628b7e61e91b3d369d2db
NEXT_PUBLIC_ROUTER_ADDRESS=0xBC888a8B050B9B76a985d91c815d2c4f2131a58A
NEXT_PUBLIC_WVARA_ADDRESS=0x7e01A323534AA027Ac3aD17e7DBf8C90d4FFEf8e
NEXT_PUBLIC_VARA_ETH_WS=ws://vara-eth-validator-1.gear-tech.io:9944
NEXT_PUBLIC_VARA_ETH_HTTP=https://hoodi-reth-rpc.gear-tech.io
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000/one-of-us](http://localhost:3000/one-of-us) in your browser.

### Production Build

```bash
npm run build
npm start
```

## API Endpoints

All API endpoints are available under the `/one-of-us/api` base path:

### Health Check
- **GET** `/one-of-us/api/health`
- Returns server status and timestamp

### Members Count
- **GET** `/one-of-us/api/members/count`
- Returns total count of registered members

### Get Member
- **GET** `/one-of-us/api/members/:address`
- Returns member information by address

### List Members
- **GET** `/one-of-us/api/members?page=0&pageSize=100`
- Returns paginated list of members
- Query parameters:
  - `page`: Page number (default: 0)
  - `pageSize`: Results per page (default: 100, max: 500)

### Register Member
- **POST** `/one-of-us/api/members`
- Body: `{ "address": "0x...", "txHash": "0x..." }`
- Registers a new member

### Update Transaction Hash
- **PUT** `/one-of-us/api/members/:address/txHash`
- Body: `{ "txHash": "0x..." }`
- Updates the transaction hash for a member

## Database

The application uses SQLite with the following features:

- **Location**: `./data/members.db`
- **Mode**: WAL (Write-Ahead Logging) for better concurrency
- **Schema**:
  ```sql
  CREATE TABLE members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    address TEXT UNIQUE NOT NULL,
    tx_hash TEXT,
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  ```

### Database Configuration

Set the database path via environment variable (optional):

```env
DATABASE_PATH=/path/to/custom/location/members.db
```

## Migration from Express Backend

This application replaces the previous Express.js backend with Next.js API routes:

### Changes

1. **Database**: PostgreSQL → SQLite
2. **Server**: Express.js → Next.js API Routes
3. **Build Tool**: Vite → Next.js
4. **Environment Variables**: `VITE_*` → `NEXT_PUBLIC_*`

### Benefits

- Single application (no separate backend server)
- Simplified deployment
- No database server required (SQLite)
- Improved development experience with Next.js
- Built-in API route handling

## Project Structure

```
frontend/
├── app/
│   ├── api/              # API routes
│   │   ├── health/
│   │   └── members/
│   ├── layout.tsx        # Root layout
│   ├── page.tsx          # Home page
│   └── globals.css       # Global styles
├── src/
│   ├── components/       # React components
│   ├── hooks/           # Custom React hooks
│   ├── config/          # Configuration
│   ├── utils/           # Utilities
│   └── App.tsx          # Main app component
├── lib/
│   └── db.ts            # SQLite database functions
├── public/              # Static assets
├── next.config.ts       # Next.js configuration
├── tsconfig.json        # TypeScript configuration
└── package.json         # Dependencies

```

## Technologies

- **Next.js 15**: React framework with App Router
- **React 19**: UI library
- **TypeScript**: Type-safe JavaScript
- **better-sqlite3**: SQLite database driver
- **Viem**: Ethereum library
- **@vara-eth/api**: Vara.eth SDK
- **sails-js**: Sails IDL parser

## Development Tips

- The database is automatically created on first run
- Database files are stored in `./data/` (excluded from git)
- API routes run on the server side and have access to Node.js APIs
- Client components are marked with `'use client'` directive
- Images use Next.js Image component for optimization

## Troubleshooting

### Database locked error
- SQLite uses WAL mode which should handle concurrent access
- If issues persist, check file permissions on the `data/` directory

### Build errors with @next/swc
- Warning about mismatched versions can be safely ignored
- Run `npm install` to ensure all dependencies are up to date

### Missing environment variables
- Ensure `.env.local` exists and contains all required variables
- Environment variables must be prefixed with `NEXT_PUBLIC_` for client-side access
