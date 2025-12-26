import Dexie, { type Table } from 'dexie';

export interface Item {
  id: string;
  title: string;
  description: string;
  updatedAt: string;
  version?: number;
  synced?: boolean;
}

export interface MutationOp {
  opId: string;
  entityId: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  payload?: any;
  timestamp: string;
}

class SiteMasterDB extends Dexie {
  items!: Table<Item>;
  mutationQueue!: Table<MutationOp>;

  constructor() {
    super('SiteMasterDB');
    this.version(1).stores({
      items: 'id, updatedAt', 
      mutationQueue: 'opId, timestamp'
    });
  }
}

export const db = new SiteMasterDB();