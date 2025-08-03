import { useState, useEffect, useCallback } from 'react';

interface PlatformData {
  reach: string;
  growth: number;
  active: boolean;
  todayPosts: number;
}

interface DashboardData {
  instagram: PlatformData;
  youtube: PlatformData;
  isAutopilotOn: {
    instagram: boolean;
    youtube: boolean;
  };
  engagementScore: number;
  newHighScore: boolean;
  lastPostSpike: number | null;
}

export function useDashboardData(): DashboardData {
  const [data, setData] = useState<DashboardData>({
    instagram: {
      reach: '89.2K',
      growth: 12.4,
      active: false,
      todayPosts: 0
    },
    youtube: {
      reach: 'N/A',
      growth: 8.3,
      active: false,
      todayPosts: 0
    },
    isAutopilotOn: {
      instagram: false,
      youtube: false
    },
    engagementScore: 0.65,
    newHighScore: false,
    lastPostSpike: null
  });

  const fetchDashboardData = useCallback(async () => {
    try {
      // Fetch chart status for real-time platform data
      const chartRes = await fetch('http://localhost:3002/api/chart/status');
      if (chartRes.ok) {
        const chartData = await chartRes.json();
        
        // Update with real backend data
        setData(prev => ({
          ...prev,
          instagram: {
            ...prev.instagram,
            active: chartData.platformData?.instagram?.active || false,
            todayPosts: chartData.platformData?.instagram?.todayPosts || 0,
            growth: chartData.engagementScore ? (chartData.engagementScore * 50 - 10) : prev.instagram.growth // Convert 0-1 to growth %
          },
          youtube: {
            ...prev.youtube,
            active: chartData.platformData?.youtube?.active || false,
            todayPosts: chartData.platformData?.youtube?.todayPosts || 0,
            growth: chartData.engagementScore ? (chartData.engagementScore * 45 - 8) : prev.youtube.growth // Convert 0-1 to growth %
          },
          isAutopilotOn: {
            instagram: chartData.settings?.postToInstagram && chartData.autopilotRunning || false,
            youtube: chartData.settings?.postToYouTube && chartData.autopilotRunning || false
          },
          engagementScore: chartData.engagementScore || 0.65,
          newHighScore: chartData.newHighScore || false,
          lastPostSpike: chartData.lastPostTime || null
        }));
      }

      // Fetch analytics for reach data
      const [instagramRes, youtubeRes] = await Promise.all([
        fetch('http://localhost:3002/api/instagram/analytics'),
        fetch('http://localhost:3002/api/youtube/analytics')
      ]);

      if (instagramRes.ok) {
        const igData = await instagramRes.json();
        if (igData.success && igData.analytics) {
          setData(prev => ({
            ...prev,
            instagram: {
              ...prev.instagram,
              reach: formatReach(igData.analytics.reach || igData.analytics.impressions)
            }
          }));
        }
      }

      if (youtubeRes.ok) {
        const ytData = await youtubeRes.json();
        if (ytData.success && ytData.analytics) {
          setData(prev => ({
            ...prev,
            youtube: {
              ...prev.youtube,
              reach: formatReach(ytData.analytics.raw?.avgViews || ytData.analytics.raw?.subscribers || 0)
            }
          }));
        }
      }
    } catch (error) {
      console.warn('⚠️ Dashboard data fetch failed:', error);
    }
  }, []);

  // Helper function to format reach numbers
  const formatReach = (num: number | undefined): string => {
    if (!num || num === 0) return 'N/A';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // Fetch data on mount and set up polling
  useEffect(() => {
    fetchDashboardData();
    
    // Poll every 3 seconds for real-time updates
    const interval = setInterval(fetchDashboardData, 3000);
    
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  // Listen for real-time events
  useEffect(() => {
    const pollEvents = async () => {
      try {
        const eventRes = await fetch(`http://localhost:3002/api/events/recent?since=${Date.now() - 5000}`);
        if (eventRes.ok) {
          const eventData = await eventRes.json();
          if (eventData.events && eventData.events.length > 0) {
            // Process events for immediate updates
            eventData.events.forEach((event: any) => {
              if (event.type === 'post-spike') {
                setData(prev => ({ ...prev, lastPostSpike: event.timestamp }));
              }
              if (event.type === 'new-engagement-record') {
                setData(prev => ({ ...prev, newHighScore: true }));
                setTimeout(() => {
                  setData(prev => ({ ...prev, newHighScore: false }));
                }, 5000); // Reset after 5 seconds
              }
            });
          }
        }
      } catch (error) {
        console.warn('⚠️ Event polling failed:', error);
      }
    };

    // Poll events every 2 seconds
    const eventInterval = setInterval(pollEvents, 2000);
    
    return () => clearInterval(eventInterval);
  }, []);

  return data;
}