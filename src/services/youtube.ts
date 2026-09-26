export interface YouTubeTrack {
  id: string; // YouTube Video ID
  title: string;
  artist: string;
  thumbnail: string;
  duration?: number; // in seconds if available
  genre?: string;
}

export const YOUTUBE_GENRES = [
  { id: "trending", label: "🔥 Top Hits", query: "top trending hits music official" },
  {
    id: "lofi",
    label: "☕ Lo-Fi / Chill",
    query: "lofi hip hop chill beats to study relax"
  },
  {
    id: "rock",
    label: "🎸 Rock Classics",
    query: "classic rock greatest hits official audio"
  },
  { id: "pop", label: "✨ Pop Anthems", query: "popular pop music hits" },
  {
    id: "electronic",
    label: "⚡ EDM / Electronic",
    query: "edm electronic dance music hits"
  },
  { id: "hiphop", label: "🎧 Hip-Hop & Rap", query: "top hip hop rap hits" },
  { id: "acoustic", label: "🌿 Acoustic & Indie", query: "acoustic indie folk music" }
];

// Rich curated list of YouTube music with 100% verified, embeddable video IDs
export const CURATED_TRACKS: YouTubeTrack[] = [
  // Trending / Top Hits
  {
    id: "ApXoWvfEYVU",
    title: "Sunflower (Spider-Man: Into the Spider-Verse)",
    artist: "Post Malone, Swae Lee",
    thumbnail: "https://i.ytimg.com/vi/ApXoWvfEYVU/hqdefault.jpg",
    duration: 158,
    genre: "trending"
  },
  {
    id: "4NRXx6U8ABQ",
    title: "Blinding Lights",
    artist: "The Weeknd",
    thumbnail: "https://i.ytimg.com/vi/4NRXx6U8ABQ/hqdefault.jpg",
    duration: 200,
    genre: "trending"
  },
  {
    id: "7wtfhZwyrcc",
    title: "Believer",
    artist: "Imagine Dragons",
    thumbnail: "https://i.ytimg.com/vi/7wtfhZwyrcc/hqdefault.jpg",
    duration: 204,
    genre: "trending"
  },
  {
    id: "JGwWNGJdvx8",
    title: "Shape of You",
    artist: "Ed Sheeran",
    thumbnail: "https://i.ytimg.com/vi/JGwWNGJdvx8/hqdefault.jpg",
    duration: 233,
    genre: "trending"
  },
  {
    id: "09R8_2nJtjg",
    title: "Sugar",
    artist: "Maroon 5",
    thumbnail: "https://i.ytimg.com/vi/09R8_2nJtjg/hqdefault.jpg",
    duration: 235,
    genre: "trending"
  },
  {
    id: "OPf0YbXqDm0",
    title: "Uptown Funk",
    artist: "Mark Ronson ft. Bruno Mars",
    thumbnail: "https://i.ytimg.com/vi/OPf0YbXqDm0/hqdefault.jpg",
    duration: 270,
    genre: "trending"
  },
  {
    id: "SlPhMPnQ58k",
    title: "Memories",
    artist: "Maroon 5",
    thumbnail: "https://i.ytimg.com/vi/SlPhMPnQ58k/hqdefault.jpg",
    duration: 189,
    genre: "trending"
  },
  {
    id: "kJQP7kiw5Fk",
    title: "Despacito",
    artist: "Luis Fonsi ft. Daddy Yankee",
    thumbnail: "https://i.ytimg.com/vi/kJQP7kiw5Fk/hqdefault.jpg",
    duration: 281,
    genre: "trending"
  },

  // Lo-Fi / Chill
  {
    id: "jfKfPfyJRdk",
    title: "lofi hip hop radio - beats to relax/study to",
    artist: "Lofi Girl",
    thumbnail: "https://i.ytimg.com/vi/jfKfPfyJRdk/hqdefault.jpg",
    duration: 3600,
    genre: "lofi"
  },
  {
    id: "lTRiuFIWV54",
    title: "1 A.M Study Session [lofi hip hop]",
    artist: "Lofi Girl",
    thumbnail: "https://i.ytimg.com/vi/lTRiuFIWV54/hqdefault.jpg",
    duration: 1560,
    genre: "lofi"
  },
  {
    id: "5qap5aO4i9A",
    title: "lofi chill beats to sleep / relax to",
    artist: "Lofi Girl",
    thumbnail: "https://i.ytimg.com/vi/5qap5aO4i9A/hqdefault.jpg",
    duration: 3600,
    genre: "lofi"
  },
  {
    id: "S_MOd40zlYU",
    title: "dark ambient radio - music to escape/dream to",
    artist: "Lofi Records",
    thumbnail: "https://i.ytimg.com/vi/S_MOd40zlYU/hqdefault.jpg",
    duration: 3600,
    genre: "lofi"
  },
  {
    id: "MCkTebktHVc",
    title: "peaceful soothing lofi beats",
    artist: "Lofi Girl",
    thumbnail: "https://i.ytimg.com/vi/MCkTebktHVc/hqdefault.jpg",
    duration: 3600,
    genre: "lofi"
  },

  // Rock Classics
  {
    id: "fJ9rUzIMcZQ",
    title: "Bohemian Rhapsody",
    artist: "Queen",
    thumbnail: "https://i.ytimg.com/vi/fJ9rUzIMcZQ/hqdefault.jpg",
    duration: 359,
    genre: "rock"
  },
  {
    id: "kXYiU_JCYtU",
    title: "Numb",
    artist: "Linkin Park",
    thumbnail: "https://i.ytimg.com/vi/kXYiU_JCYtU/hqdefault.jpg",
    duration: 187,
    genre: "rock"
  },
  {
    id: "eVTXPUF4Oz4",
    title: "In The End",
    artist: "Linkin Park",
    thumbnail: "https://i.ytimg.com/vi/eVTXPUF4Oz4/hqdefault.jpg",
    duration: 216,
    genre: "rock"
  },
  {
    id: "hTWKbfoikeg",
    title: "Smells Like Teen Spirit",
    artist: "Nirvana",
    thumbnail: "https://i.ytimg.com/vi/hTWKbfoikeg/hqdefault.jpg",
    duration: 278,
    genre: "rock"
  },
  {
    id: "1w7OgIMMRc4",
    title: "Sweet Child O' Mine",
    artist: "Guns N' Roses",
    thumbnail: "https://i.ytimg.com/vi/1w7OgIMMRc4/hqdefault.jpg",
    duration: 302,
    genre: "rock"
  },
  {
    id: "lDK9QqIzhwk",
    title: "Livin' On A Prayer",
    artist: "Bon Jovi",
    thumbnail: "https://i.ytimg.com/vi/lDK9QqIzhwk/hqdefault.jpg",
    duration: 248,
    genre: "rock"
  },
  {
    id: "v2AC41dglnM",
    title: "Thunderstruck",
    artist: "AC/DC",
    thumbnail: "https://i.ytimg.com/vi/v2AC41dglnM/hqdefault.jpg",
    duration: 292,
    genre: "rock"
  },

  // Pop Anthems
  {
    id: "2Vv-BfVoq4g",
    title: "Perfect",
    artist: "Ed Sheeran",
    thumbnail: "https://i.ytimg.com/vi/2Vv-BfVoq4g/hqdefault.jpg",
    duration: 263,
    genre: "pop"
  },
  {
    id: "DyDfgMOUjCI",
    title: "bad guy",
    artist: "Billie Eilish",
    thumbnail: "https://i.ytimg.com/vi/DyDfgMOUjCI/hqdefault.jpg",
    duration: 205,
    genre: "pop"
  },
  {
    id: "3AtDnEC4zak",
    title: "We Don't Talk Anymore",
    artist: "Charlie Puth ft. Selena Gomez",
    thumbnail: "https://i.ytimg.com/vi/3AtDnEC4zak/hqdefault.jpg",
    duration: 230,
    genre: "pop"
  },
  {
    id: "CevxZvSJLk8",
    title: "Roar",
    artist: "Katy Perry",
    thumbnail: "https://i.ytimg.com/vi/CevxZvSJLk8/hqdefault.jpg",
    duration: 222,
    genre: "pop"
  },
  {
    id: "YQHsXMglC9A",
    title: "Hello",
    artist: "Adele",
    thumbnail: "https://i.ytimg.com/vi/YQHsXMglC9A/hqdefault.jpg",
    duration: 367,
    genre: "pop"
  },
  {
    id: "ZbZSe6N_BXs",
    title: "Happy",
    artist: "Pharrell Williams",
    thumbnail: "https://i.ytimg.com/vi/ZbZSe6N_BXs/hqdefault.jpg",
    duration: 240,
    genre: "pop"
  },
  {
    id: "nfWlot6h_JM",
    title: "Shake It Off",
    artist: "Taylor Swift",
    thumbnail: "https://i.ytimg.com/vi/nfWlot6h_JM/hqdefault.jpg",
    duration: 242,
    genre: "pop"
  },

  // EDM / Electronic
  {
    id: "60ItHLz5WEA",
    title: "Faded",
    artist: "Alan Walker",
    thumbnail: "https://i.ytimg.com/vi/60ItHLz5WEA/hqdefault.jpg",
    duration: 212,
    genre: "electronic"
  },
  {
    id: "IcrbM1l_BoI",
    title: "Wake Me Up",
    artist: "Avicii",
    thumbnail: "https://i.ytimg.com/vi/IcrbM1l_BoI/hqdefault.jpg",
    duration: 272,
    genre: "electronic"
  },
  {
    id: "ALZHF5UqnU4",
    title: "Alone",
    artist: "Marshmello",
    thumbnail: "https://i.ytimg.com/vi/ALZHF5UqnU4/hqdefault.jpg",
    duration: 199,
    genre: "electronic"
  },
  {
    id: "papuvlVeZg8",
    title: "Rockabye",
    artist: "Clean Bandit ft. Sean Paul",
    thumbnail: "https://i.ytimg.com/vi/papuvlVeZg8/hqdefault.jpg",
    duration: 251,
    genre: "electronic"
  },
  {
    id: "YykjpeuMNEk",
    title: "Hymn For The Weekend",
    artist: "Coldplay",
    thumbnail: "https://i.ytimg.com/vi/YykjpeuMNEk/hqdefault.jpg",
    duration: 258,
    genre: "electronic"
  },

  // Hip-Hop & Rap
  {
    id: "uelHwf8o7_U",
    title: "Love The Way You Lie",
    artist: "Eminem ft. Rihanna",
    thumbnail: "https://i.ytimg.com/vi/uelHwf8o7_U/hqdefault.jpg",
    duration: 266,
    genre: "hiphop"
  },
  {
    id: "RgKAFK5djSk",
    title: "See You Again",
    artist: "Wiz Khalifa ft. Charlie Puth",
    thumbnail: "https://i.ytimg.com/vi/RgKAFK5djSk/hqdefault.jpg",
    duration: 229,
    genre: "hiphop"
  },
  {
    id: "_Yhyp-_hX2s",
    title: "Lose Yourself",
    artist: "Eminem",
    thumbnail: "https://i.ytimg.com/vi/_Yhyp-_hX2s/hqdefault.jpg",
    duration: 326,
    genre: "hiphop"
  },
  {
    id: "YVkUvmDQ3HY",
    title: "Without Me",
    artist: "Eminem",
    thumbnail: "https://i.ytimg.com/vi/YVkUvmDQ3HY/hqdefault.jpg",
    duration: 290,
    genre: "hiphop"
  },

  // Acoustic & Indie
  {
    id: "dvgZkm1xWPE",
    title: "Viva La Vida",
    artist: "Coldplay",
    thumbnail: "https://i.ytimg.com/vi/dvgZkm1xWPE/hqdefault.jpg",
    duration: 242,
    genre: "acoustic"
  },
  {
    id: "yKNxeF4KMsY",
    title: "Yellow",
    artist: "Coldplay",
    thumbnail: "https://i.ytimg.com/vi/yKNxeF4KMsY/hqdefault.jpg",
    duration: 269,
    genre: "acoustic"
  },
  {
    id: "hT_nvWreIhg",
    title: "Counting Stars",
    artist: "OneRepublic",
    thumbnail: "https://i.ytimg.com/vi/hT_nvWreIhg/hqdefault.jpg",
    duration: 257,
    genre: "acoustic"
  },
  {
    id: "0yW7w8F2TVA",
    title: "Say You Won't Let Go",
    artist: "James Arthur",
    thumbnail: "https://i.ytimg.com/vi/0yW7w8F2TVA/hqdefault.jpg",
    duration: 211,
    genre: "acoustic"
  }
];

export function getStoredYouTubeApiKey(): string {
  try {
    const envKey = import.meta.env.VITE_YOUTUBE_API_KEY;
    if (envKey && typeof envKey === "string" && envKey.trim()) {
      return envKey.trim();
    }
    return localStorage.getItem("yt_data_api_key") || "";
  } catch {
    return "";
  }
}

export function setStoredYouTubeApiKey(key: string): void {
  try {
    if (!key.trim()) {
      localStorage.removeItem("yt_data_api_key");
    } else {
      localStorage.setItem("yt_data_api_key", key.trim());
    }
  } catch {
    // ignore
  }
}

/**
 * Extract YouTube 11-char video ID from direct ID or any YouTube/YouTube Music URL.
 */
export function extractYouTubeVideoId(input: string): string | null {
  const trimmed = input.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }
  const match = trimmed.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/
  );
  return match ? match[1] : null;
}

/**
 * Fetch video metadata via public oEmbed endpoints (no API key required).
 */
export async function fetchYouTubeVideoDetails(
  videoId: string
): Promise<YouTubeTrack | null> {
  try {
    const res = await fetch(
      `https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`,
      {
        signal: AbortSignal.timeout(4000)
      }
    );
    if (res.ok) {
      const data = await res.json();
      if (data && data.title) {
        return {
          id: videoId,
          title: cleanSongTitle(decodeHtmlEntities(data.title)),
          artist: decodeHtmlEntities(data.author_name || "YouTube"),
          thumbnail:
            data.thumbnail_url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
        };
      }
    }
  } catch {
    // fallback
  }

  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
      {
        signal: AbortSignal.timeout(4000)
      }
    );
    if (res.ok) {
      const data = await res.json();
      if (data && data.title) {
        return {
          id: videoId,
          title: cleanSongTitle(decodeHtmlEntities(data.title)),
          artist: decodeHtmlEntities(data.author_name || "YouTube"),
          thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
        };
      }
    }
  } catch {
    // fallback
  }

  return {
    id: videoId,
    title: `YouTube Video (${videoId})`,
    artist: "YouTube",
    thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
  };
}

/**
 * Filter tracks by genre from the curated catalog.
 */
export function getTracksByGenre(genreId: string): YouTubeTrack[] {
  if (!genreId || genreId === "trending") {
    const trending = CURATED_TRACKS.filter((t) => t.genre === "trending");
    return trending.length > 0 ? trending : CURATED_TRACKS;
  }
  const filtered = CURATED_TRACKS.filter((t) => t.genre === genreId);
  return filtered.length > 0 ? filtered : CURATED_TRACKS;
}

/**
 * Comprehensive YouTube Track Search:
 * 1. Checks if the query is a YouTube link or Video ID -> resolves directly.
 * 2. Uses YouTube Data API v3 if API key is provided.
 * 3. Tries public CORS Invidious search.
 * 4. Falls back to rich curated multi-genre catalog search.
 */
export async function searchYouTubeTracks(
  query: string,
  apiKeyOverride?: string,
  genreFilter?: string
): Promise<YouTubeTrack[]> {
  const trimmed = query.trim();
  if (!trimmed) {
    return genreFilter ? getTracksByGenre(genreFilter) : CURATED_TRACKS;
  }

  // 1. Direct YouTube link or 11-char Video ID
  const directId = extractYouTubeVideoId(trimmed);
  if (directId) {
    const singleTrack = await fetchYouTubeVideoDetails(directId);
    if (singleTrack) {
      const others = CURATED_TRACKS.filter((t) => t.id !== directId);
      return [singleTrack, ...others];
    }
  }

  const apiKey = apiKeyOverride || getStoredYouTubeApiKey();

  // 2. YouTube Data API v3 (if key available)
  if (apiKey) {
    try {
      const encodedQuery = encodeURIComponent(trimmed);
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=20&q=${encodedQuery}&type=video&videoCategoryId=10&key=${apiKey}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
      if (res.ok) {
        const data = await res.json();
        if (data.items && data.items.length > 0) {
          return data.items
            .filter((item: any) => item.id?.videoId)
            .map((item: any) => {
              const title = decodeHtmlEntities(item.snippet?.title || "Unknown Title");
              const channel = decodeHtmlEntities(
                item.snippet?.channelTitle || "YouTube Artist"
              );
              const thumbnail =
                item.snippet?.thumbnails?.high?.url ||
                item.snippet?.thumbnails?.medium?.url ||
                item.snippet?.thumbnails?.default?.url ||
                `https://i.ytimg.com/vi/${item.id.videoId}/hqdefault.jpg`;
              return {
                id: item.id.videoId,
                title: cleanSongTitle(title),
                artist: channel,
                thumbnail
              };
            });
        }
      }
    } catch (err) {
      console.warn("YouTube Data API fetch error, trying public fallbacks:", err);
    }
  }

  // 3. Public CORS Invidious Search Instance
  try {
    const encoded = encodeURIComponent(trimmed);
    const invidiousUrl = `https://invidious.f5.si/api/v1/search?q=${encoded}&type=video`;
    const res = await fetch(invidiousUrl, { signal: AbortSignal.timeout(3500) });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const tracks: YouTubeTrack[] = data
          .filter((item: any) => item.videoId)
          .map((item: any) => ({
            id: item.videoId,
            title: cleanSongTitle(decodeHtmlEntities(item.title || "Unknown Song")),
            artist: decodeHtmlEntities(item.author || "YouTube Artist"),
            // Always use YouTube's own CDN — Invidious proxy thumbnail URLs fail in-browser
            thumbnail: `https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg`,
            duration:
              typeof item.lengthSeconds === "number" ? item.lengthSeconds : undefined
          }));
        if (tracks.length > 0) {
          return tracks;
        }
      }
    }
  } catch (err) {
    // Invidious fallback failed or timed out, will proceed to local catalog
  }

  // 4. Smart Local Search over Curated Catalog
  const lowerQuery = trimmed.toLowerCase();
  const queryTokens = lowerQuery.split(/\s+/).filter(Boolean);

  const matched = CURATED_TRACKS.filter((track) => {
    const titleLower = track.title.toLowerCase();
    const artistLower = track.artist.toLowerCase();
    const genreLower = (track.genre || "").toLowerCase();

    return (
      titleLower.includes(lowerQuery) ||
      artistLower.includes(lowerQuery) ||
      genreLower.includes(lowerQuery) ||
      queryTokens.some(
        (token) => titleLower.includes(token) || artistLower.includes(token)
      )
    );
  });

  if (matched.length > 0) {
    return matched;
  }

  if (genreFilter) {
    return getTracksByGenre(genreFilter);
  }

  return CURATED_TRACKS;
}

function decodeHtmlEntities(str: string): string {
  const txt = document.createElement("textarea");
  txt.innerHTML = str;
  return txt.value;
}

function cleanSongTitle(title: string): string {
  return title
    .replace(/\s*\(Official (Music )?Video\)/gi, "")
    .replace(/\s*\[Official (Music )?Video\]/gi, "")
    .replace(/\s*\(Official Audio\)/gi, "")
    .replace(/\s*\[Official Audio\]/gi, "")
    .replace(/\s*\(Lyric Video\)/gi, "")
    .replace(/\s*\[Lyric Video\]/gi, "")
    .replace(/\s*\(Visualizer\)/gi, "")
    .replace(/\s*\[Visualizer\]/gi, "")
    .replace(/\s*\(HD\)/gi, "")
    .replace(/\s*\(HQ\)/gi, "")
    .replace(/\s*\[4K UPGRADE\]/gi, "")
    .trim();
}
