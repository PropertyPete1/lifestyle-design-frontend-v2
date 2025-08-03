'use client';

import { useState, useEffect, useCallback } from 'react';

interface InstagramPerformance {
  likes: number;
  comments: number;
  views: number;
  score: number;
}

interface VideoMetadata {
  instagramFound?: boolean;
  originalCaption?: string;
  smartCaption?: string;
  instagramPerformance?: InstagramPerformance;
  matchType?: string;
  realInstagramCaption?: string;
}

interface VideoStatus {
  status?: string;
  selectedCaption?: string;
  rewrittenCaptions?: {
    clickbait?: string;
    informational?: string;
    emotional?: string;
  };
}

interface Video {
  videoId: string;
  filename: string;
  source: string;
  status: string;
  filePath: string;
  createdAt: string;
  thumbnail: string;
  metadata?: VideoMetadata;
  videoStatus?: VideoStatus;
  recommendationLevel?: string;
  recommendationReason?: string;
  rankingScore?: number;
  isHighPerformance?: boolean;
}

export default function ManualPost() {
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [videoList, setVideoList] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlatform, setSelectedPlatform] = useState('instagram');
  const [captionText, setCaptionText] = useState('');
  const [audioName, setAudioName] = useState('Trending Beat #247');
  const [scheduleTime, setScheduleTime] = useState('');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [posting, setPosting] = useState(false);
  const [refreshingCaption, setRefreshingCaption] = useState(false);
  const [refreshingAudio, setRefreshingAudio] = useState(false);

  const loadVideos = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3002/api/manual/videos');
      
      if (!response.ok) {
        throw new Error('Failed to load videos');
      }

      const data = await response.json();
      if (data.success) {
        setVideoList(data.videos);
      } else {
        console.error('Failed to load videos:', data.error);
        showNotification('⚠️ Failed to load videos', 'error');
      }
    } catch (error) {
      console.error('Error loading videos:', error);
      showNotification('⚠️ Error loading videos', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Set default schedule time
    const now = new Date();
    now.setHours(13, 45, 0, 0);
    setScheduleTime(now.toISOString().slice(0, 16));

    // Create floating particles
    createParticles();

    // Load videos from backend
    loadVideos();
  }, [loadVideos]);

  const createParticles = () => {
    const particlesContainer = document.getElementById('particles');
    if (!particlesContainer) return;
    
    for (let i = 0; i < 20; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.left = Math.random() * 100 + '%';
      particle.style.animationDelay = Math.random() * 20 + 's';
      particle.style.animationDuration = (15 + Math.random() * 10) + 's';
      particlesContainer.appendChild(particle);
    }
  };

  const selectVideo = (video: Video) => {
          setSelectedVideo(video);
      
      // Load real Instagram caption when video is selected (prioritize Instagram data)
      const status = video.videoStatus;
      const realCaption = video.metadata?.realInstagramCaption || video.metadata?.smartCaption || status?.selectedCaption || '';
      setCaptionText(realCaption);
    
    // Set data from VideoStatus if available, otherwise from upload
    if (status) {
      setAudioName(status.currentAudio || 'Trending Beat #247');
      setHashtags(status.hashtags || []);
      setSelectedPlatform(status.platform || 'instagram');
    }
    
    showNotification(`📹 Selected: ${video.filename}`);
  };

  const selectPlatform = (platform: string) => {
    setSelectedPlatform(platform);
    const platformNames = {
      instagram: 'Instagram',
      youtube: 'YouTube',
      both: 'Both Platforms'
    };
    showNotification(`📌 Platform: ${platformNames[platform as keyof typeof platformNames]}`);
    
    // Update video settings
    updateVideoSettings({ platform });
  };

  const refreshAudio = async () => {
    if (!selectedVideo) return;
    
    setRefreshingAudio(true);
    try {
      const response = await fetch(`http://localhost:3002/api/manual/refresh-audio/${selectedVideo.videoId}`, {
        method: 'POST'
      });
      
      const data = await response.json();
      if (data.success) {
        setAudioName(data.currentAudio);
        showNotification(`🎵 Audio updated: ${data.currentAudio}`);
      } else {
        showNotification('⚠️ Failed to refresh audio', 'error');
      }
    } catch (error) {
      console.error('Error refreshing audio:', error);
      showNotification('⚠️ Error refreshing audio', 'error');
    } finally {
      setRefreshingAudio(false);
    }
  };

  const refreshCaption = async () => {
    if (!selectedVideo) return;
    
    setRefreshingCaption(true);
    try {
      const response = await fetch(`http://localhost:3002/api/manual/refresh-caption/${selectedVideo.videoId}`, {
        method: 'POST'
      });
      
      const data = await response.json();
      if (data.success) {
        setCaptionText(data.captions.clickbait);
        showNotification('✨ Caption refreshed with AI!');
      } else {
        showNotification('⚠️ Failed to refresh caption', 'error');
      }
    } catch (error) {
      console.error('Error refreshing caption:', error);
      showNotification('⚠️ Error refreshing caption', 'error');
    } finally {
      setRefreshingCaption(false);
    }
  };

  const updateVideoSettings = async (updates: Partial<VideoStatus>) => {
    if (!selectedVideo) return;
    
    try {
      const response = await fetch(`http://localhost:3002/api/manual/videos/${selectedVideo.videoId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          selectedCaption: captionText,
          hashtags,
          currentAudio: audioName,
          platform: selectedPlatform,
          scheduledTime: scheduleTime,
          ...updates
        })
      });
      
      if (!response.ok) {
        console.error('Failed to update video settings');
      }
    } catch (error) {
      console.error('Error updating video settings:', error);
    }
  };

  const removeHashtag = (index: number) => {
    const newHashtags = hashtags.filter((_, i) => i !== index);
    setHashtags(newHashtags);
    updateVideoSettings({ hashtags: newHashtags });
    showNotification(`🏷️ Hashtag removed`);
  };

  const postNow = async () => {
    if (!selectedVideo) {
      showNotification('⚠️ Please select a video first!', 'error');
      return;
    }

    setPosting(true);
    try {
      // Update video settings first
      await updateVideoSettings({});
      
      const response = await fetch(`http://localhost:3002/api/manual/post-now/${selectedVideo.videoId}`, {
        method: 'POST'
      });
      
      const data = await response.json();
      if (data.success) {
        showNotification(`🚀 Successfully posted to ${data.posted.length} platform(s)!`, 'success');
        
        // Reload videos to update status
        await loadVideos();
      } else {
        showNotification(`⚠️ Posting failed: ${data.message}`, 'error');
      }
    } catch (error) {
      console.error('Error posting video:', error);
      showNotification('⚠️ Error posting video', 'error');
    } finally {
      setPosting(false);
    }
  };

  const schedulePost = async () => {
    if (!selectedVideo) {
      showNotification('⚠️ Please select a video first!', 'error');
      return;
    }

    if (!scheduleTime) {
      showNotification('⚠️ Please select a schedule time!', 'error');
      return;
    }

    try {
      const response = await fetch(`http://localhost:3002/api/manual/schedule/${selectedVideo.videoId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          scheduledTime: scheduleTime
        })
      });
      
      const data = await response.json();
      if (data.success) {
        showNotification(`📅 Video scheduled successfully!`, 'success');
        
        // Reload videos to update status
        await loadVideos();
      } else {
        showNotification(`⚠️ Scheduling failed: ${data.error}`, 'error');
      }
    } catch (error) {
      console.error('Error scheduling video:', error);
      showNotification('⚠️ Error scheduling video', 'error');
    }
  };

  const goBack = () => {
    window.location.href = '/dashboard';
  };

  const showNotification = (message: string, type: string = 'success') => {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.style.background = type === 'error' ? 'rgba(239, 68, 68, 0.9)' : 'rgba(34, 197, 94, 0.9)';
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  };

  return (
    <div>
      <div className="floating-particles" id="particles"></div>
      
      <div className="container">
        <header className="header">
          <button className="back-btn" onClick={goBack}>
            🔙 Back to Dashboard
          </button>
          <h1 className="page-title">Manual Post Creator</h1>
        </header>

        <section className="video-queue-section">
          <h2 className="section-title">
            🎬 Select a Video to Post
          </h2>
          
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner">⏳</div>
              <p>Loading videos...</p>
            </div>
          ) : videoList.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📹</div>
              <p>No videos uploaded yet</p>
              <p>Upload videos in the Upload section first</p>
            </div>
          ) : (
            <div className="video-grid">
              {videoList.map((video) => (
                <div 
                  key={video.videoId}
                  className={`video-card ${selectedVideo?.videoId === video.videoId ? 'selected' : ''}`}
                  onClick={() => selectVideo(video)}
                >
                  <div className="video-thumbnail">
                    <div style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#1a1a1a',
                      borderRadius: '10px',
                      color: 'white',
                      padding: '10px',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '24px', marginBottom: '8px' }}>🎥</div>
                      <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
                        {video.filename.substring(0, 25)}
                        {video.filename.length > 25 ? '...' : ''}
                      </div>
                      <div style={{ 
                        fontSize: '10px', 
                        backgroundColor: video.source === 'direct_upload' ? '#22c55e' : '#ef4444',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        marginBottom: '4px'
                      }}>
                        {video.source === 'direct_upload' ? '✅ Ready' : '⚠️ ' + video.source}
                      </div>
                      {video.metadata?.instagramPerformance?.score && (
                        <div style={{ fontSize: '10px', color: '#fbbf24' }}>
                          📊 Score: {Math.round(video.metadata.instagramPerformance.score)}
                        </div>
                      )}
                    </div>
                    <div style={{
                      display: 'none',
                      width: '100%',
                      height: '100%',
                      backgroundColor: '#1a1a1a',
                      borderRadius: '10px',
                      color: 'white',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      textAlign: 'center'
                    }}>
                      📹 {video.filename.substring(0, 15)}...
                    </div>
                    <div 
                      className="video-thumbnail-fallback"
                      style={{
                        display: 'none',
                        fontSize: '4rem',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '100%',
                        height: '100%'
                      }}
                    >
                      {video.thumbnail}
                    </div>
                    {/* <div className="play-overlay">▶️</div> */}
                    <div className="video-duration">
                      {video.videoStatus?.status === 'posted' ? '✅' : 
                       video.videoStatus?.status === 'scheduled' ? '📅' : 
                       video.videoStatus?.status === 'failed' ? '❌' : '⏳'}
                    </div>
                  </div>
                  <div className="video-info">
                    <div className="video-title">
                      {video.filename}
                      {video.metadata?.instagramFound && (
                        <span className="instagram-badge" title={`Found on Instagram (${video.metadata?.matchType})`}>
                          📱 IG
                        </span>
                      )}
                      {video.recommendationLevel === 'highly_recommended' && (
                        <span className="recommendation-badge high" title={video.recommendationReason}>
                          🚀 TOP
                        </span>
                      )}
                      {video.recommendationLevel === 'recommended' && (
                        <span className="recommendation-badge recommended" title={video.recommendationReason}>
                          ⭐ REC
                        </span>
                      )}
                      {video.instagramViews >= 10000 && (
                        <span className="views-badge" title={`${video.instagramViews.toLocaleString()} Instagram views`}>
                          👁️ {video.instagramViews >= 1000000 ? `${(video.instagramViews/1000000).toFixed(1)}M` : `${(video.instagramViews/1000).toFixed(0)}K`}
                        </span>
                      )}
                    </div>
                    <div className="video-caption">
                      {video.metadata?.realInstagramCaption || video.metadata?.smartCaption || video.videoStatus?.selectedCaption || 'No caption yet'}
                    </div>
                  </div>
                  <div className="video-meta">
                    <div className="trending-audio">
                      🎧 {video.videoStatus?.currentAudio || 'No audio'}
                    </div>
                    <div className="platform-selector">
                      <span className={`platform-tag ${video.platform}`}>
                        {video.platform === 'instagram' ? '📷 IG' : 
                         video.platform === 'youtube' ? '▶️ YT' : '🌐 Both'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {selectedVideo && (
          <section className="editor-panel show">
            <h2 className="section-title">
              🛠️ Manual Editor Panel
            </h2>
            
            <div className="editor-grid">
              <div className="video-preview">
                <h3 className="form-label">📽️ Video Preview</h3>
                <div className="preview-video">
                  <img 
                    src={`http://localhost:3002/api/manual/video/${selectedVideo.videoId}/stream`}
                    alt={`Preview for ${selectedVideo.filename}`}
                    style={{
                      width: '100%',
                      height: '200px',
                      objectFit: 'cover',
                      borderRadius: '10px',
                      backgroundColor: '#000'
                    }}
                    onError={(e) => {
                      // Silently fallback to emoji preview - this is expected for Dropbox videos  
                      const imgElement = e.currentTarget as HTMLImageElement;
                      const fallbackElement = imgElement.nextElementSibling as HTMLElement;
                      imgElement.style.display = 'none';
                      if (fallbackElement) {
                        fallbackElement.style.display = 'flex';
                      }
                    }}
                  />
                  <div 
                    className="video-fallback"
                    style={{
                      display: 'none',
                      fontSize: '4rem',
                      height: '200px',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '10px'
                    }}
                  >
                    {selectedVideo.thumbnail}
                    <div className="play-overlay" style={{position: 'absolute', bottom: '10px', right: '10px'}}>▶️</div>
                  </div>
                </div>
                <div className="video-title">{selectedVideo.filename}</div>
                <div className="video-status">
                  Status: {selectedVideo.videoStatus?.status || 'draft'}
                </div>
              </div>

              <div className="editor-form">
                <div className="form-group">
                  <div className="form-label-with-action">
                    <label className="form-label">✍️ Caption</label>
                    <button 
                      className="refresh-btn"
                      onClick={refreshCaption}
                      disabled={refreshingCaption}
                    >
                      {refreshingCaption ? '⏳' : '🔄'} Refresh AI
                    </button>
                  </div>
                  <textarea 
                    className="form-textarea" 
                    value={captionText}
                    onChange={(e) => {
                      setCaptionText(e.target.value);
                      updateVideoSettings({ selectedCaption: e.target.value });
                    }}
                    placeholder="Write your caption here..."
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">🏷️ Hashtags (30 auto-filled)</label>
                  <div className="hashtags-container">
                    {hashtags.map((hashtag, index) => (
                      <div key={index} className="hashtag">
                        {hashtag}
                        <span className="hashtag-remove" onClick={() => removeHashtag(index)}>×</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">🎶 Trending Audio</label>
                  <div className="audio-selector">
                    <div className="audio-info">
                      <div className="audio-wave">🎵</div>
                      <span>{audioName}</span>
                    </div>
                    <button 
                      className="refresh-btn" 
                      onClick={refreshAudio}
                      disabled={refreshingAudio}
                    >
                      {refreshingAudio ? '⏳' : '🔁'}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">📌 Platform Selector</label>
                  <div className="platform-selector">
                    <button 
                      className={`platform-tag instagram ${selectedPlatform === 'instagram' ? 'active' : ''}`}
                      onClick={() => selectPlatform('instagram')}
                    >
                      📷 IG
                    </button>
                    <button 
                      className={`platform-tag youtube ${selectedPlatform === 'youtube' ? 'active' : ''}`}
                      onClick={() => selectPlatform('youtube')}
                    >
                      ▶️ YT
                    </button>
                    <button 
                      className={`platform-tag both ${selectedPlatform === 'both' ? 'active' : ''}`}
                      onClick={() => selectPlatform('both')}
                    >
                      🌐 Both
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">⏰ Schedule Time</label>
                  <div className="time-picker-container">
                    <input 
                      type="datetime-local" 
                      className="time-picker"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                    />
                    <div className="peak-hour-suggestion">
                      🧠 Recommended post time: 1:45 PM
                    </div>
                  </div>
                </div>

                <div className="action-buttons">
                  <button 
                    className="action-btn post-now-btn" 
                    onClick={postNow}
                    disabled={posting}
                  >
                    {posting ? '⏳ Posting...' : '🚀 Post Now'}
                  </button>
                  <button className="action-btn schedule-btn" onClick={schedulePost}>
                    📅 Schedule for Later
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>

      <style jsx>{`
        .loading-state, .empty-state {
          text-align: center;
          padding: 3rem;
          color: #666;
        }

        .loading-spinner {
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        .empty-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
        }

        .form-label-with-action {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        .video-status {
          margin-top: 0.5rem;
          padding: 0.25rem 0.5rem;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          font-size: 0.8rem;
          text-transform: capitalize;
        }

        .refresh-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .action-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* Existing styles continue unchanged... */
        .container {
          min-height: 100vh;
          background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%);
          color: white;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          position: relative;
          overflow-x: hidden;
        }

        .floating-particles {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 1;
        }

        .floating-particles :global(.particle) {
          position: absolute;
          width: 4px;
          height: 4px;
          background: rgba(255, 255, 255, 0.6);
          border-radius: 50%;
          animation: float 20s infinite linear;
        }

        @keyframes float {
          0% {
            transform: translateY(100vh) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(-100px) rotate(360deg);
            opacity: 0;
          }
        }

        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 2rem;
          position: relative;
          z-index: 10;
        }

        .back-btn {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 25px;
          color: white;
          cursor: pointer;
          font-size: 1rem;
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
        }

        .back-btn:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: translateY(-2px);
        }

        .page-title {
          font-size: 2.5rem;
          font-weight: 700;
          margin: 0;
          text-align: center;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
        }

        .video-queue-section {
          padding: 0 2rem 2rem;
          position: relative;
          z-index: 10;
        }

        .section-title {
          font-size: 1.8rem;
          font-weight: 600;
          margin-bottom: 1.5rem;
          text-align: center;
          text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
        }

        .video-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .video-card {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 15px;
          padding: 1.5rem;
          cursor: pointer;
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
          border: 2px solid transparent;
        }

        .video-card:hover {
          transform: translateY(-5px);
          background: rgba(255, 255, 255, 0.15);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        }

        .video-card.selected {
          border-color: #00ff88;
          background: rgba(0, 255, 136, 0.1);
          box-shadow: 0 0 20px rgba(0, 255, 136, 0.3);
        }

        .video-thumbnail {
          position: relative;
          font-size: 4rem;
          text-align: center;
          margin-bottom: 1rem;
          height: 100px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }

        .play-overlay {
          position: absolute;
          bottom: 5px;
          right: 5px;
          font-size: 1.5rem;
          opacity: 0.8;
        }

        .video-duration {
          position: absolute;
          top: 5px;
          right: 5px;
          background: rgba(0, 0, 0, 0.7);
          padding: 0.25rem 0.5rem;
          border-radius: 5px;
          font-size: 0.8rem;
        }

        .video-title {
          font-weight: 600;
          font-size: 1.1rem;
          margin-bottom: 0.5rem;
        }

        .video-caption {
          font-size: 0.9rem;
          opacity: 0.9;
          line-height: 1.4;
          margin-bottom: 1rem;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .video-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .trending-audio {
          display: flex;
          align-items: center;
          font-size: 0.9rem;
          opacity: 0.9;
        }

        .platform-selector {
          display: flex;
          gap: 0.5rem;
        }

        .platform-tag {
          padding: 0.25rem 0.5rem;
          border-radius: 5px;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .platform-tag.instagram {
          background: linear-gradient(45deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%);
        }

        .platform-tag.youtube {
          background: #ff0000;
        }

        .platform-tag.both {
          background: linear-gradient(45deg, #ff0000 50%, #f09433 50%);
        }

        .editor-panel {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          margin: 2rem;
          padding: 2rem;
          backdrop-filter: blur(15px);
          opacity: 0;
          transform: translateY(30px);
          transition: all 0.5s ease;
          position: relative;
          z-index: 10;
        }

        .editor-panel.show {
          opacity: 1;
          transform: translateY(0);
        }

        .editor-grid {
          display: grid;
          grid-template-columns: 1fr 2fr;
          gap: 3rem;
          margin-top: 2rem;
        }

        .video-preview {
          text-align: center;
        }

        .preview-video {
          position: relative;
          font-size: 6rem;
          height: 200px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 15px;
          margin-bottom: 1rem;
        }

        .form-group {
          margin-bottom: 2rem;
        }

        .form-label {
          display: block;
          font-weight: 600;
          margin-bottom: 0.5rem;
          font-size: 1.1rem;
        }

        .form-textarea {
          width: 100%;
          min-height: 120px;
          padding: 1rem;
          border: none;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.1);
          color: white;
          font-size: 1rem;
          resize: vertical;
          backdrop-filter: blur(10px);
        }

        .form-textarea::placeholder {
          color: rgba(255, 255, 255, 0.6);
        }

        .hashtags-container {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          max-height: 120px;
          overflow-y: auto;
        }

        .hashtag {
          background: rgba(255, 255, 255, 0.2);
          padding: 0.25rem 0.5rem;
          border-radius: 15px;
          font-size: 0.9rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .hashtag-remove {
          cursor: pointer;
          font-weight: bold;
          opacity: 0.7;
        }

        .hashtag-remove:hover {
          opacity: 1;
        }

        .audio-selector {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(255, 255, 255, 0.1);
          padding: 1rem;
          border-radius: 10px;
          backdrop-filter: blur(10px);
        }

        .audio-info {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .audio-wave {
          font-size: 1.5rem;
        }

        .refresh-btn {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          padding: 0.5rem;
          border-radius: 50%;
          color: white;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .refresh-btn:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: rotate(180deg);
        }

        .platform-selector button {
          flex: 1;
          padding: 0.75rem;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s ease;
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }

        .platform-selector button.active {
          background: #00ff88;
          color: #000;
        }

        .time-picker-container {
          position: relative;
        }

        .time-picker {
          width: 100%;
          padding: 1rem;
          border: none;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.1);
          color: white;
          font-size: 1rem;
          backdrop-filter: blur(10px);
        }

        .peak-hour-suggestion {
          margin-top: 0.5rem;
          font-size: 0.9rem;
          opacity: 0.8;
          font-style: italic;
        }

        .action-buttons {
          display: flex;
          gap: 1rem;
          margin-top: 2rem;
        }

        .action-btn {
          flex: 1;
          padding: 1rem 2rem;
          border: none;
          border-radius: 15px;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .post-now-btn {
          background: linear-gradient(45deg, #00ff88, #00cc6a);
          color: #000;
        }

        .post-now-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(0, 255, 136, 0.3);
        }

        .schedule-btn {
          background: linear-gradient(45deg, #667eea, #764ba2);
          color: white;
        }

        .schedule-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(102, 126, 234, 0.3);
        }

        :global(.notification) {
          position: fixed;
          top: 20px;
          right: 20px;
          background: rgba(34, 197, 94, 0.9);
          color: white;
          padding: 1rem 1.5rem;
          border-radius: 10px;
          font-weight: 600;
          z-index: 1000;
          backdrop-filter: blur(10px);
          animation: slideIn 0.3s ease;
        }

        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @media (max-width: 768px) {
          .editor-grid {
            grid-template-columns: 1fr;
            gap: 2rem;
          }
          
          .action-buttons {
            flex-direction: column;
          }
          
          .video-grid {
            grid-template-columns: 1fr;
          }
        }
        
        .video-title {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .instagram-badge {
          background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%);
          color: white;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: bold;
          white-space: nowrap;
        }
      `}</style>
    </div>
  );
}