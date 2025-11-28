const router = require("express").Router();
const querystring = require("querystring");

const client_id = process.env.SPOTIFY_CLIENT_ID;
const redirect_uri = process.env.SPOTIFY_REDIRECT_URI;

const generateRandomString = (length) => {
  let text = "";
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

router.get("/auth/login", (request, response) => {
  const state = generateRandomString(16);
  const scope = "user-top-read user-library-read playlist-read-private";

  response.redirect(
    "https://accounts.spotify.com/authorize?" +
      querystring.stringify({
        response_type: "code",
        client_id: client_id,
        scope: scope,
        redirect_uri: redirect_uri,
        state: state,
      })
  );
});

router.get("/auth/callback", async (request, response) => {
  const code = request.query.code;
  const state = request.query.state;

  if (!code) {
    return response.status(400).send("Missing code");
  }

  try {
    const tokenURL = "https://accounts.spotify.com/api/token";

    const params = new URLSearchParams();
    params.append("grant_type", "authorization_code");
    params.append("code", code);
    params.append("redirect_uri", redirect_uri);

    const authHeader =
      "Basic " +
      Buffer.from(
        process.env.SPOTIFY_CLIENT_ID + ":" + process.env.SPOTIFY_CLIENT_SECRET
      ).toString("base64");

    const result = await fetch(tokenURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: authHeader,
      },
      body: params.toString(),
    });

    const data = await result.json();

    console.log("TOKEN RESULT:", data);

    // access_token, refresh_token
    return response.status(200).json({
      message: "Tokens received",
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
    });
  } catch (err) {
    console.error("Error exchanging code:", err);
    return response.status(500).send("Internal Server Error");
  }
});


module.exports = router;
