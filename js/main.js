// Main entry point for Tab Swipe

import { state, getCurrentTab } from './state.js';
import { loadStats, savePreviewPreference } from './storage.js';
import { loadTabs, closeTab, keepTab, undo, switchToTab, applyFilter, clearFilter, closeDuplicates } from './tabs.js';
import {
  elements,
  updateLifetimeDisplay,
  updateProgress,
  showCurrentTab,
  showEmptyState,
  hideEmptyState,
  showError,
  showSummary,
  addSwipeHint,
  removeSwipeHint,
  toggleFilterPanel,
  hideFilterPanel,
  updateFilterUI,
  resetMainView
} from './ui.js';

// Initialize the application
async function init() {
  try {
    // Load lifetime stats
    const stats = await loadStats();
    elements.previewToggle.checked = state.previewMode;
    updateLifetimeDisplay();

    // Load tabs
    const tabCount = await loadTabs();

    if (tabCount === 0) {
      showEmptyState();
      return;
    }

    // Set up preview toggle handler
    elements.previewToggle.addEventListener('change', async (e) => {
      state.previewMode = e.target.checked;
      await savePreviewPreference();
      // If turning on preview mode, switch to current tab
      const currentTab = getCurrentTab();
      if (state.previewMode && currentTab) {
        await switchToTab(currentTab.id);
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
elements.closeDuplicatesBtn.addEventListener('click', closeDuplicates);

// Filter handlers
async function refreshTabView(count) {
  updateProgress();
  if (count === 0) {
    showEmptyState();
  } else {
    await showCurrentTab();
  }
}

elements.filterBtn.addEventListener('click', toggleFilterPanel);

elements.filterApplyBtn.addEventListener('click', async () => {
  const filterValue = elements.filterInput.value.trim();
  if (filterValue) {
    const count = applyFilter(filterValue);
    updateFilterUI();
    hideFilterPanel();
    await refreshTabView(count);
  }
});

elements.filterClearBtn.addEventListener('click', async () => {
  const count = clearFilter();
  updateFilterUI();
  hideFilterPanel();
  await refreshTabView(count);
});

elements.filterInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    elements.filterApplyBtn.click();
  } else if (e.key === 'Escape') {
    hideFilterPanel();
  }
});

elements.continueAllBtn.addEventListener('click', async () => {
  const count = clearFilter();
  updateFilterUI();
  resetMainView();
  await refreshTabView(count);
});

// Close filter panel when clicking outside
document.addEventListener('click', (e) => {
  if (!elements.filterPanel.classList.contains('hidden') &&
      !elements.filterPanel.contains(e.target) &&
      !elements.filterBtn.contains(e.target)) {
    hideFilterPanel();
  }
});

// Start the app
init();
