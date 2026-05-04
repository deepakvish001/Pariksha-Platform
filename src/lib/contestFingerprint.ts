/**
 * Hardware fingerprint used to bind a secure-mode session to a single
 * machine. The heartbeat RPC re-checks this every ~20s and flags any
 * drift in canvas / WebGL / audio / fonts — which would normally only
 * happen if the user swapped device, joined via a VM, or changed GPU
 * driver mid-contest. NOT a security boundary by itself; combine with
 * room-scan + identity recheck.
 */
export interface ContestFingerprint {
  ua: string;
  screen: { w: number; h: number; dpr: number };
  tz: string;
  canvasHash: string;
  webglHash: string;
  audioHash: string;
  fontsHash: string;
}

async function sha256(s: string): Promise<string> {
  const enc = new TextEncoder().encode(s);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function canvasFingerprint(): string {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 200;
    canvas.height = 50;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "no-ctx";
    ctx.textBaseline = "top";
    ctx.font = "14px 'Arial'";
    ctx.fillStyle = "#f60";
    ctx.fillRect(0, 0, 100, 30);
    ctx.fillStyle = "#069";
    ctx.fillText("byteskill-contest", 2, 2);
    ctx.fillStyle = "rgba(102,204,0,0.7)";
    ctx.fillText("byteskill-contest", 4, 17);
    return canvas.toDataURL();
  } catch {
    return "no-canvas";
  }
}

function webglFingerprint(): string {
  try {
    const canvas = document.createElement("canvas");
    const gl = (canvas.getContext("webgl") ||
      canvas.getContext("experimental-webgl")) as WebGLRenderingContext | null;
    if (!gl) return "no-webgl";
    const dbg = gl.getExtension("WEBGL_debug_renderer_info");
    const vendor = dbg ? gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR);
    const renderer = dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
    const version = gl.getParameter(gl.VERSION);
    const sl = gl.getParameter(gl.SHADING_LANGUAGE_VERSION);
    return `${vendor}|${renderer}|${version}|${sl}`;
  } catch {
    return "no-webgl";
  }
}

async function audioFingerprint(): Promise<string> {
  try {
    const Ctx = (window as unknown as { OfflineAudioContext?: typeof OfflineAudioContext })
      .OfflineAudioContext;
    if (!Ctx) return "no-audio";
    const ctx = new Ctx(1, 4400, 44100);
    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.value = 1000;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -50;
    comp.knee.value = 40;
    comp.ratio.value = 12;
    comp.attack.value = 0;
    comp.release.value = 0.25;
    osc.connect(comp);
    comp.connect(ctx.destination);
    osc.start(0);
    const buf = await ctx.startRendering();
    const data = buf.getChannelData(0);
    let sum = 0;
    for (let i = 4000; i < 4400; i++) sum += Math.abs(data[i] || 0);
    return sum.toString();
  } catch {
    return "no-audio";
  }
}

const FONT_PROBES = [
  "Arial", "Courier New", "Georgia", "Tahoma", "Times New Roman", "Verdana",
  "Comic Sans MS", "Trebuchet MS", "Impact", "Segoe UI", "Roboto", "Helvetica",
];

function fontsFingerprint(): string {
  try {
    const baseline = ["monospace", "sans-serif", "serif"];
    const probe = document.createElement("span");
    probe.style.cssText =
      "position:absolute;left:-9999px;top:-9999px;font-size:72px;visibility:hidden;";
    probe.textContent = "mmmmmmmmmmlli";
    document.body.appendChild(probe);
    const baseSizes: Record<string, { w: number; h: number }> = {};
    for (const b of baseline) {
      probe.style.fontFamily = b;
      baseSizes[b] = { w: probe.offsetWidth, h: probe.offsetHeight };
    }
    const present: string[] = [];
    for (const f of FONT_PROBES) {
      let matched = false;
      for (const b of baseline) {
        probe.style.fontFamily = `'${f}',${b}`;
        if (probe.offsetWidth !== baseSizes[b].w || probe.offsetHeight !== baseSizes[b].h) {
          matched = true;
          break;
        }
      }
      if (matched) present.push(f);
    }
    document.body.removeChild(probe);
    return present.join(",");
  } catch {
    return "no-fonts";
  }
}

export async function computeContestFingerprint(): Promise<ContestFingerprint> {
  const [canvasData, webglData, audioData, fontsData] = await Promise.all([
    Promise.resolve(canvasFingerprint()),
    Promise.resolve(webglFingerprint()),
    audioFingerprint(),
    Promise.resolve(fontsFingerprint()),
  ]);
  const [canvasHash, webglHash, audioHash, fontsHash] = await Promise.all([
    sha256(canvasData),
    sha256(webglData),
    sha256(audioData),
    sha256(fontsData),
  ]);
  return {
    ua: navigator.userAgent,
    screen: {
      w: window.screen.width,
      h: window.screen.height,
      dpr: window.devicePixelRatio || 1,
    },
    tz: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    canvasHash,
    webglHash,
    audioHash,
    fontsHash,
  };
}
