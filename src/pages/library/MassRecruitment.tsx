import { motion } from "framer-motion";
import { Users, Search, Filter, Calendar } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const drives = [
  { company: "TCS", positions: 5000, date: "Mar 2024", status: "Open" },
  { company: "Infosys", positions: 3000, date: "Feb 2024", status: "Open" },
  { company: "Wipro", positions: 2500, date: "Apr 2024", status: "Upcoming" },
  { company: "Cognizant", positions: 2000, date: "Mar 2024", status: "Open" },
  { company: "Accenture", positions: 1800, date: "Feb 2024", status: "Closed" },
  { company: "Capgemini", positions: 1500, date: "Apr 2024", status: "Upcoming" },
];

const MassRecruitment = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="flex h-16 items-center gap-4 px-6">
          <SidebarTrigger />
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-orange flex items-center justify-center">
              <Users className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Mass Recruitment</h1>
              <p className="text-sm text-muted-foreground">Bulk hiring drives and opportunities</p>
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
            <Input placeholder="Search drives..." className="pl-10" />
          </div>
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </Button>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {drives.map((drive, index) => (
            <motion.div
              key={drive.company}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover:shadow-lg transition-all cursor-pointer group">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{drive.company}</CardTitle>
                    <Badge variant={drive.status === "Open" ? "default" : drive.status === "Upcoming" ? "secondary" : "outline"}>
                      {drive.status}
                    </Badge>
                  </div>
                  <CardDescription>{drive.positions.toLocaleString()} positions</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {drive.date}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default MassRecruitment;
