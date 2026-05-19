import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { validateHexColor, expandHex } from "./hexColor";

interface Props {
  canEdit: boolean;
  logoUrl: string;
  setLogoUrl: (v: string) => void;
  brandColor: string;
  setBrandColor: (v: string) => void;
  dirty: boolean;
  onPreview: () => void;
}

export function BrandingSection({
  canEdit,
  logoUrl,
  setLogoUrl,
  brandColor,
  setBrandColor,
  dirty,
  onPreview,
}: Props) {
  const normalizedBrand = brandColor.trim();
  const brandValidation = validateHexColor(normalizedBrand);
  const isValidBrand = brandValidation.ok;
  const brandPreview = isValidBrand && normalizedBrand ? expandHex(normalizedBrand).toUpperCase() : null;

  return (
    <div className="space-y-6">
      <section className="b2b-card p-5">
        <h2 className="text-sm font-semibold mb-4">Branding</h2>
        <div className="space-y-4">
          <div>
            <Label className="text-xs">Logo URL (optional)</Label>
            <div className="mt-1 flex items-center gap-3">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Org logo preview"
                  className="h-10 w-10 rounded-md border border-[hsl(var(--border))] object-contain bg-white"
                  onError={(e) => (e.currentTarget.style.opacity = "0.3")}
                />
              ) : (
                <div className="h-10 w-10 rounded-md border border-dashed border-[hsl(var(--border))] grid place-items-center text-[10px] text-[hsl(var(--muted-foreground))]">
                  Logo
                </div>
              )}
              <Input
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                disabled={!canEdit}
                placeholder="https://…/logo.png"
              />
            </div>
            <p className="mt-1 text-[11px] text-[hsl(var(--muted-foreground))]">
              Shown in invitation emails. Use a square PNG/SVG hosted on a public URL.
            </p>
          </div>

          <div>
            <Label className="text-xs">Brand color (optional)</Label>
            <div className="mt-1 flex items-center gap-3">
              <input
                type="color"
                value={/^#([0-9a-fA-F]{6})$/.test(normalizedBrand) ? normalizedBrand : "#0f172a"}
                onChange={(e) => setBrandColor(e.target.value)}
                disabled={!canEdit}
                className="h-10 w-12 rounded-md border border-[hsl(var(--border))] bg-transparent cursor-pointer disabled:cursor-not-allowed"
                aria-label="Pick brand color"
              />
              <Input
                value={brandColor}
                onChange={(e) => setBrandColor(e.target.value)}
                disabled={!canEdit}
                placeholder="#1f6feb"
                className="font-mono"
              />
            </div>
            {brandValidation.ok !== true ? (
              <p className="mt-1 text-[11px] text-destructive">
                {(brandValidation as { ok: false; error: string }).error}
              </p>
            ) : brandPreview ? (
              <div className="mt-1 flex items-center gap-2 text-[11px] text-[hsl(var(--muted-foreground))]">
                <span
                  aria-hidden
                  className="inline-block h-3 w-3 rounded-sm border border-[hsl(var(--border))]"
                  style={{ background: brandPreview }}
                />
                <span>
                  Looks good. Saving as <span className="font-mono text-[hsl(var(--foreground))]">{brandPreview}</span>.
                </span>
              </div>
            ) : null}
            <p className="mt-1 text-[11px] text-[hsl(var(--muted-foreground))]">
              Used for the header and call-to-action in invitation emails. Accepts{" "}
              <span className="font-mono">#RGB</span> or <span className="font-mono">#RRGGBB</span>.
            </p>
          </div>
        </div>
      </section>

      <section className="b2b-card p-5">
        <h2 className="text-sm font-semibold mb-1">Invitation email</h2>
        <p className="text-xs text-[hsl(var(--muted-foreground))] mb-3">
          Preview how candidates will see your branded invite. Save any branding changes first.
        </p>
        <div className="flex items-center gap-3">
          <Button type="button" variant="outline" size="sm" onClick={onPreview}>
            <Eye className="h-3.5 w-3.5 mr-1.5" /> Preview invitation email
          </Button>
          {dirty && (
            <span className="text-[11px] text-[hsl(var(--muted-foreground))]">
              Save changes first to preview with the latest values.
            </span>
          )}
        </div>
      </section>
    </div>
  );
}
