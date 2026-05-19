/**
 * Validate a hex color string with actionable error messages.
 * Empty string is valid (means "use default" / not set).
 */
export function validateHexColor(input: string): { ok: true } | { ok: false; error: string } {
  if (!input) return { ok: true };

  if (/\s/.test(input)) {
    return { ok: false, error: "Color can't contain spaces. Try something like #1F6FEB." };
  }

  if (!input.startsWith("#")) {
    if (/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(input)) {
      return { ok: false, error: `Add a leading "#" — e.g. #${input}.` };
    }
    return { ok: false, error: 'Hex colors must start with "#" (e.g. #1F6FEB).' };
  }

  const body = input.slice(1);

  if (body.length === 0) {
    return { ok: false, error: "Add 3 or 6 hex digits after #, e.g. #1F6FEB." };
  }

  if (/[^0-9a-fA-F]/.test(body)) {
    const bad = Array.from(new Set(body.match(/[^0-9a-fA-F]/g) ?? []))
      .slice(0, 3)
      .join(" ");
    return { ok: false, error: `Only 0-9 and A-F are allowed. Remove: ${bad}.` };
  }

  if (body.length === 4 || body.length === 5) {
    return {
      ok: false,
      error: `#${body} has ${body.length} digits. Use 3 (e.g. #1AF) or 6 (e.g. #11AAFF).`,
    };
  }

  if (body.length === 7 || body.length === 8) {
    return { ok: false, error: "Alpha channel (#RRGGBBAA) isn't supported. Use 6 hex digits." };
  }

  if (body.length !== 3 && body.length !== 6) {
    return {
      ok: false,
      error: `#${body} has ${body.length} digits. Use 3 or 6 hex digits (e.g. #1F6FEB).`,
    };
  }

  return { ok: true };
}

/** Expand `#abc` to `#aabbcc`. Assumes `value` is already a valid hex. */
export function expandHex(value: string): string {
  const body = value.replace(/^#/, "");
  if (body.length === 3) {
    return "#" + body.split("").map((c) => c + c).join("");
  }
  return "#" + body;
}
