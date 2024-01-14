chrome.webRequest.onBeforeSendHeaders.addListener(
  (details) => {
    console.log(details);
  },
  { urls: ["https://leetcode.com/submissions/detail/*/check"] },
  ["requestHeaders"]
);
