import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { 
  CheckSquare, 
  Square, 
  Youtube, 
  FileText, 
  ExternalLink, 
  PlusCircle, 
  Star,
  ChevronRight,
  ArrowLeft,
  X,
  Save,
  Loader2,
  Search,
  Shuffle,
  ChevronDown,
  Sparkles,
  Flame
} from "lucide-react";
import StreakCounter from "@/components/StreakCounter";
import { useStreak } from "@/hooks/useStreak";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { dsaLevel1Sections, dsaLevel1Meta } from "@/data/dsaLevel1Data";
import { dsaLevel2Sections, dsaLevel2Meta } from "@/data/dsaLevel2Data";
import { dsaLevel3Sections, dsaLevel3Meta } from "@/data/dsaLevel3Data";
import { blind75Sections, blind75Meta } from "@/data/blind75Data";
import { neetcode150Sections, neetcode150Meta } from "@/data/neetcode150Data";
import { neetcode250Sections, neetcode250Meta } from "@/data/neetcode250Data";
import { striversA2ZSections, striversA2ZMeta } from "@/data/striversA2ZData";
import { dbmsSections, dbmsMeta } from "@/data/dbmsData";
import { cnSections, cnMeta } from "@/data/cnData";
import { osSections, osMeta } from "@/data/osData";
import { acmIcpcSections, acmIcpcMeta, acmIcpcFaqs, acmIcpcChecklist } from "@/data/acmIcpcTrainingData";
import { tleCp31Sections, tleCp31Meta } from "@/data/tleCp31Data";
import { striverSDESections, striverSDEMeta } from "@/data/striverSDEData";
import { striverSDSections, striverSDMeta } from "@/data/striverSDData";
import { sqlPracticeSections, sqlPracticeMeta } from "@/data/sqlPracticeData";
import { advSqlSections, advSqlMeta } from "@/data/advSqlData";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import MobileFAB from "@/components/MobileFAB";
import CPFloatingProgress from "@/components/sheets/CPFloatingProgress";
import ACMChecklistCard from "@/components/sheets/ACMChecklistCard";
import ACMPaceCalculator from "@/components/sheets/ACMPaceCalculator";

// Types
interface Topic {
  id: string;
  title: string;
  completed: boolean;
  difficulty: "Easy" | "Medium" | "Hard";
  resourceType: "youtube" | "article" | "link" | null;
  resourceUrl?: string;
  articleUrl?: string;
  practiceUrl?: string;
  note: string;
  isRevision: boolean;
  estTime?: string;
}

interface SubSection {
  id: string;
  title: string;
  topics: Topic[];
}

interface Section {
  id: string;
  title: string;
  subSections: SubSection[];
}

interface SheetData {
  id: string;
  title: string;
  description: string;
  lastUpdated: string;
  totalProblems: number;
  completed: number;
  easy: number;
  medium: number;
  hard: number;
  sections: Section[];
}

// Mock data for sheets
const mockSheetData: Record<string, SheetData> = {
  "strivers-sde-sheet": {
    ...striverSDEMeta,
    sections: striverSDESections,
  },
  "neetcode-150": {
    ...neetcode150Meta,
    sections: neetcode150Sections,
  },
  "neetcode-250": {
    ...neetcode250Meta,
    sections: neetcode250Sections,
  },
  "strivers-a2z-dsa": {
    ...striversA2ZMeta,
    sections: striversA2ZSections,
  },
  "dbms-sheet": {
    ...dbmsMeta,
    sections: dbmsSections,
  },
  "cn-sheet": {
    ...cnMeta,
    sections: cnSections,
  },
  "os-sheet": {
    ...osMeta,
    sections: osSections,
  },
  "acm-icpc-training": {
    ...acmIcpcMeta,
    sections: acmIcpcSections,
  },
  "tle-cp31-sheet": {
    ...tleCp31Meta,
    sections: tleCp31Sections,
  },
  "striver-sd-sheet": {
    ...striverSDMeta,
    sections: striverSDSections,
  },
  "sql-practice": {
    ...sqlPracticeMeta,
    sections: sqlPracticeSections,
  },
  "adv-sql-practice": {
    ...advSqlMeta,
    sections: advSqlSections,
  },
  "competitive-programming": {
    id: "competitive-programming",
    title: "Competitive Programming Sheet",
    description: "Master algorithms through structured problem sets from Codeforces, AtCoder & ICPC",
    lastUpdated: "February 7, 2026",
    totalProblems: 320,
    completed: 0,
    easy: 80,
    medium: 150,
    hard: 90,
    sections: [
      {
        id: "cp-preliminaries",
        title: "Preliminaries",
        subSections: [
          {
            id: "cp-lang-basics",
            title: "Language Basics",
            topics: [
              { id: "cp-1", title: "Fast I/O in C++", completed: false, difficulty: "Easy", resourceType: "article", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-2", title: "Template Setup", completed: false, difficulty: "Easy", resourceType: "article", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-3", title: "Debugging Techniques", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-4", title: "Time Complexity Analysis", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-5", title: "Common Pitfalls & Edge Cases", completed: false, difficulty: "Easy", resourceType: "article", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
            ],
          },
          {
            id: "cp-io-practice",
            title: "Input/Output Practice",
            topics: [
              { id: "cp-6", title: "Multiple Test Cases", completed: false, difficulty: "Easy", resourceType: "link", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-7", title: "Reading Until EOF", completed: false, difficulty: "Easy", resourceType: "link", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-8", title: "String Parsing", completed: false, difficulty: "Easy", resourceType: "link", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
            ],
          },
        ],
      },
      {
        id: "cp-basics",
        title: "Basics",
        subSections: [
          {
            id: "cp-sorting",
            title: "Sorting Algorithms",
            topics: [
              { id: "cp-9", title: "Counting Sort", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-10", title: "Radix Sort", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-11", title: "Custom Comparators", completed: false, difficulty: "Easy", resourceType: "article", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-12", title: "Coordinate Compression", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
            ],
          },
          {
            id: "cp-two-pointers",
            title: "Two Pointers & Sliding Window",
            topics: [
              { id: "cp-13", title: "Two Pointers Technique", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-14", title: "Sliding Window Fixed Size", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-15", title: "Sliding Window Variable Size", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-16", title: "Meet in the Middle", completed: false, difficulty: "Hard", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
            ],
          },
          {
            id: "cp-prefix",
            title: "Prefix Sum & Difference Arrays",
            topics: [
              { id: "cp-17", title: "1D Prefix Sum", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-18", title: "2D Prefix Sum", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-19", title: "Difference Array", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-20", title: "Range Update Queries", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
            ],
          },
          {
            id: "cp-greedy",
            title: "Greedy Algorithms",
            topics: [
              { id: "cp-21", title: "Activity Selection", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-22", title: "Fractional Knapsack", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-23", title: "Job Scheduling", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-24", title: "Huffman Coding", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
            ],
          },
        ],
      },
      {
        id: "cp-intermediate",
        title: "Intermediate",
        subSections: [
          {
            id: "cp-binary-search",
            title: "Binary Search Advanced",
            topics: [
              { id: "cp-25", title: "Binary Search on Answer", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-26", title: "Ternary Search", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-27", title: "Parallel Binary Search", completed: false, difficulty: "Hard", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-28", title: "Fractional Binary Search", completed: false, difficulty: "Hard", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
            ],
          },
          {
            id: "cp-dp-intro",
            title: "Dynamic Programming Introduction",
            topics: [
              { id: "cp-29", title: "DP Fundamentals", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-30", title: "1D DP Problems", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-31", title: "2D DP Problems", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-32", title: "Knapsack Variants", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-33", title: "LIS & LCS", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-34", title: "Digit DP", completed: false, difficulty: "Hard", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
            ],
          },
          {
            id: "cp-graphs-basic",
            title: "Graph Fundamentals",
            topics: [
              { id: "cp-35", title: "Graph Representation", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-36", title: "BFS & DFS", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-37", title: "Cycle Detection", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-38", title: "Bipartite Check", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-39", title: "Topological Sort", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-40", title: "Dijkstra's Algorithm", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
            ],
          },
          {
            id: "cp-number-theory",
            title: "Number Theory",
            topics: [
              { id: "cp-41", title: "Prime Sieve", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-42", title: "Prime Factorization", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-43", title: "GCD & LCM", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-44", title: "Modular Arithmetic", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-45", title: "Modular Inverse", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-46", title: "Fast Exponentiation", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
            ],
          },
        ],
      },
      {
        id: "cp-advanced-ds",
        title: "Advanced Data Structures",
        subSections: [
          {
            id: "cp-segment-tree",
            title: "Segment Tree",
            topics: [
              { id: "cp-47", title: "Basic Segment Tree", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-48", title: "Lazy Propagation", completed: false, difficulty: "Hard", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-49", title: "Segment Tree with Merge", completed: false, difficulty: "Hard", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-50", title: "Persistent Segment Tree", completed: false, difficulty: "Hard", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
            ],
          },
          {
            id: "cp-fenwick",
            title: "Fenwick Tree (BIT)",
            topics: [
              { id: "cp-51", title: "Basic BIT", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-52", title: "Range Update Point Query", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-53", title: "2D BIT", completed: false, difficulty: "Hard", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
            ],
          },
          {
            id: "cp-dsu",
            title: "Disjoint Set Union",
            topics: [
              { id: "cp-54", title: "Basic DSU", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-55", title: "DSU by Rank/Size", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-56", title: "Path Compression", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-57", title: "DSU on Trees", completed: false, difficulty: "Hard", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
            ],
          },
          {
            id: "cp-trie",
            title: "Trie & Suffix Structures",
            topics: [
              { id: "cp-58", title: "Basic Trie", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-59", title: "XOR Trie", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-60", title: "Suffix Array", completed: false, difficulty: "Hard", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
            ],
          },
        ],
      },
      {
        id: "cp-advanced-algo",
        title: "Advanced Algorithms",
        subSections: [
          {
            id: "cp-graphs-adv",
            title: "Advanced Graph Algorithms",
            topics: [
              { id: "cp-61", title: "Bellman-Ford", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-62", title: "Floyd-Warshall", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-63", title: "MST (Kruskal & Prim)", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-64", title: "SCC (Kosaraju/Tarjan)", completed: false, difficulty: "Hard", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-65", title: "Bridges & Articulation Points", completed: false, difficulty: "Hard", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-66", title: "LCA & Binary Lifting", completed: false, difficulty: "Hard", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
            ],
          },
          {
            id: "cp-dp-advanced",
            title: "Advanced DP",
            topics: [
              { id: "cp-67", title: "DP on Trees", completed: false, difficulty: "Hard", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-68", title: "Bitmask DP", completed: false, difficulty: "Hard", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-69", title: "SOS DP", completed: false, difficulty: "Hard", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-70", title: "Divide & Conquer DP", completed: false, difficulty: "Hard", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-71", title: "Convex Hull Trick", completed: false, difficulty: "Hard", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
            ],
          },
          {
            id: "cp-strings",
            title: "String Algorithms",
            topics: [
              { id: "cp-72", title: "KMP Algorithm", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-73", title: "Z Algorithm", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-74", title: "Rabin-Karp Hashing", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-75", title: "Aho-Corasick", completed: false, difficulty: "Hard", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
            ],
          },
        ],
      },
      {
        id: "cp-math",
        title: "Advanced Mathematics",
        subSections: [
          {
            id: "cp-combinatorics",
            title: "Combinatorics",
            topics: [
              { id: "cp-76", title: "nCr & nPr", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-77", title: "Pascal's Triangle", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-78", title: "Catalan Numbers", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-79", title: "Inclusion-Exclusion", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-80", title: "Stars and Bars", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
            ],
          },
          {
            id: "cp-game-theory",
            title: "Game Theory",
            topics: [
              { id: "cp-81", title: "Nim Game", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-82", title: "Sprague-Grundy Theorem", completed: false, difficulty: "Hard", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-83", title: "Minimax Algorithm", completed: false, difficulty: "Hard", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
            ],
          },
          {
            id: "cp-fft",
            title: "FFT & Polynomial",
            topics: [
              { id: "cp-84", title: "FFT Basics", completed: false, difficulty: "Hard", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-85", title: "NTT", completed: false, difficulty: "Hard", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-86", title: "Polynomial Multiplication", completed: false, difficulty: "Hard", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
            ],
          },
        ],
      },
      {
        id: "cp-contests",
        title: "Contest Problem Sets",
        subSections: [
          {
            id: "cp-atcoder",
            title: "AtCoder Beginner Problems",
            topics: [
              { id: "cp-87", title: "ABC 300 - A to D", completed: false, difficulty: "Easy", resourceType: "link", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-88", title: "ABC 310 - A to D", completed: false, difficulty: "Easy", resourceType: "link", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-89", title: "ABC 320 - A to D", completed: false, difficulty: "Medium", resourceType: "link", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-90", title: "ABC E-F Collection", completed: false, difficulty: "Hard", resourceType: "link", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
            ],
          },
          {
            id: "cp-codeforces",
            title: "Codeforces Educational",
            topics: [
              { id: "cp-91", title: "Div 2 A-B Problems", completed: false, difficulty: "Easy", resourceType: "link", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-92", title: "Div 2 C-D Problems", completed: false, difficulty: "Medium", resourceType: "link", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-93", title: "Div 2 E-F Problems", completed: false, difficulty: "Hard", resourceType: "link", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-94", title: "Educational Round Collection", completed: false, difficulty: "Medium", resourceType: "link", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
            ],
          },
          {
            id: "cp-icpc",
            title: "ICPC Problems",
            topics: [
              { id: "cp-95", title: "ICPC Regionals 2023", completed: false, difficulty: "Hard", resourceType: "link", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-96", title: "ICPC World Finals 2022", completed: false, difficulty: "Hard", resourceType: "link", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-97", title: "ICPC World Finals 2023", completed: false, difficulty: "Hard", resourceType: "link", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
            ],
          },
        ],
      },
    ],
  },
  "dsa-level-1": {
    ...dsaLevel1Meta,
    sections: dsaLevel1Sections,
  },
  "dsa-level-2": {
    ...dsaLevel2Meta,
    sections: dsaLevel2Sections,
  },
  "dsa-level-3": {
    ...dsaLevel3Meta,
    sections: dsaLevel3Sections,
  },
  "blind-75": {
    ...blind75Meta,
    sections: blind75Sections,
  },
};

// Difficulty badge component
function DifficultyBadge({ difficulty }: { difficulty: "Easy" | "Medium" | "Hard" }) {
  const colorMap = {
    Easy: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    Medium: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    Hard: "bg-red-500/20 text-red-400 border-red-500/30",
  };
  
  return (
    <span className={cn(
      "text-xs px-2.5 py-1 rounded-full border font-medium",
      colorMap[difficulty]
    )}>
      {difficulty}
    </span>
  );
}

// Animated Progress Bar component
function AnimatedProgress({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn("relative h-1.5 w-full overflow-hidden rounded-full bg-secondary group", className)}>
      <motion.div
        className="h-full bg-primary rounded-full relative"
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {/* Shimmer effect on hover */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-[shimmer_1.5s_ease-in-out_infinite] transition-opacity" />
      </motion.div>
      {value === 100 && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="absolute -right-1 -top-1"
        >
          <Sparkles className="h-3 w-3 text-primary" />
        </motion.div>
      )}
    </div>
  );
}

// Topic row component with hover animations
function TopicRow({ 
  topic, 
  onToggle,
  onOpenNote,
  onToggleRevision
}: { 
  topic: Topic; 
  onToggle: (id: string) => void;
  onOpenNote: (topic: Topic) => void;
  onToggleRevision: (id: string) => void;
}) {
  const getEstTime = (topic: Topic) => {
    if (topic.estTime) return topic.estTime;
    switch (topic.difficulty) {
      case "Easy": return "15 min";
      case "Medium": return "30 min";
      case "Hard": return "45 min";
      default: return "20 min";
    }
  };

  return (
    <motion.tr
      className="border-b transition-colors hover:bg-muted/40 data-[state=selected]:bg-muted group"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ 
        backgroundColor: "hsl(var(--muted) / 0.5)",
        transition: { duration: 0.15 }
      }}
    >
      {/* Status */}
      <TableCell className="w-14">
        <motion.button
          onClick={() => onToggle(topic.id)}
          className="text-muted-foreground hover:text-foreground transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <AnimatePresence mode="wait">
            {topic.completed ? (
              <motion.div
                key="checked"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 180 }}
                transition={{ duration: 0.2 }}
              >
                <CheckSquare className="h-5 w-5 text-primary" />
              </motion.div>
            ) : (
              <motion.div
                key="unchecked"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Square className="h-5 w-5" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </TableCell>
      
      {/* Problem Title */}
      <TableCell className="font-medium">
        <motion.span 
          className={cn(
            "inline-block transition-colors",
            topic.completed && "line-through text-muted-foreground"
          )}
          animate={{ 
            opacity: topic.completed ? 0.6 : 1,
            x: topic.completed ? 5 : 0 
          }}
          transition={{ duration: 0.2 }}
        >
          {topic.title}
        </motion.span>
      </TableCell>
      
      {/* Problem Link */}
      <TableCell className="w-24 text-center">
        {topic.practiceUrl && topic.practiceUrl !== "#" ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.a 
                  href={topic.practiceUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center w-8 h-8 rounded bg-primary/10 hover:bg-primary/20 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <ExternalLink className="h-4 w-4 text-primary" />
                </motion.a>
              </TooltipTrigger>
              <TooltipContent>Solve Problem</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        )}
      </TableCell>
      
      {/* Resource Articles */}
      <TableCell className="w-24 text-center">
        {topic.articleUrl && topic.articleUrl !== "#" ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.a 
                  href={topic.articleUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center w-8 h-8 rounded bg-muted hover:bg-muted/80 transition-colors"
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <FileText className="h-4 w-4 text-foreground" />
                </motion.a>
              </TooltipTrigger>
              <TooltipContent>Read Article</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : topic.resourceType === "article" && topic.resourceUrl && topic.resourceUrl !== "#" ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.a 
                  href={topic.resourceUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center w-8 h-8 rounded bg-muted hover:bg-muted/80 transition-colors"
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <FileText className="h-4 w-4 text-foreground" />
                </motion.a>
              </TooltipTrigger>
              <TooltipContent>Read Article</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        )}
      </TableCell>
      
      {/* Resource Videos */}
      <TableCell className="w-24 text-center">
        {topic.resourceType === "youtube" && topic.resourceUrl && topic.resourceUrl !== "#" ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.a 
                  href={topic.resourceUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center w-8 h-8 rounded bg-destructive/10 hover:bg-destructive/20 transition-colors"
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Youtube className="h-4 w-4 text-destructive" />
                </motion.a>
              </TooltipTrigger>
              <TooltipContent>Watch Video</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        )}
      </TableCell>
      
      {/* Note */}
      <TableCell className="w-14 text-center">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.button 
                onClick={() => onOpenNote(topic)}
                className={cn(
                  "p-1.5 rounded-full transition-colors",
                  topic.note 
                    ? "text-primary bg-primary/10" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
                whileHover={{ scale: 1.15, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
              >
                <PlusCircle className="h-4 w-4" />
              </motion.button>
            </TooltipTrigger>
            <TooltipContent>{topic.note ? "Edit Note" : "Add Note"}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </TableCell>
      
      {/* Revision */}
      <TableCell className="w-20 text-center">
        <motion.button 
          onClick={() => onToggleRevision(topic.id)}
          className={cn(
            "transition-colors",
            topic.isRevision 
              ? "text-yellow-500" 
              : "text-muted-foreground hover:text-yellow-500"
          )}
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.9 }}
          animate={topic.isRevision ? { 
            rotate: [0, -10, 10, -5, 5, 0],
          } : {}}
          transition={{ duration: 0.5 }}
        >
          <Star className={cn("h-5 w-5", topic.isRevision && "fill-current")} />
        </motion.button>
      </TableCell>
      
      {/* Difficulty */}
      <TableCell className="w-24 text-center">
        <motion.div
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.15 }}
        >
          <DifficultyBadge difficulty={topic.difficulty} />
        </motion.div>
      </TableCell>

      {/* Est Time */}
      <TableCell className="w-20 text-center">
        <span className="text-xs text-muted-foreground">{getEstTime(topic)}</span>
      </TableCell>
    </motion.tr>
  );
}

// SubSection component with table
function SubSectionCard({ 
  subSection, 
  onToggleTopic,
  onOpenNote,
  onToggleRevision,
  onSectionComplete,
  expandAllSignal
}: { 
  subSection: SubSection; 
  onToggleTopic: (id: string) => void;
  onOpenNote: (topic: Topic) => void;
  onToggleRevision: (id: string) => void;
  onSectionComplete?: (title: string) => void;
  expandAllSignal?: { expanded: boolean; timestamp: number } | null;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const completed = subSection.topics.filter(t => t.completed).length;
  const total = subSection.topics.length;
  const prevCompletedRef = useRef(completed);
  const isComplete = completed === total && total > 0;

  // React to expand/collapse all signal
  useEffect(() => {
    if (expandAllSignal) {
      setIsOpen(expandAllSignal.expanded);
    }
  }, [expandAllSignal]);

  // Check for section completion
  useEffect(() => {
    if (completed === total && total > 0 && prevCompletedRef.current < total) {
      onSectionComplete?.(subSection.title);
    }
    prevCompletedRef.current = completed;
  }, [completed, total, subSection.title, onSectionComplete]);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="border-b border-border/30 last:border-b-0">
      <CollapsibleTrigger className="flex items-center justify-between w-full py-4 px-4 hover:bg-muted/30 transition-colors group">
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ rotate: isOpen ? 90 : 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </motion.div>
          <span className="font-medium text-sm">{subSection.title}</span>
          {isComplete && (
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <Sparkles className="h-4 w-4 text-primary" />
            </motion.div>
          )}
        </div>
        <div className="flex items-center gap-4">
          <AnimatedProgress value={(completed / total) * 100} className="w-24" />
          <span className={cn(
            "text-sm min-w-[50px] text-right transition-colors",
            isComplete ? "text-primary font-medium" : "text-muted-foreground"
          )}>
            {completed} / {total}
          </span>
        </div>
      </CollapsibleTrigger>
      <AnimatePresence initial={false}>
        {isOpen && (
          <CollapsibleContent forceMount asChild>
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className="overflow-hidden"
            >
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-border/30 hover:bg-transparent">
                      <TableHead className="w-14 text-xs font-medium">Status</TableHead>
                      <TableHead className="text-xs font-medium">Problem</TableHead>
                      <TableHead className="w-24 text-xs font-medium text-center">Problem Link</TableHead>
                      <TableHead className="w-24 text-xs font-medium text-center">Resource Articles</TableHead>
                      <TableHead className="w-24 text-xs font-medium text-center">Resource Videos</TableHead>
                      <TableHead className="w-14 text-xs font-medium text-center">Note</TableHead>
                      <TableHead className="w-20 text-xs font-medium text-center">Revision</TableHead>
                      <TableHead className="w-24 text-xs font-medium text-center">Difficulty</TableHead>
                      <TableHead className="w-20 text-xs font-medium text-center">Est Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subSection.topics.map((topic, index) => (
                      <TopicRow 
                        key={topic.id} 
                        topic={topic} 
                        onToggle={onToggleTopic} 
                        onOpenNote={onOpenNote}
                        onToggleRevision={onToggleRevision}
                      />
                    ))}
                  </TableBody>
                </Table>
              </div>
            </motion.div>
          </CollapsibleContent>
        )}
      </AnimatePresence>
    </Collapsible>
  );
}

// Section component
function SectionCard({ 
  section, 
  onToggleTopic,
  onOpenNote,
  onToggleRevision,
  onSectionComplete,
  expandAllSignal
}: { 
  section: Section; 
  onToggleTopic: (id: string) => void;
  onOpenNote: (topic: Topic) => void;
  onToggleRevision: (id: string) => void;
  onSectionComplete?: (title: string) => void;
  expandAllSignal?: { expanded: boolean; timestamp: number } | null;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const allTopics = section.subSections.flatMap(s => s.topics);
  const completed = allTopics.filter(t => t.completed).length;
  const total = allTopics.length;
  const prevCompletedRef = useRef(completed);
  const isComplete = completed === total && total > 0;

  // React to expand/collapse all signal
  useEffect(() => {
    if (expandAllSignal) {
      setIsOpen(expandAllSignal.expanded);
    }
  }, [expandAllSignal]);

  // Check for section completion
  useEffect(() => {
    if (completed === total && total > 0 && prevCompletedRef.current < total) {
      onSectionComplete?.(section.title);
    }
    prevCompletedRef.current = completed;
  }, [completed, total, section.title, onSectionComplete]);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="border-b border-border/50">
      <CollapsibleTrigger className="flex items-center justify-between w-full py-4 px-4 hover:bg-muted/30 transition-colors group">
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ rotate: isOpen ? 0 : -90 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          </motion.div>
          <span className="font-medium">{section.title}</span>
          {isComplete && (
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10"
            >
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-medium text-primary">Complete!</span>
            </motion.div>
          )}
        </div>
        <div className="flex items-center gap-4">
          <AnimatedProgress value={(completed / total) * 100} className="w-32" />
          <span className={cn(
            "text-sm min-w-[60px] text-right transition-colors",
            isComplete ? "text-primary font-medium" : "text-muted-foreground"
          )}>
            {completed} / {total}
          </span>
        </div>
      </CollapsibleTrigger>
      <AnimatePresence initial={false}>
        {isOpen && (
          <CollapsibleContent forceMount asChild>
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="overflow-hidden"
            >
              <motion.div 
                className="ml-4 border-l border-border/30"
                initial={{ x: -10 }}
                animate={{ x: 0 }}
                transition={{ duration: 0.25, delay: 0.05 }}
              >
                {section.subSections.map((subSection, index) => (
                  <motion.div
                    key={subSection.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.03 }}
                  >
                    <SubSectionCard 
                      subSection={subSection} 
                      onToggleTopic={onToggleTopic}
                      onOpenNote={onOpenNote}
                      onToggleRevision={onToggleRevision}
                      onSectionComplete={onSectionComplete}
                      expandAllSignal={expandAllSignal}
                    />
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </CollapsibleContent>
        )}
      </AnimatePresence>
    </Collapsible>
  );
}

// Wrapper component to handle CP sheet routing
function SheetDetailWrapper() {
  const { sheetId } = useParams<{ sheetId: string }>();
  const currentSheetId = sheetId || "strivers-sde-sheet";
  
  return <SheetDetailContent sheetId={currentSheetId} />;
}

function SheetDetailContent({ sheetId }: { sheetId: string }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { requireAuth, LoginPromptDialog } = useRequireAuth();
  const { currentStreak, todayCompleted, refreshStreak } = useStreak();
  
  const currentSheetId = sheetId;
  const [sheetData, setSheetData] = useState<SheetData | null>(
    mockSheetData[currentSheetId] || mockSheetData["strivers-sde-sheet"]
  );
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [noteText, setNoteText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Filters
  const [activeTab, setActiveTab] = useState<"all" | "revision">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  
  // Expand/Collapse all
  const [expandAllSignal, setExpandAllSignal] = useState<{ expanded: boolean; timestamp: number } | null>(null);
  const [difficultyFilter, setDifficultyFilter] = useState("all");

  // Load user progress from database
  const loadProgress = useCallback(async () => {
    if (!user || !sheetData) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("user_topic_progress")
        .select("*")
        .eq("user_id", user.id)
        .eq("sheet_id", currentSheetId);

      if (error) throw error;

      if (data && data.length > 0) {
        const progressMap = new Map(data.map(p => [p.topic_id, p]));
        
        setSheetData(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            sections: prev.sections.map(section => ({
              ...section,
              subSections: section.subSections.map(subSection => ({
                ...subSection,
                topics: subSection.topics.map(topic => {
                  const saved = progressMap.get(topic.id);
                  if (saved) {
                    return {
                      ...topic,
                      completed: saved.completed,
                      isRevision: saved.is_revision,
                      note: saved.note || "",
                    };
                  }
                  return topic;
                }),
              })),
            })),
          };
        });
      }
    } catch (error) {
      console.error("Failed to load progress:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user, currentSheetId, sheetData]);

  useEffect(() => {
    loadProgress();
  }, [user, currentSheetId]);

  // Save progress to database
  const saveProgress = async (topicId: string, updates: { completed?: boolean; is_revision?: boolean; note?: string }) => {
    if (!user) return;

    setIsSaving(true);
    try {
      const payload = {
        user_id: user.id,
        sheet_id: currentSheetId,
        topic_id: topicId,
        ...updates,
        ...(updates.completed !== undefined
          ? { completed_at: updates.completed ? new Date().toISOString() : null }
          : {}),
      };

      const { error } = await supabase
        .from("user_topic_progress")
        .upsert(payload, {
          onConflict: "user_id,sheet_id,topic_id",
        });

      if (error) throw error;
    } catch (error) {
      console.error("Failed to save progress:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save your progress.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate stats
  const allTopics = useMemo(() => 
    sheetData?.sections.flatMap(s => s.subSections.flatMap(ss => ss.topics)) || [],
    [sheetData]
  );
  
  const completedCount = allTopics.filter(t => t.completed).length;
  const revisionCount = allTopics.filter(t => t.isRevision).length;
  const progressPercent = allTopics.length > 0 ? Math.round((completedCount / allTopics.length) * 100) : 0;
  
  const easyCompleted = allTopics.filter(t => t.difficulty === "Easy" && t.completed).length;
  const mediumCompleted = allTopics.filter(t => t.difficulty === "Medium" && t.completed).length;
  const hardCompleted = allTopics.filter(t => t.difficulty === "Hard" && t.completed).length;
  
  const easyTotal = sheetData?.easy || 0;
  const mediumTotal = sheetData?.medium || 0;
  const hardTotal = sheetData?.hard || 0;

  // Filter sections
  const getFilteredSections = useCallback(() => {
    if (!sheetData) return [];
    
    let sections = sheetData.sections;
    
    // Apply filters
    sections = sections.map(section => ({
      ...section,
      subSections: section.subSections
        .map(subSection => ({
          ...subSection,
          topics: subSection.topics.filter(topic => {
            // Revision filter
            if (activeTab === "revision" && !topic.isRevision) return false;
            
            // Search filter
            if (searchQuery && !topic.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
            
            // Difficulty filter
            if (difficultyFilter !== "all" && topic.difficulty.toLowerCase() !== difficultyFilter) return false;
            
            // Category filter (completed/pending)
            if (categoryFilter === "completed" && !topic.completed) return false;
            if (categoryFilter === "pending" && topic.completed) return false;
            
            return true;
          })
        }))
        .filter(subSection => subSection.topics.length > 0)
    })).filter(section => section.subSections.length > 0);
    
    return sections;
  }, [sheetData, activeTab, searchQuery, difficultyFilter, categoryFilter]);

  const filteredSections = getFilteredSections();

  // Confetti celebration
  const triggerConfetti = useCallback(() => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

    const randomInRange = (min: number, max: number) =>
      Math.random() * (max - min) + min;

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ['#f97316', '#fb923c', '#fdba74', '#fed7aa', '#fff7ed'],
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ['#f97316', '#fb923c', '#fdba74', '#fed7aa', '#fff7ed'],
      });
    }, 250);
  }, []);

  const handleSectionComplete = useCallback((sectionTitle: string) => {
    triggerConfetti();
    toast({
      title: "🎉 Section Complete!",
      description: `Congratulations! You completed "${sectionTitle}"`,
    });
  }, [toast, triggerConfetti]);

  // Random problem
  const handleRandomProblem = () => {
    const uncompletedTopics = allTopics.filter(t => !t.completed);
    if (uncompletedTopics.length === 0) {
      toast({ title: "All problems completed!", description: "Great job!" });
      triggerConfetti();
      return;
    }
    const randomTopic = uncompletedTopics[Math.floor(Math.random() * uncompletedTopics.length)];
    toast({ 
      title: "Random Problem", 
      description: randomTopic.title,
    });
  };

  // Track previous completion for sheet completion detection
  const prevCompletedCountRef = useRef(completedCount);
  const sheetCompletionTriggeredRef = useRef(false);

  // Check for 100% sheet completion
  useEffect(() => {
    const totalTopics = allTopics.length;
    const isNowComplete = completedCount === totalTopics && totalTopics > 0;
    const wasNotComplete = prevCompletedCountRef.current < totalTopics;
    
    if (isNowComplete && wasNotComplete && !sheetCompletionTriggeredRef.current) {
      sheetCompletionTriggeredRef.current = true;
      triggerSheetCompletionCelebration();
    }
    
    // Reset trigger if sheet becomes incomplete again
    if (!isNowComplete) {
      sheetCompletionTriggeredRef.current = false;
    }
    
    prevCompletedCountRef.current = completedCount;
  }, [completedCount, allTopics.length]);

  // Epic celebration for 100% sheet completion
  const triggerSheetCompletionCelebration = useCallback(() => {
    const duration = 5000;
    const animationEnd = Date.now() + duration;
    const colors = ['#f97316', '#fb923c', '#10b981', '#8b5cf6', '#ec4899', '#eab308'];

    // Initial burst from center
    confetti({
      particleCount: 100,
      spread: 100,
      origin: { x: 0.5, y: 0.5 },
      colors,
      startVelocity: 45,
      ticks: 100,
      zIndex: 9999,
    });

    // Continuous side cannons
    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        clearInterval(interval);
        return;
      }

      const particleCount = 30 * (timeLeft / duration);

      // Left cannon
      confetti({
        particleCount: Math.floor(particleCount),
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.65 },
        colors,
        ticks: 80,
        zIndex: 9999,
      });

      // Right cannon
      confetti({
        particleCount: Math.floor(particleCount),
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.65 },
        colors,
        ticks: 80,
        zIndex: 9999,
      });
    }, 200);

    // Show celebratory toast
    toast({
      title: "🏆 Sheet Complete!",
      description: `Amazing! You've completed all ${allTopics.length} topics in ${sheetData?.title}!`,
    });
  }, [toast, allTopics.length, sheetData?.title]);

  const handleToggleTopicInternal = async (topicId: string) => {
    const topic = allTopics.find(t => t.id === topicId);
    const newCompleted = !topic?.completed;

    setSheetData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        sections: prev.sections.map(section => ({
          ...section,
          subSections: section.subSections.map(subSection => ({
            ...subSection,
            topics: subSection.topics.map(t =>
              t.id === topicId ? { ...t, completed: newCompleted } : t
            ),
          })),
        })),
      };
    });

    await saveProgress(topicId, { completed: newCompleted });
    
    if (newCompleted) {
      refreshStreak();
    }
  };

  const handleToggleTopic = (topicId: string) => {
    requireAuth(() => handleToggleTopicInternal(topicId));
  };

  const handleToggleRevisionInternal = async (topicId: string) => {
    const topic = allTopics.find(t => t.id === topicId);
    const newRevision = !topic?.isRevision;

    setSheetData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        sections: prev.sections.map(section => ({
          ...section,
          subSections: section.subSections.map(subSection => ({
            ...subSection,
            topics: subSection.topics.map(t =>
              t.id === topicId ? { ...t, isRevision: newRevision } : t
            ),
          })),
        })),
      };
    });

    await saveProgress(topicId, { is_revision: newRevision });
  };

  const handleToggleRevision = (topicId: string) => {
    requireAuth(() => handleToggleRevisionInternal(topicId));
  };

  const handleOpenNote = (topic: Topic) => {
    requireAuth(() => {
      setEditingTopic(topic);
      setNoteText(topic.note);
      setNoteModalOpen(true);
    });
  };

  const handleSaveNote = async () => {
    if (!editingTopic) return;
    
    setSheetData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        sections: prev.sections.map(section => ({
          ...section,
          subSections: section.subSections.map(subSection => ({
            ...subSection,
            topics: subSection.topics.map(topic =>
              topic.id === editingTopic.id ? { ...topic, note: noteText } : topic
            ),
          })),
        })),
      };
    });

    await saveProgress(editingTopic.id, { note: noteText });
    
    setNoteModalOpen(false);
    setEditingTopic(null);
    setNoteText("");
    
    toast({
      title: "Note saved",
      description: "Your note has been saved successfully.",
    });
  };

  if (!sheetData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Sheet not found</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="flex h-16 items-center gap-4 px-4 sm:px-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/learn/sheets")}
            aria-label="Back to sheets"
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-xl font-bold truncate">{sheetData.title}</h1>
          </div>
          
          {/* Streak Counter */}
          <StreakCounter variant="mini" />
          
          <Badge variant="outline" className="hidden sm:flex text-xs whitespace-nowrap">
            Last updated : {sheetData.lastUpdated}
          </Badge>
          {isSaving && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>
      </header>

      <main className="p-4 sm:p-6 lg:p-8 space-y-6 w-full">
        {/* Description */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-muted-foreground text-sm sm:text-base">
            {sheetData.description}{" "}
            <a href="#" className="text-primary hover:underline">Know more</a>
          </p>
        </motion.div>

        {/* Filters Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between"
        >
          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "all" | "revision")}>
            <TabsList className="bg-muted/50">
              <TabsTrigger value="all" className="data-[state=active]:bg-foreground data-[state=active]:text-background">
                All Problems
              </TabsTrigger>
              <TabsTrigger value="revision" className="data-[state=active]:bg-foreground data-[state=active]:text-background">
                Revision
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Search and Filters */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial sm:w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[130px] h-9">
                <SelectValue placeholder="All problems" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All problems</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>

            <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
              <SelectTrigger className="w-[110px] h-9">
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              className="gap-2 h-9"
              onClick={handleRandomProblem}
              aria-label="Random Problem"
            >
              <Shuffle className="h-4 w-4" />
              <span className="hidden sm:inline">Random Problem</span>
            </Button>
          </div>
        </motion.div>

        {/* Progress Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-full border-4 border-muted flex items-center justify-center">
                    <span className="text-lg font-bold">{progressPercent}%</span>
                  </div>
                  <div>
                    <p className="font-medium">Overall Progress</p>
                    <p className="text-sm text-muted-foreground">
                      {completedCount}/{sheetData.totalProblems}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-6 sm:gap-8">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    <span className="text-sm">Easy</span>
                    <span className="text-sm text-muted-foreground">{easyCompleted}/{easyTotal}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                    <span className="text-sm">Medium</span>
                    <span className="text-sm text-muted-foreground">{mediumCompleted}/{mediumTotal}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
                    <span className="text-sm">Hard</span>
                    <span className="text-sm text-muted-foreground">{hardCompleted}/{hardTotal}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ACM-ICPC Time Estimation Breakdown */}
        {currentSheetId === "acm-icpc-training" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <Card className="bg-card/50 border-border/50 overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-primary/40 via-amber-500/40 to-red-500/40" />
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-primary/20 to-amber-500/20 flex items-center justify-center">
                    <Flame className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Estimated Time Breakdown</p>
                    <p className="text-xs text-muted-foreground">~700–900 hours total · Practical limit ~1300 hours</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {[
                    { level: "≤ 2.5", count: 215, avg: 20, color: "from-emerald-500/15 to-emerald-500/5 border-emerald-500/20", text: "text-emerald-600 dark:text-emerald-400" },
                    { level: "≤ 3.5", count: 93, avg: 30, color: "from-green-500/15 to-green-500/5 border-green-500/20", text: "text-green-600 dark:text-green-400" },
                    { level: "≤ 4.5", count: 270, avg: 40, color: "from-amber-500/15 to-amber-500/5 border-amber-500/20", text: "text-amber-600 dark:text-amber-400" },
                    { level: "≤ 5.25", count: 178, avg: 60, color: "from-orange-500/15 to-orange-500/5 border-orange-500/20", text: "text-orange-600 dark:text-orange-400" },
                    { level: "≤ 5.75", count: 127, avg: 75, color: "from-red-500/15 to-red-500/5 border-red-500/20", text: "text-red-600 dark:text-red-400" },
                    { level: "> 5.75", count: 53, avg: 90, color: "from-rose-500/15 to-rose-500/5 border-rose-500/20", text: "text-rose-600 dark:text-rose-400" },
                  ].map((tier) => (
                    <div
                      key={tier.level}
                      className={cn(
                        "rounded-lg border p-3 bg-gradient-to-b text-center",
                        tier.color
                      )}
                    >
                      <p className={cn("text-lg font-bold", tier.text)}>{tier.count}</p>
                      <p className="text-xs text-muted-foreground">problems</p>
                      <p className="text-[11px] font-medium mt-1.5">Level {tier.level}</p>
                      <p className="text-[11px] text-muted-foreground">~{tier.avg} min each</p>
                      <p className={cn("text-xs font-semibold mt-1", tier.text)}>
                        {Math.round((tier.count * tier.avg) / 60)}h
                      </p>
                    </div>
                  ))}
                </div>

                {/* Dynamic Time Remaining */}
                {(() => {
                  const easyRemaining = easyTotal - easyCompleted;
                  const medRemaining = mediumTotal - mediumCompleted;
                  const hardRemaining = hardTotal - hardCompleted;
                  // Weighted avg: easy~25min, medium~45min, hard~75min
                  const totalMinRemaining = easyRemaining * 25 + medRemaining * 45 + hardRemaining * 75;
                  const totalHoursRemaining = Math.round(totalMinRemaining / 60);
                  const totalMinAll = easyTotal * 25 + mediumTotal * 45 + hardTotal * 75;
                  const timeProgress = totalMinAll > 0 ? Math.round(((totalMinAll - totalMinRemaining) / totalMinAll) * 100) : 0;
                  const problemsRemaining = (easyTotal + mediumTotal + hardTotal) - completedCount;

                  return (
                    <div className="mt-4 rounded-lg border border-border/50 bg-muted/30 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium">Time Remaining Estimate</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{timeProgress}% time completed</span>
                      </div>
                      <Progress value={timeProgress} className="h-2" />
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                        <div>
                          <p className="text-xl font-bold text-primary">{totalHoursRemaining}h</p>
                          <p className="text-[11px] text-muted-foreground">Est. remaining</p>
                        </div>
                        <div>
                          <p className="text-xl font-bold text-foreground">{problemsRemaining}</p>
                          <p className="text-[11px] text-muted-foreground">Problems left</p>
                        </div>
                        <div>
                          <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{easyRemaining}</p>
                          <p className="text-[11px] text-muted-foreground">Easy left (~{Math.round(easyRemaining * 25 / 60)}h)</p>
                        </div>
                        <div>
                          <p className="text-xl font-bold text-red-600 dark:text-red-400">{hardRemaining}</p>
                          <p className="text-[11px] text-muted-foreground">Hard left (~{Math.round(hardRemaining * 75 / 60)}h)</p>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ACM-ICPC Pace Calculator */}
        {currentSheetId === "acm-icpc-training" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28 }}
          >
            <ACMPaceCalculator
              sheetId={currentSheetId}
              totalProblems={sheetData.totalProblems}
              completedCount={completedCount}
            />
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-end mb-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExpandAllSignal(prev => ({
                expanded: !prev?.expanded,
                timestamp: Date.now()
              }))}
              className="gap-2 text-xs"
            >
              <ChevronDown className={cn(
                "h-3.5 w-3.5 transition-transform",
                expandAllSignal?.expanded && "rotate-180"
              )} />
              {expandAllSignal?.expanded ? "Collapse All" : "Expand All"}
            </Button>
          </div>
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              {filteredSections.length > 0 ? (
                filteredSections.map((section) => (
                  <SectionCard 
                    key={section.id} 
                    section={section} 
                    onToggleTopic={handleToggleTopic} 
                    onOpenNote={handleOpenNote}
                    onToggleRevision={handleToggleRevision}
                    onSectionComplete={handleSectionComplete}
                    expandAllSignal={expandAllSignal}
                  />
                ))
              ) : (
                <div className="p-12 text-center">
                  <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {activeTab === "revision" 
                      ? "No topics marked for revision yet. Click the star icon on any topic to add it here."
                      : searchQuery 
                        ? "No topics found matching your search."
                        : "No topics found."}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </main>

      {/* ACM-ICPC FAQ & Checklist */}
      {currentSheetId === "acm-icpc-training" && (
        <main className="max-w-6xl mx-auto px-4 sm:px-6 pb-8 space-y-6">
          <ACMChecklistCard checklist={acmIcpcChecklist} />
          <div className="rounded-lg border border-border/40 bg-card/40 p-6">
            <h3 className="text-lg font-semibold mb-4">ACM-ICPC Training FAQ</h3>
            <Accordion type="single" collapsible className="w-full">
              {acmIcpcFaqs.map((faq, i) => (
                <AccordionItem key={i} value={`item-${i}`}>
                  <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                  <AccordionContent>{faq.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </main>
      )}


      {/* Mobile FAB */}
      <MobileFAB />

      {/* Notes Modal */}
      <Dialog open={noteModalOpen} onOpenChange={setNoteModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PlusCircle className="h-5 w-5" />
              Notes for: {editingTopic?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Add your personal notes here..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              className="min-h-[200px] resize-none"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setNoteModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveNote} className="gap-2" disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {LoginPromptDialog}
    </div>
  );
}

export default SheetDetailWrapper;
