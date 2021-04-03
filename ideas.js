function cleanIdeaStore() {
  chrome.storage.local.clear(function () {
    console.log('Store Cleaned!');
  });
}

function toDateString(str) {
  return new Date(Date.parse(str)).toDateString();
}

function getSrcWebsiteImageFilename(pageUrl) {
  if (pageUrl.includes("quora.com"))
    return "quora.png";
  else if (pageUrl.includes("stackoverflow.com"))
    return "stackoverflow.png";
  else if (pageUrl.includes("reddit.com"))
    return "reddit.png";
  else if (pageUrl.includes("news.ycombinator.com"))
    return "hn.gif";
  else
    return "";
}

var groupBy = function (xs, key) {
  return xs.reduce(function (rv, x) {
    (rv[x[key]] = rv[x[key]] || []).push(x);
    return rv;
  }, {});
};

function load_ideas() {

  chrome.storage.sync.get(null, function (items) {
    console.log(items);

    var ideas = [];

    for (var link in items) {
      if (Array.isArray(items[link])) {
        for (var idea in items[link]) {
          var tmp = {};
          console.log(items[link][idea]);
          tmp["Link"] = link;
          for (i in items[link][idea]) {
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

    var groupedDateKeys = Object.keys(groupedByDate).filter(dt => dt.length == 10);
    var keys = groupedDateKeys.sort();
    console.log(groupedDateKeys.sort());
    for (dt = groupedDateKeys.length - 1; dt >= 0; dt--) {
      console.log(keys[dt]);
      $('#idea_list').append('<h3 style="color: grey">' + toDateString(keys[dt]) + '</h3>');
      groupedByDate[keys[dt]].sort(function (a, b) {
        return (a.Timestamp > b.Timestamp) ? -1 : ((a.Timestamp < b.Timestamp) ? 1 : 0);
      });
      for (var idea in groupedByDate[keys[dt]]) {
        var $link = $("<a>").attr("href", groupedByDate[keys[dt]][idea].Link).attr("target", "_blank").text('\u2192');
        var srcFilename = getSrcWebsiteImageFilename(groupedByDate[keys[dt]][idea].Link);
        var $src_img = $("<img>").attr("src", srcFilename).attr("style", "width:15px;height:15px;");
        var $item = $('<li> <p>').text(groupedByDate[keys[dt]][idea].Idea);
        if(srcFilename != "")
          $item.append(' ').append($src_img).append(' ').append($link);
        else 
          $item.append(' ').append($link);
        $('#idea_list').append($item).append('<br>');
      }
      $('#idea_list').append('<hr>');
    }
  });
}
//cleanIdeaStore();
load_ideas();