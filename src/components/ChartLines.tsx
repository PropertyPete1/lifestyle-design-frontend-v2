// ✅ /frontend-v2/components/ChartLines.tsx

import React, { useEffect, useState } from 'react';
import './ChartLines.css'; // make sure you include styles

const ChartLines = ({ 
  autopilotSettings, 
  currentPlatform = 'both' 
}: { 
  autopilotSettings: { instagram: boolean; youtube: boolean };
  currentPlatform?: string;
}) => {
  const [instagramHeight, setInstagramHeight] = useState(0);
  const [youtubeHeight, setYoutubeHeight] = useState(0);

  useEffect(() => {
    // Platform-aware height calculation
    if (currentPlatform === 'instagram') {
      // Instagram dashboard - emphasize Instagram bar
      setInstagramHeight(autopilotSettings.instagram ? 100 : 0);
      setYoutubeHeight(autopilotSettings.youtube ? 30 : 0); // De-emphasize YouTube
    } else if (currentPlatform === 'youtube') {
      // YouTube dashboard - emphasize YouTube bar  
      setInstagramHeight(autopilotSettings.instagram ? 30 : 0); // De-emphasize Instagram
      setYoutubeHeight(autopilotSettings.youtube ? 100 : 0);
    } else {
      // Both platforms view - equal emphasis
      if (autopilotSettings.instagram && autopilotSettings.youtube) {
        setInstagramHeight(80);
        setYoutubeHeight(80);
      } else if (autopilotSettings.instagram) {
        setInstagramHeight(100);
        setYoutubeHeight(20);
      } else if (autopilotSettings.youtube) {
        setInstagramHeight(20);
        setYoutubeHeight(100);
      } else {
        setInstagramHeight(0);
        setYoutubeHeight(0);
      }
    }
  }, [autopilotSettings, currentPlatform]);

  return (
    <div className="chart-container">
      <div className="chart-line pink" style={{ height: `${instagramHeight}%` }}></div>
      <div className="chart-line red" style={{ height: `${youtubeHeight}%` }}></div>
    </div>
  );
};

export default ChartLines;