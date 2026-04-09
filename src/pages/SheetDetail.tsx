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
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import MobileFAB from "@/components/MobileFAB";
import CPFloatingProgress from "@/components/sheets/CPFloatingProgress";

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
    id: "strivers-sde-sheet",
    title: "Striver's A2Z Sheet - Learn DSA from A to Z",
    description: "This course is made for people who want to learn DSA from A to Z for free in a well-organised and structured manner.",
    lastUpdated: "December 13, 2025",
    totalProblems: 134,
    completed: 0,
    easy: 72,
    medium: 42,
    hard: 20,
    sections: [
      {
        id: "learn-basics",
        title: "Learn the basics",
        subSections: [
          {
            id: "things-to-know",
            title: "Things to Know in C++/Java/Python or any language",
            topics: [
              { id: "1", title: "User Input / Output", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "2", title: "Data Types", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "3", title: "If Else statements", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "4", title: "Switch Statement", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "5", title: "What are arrays, strings?", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "6", title: "For loops", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "7", title: "While loops", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "8", title: "Functions (Pass by Reference and Value)", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "9", title: "Time Complexity [Learn Basics, and then analyse in next Steps]", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
            ],
          },
          {
            id: "logical-thinking",
            title: "Build-up Logical Thinking",
            topics: [
              { id: "10", title: "Pattern Problems", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
            ],
          },
          {
            id: "stl-collections",
            title: "Learn STL/Java-Collections or similar thing in your language",
            topics: [
              { id: "11", title: "C++ STL", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "12", title: "Java Collections", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
            ],
          },
          {
            id: "basic-maths",
            title: "Know Basic Maths",
            topics: [
              { id: "13", title: "Count digits", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "14", title: "Reverse a number", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "15", title: "Check Palindrome", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "16", title: "GCD or HCF", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "17", title: "Armstrong Numbers", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "18", title: "Print all Divisors", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "19", title: "Check for Prime", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
            ],
          },
          {
            id: "basic-recursion",
            title: "Learn Basic Recursion",
            topics: [
              { id: "20", title: "Understand recursion", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "21", title: "Print name N times", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "22", title: "Print 1 to N", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "23", title: "Print N to 1", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "24", title: "Sum of first N numbers", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "25", title: "Factorial of N", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "26", title: "Reverse an array", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "27", title: "Check palindrome string", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "28", title: "Fibonacci Number", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
            ],
          },
          {
            id: "basic-hashing",
            title: "Learn Basic Hashing",
            topics: [
              { id: "29", title: "Hashing Theory", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "30", title: "Counting frequency of elements", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "31", title: "Highest/Lowest frequency element", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
            ],
          },
        ],
      },
      {
        id: "sorting-techniques",
        title: "Learn Important Sorting Techniques",
        subSections: [
          {
            id: "sorting-1",
            title: "Sorting I",
            topics: [
              { id: "32", title: "Selection Sort", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "33", title: "Bubble Sort", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "34", title: "Insertion Sort", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
            ],
          },
          {
            id: "sorting-2",
            title: "Sorting II",
            topics: [
              { id: "35", title: "Merge Sort", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "36", title: "Recursive Bubble Sort", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "37", title: "Recursive Insertion Sort", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "38", title: "Quick Sort", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
            ],
          },
        ],
      },
      {
        id: "arrays",
        title: "Solve Problems on Arrays [Easy -> Medium -> Hard]",
        subSections: [
          {
            id: "arrays-easy",
            title: "Easy",
            topics: [
              { id: "39", title: "Largest Element in Array", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "40", title: "Second Largest Element", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "41", title: "Check if array is sorted", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "42", title: "Remove duplicates from sorted array", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "43", title: "Left rotate array by one", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "44", title: "Left rotate array by D places", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "45", title: "Move zeros to end", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "46", title: "Linear Search", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "47", title: "Union of two sorted arrays", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "48", title: "Missing number in array", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
            ],
          },
          {
            id: "arrays-medium",
            title: "Medium",
            topics: [
              { id: "49", title: "2Sum Problem", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "50", title: "Sort array of 0s 1s and 2s", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "51", title: "Majority Element (>n/2 times)", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "52", title: "Maximum Subarray Sum (Kadane's)", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "53", title: "Stock Buy and Sell", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "54", title: "Rearrange array by sign", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "55", title: "Next Permutation", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "56", title: "Leaders in an array", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "57", title: "Longest Consecutive Sequence", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "58", title: "Set Matrix Zeros", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
            ],
          },
          {
            id: "arrays-hard",
            title: "Hard",
            topics: [
              { id: "59", title: "Pascal's Triangle", completed: false, difficulty: "Hard", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "60", title: "Majority Element (>n/3 times)", completed: false, difficulty: "Hard", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "61", title: "3Sum Problem", completed: false, difficulty: "Hard", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "62", title: "4Sum Problem", completed: false, difficulty: "Hard", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "63", title: "Largest Subarray with 0 Sum", completed: false, difficulty: "Hard", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "64", title: "Count subarrays with XOR K", completed: false, difficulty: "Hard", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "65", title: "Merge Overlapping Intervals", completed: false, difficulty: "Hard", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "66", title: "Merge Sorted Arrays", completed: false, difficulty: "Hard", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "67", title: "Find missing and repeating", completed: false, difficulty: "Hard", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "68", title: "Count Inversions", completed: false, difficulty: "Hard", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
            ],
          },
        ],
      },
      {
        id: "binary-search",
        title: "Binary Search [1D, 2D Arrays, Search Space]",
        subSections: [
          {
            id: "bs-1d",
            title: "BS on 1D Arrays",
            topics: [
              { id: "69", title: "Binary Search to find X", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "70", title: "Lower Bound", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "71", title: "Upper Bound", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "72", title: "Search Insert Position", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "73", title: "Floor/Ceil in Sorted Array", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "74", title: "First and Last Occurrence", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "75", title: "Count occurrences in sorted", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "76", title: "Search in Rotated Sorted Array", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
            ],
          },
        ],
      },
      {
        id: "strings",
        title: "Strings [Basic and Medium]",
        subSections: [
          {
            id: "strings-basic",
            title: "Basic String Problems",
            topics: [
              { id: "77", title: "Remove outermost parentheses", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "78", title: "Reverse words in a string", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "79", title: "Largest odd number in string", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "80", title: "Longest common prefix", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "81", title: "Isomorphic strings", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
            ],
          },
        ],
      },
      {
        id: "linked-list",
        title: "Learn LinkedList [Single LL, Double LL, Medium, Hard Problems]",
        subSections: [
          {
            id: "ll-basics",
            title: "Learn 1D LinkedList",
            topics: [
              { id: "82", title: "Introduction to LinkedList", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "83", title: "Inserting a node in LinkedList", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "84", title: "Deleting a node in LinkedList", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "85", title: "Find length of LinkedList", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "86", title: "Search in a LinkedList", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
            ],
          },
        ],
      },
      {
        id: "recursion",
        title: "Recursion [PatternWise]",
        subSections: [
          {
            id: "recursion-basic",
            title: "Get a strong hold",
            topics: [
              { id: "87", title: "Recursive Implementation of atoi()", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "88", title: "Pow(x, n)", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "89", title: "Count Good Numbers", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "90", title: "Sort a stack using recursion", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "91", title: "Reverse a stack using recursion", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
            ],
          },
        ],
      },
      {
        id: "bit-manipulation",
        title: "Bit Manipulation [Concepts & Problems]",
        subSections: [
          {
            id: "bit-basics",
            title: "Learn Bit Manipulation",
            topics: [
              { id: "92", title: "Introduction to Bit Manipulation", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "93", title: "Check if ith bit is set", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "94", title: "Check if number is odd or even", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "95", title: "Check if power of 2", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "96", title: "Count set bits", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
            ],
          },
        ],
      },
      {
        id: "stacks-queues",
        title: "Stack and Queues [Learning, Pre-In-Post-fix, Monotonic Stack, Implementation]",
        subSections: [
          {
            id: "sq-learning",
            title: "Learning",
            topics: [
              { id: "97", title: "Implement Stack using Arrays", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "98", title: "Implement Queue using Arrays", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "99", title: "Implement Stack using Queue", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "100", title: "Implement Queue using Stack", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
            ],
          },
        ],
      },
      {
        id: "sliding-window",
        title: "Sliding Window & Two Pointer Combined Problems",
        subSections: [
          {
            id: "sw-medium",
            title: "Medium Problems",
            topics: [
              { id: "101", title: "Longest Substring Without Repeating", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "102", title: "Max Consecutive Ones III", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "103", title: "Fruit Into Baskets", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "104", title: "Longest Repeating Character Replacement", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
            ],
          },
        ],
      },
      {
        id: "heaps",
        title: "Heaps [Learning, Medium, Hard Problems]",
        subSections: [
          {
            id: "heaps-learning",
            title: "Learning",
            topics: [
              { id: "105", title: "Introduction to Priority Queues", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "106", title: "Min Heap and Max Heap", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
            ],
          },
        ],
      },
      {
        id: "greedy",
        title: "Greedy Algorithms [Easy, Medium/Hard]",
        subSections: [
          {
            id: "greedy-easy",
            title: "Easy Problems",
            topics: [
              { id: "107", title: "Assign Cookies", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "108", title: "Fractional Knapsack", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "109", title: "Greedy algorithm to find minimum number of coins", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
            ],
          },
        ],
      },
      {
        id: "binary-trees",
        title: "Binary Trees [Traversals, Medium and Hard Problems]",
        subSections: [
          {
            id: "bt-traversals",
            title: "Traversals",
            topics: [
              { id: "110", title: "Introduction to Trees", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "111", title: "Binary Tree Representation", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "112", title: "Preorder Traversal", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "113", title: "Inorder Traversal", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "114", title: "Postorder Traversal", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "115", title: "Level Order Traversal", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
            ],
          },
        ],
      },
      {
        id: "bst",
        title: "Binary Search Trees [Concept and Problems]",
        subSections: [
          {
            id: "bst-concept",
            title: "Concept of BST",
            topics: [
              { id: "116", title: "Introduction to BST", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "117", title: "Search in a BST", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "118", title: "Min/Max in BST", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
            ],
          },
        ],
      },
      {
        id: "graphs",
        title: "Graphs [Concepts & Problems]",
        subSections: [
          {
            id: "graphs-learning",
            title: "Learning",
            topics: [
              { id: "119", title: "Graph Representation", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "120", title: "BFS of Graph", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "121", title: "DFS of Graph", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "122", title: "Number of Provinces", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "123", title: "Connected Components", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "124", title: "Rotten Oranges", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
            ],
          },
        ],
      },
      {
        id: "dp",
        title: "Dynamic Programming [Patterns and Problems]",
        subSections: [
          {
            id: "dp-intro",
            title: "Introduction to DP",
            topics: [
              { id: "125", title: "Dynamic Programming Introduction", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "126", title: "Climbing Stairs", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "127", title: "Frog Jump", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "128", title: "Frog Jump with K distances", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "129", title: "Maximum sum of non-adjacent elements", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "130", title: "House Robber", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
            ],
          },
        ],
      },
      {
        id: "tries",
        title: "Tries",
        subSections: [
          {
            id: "tries-theory",
            title: "Theory",
            topics: [
              { id: "131", title: "Implement Trie (Prefix Tree)", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "132", title: "Implement Trie II", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "133", title: "Longest String with All Prefixes", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "134", title: "Number of Distinct Substrings", completed: false, difficulty: "Hard", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
            ],
          },
        ],
      },
    ],
  },
  "love-babbar-450": {
    id: "love-babbar-450",
    title: "Love Babbar 450 DSA Sheet",
    description: "450 curated DSA problems to crack any coding interview",
    lastUpdated: "January 15, 2026",
    totalProblems: 450,
    completed: 0,
    easy: 150,
    medium: 200,
    hard: 100,
    sections: [
      {
        id: "arrays",
        title: "Arrays",
        subSections: [
          {
            id: "array-problems",
            title: "Array Problems",
            topics: [
              { id: "lb-1", title: "Reverse the array", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "lb-2", title: "Find the maximum and minimum element in an array", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "lb-3", title: "Find the Kth max and min element", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
            ],
          },
        ],
      },
    ],
  },
  "neetcode-150": {
    id: "neetcode-150",
    title: "Neetcode 150",
    description: "Blind 75 extended with additional patterns for comprehensive preparation",
    lastUpdated: "February 1, 2026",
    totalProblems: 150,
    completed: 0,
    easy: 40,
    medium: 80,
    hard: 30,
    sections: [
      {
        id: "arrays-hashing",
        title: "Arrays & Hashing",
        subSections: [
          {
            id: "ah-problems",
            title: "Problems",
            topics: [
              { id: "nc-1", title: "Contains Duplicate", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "nc-2", title: "Valid Anagram", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "nc-3", title: "Two Sum", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
            ],
          },
        ],
      },
    ],
  },
  "sql-practice": {
    id: "sql-practice",
    title: "SQL Practice Sheet",
    description: "Essential SQL queries for acing database interviews",
    lastUpdated: "January 20, 2026",
    totalProblems: 75,
    completed: 0,
    easy: 30,
    medium: 30,
    hard: 15,
    sections: [
      {
        id: "basic-queries",
        title: "Basic Queries",
        subSections: [
          {
            id: "select-queries",
            title: "SELECT Statements",
            topics: [
              { id: "sql-1", title: "Recyclable and Low Fat Products", completed: false, difficulty: "Easy", resourceType: "article", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "sql-2", title: "Find Customer Referee", completed: false, difficulty: "Easy", resourceType: "article", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
            ],
          },
        ],
      },
    ],
  },
  "system-design": {
    id: "system-design",
    title: "System Design Concepts",
    description: "HLD and LLD concepts with real-world examples",
    lastUpdated: "December 20, 2025",
    totalProblems: 25,
    completed: 0,
    easy: 5,
    medium: 12,
    hard: 8,
    sections: [
      {
        id: "hld-basics",
        title: "HLD Basics",
        subSections: [
          {
            id: "scalability",
            title: "Scalability",
            topics: [
              { id: "sd-1", title: "Horizontal vs Vertical Scaling", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "sd-2", title: "Load Balancing", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
            ],
          },
        ],
      },
    ],
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
  "machine-learning": {
    id: "machine-learning",
    title: "Machine Learning Complete Roadmap",
    description: "From fundamentals to advanced ML concepts with hands-on practice",
    lastUpdated: "March 20, 2026",
    totalProblems: 184,
    completed: 0,
    easy: 62,
    medium: 78,
    hard: 44,
    sections: [
      {
        id: "ml-math-foundations",
        title: "Mathematical Foundations",
        subSections: [
          {
            id: "ml-linear-algebra",
            title: "Linear Algebra",
            topics: [
              { id: "ml-1", title: "Vectors and Matrices", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "ml-2", title: "Matrix Operations", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "ml-3", title: "Eigenvalues and Eigenvectors", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "ml-4", title: "Singular Value Decomposition", completed: false, difficulty: "Hard", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "ml-5", title: "Principal Component Analysis", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
            ],
          },
          {
            id: "ml-calculus",
            title: "Calculus for ML",
            topics: [
              { id: "ml-6", title: "Derivatives and Gradients", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "ml-7", title: "Partial Derivatives", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "ml-8", title: "Chain Rule and Backpropagation", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "ml-9", title: "Gradient Descent Optimization", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "ml-10", title: "Convex Optimization", completed: false, difficulty: "Hard", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
            ],
          },
          {
            id: "ml-probability",
            title: "Probability & Statistics",
            topics: [
              { id: "ml-11", title: "Probability Basics", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "ml-12", title: "Bayes' Theorem", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "ml-13", title: "Distributions (Normal, Bernoulli, Poisson)", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "ml-14", title: "Hypothesis Testing", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "ml-15", title: "Maximum Likelihood Estimation", completed: false, difficulty: "Hard", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
            ],
          },
        ],
      },
      {
        id: "ml-supervised",
        title: "Supervised Learning",
        subSections: [
          {
            id: "ml-regression",
            title: "Regression",
            topics: [
              { id: "ml-16", title: "Linear Regression", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "ml-17", title: "Polynomial Regression", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "ml-18", title: "Ridge and Lasso Regression", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "ml-19", title: "Logistic Regression", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "ml-20", title: "Evaluation Metrics (MSE, R², MAE)", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
            ],
          },
          {
            id: "ml-classification",
            title: "Classification",
            topics: [
              { id: "ml-21", title: "K-Nearest Neighbors", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "ml-22", title: "Naive Bayes Classifier", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "ml-23", title: "Support Vector Machines", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "ml-24", title: "Decision Trees", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "ml-25", title: "Random Forest", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "ml-26", title: "Gradient Boosting (XGBoost, LightGBM)", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "ml-27", title: "Confusion Matrix, Precision, Recall, F1", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "ml-28", title: "ROC-AUC Curve", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
            ],
          },
        ],
      },
      {
        id: "ml-unsupervised",
        title: "Unsupervised Learning",
        subSections: [
          {
            id: "ml-clustering",
            title: "Clustering",
            topics: [
              { id: "ml-29", title: "K-Means Clustering", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "ml-30", title: "Hierarchical Clustering", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "ml-31", title: "DBSCAN", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "ml-32", title: "Gaussian Mixture Models", completed: false, difficulty: "Hard", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
            ],
          },
          {
            id: "ml-dimensionality",
            title: "Dimensionality Reduction",
            topics: [
              { id: "ml-33", title: "PCA in Practice", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "ml-34", title: "t-SNE", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "ml-35", title: "UMAP", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
            ],
          },
        ],
      },
      {
        id: "ml-deep-learning",
        title: "Deep Learning",
        subSections: [
          {
            id: "ml-neural-networks",
            title: "Neural Networks Fundamentals",
            topics: [
              { id: "ml-36", title: "Perceptron and Activation Functions", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "ml-37", title: "Feedforward Neural Networks", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "ml-38", title: "Backpropagation Algorithm", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "ml-39", title: "Batch Normalization", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "ml-40", title: "Dropout and Regularization", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "ml-41", title: "Optimizers (Adam, SGD, RMSProp)", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
            ],
          },
          {
            id: "ml-cnn",
            title: "Convolutional Neural Networks",
            topics: [
              { id: "ml-42", title: "Convolution Operation", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "ml-43", title: "Pooling Layers", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "ml-44", title: "CNN Architectures (LeNet, AlexNet, VGG)", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "ml-45", title: "ResNet and Skip Connections", completed: false, difficulty: "Hard", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "ml-46", title: "Transfer Learning", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "ml-47", title: "Object Detection (YOLO, SSD)", completed: false, difficulty: "Hard", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
            ],
          },
          {
            id: "ml-rnn",
            title: "Recurrent Neural Networks",
            topics: [
              { id: "ml-48", title: "RNN Basics", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "ml-49", title: "LSTM Networks", completed: false, difficulty: "Hard", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "ml-50", title: "GRU Networks", completed: false, difficulty: "Hard", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "ml-51", title: "Sequence-to-Sequence Models", completed: false, difficulty: "Hard", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "ml-52", title: "Attention Mechanism", completed: false, difficulty: "Hard", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
            ],
          },
          {
            id: "ml-transformers",
            title: "Transformers & Modern Architectures",
            topics: [
              { id: "ml-53", title: "Self-Attention and Multi-Head Attention", completed: false, difficulty: "Hard", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "ml-54", title: "Transformer Architecture", completed: false, difficulty: "Hard", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "ml-55", title: "BERT and Pre-training", completed: false, difficulty: "Hard", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "ml-56", title: "GPT Models", completed: false, difficulty: "Hard", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "ml-57", title: "Vision Transformers (ViT)", completed: false, difficulty: "Hard", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
            ],
          },
        ],
      },
      {
        id: "ml-practical",
        title: "ML in Practice",
        subSections: [
          {
            id: "ml-data-prep",
            title: "Data Preprocessing",
            topics: [
              { id: "ml-58", title: "Data Cleaning & Missing Values", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "ml-59", title: "Feature Scaling (Normalization, Standardization)", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "ml-60", title: "Feature Engineering", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "ml-61", title: "Handling Imbalanced Data (SMOTE, Oversampling)", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "ml-62", title: "Cross-Validation Techniques", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
            ],
          },
          {
            id: "ml-deployment",
            title: "Model Deployment",
            topics: [
              { id: "ml-63", title: "Model Serialization (Pickle, ONNX)", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "ml-64", title: "Flask/FastAPI for ML APIs", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "ml-65", title: "Docker for ML", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "ml-66", title: "MLOps Basics", completed: false, difficulty: "Hard", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
            ],
          },
        ],
      },
    ],
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
  
  // Render dedicated CP view for competitive programming sheet
  if (currentSheetId === "competitive-programming") {
    const CPProblemSetsView = React.lazy(() => import("@/components/sheets/CPProblemSetsView"));
    return (
      <React.Suspense fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }>
        <CPProblemSetsView />
      </React.Suspense>
    );
  }
  
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

        {/* Expand/Collapse All + Sections */}
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

      {/* Floating Progress Widget */}
      <CPFloatingProgress
        solvedCount={completedCount}
        totalCount={allTopics.length}
        revisionCount={revisionCount}
        streak={currentStreak}
      />

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
