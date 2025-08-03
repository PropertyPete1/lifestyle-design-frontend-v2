import React, { useEffect, useState } from 'react';
import RecentAutoPilotPosts from './RecentAutoPilotPosts';
import { fetchRecentPosts } from '@/utils/fetchRecentPosts';

type AutoPilotPost = {
  platform: 'Instagram' | 'YouTube';
  thumbnailUrl: string;
  timestamp: string;
};

const RecentAutoPilotPostsWrapper: React.FC<{ platform: 'instagram' | 'youtube' }> = ({ platform }) => {
  const [posts, setPosts] = useState<AutoPilotPost[]>([]);

  useEffect(() => {
    const loadPosts = async () => {
      try {
        const data = await fetchRecentPosts(platform);
        
        // Transform data to match the new component's expected format
        const transformedPosts: AutoPilotPost[] = data.map((post: any) => ({
          platform: platform === 'instagram' ? 'Instagram' : 'YouTube',
          thumbnailUrl: post.thumbnailUrl || '/default-video.jpg',
          timestamp: post.timestampFormatted || 'Recently posted'
        }));
        
        setPosts(transformedPosts);
      } catch (error) {
        console.warn(`Failed to load ${platform} posts:`, error);
        setPosts([]);
      }
    };
    
    loadPosts();
  }, [platform]);

  return <RecentAutoPilotPosts posts={posts} />;
};

export default RecentAutoPilotPostsWrapper;