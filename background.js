/**
 * Background Service Worker
 */

chrome.runtime.onInstalled.addListener(() => {
  console.log('PaletteExtractor installed');
});

// Handle keyboard shortcuts
chrome.commands.onCommand.addListener((command) => {
  if (command === '_execute_action') {
    chrome.action.openPopup();
  }
});
