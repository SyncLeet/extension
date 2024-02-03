import { Octokit } from "octokit";
import { QuestionDetails, SubmissionDetails } from "./interface";

export const newOctokitOptions = async (
  code: string
): Promise<{
  auth: string;
}> => {
  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
      code,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to Get Access Token: ${response.status}`);
  }

  const payload = await response.json();
  return { auth: payload.access_token };
};

export const newSyncingRepository = async (octokit: Octokit): Promise<void> => {
  const { data } = await octokit.rest.repos.listForAuthenticatedUser();
  const syncRepo = data.find((repo) => repo.name === "LeetCode");
  if (!syncRepo) {
    await octokit.rest.repos.createUsingTemplate({
      template_owner: "SenF1",
      template_repo: "SyncLeet",
      name: "LeetCode",
      description: "Sync: LeetCode -> GitHub",
      private: true,
    });
  }
};

export const getSubmissionDetails = async (
  submissionId: number
): Promise<SubmissionDetails> => {
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
            lang {
              name
            }
            question {
              questionId
              titleSlug
            }
            totalCorrect
            totalTestcases
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
    throw new Error(`Failed to Get Submission Details: ${response.status}`);
  }

  const { data } = await response.json();
  return data.submissionDetails;
};

export const getQuestionDetails = async (
  titleSlug: string
): Promise<QuestionDetails> => {
  const response = await fetch("https://leetcode.com/graphql/", {
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      query: `
      query questionTitle($titleSlug: String!) {
        question(titleSlug: $titleSlug) {
          difficulty
        }
      }
    `,
      variables: { titleSlug },
      operationName: "questionTitle",
    }),
    method: "POST",
    mode: "cors",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`Failed to Get Question Title: ${response.status}`);
  }

  const { data } = await response.json();
  return data.question;
};
