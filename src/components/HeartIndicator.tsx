// 🎯 GROUND RULES
// - Place Instagram ❤️ and YouTube 💗 hearts on BOTH dashboards
// - Slightly shrink both hearts to ~85% of original size
// - Remove background square behind heart
// - Ensure SVGs are crisp, no blurriness or pixelation
// - Add subtle hover tooltip to explain each heart's meaning
// - Do NOT animate hearts unless AutoPilot is ON
// - Trigger behavior via real-time data from backend analytics endpoint

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getAnalyticsData } from "../api/getAnalyticsData";

const HeartIndicator = () => {
  const [igData, setIgData] = useState({ isPosting: false, growthRate: 0 });
  const [ytData, setYtData] = useState({ isPosting: false, growthRate: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch analytics data from the dedicated dashboard endpoint
        const { instagram, youtube } = await getAnalyticsData();
        
        console.log('💗 Heart indicator data:', { instagram, youtube });
        
        setIgData(instagram);
        setYtData(youtube);
        
      } catch (error) {
        console.warn('⚠️ Heart indicator data fetch failed:', error);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 5000); // Refresh every 5s
    return () => clearInterval(interval);
  }, []);

  const Heart = ({ 
    isGrowing, 
    isDropping, 
    color, 
    tooltip,
    isAutopilotActive 
  }: {
    isGrowing: boolean;
    isDropping: boolean;
    color: string;
    tooltip: string;
    isAutopilotActive: boolean;
  }) => (
    <motion.div
      className="relative group"
      style={{ width: "40px", height: "40px" }} // 85% of original size
      animate={{
        // Slight pulse + glow when performance is growing
        scale: isGrowing ? [1, 1.15, 1] : 1,
        opacity: isAutopilotActive ? 1 : 0.6,
        // Glitchy/cracked effect when views are dropping  
        filter: isDropping ? "contrast(1.3) saturate(0.7) hue-rotate(15deg)" : "none",
      }}
      transition={{
        duration: isGrowing ? 1.2 : 0.3,
        repeat: isGrowing ? Infinity : 0,
        repeatType: "loop",
      }}
    >
      <motion.svg
        viewBox="0 0 32 29.6"
        fill={color}
        className="w-full h-full" // Clean high-res SVG, NO square around it
        style={{
          filter: isGrowing 
            ? "drop-shadow(0 0 8px rgba(255,255,255,0.4))" // Glow effect
            : "drop-shadow(0 0 4px rgba(0,0,0,0.3))", // Normal shadow
        }}
        animate={{
          // Additional glow animation when growing
          filter: isGrowing 
            ? [
                "drop-shadow(0 0 8px rgba(255,255,255,0.4))",
                "drop-shadow(0 0 12px rgba(255,255,255,0.6))",
                "drop-shadow(0 0 8px rgba(255,255,255,0.4))"
              ]
            : "drop-shadow(0 0 4px rgba(0,0,0,0.3))"
        }}
        transition={{
          duration: 1.5,
          repeat: isGrowing ? Infinity : 0,
          repeatType: "loop",
        }}
      >
        <path d="M23.6,0C21.1,0,18.7,1.4,16,4.1C13.3,1.4,10.9,0,8.4,0C3.8,0,0,3.8,0,8.4c0,7.1,12.3,15.5,16,21.2c3.7-5.7,16-14.1,16-21.2C32,3.8,28.2,0,23.6,0z"/>
      </motion.svg>
      {/* Hover tooltip */}
      <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-6 text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap bg-gray-800 px-2 py-1 rounded shadow-lg">
        {tooltip}
      </span>
    </motion.div>
  );

  // Determine heart states based on data
  const igIsGrowing = igData.growthRate > 0;
  const igIsDropping = igData.growthRate < -5; // Dropping threshold
  const ytIsGrowing = ytData.growthRate > 0;
  const ytIsDropping = ytData.growthRate < -5; // Dropping threshold
  
  // Merge into 1 dark red heart when both platforms are posting via AutoPilot
  const shouldMerge = igData.isPosting && ytData.isPosting;

  if (shouldMerge) {
    return (
      <div className="flex items-center justify-center gap-2 w-full h-[180px] mt-2">
        <Heart 
          isGrowing={igIsGrowing || ytIsGrowing}
          isDropping={igIsDropping && ytIsDropping}
          color="#8B0000" // Dark red
          tooltip="AutoPilot Active (Instagram + YouTube)"
          isAutopilotActive={true}
        />
      </div>
    );
  }

  // Two hearts always shown: ❤️ red (IG), 💗 pink (YT)
  return (
    <div className="flex items-center justify-center gap-2 w-full h-[180px] mt-2">
      <Heart 
        isGrowing={igIsGrowing}
        isDropping={igIsDropping}
        color="#ff3040" // Instagram red
        tooltip={`Instagram: ${igData.growthRate > 0 ? '+' : ''}${igData.growthRate}% growth`}
        isAutopilotActive={igData.isPosting}
      />
      <Heart 
        isGrowing={ytIsGrowing}
        isDropping={ytIsDropping}
        color="#ff7db8" // YouTube pink
        tooltip={`YouTube: ${ytData.growthRate > 0 ? '+' : ''}${ytData.growthRate}% growth`}
        isAutopilotActive={ytData.isPosting}
      />
    </div>
  );
};

export default HeartIndicator;