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
    } else {
      console.warn("Cannot pick idea from this page.");
    }
  }
});
