import { createClient } from 'redis';
import { CONFIG } from './config.js';
import type { Database, Member } from './db-interface.js';

const client = createClient({
  url: CONFIG.REDIS_URL,
});

client.on('error', (err) => console.error('Redis Client Error', err));

// Keys structure:
// members:{address} -> JSON string of Member object
// members:list -> sorted set (score = joined_at timestamp, value = address)
// members:counter -> counter for generating IDs

export const RedisDatabase: Database = {
  async initDb() {
    if (!client.isOpen) {
      await client.connect();
    }
    // Ensure counter exists
    const exists = await client.exists('members:counter');
    if (!exists) {
      await client.set('members:counter', '0');
    }
  },

  async addMember(address: string, txHash?: string): Promise<boolean> {
    const normalizedAddress = address.toLowerCase();
    const memberKey = `members:${normalizedAddress}`;

    // Check if member already exists
    const exists = await client.exists(memberKey);
    if (exists) {
      return false;
    }

    // Generate new ID
    const id = await client.incr('members:counter');
    const joined_at = new Date().toISOString();

    const member: Member = {
      id,
      address: normalizedAddress,
      tx_hash: txHash || null,
      joined_at,
    };

    // Store member data
    await client.set(memberKey, JSON.stringify(member));

    // Add to sorted set for ordering by joined_at
    const timestamp = new Date(joined_at).getTime();
    await client.zAdd('members:list', {
      score: timestamp,
      value: normalizedAddress,
    });

    return true;
  },

  async isMember(address: string): Promise<boolean> {
    const normalizedAddress = address.toLowerCase();
    const memberKey = `members:${normalizedAddress}`;
    return (await client.exists(memberKey)) > 0;
  },

  async getMember(address: string): Promise<Member | null> {
    const normalizedAddress = address.toLowerCase();
    const memberKey = `members:${normalizedAddress}`;

    const data = await client.get(memberKey);
    if (!data) {
      return null;
    }

    return JSON.parse(data) as Member;
  },

  async getAllMembers(page = 0, pageSize = 100): Promise<Member[]> {
    // Get addresses from sorted set in reverse order (newest first)
    const start = page * pageSize;
    const end = start + pageSize - 1;
    const addresses = await client.zRange('members:list', start, end, {
      REV: true,
    });

    // Fetch member data for each address
    const members: Member[] = [];
    for (const address of addresses) {
      const memberKey = `members:${address}`;
      const data = await client.get(memberKey);
      if (data) {
        members.push(JSON.parse(data) as Member);
      }
    }

    return members;
  },

  async getMemberCount(): Promise<number> {
    return await client.zCard('members:list');
  },

  async updateMemberTxHash(
    address: string,
    txHash: string
  ): Promise<boolean> {
    const normalizedAddress = address.toLowerCase();
    const memberKey = `members:${normalizedAddress}`;

    const data = await client.get(memberKey);
    if (!data) {
      return false;
    }

    const member = JSON.parse(data) as Member;
    member.tx_hash = txHash;

    await client.set(memberKey, JSON.stringify(member));
    return true;
  },
};

export default client;
