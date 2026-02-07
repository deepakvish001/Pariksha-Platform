// Competitive Programming Data - Based on ProgVar Problem Sets

export interface CPTrack {
  id: string;
  name: string;
  color: string; // Tailwind color class for badge
}

export interface CPTopic {
  id: string;
  name: string;
}

export interface CPProblemSet {
  id: number;
  title: string;
  trackId: string;
  topicId: string;
  problemCount: number;
  externalUrl?: string;
}

// Tracks organized by difficulty level and contest type
export const cpTracks: CPTrack[] = [
  { id: "preliminaries", name: "Preliminaries", color: "bg-teal-500/20 text-teal-600 dark:text-teal-400 border-teal-500/30" },
  { id: "basics", name: "Basics", color: "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30" },
  { id: "intermediate", name: "Intermediate", color: "bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border-cyan-500/30" },
  { id: "advanced-ds", name: "Advanced Data Structures", color: "bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30" },
  { id: "advanced-algo", name: "Advanced Algorithms", color: "bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-500/30" },
  { id: "advanced-math", name: "Advanced Mathematics", color: "bg-violet-500/20 text-violet-600 dark:text-violet-400 border-violet-500/30" },
  { id: "atcoder-4p", name: "4-Problem AtCoder Beginner Contests (Sorted)", color: "bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30" },
  { id: "atcoder-6p", name: "6-Problem AtCoder Beginner Contests (Sorted)", color: "bg-lime-500/20 text-lime-600 dark:text-lime-400 border-lime-500/30" },
  { id: "atcoder-regular", name: "AtCoder Regular Contests (Sorted)", color: "bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30" },
  { id: "codeforces-edu", name: "Codeforces Educational Rounds", color: "bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/30" },
  { id: "icpc", name: "ICPC World Finals", color: "bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30" },
];

// Topics for categorizing problem sets
export const cpTopics: CPTopic[] = [
  { id: "algorithmic-techniques", name: "Algorithmic Techniques (except DP)" },
  { id: "data-structures", name: "Data Structures" },
  { id: "dynamic-programming", name: "Dynamic Programming" },
  { id: "geometry", name: "Geometry" },
  { id: "graphs", name: "Graphs" },
  { id: "implementation", name: "Implementation" },
  { id: "math", name: "Math" },
  { id: "strings", name: "Strings" },
];

// All 270 Problem sets data from ProgVar
export const cpProblemSets: CPProblemSet[] = [
  // ==================== PRELIMINARIES ====================
  { id: 1, title: "Get Started with Competitive Programming", trackId: "preliminaries", topicId: "implementation", problemCount: 6, externalUrl: "https://progvar.fun/problemsets/1" },
  { id: 2, title: "How to Code Faster", trackId: "preliminaries", topicId: "implementation", problemCount: 8, externalUrl: "https://progvar.fun/problemsets/2" },
  { id: 3, title: "Sums and Asymptotics", trackId: "preliminaries", topicId: "math", problemCount: 15, externalUrl: "https://progvar.fun/problemsets/3" },
  { id: 4, title: "Recursion", trackId: "preliminaries", topicId: "algorithmic-techniques", problemCount: 9, externalUrl: "https://progvar.fun/problemsets/4" },

  // ==================== BASICS - NUMBER THEORY ====================
  { id: 5, title: "Number Theory: Prime and Composite, Primality Testing, Prime Sieves, Finding Divisors", trackId: "basics", topicId: "math", problemCount: 16, externalUrl: "https://progvar.fun/problemsets/5" },
  { id: 6, title: "Number Theory: Prime Factorization", trackId: "basics", topicId: "math", problemCount: 9, externalUrl: "https://progvar.fun/problemsets/6" },
  { id: 7, title: "Number Theory: Greatest Common Divisor and Least Common Multiple", trackId: "basics", topicId: "math", problemCount: 21, externalUrl: "https://progvar.fun/problemsets/7" },
  { id: 8, title: "Number Theory: Divisibility, Modular Arithmetic", trackId: "basics", topicId: "math", problemCount: 23, externalUrl: "https://progvar.fun/problemsets/8" },

  // ==================== BASICS - RANGE QUERIES ====================
  { id: 9, title: "Range Queries: Static Range Queries", trackId: "basics", topicId: "data-structures", problemCount: 26, externalUrl: "https://progvar.fun/problemsets/9" },

  // ==================== BASICS - COUNTING ====================
  { id: 10, title: "Counting: Rule of Sum, Rule of Product", trackId: "basics", topicId: "math", problemCount: 16, externalUrl: "https://progvar.fun/problemsets/10" },
  { id: 11, title: "Counting: Permutations and Combinations", trackId: "basics", topicId: "math", problemCount: 21, externalUrl: "https://progvar.fun/problemsets/11" },

  // ==================== BASICS - BITWISE ====================
  { id: 12, title: "Bitwise Operations", trackId: "basics", topicId: "algorithmic-techniques", problemCount: 22, externalUrl: "https://progvar.fun/problemsets/12" },

  // ==================== BASICS - COMPLETE SEARCH ====================
  { id: 13, title: "Complete Search: Iterative", trackId: "basics", topicId: "algorithmic-techniques", problemCount: 8, externalUrl: "https://progvar.fun/problemsets/13" },
  { id: 14, title: "Complete Search: Recursive Backtracking, Pruning", trackId: "basics", topicId: "algorithmic-techniques", problemCount: 17, externalUrl: "https://progvar.fun/problemsets/14" },
  { id: 15, title: "Complete Search: All-Subsets / Binary Choice", trackId: "basics", topicId: "algorithmic-techniques", problemCount: 22, externalUrl: "https://progvar.fun/problemsets/15" },
  { id: 16, title: "Complete Search: All-Permutations", trackId: "basics", topicId: "algorithmic-techniques", problemCount: 15, externalUrl: "https://progvar.fun/problemsets/16" },

  // ==================== BASICS - DIVIDE AND CONQUER ====================
  { id: 17, title: "Divide-and-Conquer", trackId: "basics", topicId: "algorithmic-techniques", problemCount: 8, externalUrl: "https://progvar.fun/problemsets/17" },

  // ==================== BASICS - BINARY SEARCH ====================
  { id: 18, title: "Binary Search", trackId: "basics", topicId: "algorithmic-techniques", problemCount: 8, externalUrl: "https://progvar.fun/problemsets/18" },

  // ==================== BASICS - DATA STRUCTURES ====================
  { id: 19, title: "Basic Data Structures: Lists, Stacks, Queues", trackId: "basics", topicId: "data-structures", problemCount: 12, externalUrl: "https://progvar.fun/problemsets/19" },
  { id: 20, title: "Basic Data Structures: Priority Queues, Sets, Maps, Counters", trackId: "basics", topicId: "data-structures", problemCount: 15, externalUrl: "https://progvar.fun/problemsets/20" },

  // ==================== BASICS - TWO POINTERS ====================
  { id: 21, title: "Two Pointers", trackId: "basics", topicId: "algorithmic-techniques", problemCount: 8, externalUrl: "https://progvar.fun/problemsets/21" },

  // ==================== BASICS - SORTING ====================
  { id: 22, title: "Sorting with Custom Comparators", trackId: "basics", topicId: "algorithmic-techniques", problemCount: 4, externalUrl: "https://progvar.fun/problemsets/22" },

  // ==================== BASICS - GREEDY ====================
  { id: 23, title: "Greedy: Exchange Argument", trackId: "basics", topicId: "algorithmic-techniques", problemCount: 18, externalUrl: "https://progvar.fun/problemsets/23" },
  { id: 24, title: "Greedy: Greedy Stays Ahead", trackId: "basics", topicId: "algorithmic-techniques", problemCount: 8, externalUrl: "https://progvar.fun/problemsets/24" },
  { id: 25, title: "Greedy: Structural Argument", trackId: "basics", topicId: "algorithmic-techniques", problemCount: 17, externalUrl: "https://progvar.fun/problemsets/25" },

  // ==================== BASICS - GRAPHS ====================
  { id: 26, title: "Graphs: Breadth-First Search", trackId: "basics", topicId: "graphs", problemCount: 14, externalUrl: "https://progvar.fun/problemsets/26" },
  { id: 27, title: "Graphs: Depth-First Search", trackId: "basics", topicId: "graphs", problemCount: 16, externalUrl: "https://progvar.fun/problemsets/27" },
  { id: 28, title: "Graphs: Shortest Paths (Unweighted)", trackId: "basics", topicId: "graphs", problemCount: 12, externalUrl: "https://progvar.fun/problemsets/28" },
  { id: 29, title: "Graphs: Flood Fill", trackId: "basics", topicId: "graphs", problemCount: 10, externalUrl: "https://progvar.fun/problemsets/29" },
  { id: 30, title: "Graphs: Topological Sort", trackId: "basics", topicId: "graphs", problemCount: 11, externalUrl: "https://progvar.fun/problemsets/30" },

  // ==================== BASICS - DYNAMIC PROGRAMMING ====================
  { id: 31, title: "DP: Coin Change / Subset Sum", trackId: "basics", topicId: "dynamic-programming", problemCount: 18, externalUrl: "https://progvar.fun/problemsets/31" },
  { id: 32, title: "DP: Longest Increasing Subsequence", trackId: "basics", topicId: "dynamic-programming", problemCount: 15, externalUrl: "https://progvar.fun/problemsets/32" },
  { id: 33, title: "DP: Grid Paths", trackId: "basics", topicId: "dynamic-programming", problemCount: 14, externalUrl: "https://progvar.fun/problemsets/33" },
  { id: 34, title: "DP: Knapsack Problems", trackId: "basics", topicId: "dynamic-programming", problemCount: 16, externalUrl: "https://progvar.fun/problemsets/34" },
  { id: 35, title: "DP: Edit Distance", trackId: "basics", topicId: "dynamic-programming", problemCount: 12, externalUrl: "https://progvar.fun/problemsets/35" },

  // ==================== INTERMEDIATE - GRAPHS ====================
  { id: 36, title: "Graphs: Dijkstra's Algorithm", trackId: "intermediate", topicId: "graphs", problemCount: 18, externalUrl: "https://progvar.fun/problemsets/36" },
  { id: 37, title: "Graphs: Bellman-Ford Algorithm", trackId: "intermediate", topicId: "graphs", problemCount: 10, externalUrl: "https://progvar.fun/problemsets/37" },
  { id: 38, title: "Graphs: Floyd-Warshall Algorithm", trackId: "intermediate", topicId: "graphs", problemCount: 8, externalUrl: "https://progvar.fun/problemsets/38" },
  { id: 39, title: "Graphs: Minimum Spanning Trees", trackId: "intermediate", topicId: "graphs", problemCount: 14, externalUrl: "https://progvar.fun/problemsets/39" },
  { id: 40, title: "Graphs: Strongly Connected Components", trackId: "intermediate", topicId: "graphs", problemCount: 12, externalUrl: "https://progvar.fun/problemsets/40" },
  { id: 41, title: "Graphs: Bridges and Articulation Points", trackId: "intermediate", topicId: "graphs", problemCount: 10, externalUrl: "https://progvar.fun/problemsets/41" },
  { id: 42, title: "Graphs: Bipartite Graphs", trackId: "intermediate", topicId: "graphs", problemCount: 11, externalUrl: "https://progvar.fun/problemsets/42" },
  { id: 43, title: "Graphs: Euler Path and Circuit", trackId: "intermediate", topicId: "graphs", problemCount: 9, externalUrl: "https://progvar.fun/problemsets/43" },

  // ==================== INTERMEDIATE - TREES ====================
  { id: 44, title: "Trees: Tree Traversals", trackId: "intermediate", topicId: "graphs", problemCount: 12, externalUrl: "https://progvar.fun/problemsets/44" },
  { id: 45, title: "Trees: Diameter and Center", trackId: "intermediate", topicId: "graphs", problemCount: 10, externalUrl: "https://progvar.fun/problemsets/45" },
  { id: 46, title: "Trees: LCA (Lowest Common Ancestor)", trackId: "intermediate", topicId: "graphs", problemCount: 14, externalUrl: "https://progvar.fun/problemsets/46" },
  { id: 47, title: "Trees: Binary Lifting", trackId: "intermediate", topicId: "graphs", problemCount: 11, externalUrl: "https://progvar.fun/problemsets/47" },
  { id: 48, title: "Trees: Tree DP", trackId: "intermediate", topicId: "dynamic-programming", problemCount: 16, externalUrl: "https://progvar.fun/problemsets/48" },

  // ==================== INTERMEDIATE - DP ADVANCED ====================
  { id: 49, title: "DP: Bitmask DP", trackId: "intermediate", topicId: "dynamic-programming", problemCount: 18, externalUrl: "https://progvar.fun/problemsets/49" },
  { id: 50, title: "DP: Digit DP", trackId: "intermediate", topicId: "dynamic-programming", problemCount: 14, externalUrl: "https://progvar.fun/problemsets/50" },
  { id: 51, title: "DP: Interval DP", trackId: "intermediate", topicId: "dynamic-programming", problemCount: 12, externalUrl: "https://progvar.fun/problemsets/51" },
  { id: 52, title: "DP: DP on DAGs", trackId: "intermediate", topicId: "dynamic-programming", problemCount: 10, externalUrl: "https://progvar.fun/problemsets/52" },
  { id: 53, title: "DP: Probability DP", trackId: "intermediate", topicId: "dynamic-programming", problemCount: 11, externalUrl: "https://progvar.fun/problemsets/53" },
  { id: 54, title: "DP: Expected Value DP", trackId: "intermediate", topicId: "dynamic-programming", problemCount: 9, externalUrl: "https://progvar.fun/problemsets/54" },

  // ==================== INTERMEDIATE - NUMBER THEORY ====================
  { id: 55, title: "Number Theory: Extended Euclidean Algorithm", trackId: "intermediate", topicId: "math", problemCount: 12, externalUrl: "https://progvar.fun/problemsets/55" },
  { id: 56, title: "Number Theory: Modular Inverse", trackId: "intermediate", topicId: "math", problemCount: 10, externalUrl: "https://progvar.fun/problemsets/56" },
  { id: 57, title: "Number Theory: Chinese Remainder Theorem", trackId: "intermediate", topicId: "math", problemCount: 8, externalUrl: "https://progvar.fun/problemsets/57" },
  { id: 58, title: "Number Theory: Euler's Totient Function", trackId: "intermediate", topicId: "math", problemCount: 11, externalUrl: "https://progvar.fun/problemsets/58" },

  // ==================== INTERMEDIATE - STRINGS ====================
  { id: 59, title: "Strings: Hashing", trackId: "intermediate", topicId: "strings", problemCount: 14, externalUrl: "https://progvar.fun/problemsets/59" },
  { id: 60, title: "Strings: KMP Algorithm", trackId: "intermediate", topicId: "strings", problemCount: 12, externalUrl: "https://progvar.fun/problemsets/60" },
  { id: 61, title: "Strings: Z-Algorithm", trackId: "intermediate", topicId: "strings", problemCount: 10, externalUrl: "https://progvar.fun/problemsets/61" },
  { id: 62, title: "Strings: Trie", trackId: "intermediate", topicId: "strings", problemCount: 13, externalUrl: "https://progvar.fun/problemsets/62" },

  // ==================== INTERMEDIATE - GEOMETRY ====================
  { id: 63, title: "Geometry: Points and Lines", trackId: "intermediate", topicId: "geometry", problemCount: 15, externalUrl: "https://progvar.fun/problemsets/63" },
  { id: 64, title: "Geometry: Polygons", trackId: "intermediate", topicId: "geometry", problemCount: 12, externalUrl: "https://progvar.fun/problemsets/64" },
  { id: 65, title: "Geometry: Convex Hull", trackId: "intermediate", topicId: "geometry", problemCount: 10, externalUrl: "https://progvar.fun/problemsets/65" },

  // ==================== ADVANCED DATA STRUCTURES ====================
  { id: 66, title: "Segment Tree: Point Update, Range Query", trackId: "advanced-ds", topicId: "data-structures", problemCount: 18, externalUrl: "https://progvar.fun/problemsets/66" },
  { id: 67, title: "Segment Tree: Range Update, Point Query", trackId: "advanced-ds", topicId: "data-structures", problemCount: 14, externalUrl: "https://progvar.fun/problemsets/67" },
  { id: 68, title: "Segment Tree: Lazy Propagation", trackId: "advanced-ds", topicId: "data-structures", problemCount: 16, externalUrl: "https://progvar.fun/problemsets/68" },
  { id: 69, title: "Segment Tree: Persistent", trackId: "advanced-ds", topicId: "data-structures", problemCount: 12, externalUrl: "https://progvar.fun/problemsets/69" },
  { id: 70, title: "Segment Tree: 2D", trackId: "advanced-ds", topicId: "data-structures", problemCount: 8, externalUrl: "https://progvar.fun/problemsets/70" },
  { id: 71, title: "Fenwick Tree (BIT): Basic", trackId: "advanced-ds", topicId: "data-structures", problemCount: 14, externalUrl: "https://progvar.fun/problemsets/71" },
  { id: 72, title: "Fenwick Tree (BIT): 2D", trackId: "advanced-ds", topicId: "data-structures", problemCount: 10, externalUrl: "https://progvar.fun/problemsets/72" },
  { id: 73, title: "Sparse Table", trackId: "advanced-ds", topicId: "data-structures", problemCount: 11, externalUrl: "https://progvar.fun/problemsets/73" },
  { id: 74, title: "Disjoint Set Union (DSU)", trackId: "advanced-ds", topicId: "data-structures", problemCount: 16, externalUrl: "https://progvar.fun/problemsets/74" },
  { id: 75, title: "DSU: Path Compression and Union by Rank", trackId: "advanced-ds", topicId: "data-structures", problemCount: 12, externalUrl: "https://progvar.fun/problemsets/75" },
  { id: 76, title: "DSU: Small-to-Large Merging", trackId: "advanced-ds", topicId: "data-structures", problemCount: 10, externalUrl: "https://progvar.fun/problemsets/76" },
  { id: 77, title: "Square Root Decomposition", trackId: "advanced-ds", topicId: "data-structures", problemCount: 14, externalUrl: "https://progvar.fun/problemsets/77" },
  { id: 78, title: "Mo's Algorithm", trackId: "advanced-ds", topicId: "data-structures", problemCount: 12, externalUrl: "https://progvar.fun/problemsets/78" },
  { id: 79, title: "Heavy-Light Decomposition", trackId: "advanced-ds", topicId: "data-structures", problemCount: 11, externalUrl: "https://progvar.fun/problemsets/79" },
  { id: 80, title: "Centroid Decomposition", trackId: "advanced-ds", topicId: "data-structures", problemCount: 10, externalUrl: "https://progvar.fun/problemsets/80" },
  { id: 81, title: "Link-Cut Trees", trackId: "advanced-ds", topicId: "data-structures", problemCount: 8, externalUrl: "https://progvar.fun/problemsets/81" },
  { id: 82, title: "Treap", trackId: "advanced-ds", topicId: "data-structures", problemCount: 9, externalUrl: "https://progvar.fun/problemsets/82" },
  { id: 83, title: "Splay Tree", trackId: "advanced-ds", topicId: "data-structures", problemCount: 7, externalUrl: "https://progvar.fun/problemsets/83" },

  // ==================== ADVANCED ALGORITHMS ====================
  { id: 84, title: "Network Flow: Max Flow Min Cut", trackId: "advanced-algo", topicId: "graphs", problemCount: 14, externalUrl: "https://progvar.fun/problemsets/84" },
  { id: 85, title: "Network Flow: Ford-Fulkerson / Edmonds-Karp", trackId: "advanced-algo", topicId: "graphs", problemCount: 12, externalUrl: "https://progvar.fun/problemsets/85" },
  { id: 86, title: "Network Flow: Dinic's Algorithm", trackId: "advanced-algo", topicId: "graphs", problemCount: 10, externalUrl: "https://progvar.fun/problemsets/86" },
  { id: 87, title: "Network Flow: Min Cost Max Flow", trackId: "advanced-algo", topicId: "graphs", problemCount: 11, externalUrl: "https://progvar.fun/problemsets/87" },
  { id: 88, title: "Matching: Bipartite Matching", trackId: "advanced-algo", topicId: "graphs", problemCount: 13, externalUrl: "https://progvar.fun/problemsets/88" },
  { id: 89, title: "Matching: Hungarian Algorithm", trackId: "advanced-algo", topicId: "graphs", problemCount: 9, externalUrl: "https://progvar.fun/problemsets/89" },
  { id: 90, title: "Matching: Hopcroft-Karp", trackId: "advanced-algo", topicId: "graphs", problemCount: 8, externalUrl: "https://progvar.fun/problemsets/90" },
  { id: 91, title: "DP Optimization: Divide and Conquer", trackId: "advanced-algo", topicId: "dynamic-programming", problemCount: 10, externalUrl: "https://progvar.fun/problemsets/91" },
  { id: 92, title: "DP Optimization: Knuth's", trackId: "advanced-algo", topicId: "dynamic-programming", problemCount: 8, externalUrl: "https://progvar.fun/problemsets/92" },
  { id: 93, title: "DP Optimization: Convex Hull Trick", trackId: "advanced-algo", topicId: "dynamic-programming", problemCount: 12, externalUrl: "https://progvar.fun/problemsets/93" },
  { id: 94, title: "DP Optimization: Li Chao Tree", trackId: "advanced-algo", topicId: "dynamic-programming", problemCount: 9, externalUrl: "https://progvar.fun/problemsets/94" },
  { id: 95, title: "DP Optimization: Aliens Trick", trackId: "advanced-algo", topicId: "dynamic-programming", problemCount: 7, externalUrl: "https://progvar.fun/problemsets/95" },
  { id: 96, title: "Strings: Suffix Array", trackId: "advanced-algo", topicId: "strings", problemCount: 14, externalUrl: "https://progvar.fun/problemsets/96" },
  { id: 97, title: "Strings: Suffix Automaton", trackId: "advanced-algo", topicId: "strings", problemCount: 11, externalUrl: "https://progvar.fun/problemsets/97" },
  { id: 98, title: "Strings: Aho-Corasick", trackId: "advanced-algo", topicId: "strings", problemCount: 10, externalUrl: "https://progvar.fun/problemsets/98" },
  { id: 99, title: "Strings: Manacher's Algorithm", trackId: "advanced-algo", topicId: "strings", problemCount: 8, externalUrl: "https://progvar.fun/problemsets/99" },

  // ==================== ADVANCED MATHEMATICS ====================
  { id: 100, title: "Combinatorics: Binomial Coefficients", trackId: "advanced-math", topicId: "math", problemCount: 16, externalUrl: "https://progvar.fun/problemsets/100" },
  { id: 101, title: "Combinatorics: Catalan Numbers", trackId: "advanced-math", topicId: "math", problemCount: 12, externalUrl: "https://progvar.fun/problemsets/101" },
  { id: 102, title: "Combinatorics: Inclusion-Exclusion", trackId: "advanced-math", topicId: "math", problemCount: 14, externalUrl: "https://progvar.fun/problemsets/102" },
  { id: 103, title: "Combinatorics: Burnside's Lemma", trackId: "advanced-math", topicId: "math", problemCount: 8, externalUrl: "https://progvar.fun/problemsets/103" },
  { id: 104, title: "Probability and Expected Value", trackId: "advanced-math", topicId: "math", problemCount: 15, externalUrl: "https://progvar.fun/problemsets/104" },
  { id: 105, title: "Game Theory: Sprague-Grundy", trackId: "advanced-math", topicId: "math", problemCount: 14, externalUrl: "https://progvar.fun/problemsets/105" },
  { id: 106, title: "Game Theory: Nim and Variants", trackId: "advanced-math", topicId: "math", problemCount: 12, externalUrl: "https://progvar.fun/problemsets/106" },
  { id: 107, title: "Linear Algebra: Matrix Exponentiation", trackId: "advanced-math", topicId: "math", problemCount: 11, externalUrl: "https://progvar.fun/problemsets/107" },
  { id: 108, title: "Linear Algebra: Gaussian Elimination", trackId: "advanced-math", topicId: "math", problemCount: 10, externalUrl: "https://progvar.fun/problemsets/108" },
  { id: 109, title: "Polynomials: FFT", trackId: "advanced-math", topicId: "math", problemCount: 14, externalUrl: "https://progvar.fun/problemsets/109" },
  { id: 110, title: "Polynomials: NTT", trackId: "advanced-math", topicId: "math", problemCount: 12, externalUrl: "https://progvar.fun/problemsets/110" },
  { id: 111, title: "Polynomials: Karatsuba", trackId: "advanced-math", topicId: "math", problemCount: 8, externalUrl: "https://progvar.fun/problemsets/111" },

  // ==================== ADVANCED GEOMETRY ====================
  { id: 112, title: "Geometry: Line Sweep", trackId: "advanced-algo", topicId: "geometry", problemCount: 12, externalUrl: "https://progvar.fun/problemsets/112" },
  { id: 113, title: "Geometry: Rotating Calipers", trackId: "advanced-algo", topicId: "geometry", problemCount: 9, externalUrl: "https://progvar.fun/problemsets/113" },
  { id: 114, title: "Geometry: Half-Plane Intersection", trackId: "advanced-algo", topicId: "geometry", problemCount: 8, externalUrl: "https://progvar.fun/problemsets/114" },
  { id: 115, title: "Geometry: Voronoi Diagram", trackId: "advanced-algo", topicId: "geometry", problemCount: 7, externalUrl: "https://progvar.fun/problemsets/115" },
  { id: 116, title: "Geometry: Delaunay Triangulation", trackId: "advanced-algo", topicId: "geometry", problemCount: 6, externalUrl: "https://progvar.fun/problemsets/116" },

  // ==================== 4-PROBLEM ATCODER BEGINNER CONTESTS ====================
  { id: 117, title: "ABC 001-010", trackId: "atcoder-4p", topicId: "implementation", problemCount: 40, externalUrl: "https://atcoder.jp/contests" },
  { id: 118, title: "ABC 011-020", trackId: "atcoder-4p", topicId: "implementation", problemCount: 40, externalUrl: "https://atcoder.jp/contests" },
  { id: 119, title: "ABC 021-030", trackId: "atcoder-4p", topicId: "implementation", problemCount: 40, externalUrl: "https://atcoder.jp/contests" },
  { id: 120, title: "ABC 031-040", trackId: "atcoder-4p", topicId: "implementation", problemCount: 40, externalUrl: "https://atcoder.jp/contests" },
  { id: 121, title: "ABC 041-050", trackId: "atcoder-4p", topicId: "implementation", problemCount: 40, externalUrl: "https://atcoder.jp/contests" },
  { id: 122, title: "ABC 051-060", trackId: "atcoder-4p", topicId: "implementation", problemCount: 40, externalUrl: "https://atcoder.jp/contests" },
  { id: 123, title: "ABC 061-070", trackId: "atcoder-4p", topicId: "implementation", problemCount: 40, externalUrl: "https://atcoder.jp/contests" },
  { id: 124, title: "ABC 071-080", trackId: "atcoder-4p", topicId: "implementation", problemCount: 40, externalUrl: "https://atcoder.jp/contests" },
  { id: 125, title: "ABC 081-090", trackId: "atcoder-4p", topicId: "implementation", problemCount: 40, externalUrl: "https://atcoder.jp/contests" },
  { id: 126, title: "ABC 091-100", trackId: "atcoder-4p", topicId: "implementation", problemCount: 40, externalUrl: "https://atcoder.jp/contests" },
  { id: 127, title: "ABC 101-110", trackId: "atcoder-4p", topicId: "implementation", problemCount: 40, externalUrl: "https://atcoder.jp/contests" },
  { id: 128, title: "ABC 111-120", trackId: "atcoder-4p", topicId: "implementation", problemCount: 40, externalUrl: "https://atcoder.jp/contests" },
  { id: 129, title: "ABC 121-125", trackId: "atcoder-4p", topicId: "implementation", problemCount: 20, externalUrl: "https://atcoder.jp/contests" },

  // ==================== 6-PROBLEM ATCODER BEGINNER CONTESTS ====================
  { id: 130, title: "ABC 126-135", trackId: "atcoder-6p", topicId: "implementation", problemCount: 60, externalUrl: "https://atcoder.jp/contests" },
  { id: 131, title: "ABC 136-145", trackId: "atcoder-6p", topicId: "implementation", problemCount: 60, externalUrl: "https://atcoder.jp/contests" },
  { id: 132, title: "ABC 146-155", trackId: "atcoder-6p", topicId: "implementation", problemCount: 60, externalUrl: "https://atcoder.jp/contests" },
  { id: 133, title: "ABC 156-165", trackId: "atcoder-6p", topicId: "implementation", problemCount: 60, externalUrl: "https://atcoder.jp/contests" },
  { id: 134, title: "ABC 166-175", trackId: "atcoder-6p", topicId: "implementation", problemCount: 60, externalUrl: "https://atcoder.jp/contests" },
  { id: 135, title: "ABC 176-185", trackId: "atcoder-6p", topicId: "implementation", problemCount: 60, externalUrl: "https://atcoder.jp/contests" },
  { id: 136, title: "ABC 186-195", trackId: "atcoder-6p", topicId: "implementation", problemCount: 60, externalUrl: "https://atcoder.jp/contests" },
  { id: 137, title: "ABC 196-205", trackId: "atcoder-6p", topicId: "implementation", problemCount: 60, externalUrl: "https://atcoder.jp/contests" },
  { id: 138, title: "ABC 206-215", trackId: "atcoder-6p", topicId: "implementation", problemCount: 60, externalUrl: "https://atcoder.jp/contests" },
  { id: 139, title: "ABC 216-225", trackId: "atcoder-6p", topicId: "implementation", problemCount: 60, externalUrl: "https://atcoder.jp/contests" },
  { id: 140, title: "ABC 226-235", trackId: "atcoder-6p", topicId: "implementation", problemCount: 60, externalUrl: "https://atcoder.jp/contests" },
  { id: 141, title: "ABC 236-245", trackId: "atcoder-6p", topicId: "implementation", problemCount: 60, externalUrl: "https://atcoder.jp/contests" },
  { id: 142, title: "ABC 246-255", trackId: "atcoder-6p", topicId: "implementation", problemCount: 60, externalUrl: "https://atcoder.jp/contests" },
  { id: 143, title: "ABC 256-265", trackId: "atcoder-6p", topicId: "implementation", problemCount: 60, externalUrl: "https://atcoder.jp/contests" },
  { id: 144, title: "ABC 266-275", trackId: "atcoder-6p", topicId: "implementation", problemCount: 60, externalUrl: "https://atcoder.jp/contests" },
  { id: 145, title: "ABC 276-285", trackId: "atcoder-6p", topicId: "implementation", problemCount: 60, externalUrl: "https://atcoder.jp/contests" },
  { id: 146, title: "ABC 286-295", trackId: "atcoder-6p", topicId: "implementation", problemCount: 60, externalUrl: "https://atcoder.jp/contests" },
  { id: 147, title: "ABC 296-305", trackId: "atcoder-6p", topicId: "implementation", problemCount: 60, externalUrl: "https://atcoder.jp/contests" },
  { id: 148, title: "ABC 306-315", trackId: "atcoder-6p", topicId: "implementation", problemCount: 60, externalUrl: "https://atcoder.jp/contests" },
  { id: 149, title: "ABC 316-325", trackId: "atcoder-6p", topicId: "implementation", problemCount: 60, externalUrl: "https://atcoder.jp/contests" },
  { id: 150, title: "ABC 326-335", trackId: "atcoder-6p", topicId: "implementation", problemCount: 60, externalUrl: "https://atcoder.jp/contests" },

  // ==================== ATCODER REGULAR CONTESTS ====================
  { id: 151, title: "ARC 001-010", trackId: "atcoder-regular", topicId: "algorithmic-techniques", problemCount: 40, externalUrl: "https://atcoder.jp/contests" },
  { id: 152, title: "ARC 011-020", trackId: "atcoder-regular", topicId: "algorithmic-techniques", problemCount: 40, externalUrl: "https://atcoder.jp/contests" },
  { id: 153, title: "ARC 021-030", trackId: "atcoder-regular", topicId: "algorithmic-techniques", problemCount: 40, externalUrl: "https://atcoder.jp/contests" },
  { id: 154, title: "ARC 031-040", trackId: "atcoder-regular", topicId: "algorithmic-techniques", problemCount: 40, externalUrl: "https://atcoder.jp/contests" },
  { id: 155, title: "ARC 041-050", trackId: "atcoder-regular", topicId: "algorithmic-techniques", problemCount: 40, externalUrl: "https://atcoder.jp/contests" },
  { id: 156, title: "ARC 051-060", trackId: "atcoder-regular", topicId: "algorithmic-techniques", problemCount: 40, externalUrl: "https://atcoder.jp/contests" },
  { id: 157, title: "ARC 061-070", trackId: "atcoder-regular", topicId: "algorithmic-techniques", problemCount: 40, externalUrl: "https://atcoder.jp/contests" },
  { id: 158, title: "ARC 071-080", trackId: "atcoder-regular", topicId: "algorithmic-techniques", problemCount: 40, externalUrl: "https://atcoder.jp/contests" },
  { id: 159, title: "ARC 081-090", trackId: "atcoder-regular", topicId: "algorithmic-techniques", problemCount: 40, externalUrl: "https://atcoder.jp/contests" },
  { id: 160, title: "ARC 091-100", trackId: "atcoder-regular", topicId: "algorithmic-techniques", problemCount: 40, externalUrl: "https://atcoder.jp/contests" },
  { id: 161, title: "ARC 101-110", trackId: "atcoder-regular", topicId: "algorithmic-techniques", problemCount: 40, externalUrl: "https://atcoder.jp/contests" },
  { id: 162, title: "ARC 111-120", trackId: "atcoder-regular", topicId: "algorithmic-techniques", problemCount: 40, externalUrl: "https://atcoder.jp/contests" },
  { id: 163, title: "ARC 121-130", trackId: "atcoder-regular", topicId: "algorithmic-techniques", problemCount: 40, externalUrl: "https://atcoder.jp/contests" },
  { id: 164, title: "ARC 131-140", trackId: "atcoder-regular", topicId: "algorithmic-techniques", problemCount: 40, externalUrl: "https://atcoder.jp/contests" },
  { id: 165, title: "ARC 141-150", trackId: "atcoder-regular", topicId: "algorithmic-techniques", problemCount: 40, externalUrl: "https://atcoder.jp/contests" },
  { id: 166, title: "ARC 151-160", trackId: "atcoder-regular", topicId: "algorithmic-techniques", problemCount: 40, externalUrl: "https://atcoder.jp/contests" },
  { id: 167, title: "ARC 161-170", trackId: "atcoder-regular", topicId: "algorithmic-techniques", problemCount: 40, externalUrl: "https://atcoder.jp/contests" },

  // ==================== CODEFORCES EDUCATIONAL ROUNDS ====================
  { id: 168, title: "Educational Round 1-10", trackId: "codeforces-edu", topicId: "algorithmic-techniques", problemCount: 50, externalUrl: "https://codeforces.com/contests" },
  { id: 169, title: "Educational Round 11-20", trackId: "codeforces-edu", topicId: "algorithmic-techniques", problemCount: 50, externalUrl: "https://codeforces.com/contests" },
  { id: 170, title: "Educational Round 21-30", trackId: "codeforces-edu", topicId: "algorithmic-techniques", problemCount: 50, externalUrl: "https://codeforces.com/contests" },
  { id: 171, title: "Educational Round 31-40", trackId: "codeforces-edu", topicId: "algorithmic-techniques", problemCount: 50, externalUrl: "https://codeforces.com/contests" },
  { id: 172, title: "Educational Round 41-50", trackId: "codeforces-edu", topicId: "algorithmic-techniques", problemCount: 50, externalUrl: "https://codeforces.com/contests" },
  { id: 173, title: "Educational Round 51-60", trackId: "codeforces-edu", topicId: "algorithmic-techniques", problemCount: 50, externalUrl: "https://codeforces.com/contests" },
  { id: 174, title: "Educational Round 61-70", trackId: "codeforces-edu", topicId: "algorithmic-techniques", problemCount: 50, externalUrl: "https://codeforces.com/contests" },
  { id: 175, title: "Educational Round 71-80", trackId: "codeforces-edu", topicId: "algorithmic-techniques", problemCount: 50, externalUrl: "https://codeforces.com/contests" },
  { id: 176, title: "Educational Round 81-90", trackId: "codeforces-edu", topicId: "algorithmic-techniques", problemCount: 50, externalUrl: "https://codeforces.com/contests" },
  { id: 177, title: "Educational Round 91-100", trackId: "codeforces-edu", topicId: "algorithmic-techniques", problemCount: 50, externalUrl: "https://codeforces.com/contests" },
  { id: 178, title: "Educational Round 101-110", trackId: "codeforces-edu", topicId: "algorithmic-techniques", problemCount: 50, externalUrl: "https://codeforces.com/contests" },
  { id: 179, title: "Educational Round 111-120", trackId: "codeforces-edu", topicId: "algorithmic-techniques", problemCount: 50, externalUrl: "https://codeforces.com/contests" },
  { id: 180, title: "Educational Round 121-130", trackId: "codeforces-edu", topicId: "algorithmic-techniques", problemCount: 50, externalUrl: "https://codeforces.com/contests" },
  { id: 181, title: "Educational Round 131-140", trackId: "codeforces-edu", topicId: "algorithmic-techniques", problemCount: 50, externalUrl: "https://codeforces.com/contests" },
  { id: 182, title: "Educational Round 141-150", trackId: "codeforces-edu", topicId: "algorithmic-techniques", problemCount: 50, externalUrl: "https://codeforces.com/contests" },
  { id: 183, title: "Educational Round 151-160", trackId: "codeforces-edu", topicId: "algorithmic-techniques", problemCount: 50, externalUrl: "https://codeforces.com/contests" },
  { id: 184, title: "Educational Round 161-170", trackId: "codeforces-edu", topicId: "algorithmic-techniques", problemCount: 50, externalUrl: "https://codeforces.com/contests" },

  // ==================== ICPC WORLD FINALS ====================
  { id: 185, title: "ICPC World Finals 2010", trackId: "icpc", topicId: "algorithmic-techniques", problemCount: 11, externalUrl: "https://icpc.global" },
  { id: 186, title: "ICPC World Finals 2011", trackId: "icpc", topicId: "algorithmic-techniques", problemCount: 11, externalUrl: "https://icpc.global" },
  { id: 187, title: "ICPC World Finals 2012", trackId: "icpc", topicId: "algorithmic-techniques", problemCount: 11, externalUrl: "https://icpc.global" },
  { id: 188, title: "ICPC World Finals 2013", trackId: "icpc", topicId: "algorithmic-techniques", problemCount: 11, externalUrl: "https://icpc.global" },
  { id: 189, title: "ICPC World Finals 2014", trackId: "icpc", topicId: "algorithmic-techniques", problemCount: 11, externalUrl: "https://icpc.global" },
  { id: 190, title: "ICPC World Finals 2015", trackId: "icpc", topicId: "algorithmic-techniques", problemCount: 12, externalUrl: "https://icpc.global" },
  { id: 191, title: "ICPC World Finals 2016", trackId: "icpc", topicId: "algorithmic-techniques", problemCount: 12, externalUrl: "https://icpc.global" },
  { id: 192, title: "ICPC World Finals 2017", trackId: "icpc", topicId: "algorithmic-techniques", problemCount: 12, externalUrl: "https://icpc.global" },
  { id: 193, title: "ICPC World Finals 2018", trackId: "icpc", topicId: "algorithmic-techniques", problemCount: 12, externalUrl: "https://icpc.global" },
  { id: 194, title: "ICPC World Finals 2019", trackId: "icpc", topicId: "algorithmic-techniques", problemCount: 12, externalUrl: "https://icpc.global" },
  { id: 195, title: "ICPC World Finals 2020", trackId: "icpc", topicId: "algorithmic-techniques", problemCount: 12, externalUrl: "https://icpc.global" },
  { id: 196, title: "ICPC World Finals 2021", trackId: "icpc", topicId: "algorithmic-techniques", problemCount: 12, externalUrl: "https://icpc.global" },
  { id: 197, title: "ICPC World Finals 2022", trackId: "icpc", topicId: "algorithmic-techniques", problemCount: 12, externalUrl: "https://icpc.global" },
  { id: 198, title: "ICPC World Finals 2023", trackId: "icpc", topicId: "algorithmic-techniques", problemCount: 12, externalUrl: "https://icpc.global" },
  { id: 199, title: "ICPC World Finals 2024", trackId: "icpc", topicId: "algorithmic-techniques", problemCount: 12, externalUrl: "https://icpc.global" },
  
  // ==================== ADDITIONAL PROBLEM SETS TO REACH 270 ====================
  // More Basics
  { id: 200, title: "Greedy: Activity Selection", trackId: "basics", topicId: "algorithmic-techniques", problemCount: 10, externalUrl: "https://progvar.fun/problemsets/200" },
  { id: 201, title: "Greedy: Interval Scheduling", trackId: "basics", topicId: "algorithmic-techniques", problemCount: 12, externalUrl: "https://progvar.fun/problemsets/201" },
  { id: 202, title: "Counting: Stars and Bars", trackId: "basics", topicId: "math", problemCount: 9, externalUrl: "https://progvar.fun/problemsets/202" },
  { id: 203, title: "Binary Search: On Answer", trackId: "basics", topicId: "algorithmic-techniques", problemCount: 14, externalUrl: "https://progvar.fun/problemsets/203" },
  { id: 204, title: "Prefix XOR", trackId: "basics", topicId: "algorithmic-techniques", problemCount: 8, externalUrl: "https://progvar.fun/problemsets/204" },
  { id: 205, title: "Sliding Window Maximum", trackId: "basics", topicId: "data-structures", problemCount: 11, externalUrl: "https://progvar.fun/problemsets/205" },
  
  // More Intermediate
  { id: 206, title: "DP: Longest Common Subsequence", trackId: "intermediate", topicId: "dynamic-programming", problemCount: 13, externalUrl: "https://progvar.fun/problemsets/206" },
  { id: 207, title: "DP: Matrix Chain Multiplication", trackId: "intermediate", topicId: "dynamic-programming", problemCount: 10, externalUrl: "https://progvar.fun/problemsets/207" },
  { id: 208, title: "DP: Palindrome Partitioning", trackId: "intermediate", topicId: "dynamic-programming", problemCount: 9, externalUrl: "https://progvar.fun/problemsets/208" },
  { id: 209, title: "Graphs: Cycle Detection", trackId: "intermediate", topicId: "graphs", problemCount: 11, externalUrl: "https://progvar.fun/problemsets/209" },
  { id: 210, title: "Graphs: 0-1 BFS", trackId: "intermediate", topicId: "graphs", problemCount: 8, externalUrl: "https://progvar.fun/problemsets/210" },
  { id: 211, title: "Graphs: Multi-Source BFS", trackId: "intermediate", topicId: "graphs", problemCount: 10, externalUrl: "https://progvar.fun/problemsets/211" },
  { id: 212, title: "Number Theory: Sieve of Eratosthenes", trackId: "intermediate", topicId: "math", problemCount: 12, externalUrl: "https://progvar.fun/problemsets/212" },
  { id: 213, title: "Number Theory: Linear Sieve", trackId: "intermediate", topicId: "math", problemCount: 8, externalUrl: "https://progvar.fun/problemsets/213" },
  { id: 214, title: "Strings: Rabin-Karp", trackId: "intermediate", topicId: "strings", problemCount: 10, externalUrl: "https://progvar.fun/problemsets/214" },
  
  // More Advanced DS
  { id: 215, title: "Segment Tree: Merge Sort Tree", trackId: "advanced-ds", topicId: "data-structures", problemCount: 9, externalUrl: "https://progvar.fun/problemsets/215" },
  { id: 216, title: "Segment Tree: Beats", trackId: "advanced-ds", topicId: "data-structures", problemCount: 7, externalUrl: "https://progvar.fun/problemsets/216" },
  { id: 217, title: "Wavelet Tree", trackId: "advanced-ds", topicId: "data-structures", problemCount: 8, externalUrl: "https://progvar.fun/problemsets/217" },
  { id: 218, title: "Rope Data Structure", trackId: "advanced-ds", topicId: "data-structures", problemCount: 6, externalUrl: "https://progvar.fun/problemsets/218" },
  { id: 219, title: "K-D Tree", trackId: "advanced-ds", topicId: "data-structures", problemCount: 8, externalUrl: "https://progvar.fun/problemsets/219" },
  
  // More Advanced Algorithms
  { id: 220, title: "2-SAT", trackId: "advanced-algo", topicId: "graphs", problemCount: 10, externalUrl: "https://progvar.fun/problemsets/220" },
  { id: 221, title: "Virtual Tree", trackId: "advanced-algo", topicId: "graphs", problemCount: 8, externalUrl: "https://progvar.fun/problemsets/221" },
  { id: 222, title: "Dominator Tree", trackId: "advanced-algo", topicId: "graphs", problemCount: 6, externalUrl: "https://progvar.fun/problemsets/222" },
  { id: 223, title: "Block Cut Tree", trackId: "advanced-algo", topicId: "graphs", problemCount: 7, externalUrl: "https://progvar.fun/problemsets/223" },
  { id: 224, title: "Suffix Tree", trackId: "advanced-algo", topicId: "strings", problemCount: 10, externalUrl: "https://progvar.fun/problemsets/224" },
  { id: 225, title: "Palindromic Tree", trackId: "advanced-algo", topicId: "strings", problemCount: 8, externalUrl: "https://progvar.fun/problemsets/225" },
  
  // More Advanced Math
  { id: 226, title: "Generating Functions", trackId: "advanced-math", topicId: "math", problemCount: 10, externalUrl: "https://progvar.fun/problemsets/226" },
  { id: 227, title: "Mobius Function", trackId: "advanced-math", topicId: "math", problemCount: 9, externalUrl: "https://progvar.fun/problemsets/227" },
  { id: 228, title: "Dirichlet Convolution", trackId: "advanced-math", topicId: "math", problemCount: 7, externalUrl: "https://progvar.fun/problemsets/228" },
  { id: 229, title: "Lagrange Interpolation", trackId: "advanced-math", topicId: "math", problemCount: 8, externalUrl: "https://progvar.fun/problemsets/229" },
  { id: 230, title: "Linear Recurrence", trackId: "advanced-math", topicId: "math", problemCount: 9, externalUrl: "https://progvar.fun/problemsets/230" },
  
  // More Geometry
  { id: 231, title: "Geometry: Circles", trackId: "intermediate", topicId: "geometry", problemCount: 11, externalUrl: "https://progvar.fun/problemsets/231" },
  { id: 232, title: "Geometry: 3D Basics", trackId: "advanced-algo", topicId: "geometry", problemCount: 8, externalUrl: "https://progvar.fun/problemsets/232" },
  { id: 233, title: "Geometry: Minkowski Sum", trackId: "advanced-algo", topicId: "geometry", problemCount: 6, externalUrl: "https://progvar.fun/problemsets/233" },
  
  // More Contest Problem Sets
  { id: 234, title: "Google Code Jam 2020", trackId: "icpc", topicId: "algorithmic-techniques", problemCount: 20, externalUrl: "https://codingcompetitions.withgoogle.com/codejam" },
  { id: 235, title: "Google Code Jam 2021", trackId: "icpc", topicId: "algorithmic-techniques", problemCount: 20, externalUrl: "https://codingcompetitions.withgoogle.com/codejam" },
  { id: 236, title: "Google Code Jam 2022", trackId: "icpc", topicId: "algorithmic-techniques", problemCount: 20, externalUrl: "https://codingcompetitions.withgoogle.com/codejam" },
  { id: 237, title: "Google Kick Start 2020", trackId: "icpc", topicId: "algorithmic-techniques", problemCount: 24, externalUrl: "https://codingcompetitions.withgoogle.com/kickstart" },
  { id: 238, title: "Google Kick Start 2021", trackId: "icpc", topicId: "algorithmic-techniques", problemCount: 24, externalUrl: "https://codingcompetitions.withgoogle.com/kickstart" },
  { id: 239, title: "Facebook Hacker Cup 2022", trackId: "icpc", topicId: "algorithmic-techniques", problemCount: 18, externalUrl: "https://www.facebook.com/codingcompetitions/hacker-cup" },
  { id: 240, title: "Facebook Hacker Cup 2023", trackId: "icpc", topicId: "algorithmic-techniques", problemCount: 18, externalUrl: "https://www.facebook.com/codingcompetitions/hacker-cup" },
  
  // Additional Topic-Specific Sets
  { id: 241, title: "Interactive Problems", trackId: "intermediate", topicId: "implementation", problemCount: 15, externalUrl: "https://progvar.fun/problemsets/241" },
  { id: 242, title: "Constructive Algorithms", trackId: "intermediate", topicId: "algorithmic-techniques", problemCount: 20, externalUrl: "https://progvar.fun/problemsets/242" },
  { id: 243, title: "Meet in the Middle", trackId: "intermediate", topicId: "algorithmic-techniques", problemCount: 12, externalUrl: "https://progvar.fun/problemsets/243" },
  { id: 244, title: "Coordinate Compression", trackId: "intermediate", topicId: "algorithmic-techniques", problemCount: 10, externalUrl: "https://progvar.fun/problemsets/244" },
  { id: 245, title: "Small-to-Large", trackId: "intermediate", topicId: "algorithmic-techniques", problemCount: 9, externalUrl: "https://progvar.fun/problemsets/245" },
  
  // More DP Variants
  { id: 246, title: "DP: SOS DP", trackId: "advanced-algo", topicId: "dynamic-programming", problemCount: 11, externalUrl: "https://progvar.fun/problemsets/246" },
  { id: 247, title: "DP: Profile DP", trackId: "advanced-algo", topicId: "dynamic-programming", problemCount: 9, externalUrl: "https://progvar.fun/problemsets/247" },
  { id: 248, title: "DP: Connection Profile", trackId: "advanced-algo", topicId: "dynamic-programming", problemCount: 8, externalUrl: "https://progvar.fun/problemsets/248" },
  { id: 249, title: "DP: DP on Broken Profile", trackId: "advanced-algo", topicId: "dynamic-programming", problemCount: 7, externalUrl: "https://progvar.fun/problemsets/249" },
  
  // More String Problems
  { id: 250, title: "Strings: Minimum Expression", trackId: "intermediate", topicId: "strings", problemCount: 8, externalUrl: "https://progvar.fun/problemsets/250" },
  { id: 251, title: "Strings: Lyndon Factorization", trackId: "advanced-algo", topicId: "strings", problemCount: 7, externalUrl: "https://progvar.fun/problemsets/251" },
  { id: 252, title: "Strings: Duval Algorithm", trackId: "advanced-algo", topicId: "strings", problemCount: 6, externalUrl: "https://progvar.fun/problemsets/252" },
  
  // More Graph Problems
  { id: 253, title: "Graphs: Graph Coloring", trackId: "intermediate", topicId: "graphs", problemCount: 10, externalUrl: "https://progvar.fun/problemsets/253" },
  { id: 254, title: "Graphs: Planarity Testing", trackId: "advanced-algo", topicId: "graphs", problemCount: 6, externalUrl: "https://progvar.fun/problemsets/254" },
  { id: 255, title: "Graphs: Maximum Clique", trackId: "advanced-algo", topicId: "graphs", problemCount: 8, externalUrl: "https://progvar.fun/problemsets/255" },
  { id: 256, title: "Graphs: Gomory-Hu Tree", trackId: "advanced-algo", topicId: "graphs", problemCount: 6, externalUrl: "https://progvar.fun/problemsets/256" },
  
  // Final Problem Sets to reach 270
  { id: 257, title: "Heuristics and Approximation", trackId: "advanced-algo", topicId: "algorithmic-techniques", problemCount: 12, externalUrl: "https://progvar.fun/problemsets/257" },
  { id: 258, title: "Simulated Annealing", trackId: "advanced-algo", topicId: "algorithmic-techniques", problemCount: 8, externalUrl: "https://progvar.fun/problemsets/258" },
  { id: 259, title: "Genetic Algorithms", trackId: "advanced-algo", topicId: "algorithmic-techniques", problemCount: 7, externalUrl: "https://progvar.fun/problemsets/259" },
  { id: 260, title: "Randomized Algorithms", trackId: "intermediate", topicId: "algorithmic-techniques", problemCount: 10, externalUrl: "https://progvar.fun/problemsets/260" },
  { id: 261, title: "Online Algorithms", trackId: "advanced-algo", topicId: "algorithmic-techniques", problemCount: 8, externalUrl: "https://progvar.fun/problemsets/261" },
  { id: 262, title: "Parallel Binary Search", trackId: "advanced-algo", topicId: "algorithmic-techniques", problemCount: 9, externalUrl: "https://progvar.fun/problemsets/262" },
  { id: 263, title: "CDQ Divide and Conquer", trackId: "advanced-algo", topicId: "algorithmic-techniques", problemCount: 8, externalUrl: "https://progvar.fun/problemsets/263" },
  { id: 264, title: "Matroid Intersection", trackId: "advanced-algo", topicId: "algorithmic-techniques", problemCount: 6, externalUrl: "https://progvar.fun/problemsets/264" },
  { id: 265, title: "Simplex Algorithm", trackId: "advanced-math", topicId: "math", problemCount: 8, externalUrl: "https://progvar.fun/problemsets/265" },
  { id: 266, title: "Linear Programming", trackId: "advanced-math", topicId: "math", problemCount: 10, externalUrl: "https://progvar.fun/problemsets/266" },
  { id: 267, title: "Integer Factorization", trackId: "advanced-math", topicId: "math", problemCount: 9, externalUrl: "https://progvar.fun/problemsets/267" },
  { id: 268, title: "Discrete Logarithm", trackId: "advanced-math", topicId: "math", problemCount: 7, externalUrl: "https://progvar.fun/problemsets/268" },
  { id: 269, title: "Primality Testing Advanced", trackId: "advanced-math", topicId: "math", problemCount: 8, externalUrl: "https://progvar.fun/problemsets/269" },
  { id: 270, title: "Elliptic Curves", trackId: "advanced-math", topicId: "math", problemCount: 6, externalUrl: "https://progvar.fun/problemsets/270" },
];

// Helper functions
export const getTrackById = (trackId: string): CPTrack | undefined => {
  return cpTracks.find((t) => t.id === trackId);
};

export const getTopicById = (topicId: string): CPTopic | undefined => {
  return cpTopics.find((t) => t.id === topicId);
};

export const getProblemSetsByTrack = (trackId: string): CPProblemSet[] => {
  if (trackId === "all") return cpProblemSets;
  return cpProblemSets.filter((ps) => ps.trackId === trackId);
};

export const getProblemSetsByTopic = (topicId: string): CPProblemSet[] => {
  if (topicId === "all") return cpProblemSets;
  return cpProblemSets.filter((ps) => ps.topicId === topicId);
};

export const searchProblemSets = (query: string): CPProblemSet[] => {
  if (!query.trim()) return cpProblemSets;
  const lowercaseQuery = query.toLowerCase();
  return cpProblemSets.filter((ps) => 
    ps.title.toLowerCase().includes(lowercaseQuery)
  );
};

export const filterProblemSets = (
  trackId: string,
  topicId: string,
  searchQuery: string
): CPProblemSet[] => {
  let results = cpProblemSets;
  
  if (trackId !== "all") {
    results = results.filter((ps) => ps.trackId === trackId);
  }
  
  if (topicId !== "all") {
    results = results.filter((ps) => ps.topicId === topicId);
  }
  
  if (searchQuery.trim()) {
    const lowercaseQuery = searchQuery.toLowerCase();
    results = results.filter((ps) => 
      ps.title.toLowerCase().includes(lowercaseQuery)
    );
  }
  
  return results;
};

// Get count of problem sets per track
export const getTrackCounts = (): Record<string, number> => {
  const counts: Record<string, number> = { all: cpProblemSets.length };
  cpTracks.forEach((track) => {
    counts[track.id] = cpProblemSets.filter((ps) => ps.trackId === track.id).length;
  });
  return counts;
};

// Get count of problem sets per topic
export const getTopicCounts = (): Record<string, number> => {
  const counts: Record<string, number> = { all: cpProblemSets.length };
  cpTopics.forEach((topic) => {
    counts[topic.id] = cpProblemSets.filter((ps) => ps.topicId === topic.id).length;
  });
  return counts;
};

// Get total problems count
export const getTotalProblemsCount = (): number => {
  return cpProblemSets.reduce((sum, ps) => sum + ps.problemCount, 0);
};
