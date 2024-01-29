interface GetAccessToken {
  accessToken: string;
}

export const getAccessToken = async (code: string): Promise<GetAccessToken> => {
  const apiUrl = "https://github.com/login/oauth/access_token";
  const response = await fetch(apiUrl, {
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
  return { accessToken: payload.access_token };
};

interface GetUserIdentity {
  name: string;
  login: string;
}

export const getUserIdentity = async (
  accessToken: string
): Promise<GetUserIdentity> => {
  const apiUrl = "https://api.github.com/user";
  const response = await fetch(apiUrl, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to Get User Name: ${response.status}`);
  }
  const payload = await response.json();
  return { name: payload.name, login: payload.login };
};

interface GetUserEmail {
  email: string;
}

export const getUserEmail = async (
  accessToken: string
): Promise<GetUserEmail> => {
  const apiUrl = "https://api.github.com/user/emails";
  const response = await fetch(apiUrl, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to Get User Email: ${response.status}`);
  }
  const payload = await response.json();
  return { email: payload.find((item) => item.primary === true).email };
};

export const checkExistingRepository = (accessToken, owner, repoName) => {
  const apiUrl = `https://api.github.com/repos/${owner}/${repoName}`;

  fetch(apiUrl, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
    .then((response) => {
      if (response.ok) {
        console.log(`Repository "${repoName}" already exists.`);
      } else {
        createRepository(accessToken, owner, repoName);
      }
    })
    .catch((error) => {
      createRepository(accessToken, owner, repoName);
    });
};

export const createRepository = (accessToken, owner, repoName) => {
  const apiUrl = `https://api.github.com/user/repos`;

  fetch(apiUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: repoName,
    }),
  })
    .then((response) => response.json())
    .then((newRepo) => {
      console.log(`Repository "${newRepo.name}" created successfully!`);

      createReadme(accessToken, owner, repoName)
        .then(() => {
          console.log(
            "README file created successfully in the root of the repository!"
          );
          return createFolders(accessToken, owner, repoName, [
            "Easy",
            "Medium",
            "Hard",
          ]);
        })
        .then(() => {
          console.log("Folders created successfully!");
        })
        .catch((error) =>
          console.error("Error creating README file or folders:", error)
        );
    })
    .catch((error) => console.error("Error creating repository:", error));
};

export const createReadme = (accessToken, owner, repoName) => {
  const fileName = "README.md";
  const apiUrl = `https://api.github.com/repos/${owner}/${repoName}/contents/${fileName}`;

  return fetch(apiUrl, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: `Create ${fileName}`,
      content: btoa(
        `# ${repoName}\n\nThis is the README file for ${repoName}.`
      ),
    }),
  });
};

export const createFolders = async (
  accessToken,
  owner,
  repoName,
  folderNames
) => {
  for (const folderName of folderNames) {
    try {
      console.log(folderName);
      await createFolder(
        accessToken,
        owner,
        repoName,
        `${folderName}/.gitkeep`
      );
    } catch (error) {
      console.error(`Error creating folder ${folderName}:`, error);
    }
  }
};

export const createFolder = (accessToken, owner, repoName, folderName) => {
  const apiUrl = `https://api.github.com/repos/${owner}/${repoName}/contents/${folderName}`;

  return fetch(apiUrl, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: `Create folder: ${folderName}`,
      content: btoa(""),
    }),
  });
};
