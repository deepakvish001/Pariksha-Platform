 // Core CS Subjects Data - Comprehensive question bank organized by subject
 import type { Difficulty } from "./positionResourcesData";
 
 export interface CSQuestion {
   id: number;
   title: string;
   text: string;
   difficulty: Difficulty;
   subjectId: string;
   topicId: string;
   answer: string;
   options?: { text: string; isCorrect: boolean }[];
 }
 
 export interface CSTopic {
   id: string;
   name: string;
   subjectId: string;
 }
 
 export interface CSSubject {
   id: string;
   name: string;
   icon: string;
   questionCount: number;
   importance: "Critical" | "High" | "Medium";
 }
 
 // Subjects for CS questions
 export const csSubjects: CSSubject[] = [
  { id: "os", name: "Operating Systems", icon: "Monitor", questionCount: 30, importance: "High" },
  { id: "dbms", name: "Database Management", icon: "Database", questionCount: 25, importance: "High" },
  { id: "cn", name: "Computer Networks", icon: "Network", questionCount: 25, importance: "High" },
  { id: "oops", name: "Object-Oriented Programming", icon: "Boxes", questionCount: 20, importance: "Critical" },
  { id: "toc", name: "Theory of Computation", icon: "Binary", questionCount: 15, importance: "Medium" },
  { id: "compiler", name: "Compiler Design", icon: "Code", questionCount: 15, importance: "Medium" },
 ];
 
 // Topics within each subject
 export const csTopics: CSTopic[] = [
   // OS Topics
   { id: "os-process", name: "Process Management", subjectId: "os" },
   { id: "os-memory", name: "Memory Management", subjectId: "os" },
   { id: "os-scheduling", name: "CPU Scheduling", subjectId: "os" },
   { id: "os-deadlock", name: "Deadlocks", subjectId: "os" },
   { id: "os-sync", name: "Synchronization", subjectId: "os" },
   { id: "os-filesystem", name: "File Systems", subjectId: "os" },
   // DBMS Topics
   { id: "dbms-normalization", name: "Normalization", subjectId: "dbms" },
   { id: "dbms-transactions", name: "Transactions", subjectId: "dbms" },
   { id: "dbms-indexing", name: "Indexing", subjectId: "dbms" },
   { id: "dbms-sql", name: "SQL", subjectId: "dbms" },
   { id: "dbms-er", name: "ER Diagrams", subjectId: "dbms" },
   // CN Topics
   { id: "cn-osi", name: "OSI Model", subjectId: "cn" },
   { id: "cn-tcp", name: "TCP/IP", subjectId: "cn" },
   { id: "cn-routing", name: "Routing", subjectId: "cn" },
   { id: "cn-http", name: "HTTP/HTTPS", subjectId: "cn" },
   { id: "cn-dns", name: "DNS", subjectId: "cn" },
   // OOPs Topics
   { id: "oops-inheritance", name: "Inheritance", subjectId: "oops" },
   { id: "oops-polymorphism", name: "Polymorphism", subjectId: "oops" },
   { id: "oops-encapsulation", name: "Encapsulation", subjectId: "oops" },
   { id: "oops-abstraction", name: "Abstraction", subjectId: "oops" },
   { id: "oops-patterns", name: "Design Patterns", subjectId: "oops" },
   // TOC Topics
   { id: "toc-automata", name: "Finite Automata", subjectId: "toc" },
   { id: "toc-grammar", name: "Context-Free Grammar", subjectId: "toc" },
   { id: "toc-turing", name: "Turing Machines", subjectId: "toc" },
   // Compiler Topics
   { id: "compiler-lexical", name: "Lexical Analysis", subjectId: "compiler" },
   { id: "compiler-syntax", name: "Syntax Analysis", subjectId: "compiler" },
   { id: "compiler-semantic", name: "Semantic Analysis", subjectId: "compiler" },
  { id: "compiler-optimization", name: "Code Optimization", subjectId: "compiler" },
  { id: "compiler-codegen", name: "Code Generation", subjectId: "compiler" },
  { id: "toc-pda", name: "Pushdown Automata", subjectId: "toc" },
  { id: "toc-regex", name: "Regular Expressions", subjectId: "toc" },
  { id: "dbms-concurrency", name: "Concurrency Control", subjectId: "dbms" },
  { id: "dbms-recovery", name: "Recovery", subjectId: "dbms" },
  { id: "cn-security", name: "Network Security", subjectId: "cn" },
  { id: "cn-subnetting", name: "Subnetting", subjectId: "cn" },
  { id: "os-io", name: "I/O Management", subjectId: "os" },
 ];
 
 // CS Questions
 export const csQuestions: CSQuestion[] = [
   // Operating Systems - Process Management
   {
     id: 1,
     title: "What is a process in operating systems?",
     text: "Explain what a process is and how it differs from a program.",
     difficulty: "Easy",
     subjectId: "os",
     topicId: "os-process",
     answer: `## Process in Operating Systems
 
 A **process** is a program in execution. It's an active entity, unlike a program which is a passive entity stored on disk.
 
 ### Process vs Program
 | Aspect | Program | Process |
 |--------|---------|---------|
 | Nature | Passive | Active |
 | Lifetime | Permanent | Temporary |
 | Resources | None | CPU, Memory, I/O |
 | State | Static | Changes (Running, Waiting, etc.) |
 
 ### Process Components
 1. **Text Section**: Program code
 2. **Data Section**: Global variables
 3. **Heap**: Dynamically allocated memory
 4. **Stack**: Temporary data (function parameters, local variables)
 
 ### Process States
 \`\`\`
 New → Ready → Running → Terminated
              ↓     ↑
           Waiting
 \`\`\``,
     options: [
       { text: "A program in execution with allocated resources", isCorrect: true },
       { text: "A file stored on the hard disk", isCorrect: false },
       { text: "A type of memory allocation", isCorrect: false },
       { text: "A hardware component", isCorrect: false },
     ],
   },
   {
     id: 2,
     title: "Explain the difference between process and thread.",
     text: "What are the key differences between a process and a thread?",
     difficulty: "Medium",
     subjectId: "os",
     topicId: "os-process",
     answer: `## Process vs Thread
 
 ### Key Differences
 | Aspect | Process | Thread |
 |--------|---------|--------|
 | Memory | Separate address space | Shared address space |
 | Creation | Heavyweight | Lightweight |
 | Communication | IPC mechanisms | Shared memory |
 | Context Switch | Expensive | Less expensive |
 | Crash Impact | Isolated | May affect other threads |
 
 ### Process
 - Independent execution unit
 - Has its own memory space
 - Requires IPC for communication
 
 ### Thread
 - Lightweight process
 - Shares memory with parent process
 - Can communicate directly via shared memory
 
 \`\`\`
 Process
 ├── Thread 1 (shares code, data, heap)
 ├── Thread 2 (has own stack, registers)
 └── Thread 3
 \`\`\``,
     options: [
       { text: "Threads share memory, processes have separate address spaces", isCorrect: true },
       { text: "They are the same thing", isCorrect: false },
       { text: "Processes are faster than threads", isCorrect: false },
       { text: "Threads cannot run concurrently", isCorrect: false },
     ],
   },
   {
     id: 3,
     title: "What is a context switch?",
     text: "Explain what happens during a context switch in an operating system.",
     difficulty: "Medium",
     subjectId: "os",
     topicId: "os-process",
     answer: `## Context Switch
 
 A **context switch** is the process of saving the state of a currently running process and loading the state of another process.
 
 ### Steps in Context Switch
 1. **Save State**: Store current process's registers, program counter, stack pointer
 2. **Update PCB**: Save state in Process Control Block
 3. **Select Next**: Scheduler selects next process
 4. **Load State**: Restore new process's state from its PCB
 5. **Resume Execution**: Jump to saved program counter
 
 ### Context Switch Overhead
 - CPU time spent switching (not doing useful work)
 - Cache invalidation
 - TLB flush
 - Pipeline flush
 
 ### Minimizing Overhead
 - Use threads instead of processes
 - Reduce context switch frequency
 - Use efficient scheduling algorithms`,
     options: [
       { text: "Saving current process state and loading another", isCorrect: true },
       { text: "Switching between different programs", isCorrect: false },
       { text: "Changing the CPU mode", isCorrect: false },
       { text: "Switching between user and kernel mode", isCorrect: false },
     ],
   },
   // OS - CPU Scheduling
   {
     id: 4,
     title: "Explain different CPU scheduling algorithms.",
     text: "What are the main CPU scheduling algorithms and their characteristics?",
     difficulty: "Hard",
     subjectId: "os",
     topicId: "os-scheduling",
     answer: `## CPU Scheduling Algorithms
 
 ### 1. First-Come, First-Served (FCFS)
 - Non-preemptive
 - Simple but can cause convoy effect
 - High average waiting time
 
 ### 2. Shortest Job First (SJF)
 - Optimal for average waiting time
 - Requires knowing burst time in advance
 - Can cause starvation
 
 ### 3. Round Robin (RR)
 - Preemptive
 - Time quantum based
 - Fair but high context switch overhead
 
 ### 4. Priority Scheduling
 - Based on priority values
 - Can cause starvation (solved with aging)
 
 ### 5. Multilevel Queue
 - Multiple queues with different priorities
 - Each queue can have different algorithm
 
 | Algorithm | Preemptive | Starvation | Overhead |
 |-----------|------------|------------|----------|
 | FCFS | No | No | Low |
 | SJF | Optional | Yes | Low |
 | RR | Yes | No | High |
 | Priority | Optional | Yes | Medium |`,
     options: [
       { text: "FCFS, SJF, Round Robin, Priority Scheduling", isCorrect: true },
       { text: "Only FCFS and Round Robin exist", isCorrect: false },
       { text: "All algorithms are preemptive", isCorrect: false },
       { text: "SJF cannot cause starvation", isCorrect: false },
     ],
   },
   // OS - Memory Management
   {
     id: 5,
     title: "What is virtual memory?",
     text: "Explain the concept of virtual memory and its benefits.",
     difficulty: "Medium",
     subjectId: "os",
     topicId: "os-memory",
     answer: `## Virtual Memory
 
 **Virtual memory** is a memory management technique that provides an "idealized abstraction" of storage resources.
 
 ### How It Works
 1. Each process has its own virtual address space
 2. Virtual addresses mapped to physical addresses via page table
 3. Only active pages kept in RAM
 4. Inactive pages stored on disk (swap space)
 
 ### Benefits
 - **Larger Address Space**: Programs can use more memory than physically available
 - **Memory Isolation**: Processes protected from each other
 - **Efficient Memory Use**: Only load needed pages
 - **Simplified Memory Allocation**: Contiguous virtual memory
 
 ### Page Fault
 \`\`\`
 Virtual Address → TLB Check → Page Table → 
 If not in RAM → Page Fault → Load from Disk
 \`\`\`
 
 ### Key Concepts
 - **Page**: Fixed-size block (typically 4KB)
 - **Frame**: Physical memory block
 - **Page Table**: Maps virtual to physical addresses
 - **TLB**: Translation Lookaside Buffer (cache for page table)`,
     options: [
       { text: "Memory abstraction allowing larger address space than physical RAM", isCorrect: true },
       { text: "A type of RAM", isCorrect: false },
       { text: "Memory on the hard disk", isCorrect: false },
       { text: "Cache memory", isCorrect: false },
     ],
   },
   // OS - Deadlocks
   {
     id: 6,
     title: "What are the conditions for deadlock?",
     text: "List and explain the four necessary conditions for deadlock.",
     difficulty: "Hard",
     subjectId: "os",
     topicId: "os-deadlock",
     answer: `## Four Conditions for Deadlock
 
 All four conditions must hold simultaneously for deadlock to occur:
 
 ### 1. Mutual Exclusion
 - At least one resource must be non-shareable
 - Only one process can use the resource at a time
 
 ### 2. Hold and Wait
 - Process holding resources can request additional resources
 - Doesn't release current resources while waiting
 
 ### 3. No Preemption
 - Resources cannot be forcibly taken from a process
 - Must be released voluntarily
 
 ### 4. Circular Wait
 - Chain of processes where each waits for resource held by next
 - P1 → P2 → P3 → ... → Pn → P1
 
 ### Deadlock Prevention
 | Condition | Prevention Strategy |
 |-----------|---------------------|
 | Mutual Exclusion | Use shareable resources |
 | Hold and Wait | Request all resources at once |
 | No Preemption | Allow preemption |
 | Circular Wait | Impose ordering on resource requests |`,
     options: [
       { text: "Mutual Exclusion, Hold and Wait, No Preemption, Circular Wait", isCorrect: true },
       { text: "Only two conditions are needed", isCorrect: false },
       { text: "Starvation and deadlock are the same", isCorrect: false },
       { text: "Deadlock can occur with shareable resources", isCorrect: false },
     ],
   },
   // DBMS - Normalization
   {
     id: 7,
     title: "What is database normalization?",
     text: "Explain normalization and its different forms.",
     difficulty: "Medium",
     subjectId: "dbms",
     topicId: "dbms-normalization",
     answer: `## Database Normalization
 
 **Normalization** is the process of organizing data to reduce redundancy and improve data integrity.
 
 ### Normal Forms
 
 #### 1NF (First Normal Form)
 - Eliminate repeating groups
 - Each cell contains single value
 - Each record is unique
 
 #### 2NF (Second Normal Form)
 - Must be in 1NF
 - Remove partial dependencies
 - All non-key attributes depend on entire primary key
 
 #### 3NF (Third Normal Form)
 - Must be in 2NF
 - Remove transitive dependencies
 - Non-key attributes depend only on primary key
 
 #### BCNF (Boyce-Codd Normal Form)
 - Stricter version of 3NF
 - Every determinant is a candidate key
 
 ### Example
 \`\`\`sql
 -- Not normalized
 Orders(order_id, customer_name, customer_email, products)
 
 -- Normalized (3NF)
 Customers(customer_id, name, email)
 Orders(order_id, customer_id, order_date)
 OrderItems(order_id, product_id, quantity)
 \`\`\``,
     options: [
       { text: "Organizing data to reduce redundancy via normal forms", isCorrect: true },
       { text: "Making database faster", isCorrect: false },
       { text: "Adding more tables", isCorrect: false },
       { text: "Removing all constraints", isCorrect: false },
     ],
   },
   // DBMS - Transactions
   {
     id: 8,
     title: "What are ACID properties?",
     text: "Explain the ACID properties of database transactions.",
     difficulty: "Medium",
     subjectId: "dbms",
     topicId: "dbms-transactions",
     answer: `## ACID Properties
 
 ACID ensures reliable database transactions:
 
 ### A - Atomicity
 - Transaction is all-or-nothing
 - Either all operations complete or none do
 - Rollback on failure
 
 ### C - Consistency
 - Database moves from one valid state to another
 - All constraints are satisfied
 - Data integrity maintained
 
 ### I - Isolation
 - Concurrent transactions don't interfere
 - Each transaction sees consistent snapshot
 - Prevents dirty reads, phantom reads
 
 ### D - Durability
 - Committed transactions survive failures
 - Changes are permanent
 - Written to non-volatile storage
 
 \`\`\`sql
 BEGIN TRANSACTION;
   UPDATE accounts SET balance = balance - 100 WHERE id = 1;
   UPDATE accounts SET balance = balance + 100 WHERE id = 2;
 COMMIT; -- Atomicity: both succeed or both fail
 \`\`\``,
     options: [
       { text: "Atomicity, Consistency, Isolation, Durability", isCorrect: true },
       { text: "Accuracy, Completion, Integrity, Distribution", isCorrect: false },
       { text: "These are performance metrics", isCorrect: false },
       { text: "ACID only applies to NoSQL databases", isCorrect: false },
     ],
   },
   // Computer Networks - OSI Model
   {
     id: 9,
     title: "Explain the OSI model layers.",
     text: "What are the seven layers of the OSI model?",
     difficulty: "Easy",
     subjectId: "cn",
     topicId: "cn-osi",
     answer: `## OSI Model - 7 Layers
 
 | Layer | Name | Function | Protocols/Examples |
 |-------|------|----------|-------------------|
 | 7 | Application | User interface | HTTP, FTP, SMTP |
 | 6 | Presentation | Data format, encryption | SSL/TLS, JPEG |
 | 5 | Session | Session management | NetBIOS, RPC |
 | 4 | Transport | End-to-end communication | TCP, UDP |
 | 3 | Network | Routing, logical addressing | IP, ICMP |
 | 2 | Data Link | Frame transmission | Ethernet, MAC |
 | 1 | Physical | Bit transmission | Cables, Hubs |
 
 ### Mnemonic
 **A**ll **P**eople **S**eem **T**o **N**eed **D**ata **P**rocessing
 (Application → Physical)
 
 ### Data Units
 - Layer 7-5: Data
 - Layer 4: Segments
 - Layer 3: Packets
 - Layer 2: Frames
 - Layer 1: Bits`,
     options: [
       { text: "Physical, Data Link, Network, Transport, Session, Presentation, Application", isCorrect: true },
       { text: "There are only 4 layers", isCorrect: false },
       { text: "Application layer is at the bottom", isCorrect: false },
       { text: "OSI model is the same as TCP/IP", isCorrect: false },
     ],
   },
   // Computer Networks - TCP/IP
   {
     id: 10,
     title: "What is the difference between TCP and UDP?",
     text: "Compare TCP and UDP protocols.",
     difficulty: "Easy",
     subjectId: "cn",
     topicId: "cn-tcp",
     answer: `## TCP vs UDP
 
 | Feature | TCP | UDP |
 |---------|-----|-----|
 | Connection | Connection-oriented | Connectionless |
 | Reliability | Guaranteed delivery | Best effort |
 | Ordering | Maintains order | No ordering |
 | Speed | Slower | Faster |
 | Overhead | Higher | Lower |
 | Use Cases | Web, Email, File transfer | Streaming, Gaming, DNS |
 
 ### TCP (Transmission Control Protocol)
 - Three-way handshake (SYN, SYN-ACK, ACK)
 - Flow control and congestion control
 - Error checking and recovery
 
 ### UDP (User Datagram Protocol)
 - No connection setup
 - No acknowledgments
 - Lower latency
 
 ### When to Use
 - **TCP**: When data integrity matters (banking, file downloads)
 - **UDP**: When speed matters more than reliability (video calls, gaming)`,
     options: [
       { text: "TCP is reliable and ordered; UDP is fast and connectionless", isCorrect: true },
       { text: "UDP is more reliable than TCP", isCorrect: false },
       { text: "TCP is used for streaming only", isCorrect: false },
       { text: "They are interchangeable", isCorrect: false },
     ],
   },
   // OOPs - Inheritance
   {
     id: 11,
     title: "What is inheritance in OOP?",
     text: "Explain inheritance and its types.",
     difficulty: "Easy",
     subjectId: "oops",
     topicId: "oops-inheritance",
     answer: `## Inheritance in OOP
 
 **Inheritance** is a mechanism where a new class derives properties and behaviors from an existing class.
 
 ### Types of Inheritance
 
 #### 1. Single Inheritance
 \`\`\`
 Parent → Child
 \`\`\`
 
 #### 2. Multiple Inheritance
 \`\`\`
 Parent1, Parent2 → Child
 \`\`\`
 
 #### 3. Multilevel Inheritance
 \`\`\`
 Grandparent → Parent → Child
 \`\`\`
 
 #### 4. Hierarchical Inheritance
 \`\`\`
 Parent → Child1, Child2
 \`\`\`
 
 ### Example (Java)
 \`\`\`java
 class Animal {
     void eat() { System.out.println("Eating..."); }
 }
 
 class Dog extends Animal {
     void bark() { System.out.println("Barking..."); }
 }
 
 // Dog inherits eat() from Animal
 \`\`\`
 
 ### Benefits
 - Code reusability
 - Method overriding
 - Polymorphism support`,
     options: [
       { text: "Deriving properties from parent class for code reuse", isCorrect: true },
       { text: "Copying code from one class to another", isCorrect: false },
       { text: "Creating multiple instances", isCorrect: false },
       { text: "Hiding implementation details", isCorrect: false },
     ],
   },
   // OOPs - Polymorphism
   {
     id: 12,
     title: "Explain polymorphism and its types.",
     text: "What is polymorphism in OOP and what are its types?",
     difficulty: "Medium",
     subjectId: "oops",
     topicId: "oops-polymorphism",
     answer: `## Polymorphism in OOP
 
 **Polymorphism** means "many forms" - same interface, different implementations.
 
 ### Types of Polymorphism
 
 #### 1. Compile-time (Static) Polymorphism
 - Method Overloading
 - Operator Overloading
 - Resolved at compile time
 
 \`\`\`java
 class Calculator {
     int add(int a, int b) { return a + b; }
     double add(double a, double b) { return a + b; }
 }
 \`\`\`
 
 #### 2. Runtime (Dynamic) Polymorphism
 - Method Overriding
 - Resolved at runtime
 - Uses virtual method table
 
 \`\`\`java
 class Animal {
     void sound() { System.out.println("Some sound"); }
 }
 
 class Dog extends Animal {
     @Override
     void sound() { System.out.println("Bark"); }
 }
 
 Animal a = new Dog();
 a.sound(); // Outputs: Bark
 \`\`\`
 
 ### Benefits
 - Flexibility and extensibility
 - Clean and maintainable code
 - Supports abstraction`,
     options: [
       { text: "Same interface with different implementations (overloading/overriding)", isCorrect: true },
       { text: "Only method overloading", isCorrect: false },
       { text: "Creating multiple classes", isCorrect: false },
       { text: "It's the same as inheritance", isCorrect: false },
     ],
   },
   // More questions...
   {
     id: 13,
     title: "What is encapsulation?",
     text: "Explain encapsulation and its importance in OOP.",
     difficulty: "Easy",
     subjectId: "oops",
     topicId: "oops-encapsulation",
     answer: `## Encapsulation
 
 **Encapsulation** is bundling data (attributes) and methods that operate on data within a single unit (class), while restricting direct access.
 
 ### Implementation
 - Private attributes
 - Public getter/setter methods
 - Controlled access
 
 \`\`\`java
 class BankAccount {
     private double balance; // Hidden
     
     public double getBalance() {
         return balance;
     }
     
     public void deposit(double amount) {
         if (amount > 0) {
             balance += amount;
         }
     }
 }
 \`\`\`
 
 ### Benefits
 1. **Data Hiding**: Internal state protected
 2. **Flexibility**: Can change implementation without affecting users
 3. **Validation**: Control how data is accessed/modified
 4. **Maintainability**: Easier to debug and maintain`,
     options: [
       { text: "Bundling data and methods while hiding internal state", isCorrect: true },
       { text: "Making all variables public", isCorrect: false },
       { text: "Inheriting from multiple classes", isCorrect: false },
       { text: "Creating abstract classes only", isCorrect: false },
     ],
   },
   {
     id: 14,
     title: "What is abstraction in OOP?",
     text: "Explain abstraction and how it differs from encapsulation.",
     difficulty: "Medium",
     subjectId: "oops",
     topicId: "oops-abstraction",
     answer: `## Abstraction in OOP
 
 **Abstraction** is hiding complex implementation details and showing only essential features.
 
 ### Abstraction vs Encapsulation
 | Aspect | Abstraction | Encapsulation |
 |--------|-------------|---------------|
 | Focus | What an object does | How it does it |
 | Implementation | Abstract classes, interfaces | Access modifiers |
 | Level | Design level | Implementation level |
 
 ### Implementation in Java
 \`\`\`java
 // Abstract class
 abstract class Vehicle {
     abstract void start();
     abstract void stop();
 }
 
 // Interface
 interface Drivable {
     void accelerate();
     void brake();
 }
 
 class Car extends Vehicle implements Drivable {
     void start() { /* implementation */ }
     void stop() { /* implementation */ }
     public void accelerate() { /* implementation */ }
     public void brake() { /* implementation */ }
 }
 \`\`\`
 
 ### Benefits
 - Reduces complexity
 - Focuses on essential characteristics
 - Enables multiple implementations`,
     options: [
       { text: "Hiding complexity and showing only essential features", isCorrect: true },
       { text: "Making all methods public", isCorrect: false },
       { text: "Same as encapsulation", isCorrect: false },
       { text: "Creating only concrete classes", isCorrect: false },
     ],
   },
   // Theory of Computation
   {
     id: 15,
     title: "What is a finite automaton?",
     text: "Explain finite automata and their types.",
     difficulty: "Medium",
     subjectId: "toc",
     topicId: "toc-automata",
     answer: `## Finite Automata
 
 A **finite automaton** is a mathematical model of computation with finite number of states.
 
 ### Components
 1. **Q**: Finite set of states
 2. **Σ**: Input alphabet
 3. **δ**: Transition function
 4. **q0**: Initial state
 5. **F**: Set of accepting states
 
 ### Types
 
 #### DFA (Deterministic Finite Automaton)
 - Single transition for each symbol from each state
 - More efficient to execute
 
 #### NFA (Non-deterministic Finite Automaton)
 - Multiple transitions possible
 - Can have ε-transitions
 - More expressive, same power as DFA
 
 ### Example: Accept strings ending with "01"
 \`\`\`
 States: {q0, q1, q2}
 Alphabet: {0, 1}
 Initial: q0
 Accepting: {q2}
 
 q0 --0--> q1 --1--> q2 (accepting)
 \`\`\``,
     options: [
       { text: "Computational model with finite states (DFA/NFA)", isCorrect: true },
       { text: "A type of programming language", isCorrect: false },
       { text: "Infinite state machine", isCorrect: false },
       { text: "Same as Turing machine", isCorrect: false },
     ],
   },
   // More questions for completeness
   {
     id: 16,
     title: "Explain the three-way handshake in TCP.",
     text: "How does TCP establish a connection?",
     difficulty: "Medium",
     subjectId: "cn",
     topicId: "cn-tcp",
     answer: `## TCP Three-Way Handshake
 
 The three-way handshake establishes a reliable TCP connection.
 
 ### Steps
 
 \`\`\`
 Client                    Server
   |                         |
   |------- SYN (seq=x) ---->|  Step 1
   |                         |
   |<-- SYN-ACK (seq=y, ack=x+1) --| Step 2
   |                         |
   |---- ACK (ack=y+1) ----->|  Step 3
   |                         |
   [Connection Established]
 \`\`\`
 
 ### Explanation
 1. **SYN**: Client sends synchronization request with sequence number
 2. **SYN-ACK**: Server acknowledges and sends its own sequence number
 3. **ACK**: Client acknowledges server's sequence number
 
 ### Purpose
 - Synchronize sequence numbers
 - Ensure both sides are ready
 - Establish initial parameters`,
     options: [
       { text: "SYN → SYN-ACK → ACK for connection establishment", isCorrect: true },
       { text: "Only two steps are needed", isCorrect: false },
       { text: "Used by UDP", isCorrect: false },
       { text: "Happens at application layer", isCorrect: false },
     ],
   },
   {
     id: 17,
     title: "What is paging in memory management?",
     text: "Explain the concept of paging and its advantages.",
     difficulty: "Medium",
     subjectId: "os",
     topicId: "os-memory",
     answer: `## Paging
 
 **Paging** is a memory management scheme that eliminates external fragmentation.
 
 ### How It Works
 1. Physical memory divided into fixed-size **frames**
 2. Logical memory divided into same-size **pages**
 3. Page table maps pages to frames
 
 ### Address Translation
 \`\`\`
 Logical Address = Page Number + Offset
 Physical Address = Frame Number + Offset
 
 Page Table[Page Number] → Frame Number
 \`\`\`
 
 ### Advantages
 - No external fragmentation
 - Simple allocation algorithm
 - Efficient memory utilization
 
 ### Disadvantages
 - Internal fragmentation (last page)
 - Page table overhead
 - Additional memory access for translation`,
     options: [
       { text: "Dividing memory into fixed-size pages/frames", isCorrect: true },
       { text: "Variable-size memory allocation", isCorrect: false },
       { text: "Same as segmentation", isCorrect: false },
       { text: "Only used in virtual memory", isCorrect: false },
     ],
   },
   {
     id: 18,
     title: "What is indexing in databases?",
     text: "Explain database indexing and its types.",
     difficulty: "Medium",
     subjectId: "dbms",
     topicId: "dbms-indexing",
     answer: `## Database Indexing
 
 **Indexing** is a data structure technique to quickly locate and access data.
 
 ### Types of Indexes
 
 #### 1. Primary Index
 - Built on primary key
 - Ordered, unique entries
 
 #### 2. Secondary Index
 - Built on non-primary key columns
 - Can have duplicates
 
 #### 3. Clustered Index
 - Physical order matches index order
 - Only one per table
 
 #### 4. Non-Clustered Index
 - Separate structure pointing to data
 - Multiple allowed per table
 
 #### 5. B-Tree Index
 - Balanced tree structure
 - Good for range queries
 
 ### SQL Example
 \`\`\`sql
 -- Create index
 CREATE INDEX idx_email ON users(email);
 
 -- Query uses index
 SELECT * FROM users WHERE email = 'test@example.com';
 \`\`\`
 
 ### Trade-offs
 - Faster reads, slower writes
 - Additional storage required`,
     options: [
       { text: "Data structure for faster data retrieval", isCorrect: true },
       { text: "A way to store data", isCorrect: false },
       { text: "Same as primary key", isCorrect: false },
       { text: "Only works with integers", isCorrect: false },
     ],
   },
   {
     id: 19,
     title: "What is DNS and how does it work?",
     text: "Explain the Domain Name System.",
     difficulty: "Easy",
     subjectId: "cn",
     topicId: "cn-dns",
     answer: `## Domain Name System (DNS)
 
 **DNS** translates human-readable domain names to IP addresses.
 
 ### DNS Resolution Process
 1. User enters \`www.example.com\`
 2. Browser checks local cache
 3. Query sent to recursive resolver
 4. Resolver queries root server
 5. Root refers to TLD server (.com)
 6. TLD refers to authoritative server
 7. Authoritative returns IP address
 8. IP cached and returned to browser
 
 ### DNS Record Types
 | Type | Purpose |
 |------|---------|
 | A | IPv4 address |
 | AAAA | IPv6 address |
 | CNAME | Canonical name (alias) |
 | MX | Mail server |
 | TXT | Text records |
 | NS | Name server |
 
 ### DNS Hierarchy
 \`\`\`
 Root (.)
 └── TLD (.com, .org)
     └── Domain (example.com)
         └── Subdomain (www.example.com)
 \`\`\``,
     options: [
       { text: "Translates domain names to IP addresses", isCorrect: true },
       { text: "A security protocol", isCorrect: false },
       { text: "A type of web server", isCorrect: false },
       { text: "Same as HTTP", isCorrect: false },
     ],
   },
   {
     id: 20,
     title: "Explain semaphores in process synchronization.",
     text: "What are semaphores and how do they prevent race conditions?",
     difficulty: "Hard",
     subjectId: "os",
     topicId: "os-sync",
     answer: `## Semaphores
 
 A **semaphore** is a synchronization primitive used to control access to shared resources.
 
 ### Types
 
 #### Binary Semaphore (Mutex)
 - Values: 0 or 1
 - Used for mutual exclusion
 
 #### Counting Semaphore
 - Values: 0 to N
 - Controls access to pool of resources
 
 ### Operations
 - **wait(S)** / P(): Decrement and potentially block
 - **signal(S)** / V(): Increment and potentially wake
 
 \`\`\`c
 // Pseudocode
 wait(S) {
     while (S <= 0); // busy wait
     S--;
 }
 
 signal(S) {
     S++;
 }
 \`\`\`
 
 ### Producer-Consumer Example
 \`\`\`
 Semaphore empty = N;  // empty slots
 Semaphore full = 0;   // filled slots
 Semaphore mutex = 1;  // mutual exclusion
 
 Producer:
     wait(empty); wait(mutex);
     // produce item
     signal(mutex); signal(full);
 
 Consumer:
     wait(full); wait(mutex);
     // consume item
     signal(mutex); signal(empty);
 \`\`\``,
     options: [
       { text: "Synchronization primitive with wait/signal operations", isCorrect: true },
       { text: "A type of process", isCorrect: false },
       { text: "Same as mutex only", isCorrect: false },
       { text: "Used only in single-threaded programs", isCorrect: false },
     ],
   },
  // Operating Systems - Additional Questions
  {
    id: 21,
    title: "What is a Process Control Block (PCB)?",
    text: "Explain the structure and purpose of PCB.",
    difficulty: "Easy",
    subjectId: "os",
    topicId: "os-process",
    answer: `## Process Control Block (PCB)

The **PCB** is a data structure maintained by the OS for every process.

### Contents of PCB
| Field | Description |
|-------|-------------|
| Process ID | Unique identifier |
| Process State | Running, Ready, Waiting, etc. |
| Program Counter | Address of next instruction |
| CPU Registers | Contents of all registers |
| Memory Limits | Base and limit registers |
| I/O Status | Open files, I/O devices |
| Scheduling Info | Priority, time quantum |

### Purpose
- Store process information during context switch
- Enable OS to track and manage processes
- Facilitate process scheduling

\`\`\`
PCB Table
├── PCB[0]: Process 1 info
├── PCB[1]: Process 2 info
└── PCB[n]: Process n info
\`\`\``,
    options: [
      { text: "Data structure storing process information for OS management", isCorrect: true },
      { text: "A type of memory allocation", isCorrect: false },
      { text: "A hardware component", isCorrect: false },
      { text: "Same as program counter", isCorrect: false },
    ],
  },
  {
    id: 22,
    title: "Explain the difference between preemptive and non-preemptive scheduling.",
    text: "What are the key differences between preemptive and non-preemptive scheduling?",
    difficulty: "Easy",
    subjectId: "os",
    topicId: "os-scheduling",
    answer: `## Preemptive vs Non-Preemptive Scheduling

### Non-Preemptive Scheduling
- Process runs until it voluntarily releases CPU
- Simpler to implement
- No context switch overhead during execution
- Examples: FCFS, SJF (non-preemptive)

### Preemptive Scheduling
- OS can interrupt running process
- Better response time for interactive systems
- Higher context switch overhead
- Examples: Round Robin, SRTF, Priority (preemptive)

| Aspect | Non-Preemptive | Preemptive |
|--------|----------------|------------|
| CPU Control | Process decides | OS decides |
| Response Time | Higher | Lower |
| Overhead | Lower | Higher |
| Starvation | Possible | Less likely |
| Complexity | Simpler | More complex |

### When to Use
- **Non-preemptive**: Batch systems, simple embedded systems
- **Preemptive**: Interactive systems, real-time systems`,
    options: [
      { text: "Preemptive allows OS to interrupt processes; non-preemptive waits for voluntary release", isCorrect: true },
      { text: "They are the same thing", isCorrect: false },
      { text: "Non-preemptive is always faster", isCorrect: false },
      { text: "Preemptive cannot cause context switches", isCorrect: false },
    ],
  },
  {
    id: 23,
    title: "What is thrashing?",
    text: "Explain thrashing in virtual memory systems.",
    difficulty: "Hard",
    subjectId: "os",
    topicId: "os-memory",
    answer: `## Thrashing

**Thrashing** occurs when a system spends more time handling page faults than executing processes.

### Causes
1. Insufficient physical memory
2. Too many processes competing for memory
3. Poor page replacement algorithm
4. Working set larger than available memory

### Symptoms
- High page fault rate
- Low CPU utilization
- Disk I/O at maximum
- System becomes unresponsive

### Prevention Techniques

#### 1. Working Set Model
\`\`\`
Working Set = Pages accessed in last Δ time units
Allocate enough frames to hold working set
\`\`\`

#### 2. Page Fault Frequency (PFF)
- Monitor page fault rate per process
- If too high: allocate more frames
- If too low: reduce frames

#### 3. Limit Degree of Multiprogramming
- Reduce number of concurrent processes
- Swap out some processes

### Recovery
- Suspend some processes
- Add more RAM
- Reduce multiprogramming level`,
    options: [
      { text: "Excessive page faults causing system to spend more time swapping than executing", isCorrect: true },
      { text: "A type of CPU scheduling", isCorrect: false },
      { text: "Normal memory operation", isCorrect: false },
      { text: "Same as deadlock", isCorrect: false },
    ],
  },
  {
    id: 24,
    title: "Explain page replacement algorithms.",
    text: "What are the common page replacement algorithms?",
    difficulty: "Hard",
    subjectId: "os",
    topicId: "os-memory",
    answer: `## Page Replacement Algorithms

When a page fault occurs and no free frames exist, a victim page must be replaced.

### 1. FIFO (First-In-First-Out)
- Replace the oldest page
- Simple but suffers from Belady's anomaly
- More frames can increase page faults

### 2. LRU (Least Recently Used)
- Replace page not used for longest time
- Good approximation of optimal
- Implementation: counters or stack

### 3. Optimal (OPT)
- Replace page that won't be used for longest time
- Theoretical best - requires future knowledge
- Used as benchmark

### 4. LFU (Least Frequently Used)
- Replace page with lowest access count
- May keep old but unused pages

### 5. Clock (Second Chance)
- Modified FIFO with reference bit
- Circular queue with "clock hand"

\`\`\`
Reference String: 1, 2, 3, 4, 1, 2, 5, 1, 2, 3

FIFO (3 frames): 9 page faults
LRU (3 frames): 10 page faults
Optimal (3 frames): 7 page faults
\`\`\`

### Comparison
| Algorithm | Page Faults | Overhead |
|-----------|-------------|----------|
| Optimal | Lowest | N/A |
| LRU | Low | High |
| FIFO | Variable | Low |
| Clock | Moderate | Moderate |`,
    options: [
      { text: "FIFO, LRU, Optimal, LFU, Clock algorithms for selecting victim pages", isCorrect: true },
      { text: "Only FIFO exists", isCorrect: false },
      { text: "Used for CPU scheduling", isCorrect: false },
      { text: "All algorithms have same performance", isCorrect: false },
    ],
  },
  {
    id: 25,
    title: "What is the Banker's Algorithm?",
    text: "Explain the Banker's Algorithm for deadlock avoidance.",
    difficulty: "Hard",
    subjectId: "os",
    topicId: "os-deadlock",
    answer: `## Banker's Algorithm

A **deadlock avoidance** algorithm that checks if a resource allocation will leave the system in a safe state.

### Data Structures
- **Available[m]**: Available instances of each resource
- **Max[n][m]**: Maximum demand of each process
- **Allocation[n][m]**: Currently allocated to each process
- **Need[n][m]**: Remaining need (Max - Allocation)

### Safety Algorithm
\`\`\`
1. Work = Available; Finish[i] = false for all
2. Find process i where:
   - Finish[i] = false
   - Need[i] ≤ Work
3. If found:
   Work = Work + Allocation[i]
   Finish[i] = true
   Go to step 2
4. If all Finish[i] = true → Safe State
\`\`\`

### Resource Request Algorithm
1. If Request ≤ Need, continue
2. If Request ≤ Available, pretend to allocate
3. Run safety algorithm
4. If safe, allocate; else, wait

### Example
\`\`\`
Available: [3, 3, 2]
Process | Allocation | Max  | Need
P0      | [0,1,0]   |[7,5,3]|[7,4,3]
P1      | [2,0,0]   |[3,2,2]|[1,2,2]

Safe sequence: P1 → P3 → P4 → P0 → P2
\`\`\``,
    options: [
      { text: "Deadlock avoidance algorithm checking for safe state before allocation", isCorrect: true },
      { text: "A deadlock detection algorithm", isCorrect: false },
      { text: "A scheduling algorithm", isCorrect: false },
      { text: "Used only for memory management", isCorrect: false },
    ],
  },
  {
    id: 26,
    title: "What is the Producer-Consumer Problem?",
    text: "Explain the Producer-Consumer synchronization problem.",
    difficulty: "Medium",
    subjectId: "os",
    topicId: "os-sync",
    answer: `## Producer-Consumer Problem

A classic synchronization problem involving processes sharing a fixed-size buffer.

### Problem Statement
- **Producer**: Creates items, adds to buffer
- **Consumer**: Removes items from buffer
- **Buffer**: Fixed-size, bounded capacity

### Constraints
1. Producer cannot add if buffer is full
2. Consumer cannot remove if buffer is empty
3. Mutual exclusion on buffer access

### Solution with Semaphores
\`\`\`c
semaphore mutex = 1;     // mutual exclusion
semaphore empty = N;     // empty slots
semaphore full = 0;      // filled slots

// Producer
while(true) {
    produce_item();
    wait(empty);         // wait for empty slot
    wait(mutex);         // enter critical section
    add_to_buffer();
    signal(mutex);       // exit critical section
    signal(full);        // increment full count
}

// Consumer
while(true) {
    wait(full);          // wait for item
    wait(mutex);         // enter critical section
    remove_from_buffer();
    signal(mutex);       // exit critical section
    signal(empty);       // increment empty count
    consume_item();
}
\`\`\`

### Key Points
- Order of wait() matters - wrong order causes deadlock
- Both producer and consumer need mutex for buffer access`,
    options: [
      { text: "Synchronization problem with shared bounded buffer using semaphores", isCorrect: true },
      { text: "A deadlock problem", isCorrect: false },
      { text: "Only involves one process", isCorrect: false },
      { text: "Cannot be solved", isCorrect: false },
    ],
  },
  {
    id: 27,
    title: "What are the different file allocation methods?",
    text: "Explain contiguous, linked, and indexed file allocation.",
    difficulty: "Medium",
    subjectId: "os",
    topicId: "os-filesystem",
    answer: `## File Allocation Methods

### 1. Contiguous Allocation
- Files stored in consecutive blocks
- Fast sequential and random access
- External fragmentation problem
- Requires knowing file size upfront

\`\`\`
Directory: filename | start_block | length
\`\`\`

### 2. Linked Allocation
- Each block contains pointer to next
- No external fragmentation
- Poor random access (O(n))
- Pointer space overhead

\`\`\`
[Block1|ptr]→[Block2|ptr]→[Block3|null]
\`\`\`

### 3. Indexed Allocation
- Index block contains pointers to all file blocks
- Good random access
- Overhead of index block
- May need multiple index blocks for large files

\`\`\`
Index Block: [ptr1, ptr2, ptr3, ...]
\`\`\`

### Comparison
| Method | Sequential | Random | Fragmentation |
|--------|-----------|--------|---------------|
| Contiguous | Excellent | Excellent | External |
| Linked | Good | Poor | None |
| Indexed | Good | Good | None |

### Modern Systems
- Unix: Multi-level indexed (inodes)
- FAT: Linked (FAT table)
- NTFS: Indexed (MFT)`,
    options: [
      { text: "Contiguous, Linked, and Indexed allocation with different trade-offs", isCorrect: true },
      { text: "Only one method exists", isCorrect: false },
      { text: "All methods have same performance", isCorrect: false },
      { text: "Used for memory, not files", isCorrect: false },
    ],
  },
  {
    id: 28,
    title: "What is segmentation?",
    text: "Explain segmentation in memory management.",
    difficulty: "Medium",
    subjectId: "os",
    topicId: "os-memory",
    answer: `## Segmentation

**Segmentation** divides memory into variable-sized logical units called segments.

### Segments Typically Include
- Code segment
- Data segment
- Stack segment
- Heap segment

### Address Translation
\`\`\`
Logical Address = (Segment Number, Offset)

Segment Table:
| Segment | Base | Limit |
|---------|------|-------|
| 0       | 1000 | 400   |
| 1       | 2500 | 600   |

Physical Address = Base[segment] + Offset
(if Offset < Limit)
\`\`\`

### Segmentation vs Paging
| Aspect | Segmentation | Paging |
|--------|--------------|--------|
| Unit Size | Variable | Fixed |
| User View | Logical | Physical |
| Fragmentation | External | Internal |
| Sharing | Easy (logical units) | Complex |

### Segmented Paging
- Combines both approaches
- Segment table points to page tables
- Reduces external fragmentation`,
    options: [
      { text: "Variable-sized memory division based on logical units", isCorrect: true },
      { text: "Same as paging", isCorrect: false },
      { text: "Only uses fixed-size blocks", isCorrect: false },
      { text: "A file system concept", isCorrect: false },
    ],
  },
  {
    id: 29,
    title: "Explain disk scheduling algorithms.",
    text: "What are FCFS, SSTF, SCAN, and C-SCAN disk scheduling?",
    difficulty: "Hard",
    subjectId: "os",
    topicId: "os-io",
    answer: `## Disk Scheduling Algorithms

Optimize the order of disk I/O requests to minimize seek time.

### 1. FCFS (First Come First Serve)
- Process requests in order
- Simple but poor performance
- High seek time

### 2. SSTF (Shortest Seek Time First)
- Select request closest to current head position
- Better than FCFS
- May cause starvation

### 3. SCAN (Elevator Algorithm)
- Head moves in one direction, servicing requests
- Reverses at disk end
- Fair, no starvation

### 4. C-SCAN (Circular SCAN)
- Head moves in one direction only
- Returns to beginning without servicing
- More uniform wait time

### 5. LOOK / C-LOOK
- Like SCAN/C-SCAN but reverses at last request
- Not at disk end

\`\`\`
Request Queue: 98, 183, 37, 122, 14, 124, 65, 67
Head at: 53

FCFS: 53→98→183→37→122→14→124→65→67 = 640 cylinders
SSTF: 53→65→67→37→14→98→122→124→183 = 236 cylinders
SCAN: 53→37→14→0→65→67→98→122→124→183 = 236 cylinders
\`\`\``,
    options: [
      { text: "FCFS, SSTF, SCAN, C-SCAN optimize disk seek time", isCorrect: true },
      { text: "Only one algorithm exists", isCorrect: false },
      { text: "Used for CPU scheduling", isCorrect: false },
      { text: "FCFS is always best", isCorrect: false },
    ],
  },
  {
    id: 30,
    title: "What is the Readers-Writers Problem?",
    text: "Explain the Readers-Writers synchronization problem.",
    difficulty: "Hard",
    subjectId: "os",
    topicId: "os-sync",
    answer: `## Readers-Writers Problem

A synchronization problem where multiple readers can read simultaneously, but writers need exclusive access.

### Problem Statement
- Multiple readers can read concurrently
- Writers need exclusive access
- No reader should wait if resource is being read

### Solution with Semaphores
\`\`\`c
semaphore mutex = 1;      // protect read_count
semaphore write_lock = 1; // exclusive write access
int read_count = 0;       // active readers

// Reader
wait(mutex);
read_count++;
if (read_count == 1)
    wait(write_lock);     // first reader blocks writers
signal(mutex);

// --- Reading ---

wait(mutex);
read_count--;
if (read_count == 0)
    signal(write_lock);   // last reader releases writers
signal(mutex);

// Writer
wait(write_lock);
// --- Writing ---
signal(write_lock);
\`\`\`

### Variations
1. **First Readers-Writers**: Readers priority (may starve writers)
2. **Second Readers-Writers**: Writers priority (may starve readers)
3. **Fair**: No starvation for either

### Applications
- Database systems
- File systems
- Caching systems`,
    options: [
      { text: "Multiple readers concurrent, writers exclusive with semaphore solution", isCorrect: true },
      { text: "Only one reader allowed", isCorrect: false },
      { text: "Same as Producer-Consumer", isCorrect: false },
      { text: "Cannot be solved", isCorrect: false },
    ],
  },
  // DBMS - Additional Questions
  {
    id: 31,
    title: "Explain different types of database keys.",
    text: "What are primary key, foreign key, candidate key, and super key?",
    difficulty: "Easy",
    subjectId: "dbms",
    topicId: "dbms-normalization",
    answer: `## Database Keys

### Super Key
- Set of attributes that uniquely identifies a row
- May contain extra attributes
- Example: {id}, {id, name}, {id, name, email}

### Candidate Key
- Minimal super key
- No redundant attributes
- Example: {id}, {email} (if email is unique)

### Primary Key
- Chosen candidate key
- Uniquely identifies each row
- Cannot be NULL
- One per table

### Foreign Key
- References primary key of another table
- Establishes relationships
- Can be NULL (optional relationship)

### Alternate/Secondary Key
- Candidate keys not chosen as primary key

\`\`\`sql
CREATE TABLE orders (
    order_id INT PRIMARY KEY,           -- Primary Key
    customer_id INT,                     -- Foreign Key
    order_number VARCHAR(20) UNIQUE,    -- Alternate Key
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);
\`\`\`

### Composite Key
- Primary key with multiple columns
- Used when single column isn't unique`,
    options: [
      { text: "Primary, Foreign, Candidate, Super keys for identifying and relating rows", isCorrect: true },
      { text: "Only primary key exists", isCorrect: false },
      { text: "Keys are used for encryption", isCorrect: false },
      { text: "Foreign key must be unique", isCorrect: false },
    ],
  },
  {
    id: 32,
    title: "What is a transaction schedule and serializability?",
    text: "Explain transaction schedules and serializability in DBMS.",
    difficulty: "Hard",
    subjectId: "dbms",
    topicId: "dbms-transactions",
    answer: `## Transaction Schedules & Serializability

### Schedule
A chronological order of instructions from concurrent transactions.

### Types of Schedules

#### Serial Schedule
- Transactions execute one after another
- Always correct but poor performance

#### Non-Serial Schedule
- Interleaved execution
- Better performance
- May not be correct

### Serializability
A non-serial schedule is **serializable** if it produces the same result as some serial schedule.

#### Conflict Serializability
Two operations conflict if:
1. They belong to different transactions
2. They access the same data item
3. At least one is a write

\`\`\`
Conflict Graph:
- Node for each transaction
- Edge Ti → Tj if Ti's operation precedes conflicting Tj operation

Schedule is conflict serializable iff graph is acyclic
\`\`\`

#### View Serializability
- Less restrictive than conflict
- Same initial reads, same writes, same final writes

### Example
\`\`\`
T1: R(A), W(A)
T2: R(A), W(A)

Schedule 1: R1(A) W1(A) R2(A) W2(A) → Serial
Schedule 2: R1(A) R2(A) W1(A) W2(A) → Not serializable
\`\`\``,
    options: [
      { text: "Schedule is serializable if equivalent to some serial schedule", isCorrect: true },
      { text: "All schedules are serializable", isCorrect: false },
      { text: "Serial schedules are always faster", isCorrect: false },
      { text: "Serializability is about sorting", isCorrect: false },
    ],
  },
  {
    id: 33,
    title: "What are B-Trees and B+ Trees?",
    text: "Explain B-Tree and B+ Tree indexing structures.",
    difficulty: "Hard",
    subjectId: "dbms",
    topicId: "dbms-indexing",
    answer: `## B-Trees and B+ Trees

### B-Tree
A self-balancing search tree optimized for disk access.

#### Properties
- All leaves at same depth
- Node has m/2 to m children (m = order)
- Keys in nodes with pointers to data

\`\`\`
        [10 | 20]
       /    |    \\
   [5]    [15]   [25,30]
\`\`\`

### B+ Tree
Enhanced B-Tree used in most database indexes.

#### Properties
- All data in leaf nodes
- Internal nodes only store keys
- Leaves linked for range queries
- Better for sequential access

\`\`\`
        [10 | 20]           (index nodes)
       /    |    \\
   [5]→[10,15]→[20,25,30]   (leaf nodes with data)
\`\`\`

### Comparison
| Feature | B-Tree | B+ Tree |
|---------|--------|---------|
| Data Location | All nodes | Leaves only |
| Range Queries | Slower | Faster |
| Space | Less | More for index |
| Search | O(log n) | O(log n) |

### Why B+ Trees for Databases
1. More keys per node → shallower tree
2. Sequential access via leaf links
3. Better cache utilization`,
    options: [
      { text: "Self-balancing trees; B+ keeps data in leaves with linked list", isCorrect: true },
      { text: "They are identical structures", isCorrect: false },
      { text: "Used only for in-memory data", isCorrect: false },
      { text: "B-Tree is always better", isCorrect: false },
    ],
  },
  {
    id: 34,
    title: "What are SQL joins?",
    text: "Explain different types of SQL joins with examples.",
    difficulty: "Medium",
    subjectId: "dbms",
    topicId: "dbms-sql",
    answer: `## SQL Joins

Joins combine rows from two or more tables based on related columns.

### Types of Joins

#### 1. INNER JOIN
Returns matching rows from both tables.
\`\`\`sql
SELECT * FROM A INNER JOIN B ON A.id = B.a_id;
\`\`\`

#### 2. LEFT (OUTER) JOIN
All from left + matching from right (NULL if no match).
\`\`\`sql
SELECT * FROM A LEFT JOIN B ON A.id = B.a_id;
\`\`\`

#### 3. RIGHT (OUTER) JOIN
All from right + matching from left.
\`\`\`sql
SELECT * FROM A RIGHT JOIN B ON A.id = B.a_id;
\`\`\`

#### 4. FULL (OUTER) JOIN
All from both tables, NULL where no match.
\`\`\`sql
SELECT * FROM A FULL OUTER JOIN B ON A.id = B.a_id;
\`\`\`

#### 5. CROSS JOIN
Cartesian product of both tables.
\`\`\`sql
SELECT * FROM A CROSS JOIN B;
\`\`\`

#### 6. SELF JOIN
Table joined with itself.
\`\`\`sql
SELECT e1.name, e2.name AS manager
FROM employees e1
JOIN employees e2 ON e1.manager_id = e2.id;
\`\`\`

### Visual Representation
\`\`\`
INNER:     LEFT:      RIGHT:     FULL:
  A ∩ B     A          B         A ∪ B
\`\`\``,
    options: [
      { text: "INNER, LEFT, RIGHT, FULL, CROSS, SELF joins combine table rows", isCorrect: true },
      { text: "Only INNER JOIN exists", isCorrect: false },
      { text: "Joins create new tables", isCorrect: false },
      { text: "LEFT and RIGHT are identical", isCorrect: false },
    ],
  },
  {
    id: 35,
    title: "What is an ER Diagram?",
    text: "Explain Entity-Relationship diagrams and their components.",
    difficulty: "Easy",
    subjectId: "dbms",
    topicId: "dbms-er",
    answer: `## Entity-Relationship Diagram

A visual representation of database structure showing entities and their relationships.

### Components

#### 1. Entity
- Rectangle
- Represents a real-world object
- Examples: Customer, Order, Product

#### 2. Attribute
- Oval connected to entity
- Properties of entity
- Types: Simple, Composite, Derived, Multivalued

#### 3. Relationship
- Diamond connecting entities
- Describes how entities relate

#### 4. Cardinality
- 1:1 (One-to-One)
- 1:N (One-to-Many)
- M:N (Many-to-Many)

### Example
\`\`\`
[Customer]───<Places>───[Order]───<Contains>───[Product]
    |           1:N        |           M:N         |
  (id)                   (id)                    (id)
  (name)                (date)                 (name)
  (email)               (total)                (price)
\`\`\`

### Notation Types
- Chen Notation (traditional)
- Crow's Foot Notation (modern)
- UML Class Diagrams

### Converting ER to Relational
1. Entity → Table
2. Attribute → Column
3. 1:N → Foreign key in N side
4. M:N → Junction table`,
    options: [
      { text: "Visual database design with entities, attributes, and relationships", isCorrect: true },
      { text: "A type of SQL query", isCorrect: false },
      { text: "Same as flowchart", isCorrect: false },
      { text: "Only shows tables", isCorrect: false },
    ],
  },
  {
    id: 36,
    title: "What are database locks?",
    text: "Explain locking mechanisms in database concurrency control.",
    difficulty: "Hard",
    subjectId: "dbms",
    topicId: "dbms-concurrency",
    answer: `## Database Locks

Locks prevent concurrent transactions from interfering with each other.

### Lock Types

#### Shared Lock (S-Lock)
- For reading data
- Multiple transactions can hold
- Blocks exclusive locks

#### Exclusive Lock (X-Lock)
- For writing data
- Only one transaction can hold
- Blocks all other locks

### Lock Compatibility
| Request\\Held | S | X |
|--------------|---|---|
| S | ✓ | ✗ |
| X | ✗ | ✗ |

### Two-Phase Locking (2PL)
Ensures serializability:
1. **Growing Phase**: Acquire locks, no releases
2. **Shrinking Phase**: Release locks, no acquires

\`\`\`
Transaction: Lock(A) Lock(B) Lock(C) Unlock(A) Unlock(B) Unlock(C)
            |------- Growing -------|------- Shrinking -------|
\`\`\`

### Lock Granularity
- Row-level: Fine, high concurrency
- Page-level: Medium
- Table-level: Coarse, low overhead

### Deadlock Handling
1. Prevention (ordering)
2. Detection (wait-for graph)
3. Timeout`,
    options: [
      { text: "Shared and Exclusive locks with Two-Phase Locking for concurrency", isCorrect: true },
      { text: "Locks prevent all database access", isCorrect: false },
      { text: "Only one type of lock exists", isCorrect: false },
      { text: "Locks are optional", isCorrect: false },
    ],
  },
  {
    id: 37,
    title: "What are stored procedures and triggers?",
    text: "Explain stored procedures and triggers in databases.",
    difficulty: "Medium",
    subjectId: "dbms",
    topicId: "dbms-sql",
    answer: `## Stored Procedures & Triggers

### Stored Procedure
Precompiled SQL code stored in database.

\`\`\`sql
CREATE PROCEDURE GetCustomerOrders(IN customer_id INT)
BEGIN
    SELECT * FROM orders 
    WHERE customer = customer_id
    ORDER BY order_date DESC;
END;

-- Usage
CALL GetCustomerOrders(123);
\`\`\`

#### Benefits
- Reduced network traffic
- Code reuse
- Security (grant execute, not table access)
- Precompiled performance

### Trigger
Automatically executed in response to events.

\`\`\`sql
CREATE TRIGGER update_inventory
AFTER INSERT ON order_items
FOR EACH ROW
BEGIN
    UPDATE products 
    SET stock = stock - NEW.quantity
    WHERE id = NEW.product_id;
END;
\`\`\`

#### Trigger Types
- BEFORE/AFTER
- INSERT/UPDATE/DELETE
- ROW/STATEMENT level

### Comparison
| Aspect | Procedure | Trigger |
|--------|-----------|---------|
| Invocation | Explicit | Automatic |
| Parameters | Yes | No (uses NEW/OLD) |
| Return Value | Possible | No |
| Use Case | Reusable logic | Automatic actions |`,
    options: [
      { text: "Procedures are callable code; Triggers auto-execute on events", isCorrect: true },
      { text: "They are the same thing", isCorrect: false },
      { text: "Triggers require manual execution", isCorrect: false },
      { text: "Procedures cannot have parameters", isCorrect: false },
    ],
  },
  {
    id: 38,
    title: "Explain database recovery techniques.",
    text: "What are the different database recovery methods?",
    difficulty: "Hard",
    subjectId: "dbms",
    topicId: "dbms-recovery",
    answer: `## Database Recovery Techniques

Recovery ensures database consistency after failures.

### Types of Failures
1. Transaction failure
2. System crash
3. Disk failure

### Log-Based Recovery

#### Write-Ahead Logging (WAL)
- Log record before data modification
- Log to stable storage before commit

\`\`\`
Log Record: <Ti, X, old_value, new_value>

[T1 start] [T1, A, 100, 200] [T1 commit]
\`\`\`

#### Recovery Operations
- **UNDO**: Restore old value (uncommitted transactions)
- **REDO**: Apply new value (committed but not written)

### Checkpointing
Reduces recovery time by creating consistent snapshots.

\`\`\`
... [Checkpoint] T1 T2 T3 [Crash]
Only T1, T2, T3 need recovery
\`\`\`

### ARIES Algorithm
1. **Analysis**: Find dirty pages and active transactions
2. **Redo**: Replay history from checkpoint
3. **Undo**: Rollback uncommitted transactions

### Shadow Paging
- Maintain two page tables (current and shadow)
- Atomic switch on commit
- No undo needed`,
    options: [
      { text: "WAL, Checkpointing, ARIES for recovering from failures", isCorrect: true },
      { text: "No recovery is needed", isCorrect: false },
      { text: "Only backups are used", isCorrect: false },
      { text: "Recovery deletes all data", isCorrect: false },
    ],
  },
  // Computer Networks - Additional Questions
  {
    id: 39,
    title: "What is subnetting?",
    text: "Explain IP subnetting and CIDR notation.",
    difficulty: "Medium",
    subjectId: "cn",
    topicId: "cn-subnetting",
    answer: `## IP Subnetting

**Subnetting** divides a network into smaller, manageable subnetworks.

### Why Subnet?
- Efficient IP address usage
- Improved security
- Reduced broadcast traffic
- Better network organization

### Subnet Mask
Determines network and host portions.

\`\`\`
IP:          192.168.1.100
Subnet Mask: 255.255.255.0  (/24)

Network:     192.168.1.0
Host Range:  192.168.1.1 - 192.168.1.254
Broadcast:   192.168.1.255
\`\`\`

### CIDR Notation
/n indicates number of network bits.

| CIDR | Subnet Mask | Hosts |
|------|-------------|-------|
| /24 | 255.255.255.0 | 254 |
| /25 | 255.255.255.128 | 126 |
| /26 | 255.255.255.192 | 62 |
| /27 | 255.255.255.224 | 30 |

### Calculating Subnets
\`\`\`
Divide 192.168.1.0/24 into 4 subnets:
Need 2 bits for 4 subnets → /26

192.168.1.0/26   (0-63)
192.168.1.64/26  (64-127)
192.168.1.128/26 (128-191)
192.168.1.192/26 (192-255)
\`\`\`

### Formula
- Hosts per subnet = 2^(32-prefix) - 2
- Number of subnets = 2^borrowed_bits`,
    options: [
      { text: "Dividing networks using subnet masks and CIDR for efficient addressing", isCorrect: true },
      { text: "Only for IPv6", isCorrect: false },
      { text: "Increases broadcast traffic", isCorrect: false },
      { text: "Requires new hardware", isCorrect: false },
    ],
  },
  {
    id: 40,
    title: "Explain HTTP methods and status codes.",
    text: "What are the common HTTP methods and status codes?",
    difficulty: "Easy",
    subjectId: "cn",
    topicId: "cn-http",
    answer: `## HTTP Methods & Status Codes

### HTTP Methods

| Method | Purpose | Idempotent | Safe |
|--------|---------|------------|------|
| GET | Retrieve resource | Yes | Yes |
| POST | Create resource | No | No |
| PUT | Update/Replace | Yes | No |
| PATCH | Partial update | No | No |
| DELETE | Remove resource | Yes | No |
| HEAD | Get headers only | Yes | Yes |
| OPTIONS | Get allowed methods | Yes | Yes |

### Status Code Categories

#### 1xx - Informational
- 100 Continue

#### 2xx - Success
- 200 OK
- 201 Created
- 204 No Content

#### 3xx - Redirection
- 301 Moved Permanently
- 302 Found (temporary)
- 304 Not Modified

#### 4xx - Client Error
- 400 Bad Request
- 401 Unauthorized
- 403 Forbidden
- 404 Not Found
- 429 Too Many Requests

#### 5xx - Server Error
- 500 Internal Server Error
- 502 Bad Gateway
- 503 Service Unavailable

### Example
\`\`\`http
GET /api/users/123 HTTP/1.1
Host: example.com

HTTP/1.1 200 OK
Content-Type: application/json
{"id": 123, "name": "John"}
\`\`\``,
    options: [
      { text: "GET, POST, PUT, DELETE with 2xx success, 4xx client error, 5xx server error", isCorrect: true },
      { text: "Only GET and POST exist", isCorrect: false },
      { text: "All status codes start with 2", isCorrect: false },
      { text: "Methods are case-insensitive", isCorrect: false },
    ],
  },
  {
    id: 41,
    title: "What is ARP and how does it work?",
    text: "Explain the Address Resolution Protocol.",
    difficulty: "Medium",
    subjectId: "cn",
    topicId: "cn-tcp",
    answer: `## Address Resolution Protocol (ARP)

**ARP** maps IP addresses to MAC addresses on a local network.

### Why ARP?
- IP addresses (Layer 3) need to reach MAC addresses (Layer 2)
- Required for local network communication

### ARP Process
\`\`\`
1. Host A wants to send to IP 192.168.1.5
2. A checks ARP cache - not found
3. A broadcasts ARP Request:
   "Who has 192.168.1.5? Tell 192.168.1.1"
4. All hosts receive, only 192.168.1.5 responds
5. B sends ARP Reply:
   "192.168.1.5 is at AA:BB:CC:DD:EE:FF"
6. A updates ARP cache and sends packet
\`\`\`

### ARP Packet
| Field | Description |
|-------|-------------|
| Hardware Type | Ethernet (1) |
| Protocol Type | IPv4 (0x0800) |
| Sender MAC | Requester's MAC |
| Sender IP | Requester's IP |
| Target MAC | 00:00:00:00:00:00 (request) |
| Target IP | IP being resolved |

### ARP Cache
\`\`\`
$ arp -a
192.168.1.1    00-11-22-33-44-55    dynamic
192.168.1.5    AA-BB-CC-DD-EE-FF    dynamic
\`\`\`

### Security Issues
- **ARP Spoofing**: Fake ARP replies
- Mitigation: Static ARP entries, VLAN segmentation`,
    options: [
      { text: "Maps IP addresses to MAC addresses via broadcast/reply", isCorrect: true },
      { text: "Maps domain names to IPs", isCorrect: false },
      { text: "Works on Layer 7", isCorrect: false },
      { text: "Only for IPv6", isCorrect: false },
    ],
  },
  {
    id: 42,
    title: "Explain different routing protocols.",
    text: "What are RIP, OSPF, and BGP?",
    difficulty: "Hard",
    subjectId: "cn",
    topicId: "cn-routing",
    answer: `## Routing Protocols

### RIP (Routing Information Protocol)
- Distance Vector protocol
- Metric: Hop count (max 15)
- Updates every 30 seconds
- Simple but slow convergence

\`\`\`
Router A knows: Network X is 2 hops via B
                Network Y is 3 hops via C
\`\`\`

### OSPF (Open Shortest Path First)
- Link State protocol
- Metric: Cost (bandwidth-based)
- Dijkstra's algorithm
- Fast convergence, hierarchical

#### OSPF Areas
\`\`\`
      Area 0 (Backbone)
     /       |       \\
  Area 1  Area 2  Area 3
\`\`\`

### BGP (Border Gateway Protocol)
- Path Vector protocol
- Used between autonomous systems
- The protocol of the Internet
- Policy-based routing

### Comparison
| Protocol | Type | Metric | Use Case |
|----------|------|--------|----------|
| RIP | Distance Vector | Hops | Small networks |
| OSPF | Link State | Cost | Enterprise |
| BGP | Path Vector | Policies | Internet |

### IGP vs EGP
- **IGP** (Interior): RIP, OSPF, EIGRP (within AS)
- **EGP** (Exterior): BGP (between AS)`,
    options: [
      { text: "RIP (hop count), OSPF (link state), BGP (inter-AS path vector)", isCorrect: true },
      { text: "All use same algorithm", isCorrect: false },
      { text: "RIP is best for large networks", isCorrect: false },
      { text: "BGP is only for local networks", isCorrect: false },
    ],
  },
  {
    id: 43,
    title: "What is HTTPS and how does TLS work?",
    text: "Explain HTTPS and the TLS handshake.",
    difficulty: "Medium",
    subjectId: "cn",
    topicId: "cn-security",
    answer: `## HTTPS & TLS

**HTTPS** = HTTP + TLS (Transport Layer Security)

### What TLS Provides
1. **Encryption**: Data privacy
2. **Authentication**: Server identity verification
3. **Integrity**: Data tamper detection

### TLS Handshake (1.3)
\`\`\`
Client                              Server
   |                                   |
   |-------- ClientHello ------------>|
   |         (supported ciphers,       |
   |          key share)               |
   |                                   |
   |<-------- ServerHello ------------|
   |         (chosen cipher,           |
   |          key share, cert)         |
   |                                   |
   |-------- Finished ---------------->|
   |                                   |
   |<-------- Finished ----------------|
   |                                   |
   |========= Encrypted Data =========|
\`\`\`

### Certificate Verification
1. Server sends certificate
2. Client verifies certificate chain
3. Check against trusted CAs
4. Verify domain matches

### Cipher Suite Example
\`\`\`
TLS_AES_256_GCM_SHA384
    |       |      |
    |       |      +-- Hash algorithm
    |       +--------- Mode
    +----------------- Encryption
\`\`\`

### TLS 1.2 vs 1.3
| Aspect | TLS 1.2 | TLS 1.3 |
|--------|---------|---------|
| Handshake RTT | 2 | 1 |
| 0-RTT | No | Yes |
| Cipher Suites | Many | Few (secure) |`,
    options: [
      { text: "HTTPS uses TLS for encryption, authentication, and integrity", isCorrect: true },
      { text: "HTTPS is only about encryption", isCorrect: false },
      { text: "TLS and SSL are completely different", isCorrect: false },
      { text: "No handshake is needed", isCorrect: false },
    ],
  },
  {
    id: 44,
    title: "Explain NAT and its types.",
    text: "What is Network Address Translation?",
    difficulty: "Medium",
    subjectId: "cn",
    topicId: "cn-routing",
    answer: `## Network Address Translation (NAT)

**NAT** translates private IP addresses to public IP addresses.

### Why NAT?
- IPv4 address exhaustion
- Security (hides internal network)
- Flexibility in internal addressing

### Types of NAT

#### 1. Static NAT
- One-to-one mapping
- Permanent public IP for internal host
\`\`\`
192.168.1.10 ↔ 203.0.113.10
\`\`\`

#### 2. Dynamic NAT
- Pool of public IPs
- Assigns dynamically
\`\`\`
192.168.1.x → 203.0.113.1-10 (from pool)
\`\`\`

#### 3. PAT/NAPT (Port Address Translation)
- Many-to-one mapping
- Uses port numbers to distinguish
\`\`\`
192.168.1.10:5000 → 203.0.113.1:10001
192.168.1.11:5000 → 203.0.113.1:10002
\`\`\`

### NAT Table
| Internal IP:Port | External IP:Port | Protocol |
|------------------|------------------|----------|
| 192.168.1.10:5000 | 203.0.113.1:10001 | TCP |
| 192.168.1.11:3000 | 203.0.113.1:10002 | TCP |

### NAT Traversal Issues
- P2P applications
- VoIP
- Solutions: STUN, TURN, ICE`,
    options: [
      { text: "Translates private to public IPs; PAT uses ports for many-to-one", isCorrect: true },
      { text: "Only for IPv6", isCorrect: false },
      { text: "Increases security risks", isCorrect: false },
      { text: "Requires more public IPs", isCorrect: false },
    ],
  },
  // OOPs - Additional Questions
  {
    id: 45,
    title: "What are SOLID principles?",
    text: "Explain the SOLID principles of object-oriented design.",
    difficulty: "Hard",
    subjectId: "oops",
    topicId: "oops-patterns",
    answer: `## SOLID Principles

Five principles for maintainable object-oriented software.

### S - Single Responsibility Principle
A class should have only one reason to change.
\`\`\`java
// Bad: User handles persistence and validation
// Good: Separate UserValidator, UserRepository
\`\`\`

### O - Open/Closed Principle
Open for extension, closed for modification.
\`\`\`java
// Use inheritance/interfaces to add behavior
interface Shape { double area(); }
class Circle implements Shape { ... }
class Square implements Shape { ... }
\`\`\`

### L - Liskov Substitution Principle
Subtypes must be substitutable for base types.
\`\`\`java
// If Square extends Rectangle, setWidth/setHeight
// should work consistently
\`\`\`

### I - Interface Segregation Principle
Many specific interfaces better than one general.
\`\`\`java
// Bad: interface Worker { work(); eat(); }
// Good: interface Workable { work(); }
//       interface Eatable { eat(); }
\`\`\`

### D - Dependency Inversion Principle
Depend on abstractions, not concretions.
\`\`\`java
// Bad: class Service { MySQLDatabase db; }
// Good: class Service { Database db; } // interface
\`\`\`

### Benefits
- Maintainable code
- Easier testing
- Flexible design
- Reduced coupling`,
    options: [
      { text: "SRP, OCP, LSP, ISP, DIP for maintainable OO design", isCorrect: true },
      { text: "Only about single responsibility", isCorrect: false },
      { text: "Unrelated to design patterns", isCorrect: false },
      { text: "Only applies to Java", isCorrect: false },
    ],
  },
  {
    id: 46,
    title: "Explain common design patterns.",
    text: "What are Singleton, Factory, and Observer patterns?",
    difficulty: "Hard",
    subjectId: "oops",
    topicId: "oops-patterns",
    answer: `## Design Patterns

### Singleton Pattern
Ensures only one instance exists.

\`\`\`java
public class Singleton {
    private static Singleton instance;
    private Singleton() {}
    
    public static synchronized Singleton getInstance() {
        if (instance == null) {
            instance = new Singleton();
        }
        return instance;
    }
}
\`\`\`

### Factory Pattern
Creates objects without specifying exact class.

\`\`\`java
interface Animal { void speak(); }
class Dog implements Animal { void speak() { print("Woof"); } }
class Cat implements Animal { void speak() { print("Meow"); } }

class AnimalFactory {
    Animal create(String type) {
        if (type.equals("dog")) return new Dog();
        if (type.equals("cat")) return new Cat();
        return null;
    }
}
\`\`\`

### Observer Pattern
One-to-many dependency; subjects notify observers.

\`\`\`java
interface Observer { void update(String msg); }

class Subject {
    List<Observer> observers;
    void attach(Observer o) { observers.add(o); }
    void notify(String msg) {
        for (Observer o : observers) o.update(msg);
    }
}
\`\`\`

### Pattern Categories
| Type | Patterns |
|------|----------|
| Creational | Singleton, Factory, Builder |
| Structural | Adapter, Decorator, Facade |
| Behavioral | Observer, Strategy, Command |`,
    options: [
      { text: "Singleton (one instance), Factory (create objects), Observer (notify changes)", isCorrect: true },
      { text: "Design patterns are anti-patterns", isCorrect: false },
      { text: "Only Singleton exists", isCorrect: false },
      { text: "Patterns cannot be combined", isCorrect: false },
    ],
  },
  {
    id: 47,
    title: "What is method overloading vs overriding?",
    text: "Explain the difference between overloading and overriding.",
    difficulty: "Easy",
    subjectId: "oops",
    topicId: "oops-polymorphism",
    answer: `## Overloading vs Overriding

### Method Overloading
Same method name, different parameters in **same class**.

\`\`\`java
class Calculator {
    int add(int a, int b) { return a + b; }
    int add(int a, int b, int c) { return a + b + c; }
    double add(double a, double b) { return a + b; }
}
\`\`\`

**Rules:**
- Same method name
- Different parameter list
- Return type can differ
- Compile-time polymorphism

### Method Overriding
Same method signature in **subclass**.

\`\`\`java
class Animal {
    void sound() { System.out.println("Some sound"); }
}

class Dog extends Animal {
    @Override
    void sound() { System.out.println("Bark"); }
}
\`\`\`

**Rules:**
- Same method signature
- Inheritance required
- Runtime polymorphism
- Cannot reduce visibility

### Comparison
| Aspect | Overloading | Overriding |
|--------|-------------|------------|
| Class | Same | Different (subclass) |
| Parameters | Must differ | Same |
| Inheritance | Not required | Required |
| Binding | Compile-time | Runtime |
| Return Type | Can differ | Same or covariant |`,
    options: [
      { text: "Overloading: same name, different params; Overriding: same signature in subclass", isCorrect: true },
      { text: "They are the same thing", isCorrect: false },
      { text: "Overriding doesn't need inheritance", isCorrect: false },
      { text: "Overloading requires inheritance", isCorrect: false },
    ],
  },
  {
    id: 48,
    title: "What is the difference between abstract class and interface?",
    text: "Explain abstract classes vs interfaces in OOP.",
    difficulty: "Medium",
    subjectId: "oops",
    topicId: "oops-abstraction",
    answer: `## Abstract Class vs Interface

### Abstract Class
\`\`\`java
abstract class Animal {
    protected String name;
    
    Animal(String name) { this.name = name; }
    
    abstract void sound();  // abstract
    
    void sleep() {          // concrete
        System.out.println(name + " is sleeping");
    }
}
\`\`\`

### Interface
\`\`\`java
interface Flyable {
    void fly();  // implicitly public abstract
    
    default void land() {  // default method (Java 8+)
        System.out.println("Landing");
    }
}
\`\`\`

### Comparison
| Feature | Abstract Class | Interface |
|---------|---------------|-----------|
| Methods | Abstract + concrete | Abstract (+ default) |
| Variables | Any type | public static final |
| Constructor | Yes | No |
| Inheritance | Single | Multiple |
| Access Modifiers | Any | Public only |
| Speed | Faster | Slightly slower |

### When to Use
- **Abstract Class**: 
  - Shared code among related classes
  - Need constructors or non-public members
  
- **Interface**:
  - Define contract for unrelated classes
  - Need multiple inheritance
  - Define behavior across type hierarchy`,
    options: [
      { text: "Abstract class has concrete methods and constructor; interface defines contracts", isCorrect: true },
      { text: "They are identical", isCorrect: false },
      { text: "Interfaces can have constructors", isCorrect: false },
      { text: "Abstract classes allow multiple inheritance", isCorrect: false },
    ],
  },
  // Theory of Computation - Additional Questions
  {
    id: 49,
    title: "What is a Pushdown Automaton (PDA)?",
    text: "Explain Pushdown Automata and their relation to CFG.",
    difficulty: "Hard",
    subjectId: "toc",
    topicId: "toc-pda",
    answer: `## Pushdown Automaton (PDA)

A **PDA** is an NFA with a stack for memory, recognizing context-free languages.

### Components
- Q: Finite set of states
- Σ: Input alphabet
- Γ: Stack alphabet
- δ: Transition function
- q0: Initial state
- Z0: Initial stack symbol
- F: Accepting states

### Transition
\`\`\`
δ(q, a, X) = {(p, γ), ...}

In state q, reading 'a', with X on stack:
Move to state p, replace X with γ
\`\`\`

### Example: {aⁿbⁿ | n ≥ 0}
\`\`\`
1. Push 'a' for each 'a' read
2. Pop 'a' for each 'b' read
3. Accept if stack empty after input

Input: aabb
Stack: [] → [a] → [a,a] → [a] → []  ✓
\`\`\`

### PDA vs FA
| Feature | FA | PDA |
|---------|----|----|
| Memory | None | Stack |
| Languages | Regular | Context-Free |
| Power | Limited | More powerful |

### CFG ↔ PDA
- Every CFG has equivalent PDA
- Every PDA has equivalent CFG
- CFLs = Languages recognized by PDAs`,
    options: [
      { text: "NFA with stack memory, recognizes context-free languages", isCorrect: true },
      { text: "Same as DFA", isCorrect: false },
      { text: "Can recognize all languages", isCorrect: false },
      { text: "Doesn't need a stack", isCorrect: false },
    ],
  },
  {
    id: 50,
    title: "What is a Turing Machine?",
    text: "Explain Turing Machines and their significance.",
    difficulty: "Hard",
    subjectId: "toc",
    topicId: "toc-turing",
    answer: `## Turing Machine

A **Turing Machine** is a theoretical model of computation that can simulate any algorithm.

### Components
- Infinite tape (memory)
- Read/write head
- Finite state control
- Transition function

### Transition
\`\`\`
δ(q, a) = (q', b, D)

In state q, reading a:
- Move to state q'
- Write b
- Move head Direction D (L/R)
\`\`\`

### Example: Accept {aⁿbⁿcⁿ | n ≥ 1}
\`\`\`
1. Mark first 'a' as X
2. Move right to first 'b', mark as Y
3. Move right to first 'c', mark as Z
4. Return to leftmost unmarked 'a'
5. Repeat until all marked
6. Accept if all symbols marked
\`\`\`

### Church-Turing Thesis
- TM can compute anything that's "computable"
- Foundation of computability theory

### Variations
| Type | Description |
|------|-------------|
| Multi-tape | Multiple tapes |
| Non-deterministic | Multiple transitions |
| Universal TM | Simulates any TM |

### Decidability
- **Decidable**: TM halts on all inputs
- **Undecidable**: Halting problem, etc.`,
    options: [
      { text: "Theoretical model with infinite tape that can simulate any algorithm", isCorrect: true },
      { text: "Same as PDA", isCorrect: false },
      { text: "Has finite memory", isCorrect: false },
      { text: "Cannot recognize regular languages", isCorrect: false },
    ],
  },
  {
    id: 51,
    title: "What are regular expressions?",
    text: "Explain regular expressions and their operations.",
    difficulty: "Medium",
    subjectId: "toc",
    topicId: "toc-regex",
    answer: `## Regular Expressions

**Regular expressions** define patterns for regular languages.

### Basic Operations

#### 1. Concatenation
\`\`\`
ab  → "ab"
\`\`\`

#### 2. Union (|)
\`\`\`
a|b  → "a" or "b"
\`\`\`

#### 3. Kleene Star (*)
\`\`\`
a*   → "", "a", "aa", "aaa", ...
\`\`\`

### Extended Operations
| Symbol | Meaning |
|--------|---------|
| + | One or more |
| ? | Zero or one |
| [abc] | Character class |
| [a-z] | Range |
| . | Any character |
| ^ | Start of string |
| $ | End of string |

### Examples
\`\`\`
a*b      → b, ab, aab, aaab, ...
(a|b)*   → ε, a, b, aa, ab, ba, bb, ...
a+b+     → ab, aab, abb, aabb, ...
[0-9]+   → Any positive integer
\`\`\`

### RE ↔ FA
- Every RE has equivalent FA
- Every FA has equivalent RE
- Regular languages = Languages described by RE

### Limitations
Cannot express:
- aⁿbⁿ (need memory)
- Balanced parentheses
- Palindromes`,
    options: [
      { text: "Patterns using concatenation, union, Kleene star for regular languages", isCorrect: true },
      { text: "Can express any language", isCorrect: false },
      { text: "Same as context-free grammars", isCorrect: false },
      { text: "Cannot be converted to FA", isCorrect: false },
    ],
  },
  {
    id: 52,
    title: "What is a Context-Free Grammar?",
    text: "Explain CFG and its components.",
    difficulty: "Medium",
    subjectId: "toc",
    topicId: "toc-grammar",
    answer: `## Context-Free Grammar (CFG)

A **CFG** defines context-free languages using production rules.

### Components
- V: Variables (non-terminals)
- Σ: Terminals
- R: Production rules
- S: Start symbol

### Production Format
\`\`\`
A → α  (A is variable, α is string of V ∪ Σ)
\`\`\`

### Example: Balanced Parentheses
\`\`\`
S → (S) | SS | ε

Derivation of "(())":
S → (S) → ((S)) → (())
\`\`\`

### Derivation Types
- **Leftmost**: Replace leftmost variable first
- **Rightmost**: Replace rightmost variable first

### Parse Tree
\`\`\`
         S
        /|\\
       ( S )
         |
         S
        /|\\
       ( S )
         |
         ε
\`\`\`

### Ambiguity
A grammar is **ambiguous** if a string has multiple parse trees.

\`\`\`
E → E + E | E * E | id

"id + id * id" has two trees!
Fix: Use precedence rules
\`\`\`

### Chomsky Normal Form
All rules: A → BC or A → a
- Useful for parsing algorithms (CYK)`,
    options: [
      { text: "Production rules with variables and terminals defining context-free languages", isCorrect: true },
      { text: "Same as regular expressions", isCorrect: false },
      { text: "Can only generate finite languages", isCorrect: false },
      { text: "No ambiguity possible", isCorrect: false },
    ],
  },
  // Compiler Design - Questions
  {
    id: 53,
    title: "What are the phases of a compiler?",
    text: "Explain the different phases of compilation.",
    difficulty: "Medium",
    subjectId: "compiler",
    topicId: "compiler-lexical",
    answer: `## Compiler Phases

### Analysis Phase (Front End)

#### 1. Lexical Analysis
- Reads source code
- Produces tokens
- Removes whitespace, comments
\`\`\`
int x = 5;  →  [INT][ID:x][ASSIGN][NUM:5][SEMICOLON]
\`\`\`

#### 2. Syntax Analysis
- Parses tokens
- Builds parse tree
- Checks grammar rules

#### 3. Semantic Analysis
- Type checking
- Scope resolution
- Symbol table management

### Synthesis Phase (Back End)

#### 4. Intermediate Code Generation
- Platform-independent code
- Three-address code
\`\`\`
t1 = a + b
t2 = t1 * c
\`\`\`

#### 5. Code Optimization
- Improve efficiency
- Remove redundancy

#### 6. Code Generation
- Target machine code
- Register allocation

### Compiler Structure
\`\`\`
Source → Lexer → Parser → Semantic → IR Gen → Optimizer → Code Gen → Target
          ↓        ↓         ↓
       Tokens   Parse     Annotated
                Tree       Tree
\`\`\`

### Supporting Components
- Symbol Table: Variable/function info
- Error Handler: Error reporting`,
    options: [
      { text: "Lexical, Syntax, Semantic analysis; IR, Optimization, Code generation", isCorrect: true },
      { text: "Only one phase exists", isCorrect: false },
      { text: "No optimization occurs", isCorrect: false },
      { text: "Phases cannot be combined", isCorrect: false },
    ],
  },
  {
    id: 54,
    title: "What is lexical analysis?",
    text: "Explain the role of a lexer/scanner in compilation.",
    difficulty: "Easy",
    subjectId: "compiler",
    topicId: "compiler-lexical",
    answer: `## Lexical Analysis

The **lexer** (scanner) converts source code into tokens.

### Token Types
| Type | Examples |
|------|----------|
| Keywords | if, while, int, return |
| Identifiers | x, myVar, count |
| Operators | +, -, *, ==, && |
| Literals | 42, 3.14, "hello" |
| Punctuation | ;, {, }, ( |

### Process
\`\`\`
Source: "int count = 10;"

Tokens:
<KEYWORD, int>
<IDENTIFIER, count>
<OPERATOR, =>
<INTEGER, 10>
<PUNCTUATION, ;>
\`\`\`

### Implementation
- Regular expressions define patterns
- DFA recognizes tokens
- Tools: Lex, Flex

\`\`\`
Pattern → Token
[0-9]+        → INTEGER
[a-zA-Z_][a-zA-Z0-9_]*  → IDENTIFIER
"if"          → KEYWORD_IF
\`\`\`

### Responsibilities
1. Remove whitespace and comments
2. Recognize tokens
3. Report lexical errors
4. Generate symbol table entries

### Lexical Errors
- Invalid characters
- Malformed numbers
- Unterminated strings`,
    options: [
      { text: "Converts source code into tokens using pattern matching", isCorrect: true },
      { text: "Checks grammar rules", isCorrect: false },
      { text: "Generates machine code", isCorrect: false },
      { text: "Performs type checking", isCorrect: false },
    ],
  },
  {
    id: 55,
    title: "What are different parsing techniques?",
    text: "Explain top-down and bottom-up parsing.",
    difficulty: "Hard",
    subjectId: "compiler",
    topicId: "compiler-syntax",
    answer: `## Parsing Techniques

### Top-Down Parsing
Starts from start symbol, derives to input.

#### Recursive Descent
- One function per non-terminal
- Simple but limited

\`\`\`java
void E() {
    T();
    while (token == '+') {
        match('+');
        T();
    }
}
\`\`\`

#### LL Parsing
- Left-to-right, Leftmost derivation
- Predictive, uses lookahead
- LL(1): One token lookahead

### Bottom-Up Parsing
Starts from input, reduces to start symbol.

#### Shift-Reduce
- **Shift**: Push token onto stack
- **Reduce**: Replace handle with non-terminal

#### LR Parsing
- Left-to-right, Rightmost derivation (in reverse)
- More powerful than LL
- Types: LR(0), SLR, LALR, CLR

\`\`\`
Input: id + id * id

Stack           Input           Action
$               id+id*id$       Shift
$id             +id*id$         Reduce E→id
$E              +id*id$         Shift
$E+             id*id$          Shift
...
$E              $               Accept
\`\`\`

### Comparison
| Feature | LL | LR |
|---------|----|----|
| Direction | Top-down | Bottom-up |
| Power | Less | More |
| Implementation | Easier | Complex |
| Tools | ANTLR | Yacc, Bison |`,
    options: [
      { text: "Top-down (LL, recursive descent) vs Bottom-up (LR, shift-reduce)", isCorrect: true },
      { text: "Only one parsing method exists", isCorrect: false },
      { text: "LL is more powerful than LR", isCorrect: false },
      { text: "Parsing doesn't use grammars", isCorrect: false },
    ],
  },
  {
    id: 56,
    title: "What is type checking?",
    text: "Explain type checking and type systems in compilers.",
    difficulty: "Medium",
    subjectId: "compiler",
    topicId: "compiler-semantic",
    answer: `## Type Checking

**Type checking** ensures operations are performed on compatible types.

### Static vs Dynamic Typing
| Aspect | Static | Dynamic |
|--------|--------|---------|
| When | Compile time | Runtime |
| Languages | C, Java, Go | Python, JS |
| Errors | Early detection | Late detection |
| Performance | Faster | Overhead |

### Type System Features

#### Type Inference
\`\`\`
auto x = 5;      // Inferred as int
let y = "hello"; // Inferred as string
\`\`\`

#### Type Coercion
\`\`\`c
int a = 5;
float b = a;  // Implicit coercion
\`\`\`

#### Type Equivalence
- **Structural**: Same structure
- **Name**: Same type name

### Type Checking Rules
\`\`\`
E1 : int   E2 : int
─────────────────────
E1 + E2 : int

E : bool   S1, S2 : stmt
─────────────────────────
if E then S1 else S2 : stmt
\`\`\`

### Common Checks
1. Operand type compatibility
2. Function argument matching
3. Return type verification
4. Array bounds (sometimes)

### Type Errors
\`\`\`
"hello" + 5        // Error in strongly typed
func(int, int) called with (string)  // Error
\`\`\``,
    options: [
      { text: "Verifies type compatibility; static at compile-time, dynamic at runtime", isCorrect: true },
      { text: "Only exists in Python", isCorrect: false },
      { text: "Has no performance impact", isCorrect: false },
      { text: "Types don't affect compilation", isCorrect: false },
    ],
  },
  {
    id: 57,
    title: "What is three-address code?",
    text: "Explain intermediate representations in compilers.",
    difficulty: "Medium",
    subjectId: "compiler",
    topicId: "compiler-codegen",
    answer: `## Three-Address Code

**Three-address code** is an intermediate representation with at most three operands per instruction.

### Format
\`\`\`
x = y op z    (binary operation)
x = op y      (unary operation)
x = y         (copy)
\`\`\`

### Example
\`\`\`
Source: a = b * c + d * e

Three-Address Code:
t1 = b * c
t2 = d * e
t3 = t1 + t2
a = t3
\`\`\`

### Instruction Types
| Type | Example |
|------|---------|
| Assignment | x = y op z |
| Copy | x = y |
| Jump | goto L |
| Conditional | if x goto L |
| Call | call func, n |
| Return | return y |
| Array | x = y[i] |
| Pointer | x = *y |

### Representations

#### Quadruples
| Op | Arg1 | Arg2 | Result |
|----|------|------|--------|
| * | b | c | t1 |
| + | t1 | t2 | t3 |

#### Triples
| Index | Op | Arg1 | Arg2 |
|-------|------|------|------|
| (0) | * | b | c |
| (1) | + | (0) | d |

### Benefits
- Machine-independent
- Easy to optimize
- Simple to generate`,
    options: [
      { text: "IR with max three operands; forms like quadruples and triples", isCorrect: true },
      { text: "Final machine code", isCorrect: false },
      { text: "Only for interpreted languages", isCorrect: false },
      { text: "Cannot represent loops", isCorrect: false },
    ],
  },
  {
    id: 58,
    title: "What are common code optimization techniques?",
    text: "Explain various compiler optimization strategies.",
    difficulty: "Hard",
    subjectId: "compiler",
    topicId: "compiler-optimization",
    answer: `## Code Optimization Techniques

### Local Optimizations (Basic Block)

#### Constant Folding
\`\`\`
x = 3 * 5  →  x = 15
\`\`\`

#### Constant Propagation
\`\`\`
x = 5       x = 5
y = x + 3   →  y = 8
\`\`\`

#### Dead Code Elimination
\`\`\`
x = 5       
x = 10  →  x = 10  (first assignment removed)
\`\`\`

#### Common Subexpression Elimination
\`\`\`
t1 = a + b    t1 = a + b
t2 = a + b  →  t2 = t1
\`\`\`

### Loop Optimizations

#### Loop Invariant Code Motion
\`\`\`
for i in range:      x = y * z
    x = y * z     →  for i in range:
    a[i] = x          a[i] = x
\`\`\`

#### Loop Unrolling
\`\`\`
for i=0 to 4:        a[0] = 0
    a[i] = 0    →    a[1] = 0
                     a[2] = 0
                     a[3] = 0
\`\`\`

#### Strength Reduction
\`\`\`
x = i * 4  →  x = i << 2  (multiply → shift)
\`\`\`

### Global Optimizations
- Data flow analysis
- Register allocation
- Inline expansion
- Tail call optimization

### Optimization Levels
\`\`\`
-O0: No optimization
-O1: Basic optimizations
-O2: Moderate optimizations
-O3: Aggressive optimizations
\`\`\``,
    options: [
      { text: "Constant folding, dead code elimination, loop optimizations, etc.", isCorrect: true },
      { text: "Optimization always increases code size", isCorrect: false },
      { text: "Only manual optimization works", isCorrect: false },
      { text: "Optimization is done before parsing", isCorrect: false },
    ],
  },
  {
    id: 59,
    title: "What is a symbol table?",
    text: "Explain the role and structure of symbol tables.",
    difficulty: "Medium",
    subjectId: "compiler",
    topicId: "compiler-semantic",
    answer: `## Symbol Table

A **symbol table** stores information about identifiers in a program.

### Information Stored
| Field | Description |
|-------|-------------|
| Name | Identifier name |
| Type | int, float, function, etc. |
| Scope | Local, global, block |
| Size | Memory size needed |
| Location | Memory address/offset |
| Value | For constants |

### Operations
- **insert(name, info)**: Add new entry
- **lookup(name)**: Find entry
- **delete(name)**: Remove entry (scope exit)

### Implementation
\`\`\`
Hash Table (most common)
├── Fast O(1) operations
└── Collision handling needed

Tree Structure
├── Ordered traversal
└── O(log n) operations
\`\`\`

### Scope Management
\`\`\`
{                          // Enter scope
    int x;                 // Insert x
    {                      // Enter nested scope
        float x;           // Insert x (shadows outer)
    }                      // Exit: remove inner x
}                          // Exit: remove outer x
\`\`\`

### Implementation with Stack of Tables
\`\`\`
Global Table
├── Function Table
│   ├── Block 1 Table
│   └── Block 2 Table
└── ...
\`\`\`

### Usage Across Phases
- Lexer: Create entries
- Parser: Update with type info
- Semantic: Type checking
- Code Gen: Address allocation`,
    options: [
      { text: "Data structure storing identifier info (type, scope, location)", isCorrect: true },
      { text: "Only stores variable names", isCorrect: false },
      { text: "Created after code generation", isCorrect: false },
      { text: "Not needed for compilation", isCorrect: false },
    ],
  },
  {
    id: 60,
    title: "What is register allocation?",
    text: "Explain register allocation in code generation.",
    difficulty: "Hard",
    subjectId: "compiler",
    topicId: "compiler-codegen",
    answer: `## Register Allocation

**Register allocation** assigns program variables to CPU registers.

### Why Important?
- Registers much faster than memory
- Limited number of registers
- Critical for performance

### Challenges
- More variables than registers
- Variables have different lifetimes
- Some instructions need specific registers

### Graph Coloring Approach
1. Build **interference graph**
   - Node = variable
   - Edge = variables live simultaneously

2. **Color** graph with k colors (k registers)
   - Adjacent nodes get different colors

3. If cannot color → **spill** to memory

\`\`\`
Variables: a, b, c, d
Live together: (a,b), (a,c), (b,c)

Graph:      a---b
            |\\  |
            | \\ |
            c   (d separate)

3 registers needed for a,b,c
d can reuse any
\`\`\`

### Liveness Analysis
\`\`\`
t1 = a + b    // t1 live until line 3
t2 = c + d    // t2 live until line 3
t3 = t1 * t2  // t1, t2 dead after
\`\`\`

### Spilling
When k-coloring fails:
1. Select variable to spill
2. Store to memory
3. Load when needed
4. Re-attempt coloring

### Techniques
- Linear scan allocation
- Chaitin's algorithm
- Briggs' conservative coalescing`,
    options: [
      { text: "Assigning variables to CPU registers using graph coloring", isCorrect: true },
      { text: "Always puts variables in memory", isCorrect: false },
      { text: "Done before parsing", isCorrect: false },
      { text: "Unlimited registers available", isCorrect: false },
    ],
  },
   // Additional comprehensive MCQ questions for quiz variety
   {
     id: 61,
     title: "What is thrashing in operating systems?",
     text: "Explain the concept of thrashing and its causes.",
     difficulty: "Hard",
     subjectId: "os",
     topicId: "os-memory",
     answer: `## Thrashing
 
 **Thrashing** occurs when a system spends more time paging than executing processes.
 
 ### Causes
 - Too many processes competing for limited memory
 - High page fault rate
 - Pages constantly swapped in/out
 
 ### Symptoms
 - CPU utilization drops
 - Disk I/O increases dramatically
 - System becomes unresponsive
 
 ### Prevention
 - Working set model
 - Page fault frequency control
 - Reduce degree of multiprogramming`,
     options: [
       { text: "System spends more time paging than executing processes", isCorrect: true },
       { text: "CPU overheating", isCorrect: false },
       { text: "Network congestion", isCorrect: false },
       { text: "Disk fragmentation", isCorrect: false },
     ],
   },
   {
     id: 62,
     title: "Explain the Banker's Algorithm.",
     text: "What is the Banker's Algorithm used for?",
     difficulty: "Hard",
     subjectId: "os",
     topicId: "os-deadlock",
     answer: `## Banker's Algorithm
 
 Used for **deadlock avoidance** by checking if resource allocation leaves system in safe state.
 
 ### Data Structures
 - Available: Vector of available resources
 - Max: Maximum demand of each process
 - Allocation: Currently allocated resources
 - Need: Max - Allocation
 
 ### Safety Algorithm
 1. Find process whose Need ≤ Available
 2. Pretend process finishes, add its resources to Available
 3. Repeat until all processes can finish (safe) or stuck (unsafe)`,
     options: [
       { text: "Deadlock avoidance by checking for safe state", isCorrect: true },
       { text: "Deadlock detection only", isCorrect: false },
       { text: "Memory allocation algorithm", isCorrect: false },
       { text: "CPU scheduling algorithm", isCorrect: false },
     ],
   },
   {
     id: 63,
     title: "What is a B+ Tree?",
     text: "Explain B+ Tree structure and its use in databases.",
     difficulty: "Medium",
     subjectId: "dbms",
     topicId: "dbms-indexing",
     answer: `## B+ Tree
 
 Self-balancing tree used for **database indexing**.
 
 ### Properties
 - All data in leaf nodes
 - Leaf nodes linked for range queries
 - Internal nodes store only keys
 - Balanced height ensures O(log n) operations
 
 ### Advantages
 - Efficient range queries
 - Good for disk-based storage
 - Predictable performance`,
     options: [
       { text: "Self-balancing tree with data only in leaf nodes, linked for range queries", isCorrect: true },
       { text: "Binary search tree", isCorrect: false },
       { text: "Data stored in all nodes", isCorrect: false },
       { text: "Unbalanced tree structure", isCorrect: false },
     ],
   },
   {
     id: 64,
     title: "What are different types of SQL joins?",
     text: "Explain INNER, LEFT, RIGHT, and FULL joins.",
     difficulty: "Medium",
     subjectId: "dbms",
     topicId: "dbms-sql",
     answer: `## SQL Joins
 
 ### INNER JOIN
 Returns only matching rows from both tables.
 
 ### LEFT JOIN
 All rows from left table + matching from right (NULL if no match).
 
 ### RIGHT JOIN
 All rows from right table + matching from left.
 
 ### FULL OUTER JOIN
 All rows from both tables, NULL where no match.
 
 ### CROSS JOIN
 Cartesian product of both tables.`,
     options: [
       { text: "INNER returns matches, LEFT/RIGHT keep one table complete, FULL keeps both", isCorrect: true },
       { text: "All joins return the same result", isCorrect: false },
       { text: "LEFT and RIGHT joins are identical", isCorrect: false },
       { text: "INNER JOIN returns all rows", isCorrect: false },
     ],
   },
   {
     id: 65,
     title: "How does subnetting work?",
     text: "Explain IP subnetting and subnet masks.",
     difficulty: "Medium",
     subjectId: "cn",
     topicId: "cn-subnetting",
     answer: `## Subnetting
 
 Dividing a network into smaller networks.
 
 ### Subnet Mask
 - Determines network vs host portion
 - /24 = 255.255.255.0 = 256 addresses
 - /25 = 255.255.255.128 = 128 addresses
 
 ### CIDR Notation
 192.168.1.0/24 means:
 - Network: 192.168.1.0
 - Hosts: 192.168.1.1 - 192.168.1.254
 - Broadcast: 192.168.1.255`,
     options: [
       { text: "Dividing networks using subnet masks to separate network and host portions", isCorrect: true },
       { text: "Combining multiple networks into one", isCorrect: false },
       { text: "Only used for IPv6", isCorrect: false },
       { text: "A type of routing protocol", isCorrect: false },
     ],
   },
   {
     id: 66,
     title: "What is NAT (Network Address Translation)?",
     text: "Explain how NAT works and its types.",
     difficulty: "Medium",
     subjectId: "cn",
     topicId: "cn-routing",
     answer: `## NAT
 
 Translates private IP addresses to public addresses.
 
 ### Types
 - **Static NAT**: One-to-one mapping
 - **Dynamic NAT**: Pool of public IPs
 - **PAT/NAT Overload**: Many-to-one using ports
 
 ### Benefits
 - Conserves IPv4 addresses
 - Provides security (hides internal IPs)
 - Enables private networks to access internet`,
     options: [
       { text: "Translates private IPs to public IPs for internet access", isCorrect: true },
       { text: "Encrypts network traffic", isCorrect: false },
       { text: "A routing protocol", isCorrect: false },
       { text: "DNS resolution mechanism", isCorrect: false },
     ],
   },
   {
     id: 67,
     title: "What are SOLID principles?",
     text: "Explain the SOLID principles in OOP.",
     difficulty: "Medium",
     subjectId: "oops",
     topicId: "oops-patterns",
     answer: `## SOLID Principles
 
 ### S - Single Responsibility
 Class should have only one reason to change.
 
 ### O - Open/Closed
 Open for extension, closed for modification.
 
 ### L - Liskov Substitution
 Subtypes must be substitutable for base types.
 
 ### I - Interface Segregation
 Many specific interfaces better than one general.
 
 ### D - Dependency Inversion
 Depend on abstractions, not concretions.`,
     options: [
       { text: "Single Responsibility, Open/Closed, Liskov, Interface Segregation, Dependency Inversion", isCorrect: true },
       { text: "Design patterns for databases", isCorrect: false },
       { text: "Only applies to functional programming", isCorrect: false },
       { text: "Hardware design principles", isCorrect: false },
     ],
   },
   {
     id: 68,
     title: "What is the Factory Design Pattern?",
     text: "Explain the Factory pattern and when to use it.",
     difficulty: "Medium",
     subjectId: "oops",
     topicId: "oops-patterns",
     answer: `## Factory Pattern
 
 Creates objects without specifying exact class.
 
 ### When to Use
 - Object creation logic is complex
 - Need to decouple creation from usage
 - Multiple implementations of an interface
 
 ### Example
 \`\`\`typescript
 interface Animal { speak(): void; }
 class Dog implements Animal { speak() { console.log("Woof"); } }
 class Cat implements Animal { speak() { console.log("Meow"); } }
 
 function animalFactory(type: string): Animal {
   if (type === "dog") return new Dog();
   return new Cat();
 }
 \`\`\``,
     options: [
       { text: "Creates objects without specifying exact class, decoupling creation", isCorrect: true },
       { text: "Only creates singleton objects", isCorrect: false },
       { text: "A structural pattern", isCorrect: false },
       { text: "Cannot be used with interfaces", isCorrect: false },
     ],
   },
   {
     id: 69,
     title: "What is a Turing Machine?",
     text: "Explain the concept and components of a Turing Machine.",
     difficulty: "Hard",
     subjectId: "toc",
     topicId: "toc-turing",
     answer: `## Turing Machine
 
 Theoretical model of computation.
 
 ### Components
 - Infinite tape (memory)
 - Read/write head
 - State register
 - Transition function
 
 ### Operations
 - Read symbol under head
 - Write new symbol
 - Move head left/right
 - Change state
 
 ### Church-Turing Thesis
 Any computable function can be computed by a Turing Machine.`,
     options: [
       { text: "Theoretical computation model with infinite tape, head, states, and transitions", isCorrect: true },
       { text: "A physical computer", isCorrect: false },
       { text: "Only accepts regular languages", isCorrect: false },
       { text: "Has finite memory", isCorrect: false },
     ],
   },
   {
     id: 70,
     title: "What is LL(1) parsing?",
     text: "Explain LL(1) parsing and its requirements.",
     difficulty: "Hard",
     subjectId: "compiler",
     topicId: "compiler-syntax",
     answer: `## LL(1) Parsing
 
 Top-down parsing with 1 lookahead token.
 
 ### LL(1) means:
 - **L**: Left-to-right scan
 - **L**: Leftmost derivation
 - **1**: 1 lookahead token
 
 ### Requirements
 - No left recursion
 - Must be left-factored
 - FIRST/FOLLOW sets must not overlap
 
 ### Parse Table
 Built using FIRST and FOLLOW sets.`,
     options: [
       { text: "Top-down parsing with left-to-right scan, leftmost derivation, 1 lookahead", isCorrect: true },
       { text: "Bottom-up parsing technique", isCorrect: false },
       { text: "Can parse any grammar", isCorrect: false },
       { text: "Requires right recursion", isCorrect: false },
     ],
   },
   {
     id: 71,
     title: "What is loop optimization?",
     text: "Explain common loop optimization techniques.",
     difficulty: "Hard",
     subjectId: "compiler",
     topicId: "compiler-optimization",
     answer: `## Loop Optimization
 
 ### Techniques
 - **Loop Invariant Code Motion**: Move unchanging code outside
 - **Loop Unrolling**: Reduce iterations, more work per iteration
 - **Loop Fusion**: Combine adjacent loops
 - **Loop Fission**: Split loop for better cache usage
 - **Strength Reduction**: Replace expensive ops (multiply → add)
 
 ### Example
 \`\`\`c
 // Before
 for (i = 0; i < n; i++) x[i] = i * 4;
 
 // After strength reduction
 for (i = 0, t = 0; i < n; i++, t += 4) x[i] = t;
 \`\`\``,
     options: [
       { text: "Techniques like code motion, unrolling, fusion, strength reduction", isCorrect: true },
       { text: "Only applies to while loops", isCorrect: false },
       { text: "Always increases code size", isCorrect: false },
       { text: "Done during lexical analysis", isCorrect: false },
     ],
   },
   {
     id: 72,
     title: "What is the working set model?",
     text: "Explain the working set model in memory management.",
     difficulty: "Hard",
     subjectId: "os",
     topicId: "os-memory",
     answer: `## Working Set Model
 
 Set of pages a process is currently using.
 
 ### Definition
 WS(t, Δ) = pages referenced in time interval [t-Δ, t]
 
 ### Purpose
 - Prevent thrashing
 - Allocate enough frames for active pages
 - If process needs more → allocate more
 - If needs less → reclaim frames
 
 ### Relation to Page Faults
 If working set fits in memory → low page faults.
 If not → high page faults → potential thrashing.`,
     options: [
       { text: "Set of pages currently used by a process to prevent thrashing", isCorrect: true },
       { text: "Total memory in the system", isCorrect: false },
       { text: "Pages on disk", isCorrect: false },
       { text: "A scheduling algorithm", isCorrect: false },
     ],
   },
   {
     id: 73,
     title: "What is Two-Phase Locking (2PL)?",
     text: "Explain the Two-Phase Locking protocol.",
     difficulty: "Hard",
     subjectId: "dbms",
     topicId: "dbms-concurrency",
     answer: `## Two-Phase Locking (2PL)
 
 Concurrency control protocol ensuring serializability.
 
 ### Phases
 1. **Growing Phase**: Acquire locks, no releases
 2. **Shrinking Phase**: Release locks, no new acquisitions
 
 ### Variants
 - **Strict 2PL**: Hold all locks until commit
 - **Rigorous 2PL**: Hold all locks (read & write) until commit
 
 ### Guarantees
 - Ensures conflict serializability
 - Prevents lost updates, dirty reads`,
     options: [
       { text: "Protocol with growing phase (acquire) and shrinking phase (release)", isCorrect: true },
       { text: "Only one phase needed", isCorrect: false },
       { text: "Prevents all deadlocks", isCorrect: false },
       { text: "For memory management", isCorrect: false },
     ],
   },
   {
     id: 74,
     title: "What is ARP (Address Resolution Protocol)?",
     text: "Explain how ARP works.",
     difficulty: "Easy",
     subjectId: "cn",
     topicId: "cn-tcp",
     answer: `## ARP
 
 Maps IP addresses to MAC addresses on local network.
 
 ### Process
 1. Check ARP cache for mapping
 2. If not found, broadcast ARP request
 3. Target device responds with MAC address
 4. Cache the mapping
 
 ### ARP Table
 - Temporary cache of IP-to-MAC mappings
 - Entries expire after timeout
 
 ### Security Issue
 - ARP spoofing can redirect traffic`,
     options: [
       { text: "Maps IP addresses to MAC addresses using broadcast requests", isCorrect: true },
       { text: "Maps MAC to IP", isCorrect: false },
       { text: "A routing protocol", isCorrect: false },
       { text: "Used for DNS resolution", isCorrect: false },
     ],
   },
   {
     id: 75,
     title: "What is method overloading vs overriding?",
     text: "Explain the difference between overloading and overriding.",
     difficulty: "Easy",
     subjectId: "oops",
     topicId: "oops-polymorphism",
     answer: `## Overloading vs Overriding
 
 ### Overloading (Compile-time Polymorphism)
 - Same method name, different parameters
 - In same class
 - Resolved at compile time
 
 \`\`\`java
 void print(int x) { }
 void print(String s) { }
 \`\`\`
 
 ### Overriding (Runtime Polymorphism)
 - Same signature in parent and child
 - Different implementation in subclass
 - Resolved at runtime
 
 \`\`\`java
 class Animal { void speak() { } }
 class Dog extends Animal { @Override void speak() { } }
 \`\`\``,
     options: [
       { text: "Overloading: same name different params; Overriding: same signature in subclass", isCorrect: true },
       { text: "They are the same concept", isCorrect: false },
       { text: "Overriding is compile-time", isCorrect: false },
       { text: "Overloading requires inheritance", isCorrect: false },
     ],
   },
   {
     id: 76,
     title: "What is the Pumping Lemma for regular languages?",
     text: "Explain the Pumping Lemma and its use.",
     difficulty: "Hard",
     subjectId: "toc",
     topicId: "toc-automata",
     answer: `## Pumping Lemma
 
 Used to prove languages are NOT regular.
 
 ### Statement
 For regular language L, ∃ pumping length p such that:
 Any string s ∈ L with |s| ≥ p can be split into xyz where:
 1. |xy| ≤ p
 2. |y| > 0
 3. For all i ≥ 0: xy^iz ∈ L
 
 ### Usage
 To prove L is not regular:
 1. Assume L is regular
 2. Choose string based on p
 3. Show no valid split exists
 4. Contradiction → L not regular`,
     options: [
       { text: "Proves languages are NOT regular by showing no valid substring split exists", isCorrect: true },
       { text: "Proves languages ARE regular", isCorrect: false },
       { text: "Used for context-free languages only", isCorrect: false },
       { text: "A parsing technique", isCorrect: false },
     ],
   },
   {
     id: 77,
     title: "What is the difference between CSMA/CD and CSMA/CA?",
     text: "Explain these MAC protocols.",
     difficulty: "Medium",
     subjectId: "cn",
     topicId: "cn-tcp",
     answer: `## CSMA/CD vs CSMA/CA
 
 ### CSMA/CD (Collision Detection)
 - Used in wired Ethernet
 - Detects collision while transmitting
 - Stops and retransmits after backoff
 
 ### CSMA/CA (Collision Avoidance)
 - Used in wireless (WiFi)
 - Cannot detect collision while transmitting
 - Uses RTS/CTS handshake
 - ACK confirms receipt
 
 ### Why Different?
 Wireless: Hidden terminal problem, can't detect own collision.`,
     options: [
       { text: "CD detects collisions (wired), CA avoids them using RTS/CTS (wireless)", isCorrect: true },
       { text: "They are identical protocols", isCorrect: false },
       { text: "CA is used in wired networks", isCorrect: false },
       { text: "CD prevents all collisions", isCorrect: false },
     ],
   },
   {
     id: 78,
     title: "What is database recovery?",
     text: "Explain UNDO and REDO recovery operations.",
     difficulty: "Medium",
     subjectId: "dbms",
     topicId: "dbms-recovery",
     answer: `## Database Recovery
 
 Restoring database to consistent state after failure.
 
 ### UNDO (Rollback)
 - Reverse uncommitted transactions
 - Uses before-images from log
 - For transactions active at crash
 
 ### REDO (Roll-forward)
 - Reapply committed transactions
 - Uses after-images from log
 - For committed but not written to disk
 
 ### Write-Ahead Logging (WAL)
 Log record must be written before data page.
 Ensures recovery is possible.`,
     options: [
       { text: "UNDO reverses uncommitted, REDO reapplies committed transactions using logs", isCorrect: true },
       { text: "Recovery is not needed with SSDs", isCorrect: false },
       { text: "UNDO and REDO are the same", isCorrect: false },
       { text: "Only backup is needed", isCorrect: false },
     ],
   },
   {
     id: 79,
     title: "What is the Singleton design pattern?",
     text: "Explain Singleton and its implementation.",
     difficulty: "Easy",
     subjectId: "oops",
     topicId: "oops-patterns",
     answer: `## Singleton Pattern
 
 Ensures only ONE instance of a class exists.
 
 ### Implementation
 \`\`\`typescript
 class Singleton {
   private static instance: Singleton;
   private constructor() {}
   
   static getInstance(): Singleton {
     if (!Singleton.instance) {
       Singleton.instance = new Singleton();
     }
     return Singleton.instance;
   }
 }
 \`\`\`
 
 ### Use Cases
 - Database connection pool
 - Logger
 - Configuration manager
 - Thread pool`,
     options: [
       { text: "Ensures only one instance exists using private constructor and static method", isCorrect: true },
       { text: "Creates multiple instances", isCorrect: false },
       { text: "A structural pattern", isCorrect: false },
       { text: "Cannot be implemented in JavaScript", isCorrect: false },
     ],
   },
   {
     id: 80,
     title: "What is semantic analysis in compilers?",
     text: "Explain the role of semantic analysis.",
     difficulty: "Medium",
     subjectId: "compiler",
     topicId: "compiler-semantic",
     answer: `## Semantic Analysis
 
 Checks meaning and context after parsing.
 
 ### Tasks
 - **Type Checking**: Operand compatibility
 - **Scope Resolution**: Variable declarations
 - **Name Resolution**: Identifier lookup
 - **Array Bounds**: Static checks where possible
 
 ### Symbol Table
 Stores identifiers with their attributes:
 - Type, scope, memory location
 
 ### Example Errors
 \`\`\`c
 int x = "hello";  // Type mismatch
 y = 5;            // Undeclared variable
 foo(1, 2);        // Wrong argument count
 \`\`\``,
     options: [
       { text: "Checks meaning: type checking, scope resolution, name binding", isCorrect: true },
       { text: "Only checks syntax", isCorrect: false },
       { text: "Generates machine code", isCorrect: false },
       { text: "First phase of compilation", isCorrect: false },
     ],
   },
 ];
 
 // Helper functions
 export const getQuestionsBySubject = (subjectId: string): CSQuestion[] => {
   if (subjectId === "all") return csQuestions;
   return csQuestions.filter((q) => q.subjectId === subjectId);
 };
 
 export const getQuestionsByTopic = (questions: CSQuestion[], topicId: string): CSQuestion[] => {
   if (topicId === "all") return questions;
   return questions.filter((q) => q.topicId === topicId);
 };
 
 export const getQuestionsByDifficulty = (questions: CSQuestion[], difficulty: string): CSQuestion[] => {
   if (difficulty === "all") return questions;
   return questions.filter((q) => q.difficulty === difficulty);
 };
 
 export const searchQuestions = (questions: CSQuestion[], query: string): CSQuestion[] => {
   if (!query.trim()) return questions;
   const lowerQuery = query.toLowerCase();
   return questions.filter(
     (q) =>
       q.title.toLowerCase().includes(lowerQuery) ||
       q.text.toLowerCase().includes(lowerQuery) ||
       q.answer.toLowerCase().includes(lowerQuery)
   );
 };
 
 export const getSubjectName = (subjectId: string): string => {
   return csSubjects.find((s) => s.id === subjectId)?.name || subjectId;
 };
 
 export const getTopicName = (topicId: string): string => {
   return csTopics.find((t) => t.id === topicId)?.name || topicId;
 };
 
 export const getTopicsBySubject = (subjectId: string): CSTopic[] => {
   return csTopics.filter((t) => t.subjectId === subjectId);
 };
 
 export const getDifficultyStats = () => {
   const easy = csQuestions.filter((q) => q.difficulty === "Easy").length;
   const medium = csQuestions.filter((q) => q.difficulty === "Medium").length;
   const hard = csQuestions.filter((q) => q.difficulty === "Hard").length;
   return { easy, medium, hard, total: csQuestions.length };
 };