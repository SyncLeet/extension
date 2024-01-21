import { SubmissionDetails } from "./modules/interface";
import { Message } from "./modules/message";

chrome.runtime.onMessage.addListener(async (message: Message) => {
  switch (message.type) {
    case "requestDetails":
      const response = await fetch("https://leetcode.com/graphql/", {
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          query: `
            query submissionDetails($submissionId: Int!) {
              submissionDetails(submissionId: $submissionId) {
                runtimeDisplay
                runtimePercentile
                memoryDisplay
                memoryPercentile
                code
                lang {
                  name
                }
                question {
                  questionId
                  titleSlug
                }
              }
            }
          `,
          variables: { submissionId: message.payload.id },
          operationName: "submissionDetails",
        }),
        method: "POST",
        mode: "cors",
        credentials: "include",
      });
      if (response.ok) {
        const { data } = await response.json();
        const details: SubmissionDetails = data.submissionDetails;
        chrome.runtime.sendMessage({
          type: "responseDetails",
          payload: { details },
        });
      }
  }
});
