const express = require("express");
const axios = require("axios");
const OpenAI = require("openai");

const router = express.Router();

// Init OpenAI
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Helper for Spotify GET
async function spotifyGet(url, token) {
  return axios.get(url, {
    headers: { Authorization: `Bearer ${token}` }
  });
}

// 🔥 AI prompt generator
async function getAiAnalysis(spotifyData) {
  const prompt = `
Analyze the user's Spotify music taste based on this JSON data:

${JSON.stringify(spotifyData, null, 2)}

You must return a FUN, PERSONAL, HUMOROUS and INSIGHTFUL summary.

Make sure to include:
- What genres they like most
- What their personality might be like based on music
- A funny roast (light, playful)
- A music recommendation that fits their taste

Return the answer in structured JSON with:
{
  "taste_summary": "...",
  "roast": "...",
  "recommendations": ["...", "..."]
}
`;

  const response = await client.chat.completions.create({
    model: "gpt-4.1-mini", // or "gpt-4.1"
    messages: [{ role: "user", content: prompt }],
    temperature: 0.9
  });

  return JSON.parse(response.choices[0].message.content);
}


// 🔥 MAIN ROUTE: /spotify/analyze
router.get("/analyze", async (req, res) => {
  try {
    const token = req.query.access_token;

    if (!token) {
      return res.status(400).json({ error: "Missing access_token" });
    }

    // Get Spotify data in parallel
    const [artistsRes, tracksRes, playlistsRes] = await Promise.all([
      spotifyGet("https://api.spotify.com/v1/me/top/artists?limit=20", token),
      spotifyGet("https://api.spotify.com/v1/me/top/tracks?limit=20", token),
      spotifyGet("https://api.spotify.com/v1/me/playlists?limit=20", token),
    ]);

    const spotifyData = {
      top_artists: artistsRes.data,
      top_tracks: tracksRes.data,
      playlists: playlistsRes.data
    };

    // 🔥 AI analysis
    const aiAnalysis = await getAiAnalysis(spotifyData);

    // Return everything
    return res.json({
      raw_data: spotifyData,
      ai_analysis: aiAnalysis
    });

  } catch (error) {
    console.error("ERROR:", error.response?.data || error.message);
    return res.status(500).json({ error: "Failed to analyze music data" });
  }
});

module.exports = router;
