import { initializeBackground as githubInitialize } from "src/modules/github";
import { initializeBackground as leetcodeInitialize } from "src/modules/leetcode";

// Reload all LeetCode tabs when the extension is just installed or updated
chrome.runtime.onInstalled.addListener(() => {
  chrome.tabs.query({ url: "https://leetcode.com/*" }, (tabs) => {
    for (const tab of tabs) {
      chrome.tabs.reload(tab.id);
    }
  });
});

// Initialize the background script
githubInitialize().then((octokit) => {
  leetcodeInitialize(octokit);
});
