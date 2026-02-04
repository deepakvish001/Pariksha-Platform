// Type definitions
export type Difficulty = "Easy" | "Medium" | "Hard";

export interface Question {
  id: number;
  text: string;
  difficulty: Difficulty;
}

export interface RoleData {
  id: string;
  name: string;
  icon: string;
}

export interface CategoryData {
  id: string;
  name: string;
}

// Role definitions
export const roles: RoleData[] = [
  { id: "backend-developer", name: "Backend Developer", icon: "Server" },
  { id: "ai-engineer", name: "AI Engineer", icon: "Brain" },
  { id: "frontend-developer", name: "Frontend Developer", icon: "Layout" },
  { id: "data-science-ml", name: "Data Science & ML", icon: "LineChart" },
  { id: "system-design", name: "System Design & Architecture", icon: "Network" },
  { id: "devops-cloud", name: "DevOps & Cloud", icon: "Cloud" },
  { id: "java-developer", name: "Java Developer", icon: "Coffee" },
  { id: "data-analyst", name: "Data Analyst", icon: "BarChart" },
  { id: "product-management", name: "Product Management", icon: "Briefcase" },
  { id: "ux-ui-design", name: "UX/UI & Design", icon: "Palette" },
  { id: "marketing", name: "Marketing", icon: "Megaphone" },
  { id: "sales", name: "Sales", icon: "TrendingUp" },
  { id: "founders-office", name: "Founders Office", icon: "Rocket" },
  { id: "blockchain", name: "Blockchain", icon: "Blocks" },
  { id: "web3", name: "Web3", icon: "Globe" },
];

// Category definitions
export const categories: CategoryData[] = [
  { id: "interview-questions", name: "Interview Questions" },
  { id: "dsa-questions", name: "DSA Questions" },
  { id: "aptitude-questions", name: "Aptitude Questions" },
  { id: "sql-questions", name: "SQL Questions" },
  { id: "core-cs-questions", name: "Core CS Questions" },
];

// Questions data organized by role and category
export const questionsData: Record<string, Record<string, Question[]>> = {
  "backend-developer": {
    "interview-questions": [
      { id: 1, text: "What is middleware in web frameworks and how is it used?", difficulty: "Easy" },
      { id: 2, text: "How does HTTP caching work and which headers control it?", difficulty: "Easy" },
      { id: 3, text: "Explain REST vs. GraphQL and trade-offs.", difficulty: "Easy" },
      { id: 4, text: "What is CORS and how do you configure it?", difficulty: "Easy" },
      { id: 5, text: "How do you secure sensitive data at rest?", difficulty: "Easy" },
      { id: 6, text: "What is a reverse proxy and why use one?", difficulty: "Easy" },
      { id: 7, text: "Explain JSON Web Tokens (JWT) structure.", difficulty: "Easy" },
      { id: 8, text: "What is connection pooling and its benefits?", difficulty: "Easy" },
      { id: 9, text: "Describe JSON vs. Protobuf for data serialization.", difficulty: "Easy" },
      { id: 10, text: "What is TLS handshake and its purpose?", difficulty: "Easy" },
      { id: 11, text: "Explain symbolic links and their use in deployment.", difficulty: "Easy" },
      { id: 12, text: "What are the core principles of RESTful API design?", difficulty: "Medium" },
      { id: 13, text: "Explain the concept of database normalization and its trade-offs.", difficulty: "Medium" },
      { id: 14, text: "How would you implement pagination in a REST API?", difficulty: "Medium" },
      { id: 15, text: "How do you handle file uploads in a backend application?", difficulty: "Medium" },
      { id: 16, text: "Describe how webhooks work and how to implement retry logic.", difficulty: "Medium" },
      { id: 17, text: "How do you implement rate limiting for APIs?", difficulty: "Medium" },
      { id: 18, text: "Explain ACID properties in the context of relational databases.", difficulty: "Medium" },
      { id: 19, text: "Describe how you would manage environment-specific configurations.", difficulty: "Medium" },
      { id: 20, text: "What is a circuit breaker and how is it implemented?", difficulty: "Medium" },
      { id: 21, text: "Explain the CAP theorem and its implications for distributed systems.", difficulty: "Medium" },
      { id: 22, text: "How would you implement health checks for microservices?", difficulty: "Medium" },
      { id: 23, text: "What are the differences between monolithic and microservice architectures?", difficulty: "Medium" },
      { id: 24, text: "Explain the role of message brokers in backend systems.", difficulty: "Medium" },
      { id: 25, text: "Explain the concept of eventual consistency.", difficulty: "Medium" },
      { id: 26, text: "How do you prevent SQL injection vulnerabilities?", difficulty: "Medium" },
      { id: 27, text: "What is the role of API gateways in microservice ecosystems?", difficulty: "Medium" },
      { id: 28, text: "Explain the concept of idempotency and its importance in REST APIs.", difficulty: "Medium" },
      { id: 29, text: "What is container orchestration and why use Kubernetes?", difficulty: "Medium" },
      { id: 30, text: "Describe how you would handle long-running background jobs.", difficulty: "Medium" },
      { id: 31, text: "What is the purpose of feature flags and how do you implement them?", difficulty: "Medium" },
      { id: 32, text: "Explain how HTTP/2 improves performance over HTTP/1.1.", difficulty: "Medium" },
      { id: 33, text: "How do you implement graceful shutdown in backend services?", difficulty: "Medium" },
      { id: 34, text: "Describe best practices for API versioning.", difficulty: "Medium" },
      { id: 35, text: "How do you optimize database query performance in high-traffic environments?", difficulty: "Hard" },
      { id: 36, text: "What strategies ensure secure authentication for backend services?", difficulty: "Hard" },
      { id: 37, text: "Describe how you would design a logging and monitoring system.", difficulty: "Hard" },
      { id: 38, text: "Explain the difference between optimistic and pessimistic locking.", difficulty: "Hard" },
      { id: 39, text: "What is CQRS and when would you use it?", difficulty: "Hard" },
      { id: 40, text: "What considerations are important when designing microservices?", difficulty: "Hard" },
      { id: 41, text: "How would you secure communication between microservices?", difficulty: "Hard" },
      { id: 42, text: "What is database sharding and when would you use it?", difficulty: "Hard" },
      { id: 43, text: "How do you implement transactional workflows spanning multiple services?", difficulty: "Hard" },
      { id: 44, text: "How do you handle schema migrations in production databases?", difficulty: "Hard" },
      { id: 45, text: "How do you ensure database migrations are zero-downtime?", difficulty: "Hard" },
      { id: 46, text: "What is event sourcing and how does it differ from CRUD?", difficulty: "Hard" },
      { id: 47, text: "Describe how OAuth2 authorization flows work.", difficulty: "Hard" },
      { id: 48, text: "How do you implement database read replicas and sync strategies?", difficulty: "Hard" },
      { id: 49, text: "How do you manage transactional integrity across NoSQL databases?", difficulty: "Hard" },
      { id: 50, text: "What is service mesh and when would you use it?", difficulty: "Hard" },
    ],
    "dsa-questions": [
      { id: 1, text: "Implement a function to reverse a linked list.", difficulty: "Easy" },
      { id: 2, text: "Find the middle element of a linked list.", difficulty: "Easy" },
      { id: 3, text: "Check if a string is a palindrome.", difficulty: "Easy" },
      { id: 4, text: "Implement binary search on a sorted array.", difficulty: "Easy" },
      { id: 5, text: "Find the maximum element in an array.", difficulty: "Easy" },
      { id: 6, text: "Implement a stack using arrays.", difficulty: "Easy" },
      { id: 7, text: "Check if parentheses are balanced.", difficulty: "Easy" },
      { id: 8, text: "Find the first non-repeating character in a string.", difficulty: "Easy" },
      { id: 9, text: "Merge two sorted arrays.", difficulty: "Easy" },
      { id: 10, text: "Count occurrences of an element in an array.", difficulty: "Easy" },
      { id: 11, text: "Implement LRU Cache.", difficulty: "Medium" },
      { id: 12, text: "Find the longest substring without repeating characters.", difficulty: "Medium" },
      { id: 13, text: "Detect a cycle in a linked list.", difficulty: "Medium" },
      { id: 14, text: "Implement BFS and DFS for a graph.", difficulty: "Medium" },
      { id: 15, text: "Find the kth largest element in an array.", difficulty: "Medium" },
      { id: 16, text: "Implement a min heap.", difficulty: "Medium" },
      { id: 17, text: "Solve the two sum problem.", difficulty: "Medium" },
      { id: 18, text: "Find all permutations of a string.", difficulty: "Medium" },
      { id: 19, text: "Implement quicksort algorithm.", difficulty: "Medium" },
      { id: 20, text: "Find the longest common subsequence.", difficulty: "Medium" },
      { id: 21, text: "Implement Dijkstra's shortest path algorithm.", difficulty: "Hard" },
      { id: 22, text: "Solve the N-Queens problem.", difficulty: "Hard" },
      { id: 23, text: "Implement a trie data structure.", difficulty: "Hard" },
      { id: 24, text: "Find the longest palindromic substring.", difficulty: "Hard" },
      { id: 25, text: "Solve the coin change problem using dynamic programming.", difficulty: "Hard" },
    ],
    "aptitude-questions": [
      { id: 1, text: "A train 150m long crosses a pole in 15 seconds. Find its speed.", difficulty: "Easy" },
      { id: 2, text: "If 6 men can do a work in 12 days, how many days will 9 men take?", difficulty: "Easy" },
      { id: 3, text: "Find the average of first 50 natural numbers.", difficulty: "Easy" },
      { id: 4, text: "What is 15% of 200?", difficulty: "Easy" },
      { id: 5, text: "A car travels 300km in 5 hours. Find its average speed.", difficulty: "Easy" },
      { id: 6, text: "Find the simple interest on Rs. 5000 at 10% per annum for 2 years.", difficulty: "Easy" },
      { id: 7, text: "If A:B = 2:3 and B:C = 4:5, find A:C.", difficulty: "Medium" },
      { id: 8, text: "A pipe can fill a tank in 6 hours. What part of the tank is filled in 2 hours?", difficulty: "Medium" },
      { id: 9, text: "Find the compound interest on Rs. 10000 at 5% for 2 years.", difficulty: "Medium" },
      { id: 10, text: "Two trains running at 60 km/hr and 40 km/hr cross each other in 12 seconds. Find their total length.", difficulty: "Medium" },
      { id: 11, text: "A boat goes 30km upstream in 6 hours and 40km downstream in 5 hours. Find speed of stream.", difficulty: "Hard" },
      { id: 12, text: "Find the probability of getting at least one head in 3 coin tosses.", difficulty: "Hard" },
      { id: 13, text: "In how many ways can 5 people be arranged in a row?", difficulty: "Hard" },
    ],
    "sql-questions": [
      { id: 1, text: "Write a query to select all columns from a table.", difficulty: "Easy" },
      { id: 2, text: "How do you filter rows using WHERE clause?", difficulty: "Easy" },
      { id: 3, text: "Explain the difference between WHERE and HAVING.", difficulty: "Easy" },
      { id: 4, text: "Write a query to count total rows in a table.", difficulty: "Easy" },
      { id: 5, text: "How do you sort results in ascending and descending order?", difficulty: "Easy" },
      { id: 6, text: "Explain different types of JOINs.", difficulty: "Medium" },
      { id: 7, text: "Write a query to find duplicate records.", difficulty: "Medium" },
      { id: 8, text: "How do you use GROUP BY with aggregate functions?", difficulty: "Medium" },
      { id: 9, text: "Write a subquery to find employees earning above average.", difficulty: "Medium" },
      { id: 10, text: "Explain the difference between UNION and UNION ALL.", difficulty: "Medium" },
      { id: 11, text: "Write a query using window functions (ROW_NUMBER, RANK).", difficulty: "Hard" },
      { id: 12, text: "How do you optimize a slow-running query?", difficulty: "Hard" },
      { id: 13, text: "Write a recursive CTE to traverse hierarchical data.", difficulty: "Hard" },
      { id: 14, text: "Explain transaction isolation levels.", difficulty: "Hard" },
      { id: 15, text: "How do you implement pagination efficiently for large datasets?", difficulty: "Hard" },
    ],
    "core-cs-questions": [
      { id: 1, text: "What is the difference between process and thread?", difficulty: "Easy" },
      { id: 2, text: "Explain the OSI model layers.", difficulty: "Easy" },
      { id: 3, text: "What is virtual memory?", difficulty: "Easy" },
      { id: 4, text: "Explain TCP vs UDP.", difficulty: "Easy" },
      { id: 5, text: "What is a deadlock?", difficulty: "Easy" },
      { id: 6, text: "Explain CPU scheduling algorithms.", difficulty: "Medium" },
      { id: 7, text: "How does DNS resolution work?", difficulty: "Medium" },
      { id: 8, text: "What is paging and segmentation?", difficulty: "Medium" },
      { id: 9, text: "Explain the TCP three-way handshake.", difficulty: "Medium" },
      { id: 10, text: "What are the SOLID principles?", difficulty: "Medium" },
      { id: 11, text: "Explain different types of database indexes.", difficulty: "Hard" },
      { id: 12, text: "How does garbage collection work in different languages?", difficulty: "Hard" },
      { id: 13, text: "Explain the CAP theorem in distributed systems.", difficulty: "Hard" },
    ],
  },
  "ai-engineer": {
    "interview-questions": [
      { id: 1, text: "What is the difference between supervised and unsupervised learning?", difficulty: "Easy" },
      { id: 2, text: "Explain the bias-variance tradeoff.", difficulty: "Easy" },
      { id: 3, text: "What is overfitting and how do you prevent it?", difficulty: "Easy" },
      { id: 4, text: "Explain the concept of gradient descent.", difficulty: "Easy" },
      { id: 5, text: "What are activation functions and why are they needed?", difficulty: "Easy" },
      { id: 6, text: "What is cross-validation?", difficulty: "Easy" },
      { id: 7, text: "Explain precision, recall, and F1 score.", difficulty: "Easy" },
      { id: 8, text: "What is regularization in machine learning?", difficulty: "Easy" },
      { id: 9, text: "Explain the difference between bagging and boosting.", difficulty: "Medium" },
      { id: 10, text: "How do transformers work in NLP?", difficulty: "Medium" },
      { id: 11, text: "What is attention mechanism?", difficulty: "Medium" },
      { id: 12, text: "Explain LSTM and GRU architectures.", difficulty: "Medium" },
      { id: 13, text: "How do you handle imbalanced datasets?", difficulty: "Medium" },
      { id: 14, text: "What is transfer learning?", difficulty: "Medium" },
      { id: 15, text: "Explain the architecture of a convolutional neural network.", difficulty: "Medium" },
      { id: 16, text: "What is batch normalization?", difficulty: "Medium" },
      { id: 17, text: "How do you deploy ML models in production?", difficulty: "Medium" },
      { id: 18, text: "What is MLOps?", difficulty: "Medium" },
      { id: 19, text: "Explain reinforcement learning concepts.", difficulty: "Hard" },
      { id: 20, text: "How do GANs work?", difficulty: "Hard" },
      { id: 21, text: "What is RLHF in large language models?", difficulty: "Hard" },
      { id: 22, text: "Explain the architecture of GPT models.", difficulty: "Hard" },
      { id: 23, text: "How do you fine-tune large language models?", difficulty: "Hard" },
      { id: 24, text: "What are embeddings and how are they created?", difficulty: "Hard" },
      { id: 25, text: "Explain the concept of prompt engineering.", difficulty: "Hard" },
    ],
    "dsa-questions": [
      { id: 1, text: "Implement matrix multiplication.", difficulty: "Easy" },
      { id: 2, text: "Implement a function to calculate cosine similarity.", difficulty: "Easy" },
      { id: 3, text: "Find the dot product of two vectors.", difficulty: "Easy" },
      { id: 4, text: "Implement softmax function.", difficulty: "Easy" },
      { id: 5, text: "Calculate the mean and standard deviation of an array.", difficulty: "Easy" },
      { id: 6, text: "Implement k-nearest neighbors algorithm.", difficulty: "Medium" },
      { id: 7, text: "Build a decision tree from scratch.", difficulty: "Medium" },
      { id: 8, text: "Implement gradient descent optimization.", difficulty: "Medium" },
      { id: 9, text: "Create a simple neural network forward pass.", difficulty: "Medium" },
      { id: 10, text: "Implement backpropagation algorithm.", difficulty: "Hard" },
      { id: 11, text: "Build a transformer attention mechanism.", difficulty: "Hard" },
      { id: 12, text: "Implement beam search for sequence generation.", difficulty: "Hard" },
    ],
    "aptitude-questions": [
      { id: 1, text: "Calculate probability of drawing a red ball from a bag.", difficulty: "Easy" },
      { id: 2, text: "Find the mean, median, and mode of a dataset.", difficulty: "Easy" },
      { id: 3, text: "What is the expected value of a dice roll?", difficulty: "Easy" },
      { id: 4, text: "Calculate conditional probability P(A|B).", difficulty: "Medium" },
      { id: 5, text: "Explain Bayes' theorem with an example.", difficulty: "Medium" },
      { id: 6, text: "Calculate the correlation coefficient.", difficulty: "Medium" },
      { id: 7, text: "What is the central limit theorem?", difficulty: "Hard" },
      { id: 8, text: "Perform hypothesis testing.", difficulty: "Hard" },
    ],
    "sql-questions": [
      { id: 1, text: "Write a query to calculate average of a column.", difficulty: "Easy" },
      { id: 2, text: "How do you handle NULL values in aggregations?", difficulty: "Easy" },
      { id: 3, text: "Write a query to pivot data.", difficulty: "Medium" },
      { id: 4, text: "How do you create feature columns using SQL?", difficulty: "Medium" },
      { id: 5, text: "Write a query to calculate moving averages.", difficulty: "Hard" },
      { id: 6, text: "How do you sample data randomly using SQL?", difficulty: "Hard" },
    ],
    "core-cs-questions": [
      { id: 1, text: "What is GPU computing and why is it important for AI?", difficulty: "Easy" },
      { id: 2, text: "Explain the concept of parallel processing.", difficulty: "Easy" },
      { id: 3, text: "What is CUDA?", difficulty: "Medium" },
      { id: 4, text: "How does distributed training work?", difficulty: "Medium" },
      { id: 5, text: "Explain model parallelism vs data parallelism.", difficulty: "Hard" },
      { id: 6, text: "What are tensor cores?", difficulty: "Hard" },
    ],
  },
  "frontend-developer": {
    "interview-questions": [
      { id: 1, text: "What is the virtual DOM and how does it work?", difficulty: "Easy" },
      { id: 2, text: "Explain the difference between let, const, and var.", difficulty: "Easy" },
      { id: 3, text: "What are React hooks?", difficulty: "Easy" },
      { id: 4, text: "Explain CSS specificity.", difficulty: "Easy" },
      { id: 5, text: "What is the box model in CSS?", difficulty: "Easy" },
      { id: 6, text: "How does event bubbling work?", difficulty: "Easy" },
      { id: 7, text: "What is closure in JavaScript?", difficulty: "Easy" },
      { id: 8, text: "Explain the difference between == and ===.", difficulty: "Easy" },
      { id: 9, text: "What is the purpose of useEffect hook?", difficulty: "Medium" },
      { id: 10, text: "How do you optimize React performance?", difficulty: "Medium" },
      { id: 11, text: "Explain state management in React.", difficulty: "Medium" },
      { id: 12, text: "What is server-side rendering?", difficulty: "Medium" },
      { id: 13, text: "How do you handle async operations in JavaScript?", difficulty: "Medium" },
      { id: 14, text: "What are Web Workers?", difficulty: "Medium" },
      { id: 15, text: "Explain the concept of code splitting.", difficulty: "Medium" },
      { id: 16, text: "How does the browser rendering pipeline work?", difficulty: "Medium" },
      { id: 17, text: "What is tree shaking?", difficulty: "Medium" },
      { id: 18, text: "Explain CSS-in-JS approaches.", difficulty: "Medium" },
      { id: 19, text: "What is React Fiber?", difficulty: "Hard" },
      { id: 20, text: "How does React concurrent mode work?", difficulty: "Hard" },
      { id: 21, text: "Explain the event loop in JavaScript.", difficulty: "Hard" },
      { id: 22, text: "How do you implement micro-frontends?", difficulty: "Hard" },
      { id: 23, text: "What are service workers and PWAs?", difficulty: "Hard" },
      { id: 24, text: "Explain WebAssembly and its use cases.", difficulty: "Hard" },
      { id: 25, text: "How do you implement accessible components?", difficulty: "Hard" },
    ],
    "dsa-questions": [
      { id: 1, text: "Implement debounce function.", difficulty: "Easy" },
      { id: 2, text: "Implement throttle function.", difficulty: "Easy" },
      { id: 3, text: "Flatten a nested array.", difficulty: "Easy" },
      { id: 4, text: "Deep clone an object.", difficulty: "Easy" },
      { id: 5, text: "Implement array map from scratch.", difficulty: "Easy" },
      { id: 6, text: "Implement array reduce from scratch.", difficulty: "Medium" },
      { id: 7, text: "Create a deep comparison function.", difficulty: "Medium" },
      { id: 8, text: "Implement a pub-sub pattern.", difficulty: "Medium" },
      { id: 9, text: "Build a virtual DOM diff algorithm.", difficulty: "Hard" },
      { id: 10, text: "Implement a promise from scratch.", difficulty: "Hard" },
    ],
    "aptitude-questions": [
      { id: 1, text: "Calculate the time complexity of nested loops.", difficulty: "Easy" },
      { id: 2, text: "If a webpage loads in 2 seconds and you optimize it by 50%, what is the new load time?", difficulty: "Easy" },
      { id: 3, text: "Calculate memory usage for storing 1000 objects with 5 properties each.", difficulty: "Medium" },
      { id: 4, text: "Estimate the number of DOM nodes on a typical e-commerce page.", difficulty: "Medium" },
    ],
    "sql-questions": [
      { id: 1, text: "Write a query to fetch user data for a profile page.", difficulty: "Easy" },
      { id: 2, text: "How do you paginate results for a list view?", difficulty: "Easy" },
      { id: 3, text: "Write a query to search across multiple columns.", difficulty: "Medium" },
      { id: 4, text: "How do you implement autocomplete suggestions?", difficulty: "Medium" },
    ],
    "core-cs-questions": [
      { id: 1, text: "How do browsers render web pages?", difficulty: "Easy" },
      { id: 2, text: "What is the critical rendering path?", difficulty: "Easy" },
      { id: 3, text: "Explain HTTP/2 and its benefits.", difficulty: "Medium" },
      { id: 4, text: "What is CORS and how does it work?", difficulty: "Medium" },
      { id: 5, text: "How does browser caching work?", difficulty: "Hard" },
      { id: 6, text: "Explain Content Security Policy.", difficulty: "Hard" },
    ],
  },
  "data-science-ml": {
    "interview-questions": [
      { id: 1, text: "What is the difference between classification and regression?", difficulty: "Easy" },
      { id: 2, text: "Explain the concept of feature engineering.", difficulty: "Easy" },
      { id: 3, text: "What is exploratory data analysis?", difficulty: "Easy" },
      { id: 4, text: "How do you handle missing values?", difficulty: "Easy" },
      { id: 5, text: "What is normalization vs standardization?", difficulty: "Easy" },
      { id: 6, text: "Explain different types of sampling methods.", difficulty: "Medium" },
      { id: 7, text: "How do you select features for a model?", difficulty: "Medium" },
      { id: 8, text: "What is dimensionality reduction?", difficulty: "Medium" },
      { id: 9, text: "Explain A/B testing methodology.", difficulty: "Medium" },
      { id: 10, text: "How do you validate ML models?", difficulty: "Hard" },
      { id: 11, text: "Explain time series forecasting approaches.", difficulty: "Hard" },
      { id: 12, text: "What is causal inference?", difficulty: "Hard" },
    ],
    "dsa-questions": [
      { id: 1, text: "Implement k-means clustering algorithm.", difficulty: "Medium" },
      { id: 2, text: "Build a linear regression model from scratch.", difficulty: "Medium" },
      { id: 3, text: "Implement PCA for dimensionality reduction.", difficulty: "Hard" },
      { id: 4, text: "Create a random forest classifier.", difficulty: "Hard" },
    ],
    "aptitude-questions": [
      { id: 1, text: "Calculate the confidence interval for a sample mean.", difficulty: "Medium" },
      { id: 2, text: "Perform chi-square test.", difficulty: "Medium" },
      { id: 3, text: "Calculate p-value for a hypothesis test.", difficulty: "Hard" },
    ],
    "sql-questions": [
      { id: 1, text: "Write a query to calculate customer lifetime value.", difficulty: "Medium" },
      { id: 2, text: "How do you create cohort analysis using SQL?", difficulty: "Medium" },
      { id: 3, text: "Write a query for funnel analysis.", difficulty: "Hard" },
    ],
    "core-cs-questions": [
      { id: 1, text: "How do you store and process large datasets?", difficulty: "Medium" },
      { id: 2, text: "Explain the MapReduce paradigm.", difficulty: "Medium" },
      { id: 3, text: "What is data warehousing?", difficulty: "Hard" },
    ],
  },
  "system-design": {
    "interview-questions": [
      { id: 1, text: "Design a URL shortener.", difficulty: "Easy" },
      { id: 2, text: "Design a rate limiter.", difficulty: "Medium" },
      { id: 3, text: "Design Twitter's feed system.", difficulty: "Medium" },
      { id: 4, text: "Design a chat application.", difficulty: "Medium" },
      { id: 5, text: "Design a notification system.", difficulty: "Medium" },
      { id: 6, text: "Design YouTube.", difficulty: "Hard" },
      { id: 7, text: "Design a distributed cache.", difficulty: "Hard" },
      { id: 8, text: "Design Google Search.", difficulty: "Hard" },
    ],
    "dsa-questions": [
      { id: 1, text: "Implement consistent hashing.", difficulty: "Hard" },
      { id: 2, text: "Design a bloom filter.", difficulty: "Hard" },
      { id: 3, text: "Implement a load balancer algorithm.", difficulty: "Medium" },
    ],
    "aptitude-questions": [
      { id: 1, text: "Calculate the storage needed for 1 billion users.", difficulty: "Medium" },
      { id: 2, text: "Estimate QPS for a social media platform.", difficulty: "Medium" },
    ],
    "sql-questions": [
      { id: 1, text: "Design a schema for a social network.", difficulty: "Medium" },
      { id: 2, text: "How do you partition a large table?", difficulty: "Hard" },
    ],
    "core-cs-questions": [
      { id: 1, text: "Explain CAP theorem.", difficulty: "Medium" },
      { id: 2, text: "What is consensus in distributed systems?", difficulty: "Hard" },
      { id: 3, text: "Explain Paxos and Raft algorithms.", difficulty: "Hard" },
    ],
  },
  "devops-cloud": {
    "interview-questions": [
      { id: 1, text: "What is CI/CD?", difficulty: "Easy" },
      { id: 2, text: "Explain Docker and containerization.", difficulty: "Easy" },
      { id: 3, text: "What is Infrastructure as Code?", difficulty: "Easy" },
      { id: 4, text: "How do you implement blue-green deployments?", difficulty: "Medium" },
      { id: 5, text: "Explain Kubernetes architecture.", difficulty: "Medium" },
      { id: 6, text: "What is service mesh?", difficulty: "Hard" },
      { id: 7, text: "How do you implement GitOps?", difficulty: "Hard" },
    ],
    "dsa-questions": [
      { id: 1, text: "Write a script to monitor server health.", difficulty: "Easy" },
      { id: 2, text: "Implement a simple load balancer.", difficulty: "Medium" },
    ],
    "aptitude-questions": [
      { id: 1, text: "Calculate uptime percentage from downtime hours.", difficulty: "Easy" },
      { id: 2, text: "Estimate cloud costs for a given architecture.", difficulty: "Medium" },
    ],
    "sql-questions": [
      { id: 1, text: "Write a query to analyze deployment frequency.", difficulty: "Medium" },
    ],
    "core-cs-questions": [
      { id: 1, text: "Explain container networking.", difficulty: "Medium" },
      { id: 2, text: "How does Kubernetes scheduling work?", difficulty: "Hard" },
    ],
  },
  "java-developer": {
    "interview-questions": [
      { id: 1, text: "Explain the difference between JDK, JRE, and JVM.", difficulty: "Easy" },
      { id: 2, text: "What is the difference between == and equals()?", difficulty: "Easy" },
      { id: 3, text: "Explain Java memory model.", difficulty: "Medium" },
      { id: 4, text: "What is the purpose of garbage collection?", difficulty: "Medium" },
      { id: 5, text: "Explain multithreading in Java.", difficulty: "Hard" },
      { id: 6, text: "What are Java design patterns?", difficulty: "Hard" },
    ],
    "dsa-questions": [
      { id: 1, text: "Implement a HashMap in Java.", difficulty: "Medium" },
      { id: 2, text: "Create a thread-safe singleton.", difficulty: "Medium" },
      { id: 3, text: "Implement a concurrent queue.", difficulty: "Hard" },
    ],
    "aptitude-questions": [
      { id: 1, text: "Calculate memory usage for Java objects.", difficulty: "Medium" },
    ],
    "sql-questions": [
      { id: 1, text: "Write a query using JDBC.", difficulty: "Easy" },
      { id: 2, text: "Explain JPA and Hibernate.", difficulty: "Medium" },
    ],
    "core-cs-questions": [
      { id: 1, text: "Explain JVM internals.", difficulty: "Hard" },
      { id: 2, text: "What is class loading in Java?", difficulty: "Medium" },
    ],
  },
  "data-analyst": {
    "interview-questions": [
      { id: 1, text: "What is data visualization?", difficulty: "Easy" },
      { id: 2, text: "How do you clean dirty data?", difficulty: "Easy" },
      { id: 3, text: "Explain different chart types and their use cases.", difficulty: "Medium" },
      { id: 4, text: "How do you present findings to stakeholders?", difficulty: "Medium" },
    ],
    "dsa-questions": [
      { id: 1, text: "Write a function to detect outliers.", difficulty: "Medium" },
    ],
    "aptitude-questions": [
      { id: 1, text: "Calculate percentage growth year over year.", difficulty: "Easy" },
      { id: 2, text: "Interpret a correlation coefficient.", difficulty: "Medium" },
    ],
    "sql-questions": [
      { id: 1, text: "Write complex aggregation queries.", difficulty: "Medium" },
      { id: 2, text: "Create a dashboard-ready query.", difficulty: "Medium" },
    ],
    "core-cs-questions": [
      { id: 1, text: "What are ETL processes?", difficulty: "Medium" },
    ],
  },
  "product-management": {
    "interview-questions": [
      { id: 1, text: "How do you prioritize features?", difficulty: "Easy" },
      { id: 2, text: "What is a product roadmap?", difficulty: "Easy" },
      { id: 3, text: "Explain the RICE framework.", difficulty: "Medium" },
      { id: 4, text: "How do you measure product success?", difficulty: "Medium" },
      { id: 5, text: "Design a product for a specific user problem.", difficulty: "Hard" },
    ],
    "dsa-questions": [],
    "aptitude-questions": [
      { id: 1, text: "Calculate market size for a new product.", difficulty: "Medium" },
      { id: 2, text: "Estimate user acquisition costs.", difficulty: "Medium" },
    ],
    "sql-questions": [
      { id: 1, text: "Write a query to calculate retention rate.", difficulty: "Medium" },
    ],
    "core-cs-questions": [],
  },
  "ux-ui-design": {
    "interview-questions": [
      { id: 1, text: "What is the design thinking process?", difficulty: "Easy" },
      { id: 2, text: "Explain the difference between UX and UI.", difficulty: "Easy" },
      { id: 3, text: "How do you conduct user research?", difficulty: "Medium" },
      { id: 4, text: "What are design systems?", difficulty: "Medium" },
      { id: 5, text: "How do you measure design success?", difficulty: "Hard" },
    ],
    "dsa-questions": [],
    "aptitude-questions": [
      { id: 1, text: "Calculate conversion rate improvements.", difficulty: "Easy" },
    ],
    "sql-questions": [],
    "core-cs-questions": [
      { id: 1, text: "How do animations affect performance?", difficulty: "Medium" },
    ],
  },
  "marketing": {
    "interview-questions": [
      { id: 1, text: "What is digital marketing?", difficulty: "Easy" },
      { id: 2, text: "Explain SEO fundamentals.", difficulty: "Easy" },
      { id: 3, text: "How do you measure campaign effectiveness?", difficulty: "Medium" },
      { id: 4, text: "What is marketing automation?", difficulty: "Medium" },
    ],
    "dsa-questions": [],
    "aptitude-questions": [
      { id: 1, text: "Calculate ROI for a marketing campaign.", difficulty: "Easy" },
      { id: 2, text: "Estimate customer acquisition cost.", difficulty: "Medium" },
    ],
    "sql-questions": [
      { id: 1, text: "Write a query to analyze campaign performance.", difficulty: "Medium" },
    ],
    "core-cs-questions": [],
  },
  "sales": {
    "interview-questions": [
      { id: 1, text: "What is the sales funnel?", difficulty: "Easy" },
      { id: 2, text: "How do you handle objections?", difficulty: "Easy" },
      { id: 3, text: "Explain solution selling.", difficulty: "Medium" },
      { id: 4, text: "How do you forecast sales?", difficulty: "Medium" },
    ],
    "dsa-questions": [],
    "aptitude-questions": [
      { id: 1, text: "Calculate sales growth rate.", difficulty: "Easy" },
      { id: 2, text: "Estimate quota attainment.", difficulty: "Medium" },
    ],
    "sql-questions": [
      { id: 1, text: "Write a query to analyze sales pipeline.", difficulty: "Medium" },
    ],
    "core-cs-questions": [],
  },
  "founders-office": {
    "interview-questions": [
      { id: 1, text: "How do you prioritize multiple projects?", difficulty: "Easy" },
      { id: 2, text: "What is stakeholder management?", difficulty: "Medium" },
      { id: 3, text: "How do you drive cross-functional initiatives?", difficulty: "Medium" },
      { id: 4, text: "What is strategic planning?", difficulty: "Hard" },
    ],
    "dsa-questions": [],
    "aptitude-questions": [
      { id: 1, text: "Calculate burn rate.", difficulty: "Easy" },
      { id: 2, text: "Estimate runway based on funding.", difficulty: "Medium" },
    ],
    "sql-questions": [],
    "core-cs-questions": [],
  },
  "blockchain": {
    "interview-questions": [
      { id: 1, text: "What is blockchain?", difficulty: "Easy" },
      { id: 2, text: "Explain consensus mechanisms.", difficulty: "Medium" },
      { id: 3, text: "What are smart contracts?", difficulty: "Medium" },
      { id: 4, text: "How do you secure a blockchain application?", difficulty: "Hard" },
    ],
    "dsa-questions": [
      { id: 1, text: "Implement a Merkle tree.", difficulty: "Hard" },
      { id: 2, text: "Create a simple blockchain.", difficulty: "Hard" },
    ],
    "aptitude-questions": [
      { id: 1, text: "Calculate gas fees for transactions.", difficulty: "Medium" },
    ],
    "sql-questions": [],
    "core-cs-questions": [
      { id: 1, text: "Explain cryptographic hashing.", difficulty: "Medium" },
      { id: 2, text: "What is proof of work vs proof of stake?", difficulty: "Hard" },
    ],
  },
  "web3": {
    "interview-questions": [
      { id: 1, text: "What is Web3?", difficulty: "Easy" },
      { id: 2, text: "Explain decentralized applications.", difficulty: "Easy" },
      { id: 3, text: "What are NFTs?", difficulty: "Easy" },
      { id: 4, text: "How do DAOs work?", difficulty: "Medium" },
      { id: 5, text: "Explain DeFi protocols.", difficulty: "Hard" },
    ],
    "dsa-questions": [
      { id: 1, text: "Implement ERC-20 token.", difficulty: "Medium" },
      { id: 2, text: "Create a simple DEX.", difficulty: "Hard" },
    ],
    "aptitude-questions": [
      { id: 1, text: "Calculate impermanent loss.", difficulty: "Hard" },
    ],
    "sql-questions": [],
    "core-cs-questions": [
      { id: 1, text: "How does IPFS work?", difficulty: "Medium" },
    ],
  },
};

// Helper function to get questions for a role and category
export const getQuestions = (roleId: string, categoryId: string): Question[] => {
  return questionsData[roleId]?.[categoryId] || [];
};

// Helper function to get all questions for a role
export const getAllQuestionsForRole = (roleId: string): Question[] => {
  const roleData = questionsData[roleId];
  if (!roleData) return [];
  
  return Object.values(roleData).flat();
};

// Helper function to get question counts by difficulty
export const getQuestionCountsByDifficulty = (questions: Question[]) => {
  return {
    easy: questions.filter(q => q.difficulty === "Easy").length,
    medium: questions.filter(q => q.difficulty === "Medium").length,
    hard: questions.filter(q => q.difficulty === "Hard").length,
    total: questions.length,
  };
};
