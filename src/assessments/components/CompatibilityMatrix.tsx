import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * OS × browser support grid shown in the pre-flight wizard.
 * Mirrors the matrix in vendor manuals (Chrome / Edge on desktop,
 * Chrome on Android, Safari on iOS). The detected row is highlighted
 * with the primary amber ring so the candidate can see at a glance
 * whether their setup is supported.
 */

export type OSKey = "windows" | "mac" | "linux" | "android" | "ios" | "unknown";
export type BrowserKey = "chrome" | "edge" | "safari" | "firefox" | "unknown";

const OS_LABELS: Record<OSKey, string> = {
  windows: "Windows",
  mac: "macOS",
  linux: "Linux",
  android: "Android",
  ios: "iOS",
  unknown: "Unknown",
};

// Which browsers are officially supported for each OS.
const SUPPORT: Record<OSKey, BrowserKey[]> = {
  windows: ["chrome", "edge"],
  mac: ["chrome", "safari"],
  linux: ["chrome"],
  android: ["chrome", "edge"],
  ios: ["safari"],
  unknown: [],
};

const BROWSERS: { key: BrowserKey; label: string }[] = [
  { key: "chrome", label: "Chrome" },
  { key: "edge", label: "Edge" },
  { key: "safari", label: "Safari" },
];

export function CompatibilityMatrix({
  os,
  browser,
}: {
  os: OSKey;
  browser: BrowserKey;
}) {
  return (
    <div className="rounded-lg border border-[hsl(var(--border))] overflow-hidden">
      <table className="w-full text-xs">
        <thead className="bg-[hsl(var(--secondary))]/60">
          <tr>
            <th className="text-left font-medium px-3 py-2 text-muted-foreground">
              Operating system
            </th>
            {BROWSERS.map((b) => (
              <th
                key={b.key}
                className="text-center font-medium px-3 py-2 text-muted-foreground"
              >
                {b.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(Object.keys(OS_LABELS) as OSKey[])
            .filter((k) => k !== "unknown")
            .map((osKey) => {
              const isCurrent = osKey === os;
              return (
                <tr
                  key={osKey}
                  className={cn(
                    "border-t border-[hsl(var(--border))]",
                    isCurrent &&
                      "bg-[hsl(var(--primary))]/10 ring-1 ring-inset ring-[hsl(var(--primary))]/40",
                  )}
                >
                  <td className="px-3 py-2 font-medium flex items-center gap-2">
                    {OS_LABELS[osKey]}
                    {isCurrent && (
                      <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]">
                        You
                      </span>
                    )}
                  </td>
                  {BROWSERS.map((b) => {
                    const supported = SUPPORT[osKey].includes(b.key);
                    const isMatch = isCurrent && b.key === browser;
                    return (
                      <td key={b.key} className="px-3 py-2 text-center">
                        {supported ? (
                          <span
                            className={cn(
                              "inline-flex h-6 w-6 items-center justify-center rounded-full",
                              isMatch
                                ? "bg-emerald-500 text-white"
                                : "bg-emerald-500/15 text-emerald-600",
                            )}
                            title={isMatch ? "Your current browser" : "Supported"}
                          >
                            <Check className="h-3.5 w-3.5" />
                          </span>
                        ) : (
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-muted/40 text-muted-foreground/60">
                            <Minus className="h-3 w-3" />
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
        </tbody>
      </table>
    </div>
  );
}

/** Best-effort UA sniff. Good enough for a compatibility hint, not security. */
export function detectEnvironment(): {
  os: OSKey;
  browser: BrowserKey;
  supported: boolean;
} {
  if (typeof navigator === "undefined") {
    return { os: "unknown", browser: "unknown", supported: false };
  }
  const ua = navigator.userAgent;
  let os: OSKey = "unknown";
  if (/Windows/i.test(ua)) os = "windows";
  else if (/Android/i.test(ua)) os = "android";
  else if (/(iPhone|iPad|iPod)/i.test(ua)) os = "ios";
  else if (/Mac OS X|Macintosh/i.test(ua)) os = "mac";
  else if (/Linux/i.test(ua)) os = "linux";

  let browser: BrowserKey = "unknown";
  if (/Edg\//.test(ua)) browser = "edge";
  else if (/Chrome\//.test(ua) && !/Edg\//.test(ua)) browser = "chrome";
  else if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) browser = "safari";
  else if (/Firefox\//.test(ua)) browser = "firefox";

  const supported = SUPPORT[os]?.includes(browser) ?? false;
  return { os, browser, supported };
}
