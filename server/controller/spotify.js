const router = require("express").Router();

router.get("/spotify/user", async (req, res) => {
  const accessToken = req.query.access_token;

  if (!accessToken) {
    return res.status(400).json({ error: "Missing access_token" });
  }

  try {
    const response = await fetch("https://api.spotify.com/v1/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await response.json();

    if (data.error) {
      return res.status(400).json({ error: data.error });
    }

    // Return only simple user data for testing
    return res.json({
      id: data.id,
      display_name: data.display_name,
      email: data.email,
      followers: data.followers?.total,
      profile_image: data.images?.[0]?.url || null,
    });
  } catch (error) {
    console.error("Failed to fetch user:", error);
    return res.status(500).json({ error: "Server error fetching user data" });
  }
});

module.exports = router;
