// Storage service for Tab Swipe - handles browser storage operations with caching

export class StorageService {
  #totalClosed = 0;
  #previewMode = false;
  #loaded = false;

  get totalClosed() {
    return this.#totalClosed;
  }

  set totalClosed(value) {
    this.#totalClosed = value;
  }

  get previewMode() {
    return this.#previewMode;
  }

  set previewMode(value) {
    this.#previewMode = value;
  }

  async load() {
    try {
      const result = await browser.storage.local.get(['totalClosed', 'previewMode']);
      this.#totalClosed = result.totalClosed || 0;
      this.#previewMode = result.previewMode || false;
      this.#loaded = true;
      return { totalClosed: this.#totalClosed, previewMode: this.#previewMode };
    } catch (error) {
      console.error('Error loading stats:', error);
      return { totalClosed: 0, previewMode: false };
    }
  }

  async saveTotalClosed(value) {
    this.#totalClosed = value;
    try {
      await browser.storage.local.set({ totalClosed: value });
    } catch (error) {
      console.error('Error saving total closed:', error);
    }
  }

  async savePreviewMode(value) {
    this.#previewMode = value;
    try {
      await browser.storage.local.set({ previewMode: value });
    } catch (error) {
      console.error('Error saving preview mode:', error);
    }
  }
}
