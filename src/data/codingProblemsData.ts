// LeetCode-style coding problems seed data
// Each problem has: statement, examples, constraints, starter code per language,
// reference solution, sample tests (visible) and hidden tests (used by submit).

export type Difficulty = "Easy" | "Medium" | "Hard";

export type LangId =
  | "python"
  | "cpp"
  | "java"
  | "javascript"
  | "typescript"
  | "c"
  | "go"
  | "sql";

export interface LanguageInfo {
  id: LangId;
  label: string;
  monaco: string;
  judge0Id: number;
}

// SQL is executed via the dedicated `run-sql` / `submit-sql` edge functions
// (in-memory SQLite). The judge0Id is unused for SQL; we keep a stable
// sentinel (82 = SQLite/SQL in Judge0) for backwards compatibility with
// code that records `language_id`.
export const LANGUAGES: LanguageInfo[] = [
  { id: "python", label: "Python 3", monaco: "python", judge0Id: 71 },
  { id: "cpp", label: "C++ (GCC 9.2)", monaco: "cpp", judge0Id: 54 },
  { id: "java", label: "Java", monaco: "java", judge0Id: 62 },
  { id: "javascript", label: "JavaScript (Node)", monaco: "javascript", judge0Id: 63 },
  { id: "typescript", label: "TypeScript", monaco: "typescript", judge0Id: 74 },
  { id: "c", label: "C (GCC 9.2)", monaco: "c", judge0Id: 50 },
  { id: "go", label: "Go", monaco: "go", judge0Id: 60 },
  { id: "sql", label: "SQL (SQLite)", monaco: "sql", judge0Id: 82 },
];

export const isSQLLang = (id: LangId): boolean => id === "sql";

export const getLanguageById = (id: LangId) =>
  LANGUAGES.find((l) => l.id === id)!;

export interface CodeExample {
  input: string;
  output: string;
  explanation?: string;
}

export interface TestCase {
  input: string;
  expected: string;
}

// SQL problems use a different execution model (in-memory SQLite). Each
// problem ships a schema (DDL), seed data (DML), an expected result-set
// description, and a reference query. Sample/hidden tests are not used for
// SQL — instead, the user's query is executed against the seeded DB and
// compared with the result of the reference query.
export interface SQLProblemSpec {
  schema: string;          // CREATE TABLE statements
  seed: string;            // INSERT statements
  referenceQuery: string;  // ground-truth SQL
  // If true, row order matters when comparing user output vs reference.
  // Defaults to false (for queries without ORDER BY).
  orderMatters?: boolean;
  // Optional: starter SQL placed in the editor.
  starter?: string;
}

export interface CodingProblem {
  slug: string;
  title: string;
  difficulty: Difficulty;
  topics: string[];
  description: string; // markdown
  examples: CodeExample[];
  constraints: string[];
  hints: string[];
  starterCode: Partial<Record<LangId, string>>;
  referenceSolution: Partial<Record<LangId, string>>;
  sampleTests: TestCase[]; // visible to user
  hiddenTests: TestCase[]; // used at submit time
  cpuTimeLimitSec?: number;
  memoryLimitKb?: number;
  // Present only on SQL problems. When set, the editor switches to SQL mode
  // and Run/Submit go through the run-sql/submit-sql edge functions.
  sql?: SQLProblemSpec;
}

// ---------- Helpers for building starter code ----------
const py = (body: string) => body;
const cpp = (body: string) => body;
const java = (body: string) => body;
const js = (body: string) => body;
const ts = (body: string) => body;
const c = (body: string) => body;
const go = (body: string) => body;

// =============================================================
//                       PROBLEMS
// =============================================================

export const CODING_PROBLEMS: CodingProblem[] = [
  // ----------------------------------------------------------
  {
    slug: "two-sum",
    title: "Two Sum",
    difficulty: "Easy",
    topics: ["Array", "Hash Table"],
    description: `Given an array of integers \`nums\` and an integer \`target\`, return the **indices** of the two numbers such that they add up to \`target\`.

You may assume that each input would have **exactly one solution**, and you may not use the same element twice.

You can return the answer in any order.`,
    examples: [
      { input: "nums = [2,7,11,15], target = 9", output: "[0,1]", explanation: "nums[0] + nums[1] == 9" },
      { input: "nums = [3,2,4], target = 6", output: "[1,2]" },
      { input: "nums = [3,3], target = 6", output: "[0,1]" },
    ],
    constraints: [
      "2 <= nums.length <= 10^4",
      "-10^9 <= nums[i] <= 10^9",
      "-10^9 <= target <= 10^9",
      "Only one valid answer exists.",
    ],
    hints: [
      "A brute force O(n^2) approach works but try to do better.",
      "Use a hash map to store numbers you've seen — for each new number x, check if (target - x) is in the map.",
    ],
    starterCode: {
      python: py(`# Input format:
# Line 1: n target
# Line 2: n space-separated integers
# Print the two indices (sorted) separated by space.

import sys

def two_sum(nums, target):
    # TODO: write your solution
    pass

def main():
    data = sys.stdin.read().split()
    n, target = int(data[0]), int(data[1])
    nums = [int(x) for x in data[2:2+n]]
    res = two_sum(nums, target)
    if res is None:
        return
    a, b = sorted(res)
    print(a, b)

main()
`),
      cpp: cpp(`#include <bits/stdc++.h>
using namespace std;

vector<int> twoSum(vector<int>& nums, int target) {
    // TODO
    return {};
}

int main() {
    int n; long long target;
    cin >> n >> target;
    vector<int> nums(n);
    for (auto& x : nums) cin >> x;
    auto res = twoSum(nums, (int)target);
    sort(res.begin(), res.end());
    if (res.size() == 2) cout << res[0] << " " << res[1];
    return 0;
}
`),
      java: java(`import java.util.*;

public class Main {
    static int[] twoSum(int[] nums, int target) {
        // TODO
        return new int[]{};
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        long target = sc.nextLong();
        int[] nums = new int[n];
        for (int i = 0; i < n; i++) nums[i] = sc.nextInt();
        int[] res = twoSum(nums, (int) target);
        if (res.length == 2) {
            Arrays.sort(res);
            System.out.print(res[0] + " " + res[1]);
        }
    }
}
`),
      javascript: js(`// stdin: "n target\\nnum1 num2 ..."
function twoSum(nums, target) {
    // TODO
    return [];
}

let input = "";
process.stdin.on("data", d => input += d);
process.stdin.on("end", () => {
    const tokens = input.split(/\\s+/).filter(Boolean).map(Number);
    const n = tokens[0], target = tokens[1];
    const nums = tokens.slice(2, 2 + n);
    const res = twoSum(nums, target);
    if (res.length === 2) {
        res.sort((a,b)=>a-b);
        console.log(res[0] + " " + res[1]);
    }
});
`),
      typescript: ts(`function twoSum(nums: number[], target: number): number[] {
    // TODO
    return [];
}

let input = "";
process.stdin.on("data", (d: Buffer) => { input += d.toString(); });
process.stdin.on("end", () => {
    const tokens = input.split(/\\s+/).filter(Boolean).map(Number);
    const n = tokens[0], target = tokens[1];
    const nums = tokens.slice(2, 2 + n);
    const res = twoSum(nums, target);
    if (res.length === 2) {
        res.sort((a,b)=>a-b);
        console.log(res[0] + " " + res[1]);
    }
});
`),
      c: c(`#include <stdio.h>
#include <stdlib.h>

void two_sum(int* nums, int n, int target, int* a, int* b) {
    // TODO
    *a = -1; *b = -1;
}

int main() {
    int n, target; scanf("%d %d", &n, &target);
    int* nums = malloc(sizeof(int)*n);
    for (int i = 0; i < n; i++) scanf("%d", &nums[i]);
    int a, b; two_sum(nums, n, target, &a, &b);
    if (a > b) { int t = a; a = b; b = t; }
    if (a >= 0) printf("%d %d", a, b);
    free(nums);
    return 0;
}
`),
      go: go(`package main

import (
    "bufio"
    "fmt"
    "os"
    "sort"
)

func twoSum(nums []int, target int) []int {
    // TODO
    return nil
}

func main() {
    reader := bufio.NewReader(os.Stdin)
    var n, target int
    fmt.Fscan(reader, &n, &target)
    nums := make([]int, n)
    for i := 0; i < n; i++ { fmt.Fscan(reader, &nums[i]) }
    res := twoSum(nums, target)
    if len(res) == 2 {
        sort.Ints(res)
        fmt.Print(res[0], " ", res[1])
    }
}
`),
    },
    referenceSolution: {
      python: `def two_sum(nums, target):
    seen = {}
    for i, x in enumerate(nums):
        if target - x in seen:
            return [seen[target - x], i]
        seen[x] = i`,
    },
    sampleTests: [
      { input: "4 9\n2 7 11 15", expected: "0 1" },
      { input: "3 6\n3 2 4", expected: "1 2" },
    ],
    hiddenTests: [
      { input: "4 9\n2 7 11 15", expected: "0 1" },
      { input: "3 6\n3 2 4", expected: "1 2" },
      { input: "2 6\n3 3", expected: "0 1" },
      { input: "5 10\n1 5 5 9 1", expected: "1 2" },
      { input: "6 -2\n-1 -1 5 8 -3 7", expected: "0 1" },
    ],
  },

  // ----------------------------------------------------------
  {
    slug: "valid-parentheses",
    title: "Valid Parentheses",
    difficulty: "Easy",
    topics: ["String", "Stack"],
    description: `Given a string \`s\` containing just the characters \`'('\`, \`')'\`, \`'{'\`, \`'}'\`, \`'['\` and \`']'\`, determine if the input string is **valid**.

A string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.

Print \`true\` if valid, otherwise \`false\`.`,
    examples: [
      { input: `s = "()"`, output: "true" },
      { input: `s = "()[]{}"`, output: "true" },
      { input: `s = "(]"`, output: "false" },
    ],
    constraints: ["1 <= s.length <= 10^4", "s consists only of '()[]{}'"],
    hints: ["Use a stack — push opening brackets, on closing pop and match."],
    starterCode: {
      python: py(`import sys

def is_valid(s):
    # TODO
    return False

def main():
    s = sys.stdin.read().strip()
    print("true" if is_valid(s) else "false")

main()
`),
      cpp: cpp(`#include <bits/stdc++.h>
using namespace std;

bool isValid(string s) {
    // TODO
    return false;
}

int main() {
    string s; getline(cin, s);
    cout << (isValid(s) ? "true" : "false");
    return 0;
}
`),
      java: java(`import java.util.*;

public class Main {
    static boolean isValid(String s) {
        // TODO
        return false;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String s = sc.hasNextLine() ? sc.nextLine() : "";
        System.out.print(isValid(s) ? "true" : "false");
    }
}
`),
      javascript: js(`function isValid(s) {
    // TODO
    return false;
}

let input = "";
process.stdin.on("data", d => input += d);
process.stdin.on("end", () => {
    console.log(isValid(input.replace(/\\n$/, "")) ? "true" : "false");
});
`),
      typescript: ts(`function isValid(s: string): boolean {
    // TODO
    return false;
}

let input = "";
process.stdin.on("data", (d: Buffer) => { input += d.toString(); });
process.stdin.on("end", () => {
    console.log(isValid(input.replace(/\\n$/, "")) ? "true" : "false");
});
`),
      c: c(`#include <stdio.h>
#include <string.h>

int isValid(const char* s) {
    // TODO
    return 0;
}

int main() {
    char s[10005];
    if (!fgets(s, sizeof(s), stdin)) s[0] = 0;
    s[strcspn(s, "\\n")] = 0;
    printf("%s", isValid(s) ? "true" : "false");
    return 0;
}
`),
      go: go(`package main

import (
    "bufio"
    "fmt"
    "os"
    "strings"
)

func isValid(s string) bool {
    // TODO
    return false
}

func main() {
    sc := bufio.NewScanner(os.Stdin)
    sc.Buffer(make([]byte, 1024*64), 1024*64)
    var s string
    if sc.Scan() { s = sc.Text() }
    s = strings.TrimRight(s, "\\n")
    if isValid(s) { fmt.Print("true") } else { fmt.Print("false") }
}
`),
    },
    referenceSolution: {
      python: `def is_valid(s):
    pairs = {')': '(', ']': '[', '}': '{'}
    stack = []
    for c in s:
        if c in '([{':
            stack.append(c)
        else:
            if not stack or stack.pop() != pairs[c]:
                return False
    return not stack`,
    },
    sampleTests: [
      { input: "()", expected: "true" },
      { input: "()[]{}", expected: "true" },
      { input: "(]", expected: "false" },
    ],
    hiddenTests: [
      { input: "()", expected: "true" },
      { input: "()[]{}", expected: "true" },
      { input: "(]", expected: "false" },
      { input: "([{}])", expected: "true" },
      { input: "([)]", expected: "false" },
      { input: "{", expected: "false" },
      { input: "}}", expected: "false" },
    ],
  },

  // ----------------------------------------------------------
  {
    slug: "reverse-string",
    title: "Reverse String",
    difficulty: "Easy",
    topics: ["String", "Two Pointers"],
    description: `Given a string \`s\` (read from stdin), print the string reversed.`,
    examples: [
      { input: `s = "hello"`, output: `"olleh"` },
      { input: `s = "abcd"`, output: `"dcba"` },
    ],
    constraints: ["1 <= s.length <= 10^5"],
    hints: ["Two pointers from both ends, swap and move inward."],
    starterCode: {
      python: py(`import sys

def main():
    s = sys.stdin.read().rstrip("\\n")
    # TODO: print reversed s
    pass

main()
`),
      cpp: cpp(`#include <bits/stdc++.h>
using namespace std;
int main() {
    string s; getline(cin, s);
    // TODO
    cout << s;
    return 0;
}
`),
      java: java(`import java.util.*;
public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String s = sc.hasNextLine() ? sc.nextLine() : "";
        // TODO
        System.out.print(s);
    }
}
`),
      javascript: js(`let input = "";
process.stdin.on("data", d => input += d);
process.stdin.on("end", () => {
    const s = input.replace(/\\n$/, "");
    // TODO
    process.stdout.write(s);
});
`),
      typescript: ts(`let input = "";
process.stdin.on("data", (d: Buffer) => { input += d.toString(); });
process.stdin.on("end", () => {
    const s = input.replace(/\\n$/, "");
    // TODO
    process.stdout.write(s);
});
`),
      c: c(`#include <stdio.h>
#include <string.h>
int main() {
    char s[100005];
    if (!fgets(s, sizeof(s), stdin)) s[0] = 0;
    s[strcspn(s, "\\n")] = 0;
    // TODO
    printf("%s", s);
    return 0;
}
`),
      go: go(`package main
import ("bufio"; "fmt"; "os")
func main() {
    sc := bufio.NewScanner(os.Stdin)
    sc.Buffer(make([]byte, 1024*128), 1024*128)
    var s string
    if sc.Scan() { s = sc.Text() }
    // TODO
    fmt.Print(s)
}
`),
    },
    referenceSolution: {
      python: `import sys
s = sys.stdin.read().rstrip("\\n")
print(s[::-1])`,
    },
    sampleTests: [
      { input: "hello", expected: "olleh" },
      { input: "abcd", expected: "dcba" },
    ],
    hiddenTests: [
      { input: "hello", expected: "olleh" },
      { input: "abcd", expected: "dcba" },
      { input: "a", expected: "a" },
      { input: "racecar", expected: "racecar" },
      { input: "Lovable", expected: "elbavoL" },
    ],
  },

  // ----------------------------------------------------------
  {
    slug: "fizzbuzz",
    title: "FizzBuzz",
    difficulty: "Easy",
    topics: ["Math", "Simulation"],
    description: `Given an integer \`n\`, print numbers from \`1\` to \`n\` (one per line), but:
- print "Fizz" for multiples of 3
- print "Buzz" for multiples of 5
- print "FizzBuzz" for multiples of both 3 and 5`,
    examples: [{ input: "n = 5", output: "1\n2\nFizz\n4\nBuzz" }],
    constraints: ["1 <= n <= 10^4"],
    hints: ["Check divisibility by 15 first."],
    starterCode: {
      python: py(`import sys
n = int(sys.stdin.read().strip())
# TODO: print FizzBuzz from 1..n
`),
      cpp: cpp(`#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    // TODO
    return 0;
}
`),
      java: java(`import java.util.*;
public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        // TODO
    }
}
`),
      javascript: js(`let input = "";
process.stdin.on("data", d => input += d);
process.stdin.on("end", () => {
    const n = parseInt(input.trim());
    // TODO
});
`),
      typescript: ts(`let input = "";
process.stdin.on("data", (d: Buffer) => { input += d.toString(); });
process.stdin.on("end", () => {
    const n = parseInt(input.trim());
    // TODO
});
`),
      c: c(`#include <stdio.h>
int main() {
    int n; scanf("%d", &n);
    // TODO
    return 0;
}
`),
      go: go(`package main
import ("bufio"; "fmt"; "os")
func main() {
    r := bufio.NewReader(os.Stdin)
    var n int
    fmt.Fscan(r, &n)
    // TODO
}
`),
    },
    referenceSolution: {
      python: `n = int(input())
for i in range(1, n+1):
    if i % 15 == 0: print("FizzBuzz")
    elif i % 3 == 0: print("Fizz")
    elif i % 5 == 0: print("Buzz")
    else: print(i)`,
    },
    sampleTests: [{ input: "5", expected: "1\n2\nFizz\n4\nBuzz" }],
    hiddenTests: [
      { input: "1", expected: "1" },
      { input: "3", expected: "1\n2\nFizz" },
      { input: "5", expected: "1\n2\nFizz\n4\nBuzz" },
      { input: "15", expected: "1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz" },
    ],
  },

  // ----------------------------------------------------------
  {
    slug: "palindrome-number",
    title: "Palindrome Number",
    difficulty: "Easy",
    topics: ["Math"],
    description: `Given an integer \`x\`, print "true" if it's a palindrome, else "false". Negative numbers are not palindromes.`,
    examples: [
      { input: "x = 121", output: "true" },
      { input: "x = -121", output: "false" },
      { input: "x = 10", output: "false" },
    ],
    constraints: ["-2^31 <= x <= 2^31 - 1"],
    hints: ["Convert to string OR reverse the number arithmetically."],
    starterCode: {
      python: py(`import sys
x = int(sys.stdin.read().strip())
# TODO
`),
      cpp: cpp(`#include <bits/stdc++.h>
using namespace std;
int main() {
    long long x; cin >> x;
    // TODO
    return 0;
}
`),
      java: java(`import java.util.*;
public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        long x = sc.nextLong();
        // TODO
    }
}
`),
      javascript: js(`let input = "";
process.stdin.on("data", d => input += d);
process.stdin.on("end", () => {
    const x = parseInt(input.trim());
    // TODO
});
`),
      typescript: ts(`let input = "";
process.stdin.on("data", (d: Buffer) => { input += d.toString(); });
process.stdin.on("end", () => {
    const x = parseInt(input.trim());
    // TODO
});
`),
      c: c(`#include <stdio.h>
int main() {
    long long x; scanf("%lld", &x);
    // TODO
    return 0;
}
`),
      go: go(`package main
import ("bufio"; "fmt"; "os")
func main() {
    r := bufio.NewReader(os.Stdin)
    var x int64
    fmt.Fscan(r, &x)
    // TODO
}
`),
    },
    referenceSolution: {
      python: `x = int(input())
s = str(x)
print("true" if s == s[::-1] and x >= 0 else "false")`,
    },
    sampleTests: [
      { input: "121", expected: "true" },
      { input: "-121", expected: "false" },
      { input: "10", expected: "false" },
    ],
    hiddenTests: [
      { input: "121", expected: "true" },
      { input: "-121", expected: "false" },
      { input: "10", expected: "false" },
      { input: "0", expected: "true" },
      { input: "1221", expected: "true" },
      { input: "12321", expected: "true" },
      { input: "123", expected: "false" },
    ],
  },

  // ----------------------------------------------------------
  {
    slug: "maximum-subarray",
    title: "Maximum Subarray",
    difficulty: "Medium",
    topics: ["Array", "Dynamic Programming"],
    description: `Given an integer array \`nums\`, find the contiguous subarray (containing at least one number) which has the largest sum, and print that sum.

**Input format:**
- Line 1: \`n\`
- Line 2: \`n\` space-separated integers`,
    examples: [
      { input: "nums = [-2,1,-3,4,-1,2,1,-5,4]", output: "6", explanation: "Subarray [4,-1,2,1] has sum 6." },
      { input: "nums = [1]", output: "1" },
      { input: "nums = [5,4,-1,7,8]", output: "23" },
    ],
    constraints: ["1 <= n <= 10^5", "-10^4 <= nums[i] <= 10^4"],
    hints: ["Kadane's algorithm: track current best ending here, and global best."],
    starterCode: {
      python: py(`import sys
data = sys.stdin.read().split()
n = int(data[0])
nums = [int(x) for x in data[1:1+n]]
# TODO
`),
      cpp: cpp(`#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    vector<int> a(n);
    for (auto& x : a) cin >> x;
    // TODO
    return 0;
}
`),
      java: java(`import java.util.*;
public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int[] a = new int[n];
        for (int i=0;i<n;i++) a[i]=sc.nextInt();
        // TODO
    }
}
`),
      javascript: js(`let input = "";
process.stdin.on("data", d => input += d);
process.stdin.on("end", () => {
    const t = input.split(/\\s+/).filter(Boolean).map(Number);
    const n = t[0]; const a = t.slice(1, 1+n);
    // TODO
});
`),
      typescript: ts(`let input = "";
process.stdin.on("data", (d: Buffer) => { input += d.toString(); });
process.stdin.on("end", () => {
    const t = input.split(/\\s+/).filter(Boolean).map(Number);
    const n = t[0]; const a = t.slice(1, 1+n);
    // TODO
});
`),
      c: c(`#include <stdio.h>
int main() {
    int n; scanf("%d", &n);
    int a[100005];
    for (int i=0;i<n;i++) scanf("%d",&a[i]);
    // TODO
    return 0;
}
`),
      go: go(`package main
import ("bufio"; "fmt"; "os")
func main() {
    r := bufio.NewReader(os.Stdin)
    var n int
    fmt.Fscan(r, &n)
    a := make([]int, n)
    for i := range a { fmt.Fscan(r, &a[i]) }
    // TODO
}
`),
    },
    referenceSolution: {
      python: `import sys
data = sys.stdin.read().split()
n = int(data[0])
a = [int(x) for x in data[1:1+n]]
best = cur = a[0]
for x in a[1:]:
    cur = max(x, cur + x)
    best = max(best, cur)
print(best)`,
    },
    sampleTests: [
      { input: "9\n-2 1 -3 4 -1 2 1 -5 4", expected: "6" },
      { input: "1\n1", expected: "1" },
    ],
    hiddenTests: [
      { input: "9\n-2 1 -3 4 -1 2 1 -5 4", expected: "6" },
      { input: "1\n1", expected: "1" },
      { input: "5\n5 4 -1 7 8", expected: "23" },
      { input: "4\n-1 -2 -3 -4", expected: "-1" },
      { input: "6\n8 -19 5 -4 20 -1", expected: "21" },
    ],
  },

  // ----------------------------------------------------------
  {
    slug: "climbing-stairs",
    title: "Climbing Stairs",
    difficulty: "Easy",
    topics: ["Dynamic Programming", "Math"],
    description: `You are climbing a staircase. It takes \`n\` steps to reach the top. Each time you can either climb \`1\` or \`2\` steps. In how many distinct ways can you climb to the top?`,
    examples: [
      { input: "n = 2", output: "2", explanation: "1+1 or 2" },
      { input: "n = 3", output: "3" },
    ],
    constraints: ["1 <= n <= 45"],
    hints: ["This is the Fibonacci sequence."],
    starterCode: {
      python: py(`import sys
n = int(sys.stdin.read().strip())
# TODO
`),
      cpp: cpp(`#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    // TODO
    return 0;
}
`),
      java: java(`import java.util.*;
public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        // TODO
    }
}
`),
      javascript: js(`let input = "";
process.stdin.on("data", d => input += d);
process.stdin.on("end", () => {
    const n = parseInt(input.trim());
    // TODO
});
`),
      typescript: ts(`let input = "";
process.stdin.on("data", (d: Buffer) => { input += d.toString(); });
process.stdin.on("end", () => {
    const n = parseInt(input.trim());
    // TODO
});
`),
      c: c(`#include <stdio.h>
int main() {
    int n; scanf("%d", &n);
    // TODO
    return 0;
}
`),
      go: go(`package main
import ("bufio"; "fmt"; "os")
func main() {
    r := bufio.NewReader(os.Stdin)
    var n int
    fmt.Fscan(r, &n)
    // TODO
}
`),
    },
    referenceSolution: {
      python: `n = int(input())
a, b = 1, 1
for _ in range(n): a, b = b, a + b
print(a)`,
    },
    sampleTests: [
      { input: "2", expected: "2" },
      { input: "3", expected: "3" },
    ],
    hiddenTests: [
      { input: "1", expected: "1" },
      { input: "2", expected: "2" },
      { input: "3", expected: "3" },
      { input: "5", expected: "8" },
      { input: "10", expected: "89" },
      { input: "20", expected: "10946" },
    ],
  },

  // ----------------------------------------------------------
  {
    slug: "merge-sorted-arrays",
    title: "Merge Two Sorted Arrays",
    difficulty: "Easy",
    topics: ["Array", "Two Pointers"],
    description: `Given two sorted integer arrays \`a\` and \`b\`, merge them into one sorted array and print it space-separated.

**Input format:**
- Line 1: \`n m\`
- Line 2: n integers (sorted)
- Line 3: m integers (sorted)`,
    examples: [{ input: "n=3, m=3\\na=[1,2,3], b=[2,5,6]", output: "1 2 2 3 5 6" }],
    constraints: ["0 <= n,m <= 10^5"],
    hints: ["Two-pointer merge."],
    starterCode: {
      python: py(`import sys
data = sys.stdin.read().split()
n, m = int(data[0]), int(data[1])
a = [int(x) for x in data[2:2+n]]
b = [int(x) for x in data[2+n:2+n+m]]
# TODO
`),
      cpp: cpp(`#include <bits/stdc++.h>
using namespace std;
int main() {
    int n,m; cin>>n>>m;
    vector<int> a(n), b(m);
    for(auto&x:a)cin>>x; for(auto&x:b)cin>>x;
    // TODO
    return 0;
}
`),
      java: java(`import java.util.*;
public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n=sc.nextInt(), m=sc.nextInt();
        int[] a=new int[n], b=new int[m];
        for(int i=0;i<n;i++)a[i]=sc.nextInt();
        for(int i=0;i<m;i++)b[i]=sc.nextInt();
        // TODO
    }
}
`),
      javascript: js(`let input="";process.stdin.on("data",d=>input+=d);
process.stdin.on("end",()=>{
    const t=input.split(/\\s+/).filter(Boolean).map(Number);
    const n=t[0],m=t[1];
    const a=t.slice(2,2+n), b=t.slice(2+n,2+n+m);
    // TODO
});
`),
      typescript: ts(`let input="";process.stdin.on("data",(d:Buffer)=>{input+=d.toString();});
process.stdin.on("end",()=>{
    const t=input.split(/\\s+/).filter(Boolean).map(Number);
    const n=t[0],m=t[1];
    const a=t.slice(2,2+n), b=t.slice(2+n,2+n+m);
    // TODO
});
`),
      c: c(`#include <stdio.h>
int main(){
    int n,m; scanf("%d %d",&n,&m);
    int a[100005], b[100005];
    for(int i=0;i<n;i++)scanf("%d",&a[i]);
    for(int i=0;i<m;i++)scanf("%d",&b[i]);
    // TODO
    return 0;
}
`),
      go: go(`package main
import ("bufio";"fmt";"os")
func main(){
    r:=bufio.NewReader(os.Stdin)
    var n,m int; fmt.Fscan(r,&n,&m)
    a:=make([]int,n); b:=make([]int,m)
    for i:=range a{fmt.Fscan(r,&a[i])}
    for i:=range b{fmt.Fscan(r,&b[i])}
    // TODO
}
`),
    },
    referenceSolution: {
      python: `import sys
data = sys.stdin.read().split()
n, m = int(data[0]), int(data[1])
a = [int(x) for x in data[2:2+n]]
b = [int(x) for x in data[2+n:2+n+m]]
i=j=0; out=[]
while i<n and j<m:
    if a[i]<=b[j]: out.append(a[i]); i+=1
    else: out.append(b[j]); j+=1
out += a[i:]; out += b[j:]
print(" ".join(map(str,out)))`,
    },
    sampleTests: [
      { input: "3 3\n1 2 3\n2 5 6", expected: "1 2 2 3 5 6" },
      { input: "1 0\n1", expected: "1" },
    ],
    hiddenTests: [
      { input: "3 3\n1 2 3\n2 5 6", expected: "1 2 2 3 5 6" },
      { input: "1 0\n1", expected: "1" },
      { input: "0 1\n7", expected: "7" },
      { input: "4 4\n-5 -1 0 4\n-3 2 6 9", expected: "-5 -3 -1 0 2 4 6 9" },
      { input: "0 0", expected: "" },
    ],
  },

  // ----------------------------------------------------------
  {
    slug: "best-time-to-buy-stock",
    title: "Best Time to Buy and Sell Stock",
    difficulty: "Easy",
    topics: ["Array", "Dynamic Programming"],
    description: `You are given an array \`prices\` where \`prices[i]\` is the price of a stock on day \`i\`. Pick a single day to buy and a future day to sell to maximize profit. Print the max profit (\`0\` if no profit is possible).

**Input format:** \`n\` then \`n\` integers.`,
    examples: [
      { input: "[7,1,5,3,6,4]", output: "5" },
      { input: "[7,6,4,3,1]", output: "0" },
    ],
    constraints: ["1 <= n <= 10^5", "0 <= prices[i] <= 10^4"],
    hints: ["Track minimum so far while scanning."],
    starterCode: {
      python: py(`import sys
data = sys.stdin.read().split()
n = int(data[0])
p = [int(x) for x in data[1:1+n]]
# TODO
`),
      cpp: cpp(`#include <bits/stdc++.h>
using namespace std;
int main(){int n;cin>>n;vector<int>p(n);for(auto&x:p)cin>>x;
// TODO
return 0;}
`),
      java: java(`import java.util.*;
public class Main{public static void main(String[]a){Scanner sc=new Scanner(System.in);int n=sc.nextInt();int[]p=new int[n];for(int i=0;i<n;i++)p[i]=sc.nextInt();
// TODO
}}
`),
      javascript: js(`let input="";process.stdin.on("data",d=>input+=d);
process.stdin.on("end",()=>{
    const t=input.split(/\\s+/).filter(Boolean).map(Number);
    const n=t[0],p=t.slice(1,1+n);
    // TODO
});
`),
      typescript: ts(`let input="";process.stdin.on("data",(d:Buffer)=>{input+=d.toString();});
process.stdin.on("end",()=>{
    const t=input.split(/\\s+/).filter(Boolean).map(Number);
    const n=t[0],p=t.slice(1,1+n);
    // TODO
});
`),
      c: c(`#include <stdio.h>
int main(){int n;scanf("%d",&n);int p[100005];for(int i=0;i<n;i++)scanf("%d",&p[i]);
// TODO
return 0;}
`),
      go: go(`package main
import ("bufio";"fmt";"os")
func main(){r:=bufio.NewReader(os.Stdin);var n int;fmt.Fscan(r,&n)
p:=make([]int,n);for i:=range p{fmt.Fscan(r,&p[i])}
// TODO
}
`),
    },
    referenceSolution: {
      python: `import sys
data = sys.stdin.read().split()
n = int(data[0])
p = [int(x) for x in data[1:1+n]]
mn = 10**9; best = 0
for x in p:
    mn = min(mn, x)
    best = max(best, x - mn)
print(best)`,
    },
    sampleTests: [
      { input: "6\n7 1 5 3 6 4", expected: "5" },
      { input: "5\n7 6 4 3 1", expected: "0" },
    ],
    hiddenTests: [
      { input: "6\n7 1 5 3 6 4", expected: "5" },
      { input: "5\n7 6 4 3 1", expected: "0" },
      { input: "1\n5", expected: "0" },
      { input: "2\n1 2", expected: "1" },
      { input: "5\n2 4 1 7 3", expected: "6" },
    ],
  },

  // ----------------------------------------------------------
  {
    slug: "contains-duplicate",
    title: "Contains Duplicate",
    difficulty: "Easy",
    topics: ["Array", "Hash Table"],
    description: `Given an integer array, print "true" if any value appears at least twice, else "false".

**Input:** \`n\` then \`n\` integers.`,
    examples: [
      { input: "[1,2,3,1]", output: "true" },
      { input: "[1,2,3,4]", output: "false" },
    ],
    constraints: ["1 <= n <= 10^5"],
    hints: ["Hash set, O(n)."],
    starterCode: {
      python: py(`import sys
data = sys.stdin.read().split()
n = int(data[0])
a = [int(x) for x in data[1:1+n]]
# TODO
`),
      cpp: cpp(`#include <bits/stdc++.h>
using namespace std;
int main(){int n;cin>>n;vector<int>a(n);for(auto&x:a)cin>>x;
// TODO
return 0;}
`),
      java: java(`import java.util.*;
public class Main{public static void main(String[]args){Scanner sc=new Scanner(System.in);int n=sc.nextInt();int[]a=new int[n];for(int i=0;i<n;i++)a[i]=sc.nextInt();
// TODO
}}
`),
      javascript: js(`let input="";process.stdin.on("data",d=>input+=d);
process.stdin.on("end",()=>{
    const t=input.split(/\\s+/).filter(Boolean).map(Number);
    const n=t[0],a=t.slice(1,1+n);
    // TODO
});
`),
      typescript: ts(`let input="";process.stdin.on("data",(d:Buffer)=>{input+=d.toString();});
process.stdin.on("end",()=>{
    const t=input.split(/\\s+/).filter(Boolean).map(Number);
    const n=t[0],a=t.slice(1,1+n);
    // TODO
});
`),
      c: c(`#include <stdio.h>
int main(){int n;scanf("%d",&n);int a[100005];for(int i=0;i<n;i++)scanf("%d",&a[i]);
// TODO
return 0;}
`),
      go: go(`package main
import ("bufio";"fmt";"os")
func main(){r:=bufio.NewReader(os.Stdin);var n int;fmt.Fscan(r,&n)
a:=make([]int,n);for i:=range a{fmt.Fscan(r,&a[i])}
// TODO
}
`),
    },
    referenceSolution: {
      python: `import sys
data = sys.stdin.read().split()
n = int(data[0])
a = [int(x) for x in data[1:1+n]]
print("true" if len(set(a)) != n else "false")`,
    },
    sampleTests: [
      { input: "4\n1 2 3 1", expected: "true" },
      { input: "4\n1 2 3 4", expected: "false" },
    ],
    hiddenTests: [
      { input: "4\n1 2 3 1", expected: "true" },
      { input: "4\n1 2 3 4", expected: "false" },
      { input: "1\n5", expected: "false" },
      { input: "10\n1 1 1 1 1 1 1 1 1 1", expected: "true" },
      { input: "5\n0 0 0 0 1", expected: "true" },
    ],
  },

  // ----------------------------------------------------------
  {
    slug: "valid-anagram",
    title: "Valid Anagram",
    difficulty: "Easy",
    topics: ["Hash Table", "String", "Sorting"],
    description: `Given two strings \`s\` and \`t\`, print "true" if \`t\` is an anagram of \`s\`, else "false".

**Input:** two lines, \`s\` then \`t\`.`,
    examples: [
      { input: "s = anagram, t = nagaram", output: "true" },
      { input: "s = rat, t = car", output: "false" },
    ],
    constraints: ["1 <= |s|, |t| <= 5 * 10^4", "lowercase English letters"],
    hints: ["Compare character counts.", "Sorting also works in O(n log n)."],
    starterCode: {
      python: py(`import sys
data = sys.stdin.read().split()
s, t = data[0], data[1]
# TODO
`),
      cpp: cpp(`#include <bits/stdc++.h>
using namespace std;
int main(){string s,t;cin>>s>>t;
// TODO
return 0;}
`),
      java: java(`import java.util.*;
public class Main{public static void main(String[]args){Scanner sc=new Scanner(System.in);String s=sc.next(),t=sc.next();
// TODO
}}
`),
      javascript: js(`let input="";process.stdin.on("data",d=>input+=d);
process.stdin.on("end",()=>{const [s,t]=input.split(/\\s+/).filter(Boolean);
// TODO
});
`),
      typescript: ts(`let input="";process.stdin.on("data",(d:Buffer)=>{input+=d.toString();});
process.stdin.on("end",()=>{const [s,t]=input.split(/\\s+/).filter(Boolean);
// TODO
});
`),
      c: c(`#include <stdio.h>
#include <string.h>
int main(){char s[50005],t[50005];scanf("%s %s",s,t);
// TODO
return 0;}
`),
      go: go(`package main
import ("bufio";"fmt";"os")
func main(){r:=bufio.NewReader(os.Stdin);var s,t string;fmt.Fscan(r,&s,&t)
// TODO
}
`),
    },
    referenceSolution: {
      python: `data = __import__("sys").stdin.read().split()
s, t = data[0], data[1]
print("true" if sorted(s) == sorted(t) else "false")`,
    },
    sampleTests: [
      { input: "anagram\nnagaram", expected: "true" },
      { input: "rat\ncar", expected: "false" },
    ],
    hiddenTests: [
      { input: "anagram\nnagaram", expected: "true" },
      { input: "rat\ncar", expected: "false" },
      { input: "a\na", expected: "true" },
      { input: "ab\nba", expected: "true" },
      { input: "abc\nabd", expected: "false" },
      { input: "listen\nsilent", expected: "true" },
    ],
  },

  // ----------------------------------------------------------
  {
    slug: "reverse-linked-list",
    title: "Reverse a List",
    difficulty: "Easy",
    topics: ["Array", "Two Pointers"],
    description: `Given an array of \`n\` integers, print them reversed on one line, space-separated.

**Input:** \`n\` then \`n\` integers.`,
    examples: [{ input: "5\n1 2 3 4 5", output: "5 4 3 2 1" }],
    constraints: ["0 <= n <= 10^5"],
    hints: ["Two pointers from both ends."],
    starterCode: {
      python: py(`import sys
data = sys.stdin.read().split()
n = int(data[0])
a = [int(x) for x in data[1:1+n]]
# TODO
`),
      cpp: cpp(`#include <bits/stdc++.h>
using namespace std;
int main(){int n;cin>>n;vector<int>a(n);for(auto&x:a)cin>>x;
// TODO
return 0;}
`),
      java: java(`import java.util.*;
public class Main{public static void main(String[]args){Scanner sc=new Scanner(System.in);int n=sc.nextInt();int[]a=new int[n];for(int i=0;i<n;i++)a[i]=sc.nextInt();
// TODO
}}
`),
      javascript: js(`let input="";process.stdin.on("data",d=>input+=d);
process.stdin.on("end",()=>{const t=input.split(/\\s+/).filter(Boolean).map(Number);const n=t[0],a=t.slice(1,1+n);
// TODO
});
`),
      typescript: ts(`let input="";process.stdin.on("data",(d:Buffer)=>{input+=d.toString();});
process.stdin.on("end",()=>{const t=input.split(/\\s+/).filter(Boolean).map(Number);const n=t[0],a=t.slice(1,1+n);
// TODO
});
`),
      c: c(`#include <stdio.h>
int main(){int n;scanf("%d",&n);int a[100005];for(int i=0;i<n;i++)scanf("%d",&a[i]);
// TODO
return 0;}
`),
      go: go(`package main
import ("bufio";"fmt";"os")
func main(){r:=bufio.NewReader(os.Stdin);var n int;fmt.Fscan(r,&n);a:=make([]int,n);for i:=range a{fmt.Fscan(r,&a[i])}
// TODO
}
`),
    },
    referenceSolution: {
      python: `data = __import__("sys").stdin.read().split()
n = int(data[0])
a = [data[i+1] for i in range(n)]
print(" ".join(reversed(a)))`,
    },
    sampleTests: [{ input: "5\n1 2 3 4 5", expected: "5 4 3 2 1" }],
    hiddenTests: [
      { input: "5\n1 2 3 4 5", expected: "5 4 3 2 1" },
      { input: "1\n42", expected: "42" },
      { input: "0\n", expected: "" },
      { input: "3\n7 7 7", expected: "7 7 7" },
      { input: "4\n-1 -2 -3 -4", expected: "-4 -3 -2 -1" },
    ],
  },

  // ----------------------------------------------------------
  {
    slug: "binary-search",
    title: "Binary Search",
    difficulty: "Easy",
    topics: ["Binary Search", "Array"],
    description: `Given a sorted array of \`n\` integers and a target \`x\`, print the 0-based index of \`x\`, or \`-1\` if not present.

**Input:** \`n x\` then \`n\` sorted integers.`,
    examples: [{ input: "5 9\n-1 0 3 5 9", output: "4" }],
    constraints: ["1 <= n <= 10^5", "-10^9 <= a[i], x <= 10^9"],
    hints: ["Classic binary search — O(log n)."],
    starterCode: {
      python: py(`import sys
data = sys.stdin.read().split()
n, x = int(data[0]), int(data[1])
a = [int(v) for v in data[2:2+n]]
# TODO
`),
      cpp: cpp(`#include <bits/stdc++.h>
using namespace std;
int main(){int n,x;cin>>n>>x;vector<int>a(n);for(auto&v:a)cin>>v;
// TODO
return 0;}
`),
      java: java(`import java.util.*;
public class Main{public static void main(String[]args){Scanner sc=new Scanner(System.in);int n=sc.nextInt(),x=sc.nextInt();int[]a=new int[n];for(int i=0;i<n;i++)a[i]=sc.nextInt();
// TODO
}}
`),
      javascript: js(`let input="";process.stdin.on("data",d=>input+=d);
process.stdin.on("end",()=>{const t=input.split(/\\s+/).filter(Boolean).map(Number);const n=t[0],x=t[1],a=t.slice(2,2+n);
// TODO
});
`),
      typescript: ts(`let input="";process.stdin.on("data",(d:Buffer)=>{input+=d.toString();});
process.stdin.on("end",()=>{const t=input.split(/\\s+/).filter(Boolean).map(Number);const n=t[0],x=t[1],a=t.slice(2,2+n);
// TODO
});
`),
      c: c(`#include <stdio.h>
int main(){int n,x;scanf("%d %d",&n,&x);int a[100005];for(int i=0;i<n;i++)scanf("%d",&a[i]);
// TODO
return 0;}
`),
      go: go(`package main
import ("bufio";"fmt";"os")
func main(){r:=bufio.NewReader(os.Stdin);var n,x int;fmt.Fscan(r,&n,&x);a:=make([]int,n);for i:=range a{fmt.Fscan(r,&a[i])}
// TODO
}
`),
    },
    referenceSolution: {
      python: `import sys, bisect
data = sys.stdin.read().split()
n, x = int(data[0]), int(data[1])
a = [int(v) for v in data[2:2+n]]
i = bisect.bisect_left(a, x)
print(i if i < n and a[i] == x else -1)`,
    },
    sampleTests: [{ input: "5 9\n-1 0 3 5 9", expected: "4" }],
    hiddenTests: [
      { input: "5 9\n-1 0 3 5 9", expected: "4" },
      { input: "5 2\n-1 0 3 5 9", expected: "-1" },
      { input: "1 5\n5", expected: "0" },
      { input: "1 5\n6", expected: "-1" },
      { input: "6 4\n1 2 3 4 5 6", expected: "3" },
    ],
  },

  // ----------------------------------------------------------
  {
    slug: "valid-palindrome",
    title: "Valid Palindrome",
    difficulty: "Easy",
    topics: ["Two Pointers", "String"],
    description: `Given a string \`s\` (read as one full line), print "true" if it is a palindrome considering only alphanumeric characters and ignoring case, else "false".`,
    examples: [
      { input: "A man, a plan, a canal: Panama", output: "true" },
      { input: "race a car", output: "false" },
    ],
    constraints: ["1 <= |s| <= 2 * 10^5"],
    hints: ["Two pointers, skip non-alphanumeric, compare lowercase."],
    starterCode: {
      python: py(`import sys
s = sys.stdin.read().strip("\\n")
# TODO
`),
      cpp: cpp(`#include <bits/stdc++.h>
using namespace std;
int main(){string s;getline(cin,s);
// TODO
return 0;}
`),
      java: java(`import java.util.*;
public class Main{public static void main(String[]args){Scanner sc=new Scanner(System.in);String s=sc.nextLine();
// TODO
}}
`),
      javascript: js(`let input="";process.stdin.on("data",d=>input+=d);
process.stdin.on("end",()=>{const s=input.replace(/\\n$/,"");
// TODO
});
`),
      typescript: ts(`let input="";process.stdin.on("data",(d:Buffer)=>{input+=d.toString();});
process.stdin.on("end",()=>{const s=input.replace(/\\n$/,"");
// TODO
});
`),
      c: c(`#include <stdio.h>
#include <string.h>
int main(){char s[200005];fgets(s,sizeof(s),stdin);
// TODO
return 0;}
`),
      go: go(`package main
import ("bufio";"fmt";"os";"strings")
func main(){r:=bufio.NewReader(os.Stdin);s,_:=r.ReadString('\\n');s=strings.TrimRight(s,"\\n")
// TODO
_=fmt.Sprint(s)
}
`),
    },
    referenceSolution: {
      python: `import sys
s = sys.stdin.read().rstrip("\\n")
clean = [c.lower() for c in s if c.isalnum()]
print("true" if clean == clean[::-1] else "false")`,
    },
    sampleTests: [
      { input: "A man, a plan, a canal: Panama", expected: "true" },
      { input: "race a car", expected: "false" },
    ],
    hiddenTests: [
      { input: "A man, a plan, a canal: Panama", expected: "true" },
      { input: "race a car", expected: "false" },
      { input: " ", expected: "true" },
      { input: "0P", expected: "false" },
      { input: "ab_a", expected: "true" },
    ],
  },

  // ----------------------------------------------------------
  {
    slug: "single-number",
    title: "Single Number",
    difficulty: "Easy",
    topics: ["Bit Manipulation", "Array"],
    description: `Every integer in the array appears twice except one. Find and print it.

**Input:** \`n\` then \`n\` integers (n is odd).`,
    examples: [{ input: "3\n2 2 1", output: "1" }],
    constraints: ["1 <= n <= 3 * 10^4"],
    hints: ["XOR all numbers — duplicates cancel."],
    starterCode: {
      python: py(`import sys
data = sys.stdin.read().split()
n = int(data[0])
a = [int(x) for x in data[1:1+n]]
# TODO
`),
      cpp: cpp(`#include <bits/stdc++.h>
using namespace std;
int main(){int n;cin>>n;vector<int>a(n);for(auto&x:a)cin>>x;
// TODO
return 0;}
`),
      java: java(`import java.util.*;
public class Main{public static void main(String[]args){Scanner sc=new Scanner(System.in);int n=sc.nextInt();int[]a=new int[n];for(int i=0;i<n;i++)a[i]=sc.nextInt();
// TODO
}}
`),
      javascript: js(`let input="";process.stdin.on("data",d=>input+=d);
process.stdin.on("end",()=>{const t=input.split(/\\s+/).filter(Boolean).map(Number);const n=t[0],a=t.slice(1,1+n);
// TODO
});
`),
      typescript: ts(`let input="";process.stdin.on("data",(d:Buffer)=>{input+=d.toString();});
process.stdin.on("end",()=>{const t=input.split(/\\s+/).filter(Boolean).map(Number);const n=t[0],a=t.slice(1,1+n);
// TODO
});
`),
      c: c(`#include <stdio.h>
int main(){int n;scanf("%d",&n);int a[30005];for(int i=0;i<n;i++)scanf("%d",&a[i]);
// TODO
return 0;}
`),
      go: go(`package main
import ("bufio";"fmt";"os")
func main(){r:=bufio.NewReader(os.Stdin);var n int;fmt.Fscan(r,&n);a:=make([]int,n);for i:=range a{fmt.Fscan(r,&a[i])}
// TODO
}
`),
    },
    referenceSolution: {
      python: `data = __import__("sys").stdin.read().split()
n = int(data[0])
ans = 0
for v in data[1:1+n]:
    ans ^= int(v)
print(ans)`,
    },
    sampleTests: [{ input: "3\n2 2 1", expected: "1" }],
    hiddenTests: [
      { input: "3\n2 2 1", expected: "1" },
      { input: "5\n4 1 2 1 2", expected: "4" },
      { input: "1\n1", expected: "1" },
      { input: "7\n1 2 3 1 2 3 7", expected: "7" },
      { input: "3\n-1 -1 5", expected: "5" },
    ],
  },

  // ----------------------------------------------------------
  {
    slug: "missing-number",
    title: "Missing Number",
    difficulty: "Easy",
    topics: ["Math", "Array", "Bit Manipulation"],
    description: `Given an array of \`n\` distinct integers in range \`[0, n]\`, print the only number missing from the range.

**Input:** \`n\` then \`n\` integers.`,
    examples: [{ input: "3\n3 0 1", output: "2" }],
    constraints: ["1 <= n <= 10^4"],
    hints: ["Sum formula: n*(n+1)/2 minus actual sum."],
    starterCode: {
      python: py(`import sys
data = sys.stdin.read().split()
n = int(data[0])
a = [int(x) for x in data[1:1+n]]
# TODO
`),
      cpp: cpp(`#include <bits/stdc++.h>
using namespace std;
int main(){int n;cin>>n;vector<int>a(n);for(auto&x:a)cin>>x;
// TODO
return 0;}
`),
      java: java(`import java.util.*;
public class Main{public static void main(String[]args){Scanner sc=new Scanner(System.in);int n=sc.nextInt();int[]a=new int[n];for(int i=0;i<n;i++)a[i]=sc.nextInt();
// TODO
}}
`),
      javascript: js(`let input="";process.stdin.on("data",d=>input+=d);
process.stdin.on("end",()=>{const t=input.split(/\\s+/).filter(Boolean).map(Number);const n=t[0],a=t.slice(1,1+n);
// TODO
});
`),
      typescript: ts(`let input="";process.stdin.on("data",(d:Buffer)=>{input+=d.toString();});
process.stdin.on("end",()=>{const t=input.split(/\\s+/).filter(Boolean).map(Number);const n=t[0],a=t.slice(1,1+n);
// TODO
});
`),
      c: c(`#include <stdio.h>
int main(){int n;scanf("%d",&n);int a[10005];for(int i=0;i<n;i++)scanf("%d",&a[i]);
// TODO
return 0;}
`),
      go: go(`package main
import ("bufio";"fmt";"os")
func main(){r:=bufio.NewReader(os.Stdin);var n int;fmt.Fscan(r,&n);a:=make([]int,n);for i:=range a{fmt.Fscan(r,&a[i])}
// TODO
}
`),
    },
    referenceSolution: {
      python: `data = __import__("sys").stdin.read().split()
n = int(data[0])
total = n * (n + 1) // 2
print(total - sum(int(v) for v in data[1:1+n]))`,
    },
    sampleTests: [{ input: "3\n3 0 1", expected: "2" }],
    hiddenTests: [
      { input: "3\n3 0 1", expected: "2" },
      { input: "2\n0 1", expected: "2" },
      { input: "9\n9 6 4 2 3 5 7 0 1", expected: "8" },
      { input: "1\n0", expected: "1" },
      { input: "1\n1", expected: "0" },
    ],
  },

  // ----------------------------------------------------------
  {
    slug: "move-zeroes",
    title: "Move Zeroes",
    difficulty: "Easy",
    topics: ["Array", "Two Pointers"],
    description: `Given an array, move all \`0\`s to the end while maintaining the relative order of the non-zero elements. Print the final array space-separated.

**Input:** \`n\` then \`n\` integers.`,
    examples: [{ input: "5\n0 1 0 3 12", output: "1 3 12 0 0" }],
    constraints: ["1 <= n <= 10^4"],
    hints: ["Two pointers — write index for non-zero values."],
    starterCode: {
      python: py(`import sys
data = sys.stdin.read().split()
n = int(data[0])
a = [int(x) for x in data[1:1+n]]
# TODO
`),
      cpp: cpp(`#include <bits/stdc++.h>
using namespace std;
int main(){int n;cin>>n;vector<int>a(n);for(auto&x:a)cin>>x;
// TODO
return 0;}
`),
      java: java(`import java.util.*;
public class Main{public static void main(String[]args){Scanner sc=new Scanner(System.in);int n=sc.nextInt();int[]a=new int[n];for(int i=0;i<n;i++)a[i]=sc.nextInt();
// TODO
}}
`),
      javascript: js(`let input="";process.stdin.on("data",d=>input+=d);
process.stdin.on("end",()=>{const t=input.split(/\\s+/).filter(Boolean).map(Number);const n=t[0],a=t.slice(1,1+n);
// TODO
});
`),
      typescript: ts(`let input="";process.stdin.on("data",(d:Buffer)=>{input+=d.toString();});
process.stdin.on("end",()=>{const t=input.split(/\\s+/).filter(Boolean).map(Number);const n=t[0],a=t.slice(1,1+n);
// TODO
});
`),
      c: c(`#include <stdio.h>
int main(){int n;scanf("%d",&n);int a[10005];for(int i=0;i<n;i++)scanf("%d",&a[i]);
// TODO
return 0;}
`),
      go: go(`package main
import ("bufio";"fmt";"os")
func main(){r:=bufio.NewReader(os.Stdin);var n int;fmt.Fscan(r,&n);a:=make([]int,n);for i:=range a{fmt.Fscan(r,&a[i])}
// TODO
}
`),
    },
    referenceSolution: {
      python: `data = __import__("sys").stdin.read().split()
n = int(data[0])
a = [int(v) for v in data[1:1+n]]
nz = [v for v in a if v != 0]
nz += [0] * (n - len(nz))
print(" ".join(str(v) for v in nz))`,
    },
    sampleTests: [{ input: "5\n0 1 0 3 12", expected: "1 3 12 0 0" }],
    hiddenTests: [
      { input: "5\n0 1 0 3 12", expected: "1 3 12 0 0" },
      { input: "1\n0", expected: "0" },
      { input: "1\n5", expected: "5" },
      { input: "4\n0 0 0 1", expected: "1 0 0 0" },
      { input: "5\n1 2 3 4 5", expected: "1 2 3 4 5" },
    ],
  },

  // ----------------------------------------------------------
  {
    slug: "factorial",
    title: "Factorial",
    difficulty: "Easy",
    topics: ["Math", "Recursion"],
    description: `Given an integer \`n\`, print \`n!\` (factorial).`,
    examples: [{ input: "5", output: "120" }],
    constraints: ["0 <= n <= 20"],
    hints: ["Iterative loop is fine for n <= 20 (fits in 64-bit)."],
    starterCode: {
      python: py(`import sys
n = int(sys.stdin.read().strip())
# TODO
`),
      cpp: cpp(`#include <bits/stdc++.h>
using namespace std;
int main(){long long n;cin>>n;
// TODO
return 0;}
`),
      java: java(`import java.util.*;
public class Main{public static void main(String[]args){Scanner sc=new Scanner(System.in);long n=sc.nextLong();
// TODO
}}
`),
      javascript: js(`let input="";process.stdin.on("data",d=>input+=d);
process.stdin.on("end",()=>{const n=parseInt(input.trim());
// TODO
});
`),
      typescript: ts(`let input="";process.stdin.on("data",(d:Buffer)=>{input+=d.toString();});
process.stdin.on("end",()=>{const n=parseInt(input.trim());
// TODO
});
`),
      c: c(`#include <stdio.h>
int main(){long long n;scanf("%lld",&n);
// TODO
return 0;}
`),
      go: go(`package main
import ("bufio";"fmt";"os")
func main(){r:=bufio.NewReader(os.Stdin);var n int64;fmt.Fscan(r,&n)
// TODO
}
`),
    },
    referenceSolution: {
      python: `n = int(input())
ans = 1
for i in range(2, n+1):
    ans *= i
print(ans)`,
    },
    sampleTests: [{ input: "5", expected: "120" }],
    hiddenTests: [
      { input: "0", expected: "1" },
      { input: "1", expected: "1" },
      { input: "5", expected: "120" },
      { input: "10", expected: "3628800" },
      { input: "20", expected: "2432902008176640000" },
    ],
  },

  // ----------------------------------------------------------
  {
    slug: "gcd",
    title: "Greatest Common Divisor",
    difficulty: "Easy",
    topics: ["Math"],
    description: `Given two non-negative integers \`a\` and \`b\`, print \`gcd(a, b)\`.`,
    examples: [{ input: "12 18", output: "6" }],
    constraints: ["0 <= a, b <= 10^9", "(a, b) != (0, 0)"],
    hints: ["Euclidean algorithm: gcd(a,b) = gcd(b, a%b)."],
    starterCode: {
      python: py(`import sys
a, b = map(int, sys.stdin.read().split())
# TODO
`),
      cpp: cpp(`#include <bits/stdc++.h>
using namespace std;
int main(){long long a,b;cin>>a>>b;
// TODO
return 0;}
`),
      java: java(`import java.util.*;
public class Main{public static void main(String[]args){Scanner sc=new Scanner(System.in);long a=sc.nextLong(),b=sc.nextLong();
// TODO
}}
`),
      javascript: js(`let input="";process.stdin.on("data",d=>input+=d);
process.stdin.on("end",()=>{const [a,b]=input.split(/\\s+/).filter(Boolean).map(Number);
// TODO
});
`),
      typescript: ts(`let input="";process.stdin.on("data",(d:Buffer)=>{input+=d.toString();});
process.stdin.on("end",()=>{const [a,b]=input.split(/\\s+/).filter(Boolean).map(Number);
// TODO
});
`),
      c: c(`#include <stdio.h>
int main(){long long a,b;scanf("%lld %lld",&a,&b);
// TODO
return 0;}
`),
      go: go(`package main
import ("bufio";"fmt";"os")
func main(){r:=bufio.NewReader(os.Stdin);var a,b int64;fmt.Fscan(r,&a,&b)
// TODO
}
`),
    },
    referenceSolution: {
      python: `import math
a, b = map(int, input().split())
print(math.gcd(a, b))`,
    },
    sampleTests: [{ input: "12 18", expected: "6" }],
    hiddenTests: [
      { input: "12 18", expected: "6" },
      { input: "0 5", expected: "5" },
      { input: "5 0", expected: "5" },
      { input: "1 1", expected: "1" },
      { input: "1000000000 999999937", expected: "1" },
      { input: "100 75", expected: "25" },
    ],
  },

  // ----------------------------------------------------------
  {
    slug: "count-vowels",
    title: "Count Vowels",
    difficulty: "Easy",
    topics: ["String"],
    description: `Given a string \`s\` (one line), print the number of vowels (\`a, e, i, o, u\`, case-insensitive).`,
    examples: [{ input: "Hello World", output: "3" }],
    constraints: ["1 <= |s| <= 10^5"],
    hints: ["Iterate, lowercase, check membership in a set."],
    starterCode: {
      python: py(`import sys
s = sys.stdin.read().rstrip("\\n")
# TODO
`),
      cpp: cpp(`#include <bits/stdc++.h>
using namespace std;
int main(){string s;getline(cin,s);
// TODO
return 0;}
`),
      java: java(`import java.util.*;
public class Main{public static void main(String[]args){Scanner sc=new Scanner(System.in);String s=sc.nextLine();
// TODO
}}
`),
      javascript: js(`let input="";process.stdin.on("data",d=>input+=d);
process.stdin.on("end",()=>{const s=input.replace(/\\n$/,"");
// TODO
});
`),
      typescript: ts(`let input="";process.stdin.on("data",(d:Buffer)=>{input+=d.toString();});
process.stdin.on("end",()=>{const s=input.replace(/\\n$/,"");
// TODO
});
`),
      c: c(`#include <stdio.h>
#include <string.h>
int main(){char s[100005];fgets(s,sizeof(s),stdin);
// TODO
return 0;}
`),
      go: go(`package main
import ("bufio";"fmt";"os";"strings")
func main(){r:=bufio.NewReader(os.Stdin);s,_:=r.ReadString('\\n');s=strings.TrimRight(s,"\\n")
// TODO
_=fmt.Sprint(s)
}
`),
    },
    referenceSolution: {
      python: `import sys
s = sys.stdin.read().rstrip("\\n").lower()
print(sum(1 for c in s if c in "aeiou"))`,
    },
    sampleTests: [{ input: "Hello World", expected: "3" }],
    hiddenTests: [
      { input: "Hello World", expected: "3" },
      { input: "AEIOU", expected: "5" },
      { input: "bcdfg", expected: "0" },
      { input: "y", expected: "0" },
      { input: "The quick brown fox", expected: "5" },
    ],
  },

  // =============================================================
  //                   SQL PROBLEMS (SQLite)
  // =============================================================
  // Each SQL problem ships its own schema + seed dataset and a reference
  // query. Run/Submit go through the run-sql / submit-sql edge functions.
  // starterCode and referenceSolution intentionally omit non-SQL languages.
  // ----------------------------------------------------------
  {
    slug: "sql-recyclable-low-fat-products",
    title: "Recyclable and Low-Fat Products",
    difficulty: "Easy",
    topics: ["SQL", "WHERE", "Filtering"],
    description: `Write a SQL query to find the IDs of products that are both **low fat** and **recyclable**.

Return the result table in **any order**.`,
    examples: [
      {
        input: "Products(product_id, low_fats, recyclable)",
        output: "product_id\nP1\nP3",
      },
    ],
    constraints: ["Use SELECT, WHERE", "Both flags are 'Y' or 'N'"],
    hints: ["Filter where low_fats = 'Y' AND recyclable = 'Y'."],
    starterCode: {},
    referenceSolution: {
      sql: `SELECT product_id FROM Products WHERE low_fats = 'Y' AND recyclable = 'Y';`,
    },
    sampleTests: [],
    hiddenTests: [],
    sql: {
      schema: `CREATE TABLE Products (
  product_id TEXT PRIMARY KEY,
  low_fats   TEXT NOT NULL,
  recyclable TEXT NOT NULL
);`,
      seed: `INSERT INTO Products VALUES
  ('P1', 'Y', 'Y'),
  ('P2', 'N', 'Y'),
  ('P3', 'Y', 'Y'),
  ('P4', 'Y', 'N'),
  ('P5', 'N', 'N');`,
      referenceQuery: `SELECT product_id FROM Products WHERE low_fats = 'Y' AND recyclable = 'Y';`,
      orderMatters: false,
      starter: `-- Find products that are both low-fat and recyclable.
SELECT product_id
FROM Products
WHERE /* TODO */;
`,
    },
  },
  // ----------------------------------------------------------
  {
    slug: "sql-customer-referee",
    title: "Find Customer Referee",
    difficulty: "Easy",
    topics: ["SQL", "NULL Handling"],
    description: `Find the names of the customers that are **not** referred by the customer with id = 2.

Return the result table in any order.`,
    examples: [
      { input: "Customer(id, name, referee_id)", output: "name\nWill\nJane\nAlex\nBill" },
    ],
    constraints: ["Be careful with NULL referee_id values."],
    hints: ["referee_id IS NULL OR referee_id != 2."],
    starterCode: {},
    referenceSolution: {
      sql: `SELECT name FROM Customer WHERE referee_id IS NULL OR referee_id <> 2;`,
    },
    sampleTests: [],
    hiddenTests: [],
    sql: {
      schema: `CREATE TABLE Customer (
  id          INTEGER PRIMARY KEY,
  name        TEXT NOT NULL,
  referee_id  INTEGER
);`,
      seed: `INSERT INTO Customer VALUES
  (1, 'Will',   NULL),
  (2, 'Jane',   NULL),
  (3, 'Alex',   2),
  (4, 'Bill',   NULL),
  (5, 'Zack',   1),
  (6, 'Mark',   2);`,
      referenceQuery: `SELECT name FROM Customer WHERE referee_id IS NULL OR referee_id <> 2;`,
      orderMatters: false,
      starter: `SELECT name
FROM Customer
WHERE /* TODO: include rows where referee_id is not 2, including NULLs */;
`,
    },
  },
  // ----------------------------------------------------------
  {
    slug: "sql-big-countries",
    title: "Big Countries",
    difficulty: "Easy",
    topics: ["SQL", "WHERE", "OR"],
    description: `A country is **big** if its area is at least 3,000,000 km² **or** its population is at least 25,000,000.

Write a SQL query to report the **name**, **population**, and **area** of each big country.`,
    examples: [
      { input: "World(name, continent, area, population, gdp)", output: "name\tpopulation\tarea\nAfghanistan\t25500100\t652230\nAlgeria\t37100000\t2381741" },
    ],
    constraints: ["Use OR for the threshold check."],
    hints: ["WHERE area >= 3000000 OR population >= 25000000"],
    starterCode: {},
    referenceSolution: {
      sql: `SELECT name, population, area FROM World WHERE area >= 3000000 OR population >= 25000000;`,
    },
    sampleTests: [],
    hiddenTests: [],
    sql: {
      schema: `CREATE TABLE World (
  name       TEXT PRIMARY KEY,
  continent  TEXT NOT NULL,
  area       INTEGER NOT NULL,
  population INTEGER NOT NULL,
  gdp        INTEGER NOT NULL
);`,
      seed: `INSERT INTO World VALUES
  ('Afghanistan', 'Asia',   652230,  25500100,   20343000000),
  ('Albania',     'Europe', 28748,    2831741,   12960000000),
  ('Algeria',     'Africa', 2381741, 37100000,  188681000000),
  ('Andorra',     'Europe', 468,         78115,    3712000000),
  ('Angola',      'Africa', 1246700, 20609294,  100990000000);`,
      referenceQuery: `SELECT name, population, area FROM World WHERE area >= 3000000 OR population >= 25000000;`,
      orderMatters: false,
      starter: `SELECT name, population, area
FROM World
WHERE /* TODO */;
`,
    },
  },
  // ----------------------------------------------------------
  {
    slug: "sql-employee-bonus",
    title: "Employee Bonus",
    difficulty: "Easy",
    topics: ["SQL", "LEFT JOIN", "NULL Handling"],
    description: `Report the **name** and **bonus amount** of each employee whose bonus is **less than 1000**.

If an employee has no bonus, treat it as no bonus assigned (include them).`,
    examples: [
      { input: "Employee(empId, name, supervisor, salary), Bonus(empId, bonus)", output: "name\tbonus\nBrad\tNULL\nDan\tNULL\nThomas\t300" },
    ],
    constraints: ["Use LEFT JOIN.", "Filter bonus < 1000 OR bonus IS NULL."],
    hints: ["LEFT JOIN Bonus on empId then filter."],
    starterCode: {},
    referenceSolution: {
      sql: `SELECT e.name, b.bonus
FROM Employee e
LEFT JOIN Bonus b ON e.empId = b.empId
WHERE b.bonus < 1000 OR b.bonus IS NULL;`,
    },
    sampleTests: [],
    hiddenTests: [],
    sql: {
      schema: `CREATE TABLE Employee (
  empId      INTEGER PRIMARY KEY,
  name       TEXT NOT NULL,
  supervisor INTEGER,
  salary     INTEGER NOT NULL
);
CREATE TABLE Bonus (
  empId INTEGER PRIMARY KEY,
  bonus INTEGER
);`,
      seed: `INSERT INTO Employee VALUES
  (3, 'Brad',   NULL, 4000),
  (1, 'John',   3,    1000),
  (2, 'Dan',    3,    2000),
  (4, 'Thomas', 3,    4000);
INSERT INTO Bonus VALUES
  (2, 500),
  (4, 2000);`,
      referenceQuery: `SELECT e.name, b.bonus
FROM Employee e
LEFT JOIN Bonus b ON e.empId = b.empId
WHERE b.bonus < 1000 OR b.bonus IS NULL;`,
      orderMatters: false,
      starter: `SELECT e.name, b.bonus
FROM Employee e
LEFT JOIN Bonus b ON /* TODO */
WHERE /* TODO */;
`,
    },
  },
  // ----------------------------------------------------------
  {
    slug: "sql-second-highest-salary",
    title: "Second Highest Salary",
    difficulty: "Medium",
    topics: ["SQL", "Subquery", "DISTINCT"],
    description: `Write a SQL query to get the **second highest distinct salary** from the \`Employee\` table.

If there is no second highest salary, return \`NULL\`. The output column must be named \`SecondHighestSalary\`.`,
    examples: [
      { input: "Employee(id, salary)", output: "SecondHighestSalary\n200" },
    ],
    constraints: ["Distinct salaries.", "Return a single row."],
    hints: ["Use a subquery with MAX(salary) where salary < (SELECT MAX(salary))."],
    starterCode: {},
    referenceSolution: {
      sql: `SELECT (SELECT MAX(salary) FROM Employee WHERE salary < (SELECT MAX(salary) FROM Employee)) AS SecondHighestSalary;`,
    },
    sampleTests: [],
    hiddenTests: [],
    sql: {
      schema: `CREATE TABLE Employee (
  id     INTEGER PRIMARY KEY,
  salary INTEGER NOT NULL
);`,
      seed: `INSERT INTO Employee VALUES
  (1, 100),
  (2, 200),
  (3, 300),
  (4, 200);`,
      referenceQuery: `SELECT (SELECT MAX(salary) FROM Employee WHERE salary < (SELECT MAX(salary) FROM Employee)) AS SecondHighestSalary;`,
      orderMatters: false,
      starter: `SELECT /* TODO */ AS SecondHighestSalary;
`,
    },
  },
  // ----------------------------------------------------------
  {
    slug: "sql-department-top-three-salaries",
    title: "Department Top Three Salaries",
    difficulty: "Hard",
    topics: ["SQL", "Window Functions", "DENSE_RANK"],
    description: `For each department, find the employees who earn one of the **top three unique salaries** in that department.

Return the **department name**, **employee name**, and **salary**, ordered by department then salary descending.`,
    examples: [
      { input: "Employee(id, name, salary, departmentId), Department(id, name)", output: "Department\tEmployee\tSalary\nIT\tMax\t90000\nIT\tRandy\t85000\nIT\tJoe\t85000\nIT\tWill\t70000\nSales\tHenry\t80000\nSales\tSam\t60000" },
    ],
    constraints: ["Use DENSE_RANK() OVER (PARTITION BY ...).", "Top 3 distinct salaries per department."],
    hints: ["DENSE_RANK gives ties the same rank without skipping.", "Filter rank <= 3."],
    starterCode: {},
    referenceSolution: {
      sql: `SELECT d.name AS Department, e.name AS Employee, e.salary AS Salary
FROM (
  SELECT name, salary, departmentId,
         DENSE_RANK() OVER (PARTITION BY departmentId ORDER BY salary DESC) AS rk
  FROM Employee
) e
JOIN Department d ON d.id = e.departmentId
WHERE e.rk <= 3
ORDER BY d.name, e.salary DESC;`,
    },
    sampleTests: [],
    hiddenTests: [],
    sql: {
      schema: `CREATE TABLE Employee (
  id           INTEGER PRIMARY KEY,
  name         TEXT NOT NULL,
  salary       INTEGER NOT NULL,
  departmentId INTEGER NOT NULL
);
CREATE TABLE Department (
  id   INTEGER PRIMARY KEY,
  name TEXT NOT NULL
);`,
      seed: `INSERT INTO Department VALUES
  (1, 'IT'),
  (2, 'Sales');
INSERT INTO Employee VALUES
  (1, 'Joe',    85000, 1),
  (2, 'Henry',  80000, 2),
  (3, 'Sam',    60000, 2),
  (4, 'Max',    90000, 1),
  (5, 'Janet',  69000, 1),
  (6, 'Randy',  85000, 1),
  (7, 'Will',   70000, 1);`,
      referenceQuery: `SELECT d.name AS Department, e.name AS Employee, e.salary AS Salary
FROM (
  SELECT name, salary, departmentId,
         DENSE_RANK() OVER (PARTITION BY departmentId ORDER BY salary DESC) AS rk
  FROM Employee
) e
JOIN Department d ON d.id = e.departmentId
WHERE e.rk <= 3
ORDER BY d.name, e.salary DESC;`,
      orderMatters: true,
      starter: `-- Top 3 unique salaries per department, with employee names.
SELECT d.name AS Department, e.name AS Employee, e.salary AS Salary
FROM /* TODO */
ORDER BY d.name, e.salary DESC;
`,
    },
  },
];

export const getProblemBySlug = (slug: string) =>
  CODING_PROBLEMS.find((p) => p.slug === slug);

export const ALL_TOPICS = Array.from(
  new Set(CODING_PROBLEMS.flatMap((p) => p.topics)),
).sort();
