import React, { useState, useEffect } from 'react';
import { useSync } from '../context/SyncContext';

interface Props {
  editItem?: { id: string, title: string, description: string } | null;
  onClearEdit: () => void;
}

export const EntryForm = ({ editItem, onClearEdit }: Props) => {
  const { addItem, updateItem } = useSync();
  const [formData, setFormData] = useState({ title: '', description: '' });

  useEffect(() => {
    if (editItem) setFormData({ title: editItem.title, description: editItem.description });
  }, [editItem]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return;
    if (editItem) {
      updateItem(editItem.id, formData);
      onClearEdit();
    } else {
      addItem(formData.title, formData.description);
    }
    setFormData({ title: '', description: '' });
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6 border border-gray-200">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">{editItem ? 'Edit Entry' : 'New Entry'}</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input 
          type="text" value={formData.title} 
          onChange={e => setFormData({...formData, title: e.target.value})}
          className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Title" 
        />
        <textarea 
          value={formData.description} 
          onChange={e => setFormData({...formData, description: e.target.value})}
          className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Description" rows={3} 
        />
        <div className="flex space-x-3">
          <button type="submit" className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition">
            {editItem ? 'Update' : 'Create'}
          </button>
          {editItem && (
            <button type="button" onClick={() => { onClearEdit(); setFormData({title:'', description:''}); }} className="bg-gray-200 px-4 py-2 rounded-md">Cancel</button>
          )}
        </div>
      </form>
    </div>
  );
};