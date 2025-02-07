const { default: axios } = require("axios");
const { Router } = require("express");
const dotenv = require("dotenv");

dotenv.config();
const router = Router();

const getOAuthToken = async () => {
  try {
    const response = await axios.post(
      "https://id.twitch.tv/oauth2/token",
      null,
      {
        params: {
          client_id: process.env.CLIENT_ID,
          client_secret: process.env.CLIENT_SECRET,
          grant_type: "client_credentials",
        },
      }
    );

    return response.data.access_token;
  } catch (error) {
    console.error(
      "Twitch Token Hatası:",
      error.response ? error.response.data : error.message
    );
    return null;
  }
};

const fetchReleaseDates = async (releaseDateIds, accessToken) => {
  if (!releaseDateIds || releaseDateIds.length === 0) return [];

  const requestBody = `fields date, human; where id = (${releaseDateIds.join(
    ","
  )});`;

  const response = await axios.post(
    "https://api.igdb.com/v4/release_dates",
    requestBody,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Client-ID": process.env.CLIENT_ID,
        Accept: "application/json",
      },
    }
  );

  return response.data.map((date) => ({
    id: date.id,
    date: date.date
      ? new Date(date.date * 1000).toISOString().split("T")[0]
      : "Bilinmiyor",
    human: date.human || "Bilinmiyor",
  }));
};

const fetchGames = async (offset = 0) => {
  try {
    const accessToken = await getOAuthToken();
    if (!accessToken) {
      throw new Error("Access token alınamadı!");
    }
    const currentTime = Math.floor(Date.now() / 1000);

    const requestBody = `
      fields name, genres.name, platforms.name, first_release_date, cover.image_id, themes.name; 
      sort total_rating_count desc;
      where first_release_date < ${currentTime} 
      & platforms = (6, 48, 167, 9, 49, 169, 12)
      & category = (0)
      & version_parent = null
      & themes !=(42);
      limit 24;
      offset ${offset};
    `;

    const response = await axios.post(
      "https://api.igdb.com/v4/games",
      requestBody,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Client-ID": process.env.CLIENT_ID,
          Accept: "application/json",
        },
      }
    );

    let games = response.data.map((game) => ({
      ...game,
      first_release_date: game.first_release_date
        ? new Date(game.first_release_date * 1000).toLocaleDateString("tr-TR")
        : "Bilinmiyor",
      cover_url: game.cover
        ? `https://images.igdb.com/igdb/image/upload/t_1080p/${game.cover.image_id}.jpg`
        : "default-cover.jpg", // Varsayılan kapak resmi
    }));

    return games;
  } catch (error) {
    console.error("Error:", error.message);
    return [];
  }
};

const searchGames = async (search) => {
  try {
    const accessToken = await getOAuthToken();
    if (!accessToken) {
      throw new Error("Access token alınamadı!");
    }

    const requestBody = `
      fields name, genres.name, first_release_dates, cover.url; 
      search "${search}";
      limit 24;
    `;

    const response = await axios.post(
      "https://api.igdb.com/v4/games",
      requestBody,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Client-ID": process.env.CLIENT_ID,
          Accept: "application/json",
        },
      }
    );

    let games = response.data;

    return games;
  } catch (error) {
    console.error("Error:", error.message);
    return [];
  }
};

const gameDetails = async (gameId) => {
  const accessToken = await getOAuthToken();
  const requestBody = `
  fields *;
  where id = ${gameId};
  limit 1;
`;
  const response = await axios.post(
    "https://api.igdb.com/v4/games",
    requestBody,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Client-ID": process.env.CLIENT_ID,
        Accept: "application/json",
      },
    }
  );
  return response.data;
};
const gameGenres = async () => {
  try {
    const accessToken = await getOAuthToken();
    if (!accessToken) {
      throw new Error("Access token alınamadı!");
    }

    const requestBody = `
      fields name;
      limit 50;
    `;

    const response = await fetch("https://api.igdb.com/v4/genres", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Client-ID": process.env.CLIENT_ID,
        "Content-Type": "text/plain",
      },
      body: requestBody,
    });

    if (!response.ok) {
      throw new Error(`API Hatası: ${response.status}`);
    }

    let games = await response.json();

    return games;
  } catch (error) {
    console.error("Error:", error.message);
    return [];
  }
};

const gameThemes = async () => {
  try {
    const accessToken = await getOAuthToken();
    if (!accessToken) {
      throw new Error("Access token alınamadı!");
    }

    const requestBody = `
      fields name;
      limit 50;
    `;

    const response = await fetch("https://api.igdb.com/v4/themes", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Client-ID": process.env.CLIENT_ID,
        "Content-Type": "text/plain",
      },
      body: requestBody,
    });

    if (!response.ok) {
      throw new Error(`API Hatası: ${response.status}`);
    }

    let games = await response.json();

    return games;
  } catch (error) {
    console.error("Error:", error.message);
    return [];
  }
};

// API Endpoint'leri
router.get("/games", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * 24;
    const games = await fetchGames(offset);
    res.json(games);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
debugger;
router.get("/search", async (req, res) => {
  try {
    const searchQuery = "witcher";
    if (!searchQuery) {
      return res.status(400).json({ error: "Arama terimi belirtilmelidir!" });
    }

    const games = await searchGames(searchQuery);
    return res.json(games);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.get("/gameDetails", async (req, res) => {
  try {
    const games = await gameDetails(15456);
    res.json(games);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.get("/gameGenres", async (req, res) => {
  try {
    const games = await gameGenres();
    res.json(games);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.get("/gameThemes", async (req, res) => {
  try {
    const games = await gameThemes();
    res.json(games);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
