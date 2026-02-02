# One of Us - Backend API

Backend service for tracking members who joined the "One of Us" program on Vara.eth.

## Setup

```bash
npm install
cp .env.example .env
# Edit .env with your values
npm run dev
```

## Environment Variables

| Variable       | Description                                      | Required |
| -------------- | ------------------------------------------------ | -------- |
| `PROGRAM_ID`   | Vara program address                             | Yes      |
| `DB_TYPE`      | Database type: `postgres` or `redis`             | No       |
| `DATABASE_URL` | PostgreSQL connection string                     | If postgres |
| `REDIS_URL`    | Redis connection string (default: redis://localhost:6379) | If redis |
| `BACKEND_PORT` | Server port (default: 3001)                      | No       |

### Database Options

The backend supports two database providers for local development:

#### PostgreSQL (Default)

```bash
DB_TYPE=postgres
DATABASE_URL=postgres://user:password@localhost:5432/one_of_us
```

#### Redis

```bash
DB_TYPE=redis
REDIS_URL=redis://localhost:6379
```

To quickly start Redis locally using Docker:

```bash
docker run -d -p 6379:6379 redis:7-alpine
```

## API Endpoints

### Health Check

**GET** `/health`

Returns server health status.

**Response:**

```json
{
  "status": "ok",
  "timestamp": "2026-01-12T12:00:00.000Z"
}
```

---

### Get Member Count

**GET** `/api/members/count`

Returns the total number of registered members.

**Response:**

```json
{
  "count": 42
}
```

---

### Check Member by Address

**GET** `/api/members/:address`

Check if an address is a registered member and get their details.

**Parameters:**

- `address` (path) - Ethereum address to check

**Response (member exists):**

```json
{
  "isMember": true,
  "member": {
    "id": 1,
    "address": "0x1234...",
    "tx_hash": "0xabcd...",
    "joined_at": "2026-01-12T12:00:00.000Z"
  }
}
```

**Response (member not found):**

```json
{
  "isMember": false
}
```

**Notes:**

- `tx_hash` is `null` for pending (not yet finalized) members
- Address comparison is case-insensitive

---

### Get All Members

**GET** `/api/members`

Get paginated list of all members.

**Query Parameters:**

- `page` (optional, default: 0) - Page number
- `pageSize` (optional, default: 100, max: 500) - Items per page

**Response:**

```json
{
  "members": [
    {
      "id": 1,
      "address": "0x1234...",
      "tx_hash": "0xabcd...",
      "joined_at": "2026-01-12T12:00:00.000Z"
    }
  ],
  "page": 0,
  "pageSize": 100,
  "total": 42,
  "hasMore": false
}
```

---

### Register Member

**POST** `/api/members`

Register a new member. Used when a transaction is accepted but not yet finalized.

**Body:**

```json
{
  "address": "0x1234...",
  "txHash": ""
}
```

**Parameters:**

- `address` (required) - Ethereum address
- `txHash` (optional) - Transaction hash (empty string or omit for pending)

**Response (success):**

```json
{
  "success": true,
  "message": "Member registered",
  "count": 43
}
```

**Response (already exists):**

```json
{
  "success": false,
  "message": "Member already exists",
  "count": 42
}
```

---

### Update Member Transaction Hash

**PUT** `/api/members/:address/txHash`

Update the transaction hash for a member after their transaction is finalized.

**Parameters:**

- `address` (path) - Ethereum address

**Body:**

```json
{
  "txHash": "0xabcd..."
}
```

**Response (success):**

```json
{
  "success": true
}
```

**Response (not found):**

```json
{
  "error": "Member not found"
}
```

---

## Database Schema

### PostgreSQL

PostgreSQL database with a single `members` table:

```sql
CREATE TABLE members (
  id SERIAL PRIMARY KEY,
  address TEXT UNIQUE NOT NULL,
  tx_hash TEXT,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Redis

Redis uses the following key structure:

- `members:{address}` - Hash containing member data (id, address, tx_hash, joined_at)
- `members:list` - Sorted set for ordering by joined_at timestamp (score = timestamp, value = address)
- `members:counter` - Counter for generating sequential member IDs

## Flow

1. User clicks "Join" → Frontend gets "Accept" from Vara validator
2. Frontend calls `POST /api/members` with address (no txHash yet) - **pending state**
3. Transaction is processed and finalized on Ethereum
4. Frontend receives StateChanged event with transaction hash
5. Frontend calls `PUT /api/members/:address/txHash` to update the hash - **finalized state**
