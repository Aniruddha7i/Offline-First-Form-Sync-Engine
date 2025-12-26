import React, { useState } from 'react';
import { SyncProvider } from './context/SyncContext';
import { StatusBar } from './components/StatusBar';
import { EntryForm } from './components/EntryForm';
import { EntryList } from './components/EntryList';

function AppContent() {
  const [editingItem, setEditingItem] = useState(null);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">SiteMaster Offline Forms</h1>
        </div>
        <StatusBar />
        <EntryForm editItem={editingItem} onClearEdit={() => setEditingItem(null)} />
        <EntryList onEdit={setEditingItem} />
      </div>
    </div>
  );
}

function App() {
  return (
    <SyncProvider>
      <AppContent />
    </SyncProvider>
  );
}

export default App;