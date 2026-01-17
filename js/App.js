// App orchestrator for Tab Swipe - coordinates components and handles events

import { StorageService } from './StorageService.js';
import { TabManager } from './TabManager.js';
import { UIController } from './UIController.js';

const ANIMATION_DURATION = 300;

export class App {
  #storage;
  #tabManager;
  #ui;

  constructor() {
    this.#storage = new StorageService();
    this.#tabManager = new TabManager();
    this.#ui = new UIController();
  }

  async init() {
    try {
      // Load lifetime stats
      await this.#storage.load();
      this.#tabManager.previewMode = this.#storage.previewMode;
      this.#ui.setPreviewToggleChecked(this.#storage.previewMode);
      this.#ui.updateLifetimeDisplay(this.#storage.totalClosed);

      // Load tabs
      const tabCount = await this.#tabManager.loadTabs();

      if (tabCount === 0) {
        this.#ui.showEmptyState();
        this.#setupEventListeners();
        return;
      }

      this.#ui.updateProgress(this.#tabManager.getVisibleCount());
      await this.#showCurrentTab();
      this.#setupEventListeners();
    } catch (error) {
      console.error('Error initializing app:', error);
      this.#ui.showError();
    }
  }

  #setupEventListeners() {
    // Preview toggle handler
    this.#ui.previewToggle.addEventListener('change', async (e) => {
      this.#tabManager.previewMode = e.target.checked;
      await this.#storage.savePreviewMode(e.target.checked);
      // If turning on preview mode, switch to current tab
      const currentTab = this.#tabManager.getCurrentTab();
      if (this.#tabManager.previewMode && currentTab) {
        await this.#tabManager.switchToTab(currentTab.id);
      }
    });

    // Keyboard events
    document.addEventListener('keydown', (e) => this.#handleKeyDown(e));
    document.addEventListener('keyup', (e) => this.#handleKeyUp(e));

    // Control click handlers
    this.#ui.controlLeft.addEventListener('click', () => this.#closeTab());
    this.#ui.controlRight.addEventListener('click', () => this.#keepTab());
    this.#ui.undoBtn.addEventListener('click', () => this.#undo());
    this.#ui.finishBtn.addEventListener('click', () => this.#showSummary());
    this.#ui.closeDuplicatesBtn.addEventListener('click', () => this.#closeDuplicates());

    // Filter handlers
    this.#ui.filterBtn.addEventListener('click', () => this.#ui.toggleFilterPanel());

    this.#ui.filterApplyBtn.addEventListener('click', async () => {
      const filterValue = this.#ui.getFilterInputValue();
      if (filterValue) {
        const count = this.#tabManager.applyFilter(filterValue);
        this.#ui.updateFilterUI(this.#tabManager.filterHost);
        this.#ui.hideFilterPanel();
        await this.#refreshTabView(count);
      }
    });

    this.#ui.filterClearBtn.addEventListener('click', async () => {
      const count = this.#tabManager.clearFilter();
      this.#ui.updateFilterUI(null);
      this.#ui.hideFilterPanel();
      await this.#refreshTabView(count);
    });

    this.#ui.filterInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.#ui.filterApplyBtn.click();
      } else if (e.key === 'Escape') {
        this.#ui.hideFilterPanel();
      }
    });

    this.#ui.continueAllBtn.addEventListener('click', async () => {
      const count = this.#tabManager.clearFilter();
      this.#ui.updateFilterUI(null);
      this.#ui.resetMainView();
      await this.#refreshTabView(count);
    });

    // Close filter panel when clicking outside
    document.addEventListener('click', (e) => {
      if (!this.#ui.filterPanel.classList.contains('hidden') &&
          !this.#ui.filterPanel.contains(e.target) &&
          !this.#ui.filterBtn.contains(e.target)) {
        this.#ui.hideFilterPanel();
      }
    });
  }

  #handleKeyDown(e) {
    // Ctrl+Z or Cmd+Z for undo
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
      e.preventDefault();
      this.#undo();
      return;
    }

    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      this.#ui.addSwipeHint('left');
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      this.#ui.addSwipeHint('right');
    }
  }

  #handleKeyUp(e) {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      this.#ui.removeSwipeHint('left');
      this.#closeTab();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      this.#ui.removeSwipeHint('right');
      this.#keepTab();
    }
  }

  async #showCurrentTab() {
    const currentTab = this.#tabManager.getCurrentTab();

    if (!currentTab) {
      this.#showSummary();
      return;
    }

    // Switch to tab if preview mode is on
    await this.#tabManager.switchToTab(currentTab.id);

    const nextTab = this.#tabManager.getNextTab();
    const dupeCount = this.#tabManager.getDuplicatesOfCurrent().length;

    this.#ui.displayTab(currentTab, nextTab, dupeCount);
  }

  async #closeTab() {
    if (this.#ui.isAnimating || !this.#tabManager.getCurrentTab()) return;

    this.#ui.isAnimating = true;
    await this.#ui.animateSwipeLeft();

    const result = await this.#tabManager.closeCurrentTab(this.#storage.totalClosed);

    if (!result || !result.success) {
      this.#ui.isAnimating = false;
      this.#ui.clearSwipeAnimation('left');
      return;
    }

    // Update storage
    await this.#storage.saveTotalClosed(result.newTotalClosed);
    this.#ui.updateLifetimeDisplay(result.newTotalClosed);
    this.#ui.showUndoButton();

    setTimeout(() => {
      this.#ui.clearSwipeAnimation('left');
      this.#ui.updateProgress(this.#tabManager.getVisibleCount());
      this.#showCurrentTab().catch(err => console.error('Error showing tab:', err));
      this.#ui.isAnimating = false;
    }, ANIMATION_DURATION);
  }

  async #keepTab() {
    if (this.#ui.isAnimating || !this.#tabManager.getCurrentTab()) return;

    this.#ui.isAnimating = true;
    await this.#ui.animateSwipeRight();

    this.#tabManager.keepCurrentTab();
    this.#ui.showUndoButton();

    setTimeout(() => {
      this.#ui.clearSwipeAnimation('right');
      this.#ui.updateProgress(this.#tabManager.getVisibleCount());
      this.#showCurrentTab().catch(err => console.error('Error showing tab:', err));
      this.#ui.isAnimating = false;
    }, ANIMATION_DURATION);
  }

  async #undo() {
    if (this.#ui.isAnimating || !this.#tabManager.lastAction) return;

    this.#ui.isAnimating = true;

    const result = await this.#tabManager.undo(this.#storage.totalClosed);

    if (!result || !result.success) {
      this.#ui.isAnimating = false;
      return;
    }

    if (result.wasClosed) {
      await this.#storage.saveTotalClosed(result.newTotalClosed);
      this.#ui.updateLifetimeDisplay(result.newTotalClosed);
    }

    this.#ui.updateProgress(this.#tabManager.getVisibleCount());
    try {
      await this.#showCurrentTab();
    } catch (error) {
      console.error('Error showing tab:', error);
    }
    this.#ui.hideUndoButton();
    this.#ui.isAnimating = false;
  }

  async #closeDuplicates() {
    const result = await this.#tabManager.closeDuplicates(this.#storage.totalClosed);

    if (result.closedCount > 0) {
      await this.#storage.saveTotalClosed(result.newTotalClosed);
      this.#ui.updateLifetimeDisplay(result.newTotalClosed);
      this.#ui.updateProgress(this.#tabManager.getVisibleCount());
      try {
        await this.#showCurrentTab();
      } catch (error) {
        console.error('Error showing tab:', error);
      }
    }
  }

  #showSummary() {
    this.#ui.showSummary(
      this.#tabManager.closedCount,
      this.#tabManager.keptCount,
      this.#storage.totalClosed,
      !!this.#tabManager.filterHost,
      this.#tabManager.getUnprocessedCount()
    );
  }

  async #refreshTabView(count) {
    this.#ui.updateProgress(count);
    if (count === 0) {
      this.#ui.showEmptyState();
    } else {
      await this.#showCurrentTab();
    }
  }
}
