import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Loader2, Search, X } from "lucide-react";
import { useAdminUserSearch, type AdminUserHit } from "@/hooks/admin/useAdminUserSearch";

interface Props {
  value: AdminUserHit | null;
  onChange: (u: AdminUserHit | null) => void;
  placeholder?: string;
}

export const AdminUserPicker = ({ value, onChange, placeholder = "Search by name, username, or UUID…" }: Props) => {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const { data = [], isFetching } = useAdminUserSearch(q);

  if (value) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-border/50 bg-card/50 px-3 py-2 text-sm">
        {value.avatar_url ? (
          <img src={value.avatar_url} alt="" className="h-6 w-6 rounded-full object-cover" />
        ) : (
          <div className="h-6 w-6 rounded-full bg-muted" />
        )}
        <div className="min-w-0 flex-1">
          <div className="truncate font-medium">{value.full_name || value.username || "Unnamed"}</div>
          <div className="truncate text-xs text-muted-foreground">{value.username ? `@${value.username} · ` : ""}{value.user_id}</div>
        </div>
        <Button size="icon" variant="ghost" onClick={() => onChange(null)} aria-label="Clear">
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-start text-left font-normal text-muted-foreground">
          <Search className="h-4 w-4 mr-2" /> {placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[420px] p-0" align="start">
        <div className="p-2 border-b border-border/50">
          <Input
            autoFocus
            placeholder="Type at least 2 characters or paste UUID"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="max-h-72 overflow-auto py-1">
          {isFetching && (
            <div className="flex items-center justify-center py-4 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> Searching…
            </div>
          )}
          {!isFetching && q.trim().length < 2 && !/^[0-9a-f-]{36}$/i.test(q.trim()) && (
            <div className="px-3 py-4 text-xs text-muted-foreground">Start typing to search.</div>
          )}
          {!isFetching && data.length === 0 && q.trim().length >= 2 && (
            <div className="px-3 py-4 text-xs text-muted-foreground">No users found.</div>
          )}
          {data.map((u) => (
            <button
              key={u.user_id}
              onClick={() => { onChange(u); setOpen(false); setQ(""); }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent"
            >
              {u.avatar_url ? (
                <img src={u.avatar_url} alt="" className="h-7 w-7 rounded-full object-cover" />
              ) : (
                <div className="h-7 w-7 rounded-full bg-muted" />
              )}
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{u.full_name || u.username || "Unnamed"}</div>
                <div className="truncate text-xs text-muted-foreground">{u.username ? `@${u.username}` : u.user_id}</div>
              </div>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};
