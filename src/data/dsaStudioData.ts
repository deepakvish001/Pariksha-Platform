// AUTO-GENERATED from dsaanimator.com — do not edit by hand.
import {
  Box, Type, Grid3x3, Layers, Activity, Search as SearchIcon, Link2, Lightbulb,
  CalendarRange, Shuffle, GitBranch, Flame, Network, Cpu, Zap, KeyRound, Hammer,
} from "lucide-react";

export type Diff = "Easy" | "Medium" | "Hard";
export type Priority = "P1" | "P2" | "P3";

export interface DsaProblem {
  id: string;
  title: string;
  tag: string;
  difficulty: Diff;
  priority: Priority;
  free?: boolean;
  slug: string;
  lcSlug?: string;
}

export interface DsaTopic {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  count: number;
  subtitle: string;
  groups: { name: string; problems: DsaProblem[] }[];
}

export const DSA_TOPICS: DsaTopic[] = [
  {
    id: "arrays",
    label: "Arrays",
    icon: Box,
    count: 18,
    subtitle: "Basics · Two Pointers · Subarray · Hashing · Rotation · Sorting · Sliding Window",
    groups: [
      {
        name: "Basics",
        problems: [
          { id: "1929", title: "Concatenation of Array", tag: "basics", difficulty: "Easy", priority: "P3", free: true, slug: "concatenation-of-an-array", lcSlug: "concatenation-of-an-array" },
          { id: "1480", title: "Running Sum of 1D Array", tag: "prefix sum", difficulty: "Easy", priority: "P3", free: true, slug: "running-sum-of-1d-array", lcSlug: "running-sum-of-1d-array" },
          { id: "1672", title: "Richest Customer Wealth", tag: "2D array", difficulty: "Easy", priority: "P3", free: true, slug: "richest-customer-wealth", lcSlug: "richest-customer-wealth" },
          { id: "1470", title: "Shuffle the Array", tag: "basics", difficulty: "Easy", priority: "P3", free: true, slug: "shuffle-the-array", lcSlug: "shuffle-the-array" },
          { id: "832", title: "Flipping an Image", tag: "basics", difficulty: "Easy", priority: "P3", free: true, slug: "flipping-an-image", lcSlug: "flipping-an-image" },
          { id: "2239", title: "Find Closest Number to Zero", tag: "basics", difficulty: "Easy", priority: "P3", free: true, slug: "find-closest-number-to-zero", lcSlug: "find-closest-number-to-zero" },
        ],
      },
      {
        name: "Two Pointers",
        problems: [
          { id: "88", title: "Merge Sorted Array", tag: "two pointers", difficulty: "Easy", priority: "P2", free: true, slug: "merge-sorted-array", lcSlug: "merge-sorted-array" },
          { id: "26", title: "Remove Duplicates", tag: "two pointers", difficulty: "Easy", priority: "P2", free: true, slug: "remove-duplicates-from-sorted-array", lcSlug: "remove-duplicates-from-sorted-array" },
          { id: "977", title: "Squares of Sorted Array", tag: "two pointers", difficulty: "Easy", priority: "P2", free: true, slug: "squares-of-a-sorted-array", lcSlug: "squares-of-a-sorted-array" },
          { id: "15", title: "Three Sum", tag: "sort + two pointers", difficulty: "Medium", priority: "P1", free: true, slug: "3sum", lcSlug: "3sum" },
          { id: "42", title: "Trapping Rain Water", tag: "two pointers", difficulty: "Hard", priority: "P1", free: true, slug: "trapping-rain-water", lcSlug: "trapping-rain-water" },
          { id: "167", title: "Two Sum II", tag: "two pointers", difficulty: "Medium", priority: "P2", free: true, slug: "two-sum-ii-input-array-is-sorted", lcSlug: "two-sum-ii-input-array-is-sorted" },
          { id: "11", title: "Container With Most Water", tag: "two pointers", difficulty: "Medium", priority: "P1", free: true, slug: "container-with-most-water", lcSlug: "container-with-most-water" },
        ],
      },
      {
        name: "Subarray · Sliding Window",
        problems: [
          { id: "53", title: "Maximum Subarray", tag: "Kadane's algorithm", difficulty: "Medium", priority: "P1", free: true, slug: "maximum-subarray", lcSlug: "maximum-subarray" },
          { id: "121", title: "Best Time to Buy and Sell Stock", tag: "greedy / Kadane", difficulty: "Easy", priority: "P1", free: true, slug: "best-time-to-buy-and-sell-stock", lcSlug: "best-time-to-buy-and-sell-stock" },
          { id: "643", title: "Max Average Subarray I", tag: "fixed sliding window", difficulty: "Easy", priority: "P2", free: true, slug: "maximum-average-subarray-i", lcSlug: "maximum-average-subarray-i" },
          { id: "1004", title: "Max Consecutive Ones III", tag: "variable sliding window", difficulty: "Medium", priority: "P2", free: true, slug: "max-consecutive-ones-iii", lcSlug: "max-consecutive-ones-iii" },
          { id: "209", title: "Minimum Size Subarray Sum", tag: "variable sliding window", difficulty: "Medium", priority: "P2", free: true, slug: "minimum-size-subarray-sum", lcSlug: "minimum-size-subarray-sum" },
        ],
      },
      {
        name: "Hashing",
        problems: [
          { id: "1", title: "Two Sum", tag: "HashMap", difficulty: "Easy", priority: "P1", free: true, slug: "two-sum", lcSlug: "two-sum" },
          { id: "217", title: "Contains Duplicate", tag: "HashSet", difficulty: "Easy", priority: "P1", free: true, slug: "contains-duplicate", lcSlug: "contains-duplicate" },
          { id: "41", title: "First Missing Positive", tag: "index marking", difficulty: "Hard", priority: "P2", free: true, slug: "first-missing-positive", lcSlug: "first-missing-positive" },
          { id: "238", title: "Product of Array Except Self", tag: "prefix product", difficulty: "Medium", priority: "P1", free: true, slug: "product-of-array-except-self", lcSlug: "product-of-array-except-self" },
          { id: "383", title: "Ransom Note", tag: "frequency map", difficulty: "Easy", priority: "P2", free: true, slug: "ransom-note", lcSlug: "ransom-note" },
          { id: "560", title: "Subarray Sum Equals K", tag: "prefix sum + HashMap", difficulty: "Medium", priority: "P1", free: true, slug: "subarray-sum-equals-k", lcSlug: "subarray-sum-equals-k" },
          { id: "169", title: "Majority Element", tag: "Boyer-Moore voting", difficulty: "Easy", priority: "P2", free: true, slug: "majority-element", lcSlug: "majority-element" },
          { id: "128", title: "Longest Consecutive Sequence", tag: "HashSet", difficulty: "Medium", priority: "P1", free: true, slug: "longest-consecutive-sequence", lcSlug: "longest-consecutive-sequence" },
        ],
      },
      {
        name: "Rotation · Sorting",
        problems: [
          { id: "189", title: "Rotate Array", tag: "triple reverse", difficulty: "Medium", priority: "P2", free: true, slug: "rotate-array", lcSlug: "rotate-array" },
          { id: "75", title: "Sort Colors", tag: "Dutch National Flag", difficulty: "Medium", priority: "P2", free: true, slug: "sort-colors", lcSlug: "sort-colors" },
        ],
      },
    ],
  },
  {
    id: "strings",
    label: "Strings",
    icon: Type,
    count: 17,
    subtitle: "General · Sliding Window · Anagram · Palindrome",
    groups: [
      {
        name: "General",
        problems: [
          { id: "13", title: "Roman to Integer", tag: "string parsing", difficulty: "Easy", priority: "P2", free: true, slug: "roman-to-integer", lcSlug: "roman-to-integer" },
          { id: "14", title: "Longest Common Prefix", tag: "string", difficulty: "Easy", priority: "P2", free: true, slug: "longest-common-prefix", lcSlug: "longest-common-prefix" },
          { id: "271", title: "Encode and Decode Strings", tag: "delimiter encoding", difficulty: "Medium", priority: "P2", free: true, slug: "encode-and-decode-strings", lcSlug: "encode-and-decode-strings" },
          { id: "205", title: "Isomorphic Strings", tag: "bijection map", difficulty: "Easy", priority: "P2", free: true, slug: "isomorphic-strings", lcSlug: "isomorphic-strings" },
          { id: "344", title: "Reverse String", tag: "two pointers", difficulty: "Easy", priority: "P3", free: true, slug: "reverse-string", lcSlug: "reverse-string" },
        ],
      },
      {
        name: "Sliding Window on Strings",
        problems: [
          { id: "3", title: "Longest Substring Without Repeating", tag: "sliding window + set", difficulty: "Medium", priority: "P1", free: true, slug: "longest-substring-without-repeating-characters", lcSlug: "longest-substring-without-repeating-characters" },
          { id: "424", title: "Longest Repeating Char Replacement", tag: "sliding window", difficulty: "Medium", priority: "P1", free: true, slug: "longest-repeating-character-replacement", lcSlug: "longest-repeating-character-replacement" },
          { id: "76", title: "Minimum Window Substring", tag: "sliding window + map", difficulty: "Hard", priority: "P1", free: true, slug: "minimum-window-substring", lcSlug: "minimum-window-substring" },
          { id: "567", title: "Permutation in String", tag: "fixed window + matches", difficulty: "Medium", priority: "P1", free: true, slug: "permutation-in-string", lcSlug: "permutation-in-string" },
          { id: "438", title: "Find All Anagrams in String", tag: "fixed window + matches", difficulty: "Medium", priority: "P2", free: true, slug: "find-all-anagrams-in-a-string", lcSlug: "find-all-anagrams-in-a-string" },
        ],
      },
      {
        name: "Anagram",
        problems: [
          { id: "242", title: "Valid Anagram", tag: "frequency count", difficulty: "Easy", priority: "P1", free: true, slug: "valid-anagram", lcSlug: "valid-anagram" },
          { id: "49", title: "Group Anagrams", tag: "sorted key / count key", difficulty: "Medium", priority: "P1", free: true, slug: "group-anagrams", lcSlug: "group-anagrams" },
          { id: "1189", title: "Maximum Number of Balloons", tag: "frequency map", difficulty: "Easy", priority: "P3", free: true, slug: "maximum-number-of-balloons", lcSlug: "maximum-number-of-balloons" },
        ],
      },
      {
        name: "Palindrome",
        problems: [
          { id: "125", title: "Valid Palindrome", tag: "two pointers", difficulty: "Easy", priority: "P1", free: true, slug: "valid-palindrome", lcSlug: "valid-palindrome" },
          { id: "680", title: "Valid Palindrome II", tag: "greedy skip", difficulty: "Medium", priority: "P2", free: true, slug: "valid-palindrome-ii", lcSlug: "valid-palindrome-ii" },
          { id: "5", title: "Longest Palindromic Substring", tag: "expand around center", difficulty: "Medium", priority: "P1", free: true, slug: "longest-palindromic-substring", lcSlug: "longest-palindromic-substring" },
          { id: "647", title: "Palindromic Substrings", tag: "expand around center", difficulty: "Medium", priority: "P2", free: true, slug: "palindromic-substrings", lcSlug: "palindromic-substrings" },
        ],
      },
    ],
  },
  {
    id: "matrix",
    label: "Matrix",
    icon: Grid3x3,
    count: 9,
    subtitle: "2D Grid traversal, simulation, DFS/BFS on grid",
    groups: [
      {
        name: "",
        problems: [
          { id: "54", title: "Spiral Matrix", tag: "simulation", difficulty: "Medium", priority: "P2", free: true, slug: "spiral-matrix", lcSlug: "spiral-matrix" },
          { id: "59", title: "Spiral Matrix II", tag: "simulation", difficulty: "Medium", priority: "P3", free: true, slug: "spiral-matrix-ii", lcSlug: "spiral-matrix-ii" },
          { id: "200", title: "Number of Islands", tag: "DFS/BFS on grid", difficulty: "Medium", priority: "P1", free: true, slug: "number-of-islands", lcSlug: "number-of-islands" },
          { id: "73", title: "Set Matrix Zeroes", tag: "in-place marking", difficulty: "Medium", priority: "P2", free: true, slug: "set-matrix-zeroes", lcSlug: "set-matrix-zeroes" },
          { id: "79", title: "Word Search", tag: "DFS + backtrack", difficulty: "Medium", priority: "P2", free: true, slug: "word-search", lcSlug: "word-search" },
          { id: "240", title: "Search a 2D Matrix II", tag: "staircase search", difficulty: "Medium", priority: "P2", free: true, slug: "search-a-2d-matrix-ii", lcSlug: "search-a-2d-matrix-ii" },
          { id: "48", title: "Rotate Image", tag: "transpose + reverse", difficulty: "Medium", priority: "P2", free: true, slug: "rotate-image", lcSlug: "rotate-image" },
          { id: "74", title: "Search a 2D Matrix", tag: "binary search", difficulty: "Medium", priority: "P2", free: true, slug: "search-a-2d-matrix", lcSlug: "search-a-2d-matrix" },
          { id: "36", title: "Valid Sudoku", tag: "HashSet per row/col/box", difficulty: "Medium", priority: "P2", free: true, slug: "valid-sudoku", lcSlug: "valid-sudoku" },
        ],
      },
    ],
  },
  {
    id: "stack",
    label: "Stack",
    icon: Layers,
    count: 8,
    subtitle: "Monotonic stack, expression evaluation, min stack",
    groups: [
      {
        name: "",
        problems: [
          { id: "20", title: "Valid Parentheses", tag: "stack", difficulty: "Easy", priority: "P1", free: true, slug: "valid-parentheses", lcSlug: "valid-parentheses" },
          { id: "150", title: "Evaluate Reverse Polish Notation", tag: "stack", difficulty: "Medium", priority: "P2", free: true, slug: "evaluate-reverse-polish-notation", lcSlug: "evaluate-reverse-polish-notation" },
          { id: "739", title: "Daily Temperatures", tag: "monotonic stack", difficulty: "Medium", priority: "P1", free: true, slug: "daily-temperatures", lcSlug: "daily-temperatures" },
          { id: "155", title: "Min Stack", tag: "design", difficulty: "Medium", priority: "P1", free: true, slug: "min-stack", lcSlug: "min-stack" },
          { id: "496", title: "Next Greater Element I", tag: "monotonic stack", difficulty: "Easy", priority: "P2", free: true, slug: "next-greater-element-i", lcSlug: "next-greater-element-i" },
          { id: "84", title: "Largest Rectangle in Histogram", tag: "monotonic stack", difficulty: "Hard", priority: "P2", free: true, slug: "largest-rectangle-in-histogram", lcSlug: "largest-rectangle-in-histogram" },
          { id: "85", title: "Maximal Rectangle", tag: "stack on histogram", difficulty: "Hard", priority: "P2", free: true, slug: "maximal-rectangle", lcSlug: "maximal-rectangle" },
          { id: "224", title: "Basic Calculator", tag: "stack + sign", difficulty: "Hard", priority: "P2", free: true, slug: "basic-calculator", lcSlug: "basic-calculator" },
        ],
      },
    ],
  },
  {
    id: "queue",
    label: "Queue",
    icon: Activity,
    count: 1,
    subtitle: "",
    groups: [
      {
        name: "",
        problems: [
          { id: "GFG", title: "Reversing First K Elements of Queue", tag: "queue + stack", difficulty: "Medium", priority: "P3", free: true, slug: "reversing-first-k-elements-of-queue", lcSlug: "" },
        ],
      },
    ],
  },
  {
    id: "binarysearch",
    label: "Binary Search",
    icon: SearchIcon,
    count: 13,
    subtitle: "Classic search · Search on answer · Rotated array",
    groups: [
      {
        name: "",
        problems: [
          { id: "35", title: "Search Insert Position", tag: "binary search", difficulty: "Easy", priority: "P2", free: true, slug: "search-insert-position", lcSlug: "search-insert-position" },
          { id: "268", title: "Missing Number", tag: "math / XOR", difficulty: "Easy", priority: "P2", free: true, slug: "missing-number", lcSlug: "missing-number" },
          { id: "34", title: "Find First and Last Position", tag: "binary search x2", difficulty: "Medium", priority: "P2", free: true, slug: "find-first-and-last-position-of-element-in-sorted-array", lcSlug: "find-first-and-last-position-of-element-in-sorted-array" },
          { id: "162", title: "Find Peak Element", tag: "binary search", difficulty: "Medium", priority: "P2", free: true, slug: "find-peak-element", lcSlug: "find-peak-element" },
          { id: "153", title: "Find Minimum in Rotated Sorted Array", tag: "binary search", difficulty: "Medium", priority: "P1", free: true, slug: "find-minimum-in-rotated-sorted-array", lcSlug: "find-minimum-in-rotated-sorted-array" },
          { id: "33", title: "Search in Rotated Sorted Array", tag: "binary search", difficulty: "Medium", priority: "P1", free: true, slug: "search-in-rotated-sorted-array", lcSlug: "search-in-rotated-sorted-array" },
          { id: "81", title: "Search in Rotated Sorted Array II", tag: "binary search + dups", difficulty: "Medium", priority: "P2", free: true, slug: "search-in-rotated-sorted-array-ii", lcSlug: "search-in-rotated-sorted-array-ii" },
          { id: "875", title: "Koko Eating Bananas", tag: "search on answer", difficulty: "Medium", priority: "P2", free: true, slug: "koko-eating-bananas", lcSlug: "koko-eating-bananas" },
          { id: "1011", title: "Capacity to Ship Packages", tag: "search on answer", difficulty: "Medium", priority: "P2", free: true, slug: "capacity-to-ship-packages-within-d-days", lcSlug: "capacity-to-ship-packages-within-d-days" },
          { id: "410", title: "Split Array Largest Sum", tag: "search on answer", difficulty: "Hard", priority: "P2", free: true, slug: "split-array-largest-sum", lcSlug: "split-array-largest-sum" },
          { id: "GFG", title: "Allocate Minimum Pages", tag: "search on answer", difficulty: "Hard", priority: "P2", free: true, slug: "allocate-minimum-pages", lcSlug: "" },
          { id: "IB", title: "Painter's Partition Problem", tag: "search on answer", difficulty: "Hard", priority: "P2", free: true, slug: "painter-s-partition-problem", lcSlug: "" },
          { id: "4", title: "Median of Two Sorted Arrays", tag: "binary search on partition", difficulty: "Hard", priority: "P1", free: true, slug: "median-of-two-sorted-arrays", lcSlug: "median-of-two-sorted-arrays" },
        ],
      },
    ],
  },
  {
    id: "linkedlist",
    label: "Linked List",
    icon: Link2,
    count: 13,
    subtitle: "Reversal, cycle detection, merge, Floyd's",
    groups: [
      {
        name: "",
        problems: [
          { id: "83", title: "Remove Duplicates from Sorted List", tag: "traversal", difficulty: "Easy", priority: "P2", free: true, slug: "remove-duplicates-from-sorted-list", lcSlug: "remove-duplicates-from-sorted-list" },
          { id: "206", title: "Reverse Linked List", tag: "iterative / recursive", difficulty: "Easy", priority: "P1", free: true, slug: "reverse-linked-list", lcSlug: "reverse-linked-list" },
          { id: "141", title: "Linked List Cycle", tag: "Floyd's cycle", difficulty: "Easy", priority: "P1", free: true, slug: "linked-list-cycle", lcSlug: "linked-list-cycle" },
          { id: "876", title: "Middle of Linked List", tag: "slow/fast pointer", difficulty: "Easy", priority: "P2", free: true, slug: "middle-of-the-linked-list", lcSlug: "middle-of-the-linked-list" },
          { id: "19", title: "Remove Nth Node From End", tag: "two pointers", difficulty: "Medium", priority: "P1", free: true, slug: "remove-nth-node-from-end-of-list", lcSlug: "remove-nth-node-from-end-of-list" },
          { id: "138", title: "Copy List with Random Pointer", tag: "HashMap", difficulty: "Medium", priority: "P1", free: true, slug: "copy-list-with-random-pointer", lcSlug: "copy-list-with-random-pointer" },
          { id: "2", title: "Add Two Numbers", tag: "carry simulation", difficulty: "Medium", priority: "P2", free: true, slug: "add-two-numbers", lcSlug: "add-two-numbers" },
          { id: "202", title: "Happy Number", tag: "Floyd's cycle", difficulty: "Easy", priority: "P2", free: true, slug: "happy-number", lcSlug: "happy-number" },
          { id: "92", title: "Reverse Linked List II", tag: "in-place reversal", difficulty: "Medium", priority: "P2", free: true, slug: "reverse-linked-list-ii", lcSlug: "reverse-linked-list-ii" },
          { id: "234", title: "Palindrome Linked List", tag: "reverse second half", difficulty: "Easy", priority: "P2", free: true, slug: "palindrome-linked-list", lcSlug: "palindrome-linked-list" },
          { id: "143", title: "Reorder List", tag: "middle + reverse + merge", difficulty: "Medium", priority: "P2", free: true, slug: "reorder-list", lcSlug: "reorder-list" },
          { id: "23", title: "Merge K Sorted Lists", tag: "min-heap", difficulty: "Hard", priority: "P1", free: true, slug: "merge-k-sorted-lists", lcSlug: "merge-k-sorted-lists" },
          { id: "25", title: "Reverse Nodes in K-Group", tag: "group reversal", difficulty: "Hard", priority: "P2", free: true, slug: "reverse-nodes-in-k-group", lcSlug: "reverse-nodes-in-k-group" },
        ],
      },
    ],
  },
  {
    id: "greedy",
    label: "Greedy",
    icon: Lightbulb,
    count: 5,
    subtitle: "Locally optimal choices",
    groups: [
      {
        name: "",
        problems: [
          { id: "55", title: "Jump Game", tag: "greedy reach", difficulty: "Medium", priority: "P1", free: true, slug: "jump-game", lcSlug: "jump-game" },
          { id: "45", title: "Jump Game II", tag: "greedy BFS", difficulty: "Medium", priority: "P2", free: true, slug: "jump-game-ii", lcSlug: "jump-game-ii" },
          { id: "135", title: "Distribute Candy", tag: "two-pass greedy", difficulty: "Hard", priority: "P2", free: true, slug: "candy", lcSlug: "candy" },
          { id: "134", title: "Gas Station", tag: "greedy circular", difficulty: "Medium", priority: "P2", free: true, slug: "gas-station", lcSlug: "gas-station" },
          { id: "GFG", title: "Minimum Platforms", tag: "sort + two pointers", difficulty: "Medium", priority: "P2", free: true, slug: "minimum-platforms", lcSlug: "" },
        ],
      },
    ],
  },
  {
    id: "intervals",
    label: "Intervals",
    icon: CalendarRange,
    count: 5,
    subtitle: "Merge, insert, sweep line",
    groups: [
      {
        name: "",
        problems: [
          { id: "56", title: "Merge Intervals", tag: "sort + merge", difficulty: "Medium", priority: "P1", free: true, slug: "merge-intervals", lcSlug: "merge-intervals" },
          { id: "57", title: "Insert Interval", tag: "merge insert", difficulty: "Medium", priority: "P1", free: true, slug: "insert-interval", lcSlug: "insert-interval" },
          { id: "253", title: "Meeting Rooms II", tag: "min-heap / sweep", difficulty: "Medium", priority: "P1", free: true, slug: "meeting-rooms-ii", lcSlug: "meeting-rooms-ii" },
          { id: "435", title: "Non-Overlapping Intervals", tag: "greedy sort", difficulty: "Medium", priority: "P2", free: true, slug: "non-overlapping-intervals", lcSlug: "non-overlapping-intervals" },
          { id: "452", title: "Minimum Arrows to Burst Balloons", tag: "greedy sort", difficulty: "Medium", priority: "P2", free: true, slug: "minimum-number-of-arrows-to-burst-balloons", lcSlug: "minimum-number-of-arrows-to-burst-balloons" },
        ],
      },
    ],
  },
  {
    id: "backtracking",
    label: "Backtracking",
    icon: Shuffle,
    count: 9,
    subtitle: "Subsets, permutations, combinations, constraint solving",
    groups: [
      {
        name: "",
        problems: [
          { id: "78", title: "Subsets", tag: "backtracking", difficulty: "Medium", priority: "P1", free: true, slug: "subsets", lcSlug: "subsets" },
          { id: "90", title: "Subsets II", tag: "backtrack + dedup", difficulty: "Medium", priority: "P2", free: true, slug: "subsets-ii", lcSlug: "subsets-ii" },
          { id: "46", title: "Permutations", tag: "backtracking", difficulty: "Medium", priority: "P1", free: true, slug: "permutations", lcSlug: "permutations" },
          { id: "77", title: "Combinations", tag: "backtracking", difficulty: "Medium", priority: "P2", free: true, slug: "combinations", lcSlug: "combinations" },
          { id: "39", title: "Combination Sum", tag: "backtrack reuse", difficulty: "Medium", priority: "P1", free: true, slug: "combination-sum", lcSlug: "combination-sum" },
          { id: "17", title: "Letter Combinations Phone Number", tag: "backtracking", difficulty: "Medium", priority: "P2", free: true, slug: "letter-combinations-of-a-phone-number", lcSlug: "letter-combinations-of-a-phone-number" },
          { id: "22", title: "Generate Parentheses", tag: "backtracking", difficulty: "Medium", priority: "P1", free: true, slug: "generate-parentheses", lcSlug: "generate-parentheses" },
          { id: "51", title: "N-Queens", tag: "backtrack + constraints", difficulty: "Hard", priority: "P2", free: true, slug: "n-queens", lcSlug: "n-queens" },
          { id: "37", title: "Sudoku Solver", tag: "backtrack + constraints", difficulty: "Hard", priority: "P2", free: true, slug: "sudoku-solver", lcSlug: "sudoku-solver" },
        ],
      },
    ],
  },
  {
    id: "tree",
    label: "Tree",
    icon: GitBranch,
    count: 20,
    subtitle: "BFS, DFS, BST, construction, path problems",
    groups: [
      {
        name: "",
        problems: [
          { id: "102", title: "Binary Tree Level Order Traversal", tag: "BFS", difficulty: "Medium", priority: "P1", free: true, slug: "binary-tree-level-order-traversal", lcSlug: "binary-tree-level-order-traversal" },
          { id: "637", title: "Average of Levels", tag: "BFS", difficulty: "Easy", priority: "P2", free: true, slug: "average-of-levels-in-binary-tree", lcSlug: "average-of-levels-in-binary-tree" },
          { id: "103", title: "Binary Tree Zigzag Level Order", tag: "BFS + deque", difficulty: "Medium", priority: "P2", free: true, slug: "binary-tree-zigzag-level-order-traversal", lcSlug: "binary-tree-zigzag-level-order-traversal" },
          { id: "199", title: "Binary Tree Right Side View", tag: "BFS last node", difficulty: "Medium", priority: "P1", free: true, slug: "binary-tree-right-side-view", lcSlug: "binary-tree-right-side-view" },
          { id: "101", title: "Symmetric Tree", tag: "DFS mirror", difficulty: "Easy", priority: "P2", free: true, slug: "symmetric-tree", lcSlug: "symmetric-tree" },
          { id: "543", title: "Diameter of Binary Tree", tag: "DFS height", difficulty: "Easy", priority: "P1", free: true, slug: "diameter-of-binary-tree", lcSlug: "diameter-of-binary-tree" },
          { id: "226", title: "Invert Binary Tree", tag: "DFS", difficulty: "Easy", priority: "P1", free: true, slug: "invert-binary-tree", lcSlug: "invert-binary-tree" },
          { id: "104", title: "Maximum Depth of Binary Tree", tag: "DFS", difficulty: "Easy", priority: "P1", free: true, slug: "maximum-depth-of-binary-tree", lcSlug: "maximum-depth-of-binary-tree" },
          { id: "110", title: "Balanced Binary Tree", tag: "DFS height", difficulty: "Easy", priority: "P2", free: true, slug: "balanced-binary-tree", lcSlug: "balanced-binary-tree" },
          { id: "108", title: "Convert Sorted Array to BST", tag: "divide &amp; conquer", difficulty: "Easy", priority: "P2", free: true, slug: "convert-sorted-array-to-binary-search-tree", lcSlug: "convert-sorted-array-to-binary-search-tree" },
          { id: "114", title: "Flatten Binary Tree to Linked List", tag: "DFS in-place", difficulty: "Medium", priority: "P2", free: true, slug: "flatten-binary-tree-to-linked-list", lcSlug: "flatten-binary-tree-to-linked-list" },
          { id: "98", title: "Validate Binary Search Tree", tag: "inorder / bounds", difficulty: "Medium", priority: "P1", free: true, slug: "validate-binary-search-tree", lcSlug: "validate-binary-search-tree" },
          { id: "236", title: "Lowest Common Ancestor", tag: "DFS", difficulty: "Medium", priority: "P1", free: true, slug: "lowest-common-ancestor-of-a-binary-tree", lcSlug: "lowest-common-ancestor-of-a-binary-tree" },
          { id: "230", title: "Kth Smallest in BST", tag: "inorder", difficulty: "Medium", priority: "P1", free: true, slug: "kth-smallest-element-in-a-bst", lcSlug: "kth-smallest-element-in-a-bst" },
          { id: "105", title: "Construct Tree from Preorder+Inorder", tag: "divide &amp; conquer", difficulty: "Medium", priority: "P1", free: true, slug: "construct-binary-tree-from-preorder-and-inorder-traversal", lcSlug: "construct-binary-tree-from-preorder-and-inorder-traversal" },
          { id: "297", title: "Serialize / Deserialize Binary Tree", tag: "BFS / DFS encode", difficulty: "Hard", priority: "P1", free: true, slug: "serialize-and-deserialize-binary-tree", lcSlug: "serialize-and-deserialize-binary-tree" },
          { id: "112", title: "Path Sum", tag: "DFS", difficulty: "Easy", priority: "P2", free: true, slug: "path-sum", lcSlug: "path-sum" },
          { id: "113", title: "Path Sum II", tag: "DFS + backtrack", difficulty: "Medium", priority: "P2", free: true, slug: "path-sum-ii", lcSlug: "path-sum-ii" },
          { id: "129", title: "Sum Root to Leaf Numbers", tag: "DFS", difficulty: "Medium", priority: "P2", free: true, slug: "sum-root-to-leaf-numbers", lcSlug: "sum-root-to-leaf-numbers" },
          { id: "124", title: "Binary Tree Maximum Path Sum", tag: "DFS gain", difficulty: "Hard", priority: "P1", free: true, slug: "binary-tree-maximum-path-sum", lcSlug: "binary-tree-maximum-path-sum" },
        ],
      },
    ],
  },
  {
    id: "heap",
    label: "Heap / Priority Queue",
    icon: Flame,
    count: 6,
    subtitle: "Top-K, two heaps, scheduling",
    groups: [
      {
        name: "",
        problems: [
          { id: "1046", title: "Last Stone Weight", tag: "max-heap", difficulty: "Easy", priority: "P2", free: true, slug: "last-stone-weight", lcSlug: "last-stone-weight" },
          { id: "215", title: "Kth Largest Element in Array", tag: "min-heap of k", difficulty: "Medium", priority: "P1", free: true, slug: "kth-largest-element-in-an-array", lcSlug: "kth-largest-element-in-an-array" },
          { id: "347", title: "Top K Frequent Elements", tag: "heap + freq map", difficulty: "Medium", priority: "P1", free: true, slug: "top-k-frequent-elements", lcSlug: "top-k-frequent-elements" },
          { id: "973", title: "K Closest Points to Origin", tag: "max-heap of k", difficulty: "Medium", priority: "P2", free: true, slug: "k-closest-points-to-origin", lcSlug: "k-closest-points-to-origin" },
          { id: "621", title: "Task Scheduler", tag: "greedy formula", difficulty: "Medium", priority: "P2", free: true, slug: "task-scheduler", lcSlug: "task-scheduler" },
          { id: "295", title: "Find Median from Data Stream", tag: "two heaps", difficulty: "Hard", priority: "P1", free: true, slug: "find-median-from-data-stream", lcSlug: "find-median-from-data-stream" },
        ],
      },
    ],
  },
  {
    id: "graph",
    label: "Graph",
    icon: Network,
    count: 11,
    subtitle: "BFS/DFS, topo sort, shortest path, MST, Union-Find",
    groups: [
      {
        name: "",
        problems: [
          { id: "1971", title: "Find if Path Exists in Graph", tag: "Union-Find / BFS", difficulty: "Easy", priority: "P2", free: true, slug: "find-if-path-exists-in-graph", lcSlug: "find-if-path-exists-in-graph" },
          { id: "994", title: "Rotting Oranges", tag: "multi-source BFS", difficulty: "Medium", priority: "P2", free: true, slug: "rotting-oranges", lcSlug: "rotting-oranges" },
          { id: "133", title: "Clone Graph", tag: "DFS + HashMap", difficulty: "Medium", priority: "P2", free: true, slug: "clone-graph", lcSlug: "clone-graph" },
          { id: "207", title: "Course Schedule", tag: "cycle detection DFS", difficulty: "Medium", priority: "P1", free: true, slug: "course-schedule", lcSlug: "course-schedule" },
          { id: "210", title: "Course Schedule II", tag: "Kahn's topo sort", difficulty: "Medium", priority: "P1", free: true, slug: "course-schedule-ii", lcSlug: "course-schedule-ii" },
          { id: "GFG", title: "Is Graph a Tree?", tag: "DFS cycle + connected", difficulty: "Medium", priority: "P2", free: true, slug: "is-graph-a-tree", lcSlug: "" },
          { id: "417", title: "Pacific Atlantic Water Flow", tag: "reverse BFS from coasts", difficulty: "Medium", priority: "P2", free: true, slug: "pacific-atlantic-water-flow", lcSlug: "pacific-atlantic-water-flow" },
          { id: "743", title: "Network Delay Time", tag: "Dijkstra", difficulty: "Medium", priority: "P2", free: true, slug: "network-delay-time", lcSlug: "network-delay-time" },
          { id: "787", title: "Cheapest Flights Within K Stops", tag: "Bellman-Ford", difficulty: "Medium", priority: "P2", free: true, slug: "cheapest-flights-within-k-stops", lcSlug: "cheapest-flights-within-k-stops" },
          { id: "399", title: "Evaluate Division", tag: "weighted BFS", difficulty: "Medium", priority: "P2", free: true, slug: "evaluate-division", lcSlug: "evaluate-division" },
          { id: "1584", title: "Min Cost to Connect All Points", tag: "Prim's MST", difficulty: "Medium", priority: "P2", free: true, slug: "min-cost-to-connect-all-points", lcSlug: "min-cost-to-connect-all-points" },
        ],
      },
    ],
  },
  {
    id: "dp",
    label: "Dynamic Programming",
    icon: Cpu,
    count: 15,
    subtitle: "1D, 2D DP, LCS, knapsack, LIS",
    groups: [
      {
        name: "",
        problems: [
          { id: "509", title: "Fibonacci Number", tag: "dp base", difficulty: "Easy", priority: "P3", free: true, slug: "fibonacci-number", lcSlug: "fibonacci-number" },
          { id: "70", title: "Climbing Stairs", tag: "1D DP", difficulty: "Easy", priority: "P1", free: true, slug: "climbing-stairs", lcSlug: "climbing-stairs" },
          { id: "746", title: "Min Cost Climbing Stairs", tag: "1D DP", difficulty: "Easy", priority: "P2", free: true, slug: "min-cost-climbing-stairs", lcSlug: "min-cost-climbing-stairs" },
          { id: "62", title: "Unique Paths", tag: "2D DP", difficulty: "Easy", priority: "P1", free: true, slug: "unique-paths", lcSlug: "unique-paths" },
          { id: "63", title: "Unique Paths II", tag: "2D DP + obstacles", difficulty: "Medium", priority: "P2", free: true, slug: "unique-paths-ii", lcSlug: "unique-paths-ii" },
          { id: "120", title: "Triangle", tag: "bottom-up DP", difficulty: "Medium", priority: "P2", free: true, slug: "triangle", lcSlug: "triangle" },
          { id: "198", title: "House Robber", tag: "1D DP", difficulty: "Medium", priority: "P1", free: true, slug: "house-robber", lcSlug: "house-robber" },
          { id: "213", title: "House Robber II", tag: "circular DP", difficulty: "Medium", priority: "P1", free: true, slug: "house-robber-ii", lcSlug: "house-robber-ii" },
          { id: "152", title: "Maximum Product Subarray", tag: "min/max DP", difficulty: "Medium", priority: "P1", free: true, slug: "maximum-product-subarray", lcSlug: "maximum-product-subarray" },
          { id: "300", title: "Longest Increasing Subsequence", tag: "patience sort O(n log n)", difficulty: "Medium", priority: "P1", free: true, slug: "longest-increasing-subsequence", lcSlug: "longest-increasing-subsequence" },
          { id: "91", title: "Decode Ways", tag: "1D DP", difficulty: "Medium", priority: "P1", free: true, slug: "decode-ways", lcSlug: "decode-ways" },
          { id: "322", title: "Coin Change", tag: "unbounded knapsack", difficulty: "Medium", priority: "P1", free: true, slug: "coin-change", lcSlug: "coin-change" },
          { id: "1143", title: "Longest Common Subsequence", tag: "2D DP", difficulty: "Medium", priority: "P1", free: true, slug: "longest-common-subsequence", lcSlug: "longest-common-subsequence" },
          { id: "72", title: "Edit Distance", tag: "2D DP", difficulty: "Hard", priority: "P1", free: true, slug: "edit-distance", lcSlug: "edit-distance" },
          { id: "GFG", title: "Longest Common Substring", tag: "2D DP", difficulty: "Medium", priority: "P2", free: true, slug: "longest-common-substring", lcSlug: "" },
        ],
      },
    ],
  },
  {
    id: "bitmanipulation",
    label: "Bit Manipulation",
    icon: Zap,
    count: 8,
    subtitle: "XOR tricks, bit counting, Floyd's",
    groups: [
      {
        name: "",
        problems: [
          { id: "389", title: "Find the Difference", tag: "XOR", difficulty: "Easy", priority: "P2", free: true, slug: "find-the-difference", lcSlug: "find-the-difference" },
          { id: "191", title: "Number of 1 Bits", tag: "Kernighan's n&amp;(n-1)", difficulty: "Easy", priority: "P2", free: true, slug: "number-of-1-bits", lcSlug: "number-of-1-bits" },
          { id: "231", title: "Power of Two", tag: "n&amp;(n-1)==0", difficulty: "Easy", priority: "P2", free: true, slug: "power-of-two", lcSlug: "power-of-two" },
          { id: "338", title: "Counting Bits", tag: "DP + right shift", difficulty: "Easy", priority: "P2", free: true, slug: "counting-bits", lcSlug: "counting-bits" },
          { id: "371", title: "Sum of Two Integers", tag: "XOR + carry", difficulty: "Medium", priority: "P2", free: true, slug: "sum-of-two-integers", lcSlug: "sum-of-two-integers" },
          { id: "260", title: "Single Number III", tag: "XOR partition", difficulty: "Medium", priority: "P2", free: true, slug: "single-number-iii", lcSlug: "single-number-iii" },
          { id: "137", title: "Single Number II", tag: "bit mod 3", difficulty: "Medium", priority: "P2", free: true, slug: "single-number-ii", lcSlug: "single-number-ii" },
          { id: "287", title: "Find the Duplicate Number", tag: "Floyd's cycle", difficulty: "Medium", priority: "P2", free: true, slug: "find-the-duplicate-number", lcSlug: "find-the-duplicate-number" },
        ],
      },
    ],
  },
  {
    id: "trie",
    label: "Trie",
    icon: KeyRound,
    count: 2,
    subtitle: "Prefix tree, word search",
    groups: [
      {
        name: "",
        problems: [
          { id: "208", title: "Implement Trie", tag: "trie design", difficulty: "Medium", priority: "P1", free: true, slug: "implement-trie-prefix-tree", lcSlug: "implement-trie-prefix-tree" },
          { id: "212", title: "Word Search II", tag: "trie + backtrack", difficulty: "Hard", priority: "P2", free: true, slug: "word-search-ii", lcSlug: "word-search-ii" },
        ],
      },
    ],
  },
  {
    id: "design",
    label: "Design",
    icon: Hammer,
    count: 1,
    subtitle: "Data structure design",
    groups: [
      {
        name: "",
        problems: [
          { id: "146", title: "LRU Cache", tag: "HashMap + doubly LinkedList", difficulty: "Medium", priority: "P1", free: true, slug: "lru-cache", lcSlug: "lru-cache" },
        ],
      },
    ],
  },
];
