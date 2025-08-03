import React, { useState } from 'react';

type AutoPilotPost = {
  platform: 'Instagram' | 'YouTube';
  thumbnailUrl: string;
  timestamp: string;
};

const platformStyles = {
  Instagram: {
    borderColor: 'border-pink-600',
    icon: '/icons/ig-icon.svg',
    alt: 'Instagram',
  },
  YouTube: {
    borderColor: 'border-red-600',
    icon: '/icons/yt-icon.svg',
    alt: 'YouTube',
  },
};

const RecentAutoPilotPosts: React.FC<{ posts: AutoPilotPost[] }> = ({ posts = [] }) => {
  const [showRecent, setShowRecent] = useState(false);

  const toggleView = () => {
    setShowRecent(!showRecent);
  };

  return (
    <div className="activity-feed-compact">
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
        <h2 style={{fontSize: '1.25rem', fontWeight: '600', margin: 0}}>
          {showRecent ? 'Recent AutoPilot Posts' : 'Upcoming AutoPilot Posts'}
        </h2>
        <button 
          onClick={toggleView}
          style={{
            background: '#8B5CF6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            padding: '0.5rem 1rem',
            fontSize: '0.875rem',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          {showRecent ? 'Show Upcoming' : 'Show Recent'}
        </button>
      </div>
      
      {!showRecent ? (
        // Show upcoming posts (existing placeholder content)
        <>
          <div className="activity-item">
            <div className="activity-dot"></div>
            <div className="activity-content">
              <div className="activity-title">Post auto-published</div>
              <div className="activity-time">12 minutes ago</div>
            </div>
          </div>

          <div className="activity-item">
            <div className="activity-dot"></div>
            <div className="activity-content">
              <div className="activity-title">Story view milestone reached</div>
              <div className="activity-time">1 hour ago</div>
            </div>
          </div>

          <div className="activity-item">
            <div className="activity-dot"></div>
            <div className="activity-content">
              <div className="activity-title">New follower surge detected</div>
              <div className="activity-time">3 hours ago</div>
            </div>
          </div>

          <div className="activity-item">
            <div className="activity-dot"></div>
            <div className="activity-content">
              <div className="activity-title">Engagement goal achieved</div>
              <div className="activity-time">6 hours ago</div>
            </div>
          </div>
        </>
      ) : (
        // Show recent posts with thumbnails
        posts.length === 0 ? (
          <div className="activity-item">
            <div className="activity-dot"></div>
            <div className="activity-content">
              <div className="activity-title">No recent posts found</div>
              <div className="activity-time">Check back later</div>
            </div>
          </div>
        ) : (
          posts.map((post, index) => {
            const platformStyle = platformStyles[post.platform];
            return (
              <div key={`${post.platform}-${index}`} className="activity-item" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px',
                backgroundColor: '#0a0a0a',
                border: '1px solid #1f1f1f',
                borderRadius: '8px',
                marginBottom: '8px'
              }}>
                {/* Thumbnail */}
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  border: `2px solid ${post.platform === 'Instagram' ? '#e91e63' : '#f44336'}`,
                  flexShrink: 0
                }}>
                  <img 
                    src={post.thumbnailUrl} 
                    alt={`${post.platform} post thumbnail`}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/default-video.jpg';
                    }}
                  />
                </div>
                
                {/* Content */}
                <div style={{ flex: 1 }}>
                  <div style={{
                    color: '#fff',
                    fontSize: '14px',
                    fontWeight: '500',
                    marginBottom: '4px'
                  }}>
                    {post.platform} post published
                  </div>
                  <div style={{
                    color: '#888',
                    fontSize: '12px'
                  }}>
                    {post.timestamp}
                  </div>
                </div>
                
                {/* Platform Icon */}
                <div style={{
                  width: '24px',
                  height: '24px',
                  flexShrink: 0
                }}>
                  <img 
                    src={platformStyle.icon}
                    alt={platformStyle.alt}
                    style={{
                      width: '100%',
                      height: '100%',
                      filter: post.platform === 'Instagram' ? 'hue-rotate(320deg)' : 'hue-rotate(0deg)'
                    }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              </div>
            );
          })
        )
      )}
    </div>
  );
};

export default RecentAutoPilotPosts;