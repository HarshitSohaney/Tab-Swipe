// State management for Tab Swipe

export const state = {
  allTabs: [], // All TabItem objects loaded this session
  currentIndex: 0,
  closedCount: 0,
  keptCount: 0,
  totalClosedLifetime: 0,
  isAnimating: false,
  previewMode: false,
  originalTabId: null,
  lastAction: null, // The last TabItem that was acted on
  filterHost: null // Current filter host (e.g., 'youtube.com')
};

// Get tabs to display (unprocessed, matching current filter)
export function getVisibleTabs() {
  return state.allTabs.filter(tab =>
    !tab.processed && tab.matchesFilter(state.filterHost)
  );
}

// Get current tab being displayed
export function getCurrentTab() {
  const visible = getVisibleTabs();
  return visible[state.currentIndex] || null;
}

// Get next tab (for preview)
export function getNextTab() {
  const visible = getVisibleTabs();
  return visible[state.currentIndex + 1] || null;
}

// Get total visible tab count
export function getVisibleCount() {
  return getVisibleTabs().length;
}

export function resetSessionStats() {
  state.closedCount = 0;
  state.keptCount = 0;
  state.currentIndex = 0;
  state.lastAction = null;
}
