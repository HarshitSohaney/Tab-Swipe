// Storage operations for Tab Swipe

import { state } from './state.js';

export async function loadStats() {
  try {
    const result = await browser.storage.local.get(['totalClosed', 'previewMode']);
    state.totalClosedLifetime = result.totalClosed || 0;
    state.previewMode = result.previewMode || false;
    return { totalClosed: state.totalClosedLifetime, previewMode: state.previewMode };
  } catch (error) {
    console.error('Error loading stats:', error);
    return { totalClosed: 0, previewMode: false };
  }
}

export async function saveStats() {
  try {
    await browser.storage.local.set({ totalClosed: state.totalClosedLifetime });
  } catch (error) {
    console.error('Error saving stats:', error);
  }
}

export async function savePreviewPreference() {
  try {
    await browser.storage.local.set({ previewMode: state.previewMode });
  } catch (error) {
    console.error('Error saving preview preference:', error);
  }
}
