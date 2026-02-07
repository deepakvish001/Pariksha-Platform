import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Search,
  Download,
  Star,
  Eye,
  Filter,
  SortAsc,
  Database,
  Monitor,
  Network,
  Boxes,
  Binary,
  Globe,
  Brain,
  Layers,
  BookOpen,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import {
  notes,
  noteSubjects,
  getNotesBySubject,
  searchNotes,
  sortNotes,
  getSubjectName,
  getTotalDownloads,
  getTotalPages,
  type Note,
} from "@/data/handwrittenNotesData";

const subjectIcons: Record<string, React.ReactNode> = {
  dsa: <Binary className="h-5 w-5" />,
  dbms: <Database className="h-5 w-5" />,
  os: <Monitor className="h-5 w-5" />,
  cn: <Network className="h-5 w-5" />,
  oops: <Boxes className="h-5 w-5" />,
  sd: <Layers className="h-5 w-5" />,
  web: <Globe className="h-5 w-5" />,
  aptitude: <Brain className="h-5 w-5" />,
};

const HandwrittenNotes = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("downloads");
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);

  // Filter and sort notes
  const filteredNotes = useMemo(() => {
    let result = getNotesBySubject(subjectFilter);
    result = searchNotes(result, searchQuery);
    result = sortNotes(result, sortBy);
    return result;
  }, [subjectFilter, searchQuery, sortBy]);

  // Stats
  const totalDownloads = getTotalDownloads();
  const totalPages = getTotalPages();

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-3 w-3 ${
              star <= Math.floor(rating)
                ? "fill-amber-400 text-amber-400"
                : star - 0.5 <= rating
                ? "fill-amber-400/50 text-amber-400"
                : "text-muted-foreground/30"
            }`}
          />
        ))}
        <span className="text-xs text-muted-foreground ml-1">{rating.toFixed(1)}</span>
      </div>
    );
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-md">
          <div className="flex h-16 items-center gap-4 px-4 md:px-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-orange flex items-center justify-center">
                <FileText className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg md:text-xl font-bold">Handwritten Notes</h1>
                <p className="text-xs md:text-sm text-muted-foreground hidden sm:block">
                  Community contributed study materials
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 md:p-6 space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="bg-card/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Total Notes</span>
                    <BookOpen className="h-4 w-4 text-primary" />
                  </div>
                  <div className="text-2xl md:text-3xl font-bold">{notes.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">Study materials</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="bg-card/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Total Pages</span>
                    <FileText className="h-4 w-4 text-emerald-500" />
                  </div>
                  <div className="text-2xl md:text-3xl font-bold">{totalPages.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground mt-1">Pages of content</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card className="bg-card/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Total Downloads</span>
                    <Download className="h-4 w-4 text-blue-500" />
                  </div>
                  <div className="text-2xl md:text-3xl font-bold">{(totalDownloads / 1000).toFixed(1)}K</div>
                  <p className="text-xs text-muted-foreground mt-1">By community</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card className="bg-card/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Subjects</span>
                    <Layers className="h-4 w-4 text-amber-500" />
                  </div>
                  <div className="text-2xl md:text-3xl font-bold">{noteSubjects.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">Categories</p>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Subject Filter Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex gap-2 overflow-x-auto pb-2">
              <Button
                variant={subjectFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setSubjectFilter("all")}
                className="whitespace-nowrap"
              >
                All Subjects
              </Button>
              {noteSubjects.map((subject) => (
                <Button
                  key={subject.id}
                  variant={subjectFilter === subject.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSubjectFilter(subject.id)}
                  className="gap-2 whitespace-nowrap"
                >
                  {subjectIcons[subject.id]}
                  {subject.name}
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {subject.noteCount}
                  </Badge>
                </Button>
              ))}
            </div>
          </motion.div>

          {/* Search and Sort */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search notes by title, description, or tags..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SortAsc className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="downloads">Most Downloads</SelectItem>
                <SelectItem value="rating">Highest Rated</SelectItem>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="pages">Most Pages</SelectItem>
              </SelectContent>
            </Select>
          </motion.div>

          {/* Notes Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredNotes.map((note, index) => (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <Card className="hover:shadow-lg transition-all group h-full flex flex-col">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          {subjectIcons[note.subject] || <FileText className="h-5 w-5" />}
                        </div>
                        <div>
                          <CardTitle className="text-base line-clamp-2">{note.title}</CardTitle>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {note.pages} pages • {note.fileSize}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {note.description}
                    </p>

                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {note.tags.slice(0, 4).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {note.tags.length > 4 && (
                        <Badge variant="outline" className="text-xs">
                          +{note.tags.length - 4}
                        </Badge>
                      )}
                    </div>

                    <div className="mt-auto">
                      <Separator className="mb-3" />
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          {renderStars(note.rating)}
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Download className="h-3 w-3" />
                            {note.downloads.toLocaleString()} downloads
                          </div>
                        </div>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button size="sm" className="gap-2">
                              <Download className="h-4 w-4" />
                              Download
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Download PDF ({note.fileSize})</TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {filteredNotes.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12"
            >
              <FileText className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-medium mb-2">No notes found</h3>
              <p className="text-sm text-muted-foreground">
                Try adjusting your search or filter criteria.
              </p>
            </motion.div>
          )}
        </main>
      </div>
    </TooltipProvider>
  );
};

export default HandwrittenNotes;
