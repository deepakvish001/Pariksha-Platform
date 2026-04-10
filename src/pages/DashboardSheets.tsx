import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import MobileFAB from "@/components/MobileFAB";
import SheetsHeroSection from "@/components/sheets/SheetsHeroSection";
import SheetsFilterBar, { SortOption } from "@/components/sheets/SheetsFilterBar";
import SheetCard from "@/components/sheets/SheetCard";
import SheetsEmptyState from "@/components/sheets/SheetsEmptyState";
import ContinueLearningSection from "@/components/sheets/ContinueLearningSection";
import RecentlyCompletedSection from "@/components/sheets/RecentlyCompletedSection";
import QuickStartSection from "@/components/sheets/QuickStartSection";
import CategoryProgressBar from "@/components/sheets/CategoryProgressBar";
import { useSheetProgress, calculateProgressPercentage } from "@/hooks/useSheetProgress";
import { Code, Swords, Database, ServerCog, Network, HardDrive, Cpu, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const sheets = [
  {
    id: "strivers-sde-sheet",
    title: "Striver's SDE Sheet",
    description: "Curated 199 problems by Striver covering all important DSA topics for SDE interviews",
    category: "DSA",
    problems: 199,
    difficulty: "Medium-Hard",
    starred: true,
  },
  {
    id: "strivers-a2z-dsa",
    title: "Striver's A2Z DSA Sheet",
    description: "Complete A2Z DSA course — 445 problems from basics to advanced topics",
    category: "DSA",
    problems: 445,
    difficulty: "Mixed",
    starred: true,
  },
  {
    id: "blind-75",
    title: "Blind 75",
    description: "The essential 75 LeetCode problems for tech interviews",
    category: "DSA",
    problems: 75,
    difficulty: "Medium",
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
    id: "neetcode-250",
    title: "NeetCode 250",
    description: "The complete NeetCode collection — 250 problems across all DSA patterns",
    category: "DSA",
    problems: 250,
    difficulty: "Medium",
    starred: true,
  },
  {
    id: "dsa-level-1",
    title: "Java DSA Level 1",
    description: "Complete Java DSA prep from basics to advanced data structures — 467 topics",
    category: "DSA",
    problems: 467,
    difficulty: "Mixed",
    starred: true,
  },
  {
    id: "dsa-level-2",
    title: "Java DSA Level 2",
    description: "Advanced DSA — Recursion, DP, Graphs, Trees & more — 309 problems",
    category: "DSA",
    problems: 309,
    difficulty: "Medium-Hard",
    starred: true,
  },
  {
    id: "dsa-level-3",
    title: "Java DSA Level 3",
    description: "Expert DSA — Tries, Segment Trees, Advanced DP & Graphs — 226 problems",
    category: "DSA",
    problems: 226,
    difficulty: "Hard",
    starred: true,
  },
  {
    id: "competitive-programming",
    title: "Competitive Programming",
    description: "Master algorithms through structured problem sets from Codeforces, AtCoder & ICPC",
    category: "CP",
    problems: 270,
    difficulty: "Medium-Hard",
    starred: true,
  },
  {
    id: "acm-icpc-training",
    title: "ACM-ICPC CP Training Sheet",
    description: "1243 problems across 7 levels (A→D3) — Codeforces, UVA, SPOJ & more",
    category: "CP",
    problems: 1243,
    difficulty: "Mixed",
    starred: true,
  },
  {
    id: "tle-cp31-sheet",
    title: "TLE CP-31 Sheet",
    description: "372 handpicked Codeforces problems — 31 per rating from 800 to 1900",
    category: "CP",
    problems: 372,
    difficulty: "Mixed",
    starred: true,
  },
  {
    id: "sql-practice",
    title: "LeetCode SQL 50",
    description: "50 essential SQL problems from LeetCode covering Select, Joins, Aggregations, Subqueries & more",
    category: "SQL",
    problems: 50,
    difficulty: "Easy-Medium",
    starred: true,
  },
  {
    id: "adv-sql-practice",
    title: "LeetCode Advanced SQL 50",
    description: "50 advanced SQL problems — Window Functions, Subqueries, CTEs & more",
    category: "SQL",
    problems: 50,
    difficulty: "Medium-Hard",
    starred: true,
  },
  {
    id: "dbms-sheet",
    title: "DBMS Interview Sheet",
    description: "124 essential DBMS interview questions — from basics to scaling",
    category: "DBMS",
    problems: 124,
    difficulty: "Mixed",
    starred: true,
  },
  {
    id: "cn-sheet",
    title: "Computer Networks Sheet",
    description: "115 essential CN interview questions — from basics to security",
    category: "CN",
    problems: 115,
    difficulty: "Mixed",
    starred: true,
  },
  {
    id: "os-sheet",
    title: "Operating Systems Sheet",
    description: "135 essential OS interview questions — from basics to disk scheduling",
    category: "OS",
    problems: 135,
    difficulty: "Mixed",
    starred: true,
  },
  {
    id: "striver-sd-sheet",
    title: "Striver's System Design Sheet",
    description: "97 topics covering HLD, LLD, and system design fundamentals for interviews",
    category: "System Design",
    problems: 97,
    difficulty: "Medium-Hard",
    starred: true,
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
];

const categoryMeta: Record<string, { icon: LucideIcon; label: string; color: string }> = {
  "DSA": { icon: Code, label: "Data Structures & Algorithms", color: "text-blue-500" },
  "CP": { icon: Swords, label: "Competitive Programming", color: "text-orange-500" },
  "SQL": { icon: Database, label: "SQL & Databases", color: "text-emerald-500" },
  "DBMS": { icon: ServerCog, label: "Database Management Systems", color: "text-violet-500" },
  "CN": { icon: Network, label: "Computer Networks", color: "text-cyan-500" },
  "OS": { icon: HardDrive, label: "Operating Systems", color: "text-rose-500" },
  "System Design": { icon: Cpu, label: "System Design", color: "text-purple-500" },
};

const categoryOrder = ["DSA", "CP", "SQL", "DBMS", "CN", "OS", "System Design"];

const difficultyOrder: Record<string, number> = {
  "Easy": 1,
  "Easy-Medium": 2,
  "Medium": 3,
  "Mixed": 4,
  "Medium-Hard": 5,
  "Hard": 6,
};

const DashboardSheets = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [sortBy, setSortBy] = useState<SortOption>("default");
  const { data: progressData, isLoading: isProgressLoading } = useSheetProgress();

  const getSheetProgress = (sheetId: string, totalProblems: number): number => {
    if (!progressData || !progressData[sheetId]) return 0;
    return calculateProgressPercentage(progressData[sheetId].completedCount, totalProblems);
  };

  const getSheetCompletedCount = (sheetId: string): number => {
    if (!progressData || !progressData[sheetId]) return 0;
    return progressData[sheetId].completedCount;
  };

  const getSheetLastActivity = (sheetId: string): string | null => {
    if (!progressData || !progressData[sheetId]) return null;
    return progressData[sheetId].lastActivityAt;
  };

  const getSheetStreak = (sheetId: string): number => {
    if (!progressData || !progressData[sheetId]) return 0;
    return progressData[sheetId].streak;
  };

  // Sheet counts per category
  const sheetCounts = useMemo(() => {
    const counts: Record<string, number> = { all: sheets.length, starred: sheets.filter(s => s.starred).length };
    sheets.forEach(s => {
      const key = s.category.toLowerCase();
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }, []);

  // Filter sheets
  const filteredSheets = useMemo(() => {
    return sheets.filter((sheet) => {
      const matchesSearch = sheet.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sheet.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTab = activeTab === "all" || 
        (activeTab === "starred" && sheet.starred) ||
        sheet.category.toLowerCase() === activeTab.toLowerCase();
      return matchesSearch && matchesTab;
    });
  }, [searchQuery, activeTab]);

  // Sort sheets
  const sortedSheets = useMemo(() => {
    const sheetsWithProgress = filteredSheets.map(sheet => ({
      ...sheet,
      progress: getSheetProgress(sheet.id, sheet.problems),
    }));

    switch (sortBy) {
      case "progress-desc":
        return [...sheetsWithProgress].sort((a, b) => b.progress - a.progress);
      case "progress-asc":
        return [...sheetsWithProgress].sort((a, b) => a.progress - b.progress);
      case "problems-desc":
        return [...sheetsWithProgress].sort((a, b) => b.problems - a.problems);
      case "problems-asc":
        return [...sheetsWithProgress].sort((a, b) => a.problems - b.problems);
      case "difficulty":
        return [...sheetsWithProgress].sort((a, b) => 
          (difficultyOrder[a.difficulty] || 4) - (difficultyOrder[b.difficulty] || 4)
        );
      default:
        return sheetsWithProgress;
    }
  }, [filteredSheets, sortBy, progressData]);

  // Group sheets by category (only when in "all" tab and default sort)
  const groupedSheets = useMemo(() => {
    if (activeTab !== "all" || sortBy !== "default" || searchQuery) {
      return null; // flat mode
    }
    const groups: Record<string, typeof sortedSheets> = {};
    sortedSheets.forEach(sheet => {
      if (!groups[sheet.category]) groups[sheet.category] = [];
      groups[sheet.category].push(sheet);
    });
    return groups;
  }, [sortedSheets, activeTab, sortBy, searchQuery]);

  // In-progress and completed sheets
  const inProgressSheets = useMemo(() => {
    return sheets
      .map(sheet => ({
        id: sheet.id,
        title: sheet.title,
        category: sheet.category,
        problems: sheet.problems,
        progress: getSheetProgress(sheet.id, sheet.problems),
        completedCount: getSheetCompletedCount(sheet.id),
        lastActivityAt: getSheetLastActivity(sheet.id),
      }))
      .filter(sheet => sheet.progress > 0 && sheet.progress < 100)
      .sort((a, b) => {
        if (a.lastActivityAt && b.lastActivityAt) {
          return new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime();
        }
        return b.progress - a.progress;
      });
  }, [progressData]);

  const recentlyCompletedSheets = useMemo(() => {
    return sheets
      .map(sheet => {
        const sheetProgress = progressData?.[sheet.id];
        return {
          id: sheet.id,
          title: sheet.title,
          category: sheet.category,
          problems: sheet.problems,
          progress: getSheetProgress(sheet.id, sheet.problems),
          completedAt: sheetProgress?.completedAt || sheetProgress?.lastActivityAt,
        };
      })
      .filter(sheet => sheet.progress === 100 && sheet.completedAt)
      .sort((a, b) => {
        if (a.completedAt && b.completedAt) {
          return new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime();
        }
        return 0;
      }) as { id: string; title: string; category: string; problems: number; completedAt: string }[];
  }, [progressData]);

  const quickStartSheets = useMemo(() => {
    return [
      { ...sheets.find(s => s.id === "strivers-sde-sheet")!, reason: "popular" as const },
      { ...sheets.find(s => s.id === "neetcode-150")!, reason: "recommended" as const },
      { ...sheets.find(s => s.id === "sql-practice")!, reason: "new" as const },
    ].filter(Boolean);
  }, []);

  const totalProblems = sheets.reduce((acc, sheet) => acc + sheet.problems, 0);
  const totalCompleted = progressData 
    ? Object.values(progressData).reduce((acc, p) => acc + p.completedCount, 0) 
    : 0;

  const renderSheetCard = (sheet: typeof sortedSheets[0], index: number) => (
    <SheetCard
      key={sheet.id}
      sheet={sheet}
      index={index}
      progress={sheet.progress}
      completedCount={getSheetCompletedCount(sheet.id)}
      lastActivityAt={getSheetLastActivity(sheet.id)}
      streak={getSheetStreak(sheet.id)}
      isLoading={isProgressLoading}
    />
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <SheetsHeroSection 
        totalSheets={sheets.length} 
        totalProblems={totalProblems}
        completedProblems={totalCompleted}
      />

      {/* Content */}
      <main className="p-4 md:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
        {/* Continue Learning / Quick Start Row */}
        <div className="space-y-6">
          {recentlyCompletedSheets.length > 0 && (
            <RecentlyCompletedSection sheets={recentlyCompletedSheets} />
          )}
          {inProgressSheets.length > 0 && (
            <ContinueLearningSection sheets={inProgressSheets} />
          )}
          {inProgressSheets.length === 0 && recentlyCompletedSheets.length === 0 && (
            <QuickStartSection sheets={quickStartSheets} />
          )}
        </div>

        {/* Filter Bar */}
        <SheetsFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          sortBy={sortBy}
          onSortChange={setSortBy}
          sheetCounts={sheetCounts}
        />

        {/* Cards Grid */}
        {sortedSheets.length > 0 ? (
          groupedSheets ? (
            // Grouped by category
            <div className="space-y-10">
              {categoryOrder
                .filter(cat => groupedSheets[cat]?.length)
                .map((cat, catIdx) => {
                  const meta = categoryMeta[cat];
                  const Icon = meta?.icon;
                  const catSheets = groupedSheets[cat];
                  const catProblems = catSheets.reduce((acc, s) => acc + s.problems, 0);
                  
                  return (
                    <motion.section
                      key={cat}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: catIdx * 0.08 }}
                    >
                      {/* Category Header */}
                      <div className="flex items-center gap-3 mb-4">
                        {Icon && (
                          <div className={cn(
                            "h-9 w-9 rounded-lg flex items-center justify-center bg-muted/80",
                            meta.color
                          )}>
                            <Icon className="h-4.5 w-4.5" />
                          </div>
                        )}
                        <div className="flex-1">
                          <h2 className="text-lg font-semibold">{meta?.label || cat}</h2>
                          <p className="text-xs text-muted-foreground">
                            {catSheets.length} {catSheets.length === 1 ? "sheet" : "sheets"} · {catProblems.toLocaleString()} problems
                          </p>
                        </div>
                      </div>

                      {/* Category Grid */}
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {catSheets.map((sheet, index) => renderSheetCard(sheet, index))}
                      </div>
                    </motion.section>
                  );
                })}
            </div>
          ) : (
            // Flat grid (filtered/sorted)
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {sortedSheets.map((sheet, index) => renderSheetCard(sheet, index))}
            </div>
          )
        ) : (
          <SheetsEmptyState hasSearchQuery={searchQuery.length > 0} />
        )}
      </main>

      <MobileFAB />
    </div>
  );
};

export default DashboardSheets;
