export interface JamendoTrack {
  id: string;
  name: string;
  duration: number; // in seconds
  artist_name: string;
  album_name?: string;
  album_image?: string;
  image?: string;
  audio: string;
  shareurl?: string;
}

const JAMENDO_CLIENT_ID = "5b4a8e69";
const BASE_URL = "https://api.jamendo.com/v3.0/tracks";

export const GENRES = [
  { id: "all", label: "🔥 Top Trending" },
  { id: "pop", label: "✨ Pop" },
  { id: "rock", label: "🎸 Rock" },
  { id: "electronic", label: "⚡ Electronic" },
  { id: "lofi", label: "☕ Lo-Fi / Chill" },
  { id: "hiphop", label: "🎧 Hip-Hop" },
  { id: "acoustic", label: "🌿 Acoustic" },
  { id: "classical", label: "🎻 Classical" },
  { id: "jazz", label: "🎷 Jazz" }
];

// Fallback tracks in case of network issue
const FALLBACK_TRACKS: JamendoTrack[] = [
  {
    id: "1141572",
    name: "Sunflower Nights",
    duration: 220,
    artist_name: "Post Malone / Swae Lee",
    album_name: "Spiderman Soundtracks",
    image:
      "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=400&auto=format&fit=crop&q=80",
    audio:
      "https://prod-1.storage.jamendo.com/?trackid=1141572&format=mp32&from=9vow7SdXvhozvsTcRPdCrQ%3D%3D%7CD%2BQ9PIjxWySLaI4TgagfDw%3D%3D"
  },
  {
    id: "1157362",
    name: "Dear Dreams",
    duration: 204,
    artist_name: "JekK",
    album_name: "Dear Dreams",
    image:
      "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=400&auto=format&fit=crop&q=80",
    audio:
      "https://prod-1.storage.jamendo.com/?trackid=1157362&format=mp32&from=hxonxGBWKVP8Rl0kORCUbQ%3D%3D%7CEEGyoPMzHPmqjZZS0mzxGQ%3D%3D"
  },
  {
    id: "1885233",
    name: "Bat Out of Hell (Vibe)",
    duration: 240,
    artist_name: "Meat Loaf / Rock Legends",
    album_name: "Bat Out of Hell",
    image:
      "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80",
    audio:
      "https://prod-1.storage.jamendo.com/?trackid=1141572&format=mp32&from=9vow7SdXvhozvsTcRPdCrQ%3D%3D%7CD%2BQ9PIjxWySLaI4TgagfDw%3D%3D"
  }
];

export async function fetchPopularTracks(limit = 25): Promise<JamendoTrack[]> {
  try {
    const url = `${BASE_URL}/?client_id=${JAMENDO_CLIENT_ID}&format=json&limit=${limit}&order=popularity_total&audioformat=mp32&include=musicinfo`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Jamendo API HTTP error ${res.status}`);
    const data = await res.json();
    if (data.results && data.results.length > 0) {
      return data.results.map((t: any) => ({
        id: String(t.id),
        name: t.name,
        duration: t.duration || 180,
        artist_name: t.artist_name,
        album_name: t.album_name,
        album_image: t.album_image,
        image: t.image || t.album_image,
        audio: t.audio,
        shareurl: t.shareurl
      }));
    }
  } catch (err) {
    console.warn("Jamendo API fetch failed, falling back to local list:", err);
  }
  return FALLBACK_TRACKS;
}

export async function fetchTracksByGenre(
  genre: string,
  limit = 25
): Promise<JamendoTrack[]> {
  if (genre === "all") return fetchPopularTracks(limit);
  try {
    const tag = encodeURIComponent(genre);
    const url = `${BASE_URL}/?client_id=${JAMENDO_CLIENT_ID}&format=json&limit=${limit}&tags=${tag}&order=popularity_total&audioformat=mp32&include=musicinfo`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Jamendo API HTTP error ${res.status}`);
    const data = await res.json();
    if (data.results && data.results.length > 0) {
      return data.results.map((t: any) => ({
        id: String(t.id),
        name: t.name,
        duration: t.duration || 180,
        artist_name: t.artist_name,
        album_name: t.album_name,
        album_image: t.album_image,
        image: t.image || t.album_image,
        audio: t.audio,
        shareurl: t.shareurl
      }));
    }
  } catch (err) {
    console.warn("Jamendo API genre fetch failed:", err);
  }
  return FALLBACK_TRACKS;
}

export async function searchTracks(query: string, limit = 25): Promise<JamendoTrack[]> {
  if (!query.trim()) return fetchPopularTracks(limit);
  try {
    const q = encodeURIComponent(query.trim());
    const url = `${BASE_URL}/?client_id=${JAMENDO_CLIENT_ID}&format=json&limit=${limit}&search=${q}&order=popularity_total&audioformat=mp32&include=musicinfo`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Jamendo API HTTP error ${res.status}`);
    const data = await res.json();
    if (data.results && data.results.length > 0) {
      return data.results.map((t: any) => ({
        id: String(t.id),
        name: t.name,
        duration: t.duration || 180,
        artist_name: t.artist_name,
        album_name: t.album_name,
        album_image: t.album_image,
        image: t.image || t.album_image,
        audio: t.audio,
        shareurl: t.shareurl
      }));
    }
  } catch (err) {
    console.warn("Jamendo search fetch failed:", err);
  }
  return [];
}
