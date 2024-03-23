import { initializeBackground as githubInitialize } from "src/modules/github";
import { initializeBackground as leetcodeInitialize } from "src/modules/leetcode";

chrome.tabs.query({ url: "https://leetcode.com/*" }, (tabs) => {
  for (const tab of tabs) {
    chrome.tabs.reload(tab.id);
  }
  githubInitialize().then((octokit) => {
    leetcodeInitialize(octokit);
  });
});
