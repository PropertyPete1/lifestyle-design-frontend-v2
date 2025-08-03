// ✅ /frontend-v2/src/components/S3ThumbnailGallery.tsx - S3 Dashboard Preview Gallery

import React, { useState, useEffect } from 'react';

interface Thumbnail {
  key: string;
  url: string;
  lastModified: string;
  size: number;
  platform: string;
}

interface S3ThumbnailGalleryProps {
  platform?: 'instagram' | 'youtube' | 'autopilot' | 'all';
  limit?: number;
  className?: string;
}

const S3ThumbnailGallery: React.FC<S3ThumbnailGalleryProps> = ({ 
  platform = 'all', 
  limit = 20,
  className = '' 
}) => {
  const [thumbnails, setThumbnails] = useState<Thumbnail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchThumbnails();
  }, [platform, limit]);

  const fetchThumbnails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const endpoint = platform === 'all' 
        ? '/api/thumbnails/list'
        : `/api/thumbnails/recent/${platform}?limit=${limit}`;
      
      const response = await fetch(`http://localhost:3002${endpoint}`);
      const data = await response.json();
      
      if (data.success) {
        setThumbnails(data.thumbnails || []);
      } else {
        setError(data.error || 'Failed to fetch thumbnails');
      }
    } catch (err) {
      setError('Network error fetching thumbnails');
      console.error('Thumbnail fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'instagram': return 'bg-pink-500';
      case 'youtube': return 'bg-red-500';
      case 'autopilot': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getPlatformEmoji = (platform: string) => {
    switch (platform) {
      case 'instagram': return '📷';
      case 'youtube': return '▶️';
      case 'autopilot': return '🤖';
      default: return '📸';
    }
  };

  if (loading) {
    return (
      <div className={`s3-thumbnail-gallery ${className}`}>
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading thumbnails...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`s3-thumbnail-gallery ${className}`}>
        <div className="text-center p-8">
          <div className="text-red-600 mb-2">❌ {error}</div>
          <button 
            onClick={fetchThumbnails}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (thumbnails.length === 0) {
    return (
      <div className={`s3-thumbnail-gallery ${className}`}>
        <div className="text-center p-8 text-gray-500">
          📸 No thumbnails found for {platform === 'all' ? 'any platform' : platform}
        </div>
      </div>
    );
  }

  return (
    <div className={`s3-thumbnail-gallery ${className}`}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
          📸 S3 Thumbnail Previews 
          {platform !== 'all' && (
            <span className="ml-2 text-sm text-gray-600">
              ({platform} • {thumbnails.length} items)
            </span>
          )}
        </h3>
        <button 
          onClick={fetchThumbnails}
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          🔄 Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {thumbnails.map((thumbnail, index) => (
          <div 
            key={thumbnail.key || index}
            className="relative group bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
          >
            {/* Platform Badge */}
            <div className={`absolute top-2 left-2 z-10 px-2 py-1 rounded text-xs text-white ${getPlatformColor(thumbnail.platform)}`}>
              {getPlatformEmoji(thumbnail.platform)} {thumbnail.platform}
            </div>

            {/* Thumbnail Image */}
            <div className="aspect-video bg-gray-100 dark:bg-gray-700">
              <img
                src={thumbnail.url}
                alt={`${thumbnail.platform} thumbnail`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDIwMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIxMjAiIGZpbGw9IiNGMEYwRjAiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzk5OTk5OSI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+';
                }}
                loading="lazy"
              />
            </div>

            {/* Thumbnail Info */}
            <div className="p-2">
              <div className="text-xs text-gray-500 truncate">
                {new Date(thumbnail.lastModified).toLocaleDateString()}
              </div>
              <div className="text-xs text-gray-400">
                {(thumbnail.size / 1024).toFixed(1)} KB
              </div>
            </div>

            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <a 
                  href={thumbnail.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="px-3 py-1 bg-white text-black rounded text-sm hover:bg-gray-100"
                >
                  🔍 View Full
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {thumbnails.length >= limit && (
        <div className="mt-4 text-center">
          <div className="text-sm text-gray-500">
            Showing {thumbnails.length} of many thumbnails
          </div>
        </div>
      )}
    </div>
  );
};

export default S3ThumbnailGallery;