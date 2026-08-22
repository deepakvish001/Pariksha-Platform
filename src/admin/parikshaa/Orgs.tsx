import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ShellHeader } from "./ParikshaaShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { Star, ExternalLink } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

type Org = {
  id: string;
  name: string;
  type: "company" | "college";
  slug: string;
  status: "pending" | "approved" | "suspended";
  featured: boolean;
  created_at: string;
};

function useOrgs(type: "company" | "college", search: string) {
  return useQuery({
    queryKey: ["parikshaa-orgs", type, search],
    queryFn: async (): Promise<Org[]> => {
      let q = supabase
        .from("organizations")
        .select("id,name,type,slug,status,featured,created_at")
        .eq("type", type)
        .order("created_at", { ascending: false })
        .limit(200);
      if (search.trim()) q = q.ilike("name", `%${search.trim()}%`);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Org[];
    },
  });
}

function OrgTable({ type }: { type: "company" | "college" }) {
  const [search, setSearch] = useState("");
  const { data, isLoading } = useOrgs(type, search);
  const qc = useQueryClient();
  const { user } = useAuth();

  const refresh = () => qc.invalidateQueries({ queryKey: ["parikshaa-orgs"] });

  const update = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Org> & { approved_by?: string; approved_at?: string } }) => {
      const { error } = await supabase.from("organizations").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { refresh(); toast({ title: "Updated" }); },
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-4">
      <Input
        placeholder={`Search ${type === "company" ? "companies" : "colleges"}…`}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-md"
      />
      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="grid grid-cols-[1fr,180px,140px,120px,260px] px-4 py-2 text-xs uppercase tracking-wider text-muted-foreground border-b">
          <div>Name</div>
          <div>Slug</div>
          <div>Status</div>
          <div>Featured</div>
          <div className="text-right">Actions</div>
        </div>
        {isLoading ? (
          <div className="px-4 py-6 text-sm text-muted-foreground"></div>
        ) : (data ?? []).length === 0 ? (
          <div className="px-4 py-6 text-sm text-muted-foreground">None yet.</div>
        ) : (
          (data ?? []).map((o) => {
            const baseUrl = type === "company" ? `/companies/${o.slug}` : `/colleges/${o.slug}`;
            return (
              <div key={o.id} className="grid grid-cols-[1fr,180px,140px,120px,260px] px-4 py-3 text-sm border-b last:border-0 items-center">
                <div className="min-w-0">
                  <div className="font-medium truncate">{o.name}</div>
                  <div className="text-[11px] text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</div>
                </div>
                <div className="flex items-center gap-1 min-w-0">
                  <code className="text-xs truncate">{o.slug}</code>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={`Edit slug for ${o.name}`}
                    className="h-6 w-6 shrink-0"
                    onClick={() => {
                      const next = window.prompt("New slug (lowercase, hyphenated)", o.slug);
                      if (next && next !== o.slug) update.mutate({ id: o.id, patch: { slug: next.toLowerCase().trim() } });
                    }}
                  >
                    ✎
                  </Button>
                </div>
                <div>
                  <Badge variant={o.status === "approved" ? "outline" : o.status === "pending" ? "secondary" : "destructive"}>
                    {o.status}
                  </Badge>
                </div>
                <div>
                  <Button
                    size="sm"
                    variant="ghost"
                    aria-label={o.featured ? `Remove ${o.name} from featured` : `Mark ${o.name} as featured`}
                    onClick={() => update.mutate({ id: o.id, patch: { featured: !o.featured } })}
                  >
                    <Star className={`h-4 w-4 ${o.featured ? "fill-amber-400 text-amber-400" : ""}`} />
                  </Button>
                </div>
                <div className="flex justify-end gap-2">
                  {o.status === "pending" && (
                    <Button
                      size="sm"
                      onClick={() =>
                        update.mutate({
                          id: o.id,
                          patch: { status: "approved", approved_at: new Date().toISOString(), approved_by: user?.id },
                        })
                      }
                    >
                      Approve
                    </Button>
                  )}
                  {o.status !== "suspended" ? (
                    <Button size="sm" variant="outline" onClick={() => update.mutate({ id: o.id, patch: { status: "suspended" } })}>
                      Suspend
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => update.mutate({ id: o.id, patch: { status: "approved" } })}>
                      Reinstate
                    </Button>
                  )}
                  <a href={baseUrl} target="_blank" rel="noreferrer">
                    <Button size="sm" variant="ghost" aria-label={`View ${o.name} page`}><ExternalLink className="h-4 w-4" /></Button>
                  </a>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default function ParikshaaOrgs() {
  return (
    <>
      <ShellHeader title="Companies & Colleges" />
      <div className="p-6">
        <Tabs defaultValue="company">
          <TabsList>
            <TabsTrigger value="company">Companies</TabsTrigger>
            <TabsTrigger value="college">Colleges</TabsTrigger>
          </TabsList>
          <TabsContent value="company" className="mt-4">
            <OrgTable type="company" />
          </TabsContent>
          <TabsContent value="college" className="mt-4">
            <OrgTable type="college" />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
