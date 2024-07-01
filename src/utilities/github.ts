import { Octokit } from "octokit";

/**
 * Creates a new instance of Octokit with an authentication token.
 * If the token already exists in local storage, it will be used.
 * Otherwise, it initiates the OAuth flow to obtain a new token.
 *
 * @returns A Promise that resolves to an Octokit instance.
 * @throws Error if there is an issue obtaining the authorization code or exchanging it for an access token.
 */
export const newOctokit = async (): Promise<Octokit> => {
  // Check if the token already exists in local storage
  const existingToken = await new Promise<string>((resolve) => {
    chrome.storage.local.get("githubToken", (result) => {
      resolve(result.githubToken);
    });
  });

  if (existingToken) {
    return new Octokit({ auth: existingToken });
  }

  // If the token doesn't exist, initiate the OAuth flow to obtain a new token
  const params = new URLSearchParams({
    client_id: process.env.CLIENT_ID,
    redirect_uri: chrome.identity.getRedirectURL(),
    scope: "repo user:email",
  });
  const responseURL = await new Promise<string>((resolve, reject) => {
    chrome.identity.launchWebAuthFlow(
      {
        url: `https://github.com/login/oauth/authorize?${params}`,
        interactive: true,
      },
      (responseURL) => {
        resolve(responseURL);
      }
    );
  });

  // Extract the authorization code from the response URL
  const code = new URL(responseURL).searchParams.get("code");
  if (code === null) {
    throw new Error("Failed to obtain authorization code from GitHub");
  }

  // Exchange the authorization code for an access token
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
    throw new Error("Failed to exchange authorization code for access token");
  }
  const data = await response.json();
  const token = data.access_token;

  // Store the token in local storage for future use
  chrome.storage.local.set({ githubToken: token });

  return new Octokit({ auth: token });
};

/**
 * Creates a new repository named "LeetCode" if it doesn't already exist.
 * The repository is created using a template repository and includes autolinks for LeetCode problems.
 *
 * @param octokit - The Octokit instance used for making API requests.
 * @returns A Promise that resolves when the repository and autolinks are created.
 */
export const newRepository = async (octokit: Octokit) => {
  // Check if the repository already exists
  const { data } = await octokit.rest.repos.listForAuthenticatedUser();
  if (data.find((repo) => repo.name === "LeetCode")) {
    return;
  }
  // Create the repository using a template
  await octokit.rest.repos.createUsingTemplate({
    template_owner: "SyncLeet",
    template_repo: "template",
    name: "LeetCode",
    description: "Sync: LeetCode -> GitHub",
    private: false,
  });
  // Wait for the repository to be created
  while (true) {
    await new Promise((resolve) => setTimeout(resolve, 3000));
    console.log("Checking if repository is created...");
    const { data } = await octokit.rest.repos.listForAuthenticatedUser();
    const repository = data.find((repo) => repo.name === "LeetCode");
    if (repository) {
      // Check if autolinks for LeetCode problems already exist
      const { data } = await octokit.rest.repos.listAutolinks({
        owner: repository.owner.login,
        repo: repository.name,
      });
      if (data.find((link) => link.key_prefix === "LC-")) {
        break;
      }
      // Create autolinks for LeetCode problems
      await octokit.rest.repos.createAutolink({
        owner: repository.owner.login,
        repo: repository.name,
        key_prefix: "LC-",
        url_template: "https://leetcode.com/problems/<num>/description/",
        is_alphanumeric: true,
      });
    }
  }
};

/**
 * Commits the specified changes to the "main" branch of the LeetCode repository.
 *
 * @param octokit - The Octokit instance used for making API requests.
 * @param message - The commit message.
 * @param changes - An array of objects representing the changes to be committed. Each object should have a `path` property specifying the file path and a `content` property specifying the file content.
 * @returns A Promise that resolves to the new commit SHA.
 * @throws Error if there is an issue creating the commit or updating the branch reference.
 */
export const commitFiles = async (
  octokit: Octokit,
  message: string,
  changes: { path: string; content: string }[]
) => {
  // Get the authenticated user
  const { data: user } = await octokit.rest.users.getAuthenticated();

  // Get the latest commit on the "main" branch
  const latestCommit = await octokit.rest.repos.getCommit({
    owner: user.login,
    repo: "LeetCode",
    ref: "main",
  });

  // Get the tree associated with the latest commit
  const tree = await octokit.rest.git.getTree({
    owner: user.login,
    repo: "LeetCode",
    tree_sha: latestCommit.data.commit.tree.sha,
  });

  // Create a new tree with the updated files
  const newTree = await octokit.rest.git.createTree({
    owner: user.login,
    repo: "LeetCode",
    base_tree: tree.data.sha,
    tree: changes.map((file) => ({
      path: file.path,
      mode: "100644",
      content: file.content,
    })),
  });

  // Fetch the githubCommits from local storage
  const githubCommits = await new Promise<{ [time: number]: string }>(
    (resolve) => {
      chrome.storage.local.get("githubCommits", (result) => {
        resolve(result.githubCommits || {});
      });
    }
  );

  // Delete commits that are 30 seconds old
  const currentTime = Date.now();
  Object.keys(githubCommits).forEach((time) => {
    const commitTime = parseInt(time);
    if (currentTime - commitTime >= 60 * 1000) {
      delete githubCommits[commitTime];
    }
  });

  // Create a new commit with the updated tree
  const newCommit = await octokit.rest.git.createCommit({
    owner: user.login,
    repo: "LeetCode",
    message,
    tree: newTree.data.sha,
    parents: [...Object.values(githubCommits), latestCommit.data.sha],
  });

  // Update the "main" branch reference to point to the new commit
  await octokit.rest.git.updateRef({
    owner: user.login,
    repo: "LeetCode",
    ref: `heads/main`,
    sha: newCommit.data.sha,
  });

  // Record newCommit to githubCommits with the timestamp
  githubCommits[Date.now()] = newCommit.data.sha;

  // Store the updated githubCommits in local storage
  chrome.storage.local.set({ githubCommits });
};
