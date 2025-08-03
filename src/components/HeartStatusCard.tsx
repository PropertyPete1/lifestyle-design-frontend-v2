'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_ENDPOINTS } from '../utils/api';

interface HeartData {
  isPosting: boolean;
  growthRate: number;
  engagement: number;
  lastPost: string;
}

const HeartStatusCard: React.FC = () => {
  const [igData, setIgData] = useState<HeartData>({ 
    isPosting: false, 
    growthRate: 0, 
    engagement: 50,
    lastPost: new Date().toISOString()
  });
  
  const [ytData, setYtData] = useState<HeartData>({ 
    isPosting: false, 
    growthRate: 0, 
    engagement: 50,
    lastPost: new Date().toISOString()
  });
  
  const [showFusion, setShowFusion] = useState(false);
  const [lastPostSpike, setLastPostSpike] = useState({ ig: false, yt: false });


  // Fetch data from backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(API_ENDPOINTS.chartStatus());
        const data = await response.json();
        
        // Use the correct data structure from the actual API
        const platformData = data.platformData || {};
        const engagementScore = (data.engagementScore || 0) * 100; // Convert to percentage
        const isRunning = data.autopilotRunning || false;
        
        setIgData({
          isPosting: isRunning && platformData.instagram?.active,
          growthRate: platformData.instagram?.todayPosts || 0,
          engagement: engagementScore,
          lastPost: new Date(data.lastPostTime || Date.now()).toISOString()
        });
        
        setYtData({
          isPosting: isRunning && platformData.youtube?.active,
          growthRate: platformData.youtube?.todayPosts || 0,
          engagement: engagementScore,
          lastPost: new Date(data.lastPostTime || Date.now()).toISOString()
        });
        
        // Check for fusion (both platforms posted recently)
        const lastPostTime = data.lastPostTime;
        const timeSinceLastPost = lastPostTime ? Date.now() - lastPostTime : Infinity;
        
        if (timeSinceLastPost <= 5 * 60 * 1000 && platformData.instagram?.active && platformData.youtube?.active) { // 5 minutes
          setShowFusion(true);
          setTimeout(() => setShowFusion(false), 10000); // Hold for 10 seconds
        }
      } catch (error) {
        console.error('Failed to fetch heart data:', error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const getHeartStatus = (data: HeartData) => {
    const status = {
      cracked: data.engagement < 10,
      pulseSpeed: data.growthRate > 5 ? 'fast' : data.growthRate > 0 ? 'normal' : 'slow',
      spike: false // Will be set by post events
    };
    return status;
  };

  const HeartSVG: React.FC<{ 
    platform: 'instagram' | 'youtube'; 
    data: HeartData; 
  }> = ({ platform, data }) => {
    const status = getHeartStatus(data);
    const color = platform === 'instagram' ? '#E1306C' : '#FF0000';
    
    return (
      <motion.div
        className="relative"
        animate={{
          scale: status.spike ? [1, 1.2, 1] : 1,
        }}
        transition={{
          scale: { duration: 2 },
          repeat: status.pulseSpeed === 'fast' ? Infinity : status.pulseSpeed === 'normal' ? Infinity : 0,
          repeatDelay: status.pulseSpeed === 'fast' ? 0.5 : 1.5
        }}
      >
        <motion.svg
          width="60"
          height="60"
          viewBox="0 0 24 24"
          className={`drop-shadow-lg ${status.cracked ? 'opacity-60' : ''}`}
          animate={{
            filter: data.isPosting ? [
              `drop-shadow(0 0 10px ${color})`,
              `drop-shadow(0 0 20px ${color})`,
              `drop-shadow(0 0 10px ${color})`
            ] : `drop-shadow(0 0 5px ${color})`
          }}
          transition={{ duration: 1, repeat: data.isPosting ? Infinity : 0 }}
        >
          <path
            d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
            fill={color}
            className={status.cracked ? 'opacity-70' : ''}
          />
          {status.cracked && (
            <path
              d="M12 3L14 8L12 12L10 8Z"
              stroke="#666"
              strokeWidth="1"
              fill="none"
              className="animate-pulse"
            />
          )}
        </motion.svg>
        
        {/* Particle effects */}
        {data.isPosting && (
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full"
                style={{
                  left: `${20 + i * 20}%`,
                  top: `${30 + i * 10}%`,
                }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0],
                  y: [-10, 0, 10]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.5
                }}
              />
            ))}
          </div>
        )}
      </motion.div>
    );
  };

  const FusionHeart: React.FC = () => (
    <motion.div
      initial={{ scale: 0, rotate: 0 }}
      animate={{ 
        scale: [0, 1.2, 1],
        rotate: [0, 360, 0],
      }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ duration: 1 }}
      className="relative"
    >
      <motion.svg
        width="120"
        height="120"
        viewBox="0 0 24 24"
        className="drop-shadow-2xl"
        animate={{
          filter: [
            'drop-shadow(0 0 20px #8B0000)',
            'drop-shadow(0 0 40px #8B0000)',
            'drop-shadow(0 0 20px #8B0000)'
          ]
        }}
        transition={{ duration: 1, repeat: Infinity }}
      >
        <path
          d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
          fill="#8B0000"
        />
      </motion.svg>
      
      {/* Fusion sparkles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-yellow-400 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
              rotate: [0, 360]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.2
            }}
          />
        ))}
      </div>
    </motion.div>
  );

  return (
    <div className="h-[120px] mt-5 bg-[#121212] border border-[#333] rounded-md p-4 relative overflow-hidden">
      {/* Background particle glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 to-blue-900/10 pointer-events-none" />
      
      <div className="relative z-10 h-full flex items-center justify-center">
        <AnimatePresence mode="wait">
          {showFusion ? (
            <FusionHeart />
          ) : (
            <motion.div 
              className="flex items-center space-x-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="relative">
                <HeartSVG
                  platform="instagram"
                  data={igData}
                />
              </div>
              
              <div className="relative">
                <HeartSVG
                  platform="youtube"
                  data={ytData}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default HeartStatusCard;