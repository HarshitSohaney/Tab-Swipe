// UI Controller for Tab Swipe - handles all DOM manipulation and animations

import { formatRelativeTime, DEFAULT_FAVICON } from './utils.js';

export class UIController {
  #elements = {};
  #currentDisplayedTabId = null;
  #isAnimating = false;

  constructor() {
    this.#cacheElements();
    this.#setupUrlClickHandler();
  }

  get isAnimating() {
    return this.#isAnimating;
  }

  set isAnimating(value) {
    this.#isAnimating = value;
  }

  get previewToggle() {
    return this.#elements.previewToggle;
  }

  get filterBtn() {
    return this.#elements.filterBtn;
  }

  get filterApplyBtn() {
    return this.#elements.filterApplyBtn;
  }

  get filterClearBtn() {
    return this.#elements.filterClearBtn;
  }

  get filterInput() {
    return this.#elements.filterInput;
  }

  get filterPanel() {
    return this.#elements.filterPanel;
  }

  get controlLeft() {
    return this.#elements.controlLeft;
  }

  get controlRight() {
    return this.#elements.controlRight;
  }

  get undoBtn() {
    return this.#elements.undoBtn;
  }

  get finishBtn() {
    return this.#elements.finishBtn;
  }

  get closeDuplicatesBtn() {
    return this.#elements.closeDuplicatesBtn;
  }

  get continueAllBtn() {
    return this.#elements.continueAllBtn;
  }

  #cacheElements() {
    this.#elements = {
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
  }

  #setupUrlClickHandler() {
    this.#elements.url.addEventListener('click', (e) => {
      e.preventDefault();
      if (this.#currentDisplayedTabId) {
        browser.tabs.update(this.#currentDisplayedTabId, { active: true });
      }
    });
  }

  updateLifetimeDisplay(totalClosed) {
    this.#elements.totalClosedEl.textContent = totalClosed;
  }

  updateProgress(count) {
    this.#elements.progress.textContent = count === 1 ? '1 tab left' : `${count} tabs left`;
  }

  updateDuplicatesButton(duplicateCount) {
    if (duplicateCount > 0) {
      this.#elements.closeDuplicatesBtn.textContent = duplicateCount === 1
        ? 'Close 1 duplicate'
        : `Close ${duplicateCount} duplicates`;
      this.#elements.closeDuplicatesBtn.classList.remove('hidden');
    } else {
      this.#elements.closeDuplicatesBtn.classList.add('hidden');
    }
  }

  showEmptyState() {
    this.#elements.nextCard.classList.add('hidden');
    this.#elements.card.classList.add('hidden');
    this.#elements.finishBtn.classList.add('hidden');

    let emptyState = this.#elements.cardContainer.querySelector('.empty-state');
    if (!emptyState) {
      emptyState = document.createElement('div');
      emptyState.className = 'empty-state';
      emptyState.innerHTML = `
        <h2>No tabs to review!</h2>
        <p>Open some more tabs and try again.</p>
      `;
      this.#elements.cardContainer.appendChild(emptyState);
    }
    emptyState.classList.remove('hidden');
  }

  hideEmptyState() {
    const emptyState = this.#elements.cardContainer.querySelector('.empty-state');
    if (emptyState) {
      emptyState.classList.add('hidden');
    }
    this.#elements.card.classList.remove('hidden');
    this.#elements.finishBtn.classList.remove('hidden');
  }

  showError() {
    this.#elements.cardContainer.innerHTML = `
      <div class="empty-state">
        <h2>Oops!</h2>
        <p>Something went wrong loading your tabs.</p>
      </div>
    `;
  }

  showSummary(closedCount, keptCount, totalClosed, hasFilter, unprocessedCount) {
    this.#elements.nextCard.classList.add('hidden');
    this.#elements.cardContainer.classList.add('hidden');
    document.querySelector('.controls').classList.add('hidden');
    document.querySelector('.preview-toggle').classList.add('hidden');
    this.#elements.finishBtn.classList.add('hidden');
    this.#elements.undoBtn.classList.add('hidden');
    this.#elements.summary.classList.remove('hidden');
    this.#elements.closedCountEl.textContent = closedCount;
    this.#elements.keptCountEl.textContent = keptCount;
    this.#elements.totalClosedFinalEl.textContent = totalClosed;
    this.#elements.progress.textContent = 'Complete!';

    if (hasFilter && unprocessedCount > 0) {
      this.showContinueAllButton();
    } else {
      this.hideContinueAllButton();
    }
  }

  #populateNextCard(tab) {
    if (!tab) {
      this.#elements.nextCard.classList.add('hidden');
      return;
    }

    this.#elements.nextCard.classList.remove('hidden');
    this.#elements.nextFavicon.src = tab.favIconUrl || DEFAULT_FAVICON;
    this.#elements.nextTitle.textContent = tab.title || 'Untitled';
    this.#elements.nextUrl.textContent = tab.hostname || tab.url;

    if (tab.lastAccessed) {
      const timeInfo = formatRelativeTime(tab.lastAccessed);
      this.#elements.nextLastActiveTime.textContent = `Last active: ${timeInfo.text}`;
      this.#elements.nextLastActiveEl.className = 'last-active';
      if (timeInfo.age === 'recent') {
        this.#elements.nextLastActiveEl.classList.add('recent');
      } else if (timeInfo.age === 'old') {
        this.#elements.nextLastActiveEl.classList.add('old');
      }
    } else {
      this.#elements.nextLastActiveTime.textContent = 'Last active: Unknown';
      this.#elements.nextLastActiveEl.className = 'last-active';
    }

    // Reset next card state without transition
    this.#elements.nextCard.className = 'card next-card no-transition';
    void this.#elements.nextCard.offsetHeight;
    this.#elements.nextCard.classList.remove('no-transition');
  }

  displayTab(currentTab, nextTab, duplicateCount) {
    if (!currentTab) {
      return false;
    }

    this.hideEmptyState();

    // Set favicon
    this.#elements.favicon.src = currentTab.favIconUrl || DEFAULT_FAVICON;

    // Set title
    this.#elements.title.textContent = currentTab.title || 'Untitled';

    // Set URL
    this.#elements.url.textContent = currentTab.hostname || currentTab.url;
    this.#elements.url.title = currentTab.url;
    this.#currentDisplayedTabId = currentTab.id;

    // Set last active time
    if (currentTab.lastAccessed) {
      const timeInfo = formatRelativeTime(currentTab.lastAccessed);
      this.#elements.lastActiveTime.textContent = `Last active: ${timeInfo.text}`;
      this.#elements.lastActiveEl.className = 'last-active';
      if (timeInfo.age === 'recent') {
        this.#elements.lastActiveEl.classList.add('recent');
      } else if (timeInfo.age === 'old') {
        this.#elements.lastActiveEl.classList.add('old');
      }
    } else {
      this.#elements.lastActiveTime.textContent = 'Last active: Unknown';
      this.#elements.lastActiveEl.className = 'last-active';
    }

    // Reset card state without transition
    this.#elements.card.className = 'card no-transition';
    void this.#elements.card.offsetHeight;
    this.#elements.card.classList.remove('no-transition');

    // Populate the next card preview
    this.#populateNextCard(nextTab);

    // Update duplicates button
    this.updateDuplicatesButton(duplicateCount);

    return true;
  }

  showUndoButton() {
    this.#elements.undoBtn.classList.remove('hidden');
  }

  hideUndoButton() {
    this.#elements.undoBtn.classList.add('hidden');
  }

  addSwipeHint(direction) {
    if (direction === 'left') {
      this.#elements.card.classList.add('swipe-left-hint');
      this.#elements.controlLeft.classList.add('active');
    } else {
      this.#elements.card.classList.add('swipe-right-hint');
      this.#elements.controlRight.classList.add('active');
    }
  }

  removeSwipeHint(direction) {
    if (direction === 'left') {
      this.#elements.card.classList.remove('swipe-left-hint');
    } else {
      this.#elements.card.classList.remove('swipe-right-hint');
    }
  }

  animateSwipeLeft() {
    return this.#animateSwipe('left');
  }

  animateSwipeRight() {
    return this.#animateSwipe('right');
  }

  #animateSwipe(direction) {
    return new Promise((resolve) => {
      if (direction === 'left') {
        this.#elements.controlLeft.classList.add('active');
        this.#elements.card.classList.add('swipe-left');
      } else {
        this.#elements.controlRight.classList.add('active');
        this.#elements.card.classList.add('swipe-right');
      }

      // Trigger pop animation on the next card
      if (!this.#elements.nextCard.classList.contains('hidden')) {
        this.#elements.nextCard.classList.add('pop');
      }

      resolve(direction);
    });
  }

  clearSwipeAnimation(direction) {
    if (direction === 'left') {
      this.#elements.controlLeft.classList.remove('active');
      this.#elements.card.classList.remove('swipe-left');
    } else {
      this.#elements.controlRight.classList.remove('active');
      this.#elements.card.classList.remove('swipe-right');
    }
    this.#elements.nextCard.classList.remove('pop');
  }

  // Filter UI methods
  toggleFilterPanel() {
    this.#elements.filterPanel.classList.toggle('hidden');
    if (!this.#elements.filterPanel.classList.contains('hidden')) {
      this.#elements.filterInput.focus();
    }
  }

  hideFilterPanel() {
    this.#elements.filterPanel.classList.add('hidden');
  }

  updateFilterUI(filterHost) {
    if (filterHost) {
      this.#elements.filterBtn.classList.add('active');
      this.#elements.filterInput.value = filterHost;
      this.#elements.filterClearBtn.classList.remove('hidden');
    } else {
      this.#elements.filterBtn.classList.remove('active');
      this.#elements.filterInput.value = '';
      this.#elements.filterClearBtn.classList.add('hidden');
    }
  }

  showContinueAllButton() {
    this.#elements.continueAllBtn.classList.remove('hidden');
  }

  hideContinueAllButton() {
    this.#elements.continueAllBtn.classList.add('hidden');
  }

  resetMainView() {
    this.#elements.cardContainer.classList.remove('hidden');
    document.querySelector('.controls').classList.remove('hidden');
    document.querySelector('.preview-toggle').classList.remove('hidden');
    this.#elements.finishBtn.classList.remove('hidden');
    this.#elements.card.classList.remove('hidden');
    this.#elements.summary.classList.add('hidden');
    this.hideEmptyState();
    this.hideContinueAllButton();
  }

  setPreviewToggleChecked(checked) {
    this.#elements.previewToggle.checked = checked;
  }

  getFilterInputValue() {
    return this.#elements.filterInput.value.trim();
  }
}
