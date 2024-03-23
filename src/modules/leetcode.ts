import { Octokit } from "octokit";
import { FileToCommit } from "src/types/github";
import { debugReport, errorReport, notifyReport } from "src/modules/report";
import { GraghQueryRequest, QuestionTopicTags } from "src/types/leetcode";
import { SubmissionTrigger, SubmissionHandler } from "src/types/leetcode";
import { SubmissionDetails } from "src/types/leetcode";
import { commitSubmissions } from "src/modules/github";

/**
 * Set of submission IDs
 */
const submitted = new Set<number>();

/**
 * Lookup table for file extensions
 */
const extensionLookup = {
  cpp: "cpp",
  java: "java",
  python: "py",
  python3: "py",
  c: "c",
  csharp: "cs",
  javascript: "js",
  typescript: "ts",
  php: "php",
  swift: "swift",
  kotlin: "kt",
  dart: "dart",
  golang: "go",
  ruby: "rb",
  scala: "scala",
  rust: "rs",
  racket: "rkt",
  erlang: "erl",
  elixir: "ex",
  mysql: "sql",
  mssql: "sql",
  oraclesql: "sql",
  pythondata: "py",
  postgresql: "sql",
};

/**
 * Get the details of a submission
 * @param submissionId The ID of the submission
 */
export const getSubmissionDetails = async (
  submissionId: number
): Promise<SubmissionDetails> => {
  await debugReport({
    message: "Get the details of a submission",
    context: "leetcode.getSubmissionDetails",
  });

  const response = await fetch("https://leetcode.com/graphql/", {
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      query: `
        query submissionDetails($submissionId: Int!) {
          submissionDetails(submissionId: $submissionId) {
            runtimeDisplay
            memoryDisplay
            code
            statusCode
            lang {
              name
            }
            question {
              title
              titleSlug
            }
          }
        }
      `,
      variables: { submissionId },
      operationName: "submissionDetails",
    }),
    method: "POST",
    mode: "cors",
    credentials: "include",
  });
  if (!response.ok) {
    await errorReport({
      message: `Unexpected status code: ${response.status}`,
      context: "leetcode.getSubmissionDetails",
    });
  }
  const { data } = await response.json();
  return data.submissionDetails;
};

/**
 * Get the topic tags of a question
 * @param titleSlug The slug of the question
 */
export const getQuestionTopics = async (
  titleSlug: string
): Promise<QuestionTopicTags> => {
  await debugReport({
    message: "Get the topic tags of a question",
    context: "leetcode.getQuestionTopics",
  });

  const response = await fetch("https://leetcode.com/graphql/", {
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      query: `
      query singleQuestionTopicTags($titleSlug: String!) { 
        question(titleSlug: $titleSlug) { 
          topicTags { slug } 
        } 
      }
    `,
      variables: { titleSlug },
      operationName: "singleQuestionTopicTags",
    }),
    method: "POST",
    mode: "cors",
    credentials: "include",
  });
  if (!response.ok) {
    await errorReport({
      message: `Unexpected status code: ${response.status}`,
      context: "leetcode.getQuestionDetails",
    });
  }
  const { data } = await response.json();
  return data.question.topicTags;
};

/**
 * Initialize the leetcode module, for the content script
 */
export const initializeForeground = async (): Promise<void> => {
  await debugReport({
    message: "Initialize the LeetCode module, for the content script",
    context: "leetcode.initializeForeground",
  });

  chrome.runtime.onMessage.addListener(async (message: SubmissionTrigger) => {
    switch (message.type) {
      case "submission-trigger":
        const { submissionId } = message.payload;
        const details = await getSubmissionDetails(submissionId);
        const { statusCode } = details;
        if (statusCode !== 10) {
          break;
        }
        const { titleSlug } = details.question;
        const topicTags = await getQuestionTopics(titleSlug);
        const newMessage: SubmissionHandler = {
          type: "submission-handler",
          payload: { details, topicTags },
        };
        chrome.runtime.sendMessage(newMessage);
        break;
    }
    return true;
  });
};

/**
 * Initialize the leetcode module, for the background script
 * @param octokit The Octokit instance
 */
export const initializeBackground = async (octokit: Octokit): Promise<void> => {
  await debugReport({
    message: "Initialize the LeetCode module, for the background script",
    context: "leetcode.initializeBackground",
  });

  chrome.webRequest.onBeforeRequest.addListener(
    (details) => {
      const match = details.url.match(/detail\/(.*?)\/check/);
      submitted.add(parseInt(match[1]));
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
        const { submissionId } = request.variables;
        if (submitted.delete(submissionId)) {
          const message: SubmissionTrigger = {
            type: "submission-trigger",
            payload: { submissionId },
          };
          chrome.tabs.sendMessage(details.tabId, message);
        }
      }
    },
    { urls: ["https://leetcode.com/graphql/"] },
    ["requestBody"]
  );

  chrome.runtime.onMessage.addListener(async (message: SubmissionHandler) => {
    switch (message.type) {
      case "submission-handler":
        const { details } = message.payload;
        const prefix = details.question.titleSlug;
        const suffix = extensionLookup[details.lang.name];
        const payload: FileToCommit[] = [];
        for (const tag of message.payload.topicTags) {
          payload.push({
            path: `${tag.slug}/${prefix}.${suffix}`,
            content: message.payload.details.code,
          });
        }
        const commitMessage = [
          `:ballot_box_with_check: LC-${details.question.titleSlug}`,
          `[${details.runtimeDisplay}; ${details.memoryDisplay}]`,
        ].join(" ");
        await commitSubmissions(octokit, payload, commitMessage);
        const values = await chrome.storage.sync.get("shouldNotify");
        if (values.shouldNotify) {
          await notifyReport({
            message: `Pushed ${details.question.title} to GitHub!`,
            context: "leetcode.initializeBackground",
          });
        }
        break;
    }
    return true;
  });
};
