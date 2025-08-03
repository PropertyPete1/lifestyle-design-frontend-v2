'use client';

import React, { useState, useEffect } from 'react';
import './HeartContainer.css';

interface HeartContainerProps {
  autopilotSettings: { 
    instagram: boolean; 
    youtube: boolean; 
  };
  currentPlatform?: string;
  platformData?: {
    instagram: { active: boolean; todayPosts: number; reach?: number; engagement?: number };
    youtube: { active: boolean; todayPosts: number; reach?: number; engagement?: number };
  };
  engagementScore?: number;
  newHighScore?: boolean;
  lastPostSpike?: number;
}

export default function HeartContainer({
  autopilotSettings,
  currentPlatform = 'both',
  platformData,
  engagementScore = 0,
  newHighScore = false,
  lastPostSpike
}: HeartContainerProps) {
  
  // 🎭 Heart States
  const [instagramState, setInstagramState] = useState({
    active: false,
    heartbeatRate: 1,
    isDecayed: false,
    isGlowing: false,
    reach: 0,
    growth: 0
  });
  
  const [youtubeState, setYoutubeState] = useState({
    active: false,
    heartbeatRate: 1,
    isDecayed: false,
    isGlowing: false,
    reach: 0,
    growth: 0
  });
  
  const [fusionMode, setFusionMode] = useState(false);
  const [tooltipData, setTooltipData] = useState<{
    platform: string;
    reach: number;
    growth: number;
    visible: boolean;
    x: number;
    y: number;
  } | null>(null);

  // 🔄 Update heart states based on platform data
  useEffect(() => {
    // Instagram heart logic
    const igActive = autopilotSettings.instagram && platformData?.instagram?.active;
    const igReach = platformData?.instagram?.reach || 0;
    const igEngagement = platformData?.instagram?.engagement || 0;
    
    // Calculate heartbeat rate based on performance (0.5x - 3x speed)
    const igHeartbeatRate = igActive ? Math.max(0.5, Math.min(3, 1 + (engagementScore * 2))) : 0.5;
    
    // Check for decay (performance drop > 20%)
    const igDecayed = igActive && engagementScore < 0.3;
    
    setInstagramState({
      active: igActive || false,
      heartbeatRate: igHeartbeatRate,
      isDecayed: igDecayed,
      isGlowing: newHighScore && igActive,
      reach: igReach,
      growth: igEngagement * 100
    });

    // YouTube heart logic
    const ytActive = autopilotSettings.youtube && platformData?.youtube?.active;
    const ytReach = platformData?.youtube?.reach || 0;
    const ytEngagement = platformData?.youtube?.engagement || 0;
    
    const ytHeartbeatRate = ytActive ? Math.max(0.5, Math.min(3, 1 + (engagementScore * 2))) : 0.5;
    const ytDecayed = ytActive && engagementScore < 0.3;
    
    setYoutubeState({
      active: ytActive || false,
      heartbeatRate: ytHeartbeatRate,
      isDecayed: ytDecayed,
      isGlowing: newHighScore && ytActive,
      reach: ytReach,
      growth: ytEngagement * 100
    });

    // 💥 Fusion mode when both are posting
    setFusionMode(igActive && ytActive);
    
  }, [autopilotSettings, platformData, engagementScore, newHighScore]);

  // ✨ Glow effect on post spike
  useEffect(() => {
    if (lastPostSpike && (Date.now() - lastPostSpike) < 3000) {
      setInstagramState(prev => ({ ...prev, isGlowing: true }));
      setYoutubeState(prev => ({ ...prev, isGlowing: true }));
      
      setTimeout(() => {
        setInstagramState(prev => ({ ...prev, isGlowing: false }));
        setYoutubeState(prev => ({ ...prev, isGlowing: false }));
      }, 3000);
    }
  }, [lastPostSpike]);

  // 🖱️ Tooltip handlers
  const handleHeartHover = (platform: string, reach: number, growth: number, event: React.MouseEvent) => {
    setTooltipData({
      platform,
      reach,
      growth,
      visible: true,
      x: event.clientX,
      y: event.clientY
    });
  };

  const handleHeartLeave = () => {
    setTooltipData(null);
  };

  // 🎨 Dynamic heart classes
  const getHeartClasses = (state: typeof instagramState, color: 'pink' | 'red') => {
    let classes = `heart ${color}`;
    if (state.active) classes += ' active';
    if (state.isDecayed) classes += ' decayed';
    if (state.isGlowing) classes += ' glowing';
    if (fusionMode) classes += ' fusion';
    return classes;
  };

  return (
    <div className="heart-container">
      {/* 💗 Instagram Heart */}
      {(!fusionMode || currentPlatform === 'instagram') && (
        <div 
          className={getHeartClasses(instagramState, 'pink')}
          style={{
            animationDuration: `${1 / instagramState.heartbeatRate}s`,
            opacity: currentPlatform === 'youtube' ? 0.3 : 1
          }}
          onMouseEnter={(e) => handleHeartHover('Instagram', instagramState.reach, instagramState.growth, e)}
          onMouseLeave={handleHeartLeave}
        >
          <svg viewBox="0 0 24 24" className="heart-svg">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        </div>
      )}

      {/* ❤️ YouTube Heart */}
      {(!fusionMode || currentPlatform === 'youtube') && (
        <div 
          className={getHeartClasses(youtubeState, 'red')}
          style={{
            animationDuration: `${1 / youtubeState.heartbeatRate}s`,
            opacity: currentPlatform === 'instagram' ? 0.3 : 1
          }}
          onMouseEnter={(e) => handleHeartHover('YouTube', youtubeState.reach, youtubeState.growth, e)}
          onMouseLeave={handleHeartLeave}
        >
          <svg viewBox="0 0 24 24" className="heart-svg">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        </div>
      )}

      {/* 💔🔥 Fusion Heart (Dark Red) */}
      {fusionMode && currentPlatform === 'both' && (
        <div 
          className="heart fusion-heart active glowing"
          style={{
            animationDuration: `${1 / Math.max(instagramState.heartbeatRate, youtubeState.heartbeatRate)}s`
          }}
          onMouseEnter={(e) => handleHeartHover('Both Platforms', 
            instagramState.reach + youtubeState.reach, 
            (instagramState.growth + youtubeState.growth) / 2, e)}
          onMouseLeave={handleHeartLeave}
        >
          <svg viewBox="0 0 24 24" className="heart-svg">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        </div>
      )}

      {/* 💬 Tooltip */}
      {tooltipData && (
        <div 
          className="heart-tooltip"
          style={{
            position: 'fixed',
            left: tooltipData.x + 10,
            top: tooltipData.y - 10,
            zIndex: 1000
          }}
        >
          <div className="tooltip-content">
            <h4>{tooltipData.platform}</h4>
            <p>Reach: {tooltipData.reach.toLocaleString()}</p>
            <p>Growth: {tooltipData.growth.toFixed(1)}%</p>
          </div>
        </div>
      )}
    </div>
  );
}