export interface Member {
  id: number;
  address: string;
  tx_hash: string | null;
  joined_at: string;
}

export interface Database {
  initDb(): Promise<void>;
  addMember(address: string, txHash?: string): Promise<boolean>;
  isMember(address: string): Promise<boolean>;
  getMember(address: string): Promise<Member | null>;
  getAllMembers(page?: number, pageSize?: number): Promise<Member[]>;
  getMemberCount(): Promise<number>;
  updateMemberTxHash(address: string, txHash: string): Promise<boolean>;
}
