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
   { id: "os", name: "Operating Systems", icon: "Monitor", questionCount: 45, importance: "High" },
   { id: "dbms", name: "Database Management", icon: "Database", questionCount: 40, importance: "High" },
   { id: "cn", name: "Computer Networks", icon: "Network", questionCount: 42, importance: "High" },
   { id: "oops", name: "Object-Oriented Programming", icon: "Boxes", questionCount: 35, importance: "Critical" },
   { id: "toc", name: "Theory of Computation", icon: "Binary", questionCount: 25, importance: "Medium" },
   { id: "compiler", name: "Compiler Design", icon: "Code", questionCount: 20, importance: "Medium" },
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