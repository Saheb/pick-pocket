//A generic onclick callback function.
function genericOnClick(info, tab) {
  console.log(info.selectionText);
chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
  chrome.tabs.sendMessage(tabs[0].id, {greeting: "hello"}, function(response) {
    console.log(response.farewell);
  });
});
}

chrome.contextMenus.create({"title" : "Pick Idea", "onclick" : genericOnClick, "contexts" : ["page","selection","link","editable","image","video",
                "audio"]});

chrome.contextMenus.onClicked.addListener(function(sel){
       console.log(sel.selectionText);
});
