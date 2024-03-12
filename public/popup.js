document.addEventListener('DOMContentLoaded', function() {
    var checkbox = document.getElementById('notificationStatus');
    
    // Load the saved state from Chrome storage and set the checkbox accordingly
    chrome.storage.sync.get('notificationStatus', function(data) {
      checkbox.checked = data.notificationStatus;
    });

    // Save the state to Chrome storage whenever the checkbox is toggled
    checkbox.addEventListener('change', function() {
        chrome.storage.sync.set({ 'notificationStatus': this.checked });
    });
});