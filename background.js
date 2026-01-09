// Background script - handles browser action click to open popup window

let popupWindowId = null;

browser.browserAction.onClicked.addListener(async () => {
  // Check if popup window already exists
  if (popupWindowId !== null) {
    try {
      const existingWindow = await browser.windows.get(popupWindowId);
      // Window exists, focus it
      await browser.windows.update(popupWindowId, { focused: true });
      return;
    } catch (e) {
      // Window was closed, reset ID
      popupWindowId = null;
    }
  }

  // Create new popup window
  const window = await browser.windows.create({
    url: 'popup.html',
    type: 'popup',
    width: 420,
    height: 600
  });

  popupWindowId = window.id;
});

// Track when popup window is closed
browser.windows.onRemoved.addListener((windowId) => {
  if (windowId === popupWindowId) {
    popupWindowId = null;
  }
});
