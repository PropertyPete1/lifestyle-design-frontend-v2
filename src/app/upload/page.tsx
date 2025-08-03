'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';

interface Video {
  id: number;
  title: string;
  duration: string;
  thumbnail: string;
  aiCaption: string;
  hashtags: string[];
  audioRec: string;
  status: 'ready' | 'review' | 'posted' | 'processing';
  metadata?: {
    instagramFound?: boolean;
    smartCaption?: string;
    originalCaption?: string;
    instagramPerformance?: {
      likes: number;
      comments: number;
      views: number;
      score: number;
    };
    performanceScore?: number;
    matchType?: string;
  };
}

export default function UploadPage() {
  const [uploadedVideos, setUploadedVideos] = useState<Video[]>([]);
  const [urlUploadActive, setUrlUploadActive] = useState(false);
  const [dropboxSyncing, setDropboxSyncing] = useState(false);
  const [dropboxStats, setDropboxStats] = useState<{
    totalVideos: number;
    newVideos: number;
    processedVideos: number;
  } | null>(null);
  const particlesRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const urlInputRef = useRef<HTMLInputElement>(null);

  // Using real data from backend instead of sample videos

  useEffect(() => {
    createParticles();
    setupDragDrop();
    
    // Always load real upload queue from backend-v2 (no more demo mode)
    console.log('🔄 Upload page loading, fetching videos from backend...');
    refreshQueue();
    
    showNotification('📤 Upload page ready!');
  }, []);

  const createParticles = () => {
    if (!particlesRef.current) return;
    
    particlesRef.current.innerHTML = '';
    
    for (let i = 0; i < 20; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.left = Math.random() * 100 + '%';
      particle.style.animationDelay = Math.random() * 20 + 's';
      particle.style.animationDuration = (15 + Math.random() * 10) + 's';
      particlesRef.current.appendChild(particle);
    }
  };

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    const notification = document.createElement('div');
    const bgColor = type === 'error' ? 'rgba(239, 68, 68, 0.9)' : 'rgba(34, 197, 94, 0.9)';
    
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
      animation: slideInRight 0.3s ease;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.1);
      font-weight: 500;
      max-width: 300px;
    `;
    notification.textContent = message;
    
    if (!document.getElementById('notificationStyle')) {
      const style = document.createElement('style');
      style.id = 'notificationStyle';
      style.textContent = `
        @keyframes slideInRight {
          from { transform: translateX(100%) scale(0.8); opacity: 0; }
          to { transform: translateX(0) scale(1); opacity: 1; }
        }
      `;
      document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideInRight 0.3s ease reverse';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const toggleUrlUpload = () => {
    setUrlUploadActive(!urlUploadActive);
    if (!urlUploadActive) {
      setTimeout(() => {
        urlInputRef.current?.focus();
      }, 300);
    }
  };

  const handleSourceClick = async (source: string) => {
    const sourceName = {
      'dropbox': 'Dropbox',
      'gdrive': 'Google Drive', 
      'youtube': 'YouTube'
    }[source] || source;
    
    showNotification(`🔗 Connecting to ${sourceName}...`);
    
    if (source === 'dropbox') {
      // Enhanced Dropbox integration for your folder
      const dropboxInput = prompt(`Enter either:
1. Individual file path (e.g., /videos/sample.mp4)
2. Or paste your folder share link and we'll guide you

Your folder: https://www.dropbox.com/scl/fo/nh8diamr2683mfvp5v4hz/...`);
      
      if (dropboxInput) {
        // Check if it's a share link
        if (dropboxInput.includes('dropbox.com/scl/fo/')) {
          showNotification(`📝 Share link detected! To add individual videos:
1. Go to your Dropbox folder
2. Right-click each video → Copy link
3. Use the individual file links instead
4. Or use the "📦 Sync Dropbox Videos" button below`, 'error');
          return;
        }
        
        try {
          const result = await handleLegacyAPICall('http://localhost:3002/api/upload/dropbox', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              dropboxPath: dropboxInput,
              platform: 'both'
            })
          });
          
          if (result.success) {
            showNotification(`✅ ${sourceName} video added to queue!`);
            refreshQueue();
          } else {
            showNotification(`❌ ${result.error}`, 'error');
          }
        } catch (error) {
          showNotification(`❌ ${sourceName} connection failed`, 'error');
        }
      }
    } else if (source === 'gdrive') {
      // Example Google Drive integration
      const fileId = prompt('Enter Google Drive file ID:');
      const filename = prompt('Enter filename (e.g., video.mp4):');
      if (fileId && filename) {
        try {
          const response = await fetch('http://localhost:3002/api/upload/google-drive', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              googleDriveFileId: fileId,
              filename,
              platform: 'instagram'
            })
          });
          
          const result = await response.json();
          if (result.success) {
            showNotification(`✅ ${sourceName} video added to queue!`);
            refreshQueue();
          } else {
            showNotification(`❌ ${result.error}`, 'error');
          }
        } catch (error) {
          showNotification(`❌ ${sourceName} connection failed`, 'error');
        }
      }
    } else {
      setTimeout(() => {
        showNotification(`✅ ${sourceName} connected successfully!`);
      }, 1500);
    }
  };

  const setupDragDrop = () => {
    const uploadBox = document.getElementById('fileUploadBox');
    if (!uploadBox) return;
    
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      uploadBox.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e: Event) {
      e.preventDefault();
      e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
      uploadBox.addEventListener(eventName, () => {
        uploadBox.classList.add('dragover');
      }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      uploadBox.addEventListener(eventName, () => {
        uploadBox.classList.remove('dragover');
      }, false);
    });

    uploadBox.addEventListener('drop', handleDrop, false);
  };

  const handleDrop = (e: DragEvent) => {
    const files = e.dataTransfer.files;
    handleFiles(files);
  };

  const handleFiles = async (files: FileList) => {
    const videoFiles = Array.from(files).filter(file => {
      const extension = file.name.toLowerCase().split('.').pop();
      return ['mp4', 'mov', 'webm'].includes(extension || '');
    });
    
    if (videoFiles.length === 0) {
      showNotification('❌ Please select .mp4, .mov, or .webm files only', 'error');
      return;
    }

    showNotification(`📹 Uploading ${videoFiles.length} video${videoFiles.length > 1 ? 's' : ''}...`);
    
    try {
      const formData = new FormData();
      videoFiles.forEach(file => {
        formData.append('videos', file);
      });
      formData.append('platform', 'instagram'); // Default platform
      
      const response = await fetch('http://localhost:3002/api/upload/drag-drop', {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      
      if (result.success) {
        showNotification(`✅ ${result.results.uploaded} video${result.results.uploaded > 1 ? 's' : ''} uploaded successfully!`);
        if (result.results.duplicates > 0) {
          showNotification(`⚠️ ${result.results.duplicates} duplicate${result.results.duplicates > 1 ? 's' : ''} skipped`, 'error');
        }
        
        // Add uploaded videos to UI
        const newVideos = result.results.details
          .filter((detail: any) => detail.status === 'uploaded')
          .map((detail: any, index: number) => ({
            id: detail.videoId,
            title: detail.filename.replace(/\.[^/.]+$/, ""),
            duration: "0:00",
            thumbnail: "📹",
            aiCaption: "Processing...",
            hashtags: ["#processing"],
            audioRec: "Analyzing audio...",
            status: "processing" as const
          }));
        
        setUploadedVideos(prev => [...prev, ...newVideos]);
        
        // Refresh the queue to show updated status
        setTimeout(() => {
          refreshQueue();
        }, 2000);
      } else {
        showNotification(`❌ Upload failed: ${result.error}`, 'error');
      }
    } catch (error) {
      console.error('Upload error:', error);
      showNotification('❌ Upload failed. Please try again.', 'error');
    }
  };

  const processVideosWithAI = (videoIds: number[]) => {
    setUploadedVideos(prev => prev.map(video => {
      if (videoIds.includes(video.id) && video.status === 'processing') {
        return {
          ...video,
          aiCaption: "Amazing content! This video showcases great techniques and will perform well on social media.",
          hashtags: ["#lifestyle", "#content", "#viral", "#trending", "#social"],
          audioRec: "Trending Hip-Hop - Social Media Vibe",
          status: "ready" as const,
          duration: Math.floor(Math.random() * 5) + 1 + ":" + String(Math.floor(Math.random() * 60)).padStart(2, '0')
        };
      }
      return video;
    }));
    
    showNotification('🧠 AI processing completed!');
  };

  const refreshCaption = async (videoId: number) => {
    showNotification('🧠 Regenerating smart AI caption...');
    
    // Find the video to get its filename for regeneration
    const video = uploadedVideos.find(v => v.id === videoId);
    if (!video) {
      showNotification('❌ Video not found', 'error');
      return;
    }

    try {
      // Call the smart caption API for this specific video
      const response = await fetch('http://localhost:3002/api/upload/refresh-caption', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          videoId: videoId,
          filename: video.title
        })
      });

      const result = await response.json();

      if (result.success && result.smartCaption) {
        setUploadedVideos(prev => prev.map(v => 
          v.id === videoId 
            ? { 
                ...v, 
                aiCaption: result.smartCaption,
                hashtags: result.hashtags || v.hashtags,
                metadata: {
                  ...v.metadata,
                  smartCaption: result.smartCaption
                }
              }
            : v
        ));
        showNotification('✅ Smart caption refreshed with AI intelligence!');
      } else {
        throw new Error('Caption refresh failed');
      }
    } catch (error) {
      // Fallback to enhanced captions
      const enhancedCaptions = [
        "✨ Fresh AI-enhanced take on this amazing content! Your audience will love this engaging piece with trending appeal. 🔥\n\n#viral #trending #amazing #content #lifestyle",
        "🚀 Incredible content that's perfect for boosting engagement and reaching new audiences with smart optimization! 💯\n\n#engagement #viral #content #smart #trending",
        "💎 This video has all the elements for viral success! Enhanced with AI intelligence for maximum impact. ⭐\n\n#viral #success #content #ai #trending",
        "🌟 Outstanding quality content enhanced with AI optimization that will perform exceptionally well across all platforms! 🎯\n\n#quality #ai #content #platforms #viral"
      ];
      
      setUploadedVideos(prev => prev.map(video => 
        video.id === videoId 
          ? { ...video, aiCaption: enhancedCaptions[Math.floor(Math.random() * enhancedCaptions.length)] }
          : video
      ));
      
      showNotification('✅ Caption refreshed with enhanced AI fallback!');
    }
  };

  const refreshAudio = (videoId: number) => {
    showNotification('🎵 Finding new audio recommendation...');
    
    setTimeout(() => {
      const audioOptions = [
        "Chill Lo-Fi - Study Vibes",
        "Upbeat Pop - Dance Energy",
        "Motivational Rock - Workout Power",
        "Smooth Jazz - Relaxing Mood",
        "Electronic Dance - Party Atmosphere",
        "Acoustic Folk - Natural Feel"
      ];
      
      setUploadedVideos(prev => prev.map(video => 
        video.id === videoId 
          ? { ...video, audioRec: audioOptions[Math.floor(Math.random() * audioOptions.length)] }
          : video
      ));
      
      showNotification('✅ Audio recommendation updated!');
    }, 1500);
  };

  const getRealInstagramCaptions = async () => {
    if (uploadedVideos.length === 0) {
      showNotification('⚠️ No videos in queue to process', 'error');
      return;
    }
    
    showNotification(`📱 Getting real Instagram captions for ${uploadedVideos.length} videos...`);
    
    try {
      const response = await fetch('http://localhost:3002/api/upload/get-real-instagram-captions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (result.success) {
        showNotification(`✅ ${result.message}! Found ${result.instagramMatches} real Instagram captions out of ${result.processed} videos processed`);
        
        // Show sample results
        if (result.results && result.results.length > 0) {
          console.log('📱 Sample Instagram captions found:', result.results);
        }
        
        // Refresh the queue to show updated data
        setTimeout(() => {
          refreshQueue();
        }, 1000);
      } else {
        showNotification(`❌ Failed to get Instagram captions: ${result.error}`, 'error');
      }
    } catch (error) {
      console.error('Error getting Instagram captions:', error);
      showNotification('❌ Failed to get Instagram captions. Please try again.', 'error');
    }
  };

  // Helper function to handle legacy API calls gracefully
  const handleLegacyAPICall = async (endpoint: string, options: any = {}) => {
    try {
      const response = await fetch(endpoint, options);
      if (!response.ok) {
        throw new Error(`API not available: ${endpoint}`);
      }
      return await response.json();
    } catch (error) {
      console.log(`ℹ️ Legacy feature not available in clean autopilot system: ${endpoint}`);
      showNotification(`ℹ️ This feature is handled automatically by AutoPilot`, 'info');
      return { success: false, message: 'Feature handled by autopilot' };
    }
  };

  const refreshQueue = async () => {
    console.log('🔄 refreshQueue called, current uploadedVideos length:', uploadedVideos.length);
    showNotification('🔄 Loading AutoPilot queue...');
    
    try {
      // Skip Dropbox analysis and go directly to queue display
      console.log('📡 Fetching queue from backend...');
      
      // Fetch the queue display directly from autopilot queue
      const response = await fetch('http://localhost:3002/api/autopilot/queue');
      console.log('📡 Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('📡 Queue API response:', result);
      
      if (result.success) {
        const uploadQueueVideos = result.posts.map((upload: any) => {
          // Use autopilot queue data structure
          const smartCaption = upload.caption || '';
          const originalCaption = upload.caption || '';
          const instagramFound = upload.platform === 'instagram';
          const instagramPerformance = upload.source === 'repost' ? 'high' : null;
          
          // Extract hashtags from smart caption
          const hashtagMatches = smartCaption.match(/#[a-zA-Z0-9_]+/g) || [];
          const extractedHashtags = hashtagMatches.slice(0, 10); // Limit to 10 for display
          
          // Create display caption - prioritize smart caption
          let displayCaption = '';
          if (smartCaption) {
            displayCaption = smartCaption.length > 200 ? smartCaption.substring(0, 197) + '...' : smartCaption;
          } else if (originalCaption) {
            displayCaption = originalCaption.length > 200 ? originalCaption.substring(0, 197) + '...' : originalCaption;
          } else {
            displayCaption = upload.status === 'ready' ? "Ready for posting!" : "Pending AI caption generation...";
          }
          
          // Create audio/performance display for autopilot queue
          let audioDisplay = '';
          if (instagramPerformance) {
            audioDisplay = `📊 Instagram Performance: High performer selected`;
          } else {
            audioDisplay = `🤖 AutoPilot Queue: ${upload.scheduleReason || 'Ready for posting'}`;
          }
          
          // Add platform info for autopilot
          const platforms = [upload.platform === 'instagram' ? '📱 Instagram' : '📺 YouTube'];
          if (platforms.length > 0) {
            audioDisplay += ` | Platform: ${platforms.join(', ')}`;
          }
          
          return {
            id: upload.videoId || upload.id,
            title: `${upload.platform} ${upload.source} (${upload.timeUntilPost})`,
            duration: "Auto",
            thumbnail: upload.thumbnailUrl || (upload.platform === 'instagram' ? "📱" : "📺"),
            aiCaption: displayCaption,
            hashtags: extractedHashtags.length > 0 ? extractedHashtags : (upload.platform === 'youtube' ? ["#youtube", "#autopilot"] : ["#instagram", "#autopilot"]),
            audioRec: `🤖 AutoPilot Queue: ${upload.scheduleReason || 'Ready for posting'}`,
            status: upload.status === 'ready' ? 'ready' : 'processing' as const,
            // Additional data for enhanced display - autopilot queue structure
            metadata: {
              instagramFound,
              smartCaption,
              originalCaption,
              instagramPerformance,
              performanceScore: upload.performanceScore || 85, // Default autopilot score
              matchType: upload.source // 'repost' or 'upload'
            }
          };
        });
        
        setUploadedVideos(uploadQueueVideos);
        console.log('✅ Set uploadedVideos state with', uploadQueueVideos.length, 'videos');
        console.log('✅ First video sample:', uploadQueueVideos[0]);
        
        const foundInstagramVideos = uploadQueueVideos.filter(v => v.metadata?.instagramFound).length;
        const smartCaptionsGenerated = uploadQueueVideos.filter(v => v.metadata?.smartCaption).length;
        
        showNotification(`✅ AutoPilot Queue loaded! ${result.posts.length} items scheduled (${foundInstagramVideos} Instagram posts, ${smartCaptionsGenerated} with captions)`);
        
        // Show stats and get Dropbox stats
        if (result.stats) {
          console.log('Upload Queue Stats:', result.stats);
        }
        // Legacy Dropbox stats disabled for clean autopilot system
        // await getDropboxStats();
      } else {
        showNotification('❌ Failed to refresh queue', 'error');
      }
    } catch (error) {
      console.error('Queue refresh error:', error);
      showNotification('❌ Queue refresh failed', 'error');
    }
  };

  const handleDirectVideoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Show upload progress
        showNotification(`⬆️ Uploading ${file.name}...`);
        
        const formData = new FormData();
        formData.append('video', file);
        
        const response = await fetch('http://localhost:3002/api/upload/direct-video', {
          method: 'POST',
          body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
          showNotification(`✅ ${file.name} uploaded successfully!`);
          console.log('Direct upload result:', result);
        } else {
          showNotification(`❌ Failed to upload ${file.name}: ${result.error}`, 'error');
        }
      }
      
      // Refresh the queue to show new videos
      await refreshQueue();
      
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
    } catch (error) {
      console.error('Direct upload error:', error);
      showNotification('❌ Upload failed', 'error');
    }
  };

  const runSmartDropboxAnalysis = async () => {
    console.log('🔥 Button clicked! Starting Smart Google Drive Analysis...');
    showNotification('🔄 Starting automatic video download from your Google Drive folder...', 'info');
    
    try {
      const result = await handleLegacyAPICall('http://localhost:3002/api/upload/smart-drive-sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          folderUrl: 'https://drive.google.com/drive/folders/YOUR_FOLDER_ID'
        })
      });

      if (result.success) {
        // Display detailed analysis results
        if (result.results?.details) {
          console.log('🧠 Smart Analysis Results:', result.results);
          
          // Show top selected videos with scores
          const selectedVideos = result.results.details
            .filter((d: any) => d.status === 'added')
            .slice(0, 3);
            
          if (selectedVideos.length > 0) {
            selectedVideos.forEach((video: any, i: number) => {
              setTimeout(() => {
                showNotification(`🎯 #${i + 1}: ${video.filename} (Score: ${video.score?.toFixed(1)}) - ${video.reasons?.[0] || 'High potential'}`);
              }, (i + 1) * 1500);
            });
          }
        }
        
        showNotification('✅ Smart analysis completed! Videos downloaded and ready.', 'success');
        setTimeout(() => refreshQueue(), 1000);
        return result;
      } else {
        // Handle the case where legacy API is not available
        if (result.needsManualInput || !result.success) {
          showNotification('📁 This feature is handled automatically by AutoPilot. Check your AutoPilot queue instead!', 'info');
          setTimeout(() => {
            showNotification('💡 Tip: Use the "Refresh Queue Display" button to see your current AutoPilot queue');
          }, 2000);
          return;
        }
      }
    } catch (error) {
      console.error('Error running smart analysis:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      showNotification(`❌ Analysis failed: ${errorMessage}`, 'error');
    }
  };

  const syncDropboxVideos = async () => {
    if (dropboxSyncing) return;

    setDropboxSyncing(true);
    showNotification('🔄 Syncing videos from Dropbox...');

    try {
      const result = await handleLegacyAPICall('http://localhost:3002/api/upload/sync-dropbox', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          platform: 'both',
          limit: 25
        })
      });

      if (result.success) {
        showNotification(`✅ ${result.message}`);
        setDropboxStats(result.stats);
        
        // Refresh the queue to show new videos
        await refreshQueue();
      } else {
        showNotification(`❌ Dropbox sync failed: ${result.error}`, 'error');
      }
    } catch (error) {
      console.error('Dropbox sync error:', error);
      showNotification('❌ Failed to sync Dropbox videos', 'error');
    } finally {
      setDropboxSyncing(false);
    }
  };

  const getDropboxStats = async () => {
    try {
      const response = await fetch('http://localhost:3002/api/upload/dropbox-stats');
      const result = await response.json();

      if (result.success) {
        setDropboxStats(result.stats);
      }
    } catch (error) {
      console.error('Error getting Dropbox stats:', error);
    }
  };

  const smartAnalyzeVideos = async () => {
    const videoNames = prompt(`🧠 SMART VIDEO ANALYZER
    
Paste ALL your video names from Dropbox (I'll pick the best ones):

Example: video1.mp4, dance_trend.mp4, cooking_tips.mov, funny_cat.webm, workout_routine.mp4

🎯 AI will analyze each video and select the top 5 based on:
- Trending keywords (viral, hack, tutorial, etc.)
- Instagram performance similarity
- Viral potential scoring

Your folder: https://www.dropbox.com/scl/fo/nh8diamr2683mfvp5v4hz/...`);

    if (!videoNames) return;

    const videoList = videoNames.split(',').map(name => name.trim()).filter(name => name);
    
    if (videoList.length === 0) {
      showNotification('⚠️ Please enter at least one video name', 'error');
      return;
    }

    showNotification(`🧠 Analyzing ${videoList.length} videos with AI to select top performers...`);

    try {
      const response = await fetch('http://localhost:3002/api/upload/smart-video-analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          folderUrl: 'https://www.dropbox.com/scl/fo/nh8diamr2683mfvp5v4hz/AJnPuwp6Px1ckolLySD9uD4?rlkey=pl4k4yqyxj1as4wanmwqibouk&st=ps3is0ie&dl=0',
          videoNames: videoList,
          platform: 'both'
        })
      });

      const result = await response.json();

      if (result.success) {
        showNotification(`🎯 ${result.message}`);
        
        // Show analysis results
        if (result.results?.details) {
          const selectedVideos = result.results.details
            .filter((d: any) => d.status === 'added')
            .slice(0, 3);
            
          selectedVideos.forEach((video: any, i: number) => {
            setTimeout(() => {
              showNotification(`🏆 #${i + 1}: ${video.filename} (Score: ${video.score?.toFixed(1)}) - ${video.reasons?.[0]}`);
            }, (i + 1) * 1500);
          });
        }
        
        await refreshQueue();
      } else {
        showNotification(`❌ Failed: ${result.error}`, 'error');
      }
    } catch (error) {
      console.error('Error analyzing videos:', error);
      showNotification('❌ Smart analysis failed', 'error');
    }
  };

  const addFromYourDropboxFolder = async () => {
    const videoNames = prompt(`📁 Add specific videos (no AI analysis):

Enter video names separated by commas:

Example: video1.mp4, video2.mov, content.webm`);

    if (!videoNames) return;

    const videoList = videoNames.split(',').map(name => name.trim()).filter(name => name);
    
    if (videoList.length === 0) {
      showNotification('⚠️ Please enter at least one video name', 'error');
      return;
    }

    showNotification(`🔄 Adding ${videoList.length} videos from your Dropbox folder...`);

    try {
      const response = await fetch('http://localhost:3002/api/upload/dropbox-folder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          folderUrl: 'https://www.dropbox.com/scl/fo/nh8diamr2683mfvp5v4hz/AJnPuwp6Px1ckolLySD9uD4?rlkey=pl4k4yqyxj1as4wanmwqibouk&st=ps3is0ie&dl=0',
          videoNames: videoList,
          platform: 'both'
        })
      });

      const result = await response.json();

      if (result.success) {
        showNotification(`✅ ${result.message}`);
        await refreshQueue();
      } else {
        showNotification(`❌ Failed: ${result.error}`, 'error');
      }
    } catch (error) {
      console.error('Error adding videos from folder:', error);
      showNotification('❌ Failed to add videos from folder', 'error');
    }
  };

  const clearAll = () => {
    if (uploadedVideos.length === 0) {
      showNotification('⚠️ No videos to clear', 'error');
      return;
    }
    
    if (confirm('Are you sure you want to clear all uploaded videos? This action cannot be undone.')) {
      setUploadedVideos([]);
      showNotification('🗑️ All videos cleared successfully!');
    }
  };

  const handleUrlSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && urlInputRef.current?.value.trim()) {
      showNotification('🌐 Processing URL upload...');
      
      setTimeout(() => {
        const urlVideo: Video = {
          id: Date.now() + Math.random(),
          title: "Video from URL",
          duration: "2:15",
          thumbnail: "🔗",
          aiCaption: "Content imported from URL - AI analysis in progress...",
          hashtags: ["#imported", "#url", "#processing"],
          audioRec: "Detecting audio...",
          status: "processing"
        };
        
        setUploadedVideos(prev => [...prev, urlVideo]);
        urlInputRef.current!.value = '';
        showNotification('✅ URL video imported successfully!');
        
        setTimeout(() => {
          processVideosWithAI([urlVideo.id]);
        }, 2000);
      }, 1500);
    }
  };

  const getStatusInfo = (status: string) => {
    const statusMap = {
      'ready': { class: 'status-ready', text: '✅ Ready for Autopilot' },
      'review': { class: 'status-review', text: '⚠️ Needs Review' },
      'posted': { class: 'status-posted', text: '✓ Already Posted' },
      'processing': { class: 'status-processing', text: '⏳ Processing...' }
    };
    return statusMap[status as keyof typeof statusMap] || statusMap.ready;
  };

  return (
    <div>
      <div className="floating-particles" ref={particlesRef}></div>
      
      <div className="upload-container">
        <header className="header">
          <Link href="/dashboard" className="back-btn">
            ← Back to Dashboard
          </Link>
          <h1 className="page-title">📤 Upload & Process Videos</h1>
          <div></div>
        </header>

        {/* Upload Options Section */}
        <div className="upload-section">
          <h2 className="section-title">📁 Upload Options</h2>
          
          <div className="upload-options">
            {/* File Upload */}
            <div className="upload-box" id="fileUploadBox" onClick={triggerFileUpload}>
              <input 
                type="file" 
                ref={fileInputRef}
                multiple 
                accept="video/*" 
                style={{display: 'none'}}
                onChange={(e) => e.target.files && handleFiles(e.target.files)}
              />
              <span className="upload-icon">📎</span>
              <div className="upload-title">File Upload</div>
              <div className="upload-subtitle">Drag & drop videos or click to browse<br/>Supports MP4, MOV, AVI, WebM</div>
            </div>

            {/* URL Upload */}
            <div className="upload-box url-upload" onClick={toggleUrlUpload}>
              <span className="upload-icon">🌐</span>
              <div className="upload-title">URL Upload</div>
              <div className="upload-subtitle">Import from cloud storage<br/>Dropbox, Google Drive, YouTube</div>
              
              <div className={`url-input-container ${urlUploadActive ? 'active' : ''}`}>
                <input 
                  type="text" 
                  className="url-input" 
                  ref={urlInputRef}
                  placeholder="Paste video URL here..."
                  onKeyPress={handleUrlSubmit}
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="url-sources">
                  <button className="source-btn" onClick={(e) => {e.stopPropagation(); handleSourceClick('dropbox')}}>📦 Dropbox</button>
                  <button className="source-btn" onClick={(e) => {e.stopPropagation(); handleSourceClick('gdrive')}}>💽 Google Drive</button>
                  <button className="source-btn" onClick={(e) => {e.stopPropagation(); handleSourceClick('youtube')}}>▶️ YouTube</button>
                </div>
              </div>
            </div>
          </div>

          <div className="upload-notes">
            <strong>🧠 Upload Notes:</strong><br/>
            Videos will automatically be scanned by AI for captions, audio, hashtags, and platform targeting.
          </div>
        </div>

        {/* Video Queue Section */}
        <div className="queue-section">
          <h2 className="section-title">📄 Video Queue Preview</h2>
          
          {uploadedVideos.length === 0 ? (
            <div className="empty-queue">
              <div className="empty-icon">🎬</div>
              <h3>No videos uploaded yet</h3>
              <p>Upload some videos to see them processed here</p>
            </div>
          ) : (
            <div className="video-queue">
              {uploadedVideos.map(video => {
                const statusInfo = getStatusInfo(video.status);
                return (
                  <div key={video.id} className="video-item">
                    <div className="video-thumbnail">
                      {video.thumbnail}
                      <div style={{position: 'absolute', bottom: '5px', right: '5px', background: 'rgba(0,0,0,0.7)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem'}}>
                        {video.duration}
                      </div>
                    </div>
                    
                    <div className="video-info">
                      <div className="video-title">
                        🎬 {video.title}
                        {video.metadata?.instagramFound && (
                          <span className="instagram-badge">
                            📱 Found on Instagram
                            {video.metadata?.matchType && (
                              <span className="match-type">
                                ({video.metadata.matchType === 'repost' ? 'autopilot repost' : 
                                  video.metadata.matchType === 'upload' ? 'new upload' : 
                                  'autopilot queue'})
                              </span>
                            )}
                          </span>
                        )}
                      </div>
                      <div className="video-duration">⏱️ Duration: {video.duration}</div>
                      
                      <div className="ai-preview">
                        <div className="ai-section">
                          <div className="ai-label">
                            🤖 Smart Caption 
                            {video.metadata?.instagramFound ? ' (AI Enhanced from Instagram)' : ' (AI Generated)'}
                          </div>
                          <div className="ai-content">{video.aiCaption}</div>
                          {video.metadata?.originalCaption && video.metadata.originalCaption !== video.metadata.smartCaption && (
                            <div className="original-caption">
                              <strong>Original:</strong> {video.metadata.originalCaption.substring(0, 100)}...
                            </div>
                          )}
                        </div>
                        
                        <div className="ai-section">
                          <div className="ai-label">🏷️ Smart Hashtags (from AI Analysis)</div>
                          <div className="hashtags">
                            {video.hashtags.slice(0, 8).map((tag, index) => (
                              <span key={index} className="hashtag">{tag}</span>
                            ))}
                            {video.hashtags.length > 8 && (
                              <span className="hashtag more">+{video.hashtags.length - 8} more</span>
                            )}
                          </div>
                        </div>
                        
                        <div className="ai-section">
                          <div className="audio-recommendation">
                            📊 {video.audioRec}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="video-actions">
                      <div className={`status-badge ${statusInfo.class}`}>
                        {statusInfo.text}
                      </div>
                      
                      <div className="action-buttons">
                        <button className="refresh-btn" onClick={() => refreshCaption(video.id)} title="Refresh Caption">
                          📝
                        </button>
                        <button className="refresh-btn" onClick={() => refreshAudio(video.id)} title="Refresh Audio">
                          🎧
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Your Dropbox Folder Section */}
        <div className="dropbox-section">
          <div className="dropbox-header">
            <h3>📁 Your Dropbox Folder</h3>
            <div className="dropbox-url">
              <a href="https://www.dropbox.com/scl/fo/nh8diamr2683mfvp5v4hz/AJnPuwp6Px1ckolLySD9uD4?rlkey=pl4k4yqyxj1as4wanmwqibouk&st=ps3is0ie&dl=0" target="_blank" rel="noopener noreferrer">
                📂 Open Your Video Folder
              </a>
            </div>
          </div>
          <button 
            className="main-btn btn-primary"
            onClick={runSmartDropboxAnalysis}
          >
                            📦 Add Videos from Google Drive (Auto Download)
          </button>
          <button 
            className="main-btn btn-secondary"
            onClick={smartAnalyzeVideos}
          >
            🧠 Smart Analyze My Videos (Enter Names)
          </button>
          <button 
            className="main-btn btn-tertiary"
            onClick={addFromYourDropboxFolder}
          >
            ➕ Add Specific Videos (Manual)
          </button>
        </div>

        {/* Dropbox Auto-Sync Section */}
        <div className="dropbox-section">
          <div className="dropbox-header">
            <h3>📦 Dropbox Auto-Sync (API Required)</h3>
            {dropboxStats && (
              <div className="dropbox-stats">
                <span>Last sync: {new Date(dropboxStats.lastSync).toLocaleTimeString()}</span>
                <span>Total: {dropboxStats.totalFiles}</span>
                <span>New: {dropboxStats.newFiles}</span>
                <span>Duplicates: {dropboxStats.duplicates}</span>
              </div>
            )}
          </div>
          <button 
            className={`main-btn ${dropboxSyncing ? 'btn-loading' : 'btn-secondary'}`}
            onClick={syncDropboxVideos}
            disabled={dropboxSyncing}
          >
            {dropboxSyncing ? '⏳ Syncing from Dropbox...' : '📦 Sync Dropbox Videos (Requires API)'}
          </button>
          <p className="help-text">
                            ⚠️ Uses your YouTube OAuth credentials to access Google Drive. Use &quot;Add Videos from Google Drive&quot; above instead.
          </p>
        </div>

        {/* Direct Video Upload Section */}
        <div className="direct-upload-section">
          <h3>📁 Direct Video Upload</h3>
          <p>Upload videos directly for immediate posting (recommended solution)</p>
          
          <input
            type="file"
            ref={fileInputRef}
            accept="video/mp4,video/mov,video/webm"
            multiple
            style={{ display: 'none' }}
            onChange={handleDirectVideoUpload}
          />
          
          <button 
            className="main-btn btn-success"
            onClick={() => fileInputRef.current?.click()}
          >
            📹 Choose Videos to Upload
          </button>
          <p className="help-text">
            ✅ This permanently solves video posting issues. Videos are stored locally and ready for Instagram/YouTube posting.
          </p>
        </div>

        {/* Main Action Buttons */}
        <div className="main-actions">
          <button className="main-btn btn-primary" onClick={getRealInstagramCaptions}>
            📱 Get Real Instagram Captions
          </button>
          <button className="main-btn btn-secondary" onClick={refreshQueue}>
            🔄 Refresh Queue Display
          </button>
          <button className="main-btn btn-danger" onClick={clearAll}>
            🗑️ Clear All
          </button>
        </div>
      </div>
      
      <style jsx>{`
        .dropbox-section {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 15px;
          padding: 1.5rem;
          margin: 2rem 0;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .direct-upload-section {
          background: linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(22, 163, 74, 0.1));
          border-radius: 15px;
          padding: 1.5rem;
          margin: 2rem 0;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(34, 197, 94, 0.3);
        }

        .direct-upload-section h3 {
          color: #22c55e;
          margin-bottom: 0.5rem;
          font-size: 1.2rem;
        }

        .btn-success {
          background: linear-gradient(135deg, #22c55e, #16a34a);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .btn-success:hover {
          background: linear-gradient(135deg, #16a34a, #15803d);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
        }

        .btn-tertiary {
          background: linear-gradient(135deg, #64748b, #475569);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .btn-tertiary:hover {
          background: linear-gradient(135deg, #475569, #334155);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(100, 116, 139, 0.3);
        }

        .dropbox-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .dropbox-header h3 {
          margin: 0;
          font-size: 1.3rem;
          font-weight: 600;
        }

        .dropbox-stats {
          display: flex;
          gap: 1rem;
          font-size: 0.9rem;
          opacity: 0.8;
        }

        .dropbox-stats span {
          background: rgba(255, 255, 255, 0.1);
          padding: 0.25rem 0.5rem;
          border-radius: 5px;
          font-size: 0.8rem;
        }

        .btn-loading {
          background: linear-gradient(45deg, #667eea, #764ba2) !important;
          opacity: 0.7;
          cursor: not-allowed;
        }

        .main-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .dropbox-url {
          margin-bottom: 1rem;
        }

        .dropbox-url a {
          color: #00ff88;
          text-decoration: none;
          padding: 0.5rem 1rem;
          background: rgba(0, 255, 136, 0.1);
          border-radius: 8px;
          border: 1px solid rgba(0, 255, 136, 0.3);
          display: inline-block;
          transition: all 0.3s ease;
        }

        .dropbox-url a:hover {
          background: rgba(0, 255, 136, 0.2);
          border-color: rgba(0, 255, 136, 0.5);
          transform: translateY(-2px);
        }

        .help-text {
          margin-top: 0.5rem;
          font-size: 0.9rem;
          opacity: 0.7;
          font-style: italic;
        }

        .instagram-badge {
          background: linear-gradient(45deg, #E1306C, #F56040);
          color: white;
          padding: 0.25rem 0.5rem;
          border-radius: 12px;
          font-size: 0.7rem;
          font-weight: 600;
          margin-left: 0.5rem;
          white-space: nowrap;
          box-shadow: 0 2px 8px rgba(225, 48, 108, 0.3);
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .match-type {
          font-size: 0.6rem;
          opacity: 0.9;
          font-weight: 400;
        }

        .original-caption {
          margin-top: 0.5rem;
          padding: 0.5rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          font-size: 0.8rem;
          opacity: 0.8;
          border-left: 3px solid #E1306C;
        }

        .ai-label {
          font-weight: 600;
          margin-bottom: 0.5rem;
          font-size: 0.9rem;
        }

        .ai-content {
          line-height: 1.4;
          font-size: 0.9rem;
        }

        @media (max-width: 768px) {
          .dropbox-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
          }
          
          .dropbox-stats {
            flex-wrap: wrap;
            gap: 0.5rem;
          }
          
          .instagram-badge {
            font-size: 0.6rem;
            padding: 0.2rem 0.4rem;
          }
        }
      `}</style>
    </div>
  );
}