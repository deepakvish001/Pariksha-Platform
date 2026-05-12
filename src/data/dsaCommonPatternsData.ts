// Common Patterns catalog for DSA Studio — cloned from the
// dsaanimator-style "🧩 Common Patterns" view. Each pattern groups
// belongs to a higher-level category (Sliding Window, Two Pointers, …)
// and lists problem references with LeetCode URLs.

export interface PatternProblem {
  id: string;            // e.g. "#75" or "GFG"
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  url: string;
}

export interface CommonPattern {
  id: string;
  emoji: string;
  title: string;
  subtitle: string;
  tags: string[];        // small chips: "Array", "String", "Sorted", …
  complexity: string;    // e.g. "O(n) / O(1)"
  description: string;
  problems: PatternProblem[];
  fullPagePath?: string; // route slug for "Full Pattern Page"
}

export interface PatternCategory {
  id: string;
  emoji: string;
  title: string;
  subtitle: string;
  patterns: CommonPattern[];
}

export const COMMON_PATTERNS: PatternCategory[] = [
  {
    id: "sliding",
    emoji: "🪟",
    title: "Sliding Window",
    subtitle: "Maintain a contiguous subarray / substring window",
    patterns: [
      {
        id: "sliding-fixed",
        emoji: "📏",
        title: "Fixed Sliding Window",
        subtitle: "Window of size k, slides one step at a time",
        tags: ["Array", "String"],
        complexity: "O(n) / O(1)",
        description:
          "Build the first window once in O(k), then slide by adding the new right element and subtracting the old left element — O(1) per step, O(n) total.",
        problems: [
          { id: "#643", title: "Max Average Subarray I", difficulty: "Easy", url: "https://leetcode.com/problems/maximum-average-subarray-i/" },
          { id: "#239", title: "Sliding Window Maximum", difficulty: "Hard", url: "https://leetcode.com/problems/sliding-window-maximum/" },
        ],
        fullPagePath: "sliding-window-fixed",
      },
      {
        id: "sliding-dynamic",
        emoji: "↔️",
        title: "Variable (Dynamic) Sliding Window",
        subtitle: "Expand right, shrink left when constraint violated",
        tags: ["Array", "String"],
        complexity: "O(n) / O(k)",
        description:
          "Three-step loop: ① EXPAND right, ② SHRINK left while invalid, ③ UPDATE best. Each element enters and exits at most once → O(n).",
        problems: [
          { id: "#209", title: "Min Size Subarray Sum", difficulty: "Medium", url: "https://leetcode.com/problems/minimum-size-subarray-sum/" },
          { id: "#3", title: "Longest No Repeat", difficulty: "Medium", url: "https://leetcode.com/problems/longest-substring-without-repeating-characters/" },
          { id: "#76", title: "Min Window Substring", difficulty: "Hard", url: "https://leetcode.com/problems/minimum-window-substring/" },
        ],
        fullPagePath: "sliding-window-dynamic",
      },
    ],
  },
  {
    id: "twoptr",
    emoji: "👉",
    title: "Two Pointers",
    subtitle: "One or two index pointers scanning array/string",
    patterns: [
      {
        id: "twoptr-opposite",
        emoji: "⟺",
        title: "Opposite Ends",
        subtitle: "left=0, right=n-1, converge toward center",
        tags: ["Sorted Array", "String"],
        complexity: "O(n) / O(1)",
        description:
          "Start with left=0, right=n-1. Move left right when sum is too small, move right left when sum is too large. Pointers converge until found or they meet.",
        problems: [
          { id: "#167", title: "Two Sum II", difficulty: "Medium", url: "https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/" },
          { id: "#42", title: "Trapping Rain Water", difficulty: "Hard", url: "https://leetcode.com/problems/trapping-rain-water/" },
          { id: "#11", title: "Container With Most Water", difficulty: "Medium", url: "https://leetcode.com/problems/container-with-most-water/" },
        ],
      },
      {
        id: "twoptr-same",
        emoji: "→→",
        title: "Same Direction (Slow/Fast)",
        subtitle: "slow writes valid values, fast scans ahead",
        tags: ["Array", "In-Place"],
        complexity: "O(n) / O(1)",
        description:
          "Slow = write pointer (🐢), fast = scan pointer (🐇). When fast finds a valid element, slow writes it and advances. Duplicates/invalids are silently skipped.",
        problems: [
          { id: "#26", title: "Remove Duplicates", difficulty: "Easy", url: "https://leetcode.com/problems/remove-duplicates-from-sorted-array/" },
          { id: "#283", title: "Move Zeroes", difficulty: "Easy", url: "https://leetcode.com/problems/move-zeroes/" },
          { id: "#80", title: "Remove Dups II", difficulty: "Medium", url: "https://leetcode.com/problems/remove-duplicates-from-sorted-array-ii/" },
        ],
      },
      {
        id: "twoptr-threesum",
        emoji: "🔺",
        title: "Sort + Fix One + Two Pointers",
        subtitle: "Fix first element, use two pointers for remaining sum",
        tags: ["Array", "k-Sum"],
        complexity: "O(n²) / O(1)",
        description:
          "Sort, then fix nums[i] and sweep L=i+1, R=n-1 inward. Sum too small → L++. Sum too large → R--. Match → record triplet, skip duplicates.",
        problems: [
          { id: "#15", title: "3Sum", difficulty: "Medium", url: "https://leetcode.com/problems/3sum/" },
          { id: "#16", title: "3Sum Closest", difficulty: "Medium", url: "https://leetcode.com/problems/3sum-closest/" },
          { id: "#18", title: "4Sum", difficulty: "Medium", url: "https://leetcode.com/problems/4sum/" },
        ],
      },
    ],
  },
  {
    id: "prefix",
    emoji: "➕",
    title: "Prefix Sum & Hashing",
    subtitle: "Precompute cumulative values; HashMap for O(1) lookup",
    patterns: [
      {
        id: "prefix-sum",
        emoji: "∑",
        title: "Prefix Sum Array",
        subtitle: "prefix[i] = sum of nums[0..i-1]",
        tags: ["Array"],
        complexity: "Build O(n) / Query O(1)",
        description:
          "Build prefix[i] = prefix[i-1] + nums[i-1] in O(n). Then any range sum nums[l..r] = prefix[r+1] - prefix[l] in O(1). Pair with HashMap to count subarrays with sum = k.",
        problems: [
          { id: "#1480", title: "Running Sum", difficulty: "Easy", url: "https://leetcode.com/problems/running-sum-of-1d-array/" },
          { id: "#560", title: "Subarray Sum = K", difficulty: "Medium", url: "https://leetcode.com/problems/subarray-sum-equals-k/" },
          { id: "#238", title: "Product Except Self", difficulty: "Medium", url: "https://leetcode.com/problems/product-of-array-except-self/" },
        ],
      },
      {
        id: "hashing-frequency",
        emoji: "🗂",
        title: "Frequency HashMap",
        subtitle: "Count occurrences, detect duplicates, group by key",
        tags: ["HashMap", "HashSet"],
        complexity: "O(n) / O(n)",
        description:
          "Store value→index in a HashMap as you scan. For each nums[i], check if complement (target - nums[i]) exists in seen — O(1) lookup. Enables Two Sum, anagram grouping, frequency counting, consecutive sequences.",
        problems: [
          { id: "#1", title: "Two Sum", difficulty: "Easy", url: "https://leetcode.com/problems/two-sum/" },
          { id: "#49", title: "Group Anagrams", difficulty: "Medium", url: "https://leetcode.com/problems/group-anagrams/" },
          { id: "#128", title: "Longest Consecutive", difficulty: "Medium", url: "https://leetcode.com/problems/longest-consecutive-sequence/" },
        ],
      },
      {
        id: "kadane",
        emoji: "📈",
        title: "Kadane's Algorithm",
        subtitle: "Maximum subarray sum in O(n) — local vs global max",
        tags: ["Array", "DP"],
        complexity: "O(n) / O(1)",
        description:
          "currMax = max(nums[i], currMax + nums[i]) — at each position either extend the current subarray or restart. Track global maxSoFar. Handles all-negative arrays.",
        problems: [
          { id: "#53", title: "Maximum Subarray", difficulty: "Medium", url: "https://leetcode.com/problems/maximum-subarray/" },
          { id: "#121", title: "Best Time Buy/Sell", difficulty: "Easy", url: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock/" },
          { id: "#152", title: "Max Product Subarray", difficulty: "Medium", url: "https://leetcode.com/problems/maximum-product-subarray/" },
        ],
      },
    ],
  },
  {
    id: "bsearch",
    emoji: "🔍",
    title: "Binary Search",
    subtitle: "Halve search space each step — O(log n)",
    patterns: [
      {
        id: "bsearch-classic",
        emoji: "✂️",
        title: "Classic Binary Search",
        subtitle: "Find target / boundary in sorted array",
        tags: ["Sorted Array"],
        complexity: "O(log n) / O(1)",
        description:
          "Maintain lo=0, hi=n−1. Compute mid each step — if nums[mid] < target go right (lo=mid+1), if larger go left (hi=mid−1). Each step eliminates half the array.",
        problems: [
          { id: "#35", title: "Search Insert Position", difficulty: "Easy", url: "https://leetcode.com/problems/search-insert-position/" },
          { id: "#34", title: "First & Last Position", difficulty: "Medium", url: "https://leetcode.com/problems/find-first-and-last-position-of-element-in-sorted-array/" },
          { id: "#162", title: "Find Peak Element", difficulty: "Medium", url: "https://leetcode.com/problems/find-peak-element/" },
          { id: "#33", title: "Search Rotated Array", difficulty: "Medium", url: "https://leetcode.com/problems/search-in-rotated-sorted-array/" },
        ],
      },
      {
        id: "bsearch-on-answer",
        emoji: "🎯",
        title: "Binary Search on Answer",
        subtitle: "Binary search on the value/range, not array index",
        tags: ["Optimization", "Feasibility"],
        complexity: "O(n log k)",
        description:
          "Don't search the array — search the answer range [lo..hi]. Test each mid with isFeasible(mid) in O(n). ✅ feasible → save ans, try smaller. ❌ not feasible → try larger.",
        problems: [
          { id: "#875", title: "Koko Eating Bananas 🍌", difficulty: "Medium", url: "https://leetcode.com/problems/koko-eating-bananas/" },
          { id: "#1011", title: "Capacity to Ship", difficulty: "Medium", url: "https://leetcode.com/problems/capacity-to-ship-packages-within-d-days/" },
          { id: "#410", title: "Split Array Largest Sum", difficulty: "Hard", url: "https://leetcode.com/problems/split-array-largest-sum/" },
        ],
      },
    ],
  },
  {
    id: "stack",
    emoji: "📚",
    title: "Stack Patterns",
    subtitle: "LIFO — simple, monotonic increasing/decreasing",
    patterns: [
      {
        id: "stack-simple",
        emoji: "📥",
        title: "Simple Stack",
        subtitle: "Matching pairs, undo/redo, evaluate expressions",
        tags: ["String", "Expression"],
        complexity: "O(n) / O(n)",
        description:
          "Push opening brackets; when a closing bracket arrives, pop the top and verify it matches. LIFO guarantees correct nesting — most-recently opened must close first.",
        problems: [
          { id: "#20", title: "Valid Parentheses", difficulty: "Easy", url: "https://leetcode.com/problems/valid-parentheses/" },
          { id: "#150", title: "Evaluate RPN", difficulty: "Medium", url: "https://leetcode.com/problems/evaluate-reverse-polish-notation/" },
          { id: "#155", title: "Min Stack", difficulty: "Medium", url: "https://leetcode.com/problems/min-stack/" },
          { id: "#224", title: "Basic Calculator", difficulty: "Hard", url: "https://leetcode.com/problems/basic-calculator/" },
        ],
      },
      {
        id: "stack-monotonic-dec",
        emoji: "📉",
        title: "Monotonic Decreasing Stack",
        subtitle: "Pop when current > top → Next Greater Element",
        tags: ["Next Greater", "Temperatures"],
        complexity: "O(n) amortized",
        description:
          "Maintain indices in decreasing value order. When nums[i] > nums[stack.top()], current index is the Next Greater Element for every index we pop. Each element pushed & popped at most once.",
        problems: [
          { id: "#739", title: "Daily Temperatures 🌡️", difficulty: "Medium", url: "https://leetcode.com/problems/daily-temperatures/" },
          { id: "#496", title: "Next Greater Element I", difficulty: "Easy", url: "https://leetcode.com/problems/next-greater-element-i/" },
          { id: "#503", title: "Next Greater II (circular)", difficulty: "Medium", url: "https://leetcode.com/problems/next-greater-element-ii/" },
        ],
      },
      {
        id: "stack-monotonic-inc",
        emoji: "📊",
        title: "Monotonic Increasing Stack",
        subtitle: "Pop when current < top → largest rectangle",
        tags: ["Histogram", "Rectangle Area"],
        complexity: "O(n) / O(n)",
        description:
          "Maintain indices in increasing height order. When height[i] < height[stack.top()], pop and compute area = height × width. Width = distance to previous smaller bar.",
        problems: [
          { id: "#84", title: "Largest Rectangle Histogram", difficulty: "Hard", url: "https://leetcode.com/problems/largest-rectangle-in-histogram/" },
          { id: "#85", title: "Maximal Rectangle", difficulty: "Hard", url: "https://leetcode.com/problems/maximal-rectangle/" },
          { id: "#42", title: "Trapping Rain Water", difficulty: "Hard", url: "https://leetcode.com/problems/trapping-rain-water/" },
        ],
      },
    ],
  },
  {
    id: "bfs",
    emoji: "🌊",
    title: "BFS / Queue",
    subtitle: "Level-by-level exploration — shortest path on unweighted graphs",
    patterns: [
      {
        id: "bfs-standard",
        emoji: "🔵",
        title: "Standard BFS (Level Order)",
        subtitle: "Process nodes level by level using a queue",
        tags: ["Graph", "Grid"],
        complexity: "O(V+E)",
        description:
          "Enqueue start, mark visited. Snapshot queue size at each outer loop — drain one full level before advancing. First time a node is reached = shortest distance.",
        problems: [
          { id: "#102", title: "Level Order Traversal", difficulty: "Medium", url: "https://leetcode.com/problems/binary-tree-level-order-traversal/" },
          { id: "#200", title: "Number of Islands", difficulty: "Medium", url: "https://leetcode.com/problems/number-of-islands/" },
          { id: "#127", title: "Word Ladder", difficulty: "Hard", url: "https://leetcode.com/problems/word-ladder/" },
          { id: "#133", title: "Clone Graph", difficulty: "Medium", url: "https://leetcode.com/problems/clone-graph/" },
        ],
      },
      {
        id: "bfs-multisource",
        emoji: "🔴",
        title: "Multi-Source BFS",
        subtitle: "Enqueue all sources first — wavefront spreads simultaneously",
        tags: ["Grid", "Min Distance"],
        complexity: "O(R×C)",
        description:
          "Pre-load ALL source cells into the queue before the BFS loop. The wavefront expands from every source simultaneously — each cell records distance to its nearest source in one pass.",
        problems: [
          { id: "#994", title: "Rotting Oranges 🍊", difficulty: "Medium", url: "https://leetcode.com/problems/rotting-oranges/" },
          { id: "#542", title: "01 Matrix", difficulty: "Medium", url: "https://leetcode.com/problems/01-matrix/" },
          { id: "#417", title: "Pacific Atlantic", difficulty: "Medium", url: "https://leetcode.com/problems/pacific-atlantic-water-flow/" },
        ],
      },
    ],
  },
  {
    id: "ll",
    emoji: "🔗",
    title: "Linked List",
    subtitle: "Fast/slow pointers, in-place reversal, merge",
    patterns: [
      {
        id: "ll-fastslow",
        emoji: "🐢🐇",
        title: "Fast / Slow Pointers (Floyd's Cycle)",
        subtitle: "slow moves 1 step, fast moves 2 — detect cycle, find middle",
        tags: ["Cycle", "Middle"],
        complexity: "O(n) / O(1)",
        description:
          "🐢 slow moves 1 step, 🐇 fast moves 2 steps. If there's a cycle they must meet. After meeting, reset slow to head and move both 1 step — they reunite at the cycle start.",
        problems: [
          { id: "#141", title: "Linked List Cycle", difficulty: "Easy", url: "https://leetcode.com/problems/linked-list-cycle/" },
          { id: "#876", title: "Middle of Linked List", difficulty: "Easy", url: "https://leetcode.com/problems/middle-of-the-linked-list/" },
          { id: "#287", title: "Find Duplicate Number", difficulty: "Medium", url: "https://leetcode.com/problems/find-the-duplicate-number/" },
        ],
      },
      {
        id: "ll-reversal",
        emoji: "🔄",
        title: "In-Place List Reversal",
        subtitle: "Reverse entire list or a subrange using prev/curr/next",
        tags: ["In-Place"],
        complexity: "O(n) / O(1)",
        description:
          "Save next → flip curr.next = prev → advance prev = curr → advance curr = next. Each arrow flips one at a time until the whole list is reversed.",
        problems: [
          { id: "#206", title: "Reverse Linked List", difficulty: "Easy", url: "https://leetcode.com/problems/reverse-linked-list/" },
          { id: "#92", title: "Reverse Linked List II", difficulty: "Medium", url: "https://leetcode.com/problems/reverse-linked-list-ii/" },
          { id: "#25", title: "Reverse K Groups", difficulty: "Hard", url: "https://leetcode.com/problems/reverse-nodes-in-k-group/" },
        ],
      },
      {
        id: "ll-merge",
        emoji: "🔀",
        title: "Two-Pointer Merge / Remove Nth",
        subtitle: "Advance fast n+1 steps, then move both — slow lands before target",
        tags: ["Offset", "Merge"],
        complexity: "O(n) / O(1)",
        description:
          "Advance fast n+1 steps ahead of slow. Move both until fast hits null — slow is exactly one node before the target. For merge: compare heads, always pick the smaller one.",
        problems: [
          { id: "#19", title: "Remove Nth Node From End", difficulty: "Medium", url: "https://leetcode.com/problems/remove-nth-node-from-end-of-list/" },
          { id: "#21", title: "Merge Two Sorted Lists", difficulty: "Easy", url: "https://leetcode.com/problems/merge-two-sorted-lists/" },
          { id: "#23", title: "Merge K Sorted Lists", difficulty: "Hard", url: "https://leetcode.com/problems/merge-k-sorted-lists/" },
        ],
      },
    ],
  },
  {
    id: "tree",
    emoji: "🌳",
    title: "Tree Patterns",
    subtitle: "DFS (recursive), BFS (level order), path problems, BST",
    patterns: [
      {
        id: "tree-dfs",
        emoji: "🌿",
        title: "DFS — Pre / In / Post-order Traversal",
        subtitle: "Select traversal order — same tree, three visit timings",
        tags: ["Recursion", "DFS"],
        complexity: "O(n) / O(h)",
        description:
          "One pattern, three timings — move result.add(node.val) to change the order. Pre-order: visit root first. In-order: between subtrees (BST sorted). Post-order: root last (height, diameter).",
        problems: [
          { id: "#104", title: "Max Depth", difficulty: "Easy", url: "https://leetcode.com/problems/maximum-depth-of-binary-tree/" },
          { id: "#543", title: "Diameter", difficulty: "Easy", url: "https://leetcode.com/problems/diameter-of-binary-tree/" },
          { id: "#236", title: "LCA", difficulty: "Medium", url: "https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-tree/" },
        ],
      },
      {
        id: "tree-bfs",
        emoji: "📶",
        title: "BFS — Level Order Traversal",
        subtitle: "Queue; process one full level per outer loop iteration",
        tags: ["Queue", "Level"],
        complexity: "O(n) / O(n)",
        description:
          "Snapshot size = q.size() at the start of each outer loop — that's exactly one level. Poll size nodes, enqueue their children, then store the level. Repeat until queue is empty.",
        problems: [
          { id: "#102", title: "Level Order Traversal", difficulty: "Medium", url: "https://leetcode.com/problems/binary-tree-level-order-traversal/" },
          { id: "#199", title: "Right Side View", difficulty: "Medium", url: "https://leetcode.com/problems/binary-tree-right-side-view/" },
          { id: "#103", title: "Zigzag Level Order", difficulty: "Medium", url: "https://leetcode.com/problems/binary-tree-zigzag-level-order-traversal/" },
        ],
      },
      {
        id: "tree-paths",
        emoji: "🛤",
        title: "Tree Path Problems",
        subtitle: "Root-to-leaf backtracking or any-node max path sum",
        tags: ["Path Sum", "Backtrack"],
        complexity: "O(n) / O(h)",
        description:
          "Two patterns in one: Root-to-leaf — add node, recurse with rem−val, backtrack at return. Max path sum — post-order bottom-up; L + R + node.val is path through this node; return only the better arm upward.",
        problems: [
          { id: "#113", title: "Path Sum II", difficulty: "Medium", url: "https://leetcode.com/problems/path-sum-ii/" },
          { id: "#124", title: "Max Path Sum", difficulty: "Hard", url: "https://leetcode.com/problems/binary-tree-maximum-path-sum/" },
          { id: "#129", title: "Sum Root to Leaf Nums", difficulty: "Medium", url: "https://leetcode.com/problems/sum-root-to-leaf-numbers/" },
        ],
      },
      {
        id: "tree-bst",
        emoji: "🔎",
        title: "BST Operations",
        subtitle: "Exploit left < root < right — validate, search, construct",
        tags: ["BST", "Bounds"],
        complexity: "O(h) / O(h)",
        description:
          "Three operations on one property: Validate — pass (min,max) bounds down. Search — halve the tree each step. Build balanced — pick sorted array midpoint as root, recurse on halves.",
        problems: [
          { id: "#98", title: "Validate BST", difficulty: "Medium", url: "https://leetcode.com/problems/validate-binary-search-tree/" },
          { id: "#108", title: "Sorted Array to BST", difficulty: "Easy", url: "https://leetcode.com/problems/convert-sorted-array-to-binary-search-tree/" },
          { id: "#230", title: "Kth Smallest in BST", difficulty: "Medium", url: "https://leetcode.com/problems/kth-smallest-element-in-a-bst/" },
        ],
      },
    ],
  },
  {
    id: "backtrack",
    emoji: "🌿",
    title: "Backtracking",
    subtitle: "Explore all possibilities; undo choice and try next",
    patterns: [
      {
        id: "backtrack-subsets",
        emoji: "⊂",
        title: "Subsets / Power Set",
        subtitle: "Include or exclude each element — collect at every node",
        tags: ["Choose/Skip"],
        complexity: "O(2ⁿ·n)",
        description:
          "result.add(new ArrayList<>(curr)) at the very start of each call — captures every state including the empty set. Loop from start, add element, recurse with i+1, then remove (backtrack).",
        problems: [
          { id: "#78", title: "Subsets", difficulty: "Medium", url: "https://leetcode.com/problems/subsets/" },
          { id: "#90", title: "Subsets II", difficulty: "Medium", url: "https://leetcode.com/problems/subsets-ii/" },
        ],
      },
      {
        id: "backtrack-perms",
        emoji: "🔀",
        title: "Permutations",
        subtitle: "Use all elements in every order — boolean[] used array",
        tags: ["All Orders"],
        complexity: "O(n!·n)",
        description:
          "boolean[] used prevents re-picking the same element. At each call: try every index where !used[i], mark used, recurse, unmark. Collect only at leaves (curr.size()==n).",
        problems: [
          { id: "#46", title: "Permutations", difficulty: "Medium", url: "https://leetcode.com/problems/permutations/" },
          { id: "#47", title: "Permutations II", difficulty: "Medium", url: "https://leetcode.com/problems/permutations-ii/" },
          { id: "#22", title: "Generate Parens", difficulty: "Medium", url: "https://leetcode.com/problems/generate-parentheses/" },
        ],
      },
      {
        id: "backtrack-combos",
        emoji: "✂️",
        title: "Combinations + Pruning",
        subtitle: "Sort first — break (not continue) when candidate exceeds remain",
        tags: ["Pruning", "Sum Target"],
        complexity: "O(2ᵗ)",
        description:
          "Key insight: sort candidates. If candidates[i] > remain, use break — all subsequent candidates are larger too, so the entire rest of the loop is pruned. Collect when remain==0.",
        problems: [
          { id: "#39", title: "Combination Sum", difficulty: "Medium", url: "https://leetcode.com/problems/combination-sum/" },
          { id: "#77", title: "Combinations", difficulty: "Medium", url: "https://leetcode.com/problems/combinations/" },
          { id: "#51", title: "N-Queens", difficulty: "Hard", url: "https://leetcode.com/problems/n-queens/" },
        ],
      },
    ],
  },
  {
    id: "greedy",
    emoji: "💡",
    title: "Greedy",
    subtitle: "Make locally optimal choice at each step",
    patterns: [
      {
        id: "greedy-intervals",
        emoji: "📅",
        title: "Sort + Greedy / Interval Scheduling",
        subtitle: "Sort by start or end time, then greedily sweep",
        tags: ["Intervals", "Sort"],
        complexity: "O(n log n)",
        description:
          "Min Platforms: sort arrivals & departures separately; two-pointer sweep counts how many overlap at once. Merge Intervals: sort by start, extend last interval when next.start ≤ last.end.",
        problems: [
          { id: "#56", title: "Merge Intervals", difficulty: "Medium", url: "https://leetcode.com/problems/merge-intervals/" },
          { id: "#435", title: "Non-overlapping Intervals", difficulty: "Medium", url: "https://leetcode.com/problems/non-overlapping-intervals/" },
          { id: "#134", title: "Gas Station", difficulty: "Medium", url: "https://leetcode.com/problems/gas-station/" },
        ],
      },
      {
        id: "greedy-jump",
        emoji: "🏃",
        title: "Greedy Reach / Jump Game",
        subtitle: "Track maxReach; at currEnd boundary → must jump",
        tags: ["Array", "Reach"],
        complexity: "O(n) / O(1)",
        description:
          "Jump I: maxReach = max(maxReach, i+nums[i]) — if ever i > maxReach, blocked → false. Jump II: also track currEnd; when i == currEnd, you must jump → jumps++; currEnd = maxReach.",
        problems: [
          { id: "#55", title: "Jump Game", difficulty: "Medium", url: "https://leetcode.com/problems/jump-game/" },
          { id: "#45", title: "Jump Game II", difficulty: "Medium", url: "https://leetcode.com/problems/jump-game-ii/" },
        ],
      },
    ],
  },
  {
    id: "heap",
    emoji: "⛏",
    title: "Heap / Priority Queue",
    subtitle: "Efficiently maintain top-K, median, or K-way merge",
    patterns: [
      {
        id: "heap-topk",
        emoji: "🏆",
        title: "Top K Elements (Min-Heap of size K)",
        subtitle: "Keep min-heap of K; pop if size exceeds K — root = Kth largest",
        tags: ["Min-Heap", "Top K"],
        complexity: "O(n log k) / O(k)",
        description:
          "Maintain a min-heap of exactly K elements. For each new number: offer(num), if size > K then poll() (drops smallest). After scanning all, peek() = Kth largest.",
        problems: [
          { id: "#215", title: "Kth Largest Element", difficulty: "Medium", url: "https://leetcode.com/problems/kth-largest-element-in-an-array/" },
          { id: "#347", title: "Top K Frequent Elements", difficulty: "Medium", url: "https://leetcode.com/problems/top-k-frequent-elements/" },
          { id: "#973", title: "K Closest Points", difficulty: "Medium", url: "https://leetcode.com/problems/k-closest-points-to-origin/" },
          { id: "#1046", title: "Last Stone Weight", difficulty: "Easy", url: "https://leetcode.com/problems/last-stone-weight/" },
        ],
      },
      {
        id: "heap-two",
        emoji: "⚖️",
        title: "Two Heaps (Running Median)",
        subtitle: "max-heap (lower half) + min-heap (upper half), balanced",
        tags: ["Median", "Balance"],
        complexity: "addNum O(log n) / findMedian O(1)",
        description:
          "LO (max-heap) holds lower half, HI (min-heap) holds upper half. Rule: lo.offer(num) → hi.offer(lo.poll()) → if lo.size < hi.size: lo.offer(hi.poll()). Median = lo.peek() or avg of both tops.",
        problems: [
          { id: "#295", title: "Find Median from Data Stream", difficulty: "Hard", url: "https://leetcode.com/problems/find-median-from-data-stream/" },
          { id: "#480", title: "Sliding Window Median", difficulty: "Hard", url: "https://leetcode.com/problems/sliding-window-median/" },
          { id: "#621", title: "Task Scheduler", difficulty: "Medium", url: "https://leetcode.com/problems/task-scheduler/" },
        ],
      },
      {
        id: "heap-kway",
        emoji: "🔀",
        title: "K-Way Merge",
        subtitle: "Min-heap holds current head of each of K sorted lists",
        tags: ["Merge", "K Lists"],
        complexity: "O(n log k) / O(k)",
        description:
          "Push head of each sorted list into a min-heap. Repeat: poll() global minimum → append to result → push node.next from same list. Heap size stays ≤ K at all times.",
        problems: [
          { id: "#23", title: "Merge K Sorted Lists", difficulty: "Hard", url: "https://leetcode.com/problems/merge-k-sorted-lists/" },
          { id: "#378", title: "Kth Smallest in Matrix", difficulty: "Medium", url: "https://leetcode.com/problems/kth-smallest-element-in-a-sorted-matrix/" },
          { id: "#373", title: "K Pairs Smallest Sums", difficulty: "Medium", url: "https://leetcode.com/problems/find-k-pairs-with-smallest-sums/" },
        ],
      },
    ],
  },
  {
    id: "graph",
    emoji: "🕸",
    title: "Graph Algorithms",
    subtitle: "Union-Find, Topo Sort, Dijkstra, Bellman-Ford, Prim's MST",
    patterns: [
      {
        id: "graph-union-find",
        emoji: "🔗",
        title: "Union-Find (Disjoint Set Union)",
        subtitle: "Path compression + union by rank — near O(1) per op",
        tags: ["Connectivity", "Cycle Detect"],
        complexity: "O(α(n)) / O(n)",
        description:
          "Each node starts as its own parent. find(x) returns root with path compression — parent[x] jumps directly to root. union(x,y) merges by rank: smaller tree attaches under larger. Same root = connected.",
        problems: [
          { id: "#1971", title: "Find If Path Exists", difficulty: "Easy", url: "https://leetcode.com/problems/find-if-path-exists-in-graph/" },
          { id: "#547", title: "Number of Provinces", difficulty: "Medium", url: "https://leetcode.com/problems/number-of-provinces/" },
          { id: "#684", title: "Redundant Connection", difficulty: "Medium", url: "https://leetcode.com/problems/redundant-connection/" },
          { id: "#721", title: "Accounts Merge", difficulty: "Medium", url: "https://leetcode.com/problems/accounts-merge/" },
        ],
      },
      {
        id: "graph-topo",
        emoji: "📐",
        title: "Topological Sort (Kahn's BFS)",
        subtitle: "Process nodes with in-degree 0 first — linear ordering of a DAG",
        tags: ["DAG", "Dependencies"],
        complexity: "O(V+E) / O(V)",
        description:
          "Build inDegree[]. Seed queue with all nodes having inDegree=0. BFS: pop node → add to order → decrement neighbors' inDegree; if 0 → enqueue. If order.size() < n → cycle detected.",
        problems: [
          { id: "#207", title: "Course Schedule", difficulty: "Medium", url: "https://leetcode.com/problems/course-schedule/" },
          { id: "#210", title: "Course Schedule II", difficulty: "Medium", url: "https://leetcode.com/problems/course-schedule-ii/" },
          { id: "#269", title: "Alien Dictionary", difficulty: "Hard", url: "https://leetcode.com/problems/alien-dictionary/" },
          { id: "#310", title: "Minimum Height Trees", difficulty: "Medium", url: "https://leetcode.com/problems/minimum-height-trees/" },
        ],
      },
      {
        id: "graph-dijkstra",
        emoji: "🗺",
        title: "Dijkstra's Shortest Path",
        subtitle: "Min-heap greedy — always process the closest unvisited node first",
        tags: ["Weighted Graph", "Non-Negative"],
        complexity: "O((V+E) log V)",
        description:
          "dist[src]=0, all others=∞. Min-heap stores (dist, node). Poll smallest: skip if stale (d > dist[u]), else relax all neighbors. ⚠ Only works for non-negative weights — use Bellman-Ford for negatives.",
        problems: [
          { id: "#743", title: "Network Delay Time", difficulty: "Medium", url: "https://leetcode.com/problems/network-delay-time/" },
          { id: "#1631", title: "Path With Min Effort", difficulty: "Medium", url: "https://leetcode.com/problems/path-with-minimum-effort/" },
          { id: "#778", title: "Swim in Rising Water", difficulty: "Hard", url: "https://leetcode.com/problems/swim-in-rising-water/" },
        ],
      },
      {
        id: "graph-bellman-ford",
        emoji: "✈️",
        title: "Bellman-Ford / K-Stop Shortest Path",
        subtitle: "Relax all edges V−1 times; supports negative weights",
        tags: ["Negative Weights", "K Stops"],
        complexity: "O(V·E) / O(V)",
        description:
          "Run V−1 rounds: each round relaxes all edges. If dist[u]+w < dist[v], update. For K-stop: run K+1 rounds using a snapshot copy of prev dist to prevent chaining in one round.",
        problems: [
          { id: "#787", title: "Cheapest Flights K Stops", difficulty: "Medium", url: "https://leetcode.com/problems/cheapest-flights-within-k-stops/" },
          { id: "#743", title: "Network Delay Time", difficulty: "Medium", url: "https://leetcode.com/problems/network-delay-time/" },
        ],
      },
      {
        id: "graph-prims",
        emoji: "🌐",
        title: "Prim's Minimum Spanning Tree",
        subtitle: "Grow MST greedily — always add cheapest edge to unvisited node",
        tags: ["MST", "Min Cost"],
        complexity: "O(E log V) / O(V+E)",
        description:
          "Start from node 0. Min-heap stores (weight, node). Pop cheapest: if already in MST → skip (stale). Else mark visited, add cost, push all unvisited neighbors. MST has exactly V−1 edges.",
        problems: [
          { id: "#1584", title: "Min Cost to Connect Points", difficulty: "Medium", url: "https://leetcode.com/problems/min-cost-to-connect-all-points/" },
          { id: "#1135", title: "Connecting Cities Min Cost", difficulty: "Medium", url: "https://leetcode.com/problems/connecting-cities-with-minimum-cost/" },
        ],
      },
    ],
  },
  {
    id: "dp",
    emoji: "🎯",
    title: "Dynamic Programming",
    subtitle: "Optimal substructure + overlapping subproblems",
    patterns: [
      {
        id: "dp-1d",
        emoji: "📏",
        title: "1D Linear DP",
        subtitle: "dp[i] depends on dp[i-1], dp[i-2], or dp[i-k]",
        tags: ["Fibonacci", "House Robber"],
        complexity: "O(n) / O(1)",
        description:
          "State depends only on previous 1–2 values. House Robber: dp[i] = max(dp[i-1], dp[i-2]+nums[i]). Decode Ways: count valid decodings. Space O(1) by keeping only last two.",
        problems: [
          { id: "#70", title: "Climbing Stairs", difficulty: "Easy", url: "https://leetcode.com/problems/climbing-stairs/" },
          { id: "#198", title: "House Robber", difficulty: "Medium", url: "https://leetcode.com/problems/house-robber/" },
          { id: "#213", title: "House Robber II", difficulty: "Medium", url: "https://leetcode.com/problems/house-robber-ii/" },
          { id: "#91", title: "Decode Ways", difficulty: "Medium", url: "https://leetcode.com/problems/decode-ways/" },
          { id: "#322", title: "Coin Change", difficulty: "Medium", url: "https://leetcode.com/problems/coin-change/" },
        ],
      },
      {
        id: "dp-2d",
        emoji: "🔲",
        title: "2D Grid DP",
        subtitle: "dp[i][j] depends on dp[i-1][j] and dp[i][j-1]",
        tags: ["Grid", "Paths"],
        complexity: "O(m·n)",
        description:
          "dp[i][j] = paths to (i,j) = from top + from left. Init first row/col = 1. Fill row by row. With obstacles: set dp[i][j]=0 at obstacle.",
        problems: [
          { id: "#62", title: "Unique Paths", difficulty: "Medium", url: "https://leetcode.com/problems/unique-paths/" },
          { id: "#63", title: "Unique Paths II", difficulty: "Medium", url: "https://leetcode.com/problems/unique-paths-ii/" },
          { id: "#120", title: "Triangle", difficulty: "Medium", url: "https://leetcode.com/problems/triangle/" },
        ],
      },
      {
        id: "dp-twoseq",
        emoji: "🔤",
        title: "Two-Sequence DP (LCS / Edit Distance)",
        subtitle: "dp[i][j] = optimal for s1[0..i] and s2[0..j]",
        tags: ["String DP", "LCS"],
        complexity: "O(m·n)",
        description:
          "LCS: if match → dp[i-1][j-1]+1, else max(dp[i-1][j], dp[i][j-1]). Edit Distance: if match → dp[i-1][j-1], else 1 + min(del, ins, replace).",
        problems: [
          { id: "#1143", title: "LCS", difficulty: "Medium", url: "https://leetcode.com/problems/longest-common-subsequence/" },
          { id: "#72", title: "Edit Distance", difficulty: "Hard", url: "https://leetcode.com/problems/edit-distance/" },
        ],
      },
      {
        id: "dp-lis",
        emoji: "📈",
        title: "LIS — Longest Increasing Subsequence",
        subtitle: "O(n²) DP or O(n log n) patience sort",
        tags: ["LIS", "Patience Sort"],
        complexity: "O(n log n)",
        description:
          "Tails[i] = smallest tail of LIS of length i+1. For each num, binary search where it fits; replace or append. Length of tails = LIS length.",
        problems: [
          { id: "#300", title: "Longest Increasing Subsequence", difficulty: "Medium", url: "https://leetcode.com/problems/longest-increasing-subsequence/" },
          { id: "#152", title: "Max Product Subarray", difficulty: "Medium", url: "https://leetcode.com/problems/maximum-product-subarray/" },
        ],
      },
      {
        id: "dp-minmax",
        emoji: "✖️",
        title: "Min/Max DP (Max Product Subarray)",
        subtitle: "Track both min and max at each step for sign flips",
        tags: ["Negatives"],
        complexity: "O(n) / O(1)",
        description:
          "Negative × negative = positive (min can become max). Track both currMin and currMax at each index. At each step: new min/max from (curr, curr×max, curr×min).",
        problems: [
          { id: "#152", title: "Max Product Subarray", difficulty: "Medium", url: "https://leetcode.com/problems/maximum-product-subarray/" },
        ],
      },
    ],
  },
  {
    id: "bit",
    emoji: "⚡",
    title: "Bit Manipulation",
    subtitle: "XOR tricks, bit counting, arithmetic without operators",
    patterns: [
      {
        id: "bit-xor",
        emoji: "⊕",
        title: "XOR Tricks",
        subtitle: "a^a=0, a^0=a — cancel pairs, find unique element",
        tags: ["XOR", "Single Number"],
        complexity: "O(n) / O(1)",
        description:
          "XOR all → pairs cancel. Single unique remains. For two unique: xorAll has bits where they differ; use lowest set bit to split into two groups, XOR each.",
        problems: [
          { id: "#260", title: "Single Number III", difficulty: "Medium", url: "https://leetcode.com/problems/single-number-iii/" },
          { id: "#137", title: "Single Number II", difficulty: "Medium", url: "https://leetcode.com/problems/single-number-ii/" },
          { id: "#389", title: "Find the Difference", difficulty: "Easy", url: "https://leetcode.com/problems/find-the-difference/" },
          { id: "#371", title: "Sum of Two Integers", difficulty: "Medium", url: "https://leetcode.com/problems/sum-of-two-integers/" },
        ],
      },
      {
        id: "bit-counting",
        emoji: "🔢",
        title: "Bit Counting",
        subtitle: "Kernighan's trick: n &= (n-1) removes lowest set bit",
        tags: ["popcount", "Power of 2"],
        complexity: "O(k)",
        description:
          "n &= (n-1) clears lowest set bit. Repeat until 0 — count iterations = popcount. Power of 2: exactly one bit set, so n>0 && (n&(n-1))==0.",
        problems: [
          { id: "#191", title: "Number of 1 Bits", difficulty: "Easy", url: "https://leetcode.com/problems/number-of-1-bits/" },
          { id: "#231", title: "Power of Two", difficulty: "Easy", url: "https://leetcode.com/problems/power-of-two/" },
          { id: "#338", title: "Counting Bits", difficulty: "Easy", url: "https://leetcode.com/problems/counting-bits/" },
        ],
      },
      {
        id: "bit-mod",
        emoji: "🔁",
        title: "Bit Modulo (Single Number II)",
        subtitle: "Track bits appearing 1 mod 3 times using bit-wise accumulators",
        tags: ["Mod 3", "Bits"],
        complexity: "O(n) / O(1)",
        description:
          "ones = bits seen 1 mod 3, twos = bits seen 2 mod 3. Update: ones = (ones^n) & ~twos; twos = (twos^n) & ~ones. After 3×, both reset. Final ones = answer.",
        problems: [
          { id: "#137", title: "Single Number II", difficulty: "Medium", url: "https://leetcode.com/problems/single-number-ii/" },
          { id: "#287", title: "Find Duplicate (Floyd's)", difficulty: "Medium", url: "https://leetcode.com/problems/find-the-duplicate-number/" },
        ],
      },
    ],
  },
];

export const PATTERN_TOTAL = COMMON_PATTERNS.reduce(
  (sum, c) => sum + c.patterns.length,
  0,
);
