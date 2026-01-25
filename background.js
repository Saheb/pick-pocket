//A generic onclick callback function.
chrome.runtime.onInstalled.addListener(function () {
  chrome.contextMenus.create({
    "id": "pick-idea",
    "title": "Pick Idea",
    "contexts": ["page", "selection", "link", "editable", "image", "video", "audio"]
  });
});


chrome.contextMenus.onClicked.addListener(function (info, tab) {
  if (info.menuItemId === "pick-idea") {
    // Avoid sending messages to chrome:// URLs or if tab is undefined
    if (tab && tab.id && tab.url && !tab.url.startsWith("chrome://")) {
      chrome.tabs.sendMessage(tab.id, { greeting: "hello", selection: info.selectionText }, function (response) {
        if (chrome.runtime.lastError) {
          // Ignore "Could not establish connection" errors safely
          console.log("Ignored messaging error: ", chrome.runtime.lastError.message);
        } else if (response) {
          console.log(response.farewell);
        }
      });
      console.warn("Cannot pick idea from this page.");
    }
  }
});

// Listen for sync requests from content scripts (to bypass CSP)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.cmd === 'sync_idea') {
    syncToServer(request.data);
  }
});

const syncToServer = (idea) => {
  chrome.storage.sync.get(['serverUrl', 'syncEnabled'], function (settings) {
    if (!settings.syncEnabled || !settings.serverUrl) {
      console.log('Server sync disabled or URL not configured');
      return;
    }

    const url = settings.serverUrl.replace(/\/$/, '') + '/sync';
    console.log('Syncing to:', url, idea);

    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([idea])
    })
      .then(response => {
        if (!response.ok) throw new Error('Network response was not ok ' + response.statusText);
        return response.json();
      })
      .then(data => {
        console.log('Synced to server:', data);
      })
      .catch(error => {
        console.error('Failed to sync to server:', error);
      });
  });
};
