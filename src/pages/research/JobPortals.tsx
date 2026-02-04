import { motion } from "framer-motion";
import { List, Search, ExternalLink } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const portals = [
  { name: "LinkedIn", type: "Professional", jobs: "10M+", region: "Global" },
  { name: "Naukri", type: "Job Board", jobs: "500K+", region: "India" },
  { name: "Indeed", type: "Job Board", jobs: "5M+", region: "Global" },
  { name: "Glassdoor", type: "Reviews + Jobs", jobs: "1M+", region: "Global" },
  { name: "AngelList", type: "Startups", jobs: "100K+", region: "Global" },
  { name: "Instahyre", type: "AI Matching", jobs: "50K+", region: "India" },
];

const JobPortals = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="flex h-16 items-center gap-4 px-6">
          <SidebarTrigger />
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-orange flex items-center justify-center">
              <List className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Job Portals</h1>
              <p className="text-sm text-muted-foreground">Find your next opportunity</p>
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
            <Input placeholder="Search portals..." className="pl-10" />
          </div>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {portals.map((portal, index) => (
            <motion.div
              key={portal.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover:shadow-lg transition-all cursor-pointer group">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{portal.name}</CardTitle>
                    <Badge variant="outline">{portal.region}</Badge>
                  </div>
                  <CardDescription>{portal.type} • {portal.jobs} jobs</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full gap-2">
                    <ExternalLink className="h-4 w-4" />
                    Visit Portal
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default JobPortals;
