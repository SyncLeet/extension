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
