import { motion } from "framer-motion";
import { FolderOpen, Search, Plus, MoreVertical } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const collections = [
  { name: "FAANG Prep", items: 45, lastUpdated: "2 days ago", isPublic: false },
  { name: "DSA Must-Do", items: 120, lastUpdated: "1 week ago", isPublic: true },
  { name: "System Design Notes", items: 28, lastUpdated: "3 days ago", isPublic: false },
  { name: "Interview Questions", items: 85, lastUpdated: "5 days ago", isPublic: true },
  { name: "Resume Resources", items: 15, lastUpdated: "1 day ago", isPublic: false },
  { name: "Company Research", items: 32, lastUpdated: "4 days ago", isPublic: false },
];

const Collections = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="flex h-16 items-center gap-4 px-6">
          <SidebarTrigger />
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-orange flex items-center justify-center">
              <FolderOpen className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Collections</h1>
              <p className="text-sm text-muted-foreground">Organize your learning</p>
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
            <Input placeholder="Search collections..." className="pl-10" />
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Collection
          </Button>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {collections.map((collection, index) => (
            <motion.div
              key={collection.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover:shadow-lg transition-all cursor-pointer group">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{collection.name}</CardTitle>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardDescription>{collection.items} items • Updated {collection.lastUpdated}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Badge variant={collection.isPublic ? "default" : "secondary"}>
                    {collection.isPublic ? "Public" : "Private"}
                  </Badge>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Collections;
