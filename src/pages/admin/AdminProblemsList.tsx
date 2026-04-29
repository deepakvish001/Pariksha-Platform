import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AdminShell } from "@/components/admin/AdminShell";
import {
  useAdminProblems,
  useDeleteProblem,
  useDuplicateProblem,
  useTogglePublish,
} from "@/hooks/useAdminProblems";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Search, Trash2, Pencil, Copy, X } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const diffColor = (d: string) =>
  d === "easy"
    ? "bg-emerald-500/15 text-emerald-500"
    : d === "hard"
      ? "bg-rose-500/15 text-rose-500"
      : "bg-amber-500/15 text-amber-500";

const AdminProblemsList = () => {
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState<string>("all");
  const [topic, setTopic] = useState<string>("all");
  const [published, setPublished] = useState<string>("all");
  const { data: problems = [], isLoading } = useAdminProblems(search);
  const del = useDeleteProblem();
  const toggle = useTogglePublish();
  const duplicate = useDuplicateProblem();

  const allTopics = useMemo(() => {
    const s = new Set<string>();
    problems.forEach((p) => (p.topics ?? []).forEach((t) => s.add(t)));
    return Array.from(s).sort((a, b) => a.localeCompare(b));
  }, [problems]);

  const filtered = useMemo(() => {
    return problems.filter((p) => {
      if (difficulty !== "all" && p.difficulty !== difficulty) return false;
      if (topic !== "all" && !(p.topics ?? []).includes(topic)) return false;
      if (published === "published" && !p.is_published) return false;
      if (published === "draft" && p.is_published) return false;
      return true;
    });
  }, [problems, difficulty, topic, published]);

  const filtersActive =
    difficulty !== "all" || topic !== "all" || published !== "all" || !!search;

  const clearFilters = () => {
    setSearch("");
    setDifficulty("all");
    setTopic("all");
    setPublished("all");
  };

  return (
    <AdminShell>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Coding Problems</h1>
          <p className="text-xs text-muted-foreground">
            {filtered.length} of {problems.length} shown
          </p>
        </div>
        <Button asChild>
          <Link to="/admin/problems/new">
            <Plus className="mr-2 h-4 w-4" /> New Problem
          </Link>
        </Button>
      </div>

      <div className="mb-4 flex flex-wrap items-end gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title…"
            className="pl-9"
          />
        </div>
        <Select value={difficulty} onValueChange={setDifficulty}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Difficulty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All difficulty</SelectItem>
            <SelectItem value="easy">Easy</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="hard">Hard</SelectItem>
          </SelectContent>
        </Select>
        <Select value={topic} onValueChange={setTopic}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Topic" />
          </SelectTrigger>
          <SelectContent className="max-h-[260px]">
            <SelectItem value="all">All topics</SelectItem>
            {allTopics.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={published} onValueChange={setPublished}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>
        {filtersActive && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="mr-1 h-3 w-3" /> Clear
          </Button>
        )}
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead className="hidden md:table-cell">Slug</TableHead>
              <TableHead>Difficulty</TableHead>
              <TableHead className="hidden lg:table-cell">Topics</TableHead>
              <TableHead>Published</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  {problems.length === 0
                    ? "No problems yet. Create one or import from JSON."
                    : "No problems match the current filters."}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((p) => (
                <TableRow key={p.slug}>
                  <TableCell className="font-medium">{p.title}</TableCell>
                  <TableCell className="hidden md:table-cell font-mono text-xs text-muted-foreground">
                    {p.slug}
                  </TableCell>
                  <TableCell>
                    <Badge className={diffColor(p.difficulty)}>{p.difficulty}</Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {(p.topics ?? []).slice(0, 3).map((t) => (
                        <Badge key={t} variant="secondary" className="text-xs">
                          {t}
                        </Badge>
                      ))}
                      {(p.topics?.length ?? 0) > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{(p.topics?.length ?? 0) - 3}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={p.is_published}
                      onCheckedChange={(v) =>
                        toggle.mutate({ slug: p.slug, publish: v })
                      }
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button asChild variant="ghost" size="icon" title="Edit">
                        <Link to={`/admin/problems/${p.slug}/edit`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Duplicate as draft"
                            disabled={duplicate.isPending}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Duplicate "{p.title}"?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Creates an unpublished draft copy with all starter code,
                              tests, and reference solutions. The new slug will be
                              auto-suffixed with <code>-copy</code>.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => duplicate.mutate(p.slug)}>
                              Create draft copy
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" title="Delete">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete "{p.title}"?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This permanently removes the problem and all its starter code,
                              tests, and reference solutions. This cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => del.mutate(p.slug)}
                              className="bg-destructive text-destructive-foreground"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </AdminShell>
  );
};

export default AdminProblemsList;
