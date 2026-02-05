 // Handwritten Notes Data - Community contributed study materials
 
 export interface Note {
   id: number;
   title: string;
   description: string;
   subject: string;
   pages: number;
   author: string;
   downloads: number;
   rating: number;
   fileUrl: string;
   thumbnailUrl?: string;
   tags: string[];
   uploadedAt: string;
   fileSize: string;
 }
 
 export interface NoteSubject {
   id: string;
   name: string;
   noteCount: number;
   icon: string;
 }
 
 export const noteSubjects: NoteSubject[] = [
   { id: "dsa", name: "Data Structures & Algorithms", noteCount: 12, icon: "Binary" },
   { id: "dbms", name: "Database Management", noteCount: 8, icon: "Database" },
   { id: "os", name: "Operating Systems", noteCount: 10, icon: "Monitor" },
   { id: "cn", name: "Computer Networks", noteCount: 9, icon: "Network" },
   { id: "oops", name: "Object-Oriented Programming", noteCount: 7, icon: "Boxes" },
   { id: "sd", name: "System Design", noteCount: 6, icon: "Layers" },
   { id: "web", name: "Web Development", noteCount: 8, icon: "Globe" },
   { id: "aptitude", name: "Aptitude & Reasoning", noteCount: 5, icon: "Brain" },
 ];
 
 export const notes: Note[] = [
   // DSA Notes
   {
     id: 1,
     title: "Complete DSA Handwritten Notes",
     description: "Comprehensive notes covering all data structures and algorithms with examples, time complexities, and practice problems.",
     subject: "dsa",
     pages: 120,
     author: "PrepPath Community",
     downloads: 15200,
     rating: 4.8,
     fileUrl: "#",
     tags: ["Arrays", "LinkedList", "Trees", "Graphs", "DP", "Sorting"],
     uploadedAt: "2024-01-15",
     fileSize: "25 MB",
   },
   {
     id: 2,
     title: "Dynamic Programming Masterclass",
     description: "In-depth DP notes with 50+ problems, patterns, and optimization techniques.",
     subject: "dsa",
     pages: 45,
     author: "PrepPath Community",
     downloads: 8900,
     rating: 4.9,
     fileUrl: "#",
     tags: ["DP", "Memoization", "Tabulation", "Patterns"],
     uploadedAt: "2024-02-20",
     fileSize: "12 MB",
   },
   {
     id: 3,
     title: "Graph Algorithms Visual Guide",
     description: "Visual explanations of BFS, DFS, Dijkstra, Bellman-Ford, and more with step-by-step diagrams.",
     subject: "dsa",
     pages: 38,
     author: "PrepPath Community",
     downloads: 6700,
     rating: 4.7,
     fileUrl: "#",
     tags: ["Graphs", "BFS", "DFS", "Shortest Path"],
     uploadedAt: "2024-03-10",
     fileSize: "18 MB",
   },
   // DBMS Notes
   {
     id: 4,
     title: "DBMS Complete Handwritten Notes",
     description: "Covers normalization, SQL, transactions, indexing, and database design with diagrams.",
     subject: "dbms",
     pages: 85,
     author: "PrepPath Community",
     downloads: 11500,
     rating: 4.6,
     fileUrl: "#",
     tags: ["SQL", "Normalization", "ACID", "Indexing", "ER Diagrams"],
     uploadedAt: "2024-01-20",
     fileSize: "20 MB",
   },
   {
     id: 5,
     title: "SQL Query Cheat Sheet",
     description: "Quick reference for all SQL commands, joins, subqueries, and window functions.",
     subject: "dbms",
     pages: 25,
     author: "PrepPath Community",
     downloads: 9200,
     rating: 4.8,
     fileUrl: "#",
     tags: ["SQL", "Queries", "Joins", "Window Functions"],
     uploadedAt: "2024-02-15",
     fileSize: "5 MB",
   },
   // OS Notes
   {
     id: 6,
     title: "Operating Systems Concepts",
     description: "Comprehensive OS notes covering processes, memory management, file systems, and more.",
     subject: "os",
     pages: 95,
     author: "PrepPath Community",
     downloads: 10800,
     rating: 4.7,
     fileUrl: "#",
     tags: ["Processes", "Memory", "Scheduling", "Deadlocks", "File Systems"],
     uploadedAt: "2024-01-25",
     fileSize: "22 MB",
   },
   {
     id: 7,
     title: "CPU Scheduling Algorithms",
     description: "Detailed notes on FCFS, SJF, Round Robin, Priority with solved examples and Gantt charts.",
     subject: "os",
     pages: 30,
     author: "PrepPath Community",
     downloads: 7600,
     rating: 4.5,
     fileUrl: "#",
     tags: ["Scheduling", "FCFS", "SJF", "Round Robin"],
     uploadedAt: "2024-03-05",
     fileSize: "8 MB",
   },
   // CN Notes
   {
     id: 8,
     title: "Computer Networks Short Notes",
     description: "Concise notes covering OSI model, TCP/IP, routing, and network security.",
     subject: "cn",
     pages: 60,
     author: "PrepPath Community",
     downloads: 8900,
     rating: 4.6,
     fileUrl: "#",
     tags: ["OSI", "TCP/IP", "Routing", "DNS", "HTTP"],
     uploadedAt: "2024-02-01",
     fileSize: "15 MB",
   },
   {
     id: 9,
     title: "Network Protocols Deep Dive",
     description: "Detailed exploration of HTTP, HTTPS, FTP, SMTP, and other application layer protocols.",
     subject: "cn",
     pages: 40,
     author: "PrepPath Community",
     downloads: 5400,
     rating: 4.4,
     fileUrl: "#",
     tags: ["HTTP", "HTTPS", "FTP", "SMTP", "Protocols"],
     uploadedAt: "2024-03-20",
     fileSize: "10 MB",
   },
   // OOPs Notes
   {
     id: 10,
     title: "OOPs in Java Complete Guide",
     description: "Object-oriented programming concepts with Java examples and design patterns.",
     subject: "oops",
     pages: 55,
     author: "PrepPath Community",
     downloads: 9500,
     rating: 4.7,
     fileUrl: "#",
     tags: ["Java", "Inheritance", "Polymorphism", "Encapsulation", "Abstraction"],
     uploadedAt: "2024-01-30",
     fileSize: "14 MB",
   },
   {
     id: 11,
     title: "Design Patterns Illustrated",
     description: "Visual guide to 23 GoF design patterns with real-world examples.",
     subject: "oops",
     pages: 70,
     author: "PrepPath Community",
     downloads: 6200,
     rating: 4.8,
     fileUrl: "#",
     tags: ["Patterns", "Singleton", "Factory", "Observer", "Strategy"],
     uploadedAt: "2024-02-25",
     fileSize: "18 MB",
   },
   // System Design Notes
   {
     id: 12,
     title: "System Design Fundamentals",
     description: "Introduction to system design concepts, scalability, load balancing, and caching.",
     subject: "sd",
     pages: 75,
     author: "PrepPath Community",
     downloads: 12300,
     rating: 4.9,
     fileUrl: "#",
     tags: ["Scalability", "Load Balancing", "Caching", "Database Sharding"],
     uploadedAt: "2024-02-10",
     fileSize: "20 MB",
   },
   {
     id: 13,
     title: "Microservices Architecture",
     description: "Comprehensive guide to microservices, API gateways, service discovery, and containerization.",
     subject: "sd",
     pages: 50,
     author: "PrepPath Community",
     downloads: 7800,
     rating: 4.6,
     fileUrl: "#",
     tags: ["Microservices", "Docker", "Kubernetes", "API Gateway"],
     uploadedAt: "2024-03-15",
     fileSize: "13 MB",
   },
   // Web Development Notes
   {
     id: 14,
     title: "JavaScript Interview Notes",
     description: "Essential JavaScript concepts for interviews: closures, promises, async/await, and more.",
     subject: "web",
     pages: 45,
     author: "PrepPath Community",
     downloads: 11000,
     rating: 4.8,
     fileUrl: "#",
     tags: ["JavaScript", "Closures", "Promises", "Async/Await", "ES6"],
     uploadedAt: "2024-01-18",
     fileSize: "11 MB",
   },
   {
     id: 15,
     title: "React.js Complete Cheatsheet",
     description: "Quick reference for React hooks, state management, and component patterns.",
     subject: "web",
     pages: 35,
     author: "PrepPath Community",
     downloads: 8700,
     rating: 4.7,
     fileUrl: "#",
     tags: ["React", "Hooks", "Redux", "Context API"],
     uploadedAt: "2024-02-28",
     fileSize: "9 MB",
   },
   // Aptitude Notes
   {
     id: 16,
     title: "Quantitative Aptitude Formulas",
     description: "All formulas and shortcuts for aptitude tests with solved examples.",
     subject: "aptitude",
     pages: 40,
     author: "PrepPath Community",
     downloads: 14500,
     rating: 4.6,
     fileUrl: "#",
     tags: ["Formulas", "Shortcuts", "Number System", "Percentages"],
     uploadedAt: "2024-01-22",
     fileSize: "10 MB",
   },
   {
     id: 17,
     title: "Logical Reasoning Patterns",
     description: "Common reasoning patterns, puzzles, and analytical problems with solutions.",
     subject: "aptitude",
     pages: 55,
     author: "PrepPath Community",
     downloads: 9800,
     rating: 4.5,
     fileUrl: "#",
     tags: ["Reasoning", "Puzzles", "Blood Relations", "Seating Arrangement"],
     uploadedAt: "2024-02-05",
     fileSize: "12 MB",
   },
 ];
 
 // Helper functions
 export const getNotesBySubject = (subjectId: string): Note[] => {
   if (subjectId === "all") return notes;
   return notes.filter((n) => n.subject === subjectId);
 };
 
 export const searchNotes = (notesList: Note[], query: string): Note[] => {
   if (!query.trim()) return notesList;
   const lowerQuery = query.toLowerCase();
   return notesList.filter(
     (n) =>
       n.title.toLowerCase().includes(lowerQuery) ||
       n.description.toLowerCase().includes(lowerQuery) ||
       n.tags.some((t) => t.toLowerCase().includes(lowerQuery))
   );
 };
 
 export const sortNotes = (notesList: Note[], sortBy: string): Note[] => {
   switch (sortBy) {
     case "downloads":
       return [...notesList].sort((a, b) => b.downloads - a.downloads);
     case "rating":
       return [...notesList].sort((a, b) => b.rating - a.rating);
     case "newest":
       return [...notesList].sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
     case "pages":
       return [...notesList].sort((a, b) => b.pages - a.pages);
     default:
       return notesList;
   }
 };
 
 export const getSubjectName = (subjectId: string): string => {
   return noteSubjects.find((s) => s.id === subjectId)?.name || subjectId;
 };
 
 export const getTotalDownloads = (): number => {
   return notes.reduce((acc, n) => acc + n.downloads, 0);
 };
 
 export const getTotalPages = (): number => {
   return notes.reduce((acc, n) => acc + n.pages, 0);
 };