'use client';

import { Download, Upload } from 'lucide-react';
import { useRef } from 'react';

export function DataSync() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    try {
      const data = localStorage.getItem('finclear_data');
      if (!data) {
        alert('No data found to export!');
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
      alert('Failed to export data.');
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
        alert('Data imported successfully! The dashboard will now reload.');
        window.location.reload();
      } catch (err) {
        console.error('Import failed:', err);
        alert('Invalid backup file! Please ensure you uploaded a valid FinClear backup file.');
      }
    };
    reader.onerror = () => {
      alert('Error reading the file.');
    };
    
    reader.readAsText(file);
    
    // Clear input so the same file can be selected again if needed
    e.target.value = '';
  };

  return (
    <div className="flex items-center space-x-1 sm:space-x-2">
      <button
        onClick={handleExport}
        className="p-2 text-gray-500 hover:text-accent rounded-md hover:bg-accent/10 transition-colors"
        title="Download Backup"
      >
        <Download className="w-5 h-5 sm:w-6 sm:h-6" />
      </button>
      
      <button
        onClick={() => fileInputRef.current?.click()}
        className="p-2 text-gray-500 hover:text-accent rounded-md hover:bg-accent/10 transition-colors"
        title="Upload Backup"
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
