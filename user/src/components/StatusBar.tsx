import { useSync } from '../context/SyncContext';

export const StatusBar = () => {
  const { isOnline, isSyncing, pendingOpsCount, triggerSync } = useSync();

  return (
    <div className={`flex items-center justify-between p-4 rounded-lg border shadow-sm transition-colors duration-300
      ${isOnline ? 'bg-teal-50 border-teal-200 text-teal-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
      
      <div className="flex items-center space-x-2">
        <span className={`h-3 w-3 rounded-full ${isOnline ? 'bg-teal-500' : 'bg-rose-500'}`} />
        <span className="font-semibold">{isOnline ? 'Online' : 'Offline'}</span>
        {isSyncing && <span className="text-xs ml-2 animate-pulse">(Syncing...)</span>}
      </div>
      
      <div className="flex items-center space-x-4">
        <span className="text-sm font-medium">Pending Ops: <span className="font-bold">{pendingOpsCount}</span></span>
        {isOnline && pendingOpsCount > 0 && (
          <button onClick={triggerSync} disabled={isSyncing} className="text-xs bg-white border border-current px-3 py-1 rounded hover:bg-opacity-50 transition">
            Force Sync
          </button>
        )}
      </div>
    </div>
  );
};