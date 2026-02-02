import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { DatabaseProvider, Member } from './types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

interface JsonData {
  members: Member[];
  nextId: number;
}

export class JsonDatabase implements DatabaseProvider {
  private dataFile: string;
  private data: JsonData;

  constructor(dataFile?: string) {
    // Default to backend/data/members.json
    this.dataFile = dataFile || join(__dirname, '..', 'data', 'members.json');
    this.data = { members: [], nextId: 1 };
  }

  async init(): Promise<void> {
    // Create data directory if it doesn't exist
    const dir = dirname(this.dataFile);
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }

    // Load existing data or create new file
    if (existsSync(this.dataFile)) {
      const content = await readFile(this.dataFile, 'utf-8');
      this.data = JSON.parse(content);
    } else {
      await this.save();
    }
  }

  private async save(): Promise<void> {
    await writeFile(this.dataFile, JSON.stringify(this.data, null, 2), 'utf-8');
  }

  async addMember(address: string, txHash?: string): Promise<boolean> {
    const normalizedAddress = address.toLowerCase();

    // Check if member already exists
    const exists = this.data.members.some(
      (m) => m.address === normalizedAddress
    );

    if (exists) {
      return false;
    }

    // Add new member
    const member: Member = {
      id: this.data.nextId++,
      address: normalizedAddress,
      tx_hash: txHash || null,
      joined_at: new Date().toISOString(),
    };

    this.data.members.push(member);
    await this.save();
    return true;
  }

  async isMember(address: string): Promise<boolean> {
    const normalizedAddress = address.toLowerCase();
    return this.data.members.some((m) => m.address === normalizedAddress);
  }

  async getMember(address: string): Promise<Member | null> {
    const normalizedAddress = address.toLowerCase();
    return this.data.members.find((m) => m.address === normalizedAddress) || null;
  }

  async getAllMembers(page = 0, pageSize = 100): Promise<Member[]> {
    // Sort by joined_at DESC
    const sorted = [...this.data.members].sort((a, b) => {
      return new Date(b.joined_at).getTime() - new Date(a.joined_at).getTime();
    });

    const offset = page * pageSize;
    return sorted.slice(offset, offset + pageSize);
  }

  async getMemberCount(): Promise<number> {
    return this.data.members.length;
  }

  async updateMemberTxHash(address: string, txHash: string): Promise<boolean> {
    const normalizedAddress = address.toLowerCase();
    const member = this.data.members.find((m) => m.address === normalizedAddress);

    if (!member) {
      return false;
    }

    member.tx_hash = txHash;
    await this.save();
    return true;
  }
}
