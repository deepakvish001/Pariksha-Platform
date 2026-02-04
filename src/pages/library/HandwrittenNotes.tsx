import { motion } from "framer-motion";
import { FileText, Search, Filter, Download } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const notes = [
  { title: "DSA Complete Notes", pages: 120, author: "Community", downloads: 5200 },
  { title: "DBMS Handwritten", pages: 85, author: "Community", downloads: 3800 },
  { title: "OS Concepts", pages: 95, author: "Community", downloads: 4100 },
  { title: "CN Short Notes", pages: 60, author: "Community", downloads: 2900 },
  { title: "OOPs in Java", pages: 45, author: "Community", downloads: 3200 },
  { title: "System Design", pages: 70, author: "Community", downloads: 4500 },
];

const HandwrittenNotes = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="flex h-16 items-center gap-4 px-6">
          <SidebarTrigger />
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-orange flex items-center justify-center">
              <FileText className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Handwritten Notes</h1>
              <p className="text-sm text-muted-foreground">Community contributed notes</p>
            </div>
          </div>
        </div>
      </header>

      <main className="p-6 md:p-8 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search notes..." className="pl-10" />
          </div>
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </Button>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {notes.map((note, index) => (
            <motion.div
              key={note.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover:shadow-lg transition-all cursor-pointer group">
                <CardHeader>
                  <CardTitle className="text-lg">{note.title}</CardTitle>
                  <CardDescription>{note.pages} pages • By {note.author}</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <Badge variant="outline" className="gap-1">
                    <Download className="h-3 w-3" />
                    {note.downloads.toLocaleString()}
                  </Badge>
                  <Button size="sm" variant="ghost">Download</Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default HandwrittenNotes;
