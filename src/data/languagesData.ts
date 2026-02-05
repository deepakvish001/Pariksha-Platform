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
  // More Java Questions
  {
    id: 6,
    title: "What is the difference between HashMap and ConcurrentHashMap?",
    text: "Compare HashMap and ConcurrentHashMap for thread safety.",
    difficulty: "Medium",
    languageId: "java",
    topicId: "java-collections",
    answer: `## HashMap vs ConcurrentHashMap

### HashMap
- Not thread-safe
- Allows one null key and multiple null values
- Faster for single-threaded operations

### ConcurrentHashMap
- Thread-safe without synchronizing whole map
- Uses segment locking (Java 7) or CAS (Java 8+)
- Does NOT allow null keys or values

\`\`\`java
// Not thread-safe
Map<String, Integer> hashMap = new HashMap<>();

// Thread-safe
Map<String, Integer> concurrentMap = new ConcurrentHashMap<>();
\`\`\`

| Feature | HashMap | ConcurrentHashMap |
|---------|---------|-------------------|
| Thread-safe | No | Yes |
| Null keys | Yes (1) | No |
| Performance | Faster (single) | Better (concurrent) |`,
    options: [
      { text: "HashMap is not thread-safe, ConcurrentHashMap uses segment locking", isCorrect: true },
      { text: "They are identical", isCorrect: false },
      { text: "HashMap is faster for concurrent access", isCorrect: false },
      { text: "ConcurrentHashMap allows null keys", isCorrect: false },
    ],
  },
  {
    id: 7,
    title: "What is the Java Memory Model?",
    text: "Explain the Java Memory Model and its significance.",
    difficulty: "Hard",
    languageId: "java",
    topicId: "java-jvm",
    answer: `## Java Memory Model (JMM)

The JMM defines how threads interact through memory.

### Key Concepts

#### 1. Happens-Before Relationship
- Guarantees visibility of writes to other threads
- Created by: synchronized, volatile, thread start/join

#### 2. Memory Areas
\`\`\`
Heap (shared)
├── Young Generation (Eden, S0, S1)
└── Old Generation

Stack (per thread)
├── Local variables
└── Method call frames
\`\`\`

### Volatile Keyword
\`\`\`java
private volatile boolean flag = false;
// Guarantees visibility across threads
\`\`\`

### Importance
- Prevents instruction reordering issues
- Ensures memory visibility
- Critical for concurrent programming`,
    options: [
      { text: "Defines how threads interact through memory and visibility guarantees", isCorrect: true },
      { text: "Describes the physical RAM layout", isCorrect: false },
      { text: "Only applies to garbage collection", isCorrect: false },
      { text: "Is the same as the operating system memory model", isCorrect: false },
    ],
  },
  {
    id: 8,
    title: "What are functional interfaces in Java?",
    text: "Explain functional interfaces and lambda expressions.",
    difficulty: "Medium",
    languageId: "java",
    topicId: "java-streams",
    answer: `## Functional Interfaces

A functional interface has exactly ONE abstract method.

### Built-in Functional Interfaces
\`\`\`java
// Predicate - returns boolean
Predicate<String> isEmpty = s -> s.isEmpty();

// Function - transforms input to output
Function<String, Integer> length = s -> s.length();

// Consumer - takes input, returns nothing
Consumer<String> print = s -> System.out.println(s);

// Supplier - takes nothing, returns value
Supplier<Double> random = () -> Math.random();
\`\`\`

### Lambda Expressions
\`\`\`java
// Before Java 8
Runnable r = new Runnable() {
    @Override
    public void run() { System.out.println("Hello"); }
};

// With Lambda
Runnable r = () -> System.out.println("Hello");
\`\`\`

### @FunctionalInterface
\`\`\`java
@FunctionalInterface
interface Calculator {
    int calculate(int a, int b);
}
\`\`\``,
    options: [
      { text: "Interfaces with exactly one abstract method, enabling lambda expressions", isCorrect: true },
      { text: "Interfaces that extend Function class", isCorrect: false },
      { text: "Interfaces with no methods", isCorrect: false },
      { text: "Only Runnable and Callable", isCorrect: false },
    ],
  },
  {
    id: 9,
    title: "What are checked and unchecked exceptions?",
    text: "Explain the difference between checked and unchecked exceptions.",
    difficulty: "Easy",
    languageId: "java",
    topicId: "java-exceptions",
    answer: `## Checked vs Unchecked Exceptions

### Checked Exceptions
- Must be declared or handled at compile time
- Extend Exception (not RuntimeException)
- Examples: IOException, SQLException

\`\`\`java
// Must handle or declare
public void readFile() throws IOException {
    FileReader fr = new FileReader("file.txt");
}
\`\`\`

### Unchecked Exceptions
- Not checked at compile time
- Extend RuntimeException
- Examples: NullPointerException, ArrayIndexOutOfBoundsException

\`\`\`java
// No need to declare
public void divide(int a, int b) {
    int result = a / b; // May throw ArithmeticException
}
\`\`\`

| Type | Compile-time check | Examples |
|------|-------------------|----------|
| Checked | Yes | IOException |
| Unchecked | No | NullPointerException |`,
    options: [
      { text: "Checked must be handled at compile time, unchecked are runtime exceptions", isCorrect: true },
      { text: "They are the same thing", isCorrect: false },
      { text: "Unchecked are more severe", isCorrect: false },
      { text: "Checked exceptions cannot be caught", isCorrect: false },
    ],
  },

  // More Python Questions
  {
    id: 104,
    title: "What are *args and **kwargs?",
    text: "Explain variable-length arguments in Python.",
    difficulty: "Easy",
    languageId: "python",
    topicId: "python-functions",
    answer: `## *args and **kwargs

### *args (Positional Arguments)
Collects extra positional arguments as a tuple.

\`\`\`python
def sum_all(*args):
    return sum(args)

sum_all(1, 2, 3, 4)  # Returns 10
\`\`\`

### **kwargs (Keyword Arguments)
Collects extra keyword arguments as a dictionary.

\`\`\`python
def print_info(**kwargs):
    for key, value in kwargs.items():
        print(f"{key}: {value}")

print_info(name="Alice", age=30)
\`\`\`

### Combined Usage
\`\`\`python
def example(a, b, *args, **kwargs):
    print(f"a={a}, b={b}")
    print(f"args={args}")
    print(f"kwargs={kwargs}")

example(1, 2, 3, 4, x=5, y=6)
\`\`\``,
    options: [
      { text: "*args collects positional args as tuple, **kwargs collects keyword args as dict", isCorrect: true },
      { text: "They are required parameters", isCorrect: false },
      { text: "args is for strings, kwargs is for integers", isCorrect: false },
      { text: "They can only be used separately", isCorrect: false },
    ],
  },
  {
    id: 105,
    title: "What is a generator in Python?",
    text: "Explain generators and the yield keyword.",
    difficulty: "Medium",
    languageId: "python",
    topicId: "python-functions",
    answer: `## Python Generators

Generators are functions that yield values one at a time, saving memory.

### Using yield
\`\`\`python
def countdown(n):
    while n > 0:
        yield n
        n -= 1

for num in countdown(5):
    print(num)  # 5, 4, 3, 2, 1
\`\`\`

### Generator Expressions
\`\`\`python
# List comprehension (stores all in memory)
squares_list = [x**2 for x in range(1000000)]

# Generator expression (lazy evaluation)
squares_gen = (x**2 for x in range(1000000))
\`\`\`

### Benefits
- Memory efficient (lazy evaluation)
- Can represent infinite sequences
- Maintains state between calls

### next() Function
\`\`\`python
gen = countdown(3)
print(next(gen))  # 3
print(next(gen))  # 2
\`\`\``,
    options: [
      { text: "Functions that yield values lazily using the yield keyword", isCorrect: true },
      { text: "Functions that generate random numbers", isCorrect: false },
      { text: "A type of class in Python", isCorrect: false },
      { text: "Functions that run faster than normal functions", isCorrect: false },
    ],
  },
  {
    id: 106,
    title: "What is the difference between __str__ and __repr__?",
    text: "Explain these magic methods in Python.",
    difficulty: "Medium",
    languageId: "python",
    topicId: "python-oop",
    answer: `## __str__ vs __repr__

### __repr__ (Developer-facing)
- Unambiguous representation
- Should be valid Python if possible
- Used by repr() and in debugger

### __str__ (User-facing)
- Readable representation
- Used by str() and print()
- Falls back to __repr__ if not defined

\`\`\`python
class Person:
    def __init__(self, name, age):
        self.name = name
        self.age = age
    
    def __repr__(self):
        return f"Person('{self.name}', {self.age})"
    
    def __str__(self):
        return f"{self.name}, {self.age} years old"

p = Person("Alice", 30)
print(repr(p))  # Person('Alice', 30)
print(str(p))   # Alice, 30 years old
\`\`\`

### Best Practice
- Always implement __repr__
- Implement __str__ for user-friendly output`,
    options: [
      { text: "__repr__ is for developers (unambiguous), __str__ is for users (readable)", isCorrect: true },
      { text: "They are exactly the same", isCorrect: false },
      { text: "__str__ is for strings, __repr__ is for numbers", isCorrect: false },
      { text: "__repr__ is deprecated", isCorrect: false },
    ],
  },
  {
    id: 107,
    title: "What is a context manager in Python?",
    text: "Explain the 'with' statement and context managers.",
    difficulty: "Medium",
    languageId: "python",
    topicId: "python-functions",
    answer: `## Context Managers

Context managers handle setup and cleanup automatically using \`with\`.

### Using with Statement
\`\`\`python
# File is automatically closed
with open('file.txt', 'r') as f:
    content = f.read()
# f is closed here, even if exception occurs
\`\`\`

### Creating Context Managers

#### Class-based
\`\`\`python
class Timer:
    def __enter__(self):
        self.start = time.time()
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        print(f"Elapsed: {time.time() - self.start}")
        return False  # Don't suppress exceptions
\`\`\`

#### Using contextlib
\`\`\`python
from contextlib import contextmanager

@contextmanager
def timer():
    start = time.time()
    yield
    print(f"Elapsed: {time.time() - start}")
\`\`\``,
    options: [
      { text: "Objects that manage setup/cleanup with __enter__ and __exit__ methods", isCorrect: true },
      { text: "A way to manage program context/scope", isCorrect: false },
      { text: "Only used for file handling", isCorrect: false },
      { text: "A replacement for try-except blocks", isCorrect: false },
    ],
  },

  // More C++ Questions
  {
    id: 203,
    title: "What is RAII in C++?",
    text: "Explain Resource Acquisition Is Initialization.",
    difficulty: "Medium",
    languageId: "cpp",
    topicId: "cpp-memory",
    answer: `## RAII (Resource Acquisition Is Initialization)

RAII ties resource lifetime to object lifetime.

### Principle
- Acquire resources in constructor
- Release resources in destructor
- Guarantees cleanup even with exceptions

### Example
\`\`\`cpp
class FileHandler {
    FILE* file;
public:
    FileHandler(const char* name) {
        file = fopen(name, "r");
        if (!file) throw std::runtime_error("Cannot open");
    }
    
    ~FileHandler() {
        if (file) fclose(file);  // Always cleaned up
    }
};

void process() {
    FileHandler fh("data.txt");  // Opens file
    // Use file...
}  // File automatically closed here
\`\`\`

### Smart Pointers as RAII
\`\`\`cpp
auto ptr = std::make_unique<MyClass>();
// Automatically deleted when ptr goes out of scope
\`\`\``,
    options: [
      { text: "Tying resource lifetime to object lifetime for automatic cleanup", isCorrect: true },
      { text: "A design pattern for initialization", isCorrect: false },
      { text: "A memory allocation strategy", isCorrect: false },
      { text: "Only applies to file handling", isCorrect: false },
    ],
  },
  {
    id: 204,
    title: "What is the difference between virtual and pure virtual functions?",
    text: "Explain virtual functions in C++ inheritance.",
    difficulty: "Medium",
    languageId: "cpp",
    topicId: "cpp-oop",
    answer: `## Virtual vs Pure Virtual Functions

### Virtual Function
- Has implementation in base class
- Can be overridden in derived class
- Enables runtime polymorphism

\`\`\`cpp
class Animal {
public:
    virtual void speak() {
        cout << "Some sound" << endl;
    }
};

class Dog : public Animal {
public:
    void speak() override {
        cout << "Woof!" << endl;
    }
};
\`\`\`

### Pure Virtual Function
- No implementation in base class (= 0)
- MUST be overridden in derived class
- Makes class abstract

\`\`\`cpp
class Shape {
public:
    virtual double area() = 0;  // Pure virtual
};

class Circle : public Shape {
public:
    double area() override {
        return 3.14 * r * r;
    }
};
\`\`\``,
    options: [
      { text: "Virtual has implementation, pure virtual (=0) must be overridden", isCorrect: true },
      { text: "They are the same thing", isCorrect: false },
      { text: "Pure virtual is faster", isCorrect: false },
      { text: "Virtual functions cannot be overridden", isCorrect: false },
    ],
  },
  {
    id: 205,
    title: "What is move semantics in C++11?",
    text: "Explain move semantics and rvalue references.",
    difficulty: "Hard",
    languageId: "cpp",
    topicId: "cpp-memory",
    answer: `## Move Semantics

Move semantics allow transferring resources instead of copying.

### Rvalue References (&&)
\`\`\`cpp
void process(std::string&& str) {
    // str is an rvalue reference
}

process(std::string("hello"));  // OK: rvalue
// process(existing_string);    // Error: lvalue
process(std::move(existing));   // OK: cast to rvalue
\`\`\`

### Move Constructor
\`\`\`cpp
class Buffer {
    char* data;
    size_t size;
public:
    // Move constructor
    Buffer(Buffer&& other) noexcept 
        : data(other.data), size(other.size) {
        other.data = nullptr;  // Leave source in valid state
        other.size = 0;
    }
};
\`\`\`

### Benefits
- Avoids expensive deep copies
- Essential for move-only types (unique_ptr)
- Significant performance improvement`,
    options: [
      { text: "Transferring resources instead of copying using rvalue references", isCorrect: true },
      { text: "Moving objects in memory", isCorrect: false },
      { text: "A new type of loop", isCorrect: false },
      { text: "Replaces all copy operations", isCorrect: false },
    ],
  },
  {
    id: 206,
    title: "What are variadic templates?",
    text: "Explain variadic templates in C++.",
    difficulty: "Hard",
    languageId: "cpp",
    topicId: "cpp-templates",
    answer: `## Variadic Templates

Templates that accept any number of template arguments.

### Syntax
\`\`\`cpp
template<typename... Args>
void print(Args... args) {
    (std::cout << ... << args) << std::endl;
}

print(1, "hello", 3.14);  // Works!
\`\`\`

### Fold Expressions (C++17)
\`\`\`cpp
template<typename... Args>
auto sum(Args... args) {
    return (args + ...);  // Fold over +
}

sum(1, 2, 3, 4);  // Returns 10
\`\`\`

### Recursive Pattern
\`\`\`cpp
// Base case
void print() {}

// Recursive case
template<typename T, typename... Rest>
void print(T first, Rest... rest) {
    std::cout << first << " ";
    print(rest...);  // Recurse with remaining args
}
\`\`\``,
    options: [
      { text: "Templates accepting any number of type arguments using parameter packs", isCorrect: true },
      { text: "Templates that vary at runtime", isCorrect: false },
      { text: "A replacement for function overloading", isCorrect: false },
      { text: "Only available in C++20", isCorrect: false },
    ],
  },

  // More JavaScript Questions
  {
    id: 303,
    title: "What is closure in JavaScript?",
    text: "Explain closures and their use cases.",
    difficulty: "Medium",
    languageId: "javascript",
    topicId: "js-functions",
    answer: `## JavaScript Closures

A closure is a function that remembers its outer scope even after the outer function returns.

### Example
\`\`\`javascript
function createCounter() {
    let count = 0;  // Enclosed variable
    
    return function() {
        count++;
        return count;
    };
}

const counter = createCounter();
console.log(counter());  // 1
console.log(counter());  // 2
\`\`\`

### Use Cases

#### 1. Data Privacy
\`\`\`javascript
function createBankAccount(initial) {
    let balance = initial;
    
    return {
        deposit: (amount) => balance += amount,
        getBalance: () => balance
    };
}
\`\`\`

#### 2. Function Factories
\`\`\`javascript
function multiply(x) {
    return (y) => x * y;
}
const double = multiply(2);
double(5);  // 10
\`\`\``,
    options: [
      { text: "A function that retains access to its outer scope variables", isCorrect: true },
      { text: "A way to close a function", isCorrect: false },
      { text: "A type of loop", isCorrect: false },
      { text: "Only works with arrow functions", isCorrect: false },
    ],
  },
  {
    id: 304,
    title: "What is the difference between == and ===?",
    text: "Explain equality operators in JavaScript.",
    difficulty: "Easy",
    languageId: "javascript",
    topicId: "js-basics",
    answer: `## == vs === in JavaScript

### == (Loose Equality)
- Performs type coercion
- Converts operands to same type before comparing

\`\`\`javascript
5 == "5"     // true (string converted to number)
null == undefined  // true
0 == false   // true
"" == false  // true
\`\`\`

### === (Strict Equality)
- No type coercion
- Must be same type AND same value

\`\`\`javascript
5 === "5"    // false (different types)
null === undefined  // false
0 === false  // false
\`\`\`

### Best Practice
Always use === unless you specifically need type coercion.

### Gotchas
\`\`\`javascript
NaN === NaN  // false! Use Number.isNaN()
[] == []     // false (different references)
\`\`\``,
    options: [
      { text: "== does type coercion, === requires same type and value", isCorrect: true },
      { text: "They are exactly the same", isCorrect: false },
      { text: "=== is slower", isCorrect: false },
      { text: "== is stricter", isCorrect: false },
    ],
  },
  {
    id: 305,
    title: "What is prototypal inheritance?",
    text: "Explain JavaScript's prototype chain.",
    difficulty: "Medium",
    languageId: "javascript",
    topicId: "js-es6",
    answer: `## Prototypal Inheritance

JavaScript uses prototypes for inheritance, not classical classes.

### Prototype Chain
\`\`\`javascript
const animal = {
    eat() { console.log("Eating"); }
};

const dog = Object.create(animal);
dog.bark = function() { console.log("Woof!"); };

dog.eat();   // Found on prototype
dog.bark();  // Found on dog
\`\`\`

### How It Works
\`\`\`
dog
  └── __proto__ → animal
                    └── __proto__ → Object.prototype
                                      └── __proto__ → null
\`\`\`

### ES6 Classes (Syntactic Sugar)
\`\`\`javascript
class Animal {
    eat() { console.log("Eating"); }
}

class Dog extends Animal {
    bark() { console.log("Woof!"); }
}
// Still uses prototypes under the hood!
\`\`\``,
    options: [
      { text: "Objects inherit directly from other objects via prototype chain", isCorrect: true },
      { text: "Same as classical inheritance in Java", isCorrect: false },
      { text: "Requires ES6 classes", isCorrect: false },
      { text: "Does not support inheritance", isCorrect: false },
    ],
  },

  // More Go Questions
  {
    id: 402,
    title: "What are channels in Go?",
    text: "Explain channels and their usage patterns.",
    difficulty: "Medium",
    languageId: "go",
    topicId: "go-concurrency",
    answer: `## Go Channels

Channels are typed conduits for communication between goroutines.

### Basic Usage
\`\`\`go
ch := make(chan int)

// Send
go func() {
    ch <- 42
}()

// Receive
value := <-ch
\`\`\`

### Buffered Channels
\`\`\`go
ch := make(chan int, 3)  // Buffer size 3
ch <- 1  // Non-blocking
ch <- 2  // Non-blocking
ch <- 3  // Non-blocking
ch <- 4  // Blocks until space available
\`\`\`

### Select Statement
\`\`\`go
select {
case msg := <-ch1:
    fmt.Println(msg)
case ch2 <- value:
    fmt.Println("sent")
case <-time.After(time.Second):
    fmt.Println("timeout")
}
\`\`\`

### Close & Range
\`\`\`go
close(ch)
for v := range ch {
    fmt.Println(v)
}
\`\`\``,
    options: [
      { text: "Typed conduits for safe communication between goroutines", isCorrect: true },
      { text: "Go's version of arrays", isCorrect: false },
      { text: "Only for sending integers", isCorrect: false },
      { text: "Cannot be closed once created", isCorrect: false },
    ],
  },
  {
    id: 403,
    title: "How does Go handle errors?",
    text: "Explain error handling patterns in Go.",
    difficulty: "Easy",
    languageId: "go",
    topicId: "go-errors",
    answer: `## Go Error Handling

Go uses explicit error returns instead of exceptions.

### Basic Pattern
\`\`\`go
func divide(a, b float64) (float64, error) {
    if b == 0 {
        return 0, errors.New("division by zero")
    }
    return a / b, nil
}

result, err := divide(10, 0)
if err != nil {
    log.Fatal(err)
}
\`\`\`

### Custom Errors
\`\`\`go
type ValidationError struct {
    Field string
    Message string
}

func (e *ValidationError) Error() string {
    return fmt.Sprintf("%s: %s", e.Field, e.Message)
}
\`\`\`

### Error Wrapping (Go 1.13+)
\`\`\`go
if err != nil {
    return fmt.Errorf("failed to process: %w", err)
}

// Check wrapped errors
if errors.Is(err, os.ErrNotExist) { ... }
\`\`\``,
    options: [
      { text: "Functions return error as second value, checked explicitly with if err != nil", isCorrect: true },
      { text: "Uses try-catch like Java", isCorrect: false },
      { text: "Errors are ignored by default", isCorrect: false },
      { text: "Only panics are used", isCorrect: false },
    ],
  },
  {
    id: 404,
    title: "What are Go interfaces?",
    text: "Explain how interfaces work in Go.",
    difficulty: "Medium",
    languageId: "go",
    topicId: "go-interfaces",
    answer: `## Go Interfaces

Interfaces define behavior through method signatures. Types implement interfaces implicitly.

### Definition
\`\`\`go
type Writer interface {
    Write([]byte) (int, error)
}

type Reader interface {
    Read([]byte) (int, error)
}

// Composition
type ReadWriter interface {
    Reader
    Writer
}
\`\`\`

### Implicit Implementation
\`\`\`go
type MyFile struct{}

func (f MyFile) Write(data []byte) (int, error) {
    // Implementation
    return len(data), nil
}

// MyFile now implements Writer!
var w Writer = MyFile{}
\`\`\`

### Empty Interface
\`\`\`go
interface{}  // or 'any' in Go 1.18+
// Can hold any type

func printAny(v interface{}) {
    fmt.Println(v)
}
\`\`\``,
    options: [
      { text: "Implicit interfaces - types implement by having required methods", isCorrect: true },
      { text: "Must explicitly declare implementation", isCorrect: false },
      { text: "Same as Java interfaces", isCorrect: false },
      { text: "Cannot be composed", isCorrect: false },
    ],
  },

  // More Rust Questions
  {
    id: 502,
    title: "What is the difference between String and &str?",
    text: "Explain string types in Rust.",
    difficulty: "Easy",
    languageId: "rust",
    topicId: "rust-basics",
    answer: `## String vs &str in Rust

### String (Owned)
- Heap-allocated, growable
- Owns its data
- Can be modified

\`\`\`rust
let mut s = String::from("hello");
s.push_str(", world!");  // Can modify
\`\`\`

### &str (Borrowed)
- String slice, view into string data
- Immutable by default
- Can point to String, literal, or any UTF-8 data

\`\`\`rust
let s: &str = "hello";  // String literal
let owned = String::from("hello");
let slice: &str = &owned;  // Borrow as slice
\`\`\`

### Conversions
\`\`\`rust
// &str to String
let s = "hello".to_string();
let s = String::from("hello");

// String to &str
let slice: &str = &my_string;
\`\`\`

### Function Parameters
\`\`\`rust
// Accept both String and &str
fn greet(name: &str) {
    println!("Hello, {}!", name);
}
\`\`\``,
    options: [
      { text: "String is owned/growable, &str is a borrowed slice", isCorrect: true },
      { text: "They are interchangeable", isCorrect: false },
      { text: "&str is mutable, String is not", isCorrect: false },
      { text: "String is on stack, &str is on heap", isCorrect: false },
    ],
  },
  {
    id: 503,
    title: "What is the Result type in Rust?",
    text: "Explain error handling with Result.",
    difficulty: "Medium",
    languageId: "rust",
    topicId: "rust-basics",
    answer: `## Result Type in Rust

Result is an enum for recoverable errors.

\`\`\`rust
enum Result<T, E> {
    Ok(T),
    Err(E),
}
\`\`\`

### Basic Usage
\`\`\`rust
fn divide(a: f64, b: f64) -> Result<f64, String> {
    if b == 0.0 {
        Err(String::from("Division by zero"))
    } else {
        Ok(a / b)
    }
}

match divide(10.0, 2.0) {
    Ok(result) => println!("Result: {}", result),
    Err(e) => println!("Error: {}", e),
}
\`\`\`

### ? Operator (Propagation)
\`\`\`rust
fn process() -> Result<(), Error> {
    let file = File::open("data.txt")?;  // Returns early on error
    let data = read_data(&file)?;
    Ok(())
}
\`\`\`

### Useful Methods
\`\`\`rust
result.unwrap();      // Panic on Err
result.expect("msg"); // Panic with message
result.unwrap_or(default);
result.map(|v| v * 2);
\`\`\``,
    options: [
      { text: "An enum with Ok(T) and Err(E) variants for explicit error handling", isCorrect: true },
      { text: "Same as exceptions in other languages", isCorrect: false },
      { text: "Only used for file operations", isCorrect: false },
      { text: "Automatically unwraps values", isCorrect: false },
    ],
  },
  {
    id: 504,
    title: "What are lifetimes in Rust?",
    text: "Explain lifetime annotations in Rust.",
    difficulty: "Hard",
    languageId: "rust",
    topicId: "rust-ownership",
    answer: `## Rust Lifetimes

Lifetimes ensure references are valid for as long as needed.

### Why Lifetimes?
\`\`\`rust
// Won't compile - which input does output reference?
fn longest(x: &str, y: &str) -> &str {
    if x.len() > y.len() { x } else { y }
}
\`\`\`

### Lifetime Annotations
\`\`\`rust
fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() { x } else { y }
}
// 'a means: output lives as long as shortest input
\`\`\`

### In Structs
\`\`\`rust
struct ImportantExcerpt<'a> {
    part: &'a str,  // Struct can't outlive the reference
}
\`\`\`

### Static Lifetime
\`\`\`rust
let s: &'static str = "I live forever";
\`\`\`

### Lifetime Elision Rules
1. Each input reference gets its own lifetime
2. If one input, output gets same lifetime
3. If &self, output gets self's lifetime`,
    options: [
      { text: "Annotations that describe how long references are valid", isCorrect: true },
      { text: "How long a variable lives in memory", isCorrect: false },
      { text: "Only needed for static variables", isCorrect: false },
      { text: "The same as scope", isCorrect: false },
    ],
  },
  {
    id: 505,
    title: "What are traits in Rust?",
    text: "Explain traits and trait bounds.",
    difficulty: "Medium",
    languageId: "rust",
    topicId: "rust-traits",
    answer: `## Rust Traits

Traits define shared behavior, similar to interfaces.

### Defining Traits
\`\`\`rust
trait Summary {
    fn summarize(&self) -> String;
    
    // Default implementation
    fn preview(&self) -> String {
        format!("Read more: {}", self.summarize())
    }
}
\`\`\`

### Implementing Traits
\`\`\`rust
struct Article { title: String, content: String }

impl Summary for Article {
    fn summarize(&self) -> String {
        format!("{}", self.title)
    }
}
\`\`\`

### Trait Bounds
\`\`\`rust
// Function that requires trait
fn notify<T: Summary>(item: &T) {
    println!("Breaking: {}", item.summarize());
}

// Multiple bounds
fn process<T: Summary + Display>(item: T) { ... }

// Where clause
fn complex<T, U>(t: T, u: U)
where
    T: Summary + Clone,
    U: Debug
{ ... }
\`\`\``,
    options: [
      { text: "Shared behavior definitions, like interfaces with optional defaults", isCorrect: true },
      { text: "The same as classes", isCorrect: false },
      { text: "Only for primitive types", isCorrect: false },
      { text: "Cannot have default implementations", isCorrect: false },
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
