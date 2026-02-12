// Saves options to chrome.storage
function saveOptions() {
  const serverUrl = document.getElementById('server_url').value.trim();
  const mailingFrequency = document.getElementById('mailing_frequency').value;
  const syncEnabled = document.getElementById('sync_enabled').checked;
  const birthYear = document.getElementById('birth_year').value;

  chrome.storage.sync.set({
    serverUrl: serverUrl,
    mailingFrequency: mailingFrequency,
    syncEnabled: syncEnabled,
    birthYear: birthYear
  }, function () {
    // Update status to let user know options were saved
    const status = document.getElementById('status');
    status.textContent = '✓ Settings saved!';
    status.className = 'success';
    setTimeout(function () {
      status.textContent = '';
      status.className = '';
    }, 2000);
  });
}

// Restores settings using the preferences stored in chrome.storage
function restoreOptions() {
  chrome.storage.sync.get({
    serverUrl: '',
    mailingFrequency: '7',
    syncEnabled: true,
    birthYear: ''
  }, function (items) {
    document.getElementById('server_url').value = items.serverUrl;
    document.getElementById('mailing_frequency').value = items.mailingFrequency;
    document.getElementById('sync_enabled').checked = items.syncEnabled;
    document.getElementById('birth_year').value = items.birthYear || '';
  });
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions);