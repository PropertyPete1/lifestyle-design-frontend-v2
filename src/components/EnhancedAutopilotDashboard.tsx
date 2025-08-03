// ✅ /frontend-v2/src/components/EnhancedAutopilotDashboard.tsx

import React, { useState, useCallback } from 'react';
import AutopilotButton from './AutopilotButton';
import NotificationSystem from './NotificationSystem';
import AutopilotStatusIndicator from './AutopilotStatusIndicator';
import DashboardChart from './DashboardChart';

type AutopilotStatus = 'idle' | 'running' | 'success' | 'error';

const EnhancedAutopilotDashboard: React.FC = () => {
  const [autopilotStatus, setAutopilotStatus] = useState<AutopilotStatus>('idle');
  const [autopilotVolume, setAutopilotVolume] = useState(3);
  const [showNotification, setShowNotification] = useState<
    ((message: string, type?: 'success' | 'error') => void) | null
  >(null);

  const handleStatusChange = useCallback((status: AutopilotStatus) => {
    setAutopilotStatus(status);
    
    // Trigger chart animation on success
    if (status === 'success') {
      // Pulse chart lines - this would trigger chart animation
      const event = new CustomEvent('autopilot-success', { 
        detail: { volume: autopilotVolume } 
      });
      window.dispatchEvent(event);
    }
  }, [autopilotVolume]);

  const handleNotificationSetup = useCallback((notificationFn: (message: string, type?: 'success' | 'error') => void) => {
    setShowNotification(() => notificationFn);
  }, []);

  return (
    <div className="enhanced-autopilot-dashboard">
      {/* Notification System - DISABLED */}
      {/* <NotificationSystem onShowNotification={handleNotificationSetup} /> */}
      
      {/* Main Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
        
        {/* Left Panel - Controls */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
            <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">
              AutoPilot Control Center
            </h2>
            
            {/* Status Indicator */}
            <div className="mb-6">
              <AutopilotStatusIndicator 
                status={autopilotStatus}
                volume={autopilotVolume}
                className="mb-4"
              />
            </div>

            {/* AutoPilot Button */}
            <AutopilotButton 
              onStatusChange={handleStatusChange}
              showNotification={showNotification || undefined}
            />

            {/* Volume Settings */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Daily Post Volume
              </label>
              <div className="flex items-center space-x-4">
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={autopilotVolume}
                  onChange={(e) => setAutopilotVolume(Number(e.target.value))}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400 min-w-[60px]">
                  {autopilotVolume} post{autopilotVolume !== 1 ? 's' : ''}/day
                </span>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                {autopilotVolume === 1 && "Thin/Slow chart animation"}
                {autopilotVolume >= 2 && autopilotVolume <= 3 && "Medium chart animation"}
                {autopilotVolume >= 4 && "Thick/Fast chart animation"}
              </div>
            </div>
          </div>

          {/* Status Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Platform Status</h3>
              <div className="mt-2 space-y-1">
                <div className="flex items-center text-sm">
                  <div className="w-2 h-2 bg-pink-500 rounded-full mr-2"></div>
                  Instagram Active
                </div>
                <div className="flex items-center text-sm">
                  <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                  YouTube Active
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Today's Posts</h3>
              <div className="mt-2 text-2xl font-bold text-gray-800 dark:text-white">
                {Math.floor(autopilotVolume * 0.8)} {/* Simulated current posts */}
              </div>
              <div className="text-xs text-gray-500">
                of {autopilotVolume} planned
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
          <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">
            Performance Chart
          </h2>
          <DashboardChart />
        </div>
      </div>
    </div>
  );
};

export default EnhancedAutopilotDashboard;