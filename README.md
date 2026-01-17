# Tab Swipe

A Firefox extension for quickly reviewing and cleaning up your open tabs. Swipe through tabs one by one, deciding to close or keep each one.

## Features

- **Swipe Interface**: Use arrow keys or click to close (left) or keep (right) tabs
- **Undo Support**: Made a mistake? Press Ctrl+Z to restore the last closed tab
- **Filter by Domain**: Focus on tabs from a specific site (e.g., youtube.com)
- **Duplicate Detection**: Quickly close duplicate tabs with one click
- **Preview Mode**: Optionally switch to each tab as you review it
- **Lifetime Stats**: Track how many tabs you've closed across all sessions
- **Sorted by Age**: Oldest tabs appear first, helping you find forgotten ones

## Installation

### From Source (Development)

1. Clone or download this repository
2. Open Firefox and navigate to `about:debugging`
3. Click "This Firefox" in the left sidebar
4. Click "Load Temporary Add-on..."
5. Select the `manifest.json` file from this project
6. The extension icon will appear in your toolbar

### Debugging

1. After loading the extension in `about:debugging`, click "Inspect" next to Tab Swipe
2. This opens the developer tools for the extension's background script
3. To debug the popup:
   - Click the Tab Swipe icon to open the popup
   - Right-click inside the popup and select "Inspect"
   - Or use the Browser Console (Ctrl+Shift+J) to see all extension logs

### Common Issues

- **Can't see the active tab**: The extension excludes your current tab from the review list
- **Undo not working**: Undo only works for the most recent action and relies on Firefox's session restore

## Usage

1. Click the Tab Swipe icon in your toolbar
2. Review the displayed tab information (title, URL, last active time)
3. Press **Left Arrow** or click the left control to **close** the tab
4. Press **Right Arrow** or click the right control to **keep** the tab
5. Press **Ctrl+Z** to undo the last action
6. Use the filter button to focus on a specific domain
7. Click "Finish" when done to see your session summary

## Project Structure

```
tab-swipe/
├── manifest.json        # Extension manifest
├── popup.html           # Main UI
├── popup.css            # Styles
├── background.js        # Background script (opens popup)
├── js/
│   ├── main.js          # Entry point
│   ├── App.js           # Main orchestrator
│   ├── TabManager.js    # Tab state and operations
│   ├── UIController.js  # DOM manipulation
│   ├── StorageService.js# Browser storage wrapper
│   ├── TabItem.js       # Tab data model
│   └── utils.js         # Utility functions
└── icons/               # Extension icons
```

## Contributing

Contributions are welcome! Here's how to get started:

### Setting Up

1. Fork this repository
2. Clone your fork locally
3. Load the extension in Firefox as described above

### Making Changes

1. Create a new branch for your feature or fix
2. Make your changes
3. Test thoroughly in Firefox (see Debugging section)
4. Ensure the extension still works:
   - Swiping tabs left/right
   - Undo functionality
   - Filter panel
   - Duplicate detection
   - Preview mode toggle
   - Stats persistence

### Code Style

- Use ES6+ features (classes, arrow functions, async/await)
- Use private class fields (`#field`) for encapsulation
- Keep functions focused and single-purpose
- Add error handling for browser API calls

### Submitting

1. Commit your changes with a clear message
2. Push to your fork
3. Open a pull request with a description of your changes

## License

GNU AGPL v3
