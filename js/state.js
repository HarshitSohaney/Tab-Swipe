// State management for Tab Swipe

export const state = {
  tabs: [],
  currentIndex: 0,
  closedCount: 0,
  keptCount: 0,
  totalClosedLifetime: 0,
  isAnimating: false,
  previewMode: false,
  originalTabId: null,
  lastAction: null // { type: 'close' | 'keep', tab: Tab, sessionId?: string }
};

export function resetSessionStats() {
  state.closedCount = 0;
  state.keptCount = 0;
  state.currentIndex = 0;
  state.lastAction = null;
}
