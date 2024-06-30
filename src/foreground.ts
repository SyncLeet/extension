import { Message } from "./utilities/message";
import { extensionLookup } from "./utilities/leetcode";
import { fetchSubmissionDetails } from "./utilities/leetcode";
import { fetchQuestionDetails } from "./utilities/leetcode";

const runMain = async () => {
  chrome.runtime.onMessage.addListener(async (request: Message) => {
    switch (request.action) {
      case "fetchSubmissionDetails":
        const { params } = request;
        const submission = await fetchSubmissionDetails(params.submissionId);
        const { titleSlug, title } = submission.question;
        const question = await fetchQuestionDetails(titleSlug);
        if (submission.totalCorrect === submission.totalTestcases) {
          const { runtimeDisplay, memoryDisplay } = submission;
          const message = `LC-${titleSlug} [Runtime: ${runtimeDisplay}; Memory: ${memoryDisplay}]`;
          const changes: { path: string; content: string }[] = [];
          for (const { slug: topicSlug } of question.topicTags) {
            const suffix = extensionLookup[submission.lang.name];
            changes.push({
              path: `${topicSlug}/${titleSlug}.${suffix}`,
              content: submission.code,
            });
          }
          chrome.runtime.sendMessage({
            action: "commitFiles",
            params: { message, changes },
          });
          chrome.runtime.sendMessage({
            action: "createNotifications",
            params: {
              title: "SyncLeet: Pushed to GitHub",
              message: `Question: ${title}`,
            },
          });
        }
        break;
    }
    return true;
  });
};

const onError = (error: Error) => {
  chrome.runtime.sendMessage({
    action: "createNotifications",
    params: {
      title: "SyncLeet: Error",
      message: error.message,
    },
  });
  chrome.storage.local.set({ foregroundError: error.message });
  console.error(error);
};

runMain().catch(onError);
