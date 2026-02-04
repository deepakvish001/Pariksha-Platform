// Types for company detail data
export type Difficulty = "Easy" | "Medium" | "Hard";

export interface Question {
  id: number;
  text: string;
  description?: string;
  difficulty: Difficulty;
  category?: string;
  answer?: string;
}

export interface JobPortal {
  id: number;
  name: string;
  description: string;
  location: string;
  url?: string;
}

export interface Project {
  id: number;
  title: string;
  description: string;
  technologies: string[];
}

export interface ResumeTemplate {
  id: number;
  name: string;
  style: string;
  imageUrl?: string;
}

export interface ColdDM {
  id: number;
  title: string;
  message: string;
  category: string;
}

// Tab categories for company detail
export const companyTabs = [
  { id: "sql-questions", name: "SQL Questions" },
  { id: "interview-questions", name: "Interview Questions" },
  { id: "job-portals", name: "Job Portals" },
  { id: "dsa-questions", name: "DSA Questions" },
  { id: "aptitude-questions", name: "Aptitude Questions" },
  { id: "projects", name: "Projects" },
  { id: "resume-templates", name: "Resume Templates" },
  { id: "cold-dms", name: "Cold DMs" },
];

// SQL Questions - shared across companies
export const sqlQuestions: Question[] = [
  {
    id: 1,
    text: "What is SQL and why is it important?",
    description: "SQL (Structured Query Language) is used to manage and manipulate relational databases. It allows developers to create, read, update, and delete data efficiently. It's essential because almost all modern applications rely on structured data storage and retrieval.",
    difficulty: "Easy",
    category: "Basics",
  },
  {
    id: 2,
    text: "What is the difference between SQL and MySQL?",
    description: "SQL is a language for querying databases, whereas MySQL is a database management system that implements SQL. In short, SQL is the language; MySQL is a tool that uses it to manage databases.",
    difficulty: "Easy",
    category: "Basics",
  },
  {
    id: 3,
    text: "What are the different types of SQL commands?",
    description: "SQL commands are grouped into categories: DDL (Data Definition Language), DML (Data Manipulation Language), DCL (Data Control Language), TCL (Transaction Control Language), and DQL (Data Query Language). Each type performs a unique database operation.",
    difficulty: "Easy",
    category: "Basics",
  },
  {
    id: 4,
    text: "What is the difference between WHERE and HAVING clauses?",
    description: "WHERE filters rows before aggregation, while HAVING filters groups after aggregation. You use WHERE with raw data and HAVING with aggregated results like SUM or COUNT, often combined with GROUP BY.",
    difficulty: "Medium",
    category: "Filtering",
  },
  {
    id: 5,
    text: "Explain primary key and foreign key.",
    description: "A primary key uniquely identifies each record in a table. A foreign key establishes a link between two tables by referencing the primary key of another table, enforcing relational integrity between data sets.",
    difficulty: "Easy",
    category: "Constraints",
  },
  {
    id: 6,
    text: "What is normalization in SQL?",
    description: "Normalization organizes data to reduce redundancy and improve data integrity. It divides tables into smaller, related tables and uses relationships to maintain data consistency. The main forms include 1NF, 2NF, and 3NF.",
    difficulty: "Medium",
    category: "Database Design",
  },
  {
    id: 7,
    text: "What is denormalization?",
    description: "Denormalization combines tables to improve read performance. It introduces controlled redundancy to reduce complex joins during queries, often used in reporting or analytics databases where read speed is prioritized over updates.",
    difficulty: "Medium",
    category: "Database Design",
  },
  {
    id: 8,
    text: "What are joins in SQL?",
    description: "Joins combine rows from multiple tables based on related columns. Common joins include INNER, LEFT, RIGHT, and FULL JOIN. They allow complex queries across tables, enabling data relationships to be queried efficiently.",
    difficulty: "Easy",
    category: "Joins",
  },
  {
    id: 9,
    text: "Explain INNER JOIN.",
    description: "INNER JOIN returns only the rows that have matching values in both tables. It's used when you want data that exists in both tables based on a common column.",
    difficulty: "Easy",
    category: "Joins",
  },
  {
    id: 10,
    text: "Explain LEFT JOIN.",
    description: "LEFT JOIN returns all records from the left table and matched records from the right table. If no match exists, NULL values are shown for columns from the right table.",
    difficulty: "Easy",
    category: "Joins",
  },
  {
    id: 11,
    text: "What is a subquery?",
    description: "A subquery is a query nested inside another SQL query. It can return single or multiple values and is often used to filter, calculate, or compare data dynamically based on another query.",
    difficulty: "Medium",
    category: "Subqueries",
  },
  {
    id: 12,
    text: "What are indexes in SQL?",
    description: "Indexes improve the speed of data retrieval by creating a data structure for quick lookups. They act like a book index, allowing faster access to rows based on column values but increase storage and write overhead.",
    difficulty: "Medium",
    category: "Optimization",
  },
  {
    id: 13,
    text: "What is the difference between clustered and non-clustered indexes?",
    description: "A clustered index sorts and stores the actual data rows in order, while a non-clustered index creates a separate structure pointing to data locations. A table can have only one clustered index.",
    difficulty: "Medium",
    category: "Optimization",
  },
  {
    id: 14,
    text: "What is a view in SQL?",
    description: "A view is a virtual table created from a query. It stores no physical data but allows users to simplify complex queries, enhance security, and present specific data subsets.",
    difficulty: "Easy",
    category: "Views",
  },
  {
    id: 15,
    text: "Explain ACID properties.",
    description: "ACID stands for Atomicity, Consistency, Isolation, and Durability — the four principles ensuring reliable transaction processing. They guarantee that transactions are processed completely or not at all, maintaining data integrity.",
    difficulty: "Hard",
    category: "Transactions",
  },
  {
    id: 16,
    text: "What is a transaction?",
    description: "A transaction is a set of operations that execute as a single unit. If any part fails, the entire transaction is rolled back to maintain data integrity. It's crucial in banking or financial systems.",
    difficulty: "Medium",
    category: "Transactions",
  },
  {
    id: 17,
    text: "What is the difference between DELETE, TRUNCATE, and DROP?",
    description: "DELETE removes specific rows, TRUNCATE removes all rows but keeps the table structure, and DROP removes the entire table from the database. DELETE can use conditions; the others cannot.",
    difficulty: "Medium",
    category: "Data Manipulation",
  },
  {
    id: 18,
    text: "What are constraints in SQL?",
    description: "Constraints enforce rules on data in tables. Common ones are PRIMARY KEY, FOREIGN KEY, UNIQUE, NOT NULL, CHECK, and DEFAULT. They maintain data accuracy and prevent invalid entries.",
    difficulty: "Easy",
    category: "Constraints",
  },
  {
    id: 19,
    text: "What is the difference between UNION and UNION ALL?",
    description: "UNION combines results and removes duplicates, while UNION ALL includes duplicates. UNION requires extra processing for distinct filtering, whereas UNION ALL is faster since it skips duplicate checks.",
    difficulty: "Medium",
    category: "Set Operations",
  },
  {
    id: 20,
    text: "What is a stored procedure?",
    description: "A stored procedure is a group of SQL statements stored in the database. It's reusable, improves performance, and adds security by reducing direct data manipulation through user queries.",
    difficulty: "Medium",
    category: "Procedures",
  },
];

// Interview Questions - shared across companies
export const interviewQuestions: Question[] = [
  {
    id: 1,
    text: "What is the difference between JDK, JRE, and JVM?",
    description: "Think of it like a car factory.\n\nJVM (Engine): This runs the code. It is the engine inside the car.\n\nJRE: Contains JVM + libraries needed to run Java apps.\n\nJDK: Contains JRE + development tools (compiler, debugger).",
    difficulty: "Easy",
  },
  {
    id: 2,
    text: "Explain 'public static void main' method.",
    description: "This is the front door of your program.\n\npublic: Anyone can enter (the computer needs to find it).\n\nstatic: No need to create an object to use it.\n\nvoid: Returns nothing.\n\nmain: The starting point of execution.",
    difficulty: "Easy",
  },
  {
    id: 3,
    text: "What are the 4 pillars of OOP?",
    description: "1. Encapsulation (Protection): Like a capsule. You hide the medicine inside. You protect your data with private and only let people touch it safely.\n\n2. Inheritance (Family): A child gets traits from parents. A Dog class gets code from Animal class.\n\n3. Polymorphism (Many Forms): Same action, different behavior. speak() for Dog says 'Bark', for Cat says 'Meow'.\n\n4. Abstraction (Simplification): You don't need to know how a car engine works to drive it.",
    difficulty: "Easy",
  },
  {
    id: 4,
    text: "Difference between '==' and '.equals()'?",
    description: "'==' (Address Check): Checks if two things are the exact same physical object. Imagine two identical twin brothers. '==' checks 'Is this the exact same person?'\n\n'.equals()' (Content Check): Checks if two things look the same. equals() checks 'Do they look exactly alike?'",
    difficulty: "Easy",
  },
  {
    id: 5,
    text: "Why is String immutable (unchangeable)?",
    description: "1. Safety: Strings are used for passwords and file paths. If they could change, a hacker could sneak in and change a filename after you checked it.\n\n2. Space: Java saves space by reusing Strings. If you write 'Hello' in 5 places, Java only keeps one copy in memory. If one person changed it, everyone else's 'Hello' would break.",
    difficulty: "Easy",
  },
  {
    id: 6,
    text: "What are Wrapper Classes?",
    description: "Java has two types of data:\n\n1. Primitives (Simple): int, char. Fast but dumb.\n\n2. Objects (Smart): Integer, Character. Can do things like convert to string.\n\nWrapper classes wrap primitives to give them superpowers.",
    difficulty: "Easy",
  },
  {
    id: 7,
    text: "What is the 'final' keyword?",
    description: "It means 'Cannot Change'.\n\nFinal Variable: Like writing in permanent marker. Once you write it, you can't erase or change it.\n\nFinal Method: No one can override it in a subclass.\n\nFinal Class: No one can extend it.",
    difficulty: "Easy",
  },
  {
    id: 8,
    text: "What is a Constructor?",
    description: "A Constructor is a special setup method.\n\nWhen you buy a new phone, you turn it on and set the language and time. That is the Constructor.\n\nIt runs automatically when you create an object.",
    difficulty: "Easy",
  },
  {
    id: 9,
    text: "StringBuffer vs StringBuilder?",
    description: "Both help you change text without wasting memory.\n\nStringBuffer: Think of it like a public notebook where only one person can write at a time. It is safe (thread-safe) but slow because everyone waits in line.\n\nStringBuilder: A private notebook where you write freely. Faster, but not safe if multiple people write at once.",
    difficulty: "Easy",
  },
  {
    id: 10,
    text: "What is the 'static' keyword?",
    description: "Static means 'Shared by Everyone'.\n\nInstance Variable: Every person has their own name.\n\nStatic Variable: The school name is shared by all students. You don't need to ask each student for the school name — it's the same for everyone.",
    difficulty: "Easy",
  },
];

// DSA Questions
export const dsaQuestions: Question[] = [
  {
    id: 1,
    text: "Representing a Graph (Adjacency List & Matrix)",
    description: "Understanding how graphs are represented is the foundation of graph theory. A graph can be stored using either an adjacency list or adjacency matrix. The adjacency list stores connected nodes for each vertex, using less memory for sparse graphs. The adjacency matrix is a 2D array that records whether an edge exists between every pair of vertices. This question focuses on implementing both representations.",
    difficulty: "Easy",
  },
  {
    id: 2,
    text: "Two Sum",
    description: "Given an array of integers, your task is to find the indices of two numbers within that array that add up to a specific target value. You can assume that each input will have exactly one solution, and you may not use the same element twice. The challenge lies in finding an efficient way to search for the required numbers. A brute-force approach of checking every pair of numbers would be too slow for large inputs, so a more efficient algorithm is needed.",
    difficulty: "Easy",
  },
  {
    id: 3,
    text: "Detecting Edge and Vertex Count",
    description: "Counting edges and vertices helps in verifying graph properties. In undirected graphs, every edge appears twice in adjacency lists, while in directed graphs it appears once. This exercise involves determining vertex count (n) and edge count efficiently from a given adjacency structure. It helps learners validate graph input and ensure correctness before applying complex algorithms like DFS or Dijkstra.",
    difficulty: "Easy",
  },
  {
    id: 4,
    text: "Check if Graph is Directed or Undirected",
    description: "Given a graph's adjacency structure, determine whether it's directed or undirected. A directed graph contains asymmetric edge pairs, meaning an edge u→v may not imply v→u. By iterating through each node's adjacency list, one can check if for every connection u→v, there exists a reciprocal edge v→u. This helps in validating inputs before running algorithms that depend on graph type.",
    difficulty: "Easy",
  },
  {
    id: 5,
    text: "Convert Edge List to Adjacency List",
    description: "Many graph problems provide input as edge lists rather than adjacency structures. The goal is to convert an edge list of pairs into a proper adjacency list representation. Understanding this conversion reinforces internal graph representation logic used in algorithms. It's useful in implementing algorithms like BFS, DFS, and Dijkstra which require adjacency-based access.",
    difficulty: "Easy",
  },
  {
    id: 6,
    text: "Best Time to Buy and Sell Stock",
    description: "You are given an array 'prices' where 'prices[i]' is the price of a given stock on the 'i'th day. You want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock. If you cannot achieve any profit, return 0. This problem is a classic example of a one-pass algorithm that efficiently finds the optimal solution.",
    difficulty: "Easy",
  },
  {
    id: 7,
    text: "Valid Parentheses",
    description: "Given a string containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid. An input string is valid if: Open brackets must be closed by the same type of brackets, and open brackets must be closed in the correct order. This problem is typically solved using a stack data structure.",
    difficulty: "Easy",
  },
  {
    id: 8,
    text: "Merge Two Sorted Lists",
    description: "You are given the heads of two sorted linked lists. Merge the two lists into one sorted list by splicing together the nodes of the first two lists. Return the head of the merged linked list. This is a fundamental problem for understanding linked list manipulation.",
    difficulty: "Easy",
  },
  {
    id: 9,
    text: "Maximum Subarray (Kadane's Algorithm)",
    description: "Given an integer array, find the contiguous subarray which has the largest sum and return its sum. Kadane's algorithm solves this in O(n) time by keeping track of the maximum sum ending at each position and the overall maximum sum found so far.",
    difficulty: "Medium",
  },
  {
    id: 10,
    text: "Longest Common Subsequence",
    description: "Given two strings, find the length of their longest common subsequence. A subsequence is a sequence that appears in the same relative order but not necessarily contiguous. This is a classic dynamic programming problem with O(m*n) time and space complexity.",
    difficulty: "Medium",
  },
];

// Aptitude Questions
export const aptitudeQuestions: Question[] = [
  {
    id: 1,
    text: "A colleague on your team is consistently missing deadlines. This forces you and others to work late to cover for them. What is the best first step?",
    description: "A colleague's poor performance is affecting the team. The best approach is to first have a private, professional conversation with the colleague to understand if there are any underlying issues, before escalating to management.",
    difficulty: "Medium",
  },
  {
    id: 2,
    text: "Find the odd one out from the following group: 1. Circle 2. Square 3. Triangle 4. Rectangle 5. Cube.",
    description: "An 'Odd One Out' classification problem based on properties of shapes. The answer is Cube (5) because it's a 3D shape while all others are 2D shapes.",
    difficulty: "Easy",
  },
  {
    id: 3,
    text: "A man's salary is increased by 20%. If his new salary is $30,000, what was his original salary before the increase was applied?",
    description: "A basic percentage problem to find the original value after a percentage increase. If new salary = 1.2 × original, then original = $30,000 ÷ 1.2 = $25,000.",
    difficulty: "Easy",
  },
  {
    id: 4,
    text: "A and B together can complete a piece of work in 20 days. B and C together can complete the same task in 30 days. A and C together can complete the same task in 30 days. How many days will A take to complete the task alone?",
    description: "A classic 'Time and Work' problem involving three individuals and their combined efficiencies to find one's solo time. Using work rates: A+B=1/20, B+C=1/30, A+C=1/30. Solving gives A=1/24, so A alone takes 24 days.",
    difficulty: "Medium",
  },
  {
    id: 5,
    text: "A shopkeeper sells an article for $450, making a profit of 25%. At what price should he sell the article to make a loss of 10%?",
    description: "A two-part profit and loss problem: first find the cost price, then calculate a new selling price. Cost price = $450 ÷ 1.25 = $360. For 10% loss, selling price = $360 × 0.9 = $324.",
    difficulty: "Medium",
  },
  {
    id: 6,
    text: "A train running at a speed of 60 km/hr crosses a pole in 9 seconds. What is the length of the train in meters?",
    description: "A classic 'Time, Speed, and Distance' problem involving unit conversion (km/hr to m/s). Speed = 60 × (5/18) = 50/3 m/s. Length = Speed × Time = (50/3) × 9 = 150 meters.",
    difficulty: "Easy",
  },
  {
    id: 7,
    text: "Find the simple interest on $5,000 for 3 years at a rate of 8% per annum. How does this compare to the amount at maturity?",
    description: "A foundational simple interest calculation to find the interest earned over a period. SI = P × R × T / 100 = $5,000 × 8 × 3 / 100 = $1,200. Amount = $5,000 + $1,200 = $6,200.",
    difficulty: "Easy",
  },
  {
    id: 8,
    text: "What is the compound interest on $10,000 for 2 years at 10% per annum, compounded annually?",
    description: "A fundamental problem calculating compound interest, where interest is earned on previously earned interest. A = P(1 + R/100)^T = $10,000 × (1.1)² = $12,100. CI = $12,100 - $10,000 = $2,100.",
    difficulty: "Easy",
  },
  {
    id: 9,
    text: "Two numbers are in the ratio 3:5. If 9 is subtracted from each, the new ratio becomes 12:23. What is the smaller number?",
    description: "A 'Ratios and Proportions' problem that requires setting up and solving a linear equation. Let numbers be 3x and 5x. (3x-9)/(5x-9) = 12/23. Solving: x = 15, so smaller number = 45.",
    difficulty: "Medium",
  },
  {
    id: 10,
    text: "The average age of a class of 30 students is 15 years. If the teacher's age is included, the average age increases by 1 year. What is the teacher's age?",
    description: "A 'find the missing value' problem from the 'Averages' topic, involving total sum. Total age of students = 30 × 15 = 450. New average = 16, new total = 31 × 16 = 496. Teacher's age = 496 - 450 = 46.",
    difficulty: "Medium",
  },
];

// Job Portals
export const jobPortals: JobPortal[] = [
  {
    id: 1,
    name: "Naukri",
    description: "India's leading job portal founded in 1997, offering extensive job listings across various industries with millions of job seekers. Provides comprehensive career guidance, resume services, and recruitment solutions for both job seekers and employers. Known for its robust filtering system and wide range of opportunities from entry-level to executive positions.",
    location: "India",
  },
  {
    id: 2,
    name: "Indeed",
    description: "World's largest job board aggregating listings from company websites and job boards globally. Founded in 2004, it processes over 10 new jobs every second. Offers user-friendly interface, comprehensive search filters, salary insights, and company reviews to help job seekers make informed decisions.",
    location: "Worldwide",
  },
  {
    id: 3,
    name: "LinkedIn",
    description: "Professional networking platform that transformed into a powerful job search engine. Connects professionals worldwide with job opportunities while enabling networking, skill showcasing, and industry insights. Premium features include detailed analytics and advanced search capabilities.",
    location: "Worldwide",
  },
  {
    id: 4,
    name: "Glassdoor",
    description: "Combines job searching with employee reviews and salary insights. Provides transparency about company culture, interview processes, and compensation packages. Helps job seekers make informed decisions by offering insider perspectives from current and former employees.",
    location: "Worldwide",
  },
  {
    id: 5,
    name: "Monster",
    description: "One of the pioneering job boards established in 1994, connecting millions of job seekers with employers globally. Offers comprehensive career resources, resume writing services, and recruiting solutions. Known for quality job listings and extensive employer network.",
    location: "Worldwide",
  },
  {
    id: 6,
    name: "CareerBuilder",
    description: "Data-driven job platform using advanced technology to match candidates with suitable opportunities. Offers comprehensive hiring solutions for businesses and career development resources for job seekers. Features AI-powered recommendations and extensive candidate database.",
    location: "United States, Europe, Asia",
  },
  {
    id: 7,
    name: "ZipRecruiter",
    description: "Modern job board that distributes listings to hundreds of job sites simultaneously. Uses smart matching technology to connect employers with qualified candidates quickly. Known for its streamlined application process and mobile-friendly platform.",
    location: "United States",
  },
  {
    id: 8,
    name: "Foundit",
    description: "Rebranded Monster India, offering comprehensive job search solutions across various industries and experience levels. Provides career advice, skill development resources, and recruitment services. Strong presence in Indian and Middle Eastern markets.",
    location: "India, UAE, Middle East",
  },
  {
    id: 9,
    name: "AngelList",
    description: "The go-to platform for startup jobs, connecting talented individuals with innovative companies. Features detailed startup profiles, transparent salary ranges, and equity information. Ideal for those looking to join early-stage companies.",
    location: "Worldwide",
  },
  {
    id: 10,
    name: "Wellfound",
    description: "Previously known as AngelList Talent, focuses on startup and tech jobs. Offers direct connections to founders and hiring managers. Features include salary transparency, company culture insights, and streamlined application processes.",
    location: "Worldwide",
  },
];

// Projects
export const projects: Project[] = [
  {
    id: 1,
    title: "PDF Processing Tool",
    description: "Comprehensive PDF manipulation with merge, split, and editing.",
    technologies: ["Python", "PDF Libraries", "GUI Framework"],
  },
  {
    id: 2,
    title: "Password Manager",
    description: "Secure credential storage with encryption and sync.",
    technologies: ["Python", "Cryptography", "GUI Framework"],
  },
  {
    id: 3,
    title: "File Organizer Utility",
    description: "Automated file sorting and duplicate detection tool.",
    technologies: ["Python", "File System APIs", "GUI"],
  },
  {
    id: 4,
    title: "System Resource Monitor",
    description: "Real-time monitoring of CPU, memory, and network usage.",
    technologies: ["Python", "System APIs", "GUI Framework"],
  },
  {
    id: 5,
    title: "Desktop Automation Tool",
    description: "Task automation with GUI interaction and scheduling.",
    technologies: ["Python", "GUI Automation Libraries", "Scheduling"],
  },
  {
    id: 6,
    title: "Arcade Style Shooter",
    description: "Fast-paced action game with power-ups and boss battles.",
    technologies: ["JavaScript", "HTML5 Canvas", "Audio APIs"],
  },
  {
    id: 7,
    title: "Survival Crafting Game",
    description: "Open-world survival with resource gathering and building.",
    technologies: ["C#", "Unity", "Procedural Generation", "Survival Mechanics"],
  },
  {
    id: 8,
    title: "Card Game Simulator",
    description: "Digital version of popular card games with AI opponents.",
    technologies: ["JavaScript", "Game Logic", "AI Algorithms"],
  },
  {
    id: 9,
    title: "Multiplayer Battle Arena",
    description: "Online competitive game with team-based combat.",
    technologies: ["C#", "Unity Netcode", "Server Architecture"],
  },
  {
    id: 10,
    title: "VR Experience Demo",
    description: "Virtual reality application with immersive interactions.",
    technologies: ["C#", "Unity XR", "VR SDKs", "3D Assets"],
  },
  {
    id: 11,
    title: "Tower Defense Game",
    description: "Strategic defense game with upgrade systems.",
    technologies: ["JavaScript", "HTML5 Canvas", "Game Logic"],
  },
  {
    id: 12,
    title: "RPG Adventure Game",
    description: "Story-driven role-playing game with character customization.",
    technologies: ["Python", "Pygame", "Game Assets", "Storytelling"],
  },
  {
    id: 13,
    title: "Mobile Puzzle Game",
    description: "Addictive puzzle mechanics with social features.",
    technologies: ["C#", "Unity", "Mobile Optimization", "Analytics"],
  },
  {
    id: 14,
    title: "3D Racing Game",
    description: "High-speed racing simulation with multiple tracks.",
    technologies: ["C#", "Unity", "3D Modeling", "Physics"],
  },
  {
    id: 15,
    title: "E-commerce Platform",
    description: "Full-stack online store with payment integration.",
    technologies: ["React", "Node.js", "MongoDB", "Stripe"],
  },
];

// Resume Templates
export const resumeTemplates: ResumeTemplate[] = [
  {
    id: 1,
    name: "Tech based ATS friendly resume",
    style: "Modern, clean design optimized for Applicant Tracking Systems",
  },
  {
    id: 2,
    name: "Blue & White minimal resume",
    style: "Professional minimalist design with blue accents",
  },
  {
    id: 3,
    name: "White & black modern resume",
    style: "Sleek black and white design with modern typography",
  },
  {
    id: 4,
    name: "White & yellow modern resume",
    style: "Contemporary design with yellow accent highlights",
  },
  {
    id: 5,
    name: "Classic Professional",
    style: "Traditional layout perfect for corporate roles",
  },
  {
    id: 6,
    name: "Creative Portfolio",
    style: "Visual-focused design for designers and creatives",
  },
  {
    id: 7,
    name: "Executive Summary",
    style: "Senior-level resume with emphasis on achievements",
  },
  {
    id: 8,
    name: "Technical Specialist",
    style: "Skills-focused layout for engineering roles",
  },
];

// Cold DMs
export const coldDMs: ColdDM[] = [
  {
    id: 1,
    title: "Achievement Highlight",
    message: "Hi [Recruiter Name], I recently achieved [specific accomplishment] in my role at [Company], which resulted in [quantifiable outcome]. I'm now looking for new challenges where I can apply these skills. Are there opportunities at [Target Company] where this experience would be valuable?",
    category: "Skill Showcase",
  },
  {
    id: 2,
    title: "Alumni Network Connection",
    message: "Hi [Recruiter Name], I noticed we're both [University] alumni! I'm currently exploring opportunities in [field] and would love to connect with fellow graduates. Your career path at [Company] is particularly inspiring. Would you be open to a brief chat about the company culture and potential opportunities?",
    category: "Networking",
  },
  {
    id: 3,
    title: "Application Follow-up",
    message: "Hi [Recruiter Name], I've submitted my application for [Role]. Just following up to express my enthusiasm for the position.",
    category: "Application Follow-up",
  },
  {
    id: 4,
    title: "Asking for Feedback",
    message: "Hello [Recruiter Name], If possible, could you share feedback on my application or resume to improve my chances?",
    category: "Resume Help",
  },
  {
    id: 5,
    title: "Bootcamp Graduate",
    message: "Hi [Recruiter Name], I recently completed [bootcamp/intensive program] in [field] and I'm excited to start my career in this area. What drew me to [Company] is [specific reason]. While I'm new to the field professionally, my background in [previous experience] provides a strong foundation. Would you be interested in discussing entry-level opportunities?",
    category: "Entry-Level",
  },
  {
    id: 6,
    title: "Career Path Question",
    message: "Hello, what's the usual career trajectory for someone joining as [Role] at [Company]?",
    category: "Networking",
  },
  {
    id: 7,
    title: "Certification Completion",
    message: "Hi [Recruiter Name], I just completed my [Certification Name] and I'm excited to apply these new skills in a professional setting. [Company]'s reputation for [specific area] makes it an ideal place to grow. Would you be interested in discussing how my fresh certification could benefit your team?",
    category: "Skill Showcase",
  },
  {
    id: 8,
    title: "Checking Internship Status",
    message: "Hi, Could you please update me on the status of my internship application? I'm really excited to contribute.",
    category: "Application Follow-up",
  },
  {
    id: 9,
    title: "Checking Job Seeker Resources",
    message: "Hi, Does your company offer resources or workshops for job seekers? I'd love to participate.",
    category: "General Inquiry",
  },
  {
    id: 10,
    title: "Coffee Chat",
    message: "Hello, would you be open to a quick call or coffee chat? I'd love to learn more about the team and possible opportunities.",
    category: "Informational Interview",
  },
  {
    id: 11,
    title: "Cold Contact for Job Openings",
    message: "Hello, I'm actively looking for job openings in [Industry]. If you know of any, kindly let me know.",
    category: "General Outreach",
  },
  {
    id: 12,
    title: "Community Involvement",
    message: "Hi [Recruiter Name], I've been actively involved in [relevant community/organization] where I've developed skills in [relevant areas]. This experience complements my professional background and aligns with [Company]'s community values. Would you be interested in discussing how this combination could benefit your team?",
    category: "General Outreach",
  },
];

// Helper function to get questions for a specific tab
export function getCompanyTabData(tabId: string): any[] {
  switch (tabId) {
    case "sql-questions":
      return sqlQuestions;
    case "interview-questions":
      return interviewQuestions;
    case "dsa-questions":
      return dsaQuestions;
    case "aptitude-questions":
      return aptitudeQuestions;
    case "job-portals":
      return jobPortals;
    case "projects":
      return projects;
    case "resume-templates":
      return resumeTemplates;
    case "cold-dms":
      return coldDMs;
    default:
      return [];
  }
}
