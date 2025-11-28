const router = require("express").Router();
router.get("/spotify/user", async (req, res) => {
  const accessToken = req.query.access_token;

  if (!accessToken)
    return res.status(400).json({ error: "Missing access_token" });

  const headers = {
    Authorization: `Bearer ${accessToken}`,
  };

  try {
    /* ========== 1. USER PROFILE ========== */
    const userRes = await fetch("https://api.spotify.com/v1/me", { headers });
    const user = await userRes.json();
    if (user.error) return res.status(400).json({ error: user.error });

    /* ========== 2. TOP ARTISTS ========== */
    const artistsRes = await fetch(
      "https://api.spotify.com/v1/me/top/artists?limit=10",
      { headers }
    );
    const artistsJSON = await artistsRes.json();

    const top_artists =
      artistsJSON.items?.map((artist) => ({
        name: artist.name,
        genres: artist.genres,
        popularity: artist.popularity,
        followers: artist.followers.total,
        image: artist.images?.[0]?.url || null,
      })) || [];

    /* ========== 3. TOP TRACKS ========== */
    const tracksRes = await fetch(
      "https://api.spotify.com/v1/me/top/tracks?limit=10",
      { headers }
    );
    const tracksJSON = await tracksRes.json();

    const top_tracks =
      tracksJSON.items?.map((track) => ({
        name: track.name,
        album: track.album.name,
        artist: track.artists.map((a) => a.name).join(", "),
        popularity: track.popularity,
        preview_url: track.preview_url,
        image: track.album.images?.[0]?.url || null,
      })) || [];

    /* ========== 4. PLAYLISTS ========== */
    const playlistsRes = await fetch(
      "https://api.spotify.com/v1/me/playlists?limit=10",
      { headers }
    );
    const playlistsJSON = await playlistsRes.json();

    const playlists =
      playlistsJSON.items?.map((p) => ({
        name: p.name,
        id: p.id,
        tracks: p.tracks.total,
        owner: p.owner.display_name,
        image: p.images?.[0]?.url || null,
      })) || [];

    /* ========== FINAL RESPONSE ========== */
    return res.json({
      user: {
        id: user.id,
        display_name: user.display_name,
        email: user.email,
        followers: user.followers?.total,
        profile_image: user.images?.[0]?.url || null,
      },
      top_artists,
      top_tracks,
      playlists,
    });
  } catch (err) {
    console.error("Spotify user fetch error:", err);
    return res.status(500).json({ error: "Server error fetching data" });
  }
});

module.exports = router;
