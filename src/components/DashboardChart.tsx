'use client';

import { useEffect, useState } from 'react';
import ChartWave from './ChartWave';
import { API_ENDPOINTS } from '../utils/api';

const DashboardChart = () => {
  const [settings, setSettings] = useState({ dailyPostLimit: 3 });
  const [engagementScore, setEngagementScore] = useState(0.5); // normalized 0–1
  const [autopilotOn, setAutopilotOn] = useState(false);
  const [newHigh, setNewHigh] = useState(false);
  const [lastPostSpike, setLastPostSpike] = useState<number | null>(null);
  const [autopilotVolume, setAutopilotVolume] = useState(3); // Volume for animation scaling
  const [animationSpeed, setAnimationSpeed] = useState(3); // Base animation speed
  const [platformData, setPlatformData] = useState({
    instagram: { active: true, todayPosts: 0 },
    youtube: { active: true, todayPosts: 0 }
  });

  // ✅ Real-time data fetching with enhanced connections
  useEffect(() => {
    const fetchChartData = async () => {
      try {
        const res = await fetch(API_ENDPOINTS.chartStatus());
        if (res.ok) {
          const data = await res.json();
          
          // 🎛️ CORE SETTINGS
          setSettings(data.settings || { dailyPostLimit: 3 });
          setAutopilotOn(data.autopilotRunning || false);
          
          // 📊 ENGAGEMENT DATA (affects wave amplitude)
          const currentEngagement = data.engagementScore || 0;
          setEngagementScore(currentEngagement);
          
          // 🌟 NEW RECORD DETECTION (triggers glow effect)
          const isNewRecord = data.newHighScore || false;
          if (isNewRecord && !newHigh) {
            console.log('🏆 New engagement record detected! Activating glow effect.');
          }
          setNewHigh(isNewRecord);
          
          // ⚡ POST SPIKE DETECTION (triggers spike animation)
          const currentPostTime = data.lastPostTime;
          if (currentPostTime && currentPostTime !== lastPostSpike) {
            console.log('📡 New post detected! Triggering spike animation.');
            setLastPostSpike(currentPostTime);
          }
          
          // 📈 VOLUME SCALING (affects speed and thickness)
          if (data.settings?.dailyPostLimit) {
            setAutopilotVolume(data.settings.dailyPostLimit);
          }
          
          // 🎯 PLATFORM ACTIVITY (affects line height and visibility)
          if (data.platformData) {
            const prevInstagram = platformData.instagram.todayPosts;
            const prevYoutube = platformData.youtube.todayPosts;
            const newInstagram = data.platformData.instagram?.todayPosts || 0;
            const newYoutube = data.platformData.youtube?.todayPosts || 0;
            
            // Log platform activity changes
            if (newInstagram > prevInstagram) {
              console.log(`📸 Instagram activity increased: ${prevInstagram} → ${newInstagram} posts`);
            }
            if (newYoutube > prevYoutube) {
              console.log(`🎥 YouTube activity increased: ${prevYoutube} → ${newYoutube} posts`);
            }
            
            setPlatformData(data.platformData);
          }
          
          console.log('📊 Chart connected - Live data updated:', {
            autopilot: data.autopilotRunning,
            engagement: currentEngagement,
            newRecord: isNewRecord,
            instagram: data.platformData?.instagram?.todayPosts || 0,
            youtube: data.platformData?.youtube?.todayPosts || 0
          });
        }
      } catch (error) {
        console.warn('📊 Chart connection failed:', error);
      }
    };
    
    // Initial fetch
    fetchChartData();
    
    // Real-time updates every 3 seconds for responsive chart
    const interval = setInterval(fetchChartData, 3000);
    
    return () => clearInterval(interval);
  }, [lastPostSpike, newHigh, platformData.instagram.todayPosts, platformData.youtube.todayPosts]);

  // ✅ Poll for immediate frontend events
  useEffect(() => {
    let lastEventCheck = Date.now();
    
    const pollForEvents = async () => {
      try {
        const res = await fetch(API_ENDPOINTS.eventsRecent(lastEventCheck));
        if (res.ok) {
          const data = await res.json();
          
          if (data.events && data.events.length > 0) {
            console.log('🔔 Processing frontend events:', data.events);
            
            data.events.forEach((event: any) => {
              switch (event.type) {
                case 'autopilot-success':
                  console.log(`🚀 Autopilot ${event.data.platform} success detected!`);
                  setLastPostSpike(event.data.timestamp);
                  setAutopilotVolume(event.data.volume);
                  if (event.data.engagement) {
                    setEngagementScore(event.data.engagement);
                  }
                  break;
                  
                case 'post-spike':
                  console.log(`📡 Post spike on ${event.data.platform}!`);
                  setLastPostSpike(event.data.timestamp);
                  break;
                  
                case 'new-engagement-record':
                  console.log(`🏆 New engagement record on ${event.data.platform}!`);
                  setNewHigh(true);
                  setTimeout(() => setNewHigh(false), 10000);
                  break;
                  
                case 'engagement-updated':
                  console.log(`📊 Engagement updated for ${event.data.platform}: ${event.data.score}`);
                  setEngagementScore(event.data.score);
                  break;
                  
                case 'autopilot-toggled':
                  console.log(`🎛️ Autopilot ${event.data.enabled ? 'enabled' : 'disabled'}!`);
                  setAutopilotOn(event.data.enabled);
                  break;
              }
            });
          }
          
          lastEventCheck = data.timestamp;
        }
      } catch (error) {
        console.warn('🔔 Failed to poll for events:', error);
      }
    };
    
    // Poll every 2 seconds for immediate responses
    const eventInterval = setInterval(pollForEvents, 2000);
    
    return () => clearInterval(eventInterval);
  }, []);

  // ✅ Volume-based animation scaling effect (restored but refined)
  useEffect(() => {
    const pulseChartLines = () => {
      const baseSpeed = 3; // 3s animation baseline
      const baseThickness = 1.5; // Thinner baseline

      const speed = Math.max(1, baseSpeed - 0.3 * (autopilotVolume - 1)); // Faster with more posts
      const thickness = baseThickness + (autopilotVolume - 1) * 0.8; // Less extreme thickness scaling
      
      setAnimationSpeed(speed);
      console.log(`📊 Chart scaling: Volume=${autopilotVolume}, Speed=${speed}s, Thickness=${thickness}px`);
    };

    pulseChartLines();
  }, [autopilotVolume]);

  // ✅ Enhanced event listeners for immediate chart updates
  useEffect(() => {
    // 🚀 AUTOPILOT SUCCESS EVENT (immediate spike + volume update)
    const handleAutopilotSuccess = (event: CustomEvent) => {
      const volume = event.detail?.volume || autopilotVolume;
      const platform = event.detail?.platform || 'unknown';
      
      console.log(`🚀 Autopilot ${platform} post successful! Triggering immediate chart update.`);
      
      // Immediate spike animation
      setLastPostSpike(Date.now());
      
      // Update volume for speed/thickness changes
      setAutopilotVolume(volume);
      
      // Force immediate data refresh
      setTimeout(() => {
        const fetchEvent = new Event('force-chart-refresh');
        window.dispatchEvent(fetchEvent);
      }, 500);
    };

    // 🏆 NEW RECORD EVENT (immediate glow effect)
    const handleNewRecord = (event: CustomEvent) => {
      const recordType = event.detail?.type || 'engagement';
      const platform = event.detail?.platform || 'unknown';
      
      console.log(`🏆 New ${recordType} record on ${platform}! Activating glow effect.`);
      
      // Immediate glow activation
      setNewHigh(true);
      
      // Auto-disable glow after 10 seconds
      setTimeout(() => {
        setNewHigh(false);
      }, 10000);
    };

    // 📊 ENGAGEMENT UPDATE EVENT (immediate amplitude change)
    const handleEngagementUpdate = (event: CustomEvent) => {
      const newScore = event.detail?.score || 0;
      const platform = event.detail?.platform || 'unknown';
      
      console.log(`📊 ${platform} engagement updated: ${newScore}`);
      setEngagementScore(newScore);
    };

    // 🎛️ AUTOPILOT TOGGLE EVENT (immediate on/off state)
    const handleAutopilotToggle = (event: CustomEvent) => {
      const isOn = event.detail?.enabled || false;
      console.log(`🎛️ Autopilot ${isOn ? 'enabled' : 'disabled'}! Chart responding immediately.`);
      setAutopilotOn(isOn);
    };

    // Register all event listeners
    window.addEventListener('autopilot-success', handleAutopilotSuccess as EventListener);
    window.addEventListener('new-engagement-record', handleNewRecord as EventListener);
    window.addEventListener('engagement-updated', handleEngagementUpdate as EventListener);
    window.addEventListener('autopilot-toggled', handleAutopilotToggle as EventListener);
    
    return () => {
      window.removeEventListener('autopilot-success', handleAutopilotSuccess as EventListener);
      window.removeEventListener('new-engagement-record', handleNewRecord as EventListener);
      window.removeEventListener('engagement-updated', handleEngagementUpdate as EventListener);
      window.removeEventListener('autopilot-toggled', handleAutopilotToggle as EventListener);
    };
  }, [autopilotVolume]);

  // ✅ Calculate dynamic wave properties exactly per specifications
  const calculateWaveProps = (platform: 'instagram' | 'youtube') => {
    const platformInfo = platformData[platform];
    const todayPosts = platformInfo.todayPosts;
    const isActive = platformInfo.active;
    
    // 🧬 LINE BEHAVIOR IMPLEMENTATION
    
    // 1. BASE SPEED: Slower when autopilot OFF, faster when ON
    const baseSpeed = platform === 'instagram' ? 1.2 : 1.4;
    const speed = autopilotOn 
      ? baseSpeed * Math.max(0.8, 2 - (autopilotVolume / 10)) // Faster with more posts
      : baseSpeed * 0.4; // Slow when autopilot OFF
    
    // 2. VERTICAL POSITION: Lines rise based on posts per day
    const postRatio = Math.min(todayPosts / settings.dailyPostLimit, 1);
    const offsetY = autopilotOn
      ? isActive 
        ? -20 + (postRatio * -25) // Higher position = more posts (negative = up)
        : 30 // Inactive platforms stay low
      : 25; // Near bottom when autopilot OFF
    
    // 3. AMPLITUDE: Based on engagement (larger waves = more engagement)
    const baseAmplitude = platform === 'instagram' ? 12 : 9;
    const engagementMultiplier = 0.5 + (engagementScore * 1.5); // 0.5x to 2x based on engagement
    const amplitude = autopilotOn
      ? isActive 
        ? baseAmplitude * engagementMultiplier // Engagement-responsive waves
        : baseAmplitude * 0.3 // Small waves when inactive
      : baseAmplitude * 0.4; // Low amplitude when autopilot OFF
    
    // 4. GLOW EFFECT: New record detection
    const isGlowing = newHigh && isActive;
    
    return { speed, amplitude, offsetY, isGlowing };
  };

  // Get dynamic wave properties
  const instagramProps = calculateWaveProps('instagram');
  const youtubeProps = calculateWaveProps('youtube');

  return (
    <div 
      className="chart-container" 
      style={{ 
        position: 'relative', 
        width: '100%', 
        height: '120px', 
        marginTop: '20px',
        backgroundColor: '#121212',
        borderRadius: '6px',
        overflow: 'hidden'
      }}
    >
      {/* Instagram Wave - Pink */}
      <ChartWave 
        color="rgba(255, 105, 180, 0.9)" 
        speed={instagramProps.speed} 
        amplitude={instagramProps.amplitude}
        frequency={0.015}
        height={120}
        width={800}
        offsetY={instagramProps.offsetY}
        isGlowing={instagramProps.isGlowing}
        thickness={instagramProps.isGlowing ? 4 : 2}
      />
      
      {/* YouTube Wave - Red */}
      <ChartWave 
        color="rgba(255, 0, 0, 0.9)" 
        speed={youtubeProps.speed} 
        amplitude={youtubeProps.amplitude}
        frequency={0.015}
        height={120}
        width={800}
        offsetY={youtubeProps.offsetY}
        isGlowing={youtubeProps.isGlowing}
        thickness={youtubeProps.isGlowing ? 4 : 2}
      />
      
      {/* 🌟 SPECIAL VISUALS: Real-time spike animation when post goes live */}
      {lastPostSpike && (Date.now() - lastPostSpike) < 3000 && (
        <div
          style={{
            position: 'absolute',
            left: `${((Date.now() - lastPostSpike) / 30) % 100}%`,
            top: 0,
            width: '2px',
            height: '100%',
            background: 'linear-gradient(to bottom, rgba(255,255,255,0.8), rgba(255,255,255,0.2))',
            animation: 'pulse 0.5s ease-in-out infinite alternate',
            pointerEvents: 'none'
          }}
        />
      )}
      
      <style jsx>{`
        @keyframes pulse {
          from { opacity: 0.4; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default DashboardChart;