// Generic per-topic templates for DSA Studio problem detail pages.
// Same structure for every problem within a topic. Per-problem fields
// (title, difficulty, etc.) are injected at render time.

export type LangId = "Java" | "Python" | "C++" | "JavaScript";

export interface ProblemTemplate {
  approachTitle: string;
  approachBody: string;
  algorithm: string[];
  variables: string[];
  whyItWorks: string;
  time: string;
  space: string;
  code: Record<LangId, string>;
  examples: { input: string; output: string }[];
  stepLogic: string[];
}

const t = (topicTag: string, body: Record<string, unknown>): ProblemTemplate =>
  ({ ...(body as ProblemTemplate), approachTitle: (body as any).approachTitle ?? topicTag });

export const TOPIC_TEMPLATES: Record<string, ProblemTemplate> = {
  arrays: t("Index Mapping — Iterate Once", {
    approachTitle: "Index Mapping — Iterate Once",
    approachBody:
      "Walk the array once with a single index. Maintain accumulator(s) (sum, max, count, hash) and update the answer in O(1) per step. No nested loops needed.",
    algorithm: [
      "Initialize answer / accumulators (sum=0, max=-∞, map={})",
      "For each i in 0..n-1, read nums[i]",
      "Update accumulator using nums[i]",
      "Update answer if the current accumulator improves it",
      "Return the final answer",
    ],
    variables: ["i", "nums[i]", "acc", "ans"],
    whyItWorks:
      "Each element contributes once to the answer; carrying running state lets us avoid re-scanning previous indices, giving a clean linear pass.",
    time: "O(n)",
    space: "O(1)",
    examples: [
      { input: "[1,2,1]", output: "[1,2,1,1,2,1]" },
      { input: "[1,3,2,1]", output: "[1,3,2,1,1,3,2,1]" },
      { input: "[1,2,3,4,5]", output: "[1,2,3,4,5,1,2,3,4,5]" },
    ],
    stepLogic: [
      "nums has n elements. Initialize accumulator and answer.",
      "Iterate i from 0 to n-1, updating state with nums[i].",
      "After the loop, answer holds the result.",
    ],
    code: {
      Java: `public int[] solve(int[] nums) {\n    int n = nums.length;\n    int[] ans = new int[2 * n];\n    for (int i = 0; i < n; i++) {\n        ans[i]     = nums[i];\n        ans[i + n] = nums[i];\n    }\n    return ans;\n}`,
      Python: `def solve(nums):\n    n = len(nums)\n    ans = [0] * (2 * n)\n    for i in range(n):\n        ans[i]     = nums[i]\n        ans[i + n] = nums[i]\n    return ans`,
      "C++": `vector<int> solve(vector<int>& nums) {\n    int n = nums.size();\n    vector<int> ans(2 * n);\n    for (int i = 0; i < n; i++) {\n        ans[i]     = nums[i];\n        ans[i + n] = nums[i];\n    }\n    return ans;\n}`,
      JavaScript: `function solve(nums) {\n  const n = nums.length;\n  const ans = new Array(2 * n);\n  for (let i = 0; i < n; i++) {\n    ans[i]     = nums[i];\n    ans[i + n] = nums[i];\n  }\n  return ans;\n}`,
    },
  }),
  strings: t("Character Scan", {
    approachTitle: "Character Scan with Hash / Counter",
    approachBody:
      "Iterate over the string once and maintain a frequency map or two-pointer window. Most string problems collapse to counting characters or expanding/shrinking a window.",
    algorithm: [
      "Initialize counter / window pointers",
      "Iterate each character ch",
      "Update counter[ch] or expand window",
      "Shrink/check window for the constraint",
      "Track best answer",
    ],
    variables: ["i", "ch", "counter", "ans"],
    whyItWorks: "Each character is visited a constant number of times, keeping the pass linear.",
    time: "O(n)",
    space: "O(k) where k is alphabet size",
    examples: [
      { input: '"abcabcbb"', output: "3" },
      { input: '"bbbbb"', output: "1" },
      { input: '"pwwkew"', output: "3" },
    ],
    stepLogic: [
      "Read character at index i.",
      "Update counter / window state.",
      "Update best answer if this state is better.",
    ],
    code: {
      Java: `public int solve(String s) {\n    int[] count = new int[128];\n    int l = 0, ans = 0;\n    for (int r = 0; r < s.length(); r++) {\n        count[s.charAt(r)]++;\n        while (count[s.charAt(r)] > 1) count[s.charAt(l++)]--;\n        ans = Math.max(ans, r - l + 1);\n    }\n    return ans;\n}`,
      Python: `def solve(s):\n    count, l, ans = {}, 0, 0\n    for r, ch in enumerate(s):\n        count[ch] = count.get(ch, 0) + 1\n        while count[ch] > 1:\n            count[s[l]] -= 1; l += 1\n        ans = max(ans, r - l + 1)\n    return ans`,
      "C++": `int solve(string s) {\n    vector<int> count(128, 0);\n    int l = 0, ans = 0;\n    for (int r = 0; r < (int)s.size(); r++) {\n        count[s[r]]++;\n        while (count[s[r]] > 1) count[s[l++]]--;\n        ans = max(ans, r - l + 1);\n    }\n    return ans;\n}`,
      JavaScript: `function solve(s) {\n  const count = new Map();\n  let l = 0, ans = 0;\n  for (let r = 0; r < s.length; r++) {\n    count.set(s[r], (count.get(s[r]) || 0) + 1);\n    while (count.get(s[r]) > 1) count.set(s[l], count.get(s[l++]) - 1);\n    ans = Math.max(ans, r - l + 1);\n  }\n  return ans;\n}`,
    },
  }),
  matrix: t("Row/Column Sweep", {
    approachTitle: "Row/Column Sweep",
    approachBody: "Walk the matrix in nested loops. Keep auxiliary row/col markers when in-place updates are required.",
    algorithm: ["Read dimensions m, n", "For each row r", "For each column c", "Update or read matrix[r][c]", "Apply post-pass if needed"],
    variables: ["r", "c", "matrix[r][c]"],
    whyItWorks: "Every cell contributes O(1) work; total work is proportional to m·n.",
    time: "O(m·n)", space: "O(1) extra",
    examples: [{ input: "[[1,2],[3,4]]", output: "transformed" }],
    stepLogic: ["Visit cell (r,c).", "Apply transform based on neighbors / markers.", "Continue until matrix exhausted."],
    code: {
      Java: `public void solve(int[][] m) {\n    int R = m.length, C = m[0].length;\n    for (int r = 0; r < R; r++)\n        for (int c = 0; c < C; c++)\n            m[r][c] = transform(m[r][c]);\n}`,
      Python: `def solve(m):\n    R, C = len(m), len(m[0])\n    for r in range(R):\n        for c in range(C):\n            m[r][c] = transform(m[r][c])`,
      "C++": `void solve(vector<vector<int>>& m) {\n    int R = m.size(), C = m[0].size();\n    for (int r = 0; r < R; r++)\n        for (int c = 0; c < C; c++)\n            m[r][c] = transform(m[r][c]);\n}`,
      JavaScript: `function solve(m) {\n  for (let r = 0; r < m.length; r++)\n    for (let c = 0; c < m[0].length; c++)\n      m[r][c] = transform(m[r][c]);\n}`,
    },
  }),
  stack: t("Monotonic Stack", {
    approachTitle: "Monotonic / LIFO Stack",
    approachBody: "Push elements; pop while a condition breaks monotonicity. Each element is pushed and popped at most once.",
    algorithm: ["Initialize empty stack", "For each element x", "Pop while stack top violates condition", "Push x (or its index)", "Resolve remaining stack items"],
    variables: ["i", "x", "stack", "ans"],
    whyItWorks: "Amortized O(1) per element because each item enters and leaves the stack once.",
    time: "O(n)", space: "O(n)",
    examples: [{ input: "[2,1,2,4,3]", output: "[4,2,4,-1,-1]" }],
    stepLogic: ["Read x.", "Pop violators.", "Push x onto stack."],
    code: {
      Java: `public int[] solve(int[] a) {\n    int n = a.length; int[] ans = new int[n];\n    Deque<Integer> st = new ArrayDeque<>();\n    for (int i = n - 1; i >= 0; i--) {\n        while (!st.isEmpty() && st.peek() <= a[i]) st.pop();\n        ans[i] = st.isEmpty() ? -1 : st.peek();\n        st.push(a[i]);\n    }\n    return ans;\n}`,
      Python: `def solve(a):\n    st, ans = [], [-1] * len(a)\n    for i in range(len(a) - 1, -1, -1):\n        while st and st[-1] <= a[i]:\n            st.pop()\n        ans[i] = st[-1] if st else -1\n        st.append(a[i])\n    return ans`,
      "C++": `vector<int> solve(vector<int>& a) {\n    int n = a.size(); vector<int> ans(n, -1); stack<int> st;\n    for (int i = n - 1; i >= 0; i--) {\n        while (!st.empty() && st.top() <= a[i]) st.pop();\n        if (!st.empty()) ans[i] = st.top();\n        st.push(a[i]);\n    }\n    return ans;\n}`,
      JavaScript: `function solve(a) {\n  const st = [], ans = Array(a.length).fill(-1);\n  for (let i = a.length - 1; i >= 0; i--) {\n    while (st.length && st[st.length-1] <= a[i]) st.pop();\n    if (st.length) ans[i] = st[st.length-1];\n    st.push(a[i]);\n  }\n  return ans;\n}`,
    },
  }),
  queue: t("BFS Queue", {
    approachTitle: "BFS / Sliding Window Queue",
    approachBody: "Process items in FIFO order. Push new candidates; pop fronts as they age out of the window or are visited.",
    algorithm: ["Seed queue with starting state", "While queue not empty", "Pop front", "Process and enqueue neighbors / next states", "Track answer / visited set"],
    variables: ["queue", "node", "visited", "ans"],
    whyItWorks: "FIFO guarantees minimum-step ordering, so the first time we reach a state is optimal.",
    time: "O(n)", space: "O(n)",
    examples: [{ input: "graph + source", output: "shortest distances" }],
    stepLogic: ["Pop front.", "Mark visited.", "Enqueue unvisited neighbors."],
    code: {
      Java: `public int bfs(List<List<Integer>> g, int s) {\n    Queue<Integer> q = new ArrayDeque<>(); q.add(s);\n    boolean[] vis = new boolean[g.size()]; vis[s] = true;\n    int steps = 0;\n    while (!q.isEmpty()) { int v = q.poll(); for (int u : g.get(v)) if (!vis[u]) { vis[u]=true; q.add(u); } }\n    return steps;\n}`,
      Python: `from collections import deque\ndef bfs(g, s):\n    q, vis = deque([s]), {s}\n    while q:\n        v = q.popleft()\n        for u in g[v]:\n            if u not in vis: vis.add(u); q.append(u)`,
      "C++": `void bfs(vector<vector<int>>& g, int s) {\n    queue<int> q; q.push(s);\n    vector<bool> vis(g.size()); vis[s] = true;\n    while (!q.empty()) { int v = q.front(); q.pop(); for (int u : g[v]) if (!vis[u]) { vis[u] = true; q.push(u); } }\n}`,
      JavaScript: `function bfs(g, s) {\n  const q = [s], vis = new Set([s]);\n  while (q.length) {\n    const v = q.shift();\n    for (const u of g[v]) if (!vis.has(u)) { vis.add(u); q.push(u); }\n  }\n}`,
    },
  }),
  binarysearch: t("Binary Search", {
    approachTitle: "Classic Binary Search",
    approachBody: "Maintain [lo, hi] window. Each step compares the midpoint and discards half the search space.",
    algorithm: ["lo = 0, hi = n - 1", "While lo <= hi", "mid = (lo + hi) >> 1", "If a[mid] == target return mid", "If a[mid] < target lo = mid + 1 else hi = mid - 1"],
    variables: ["lo", "hi", "mid", "a[mid]"],
    whyItWorks: "Each iteration halves the candidate window, giving log₂ n steps.",
    time: "O(log n)", space: "O(1)",
    examples: [
      { input: "[1,3,5,7,9], target=5", output: "2" },
      { input: "[1,3,5,7,9], target=4", output: "-1" },
    ],
    stepLogic: ["Compute mid.", "Compare a[mid] with target.", "Discard half."],
    code: {
      Java: `public int bsearch(int[] a, int target) {\n    int lo = 0, hi = a.length - 1;\n    while (lo <= hi) {\n        int mid = (lo + hi) >>> 1;\n        if (a[mid] == target) return mid;\n        if (a[mid] < target) lo = mid + 1; else hi = mid - 1;\n    }\n    return -1;\n}`,
      Python: `def bsearch(a, target):\n    lo, hi = 0, len(a) - 1\n    while lo <= hi:\n        mid = (lo + hi) // 2\n        if a[mid] == target: return mid\n        if a[mid] < target: lo = mid + 1\n        else: hi = mid - 1\n    return -1`,
      "C++": `int bsearch(vector<int>& a, int target) {\n    int lo = 0, hi = a.size() - 1;\n    while (lo <= hi) {\n        int mid = (lo + hi) / 2;\n        if (a[mid] == target) return mid;\n        if (a[mid] < target) lo = mid + 1; else hi = mid - 1;\n    }\n    return -1;\n}`,
      JavaScript: `function bsearch(a, target) {\n  let lo = 0, hi = a.length - 1;\n  while (lo <= hi) {\n    const mid = (lo + hi) >> 1;\n    if (a[mid] === target) return mid;\n    if (a[mid] < target) lo = mid + 1; else hi = mid - 1;\n  }\n  return -1;\n}`,
    },
  }),
  linkedlist: t("Two Pointers", {
    approachTitle: "Two-Pointer Linked List Traversal",
    approachBody: "Use slow/fast pointers, or prev/curr, advancing through the list. Mutate `next` references in place.",
    algorithm: ["Initialize prev=null, curr=head", "While curr != null", "Save next = curr.next", "Rewire curr.next = prev", "prev = curr; curr = next"],
    variables: ["prev", "curr", "next"],
    whyItWorks: "Each node is visited exactly once; pointer rewiring is O(1).",
    time: "O(n)", space: "O(1)",
    examples: [{ input: "1->2->3->null", output: "3->2->1->null" }],
    stepLogic: ["Save next.", "Reverse pointer.", "Advance prev/curr."],
    code: {
      Java: `public ListNode reverse(ListNode head) {\n    ListNode prev = null, curr = head;\n    while (curr != null) { ListNode n = curr.next; curr.next = prev; prev = curr; curr = n; }\n    return prev;\n}`,
      Python: `def reverse(head):\n    prev, curr = None, head\n    while curr:\n        nxt = curr.next; curr.next = prev; prev = curr; curr = nxt\n    return prev`,
      "C++": `ListNode* reverse(ListNode* head) {\n    ListNode *prev = nullptr, *curr = head;\n    while (curr) { auto n = curr->next; curr->next = prev; prev = curr; curr = n; }\n    return prev;\n}`,
      JavaScript: `function reverse(head) {\n  let prev = null, curr = head;\n  while (curr) { const n = curr.next; curr.next = prev; prev = curr; curr = n; }\n  return prev;\n}`,
    },
  }),
  greedy: t("Greedy Choice", {
    approachTitle: "Greedy Local Choice",
    approachBody: "At each step pick the locally optimal action that the problem's exchange argument proves will lead to a global optimum.",
    algorithm: ["Sort or iterate inputs in a meaningful order", "Maintain running state (count / cost / reach)", "Apply greedy rule for each item", "Return aggregated answer"],
    variables: ["i", "currentBest", "ans"],
    whyItWorks: "An exchange argument shows that swapping any non-greedy choice into the greedy choice cannot worsen the answer.",
    time: "O(n log n)", space: "O(1)",
    examples: [{ input: "[2,3,1,1,4]", output: "true" }],
    stepLogic: ["Inspect element i.", "Apply greedy rule.", "Update running answer."],
    code: {
      Java: `public boolean canJump(int[] a) {\n    int reach = 0;\n    for (int i = 0; i < a.length; i++) {\n        if (i > reach) return false;\n        reach = Math.max(reach, i + a[i]);\n    }\n    return true;\n}`,
      Python: `def can_jump(a):\n    reach = 0\n    for i, x in enumerate(a):\n        if i > reach: return False\n        reach = max(reach, i + x)\n    return True`,
      "C++": `bool canJump(vector<int>& a) {\n    int reach = 0;\n    for (int i = 0; i < (int)a.size(); i++) {\n        if (i > reach) return false;\n        reach = max(reach, i + a[i]);\n    }\n    return true;\n}`,
      JavaScript: `function canJump(a) {\n  let reach = 0;\n  for (let i = 0; i < a.length; i++) {\n    if (i > reach) return false;\n    reach = Math.max(reach, i + a[i]);\n  }\n  return true;\n}`,
    },
  }),
  intervals: t("Sort & Sweep", {
    approachTitle: "Sort Intervals & Sweep",
    approachBody: "Sort by start time, then sweep left-to-right merging or counting overlaps as you go.",
    algorithm: ["Sort intervals by start", "Initialize result with first interval", "For each next, if overlap merge, else push", "Return merged list"],
    variables: ["i", "current", "merged"],
    whyItWorks: "Sorting groups overlapping intervals together so a single pass suffices.",
    time: "O(n log n)", space: "O(n)",
    examples: [{ input: "[[1,3],[2,6],[8,10]]", output: "[[1,6],[8,10]]" }],
    stepLogic: ["Compare current end to next start.", "Merge or append.", "Move on."],
    code: {
      Java: `public int[][] merge(int[][] iv) {\n    Arrays.sort(iv, (a,b) -> a[0]-b[0]);\n    List<int[]> out = new ArrayList<>();\n    for (int[] cur : iv) {\n        if (!out.isEmpty() && cur[0] <= out.get(out.size()-1)[1])\n            out.get(out.size()-1)[1] = Math.max(out.get(out.size()-1)[1], cur[1]);\n        else out.add(cur);\n    }\n    return out.toArray(new int[0][]);\n}`,
      Python: `def merge(iv):\n    iv.sort(); out = []\n    for cur in iv:\n        if out and cur[0] <= out[-1][1]: out[-1][1] = max(out[-1][1], cur[1])\n        else: out.append(cur)\n    return out`,
      "C++": `vector<vector<int>> merge(vector<vector<int>>& iv) {\n    sort(iv.begin(), iv.end()); vector<vector<int>> out;\n    for (auto& c : iv) {\n        if (!out.empty() && c[0] <= out.back()[1]) out.back()[1] = max(out.back()[1], c[1]);\n        else out.push_back(c);\n    }\n    return out;\n}`,
      JavaScript: `function merge(iv) {\n  iv.sort((a,b) => a[0]-b[0]);\n  const out = [];\n  for (const c of iv) {\n    if (out.length && c[0] <= out[out.length-1][1])\n      out[out.length-1][1] = Math.max(out[out.length-1][1], c[1]);\n    else out.push(c);\n  }\n  return out;\n}`,
    },
  }),
  backtracking: t("Backtracking DFS", {
    approachTitle: "Backtracking DFS",
    approachBody: "Recursively explore choices; record valid leaves; undo the last choice before trying the next sibling.",
    algorithm: ["Define backtrack(state)", "If state is a complete solution, record it", "For each candidate choice", "Apply choice and recurse", "Undo choice (backtrack)"],
    variables: ["state", "choices", "solutions"],
    whyItWorks: "Pruning + undo guarantees we explore each distinct configuration at most once.",
    time: "O(branching^depth)", space: "O(depth)",
    examples: [{ input: "n=3", output: "[[(()()),((()))]]" }],
    stepLogic: ["Choose.", "Recurse.", "Undo."],
    code: {
      Java: `void backtrack(List<String> out, StringBuilder cur, int open, int close, int n) {\n    if (cur.length() == 2*n) { out.add(cur.toString()); return; }\n    if (open < n) { cur.append('('); backtrack(out, cur, open+1, close, n); cur.deleteCharAt(cur.length()-1); }\n    if (close < open) { cur.append(')'); backtrack(out, cur, open, close+1, n); cur.deleteCharAt(cur.length()-1); }\n}`,
      Python: `def backtrack(cur, open_, close, n, out):\n    if len(cur) == 2*n: out.append(cur); return\n    if open_ < n: backtrack(cur+'(', open_+1, close, n, out)\n    if close < open_: backtrack(cur+')', open_, close+1, n, out)`,
      "C++": `void backtrack(vector<string>& out, string& cur, int o, int c, int n) {\n    if ((int)cur.size() == 2*n) { out.push_back(cur); return; }\n    if (o < n) { cur.push_back('('); backtrack(out, cur, o+1, c, n); cur.pop_back(); }\n    if (c < o) { cur.push_back(')'); backtrack(out, cur, o, c+1, n); cur.pop_back(); }\n}`,
      JavaScript: `function backtrack(cur, open, close, n, out) {\n  if (cur.length === 2*n) { out.push(cur); return; }\n  if (open < n) backtrack(cur+'(', open+1, close, n, out);\n  if (close < open) backtrack(cur+')', open, close+1, n, out);\n}`,
    },
  }),
  tree: t("DFS Recursion", {
    approachTitle: "Tree DFS Recursion",
    approachBody: "Recurse into left & right subtrees, combine their results at the current node, return upward.",
    algorithm: ["If node == null return base case", "Recurse left", "Recurse right", "Combine results at node", "Return combined value"],
    variables: ["node", "left", "right"],
    whyItWorks: "Each node is visited once; the recursion stack mirrors the tree's depth.",
    time: "O(n)", space: "O(h)",
    examples: [{ input: "[3,9,20,null,null,15,7]", output: "3" }],
    stepLogic: ["Visit node.", "Recurse children.", "Combine."],
    code: {
      Java: `public int depth(TreeNode r) {\n    if (r == null) return 0;\n    return 1 + Math.max(depth(r.left), depth(r.right));\n}`,
      Python: `def depth(r):\n    if not r: return 0\n    return 1 + max(depth(r.left), depth(r.right))`,
      "C++": `int depth(TreeNode* r) {\n    if (!r) return 0;\n    return 1 + max(depth(r->left), depth(r->right));\n}`,
      JavaScript: `function depth(r) {\n  if (!r) return 0;\n  return 1 + Math.max(depth(r.left), depth(r.right));\n}`,
    },
  }),
  heap: t("Heap / Priority Queue", {
    approachTitle: "Min/Max Heap",
    approachBody: "Maintain a heap of size k (or n). Push items, pop the worst, keeping the heap invariant in O(log n).",
    algorithm: ["Build a heap from initial data", "For each new item, push and pop if size exceeds k", "Heap top is the running answer"],
    variables: ["heap", "x", "top"],
    whyItWorks: "Heap operations are O(log n) and the top element is always the current extreme.",
    time: "O(n log k)", space: "O(k)",
    examples: [{ input: "[3,2,1,5,6,4], k=2", output: "5" }],
    stepLogic: ["Push x.", "If heap.size() > k pop.", "Top is answer."],
    code: {
      Java: `public int kthLargest(int[] nums, int k) {\n    PriorityQueue<Integer> pq = new PriorityQueue<>();\n    for (int x : nums) { pq.offer(x); if (pq.size() > k) pq.poll(); }\n    return pq.peek();\n}`,
      Python: `import heapq\ndef kth(nums, k):\n    h = []\n    for x in nums:\n        heapq.heappush(h, x)\n        if len(h) > k: heapq.heappop(h)\n    return h[0]`,
      "C++": `int kth(vector<int>& nums, int k) {\n    priority_queue<int, vector<int>, greater<int>> pq;\n    for (int x : nums) { pq.push(x); if ((int)pq.size() > k) pq.pop(); }\n    return pq.top();\n}`,
      JavaScript: `// use a MinHeap class; pseudocode\nfunction kth(nums, k) { /* push, pop when size>k, return top */ }`,
    },
  }),
  graph: t("Graph DFS/BFS", {
    approachTitle: "Graph Traversal",
    approachBody: "Build adjacency list. DFS or BFS from a source while marking visited nodes.",
    algorithm: ["Build adjacency list from edges", "Mark source visited", "DFS/BFS exploring neighbors", "Aggregate result (count / path)"],
    variables: ["adj", "visited", "stack/queue"],
    whyItWorks: "Each node and edge is visited at most once when guarded by a visited set.",
    time: "O(V + E)", space: "O(V + E)",
    examples: [{ input: "n=5, edges=[[0,1],[1,2],[3,4]]", output: "2" }],
    stepLogic: ["Pick unvisited node.", "DFS its component.", "Increment counter."],
    code: {
      Java: `public int components(int n, int[][] edges) {\n    List<List<Integer>> g = new ArrayList<>(); for (int i=0;i<n;i++) g.add(new ArrayList<>());\n    for (int[] e : edges) { g.get(e[0]).add(e[1]); g.get(e[1]).add(e[0]); }\n    boolean[] vis = new boolean[n]; int c = 0;\n    for (int i = 0; i < n; i++) if (!vis[i]) { c++; dfs(i, g, vis); }\n    return c;\n}`,
      Python: `def components(n, edges):\n    g = [[] for _ in range(n)]\n    for u,v in edges: g[u].append(v); g[v].append(u)\n    vis, c = [False]*n, 0\n    def dfs(u):\n        vis[u]=True\n        for v in g[u]:\n            if not vis[v]: dfs(v)\n    for i in range(n):\n        if not vis[i]: c += 1; dfs(i)\n    return c`,
      "C++": `int components(int n, vector<vector<int>>& edges) {/* build adj, DFS from each unvisited */ return 0; }`,
      JavaScript: `function components(n, edges) { /* build adj, DFS each unvisited */ }`,
    },
  }),
  dp: t("Dynamic Programming", {
    approachTitle: "Bottom-Up DP",
    approachBody: "Define dp[i] as the answer for prefix i. Build it from previously computed states using a recurrence.",
    algorithm: ["Define state dp[i]", "Initialize base cases", "For i in increasing order compute dp[i] from dp[i-1], dp[i-2], ...", "Return dp[n]"],
    variables: ["i", "dp[i-1]", "dp[i-2]", "dp[i]"],
    whyItWorks: "Optimal substructure means dp[i] depends only on smaller solved sub-problems.",
    time: "O(n)", space: "O(n)",
    examples: [{ input: "n=5", output: "8" }],
    stepLogic: ["Base case dp[0], dp[1].", "Loop i.", "dp[i] = dp[i-1] + dp[i-2]."],
    code: {
      Java: `public int fib(int n) {\n    if (n < 2) return n;\n    int a = 0, b = 1;\n    for (int i = 2; i <= n; i++) { int c = a + b; a = b; b = c; }\n    return b;\n}`,
      Python: `def fib(n):\n    if n < 2: return n\n    a, b = 0, 1\n    for _ in range(2, n+1): a, b = b, a+b\n    return b`,
      "C++": `int fib(int n) { if (n < 2) return n; int a=0,b=1; for (int i=2;i<=n;i++){int c=a+b;a=b;b=c;} return b; }`,
      JavaScript: `function fib(n) {\n  if (n < 2) return n;\n  let a = 0, b = 1;\n  for (let i = 2; i <= n; i++) [a,b] = [b, a+b];\n  return b;\n}`,
    },
  }),
  bitmanipulation: t("Bit Tricks", {
    approachTitle: "Bitwise Manipulation",
    approachBody: "Use AND, OR, XOR, shifts to inspect/toggle/count bits in O(1) per element.",
    algorithm: ["Initialize accumulator (XOR=0, count=0)", "For each x apply bitwise op", "Optionally shift to inspect each bit", "Return final accumulator"],
    variables: ["x", "acc", "bit"],
    whyItWorks: "Bit operations leverage hardware-level parallelism; per-bit work is constant.",
    time: "O(n)", space: "O(1)",
    examples: [{ input: "[2,2,1]", output: "1" }],
    stepLogic: ["XOR x into acc.", "Pairs cancel.", "Acc holds the singleton."],
    code: {
      Java: `public int single(int[] a) { int x = 0; for (int v : a) x ^= v; return x; }`,
      Python: `def single(a):\n    x = 0\n    for v in a: x ^= v\n    return x`,
      "C++": `int single(vector<int>& a) { int x = 0; for (int v : a) x ^= v; return x; }`,
      JavaScript: `function single(a) { let x = 0; for (const v of a) x ^= v; return x; }`,
    },
  }),
  trie: t("Trie Insert/Search", {
    approachTitle: "Trie / Prefix Tree",
    approachBody: "Walk the trie character-by-character, creating new nodes when needed during insert; following them during search.",
    algorithm: ["Start at root", "For each character ch in word", "If child[ch] missing, create it (insert) or fail (search)", "Move to child[ch]", "Mark / check end-of-word flag"],
    variables: ["node", "ch", "children"],
    whyItWorks: "Each insert/search is proportional to word length, independent of dictionary size.",
    time: "O(L)", space: "O(L · alphabet)",
    examples: [{ input: 'insert "apple" + search "app"', output: "false (prefix only)" }],
    stepLogic: ["Walk char by char.", "Create or follow child.", "Set end flag at last char."],
    code: {
      Java: `class Trie { Trie[] c = new Trie[26]; boolean end;\n  public void insert(String w) { Trie n = this; for (char ch : w.toCharArray()) { int i = ch-'a'; if (n.c[i] == null) n.c[i] = new Trie(); n = n.c[i]; } n.end = true; }\n}`,
      Python: `class Trie:\n    def __init__(self): self.c, self.end = {}, False\n    def insert(self, w):\n        n = self\n        for ch in w:\n            n = n.c.setdefault(ch, Trie())\n        n.end = True`,
      "C++": `struct Trie { Trie* c[26]={}; bool end=false;\n  void insert(const string& w) { Trie* n=this; for (char ch:w) { int i=ch-'a'; if(!n->c[i]) n->c[i]=new Trie(); n=n->c[i]; } n->end=true; }\n};`,
      JavaScript: `class Trie { constructor(){ this.c={}; this.end=false; }\n  insert(w){ let n=this; for (const ch of w) { if(!n.c[ch]) n.c[ch]=new Trie(); n=n.c[ch]; } n.end=true; } }`,
    },
  }),
  design: t("Class Design", {
    approachTitle: "API + Data Structure Design",
    approachBody: "Pick the right combo of hashmap + doubly linked list / heap / queue so every public method runs in O(1) or O(log n).",
    algorithm: ["List the API methods and their target complexities", "Pick supporting structures (HashMap, DLL, Heap)", "Implement each method respecting invariants", "Test edge cases (empty, capacity, eviction)"],
    variables: ["map", "list/queue", "capacity"],
    whyItWorks: "Combining structures lets each method use the structure that gives it O(1)/O(log n).",
    time: "O(1) per op (amortized)", space: "O(capacity)",
    examples: [{ input: "LRU(2): put(1,1) put(2,2) get(1) put(3,3) get(2)", output: "1, -1" }],
    stepLogic: ["put: insert and possibly evict.", "get: move node to front.", "Maintain map ↔ list invariants."],
    code: {
      Java: `class LRU extends LinkedHashMap<Integer,Integer> {\n  private final int cap;\n  LRU(int c){ super(c, 0.75f, true); cap = c; }\n  protected boolean removeEldestEntry(Map.Entry<Integer,Integer> e){ return size() > cap; }\n}`,
      Python: `from collections import OrderedDict\nclass LRU(OrderedDict):\n    def __init__(self, cap): super().__init__(); self.cap = cap\n    def get(self, k): \n        if k not in self: return -1\n        self.move_to_end(k); return self[k]\n    def put(self, k, v):\n        if k in self: self.move_to_end(k)\n        self[k] = v\n        if len(self) > self.cap: self.popitem(last=False)`,
      "C++": `// list<pair<int,int>> + unordered_map<int, list iterator>`,
      JavaScript: `class LRU { constructor(cap){ this.cap = cap; this.m = new Map(); }\n  get(k){ if (!this.m.has(k)) return -1; const v = this.m.get(k); this.m.delete(k); this.m.set(k, v); return v; }\n  put(k, v){ if (this.m.has(k)) this.m.delete(k); this.m.set(k, v); if (this.m.size > this.cap) this.m.delete(this.m.keys().next().value); } }`,
    },
  }),
};

export const FALLBACK_TEMPLATE = TOPIC_TEMPLATES.arrays;
