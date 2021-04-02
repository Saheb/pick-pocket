var style = document.createElement('link');
// style.rel = 'stylesheet';
// style.type = 'text/css';
// style.href = chrome.extension.getURL('selection-sharer.css');
// (document.head||document.documentElement).appendChild(style);

// var js = document.createElement('script');
// js.src = chrome.extension.getURL('jquery-3.2.1.min.js');
// (document.head||document.documentElement).appendChild(js);

// var js = document.createElement('script');
// js.src = chrome.extension.getURL('selection-sharer.js');
// (document.head||document.documentElement).appendChild(js);

/*

$("#__w2_wMFGqp38127_link").closest(".answer_permalink").href

getSelectionTextAndContainerElement()
https://stackoverflow.com/a/4637223/1421983

*/

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

function getSelectionTextAndContainerElement() {
    var text = "", containerElement = null;
    if (typeof window.getSelection != "undefined") {
        var sel = window.getSelection();
        if (sel.rangeCount) {
            var node = sel.getRangeAt(0).commonAncestorContainer;
            containerElement = node.nodeType == 1 ? node : node.parentNode;
            text = sel.toString();
        }
    } else if (typeof document.selection != "undefined" &&
               document.selection.type != "Control") {
        var textRange = document.selection.createRange();
        containerElement = textRange.parentElement();
        text = textRange.text;
    }
    return {
        text: text,
        containerElement: containerElement
    };
}

function saveIdea(ideaText, pageUrl) {
    console.log("Saving Idea ...");
    ideaText = ideaText.replace(/<(?:.|\n)*?>/gm, '')
    console.info(ideaText);
    if (!ideaText) {
      console.log('Error: No value specified');
      return;
    }
    // Save it using the Chrome extension storage API.
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
    var pageUrl = window.location.href;
    var elm = getSelectionTextAndContainerElement().containerElement;
    var traceLink = extractTraceUrl(elm, pageUrl);
    saveIdea(getSelectedIdea(), traceLink);
    
    if (request.greeting == "hello")
      sendResponse({farewell: "goodbye"});
});

function extractTraceUrl(elm, pageUrl) {
    if(pageUrl.includes("quora.com"))
        return extractQuoraPermalink(elm);
    else if(pageUrl.includes("stackoverflow.com"))
        return extractStackoverflowPermalink(elm);
    else if (pageUrl.includes("reddit.com"))
        return extractRedditPermalink(elm);
    else if (pageUrl.includes("news.ycombinator.com"))
        return extractHNPermalink(elm);
    else
        return pageUrl;
}

function extractQuoraPermalink(elm) {
    var parent = $(elm).closest("div.q-box.qu-pt--medium.qu-px--medium.qu-pb--tiny");
    var temp = parent
    .find("a[color~='gray_dark']")
    .filter(function() { 
        console.info($(this).text() === ""); 
        return $(this).text()=== "" 
    });
    var qString = parent.find(".q-flex.qu-mb--tiny")[1].children[0].children[0].href;
    var userId = temp[1].pathname.replace("profile", "answer");
    var qPermaLink = qString + userId;
    console.log(qPermaLink);
    return qPermaLink;
}

function extractStackoverflowPermalink(elm){
    var soPermaLink = $(elm).parents(".answercell").find("a[title~='permalink']")[0].href
    console.log(soPermaLink);
    return soPermaLink;
}

function extractRedditPermalink(elm){
    var rPermaLink = $(elm).parents("div.entry").find("a.bylink")[0].href
    console.log(rPermaLink);
    return rPermaLink;
}

function extractHNPermalink(elm) {
    var hnPermaLink = $(elm.previousSibling.parentNode.parentNode).find("span.age")[0].children[0].href;
    console.log(hnPermaLink);
    return hnPermaLink;
}