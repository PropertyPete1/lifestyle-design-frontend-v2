/**
 * API Configuration for Frontend-v2
 * Handles development and production API endpoints
 */

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://lifestyle-design-backend-v2.onrender.com';

/**
 * Creates full API endpoint URL
 */
export const apiUrl = (endpoint: string): string => {
  // Remove leading slash if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${API_BASE_URL}/${cleanEndpoint}`;
};

/**
 * Common API endpoints
 */
export const API_ENDPOINTS = {
  // Chart and dashboard
  chartStatus: () => apiUrl('api/chart/status'),
  settings: () => apiUrl('api/settings'),
  
  // Autopilot
  autopilotRun: () => apiUrl('api/autopilot/run'),
  autopilotManualPost: () => apiUrl('api/autopilot/manual-post'),
  autopilotStatus: () => apiUrl('api/autopilot/status'),
  autopilotQueue: (limit?: number) => apiUrl(`api/autopilot/queue${limit ? `?limit=${limit}` : ''}`),
  
  // Activity and analytics
  activityFeed: (limit?: number) => apiUrl(`api/activity/feed${limit ? `?limit=${limit}` : ''}`),
  instagramAnalytics: () => apiUrl('api/instagram/analytics'),
  youtubeAnalytics: () => apiUrl('api/youtube/analytics'),
  
  // Events
  eventsRecent: (since: number) => apiUrl(`api/events/recent?since=${since}`),
  
  // Platform specific
  schedulerStatus: () => apiUrl('api/scheduler/status'),
} as const;

export default API_ENDPOINTS;