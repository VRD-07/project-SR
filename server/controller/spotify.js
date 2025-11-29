const express = require("express");
const axios = require("axios");

const router = express.Router();

// 🔥 OpenRouter client (No OpenAI)
const client = axios.create({
  baseURL: "https://openrouter.ai/api/v1",
  headers: {
    "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
    "HTTP-Referer": "https://yourdomain.com",
    "X-Title": "Spotify Taste Analyzer"
  }
});

// Helper for Spotify GET
async function spotifyGet(url, token) {
  return axios.get(url, {
    headers: { Authorization: `Bearer ${token}` }
  });
}

// 🔥 AI prompt generator — FREE MODEL VERSION
async function getAiAnalysis(spotifyData) {
  const prompt = `
Analyze the user's Spotify music taste based on this JSON data:

${JSON.stringify(spotifyData, null, 2)}

Return a JSON object only, with:
{
  "taste_summary": "...",
  "roast": "...",
  "recommendations": ["...", "..."]
}

Tone: funny, personal, light roast, music nerd vibes.
  `;

  const response = await client.post("/chat/completions", {
    model: "google/gemma-7b", // ✅ 100% FREE MODEL
    messages: [
      { role: "user", content: prompt }
    ],
    temperature: 0.9
  });

  return JSON.parse(response.data.choices[0].message.content);
}

// 🔥 MAIN ROUTE: /spotify/analyze
router.get("/analyze", async (req, res) => {
  try {
    const token = req.query.access_token;

    if (!token) {
      return res.status(400).json({ error: "Missing access_token" });
    }

    // Fetch all Spotify data
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

    // Get AI analysis (FREE MODEL)
    const aiAnalysis = await getAiAnalysis(spotifyData);

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
