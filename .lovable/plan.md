
# Position Wise Resources - Complete Redesign

## Overview
This plan redesigns the Position Wise Resources page to match the reference screenshots, creating a comprehensive interview preparation system organized by job positions with categorized question types and progress tracking.

## Structure Analysis from Screenshots

The reference design shows:
1. **Header**: "Position Wise Resources" with subtitle
2. **Primary Role Tabs** (horizontally scrollable): Backend Developer, AI Engineer, Frontend Developer, Data Science & ML, System Design & Architecture, DevOps & Cloud, Java Developer, Data Analyst, Product Management, UX/UI & Design, Marketing, Sales, Founders Office, Blockchain, Web3
3. **Secondary Category Tabs**: Interview Questions, DSA Questions, Aptitude Questions, SQL Questions, Core CS Questions
4. **Content Area**: Questions table with difficulty, solved status, and revision bookmarks
5. **"My Progress" Button**: Opens progress dialog/modal

---

## Technical Implementation

### Phase 1: Data Structure Definition

Create comprehensive question data organized by:
- **Role** (Backend Developer, Frontend Developer, etc.)
- **Category** (Interview, DSA, Aptitude, SQL, Core CS)
- **Questions** with: id, question text, difficulty (Easy/Medium/Hard), solved status, revision bookmark

```text
Data Structure:
  positions/
    backend-developer/
      interview-questions: [...]
      dsa-questions: [...]
      aptitude-questions: [...]
      sql-questions: [...]
      core-cs-questions: [...]
    frontend-developer/
      ...
```

### Phase 2: UI Components

**2.1 Header Section**
- Title: "Position Wise Resources"
- Subtitle: "Prepare for your dream job with position-specific interview preparation resources."
- SidebarTrigger and icon

**2.2 Role Tabs (Primary Navigation)**
- Horizontally scrollable tab bar
- 15+ role options as shown in screenshots
- Uses ScrollArea for horizontal scrolling on smaller screens
- Active tab highlighted with underline/background

**2.3 Category Tabs (Secondary Navigation)**  
- Fixed tabs below role tabs
- 5 categories: Interview Questions, DSA Questions, Aptitude Questions, SQL Questions, Core CS Questions

**2.4 Questions Table**
- Header row with: #, Question, Difficulty, Solved (checkbox), Revision (bookmark icon)
- Dynamic title based on selected role + category
- Subtitle showing count
- "My Progress" button in header

**2.5 Progress Dialog**
- Modal showing overall progress for selected role
- Breakdown by category and difficulty
- Progress bars and statistics

### Phase 3: State Management

- `selectedRole`: Current role tab (string)
- `selectedCategory`: Current category tab (string)  
- `questions`: Filtered questions based on selections
- `progressDialog`: Boolean for progress modal visibility
- Local storage persistence for solved/revision states

### Phase 4: Questions Data

**Backend Developer - Interview Questions (50 questions total)**

Easy (11 questions):
1. What is middleware in web frameworks and how is it used?
2. How does HTTP caching work and which headers control it?
3. Explain REST vs. GraphQL and trade-offs.
4. What is CORS and how do you configure it?
5. How do you secure sensitive data at rest?
6. What is a reverse proxy and why use one?
7. Explain JSON Web Tokens (JWT) structure.
8. What is connection pooling and its benefits?
9. Describe JSON vs. Protobuf for data serialization.
10. What is TLS handshake and its purpose?
11. Explain symbolic links and their use in deployment.

Medium (23 questions):
12. What are the core principles of RESTful API design?
13. Explain the concept of database normalization and its trade-offs.
14. How would you implement pagination in a REST API?
15. How do you handle file uploads in a backend application?
16. Describe how webhooks work and how to implement retry logic.
17. How do you implement rate limiting for APIs?
18. Explain ACID properties in the context of relational databases.
19. Describe how you would manage environment-specific configurations.
20. What is a circuit breaker and how is it implemented?
21. Explain the CAP theorem and its implications for distributed systems.
22. How would you implement health checks for microservices?
23. What are the differences between monolithic and microservice architectures?
24. Explain the role of message brokers in backend systems.
25. Explain the concept of eventual consistency.
26. How do you prevent SQL injection vulnerabilities?
27. What is the role of API gateways in microservice ecosystems?
28. Explain the concept of idempotency and its importance in REST APIs.
29. What is container orchestration and why use Kubernetes?
30. Describe how you would handle long-running background jobs.
31. What is the purpose of feature flags and how do you implement them?
32. Explain how HTTP/2 improves performance over HTTP/1.1.
33. How do you implement graceful shutdown in backend services?
34. Describe best practices for API versioning.

Hard (16 questions):
35. How do you optimize database query performance in high-traffic environments?
36. What strategies ensure secure authentication for backend services?
37. Describe how you would design a logging and monitoring system.
38. Explain the difference between optimistic and pessimistic locking.
39. What is CQRS and when would you use it?
40. What considerations are important when designing microservices?
41. How would you secure communication between microservices?
42. What is database sharding and when would you use it?
43. How do you implement transactional workflows spanning multiple services?
44. How do you handle schema migrations in production databases?
45. How do you ensure database migrations are zero-downtime?
46. What is event sourcing and how does it differ from CRUD?
47. Describe how OAuth2 authorization flows work.
48. How do you implement database read replicas and sync strategies?
49. How do you manage transactional integrity across NoSQL databases?
50. What is service mesh and when would you use it?

(Similar comprehensive question sets for other roles and categories)

---

## Files to Create/Modify

### 1. `src/pages/library/PositionResources.tsx` (Major Rewrite)
Complete redesign with:
- Role tabs with horizontal scrolling
- Category tabs
- Questions table with tracking
- Progress dialog
- Local storage persistence

### 2. `src/data/positionResourcesData.ts` (New File)
Centralized data file containing:
- All 15+ role definitions
- Questions for each role/category combination
- Type definitions for roles, categories, and questions

---

## Component Architecture

```text
PositionResources
  |-- Header (title, subtitle, sidebar trigger)
  |-- RoleTabsScrollArea (horizontal scrollable role tabs)
  |-- CategoryTabs (fixed category tabs)
  |-- ContentHeader (dynamic title, subtitle, My Progress button)
  |-- QuestionsTable
  |     |-- TableHeader (#, Question, Difficulty, Solved, Revision)
  |     |-- TableBody (mapped questions with interactive rows)
  |-- ProgressDialog (modal with stats)
```

---

## Key Features

1. **Horizontal Scrollable Role Tabs**: Using ScrollArea for smooth scrolling on mobile
2. **Category Filtering**: Secondary tabs filter questions by type
3. **Progress Tracking**: Checkbox for solved, bookmark for revision
4. **Difficulty Badges**: Color-coded (Easy: green, Medium: orange, Hard: red)
5. **My Progress Modal**: Shows completion stats with visual progress indicators
6. **Persistent State**: Uses local storage to save solved/revision states
7. **Responsive Design**: Works on mobile with collapsible elements

---

## Visual Design Specifications

- **Difficulty Badge Colors**:
  - Easy: `bg-green-500/20 text-green-500`
  - Medium: `bg-orange-500/20 text-orange-500`
  - Hard: `bg-red-500/20 text-red-500`
  
- **Tab Styling**:
  - Active role tab: underline with primary color
  - Active category tab: solid background
  
- **Table Row Hover**: Subtle background change on hover
- **Checkbox/Bookmark Icons**: Toggle states with smooth transitions

---

## Implementation Order

1. Create data file with type definitions and sample data
2. Build base component structure with tabs
3. Implement questions table with static data
4. Add interactive state (solved, revision toggles)
5. Implement local storage persistence
6. Build progress dialog with statistics
7. Add animations and polish

This design follows the existing project patterns (Framer Motion animations, Tailwind styling, Shadcn/ui components) while creating a more comprehensive and interactive learning experience.
