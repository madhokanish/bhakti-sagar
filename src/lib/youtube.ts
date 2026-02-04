export function getYouTubeId(url: string) {
  if (!url) return null;
  try {
    if (url.includes("youtu.be/")) {
      const id = url.split("youtu.be/")[1]?.split(/[?&]/)[0];
      return id || null;
    }
    if (url.includes("watch?v=")) {
      const id = url.split("watch?v=")[1]?.split(/[?&]/)[0];
      return id || null;
    }
    if (url.includes("/embed/")) {
      const id = url.split("/embed/")[1]?.split(/[?&]/)[0];
      return id || null;
    }
  } catch {
    return null;
  }
  return null;
}

export function getYouTubeEmbedUrl(url: string) {
  const id = getYouTubeId(url);
  if (!id) return null;
  return `https://www.youtube.com/embed/${id}`;
}
