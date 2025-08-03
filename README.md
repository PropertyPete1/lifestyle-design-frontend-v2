# Lifestyle Design Auto Poster Frontend v2

Modern Next.js dashboard for the Lifestyle Design Auto Poster system with real-time analytics, heart indicators, and wavy line charts.

## 🌟 Features

- **Real-time Dashboard**: Live Instagram & YouTube analytics
- **Heart Indicators**: Visual status indicators for platform activity
- **Animated Wave Charts**: Dynamic visualization of posting activity and engagement
- **Manual Post Button**: Instant posting with smart content selection
- **Recent Posts Display**: Thumbnail gallery of recent autopilot posts
- **Responsive Design**: Optimized for desktop and mobile

## 🚀 Tech Stack

- Next.js 15 with Turbopack
- TypeScript
- Tailwind CSS
- Framer Motion animations
- Chart.js for analytics

## 📊 Dashboard Components

### Heart Status Cards
- Pink heart for Instagram (pulses when active)
- Red heart for YouTube (pulses when active)  
- Fusion heart when both platforms post simultaneously

### Wave Charts
- Real-time visualization of posting activity
- Amplitude reflects engagement levels
- Speed corresponds to posting volume
- Glow effects for performance records

### Recent Posts
- Platform-specific thumbnail displays
- Error fallbacks and loading states
- MongoDB integration for post history

## 🔧 Environment Setup

```env
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
```

## 🚦 Getting Started

```bash
npm install
npm run dev
```

## 📈 API Integration

Connects to backend-v2 for:
- Real-time chart data (`/api/chart/status`)
- Activity feeds (`/api/activity/feed`)
- Manual posting (`/api/autopilot/manual-post`)
- Settings management (`/api/settings`)

## 🎨 Styling

- Dark theme optimized
- Instagram pink & YouTube red brand colors
- Smooth animations and transitions
- Responsive grid layouts