const express = require("express");
const axios = require("axios");
const { createCanvas, loadImage } = require("canvas");

const router = express.Router();

// ---------------- Helper: Spotify GET ----------------
async function spotifyGet(url, token) {
  return axios.get(url, {
    headers: { Authorization: `Bearer ${token}` }
  });
}

// ---------------- Helper: AI Analysis ----------------
// Replace this with your existing AI summary function
async function getAiAnalysis(spotifyData) {
  // For demonstration, we return dummy summary
  // You can replace this with OpenRouter/grok call
  return {
    taste_summary: "You love energetic pop and indie vibes!",
    roast: "You probably dance alone in your room sometimes 😎",
    recommendations: ["Song A", "Song B", "Song C"]
  };
}

// ---------------- Helper: Generate Wrapped Banner ----------------
async function generateWrappedBanner(topAlbumImages, aiSummary) {
  const canvasSize = 1080;
  const canvas = createCanvas(canvasSize, canvasSize);
  const ctx = canvas.getContext("2d");

  // 1️⃣ Background gradient
  const gradient = ctx.createLinearGradient(0, 0, canvasSize, canvasSize);
  gradient.addColorStop(0, "#1DB954"); // Spotify green
  gradient.addColorStop(1, "#191414"); // Dark black
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvasSize, canvasSize);

  // 2️⃣ Draw top album covers (3–5)
  const imageCount = Math.min(topAlbumImages.length, 5);
  const imgSize = 200;
  const padding = 20;
  for (let i = 0; i < imageCount; i++) {
    try {
      const img = await loadImage(topAlbumImages[i]);
      const x = padding + i * (imgSize - 40); // slight overlap
      const y = 50;
      ctx.drawImage(img, x, y, imgSize, imgSize);
    } catch (err) {
      console.error("Failed to load image", topAlbumImages[i], err.message);
    }
  }

  // 3️⃣ Overlay AI summary text
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 36px Arial";
  ctx.fillText(aiSummary.taste_summary || "Your Spotify Taste", 50, 350, canvasSize - 100);

  ctx.font = "italic 28px Arial";
  ctx.fillText(aiSummary.roast || "", 50, 400, canvasSize - 100);

  ctx.font = "24px Arial";
  const recs = aiSummary.recommendations || [];
  ctx.fillText("Recommended: " + recs.join(", "), 50, 450, canvasSize - 100);

  // 4️⃣ Return Base64 image
  return canvas.toDataURL("image/png");
}

// ---------------- Main Route: /spotify/analyze ----------------
router.get("/analyze", async (req, res) => {
  try {
    const token = req.query.access_token;
    if (!token) return res.status(400).json({ error: "Missing access_token" });

    // Fetch Spotify data
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

    // 1️⃣ AI summary
    const aiAnalysis = await getAiAnalysis(spotifyData);

    // 2️⃣ Banner generation (take top 5 album URLs)
    const topAlbums = tracksRes.data.items
      .slice(0, 5)
      .map(track => track.album.images[0]?.url)
      .filter(url => url); // remove undefined

    const bannerBase64 = await generateWrappedBanner(topAlbums, aiAnalysis);

    // 3️⃣ Return everything
    res.json({
      raw_data: spotifyData,
      ai_analysis: aiAnalysis,
      banner_image_base64: bannerBase64
    });

  } catch (err) {
    console.error("ERROR:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to analyze music data" });
  }
});

module.exports = router;
