// ✅ /frontend-v2/src/components/AutopilotStatusIndicator.tsx

import React from 'react';

type AutopilotStatus = 'idle' | 'running' | 'success' | 'error';

interface AutopilotStatusIndicatorProps {
  status: AutopilotStatus;
  volume?: number;
  className?: string;
}

const AutopilotStatusIndicator: React.FC<AutopilotStatusIndicatorProps> = ({ 
  status, 
  volume = 3, 
  className = '' 
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'running':
        return {
          color: 'bg-blue-500',
          text: 'Running...',
          pulse: true
        };
      case 'success':
        return {
          color: 'bg-green-500',
          text: 'Posted!',
          pulse: false
        };
      case 'error':
        return {
          color: 'bg-red-500',
          text: 'Failed',
          pulse: false
        };
      default:
        return {
          color: 'bg-gray-400',
          text: 'Active',
          pulse: false
        };
    }
  };

  const config = getStatusConfig();
  
  // Dynamic sizing based on volume (1-5 scale)
  const volumeScale = Math.min(Math.max(volume, 1), 5);
  const indicatorSize = 8 + (volumeScale * 2); // 10px to 18px
  const textSize = volume >= 3 ? 'text-sm font-semibold' : 'text-xs';

  return (
    <div className={`auto-post-status flex items-center space-x-2 ${className}`}>
      <div 
        className={`
          status-indicator rounded-full transition-all duration-300
          ${config.color}
          ${config.pulse ? 'animate-pulse' : ''}
          ${status === 'error' ? 'inactive opacity-50' : ''}
        `}
        style={{ 
          width: `${indicatorSize}px`, 
          height: `${indicatorSize}px` 
        }}
      />
      <span className={`${textSize} text-gray-700 dark:text-gray-300`}>
        {config.text}
      </span>
      {volume > 1 && (
        <span className="text-xs text-gray-500">
          ({volume}/day)
        </span>
      )}
    </div>
  );
};

export default AutopilotStatusIndicator;