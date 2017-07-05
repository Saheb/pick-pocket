// function getSelectedIdea() {
//     var text = "";
//     if (window.getSelection) {
//         text = window.getSelection().toString();
//     } else if (document.selection && document.selection.type != "Control") {
//         text = document.selection.createRange().text;
//     }
//     return text;
// }

// function saveIdea(ideaText) {
//         // Get a value saved in a form.
//         var theValue = ideaText;
//         // Check that there's some code there.
//         if (!theValue) {
//           message('Error: No value specified');
//           return;
//         }
//         // Save it using the Chrome extension storage API.
//         chrome.storage.sync.set({'value': theValue}, function() {
//           // Notify that we saved.
//           message('Idea saved!');
//         });
//       }

//A generic onclick callback function.
function genericOnClick(info, tab) {
chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
  chrome.tabs.sendMessage(tabs[0].id, {greeting: "hello"}, function(response) {
    console.log(response.farewell);
  });
});
// }

chrome.contextMenus.create({"title" : "Pick Idea!", "onclick" : genericOnClick, "contexts" : ["page","selection","link","editable","image","video",
                "audio"]});
