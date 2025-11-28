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

router.get("/auth/callback", (request, response) => {
  const code = request.query.code;
  const state = request.query.state;

  console.log("code: ", code, " state : ", state);

  return response.status(200).send("Callback received! You can close this.");
});

module.exports = router;
