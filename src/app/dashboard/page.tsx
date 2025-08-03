'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';
import DashboardChart from '../../components/DashboardChart';
import HeartStatusCard from '../../components/HeartStatusCard';
import RecentAutoPilotPostsWrapper from '../../components/RecentAutoPilotPostsWrapper';
import { API_ENDPOINTS } from '../../utils/api';
// import NotificationSystem from '../../components/NotificationSystem'; // DISABLED

type DashboardSettings = {
  autopilot: boolean
  maxPosts: number
  postTime: string
  repostDelay: number
  manual: boolean
}

const defaultStatus: DashboardSettings = {
  autopilot: false,
  maxPosts: 3,
  postTime: '14:00',
  repostDelay: 1,
  manual: true
}

export default function Dashboard() {
  const [currentPlatform, setCurrentPlatform] = useState('instagram');
  const [menuOpen, setMenuOpen] = useState(false);
  const [status, setStatus] = useState<DashboardSettings>(defaultStatus);
  
  // ✅ Ultra-robust unique key generator with global counter
  const uniqueKeyCounter = useRef(0);
  const generateUniqueKey = useCallback((post: any, index: number, prefix: string) => {
    // Triple-layer uniqueness: prefix + index + incrementing counter + random component
    uniqueKeyCounter.current += 1;
    return `${prefix}-${index}-${uniqueKeyCounter.current}-${Math.random().toString(36).substr(2, 5)}`;
  }, []);
  const [stats, setStats] = useState({
    instagram: {
      followers: '24.8K',
      engagement: '4.7%',
      reach: '89.2K',
      autoPostsPerDay: `${status.maxPosts}/day`
    },
    youtube: {
      subscribers: 'N/A',
      watchTime: 'N/A',
      views: 'N/A',
      autoUploadsPerWeek: '2/week'
    }
  });
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState<Record<string, unknown>[]>([]);
  const [autopilotRunning, setAutopilotRunning] = useState(false);
  const [manualPostRunning, setManualPostRunning] = useState(false); // Separate state for manual post button
  const [autopilotStatus, setAutopilotStatus] = useState('idle'); // 'idle', 'running', 'success', 'error'
  const [autopilotVolume, setAutopilotVolume] = useState(3); // posts per day
  const [engagementScore, setEngagementScore] = useState(0.65); // 0-1 normalized
  const [newHighScore, setNewHighScore] = useState(false);
  const [lastPostSpike, setLastPostSpike] = useState<number | null>(null);
  const [queueSize, setQueueSize] = useState(0);
  const [platformSettings, setPlatformSettings] = useState({
    instagram: true,
    youtube: true
  });
  const [platformData, setPlatformData] = useState({
    instagram: { active: false, todayPosts: 0, reach: 0, engagement: 0 },
    youtube: { active: false, todayPosts: 0, reach: 0, engagement: 0 }
  });
  const [lastQueueUpdate, setLastQueueUpdate] = useState<number>(0);
  
  // ✅ NEW: Enhanced activity feed and chart state
  const [enhancedActivity, setEnhancedActivity] = useState<any[]>([]);
  const [queuedPosts, setQueuedPosts] = useState<any[]>([]);
  const [showUpcoming, setShowUpcoming] = useState(true); // Toggle between upcoming and recent
  const [chartData, setChartData] = useState<any>(null);
  
  // ✅ NEW: Real-time notifications - DISABLED
  // const [notificationHandler, setNotificationHandler] = useState<((message: string, type?: 'success' | 'error' | 'info') => void) | null>(null);
  const [lastAutopilotCheck, setLastAutopilotCheck] = useState<number>(0);
  const [lastActivityCount, setLastActivityCount] = useState<number>(0);
  
  // ✅ Memoize notification handler setter to prevent render loops - DISABLED
  // const handleNotificationSetup = useCallback((handler: (message: string, type?: 'success' | 'error' | 'info') => void) => {
  //   setNotificationHandler(() => handler);
  // }, []);
  
  // ✅ Analytics fetch function
  const fetchAnalytics = useCallback(async () => {
    try {
      setAnalyticsLoading(true);
      
      // Fetch both Instagram and YouTube analytics in parallel
      const [instagramRes, youtubeRes] = await Promise.all([
        fetch(API_ENDPOINTS.instagramAnalytics()),
        fetch(API_ENDPOINTS.youtubeAnalytics())
      ]);

      let instagramData: Record<string, unknown> = {};
      let youtubeData: Record<string, unknown> = {};

      if (instagramRes.ok) {
        const igResult = await instagramRes.json();
        if (igResult.success && igResult.analytics) {
          instagramData = igResult.analytics;
          console.log('✅ Instagram analytics loaded:', instagramData.formatted);
        }
      } else {
        console.warn('⚠️ Failed to load Instagram analytics');
      }

      if (youtubeRes.ok) {
        const ytResult = await youtubeRes.json();
        if (ytResult.success && ytResult.analytics) {
          youtubeData = ytResult.analytics;
          console.log('✅ YouTube analytics loaded:', youtubeData.formatted);
        }
      } else {
        // Don't spam console for known credential issues
        if (youtubeRes.status === 400) {
          console.warn('⚠️ YouTube analytics requires credentials configuration');
        } else {
          console.warn('⚠️ Failed to load YouTube analytics');
        }
      }

      // Update stats with real data
      const igFormatted = instagramData.formatted as any;
      const ytFormatted = youtubeData.formatted as any;
      
      setStats(prevStats => ({
        instagram: {
          followers: igFormatted?.followers || prevStats.instagram.followers,
          engagement: igFormatted?.engagement || prevStats.instagram.engagement,
          reach: igFormatted?.reach || prevStats.instagram.reach,
          autoPostsPerDay: `${status.maxPosts}/day`
        },
        youtube: {
          subscribers: ytFormatted?.subscribers || prevStats.youtube.subscribers,
          watchTime: ytFormatted?.watchTime || prevStats.youtube.watchTime,
          views: ytFormatted?.views || prevStats.youtube.views,
          autoUploadsPerWeek: '2/week'
        }
      }));

    } catch (err) {
      console.error('❌ Failed to load analytics:', err);
      // Don't show notifications for analytics failures to avoid spam
    } finally {
      setAnalyticsLoading(false);
    }
  }, [status.maxPosts]);

  // ✅ NEW: Check for new autopilot activities and show notifications - DISABLED
  // const checkAutopilotNotifications = useCallback(async () => {
  //   if (!notificationHandler) return;
  //   
  //   try {
  //     // Get recent activity to check for new posts
  //     const res = await fetch('http://localhost:3002/api/activity/feed?limit=20');
  //     if (res.ok) {
  //       const data = await res.json();
  //       const activities = data.data || [];
  //       
  //       // Filter activities from the last 2 minutes
  //       const recentActivities = activities.filter((activity: any) => {
  //         const activityTime = new Date(activity.timestamp || activity.createdAt).getTime();
  //         return activityTime > lastAutopilotCheck;
  //       });
  //       
  //       // Show notifications for recent activities
  //       recentActivities.forEach((activity: any) => {
  //         const platform = activity.platform;
  //         const type = activity.type || 'post';
  //         const status = activity.status;
  //         
  //         if (type === 'post' && status === 'success') {
  //           // ✅ Success notifications disabled to prevent spam
  //           // if (platform === 'instagram') {
  //           //   notificationHandler('✅ Video posted to Instagram', 'success');
  //           // } else if (platform === 'youtube') {
  //           //   notificationHandler('✅ Video posted to YouTube', 'success');
  //           // }
  //         } else if (status === 'failed') {
  //           notificationHandler(`❌ Failed to post to ${platform}`, 'error');
  //         } else if (type === 'repost' && activity.message?.includes('already posted')) {
  //           notificationHandler('🧠 Skipped – Already posted in last 30 days', 'info');
  //         } else if (type === 'storage_check' && status === 'warning') {
  //           notificationHandler('⚠️ Storage warning – check S3/Mongo', 'error');
  //         }
  //       });
  //       
  //       setLastAutopilotCheck(Date.now());
  //     }
  //   } catch (error) {
  //     console.warn('⚠️ Could not check autopilot notifications:', error);
  //   }
  // }, [notificationHandler, lastAutopilotCheck]);

  // ✅ Comprehensive refresh function for all dashboard data
  const refreshAllData = useCallback(async () => {
    try {
      console.log('🔄 Refreshing all dashboard data...');
      
      // Refresh activity feed
      const posts = await fetchEnhancedActivity();
      setEnhancedActivity(posts);
      
      // Refresh queued posts
      await fetchQueuedPosts();
      
      // Check for autopilot notifications - DISABLED
      // await checkAutopilotNotifications();
      
      // Refresh analytics
      await fetchAnalytics();
      
      // Refresh status/settings
      try {
        const res = await fetch('http://localhost:3002/api/settings');
        if (res.ok) {
          const data = await res.json();
          setStatus({
            autopilot: data.autopilot || false,
            manual: data.manual !== false,
            maxPosts: data.maxPosts || 3,
            postTime: data.postTime || '14:00',
            repostDelay: data.repostDelay || 1
          });
          
          // ✅ Update platform settings for ChartLines
          if (data.autopilotPlatforms) {
            setPlatformSettings({
              instagram: data.autopilotPlatforms.instagram || false,
              youtube: data.autopilotPlatforms.youtube || false
            });
          }
        }
      } catch (settingsError) {
        console.warn('⚠️ Settings refresh failed:', settingsError);
      }
      
      console.log('✅ All dashboard data refreshed');
    } catch (error) {
      console.error('❌ Failed to refresh dashboard data:', error);
    }
  }, []);
  



  // ✅ NEW: Fetch queued/upcoming AutoPilot posts
  const fetchQueuedPosts = useCallback(async () => {
    try {
      console.log('🔍 Fetching upcoming AutoPilot posts...');
      const res = await fetch('http://localhost:3002/api/autopilot/queue?limit=3');
      if (res.ok) {
        const data = await res.json();
        const posts = data.posts || [];
        console.log('📅 Upcoming posts:', posts);
        setQueuedPosts(posts);
        return posts;
      }
    } catch (error) {
      console.warn('⚠️ Could not fetch queued posts:', error);
      setQueuedPosts([]);
    }
    return [];
  }, []);

  // ✅ NEW: Enhanced activity fetch function
  const fetchEnhancedActivity = useCallback(async () => {
    try {
      // ✅ NEW: Get reactive chart data first
      const chartRes = await fetch('http://localhost:3002/api/chart/status');
      if (chartRes.ok) {
        const chartData = await chartRes.json();
        console.log('🔥 Chart reactive data:', chartData);
        
        // Update reactive states for chart behavior
        setEngagementScore(chartData.engagementScore || 0.65);
        setAutopilotRunning(chartData.autopilotRunning || false);
        setNewHighScore(chartData.newHighScore || false);
        setLastPostSpike(chartData.lastPostTime);
        
        // ✅ NEW: Update platform data for hearts
        if (chartData.platformData) {
          setPlatformData({
            instagram: {
              active: chartData.platformData.instagram?.active || false,
              todayPosts: chartData.platformData.instagram?.todayPosts || 0,
              reach: chartData.platformData.instagram?.reach || 0,
              engagement: engagementScore // Use global engagement score
            },
            youtube: {
              active: chartData.platformData.youtube?.active || false,
              todayPosts: chartData.platformData.youtube?.todayPosts || 0,
              reach: chartData.platformData.youtube?.reach || 0,
              engagement: engagementScore // Use global engagement score
            }
          });
        }
        
        if (chartData.settings) {
          setAutopilotVolume(chartData.settings.dailyPostLimit || 3);
        }
      }
    } catch (error) {
      console.warn('⚠️ Chart status not available');
    }
    
    try {
      // Try the main activity endpoint first
      const res = await fetch('http://localhost:3002/api/activity/feed?limit=20');
      if (res.ok) {
        const data = await res.json();
        const posts = data.data || [];
        console.log('📊 Enhanced activity data:', posts.slice(0, 3)); // Debug
        return posts;
      }
    } catch (error) {
      console.warn('⚠️ Enhanced activity not available, trying autopilot endpoint...');
    }
    
    try {
      // Try the new autopilot-specific activity endpoint
      const autopilotRes = await fetch('http://localhost:3002/api/autopilot/activity?limit=20');
      if (autopilotRes.ok) {
        const autopilotData = await autopilotRes.json();
        const posts = autopilotData.posts || [];
        console.log('📊 Autopilot activity data:', posts.slice(0, 3)); // Debug
        return posts;
      }
    } catch (autopilotError) {
      console.warn('⚠️ Autopilot activity endpoint not available, using final fallback...');
    }
    
    // No more fallbacks - use existing activity data
    console.warn('⚠️ All activity endpoints failed, using empty data');
    
    return [];
  }, []);

  // Helper function to format activity data
  const formatActivity = (activity: Record<string, unknown>) => {
    const timeAgo = getTimeAgo(activity.createdAt as string | Date);
    console.log(`🕒 Activity ${activity.type}: ${activity.createdAt} -> ${timeAgo}`);
    
    let title = '';
    let icon = '📊';
    
    switch (activity.type) {
      case 'scrape':
        title = `Scraped ${activity.postsProcessed} Instagram posts`;
        icon = '🔍';
        break;
      case 'schedule':
        title = `Queued ${activity.postsSuccessful} videos for posting`;
        icon = '📅';
        break;
      case 'repost':
        if ((activity.postsSuccessful as number) > 0) {
          title = `Posted ${activity.postsSuccessful} videos successfully`;
          icon = '✅';
        } else {
          title = 'Checked for posts to publish';
          icon = '🔄';
        }
        break;
      default:
        title = `${activity.type} completed`;
        icon = '📊';
    }
    
    return { title, icon, timeAgo };
  };

  // Helper function to get time ago
  const getTimeAgo = (date: Date | string) => {
    const now = new Date();
    const activityDate = new Date(date);
    
    // Validate the date
    if (isNaN(activityDate.getTime())) {
      return 'Unknown time';
    }
    
    const diffMs = now.getTime() - activityDate.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    // Handle negative time differences (future dates)
    if (diffMs < 0) return 'Just now';
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    // For older dates, show actual date
    return activityDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const instagramCanvasRef = useRef<HTMLCanvasElement>(null);
  const youtubeCanvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<HTMLDivElement>(null);

  // Load settings and analytics from backend on component mount
  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await fetch('http://localhost:3002/api/settings')
        if (res.ok) {
          const data = await res.json()
          setStatus({
            autopilot: data.autopilot || false,
            manual: data.manual !== false,
            maxPosts: data.maxPosts || 3,
            postTime: data.postTime || '14:00',
            repostDelay: data.repostDelay || 1
          })
        } else {
          console.warn('⚠️ No settings found, using defaults.')
        }

        // ✅ NEW: Fetch enhanced activity data and generate chart
        try {
          const posts = await fetchEnhancedActivity();
          setEnhancedActivity(posts);

          // Generate chart data for last 7 days
          const today = new Date();
          const last7 = [...Array(7)].map((_, i) => {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            return d.toISOString().split('T')[0];
          }).reverse();

          const counts = { instagram: {}, youtube: {} } as any;
          last7.forEach(date => {
            counts.instagram[date] = 0;
            counts.youtube[date] = 0;
          });

          // Process enhanced activity data for chart
          posts.forEach((post: any) => {
            const date = new Date(post.startTime || post.timestamp).toISOString().split('T')[0];
            if (last7.includes(date)) {
              const platform = post.platform || 'unknown';
              if (platform === 'instagram' || platform.includes('instagram')) {
                counts.instagram[date]++;
              }
              if (platform === 'youtube' || platform.includes('youtube')) {
                counts.youtube[date]++;
              }
            }
          });

          // 🔥 Create reactive chart data based on specifications
          const createReactiveData = (platform: 'instagram' | 'youtube', baseCounts: number[]) => {
            // ✅ Line Height Logic: AutoPilot status affects baseline
            let baseValue;
            if (!autopilotRunning) {
              // AutoPilot OFF: lines near bottom (low values)
              baseValue = 0.5; // Start near bottom
            } else {
              // AutoPilot ON: height based on daily post limit
              const heightRatio = Math.min(autopilotVolume / 10, 0.8); // Max 80% of scale
              baseValue = 1 + (heightRatio * 8); // Scale 1-9 based on volume
            }

            // 🔥 Engagement-Based Wave Enhancement
            const engagementMultiplier = autopilotRunning ? (0.5 + engagementScore * 1.5) : 0.3;
            
            // Apply reactive behavior to data points
            return baseCounts.map(count => {
              const enhancedValue = baseValue + (count * engagementMultiplier);
              return Math.max(enhancedValue, 0.1); // Minimum visibility
            });
          };

          // ⚡ Special Effects for New High Score
          const glowIntensity = newHighScore ? 20 : 0;
          const lineThickness = newHighScore ? 6 : 4; // 2px → 4px → 6px for extra glow

          // 📊 Create enhanced chart data
          setChartData({
            labels: last7.map(date => {
              const d = new Date(date);
              return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            }),
            datasets: [
              {
                label: 'Instagram',
                data: createReactiveData('instagram', last7.map(date => counts.instagram[date])),
                borderColor: newHighScore ? '#ff69b4' : 'hotpink', // Brighter when glowing
                backgroundColor: `rgba(255, 105, 180, ${newHighScore ? 0.2 : 0.1})`,
                borderWidth: lineThickness,
                tension: 0.4 + (engagementScore * 0.3), // Smoother with higher engagement
                pointRadius: newHighScore ? 8 : 6,
                pointBackgroundColor: newHighScore ? '#ff1493' : 'hotpink',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                fill: true,
                shadowOffsetX: glowIntensity,
                shadowOffsetY: glowIntensity,
                shadowBlur: glowIntensity,
                shadowColor: 'rgba(255, 105, 180, 0.6)',
              },
              {
                label: 'YouTube',
                data: createReactiveData('youtube', last7.map(date => counts.youtube[date])),
                borderColor: newHighScore ? '#ff0000' : 'red', // Brighter when glowing
                backgroundColor: `rgba(255, 0, 0, ${newHighScore ? 0.2 : 0.1})`,
                borderWidth: lineThickness,
                tension: 0.4 + (engagementScore * 0.3), // Smoother with higher engagement
                pointRadius: newHighScore ? 8 : 6,
                pointBackgroundColor: newHighScore ? '#cc0000' : 'red',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                fill: true,
                shadowOffsetX: glowIntensity,
                shadowOffsetY: glowIntensity,
                shadowBlur: glowIntensity,
                shadowColor: 'rgba(255, 0, 0, 0.6)',
              },
            ]
          });

          console.log('📊 Chart data generated:', counts);
        } catch (enhancedErr) {
          console.warn('⚠️ Enhanced activity failed, trying fallback...');
        }

        // Use scheduler status for autopilot data
        try {
          const schedulerRes = await fetch('http://localhost:3002/api/scheduler/status')
          if (schedulerRes.ok) {
            const schedulerData = await schedulerRes.json()
            if (schedulerData.success) {
              console.log('📊 Scheduler Status:', schedulerData.data)
              setAutopilotRunning(schedulerData.data.running || false)
            }
          }
        } catch (schedulerErr) {
          console.warn('⚠️ Scheduler status not available:', schedulerErr)
        }
      } catch (err) {
        console.error('❌ Failed to load settings for dashboard:', err)
      }
    }



    fetchStatus();
    fetchAnalytics();
    
    // ✅ Enhanced periodic refresh for real-time updates
    const statusInterval = setInterval(fetchStatus, 30000); // Every 30 seconds for live metrics
    
    // ✅ Additional refresh for activity feed every 60 seconds
    const activityInterval = setInterval(async () => {
      try {
        const posts = await fetchEnhancedActivity();
        setEnhancedActivity(posts);
        console.log('🔄 Activity feed auto-refreshed');
      } catch (error) {
        console.warn('⚠️ Activity feed auto-refresh failed:', error);
      }
    }, 60000); // Every 60 seconds
    
    return () => {
      clearInterval(statusInterval);
      clearInterval(activityInterval);
    };
  }, [])

  useEffect(() => {
    // Update stats when status changes
    setStats(prevStats => ({
      ...prevStats,
      instagram: {
        ...prevStats.instagram,
        autoPostsPerDay: `${status.maxPosts}/day`
      }
    }));
  }, [status]);

  useEffect(() => {
    // Create particles
    const createParticles = () => {
      if (!particlesRef.current) return;
      
      // Clear existing particles
      particlesRef.current.innerHTML = '';
      
      // Create 20 particles
      for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.className = `particle ${currentPlatform}`;
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 20 + 's';
        particle.style.animationDuration = (15 + Math.random() * 10) + 's';
        particlesRef.current.appendChild(particle);
      }
    };

    createParticles();
  }, [currentPlatform]);

  useEffect(() => {
    // Draw charts
    const drawChart = (canvas: HTMLCanvasElement | null, platform: string) => {
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      let animationFrame = 0;
      
      const animate = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw grid
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        
        for (let i = 0; i <= 10; i++) {
          const y = (canvas.height / 10) * i;
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(canvas.width, y);
          ctx.stroke();
        }
        
        // Calculate pulse effects based on real data and autopilot volume
        const queueIntensity = Math.min(queueSize / 10, 1); // Max intensity at 10+ videos
        const volumeIntensity = Math.min(autopilotVolume / 5, 1); // Max intensity at 5+ posts/day
        const runningGlow = autopilotRunning ? 0.3 : 0;
        const burstEffect = Date.now() - lastQueueUpdate < 5000 ? Math.sin(animationFrame * 0.5) * 0.5 : 0;
        
        // Enhanced wave intensity based on queue size and autopilot volume
        const baseAmplitude = 50;
        const combinedIntensity = Math.max(queueIntensity, volumeIntensity);
        const queueAmplitude = baseAmplitude * (0.5 + combinedIntensity * 0.5);
        const secondaryAmplitude = 30 * (0.5 + combinedIntensity * 0.5);
        
        // Draw animated line with dynamic intensity and speed based on volume
        const points = [];
        // Dynamic animation speed: 1/day = slow (0.05), 3+/day = fast (0.15)
        const baseSpeed = 0.05;
        const volumeSpeed = Math.min(autopilotVolume * 0.03, 0.1);
        const animationSpeed = baseSpeed + volumeSpeed;
        
        for (let i = 0; i <= 100; i++) {
          const x = (canvas.width / 100) * i;
          const y = canvas.height / 2 + 
                   Math.sin((i + animationFrame) * animationSpeed * 2) * queueAmplitude + 
                   Math.sin((i + animationFrame) * animationSpeed) * secondaryAmplitude;
          points.push({x, y});
        }
        
        // Add glow effect when autopilot is running
        if (autopilotRunning || burstEffect > 0) {
          const glowIntensity = runningGlow + Math.abs(burstEffect);
          ctx.shadowColor = platform === 'youtube' ? '#ff0000' : '#e1306c';
          ctx.shadowBlur = 20 * glowIntensity;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
        }
        
        // Platform-specific gradient with dynamic opacity based on volume
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
        const opacity = 0.8 + (combinedIntensity * 0.2) + runningGlow;
        
        if (platform === 'youtube') {
          gradient.addColorStop(0, `rgba(255, 0, 0, ${opacity})`);
          gradient.addColorStop(0.5, `rgba(255, 68, 68, ${opacity})`);
          gradient.addColorStop(1, `rgba(204, 0, 0, ${opacity})`);
        } else {
          gradient.addColorStop(0, `rgba(255, 68, 88, ${opacity})`);
          gradient.addColorStop(0.5, `rgba(225, 48, 108, ${opacity})`);
          gradient.addColorStop(1, `rgba(131, 58, 180, ${opacity})`);
        }
        
        ctx.strokeStyle = gradient;
        // Dynamic line width: 1/day = thin (2px), 3+/day = thick (7px)
        const baseLineWidth = 2;
        const volumeLineWidth = Math.min(autopilotVolume * 1.5, 5);
        ctx.lineWidth = baseLineWidth + volumeLineWidth + (combinedIntensity * 2);
        ctx.beginPath();
        
        points.forEach((point, index) => {
          if (index === 0) {
            ctx.moveTo(point.x, point.y);
          } else {
            ctx.lineTo(point.x, point.y);
          }
        });
        
        ctx.stroke();
        
        // Add particle burst effect for new content
        if (burstEffect > 0) {
          const particleCount = Math.floor(queueSize / 2) + 3;
          for (let p = 0; p < particleCount; p++) {
            const px = Math.random() * canvas.width;
            const py = Math.random() * canvas.height;
            const size = Math.random() * 3 + 1;
            
            ctx.fillStyle = `rgba(255, 255, 255, ${Math.abs(burstEffect) * 0.8})`;
            ctx.beginPath();
            ctx.arc(px, py, size, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        
        // Reset shadow for next frame
        ctx.shadowBlur = 0;
        
        animationFrame += 0.5;
        requestAnimationFrame(animate);
      };
      
      animate();
    };

    drawChart(instagramCanvasRef.current, 'instagram');
    drawChart(youtubeCanvasRef.current, 'youtube');
  }, [autopilotRunning, queueSize, lastQueueUpdate]);

  const switchPlatform = async (platform: string) => {
    try {
      console.log(`Switching to ${platform}`);
      setCurrentPlatform(platform);
      
      // ✅ Check if this platform is active in autopilot settings
      try {
        const settingsRes = await fetch('http://localhost:3002/api/settings');
        if (settingsRes.ok) {
          const settings = await settingsRes.json();
          const platformActive = settings.autopilotPlatforms?.[platform] !== false;
          
          if (!platformActive) {
            showNotification(`⚠️ ${platform.charAt(0).toUpperCase() + platform.slice(1)} is currently disabled in autopilot settings`, 'error');
          } else {
            showNotification(`📱 Switched to ${platform.charAt(0).toUpperCase() + platform.slice(1)}`);
          }
        } else {
          showNotification(`📱 Switched to ${platform.charAt(0).toUpperCase() + platform.slice(1)}`);
        }
      } catch (settingsError) {
        console.warn('Could not check platform settings:', settingsError);
        showNotification(`📱 Switched to ${platform.charAt(0).toUpperCase() + platform.slice(1)}`);
      }
    } catch (error) {
      console.error('Error switching platform:', error);
      showNotification('❌ Error switching platform', 'error');
    }
  };

  const toggleMenu = () => {
    try {
      setMenuOpen(!menuOpen);
    } catch (error) {
      console.error('Error toggling menu:', error);
    }
  };



  const handleMenuClick = (action: string) => {
    try {
      console.log('Menu action:', action);
      
      // Close menu first
      setMenuOpen(false);
      
      // Handle menu actions
      switch (action) {
        case 'upload':
          // Navigate to upload page
          window.location.href = '/upload';
          showNotification('📤 Opening Upload page...');
          break;

        case 'manual':
          // Navigate to manual post page
          window.location.href = '/manual';
          showNotification('✍️ Opening Manual Post page...');
          break;
        case 'autopilot-page':
          // Navigate to AutoPilot dashboard page
          window.location.href = '/autopilot';
          showNotification('🚀 Opening AutoPilot Dashboard...');
          break;
        case 'settings':
          // Navigate to settings page
          window.location.href = '/settings';
          showNotification('⚙️ Opening Settings...');
          break;
        default:
          console.warn('Unknown menu action:', action);
          showNotification('❌ Unknown action: ' + action, 'error');
          break;
      }
    } catch (error) {
      console.error('Error handling menu click:', error);
    }
  };

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    try {
      // Create a temporary notification
      const notification = document.createElement('div');
      const bgColor = type === 'error' ? 'rgba(239, 68, 68, 0.9)' : 
                     type === 'info' ? 'rgba(59, 130, 246, 0.9)' : 
                     'rgba(34, 197, 94, 0.9)';
      
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${bgColor};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 10px;
        z-index: 10000;
        backdrop-filter: blur(10px);
        animation: slideIn 0.3s ease;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        border: 1px solid rgba(255, 255, 255, 0.1);
        font-weight: 500;
        max-width: 300px;
      `;
      notification.textContent = message;
      
      document.body.appendChild(notification);
      
      // Remove notification after 3 seconds
      setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
          if (notification.parentNode) {
            notification.remove();
          }
        }, 300);
      }, 3000);
      
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  };

  const handleControlBtnClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    try {
      const parent = e.currentTarget.parentElement;
      if (parent) {
        const activeBtn = parent.querySelector('.control-btn.active');
        if (activeBtn) {
          activeBtn.classList.remove('active');
        }
        e.currentTarget.classList.add('active');
      }
      
      showNotification(`📊 Chart period changed to ${e.currentTarget.textContent}`);
    } catch (error) {
      console.error('Error handling control button click:', error);
    }
  };

  // Manual Post Now handler
  const handleManualPostNow = async () => {
    if (manualPostRunning) return; // Prevent double clicks
    
    setManualPostRunning(true);
    
    try {
      const response = await fetch(API_ENDPOINTS.autopilotManualPost(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const result = await response.json();
      
      if (result.success) {
        showNotification('✅ Posted successfully!', 'success');
        // Refresh data
        fetchAnalytics();
        fetchEnhancedActivity();
      } else {
        showNotification('❌ Post failed', 'error');
      }
    } catch (error) {
      showNotification('❌ Connection error', 'error');
    }
    
    // Reset button after 2 seconds
    setTimeout(() => {
      setManualPostRunning(false);
    }, 2000);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const menuContainer = document.querySelector('.menu-container');
      if (!menuContainer?.contains(e.target as Node) && menuOpen) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [menuOpen]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && menuOpen) {
        setMenuOpen(false);
      }
      if (e.key === '1' && e.ctrlKey) {
        e.preventDefault();
        switchPlatform('instagram');
      }
      if (e.key === '2' && e.ctrlKey) {
        e.preventDefault();
        switchPlatform('youtube');
      }
      if (e.key === 'u' && e.ctrlKey) {
        e.preventDefault();
        handleMenuClick('upload');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [menuOpen]);

  // ✅ NEW: Real-time notification checking (every 10 seconds) - DISABLED
  // useEffect(() => {
  //   if (!notificationHandler) return;
  //   
  //   // Initialize check timestamp only once
  //   setLastAutopilotCheck(prev => prev === 0 ? Date.now() - 60000 : prev);
  //   
  //   // More frequent notification checking
  //   const notificationInterval = setInterval(checkAutopilotNotifications, 10000);
  //   
  //   return () => clearInterval(notificationInterval);
  // }, [notificationHandler]);

  return (
    <div>
      <div className="floating-particles" ref={particlesRef}></div>
      <div className={`menu-overlay ${menuOpen ? 'show' : ''}`} onClick={() => setMenuOpen(false)}></div>
      
      {/* ✅ NEW: Real-time notifications for AutoPilot events - DISABLED */}
      {/* <NotificationSystem onShowNotification={handleNotificationSetup} /> */}
      
      <div className="dashboard-container">
        <header className="header">
          <div className="platform-switcher">
            <button 
              className={`platform-btn instagram ${currentPlatform === 'instagram' ? 'active' : ''}`}
              onClick={() => switchPlatform('instagram')}
            >
              📷 Instagram
            </button>
            <button 
              className={`platform-btn youtube ${currentPlatform === 'youtube' ? 'active' : ''}`}
              onClick={() => switchPlatform('youtube')}
            >
              ▶️ YouTube
            </button>
          </div>

          <div className="logo">Lifestyle Design Social</div>
          
          <div className="header-right">
            <div className="menu-container">
              <div className={`menu-btn ${menuOpen ? 'active' : ''}`} onClick={toggleMenu}>
                <span className="menu-icon">⋮</span>
              </div>
              <div className={`dropdown-menu ${menuOpen ? 'show' : ''}`}>
                <div className="menu-item" onClick={() => handleMenuClick('upload')}>
                  <div className="menu-item-icon">📤</div>
                  <span>Upload Videos</span>
                </div>

                <div className="menu-item" onClick={() => handleMenuClick('manual')}>
                  <div className="menu-item-icon">✍</div>
                  <span>Manual Post</span>
                </div>
                <div className="menu-item" onClick={() => handleMenuClick('autopilot-page')}>
                  <div className="menu-item-icon">🚀</div>
                  <span>AutoPilot Dashboard</span>
                </div>
                <div className="menu-item" onClick={() => handleMenuClick('settings')}>
                  <div className="menu-item-icon">⚙</div>
                  <span>Settings</span>
                </div>
              </div>
            </div>

            <div className="user-profile">
              <div className="avatar">SM</div>
              <div className="status-indicator"></div>
            </div>
          </div>
        </header>



        {/* Instagram Data */}
        <div id="instagram-data" className={`platform-data ${currentPlatform === 'instagram' ? 'active' : ''}`}>
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-header">
                <span className="metric-title">Followers</span>
                <div className="metric-icon">👥</div>
              </div>
              <div className="metric-value">{stats.instagram.followers}</div>
              <div className="metric-change change-positive">
                ↗ +5.2% this week
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-header">
                <span className="metric-title">Engagement Rate</span>
                <div className="metric-icon">❤️</div>
              </div>
              <div className="metric-value">{stats.instagram.engagement}</div>
              <div className="metric-change change-positive">
                ↗ +0.8% from last post
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-header">
                <span className="metric-title">Reach</span>
                <div className="metric-icon">📊</div>
              </div>
              <div className="metric-value">{stats.instagram.reach}</div>
              <div className="metric-change change-positive">
                ↗ +12.4% today
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-header">
                <span className="metric-title">Auto-Post Status</span>
                <div className={`auto-post-status ${autopilotStatus === 'error' ? 'inactive' : ''}`}>
                  <div className={`status-indicator ${autopilotStatus === 'running' ? 'pulsing' : ''}`}></div>
                  {autopilotStatus === 'running' ? 'Running...' :
                   autopilotStatus === 'success' ? 'Posted!' :
                   autopilotStatus === 'error' ? 'Failed' :
                   status.autopilot ? 'Active' : 'Inactive'}
                </div>
              </div>
              <div className="metric-value">{status.maxPosts}/day</div>
              <div className="metric-change">
                Next post at {status.postTime} (delay: {status.repostDelay}d)
              </div>
            </div>
          </div>

          <div className="grid-layout">
            {/* 🌊 Animated Wave Chart - Reactive to Autopilot Data */}
            <DashboardChart />
            
            {/* ❤️💗 Heart Indicators - Shows Instagram/YouTube Autopilot Status */}
            <HeartStatusCard />
          </div>

          {/* 🚀 Manual Post Control Panel */}
          <div className="manual-post-panel" style={{
            marginTop: '20px',
            display: 'flex',
            justifyContent: 'center',
            gap: '15px'
          }}>
            <button
              onClick={handleManualPostNow}
              disabled={manualPostRunning}
              className="manual-post-button"
              style={{
                backgroundColor: manualPostRunning ? '#666' : '#E1306C',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 24px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: manualPostRunning ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(225, 48, 108, 0.3)',
                transition: 'all 0.3s ease',
                opacity: manualPostRunning ? 0.6 : 1
              }}
              onMouseEnter={(e) => {
                if (!manualPostRunning) {
                  e.currentTarget.style.backgroundColor = '#C13584';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(225, 48, 108, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (!manualPostRunning) {
                  e.currentTarget.style.backgroundColor = '#E1306C';
                  e.currentTarget.style.transform = 'translateY(0px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(225, 48, 108, 0.3)';
                }
              }}
            >
              {manualPostRunning ? (
                <>
                  <span style={{ animation: 'spin 1s linear infinite' }}>⏳</span>
                  Posting...
                </>
              ) : (
                <>
                  ⚡ Post Now
                </>
              )}
            </button>
            

          </div>

          <div className="grid-layout">
            {/* ✅ Recent AutoPilot Posts Component - positioned under lines graph */}
            <RecentAutoPilotPostsWrapper platform="instagram" />
            <div></div>
          </div>
        </div>

        {/* YouTube Data */}
        <div id="youtube-data" className={`platform-data ${currentPlatform === 'youtube' ? 'active' : ''}`}>
          <div className="metrics-grid">
            <div className="metric-card youtube">
              <div className="metric-header">
                <span className="metric-title">Subscribers</span>
                <div className="metric-icon youtube">📺</div>
              </div>
              <div className="metric-value youtube">{stats.youtube.subscribers}</div>
              <div className="metric-change change-positive">
                ↗ +3.8% this month
              </div>
            </div>

            <div className="metric-card youtube">
              <div className="metric-header">
                <span className="metric-title">Watch Time</span>
                <div className="metric-icon youtube">⏱️</div>
              </div>
              <div className="metric-value youtube">{stats.youtube.watchTime}</div>
              <div className="metric-change change-positive">
                ↗ +15.7% hours this week
              </div>
            </div>

            <div className="metric-card youtube">
              <div className="metric-header">
                <span className="metric-title">Views</span>
                <div className="metric-icon youtube">👁️</div>
              </div>
              <div className="metric-value youtube">{stats.youtube.views}</div>
              <div className="metric-change change-positive">
                ↗ +8.3% this week
              </div>
            </div>

            <div className="metric-card youtube">
              <div className="metric-header">
                <span className="metric-title">Auto-Upload</span>
                <div className={`auto-post-status ${autopilotStatus === 'error' ? 'inactive' : ''}`}>
                  <div className={`status-indicator ${autopilotStatus === 'running' ? 'pulsing' : ''}`}></div>
                  {autopilotStatus === 'running' ? 'Running...' :
                   autopilotStatus === 'success' ? 'Posted!' :
                   autopilotStatus === 'error' ? 'Failed' :
                   status.autopilot ? 'Active' : 'Inactive'}
                </div>
              </div>
              <div className="metric-value youtube">{status.maxPosts}/day</div>
              <div className="metric-change">
                Next upload at {status.postTime} (delay: {status.repostDelay}d)
              </div>
            </div>
          </div>

          <div className="grid-layout">
            {/* 🌊 Animated Wave Chart - Reactive to Autopilot Data */}
            <DashboardChart />
            
            {/* ❤️💗 Heart Indicators - Shows Instagram/YouTube Autopilot Status */}
            <HeartStatusCard />
          </div>

          <div className="grid-layout">
            {/* ✅ Recent AutoPilot Posts Component - positioned under lines graph */}
            <RecentAutoPilotPostsWrapper platform="youtube" />
            <div></div>
          </div>
        </div>

        {/* ✨ Luxury Chart Descriptions */}
        <div className="chart-descriptions">
          <div className="description-container">
            <h3 className="description-title">Dashboard Analytics Overview</h3>
            
            <div className="description-grid">
              <div className="description-card">
                <div className="description-icon">🌊</div>
                <h4>Dynamic Wave Chart</h4>
                <p>Real-time engagement visualization with adaptive wave patterns. Wave amplitude reflects current engagement levels, while animation speed corresponds to posting volume. Glowing effects indicate new performance records.</p>
              </div>
              
              <div className="description-card">
                <div className="description-icon">📊</div>
                <h4>Platform Chart Lines</h4>
                <p>Interactive status indicators for Instagram (pink) and YouTube (red) autopilot systems. Bar height represents daily post volume configuration, with smooth animations reflecting platform activity and engagement.</p>
              </div>
            </div>
            
            <div className="description-legend">
              <div className="legend-item">
                <span className="legend-color pink"></span>
                <span>Instagram Autopilot</span>
              </div>
              <div className="legend-item">
                <span className="legend-color red"></span>
                <span>YouTube Autopilot</span>
              </div>
              <div className="legend-item">
                <span className="legend-glow"></span>
                <span>New Performance Record</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}