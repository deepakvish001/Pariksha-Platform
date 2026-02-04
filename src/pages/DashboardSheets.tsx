import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FileSpreadsheet, Search, Filter, Star, ExternalLink, BookOpen } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import MobileFAB from "@/components/MobileFAB";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const sheets = [
  {
    id: "strivers-sde-sheet",
    title: "Striver's SDE Sheet",
    description: "Comprehensive DSA problems for SDE interviews",
    category: "DSA",
    problems: 191,
    difficulty: "Medium-Hard",
    starred: true,
  },
  {
    id: "love-babbar-450",
    title: "Love Babbar 450",
    description: "450 curated DSA problems by topic",
    category: "DSA",
    problems: 450,
    difficulty: "Mixed",
    starred: true,
  },
  {
    id: "neetcode-150",
    title: "Neetcode 150",
    description: "Blind 75 extended with additional patterns",
    category: "DSA",
    problems: 150,
    difficulty: "Medium",
    starred: false,
  },
  {
    id: "sql-practice",
    title: "SQL Practice Sheet",
    description: "Essential SQL queries for interviews",
    category: "SQL",
    problems: 75,
    difficulty: "Easy-Medium",
    starred: false,
  },
  {
    id: "system-design",
    title: "System Design Concepts",
    description: "HLD and LLD concepts with examples",
    category: "System Design",
    problems: 25,
    difficulty: "Hard",
    starred: true,
  },
  {
    id: "machine-learning",
    title: "Machine Learning",
    description: "Complete ML roadmap with resources",
    category: "ML",
    problems: 184,
    difficulty: "Mixed",
    starred: true,
  },
];

const DashboardSheets = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const filteredSheets = sheets.filter((sheet) => {
    const matchesSearch = sheet.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sheet.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === "all" || 
      (activeTab === "starred" && sheet.starred) ||
      sheet.category.toLowerCase() === activeTab.toLowerCase();
    return matchesSearch && matchesTab;
  });

  return (
    <div className="min-h-screen bg-background">
          {/* Header */}
          <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-md">
            <div className="flex h-16 items-center gap-4 px-6">
              <SidebarTrigger />
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-orange flex items-center justify-center">
                  <FileSpreadsheet className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">Practice Sheets</h1>
                  <p className="text-sm text-muted-foreground">Curated problem sets for your preparation</p>
                </div>
              </div>
            </div>
          </header>

          {/* Content */}
          <main className="p-6 md:p-8 space-y-6">
            {/* Search and Filter */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search sheets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Filters
              </Button>
            </motion.div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="flex-wrap h-auto gap-2 bg-transparent p-0">
                <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  All Sheets
                </TabsTrigger>
                <TabsTrigger value="starred" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Star className="h-3 w-3 mr-1" />
                  Starred
                </TabsTrigger>
                <TabsTrigger value="dsa" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  DSA
                </TabsTrigger>
                <TabsTrigger value="sql" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  SQL
                </TabsTrigger>
                <TabsTrigger value="system design" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  System Design
                </TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-6">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {filteredSheets.map((sheet, index) => (
                    <motion.div
                      key={sheet.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card 
                        className="hover:shadow-lg transition-all cursor-pointer group h-full"
                        onClick={() => navigate(`/dashboard/sheets/${sheet.id}`)}
                      >
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                              <BookOpen className="h-5 w-5 text-primary" />
                            </div>
                            {sheet.starred && (
                              <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                            )}
                          </div>
                          <CardTitle className="text-lg mt-4">{sheet.title}</CardTitle>
                          <CardDescription>{sheet.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">{sheet.problems} problems</span>
                            <Badge variant="outline">{sheet.difficulty}</Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge>{sheet.category}</Badge>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>

                {filteredSheets.length === 0 && (
                  <div className="text-center py-12">
                    <FileSpreadsheet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No sheets found matching your criteria</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
        </main>

        {/* Mobile FAB */}
        <MobileFAB />
      </div>
    );
  };
  
  export default DashboardSheets;
