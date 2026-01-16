// TabItem wrapper for browser tabs

export class TabItem {
  constructor(browserTab) {
    this.id = browserTab.id;
    this.url = browserTab.url;
    this.title = browserTab.title;
    this.favIconUrl = browserTab.favIconUrl;
    this.lastAccessed = browserTab.lastAccessed;

    // State tracking
    this.processed = false;
    this.action = null; // 'kept' | 'closed' | null
    this.sessionId = null; // For undo of closed tabs
  }

  get hostname() {
    try {
      return new URL(this.url).hostname;
    } catch {
      return null;
    }
  }

  markKept() {
    this.processed = true;
    this.action = 'kept';
  }

  markClosed(sessionId) {
    this.processed = true;
    this.action = 'closed';
    this.sessionId = sessionId;
  }

  reset() {
    this.processed = false;
    this.action = null;
    this.sessionId = null;
  }

  matchesFilter(filterHost) {
    if (!filterHost) return true;
    const hostname = this.hostname;
    return hostname && hostname.toLowerCase().includes(filterHost.toLowerCase());
  }
}
