'use client';

import { Download, Upload } from 'lucide-react';
import { useRef } from 'react';
import { dbOverwriteCloudWithLocal } from '@/lib/db';
import { showToast, queueToastAfterReload } from '@/lib/toast';

export function DataSync() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    try {
      const data = localStorage.getItem('finclear_data');
      if (!data) {
        showToast('No data found to export.');
        return;
      }
      
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `finclear_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
      showToast('Failed to export data.');
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const result = event.target?.result as string;
        
        // Very basic validation - just check if it parses as JSON and has 'state'
        const parsed = JSON.parse(result);
        if (!parsed.state) {
          throw new Error('Invalid backup format');
        }

        localStorage.setItem('finclear_data', result);
        
        // Push the imported data to cloud if authenticated
        dbOverwriteCloudWithLocal(parsed.state)
          .then(() => {
            queueToastAfterReload('Backup imported and synced to cloud.', 'success');
            window.location.reload();
          })
          .catch((err) => {
            console.error('Cloud upload failed:', err);
            queueToastAfterReload('Backup imported on this device, but cloud sync failed — check the console and try again later.', 'error');
            window.location.reload();
          });
      } catch (err) {
        console.error('Import failed:', err);
        showToast('Invalid backup file — upload a FinClear backup (.json).');
      }
    };
    reader.onerror = () => {
      showToast('Could not read the file.');
    };
    
    reader.readAsText(file);
    
    // Clear input so the same file can be selected again if needed
    e.target.value = '';
  };

  return (
    <div className="flex items-center space-x-1 sm:space-x-2">
      <button
        onClick={handleExport}
        className="flex h-11 w-11 items-center justify-center text-gray-500 hover:text-accent rounded-sm hover:bg-accent/10 active:bg-accent/10 transition-colors"
        title="Download Backup"
        aria-label="Download Backup"
      >
        <Download className="w-5 h-5 sm:w-6 sm:h-6" />
      </button>
      
      <button
        onClick={() => fileInputRef.current?.click()}
        className="flex h-11 w-11 items-center justify-center text-gray-500 hover:text-accent rounded-sm hover:bg-accent/10 active:bg-accent/10 transition-colors"
        title="Upload Backup"
        aria-label="Upload Backup"
      >
        <Upload className="w-5 h-5 sm:w-6 sm:h-6" />
      </button>
      
      <input
        type="file"
        accept=".json"
        ref={fileInputRef}
        onChange={handleImport}
        className="hidden"
      />
    </div>
  );
}
