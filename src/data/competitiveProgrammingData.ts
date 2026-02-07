// Competitive Programming Data

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
  { id: "preliminaries", name: "Preliminaries", color: "bg-teal-500/20 text-teal-600 dark:text-teal-400" },
  { id: "basics", name: "Basics", color: "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400" },
  { id: "intermediate", name: "Intermediate", color: "bg-cyan-500/20 text-cyan-600 dark:text-cyan-400" },
  { id: "advanced-ds", name: "Advanced Data Structures", color: "bg-blue-500/20 text-blue-600 dark:text-blue-400" },
  { id: "advanced-algo", name: "Advanced Algorithms", color: "bg-indigo-500/20 text-indigo-600 dark:text-indigo-400" },
  { id: "advanced-math", name: "Advanced Mathematics", color: "bg-violet-500/20 text-violet-600 dark:text-violet-400" },
  { id: "atcoder-beginner", name: "AtCoder Beginner", color: "bg-green-500/20 text-green-600 dark:text-green-400" },
  { id: "atcoder-regular", name: "AtCoder Regular", color: "bg-amber-500/20 text-amber-600 dark:text-amber-400" },
  { id: "codeforces-edu", name: "Codeforces Educational", color: "bg-orange-500/20 text-orange-600 dark:text-orange-400" },
  { id: "icpc", name: "ICPC World Finals", color: "bg-red-500/20 text-red-600 dark:text-red-400" },
];

// Topics for categorizing problem sets
export const cpTopics: CPTopic[] = [
  { id: "algorithmic-techniques", name: "Algorithmic Techniques" },
  { id: "data-structures", name: "Data Structures" },
  { id: "dynamic-programming", name: "Dynamic Programming" },
  { id: "geometry", name: "Geometry" },
  { id: "graphs", name: "Graphs" },
  { id: "implementation", name: "Implementation" },
  { id: "math", name: "Math" },
  { id: "strings", name: "Strings" },
  { id: "trees", name: "Trees" },
  { id: "number-theory", name: "Number Theory" },
  { id: "greedy", name: "Greedy" },
  { id: "binary-search", name: "Binary Search" },
];

// Problem sets data
export const cpProblemSets: CPProblemSet[] = [
  // Preliminaries Track
  { id: 1, title: "Language Basics", trackId: "preliminaries", topicId: "implementation", problemCount: 12 },
  { id: 2, title: "Input/Output Practice", trackId: "preliminaries", topicId: "implementation", problemCount: 8 },
  { id: 3, title: "Array Fundamentals", trackId: "preliminaries", topicId: "data-structures", problemCount: 15 },
  { id: 4, title: "String Basics", trackId: "preliminaries", topicId: "strings", problemCount: 10 },
  { id: 5, title: "Math Basics", trackId: "preliminaries", topicId: "math", problemCount: 14 },

  // Basics Track
  { id: 6, title: "Sorting Algorithms", trackId: "basics", topicId: "algorithmic-techniques", problemCount: 16 },
  { id: 7, title: "Searching Techniques", trackId: "basics", topicId: "binary-search", problemCount: 12 },
  { id: 8, title: "Two Pointers", trackId: "basics", topicId: "algorithmic-techniques", problemCount: 18 },
  { id: 9, title: "Prefix Sum", trackId: "basics", topicId: "algorithmic-techniques", problemCount: 10 },
  { id: 10, title: "Sliding Window", trackId: "basics", topicId: "algorithmic-techniques", problemCount: 14 },
  { id: 11, title: "Basic Recursion", trackId: "basics", topicId: "algorithmic-techniques", problemCount: 12 },
  { id: 12, title: "Stacks and Queues", trackId: "basics", topicId: "data-structures", problemCount: 16 },
  { id: 13, title: "Linked Lists", trackId: "basics", topicId: "data-structures", problemCount: 14 },
  { id: 14, title: "Greedy Basics", trackId: "basics", topicId: "greedy", problemCount: 15 },

  // Intermediate Track
  { id: 15, title: "Binary Search Advanced", trackId: "intermediate", topicId: "binary-search", problemCount: 20 },
  { id: 16, title: "BFS/DFS Fundamentals", trackId: "intermediate", topicId: "graphs", problemCount: 18 },
  { id: 17, title: "Graph Traversal", trackId: "intermediate", topicId: "graphs", problemCount: 16 },
  { id: 18, title: "Tree Basics", trackId: "intermediate", topicId: "trees", problemCount: 15 },
  { id: 19, title: "Binary Trees", trackId: "intermediate", topicId: "trees", problemCount: 18 },
  { id: 20, title: "DP Introduction", trackId: "intermediate", topicId: "dynamic-programming", problemCount: 20 },
  { id: 21, title: "1D DP Problems", trackId: "intermediate", topicId: "dynamic-programming", problemCount: 22 },
  { id: 22, title: "2D DP Problems", trackId: "intermediate", topicId: "dynamic-programming", problemCount: 18 },
  { id: 23, title: "Bit Manipulation", trackId: "intermediate", topicId: "algorithmic-techniques", problemCount: 16 },
  { id: 24, title: "Number Theory Basics", trackId: "intermediate", topicId: "number-theory", problemCount: 14 },
  { id: 25, title: "Modular Arithmetic", trackId: "intermediate", topicId: "number-theory", problemCount: 12 },
  { id: 26, title: "String Algorithms", trackId: "intermediate", topicId: "strings", problemCount: 15 },

  // Advanced Data Structures Track
  { id: 27, title: "Segment Trees", trackId: "advanced-ds", topicId: "data-structures", problemCount: 20 },
  { id: 28, title: "Lazy Propagation", trackId: "advanced-ds", topicId: "data-structures", problemCount: 15 },
  { id: 29, title: "Fenwick Tree / BIT", trackId: "advanced-ds", topicId: "data-structures", problemCount: 14 },
  { id: 30, title: "Sparse Table", trackId: "advanced-ds", topicId: "data-structures", problemCount: 10 },
  { id: 31, title: "Disjoint Set Union", trackId: "advanced-ds", topicId: "data-structures", problemCount: 16 },
  { id: 32, title: "Trie", trackId: "advanced-ds", topicId: "data-structures", problemCount: 12 },
  { id: 33, title: "Heavy-Light Decomposition", trackId: "advanced-ds", topicId: "trees", problemCount: 10 },
  { id: 34, title: "Centroid Decomposition", trackId: "advanced-ds", topicId: "trees", problemCount: 8 },
  { id: 35, title: "Persistent Data Structures", trackId: "advanced-ds", topicId: "data-structures", problemCount: 12 },

  // Advanced Algorithms Track
  { id: 36, title: "Shortest Paths", trackId: "advanced-algo", topicId: "graphs", problemCount: 18 },
  { id: 37, title: "Minimum Spanning Tree", trackId: "advanced-algo", topicId: "graphs", problemCount: 12 },
  { id: 38, title: "Network Flow", trackId: "advanced-algo", topicId: "graphs", problemCount: 15 },
  { id: 39, title: "Strongly Connected Components", trackId: "advanced-algo", topicId: "graphs", problemCount: 10 },
  { id: 40, title: "Topological Sort", trackId: "advanced-algo", topicId: "graphs", problemCount: 8 },
  { id: 41, title: "DP on Trees", trackId: "advanced-algo", topicId: "dynamic-programming", problemCount: 16 },
  { id: 42, title: "DP with Bitmask", trackId: "advanced-algo", topicId: "dynamic-programming", problemCount: 14 },
  { id: 43, title: "Divide and Conquer DP", trackId: "advanced-algo", topicId: "dynamic-programming", problemCount: 10 },
  { id: 44, title: "Convex Hull Trick", trackId: "advanced-algo", topicId: "dynamic-programming", problemCount: 8 },
  { id: 45, title: "String Matching (KMP, Z)", trackId: "advanced-algo", topicId: "strings", problemCount: 12 },
  { id: 46, title: "Suffix Array & LCP", trackId: "advanced-algo", topicId: "strings", problemCount: 10 },

  // Advanced Mathematics Track
  { id: 47, title: "Combinatorics", trackId: "advanced-math", topicId: "math", problemCount: 18 },
  { id: 48, title: "Probability", trackId: "advanced-math", topicId: "math", problemCount: 12 },
  { id: 49, title: "Game Theory", trackId: "advanced-math", topicId: "math", problemCount: 14 },
  { id: 50, title: "Matrix Exponentiation", trackId: "advanced-math", topicId: "math", problemCount: 10 },
  { id: 51, title: "FFT / NTT", trackId: "advanced-math", topicId: "math", problemCount: 12 },
  { id: 52, title: "Polynomial Operations", trackId: "advanced-math", topicId: "math", problemCount: 8 },

  // Geometry Track
  { id: 53, title: "Basic Geometry", trackId: "intermediate", topicId: "geometry", problemCount: 15 },
  { id: 54, title: "Convex Hull", trackId: "advanced-algo", topicId: "geometry", problemCount: 10 },
  { id: 55, title: "Line Sweep", trackId: "advanced-algo", topicId: "geometry", problemCount: 12 },
  { id: 56, title: "Computational Geometry", trackId: "advanced-math", topicId: "geometry", problemCount: 16 },

  // AtCoder Beginner Track
  { id: 57, title: "ABC 300-310 Problems", trackId: "atcoder-beginner", topicId: "implementation", problemCount: 40 },
  { id: 58, title: "ABC 310-320 Problems", trackId: "atcoder-beginner", topicId: "implementation", problemCount: 40 },
  { id: 59, title: "ABC 320-330 Problems", trackId: "atcoder-beginner", topicId: "implementation", problemCount: 40 },
  { id: 60, title: "ABC Easy Problems Collection", trackId: "atcoder-beginner", topicId: "algorithmic-techniques", problemCount: 50 },

  // AtCoder Regular Track
  { id: 61, title: "ARC 150-160 Problems", trackId: "atcoder-regular", topicId: "algorithmic-techniques", problemCount: 30 },
  { id: 62, title: "ARC 160-170 Problems", trackId: "atcoder-regular", topicId: "algorithmic-techniques", problemCount: 30 },
  { id: 63, title: "ARC Hard Collection", trackId: "atcoder-regular", topicId: "dynamic-programming", problemCount: 25 },

  // Codeforces Educational Track
  { id: 64, title: "Educational Round 150-155", trackId: "codeforces-edu", topicId: "algorithmic-techniques", problemCount: 30 },
  { id: 65, title: "Educational Round 155-160", trackId: "codeforces-edu", topicId: "algorithmic-techniques", problemCount: 30 },
  { id: 66, title: "Div 2 A-B Collection", trackId: "codeforces-edu", topicId: "implementation", problemCount: 50 },
  { id: 67, title: "Div 2 C-D Collection", trackId: "codeforces-edu", topicId: "dynamic-programming", problemCount: 40 },

  // ICPC Track
  { id: 68, title: "ICPC Regionals 2023", trackId: "icpc", topicId: "algorithmic-techniques", problemCount: 35 },
  { id: 69, title: "ICPC World Finals 2022", trackId: "icpc", topicId: "algorithmic-techniques", problemCount: 12 },
  { id: 70, title: "ICPC World Finals 2023", trackId: "icpc", topicId: "algorithmic-techniques", problemCount: 12 },
  { id: 71, title: "ICPC Asia Pacific", trackId: "icpc", topicId: "graphs", problemCount: 25 },
  { id: 72, title: "ICPC Latin America", trackId: "icpc", topicId: "dynamic-programming", problemCount: 25 },
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
