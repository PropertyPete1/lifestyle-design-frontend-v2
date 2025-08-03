// ✅ /frontend-v2/src/components/AutopilotButton.tsx

import React, { useState } from 'react';

type AutopilotStatus = 'idle' | 'running' | 'success' | 'error';

interface AutopilotButtonProps {
  onStatusChange?: (status: AutopilotStatus) => void;
  showNotification?: (message: string, type?: 'success' | 'error') => void;
}

const AutopilotButton: React.FC<AutopilotButtonProps> = ({ 
  onStatusChange,
  showNotification 
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [status, setStatus] = useState<AutopilotStatus>('idle');

  const handleAutopilotClick = async () => {
    if (isRunning) return;
    
    // Update status to running
    setIsRunning(true);
    setStatus('running');
    onStatusChange?.('running');
    showNotification?.('🚀 Running AutoPilot now...');
    
    try {
      const res = await fetch('http://localhost:3002/api/autopilot/run', {
        method: 'POST'
      });

      const data = await res.json();
      if (data.success) {
        setStatus('success');
        onStatusChange?.('success');
        showNotification?.('✅ AutoPilot completed successfully', 'success');
        
        // Auto-reset to idle after 4 seconds
        setTimeout(() => {
          setStatus('idle');
          onStatusChange?.('idle');
        }, 4000);
      } else {
        setStatus('error');
        onStatusChange?.('error');
        showNotification?.(`❌ AutoPilot failed: ${data.error || data.reason || data.details || 'Unknown error'}`, 'error');
        
        // Auto-reset to idle after 4 seconds
        setTimeout(() => {
          setStatus('idle');
          onStatusChange?.('idle');
        }, 4000);
      }
    } catch (err) {
      setStatus('error');
      onStatusChange?.('error');
      showNotification?.('❌ Error running AutoPilot', 'error');
      
      // Auto-reset to idle after 4 seconds
      setTimeout(() => {
        setStatus('idle');
        onStatusChange?.('idle');
      }, 4000);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <button
      onClick={handleAutopilotClick}
      disabled={isRunning}
      className={`
        px-6 py-3 rounded-lg font-semibold text-white transition-all duration-200
        ${isRunning 
          ? 'bg-gray-400 cursor-not-allowed' 
          : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
        }
      `}
    >
      {isRunning ? (
        <span className="flex items-center">
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {status === 'running' ? 'Running...' : 
           status === 'success' ? 'Posted!' :
           status === 'error' ? 'Failed' : 'Running Autopilot...'}
        </span>
      ) : (
        <span className="flex items-center">
          <div className={`status-indicator mr-2 w-2 h-2 rounded-full ${
            status === 'success' ? 'bg-green-400' :
            status === 'error' ? 'bg-red-400' :
            'bg-blue-400'
          }`}></div>
          🚀 Activate AutoPilot
        </span>
      )}
    </button>
  );
};

export default AutopilotButton;