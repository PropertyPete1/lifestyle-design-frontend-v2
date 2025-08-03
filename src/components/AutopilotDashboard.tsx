// ✅ Enhanced AutoPilot Dashboard Component
// /frontend-v2/src/components/AutopilotDashboard.tsx

import React, { useState } from 'react';

interface AutopilotResults {
  processed: number;
  posted: number;
  skipped: number;
}

const AutopilotDashboard: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<AutopilotResults | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAutopilotClick = async () => {
    if (isRunning) return;
    
    setIsRunning(true);
    setError(null);
    setResults(null);
    
    try {
      const res = await fetch('/api/autopilot/run', {
        method: 'POST'
      });

      const data = await res.json();
      if (data.success) {
        setResults(data.data);
        alert('🚀 Autopilot ran successfully!');
      } else {
        setError(data.error);
        alert('⚠️ Autopilot failed: ' + data.error);
      }
    } catch (err) {
      const errorMsg = 'Error triggering autopilot';
      setError(errorMsg);
      alert('❌ ' + errorMsg);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">
        🤖 Autopilot System
      </h2>
      
      <p className="text-gray-600 mb-4">
        Automatically scrape top-performing posts, check delays, and post to Instagram + YouTube
      </p>

      <button
        onClick={handleAutopilotClick}
        disabled={isRunning}
        className={`
          w-full px-6 py-3 rounded-lg font-semibold text-white transition-all duration-200 mb-4
          ${isRunning 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
          }
        `}
      >
        {isRunning ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Running Autopilot...
          </span>
        ) : (
          '🚀 Run Autopilot'
        )}
      </button>

      {/* Results Display */}
      {results && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <h3 className="text-green-800 font-semibold mb-2">✅ Autopilot Results</h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{results.processed}</div>
              <div className="text-gray-600">Processed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{results.posted}</div>
              <div className="text-gray-600">Posted</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{results.skipped}</div>
              <div className="text-gray-600">Skipped</div>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <h3 className="text-red-800 font-semibold mb-2">❌ Error</h3>
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* How it Works */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold text-gray-800 mb-2">How Autopilot Works:</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>🔍 Scrapes top-performing Instagram posts (>10k views)</li>
          <li>🕒 Checks 30-day delay restrictions</li>
          <li>📥 Downloads and converts videos to optimal format</li>
          <li>📸 Posts to Instagram with smart captions</li>
          <li>▶️ Posts to YouTube with trending audio</li>
          <li>📝 Tracks posts for intelligent delay management</li>
        </ul>
      </div>
    </div>
  );
};

export default AutopilotDashboard;