// Tab Manager for Tab Swipe - manages tab collection, state, and operations

import { TabItem } from './TabItem.js';

export class TabManager {
  #tabs = [];
  #currentIndex = 0;
  #closedCount = 0;
  #keptCount = 0;
  #filterHost = null;
  #lastAction = null;
  #originalTabId = null;
  #previewMode = false;

  // Callbacks
  onStatsUpdated = null;
  onTabChanged = null;

  get closedCount() {
    return this.#closedCount;
  }

  get keptCount() {
    return this.#keptCount;
  }

  get filterHost() {
    return this.#filterHost;
  }

  get previewMode() {
    return this.#previewMode;
  }

  set previewMode(value) {
    this.#previewMode = value;
  }

  get lastAction() {
    return this.#lastAction;
  }

  #getVisibleTabs() {
    return this.#tabs.filter(tab =>
      !tab.processed && tab.matchesFilter(this.#filterHost)
    );
  }

  getCurrentTab() {
    const visible = this.#getVisibleTabs();
    return visible[this.#currentIndex] || null;
  }

  getNextTab() {
    const visible = this.#getVisibleTabs();
    return visible[this.#currentIndex + 1] || null;
  }

  getVisibleCount() {
    return this.#getVisibleTabs().length;
  }

  getDuplicatesOfCurrent() {
    const current = this.getCurrentTab();
    if (!current) return [];

    return this.#getVisibleTabs().filter(tab =>
      tab.id !== current.id && tab.url === current.url
    );
  }

  getUnprocessedCount() {
    return this.#tabs.filter(t => !t.processed).length;
  }

  async loadTabs() {
    const browserTabs = await browser.tabs.query({ windowType: 'normal' });
    const activeTab = browserTabs.find(tab => tab.active);
    this.#originalTabId = activeTab?.id;

    // Create TabItem objects, excluding active tab, sorted by lastAccessed
    this.#tabs = browserTabs
      .filter(tab => !tab.active)
      .sort((a, b) => (a.lastAccessed || 0) - (b.lastAccessed || 0))
      .map(tab => new TabItem(tab));

    this.#currentIndex = 0;
    return this.getVisibleCount();
  }

  applyFilter(hostFilter) {
    this.#filterHost = hostFilter?.trim().toLowerCase() || null;
    this.#currentIndex = 0;
    return this.getVisibleCount();
  }

  clearFilter() {
    this.#filterHost = null;
    this.#currentIndex = 0;
    return this.getVisibleCount();
  }

  async switchToTab(tabId) {
    if (!this.#previewMode) return;
    try {
      await browser.tabs.update(tabId, { active: true });
      const currentWindow = await browser.windows.getCurrent();
      await browser.windows.update(currentWindow.id, { focused: true });
    } catch (error) {
      console.error('Error switching tab:', error);
    }
  }

  async closeCurrentTab(totalClosedLifetime) {
    const tab = this.getCurrentTab();
    if (!tab) return null;

    try {
      await browser.tabs.remove(tab.id);

      // Get session ID for potential undo
      const sessions = await browser.sessions.getRecentlyClosed({ maxResults: 1 });
      const sessionId = sessions[0]?.tab?.sessionId;

      tab.markClosed(sessionId);
      this.#closedCount++;
      this.#lastAction = tab;

      return {
        success: true,
        newTotalClosed: totalClosedLifetime + 1
      };
    } catch (error) {
      console.error('Error closing tab:', error);
      return { success: false };
    }
  }

  keepCurrentTab() {
    const tab = this.getCurrentTab();
    if (!tab) return false;

    tab.markKept();
    this.#keptCount++;
    this.#lastAction = tab;
    return true;
  }

  async undo(totalClosedLifetime) {
    const tab = this.#lastAction;
    if (!tab) return null;

    if (tab.action === 'closed') {
      try {
        if (tab.sessionId) {
          await browser.sessions.restore(tab.sessionId);
        }
        this.#closedCount--;
        tab.reset();
        this.#lastAction = null;
        return {
          success: true,
          wasClosed: true,
          newTotalClosed: totalClosedLifetime - 1
        };
      } catch (error) {
        console.error('Error restoring tab:', error);
        return { success: false };
      }
    } else if (tab.action === 'kept') {
      this.#keptCount--;
      tab.reset();
      this.#lastAction = null;
      return {
        success: true,
        wasClosed: false
      };
    }

    return { success: false };
  }

  async closeDuplicates(totalClosedLifetime) {
    const dupes = this.getDuplicatesOfCurrent();
    if (dupes.length === 0) return { closedCount: 0, newTotalClosed: totalClosedLifetime };

    let closedCount = 0;
    for (const tab of dupes) {
      try {
        await browser.tabs.remove(tab.id);
        tab.markClosed(null); // No undo for bulk close
        this.#closedCount++;
        closedCount++;
      } catch (error) {
        console.error('Error closing duplicate tab:', error);
      }
    }

    return {
      closedCount,
      newTotalClosed: totalClosedLifetime + closedCount
    };
  }

  resetSessionStats() {
    this.#closedCount = 0;
    this.#keptCount = 0;
    this.#currentIndex = 0;
    this.#lastAction = null;
  }
}
