import express from 'express';
import cors from 'cors';
import { CONFIG } from './config.js';
import { createDatabaseProvider } from './db.js';

const app = express();
const db = createDatabaseProvider();

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/members/count', async (_req, res) => {
  try {
    const count = await db.getMemberCount();
    res.json({ count });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/members/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const member = await db.getMember(address);

    if (member) {
      res.json({ isMember: true, member });
    } else {
      res.json({ isMember: false });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/members', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 0;
    const pageSize = Math.min(
      parseInt(req.query.pageSize as string) || 100,
      500
    );

    const members = await db.getAllMembers(page, pageSize);
    const total = await db.getMemberCount();

    res.json({
      members,
      page,
      pageSize,
      total,
      hasMore: (page + 1) * pageSize < total,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/members', async (req, res) => {
  try {
    const { address, txHash } = req.body;

    if (!address) {
      return res.status(400).json({ error: 'Address is required' });
    }

    const added = await db.addMember(address, txHash);
    const count = await db.getMemberCount();

    if (added) {
      res.status(201).json({
        success: true,
        message: 'Member registered',
        count,
      });
    } else {
      res.json({
        success: false,
        message: 'Member already exists',
        count,
      });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/members/:address/txHash', async (req, res) => {
  try {
    const { address } = req.params;
    const { txHash } = req.body;

    if (!txHash) {
      return res.status(400).json({ error: 'txHash is required' });
    }

    const updated = await db.updateMemberTxHash(address, txHash);

    if (updated) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Member not found' });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

async function start() {
  await db.init();
  const count = await db.getMemberCount();
  
  app.listen(CONFIG.PORT, () => {
    console.log(`🚀 Backend running on http://localhost:${CONFIG.PORT}`);
    console.log(`   Database Provider: ${CONFIG.DATABASE_PROVIDER}`);
    console.log(`   Program ID: ${CONFIG.PROGRAM_ID}`);
    console.log(`   Members: ${count}`);
  });
}

start().catch(console.error);
