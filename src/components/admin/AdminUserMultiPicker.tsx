import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, X, UsersRound } from "lucide-react";
import { useAdminUserSearch, type AdminUserHit } from "@/hooks/admin/useAdminUserSearch";

interface Props {
  value: AdminUserHit[];
  onChange: (u: AdminUserHit[]) => void;
  placeholder?: string;
}

export const AdminUserMultiPicker = ({ value, onChange, placeholder = "Add users…" }: Props) => {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const { data = [], isFetching } = useAdminUserSearch(q);

  const addUser = (u: AdminUserHit) => {
    if (value.some((v) => v.user_id === u.user_id)) return;
    onChange([...value, u]);
  };
  const removeUser = (id: string) => onChange(value.filter((v) => v.user_id !== id));

  return (
    <div className="space-y-2">
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
            {data.map((u) => {
              const picked = value.some((v) => v.user_id === u.user_id);
              return (
                <button
                  key={u.user_id}
                  onClick={() => { addUser(u); }}
                  disabled={picked}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent disabled:opacity-50"
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
                  {picked && <span className="text-[10px] text-muted-foreground">added</span>}
                </button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>

      {value.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {value.map((u) => (
            <Badge key={u.user_id} variant="secondary" className="gap-1 pr-1">
              <UsersRound className="h-3 w-3" />
              <span className="max-w-[140px] truncate">{u.full_name || u.username || u.user_id.slice(0, 8)}</span>
              <button
                onClick={() => removeUser(u.user_id)}
                className="ml-0.5 rounded hover:bg-background/40 p-0.5"
                aria-label="Remove"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => onChange([])}>
            Clear all
          </Button>
        </div>
      ) : (
        <p className="text-[11px] text-muted-foreground">No users selected. The change will apply to everyone you add here.</p>
      )}
    </div>
  );
};
