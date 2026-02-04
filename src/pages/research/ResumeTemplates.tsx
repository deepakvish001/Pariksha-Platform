import { motion } from "framer-motion";
import { FileCheck, Search, Filter, Download, Eye } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const templates = [
  { name: "Modern Professional", style: "Modern", downloads: 12500, ats: true },
  { name: "Classic Executive", style: "Traditional", downloads: 8900, ats: true },
  { name: "Creative Designer", style: "Creative", downloads: 6700, ats: false },
  { name: "Tech Engineer", style: "Modern", downloads: 15200, ats: true },
  { name: "Minimalist", style: "Minimal", downloads: 9800, ats: true },
  { name: "Two Column", style: "Modern", downloads: 7400, ats: true },
];

const ResumeTemplates = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="flex h-16 items-center gap-4 px-6">
          <SidebarTrigger />
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-orange flex items-center justify-center">
              <FileCheck className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Resume Templates</h1>
              <p className="text-sm text-muted-foreground">Professional resume designs</p>
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
            <Input placeholder="Search templates..." className="pl-10" />
          </div>
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </Button>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template, index) => (
            <motion.div
              key={template.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover:shadow-lg transition-all cursor-pointer group">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    {template.ats && <Badge variant="default">ATS Friendly</Badge>}
                  </div>
                  <CardDescription>{template.style} • {template.downloads.toLocaleString()} downloads</CardDescription>
                </CardHeader>
                <CardContent className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 gap-1">
                    <Eye className="h-4 w-4" />
                    Preview
                  </Button>
                  <Button size="sm" className="flex-1 gap-1">
                    <Download className="h-4 w-4" />
                    Download
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

export default ResumeTemplates;
