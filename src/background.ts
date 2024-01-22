import { GraghQueryRequest } from "./modules/interface";
import { Message } from "./modules/message";

/**
 * React to LeetCode Activities
 */

const submittedIds = new Set<number>();

const launchSubmissionListener = () => {
  chrome.webRequest.onBeforeRequest.addListener(
    (details) => {
      const regex = /detail\/(.*?)\/check/;
      const match = details.url.match(regex);
      submittedIds.add(parseInt(match[1], 10));
      console.log(submittedIds);
    },
    { urls: ["https://leetcode.com/submissions/detail/*/check/"] }
  );
};

const launchGraphQueryListener = () => {
  chrome.webRequest.onBeforeRequest.addListener(
    (details) => {
      const encoded = details.requestBody.raw[0].bytes;
      const decoder = new TextDecoder("utf-8");
      const decoded = decoder.decode(encoded);
      const request: GraghQueryRequest = JSON.parse(decoded);
      if (request.operationName == "submissionDetails") {
        const sid = request.variables.submissionId;
        if (submittedIds.delete(sid)) {
          console.log(sid);
          chrome.tabs.sendMessage(details.tabId, {
            type: "requestDetails",
            payload: {
              id: sid,
            },
          });
        }
      }
    },
    { urls: ["https://leetcode.com/graphql/"] },
    ["requestBody"]
  );
};

/**
 * React to Incoming Messages
 */

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

const owner = "senf1";
const repo = "leetcode";

const launchMessageListener = (accessToken: string) => {
  console.log(accessToken);
  chrome.runtime.onMessage.addListener((message: Message) => {
    switch (message.type) {
      case "responseDetails":
        const { details } = message.payload;
        console.log(details);
        fetch(
          `https://api.github.com/repos/${owner}/${repo}/contents/${details.question.titleSlug}.txt`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        ).then((response) => {
          if (response.ok) {
            return response.json().then((data) => {
              fetch(
                `https://api.github.com/repos/${owner}/${repo}/contents/${details.question.titleSlug}.txt`,
                {
                  method: "PUT",
                  headers: {
                    Authorization: `Bearer ${accessToken}`,
                  },
                  body: JSON.stringify({
                    message: `${details.question.titleSlug}; ${details.runtimeDisplay}; ${details.memoryDisplay}`,
                    committer: {
                      name: "Sen Feng",
                      email: "senfeng6@gmail.com",
                    },
                    content: btoa(details.code),
                    sha: data.sha,
                  }),
                }
              );
            });
          }
          fetch(
            `https://api.github.com/repos/${owner}/${repo}/contents/${details.question.titleSlug}.txt`,
            {
              method: "PUT",
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
              body: JSON.stringify({
                message: `${details.question.titleSlug}; ${details.runtimeDisplay}; ${details.memoryDisplay}`,
                committer: {
                  name: "Sen Feng",
                  email: "senfeng6@gmail.com",
                },
                content: btoa(details.code),
              }),
            }
          );
        });
    }
    return true;
  });
};

/**
 * Handle OAuth2 flow with GitHub
 */

const authParams = new URLSearchParams({
  client_id: process.env.CLIENT_ID,
  redirect_uri: chrome.identity.getRedirectURL(),
  scope: ["repo"].join(encodeURIComponent(" ")),
});

const webAuthFlowOptions = {
  url: `https://github.com/login/oauth/authorize?${authParams}`,
  interactive: true,
};

const webAuthFlowCallback = (responseURL: string) => {
  console.log(responseURL);
  const regex = /code=(.*)/;
  const match = responseURL.match(regex);
  fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
      code: match[1],
    }),
  })
    .then((response) => {
      if (response.ok) {
        return response.json();
      }
    })
    .then((data) => {
      checkExistingRepository(data.access_token, owner, "Leetcode");
      launchSubmissionListener();
      launchGraphQueryListener();
      launchMessageListener(data.access_token);
    });
};

const checkExistingRepository = (accessToken, owner, repoName) => {
  const apiUrl = `https://api.github.com/repos/${owner}/${repoName}`;

  fetch(apiUrl, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
  .then(response => {
    if (response.ok) {
      console.log(`Repository "${repoName}" already exists.`);
    } else {
      createRepository(accessToken, owner, repoName);
    }
  })
  .catch(error => {
    createRepository(accessToken, owner, repoName);
  });
};

const createRepository = (accessToken, owner, repoName) => {
  const apiUrl = `https://api.github.com/user/repos`;

  fetch(apiUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: repoName,
    }),
  })
  .then(response => response.json())
  .then(newRepo => {
    console.log(`Repository "${newRepo.name}" created successfully!`);

    createReadme(accessToken, owner, repoName)
      .then(() => {
        console.log('README file created successfully in the root of the repository!');
        return createFolders(accessToken, owner, repoName, ['Easy', 'Medium', 'Hard']);
      })
      .then(() => {
        console.log('Folders created successfully!');
      })
      .catch(error => console.error('Error creating README file or folders:', error));
  })
  .catch(error => console.error('Error creating repository:', error));
};

const createReadme = (accessToken, owner, repoName) => {
  const fileName = 'README.md';
  const apiUrl = `https://api.github.com/repos/${owner}/${repoName}/contents/${fileName}`;

  return fetch(apiUrl, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: `Create ${fileName}`,
      content: btoa(`# ${repoName}\n\nThis is the README file for ${repoName}.`),
    }),
  });
};

const createFolders = async (accessToken, owner, repoName, folderNames) => {
  for (const folderName of folderNames) {
    try {
      console.log(folderName);
      await createFolder(accessToken, owner, repoName, `${folderName}/.gitkeep`);
    } catch (error) {
      console.error(`Error creating folder ${folderName}:`, error);
    }
  }
};

const createFolder = (accessToken, owner, repoName, folderName) => {
  const apiUrl = `https://api.github.com/repos/${owner}/${repoName}/contents/${folderName}`;
  
  return fetch(apiUrl, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: `Create folder: ${folderName}`,
      content: btoa(''),
    }),
  });
};

chrome.identity.launchWebAuthFlow(webAuthFlowOptions, webAuthFlowCallback);
