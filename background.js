//A generic onclick callback function.
function genericOnClick(info, tab) {
chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
  chrome.tabs.sendMessage(tabs[0].id, {greeting: "hello"}, function(response) {
    console.log(response.farewell);
  });
});
}

chrome.contextMenus.create({"title" : "Pick Idea", "onclick" : genericOnClick, "contexts" : ["page","selection","link","editable","image","video",
                "audio"]});
