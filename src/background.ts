import { GraghQueryRequest } from "./modules/interface";
import { Message } from "./modules/message";

const submittedIds = new Set<number>();

chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    const regex = /detail\/(.*?)\/check/;
    const match = details.url.match(regex);
    submittedIds.add(parseInt(match[1], 10));
  },
  { urls: ["https://leetcode.com/submissions/detail/*/check/"] }
);

chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    const encoded = details.requestBody.raw[0].bytes;
    const decoder = new TextDecoder("utf-8");
    const decoded = decoder.decode(encoded);
    const request: GraghQueryRequest = JSON.parse(decoded);
    if (request.operationName == "submissionDetails") {
      const sid = request.variables.submissionId;
      if (submittedIds.delete(sid)) {
        chrome.tabs.sendMessage(details.tabId, {
          type: "requestDetails",
          payload: {
            submissionId: sid,
          },
        });
      }
    }
  },
  { urls: ["https://leetcode.com/graphql/"] },
  ["requestBody"]
);

/**
 * @example console.log(message.payload.details)
 * {
 *   "runtimeDisplay": "36 ms",
 *   "runtimePercentile": 91.8451,
 *   "memoryDisplay": "17.5 MB",
 *   "memoryPercentile": 45.47570000000001,
 *   "code": "class Solution:\n    def hIndex(self, citations: List[int]) -> int:\n        citations.sort()\n        n, h = len(citations), 0\n        for i, x in enumerate(citations):\n            papersLeft = n - i\n            for y in range(h, x):\n                if papersLeft >= y:\n                    h = y\n            if papersLeft >= x:\n                h = x\n                continue\n            break\n        return h",
 *   "lang": {
 *     "name": "python3"
 *   },
 *   "question": {
 *     "questionId": "274",
 *     "titleSlug": "h-index"
 *   }
 * }
 */

chrome.runtime.onMessage.addListener((message: Message) => {
  switch (message.type) {
    case "responseDetails":
      console.log(message.payload.details);
      return true;
  }
});
