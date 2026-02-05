// Programming Languages Data - Topics, questions, and quiz content
import type { Difficulty } from "./positionResourcesData";

export interface LanguageQuestion {
  id: number;
  title: string;
  text: string;
  difficulty: Difficulty;
  languageId: string;
  topicId: string;
  answer: string;
  options?: { text: string; isCorrect: boolean }[];
}

export interface LanguageTopic {
  id: string;
  name: string;
  languageId: string;
  description?: string;
}

export interface Language {
  id: string;
  name: string;
  icon: string;
  color: string;
  importance: "Critical" | "High" | "Medium";
  description: string;
}

export const languages: Language[] = [
  { id: "java", name: "Java", icon: "Coffee", color: "from-orange-500 to-red-500", importance: "Critical", description: "Enterprise-grade, object-oriented programming" },
  { id: "python", name: "Python", icon: "FileCode", color: "from-blue-500 to-yellow-500", importance: "Critical", description: "Versatile language for web, AI, and scripting" },
  { id: "cpp", name: "C++", icon: "Cpu", color: "from-blue-600 to-purple-600", importance: "Critical", description: "High-performance systems programming" },
  { id: "javascript", name: "JavaScript", icon: "Braces", color: "from-yellow-400 to-yellow-600", importance: "High", description: "Web development and full-stack applications" },
  { id: "go", name: "Go", icon: "Rabbit", color: "from-cyan-500 to-blue-500", importance: "Medium", description: "Concurrent programming and cloud services" },
  { id: "rust", name: "Rust", icon: "Shield", color: "from-orange-600 to-red-700", importance: "Medium", description: "Memory-safe systems programming" },
];

export const languageTopics: LanguageTopic[] = [
  // Java Topics
  { id: "java-basics", name: "Java Basics", languageId: "java", description: "Variables, data types, operators" },
  { id: "java-oop", name: "OOP in Java", languageId: "java", description: "Classes, objects, inheritance" },
  { id: "java-collections", name: "Collections Framework", languageId: "java", description: "Lists, Sets, Maps, Queues" },
  { id: "java-multithreading", name: "Multithreading", languageId: "java", description: "Threads, synchronization, concurrency" },
  { id: "java-exceptions", name: "Exception Handling", languageId: "java", description: "Try-catch, custom exceptions" },
  { id: "java-streams", name: "Streams API", languageId: "java", description: "Functional programming features" },
  { id: "java-jvm", name: "JVM Internals", languageId: "java", description: "Memory model, garbage collection" },
  
  // Python Topics
  { id: "python-basics", name: "Python Basics", languageId: "python", description: "Variables, data types, control flow" },
  { id: "python-functions", name: "Functions & Decorators", languageId: "python", description: "Functions, closures, decorators" },
  { id: "python-oop", name: "OOP in Python", languageId: "python", description: "Classes, inheritance, magic methods" },
  { id: "python-data-structures", name: "Data Structures", languageId: "python", description: "Lists, tuples, dicts, sets" },
  { id: "python-async", name: "Async Programming", languageId: "python", description: "Asyncio, coroutines, event loops" },
  { id: "python-modules", name: "Modules & Packages", languageId: "python", description: "Import system, virtual environments" },
  
  // C++ Topics
  { id: "cpp-basics", name: "C++ Basics", languageId: "cpp", description: "Variables, pointers, references" },
  { id: "cpp-oop", name: "OOP in C++", languageId: "cpp", description: "Classes, inheritance, polymorphism" },
  { id: "cpp-memory", name: "Memory Management", languageId: "cpp", description: "Stack, heap, smart pointers" },
  { id: "cpp-stl", name: "STL", languageId: "cpp", description: "Containers, algorithms, iterators" },
  { id: "cpp-templates", name: "Templates", languageId: "cpp", description: "Generic programming, metaprogramming" },
  { id: "cpp-concurrency", name: "Concurrency", languageId: "cpp", description: "Threads, mutexes, atomics" },
  
  // JavaScript Topics
  { id: "js-basics", name: "JS Fundamentals", languageId: "javascript", description: "Variables, types, operators" },
  { id: "js-functions", name: "Functions & Closures", languageId: "javascript", description: "Functions, scope, closures" },
  { id: "js-async", name: "Async JavaScript", languageId: "javascript", description: "Promises, async/await, event loop" },
  { id: "js-dom", name: "DOM Manipulation", languageId: "javascript", description: "DOM API, events, manipulation" },
  { id: "js-es6", name: "ES6+ Features", languageId: "javascript", description: "Modern JavaScript features" },
  
  // Go Topics
  { id: "go-basics", name: "Go Basics", languageId: "go", description: "Variables, types, control flow" },
  { id: "go-concurrency", name: "Goroutines & Channels", languageId: "go", description: "Concurrent programming" },
  { id: "go-interfaces", name: "Interfaces", languageId: "go", description: "Interface types and composition" },
  { id: "go-errors", name: "Error Handling", languageId: "go", description: "Error handling patterns" },
  
  // Rust Topics
  { id: "rust-basics", name: "Rust Basics", languageId: "rust", description: "Variables, types, ownership" },
  { id: "rust-ownership", name: "Ownership & Borrowing", languageId: "rust", description: "Memory safety guarantees" },
  { id: "rust-traits", name: "Traits & Generics", languageId: "rust", description: "Trait system, generic programming" },
  { id: "rust-concurrency", name: "Concurrency", languageId: "rust", description: "Fearless concurrency" },
];

export const languageQuestions: LanguageQuestion[] = [
  // Java Questions
  {
    id: 1,
    title: "What is the difference between JDK, JRE, and JVM?",
    text: "Explain the roles of JDK, JRE, and JVM in Java development.",
    difficulty: "Easy",
    languageId: "java",
    topicId: "java-basics",
    answer: `## JDK, JRE, and JVM

### JVM (Java Virtual Machine)
The JVM is an abstract machine that provides the runtime environment to execute Java bytecode. It performs:
- Memory management
- Garbage collection
- Security enforcement

### JRE (Java Runtime Environment)
JRE = JVM + Libraries + Other files needed to run Java applications
- Contains everything needed to **run** Java programs
- Does NOT include development tools

### JDK (Java Development Kit)
JDK = JRE + Development tools (compiler, debugger, etc.)
- Required to **develop** Java applications
- Includes javac compiler, jar tool, javadoc, etc.

\`\`\`
JDK
├── JRE
│   ├── JVM
│   └── Class Libraries
└── Development Tools (javac, jar, javadoc)
\`\`\``,
    options: [
      { text: "JVM executes bytecode, JRE runs programs, JDK is for development", isCorrect: true },
      { text: "They are all the same thing", isCorrect: false },
      { text: "JDK is a subset of JRE", isCorrect: false },
      { text: "JVM contains JDK", isCorrect: false },
    ],
  },
  {
    id: 2,
    title: "Explain Java's 'Write Once, Run Anywhere' principle",
    text: "How does Java achieve platform independence?",
    difficulty: "Easy",
    languageId: "java",
    topicId: "java-basics",
    answer: `## Write Once, Run Anywhere (WORA)

Java achieves platform independence through:

### 1. Bytecode Compilation
- Java source code is compiled to **bytecode** (.class files)
- Bytecode is platform-independent intermediate code

### 2. JVM Abstraction
- Each platform has its own JVM implementation
- JVM interprets bytecode for the specific platform

\`\`\`java
// Same code runs on Windows, Mac, Linux
public class Hello {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}
\`\`\`

### Compilation Flow
\`\`\`
Source.java → javac → ByteCode.class → JVM → Native Code
\`\`\``,
    options: [
      { text: "Java compiles to bytecode which runs on any JVM", isCorrect: true },
      { text: "Java compiles to native code for each platform", isCorrect: false },
      { text: "Java is interpreted directly from source", isCorrect: false },
      { text: "Java uses Docker for portability", isCorrect: false },
    ],
  },
  {
    id: 3,
    title: "What are the access modifiers in Java?",
    text: "List and explain all access modifiers in Java.",
    difficulty: "Easy",
    languageId: "java",
    topicId: "java-oop",
    answer: `## Java Access Modifiers

| Modifier | Class | Package | Subclass | World |
|----------|-------|---------|----------|-------|
| public | ✓ | ✓ | ✓ | ✓ |
| protected | ✓ | ✓ | ✓ | ✗ |
| default | ✓ | ✓ | ✗ | ✗ |
| private | ✓ | ✗ | ✗ | ✗ |

### Examples
\`\`\`java
public class Example {
    public int publicVar;      // Accessible everywhere
    protected int protectedVar; // Package + subclasses
    int defaultVar;            // Package only
    private int privateVar;    // Class only
}
\`\`\``,
    options: [
      { text: "public, protected, default (package-private), private", isCorrect: true },
      { text: "public, private, static, final", isCorrect: false },
      { text: "public, private only", isCorrect: false },
      { text: "open, closed, sealed", isCorrect: false },
    ],
  },
  {
    id: 4,
    title: "What is the difference between ArrayList and LinkedList?",
    text: "Compare ArrayList and LinkedList in Java.",
    difficulty: "Medium",
    languageId: "java",
    topicId: "java-collections",
    answer: `## ArrayList vs LinkedList

| Operation | ArrayList | LinkedList |
|-----------|-----------|------------|
| Access (get) | O(1) | O(n) |
| Insert/Delete (middle) | O(n) | O(1)* |
| Insert/Delete (end) | O(1) amortized | O(1) |
| Memory | Less | More (node overhead) |

*O(1) after reaching the position

### When to use what?
- **ArrayList**: Random access, iteration, memory efficiency
- **LinkedList**: Frequent insertions/deletions at beginning/middle

\`\`\`java
List<String> arrayList = new ArrayList<>();  // Better for most cases
List<String> linkedList = new LinkedList<>(); // Queue operations
\`\`\``,
    options: [
      { text: "ArrayList has O(1) access, LinkedList has O(1) insertion at any position", isCorrect: true },
      { text: "They have identical performance", isCorrect: false },
      { text: "LinkedList is always faster", isCorrect: false },
      { text: "ArrayList uses more memory than LinkedList", isCorrect: false },
    ],
  },
  {
    id: 5,
    title: "What is synchronized in Java?",
    text: "Explain the synchronized keyword and its uses.",
    difficulty: "Medium",
    languageId: "java",
    topicId: "java-multithreading",
    answer: `## Synchronized in Java

The \`synchronized\` keyword ensures that only one thread can access a block of code or method at a time.

### Synchronized Methods
\`\`\`java
public synchronized void increment() {
    count++;
}
\`\`\`

### Synchronized Blocks
\`\`\`java
public void increment() {
    synchronized(this) {
        count++;
    }
}
\`\`\`

### Key Points
- Provides mutual exclusion (mutex)
- Ensures visibility of changes across threads
- Can cause performance overhead
- Consider \`ReentrantLock\` for more control`,
    options: [
      { text: "Ensures only one thread accesses a code block at a time", isCorrect: true },
      { text: "Makes code run faster", isCorrect: false },
      { text: "Runs code in parallel", isCorrect: false },
      { text: "Is only used for static methods", isCorrect: false },
    ],
  },

  // Python Questions
  {
    id: 101,
    title: "What is the difference between a list and a tuple?",
    text: "Explain the key differences between lists and tuples in Python.",
    difficulty: "Easy",
    languageId: "python",
    topicId: "python-data-structures",
    answer: `## List vs Tuple

| Feature | List | Tuple |
|---------|------|-------|
| Mutability | Mutable | Immutable |
| Syntax | \`[1, 2, 3]\` | \`(1, 2, 3)\` |
| Performance | Slower | Faster |
| Use case | Dynamic data | Fixed data |

\`\`\`python
# List - mutable
my_list = [1, 2, 3]
my_list[0] = 10  # Works

# Tuple - immutable
my_tuple = (1, 2, 3)
my_tuple[0] = 10  # TypeError!
\`\`\`

### When to use tuples?
- Dictionary keys (must be hashable)
- Function return values
- Data that shouldn't change`,
    options: [
      { text: "Lists are mutable, tuples are immutable", isCorrect: true },
      { text: "Tuples are faster to modify", isCorrect: false },
      { text: "Lists can only hold integers", isCorrect: false },
      { text: "There is no difference", isCorrect: false },
    ],
  },
  {
    id: 102,
    title: "What are Python decorators?",
    text: "Explain decorators and their use cases.",
    difficulty: "Medium",
    languageId: "python",
    topicId: "python-functions",
    answer: `## Python Decorators

Decorators are functions that modify the behavior of other functions.

\`\`\`python
def my_decorator(func):
    def wrapper(*args, **kwargs):
        print("Before function")
        result = func(*args, **kwargs)
        print("After function")
        return result
    return wrapper

@my_decorator
def say_hello(name):
    print(f"Hello, {name}!")

say_hello("World")
# Output:
# Before function
# Hello, World!
# After function
\`\`\`

### Common Use Cases
- Logging
- Authentication
- Caching (@lru_cache)
- Rate limiting
- Input validation`,
    options: [
      { text: "Functions that wrap and extend other functions", isCorrect: true },
      { text: "Classes that decorate the UI", isCorrect: false },
      { text: "Special variables in Python", isCorrect: false },
      { text: "HTML decorators for web pages", isCorrect: false },
    ],
  },
  {
    id: 103,
    title: "What is the GIL in Python?",
    text: "Explain the Global Interpreter Lock and its implications.",
    difficulty: "Hard",
    languageId: "python",
    topicId: "python-async",
    answer: `## Global Interpreter Lock (GIL)

The GIL is a mutex that protects access to Python objects, preventing multiple threads from executing Python bytecodes simultaneously.

### Implications
- Only one thread executes Python code at a time
- CPU-bound tasks don't benefit from threading
- I/O-bound tasks can still benefit from threading

### Workarounds
\`\`\`python
# For CPU-bound tasks, use multiprocessing
from multiprocessing import Pool

def cpu_task(x):
    return x ** 2

with Pool(4) as p:
    results = p.map(cpu_task, range(1000))

# For I/O-bound tasks, use asyncio
import asyncio

async def io_task():
    await asyncio.sleep(1)
\`\`\``,
    options: [
      { text: "A lock preventing multiple threads from executing Python bytecode simultaneously", isCorrect: true },
      { text: "A security feature for web applications", isCorrect: false },
      { text: "A garbage collection mechanism", isCorrect: false },
      { text: "A package manager for Python", isCorrect: false },
    ],
  },

  // C++ Questions
  {
    id: 201,
    title: "What is the difference between a pointer and a reference?",
    text: "Explain pointers vs references in C++.",
    difficulty: "Medium",
    languageId: "cpp",
    topicId: "cpp-basics",
    answer: `## Pointer vs Reference

| Feature | Pointer | Reference |
|---------|---------|-----------|
| Nullability | Can be null | Cannot be null |
| Reassignment | Can be reassigned | Cannot be reassigned |
| Syntax | \`*ptr\` to dereference | No special syntax |
| Memory | Has own memory address | Alias to existing variable |

\`\`\`cpp
int x = 10;

// Pointer
int* ptr = &x;
*ptr = 20;      // x is now 20
ptr = nullptr;  // Valid

// Reference
int& ref = x;
ref = 30;       // x is now 30
// Cannot make ref refer to another variable
\`\`\`

### When to use what?
- **Pointer**: Optional values, dynamic memory, arrays
- **Reference**: Function parameters, operator overloading`,
    options: [
      { text: "Pointers can be null and reassigned, references cannot", isCorrect: true },
      { text: "References are faster than pointers", isCorrect: false },
      { text: "Pointers are deprecated in modern C++", isCorrect: false },
      { text: "They are exactly the same", isCorrect: false },
    ],
  },
  {
    id: 202,
    title: "What are smart pointers in C++?",
    text: "Explain unique_ptr, shared_ptr, and weak_ptr.",
    difficulty: "Medium",
    languageId: "cpp",
    topicId: "cpp-memory",
    answer: `## Smart Pointers in C++

### unique_ptr
- Exclusive ownership
- Cannot be copied, only moved

\`\`\`cpp
auto ptr = std::make_unique<int>(42);
auto ptr2 = std::move(ptr); // ptr is now null
\`\`\`

### shared_ptr
- Shared ownership
- Reference counted

\`\`\`cpp
auto ptr1 = std::make_shared<int>(42);
auto ptr2 = ptr1; // Both share ownership
\`\`\`

### weak_ptr
- Non-owning reference to shared_ptr
- Breaks circular references

\`\`\`cpp
std::weak_ptr<int> weak = shared;
if (auto locked = weak.lock()) {
    // Use locked
}
\`\`\``,
    options: [
      { text: "RAII wrappers that automatically manage memory lifecycle", isCorrect: true },
      { text: "Pointers that are faster than raw pointers", isCorrect: false },
      { text: "A replacement for all pointers", isCorrect: false },
      { text: "Pointers that use less memory", isCorrect: false },
    ],
  },

  // JavaScript Questions
  {
    id: 301,
    title: "What is the difference between var, let, and const?",
    text: "Explain the differences between variable declarations in JavaScript.",
    difficulty: "Easy",
    languageId: "javascript",
    topicId: "js-basics",
    answer: `## var vs let vs const

| Feature | var | let | const |
|---------|-----|-----|-------|
| Scope | Function | Block | Block |
| Hoisting | Yes (undefined) | Yes (TDZ) | Yes (TDZ) |
| Reassignment | Yes | Yes | No |
| Redeclaration | Yes | No | No |

\`\`\`javascript
// var - function scoped, hoisted
function test() {
  console.log(x); // undefined (hoisted)
  var x = 1;
}

// let - block scoped
if (true) {
  let y = 2;
}
// console.log(y); // ReferenceError

// const - block scoped, cannot reassign
const z = 3;
// z = 4; // TypeError
\`\`\`

**Best Practice**: Use \`const\` by default, \`let\` when reassignment is needed, avoid \`var\`.`,
    options: [
      { text: "var is function-scoped, let/const are block-scoped; const cannot be reassigned", isCorrect: true },
      { text: "They are all the same", isCorrect: false },
      { text: "const is faster than let", isCorrect: false },
      { text: "var is the modern way to declare variables", isCorrect: false },
    ],
  },
  {
    id: 302,
    title: "What is the Event Loop in JavaScript?",
    text: "Explain how the event loop works in JavaScript.",
    difficulty: "Hard",
    languageId: "javascript",
    topicId: "js-async",
    answer: `## JavaScript Event Loop

The event loop enables JavaScript's non-blocking, asynchronous behavior despite being single-threaded.

### Components
1. **Call Stack**: Executes synchronous code
2. **Web APIs**: Handle async operations (setTimeout, fetch)
3. **Callback Queue**: Holds callbacks ready to execute
4. **Microtask Queue**: Promises, MutationObserver (higher priority)

\`\`\`javascript
console.log('1');

setTimeout(() => console.log('2'), 0);

Promise.resolve().then(() => console.log('3'));

console.log('4');

// Output: 1, 4, 3, 2
// Why? Microtasks (Promise) execute before macrotasks (setTimeout)
\`\`\`

### Execution Order
1. Execute all synchronous code
2. Execute all microtasks
3. Execute one macrotask
4. Repeat`,
    options: [
      { text: "A mechanism that handles async callbacks after the call stack is empty", isCorrect: true },
      { text: "A loop that runs forever in JavaScript", isCorrect: false },
      { text: "A way to create infinite loops", isCorrect: false },
      { text: "JavaScript's garbage collection system", isCorrect: false },
    ],
  },

  // Go Questions
  {
    id: 401,
    title: "What are Goroutines?",
    text: "Explain goroutines and how they differ from threads.",
    difficulty: "Medium",
    languageId: "go",
    topicId: "go-concurrency",
    answer: `## Goroutines

Goroutines are lightweight threads managed by the Go runtime.

\`\`\`go
func main() {
    go sayHello("World") // Starts a goroutine
    time.Sleep(time.Second)
}

func sayHello(name string) {
    fmt.Println("Hello,", name)
}
\`\`\`

### Goroutines vs Threads

| Feature | Goroutines | OS Threads |
|---------|------------|------------|
| Size | ~2KB | ~1MB |
| Creation | Fast | Slow |
| Scheduling | Go runtime | OS kernel |
| Communication | Channels | Shared memory |

### Key Benefits
- Extremely lightweight
- Easy to create (thousands at once)
- Built-in scheduling
- Communicate via channels (CSP model)`,
    options: [
      { text: "Lightweight threads managed by Go runtime, using ~2KB each", isCorrect: true },
      { text: "Standard OS threads with a different name", isCorrect: false },
      { text: "A type of garbage collection", isCorrect: false },
      { text: "Go's package manager", isCorrect: false },
    ],
  },

  // Rust Questions
  {
    id: 501,
    title: "What is Ownership in Rust?",
    text: "Explain Rust's ownership system.",
    difficulty: "Medium",
    languageId: "rust",
    topicId: "rust-ownership",
    answer: `## Rust Ownership

Ownership is Rust's approach to memory management without garbage collection.

### Three Rules
1. Each value has exactly one owner
2. When owner goes out of scope, value is dropped
3. Ownership can be transferred (moved) or borrowed

\`\`\`rust
fn main() {
    let s1 = String::from("hello");
    let s2 = s1; // s1 is moved to s2
    // println!("{}", s1); // Error! s1 is no longer valid
    
    let s3 = String::from("world");
    let s4 = &s3; // Borrowing (reference)
    println!("{} {}", s3, s4); // Both valid
}
\`\`\`

### Benefits
- No garbage collector needed
- Memory safety at compile time
- No data races
- Predictable performance`,
    options: [
      { text: "A compile-time memory management system where each value has one owner", isCorrect: true },
      { text: "Rust's garbage collection mechanism", isCorrect: false },
      { text: "A way to share variables between threads", isCorrect: false },
      { text: "Similar to Java's references", isCorrect: false },
    ],
  },
];

export const getTopicsForLanguage = (languageId: string): LanguageTopic[] => {
  return languageTopics.filter((t) => t.languageId === languageId);
};

export const getQuestionsForLanguage = (languageId: string): LanguageQuestion[] => {
  return languageQuestions.filter((q) => q.languageId === languageId);
};

export const getQuestionsForTopic = (topicId: string): LanguageQuestion[] => {
  return languageQuestions.filter((q) => q.topicId === topicId);
};
