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

function cleanIdeaStore() {
	 chrome.storage.local.clear(function() {
      console.log('Store Cleaned!');
      });
}

function toDateString(str) {
    return new Date(Date.parse(str)).toDateString();
}

var groupBy = function(xs, key) {
  return xs.reduce(function(rv, x) {
    (rv[x[key]] = rv[x[key]] || []).push(x);
    return rv;
  }, {});
};

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
                                tmp["Date"] = i.split('T')[0];
                                tmp["Timestamp"] = i;
      							tmp["Idea"] = items[link][idea][i];	
      						}
      						ideas.push(tmp);
      					}
      				}
      			}


     var groupedByDate = groupBy(ideas, 'Date');
     var groupedByLink = groupBy(ideas, 'Link');

     console.log("GroupedByDate:");
     console.log(groupedByDate);
     //console.log(groupedByLink);
     
     var groupedDateKeys = Object.keys(groupedByDate).filter(dt => dt.length == 10);
     var keys = groupedDateKeys.sort();
     console.log(groupedDateKeys.sort());             
     for (dt = groupedDateKeys.length - 1; dt >= 0 ; dt--) {
         console.log(keys[dt]);
       $('#idea_list').append('<h3>' + toDateString(keys[dt]) + '</h3>').append('<br>');
        groupedByDate[keys[dt]].sort(function(a, b) {
            return (a.Timestamp > b.Timestamp) ? -1 : ((a.Timestamp < b.Timestamp) ? 1 : 0);
        });
       for(var idea in groupedByDate[keys[dt]]) {
         var $link = $("<a>").attr("href", groupedByDate[keys[dt]][idea].Link).attr("target", "_blank").text('->');
         var $item = $('<li> <p>').text(groupedByDate[keys[dt]][idea].Idea).append(' ').append($link);
         $('#idea_list').append($item).append('<br>');
       }
       $('#idea_list').append('<hr>');
     }              
		 // $("#jsGrid").jsGrid({
   //      width: "100%",
   //      height: "800px",
 
   //      inserting: true,
   //      editing: false,
   //      sorting: true,
   //      paging: true,
   //      searching: true,
 
   //      data: ideas,
   //      controller: controller,
 
   //      fields: [
   //          { name: "Date", type: "text", width: 100},
   //          //{ name: "Link", type: "link", width: 100 },
   //          { name: "Idea", type: "text", width: 450},
   //          { type: "control",
   //            editButton: false,
   //            itemTemplate: function(value, item) {
   //                            var $link = $("<a>").attr("href", item.Link).attr("target", "_blank").text("Link");
   //                            return $("<div>").append($link);
   //                        } 
   //          }
   //      ]
   //  });
  });
}
//cleanIdeaStore();
load_ideas();