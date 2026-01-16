// UI/DOM operations for Tab Swipe

import { state, getCurrentTab, getNextTab, getVisibleCount, getDuplicatesOfCurrent } from './state.js';
import { formatRelativeTime, DEFAULT_FAVICON } from './utils.js';
import { switchToTab } from './tabs.js';

// DOM element references
export const elements = {
  card: document.getElementById('card'),
  favicon: document.getElementById('favicon'),
  title: document.getElementById('title'),
  url: document.getElementById('url'),
  progress: document.getElementById('progress'),
  summary: document.getElementById('summary'),
  closedCountEl: document.getElementById('closedCount'),
  keptCountEl: document.getElementById('keptCount'),
  cardContainer: document.querySelector('.card-container'),
  controlLeft: document.querySelector('.control-hint.left'),
  controlRight: document.querySelector('.control-hint.right'),
  lastActiveEl: document.getElementById('lastActive'),
  lastActiveTime: document.getElementById('lastActiveTime'),
  totalClosedEl: document.getElementById('totalClosed'),
  totalClosedFinalEl: document.getElementById('totalClosedFinal'),
  previewToggle: document.getElementById('previewToggle'),
  undoBtn: document.getElementById('undoBtn'),
  finishBtn: document.getElementById('finishBtn'),
  // Next card elements
  nextCard: document.getElementById('nextCard'),
  nextFavicon: document.getElementById('nextFavicon'),
  nextTitle: document.getElementById('nextTitle'),
  nextUrl: document.getElementById('nextUrl'),
  nextLastActiveEl: document.getElementById('nextLastActive'),
  nextLastActiveTime: document.getElementById('nextLastActiveTime'),
  // Filter elements
  filterBtn: document.getElementById('filterBtn'),
  filterPanel: document.getElementById('filterPanel'),
  filterInput: document.getElementById('filterInput'),
  filterApplyBtn: document.getElementById('filterApplyBtn'),
  filterClearBtn: document.getElementById('filterClearBtn'),
  continueAllBtn: document.getElementById('continueAllBtn'),
  // Duplicates
  closeDuplicatesBtn: document.getElementById('closeDuplicatesBtn')
};

// Track current tab ID for URL click handler
let currentDisplayedTabId = null;

// Set up URL click handler once
elements.url.addEventListener('click', (e) => {
  e.preventDefault();
  if (currentDisplayedTabId) {
    browser.tabs.update(currentDisplayedTabId, { active: true });
  }
});

export function updateLifetimeDisplay() {
  elements.totalClosedEl.textContent = state.totalClosedLifetime;
}

export function updateProgress() {
  const count = getVisibleCount();
  elements.progress.textContent = count === 1 ? '1 tab left' : `${count} tabs left`;
}

export function updateDuplicatesButton() {
  const dupes = getDuplicatesOfCurrent();
  if (dupes.length > 0) {
    elements.closeDuplicatesBtn.textContent = dupes.length === 1
      ? 'Close 1 duplicate'
      : `Close ${dupes.length} duplicates`;
    elements.closeDuplicatesBtn.classList.remove('hidden');
  } else {
    elements.closeDuplicatesBtn.classList.add('hidden');
  }
}

export function showEmptyState() {
  elements.nextCard.classList.add('hidden');
  elements.card.classList.add('hidden');
  elements.finishBtn.classList.add('hidden');

  // Add empty state message if not already present
  let emptyState = elements.cardContainer.querySelector('.empty-state');
  if (!emptyState) {
    emptyState = document.createElement('div');
    emptyState.className = 'empty-state';
    emptyState.innerHTML = `
      <h2>No tabs to review!</h2>
      <p>Open some more tabs and try again.</p>
    `;
    elements.cardContainer.appendChild(emptyState);
  }
  emptyState.classList.remove('hidden');
}

export function hideEmptyState() {
  const emptyState = elements.cardContainer.querySelector('.empty-state');
  if (emptyState) {
    emptyState.classList.add('hidden');
  }
  elements.card.classList.remove('hidden');
  elements.finishBtn.classList.remove('hidden');
}

export function showError() {
  elements.cardContainer.innerHTML = `
    <div class="empty-state">
      <h2>Oops!</h2>
      <p>Something went wrong loading your tabs.</p>
    </div>
  `;
}

export function showSummary() {
  elements.nextCard.classList.add('hidden');
  elements.cardContainer.classList.add('hidden');
  document.querySelector('.controls').classList.add('hidden');
  document.querySelector('.preview-toggle').classList.add('hidden');
  elements.finishBtn.classList.add('hidden');
  elements.undoBtn.classList.add('hidden');
  elements.summary.classList.remove('hidden');
  elements.closedCountEl.textContent = state.closedCount;
  elements.keptCountEl.textContent = state.keptCount;
  elements.totalClosedFinalEl.textContent = state.totalClosedLifetime;
  elements.progress.textContent = 'Complete!';

  // Show continue button if in filter mode and there are unprocessed tabs remaining
  const unprocessedCount = state.allTabs.filter(t => !t.processed).length;
  if (state.filterHost && unprocessedCount > 0) {
    showContinueAllButton();
  } else {
    hideContinueAllButton();
  }
}

function populateNextCard() {
  const tab = getNextTab();

  if (!tab) {
    elements.nextCard.classList.add('hidden');
    return;
  }

  elements.nextCard.classList.remove('hidden');

  // Set favicon
  elements.nextFavicon.src = tab.favIconUrl || DEFAULT_FAVICON;

  // Set title
  elements.nextTitle.textContent = tab.title || 'Untitled';

  // Set URL - use hostname getter from TabItem
  elements.nextUrl.textContent = tab.hostname || tab.url;

  // Set last active time
  if (tab.lastAccessed) {
    const timeInfo = formatRelativeTime(tab.lastAccessed);
    elements.nextLastActiveTime.textContent = `Last active: ${timeInfo.text}`;
    elements.nextLastActiveEl.className = 'last-active';
    if (timeInfo.age === 'recent') {
      elements.nextLastActiveEl.classList.add('recent');
    } else if (timeInfo.age === 'old') {
      elements.nextLastActiveEl.classList.add('old');
    }
  } else {
    elements.nextLastActiveTime.textContent = 'Last active: Unknown';
    elements.nextLastActiveEl.className = 'last-active';
  }

  // Reset next card state without transition (to prevent it sliding back)
  elements.nextCard.className = 'card next-card no-transition';
  void elements.nextCard.offsetHeight;
  elements.nextCard.classList.remove('no-transition');
}

export async function showCurrentTab() {
  const tab = getCurrentTab();

  if (!tab) {
    showSummary();
    return;
  }

  // Hide empty state if it was showing
  hideEmptyState();

  // Switch to tab if preview mode is on
  await switchToTab(tab.id);

  // Set favicon (use default if not available)
  elements.favicon.src = tab.favIconUrl || DEFAULT_FAVICON;

  // Set title
  elements.title.textContent = tab.title || 'Untitled';

  // Set URL - use hostname getter from TabItem
  elements.url.textContent = tab.hostname || tab.url;
  elements.url.title = tab.url;
  currentDisplayedTabId = tab.id;

  // Set last active time
  if (tab.lastAccessed) {
    const timeInfo = formatRelativeTime(tab.lastAccessed);
    elements.lastActiveTime.textContent = `Last active: ${timeInfo.text}`;

    // Update styling based on age
    elements.lastActiveEl.className = 'last-active';
    if (timeInfo.age === 'recent') {
      elements.lastActiveEl.classList.add('recent');
    } else if (timeInfo.age === 'old') {
      elements.lastActiveEl.classList.add('old');
    }
  } else {
    elements.lastActiveTime.textContent = 'Last active: Unknown';
    elements.lastActiveEl.className = 'last-active';
  }

  // Reset card state without transition (to prevent slide-in animation)
  elements.card.className = 'card no-transition';
  // Force reflow to apply the no-transition class before removing it
  void elements.card.offsetHeight;
  elements.card.classList.remove('no-transition');

  // Populate the next card preview
  populateNextCard();

  // Check for duplicates
  updateDuplicatesButton();
}

export function showUndoButton() {
  elements.undoBtn.classList.remove('hidden');
}

export function hideUndoButton() {
  elements.undoBtn.classList.add('hidden');
}

export function addSwipeHint(direction) {
  if (direction === 'left') {
    elements.card.classList.add('swipe-left-hint');
    elements.controlLeft.classList.add('active');
  } else {
    elements.card.classList.add('swipe-right-hint');
    elements.controlRight.classList.add('active');
  }
}

export function removeSwipeHint(direction) {
  if (direction === 'left') {
    elements.card.classList.remove('swipe-left-hint');
  } else {
    elements.card.classList.remove('swipe-right-hint');
  }
}

export function animateSwipe(direction) {
  if (direction === 'left') {
    elements.controlLeft.classList.add('active');
    elements.card.classList.add('swipe-left');
  } else {
    elements.controlRight.classList.add('active');
    elements.card.classList.add('swipe-right');
  }

  // Trigger pop animation on the next card
  if (!elements.nextCard.classList.contains('hidden')) {
    elements.nextCard.classList.add('pop');
  }
}

export function clearSwipeAnimation(direction) {
  if (direction === 'left') {
    elements.controlLeft.classList.remove('active');
  } else {
    elements.controlRight.classList.remove('active');
  }
  // Remove pop animation class from next card
  elements.nextCard.classList.remove('pop');
}

// Filter UI functions
export function toggleFilterPanel() {
  elements.filterPanel.classList.toggle('hidden');
  if (!elements.filterPanel.classList.contains('hidden')) {
    elements.filterInput.focus();
  }
}

export function hideFilterPanel() {
  elements.filterPanel.classList.add('hidden');
}

export function updateFilterUI() {
  if (state.filterHost) {
    elements.filterBtn.classList.add('active');
    elements.filterInput.value = state.filterHost;
    elements.filterClearBtn.classList.remove('hidden');
  } else {
    elements.filterBtn.classList.remove('active');
    elements.filterInput.value = '';
    elements.filterClearBtn.classList.add('hidden');
  }
}

export function showContinueAllButton() {
  elements.continueAllBtn.classList.remove('hidden');
}

export function hideContinueAllButton() {
  elements.continueAllBtn.classList.add('hidden');
}

export function resetMainView() {
  // Show the card container and controls again
  elements.cardContainer.classList.remove('hidden');
  document.querySelector('.controls').classList.remove('hidden');
  document.querySelector('.preview-toggle').classList.remove('hidden');
  elements.finishBtn.classList.remove('hidden');
  elements.card.classList.remove('hidden');
  elements.summary.classList.add('hidden');
  hideEmptyState();
  hideContinueAllButton();
}
