// Send 'authenticateGitHub' message on login button click to background
document.getElementById('loginButton').addEventListener('click', () => {
  chrome.runtime.sendMessage({ action: 'authenticateGitHub' });
});
  