// API function to fetch analytics data for heart indicators
export async function getAnalyticsData() {
  try {
    const response = await fetch('http://localhost:3002/api/dashboard/analytics');
    
    if (!response.ok) {
      throw new Error(`Analytics API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Ensure the response matches expected format
    return {
      instagram: {
        isPosting: data.instagram?.isPosting || false,
        growthRate: data.instagram?.growthRate || 0
      },
      youtube: {
        isPosting: data.youtube?.isPosting || false,
        growthRate: data.youtube?.growthRate || 0
      }
    };
  } catch (error) {
    console.warn('⚠️ Failed to fetch analytics data:', error);
    
    // Return fallback data
    return {
      instagram: {
        isPosting: false,
        growthRate: 0
      },
      youtube: {
        isPosting: false,
        growthRate: 0
      }
    };
  }
}