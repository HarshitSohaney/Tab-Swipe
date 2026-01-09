// UI/DOM operations for Tab Swipe

import { state } from './state.js';
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
  finishBtn: document.getElementById('finishBtn')
};

export function updateLifetimeDisplay() {
  elements.totalClosedEl.textContent = state.totalClosedLifetime;
}

export function updateProgress() {
  const total = state.tabs.length;
  const current = Math.min(state.currentIndex + 1, total);
  elements.progress.textContent = `${current} of ${total} tabs`;
}

export function showEmptyState() {
  elements.cardContainer.innerHTML = `
    <div class="empty-state">
      <h2>No tabs to review!</h2>
      <p>Open some more tabs and try again.</p>
    </div>
  `;
  elements.finishBtn.classList.add('hidden');
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
}

export async function showCurrentTab() {
  if (state.currentIndex >= state.tabs.length) {
    showSummary();
    return;
  }

  const tab = state.tabs[state.currentIndex];

  // Switch to tab if preview mode is on
  await switchToTab(tab.id);

  // Set favicon (use default if not available)
  elements.favicon.src = tab.favIconUrl || DEFAULT_FAVICON;

  // Set title
  elements.title.textContent = tab.title || 'Untitled';

  // Set URL
  try {
    const displayUrl = new URL(tab.url).hostname;
    elements.url.textContent = displayUrl;
    elements.url.href = '#';
    elements.url.title = tab.url;
    elements.url.onclick = (e) => {
      e.preventDefault();
      browser.tabs.update(tab.id, { active: true });
    };
  } catch {
    elements.url.textContent = tab.url;
    elements.url.href = '#';
    elements.url.title = tab.url;
    elements.url.onclick = (e) => {
      e.preventDefault();
      browser.tabs.update(tab.id, { active: true });
    };
  }

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

  // Reset card state
  elements.card.className = 'card';
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
}

export function clearSwipeAnimation(direction) {
  if (direction === 'left') {
    elements.controlLeft.classList.remove('active');
  } else {
    elements.controlRight.classList.remove('active');
  }
}
