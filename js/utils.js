// Utility functions for Tab Swipe

/**
 * Format a timestamp as relative time (e.g., "5 minutes ago", "2 days ago")
 * @param {number} timestamp - Unix timestamp in milliseconds
 * @returns {{ text: string, age: 'recent' | 'medium' | 'old' }}
 */
export function formatRelativeTime(timestamp) {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);

  if (seconds < 60) {
    return { text: 'Just now', age: 'recent' };
  } else if (minutes < 60) {
    return { text: `${minutes} minute${minutes !== 1 ? 's' : ''} ago`, age: 'recent' };
  } else if (hours < 24) {
    return { text: `${hours} hour${hours !== 1 ? 's' : ''} ago`, age: hours < 6 ? 'recent' : 'medium' };
  } else if (days < 7) {
    return { text: `${days} day${days !== 1 ? 's' : ''} ago`, age: days < 2 ? 'medium' : 'old' };
  } else {
    return { text: `${weeks} week${weeks !== 1 ? 's' : ''} ago`, age: 'old' };
  }
}

/**
 * Default favicon SVG data URL
 */
export const DEFAULT_FAVICON = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%236b7280"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>';
