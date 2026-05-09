import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { GraduationCap, Building2 } from "lucide-react";
import { slugify } from "../hooks/useOrg";
import "../theme.css";

export default function B2BOnboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [type, setType] = useState<"college" | "company" | null>(null);
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (!type || name.trim().length < 2) return;
    setSubmitting(true);
    const baseSlug = slugify(name) || "org";
    const slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;
    const { data, error } = await supabase
      .from("organizations")
      .insert({ name: name.trim(), type, slug, owner_id: user.id })
      .select()
      .maybeSingle();
    setSubmitting(false);
    if (error) {
      toast({ title: "Could not create organization", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Organization created", description: data?.name });
    navigate("/b2b/dashboard");
  };

  return (
    <div className="theme-b2b min-h-screen grid place-items-center px-4 py-10">
      <div className="w-full max-w-xl">
        <div className="text-center mb-8">
          <div className="mx-auto h-12 w-12 rounded-lg bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] grid place-items-center font-bold text-xl">P</div>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight">Set up your organization</h1>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
            Tell us who you're running assessments for. You can add teammates later.
          </p>
        </div>

        <div className="b2b-card p-6 space-y-6">
          <div>
            <Label className="text-sm">I'm setting up Parikshaa for a</Label>
            <div className="mt-2 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType("college")}
                className={`b2b-card p-4 text-left transition-all ${type === "college" ? "ring-2 ring-[hsl(var(--primary))]" : "hover:border-[hsl(var(--primary))]"}`}
              >
                <GraduationCap className="h-5 w-5 text-[hsl(var(--primary))]" />
                <p className="mt-2 text-sm font-medium">College</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">Placement assessments for students</p>
              </button>
              <button
                type="button"
                onClick={() => setType("company")}
                className={`b2b-card p-4 text-left transition-all ${type === "company" ? "ring-2 ring-[hsl(var(--primary))]" : "hover:border-[hsl(var(--primary))]"}`}
              >
                <Building2 className="h-5 w-5 text-[hsl(var(--primary))]" />
                <p className="mt-2 text-sm font-medium">Company</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">Coding tests for hiring developers</p>
              </button>
            </div>
          </div>

          <div>
            <Label htmlFor="org-name" className="text-sm">Organization name</Label>
            <Input
              id="org-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={type === "college" ? "e.g. IIT Delhi" : "e.g. Acme Inc."}
              maxLength={80}
              className="mt-1"
            />
          </div>

          <Button
            className="w-full bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90"
            disabled={!type || name.trim().length < 2 || submitting}
            onClick={handleCreate}
          >
            {submitting ? "Creating…" : "Create organization"}
          </Button>
        </div>
      </div>
    </div>
  );
}
