import { useState, useMemo } from "react";
import MobileFAB from "@/components/MobileFAB";
import SheetsHeroSection from "@/components/sheets/SheetsHeroSection";
import SheetsFilterBar, { SortOption } from "@/components/sheets/SheetsFilterBar";
import SheetCard from "@/components/sheets/SheetCard";
import SheetsEmptyState from "@/components/sheets/SheetsEmptyState";
import ContinueLearningSection from "@/components/sheets/ContinueLearningSection";
import RecentlyCompletedSection from "@/components/sheets/RecentlyCompletedSection";
import QuickStartSection from "@/components/sheets/QuickStartSection";
import WeeklyProgressChart from "@/components/sheets/WeeklyProgressChart";
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
    id: "strivers-a2z-dsa",
    title: "Striver's A2Z DSA Sheet",
    description: "Complete A2Z DSA course — 445 problems from basics to advanced topics",
    category: "DSA",
    problems: 445,
    difficulty: "Mixed",
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
    id: "competitive-programming",
    title: "Competitive Programming",
    description: "Master algorithms through structured problem sets from Codeforces, AtCoder & ICPC",
    category: "CP",
    problems: 270,
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
    id: "sql-practice",
    title: "SQL Practice Sheet",
    description: "Essential SQL queries for interviews",
    category: "SQL",
    problems: 75,
    difficulty: "Easy-Medium",
    starred: false,
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

  // Sheets with partial progress for "Continue Learning" section
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

  // Recently completed sheets (100% progress)
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

  // Quick start recommendations
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

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Header */}
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="flex h-14 items-center gap-4 px-4 md:px-6">
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
      <main className="p-4 md:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
        {/* Weekly Progress Chart + Continue Learning Row */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <WeeklyProgressChart />
          </div>
          <div className="lg:col-span-2 space-y-6">
            {/* Recently Completed Section */}
            {recentlyCompletedSheets.length > 0 && (
              <RecentlyCompletedSection sheets={recentlyCompletedSheets} />
            )}

            {/* Continue Learning Section */}
            {inProgressSheets.length > 0 && (
              <ContinueLearningSection sheets={inProgressSheets} />
            )}

            {/* Quick Start Section - only show if no progress */}
            {inProgressSheets.length === 0 && recentlyCompletedSheets.length === 0 && (
              <QuickStartSection sheets={quickStartSheets} />
            )}
          </div>
        </div>

        {/* Filter Bar */}
        <SheetsFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          sortBy={sortBy}
          onSortChange={setSortBy}
        />

        {/* Cards Grid */}
        {sortedSheets.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sortedSheets.map((sheet, index) => (
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
