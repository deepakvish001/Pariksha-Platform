import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import {
  Search,
  Shuffle,
  CheckCircle2,
  Circle,
  CircleDot,
  Code2,
  Filter,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
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
import {
  CODING_PROBLEMS,
  ALL_TOPICS,
  type Difficulty,
} from "@/data/codingProblemsData";
import { useUserSolvedSlugs } from "@/hooks/useCodingSubmissions";
import { cn } from "@/lib/utils";

const difficultyClass = (d: Difficulty) =>
  d === "Easy"
    ? "text-emerald-500 bg-emerald-500/10 border-emerald-500/20"
    : d === "Medium"
      ? "text-amber-500 bg-amber-500/10 border-amber-500/20"
      : "text-rose-500 bg-rose-500/10 border-rose-500/20";

const CodingProblems = () => {
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState<string>("all");
  const [topic, setTopic] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const { solved, attempted } = useUserSolvedSlugs();

  const filtered = useMemo(() => {
    return CODING_PROBLEMS.filter((p) => {
      if (search && !p.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (difficulty !== "all" && p.difficulty !== difficulty) return false;
      if (topic !== "all" && !p.topics.includes(topic)) return false;
      if (status === "solved" && !solved.has(p.slug)) return false;
      if (status === "attempted" && (!attempted.has(p.slug) || solved.has(p.slug))) return false;
      if (status === "todo" && attempted.has(p.slug)) return false;
      return true;
    });
  }, [search, difficulty, topic, status, solved, attempted]);

  const counts = useMemo(() => {
    const total = CODING_PROBLEMS.length;
    const easy = CODING_PROBLEMS.filter((p) => p.difficulty === "Easy").length;
    const medium = CODING_PROBLEMS.filter((p) => p.difficulty === "Medium").length;
    const hard = CODING_PROBLEMS.filter((p) => p.difficulty === "Hard").length;
    const solvedEasy = CODING_PROBLEMS.filter(
      (p) => p.difficulty === "Easy" && solved.has(p.slug),
    ).length;
    const solvedMedium = CODING_PROBLEMS.filter(
      (p) => p.difficulty === "Medium" && solved.has(p.slug),
    ).length;
    const solvedHard = CODING_PROBLEMS.filter(
      (p) => p.difficulty === "Hard" && solved.has(p.slug),
    ).length;
    return { total, easy, medium, hard, solvedEasy, solvedMedium, solvedHard };
  }, [solved]);

  const pickRandom = () => {
    if (filtered.length === 0) return;
    const random = filtered[Math.floor(Math.random() * filtered.length)];
    window.location.href = `/library/problems/${random.slug}`;
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-7xl">
      <Helmet>
        <title>Coding Problems — Practice with Real-Time Code Execution | Byteskill</title>
        <meta
          name="description"
          content="Solve LeetCode-style coding problems in Python, C++, Java, JavaScript, TypeScript, C, and Go with real code execution and submission tracking."
        />
      </Helmet>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
            <Code2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Coding Problems
            </h1>
            <p className="text-sm text-muted-foreground">
              Solve, run, and submit with real code execution
            </p>
          </div>
        </div>
      </motion.div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Total</p>
          <p className="text-2xl font-bold mt-1">
            {solved.size}<span className="text-base text-muted-foreground">/{counts.total}</span>
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wider text-emerald-500">Easy</p>
          <p className="text-2xl font-bold mt-1">
            {counts.solvedEasy}<span className="text-base text-muted-foreground">/{counts.easy}</span>
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wider text-amber-500">Medium</p>
          <p className="text-2xl font-bold mt-1">
            {counts.solvedMedium}<span className="text-base text-muted-foreground">/{counts.medium}</span>
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wider text-rose-500">Hard</p>
          <p className="text-2xl font-bold mt-1">
            {counts.solvedHard}<span className="text-base text-muted-foreground">/{counts.hard}</span>
          </p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4 mb-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search problems..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={difficulty} onValueChange={setDifficulty}>
            <SelectTrigger className="w-full md:w-[150px]">
              <SelectValue placeholder="Difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Difficulties</SelectItem>
              <SelectItem value="Easy">Easy</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="Hard">Hard</SelectItem>
            </SelectContent>
          </Select>
          <Select value={topic} onValueChange={setTopic}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Topic" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Topics</SelectItem>
              {ALL_TOPICS.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full md:w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="solved">Solved</SelectItem>
              <SelectItem value="attempted">Attempted</SelectItem>
              <SelectItem value="todo">To-do</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={pickRandom} variant="outline" className="gap-2">
            <Shuffle className="h-4 w-4" />
            Random
          </Button>
        </div>
      </Card>

      {/* Problems table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px]">Status</TableHead>
              <TableHead>Title</TableHead>
              <TableHead className="hidden md:table-cell">Topics</TableHead>
              <TableHead className="w-[110px]">Difficulty</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                  <Filter className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  No problems match your filters
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((p) => {
                const isSolved = solved.has(p.slug);
                const isAttempted = attempted.has(p.slug);
                return (
                  <TableRow key={p.slug} className="group">
                    <TableCell>
                      {isSolved ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      ) : isAttempted ? (
                        <CircleDot className="h-4 w-4 text-amber-500" />
                      ) : (
                        <Circle className="h-4 w-4 text-muted-foreground/40" />
                      )}
                    </TableCell>
                    <TableCell>
                      <Link
                        to={`/library/problems/${p.slug}`}
                        className="font-medium hover:text-primary transition-colors"
                      >
                        {p.title}
                      </Link>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {p.topics.slice(0, 3).map((t) => (
                          <Badge key={t} variant="secondary" className="text-xs font-normal">
                            {t}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("font-medium", difficultyClass(p.difficulty))}>
                        {p.difficulty}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default CodingProblems;
