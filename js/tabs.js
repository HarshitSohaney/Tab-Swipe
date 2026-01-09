// Tab operations for Tab Swipe

import { state } from './state.js';
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
    // Refocus the popup window so keyboard events keep working
    const currentWindow = await browser.windows.getCurrent();
    await browser.windows.update(currentWindow.id, { focused: true });
  } catch (error) {
    console.error('Error switching tab:', error);
  }
}

export async function loadTabs() {
  const allTabs = await browser.tabs.query({ windowType: 'normal' });
  const activeTab = allTabs.find(tab => tab.active);
  state.originalTabId = activeTab?.id;

  // Filter out active tab and sort by lastAccessed (oldest first)
  state.tabs = allTabs
    .filter(tab => !tab.active)
    .sort((a, b) => (a.lastAccessed || 0) - (b.lastAccessed || 0));

  return state.tabs;
}

export async function closeTab() {
  if (state.isAnimating || state.currentIndex >= state.tabs.length) return;

  state.isAnimating = true;
  const tab = state.tabs[state.currentIndex];

  // Visual feedback
  animateSwipe('left');

  // Close the tab
  try {
    await browser.tabs.remove(tab.id);
    state.closedCount++;
    state.totalClosedLifetime++;
    updateLifetimeDisplay();
    await saveStats();

    // Track for undo - get most recent closed session
    const sessions = await browser.sessions.getRecentlyClosed({ maxResults: 1 });
    const sessionId = sessions[0]?.tab?.sessionId;
    state.lastAction = { type: 'close', tab, index: state.currentIndex, sessionId };
    showUndoButton();
  } catch (error) {
    console.error('Error closing tab:', error);
  }

  // Wait for animation then show next
  setTimeout(async () => {
    clearSwipeAnimation('left');
    state.currentIndex++;
    updateProgress();
    await showCurrentTab();
    state.isAnimating = false;
  }, ANIMATION_DURATION);
}

export async function keepTab() {
  if (state.isAnimating || state.currentIndex >= state.tabs.length) return;

  state.isAnimating = true;
  const tab = state.tabs[state.currentIndex];

  // Visual feedback
  animateSwipe('right');

  state.keptCount++;

  // Track for undo
  state.lastAction = { type: 'keep', tab, index: state.currentIndex };
  showUndoButton();

  // Wait for animation then show next
  setTimeout(async () => {
    clearSwipeAnimation('right');
    state.currentIndex++;
    updateProgress();
    await showCurrentTab();
    state.isAnimating = false;
  }, ANIMATION_DURATION);
}

export async function undo() {
  if (!state.lastAction || state.isAnimating) return;

  state.isAnimating = true;

  if (state.lastAction.type === 'close') {
    // Restore the closed tab
    try {
      if (state.lastAction.sessionId) {
        await browser.sessions.restore(state.lastAction.sessionId);
      }
      state.closedCount--;
      state.totalClosedLifetime--;
      updateLifetimeDisplay();
      await saveStats();
    } catch (error) {
      console.error('Error restoring tab:', error);
    }
  } else if (state.lastAction.type === 'keep') {
    state.keptCount--;
  }

  // Go back to previous card
  state.currentIndex--;
  updateProgress();
  await showCurrentTab();

  // Clear last action and hide undo button
  state.lastAction = null;
  hideUndoButton();
  state.isAnimating = false;
}
