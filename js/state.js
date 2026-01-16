// State management for Tab Swipe

export const state = {
  allTabs: [],              // All TabItem objects loaded this session
  currentIndex: 0,          // Index into visible tabs array
  closedCount: 0,           // Tabs closed this session
  keptCount: 0,             // Tabs kept this session
  totalClosedLifetime: 0,   // Tabs closed across all sessions (persisted)
  isAnimating: false,       // Lock to prevent actions during animation
  previewMode: false,       // Whether to focus tabs while swiping
  originalTabId: null,      // Tab that was active when popup opened
  lastAction: null,         // Last TabItem acted on (for undo)
  filterHost: null          // Domain filter (e.g., 'youtube.com')
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

// Get duplicates of the current tab (same URL, excluding current)
export function getDuplicatesOfCurrent() {
  const current = getCurrentTab();
  if (!current) return [];

  return getVisibleTabs().filter(tab =>
    tab.id !== current.id && tab.url === current.url
  );
}

export function resetSessionStats() {
  state.closedCount = 0;
  state.keptCount = 0;
  state.currentIndex = 0;
  state.lastAction = null;
}
