import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { useSync } from '../context/SyncContext';

interface Props {
  onEdit: (item: any) => void;
}

export const EntryList = ({ onEdit }: Props) => {
  const { deleteItem } = useSync();
  const items = useLiveQuery(() => db.items.orderBy('updatedAt').reverse().toArray());

  return (
    <div className="space-y-4">
      {items?.map(item => (
        <div key={item.id} className={`p-5 rounded-lg border transition-all ${item.synced ? 'bg-white border-gray-200' : 'bg-amber-50 border-amber-200 border-l-4 border-l-amber-400'}`}>
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-bold text-gray-800">{item.title}</h3>
            <span className={`text-xs px-2 py-1 rounded-full ${item.synced ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
              {item.synced ? 'Synced' : 'Unsynced'}
            </span>
          </div>
          <p className="text-gray-600 mb-4">{item.description}</p>
          <div className="flex justify-end space-x-3 border-t pt-3">
            <button onClick={() => onEdit(item)} className="text-sm text-blue-600 hover:text-blue-800">Edit</button>
            <button onClick={() => deleteItem(item.id)} className="text-sm text-red-600 hover:text-red-800">Delete</button>
          </div>
        </div>
      ))}
      {items?.length === 0 && <p className="text-center text-gray-400">No entries yet.</p>}
    </div>
  );
};