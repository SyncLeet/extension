import { Octokit } from "octokit";
import { RestEndpointMethodTypes } from "@octokit/plugin-rest-endpoint-methods";
import { FileToCommit } from "src/types/github";
import { debugReport, errorReport, notifyReport } from "src/modules/report";

/**
 * Request GitHub identity from the user
 * @returns {Promise<string>} exchange code
 */
const requestIdentity = async (): Promise<string> => {
  await debugReport({
    message: "Request GitHub identity from the user",
    context: "github.requestIdentity",
  });

  if (!process.env.CLIENT_ID) {
    await errorReport({
      message: "CLIENT_ID not set",
      context: "github.requestIdentity",
    });
  }

  if (!process.env.CLIENT_SECRET) {
    await errorReport({
      message: "CLIENT_SECRET not set",
      context: "github.requestIdentity",
    });
  }

  const params = new URLSearchParams({
    client_id: process.env.CLIENT_ID,
    redirect_uri: chrome.identity.getRedirectURL(),
    scope: "repo user:email",
  });
  const options = {
    url: `https://github.com/login/oauth/authorize?${params}`,
    interactive: true,
  };
  const responseUrl = await chrome.identity.launchWebAuthFlow(options);
  const code = new URL(responseUrl).searchParams.get("code");
  if (!code) {
    await errorReport({
      message: `code not found in response: ${responseUrl}`,
      context: "github.requestIdentity",
    });
  }

  return code;
};

/**
 * Exchange the code for an access token
 * @param {string} code
 * @returns {Promise<string>} access token
 */
const exchangeCodeForToken = async (code: string): Promise<string> => {
  await debugReport({
    message: "Exchange the code for an access token",
    context: "github.exchangeCodeForToken",
  });

  if (!process.env.CLIENT_ID) {
    await errorReport({
      message: "CLIENT_ID not set",
      context: "github.exchangeCodeForToken",
    });
  }

  if (!process.env.CLIENT_SECRET) {
    await errorReport({
      message: "CLIENT_SECRET not set",
      context: "github.exchangeCodeForToken",
    });
  }

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
    await errorReport({
      message: `Unexpected status code: ${response.status}`,
      context: "github.exchangeCodeForToken",
    });
  }

  const payload = await response.json();
  return payload.access_token as string;
};

/**
 * Create a new GitHub repository if it doesn't exist
 * @param {Octokit} octokit
 */
const createRepository = async (octokit: Octokit): Promise<void> => {
  await debugReport({
    message: "Create a new GitHub repository if it doesn't exist",
    context: "github.createRepository",
  });

  const {
    data: { login: username },
  } = await octokit.rest.users.getAuthenticated();

  const { data } = await octokit.rest.repos.listForUser({ username });
  let repository = data.find((repo) => repo.name === "LeetCode");

  if (!repository) {
    await octokit.rest.repos.createUsingTemplate({
      template_owner: "SyncLeet",
      template_repo: "template",
      name: "LeetCode",
      description: "Sync: LeetCode -> GitHub",
      private: false,
    });
    while (!repository) {
      await new Promise((resolve) => setTimeout(resolve, 2500));
      const { data } = await octokit.rest.repos.listForUser({ username });
      repository = data.find((repo) => repo.name === "LeetCode");
    }
    await notifyReport({
      message: "Created a new GitHub repository for LeetCode!",
      context: "github.createRepository",
    });
  }
};

/**
 * Create autolinks with LeetCode if they don't exist
 * @param {Octokit} octokit
 */
const createAutolinks = async (octokit: Octokit): Promise<void> => {
  await debugReport({
    message: "Create autolinks with LeetCode questions in the commit message",
    context: "github.createAutolinks",
  });

  const {
    data: { login: username },
  } = await octokit.rest.users.getAuthenticated();

  const { data } = await octokit.rest.repos.listForUser({ username });
  const repository = data.find((repo) => repo.name === "LeetCode");

  if (!repository) {
    await errorReport({
      message: "Repository not found",
      context: "github.createAutolinks",
    });
  }

  const { data: autolinks } = await octokit.rest.repos.listAutolinks({
    owner: repository.owner.login,
    repo: repository.name,
  });
  let autolink = autolinks.find((link) => link.key_prefix === "LC-");

  if (!autolink) {
    await octokit.rest.repos.createAutolink({
      owner: repository.owner.login,
      repo: repository.name,
      key_prefix: "LC-",
      url_template: "https://leetcode.com/problems/<num>/description/",
      is_alphanumeric: true,
    });
    while (!autolink) {
      await new Promise((resolve) => setTimeout(resolve, 2500));
      const { data: autolinks } = await octokit.rest.repos.listAutolinks({
        owner: repository.owner.login,
        repo: repository.name,
      });
      autolink = autolinks.find((link) => link.key_prefix === "LC-");
    }
    await notifyReport({
      message: "Created autolinks with LeetCode!",
      context: "github.createAutolinks",
    });
  }
};

/**
 * Commit LeetCode submissions to GitHub
 * @param {Octokit} octokit
 * @param {FileToCommit[]} payload
 *
 * Adapted from: https://paul.kinlan.me/creating-a-commit-with-multiple-files-to-github-with-js-on-the-web/
 */
export const commitSubmissions = async (
  octokit: Octokit,
  payload: FileToCommit[],
  message: string
): Promise<void> => {
  await debugReport({
    message: "Commit LeetCode submissions to GitHub",
    context: "github.commitSubmissions",
  });

  const {
    data: { login: owner },
  } = await octokit.rest.users.getAuthenticated();

  const mainRef = await octokit.rest.git.getRef({
    owner,
    repo: "LeetCode",
    ref: "heads/main",
  });

  const children = await Promise.all(
    payload.map(async (file) => {
      const { data } = await octokit.rest.git.createBlob({
        owner,
        repo: "LeetCode",
        content: file.content,
        encoding: "utf-8",
      });
      return {
        path: file.path,
        mode: "100644",
        type: "blob",
        sha: data.sha,
      };
    })
  );

  const tree = await octokit.rest.git.createTree({
    owner,
    repo: "LeetCode",
    base_tree: mainRef.data.object.sha,
    tree: children as RestEndpointMethodTypes["git"]["createTree"]["parameters"]["tree"],
  });

  const commit = await octokit.rest.git.createCommit({
    owner,
    repo: "LeetCode",
    message,
    tree: tree.data.sha,
    parents: [mainRef.data.object.sha],
  });

  await octokit.rest.git.updateRef({
    owner,
    repo: "LeetCode",
    ref: "heads/main",
    sha: commit.data.sha,
  });
};

/**
 * Initialize the GitHub module
 * @returns {Promise<Octokit>} octokit instance
 */
export const initializeBackground = async (): Promise<Octokit> => {
  await debugReport({
    message: "Initialize the GitHub module",
    context: "github.initializeBackground",
  });

  const values = await chrome.storage.local.get("github.token");
  let token = values["github.token"] as string;

  if (!token) {
    const code = await requestIdentity();
    token = await exchangeCodeForToken(code);
    await chrome.storage.local.set({ "github.token": token });
  }

  const octokit = new Octokit({ auth: token });
  await createRepository(octokit);
  await createAutolinks(octokit);

  return octokit;
};
