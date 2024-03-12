document.addEventListener('DOMContentLoaded', function() {
    let checkbox = document.getElementById('notificationStatus');
    console.log(checkbox);
    // Load the saved state from Chrome storage and set the checkbox accordingly
    chrome.storage.sync.get('notificationStatus', function(data) {
      checkbox.checked = data.notificationStatus;
    });

    // Save the state to Chrome storage whenever the checkbox is toggled
    checkbox.addEventListener('change', function() {
        chrome.storage.sync.set({ 'notificationStatus': this.checked });
    });
});