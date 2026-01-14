// Global variable to store parsed ideas for sharing
let allIdeas = [];

function cleanIdeaStore() {
  if (confirm("Are you sure you want to delete ALL saved ideas? This cannot be undone.")) {
    chrome.storage.local.clear(function () {
      console.log('Store Cleaned!');
      location.reload();
    });
  }
}

function toDateString(str) {
  return new Date(Date.parse(str)).toDateString();
}

function getFaviconUrl(url) {
  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
  } catch (e) {
    return "";
  }
}

var groupBy = function (xs, key) {
  return xs.reduce(function (rv, x) {
    (rv[x[key]] = rv[x[key]] || []).push(x);
    return rv;
  }, {});
};

// --- Mode Management ---

function loadMode() {
  chrome.storage.local.get('pickpocket_mode', function (result) {
    // Default to self mode (isSocialMode = false)
    const isSocialMode = result.pickpocket_mode === 'social';
    $('#mode-toggle').prop('checked', isSocialMode);
    applyMode(isSocialMode);
  });
}

function applyMode(isSocialMode) {
  if (isSocialMode) {
    $('body').removeClass('self-mode');
  } else {
    $('body').addClass('self-mode');
  }
}

function saveMode(isSocialMode) {
  const mode = isSocialMode ? 'social' : 'self';
  chrome.storage.local.set({ 'pickpocket_mode': mode });
}

// --- Gmail Share Functions ---

function openGmail(subject, body) {
  const url = `https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.open(url, '_blank');
}

function formatIdeaForEmail(idea) {
  return `${idea.Idea}\n   Source: ${idea.Link}\n`;
}

function shareIdea(idea) {
  const subject = "Picked Idea from Pick Pocket";
  const body =
    `Here's an idea I saved:\n\n` +
    formatIdeaForEmail(idea) +
    `\n---\nSent via Pick Pocket`;
  openGmail(subject, body);
}

function shareDayIdeas(dateKey, ideas) {
  const dateStr = toDateString(dateKey);
  const subject = `Pick Pocket Ideas from ${dateStr}`;

  let body = `Ideas I saved on ${dateStr}:\n\n`;
  ideas.forEach((idea, index) => {
    body += `${index + 1}. ${formatIdeaForEmail(idea)}\n`;
  });
  body += `---\nSent via Pick Pocket`;

  openGmail(subject, body);
}

function shareAllIdeas() {
  if (allIdeas.length === 0) {
    alert("No ideas to share!");
    return;
  }

  const subject = "All My Pick Pocket Ideas";

  // Group by date for nice formatting
  const groupedByDate = groupBy(allIdeas, 'Date');
  const sortedDates = Object.keys(groupedByDate).sort((a, b) => new Date(b) - new Date(a));

  let body = `Here are all my saved ideas:\n\n`;

  sortedDates.forEach(dateKey => {
    body += `=== ${toDateString(dateKey)} ===\n`;
    groupedByDate[dateKey].forEach((idea, index) => {
      body += `${index + 1}. ${formatIdeaForEmail(idea)}\n`;
    });
    body += `\n`;
  });

  body += `---\nTotal: ${allIdeas.length} ideas\nSent via Pick Pocket`;

  openGmail(subject, body);
}

// --- Delete Function ---

function deleteIdea(link, timestamp) {
  chrome.storage.local.get(link, function (items) {
    if (items[link] && Array.isArray(items[link])) {
      // Filter out the idea with matching timestamp
      const updatedIdeas = items[link].filter(ideaObj => {
        const ts = Object.keys(ideaObj)[0];
        return ts !== timestamp;
      });

      if (updatedIdeas.length === 0) {
        // No more ideas for this link, remove the key entirely
        chrome.storage.local.remove(link, function () {
          console.log('Deleted last idea for link, removed key');
          load_ideas(); // Refresh
        });
      } else {
        // Update with remaining ideas
        const store = {};
        store[link] = updatedIdeas;
        chrome.storage.local.set(store, function () {
          console.log('Idea deleted');
          load_ideas(); // Refresh
        });
      }
    }
  });
}

// --- Main Load Function ---

function load_ideas() {
  chrome.storage.local.get(null, function (items) {
    console.log(items);

    allIdeas = []; // Reset global

    for (var link in items) {
      // Skip our settings keys
      if (link === 'pickpocket_mode') continue;

      if (Array.isArray(items[link])) {
        for (var idea in items[link]) {
          var tmp = {};
          tmp["Link"] = link;
          for (i in items[link][idea]) {
            tmp["Date"] = i.split('T')[0];
            tmp["Timestamp"] = i;
            tmp["Idea"] = items[link][idea][i];
          }
          allIdeas.push(tmp);
        }
      }
    }

    // Clear list first to avoid duplicates on reload
    $('#idea_list').empty();

    if (allIdeas.length === 0) {
      $('#idea_list').append('<p style="text-align:center; color: #888;">No ideas saved yet. Go pick some!</p>');
      return;
    }

    var groupedByDate = groupBy(allIdeas, 'Date');
    var groupedDateKeys = Object.keys(groupedByDate).filter(dt => dt.length == 10);
    var keys = groupedDateKeys.sort(function (a, b) {
      return new Date(b) - new Date(a); // Sort descending
    });

    for (let dt of keys) {
      // Date Header Row with share button
      const dateHeaderRow = $(`
        <div class="date-header-row">
          <h3 class="date-header">${toDateString(dt)}</h3>
          <button class="share-btn share-day-btn" data-date="${dt}">📧 Share Day</button>
        </div>
      `);
      $('#idea_list').append(dateHeaderRow);

      groupedByDate[dt].sort(function (a, b) {
        return (a.Timestamp > b.Timestamp) ? -1 : ((a.Timestamp < b.Timestamp) ? 1 : 0);
      });

      for (let idx = 0; idx < groupedByDate[dt].length; idx++) {
        const idea = groupedByDate[dt][idx];
        var srcIconUrl = getFaviconUrl(idea.Link);

        // Always try to show an icon
        let iconHtml = `<img src="${srcIconUrl}" class="site-icon" onerror="this.style.display='none'">`;

        const itemHtml = `
            <li class="idea-item" data-date="${dt}" data-idx="${idx}" data-link="${idea.Link}" data-timestamp="${idea.Timestamp}">
                <div class="idea-content">${idea.Idea}</div>
                <div class="idea-meta">
                    <div class="idea-meta-left">
                        ${iconHtml}
                        <a href="${idea.Link}" target="_blank" class="idea-link">Source</a>
                    </div>
                    <div class="idea-actions">
                        <button class="share-btn share-idea-btn" data-date="${dt}" data-idx="${idx}">📧 Share</button>
                        <button class="delete-btn delete-idea-btn" data-link="${idea.Link}" data-timestamp="${idea.Timestamp}">🗑️ Delete</button>
                    </div>
                </div>
            </li>
        `;
        $('#idea_list').append(itemHtml);
      }
      $('#idea_list').append('<hr>');
    }

    // Bind share buttons for individual ideas
    $('.share-idea-btn').click(function () {
      const dateKey = $(this).data('date');
      const idx = $(this).data('idx');
      const ideas = groupedByDate[dateKey];
      if (ideas && ideas[idx]) {
        shareIdea(ideas[idx]);
      }
    });

    // Bind share buttons for days
    $('.share-day-btn').click(function () {
      const dateKey = $(this).data('date');
      const ideas = groupedByDate[dateKey];
      if (ideas && ideas.length > 0) {
        shareDayIdeas(dateKey, ideas);
      }
    });

    // Bind delete buttons
    $('.delete-idea-btn').click(function () {
      const link = $(this).data('link');
      const timestamp = $(this).data('timestamp');
      if (confirm('Delete this idea?')) {
        deleteIdea(link, timestamp);
      }
    });
  });
}

// Bind buttons
$(document).ready(function () {
  loadMode();
  load_ideas();

  $('#clear-btn').click(cleanIdeaStore);
  $('#share-all-btn').click(shareAllIdeas);

  // Mode toggle handler
  $('#mode-toggle').change(function () {
    const isSocialMode = $(this).is(':checked');
    applyMode(isSocialMode);
    saveMode(isSocialMode);
  });
});