// VERSION: v1.0
// Helpers para detectar y extraer info de links de YouTube

const YT_REGEX =
  /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:\S*)?/i;

/**
 * Devuelve el videoId de YouTube si el texto completo es (o contiene) un link valido.
 * Soporta: youtube.com/watch?v=, youtu.be/, youtube.com/shorts/, youtube.com/live/
 */
export function extractYouTubeId(text: string | null | undefined): string | null {
  if (!text) return null;
  const match = text.trim().match(YT_REGEX);
  return match ? match[1] : null;
}

/** True si el mensaje de texto es (esencialmente) solo un link de YouTube. */
export function isYouTubeLink(text: string | null | undefined): boolean {
  return extractYouTubeId(text) !== null;
}

export function youtubeThumbnail(videoId: string): string {
  // hqdefault siempre existe; maxresdefault no siempre (depende del video)
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

export function youtubeWatchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}
