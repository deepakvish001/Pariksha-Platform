// Mass Recruitment Companies and Questions Data
import type { Difficulty, Question } from "./companyDetailData";

// Company list for mass recruitment
export interface MassRecruitmentCompany {
  id: string;
  name: string;
  shortName?: string;
}

export const massRecruitmentCompanies: MassRecruitmentCompany[] = [
  { id: "hcl", name: "HCL Technologies", shortName: "HCL" },
  { id: "ibm", name: "IBM", shortName: "IBM" },
  { id: "cognizant", name: "Cognizant", shortName: "Cognizant" },
  { id: "infosys", name: "Infosys", shortName: "Infosys" },
  { id: "tcs", name: "Tata Consultancy Services", shortName: "TCS" },
  { id: "wipro", name: "Wipro", shortName: "Wipro" },
  { id: "tech-mahindra", name: "Tech Mahindra", shortName: "Tech Mahindra" },
  { id: "lt", name: "Larsen & Toubro Infotech", shortName: "L&T" },
  { id: "capgemini", name: "Capgemini", shortName: "Capgemini" },
  { id: "accenture", name: "Accenture", shortName: "Accenture" },
  { id: "mindtree", name: "Mindtree", shortName: "Mindtree" },
  { id: "mphasis", name: "Mphasis", shortName: "Mphasis" },
  { id: "hexaware", name: "Hexaware", shortName: "Hexaware" },
  { id: "ltimindtree", name: "LTIMindtree", shortName: "LTIMindtree" },
  { id: "zoho", name: "Zoho Corporation", shortName: "Zoho" },
  { id: "persistent", name: "Persistent Systems", shortName: "Persistent" },
  { id: "cyient", name: "Cyient", shortName: "Cyient" },
  { id: "coforge", name: "Coforge", shortName: "Coforge" },
];

// Question categories for mass recruitment
export const massRecruitmentCategories = [
  { id: "interview-questions", name: "Interview Questions", icon: "MessageSquare" },
  { id: "dsa-questions", name: "DSA", icon: "Code2" },
  { id: "aptitude-questions", name: "Aptitude", icon: "Brain" },
  { id: "sql-questions", name: "SQL", icon: "Database" },
  { id: "core-cs-questions", name: "Core CS", icon: "Cpu" },
];

// Interview Questions for mass recruitment
export const massInterviewQuestions: Question[] = [
  {
    id: 1001,
    text: "Overloading vs Overriding?",
    difficulty: "Easy",
    category: "OOP",
    answer: `## Overloading vs Overriding

### Method Overloading
**Same method name, different parameters** in the same class.

\`\`\`java
class Calculator {
    // Overloaded methods
    int add(int a, int b) { return a + b; }
    int add(int a, int b, int c) { return a + b + c; }
    double add(double a, double b) { return a + b; }
}
\`\`\`

### Method Overriding
**Same method signature** in parent and child classes.

\`\`\`java
class Animal {
    void speak() { System.out.println("Animal speaks"); }
}

class Dog extends Animal {
    @Override
    void speak() { System.out.println("Dog barks"); }
}
\`\`\`

| Feature | Overloading | Overriding |
|---------|-------------|------------|
| Binding | Compile-time | Runtime |
| Parameters | Must differ | Must match |
| Inheritance | Not required | Required |
| Return type | Can differ | Same or covariant |`,
  },
  {
    id: 1002,
    text: "What are the 4 pillars of OOP?",
    difficulty: "Easy",
    category: "OOP",
    answer: `## Four Pillars of OOP

### 1. Encapsulation
Bundling data and methods that operate on that data within a single unit (class).

\`\`\`java
class BankAccount {
    private double balance;  // Hidden
    
    public void deposit(double amount) {
        if (amount > 0) balance += amount;
    }
}
\`\`\`

### 2. Abstraction
Hiding complex implementation details and showing only necessary features.

\`\`\`java
abstract class Vehicle {
    abstract void start();  // What, not how
}
\`\`\`

### 3. Inheritance
Acquiring properties and behaviors from a parent class.

\`\`\`java
class Car extends Vehicle {
    void start() { System.out.println("Car starting..."); }
}
\`\`\`

### 4. Polymorphism
One interface, multiple implementations.

\`\`\`java
Vehicle v = new Car();  // Runtime polymorphism
v.start();  // Calls Car's start()
\`\`\``,
  },
  {
    id: 1003,
    text: "What are your strengths?",
    difficulty: "Easy",
    category: "HR",
    answer: `## How to Answer "What are your strengths?"

### Framework: STAR Method
- **S**ituation → **T**ask → **A**ction → **R**esult

### Sample Answer:
"My key strengths are:

1. **Problem-solving**: I enjoy breaking down complex problems. During my project, I optimized a database query that reduced load time by 60%.

2. **Quick learner**: I taught myself React in 2 weeks to contribute to a time-sensitive project.

3. **Team collaboration**: I actively participate in code reviews and mentor junior developers."

### Tips:
- ✅ Be specific with examples
- ✅ Align with job requirements
- ✅ Show self-awareness
- ❌ Don't be arrogant
- ❌ Avoid generic answers`,
  },
  {
    id: 1004,
    text: "What do you know about our company?",
    difficulty: "Easy",
    category: "HR",
    answer: `## Answering "What do you know about our company?"

### Research Framework:
1. **Company basics** - Founding, headquarters, CEO
2. **Products/Services** - Main offerings
3. **Recent news** - Acquisitions, new products, achievements
4. **Culture/Values** - Mission statement, work environment
5. **Why it matters to you** - Personal connection

### Sample Answer (for TCS):
"TCS is India's largest IT services company, part of the Tata Group. Founded in 1968, it serves Fortune 500 clients globally. I'm impressed by your focus on innovation through TCS Research and your commitment to sustainability. Your work in AI and cloud transformation aligns with my career interests in emerging technologies."

### Tips:
- ✅ Visit company website, LinkedIn, Glassdoor
- ✅ Read recent press releases
- ✅ Show genuine interest
- ❌ Don't just memorize facts`,
  },
  {
    id: 1005,
    text: "What is an Interface?",
    difficulty: "Easy",
    category: "OOP",
    answer: `## Interface in Java

An interface is a **contract** that defines what a class must do, without specifying how.

### Syntax:
\`\`\`java
interface Drawable {
    void draw();  // Abstract by default
    
    // Java 8+ features
    default void print() {
        System.out.println("Printing...");
    }
    
    static void info() {
        System.out.println("Drawable interface");
    }
}
\`\`\`

### Implementation:
\`\`\`java
class Circle implements Drawable {
    @Override
    public void draw() {
        System.out.println("Drawing circle");
    }
}
\`\`\`

### Key Points:
- All methods are \`public abstract\` by default
- All variables are \`public static final\`
- A class can implement multiple interfaces
- Interfaces support multiple inheritance
- Java 8: default and static methods allowed`,
  },
  {
    id: 1006,
    text: "Abstract Class vs Interface?",
    difficulty: "Easy",
    category: "OOP",
    answer: `## Abstract Class vs Interface

| Feature | Abstract Class | Interface |
|---------|----------------|-----------|
| Methods | Abstract + Concrete | Abstract (+ default in Java 8) |
| Variables | Any type | public static final only |
| Inheritance | Single | Multiple |
| Constructor | Yes | No |
| Access modifiers | Any | public only |
| When to use | IS-A relationship | CAN-DO capability |

### Example:
\`\`\`java
// Abstract class - partial implementation
abstract class Animal {
    protected String name;
    
    public Animal(String name) { this.name = name; }
    
    abstract void speak();  // Must override
    
    void breathe() {  // Concrete method
        System.out.println("Breathing...");
    }
}

// Interface - contract only
interface Flyable {
    void fly();
}

// Class using both
class Bird extends Animal implements Flyable {
    public Bird(String name) { super(name); }
    void speak() { System.out.println("Chirp!"); }
    public void fly() { System.out.println("Flying..."); }
}
\`\`\``,
  },
  {
    id: 1007,
    text: "What is a Constructor?",
    difficulty: "Easy",
    category: "OOP",
    answer: `## Constructor in Java

A constructor is a special method that **initializes** an object when it's created.

### Types:
\`\`\`java
class Employee {
    String name;
    int id;
    
    // 1. Default Constructor
    Employee() {
        name = "Unknown";
        id = 0;
    }
    
    // 2. Parameterized Constructor
    Employee(String name, int id) {
        this.name = name;
        this.id = id;
    }
    
    // 3. Copy Constructor
    Employee(Employee e) {
        this.name = e.name;
        this.id = e.id;
    }
}
\`\`\`

### Key Points:
- Same name as class
- No return type (not even void)
- Called automatically with \`new\`
- Can be overloaded
- \`this()\` calls another constructor
- \`super()\` calls parent constructor`,
  },
  {
    id: 1008,
    text: "What are your weaknesses?",
    difficulty: "Easy",
    category: "HR",
    answer: `## Answering "What are your weaknesses?"

### Strategy:
1. Choose a **real** weakness (not a strength in disguise)
2. Show **self-awareness**
3. Demonstrate **improvement efforts**

### Good Answer Example:
"I sometimes spend too much time perfecting code before moving on. I've learned to balance quality with deadlines by setting time limits for tasks and using iterative improvement."

### Framework:
- **Weakness**: What you struggle with
- **Impact**: How it affected you
- **Action**: What you're doing about it
- **Result**: Improvement you've seen

### Avoid:
- ❌ "I'm a perfectionist" (cliché)
- ❌ "I work too hard" (humble brag)
- ❌ Critical job skills
- ❌ "I don't have any" (lacks self-awareness)`,
  },
  {
    id: 1009,
    text: "How do you handle stress and pressure?",
    difficulty: "Easy",
    category: "HR",
    answer: `## Handling Stress and Pressure

### Sample Answer:
"I handle stress through:

1. **Prioritization**: I break tasks into smaller parts and tackle high-priority items first.

2. **Time management**: I use the Pomodoro technique - 25 minutes focused work, 5 minutes break.

3. **Communication**: I proactively communicate with my team about realistic timelines.

4. **Healthy habits**: Regular exercise and adequate sleep help me maintain focus.

**Example**: During a product launch, we faced a critical bug 2 days before deadline. I stayed calm, identified the root cause, and coordinated with the team for a quick fix. We deployed on time."

### Tips:
- ✅ Give specific examples
- ✅ Show problem-solving skills
- ✅ Mention work-life balance
- ❌ Don't say "I never feel stressed"`,
  },
  {
    id: 1010,
    text: "Checked vs Unchecked Exceptions?",
    difficulty: "Easy",
    category: "Exception Handling",
    answer: `## Checked vs Unchecked Exceptions

### Checked Exceptions
- **Compile-time** exceptions
- Must be handled or declared
- Examples: IOException, SQLException

\`\`\`java
// Must handle or declare throws
void readFile() throws IOException {
    FileReader fr = new FileReader("file.txt");
}
\`\`\`

### Unchecked Exceptions
- **Runtime** exceptions
- Not required to handle
- Examples: NullPointerException, ArrayIndexOutOfBoundsException

\`\`\`java
// No compile error, but can crash at runtime
void divide(int a, int b) {
    int result = a / b;  // ArithmeticException if b=0
}
\`\`\`

| Feature | Checked | Unchecked |
|---------|---------|-----------|
| Detection | Compile-time | Runtime |
| Handling | Mandatory | Optional |
| Parent class | Exception | RuntimeException |
| Examples | IOException | NullPointerException |`,
  },
  {
    id: 1011,
    text: "StringBuffer vs StringBuilder?",
    difficulty: "Easy",
    category: "Java",
    answer: `## StringBuffer vs StringBuilder

Both are **mutable** alternatives to String for efficient string manipulation.

| Feature | StringBuffer | StringBuilder |
|---------|--------------|---------------|
| Thread-safety | ✅ Synchronized | ❌ Not synchronized |
| Performance | Slower | Faster |
| Use case | Multi-threaded | Single-threaded |
| Introduced | Java 1.0 | Java 1.5 |

### Example:
\`\`\`java
// StringBuilder (preferred for single-threaded)
StringBuilder sb = new StringBuilder("Hello");
sb.append(" World");  // "Hello World"
sb.insert(5, ",");    // "Hello, World"
sb.reverse();         // "dlroW ,olleH"

// StringBuffer (same API, thread-safe)
StringBuffer sf = new StringBuffer("Thread");
sf.append("-safe");
\`\`\`

### When to use:
- **String**: Immutable, few modifications
- **StringBuilder**: Many modifications, single thread
- **StringBuffer**: Many modifications, multiple threads`,
  },
  {
    id: 1012,
    text: "Where do you see yourself in five years?",
    difficulty: "Easy",
    category: "HR",
    answer: `## Answering "Where do you see yourself in 5 years?"

### Strategy:
1. Show **ambition** (but realistic)
2. Align with **company growth**
3. Demonstrate **commitment**

### Sample Answer:
"In 5 years, I see myself as a senior developer or technical lead, having deepened my expertise in [relevant technology]. I want to mentor junior developers and contribute to architectural decisions. I'm excited about growing with [Company] as it expands its [specific initiative]."

### Framework:
- Year 1-2: Master role, contribute to projects
- Year 3-4: Take leadership, mentor others
- Year 5: Senior/Lead position

### Tips:
- ✅ Research company's career paths
- ✅ Be specific but flexible
- ✅ Show learning mindset
- ❌ Don't say "In your position"
- ❌ Avoid unrealistic goals`,
  },
  {
    id: 1013,
    text: "Java Access Modifiers?",
    difficulty: "Easy",
    category: "Java",
    answer: `## Java Access Modifiers

### Access Levels:
| Modifier | Class | Package | Subclass | World |
|----------|-------|---------|----------|-------|
| public | ✅ | ✅ | ✅ | ✅ |
| protected | ✅ | ✅ | ✅ | ❌ |
| default | ✅ | ✅ | ❌ | ❌ |
| private | ✅ | ❌ | ❌ | ❌ |

### Example:
\`\`\`java
package com.example;

public class Employee {
    public String name;       // Accessible everywhere
    protected int id;         // Package + subclasses
    String department;        // Package only (default)
    private double salary;    // This class only
    
    public double getSalary() { return salary; }
}
\`\`\`

### Best Practices:
- Use **private** for internal data
- Use **public** for API methods
- Use **protected** for inheritance
- Avoid **default** (unclear intent)`,
  },
  {
    id: 1014,
    text: "What is 'this' keyword?",
    difficulty: "Easy",
    category: "Java",
    answer: `## 'this' Keyword in Java

\`this\` refers to the **current object instance**.

### Uses:

#### 1. Distinguish instance variable from parameter
\`\`\`java
class Person {
    String name;
    
    Person(String name) {
        this.name = name;  // this.name = instance variable
    }
}
\`\`\`

#### 2. Call another constructor
\`\`\`java
class Rectangle {
    int width, height;
    
    Rectangle() {
        this(10, 10);  // Calls parameterized constructor
    }
    
    Rectangle(int w, int h) {
        this.width = w;
        this.height = h;
    }
}
\`\`\`

#### 3. Pass current object as argument
\`\`\`java
void display(Person p) { ... }

void show() {
    display(this);  // Pass current object
}
\`\`\`

#### 4. Return current object (method chaining)
\`\`\`java
class Builder {
    Builder setName(String n) {
        this.name = n;
        return this;  // Enable chaining
    }
}
// Usage: new Builder().setName("A").setAge(25);
\`\`\``,
  },
  {
    id: 1015,
    text: "What is the Collections Framework?",
    difficulty: "Easy",
    category: "Java",
    answer: `## Java Collections Framework

A unified architecture for representing and manipulating collections.

### Hierarchy:
\`\`\`
Collection (Interface)
├── List (ordered, duplicates allowed)
│   ├── ArrayList
│   ├── LinkedList
│   └── Vector → Stack
├── Set (no duplicates)
│   ├── HashSet
│   ├── LinkedHashSet
│   └── TreeSet
└── Queue
    ├── PriorityQueue
    └── Deque → ArrayDeque

Map (key-value pairs, separate hierarchy)
├── HashMap
├── LinkedHashMap
├── TreeMap
└── Hashtable
\`\`\`

### Quick Comparison:
| Collection | Ordered | Duplicates | Null | Thread-safe |
|------------|---------|------------|------|-------------|
| ArrayList | ✅ | ✅ | ✅ | ❌ |
| HashSet | ❌ | ❌ | 1 | ❌ |
| HashMap | ❌ | Keys ❌ | 1 key, ∞ values | ❌ |
| TreeSet | Sorted | ❌ | ❌ | ❌ |`,
  },
  {
    id: 1016,
    text: "What are Wrapper Classes?",
    difficulty: "Easy",
    category: "Java",
    answer: `## Wrapper Classes in Java

Wrapper classes convert **primitives** to **objects**.

### Primitive → Wrapper Mapping:
| Primitive | Wrapper |
|-----------|---------|
| byte | Byte |
| short | Short |
| int | Integer |
| long | Long |
| float | Float |
| double | Double |
| char | Character |
| boolean | Boolean |

### Why Use Wrappers?
1. Collections only store objects
2. Null values possible
3. Utility methods

### Autoboxing/Unboxing:
\`\`\`java
// Autoboxing (primitive → object)
Integer num = 10;  // int → Integer

// Unboxing (object → primitive)
int value = num;   // Integer → int

// Collections require wrappers
List<Integer> numbers = new ArrayList<>();
numbers.add(5);    // Autoboxed
\`\`\`

### Useful Methods:
\`\`\`java
Integer.parseInt("123");      // String → int
Integer.toString(123);        // int → String
Integer.valueOf(123);         // int → Integer
Integer.compare(a, b);        // Compare two ints
\`\`\``,
  },
  {
    id: 1017,
    text: "Difference between '==' and '.equals()'?",
    difficulty: "Easy",
    category: "Java",
    answer: `## == vs .equals()

### == (Reference Equality)
Compares **memory addresses** (if two references point to the same object).

\`\`\`java
String a = new String("hello");
String b = new String("hello");
System.out.println(a == b);  // false (different objects)

String c = "hello";
String d = "hello";
System.out.println(c == d);  // true (String pool)
\`\`\`

### .equals() (Value Equality)
Compares **content/values** (can be overridden).

\`\`\`java
String a = new String("hello");
String b = new String("hello");
System.out.println(a.equals(b));  // true (same content)
\`\`\`

### Summary:
| Aspect | == | .equals() |
|--------|-----|-----------|
| Compares | Memory address | Content |
| Primitives | Value | N/A |
| Objects | Reference | Value (if overridden) |
| Override | No | Yes |

### Best Practice:
- Primitives: Use \`==\`
- Objects: Use \`.equals()\`
- Override \`.equals()\` and \`.hashCode()\` together`,
  },
  {
    id: 1018,
    text: "Exception Handling keywords?",
    difficulty: "Easy",
    category: "Exception Handling",
    answer: `## Exception Handling Keywords

### 1. try
Block that might throw an exception.

### 2. catch
Handles the exception.

### 3. finally
Always executes (cleanup).

### 4. throw
Manually throw an exception.

### 5. throws
Declares exceptions a method might throw.

\`\`\`java
public void readFile(String path) throws IOException {  // throws
    FileReader fr = null;
    try {
        if (path == null) {
            throw new IllegalArgumentException("Path is null");  // throw
        }
        fr = new FileReader(path);
        // Read file
    } catch (FileNotFoundException e) {  // catch
        System.out.println("File not found: " + e.getMessage());
    } catch (IOException e) {
        System.out.println("IO error: " + e.getMessage());
    } finally {  // finally
        if (fr != null) {
            fr.close();  // Cleanup
        }
    }
}
\`\`\`

### Try-with-resources (Java 7+):
\`\`\`java
try (FileReader fr = new FileReader("file.txt")) {
    // Auto-closed
} catch (IOException e) {
    e.printStackTrace();
}
\`\`\``,
  },
  {
    id: 1019,
    text: "What is the 'final' keyword?",
    difficulty: "Easy",
    category: "Java",
    answer: `## 'final' Keyword in Java

\`final\` restricts modification.

### 1. Final Variable
Cannot be reassigned.

\`\`\`java
final int MAX = 100;
MAX = 200;  // ❌ Compile error

final List<String> list = new ArrayList<>();
list.add("item");  // ✅ Can modify contents
list = new ArrayList<>();  // ❌ Cannot reassign
\`\`\`

### 2. Final Method
Cannot be overridden.

\`\`\`java
class Parent {
    final void display() {
        System.out.println("Parent");
    }
}

class Child extends Parent {
    void display() { }  // ❌ Cannot override
}
\`\`\`

### 3. Final Class
Cannot be extended.

\`\`\`java
final class ImmutableClass {
    // String is a final class
}

class SubClass extends ImmutableClass { }  // ❌ Cannot extend
\`\`\`

### Use Cases:
- **Constants**: \`public static final\`
- **Immutability**: Prevent modification
- **Security**: Prevent overriding critical methods`,
  },
  {
    id: 1020,
    text: "Break vs Continue?",
    difficulty: "Easy",
    category: "Control Flow",
    answer: `## break vs continue

### break
**Exits** the loop entirely.

\`\`\`java
for (int i = 0; i < 10; i++) {
    if (i == 5) break;  // Exit at 5
    System.out.print(i + " ");
}
// Output: 0 1 2 3 4
\`\`\`

### continue
**Skips** current iteration, continues to next.

\`\`\`java
for (int i = 0; i < 10; i++) {
    if (i == 5) continue;  // Skip 5
    System.out.print(i + " ");
}
// Output: 0 1 2 3 4 6 7 8 9
\`\`\`

### Labeled break/continue:
\`\`\`java
outer:
for (int i = 0; i < 3; i++) {
    for (int j = 0; j < 3; j++) {
        if (j == 1) break outer;  // Exits both loops
        System.out.println(i + ", " + j);
    }
}
// Output: 0, 0
\`\`\`

| Feature | break | continue |
|---------|-------|----------|
| Action | Exit loop | Skip iteration |
| Switch | Exits switch | N/A |
| Labeled | Exit outer loop | Skip outer iteration |`,
  },
];

// DSA Questions for mass recruitment
export const massDSAQuestions: Question[] = [
  {
    id: 2001,
    text: "What is the time complexity of binary search?",
    difficulty: "Easy",
    category: "Searching",
    answer: `## Binary Search Time Complexity

### Time Complexity: O(log n)

Binary search divides the search space in half with each comparison.

\`\`\`java
int binarySearch(int[] arr, int target) {
    int left = 0, right = arr.length - 1;
    
    while (left <= right) {
        int mid = left + (right - left) / 2;
        
        if (arr[mid] == target) return mid;
        else if (arr[mid] < target) left = mid + 1;
        else right = mid - 1;
    }
    return -1;
}
\`\`\`

### Why O(log n)?
- Array of size n
- After 1 step: n/2 elements
- After 2 steps: n/4 elements
- After k steps: n/2^k elements
- When n/2^k = 1, k = log₂(n)

### Comparison:
| Search | Time | Requirement |
|--------|------|-------------|
| Linear | O(n) | None |
| Binary | O(log n) | Sorted array |`,
  },
  {
    id: 2002,
    text: "Explain the difference between Array and LinkedList.",
    difficulty: "Easy",
    category: "Data Structures",
    answer: `## Array vs LinkedList

| Feature | Array | LinkedList |
|---------|-------|------------|
| Memory | Contiguous | Non-contiguous |
| Size | Fixed | Dynamic |
| Access | O(1) random | O(n) sequential |
| Insert/Delete | O(n) | O(1) at ends |
| Cache | Friendly | Not friendly |

### When to use Array:
- Frequent random access
- Known size
- Memory efficiency

### When to use LinkedList:
- Frequent insertions/deletions
- Unknown size
- No random access needed`,
  },
  {
    id: 2003,
    text: "What is a Stack? Explain with an example.",
    difficulty: "Easy",
    category: "Data Structures",
    answer: `## Stack Data Structure

A Stack is a **LIFO** (Last In, First Out) data structure.

### Operations:
- **push(x)**: Add element to top - O(1)
- **pop()**: Remove top element - O(1)
- **peek()/top()**: View top element - O(1)
- **isEmpty()**: Check if empty - O(1)

\`\`\`java
Stack<Integer> stack = new Stack<>();
stack.push(10);  // [10]
stack.push(20);  // [10, 20]
stack.push(30);  // [10, 20, 30]

stack.peek();    // 30 (top)
stack.pop();     // 30 (removed), stack = [10, 20]
\`\`\`

### Use Cases:
- Function call stack
- Undo/Redo operations
- Expression evaluation
- Backtracking algorithms`,
  },
  {
    id: 2004,
    text: "What is a Queue? Explain with an example.",
    difficulty: "Easy",
    category: "Data Structures",
    answer: `## Queue Data Structure

A Queue is a **FIFO** (First In, First Out) data structure.

### Operations:
- **enqueue(x)**: Add to rear - O(1)
- **dequeue()**: Remove from front - O(1)
- **front()/peek()**: View front - O(1)
- **isEmpty()**: Check if empty - O(1)

\`\`\`java
Queue<Integer> queue = new LinkedList<>();
queue.offer(10);  // [10]
queue.offer(20);  // [10, 20]
queue.offer(30);  // [10, 20, 30]

queue.peek();     // 10 (front)
queue.poll();     // 10 (removed), queue = [20, 30]
\`\`\`

### Use Cases:
- Process scheduling
- Print queue
- BFS traversal
- Task handling`,
  },
  {
    id: 2005,
    text: "What is the difference between BFS and DFS?",
    difficulty: "Medium",
    category: "Graphs",
    answer: `## BFS vs DFS

| Feature | BFS | DFS |
|---------|-----|-----|
| Full form | Breadth-First Search | Depth-First Search |
| Data Structure | Queue | Stack/Recursion |
| Approach | Level by level | Deep then backtrack |
| Memory | O(width) | O(depth) |
| Shortest path | Yes (unweighted) | No guarantee |

### BFS:
\`\`\`java
void bfs(Graph g, int start) {
    Queue<Integer> queue = new LinkedList<>();
    boolean[] visited = new boolean[g.vertices];
    
    queue.offer(start);
    visited[start] = true;
    
    while (!queue.isEmpty()) {
        int node = queue.poll();
        System.out.print(node + " ");
        
        for (int neighbor : g.adj[node]) {
            if (!visited[neighbor]) {
                visited[neighbor] = true;
                queue.offer(neighbor);
            }
        }
    }
}
\`\`\`

### DFS:
\`\`\`java
void dfs(Graph g, int node, boolean[] visited) {
    visited[node] = true;
    System.out.print(node + " ");
    
    for (int neighbor : g.adj[node]) {
        if (!visited[neighbor]) {
            dfs(g, neighbor, visited);
        }
    }
}
\`\`\``,
  },
  {
    id: 2006,
    text: "What is a Binary Search Tree?",
    difficulty: "Easy",
    category: "Trees",
    answer: `## Binary Search Tree (BST)

A BST is a binary tree where:
- Left subtree contains nodes with **smaller** values
- Right subtree contains nodes with **larger** values

### Operations:
| Operation | Average | Worst |
|-----------|---------|-------|
| Search | O(log n) | O(n) |
| Insert | O(log n) | O(n) |
| Delete | O(log n) | O(n) |

\`\`\`java
class BST {
    Node root;
    
    Node insert(Node node, int key) {
        if (node == null) return new Node(key);
        
        if (key < node.data)
            node.left = insert(node.left, key);
        else if (key > node.data)
            node.right = insert(node.right, key);
            
        return node;
    }
    
    boolean search(Node node, int key) {
        if (node == null) return false;
        if (node.data == key) return true;
        
        if (key < node.data)
            return search(node.left, key);
        return search(node.right, key);
    }
}
\`\`\``,
  },
  {
    id: 2007,
    text: "Explain Bubble Sort algorithm.",
    difficulty: "Easy",
    category: "Sorting",
    answer: `## Bubble Sort

Repeatedly swaps adjacent elements if they're in wrong order.

### Time Complexity:
- Best: O(n) - already sorted
- Average: O(n²)
- Worst: O(n²)

### Space: O(1)

\`\`\`java
void bubbleSort(int[] arr) {
    int n = arr.length;
    
    for (int i = 0; i < n - 1; i++) {
        boolean swapped = false;
        
        for (int j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                // Swap
                int temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
                swapped = true;
            }
        }
        
        // Optimization: if no swaps, array is sorted
        if (!swapped) break;
    }
}
\`\`\`

### Example:
\`\`\`
[5, 3, 8, 1] → [3, 5, 1, 8] → [3, 1, 5, 8] → [1, 3, 5, 8]
\`\`\``,
  },
  {
    id: 2008,
    text: "What is Quick Sort?",
    difficulty: "Medium",
    category: "Sorting",
    answer: `## Quick Sort

A divide-and-conquer algorithm that picks a pivot and partitions the array.

### Time Complexity:
- Best: O(n log n)
- Average: O(n log n)
- Worst: O(n²) - sorted array with bad pivot

### Space: O(log n) - recursion stack

\`\`\`java
void quickSort(int[] arr, int low, int high) {
    if (low < high) {
        int pi = partition(arr, low, high);
        quickSort(arr, low, pi - 1);
        quickSort(arr, pi + 1, high);
    }
}

int partition(int[] arr, int low, int high) {
    int pivot = arr[high];
    int i = low - 1;
    
    for (int j = low; j < high; j++) {
        if (arr[j] < pivot) {
            i++;
            swap(arr, i, j);
        }
    }
    swap(arr, i + 1, high);
    return i + 1;
}
\`\`\`

### Why Quick Sort?
- In-place sorting
- Cache efficient
- Generally faster than Merge Sort`,
  },
  {
    id: 2009,
    text: "What is a Hash Table?",
    difficulty: "Easy",
    category: "Data Structures",
    answer: `## Hash Table

A data structure that maps keys to values using a hash function.

### Operations:
| Operation | Average | Worst |
|-----------|---------|-------|
| Insert | O(1) | O(n) |
| Search | O(1) | O(n) |
| Delete | O(1) | O(n) |

### Hash Function:
\`\`\`java
int hash(String key, int tableSize) {
    int hash = 0;
    for (char c : key.toCharArray()) {
        hash = (hash * 31 + c) % tableSize;
    }
    return hash;
}
\`\`\`

### Collision Handling:
1. **Chaining**: Store collisions in linked list
2. **Open Addressing**: Find next empty slot

\`\`\`java
// Java HashMap example
Map<String, Integer> map = new HashMap<>();
map.put("apple", 5);
map.get("apple");  // 5
map.containsKey("apple");  // true
\`\`\``,
  },
  {
    id: 2010,
    text: "What is recursion?",
    difficulty: "Easy",
    category: "Algorithms",
    answer: `## Recursion

A function that calls itself to solve smaller subproblems.

### Components:
1. **Base case**: Stop condition
2. **Recursive case**: Function calls itself

\`\`\`java
// Factorial: n! = n × (n-1)!
int factorial(int n) {
    if (n <= 1) return 1;  // Base case
    return n * factorial(n - 1);  // Recursive case
}

// factorial(5) = 5 × factorial(4)
//              = 5 × 4 × factorial(3)
//              = 5 × 4 × 3 × factorial(2)
//              = 5 × 4 × 3 × 2 × factorial(1)
//              = 5 × 4 × 3 × 2 × 1 = 120
\`\`\`

### Fibonacci:
\`\`\`java
int fib(int n) {
    if (n <= 1) return n;
    return fib(n - 1) + fib(n - 2);
}
\`\`\`

### Tips:
- Always have a base case
- Ensure progress towards base case
- Consider stack overflow for deep recursion`,
  },
];

// Aptitude Questions for mass recruitment
export const massAptitudeQuestions: Question[] = [
  {
    id: 3001,
    text: "A train 300m long passes a pole in 15 seconds. What is its speed?",
    difficulty: "Easy",
    category: "Time & Distance",
    answer: `## Solution

**Given:**
- Length of train = 300m
- Time = 15 seconds

**Formula:**
Speed = Distance / Time

**Calculation:**
Speed = 300m / 15s = 20 m/s

**Convert to km/hr:**
20 × (18/5) = 72 km/hr

**Answer: 72 km/hr**`,
  },
  {
    id: 3002,
    text: "If A can complete a work in 10 days and B can complete the same work in 15 days, how long will they take together?",
    difficulty: "Easy",
    category: "Work & Time",
    answer: `## Solution

**Given:**
- A completes in 10 days
- B completes in 15 days

**Formula:**
Combined work = 1/A + 1/B

**Calculation:**
- A's 1 day work = 1/10
- B's 1 day work = 1/15
- Combined = 1/10 + 1/15 = (3+2)/30 = 5/30 = 1/6

**Time together = 6 days**`,
  },
  {
    id: 3003,
    text: "Find the compound interest on Rs. 10,000 at 10% per annum for 2 years.",
    difficulty: "Easy",
    category: "Interest",
    answer: `## Solution

**Given:**
- Principal (P) = Rs. 10,000
- Rate (R) = 10%
- Time (T) = 2 years

**Formula:**
A = P(1 + R/100)^T

**Calculation:**
A = 10000 × (1 + 10/100)²
A = 10000 × (1.1)²
A = 10000 × 1.21
A = Rs. 12,100

**CI = A - P = 12100 - 10000 = Rs. 2,100**`,
  },
  {
    id: 3004,
    text: "In how many ways can 5 people be seated in a row?",
    difficulty: "Easy",
    category: "Permutation",
    answer: `## Solution

**Concept:** Linear arrangement = n!

**Calculation:**
5! = 5 × 4 × 3 × 2 × 1 = **120 ways**`,
  },
  {
    id: 3005,
    text: "A bag contains 5 red and 3 blue balls. What is the probability of drawing a red ball?",
    difficulty: "Easy",
    category: "Probability",
    answer: `## Solution

**Given:**
- Red balls = 5
- Blue balls = 3
- Total = 8

**Formula:**
P(event) = Favorable outcomes / Total outcomes

**Calculation:**
P(red) = 5/8

**Answer: 5/8 or 0.625**`,
  },
  {
    id: 3006,
    text: "If the ratio of ages of A and B is 3:5 and the sum of their ages is 40, find their ages.",
    difficulty: "Easy",
    category: "Ratio",
    answer: `## Solution

**Given:**
- Ratio = 3:5
- Sum = 40

**Let ages be 3x and 5x**

3x + 5x = 40
8x = 40
x = 5

**Ages:**
- A = 3 × 5 = 15 years
- B = 5 × 5 = 25 years`,
  },
  {
    id: 3007,
    text: "A man walks 6 km North, then 8 km East. How far is he from the starting point?",
    difficulty: "Easy",
    category: "Direction",
    answer: `## Solution

**Using Pythagorean theorem:**

Distance² = 6² + 8²
Distance² = 36 + 64 = 100
Distance = √100 = **10 km**

This is a 3-4-5 right triangle scaled by 2.`,
  },
  {
    id: 3008,
    text: "Find the average of first 10 natural numbers.",
    difficulty: "Easy",
    category: "Average",
    answer: `## Solution

**Formula for average of first n natural numbers:**
Average = (n + 1) / 2

**Or calculate directly:**
Sum = 1+2+3+4+5+6+7+8+9+10 = 55
Average = 55/10 = **5.5**`,
  },
  {
    id: 3009,
    text: "A shopkeeper marks goods 20% above cost price but gives 10% discount. Find profit %.",
    difficulty: "Medium",
    category: "Profit & Loss",
    answer: `## Solution

**Let CP = Rs. 100**

Marked Price = 100 + 20% = Rs. 120
Discount = 10% of 120 = Rs. 12
Selling Price = 120 - 12 = Rs. 108

**Profit = SP - CP = 108 - 100 = Rs. 8**
**Profit % = 8/100 × 100 = 8%**`,
  },
  {
    id: 3010,
    text: "Two pipes can fill a tank in 10 and 15 hours. How long to fill together?",
    difficulty: "Easy",
    category: "Pipes & Cisterns",
    answer: `## Solution

**Similar to work problems:**

Pipe A fills 1/10 per hour
Pipe B fills 1/15 per hour

Combined = 1/10 + 1/15 = (3+2)/30 = 1/6

**Time = 6 hours**`,
  },
];

// SQL Questions for mass recruitment
export const massSQLQuestions: Question[] = [
  {
    id: 4001,
    text: "What is a PRIMARY KEY?",
    difficulty: "Easy",
    category: "Constraints",
    answer: `## PRIMARY KEY

A primary key uniquely identifies each record in a table.

**Properties:**
- Must be UNIQUE
- Cannot be NULL
- Only ONE per table

\`\`\`sql
CREATE TABLE students (
    id INT PRIMARY KEY,
    name VARCHAR(100)
);
\`\`\``,
  },
  {
    id: 4002,
    text: "What is the difference between DELETE and TRUNCATE?",
    difficulty: "Easy",
    category: "DML",
    answer: `## DELETE vs TRUNCATE

| Feature | DELETE | TRUNCATE |
|---------|--------|----------|
| Type | DML | DDL |
| WHERE clause | Yes | No |
| Rollback | Possible | Not possible |
| Speed | Slower | Faster |
| Triggers | Fires | Doesn't fire |
| Identity | Not reset | Reset |`,
  },
  {
    id: 4003,
    text: "What is a FOREIGN KEY?",
    difficulty: "Easy",
    category: "Constraints",
    answer: `## FOREIGN KEY

A foreign key creates a link between two tables.

\`\`\`sql
CREATE TABLE orders (
    id INT PRIMARY KEY,
    customer_id INT,
    FOREIGN KEY (customer_id) 
        REFERENCES customers(id)
);
\`\`\`

**Enforces referential integrity** - can't have orphan records.`,
  },
  {
    id: 4004,
    text: "What are SQL aggregate functions?",
    difficulty: "Easy",
    category: "Functions",
    answer: `## Aggregate Functions

Functions that operate on sets of values.

| Function | Description |
|----------|-------------|
| COUNT() | Number of rows |
| SUM() | Total of values |
| AVG() | Average value |
| MIN() | Minimum value |
| MAX() | Maximum value |

\`\`\`sql
SELECT 
    COUNT(*) as total_orders,
    SUM(amount) as revenue,
    AVG(amount) as avg_order
FROM orders;
\`\`\``,
  },
  {
    id: 4005,
    text: "What is GROUP BY?",
    difficulty: "Easy",
    category: "Clauses",
    answer: `## GROUP BY

Groups rows with same values into summary rows.

\`\`\`sql
SELECT department, COUNT(*) as employees
FROM staff
GROUP BY department;
\`\`\`

**Result:**
| department | employees |
|------------|-----------|
| IT | 10 |
| HR | 5 |
| Sales | 8 |`,
  },
  {
    id: 4006,
    text: "What is a JOIN in SQL?",
    difficulty: "Easy",
    category: "Joins",
    answer: `## SQL JOIN

Combines rows from two or more tables based on related columns.

**Types:**
- INNER JOIN: Matching rows only
- LEFT JOIN: All left + matching right
- RIGHT JOIN: All right + matching left
- FULL JOIN: All rows from both

\`\`\`sql
SELECT e.name, d.dept_name
FROM employees e
INNER JOIN departments d 
    ON e.dept_id = d.id;
\`\`\``,
  },
  {
    id: 4007,
    text: "What is the difference between INNER JOIN and LEFT JOIN?",
    difficulty: "Easy",
    category: "Joins",
    answer: `## INNER JOIN vs LEFT JOIN

**INNER JOIN:** Returns only matching rows

**LEFT JOIN:** Returns ALL rows from left table + matching from right

\`\`\`sql
-- INNER: Only employees with departments
SELECT * FROM employees e
INNER JOIN departments d ON e.dept_id = d.id;

-- LEFT: All employees, even without department
SELECT * FROM employees e
LEFT JOIN departments d ON e.dept_id = d.id;
\`\`\``,
  },
  {
    id: 4008,
    text: "What is a subquery?",
    difficulty: "Medium",
    category: "Subqueries",
    answer: `## Subquery

A query nested inside another query.

\`\`\`sql
-- Find employees earning above average
SELECT name, salary
FROM employees
WHERE salary > (
    SELECT AVG(salary) FROM employees
);

-- In FROM clause
SELECT dept, avg_sal
FROM (
    SELECT department as dept, AVG(salary) as avg_sal
    FROM employees
    GROUP BY department
) as dept_avg;
\`\`\``,
  },
  {
    id: 4009,
    text: "What is an INDEX in SQL?",
    difficulty: "Easy",
    category: "Performance",
    answer: `## INDEX

A data structure that improves query speed.

\`\`\`sql
-- Create index
CREATE INDEX idx_email ON users(email);

-- Composite index
CREATE INDEX idx_name ON users(first_name, last_name);
\`\`\`

**Pros:** Faster reads
**Cons:** Slower writes, extra storage`,
  },
  {
    id: 4010,
    text: "What is the difference between UNION and UNION ALL?",
    difficulty: "Easy",
    category: "Set Operations",
    answer: `## UNION vs UNION ALL

| Feature | UNION | UNION ALL |
|---------|-------|-----------|
| Duplicates | Removes | Keeps all |
| Speed | Slower | Faster |

\`\`\`sql
-- UNION: Unique results
SELECT city FROM customers
UNION
SELECT city FROM suppliers;

-- UNION ALL: Includes duplicates
SELECT city FROM customers
UNION ALL
SELECT city FROM suppliers;
\`\`\``,
  },
];

// Core CS Questions for mass recruitment
export const massCoreCsQuestions: Question[] = [
  {
    id: 5001,
    text: "What is an Operating System?",
    difficulty: "Easy",
    category: "OS",
    answer: `## Operating System

An OS is system software that manages computer hardware and software resources.

**Functions:**
- Process management
- Memory management
- File system management
- Device management
- Security

**Examples:** Windows, Linux, macOS, Android`,
  },
  {
    id: 5002,
    text: "What is the difference between Process and Thread?",
    difficulty: "Easy",
    category: "OS",
    answer: `## Process vs Thread

| Feature | Process | Thread |
|---------|---------|--------|
| Definition | Program in execution | Lightweight process |
| Memory | Separate | Shared |
| Communication | IPC (slow) | Direct (fast) |
| Creation | Heavy | Light |
| Crash impact | Independent | Affects process |`,
  },
  {
    id: 5003,
    text: "What is a Deadlock?",
    difficulty: "Medium",
    category: "OS",
    answer: `## Deadlock

A situation where processes wait indefinitely for resources held by each other.

**Conditions (all 4 required):**
1. Mutual Exclusion
2. Hold and Wait
3. No Preemption
4. Circular Wait

**Prevention:** Break any one condition.`,
  },
  {
    id: 5004,
    text: "What is Virtual Memory?",
    difficulty: "Easy",
    category: "OS",
    answer: `## Virtual Memory

Memory management technique using disk space as RAM extension.

**Benefits:**
- Run programs larger than physical RAM
- Process isolation
- Efficient memory use

**Mechanism:** Paging - divides memory into fixed-size pages.`,
  },
  {
    id: 5005,
    text: "What is the OSI Model?",
    difficulty: "Easy",
    category: "Networking",
    answer: `## OSI Model (7 Layers)

| Layer | Name | Function | Example |
|-------|------|----------|---------|
| 7 | Application | User interface | HTTP, FTP |
| 6 | Presentation | Data format | SSL, JPEG |
| 5 | Session | Connections | NetBIOS |
| 4 | Transport | End-to-end | TCP, UDP |
| 3 | Network | Routing | IP, ICMP |
| 2 | Data Link | Frames | Ethernet |
| 1 | Physical | Bits | Cables |

**Mnemonic:** All People Seem To Need Data Processing`,
  },
  {
    id: 5006,
    text: "What is the difference between TCP and UDP?",
    difficulty: "Easy",
    category: "Networking",
    answer: `## TCP vs UDP

| Feature | TCP | UDP |
|---------|-----|-----|
| Connection | Connection-oriented | Connectionless |
| Reliability | Guaranteed delivery | Best effort |
| Order | Ordered | Unordered |
| Speed | Slower | Faster |
| Use case | Web, Email | Video, Gaming |`,
  },
  {
    id: 5007,
    text: "What is DBMS?",
    difficulty: "Easy",
    category: "DBMS",
    answer: `## DBMS (Database Management System)

Software for storing, retrieving, and managing data.

**Types:**
- Relational (MySQL, PostgreSQL)
- NoSQL (MongoDB, Redis)
- Graph (Neo4j)

**ACID Properties:**
- Atomicity
- Consistency
- Isolation
- Durability`,
  },
  {
    id: 5008,
    text: "What is Normalization?",
    difficulty: "Easy",
    category: "DBMS",
    answer: `## Normalization

Process of organizing data to reduce redundancy.

**Normal Forms:**
- 1NF: Atomic values
- 2NF: No partial dependencies
- 3NF: No transitive dependencies
- BCNF: Every determinant is a key

**Goal:** Eliminate data anomalies.`,
  },
  {
    id: 5009,
    text: "What is an IP Address?",
    difficulty: "Easy",
    category: "Networking",
    answer: `## IP Address

Unique identifier for devices on a network.

**IPv4:** 32-bit, e.g., 192.168.1.1
**IPv6:** 128-bit, e.g., 2001:0db8::1

**Classes (IPv4):**
- Class A: 1.0.0.0 - 126.255.255.255
- Class B: 128.0.0.0 - 191.255.255.255
- Class C: 192.0.0.0 - 223.255.255.255`,
  },
  {
    id: 5010,
    text: "What is HTTP vs HTTPS?",
    difficulty: "Easy",
    category: "Networking",
    answer: `## HTTP vs HTTPS

| Feature | HTTP | HTTPS |
|---------|------|-------|
| Security | None | SSL/TLS encrypted |
| Port | 80 | 443 |
| URL | http:// | https:// |
| Speed | Faster | Slightly slower |
| SEO | Lower rank | Higher rank |

**HTTPS is essential for:**
- Login pages
- Payment forms
- Any sensitive data`,
  },
];

// Export all question sets by company (same questions for all companies for now)
export const getQuestionsForCompany = (companyId: string, category: string): Question[] => {
  switch (category) {
    case "interview-questions":
      return massInterviewQuestions;
    case "dsa-questions":
      return massDSAQuestions;
    case "aptitude-questions":
      return massAptitudeQuestions;
    case "sql-questions":
      return massSQLQuestions;
    case "core-cs-questions":
      return massCoreCsQuestions;
    default:
      return [];
  }
};
