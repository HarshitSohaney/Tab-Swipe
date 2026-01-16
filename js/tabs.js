// Tab operations for Tab Swipe

import { state, getCurrentTab, getNextTab, getVisibleCount, getDuplicatesOfCurrent } from './state.js';
import { TabItem } from './TabItem.js';
import { saveStats } from './storage.js';
import {
  updateLifetimeDisplay,
  updateProgress,
  showCurrentTab,
  showUndoButton,
  hideUndoButton,
  animateSwipe,
  clearSwipeAnimation
} from './ui.js';

const ANIMATION_DURATION = 300;

export async function switchToTab(tabId) {
  if (!state.previewMode) return;
  try {
    await browser.tabs.update(tabId, { active: true });
    const currentWindow = await browser.windows.getCurrent();
    await browser.windows.update(currentWindow.id, { focused: true });
  } catch (error) {
    console.error('Error switching tab:', error);
  }
}

export async function loadTabs() {
  const browserTabs = await browser.tabs.query({ windowType: 'normal' });
  const activeTab = browserTabs.find(tab => tab.active);
  state.originalTabId = activeTab?.id;

  // Create TabItem objects, excluding active tab, sorted by lastAccessed
  state.allTabs = browserTabs
    .filter(tab => !tab.active)
    .sort((a, b) => (a.lastAccessed || 0) - (b.lastAccessed || 0))
    .map(tab => new TabItem(tab));

  state.currentIndex = 0;
  return getVisibleCount();
}

export function applyFilter(hostFilter) {
  state.filterHost = hostFilter?.trim().toLowerCase() || null;
  state.currentIndex = 0;
  return getVisibleCount();
}

export function clearFilter() {
  state.filterHost = null;
  state.currentIndex = 0;
  return getVisibleCount();
}

export async function closeTab() {
  const tab = getCurrentTab();
  if (state.isAnimating || !tab) return;

  state.isAnimating = true;
  animateSwipe('left');

  try {
    await browser.tabs.remove(tab.id);

    // Get session ID for potential undo
    const sessions = await browser.sessions.getRecentlyClosed({ maxResults: 1 });
    const sessionId = sessions[0]?.tab?.sessionId;

    tab.markClosed(sessionId);
    state.closedCount++;
    state.totalClosedLifetime++;
    state.lastAction = tab;

    updateLifetimeDisplay();
    await saveStats();
    showUndoButton();
  } catch (error) {
    console.error('Error closing tab:', error);
    state.isAnimating = false;
    clearSwipeAnimation('left');
    return;
  }

  setTimeout(() => {
    clearSwipeAnimation('left');
    updateProgress();
    showCurrentTab().catch(err => console.error('Error showing tab:', err));
    state.isAnimating = false;
  }, ANIMATION_DURATION);
}

export async function keepTab() {
  const tab = getCurrentTab();
  if (state.isAnimating || !tab) return;

  state.isAnimating = true;
  animateSwipe('right');

  tab.markKept();
  state.keptCount++;
  state.lastAction = tab;
  showUndoButton();

  setTimeout(() => {
    clearSwipeAnimation('right');
    updateProgress();
    showCurrentTab().catch(err => console.error('Error showing tab:', err));
    state.isAnimating = false;
  }, ANIMATION_DURATION);
}

export async function undo() {
  const tab = state.lastAction;
  if (!tab || state.isAnimating) return;

  state.isAnimating = true;

  if (tab.action === 'closed') {
    try {
      if (tab.sessionId) {
        await browser.sessions.restore(tab.sessionId);
      }
      // Only decrement counters after successful restoration
      state.closedCount--;
      state.totalClosedLifetime--;
      updateLifetimeDisplay();
      await saveStats();
    } catch (error) {
      console.error('Error restoring tab:', error);
      state.isAnimating = false;
      return;
    }
  } else if (tab.action === 'kept') {
    state.keptCount--;
  }

  tab.reset();
  state.lastAction = null;

  updateProgress();
  try {
    await showCurrentTab();
  } catch (error) {
    console.error('Error showing tab:', error);
  }
  hideUndoButton();
  state.isAnimating = false;
}

export async function closeDuplicates() {
  const dupes = getDuplicatesOfCurrent();
  if (dupes.length === 0) return;

  for (const tab of dupes) {
    try {
      await browser.tabs.remove(tab.id);
      tab.markClosed(null); // No undo for bulk close
      state.closedCount++;
      state.totalClosedLifetime++;
    } catch (error) {
      console.error('Error closing duplicate tab:', error);
    }
  }

  updateLifetimeDisplay();
  await saveStats();
  updateProgress();

  try {
    await showCurrentTab();
  } catch (error) {
    console.error('Error showing tab:', error);
  }
}
