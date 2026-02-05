// Career Roadmaps Data - Categories, topics, and quiz questions for career guidance

export interface RoadmapQuestion {
  id: number;
  title: string;
  text: string;
  difficulty: "Easy" | "Medium" | "Hard";
  categoryId: string;
  topicId: string;
  answer: string;
  options?: { text: string; isCorrect: boolean }[];
}

export interface RoadmapTopic {
  id: string;
  name: string;
  categoryId: string;
  description?: string;
}

export interface RoadmapCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
}

// Roadmap Categories
export const roadmapCategories: RoadmapCategory[] = [
  { id: "frontend", name: "Frontend Development", icon: "Layout", color: "from-cyan-500 to-blue-500", description: "React, Vue, Angular paths" },
  { id: "backend", name: "Backend Development", icon: "Server", color: "from-emerald-500 to-teal-500", description: "Node.js, Python, Java paths" },
  { id: "fullstack", name: "Full Stack", icon: "Layers", color: "from-purple-500 to-pink-500", description: "End-to-end development" },
  { id: "devops", name: "DevOps & Cloud", icon: "Cloud", color: "from-orange-500 to-red-500", description: "AWS, Docker, Kubernetes" },
  { id: "mobile", name: "Mobile Development", icon: "Smartphone", color: "from-blue-500 to-indigo-500", description: "iOS, Android, React Native" },
  { id: "ai-ml", name: "AI & Machine Learning", icon: "Brain", color: "from-violet-500 to-purple-500", description: "ML, Deep Learning, NLP" },
  { id: "data", name: "Data Engineering", icon: "Database", color: "from-amber-500 to-orange-500", description: "Big Data, ETL, Analytics" },
];

// Roadmap Topics
export const roadmapTopics: RoadmapTopic[] = [
  // Frontend
  { id: "html-css", name: "HTML & CSS Foundations", categoryId: "frontend", description: "Core web technologies" },
  { id: "javascript-mastery", name: "JavaScript Mastery", categoryId: "frontend", description: "ES6+ and beyond" },
  { id: "frontend-framework", name: "Framework Selection", categoryId: "frontend", description: "React, Vue, or Angular" },
  { id: "frontend-tools", name: "Build Tools & Testing", categoryId: "frontend", description: "Webpack, Vite, Jest" },
  
  // Backend
  { id: "backend-lang", name: "Language Selection", categoryId: "backend", description: "Choosing your backend language" },
  { id: "api-design", name: "API Design", categoryId: "backend", description: "REST, GraphQL, gRPC" },
  { id: "databases", name: "Database Knowledge", categoryId: "backend", description: "SQL, NoSQL, caching" },
  { id: "backend-security", name: "Security Practices", categoryId: "backend", description: "Authentication, authorization" },
  
  // Full Stack
  { id: "fullstack-arch", name: "Architecture Patterns", categoryId: "fullstack", description: "MVC, microservices" },
  { id: "fullstack-tools", name: "Development Workflow", categoryId: "fullstack", description: "Git, CI/CD, testing" },
  { id: "deployment", name: "Deployment Strategies", categoryId: "fullstack", description: "Cloud platforms, containers" },
  
  // DevOps
  { id: "containers", name: "Containerization", categoryId: "devops", description: "Docker, Kubernetes" },
  { id: "ci-cd", name: "CI/CD Pipelines", categoryId: "devops", description: "Jenkins, GitHub Actions" },
  { id: "cloud-platforms", name: "Cloud Platforms", categoryId: "devops", description: "AWS, GCP, Azure" },
  { id: "infra-as-code", name: "Infrastructure as Code", categoryId: "devops", description: "Terraform, Ansible" },
  
  // Mobile
  { id: "mobile-native", name: "Native Development", categoryId: "mobile", description: "Swift, Kotlin" },
  { id: "mobile-cross", name: "Cross-Platform", categoryId: "mobile", description: "React Native, Flutter" },
  { id: "mobile-best", name: "Mobile Best Practices", categoryId: "mobile", description: "Performance, UX" },
  
  // AI/ML
  { id: "ml-foundations", name: "ML Foundations", categoryId: "ai-ml", description: "Statistics, Python" },
  { id: "ml-algorithms", name: "ML Algorithms", categoryId: "ai-ml", description: "Supervised, unsupervised" },
  { id: "deep-learning", name: "Deep Learning", categoryId: "ai-ml", description: "Neural networks, TensorFlow" },
  { id: "ml-deployment", name: "ML Deployment", categoryId: "ai-ml", description: "MLOps, serving models" },
  
  // Data Engineering
  { id: "data-pipelines", name: "Data Pipelines", categoryId: "data", description: "ETL, streaming" },
  { id: "big-data", name: "Big Data Technologies", categoryId: "data", description: "Spark, Hadoop" },
  { id: "data-warehousing", name: "Data Warehousing", categoryId: "data", description: "Snowflake, Redshift" },
];

// Roadmap Questions
export const roadmapQuestions: RoadmapQuestion[] = [
  // Frontend Development
  {
    id: 1,
    title: "Frontend Learning Order",
    text: "What's the recommended order for learning frontend development?",
    difficulty: "Easy",
    categoryId: "frontend",
    topicId: "html-css",
    answer: `## Recommended Frontend Learning Path

### Step-by-Step Order
1. **HTML** - Document structure, semantic elements
2. **CSS** - Styling, Flexbox, Grid, responsive design
3. **JavaScript** - Fundamentals, DOM manipulation
4. **Version Control** - Git basics
5. **Framework** - React/Vue/Angular
6. **Build Tools** - npm, Webpack/Vite
7. **Testing** - Jest, React Testing Library

### Timeline Estimate
- HTML/CSS: 2-4 weeks
- JavaScript: 4-8 weeks
- Framework: 4-8 weeks
- Total: 3-6 months to job-ready

### Key Principle
Master fundamentals before frameworks!`,
    options: [
      { text: "HTML → CSS → JavaScript → Git → Framework → Build Tools → Testing", isCorrect: true },
      { text: "React first, then HTML and CSS later", isCorrect: false },
      { text: "Start with TypeScript before JavaScript", isCorrect: false },
      { text: "Learn all frameworks simultaneously", isCorrect: false },
    ],
  },
  {
    id: 2,
    title: "React vs Vue vs Angular",
    text: "When should a beginner choose React over Vue or Angular?",
    difficulty: "Medium",
    categoryId: "frontend",
    topicId: "frontend-framework",
    answer: `## Framework Selection Guide

### Choose React When
- Largest job market demand
- Want maximum flexibility
- Planning to also do React Native
- Prefer learning ecosystem piece by piece

### Choose Vue When
- Prefer gentle learning curve
- Want official solutions (Vuex, Vue Router)
- Working with existing jQuery projects
- Value excellent documentation

### Choose Angular When
- Enterprise/large-scale applications
- Prefer opinionated, complete framework
- Want TypeScript from day one
- Need built-in testing tools

### Job Market Reality
React: 65% | Angular: 20% | Vue: 15%`,
    options: [
      { text: "React for largest job market and flexibility, Vue for ease, Angular for enterprise", isCorrect: true },
      { text: "They're all exactly the same, pick randomly", isCorrect: false },
      { text: "Angular is always the best choice", isCorrect: false },
      { text: "Framework choice doesn't matter for jobs", isCorrect: false },
    ],
  },
  {
    id: 3,
    title: "CSS Layout Mastery",
    text: "What CSS layout concepts are essential for modern frontend development?",
    difficulty: "Easy",
    categoryId: "frontend",
    topicId: "html-css",
    answer: `## Essential CSS Layout Concepts

### Must-Know Layouts
1. **Flexbox** - 1D layouts (rows or columns)
2. **CSS Grid** - 2D layouts (rows AND columns)
3. **Responsive Design** - Media queries, mobile-first

### When to Use What
- **Flexbox**: Navigation, card layouts, centering
- **Grid**: Page layouts, galleries, dashboards
- **Both**: Most modern layouts use both!

### Additional Concepts
- Box model (margin, padding, border)
- Positioning (relative, absolute, fixed)
- CSS Variables
- Pseudo-classes and pseudo-elements

### Learning Priority
1. Box Model → 2. Flexbox → 3. Grid → 4. Responsive`,
    options: [
      { text: "Flexbox for 1D, Grid for 2D, plus responsive design with media queries", isCorrect: true },
      { text: "Only float and positioning", isCorrect: false },
      { text: "Tables for all layouts", isCorrect: false },
      { text: "Only use CSS frameworks like Bootstrap", isCorrect: false },
    ],
  },
  {
    id: 4,
    title: "JavaScript Foundation",
    text: "What JavaScript concepts must be mastered before learning React?",
    difficulty: "Medium",
    categoryId: "frontend",
    topicId: "javascript-mastery",
    answer: `## Pre-React JavaScript Essentials

### Absolutely Required
1. **ES6+ Syntax** - const/let, arrow functions, template literals
2. **Array Methods** - map, filter, reduce, find
3. **Destructuring** - Objects and arrays
4. **Spread Operator** - ...rest and spread
5. **Promises & Async/Await** - Asynchronous code
6. **Modules** - import/export

### Important Concepts
- Closures and scope
- this keyword behavior
- DOM manipulation basics
- Event handling
- Object-oriented basics

### Common Mistake
Jumping into React without solid JS leads to confusion!`,
    options: [
      { text: "ES6+ syntax, array methods, destructuring, async/await, and modules", isCorrect: true },
      { text: "Just basic variables and loops", isCorrect: false },
      { text: "jQuery is enough", isCorrect: false },
      { text: "JavaScript isn't needed for React", isCorrect: false },
    ],
  },
  // Backend Development
  {
    id: 5,
    title: "Backend Language Selection",
    text: "How should a beginner choose their first backend programming language?",
    difficulty: "Medium",
    categoryId: "backend",
    topicId: "backend-lang",
    answer: `## Backend Language Selection Guide

### Popular Choices
1. **Node.js (JavaScript)**
   - Great if you know frontend
   - Huge npm ecosystem
   - Non-blocking I/O

2. **Python**
   - Easiest to learn
   - Great for AI/ML transition
   - Django/Flask frameworks

3. **Java**
   - Enterprise standard
   - Strong typing benefits
   - Spring ecosystem

4. **Go**
   - High performance
   - Growing demand
   - Built-in concurrency

### Decision Factors
- Job market in your area
- Type of companies (startup vs enterprise)
- Your existing skills
- Long-term career goals`,
    options: [
      { text: "Consider job market, existing skills, and career goals - all are viable choices", isCorrect: true },
      { text: "Always pick the newest language", isCorrect: false },
      { text: "Only one language works for backend", isCorrect: false },
      { text: "Backend language doesn't matter for jobs", isCorrect: false },
    ],
  },
  {
    id: 6,
    title: "REST vs GraphQL",
    text: "When should you choose GraphQL over REST API?",
    difficulty: "Hard",
    categoryId: "backend",
    topicId: "api-design",
    answer: `## REST vs GraphQL Decision Guide

### Choose REST When
- Simple CRUD operations
- Caching is important
- Team is familiar with REST
- Public APIs
- Microservices communication

### Choose GraphQL When
- Complex data relationships
- Mobile apps (minimize requests)
- Frontend needs flexibility
- Rapidly changing requirements
- Multiple client types

### Hybrid Approach
Many companies use both:
- REST for simple endpoints
- GraphQL for complex queries

### Learning Priority
Master REST first - it's more common in job requirements.`,
    options: [
      { text: "GraphQL for complex relationships and flexible clients, REST for simple CRUD and caching", isCorrect: true },
      { text: "GraphQL has completely replaced REST", isCorrect: false },
      { text: "REST is always better", isCorrect: false },
      { text: "They solve the same problems identically", isCorrect: false },
    ],
  },
  {
    id: 7,
    title: "Database Knowledge",
    text: "What database concepts should every backend developer know?",
    difficulty: "Medium",
    categoryId: "backend",
    topicId: "databases",
    answer: `## Essential Database Knowledge

### SQL Fundamentals
- CRUD operations
- JOINs (inner, left, right)
- Indexing for performance
- Transactions and ACID
- Normalization basics

### NoSQL Concepts
- Document stores (MongoDB)
- Key-value (Redis)
- When to use NoSQL vs SQL

### Advanced Topics
- Query optimization
- Database design patterns
- Replication and sharding
- Connection pooling
- ORM vs raw SQL

### Popular Choices
- PostgreSQL (most versatile)
- MySQL (widely used)
- MongoDB (document DB)
- Redis (caching)`,
    options: [
      { text: "SQL fundamentals, JOINs, indexing, transactions, and NoSQL use cases", isCorrect: true },
      { text: "Only need to know one database", isCorrect: false },
      { text: "ORMs eliminate need to learn SQL", isCorrect: false },
      { text: "NoSQL has replaced all SQL databases", isCorrect: false },
    ],
  },
  // Full Stack
  {
    id: 8,
    title: "Full Stack Architecture",
    text: "What's the most common architecture pattern for full-stack applications?",
    difficulty: "Medium",
    categoryId: "fullstack",
    topicId: "fullstack-arch",
    answer: `## Common Full Stack Architectures

### Most Popular: 3-Tier Architecture
1. **Presentation Layer** - React/Vue/Angular
2. **Business Logic Layer** - Node.js/Django/Spring
3. **Data Layer** - PostgreSQL/MongoDB

### Modern Variations
- **Serverless** - AWS Lambda + S3 + DynamoDB
- **JAMstack** - Static frontend + APIs + CDN
- **Microservices** - Independent services

### Beginner-Friendly Stack (MERN)
- MongoDB
- Express.js
- React
- Node.js

### Enterprise Stack (Java)
- React/Angular
- Spring Boot
- PostgreSQL`,
    options: [
      { text: "3-tier: Presentation (frontend), Business Logic (backend), Data (database)", isCorrect: true },
      { text: "Everything in one file", isCorrect: false },
      { text: "Frontend only with localStorage", isCorrect: false },
      { text: "Database directly connected to frontend", isCorrect: false },
    ],
  },
  {
    id: 9,
    title: "Version Control Workflow",
    text: "What Git workflow should a full-stack developer learn?",
    difficulty: "Easy",
    categoryId: "fullstack",
    topicId: "fullstack-tools",
    answer: `## Essential Git Workflow

### Basic Commands
- git clone, add, commit, push, pull
- git branch, checkout, merge
- git stash, rebase (intermediate)

### Popular Workflows
1. **Git Flow** - Feature branches, develop, main
2. **GitHub Flow** - Feature branches + PR to main
3. **Trunk-Based** - Small, frequent merges to main

### Best Practices
- Write meaningful commit messages
- Make small, focused commits
- Always pull before push
- Use branches for features
- Never force push to shared branches

### For Jobs
- Know how to create PRs
- Understand code review process
- Handle merge conflicts`,
    options: [
      { text: "Branch-based workflow with PRs, meaningful commits, and conflict resolution", isCorrect: true },
      { text: "Just commit everything to main", isCorrect: false },
      { text: "Download and upload zip files", isCorrect: false },
      { text: "Version control is optional", isCorrect: false },
    ],
  },
  // DevOps
  {
    id: 10,
    title: "Docker Fundamentals",
    text: "Why is Docker essential for modern development?",
    difficulty: "Medium",
    categoryId: "devops",
    topicId: "containers",
    answer: `## Docker Importance

### Key Benefits
1. **Consistency** - "Works on my machine" solved
2. **Isolation** - Dependencies don't conflict
3. **Portability** - Run anywhere
4. **Scalability** - Easy to replicate containers
5. **CI/CD** - Consistent build environments

### Essential Concepts
- Dockerfile (image definition)
- Images vs Containers
- Docker Compose (multi-container)
- Volumes (persistent data)
- Networking between containers

### Learning Path
1. Install Docker Desktop
2. Run existing images
3. Write simple Dockerfiles
4. Use Docker Compose
5. Understand orchestration basics`,
    options: [
      { text: "Ensures consistency, isolation, portability, and scalability across environments", isCorrect: true },
      { text: "It's just another VM technology", isCorrect: false },
      { text: "Only needed for production", isCorrect: false },
      { text: "Docker is being replaced", isCorrect: false },
    ],
  },
  {
    id: 11,
    title: "CI/CD Pipeline Basics",
    text: "What are the essential stages of a CI/CD pipeline?",
    difficulty: "Medium",
    categoryId: "devops",
    topicId: "ci-cd",
    answer: `## CI/CD Pipeline Stages

### Continuous Integration (CI)
1. **Source** - Code push triggers pipeline
2. **Build** - Compile/bundle code
3. **Test** - Run automated tests
4. **Analysis** - Code quality, security scans

### Continuous Delivery (CD)
5. **Package** - Create deployable artifact
6. **Deploy to Staging** - Test environment
7. **Integration Tests** - E2E testing
8. **Deploy to Production** - Release

### Popular Tools
- GitHub Actions
- Jenkins
- GitLab CI
- CircleCI
- AWS CodePipeline

### Key Metrics
- Build time
- Test coverage
- Deployment frequency
- Failure rate`,
    options: [
      { text: "Source → Build → Test → Analysis → Package → Stage → Integration Test → Deploy", isCorrect: true },
      { text: "Just push code and hope it works", isCorrect: false },
      { text: "Manual deployment is better", isCorrect: false },
      { text: "Only testing matters", isCorrect: false },
    ],
  },
  {
    id: 12,
    title: "Cloud Platform Selection",
    text: "How should you choose between AWS, GCP, and Azure?",
    difficulty: "Hard",
    categoryId: "devops",
    topicId: "cloud-platforms",
    answer: `## Cloud Platform Comparison

### AWS (Amazon Web Services)
- **Pros**: Largest market share, most services
- **Best for**: Enterprise, startups, general use
- **Learn first**: EC2, S3, Lambda, RDS

### GCP (Google Cloud)
- **Pros**: Best for data/ML, Kubernetes native
- **Best for**: Data engineering, ML projects
- **Learn first**: GCE, BigQuery, GKE

### Azure (Microsoft)
- **Pros**: Enterprise integrations, .NET support
- **Best for**: Microsoft shops, enterprise
- **Learn first**: VMs, App Service, Functions

### Decision Factors
- Job market (AWS dominates)
- Existing skills/ecosystem
- Specific service needs
- Pricing for your use case`,
    options: [
      { text: "AWS for market share, GCP for data/ML, Azure for enterprise/.NET - job market favors AWS", isCorrect: true },
      { text: "All clouds are identical", isCorrect: false },
      { text: "Only one cloud matters", isCorrect: false },
      { text: "On-premise is always better", isCorrect: false },
    ],
  },
  // Mobile Development
  {
    id: 13,
    title: "Native vs Cross-Platform",
    text: "When should you choose native mobile development over cross-platform?",
    difficulty: "Hard",
    categoryId: "mobile",
    topicId: "mobile-native",
    answer: `## Native vs Cross-Platform

### Choose Native When
- Maximum performance needed (games, AR)
- Complex native API usage
- Larger budget and team
- Platform-specific UX is critical

### Choose Cross-Platform When
- Faster time to market
- Shared codebase preferred
- Limited budget
- Standard app features
- Web developers on team

### Cross-Platform Options
- **React Native**: JavaScript, large community
- **Flutter**: Dart, excellent performance
- **Kotlin Multiplatform**: Native UI, shared logic

### Reality Check
70% of apps can be cross-platform
30% truly need native`,
    options: [
      { text: "Native for max performance/complex APIs, cross-platform for faster development/limited budget", isCorrect: true },
      { text: "Native is always superior", isCorrect: false },
      { text: "Cross-platform can do everything", isCorrect: false },
      { text: "Only learn one approach", isCorrect: false },
    ],
  },
  {
    id: 14,
    title: "React Native vs Flutter",
    text: "What are the key differences between React Native and Flutter?",
    difficulty: "Medium",
    categoryId: "mobile",
    topicId: "mobile-cross",
    answer: `## React Native vs Flutter

### React Native
- **Language**: JavaScript/TypeScript
- **UI**: Native components
- **Good for**: Web devs, JS ecosystem
- **Companies**: Meta, Microsoft, Shopify

### Flutter
- **Language**: Dart
- **UI**: Custom rendering (Skia)
- **Good for**: Consistent UI, animations
- **Companies**: Google, BMW, Alibaba

### Performance
Both are excellent for most apps
Flutter slightly better for animations

### Job Market (2024)
React Native: More established jobs
Flutter: Growing rapidly

### Recommendation
- Know JavaScript? → React Native
- Starting fresh? → Consider both`,
    options: [
      { text: "RN uses JS with native components, Flutter uses Dart with custom rendering - both are viable", isCorrect: true },
      { text: "Flutter has completely replaced React Native", isCorrect: false },
      { text: "React Native is always better", isCorrect: false },
      { text: "They produce identical apps", isCorrect: false },
    ],
  },
  // AI/ML
  {
    id: 15,
    title: "ML Learning Path",
    text: "What's the recommended path to start a career in Machine Learning?",
    difficulty: "Medium",
    categoryId: "ai-ml",
    topicId: "ml-foundations",
    answer: `## ML Career Path

### Foundation (3-6 months)
1. **Python** - Proficiency required
2. **Math** - Linear algebra, calculus, statistics
3. **Data manipulation** - Pandas, NumPy

### Core ML (3-6 months)
4. **ML Algorithms** - Scikit-learn
5. **Data visualization** - Matplotlib, Seaborn
6. **Feature engineering**

### Deep Learning (3-6 months)
7. **Neural networks** - PyTorch or TensorFlow
8. **Computer Vision or NLP** - Specialize
9. **Model deployment** - MLOps basics

### Portfolio Building
- Kaggle competitions
- Personal projects
- Open source contributions

### Timeline: 12-18 months to job-ready`,
    options: [
      { text: "Python → Math → Data skills → ML algorithms → Deep learning → Deployment", isCorrect: true },
      { text: "Start with deep learning directly", isCorrect: false },
      { text: "No math is needed for ML", isCorrect: false },
      { text: "Only take online courses, no practice", isCorrect: false },
    ],
  },
  {
    id: 16,
    title: "TensorFlow vs PyTorch",
    text: "Should a beginner learn TensorFlow or PyTorch first?",
    difficulty: "Medium",
    categoryId: "ai-ml",
    topicId: "deep-learning",
    answer: `## TensorFlow vs PyTorch (2024)

### PyTorch (Recommended to Start)
- **Pros**: More intuitive, better for learning
- **Best for**: Research, academia, startups
- **Companies**: Meta, OpenAI, most research labs
- **Trend**: Gaining industry adoption

### TensorFlow
- **Pros**: Production-ready, TFLite for mobile
- **Best for**: Large-scale production, edge deployment
- **Companies**: Google, many enterprises
- **Note**: TF 2.0 is much better than TF 1.x

### Recommendation
Start with PyTorch to learn concepts
Learn TensorFlow later for production

### Reality
Both are valid - concepts transfer between them`,
    options: [
      { text: "PyTorch first (more intuitive for learning), TensorFlow later for production", isCorrect: true },
      { text: "TensorFlow is obsolete", isCorrect: false },
      { text: "They're completely different paradigms", isCorrect: false },
      { text: "Only one framework exists", isCorrect: false },
    ],
  },
  {
    id: 17,
    title: "MLOps Basics",
    text: "What is MLOps and why is it important for ML engineers?",
    difficulty: "Hard",
    categoryId: "ai-ml",
    topicId: "ml-deployment",
    answer: `## Understanding MLOps

### What is MLOps?
DevOps principles applied to Machine Learning:
- Automate ML lifecycle
- Reproducible experiments
- Model monitoring and versioning
- Continuous training and deployment

### Key Components
1. **Experiment Tracking** - MLflow, Weights & Biases
2. **Feature Store** - Feast, Tecton
3. **Model Registry** - Version control for models
4. **Model Serving** - TF Serving, TorchServe
5. **Monitoring** - Data drift, model performance

### Why It Matters
- 90% of ML models never reach production
- MLOps bridges research → production gap
- Growing job demand (MLOps Engineer role)

### Learn After
Core ML skills → Then MLOps`,
    options: [
      { text: "DevOps for ML: automates lifecycle, ensures reproducibility, enables production deployment", isCorrect: true },
      { text: "Just a buzzword with no real meaning", isCorrect: false },
      { text: "Only for large companies", isCorrect: false },
      { text: "Replaces the need for ML skills", isCorrect: false },
    ],
  },
  // Data Engineering
  {
    id: 18,
    title: "Data Engineer Path",
    text: "What skills are essential for becoming a data engineer?",
    difficulty: "Medium",
    categoryId: "data",
    topicId: "data-pipelines",
    answer: `## Data Engineering Skills

### Core Skills
1. **SQL** - Advanced queries, optimization
2. **Python** - Data processing, automation
3. **ETL/ELT** - Data transformation pipelines
4. **Cloud Platforms** - AWS/GCP/Azure data services

### Big Data Tools
- Apache Spark
- Kafka (streaming)
- Airflow (orchestration)

### Data Warehousing
- Snowflake, Redshift, BigQuery
- Dimensional modeling
- Data lake architecture

### Soft Skills
- Understanding business requirements
- Data quality awareness
- Documentation

### Learning Priority
SQL → Python → Cloud → Spark → Orchestration`,
    options: [
      { text: "SQL, Python, ETL/ELT, cloud platforms, Spark, and data warehousing", isCorrect: true },
      { text: "Only SQL is needed", isCorrect: false },
      { text: "Same as data science", isCorrect: false },
      { text: "No programming required", isCorrect: false },
    ],
  },
  {
    id: 19,
    title: "Spark vs Hadoop",
    text: "Why has Apache Spark largely replaced Hadoop MapReduce?",
    difficulty: "Hard",
    categoryId: "data",
    topicId: "big-data",
    answer: `## Spark vs Hadoop MapReduce

### Spark Advantages
1. **Speed**: 100x faster (in-memory processing)
2. **Ease of Use**: Rich APIs in Python, Scala, Java
3. **Real-time**: Supports streaming
4. **Unified**: Batch, streaming, ML in one framework

### Hadoop MapReduce Limitations
- Disk-based (slow)
- Complex programming model
- Batch-only processing
- High latency

### Modern Reality
- Spark runs ON Hadoop (HDFS, YARN)
- Hadoop = storage + resource management
- MapReduce specifically is mostly replaced
- HDFS still widely used

### What to Learn
Focus on Spark, understand Hadoop ecosystem`,
    options: [
      { text: "Spark is 100x faster (in-memory), easier to use, supports streaming, and unified APIs", isCorrect: true },
      { text: "Hadoop is still the primary choice", isCorrect: false },
      { text: "They're the same technology", isCorrect: false },
      { text: "Spark doesn't work with Hadoop", isCorrect: false },
    ],
  },
  {
    id: 20,
    title: "Career Specialization Timing",
    text: "When should a developer start specializing in their career?",
    difficulty: "Medium",
    categoryId: "fullstack",
    topicId: "fullstack-arch",
    answer: `## Specialization Strategy

### Timeline Recommendation
1. **Years 0-2**: Broad foundation
   - Learn multiple technologies
   - Try different domains
   - Build diverse projects

2. **Years 2-4**: Identify interests
   - Notice what excites you
   - Explore deeper in 1-2 areas
   - Start building expertise

3. **Years 4+**: Specialize
   - Become expert in chosen area
   - Build reputation
   - Consider T-shaped skills

### T-Shaped Skills
- Broad general knowledge (horizontal)
- Deep expertise in one area (vertical)

### Avoid
- Specializing too early (limits options)
- Never specializing (limits growth)`,
    options: [
      { text: "Broad foundation (0-2 yrs), identify interests (2-4 yrs), specialize (4+ yrs)", isCorrect: true },
      { text: "Specialize immediately from day one", isCorrect: false },
      { text: "Never specialize, stay generalist forever", isCorrect: false },
      { text: "Specialization doesn't matter", isCorrect: false },
    ],
  },
  {
    id: 21,
    title: "Kubernetes Roadmap",
    text: "What should you learn before diving into Kubernetes?",
    difficulty: "Hard",
    categoryId: "devops",
    topicId: "containers",
    answer: `## Pre-Kubernetes Knowledge

### Prerequisites
1. **Docker** - Containers, images, Dockerfile
2. **Networking** - DNS, load balancing, ports
3. **Linux** - Command line, process management
4. **YAML** - Configuration files
5. **Basic Cloud** - VMs, storage, IAM

### Then Kubernetes
1. Pods and Deployments
2. Services and Ingress
3. ConfigMaps and Secrets
4. Volumes and Storage
5. Helm for packaging

### Common Mistake
Jumping to K8s without Docker knowledge
Results in confusion and frustration

### Learning Resources
- Kubernetes.io official docs
- KodeKloud, LinuxAcademy
- Hands-on with Minikube/Kind`,
    options: [
      { text: "Docker, networking, Linux, YAML, and basic cloud concepts before Kubernetes", isCorrect: true },
      { text: "Start with Kubernetes directly", isCorrect: false },
      { text: "Only cloud certifications needed", isCorrect: false },
      { text: "Kubernetes replaces need for Docker knowledge", isCorrect: false },
    ],
  },
  {
    id: 22,
    title: "Interview Preparation",
    text: "How should developers prepare for technical interviews?",
    difficulty: "Medium",
    categoryId: "fullstack",
    topicId: "fullstack-tools",
    answer: `## Technical Interview Preparation

### DSA Preparation (3-6 months)
- LeetCode: 100-150 problems
- Focus on patterns, not memorization
- Practice explaining solutions aloud

### System Design (For Senior)
- Study common patterns
- Practice with examples (Twitter, Uber)
- Understand trade-offs

### Coding Practice
- Daily practice (1-2 hours)
- Timed practice sessions
- Mock interviews

### Behavioral Prep
- STAR method for stories
- Prepare 5-7 project stories
- Research company values

### Timeline
- Start 3-6 months before applying
- Increase intensity 4-6 weeks out`,
    options: [
      { text: "DSA practice (100-150 problems), system design study, mock interviews, behavioral prep", isCorrect: true },
      { text: "Just apply and hope for the best", isCorrect: false },
      { text: "Only memorize solutions", isCorrect: false },
      { text: "One week of prep is enough", isCorrect: false },
    ],
  },
];

// Utility function to get questions by category
export const getRoadmapQuestionsByCategory = (categoryId: string): RoadmapQuestion[] => {
  return roadmapQuestions.filter((q) => q.categoryId === categoryId);
};

// Utility function to get topics by category
export const getRoadmapTopicsByCategory = (categoryId: string): RoadmapTopic[] => {
  return roadmapTopics.filter((t) => t.categoryId === categoryId);
};
