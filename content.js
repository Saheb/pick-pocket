var style = document.createElement('link');
style.rel = 'stylesheet';
style.type = 'text/css';
style.href = chrome.extension.getURL('selection-sharer.css');
(document.head||document.documentElement).appendChild(style);

var js = document.createElement('script');
js.src = chrome.extension.getURL('jquery-3.2.1.min.js');
(document.head||document.documentElement).appendChild(js);

var js = document.createElement('script');
js.src = chrome.extension.getURL('selection-sharer.js');
(document.head||document.documentElement).appendChild(js);

console.log("Piccadilly is organizing ideas for you!");

function getSelectedIdea() {
    var text = "";
    if (window.getSelection) {
        text = window.getSelection().toString();
    } else if (document.selection && document.selection.type != "Control") {
        text = document.selection.createRange().text;
    }
    return text;
}

function saveIdea(ideaText) {
    console.log("Saving Idea ...");
    console.info(ideaText);
    if (!ideaText) {
      console.log('Error: No value specified');
      return;
    }
    // Save it using the Chrome extension storage API.
    var pageUrl = (window.location.origin + window.location.pathname).toString();
    var store = {};
    
    chrome.storage.sync.get(pageUrl, function(items){
        if($.isEmptyObject(items)) //First time picking ideas from this url
        {
            var store = items;
            var linkIdeas = [];
            var obj = {};
            obj[(new Date()).toISOString()] = ideaText;
            linkIdeas.push(obj);
            store[pageUrl] = linkIdeas;
        }
        else {
            var store = items;
            var linkIdeas = items[pageUrl];
            var obj = {};
            obj[(new Date()).toISOString()] = ideaText;
            linkIdeas.push(obj);
            store[pageUrl] = linkIdeas;
        }
      chrome.storage.sync.set(store, function() {
      console.log('Idea Saved!');
      });
  });
}

// function getIdeas() {
//     var pageUrl = (window.location.origin + window.location.pathname).toString();
//       chrome.storage.sync.get(pageUrl, function(items) {
//       console.log("In getIdeas!");
//       console.log(items);
//     });
// }      

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    saveIdea(getSelectedIdea());
    getIdeas();
    if (request.greeting == "hello")
      sendResponse({farewell: "goodbye"});
});

$('p').selectionSharer();
