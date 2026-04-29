import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { CalendarIcon, ChevronLeft, ChevronRight, Globe, EyeOff, RotateCcw, Search, ExternalLink } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import {
  usePublishHistory,
  usePublishHistoryActors,
  type PublishHistoryFilters,
} from "@/hooks/usePublishHistory";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { formatRelative } from "@/lib/formatRelative";

const PAGE_SIZE_OPTIONS = [25, 50, 100];

const DEFAULT_FILTERS: PublishHistoryFilters = {
  action: "all",
  search: "",
  from: null,
  to: null,
  actorId: null,
};

const PublishHistory = () => {
  const [filters, setFilters] = useState<PublishHistoryFilters>(DEFAULT_FILTERS);
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Debounce search input -> filters.search
  useEffect(() => {
    const t = window.setTimeout(() => {
      setFilters((f) => (f.search === searchInput ? f : { ...f, search: searchInput }));
    }, 300);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  // Reset page when filters change
  const filterKey = useMemo(
    () => `${filters.action}|${filters.search}|${filters.from}|${filters.to}|${filters.actorId}|${pageSize}`,
    [filters, pageSize],
  );
  useEffect(() => {
    setPage(1);
  }, [filterKey]);

  const { data, isLoading, isFetching } = usePublishHistory({ filters, page, pageSize });
  const { data: actors = [] } = usePublishHistoryActors();

  const total = data?.total ?? 0;
  const rows = data?.rows ?? [];
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const showingFrom = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const showingTo = Math.min(page * pageSize, total);

  const fromDate = filters.from ? new Date(filters.from) : undefined;
  const toDate = filters.to ? new Date(filters.to) : undefined;

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setSearchInput("");
  };

  const hasActiveFilters =
    filters.action !== "all" ||
    !!filters.search ||
    !!filters.from ||
    !!filters.to ||
    !!filters.actorId;

  return (
    <AdminShell>
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Publish History</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every publish and unpublish event for coding problems. Filter by action, problem, date, or admin.
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-4 p-4">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Search slug</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="two-sum"
                className="pl-8"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Action</label>
            <Select
              value={filters.action}
              onValueChange={(v: any) => setFilters((f) => ({ ...f, action: v }))}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All actions</SelectItem>
                <SelectItem value="publish">Published</SelectItem>
                <SelectItem value="unpublish">Unpublished</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">From</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !fromDate && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {fromDate ? format(fromDate, "PP") : "Any"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={fromDate}
                  onSelect={(d) =>
                    setFilters((f) => ({
                      ...f,
                      from: d ? new Date(d.setHours(0, 0, 0, 0)).toISOString() : null,
                    }))
                  }
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">To</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !toDate && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {toDate ? format(toDate, "PP") : "Any"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={toDate}
                  onSelect={(d) =>
                    setFilters((f) => ({
                      ...f,
                      to: d ? new Date(d.setHours(23, 59, 59, 999)).toISOString() : null,
                    }))
                  }
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="lg:col-span-4">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Admin</label>
            <Select
              value={filters.actorId ?? "all"}
              onValueChange={(v) =>
                setFilters((f) => ({ ...f, actorId: v === "all" ? null : v }))
              }
            >
              <SelectTrigger><SelectValue placeholder="All admins" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All admins</SelectItem>
                {actors.map((a) => (
                  <SelectItem key={a.user_id} value={a.user_id}>
                    {a.full_name ?? `${a.user_id.slice(0, 8)}…`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <Button
              variant="ghost"
              className="w-full"
              onClick={resetFilters}
              disabled={!hasActiveFilters}
            >
              <RotateCcw className="mr-2 h-4 w-4" /> Reset
            </Button>
          </div>
        </div>
      </Card>

      {/* Results */}
      <Card className="overflow-hidden">
        <div className="border-b px-4 py-2 text-xs text-muted-foreground">
          {isLoading ? "Loading…" : (
            <>Showing <strong>{showingFrom}</strong>–<strong>{showingTo}</strong> of <strong>{total}</strong> events{isFetching ? " · refreshing…" : ""}</>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">
            No publish events match the current filters.
          </div>
        ) : (
          <ul className="divide-y">
            {rows.map((r) => {
              const published = r.action === "publish";
              return (
                <li key={r.id} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
                  <Badge
                    variant="outline"
                    className={cn(
                      "gap-1",
                      published
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-500"
                        : "border-amber-500/40 bg-amber-500/10 text-amber-500",
                    )}
                  >
                    {published ? <Globe className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                    {published ? "Published" : "Unpublished"}
                  </Badge>

                  <div className="min-w-0 flex-1">
                    {r.entity_slug ? (
                      <Link
                        to={`/admin/problems/${r.entity_slug}/edit`}
                        className="font-mono text-sm hover:underline"
                      >
                        {r.entity_slug}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      {r.actor_avatar && <AvatarImage src={r.actor_avatar} alt="" />}
                      <AvatarFallback className="text-[10px]">
                        {(r.actor_name ?? r.actor_id).slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-muted-foreground">
                      {r.actor_name ?? `${r.actor_id.slice(0, 8)}…`}
                    </span>
                  </div>

                  <time
                    dateTime={r.created_at}
                    title={new Date(r.created_at).toLocaleString()}
                    className="w-28 shrink-0 text-right text-xs text-muted-foreground"
                  >
                    {formatRelative(r.created_at)}
                  </time>

                  {r.entity_slug && published && (
                    <Button asChild size="icon" variant="ghost" className="h-7 w-7">
                      <a
                        href={`/library/problems/${r.entity_slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="View as learner"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {/* Pagination */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>Rows per page</span>
            <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
              <SelectTrigger className="h-8 w-20"><SelectValue /></SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map((n) => (
                  <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span>
              Page <strong>{page}</strong> of <strong>{totalPages}</strong>
            </span>
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </AdminShell>
  );
};

export default PublishHistory;
