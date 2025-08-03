import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDashboardData } from '@/hooks/useDashboardData';
import Tooltip from './Tooltip';

export default function HeartVisual() {
  const { instagram, youtube, isAutopilotOn } = useDashboardData();
  const [merged, setMerged] = useState(false);

  // Trigger fusion if both platforms are active
  useEffect(() => {
    if (isAutopilotOn.instagram && isAutopilotOn.youtube) {
      setMerged(true);
    } else {
      setMerged(false);
    }
  }, [isAutopilotOn]);

  const getPulseSpeed = (reachGrowth: number) => {
    if (reachGrowth > 20) return 0.7;
    if (reachGrowth > 10) return 1;
    return 1.4;
  };

  const getDecay = (reachGrowth: number) => reachGrowth < -20;

  return (
    <div className="relative flex items-center justify-center gap-10 w-full h-[180px] mt-2">
      {!merged && (
        <>
          <Tooltip content={`Instagram Reach: ${instagram.reach} (${instagram.growth.toFixed(1)}%)`}>
            <motion.img
              src={getDecay(instagram.growth) ? '/hearts/ig-cracked.svg' : '/hearts/ig.svg'}
              alt="Instagram Heart"
              initial={{ scale: 1 }}
              animate={{
                scale: [1, 1.1, 1],
                transition: {
                  duration: getPulseSpeed(instagram.growth),
                  repeat: Infinity,
                },
              }}
              className="w-20 drop-shadow-pink animate-glowPink"
            />
          </Tooltip>

          <Tooltip content={`YouTube Views: ${youtube.reach} (${youtube.growth.toFixed(1)}%)`}>
            <motion.img
              src={getDecay(youtube.growth) ? '/hearts/yt-cracked.svg' : '/hearts/yt.svg'}
              alt="YouTube Heart"
              initial={{ scale: 1 }}
              animate={{
                scale: [1, 1.1, 1],
                transition: {
                  duration: getPulseSpeed(youtube.growth),
                  repeat: Infinity,
                },
              }}
              className="w-20 drop-shadow-red animate-glowRed"
            />
          </Tooltip>
        </>
      )}

      <AnimatePresence>
        {merged && (
          <motion.img
            key="merged-heart"
            src="/hearts/merged.svg"
            alt="Merged Heart"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{
              scale: [0.9, 1.1, 1],
              opacity: 1,
              transition: {
                duration: 0.8,
                repeat: Infinity,
              },
            }}
            exit={{ opacity: 0 }}
            className="w-28 drop-shadow-darkRed animate-glowMerge"
          />
        )}
      </AnimatePresence>
    </div>
  );
}