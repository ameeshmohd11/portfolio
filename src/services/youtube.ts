export interface YouTubeTrack {
  id: string; // YouTube Video ID
  title: string;
  artist: string;
  thumbnail: string;
  duration?: number; // in seconds if available
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

// Rich curated list of YouTube music with high-quality video IDs
export const CURATED_TRACKS: YouTubeTrack[] = [
  {
    id: "3Q8iuY9005E",
    title: "Bat Out of Hell",
    artist: "Meat Loaf",
    thumbnail: "https://i.ytimg.com/vi/3Q8iuY9005E/hqdefault.jpg",
    duration: 295
  },
  {
    id: "ApXoWvfEYVU",
    title: "Sunflower (Spider-Man: Into the Spider-Verse)",
    artist: "Post Malone, Swae Lee",
    thumbnail: "https://i.ytimg.com/vi/ApXoWvfEYVU/hqdefault.jpg",
    duration: 158
  },
  {
    id: "4NRXx6U8ABQ",
    title: "Blinding Lights",
    artist: "The Weeknd",
    thumbnail: "https://i.ytimg.com/vi/4NRXx6U8ABQ/hqdefault.jpg",
    duration: 200
  },
  {
    id: "jfKfPfyJRdk",
    title: "lofi hip hop radio - beats to relax/study to",
    artist: "Lofi Girl",
    thumbnail: "https://i.ytimg.com/vi/jfKfPfyJRdk/hqdefault.jpg",
    duration: 3600
  },
  {
    id: "fJ9rUzIMcZQ",
    title: "Bohemian Rhapsody",
    artist: "Queen",
    thumbnail: "https://i.ytimg.com/vi/fJ9rUzIMcZQ/hqdefault.jpg",
    duration: 359
  },
  {
    id: "kXYiU_JCYtU",
    title: "Numb",
    artist: "Linkin Park",
    thumbnail: "https://i.ytimg.com/vi/kXYiU_JCYtU/hqdefault.jpg",
    duration: 187
  },
  {
    id: "hT_nvWreIhg",
    title: "Counting Stars",
    artist: "OneRepublic",
    thumbnail: "https://i.ytimg.com/vi/hT_nvWreIhg/hqdefault.jpg",
    duration: 257
  },
  {
    id: "JGwWNGJdvx8",
    title: "Shape of You",
    artist: "Ed Sheeran",
    thumbnail: "https://i.ytimg.com/vi/JGwWNGJdvx8/hqdefault.jpg",
    duration: 233
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
    localStorage.setItem("yt_data_api_key", key.trim());
  } catch {
    // ignore
  }
}

export async function searchYouTubeTracks(
  query: string,
  apiKeyOverride?: string
): Promise<YouTubeTrack[]> {
  const apiKey = apiKeyOverride || getStoredYouTubeApiKey();

  if (!apiKey) {
    // If no API key is provided, filter or return curated tracks matching the query
    const lower = query.toLowerCase();
    const filtered = CURATED_TRACKS.filter(
      (t) =>
        t.title.toLowerCase().includes(lower) || t.artist.toLowerCase().includes(lower)
    );
    return filtered.length > 0 ? filtered : CURATED_TRACKS;
  }

  try {
    const encodedQuery = encodeURIComponent(query);
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=20&q=${encodedQuery}&type=video&videoCategoryId=10&key=${apiKey}`;
    const res = await fetch(url);
    if (!res.ok) {
      const err = await res.json();
      console.warn("YouTube Data API error:", err);
      return CURATED_TRACKS;
    }
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
            item.snippet?.thumbnails?.default?.url;
          return {
            id: item.id.videoId,
            title: cleanSongTitle(title),
            artist: channel,
            thumbnail
          };
        });
    }
  } catch (err) {
    console.error("YouTube search fetch error:", err);
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
    .replace(/\s*\(HD\)/gi, "")
    .replace(/\s*\(HQ\)/gi, "")
    .trim();
}
