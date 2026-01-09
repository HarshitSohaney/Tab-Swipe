// Main entry point for Tab Swipe

import { state } from './state.js';
import { loadStats, savePreviewPreference } from './storage.js';
import { loadTabs, closeTab, keepTab, undo, switchToTab } from './tabs.js';
import {
  elements,
  updateLifetimeDisplay,
  updateProgress,
  showCurrentTab,
  showEmptyState,
  showError,
  showSummary,
  addSwipeHint,
  removeSwipeHint
} from './ui.js';

// Initialize the application
async function init() {
  try {
    // Load lifetime stats
    const stats = await loadStats();
    elements.previewToggle.checked = state.previewMode;
    updateLifetimeDisplay();

    // Load tabs
    const tabs = await loadTabs();

    if (tabs.length === 0) {
      showEmptyState();
      return;
    }

    // Set up preview toggle handler
    elements.previewToggle.addEventListener('change', async (e) => {
      state.previewMode = e.target.checked;
      await savePreviewPreference();
      // If turning on preview mode, switch to current tab
      if (state.previewMode && state.currentIndex < state.tabs.length) {
        await switchToTab(state.tabs[state.currentIndex].id);
      }
    });

    updateProgress();
    await showCurrentTab();
  } catch (error) {
    console.error('Error loading tabs:', error);
    showError();
  }
}

// Keyboard event handlers
document.addEventListener('keydown', (e) => {
  // Ctrl+Z or Cmd+Z for undo
  if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
    e.preventDefault();
    undo();
    return;
  }

  if (e.key === 'ArrowLeft') {
    e.preventDefault();
    addSwipeHint('left');
  } else if (e.key === 'ArrowRight') {
    e.preventDefault();
    addSwipeHint('right');
  }
});

document.addEventListener('keyup', (e) => {
  if (e.key === 'ArrowLeft') {
    e.preventDefault();
    removeSwipeHint('left');
    closeTab();
  } else if (e.key === 'ArrowRight') {
    e.preventDefault();
    removeSwipeHint('right');
    keepTab();
  }
});

// Click handlers
elements.controlLeft.addEventListener('click', closeTab);
elements.controlRight.addEventListener('click', keepTab);
elements.undoBtn.addEventListener('click', undo);
elements.finishBtn.addEventListener('click', showSummary);

// Start the app
init();
