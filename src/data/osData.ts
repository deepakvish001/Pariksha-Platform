import { Section } from "./dsaLevel1Types";

const importanceTodifficulty = (imp: string): "Easy" | "Medium" | "Hard" => {
  if (imp === "Very High") return "Hard";
  if (imp === "High") return "Medium";
  return "Easy";
};

const estTimeMap: Record<string, string> = {
  Easy: "10 min",
  Medium: "15 min",
  Hard: "20 min",
};

interface RawQ {
  topic: string;
  question: string;
  importance: string;
}

const raw: RawQ[] = [
  { topic: "Introduction & Basics", question: "What is an Operating System? What is its main purpose?", importance: "Very High" },
  { topic: "Introduction & Basics", question: "Discuss different types of OS (Batch, Distributed, Multitasking, Network, Real-Time, Mobile)", importance: "Very High" },
  { topic: "Introduction & Basics", question: "What are the functions of an Operating System?", importance: "High" },
  { topic: "Introduction & Basics", question: "What is a Kernel? Types of Kernels", importance: "Very High" },
  { topic: "Introduction & Basics", question: "What is a Monolithic Kernel?", importance: "High" },
  { topic: "Introduction & Basics", question: "What is a Microkernel? Difference between Monolithic and Microkernel", importance: "High" },
  { topic: "Introduction & Basics", question: "What is a Socket?", importance: "High" },
  { topic: "Introduction & Basics", question: "What is the difference between User Mode and Kernel Mode?", importance: "Very High" },
  { topic: "Introduction & Basics", question: "What is a System Call? Give examples", importance: "Very High" },
  { topic: "Introduction & Basics", question: "Types of System Calls (Process, File, Device, Information, Communication)", importance: "High" },
  { topic: "Introduction & Basics", question: "What is a Shell?", importance: "Medium" },
  { topic: "Introduction & Basics", question: "What is Bootstrapping (Booting Process)?", importance: "Medium" },
  { topic: "Introduction & Basics", question: "What is BIOS?", importance: "Medium" },
  { topic: "Process Management", question: "What is a Process?", importance: "Very High" },
  { topic: "Process Management", question: "What is a Program? Difference between Process and Program", importance: "Very High" },
  { topic: "Process Management", question: "What is a Thread? Difference between Process and Thread", importance: "Very High" },
  { topic: "Process Management", question: "What is a PCB (Process Control Block)? What does it contain?", importance: "Very High" },
  { topic: "Process Management", question: "What are the different states of a Process? (New, Ready, Running, Waiting, Terminated)", importance: "Very High" },
  { topic: "Process Management", question: "What is Process Scheduling? Types of Schedulers (Long-term, Short-term, Medium-term)", importance: "Very High" },
  { topic: "Process Management", question: "What is Context Switching?", importance: "Very High" },
  { topic: "Process Management", question: "What is the difference between Preemptive and Non-Preemptive Scheduling?", importance: "Very High" },
  { topic: "Process Management", question: "What is an Orphan Process?", importance: "High" },
  { topic: "Process Management", question: "What is a Zombie Process?", importance: "High" },
  { topic: "Process Management", question: "What is a Daemon Process?", importance: "Medium" },
  { topic: "Process Management", question: "What is fork() system call?", importance: "High" },
  { topic: "Process Management", question: "What is Inter-Process Communication (IPC)?", importance: "Very High" },
  { topic: "Process Management", question: "IPC Methods: Shared Memory, Message Passing, Pipes, Sockets", importance: "Very High" },
  { topic: "Process Management", question: "What is the difference between Shared Memory and Message Passing?", importance: "High" },
  { topic: "Process Management", question: "What is a Pipe? Difference between Named Pipe and Unnamed Pipe", importance: "Medium" },
  { topic: "Threads & Multithreading", question: "What is a Thread? Why use Threads?", importance: "Very High" },
  { topic: "Threads & Multithreading", question: "Difference between Process and Thread", importance: "Very High" },
  { topic: "Threads & Multithreading", question: "What is Multithreading?", importance: "Very High" },
  { topic: "Threads & Multithreading", question: "Types of Threads: User-Level Threads vs Kernel-Level Threads", importance: "Very High" },
  { topic: "Threads & Multithreading", question: "Multithreading Models: Many-to-One, One-to-One, Many-to-Many", importance: "High" },
  { topic: "Threads & Multithreading", question: "Benefits of Multithreading", importance: "High" },
  { topic: "Threads & Multithreading", question: "What is a Thread Pool?", importance: "High" },
  { topic: "Threads & Multithreading", question: "Difference between Concurrency and Parallelism", importance: "Very High" },
  { topic: "Threads & Multithreading", question: "What is a Race Condition?", importance: "Very High" },
  { topic: "Threads & Multithreading", question: "What is Thread Safety?", importance: "High" },
  { topic: "CPU Scheduling", question: "What is CPU Scheduling? Why is it needed?", importance: "Very High" },
  { topic: "CPU Scheduling", question: "What is Arrival Time, Burst Time, Completion Time, Turnaround Time, Waiting Time, Response Time?", importance: "Very High" },
  { topic: "CPU Scheduling", question: "What is FCFS (First Come First Serve) Scheduling?", importance: "Very High" },
  { topic: "CPU Scheduling", question: "What is SJF (Shortest Job First) Scheduling? Preemptive & Non-Preemptive", importance: "Very High" },
  { topic: "CPU Scheduling", question: "What is SRTF (Shortest Remaining Time First)?", importance: "High" },
  { topic: "CPU Scheduling", question: "What is Round Robin Scheduling? Effect of Time Quantum", importance: "Very High" },
  { topic: "CPU Scheduling", question: "What is Priority Scheduling? Preemptive & Non-Preemptive", importance: "Very High" },
  { topic: "CPU Scheduling", question: "What is Multilevel Queue Scheduling?", importance: "High" },
  { topic: "CPU Scheduling", question: "What is Multilevel Feedback Queue Scheduling?", importance: "High" },
  { topic: "CPU Scheduling", question: "What is Starvation? How to solve it? (Aging)", importance: "Very High" },
  { topic: "CPU Scheduling", question: "What is Convoy Effect?", importance: "High" },
  { topic: "CPU Scheduling", question: "Comparison of all CPU Scheduling Algorithms", importance: "Very High" },
  { topic: "Process Synchronization", question: "What is Process Synchronization? Why is it needed?", importance: "Very High" },
  { topic: "Process Synchronization", question: "What is the Critical Section Problem?", importance: "Very High" },
  { topic: "Process Synchronization", question: "What are the conditions for Critical Section Solution? (Mutual Exclusion, Progress, Bounded Waiting)", importance: "Very High" },
  { topic: "Process Synchronization", question: "What is a Mutex (Mutual Exclusion)?", importance: "Very High" },
  { topic: "Process Synchronization", question: "What is a Semaphore? Types (Binary, Counting)", importance: "Very High" },
  { topic: "Process Synchronization", question: "Difference between Mutex and Semaphore", importance: "Very High" },
  { topic: "Process Synchronization", question: "What is a Spin Lock?", importance: "High" },
  { topic: "Process Synchronization", question: "Difference between Mutex and Spin Lock", importance: "High" },
  { topic: "Process Synchronization", question: "What is Peterson's Solution?", importance: "High" },
  { topic: "Process Synchronization", question: "What is the Producer-Consumer Problem?", importance: "Very High" },
  { topic: "Process Synchronization", question: "What is the Readers-Writers Problem?", importance: "High" },
  { topic: "Process Synchronization", question: "What is the Dining Philosophers Problem?", importance: "High" },
  { topic: "Process Synchronization", question: "What is a Monitor?", importance: "High" },
  { topic: "Process Synchronization", question: "What is Priority Inversion?", importance: "Medium" },
  { topic: "Process Synchronization", question: "What is Priority Inheritance?", importance: "Medium" },
  { topic: "Deadlocks", question: "What is a Deadlock?", importance: "Very High" },
  { topic: "Deadlocks", question: "What are the necessary conditions for Deadlock? (Mutual Exclusion, Hold & Wait, No Preemption, Circular Wait)", importance: "Very High" },
  { topic: "Deadlocks", question: "What is Deadlock Prevention? How to prevent each condition?", importance: "Very High" },
  { topic: "Deadlocks", question: "What is Deadlock Avoidance?", importance: "Very High" },
  { topic: "Deadlocks", question: "What is the Banker's Algorithm?", importance: "Very High" },
  { topic: "Deadlocks", question: "What is a Safe State vs Unsafe State?", importance: "Very High" },
  { topic: "Deadlocks", question: "What is a Resource Allocation Graph (RAG)?", importance: "High" },
  { topic: "Deadlocks", question: "What is Deadlock Detection?", importance: "High" },
  { topic: "Deadlocks", question: "What is Deadlock Recovery?", importance: "High" },
  { topic: "Deadlocks", question: "Difference between Deadlock Prevention and Deadlock Avoidance", importance: "High" },
  { topic: "Deadlocks", question: "Difference between Starvation and Deadlock", importance: "High" },
  { topic: "Deadlocks", question: "What is Livelock?", importance: "Medium" },
  { topic: "Memory Management", question: "What is Memory Management? Why is it needed?", importance: "Very High" },
  { topic: "Memory Management", question: "What is Main Memory (RAM)? How is it organized?", importance: "High" },
  { topic: "Memory Management", question: "What is Contiguous Memory Allocation?", importance: "High" },
  { topic: "Memory Management", question: "What is Fixed Partitioning vs Variable Partitioning?", importance: "High" },
  { topic: "Memory Management", question: "What is Internal Fragmentation?", importance: "Very High" },
  { topic: "Memory Management", question: "What is External Fragmentation?", importance: "Very High" },
  { topic: "Memory Management", question: "Difference between Internal and External Fragmentation", importance: "Very High" },
  { topic: "Memory Management", question: "What is Compaction?", importance: "Medium" },
  { topic: "Memory Management", question: "What is Paging?", importance: "Very High" },
  { topic: "Memory Management", question: "What is a Page Table?", importance: "Very High" },
  { topic: "Memory Management", question: "What is a Page Fault?", importance: "Very High" },
  { topic: "Memory Management", question: "What is Segmentation?", importance: "High" },
  { topic: "Memory Management", question: "Difference between Paging and Segmentation", importance: "Very High" },
  { topic: "Memory Management", question: "What is Logical Address vs Physical Address?", importance: "Very High" },
  { topic: "Memory Management", question: "What is the MMU (Memory Management Unit)?", importance: "High" },
  { topic: "Memory Management", question: "What is a TLB (Translation Lookaside Buffer)?", importance: "Very High" },
  { topic: "Memory Management", question: "What is Swapping?", importance: "High" },
  { topic: "Virtual Memory", question: "What is Virtual Memory? Why is it needed?", importance: "Very High" },
  { topic: "Virtual Memory", question: "How does Virtual Memory work?", importance: "Very High" },
  { topic: "Virtual Memory", question: "What is Demand Paging?", importance: "Very High" },
  { topic: "Virtual Memory", question: "Page Replacement Algorithms: FIFO, LRU, Optimal", importance: "Very High" },
  { topic: "Virtual Memory", question: "What is FIFO Page Replacement? What is Belady's Anomaly?", importance: "Very High" },
  { topic: "Virtual Memory", question: "What is LRU (Least Recently Used) Page Replacement?", importance: "Very High" },
  { topic: "Virtual Memory", question: "What is Optimal Page Replacement?", importance: "High" },
  { topic: "Virtual Memory", question: "Comparison of Page Replacement Algorithms", importance: "High" },
  { topic: "Virtual Memory", question: "What is Thrashing? Causes and Solutions", importance: "Very High" },
  { topic: "Virtual Memory", question: "What is the Working Set Model?", importance: "Medium" },
  { topic: "Virtual Memory", question: "What is a Copy-on-Write (COW)?", importance: "High" },
  { topic: "File Systems", question: "What is a File System?", importance: "High" },
  { topic: "File Systems", question: "What are File Attributes? (Name, Type, Size, Location, Protection)", importance: "Medium" },
  { topic: "File Systems", question: "What is a File Allocation Table (FAT)?", importance: "Medium" },
  { topic: "File Systems", question: "File Allocation Methods: Contiguous, Linked, Indexed", importance: "High" },
  { topic: "File Systems", question: "What is a Directory? Types (Single-Level, Two-Level, Tree-Structured)", importance: "High" },
  { topic: "File Systems", question: "What is an Inode?", importance: "High" },
  { topic: "File Systems", question: "What is RAID? Types of RAID (0, 1, 5, 6, 10)", importance: "Very High" },
  { topic: "File Systems", question: "What is Journaling File System?", importance: "Medium" },
  { topic: "File Systems", question: "Difference between ext3, ext4, NTFS, and FAT32", importance: "Medium" },
  { topic: "Disk Scheduling", question: "What is Disk Scheduling? Why is it needed?", importance: "High" },
  { topic: "Disk Scheduling", question: "What is FCFS Disk Scheduling?", importance: "High" },
  { topic: "Disk Scheduling", question: "What is SSTF (Shortest Seek Time First)?", importance: "High" },
  { topic: "Disk Scheduling", question: "What is SCAN (Elevator Algorithm)?", importance: "High" },
  { topic: "Disk Scheduling", question: "What is C-SCAN (Circular SCAN)?", importance: "High" },
  { topic: "Disk Scheduling", question: "What is LOOK and C-LOOK?", importance: "Medium" },
  { topic: "Disk Scheduling", question: "Comparison of Disk Scheduling Algorithms", importance: "High" },
  { topic: "Miscellaneous", question: "What is the difference between 32-bit and 64-bit OS?", importance: "High" },
  { topic: "Miscellaneous", question: "What is Real-Time Operating System (RTOS)? Hard vs Soft Real-Time", importance: "High" },
  { topic: "Miscellaneous", question: "What is a Cache? Difference between Cache and RAM", importance: "Very High" },
  { topic: "Miscellaneous", question: "What is Cache Mapping? (Direct, Associative, Set-Associative)", importance: "High" },
  { topic: "Miscellaneous", question: "What is Memory Hierarchy? (Registers → Cache → RAM → Disk)", importance: "High" },
  { topic: "Miscellaneous", question: "What is DMA (Direct Memory Access)?", importance: "Medium" },
  { topic: "Miscellaneous", question: "What is an Interrupt? Types (Hardware, Software)", importance: "High" },
  { topic: "Miscellaneous", question: "What is Spooling?", importance: "Medium" },
  { topic: "Miscellaneous", question: "What is the difference between Process-based and Thread-based Multitasking?", importance: "Medium" },
  { topic: "Miscellaneous", question: "What is System Throughput?", importance: "Medium" },
  { topic: "Miscellaneous", question: "What is Busy Waiting (Spinlock vs Sleep)?", importance: "Medium" },
  { topic: "Miscellaneous", question: "What is Fragmentation in OS context?", importance: "High" },
  { topic: "Miscellaneous", question: "What is the difference between Multiprogramming, Multitasking, Multiprocessing, and Multithreading?", importance: "Very High" },
];

// Group by topic
const topicGroups = new Map<string, RawQ[]>();
raw.forEach((q) => {
  if (!topicGroups.has(q.topic)) topicGroups.set(q.topic, []);
  topicGroups.get(q.topic)!.push(q);
});

let globalIdx = 0;
export const osSections: Section[] = Array.from(topicGroups.entries()).map(
  ([topicName, questions], sIdx) => ({
    id: `os-section-${sIdx + 1}`,
    title: topicName,
    subSections: [
      {
        id: `os-sub-${sIdx + 1}-1`,
        title: topicName,
        topics: questions.map((q) => {
          globalIdx++;
          const diff = importanceTodifficulty(q.importance);
          return {
            id: `os-${globalIdx}`,
            title: q.question,
            completed: false,
            difficulty: diff,
            resourceType: "youtube" as const,
            resourceUrl: `https://www.youtube.com/results?search_query=Operating+System+${encodeURIComponent(q.question.replace(/[?]/g, ""))}`,
            articleUrl: `https://www.google.com/search?q=OS+${encodeURIComponent(q.question.replace(/[?]/g, ""))}`,
            note: `Importance: ${q.importance}`,
            isRevision: false,
            estTime: estTimeMap[diff],
          };
        }),
      },
    ],
  })
);

export const osMeta = {
  id: "os-sheet",
  title: "Operating Systems Interview Sheet",
  totalProblems: raw.length,
  easy: raw.filter((q) => q.importance === "Medium").length,
  medium: raw.filter((q) => q.importance === "High").length,
  hard: raw.filter((q) => q.importance === "Very High").length,
};
