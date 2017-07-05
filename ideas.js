var style = document.createElement('link');
style.rel = 'stylesheet';
style.type = 'text/css';
style.href = chrome.extension.getURL('jsgrid-theme.css');
(document.head||document.documentElement).appendChild(style);

var style = document.createElement('link');
style.rel = 'stylesheet';
style.type = 'text/css';
style.href = chrome.extension.getURL('jsgrid.min.css');
(document.head||document.documentElement).appendChild(style);

var js = document.createElement('script');
js.src = chrome.extension.getURL('jsgrid.min.js');
(document.head||document.documentElement).appendChild(js);

function clean_ieaa_store() {
	 chrome.storage.local.clear(function() {
      console.log('Store Cleaned!');
      });
}

var controller = {
    loadData: function(filter) {
        return $.ajax({
            type: "GET",
            url: "/items",
            data: filter
        });
    },
    
    insertItem: function(item) {
        saveIdea(item['Idea']);
    },
    
    updateItem: function(item) {
        return $.ajax({
            type: "PUT",
            url: "/items",
            data: item
        });
    },
    
    deleteItem: function(item) {
        return $.ajax({
            type: "DELETE",
            url: "/items",
            data: item
        });
    },
}

function load_ideas() {

	chrome.storage.sync.get(null, function(items) {
      	console.log(items);

      	var ideas = [];

      	for(var link in items){
      		if (Array.isArray(items[link])) 
      			{
      				for (var idea in items[link]) 
      					{
      						var tmp = {};
      						console.log(items[link][idea]);
      						tmp["Link"] = link;
      						for(i in items[link][idea])
      						{
      							tmp["Date"] = i;
      							tmp["Idea"] = items[link][idea][i];	
      						}
      						ideas.push(tmp);
      					}
      				}
      			}

		 $("#jsGrid").jsGrid({
        width: "100%",
        height: "800px",
 
        inserting: true,
        editing: false,
        sorting: true,
        paging: true,
        searching: true,
 
        data: ideas,
        controller: controller,
 
        fields: [
            { name: "Date", type: "text", width: 100},
            //{ name: "Link", type: "link", width: 100 },
            { name: "Idea", type: "text", width: 450},
            { type: "control",
              editButton: false,
              itemTemplate: function(value, item) {
                              var $link = $("<a>").attr("href", item.Link).attr("target", "_blank").text("Link");
                              return $("<div>").append($link);
                          } 
            }
        ]
    });
  	});
}
//clean_ieaa_store();
load_ideas();