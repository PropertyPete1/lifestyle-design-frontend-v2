export async function fetchRecentPosts(platform: 'instagram' | 'youtube') {
  try {
    // ✅ Connect to backend API that filters MongoDB by platform
    const response = await fetch(`http://localhost:3002/api/activity/feed?platform=${platform}&limit=5`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch ${platform} posts: ${response.status}`);
    }
    
    const data = await response.json();
    
    // ✅ Transform data to ensure consistent format with thumbnails
    return data.map((post: any) => ({
      videoId: post.videoId || post.id || post._id,
      thumbnailUrl: post.thumbnail || post.thumbnailUrl || post.video_thumbnail,
      timestampFormatted: post.timestampFormatted || post.timestamp || formatTimestamp(post.createdAt || post.date),
      platform: platform,
      title: post.title || 'Untitled Post'
    }));
    
  } catch (error) {
    console.warn(`⚠️ Failed to fetch ${platform} posts:`, error);
    return []; // Return empty array on error to prevent crashes
  }
}

// ✅ Helper function to format timestamps consistently
function formatTimestamp(timestamp: string | number | Date): string {
  try {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  } catch {
    return 'Recently posted';
  }
}