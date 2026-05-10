/** Map a bare URL on its own line to an embed iframe spec. */
export interface EmbedSpec {
  src: string;
  title: string;
  aspect: string; // tailwind aspect class
  allow?: string;
}

export function detectEmbed(url: string): EmbedSpec | null {
  try {
    const u = new URL(url.trim());
    // YouTube
    const yt = u.hostname.replace(/^www\./, "");
    if (yt === "youtube.com" || yt === "m.youtube.com") {
      const id = u.searchParams.get("v");
      if (id)
        return {
          src: `https://www.youtube.com/embed/${id}`,
          title: "YouTube video",
          aspect: "aspect-video",
          allow:
            "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture",
        };
    }
    if (yt === "youtu.be") {
      const id = u.pathname.slice(1);
      if (id)
        return {
          src: `https://www.youtube.com/embed/${id}`,
          title: "YouTube video",
          aspect: "aspect-video",
        };
    }
    // Vimeo
    if (u.hostname.endsWith("vimeo.com")) {
      const id = u.pathname.split("/").filter(Boolean).pop();
      if (id && /^\d+$/.test(id))
        return {
          src: `https://player.vimeo.com/video/${id}`,
          title: "Vimeo video",
          aspect: "aspect-video",
        };
    }
    // CodePen
    if (u.hostname.endsWith("codepen.io")) {
      const parts = u.pathname.split("/").filter(Boolean);
      // /:user/pen/:id
      if (parts.length >= 3 && parts[1] === "pen") {
        return {
          src: `https://codepen.io/${parts[0]}/embed/${parts[2]}?default-tab=result`,
          title: "CodePen",
          aspect: "aspect-video",
        };
      }
    }
  } catch {
    return null;
  }
  return null;
}
