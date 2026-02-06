import { useState } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import MobileFAB from "@/components/MobileFAB";
import SheetsHeroSection from "@/components/sheets/SheetsHeroSection";
import SheetsFilterBar from "@/components/sheets/SheetsFilterBar";
import SheetCard from "@/components/sheets/SheetCard";
import SheetsEmptyState from "@/components/sheets/SheetsEmptyState";
import { useSheetProgress, calculateProgressPercentage } from "@/hooks/useSheetProgress";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const { data: progressData, isLoading: isProgressLoading } = useSheetProgress();

  const filteredSheets = sheets.filter((sheet) => {
    const matchesSearch = sheet.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sheet.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === "all" || 
      (activeTab === "starred" && sheet.starred) ||
      sheet.category.toLowerCase() === activeTab.toLowerCase();
    return matchesSearch && matchesTab;
  });

  const totalProblems = sheets.reduce((acc, sheet) => acc + sheet.problems, 0);
  
  // Calculate total completed problems across all sheets
  const totalCompleted = progressData 
    ? Object.values(progressData).reduce((acc, p) => acc + p.completedCount, 0) 
    : 0;

  const getSheetProgress = (sheetId: string, totalProblems: number): number => {
    if (!progressData || !progressData[sheetId]) return 0;
    return calculateProgressPercentage(progressData[sheetId].completedCount, totalProblems);
  };

  const getSheetCompletedCount = (sheetId: string): number => {
    if (!progressData || !progressData[sheetId]) return 0;
    return progressData[sheetId].completedCount;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Header */}
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="flex h-14 items-center gap-4 px-4 md:px-6">
          <SidebarTrigger />
          <span className="text-sm font-medium text-muted-foreground">Practice Sheets</span>
        </div>
      </header>

      {/* Hero Section */}
      <SheetsHeroSection 
        totalSheets={sheets.length} 
        totalProblems={totalProblems}
        completedProblems={totalCompleted}
      />

      {/* Content */}
      <main className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        {/* Filter Bar */}
        <SheetsFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {/* Cards Grid */}
        {filteredSheets.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredSheets.map((sheet, index) => (
              <SheetCard
                key={sheet.id}
                sheet={sheet}
                index={index}
                progress={getSheetProgress(sheet.id, sheet.problems)}
                completedCount={getSheetCompletedCount(sheet.id)}
                isLoading={isProgressLoading}
              />
            ))}
          </div>
        ) : (
          <SheetsEmptyState hasSearchQuery={searchQuery.length > 0} />
        )}
      </main>

      {/* Mobile FAB */}
      <MobileFAB />
    </div>
  );
};

export default DashboardSheets;
