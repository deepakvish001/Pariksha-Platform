/** Map a bare URL on its own line to an embed iframe spec. */
export interface EmbedSpec {
  src: string;
  title: string;
  /** Tailwind aspect class — applied to wrapper. Use empty string for fixed-height embeds (`height` set). */
  aspect: string;
  allow?: string;
  /** Fixed height in px (overrides aspect ratio). */
  height?: number;
  /** Provider name for analytics / accessibility. */
  provider?: string;
}

export function detectEmbed(url: string): EmbedSpec | null {
  try {
    const u = new URL(url.trim());
    const host = u.hostname.replace(/^www\./, "");

    // YouTube
    if (host === "youtube.com" || host === "m.youtube.com") {
      const id = u.searchParams.get("v");
      if (id) {
        return {
          src: `https://www.youtube.com/embed/${id}`,
          title: "YouTube video",
          aspect: "aspect-video",
          allow:
            "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture",
          provider: "youtube",
        };
      }
    }
    if (host === "youtu.be") {
      const id = u.pathname.slice(1);
      if (id) {
        return {
          src: `https://www.youtube.com/embed/${id}`,
          title: "YouTube video",
          aspect: "aspect-video",
          provider: "youtube",
        };
      }
    }

    // Vimeo
    if (host.endsWith("vimeo.com")) {
      const id = u.pathname.split("/").filter(Boolean).pop();
      if (id && /^\d+$/.test(id)) {
        return {
          src: `https://player.vimeo.com/video/${id}`,
          title: "Vimeo video",
          aspect: "aspect-video",
          provider: "vimeo",
        };
      }
    }

    // Loom
    if (host.endsWith("loom.com")) {
      const parts = u.pathname.split("/").filter(Boolean);
      const idx = parts.indexOf("share");
      const id = idx >= 0 ? parts[idx + 1] : parts[parts.length - 1];
      if (id) {
        return {
          src: `https://www.loom.com/embed/${id}`,
          title: "Loom video",
          aspect: "aspect-video",
          provider: "loom",
        };
      }
    }

    // CodePen
    if (host.endsWith("codepen.io")) {
      const parts = u.pathname.split("/").filter(Boolean);
      if (parts.length >= 3 && parts[1] === "pen") {
        return {
          src: `https://codepen.io/${parts[0]}/embed/${parts[2]}?default-tab=result`,
          title: "CodePen",
          aspect: "aspect-video",
          provider: "codepen",
        };
      }
    }

    // GitHub Gist → render as a script-loaded iframe via gist embed page
    if (host === "gist.github.com") {
      const parts = u.pathname.split("/").filter(Boolean);
      if (parts.length >= 2) {
        // Use gist embed via gist.githack mirror is unreliable; instead use the official iframe wrapper:
        return {
          src: `https://gist.github.com/${parts[0]}/${parts[1]}.pibb`,
          title: "GitHub Gist",
          aspect: "",
          height: 360,
          provider: "gist",
        };
      }
    }

    // Spotify (track / episode / playlist / show)
    if (host.endsWith("spotify.com")) {
      const parts = u.pathname.split("/").filter(Boolean);
      if (parts.length >= 2) {
        const kind = parts[0];
        const id = parts[1];
        if (["track", "episode", "playlist", "show", "album"].includes(kind)) {
          return {
            src: `https://open.spotify.com/embed/${kind}/${id}`,
            title: "Spotify",
            aspect: "",
            height: kind === "track" ? 152 : 232,
            allow: "autoplay; clipboard-write; encrypted-media; picture-in-picture",
            provider: "spotify",
          };
        }
      }
    }

    // Figma
    if (host.endsWith("figma.com")) {
      if (/^\/(file|proto|design)\//.test(u.pathname)) {
        return {
          src: `https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(url)}`,
          title: "Figma",
          aspect: "aspect-video",
          allow: "fullscreen",
          provider: "figma",
        };
      }
    }

    // Twitter / X — handled inline as a styled link card; iframe not allowed without their widget script.
    if (host === "twitter.com" || host === "x.com") {
      const parts = u.pathname.split("/").filter(Boolean);
      if (parts.length >= 3 && parts[1] === "status") {
        return {
          src: `https://platform.twitter.com/embed/Tweet.html?id=${parts[2]}`,
          title: "Tweet",
          aspect: "",
          height: 520,
          provider: "twitter",
        };
      }
    }
  } catch {
    return null;
  }
  return null;
}
