import { Message } from "./modules/message";
import { getQuestionDetails, getSubmissionDetails } from "./modules/service";

chrome.runtime.onMessage.addListener(async (message: Message) => {
  switch (message.type) {
    case "requestDetails":
      // Retrieve details from LeetCode
      const { id: submissionId } = message.payload;
      const submissionDetails = await getSubmissionDetails(submissionId);
      const { titleSlug } = submissionDetails.question;
      const questionDetails = await getQuestionDetails(titleSlug);
      // Send details to background for sync with GitHub
      chrome.runtime.sendMessage({
        type: "responseDetails",
        payload: { submissionDetails, questionDetails },
      });
  }
  return true;
});
