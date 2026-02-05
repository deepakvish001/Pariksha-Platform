// DSA Questions Data - Comprehensive question bank organized by topic
import type { Difficulty } from "./positionResourcesData";

export interface DSAQuestion {
  id: number;
  title: string;
  text: string;
  difficulty: Difficulty;
  topicId: string;
  answer: string;
  options?: { text: string; isCorrect: boolean }[];
}

export interface DSATopic {
  id: string;
  name: string;
  icon: string;
  questionCount: number;
}

// Topics for DSA questions
export const dsaTopics: DSATopic[] = [
  { id: "dynamic-programming", name: "Dynamic Programming", icon: "Layers", questionCount: 85 },
  { id: "arrays", name: "Arrays", icon: "List", questionCount: 75 },
  { id: "strings", name: "Strings", icon: "Type", questionCount: 60 },
  { id: "linked-lists", name: "Linked Lists", icon: "Link", questionCount: 45 },
  { id: "trees", name: "Trees", icon: "GitBranch", questionCount: 70 },
  { id: "graphs", name: "Graphs", icon: "Network", questionCount: 65 },
  { id: "binary-search", name: "Binary Search", icon: "Search", questionCount: 40 },
  { id: "sorting", name: "Sorting & Searching", icon: "ArrowUpDown", questionCount: 35 },
  { id: "stack-queue", name: "Stack & Queue", icon: "Layers2", questionCount: 40 },
  { id: "heap", name: "Heap / Priority Queue", icon: "Mountain", questionCount: 30 },
  { id: "hashing", name: "Hashing", icon: "Hash", questionCount: 35 },
  { id: "backtracking", name: "Backtracking", icon: "Undo2", questionCount: 30 },
  { id: "greedy", name: "Greedy Algorithms", icon: "Zap", questionCount: 35 },
  { id: "bit-manipulation", name: "Bit Manipulation", icon: "Binary", questionCount: 25 },
  { id: "recursion", name: "Recursion", icon: "RefreshCw", questionCount: 33 },
];

// DSA Questions organized by topic
export const dsaQuestions: DSAQuestion[] = [
  // Dynamic Programming Questions
  {
    id: 1,
    title: "Climbing Stairs",
    text: "You are climbing a staircase. It takes 'n' steps to reach the top. Each time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top? This is a classic dynamic programming problem that can also be solved with a simple iterative approach.",
    difficulty: "Easy",
    topicId: "dynamic-programming",
    answer: `## Climbing Stairs

### Problem Understanding
You need to find the number of distinct ways to climb n stairs when you can take either 1 or 2 steps at a time.

### Approach: Dynamic Programming (Fibonacci Pattern)

The number of ways to reach step n is the sum of ways to reach step n-1 and n-2.

\`\`\`python
def climbStairs(n: int) -> int:
    if n <= 2:
        return n
    
    # Space optimized DP
    prev2, prev1 = 1, 2
    
    for i in range(3, n + 1):
        curr = prev1 + prev2
        prev2 = prev1
        prev1 = curr
    
    return prev1
\`\`\`

### Time & Space Complexity
- **Time**: O(n)
- **Space**: O(1)

### Key Insight
This is essentially the Fibonacci sequence! ways(n) = ways(n-1) + ways(n-2)`,
    options: [
      { text: "O(n) time, O(1) space using Fibonacci pattern", isCorrect: true },
      { text: "O(2^n) recursive without memoization", isCorrect: false },
      { text: "O(n²) dynamic programming", isCorrect: false },
      { text: "O(n log n) divide and conquer", isCorrect: false },
    ],
  },
  {
    id: 2,
    title: "Coin Change",
    text: "You are given an integer array 'coins' representing coins of different denominations and an integer 'amount' representing a total amount of money. Return the fewest number of coins that you need to make up that amount. If that amount of money cannot be made up by any combination of the coins, return -1. This is a classic dynamic programming problem. The optimal substructure and overlapping subproblems are key characteristics.",
    difficulty: "Medium",
    topicId: "dynamic-programming",
    answer: `## Coin Change

### Problem Understanding
Find minimum coins needed to make the target amount. This is a classic unbounded knapsack variant.

### Approach: Bottom-Up DP

\`\`\`python
def coinChange(coins: list[int], amount: int) -> int:
    # dp[i] = minimum coins needed for amount i
    dp = [float('inf')] * (amount + 1)
    dp[0] = 0
    
    for i in range(1, amount + 1):
        for coin in coins:
            if coin <= i and dp[i - coin] != float('inf'):
                dp[i] = min(dp[i], dp[i - coin] + 1)
    
    return dp[amount] if dp[amount] != float('inf') else -1
\`\`\`

### Time & Space Complexity
- **Time**: O(amount × coins)
- **Space**: O(amount)

### Recurrence Relation
\`dp[i] = min(dp[i], dp[i - coin] + 1)\` for each coin`,
    options: [
      { text: "Bottom-Up DP with O(amount × coins) time", isCorrect: true },
      { text: "Greedy approach always works", isCorrect: false },
      { text: "BFS on state space", isCorrect: false },
      { text: "Sorting coins first solves it", isCorrect: false },
    ],
  },
  {
    id: 3,
    title: "Longest Increasing Subsequence",
    text: "Given an integer array 'nums', return the length of the longest strictly increasing subsequence. A subsequence is a sequence that can be derived from an array by deleting some or no elements without changing the order of the remaining elements. This problem is another classic dynamic programming problem that can be solved with an O(n^2) DP approach or a more advanced O(n log n) solution using binary search.",
    difficulty: "Medium",
    topicId: "dynamic-programming",
    answer: `## Longest Increasing Subsequence (LIS)

### Approach 1: DP - O(n²)

\`\`\`python
def lengthOfLIS(nums: list[int]) -> int:
    n = len(nums)
    dp = [1] * n  # Each element is an LIS of length 1
    
    for i in range(1, n):
        for j in range(i):
            if nums[j] < nums[i]:
                dp[i] = max(dp[i], dp[j] + 1)
    
    return max(dp)
\`\`\`

### Approach 2: Binary Search - O(n log n)

\`\`\`python
import bisect

def lengthOfLIS(nums: list[int]) -> int:
    tails = []
    
    for num in nums:
        pos = bisect.bisect_left(tails, num)
        if pos == len(tails):
            tails.append(num)
        else:
            tails[pos] = num
    
    return len(tails)
\`\`\`

### Time & Space Complexity
- **O(n²) DP**: Time O(n²), Space O(n)
- **Binary Search**: Time O(n log n), Space O(n)`,
    options: [
      { text: "O(n log n) using binary search with patience sorting", isCorrect: true },
      { text: "O(n) with two pointers", isCorrect: false },
      { text: "O(n²) is the best possible", isCorrect: false },
      { text: "Sliding window technique", isCorrect: false },
    ],
  },
  {
    id: 4,
    title: "House Robber",
    text: "You are a professional robber planning to rob houses along a street. Each house has a certain amount of money stashed. The only constraint stopping you from robbing each house is that adjacent houses have security systems connected, and it will automatically contact the police if two adjacent houses are broken into on the same night. Given an integer array 'nums' representing the amount of money in each house, return the maximum amount of money you can rob tonight without alerting the police.",
    difficulty: "Medium",
    topicId: "dynamic-programming",
    answer: `## House Robber

### Problem Understanding
Maximize sum of non-adjacent elements in an array.

### Approach: Space-Optimized DP

\`\`\`python
def rob(nums: list[int]) -> int:
    if not nums:
        return 0
    if len(nums) == 1:
        return nums[0]
    
    prev2, prev1 = 0, 0
    
    for num in nums:
        curr = max(prev1, prev2 + num)
        prev2 = prev1
        prev1 = curr
    
    return prev1
\`\`\`

### Recurrence Relation
\`dp[i] = max(dp[i-1], dp[i-2] + nums[i])\`

At each house, choose to:
1. **Skip it**: Take dp[i-1]
2. **Rob it**: Take dp[i-2] + nums[i]

### Time & Space Complexity
- **Time**: O(n)
- **Space**: O(1)`,
    options: [
      { text: "dp[i] = max(dp[i-1], dp[i-2] + nums[i])", isCorrect: true },
      { text: "Always rob alternate houses", isCorrect: false },
      { text: "Rob houses with maximum value first", isCorrect: false },
      { text: "Use DFS to explore all paths", isCorrect: false },
    ],
  },
  {
    id: 5,
    title: "Unique Paths",
    text: "There is a robot on an m x n grid. The robot is initially located at the top-left corner (grid[0][0]). The robot can only move either down or right at any point in time. The robot is trying to reach the bottom-right corner of the grid (grid[m-1][n-1]). How many unique paths are there? This problem is a classic example of dynamic programming and combinatorial mathematics. The number of unique paths to a cell is the sum of unique paths to the cell above and the cell to the left.",
    difficulty: "Medium",
    topicId: "dynamic-programming",
    answer: `## Unique Paths

### Approach 1: DP

\`\`\`python
def uniquePaths(m: int, n: int) -> int:
    dp = [[1] * n for _ in range(m)]
    
    for i in range(1, m):
        for j in range(1, n):
            dp[i][j] = dp[i-1][j] + dp[i][j-1]
    
    return dp[m-1][n-1]
\`\`\`

### Approach 2: Space Optimized

\`\`\`python
def uniquePaths(m: int, n: int) -> int:
    dp = [1] * n
    
    for i in range(1, m):
        for j in range(1, n):
            dp[j] += dp[j-1]
    
    return dp[n-1]
\`\`\`

### Approach 3: Math (Combinatorics)

\`\`\`python
from math import comb

def uniquePaths(m: int, n: int) -> int:
    return comb(m + n - 2, m - 1)
\`\`\`

### Time & Space Complexity
- **DP**: Time O(m×n), Space O(n)
- **Math**: Time O(min(m,n)), Space O(1)`,
    options: [
      { text: "C(m+n-2, m-1) using combinatorics", isCorrect: true },
      { text: "m × n always", isCorrect: false },
      { text: "2^(m+n)", isCorrect: false },
      { text: "m + n - 2", isCorrect: false },
    ],
  },
  {
    id: 6,
    title: "Longest Common Subsequence",
    text: "Find the length of the longest common subsequence between two strings. This is a classic dynamic programming problem with a straightforward recursive definition. The problem is characterized by overlapping subproblems and optimal substructure. A common approach involves building a 2D DP table.",
    difficulty: "Medium",
    topicId: "dynamic-programming",
    answer: `## Longest Common Subsequence (LCS)

### Approach: 2D DP

\`\`\`python
def longestCommonSubsequence(text1: str, text2: str) -> int:
    m, n = len(text1), len(text2)
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if text1[i-1] == text2[j-1]:
                dp[i][j] = dp[i-1][j-1] + 1
            else:
                dp[i][j] = max(dp[i-1][j], dp[i][j-1])
    
    return dp[m][n]
\`\`\`

### Recurrence Relation
\`\`\`
if text1[i] == text2[j]:
    dp[i][j] = dp[i-1][j-1] + 1
else:
    dp[i][j] = max(dp[i-1][j], dp[i][j-1])
\`\`\`

### Time & Space Complexity
- **Time**: O(m × n)
- **Space**: O(m × n), can be optimized to O(min(m, n))`,
    options: [
      { text: "2D DP comparing characters from both strings", isCorrect: true },
      { text: "Find longest common substring first", isCorrect: false },
      { text: "Use hash map to store character positions", isCorrect: false },
      { text: "Binary search on sequence length", isCorrect: false },
    ],
  },
  {
    id: 7,
    title: "Word Break",
    text: "Given a string s and a dictionary of strings 'wordDict', return true if 's' can be segmented into a space-separated sequence of one or more dictionary words. The same word in the dictionary can be reused multiple times. This is a classic dynamic programming problem, and it can also be solved with memoization.",
    difficulty: "Medium",
    topicId: "dynamic-programming",
    answer: `## Word Break

### Approach: DP

\`\`\`python
def wordBreak(s: str, wordDict: list[str]) -> bool:
    word_set = set(wordDict)
    n = len(s)
    dp = [False] * (n + 1)
    dp[0] = True  # Empty string is valid
    
    for i in range(1, n + 1):
        for j in range(i):
            if dp[j] and s[j:i] in word_set:
                dp[i] = True
                break
    
    return dp[n]
\`\`\`

### Explanation
- \`dp[i]\` = True if s[0:i] can be segmented
- For each position i, check all previous positions j
- If dp[j] is True and s[j:i] is in dictionary, dp[i] = True

### Time & Space Complexity
- **Time**: O(n² × m) where m is average word length
- **Space**: O(n)`,
    options: [
      { text: "DP checking if each prefix can be segmented", isCorrect: true },
      { text: "Greedy longest word first", isCorrect: false },
      { text: "Trie with DFS only", isCorrect: false },
      { text: "KMP pattern matching", isCorrect: false },
    ],
  },
  {
    id: 8,
    title: "Max Sum of Two Non-Overlapping Subarrays",
    text: "Given an array $\\text{nums}$ and two integers $\\text{firstLen}$ and $\\text{secondLen}$, return the maximum sum of elements in two non-overlapping subarrays of lengths $\\text{firstLen}$ and $\\text{secondLen}$. This involves calculating prefix sums and using DP to track the maximum possible sum of a subarray of a certain length *up to* or *from* a specific index, allowing for two non-overlapping subarrays.",
    difficulty: "Medium",
    topicId: "dynamic-programming",
    answer: `## Max Sum of Two Non-Overlapping Subarrays

### Approach: Prefix Sum + DP

\`\`\`python
def maxSumTwoNoOverlap(nums: list[int], firstLen: int, secondLen: int) -> int:
    n = len(nums)
    
    # Prefix sum
    prefix = [0] * (n + 1)
    for i in range(n):
        prefix[i + 1] = prefix[i] + nums[i]
    
    def getSum(i, length):
        return prefix[i + length] - prefix[i]
    
    def solve(L, M):
        maxL = 0
        result = 0
        
        for i in range(L + M, n + 1):
            # Max sum of L-length subarray ending before current M-length
            maxL = max(maxL, getSum(i - L - M, L))
            # Current M-length subarray sum + best L-length before it
            result = max(result, maxL + getSum(i - M, M))
        
        return result
    
    return max(solve(firstLen, secondLen), solve(secondLen, firstLen))
\`\`\`

### Time & Space Complexity
- **Time**: O(n)
- **Space**: O(n)`,
    options: [
      { text: "Prefix sum with tracking max subarray before current", isCorrect: true },
      { text: "Kadane's algorithm twice", isCorrect: false },
      { text: "Sliding window of fixed size", isCorrect: false },
      { text: "Binary search on sum values", isCorrect: false },
    ],
  },
  {
    id: 9,
    title: "Longest Increasing Path in a Matrix",
    text: "Given an m × n integer matrix, find the length of the longest path of increasing values where you may move up/down/left/right. This problem uses DP combined with DFS/memoization; each cell's longest path is calculated once and cached.",
    difficulty: "Hard",
    topicId: "dynamic-programming",
    answer: `## Longest Increasing Path in a Matrix

### Approach: DFS + Memoization

\`\`\`python
def longestIncreasingPath(matrix: list[list[int]]) -> int:
    if not matrix:
        return 0
    
    m, n = len(matrix), len(matrix[0])
    memo = {}
    
    def dfs(i, j):
        if (i, j) in memo:
            return memo[(i, j)]
        
        result = 1
        for di, dj in [(0, 1), (0, -1), (1, 0), (-1, 0)]:
            ni, nj = i + di, j + dj
            if 0 <= ni < m and 0 <= nj < n and matrix[ni][nj] > matrix[i][j]:
                result = max(result, 1 + dfs(ni, nj))
        
        memo[(i, j)] = result
        return result
    
    return max(dfs(i, j) for i in range(m) for j in range(n))
\`\`\`

### Time & Space Complexity
- **Time**: O(m × n)
- **Space**: O(m × n)`,
    options: [
      { text: "DFS with memoization caching each cell's result", isCorrect: true },
      { text: "BFS from all cells simultaneously", isCorrect: false },
      { text: "Dynamic programming left-to-right", isCorrect: false },
      { text: "Dijkstra's algorithm", isCorrect: false },
    ],
  },
  {
    id: 10,
    title: "Edit Distance",
    text: "Given two strings word1 and word2, return the minimum number of operations required to convert word1 to word2. You can insert, delete, or replace a character. This is the classic Levenshtein distance problem.",
    difficulty: "Medium",
    topicId: "dynamic-programming",
    answer: `## Edit Distance (Levenshtein Distance)

### Approach: 2D DP

\`\`\`python
def minDistance(word1: str, word2: str) -> int:
    m, n = len(word1), len(word2)
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    
    # Base cases
    for i in range(m + 1):
        dp[i][0] = i
    for j in range(n + 1):
        dp[0][j] = j
    
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if word1[i-1] == word2[j-1]:
                dp[i][j] = dp[i-1][j-1]
            else:
                dp[i][j] = 1 + min(
                    dp[i-1][j],      # Delete
                    dp[i][j-1],      # Insert
                    dp[i-1][j-1]     # Replace
                )
    
    return dp[m][n]
\`\`\`

### Time & Space Complexity
- **Time**: O(m × n)
- **Space**: O(m × n)`,
    options: [
      { text: "2D DP with insert, delete, replace operations", isCorrect: true },
      { text: "Longest common substring approach", isCorrect: false },
      { text: "Greedy character matching", isCorrect: false },
      { text: "Recursive without memoization is optimal", isCorrect: false },
    ],
  },

  // Arrays Questions
  {
    id: 11,
    title: "Two Sum",
    text: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution.",
    difficulty: "Easy",
    topicId: "arrays",
    answer: `## Two Sum

### Approach: Hash Map

\`\`\`python
def twoSum(nums: list[int], target: int) -> list[int]:
    seen = {}
    
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    
    return []
\`\`\`

### Time & Space Complexity
- **Time**: O(n)
- **Space**: O(n)`,
    options: [
      { text: "Hash map storing complement for O(n) time", isCorrect: true },
      { text: "Sort array first then two pointers", isCorrect: false },
      { text: "Binary search for each element", isCorrect: false },
      { text: "Brute force O(n²) is optimal", isCorrect: false },
    ],
  },
  {
    id: 12,
    title: "Best Time to Buy and Sell Stock",
    text: "You are given an array prices where prices[i] is the price of a given stock on the ith day. You want to maximize your profit by choosing a single day to buy and a single day to sell. Return the maximum profit you can achieve.",
    difficulty: "Easy",
    topicId: "arrays",
    answer: `## Best Time to Buy and Sell Stock

### Approach: Single Pass

\`\`\`python
def maxProfit(prices: list[int]) -> int:
    min_price = float('inf')
    max_profit = 0
    
    for price in prices:
        min_price = min(min_price, price)
        max_profit = max(max_profit, price - min_price)
    
    return max_profit
\`\`\`

### Time & Space Complexity
- **Time**: O(n)
- **Space**: O(1)`,
    options: [
      { text: "Track minimum price and maximum profit in single pass", isCorrect: true },
      { text: "Find max and min prices first", isCorrect: false },
      { text: "Compare every pair of days", isCorrect: false },
      { text: "Use divide and conquer", isCorrect: false },
    ],
  },
  {
    id: 13,
    title: "Maximum Subarray",
    text: "Given an integer array nums, find the subarray with the largest sum, and return its sum. This is the famous Kadane's Algorithm problem.",
    difficulty: "Medium",
    topicId: "arrays",
    answer: `## Maximum Subarray (Kadane's Algorithm)

### Approach

\`\`\`python
def maxSubArray(nums: list[int]) -> int:
    max_sum = current_sum = nums[0]
    
    for num in nums[1:]:
        current_sum = max(num, current_sum + num)
        max_sum = max(max_sum, current_sum)
    
    return max_sum
\`\`\`

### Intuition
At each position, decide whether to:
1. Extend the previous subarray
2. Start a new subarray from current element

### Time & Space Complexity
- **Time**: O(n)
- **Space**: O(1)`,
    options: [
      { text: "Kadane's Algorithm - extend or start new", isCorrect: true },
      { text: "Prefix sum with hash map", isCorrect: false },
      { text: "Sliding window approach", isCorrect: false },
      { text: "Sort and sum largest elements", isCorrect: false },
    ],
  },
  {
    id: 14,
    title: "Product of Array Except Self",
    text: "Given an integer array nums, return an array answer such that answer[i] is equal to the product of all the elements of nums except nums[i]. Solve it without using division and in O(n) time.",
    difficulty: "Medium",
    topicId: "arrays",
    answer: `## Product of Array Except Self

### Approach: Prefix & Suffix Products

\`\`\`python
def productExceptSelf(nums: list[int]) -> list[int]:
    n = len(nums)
    result = [1] * n
    
    # Left pass - store prefix products
    prefix = 1
    for i in range(n):
        result[i] = prefix
        prefix *= nums[i]
    
    # Right pass - multiply by suffix products
    suffix = 1
    for i in range(n - 1, -1, -1):
        result[i] *= suffix
        suffix *= nums[i]
    
    return result
\`\`\`

### Time & Space Complexity
- **Time**: O(n)
- **Space**: O(1) excluding output array`,
    options: [
      { text: "Prefix and suffix products in two passes", isCorrect: true },
      { text: "Calculate total product and divide", isCorrect: false },
      { text: "Use logarithms to avoid division", isCorrect: false },
      { text: "Nested loops are required", isCorrect: false },
    ],
  },
  {
    id: 15,
    title: "Container With Most Water",
    text: "Given n non-negative integers representing vertical lines, find two lines that together with the x-axis form a container that holds the most water.",
    difficulty: "Medium",
    topicId: "arrays",
    answer: `## Container With Most Water

### Approach: Two Pointers

\`\`\`python
def maxArea(height: list[int]) -> int:
    left, right = 0, len(height) - 1
    max_water = 0
    
    while left < right:
        width = right - left
        h = min(height[left], height[right])
        max_water = max(max_water, width * h)
        
        if height[left] < height[right]:
            left += 1
        else:
            right -= 1
    
    return max_water
\`\`\`

### Time & Space Complexity
- **Time**: O(n)
- **Space**: O(1)`,
    options: [
      { text: "Two pointers moving inward based on shorter line", isCorrect: true },
      { text: "Check all pairs of lines", isCorrect: false },
      { text: "Monotonic stack approach", isCorrect: false },
      { text: "Binary search on water level", isCorrect: false },
    ],
  },
  {
    id: 16,
    title: "3Sum",
    text: "Given an integer array nums, return all the triplets [nums[i], nums[j], nums[k]] such that i != j, i != k, and j != k, and nums[i] + nums[j] + nums[k] == 0. The solution set must not contain duplicate triplets.",
    difficulty: "Medium",
    topicId: "arrays",
    answer: `## 3Sum

### Approach: Sort + Two Pointers

\`\`\`python
def threeSum(nums: list[int]) -> list[list[int]]:
    nums.sort()
    result = []
    
    for i in range(len(nums) - 2):
        if i > 0 and nums[i] == nums[i - 1]:
            continue
        
        left, right = i + 1, len(nums) - 1
        
        while left < right:
            total = nums[i] + nums[left] + nums[right]
            
            if total < 0:
                left += 1
            elif total > 0:
                right -= 1
            else:
                result.append([nums[i], nums[left], nums[right]])
                while left < right and nums[left] == nums[left + 1]:
                    left += 1
                while left < right and nums[right] == nums[right - 1]:
                    right -= 1
                left += 1
                right -= 1
    
    return result
\`\`\`

### Time & Space Complexity
- **Time**: O(n²)
- **Space**: O(1) or O(n) depending on sort`,
    options: [
      { text: "Sort + fix one element + two pointers for O(n²)", isCorrect: true },
      { text: "Three nested loops are required", isCorrect: false },
      { text: "Hash map gives O(n) solution", isCorrect: false },
      { text: "Binary search after sorting", isCorrect: false },
    ],
  },
  {
    id: 17,
    title: "Merge Intervals",
    text: "Given an array of intervals where intervals[i] = [starti, endi], merge all overlapping intervals, and return an array of the non-overlapping intervals.",
    difficulty: "Medium",
    topicId: "arrays",
    answer: `## Merge Intervals

### Approach: Sort + Merge

\`\`\`python
def merge(intervals: list[list[int]]) -> list[list[int]]:
    intervals.sort(key=lambda x: x[0])
    merged = []
    
    for interval in intervals:
        if not merged or merged[-1][1] < interval[0]:
            merged.append(interval)
        else:
            merged[-1][1] = max(merged[-1][1], interval[1])
    
    return merged
\`\`\`

### Time & Space Complexity
- **Time**: O(n log n)
- **Space**: O(n)`,
    options: [
      { text: "Sort by start time, then merge overlapping", isCorrect: true },
      { text: "Use interval tree for O(n) solution", isCorrect: false },
      { text: "Check each interval against all others", isCorrect: false },
      { text: "Sort by end time", isCorrect: false },
    ],
  },
  {
    id: 18,
    title: "Rotate Array",
    text: "Given an integer array nums, rotate the array to the right by k steps, where k is non-negative.",
    difficulty: "Medium",
    topicId: "arrays",
    answer: `## Rotate Array

### Approach: Reverse Three Times

\`\`\`python
def rotate(nums: list[int], k: int) -> None:
    n = len(nums)
    k = k % n
    
    def reverse(start, end):
        while start < end:
            nums[start], nums[end] = nums[end], nums[start]
            start += 1
            end -= 1
    
    reverse(0, n - 1)      # Reverse entire array
    reverse(0, k - 1)      # Reverse first k elements
    reverse(k, n - 1)      # Reverse remaining elements
\`\`\`

### Time & Space Complexity
- **Time**: O(n)
- **Space**: O(1)`,
    options: [
      { text: "Reverse entire array, then reverse two parts", isCorrect: true },
      { text: "Copy to new array", isCorrect: false },
      { text: "Shift elements one by one k times", isCorrect: false },
      { text: "Use circular queue", isCorrect: false },
    ],
  },
  {
    id: 19,
    title: "First Missing Positive",
    text: "Given an unsorted integer array nums, return the smallest missing positive integer. Must run in O(n) time and use O(1) auxiliary space.",
    difficulty: "Hard",
    topicId: "arrays",
    answer: `## First Missing Positive

### Approach: Cyclic Sort

\`\`\`python
def firstMissingPositive(nums: list[int]) -> int:
    n = len(nums)
    
    # Place each number at its correct index
    for i in range(n):
        while 1 <= nums[i] <= n and nums[nums[i] - 1] != nums[i]:
            correct_idx = nums[i] - 1
            nums[i], nums[correct_idx] = nums[correct_idx], nums[i]
    
    # Find first missing
    for i in range(n):
        if nums[i] != i + 1:
            return i + 1
    
    return n + 1
\`\`\`

### Time & Space Complexity
- **Time**: O(n)
- **Space**: O(1)`,
    options: [
      { text: "Cyclic sort - place each number at index (num-1)", isCorrect: true },
      { text: "Sort and scan for O(n log n)", isCorrect: false },
      { text: "Hash set for O(n) space", isCorrect: false },
      { text: "Binary search after sorting", isCorrect: false },
    ],
  },
  {
    id: 20,
    title: "Trapping Rain Water",
    text: "Given n non-negative integers representing an elevation map, compute how much water it can trap after raining.",
    difficulty: "Hard",
    topicId: "arrays",
    answer: `## Trapping Rain Water

### Approach: Two Pointers

\`\`\`python
def trap(height: list[int]) -> int:
    if not height:
        return 0
    
    left, right = 0, len(height) - 1
    left_max, right_max = 0, 0
    water = 0
    
    while left < right:
        if height[left] < height[right]:
            if height[left] >= left_max:
                left_max = height[left]
            else:
                water += left_max - height[left]
            left += 1
        else:
            if height[right] >= right_max:
                right_max = height[right]
            else:
                water += right_max - height[right]
            right -= 1
    
    return water
\`\`\`

### Time & Space Complexity
- **Time**: O(n)
- **Space**: O(1)`,
    options: [
      { text: "Two pointers tracking left_max and right_max", isCorrect: true },
      { text: "Monotonic stack only", isCorrect: false },
      { text: "BFS from each cell", isCorrect: false },
      { text: "DP with O(n) extra space required", isCorrect: false },
    ],
  },

  // Trees Questions
  {
    id: 21,
    title: "Maximum Depth of Binary Tree",
    text: "Given the root of a binary tree, return its maximum depth. A binary tree's maximum depth is the number of nodes along the longest path from the root node down to the farthest leaf node.",
    difficulty: "Easy",
    topicId: "trees",
    answer: `## Maximum Depth of Binary Tree

### Approach: Recursion

\`\`\`python
def maxDepth(root: TreeNode) -> int:
    if not root:
        return 0
    return 1 + max(maxDepth(root.left), maxDepth(root.right))
\`\`\`

### Approach: BFS (Level Order)

\`\`\`python
from collections import deque

def maxDepth(root: TreeNode) -> int:
    if not root:
        return 0
    
    queue = deque([root])
    depth = 0
    
    while queue:
        depth += 1
        for _ in range(len(queue)):
            node = queue.popleft()
            if node.left:
                queue.append(node.left)
            if node.right:
                queue.append(node.right)
    
    return depth
\`\`\`

### Time & Space Complexity
- **Time**: O(n)
- **Space**: O(h) where h is height`,
    options: [
      { text: "1 + max(left_depth, right_depth) recursively", isCorrect: true },
      { text: "Count nodes and take log", isCorrect: false },
      { text: "BFS always faster than DFS", isCorrect: false },
      { text: "Iterative preorder only", isCorrect: false },
    ],
  },
  {
    id: 22,
    title: "Invert Binary Tree",
    text: "Given the root of a binary tree, invert the tree, and return its root. Swap left and right children at every node.",
    difficulty: "Easy",
    topicId: "trees",
    answer: `## Invert Binary Tree

### Approach: Recursion

\`\`\`python
def invertTree(root: TreeNode) -> TreeNode:
    if not root:
        return None
    
    root.left, root.right = root.right, root.left
    invertTree(root.left)
    invertTree(root.right)
    
    return root
\`\`\`

### Time & Space Complexity
- **Time**: O(n)
- **Space**: O(h)`,
    options: [
      { text: "Swap left and right children recursively", isCorrect: true },
      { text: "Rebuild tree with reversed values", isCorrect: false },
      { text: "Level order with reversal", isCorrect: false },
      { text: "Modify node values only", isCorrect: false },
    ],
  },
  {
    id: 23,
    title: "Validate Binary Search Tree",
    text: "Given the root of a binary tree, determine if it is a valid binary search tree (BST).",
    difficulty: "Medium",
    topicId: "trees",
    answer: `## Validate BST

### Approach: Recursion with Bounds

\`\`\`python
def isValidBST(root: TreeNode) -> bool:
    def validate(node, min_val, max_val):
        if not node:
            return True
        
        if node.val <= min_val or node.val >= max_val:
            return False
        
        return (validate(node.left, min_val, node.val) and
                validate(node.right, node.val, max_val))
    
    return validate(root, float('-inf'), float('inf'))
\`\`\`

### Time & Space Complexity
- **Time**: O(n)
- **Space**: O(h)`,
    options: [
      { text: "Recursion with min/max bounds for each node", isCorrect: true },
      { text: "Check only immediate children", isCorrect: false },
      { text: "Compare with parent only", isCorrect: false },
      { text: "BFS level validation", isCorrect: false },
    ],
  },
  {
    id: 24,
    title: "Lowest Common Ancestor of a Binary Tree",
    text: "Given a binary tree, find the lowest common ancestor (LCA) of two given nodes in the tree.",
    difficulty: "Medium",
    topicId: "trees",
    answer: `## Lowest Common Ancestor

### Approach: Recursion

\`\`\`python
def lowestCommonAncestor(root: TreeNode, p: TreeNode, q: TreeNode) -> TreeNode:
    if not root or root == p or root == q:
        return root
    
    left = lowestCommonAncestor(root.left, p, q)
    right = lowestCommonAncestor(root.right, p, q)
    
    if left and right:
        return root
    
    return left if left else right
\`\`\`

### Time & Space Complexity
- **Time**: O(n)
- **Space**: O(h)`,
    options: [
      { text: "Recursively find in left/right subtrees", isCorrect: true },
      { text: "Store paths to both nodes and compare", isCorrect: false },
      { text: "BFS from root", isCorrect: false },
      { text: "Use parent pointers only", isCorrect: false },
    ],
  },
  {
    id: 25,
    title: "Binary Tree Level Order Traversal",
    text: "Given the root of a binary tree, return the level order traversal of its nodes' values (i.e., from left to right, level by level).",
    difficulty: "Medium",
    topicId: "trees",
    answer: `## Level Order Traversal

### Approach: BFS

\`\`\`python
from collections import deque

def levelOrder(root: TreeNode) -> list[list[int]]:
    if not root:
        return []
    
    result = []
    queue = deque([root])
    
    while queue:
        level = []
        for _ in range(len(queue)):
            node = queue.popleft()
            level.append(node.val)
            if node.left:
                queue.append(node.left)
            if node.right:
                queue.append(node.right)
        result.append(level)
    
    return result
\`\`\`

### Time & Space Complexity
- **Time**: O(n)
- **Space**: O(n)`,
    options: [
      { text: "BFS with queue processing level by level", isCorrect: true },
      { text: "DFS preorder is more efficient", isCorrect: false },
      { text: "Recursion without tracking level", isCorrect: false },
      { text: "Two stacks approach", isCorrect: false },
    ],
  },

  // Graphs Questions
  {
    id: 26,
    title: "Number of Islands",
    text: "Given an m x n 2D binary grid which represents a map of '1's (land) and '0's (water), return the number of islands. An island is surrounded by water and is formed by connecting adjacent lands horizontally or vertically.",
    difficulty: "Medium",
    topicId: "graphs",
    answer: `## Number of Islands

### Approach: DFS

\`\`\`python
def numIslands(grid: list[list[str]]) -> int:
    if not grid:
        return 0
    
    m, n = len(grid), len(grid[0])
    count = 0
    
    def dfs(i, j):
        if i < 0 or i >= m or j < 0 or j >= n or grid[i][j] != '1':
            return
        grid[i][j] = '0'  # Mark visited
        dfs(i + 1, j)
        dfs(i - 1, j)
        dfs(i, j + 1)
        dfs(i, j - 1)
    
    for i in range(m):
        for j in range(n):
            if grid[i][j] == '1':
                count += 1
                dfs(i, j)
    
    return count
\`\`\`

### Time & Space Complexity
- **Time**: O(m × n)
- **Space**: O(m × n)`,
    options: [
      { text: "DFS/BFS from each unvisited land cell", isCorrect: true },
      { text: "Union-Find is always faster", isCorrect: false },
      { text: "Count cells with value '1'", isCorrect: false },
      { text: "Scanning rows only", isCorrect: false },
    ],
  },
  {
    id: 27,
    title: "Clone Graph",
    text: "Given a reference of a node in a connected undirected graph, return a deep copy (clone) of the graph.",
    difficulty: "Medium",
    topicId: "graphs",
    answer: `## Clone Graph

### Approach: DFS with HashMap

\`\`\`python
def cloneGraph(node: Node) -> Node:
    if not node:
        return None
    
    clones = {}
    
    def dfs(node):
        if node in clones:
            return clones[node]
        
        clone = Node(node.val)
        clones[node] = clone
        
        for neighbor in node.neighbors:
            clone.neighbors.append(dfs(neighbor))
        
        return clone
    
    return dfs(node)
\`\`\`

### Time & Space Complexity
- **Time**: O(V + E)
- **Space**: O(V)`,
    options: [
      { text: "DFS/BFS with HashMap to track cloned nodes", isCorrect: true },
      { text: "Deep copy without tracking", isCorrect: false },
      { text: "Only clone values not edges", isCorrect: false },
      { text: "Use adjacency matrix", isCorrect: false },
    ],
  },
  {
    id: 28,
    title: "Course Schedule",
    text: "There are a total of numCourses courses you have to take. Some courses have prerequisites. Return true if you can finish all courses.",
    difficulty: "Medium",
    topicId: "graphs",
    answer: `## Course Schedule (Cycle Detection)

### Approach: DFS Topological Sort

\`\`\`python
def canFinish(numCourses: int, prerequisites: list[list[int]]) -> bool:
    graph = [[] for _ in range(numCourses)]
    for course, prereq in prerequisites:
        graph[course].append(prereq)
    
    # 0: unvisited, 1: visiting, 2: visited
    state = [0] * numCourses
    
    def hasCycle(course):
        if state[course] == 1:
            return True  # Cycle detected
        if state[course] == 2:
            return False
        
        state[course] = 1
        for prereq in graph[course]:
            if hasCycle(prereq):
                return True
        state[course] = 2
        return False
    
    return not any(hasCycle(i) for i in range(numCourses))
\`\`\`

### Time & Space Complexity
- **Time**: O(V + E)
- **Space**: O(V + E)`,
    options: [
      { text: "Topological sort / cycle detection using DFS", isCorrect: true },
      { text: "BFS from any course", isCorrect: false },
      { text: "Sort courses by prerequisites", isCorrect: false },
      { text: "Greedy course selection", isCorrect: false },
    ],
  },
  {
    id: 29,
    title: "Word Ladder",
    text: "Given two words, beginWord and endWord, and a dictionary wordList, return the number of words in the shortest transformation sequence from beginWord to endWord.",
    difficulty: "Hard",
    topicId: "graphs",
    answer: `## Word Ladder

### Approach: BFS

\`\`\`python
from collections import deque

def ladderLength(beginWord: str, endWord: str, wordList: list[str]) -> int:
    word_set = set(wordList)
    if endWord not in word_set:
        return 0
    
    queue = deque([(beginWord, 1)])
    
    while queue:
        word, length = queue.popleft()
        
        if word == endWord:
            return length
        
        for i in range(len(word)):
            for c in 'abcdefghijklmnopqrstuvwxyz':
                next_word = word[:i] + c + word[i+1:]
                if next_word in word_set:
                    word_set.remove(next_word)
                    queue.append((next_word, length + 1))
    
    return 0
\`\`\`

### Time & Space Complexity
- **Time**: O(M² × N) where M is word length, N is wordList size
- **Space**: O(M × N)`,
    options: [
      { text: "BFS treating words as graph nodes", isCorrect: true },
      { text: "DFS is more efficient", isCorrect: false },
      { text: "Edit distance DP", isCorrect: false },
      { text: "Trie with backtracking", isCorrect: false },
    ],
  },
  {
    id: 30,
    title: "Dijkstra's Shortest Path",
    text: "Given a weighted graph and a source vertex, find the shortest paths from source to all other vertices using Dijkstra's algorithm.",
    difficulty: "Medium",
    topicId: "graphs",
    answer: `## Dijkstra's Algorithm

### Approach: Priority Queue

\`\`\`python
import heapq

def dijkstra(graph: dict, source: int) -> dict:
    distances = {node: float('inf') for node in graph}
    distances[source] = 0
    pq = [(0, source)]
    
    while pq:
        curr_dist, curr_node = heapq.heappop(pq)
        
        if curr_dist > distances[curr_node]:
            continue
        
        for neighbor, weight in graph[curr_node]:
            distance = curr_dist + weight
            if distance < distances[neighbor]:
                distances[neighbor] = distance
                heapq.heappush(pq, (distance, neighbor))
    
    return distances
\`\`\`

### Time & Space Complexity
- **Time**: O((V + E) log V)
- **Space**: O(V)`,
    options: [
      { text: "Priority queue with distance updates", isCorrect: true },
      { text: "BFS works for weighted graphs", isCorrect: false },
      { text: "DFS with backtracking", isCorrect: false },
      { text: "Bellman-Ford is always faster", isCorrect: false },
    ],
  },

  // Binary Search Questions
  {
    id: 31,
    title: "Binary Search",
    text: "Given a sorted array of integers and a target, return the index of the target if found, otherwise return -1.",
    difficulty: "Easy",
    topicId: "binary-search",
    answer: `## Binary Search

### Approach

\`\`\`python
def search(nums: list[int], target: int) -> int:
    left, right = 0, len(nums) - 1
    
    while left <= right:
        mid = left + (right - left) // 2
        
        if nums[mid] == target:
            return mid
        elif nums[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    
    return -1
\`\`\`

### Time & Space Complexity
- **Time**: O(log n)
- **Space**: O(1)`,
    options: [
      { text: "O(log n) by halving search space each step", isCorrect: true },
      { text: "O(n) linear scan is simpler", isCorrect: false },
      { text: "O(1) constant time", isCorrect: false },
      { text: "O(n log n) with preprocessing", isCorrect: false },
    ],
  },
  {
    id: 32,
    title: "Search in Rotated Sorted Array",
    text: "Given a rotated sorted array and a target, return the index if found, otherwise return -1.",
    difficulty: "Medium",
    topicId: "binary-search",
    answer: `## Search in Rotated Sorted Array

### Approach: Modified Binary Search

\`\`\`python
def search(nums: list[int], target: int) -> int:
    left, right = 0, len(nums) - 1
    
    while left <= right:
        mid = (left + right) // 2
        
        if nums[mid] == target:
            return mid
        
        # Left half is sorted
        if nums[left] <= nums[mid]:
            if nums[left] <= target < nums[mid]:
                right = mid - 1
            else:
                left = mid + 1
        # Right half is sorted
        else:
            if nums[mid] < target <= nums[right]:
                left = mid + 1
            else:
                right = mid - 1
    
    return -1
\`\`\`

### Time & Space Complexity
- **Time**: O(log n)
- **Space**: O(1)`,
    options: [
      { text: "Modified binary search checking which half is sorted", isCorrect: true },
      { text: "Find rotation point first", isCorrect: false },
      { text: "Linear search is required", isCorrect: false },
      { text: "Two binary searches always", isCorrect: false },
    ],
  },
  {
    id: 33,
    title: "Find Minimum in Rotated Sorted Array",
    text: "Find the minimum element in a rotated sorted array. Assume all elements are unique.",
    difficulty: "Medium",
    topicId: "binary-search",
    answer: `## Find Minimum in Rotated Sorted Array

### Approach

\`\`\`python
def findMin(nums: list[int]) -> int:
    left, right = 0, len(nums) - 1
    
    while left < right:
        mid = (left + right) // 2
        
        if nums[mid] > nums[right]:
            left = mid + 1
        else:
            right = mid
    
    return nums[left]
\`\`\`

### Time & Space Complexity
- **Time**: O(log n)
- **Space**: O(1)`,
    options: [
      { text: "Binary search comparing mid with right boundary", isCorrect: true },
      { text: "Linear scan for minimum", isCorrect: false },
      { text: "Compare mid with left boundary", isCorrect: false },
      { text: "Sort the array first", isCorrect: false },
    ],
  },
  {
    id: 34,
    title: "Median of Two Sorted Arrays",
    text: "Given two sorted arrays nums1 and nums2, return the median of the two sorted arrays. Must run in O(log(m+n)) time.",
    difficulty: "Hard",
    topicId: "binary-search",
    answer: `## Median of Two Sorted Arrays

### Approach: Binary Search on Partition

\`\`\`python
def findMedianSortedArrays(nums1: list[int], nums2: list[int]) -> float:
    if len(nums1) > len(nums2):
        nums1, nums2 = nums2, nums1
    
    m, n = len(nums1), len(nums2)
    left, right = 0, m
    
    while left <= right:
        partitionX = (left + right) // 2
        partitionY = (m + n + 1) // 2 - partitionX
        
        maxLeftX = nums1[partitionX - 1] if partitionX > 0 else float('-inf')
        minRightX = nums1[partitionX] if partitionX < m else float('inf')
        maxLeftY = nums2[partitionY - 1] if partitionY > 0 else float('-inf')
        minRightY = nums2[partitionY] if partitionY < n else float('inf')
        
        if maxLeftX <= minRightY and maxLeftY <= minRightX:
            if (m + n) % 2 == 0:
                return (max(maxLeftX, maxLeftY) + min(minRightX, minRightY)) / 2
            return max(maxLeftX, maxLeftY)
        elif maxLeftX > minRightY:
            right = partitionX - 1
        else:
            left = partitionX + 1
    
    return 0.0
\`\`\`

### Time & Space Complexity
- **Time**: O(log(min(m, n)))
- **Space**: O(1)`,
    options: [
      { text: "Binary search on partition of smaller array", isCorrect: true },
      { text: "Merge arrays then find median", isCorrect: false },
      { text: "Two pointers from both ends", isCorrect: false },
      { text: "Binary search on median value", isCorrect: false },
    ],
  },

  // Stack & Queue Questions
  {
    id: 35,
    title: "Valid Parentheses",
    text: "Given a string containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.",
    difficulty: "Easy",
    topicId: "stack-queue",
    answer: `## Valid Parentheses

### Approach: Stack

\`\`\`python
def isValid(s: str) -> bool:
    stack = []
    mapping = {')': '(', '}': '{', ']': '['}
    
    for char in s:
        if char in mapping:
            if not stack or stack.pop() != mapping[char]:
                return False
        else:
            stack.append(char)
    
    return len(stack) == 0
\`\`\`

### Time & Space Complexity
- **Time**: O(n)
- **Space**: O(n)`,
    options: [
      { text: "Stack matching opening/closing brackets", isCorrect: true },
      { text: "Counter for each bracket type", isCorrect: false },
      { text: "Recursion for nested brackets", isCorrect: false },
      { text: "Regular expression matching", isCorrect: false },
    ],
  },
  {
    id: 36,
    title: "Min Stack",
    text: "Design a stack that supports push, pop, top, and retrieving the minimum element in constant time.",
    difficulty: "Medium",
    topicId: "stack-queue",
    answer: `## Min Stack

### Approach: Two Stacks

\`\`\`python
class MinStack:
    def __init__(self):
        self.stack = []
        self.min_stack = []
    
    def push(self, val: int) -> None:
        self.stack.append(val)
        if not self.min_stack or val <= self.min_stack[-1]:
            self.min_stack.append(val)
    
    def pop(self) -> None:
        if self.stack.pop() == self.min_stack[-1]:
            self.min_stack.pop()
    
    def top(self) -> int:
        return self.stack[-1]
    
    def getMin(self) -> int:
        return self.min_stack[-1]
\`\`\`

### Time & Space Complexity
- **All operations**: O(1)
- **Space**: O(n)`,
    options: [
      { text: "Two stacks: one for values, one for minimums", isCorrect: true },
      { text: "Sort on each push", isCorrect: false },
      { text: "Single stack with linear getMin", isCorrect: false },
      { text: "Heap for minimum tracking", isCorrect: false },
    ],
  },
  {
    id: 37,
    title: "Daily Temperatures",
    text: "Given an array of temperatures, return an array such that answer[i] is the number of days you have to wait after the ith day to get a warmer temperature.",
    difficulty: "Medium",
    topicId: "stack-queue",
    answer: `## Daily Temperatures (Monotonic Stack)

### Approach

\`\`\`python
def dailyTemperatures(temperatures: list[int]) -> list[int]:
    n = len(temperatures)
    result = [0] * n
    stack = []  # Stack of indices
    
    for i in range(n):
        while stack and temperatures[i] > temperatures[stack[-1]]:
            prev_idx = stack.pop()
            result[prev_idx] = i - prev_idx
        stack.append(i)
    
    return result
\`\`\`

### Time & Space Complexity
- **Time**: O(n)
- **Space**: O(n)`,
    options: [
      { text: "Monotonic decreasing stack storing indices", isCorrect: true },
      { text: "Compare each day with all future days", isCorrect: false },
      { text: "Use heap for next greater", isCorrect: false },
      { text: "DP with O(n²) is optimal", isCorrect: false },
    ],
  },
  {
    id: 38,
    title: "Largest Rectangle in Histogram",
    text: "Given an array of heights representing a histogram, find the area of the largest rectangle in the histogram.",
    difficulty: "Hard",
    topicId: "stack-queue",
    answer: `## Largest Rectangle in Histogram

### Approach: Monotonic Stack

\`\`\`python
def largestRectangleArea(heights: list[int]) -> int:
    stack = []
    max_area = 0
    heights.append(0)  # Sentinel
    
    for i, h in enumerate(heights):
        while stack and heights[stack[-1]] > h:
            height = heights[stack.pop()]
            width = i if not stack else i - stack[-1] - 1
            max_area = max(max_area, height * width)
        stack.append(i)
    
    return max_area
\`\`\`

### Time & Space Complexity
- **Time**: O(n)
- **Space**: O(n)`,
    options: [
      { text: "Monotonic stack to find left/right boundaries", isCorrect: true },
      { text: "Divide and conquer on minimum height", isCorrect: false },
      { text: "Try all possible rectangles", isCorrect: false },
      { text: "DP on heights", isCorrect: false },
    ],
  },

  // Linked Lists Questions
  {
    id: 39,
    title: "Reverse Linked List",
    text: "Given the head of a singly linked list, reverse the list, and return the reversed list.",
    difficulty: "Easy",
    topicId: "linked-lists",
    answer: `## Reverse Linked List

### Approach: Iterative

\`\`\`python
def reverseList(head: ListNode) -> ListNode:
    prev = None
    curr = head
    
    while curr:
        next_node = curr.next
        curr.next = prev
        prev = curr
        curr = next_node
    
    return prev
\`\`\`

### Approach: Recursive

\`\`\`python
def reverseList(head: ListNode) -> ListNode:
    if not head or not head.next:
        return head
    
    new_head = reverseList(head.next)
    head.next.next = head
    head.next = None
    
    return new_head
\`\`\`

### Time & Space Complexity
- **Iterative**: O(n) time, O(1) space
- **Recursive**: O(n) time, O(n) space`,
    options: [
      { text: "Iterative with prev, curr, next pointers", isCorrect: true },
      { text: "Use stack to reverse", isCorrect: false },
      { text: "Create new list with reversed values", isCorrect: false },
      { text: "Swap node values pairwise", isCorrect: false },
    ],
  },
  {
    id: 40,
    title: "Merge Two Sorted Lists",
    text: "Merge two sorted linked lists and return it as a sorted list.",
    difficulty: "Easy",
    topicId: "linked-lists",
    answer: `## Merge Two Sorted Lists

### Approach

\`\`\`python
def mergeTwoLists(l1: ListNode, l2: ListNode) -> ListNode:
    dummy = ListNode(0)
    curr = dummy
    
    while l1 and l2:
        if l1.val <= l2.val:
            curr.next = l1
            l1 = l1.next
        else:
            curr.next = l2
            l2 = l2.next
        curr = curr.next
    
    curr.next = l1 or l2
    return dummy.next
\`\`\`

### Time & Space Complexity
- **Time**: O(n + m)
- **Space**: O(1)`,
    options: [
      { text: "Compare heads, link smaller, advance pointer", isCorrect: true },
      { text: "Concatenate then sort", isCorrect: false },
      { text: "Use extra array", isCorrect: false },
      { text: "Recursion with O(n) space", isCorrect: false },
    ],
  },
  {
    id: 41,
    title: "Linked List Cycle",
    text: "Given head, determine if the linked list has a cycle in it.",
    difficulty: "Easy",
    topicId: "linked-lists",
    answer: `## Linked List Cycle (Floyd's Tortoise and Hare)

### Approach

\`\`\`python
def hasCycle(head: ListNode) -> bool:
    if not head:
        return False
    
    slow = fast = head
    
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
        if slow == fast:
            return True
    
    return False
\`\`\`

### Time & Space Complexity
- **Time**: O(n)
- **Space**: O(1)`,
    options: [
      { text: "Floyd's Tortoise and Hare (slow/fast pointers)", isCorrect: true },
      { text: "Store visited nodes in hash set", isCorrect: false },
      { text: "Mark visited nodes", isCorrect: false },
      { text: "Count nodes exceeding list length", isCorrect: false },
    ],
  },
  {
    id: 42,
    title: "LRU Cache",
    text: "Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.",
    difficulty: "Medium",
    topicId: "linked-lists",
    answer: `## LRU Cache

### Approach: HashMap + Doubly Linked List

\`\`\`python
class Node:
    def __init__(self, key=0, val=0):
        self.key = key
        self.val = val
        self.prev = None
        self.next = None

class LRUCache:
    def __init__(self, capacity: int):
        self.capacity = capacity
        self.cache = {}
        self.head = Node()
        self.tail = Node()
        self.head.next = self.tail
        self.tail.prev = self.head
    
    def _remove(self, node):
        node.prev.next = node.next
        node.next.prev = node.prev
    
    def _add(self, node):
        node.prev = self.tail.prev
        node.next = self.tail
        self.tail.prev.next = node
        self.tail.prev = node
    
    def get(self, key: int) -> int:
        if key in self.cache:
            node = self.cache[key]
            self._remove(node)
            self._add(node)
            return node.val
        return -1
    
    def put(self, key: int, value: int) -> None:
        if key in self.cache:
            self._remove(self.cache[key])
        node = Node(key, value)
        self._add(node)
        self.cache[key] = node
        if len(self.cache) > self.capacity:
            lru = self.head.next
            self._remove(lru)
            del self.cache[lru.key]
\`\`\`

### Time & Space Complexity
- **All operations**: O(1)
- **Space**: O(capacity)`,
    options: [
      { text: "HashMap + Doubly Linked List for O(1) ops", isCorrect: true },
      { text: "Array with linear search", isCorrect: false },
      { text: "Min-heap by access time", isCorrect: false },
      { text: "Single linked list only", isCorrect: false },
    ],
  },

  // Heap Questions
  {
    id: 43,
    title: "Kth Largest Element in an Array",
    text: "Given an integer array nums and an integer k, return the kth largest element in the array.",
    difficulty: "Medium",
    topicId: "heap",
    answer: `## Kth Largest Element

### Approach: Min Heap of size k

\`\`\`python
import heapq

def findKthLargest(nums: list[int], k: int) -> int:
    heap = []
    
    for num in nums:
        heapq.heappush(heap, num)
        if len(heap) > k:
            heapq.heappop(heap)
    
    return heap[0]
\`\`\`

### Approach: QuickSelect (Average O(n))

\`\`\`python
import random

def findKthLargest(nums: list[int], k: int) -> int:
    def partition(left, right, pivot_idx):
        pivot = nums[pivot_idx]
        nums[pivot_idx], nums[right] = nums[right], nums[pivot_idx]
        store_idx = left
        
        for i in range(left, right):
            if nums[i] < pivot:
                nums[store_idx], nums[i] = nums[i], nums[store_idx]
                store_idx += 1
        
        nums[right], nums[store_idx] = nums[store_idx], nums[right]
        return store_idx
    
    def quickselect(left, right, k_smallest):
        if left == right:
            return nums[left]
        
        pivot_idx = random.randint(left, right)
        pivot_idx = partition(left, right, pivot_idx)
        
        if k_smallest == pivot_idx:
            return nums[k_smallest]
        elif k_smallest < pivot_idx:
            return quickselect(left, pivot_idx - 1, k_smallest)
        else:
            return quickselect(pivot_idx + 1, right, k_smallest)
    
    return quickselect(0, len(nums) - 1, len(nums) - k)
\`\`\`

### Time & Space Complexity
- **Heap**: O(n log k)
- **QuickSelect**: O(n) average, O(n²) worst`,
    options: [
      { text: "Min-heap of size k or QuickSelect", isCorrect: true },
      { text: "Sort entire array", isCorrect: false },
      { text: "Max-heap of all elements", isCorrect: false },
      { text: "Counting sort always", isCorrect: false },
    ],
  },
  {
    id: 44,
    title: "Merge K Sorted Lists",
    text: "Merge k sorted linked lists and return it as one sorted list.",
    difficulty: "Hard",
    topicId: "heap",
    answer: `## Merge K Sorted Lists

### Approach: Min Heap

\`\`\`python
import heapq

def mergeKLists(lists: list[ListNode]) -> ListNode:
    dummy = ListNode(0)
    curr = dummy
    heap = []
    
    for i, lst in enumerate(lists):
        if lst:
            heapq.heappush(heap, (lst.val, i, lst))
    
    while heap:
        val, i, node = heapq.heappop(heap)
        curr.next = node
        curr = curr.next
        if node.next:
            heapq.heappush(heap, (node.next.val, i, node.next))
    
    return dummy.next
\`\`\`

### Time & Space Complexity
- **Time**: O(N log k) where N is total nodes
- **Space**: O(k)`,
    options: [
      { text: "Min-heap with k elements for O(N log k)", isCorrect: true },
      { text: "Merge two at a time", isCorrect: false },
      { text: "Concatenate all then sort", isCorrect: false },
      { text: "Compare all heads each time", isCorrect: false },
    ],
  },

  // Backtracking Questions
  {
    id: 45,
    title: "Subsets",
    text: "Given an integer array nums of unique elements, return all possible subsets (the power set).",
    difficulty: "Medium",
    topicId: "backtracking",
    answer: `## Subsets

### Approach: Backtracking

\`\`\`python
def subsets(nums: list[int]) -> list[list[int]]:
    result = []
    
    def backtrack(start, path):
        result.append(path[:])
        
        for i in range(start, len(nums)):
            path.append(nums[i])
            backtrack(i + 1, path)
            path.pop()
    
    backtrack(0, [])
    return result
\`\`\`

### Time & Space Complexity
- **Time**: O(n × 2^n)
- **Space**: O(n)`,
    options: [
      { text: "Backtracking: include/exclude each element", isCorrect: true },
      { text: "Iterative bit manipulation", isCorrect: false },
      { text: "BFS on decision tree", isCorrect: false },
      { text: "DP approach", isCorrect: false },
    ],
  },
  {
    id: 46,
    title: "Permutations",
    text: "Given an array nums of distinct integers, return all the possible permutations.",
    difficulty: "Medium",
    topicId: "backtracking",
    answer: `## Permutations

### Approach: Backtracking

\`\`\`python
def permute(nums: list[int]) -> list[list[int]]:
    result = []
    
    def backtrack(path, used):
        if len(path) == len(nums):
            result.append(path[:])
            return
        
        for i, num in enumerate(nums):
            if used[i]:
                continue
            path.append(num)
            used[i] = True
            backtrack(path, used)
            path.pop()
            used[i] = False
    
    backtrack([], [False] * len(nums))
    return result
\`\`\`

### Time & Space Complexity
- **Time**: O(n × n!)
- **Space**: O(n)`,
    options: [
      { text: "Backtracking with used array to track elements", isCorrect: true },
      { text: "Generate all orderings with DP", isCorrect: false },
      { text: "Heap's algorithm only", isCorrect: false },
      { text: "Iterative swapping without recursion", isCorrect: false },
    ],
  },
  {
    id: 47,
    title: "N-Queens",
    text: "Place n queens on an n×n chessboard such that no two queens attack each other.",
    difficulty: "Hard",
    topicId: "backtracking",
    answer: `## N-Queens

### Approach: Backtracking

\`\`\`python
def solveNQueens(n: int) -> list[list[str]]:
    result = []
    cols = set()
    diag1 = set()  # row - col
    diag2 = set()  # row + col
    
    def backtrack(row, board):
        if row == n:
            result.append([''.join(row) for row in board])
            return
        
        for col in range(n):
            if col in cols or (row - col) in diag1 or (row + col) in diag2:
                continue
            
            cols.add(col)
            diag1.add(row - col)
            diag2.add(row + col)
            board[row][col] = 'Q'
            
            backtrack(row + 1, board)
            
            cols.remove(col)
            diag1.remove(row - col)
            diag2.remove(row + col)
            board[row][col] = '.'
    
    board = [['.' for _ in range(n)] for _ in range(n)]
    backtrack(0, board)
    return result
\`\`\`

### Time & Space Complexity
- **Time**: O(n!)
- **Space**: O(n²)`,
    options: [
      { text: "Backtracking with diagonal conflict tracking", isCorrect: true },
      { text: "Try all n² positions for each queen", isCorrect: false },
      { text: "Greedy placement", isCorrect: false },
      { text: "DP on board states", isCorrect: false },
    ],
  },

  // Greedy Questions
  {
    id: 48,
    title: "Jump Game",
    text: "You are given an integer array nums. You are initially positioned at the array's first index, and each element represents your maximum jump length at that position. Return true if you can reach the last index.",
    difficulty: "Medium",
    topicId: "greedy",
    answer: `## Jump Game

### Approach: Greedy

\`\`\`python
def canJump(nums: list[int]) -> bool:
    max_reach = 0
    
    for i, jump in enumerate(nums):
        if i > max_reach:
            return False
        max_reach = max(max_reach, i + jump)
    
    return True
\`\`\`

### Time & Space Complexity
- **Time**: O(n)
- **Space**: O(1)`,
    options: [
      { text: "Track maximum reachable index greedily", isCorrect: true },
      { text: "BFS on all possible jumps", isCorrect: false },
      { text: "DP with O(n²) time", isCorrect: false },
      { text: "Backtracking all paths", isCorrect: false },
    ],
  },
  {
    id: 49,
    title: "Gas Station",
    text: "There are n gas stations along a circular route. Return the starting gas station's index if you can travel around the circuit once in the clockwise direction, otherwise return -1.",
    difficulty: "Medium",
    topicId: "greedy",
    answer: `## Gas Station

### Approach: Greedy

\`\`\`python
def canCompleteCircuit(gas: list[int], cost: list[int]) -> int:
    total_tank = 0
    curr_tank = 0
    start = 0
    
    for i in range(len(gas)):
        total_tank += gas[i] - cost[i]
        curr_tank += gas[i] - cost[i]
        
        if curr_tank < 0:
            start = i + 1
            curr_tank = 0
    
    return start if total_tank >= 0 else -1
\`\`\`

### Time & Space Complexity
- **Time**: O(n)
- **Space**: O(1)`,
    options: [
      { text: "Greedy: reset start when tank goes negative", isCorrect: true },
      { text: "Try starting from each station", isCorrect: false },
      { text: "Sort stations by gas-cost", isCorrect: false },
      { text: "DFS simulation", isCorrect: false },
    ],
  },
  {
    id: 50,
    title: "Task Scheduler",
    text: "Given a characters array tasks representing the tasks a CPU needs to do, and a cooling time n. Return the least number of units of times that the CPU will take to finish all the given tasks.",
    difficulty: "Medium",
    topicId: "greedy",
    answer: `## Task Scheduler

### Approach: Greedy Math

\`\`\`python
from collections import Counter

def leastInterval(tasks: list[str], n: int) -> int:
    freq = Counter(tasks)
    max_freq = max(freq.values())
    max_count = sum(1 for f in freq.values() if f == max_freq)
    
    # (max_freq - 1) * (n + 1) + max_count
    result = (max_freq - 1) * (n + 1) + max_count
    
    return max(result, len(tasks))
\`\`\`

### Time & Space Complexity
- **Time**: O(n)
- **Space**: O(1) (26 letters max)`,
    options: [
      { text: "(maxFreq-1) × (n+1) + maxCount formula", isCorrect: true },
      { text: "Priority queue simulation only", isCorrect: false },
      { text: "Greedy always picks most frequent", isCorrect: false },
      { text: "DP on remaining tasks", isCorrect: false },
    ],
  },
];

// Helper functions
export const getQuestionsByTopic = (topicId: string): DSAQuestion[] => {
  if (topicId === "all") return dsaQuestions;
  return dsaQuestions.filter((q) => q.topicId === topicId);
};

export const getQuestionsByDifficulty = (
  questions: DSAQuestion[],
  difficulty: Difficulty | "all"
): DSAQuestion[] => {
  if (difficulty === "all") return questions;
  return questions.filter((q) => q.difficulty === difficulty);
};

export const searchQuestions = (
  questions: DSAQuestion[],
  query: string
): DSAQuestion[] => {
  if (!query.trim()) return questions;
  const lowerQuery = query.toLowerCase();
  return questions.filter(
    (q) =>
      q.title.toLowerCase().includes(lowerQuery) ||
      q.text.toLowerCase().includes(lowerQuery)
  );
};
