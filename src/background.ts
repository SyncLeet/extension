// import { newOctokit, commitFiles, newRepository } from "./utilities/github";
// import { Message } from "./utilities/message";

// const runMain = async () => {
//   const octokit = await newOctokit();
//   await newRepository(octokit);
//   chrome.runtime.onMessage.addListener(async (request: Message) => {
//     switch (request.action) {
//       // Listen for messages from the content script to commit files
//       case "commitFiles": {
//         const { message, changes } = request.params;
//         await commitFiles(octokit, message, changes);
//         break;
//       }
//       // Listen for messages from the content script to create notifications
//       case "createNotifications": {
//         const shouldNotify = await new Promise<boolean>((resolve) => {
//           chrome.storage.local.get("shouldNotify", (result) => {
//             resolve(result.shouldNotify);
//           });
//         });
//         if (shouldNotify) {
//           const { title, message } = request.params;
//           chrome.notifications.create({
//             type: "basic",
//             iconUrl: chrome.runtime.getURL("asset/image/logox128.png"),
//             title,
//             message,
//           });
//         }
//         break;
//       }
//     }
//     return true;
//   });
//   // Listen for periodic submission checks to capture submission IDs
//   const submitted = new Set<number>();
//   chrome.webRequest.onBeforeRequest.addListener(
//     (details) => {
//       const match = details.url.match(/detail\/(.*?)\/check/);
//       submitted.add(parseInt(match[1], 10));
//     },
//     { urls: ["https://leetcode.com/submissions/detail/*/check/"] }
//   );
//   // Listen for the first GraphQL request to fetch submission details, that is when check is complete
//   chrome.webRequest.onBeforeRequest.addListener(
//     (details) => {
//       const encoded = details.requestBody.raw[0].bytes;
//       const decoder = new TextDecoder("utf-8");
//       const decoded = decoder.decode(encoded);
//       const request = JSON.parse(decoded);
//       if (request.operationName == "submissionDetails") {
//         const submissionId = request.variables.submissionId;
//         if (submitted.delete(submissionId)) {
//           chrome.tabs.sendMessage(details.tabId, {
//             action: "fetchSubmissionDetails",
//             params: { submissionId },
//           });
//         }
//       }
//     },
//     { urls: ["https://leetcode.com/graphql/"] },
//     ["requestBody"]
//   );
// };

// // Error handler function
// const onError = (error: Error) => {
//   chrome.notifications.create({
//     type: "basic",
//     iconUrl: chrome.runtime.getURL("asset/image/logox128.png"),
//     title: "SyncLeet: Error",
//     message: error.message,
//   });
//   chrome.storage.local.set({ backgroundError: error.message });
//   console.error(error);
// };

// // Run the main function and handle errors
// runMain().catch(onError);

chrome.cookies.get(
  {
    url: "https://leetcode.com",
    name: "LEETCODE_SESSION",
  },
  (cookie) => {
    fetch("https://leetcode.com/graphql/", {
      headers: {
        "content-type": "application/json",
        cookie: `LEETCODE_SESSION=${cookie.value}`,
      },
      body: '{"query":"\\n    query submissionDetails($submissionId: Int!) {\\n  submissionDetails(submissionId: $submissionId) {\\n    runtime\\n    runtimeDisplay\\n    runtimePercentile\\n    runtimeDistribution\\n    memory\\n    memoryDisplay\\n    memoryPercentile\\n    memoryDistribution\\n    code\\n    timestamp\\n    statusCode\\n    user {\\n      username\\n      profile {\\n        realName\\n        userAvatar\\n      }\\n    }\\n    lang {\\n      name\\n      verboseName\\n    }\\n    question {\\n      questionId\\n      titleSlug\\n      hasFrontendPreview\\n    }\\n    notes\\n    flagType\\n    topicTags {\\n      tagId\\n      slug\\n      name\\n    }\\n    runtimeError\\n    compileError\\n    lastTestcase\\n    codeOutput\\n    expectedOutput\\n    totalCorrect\\n    totalTestcases\\n    fullCodeOutput\\n    testDescriptions\\n    testBodies\\n    testInfo\\n    stdOutput\\n  }\\n}\\n    ","variables":{"submissionId":1320811270},"operationName":"submissionDetails"}',
      method: "POST",
    })
      .then((response) => response.json())
      .then((data) => console.log(data));
  }
);
