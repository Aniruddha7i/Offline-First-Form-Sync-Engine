import React, { createContext, useContext, useState, useEffect, type ReactNode, useCallback } from 'react';
import { db } from '../db';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

interface SyncContextType {
  isOnline: boolean;
  isSyncing: boolean;
  pendingOpsCount: number;
  triggerSync: () => Promise<void>;
  addItem: (t: string, d: string) => Promise<void>;
  updateItem: (id: string, data: any) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
}

const SyncContext = createContext<SyncContextType | null>(null);

export const SyncProvider = ({ children }: { children: ReactNode }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingOpsCount, setPendingOpsCount] = useState(0);

  const updatePendingCount = async () => setPendingOpsCount(await db.mutationQueue.count());

  useEffect(() => {
    const handleOnline = () => { setIsOnline(true); triggerSync(); };
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    updatePendingCount();
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const triggerSync = useCallback(async () => {
    if (!navigator.onLine || isSyncing) return;
    const pendingOps = await db.mutationQueue.toArray();
    if (pendingOps.length === 0) return;

    setIsSyncing(true);
    try {
      const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/sync`, {
        clientId: localStorage.getItem('clientId') || uuidv4(),
        operations: pendingOps
      });

      await db.mutationQueue.bulkDelete(data.acknowledgedOps);
      await db.transaction('rw', db.items, async () => {
        // Simple strategy: Overwrite local with server state
        for (const item of data.serverState) {
          await db.items.put({ ...item, synced: true });
        }
      });
    } catch (err) {
      console.error("Sync failed", err);
    } finally {
      setIsSyncing(false);
      updatePendingCount();
    }
  }, [isSyncing]);

  const addItem = async (title: string, description: string) => {
    const id = uuidv4();
    const now = new Date().toISOString();
    await db.items.add({ id, title, description, updatedAt: now, synced: false });
    await db.mutationQueue.add({ opId: uuidv4(), entityId: id, type: 'CREATE', payload: { title, description }, timestamp: now });
    updatePendingCount();
    triggerSync();
  };

  const updateItem = async (id: string, updates: any) => {
    const now = new Date().toISOString();
    await db.items.update(id, { ...updates, updatedAt: now, synced: false });
    await db.mutationQueue.add({ opId: uuidv4(), entityId: id, type: 'UPDATE', payload: updates, timestamp: now });
    updatePendingCount();
    triggerSync();
  };

  const deleteItem = async (id: string) => {
    await db.items.delete(id);
    await db.mutationQueue.add({ opId: uuidv4(), entityId: id, type: 'DELETE', timestamp: new Date().toISOString() });
    updatePendingCount();
    triggerSync();
  };

  return (
    <SyncContext.Provider value={{ isOnline, isSyncing, pendingOpsCount, triggerSync, addItem, updateItem, deleteItem }}>
      {children}
    </SyncContext.Provider>
  );
};

export const useSync = () => {
  const context = useContext(SyncContext);
  if (!context) throw new Error("useSync must be used within SyncProvider");
  return context;
};