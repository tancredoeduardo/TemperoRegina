/**
 * Vercel Speed Insights initialization
 * This script injects the Vercel Speed Insights tracking for performance monitoring
 */
import { injectSpeedInsights } from '@vercel/speed-insights';

// Initialize Speed Insights
injectSpeedInsights({
  debug: false // Set to true to see debug logs in development
});
