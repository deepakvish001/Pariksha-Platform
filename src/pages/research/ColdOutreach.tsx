import { motion } from "framer-motion";
import { Send, Search, Filter, Copy, Star } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const templates = [
  { title: "Referral Request", platform: "LinkedIn", success: "High", saves: 2500 },
  { title: "Coffee Chat Request", platform: "Email", success: "Medium", saves: 1800 },
  { title: "Job Application Follow-up", platform: "Email", success: "High", saves: 3200 },
  { title: "Recruiter Outreach", platform: "LinkedIn", success: "Medium", saves: 2100 },
  { title: "Alumni Connection", platform: "LinkedIn", success: "High", saves: 1500 },
  { title: "Hiring Manager Direct", platform: "Email", success: "Low", saves: 900 },
];

const ColdOutreach = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="flex h-16 items-center gap-4 px-6">
          <SidebarTrigger />
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-orange flex items-center justify-center">
              <Send className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Cold DMs / Emails</h1>
              <p className="text-sm text-muted-foreground">Outreach templates that work</p>
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

        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="linkedin">LinkedIn</TabsTrigger>
            <TabsTrigger value="email">Email</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {templates.map((template, index) => (
                <motion.div
                  key={template.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="hover:shadow-lg transition-all cursor-pointer group">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{template.title}</CardTitle>
                        <Badge variant={template.success === "High" ? "default" : template.success === "Medium" ? "secondary" : "outline"}>
                          {template.success} Success
                        </Badge>
                      </div>
                      <CardDescription>{template.platform}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1 gap-1">
                        <Copy className="h-4 w-4" />
                        Copy
                      </Button>
                      <Button variant="ghost" size="sm" className="gap-1">
                        <Star className="h-4 w-4" />
                        {template.saves.toLocaleString()}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default ColdOutreach;
