import { Octokit } from "octokit";
import { QuestionDetails, SubmissionDetails, Submission, SubmissionsResponse } from "./interface";

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
      template_owner: "SyncLeet",
      template_repo: "template",
      name: "LeetCode",
      description: "Sync: LeetCode -> GitHub",
      private: false,
    });
  }
};

export const createAutolinkReference = async (octokit: Octokit): Promise<void> => {
  const { data } = await octokit.rest.repos.listForAuthenticatedUser();
  const syncRepo = data.find((repo) => repo.name === "LeetCode");
  if (syncRepo) {
    try {
      const { data: autolinks } = await octokit.rest.repos.listAutolinks({
        owner: syncRepo.owner.login,
        repo: syncRepo.name,
      });

      const existingAutolink = autolinks.find((autolink) => autolink.key_prefix === 'LC-');

      if (!existingAutolink) {
        await octokit.rest.repos.createAutolink({
          owner: syncRepo.owner.login,
          repo: syncRepo.name,
          key_prefix: 'LC-',
          url_template: 'https://leetcode.com/problems/<num>/description/',
          is_alphanumeric: true,
          headers: {
            'X-GitHub-Api-Version': '2022-11-28'
          }
        });
        console.log('Autolink reference created successfully');
      } else {
        console.log('Autolink reference already exists');
      }
    } catch (error) {
      throw new Error(`Failed to create autolink reference: ${error}`);
    }
  } else {
    console.log('Repository not found');
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
              title
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
    throw new Error(`Failed to Get Question Title: ${response.status}`);
  }

  const { data } = await response.json();
  return data.question;
};

export async function fetchAllSubmissions(offset: number = 0, limit: number = 20, lastKey: string = ''): Promise<any[]> {
  let allSubmissions: Submission[] = [];
  let hasNext = true;

  try {
    while (hasNext) {
      const baseUrl = `https://leetcode.com/api/submissions/?offset=${offset}&limit=${limit}`;
      let url = lastKey ? `${baseUrl}&lastkey=${lastKey}` : baseUrl;
      console.log('Fetching submissions:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: SubmissionsResponse = await response.json();
      allSubmissions = allSubmissions.concat(data.submissions_dump || []);
      console.log('Fetched submissions:', data.submissions_dump);

      hasNext = data.has_next;
      if (hasNext) {
        // Prepare for the next iteration
        offset += limit;
        lastKey = data.last_key;
        // Wait for 1 second before making the next call to avoid hitting rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return allSubmissions;
  } catch (error) {
    console.error("Failed to fetch submission details:", error);
    throw error;
  }
}