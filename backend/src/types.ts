// Database interface that all database providers must implement
export interface Member {
  id: number;
  address: string;
  tx_hash: string | null;
  joined_at: string;
}

export interface DatabaseProvider {
  init(): Promise<void>;
  addMember(address: string, txHash?: string): Promise<boolean>;
  isMember(address: string): Promise<boolean>;
  getMember(address: string): Promise<Member | null>;
  getAllMembers(page?: number, pageSize?: number): Promise<Member[]>;
  getMemberCount(): Promise<number>;
  updateMemberTxHash(address: string, txHash: string): Promise<boolean>;
}
