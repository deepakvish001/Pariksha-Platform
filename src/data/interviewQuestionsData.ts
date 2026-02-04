// Interview Questions Data - Comprehensive question bank organized by role
import type { Difficulty } from "./positionResourcesData";

export interface InterviewQuestion {
  id: number;
  text: string;
  difficulty: Difficulty;
  roleId: string;
  category?: string;
  answer: string;
}

export interface InterviewRole {
  id: string;
  name: string;
  icon: string;
  questionCount: number;
}

// Roles for interview questions
export const interviewRoles: InterviewRole[] = [
  { id: "frontend-developer", name: "Frontend Developer", icon: "Layout", questionCount: 192 },
  { id: "ai-ml", name: "AI & Machine Learning", icon: "Brain", questionCount: 156 },
  { id: "data-analyst", name: "Data Analyst", icon: "BarChart", questionCount: 134 },
  { id: "backend-developer", name: "Backend Developer", icon: "Server", questionCount: 178 },
  { id: "system-design", name: "System Design & Architecture", icon: "Network", questionCount: 98 },
  { id: "general", name: "General Interview Questions", icon: "MessageSquare", questionCount: 124 },
  { id: "blockchain", name: "Blockchain", icon: "Blocks", questionCount: 72 },
  { id: "web3", name: "Web3", icon: "Globe", questionCount: 68 },
  { id: "java", name: "Java", icon: "Coffee", questionCount: 145 },
  { id: "marketing", name: "Marketing", icon: "Megaphone", questionCount: 89 },
  { id: "founders-office", name: "Founders Office", icon: "Rocket", questionCount: 56 },
];

// Interview Questions organized by role
export const interviewQuestions: InterviewQuestion[] = [
  // Frontend Developer Questions
  {
    id: 1,
    text: "Explain the difference between block-level and inline-level elements in HTML, providing an example of each.",
    difficulty: "Easy",
    roleId: "frontend-developer",
    category: "HTML",
    answer: `## Block-level vs Inline-level Elements

### Block-level Elements
**Block-level elements** start on a new line and take up the full width available to them. They can contain other block or inline elements.

\`\`\`html
<div>I'm a block element</div>
<p>I'm also a block element</p>
<h1>Headings are block elements</h1>
\`\`\`

**Examples:** \`<div>\`, \`<p>\`, \`<h1>-<h6>\`, \`<section>\`, \`<article>\`, \`<header>\`, \`<footer>\`, \`<ul>\`, \`<ol>\`, \`<li>\`

### Inline-level Elements
**Inline-level elements** do not start on a new line and only take up as much width as their content requires. They typically exist *within* block-level elements.

\`\`\`html
<p>This is a <span>span element</span> inside a paragraph.</p>
<p>Click <a href="#">this link</a> for more info.</p>
\`\`\`

**Examples:** \`<span>\`, \`<a>\`, \`<strong>\`, \`<em>\`, \`<img>\`, \`<button>\`, \`<input>\`

### Key Differences

| Property | Block | Inline |
|----------|-------|--------|
| Line break | Starts new line | Flows in line |
| Width | Full container width | Content width only |
| Height/Width | Can be set | Ignored (use inline-block) |
| Margin/Padding | All sides work | Only horizontal works |`,
  },
  {
    id: 2,
    text: "What are the main differences between <ol> (ordered list) and <ul> (unordered list) HTML elements?",
    difficulty: "Easy",
    roleId: "frontend-developer",
    category: "HTML",
    answer: `## Ordered List (\`<ol>\`) vs Unordered List (\`<ul>\`)

### Ordered List (\`<ol>\`)
An **ordered list** is used when the **order of the items is important**, and it displays them with bullets. The key difference is presentation and meaning. An \`<ol>\` (ordered list) is used when the *order* of the items is important, and it displays them with bullets.

\`\`\`html
<ol>
  <li>First step</li>
  <li>Second step</li>
  <li>Third step</li>
</ol>
\`\`\`

**Use cases:**
- Step-by-step instructions
- Rankings or leaderboards
- Recipes with numbered steps
- Any sequential process

### Unordered List (\`<ul>\`)
An **unordered list** is used when the order does not matter, and it displays them with bullet points.

\`\`\`html
<ul>
  <li>Apples</li>
  <li>Oranges</li>
  <li>Bananas</li>
</ul>
\`\`\`

**Use cases:**
- Shopping lists
- Feature lists
- Navigation menus
- Any collection where order is irrelevant`,
  },
  {
    id: 3,
    text: "What is the purpose of semantic HTML and why is it more important than just using <div> tags for everything?",
    difficulty: "Easy",
    roleId: "frontend-developer",
    category: "HTML",
    answer: `## Semantic HTML

Semantic HTML uses tags that describe the **purpose of the content** they contain, such as \`<header>\`, \`<nav>\`, \`<article>\`, and \`<footer>\`. This is crucial for two reasons:

### 1. Accessibility (a11y)
Screen readers and assistive technologies use semantic elements to help users navigate the page structure, and **Search Engine Optimization (SEO)**, as it helps search engines index the content more effectively.

\`\`\`html
<!-- ❌ Non-semantic -->
<div class="header">
  <div class="nav">...</div>
</div>

<!-- ✅ Semantic -->
<header>
  <nav>...</nav>
</header>
\`\`\`

### 2. SEO Benefits
Search engines understand page structure better with semantic markup.

### Common Semantic Elements

| Element | Purpose |
|---------|---------|
| \`<header>\` | Introductory content or navigation |
| \`<nav>\` | Navigation links |
| \`<main>\` | Main content area |
| \`<article>\` | Self-contained content |
| \`<section>\` | Thematic grouping |
| \`<aside>\` | Sidebar content |
| \`<footer>\` | Footer information |
| \`<figure>\` | Self-contained media |`,
  },
  {
    id: 4,
    text: "Can you describe the differences between <html>, <head>, and <body> tags in an HTML document?",
    difficulty: "Easy",
    roleId: "frontend-developer",
    category: "HTML",
    answer: `## HTML Document Structure

### \`<html>\` Tag
The \`<html>\` tag is the **root element** of an HTML document. It contains all other elements on the page.

### \`<head>\` Tag
The \`<head>\` tag contains **meta-information** *about* the document, such as the page title (\`<title>\`), links to stylesheets (\`<link>\`), and character encoding. This information is **not visibly displayed**.

### \`<body>\` Tag
The \`<body>\` tag contains **all the visible content** of the web page, such as text, images, and links.

\`\`\`html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Page Title</title>
    <link rel="stylesheet" href="styles.css">
  </head>
  <body>
    <h1>Hello World</h1>
    <p>This is visible content.</p>
  </body>
</html>
\`\`\`

### Summary Table

| Tag | Contains | Visible? |
|-----|----------|----------|
| \`<html>\` | Everything | N/A |
| \`<head>\` | Metadata, links, scripts | No |
| \`<body>\` | Page content | Yes |`,
  },
  {
    id: 5,
    text: "What is the 'alt' attribute on an <img> tag used for, and why is it crucial for accessibility?",
    difficulty: "Easy",
    roleId: "frontend-developer",
    category: "HTML",
    answer: `## The \`alt\` Attribute

The \`alt\` (alternative text) attribute provides a **textual description** of an image. It is crucial for accessibility because it's what screen readers announce to visually impaired users, allowing them to understand the image's content.

### Purposes

1. **Accessibility**: Screen readers read the alt text aloud
2. **Fallback**: Displays if the image fails to load
3. **SEO**: Helps search engines understand image content

### Best Practices

\`\`\`html
<!-- ✅ Descriptive alt text -->
<img src="dog.jpg" alt="Golden retriever playing fetch in a park">

<!-- ✅ Decorative images should have empty alt -->
<img src="decorative-line.png" alt="">

<!-- ❌ Avoid redundant phrases -->
<img src="logo.png" alt="Image of company logo"> <!-- Bad -->
<img src="logo.png" alt="Acme Corp logo"> <!-- Good -->
\`\`\`

### Guidelines

| Image Type | Alt Text Approach |
|------------|-------------------|
| Informative | Describe content |
| Decorative | Leave empty (\`alt=""\`) |
| Functional (buttons) | Describe action |
| Complex (charts) | Provide summary |`,
  },
  {
    id: 6,
    text: "Can you explain the four components of the CSS box model and how they interact with each other?",
    difficulty: "Easy",
    roleId: "frontend-developer",
    category: "CSS",
    answer: `## The CSS Box Model

The CSS box model describes the **rectangular boxes** that are generated for elements. The four components, from the inside out, are:

### 1. Content
The text, image, or other content. You control its size with \`width\` and \`height\`.

### 2. Padding
The transparent space **around** the content, **inside** the border. It creates breathing room.

### 3. Border
The line that goes **around** the padding and content.

### 4. Margin
The transparent space **outside** the border. It creates space **between** elements.

\`\`\`css
.box {
  width: 200px;        /* Content width */
  padding: 20px;       /* Inside spacing */
  border: 2px solid;   /* Border line */
  margin: 10px;        /* Outside spacing */
}
\`\`\`

### Box Sizing

\`\`\`css
/* Default: width = content only */
box-sizing: content-box;

/* Recommended: width = content + padding + border */
box-sizing: border-box;
\`\`\`

### Visual Diagram
\`\`\`
┌─────────────────────────────┐
│          MARGIN             │
│  ┌───────────────────────┐  │
│  │       BORDER          │  │
│  │  ┌─────────────────┐  │  │
│  │  │    PADDING      │  │  │
│  │  │  ┌───────────┐  │  │  │
│  │  │  │  CONTENT  │  │  │  │
│  │  │  └───────────┘  │  │  │
│  │  └─────────────────┘  │  │
│  └───────────────────────┘  │
└─────────────────────────────┘
\`\`\``,
  },
  {
    id: 7,
    text: "What is CSS specificity, and how does the browser decide which CSS rule to apply when there are conflicts?",
    difficulty: "Easy",
    roleId: "frontend-developer",
    category: "CSS",
    answer: `## CSS Specificity

CSS Specificity is the set of rules a browser uses to determine which CSS style declaration is the most 'specific' and therefore should be applied to an element. It's a weighted system.

### Specificity Hierarchy (highest to lowest)

1. **Inline Styles** (highest) - \`style="..."\`
2. **IDs** - \`#header\`
3. **Classes/Attributes/Pseudo-classes** - \`.nav\`, \`[type="text"]\`, \`:hover\`
4. **Elements/Pseudo-elements** (lowest) - \`div\`, \`::before\`

### Calculating Specificity

Specificity is often represented as four numbers: **(a, b, c, d)**

| Selector | a | b | c | d | Total |
|----------|---|---|---|---|-------|
| \`h1\` | 0 | 0 | 0 | 1 | 0,0,0,1 |
| \`.nav\` | 0 | 0 | 1 | 0 | 0,0,1,0 |
| \`#logo\` | 0 | 1 | 0 | 0 | 0,1,0,0 |
| \`style=""\` | 1 | 0 | 0 | 0 | 1,0,0,0 |
| \`div.card p\` | 0 | 0 | 1 | 2 | 0,0,1,2 |

### Example

\`\`\`css
p { color: blue; }           /* 0,0,0,1 */
.text { color: green; }       /* 0,0,1,0 - Wins! */
#intro { color: red; }        /* 0,1,0,0 - Wins over both! */
\`\`\`

A more specific selector will always override a less specific one.`,
  },
  {
    id: 8,
    text: "What is the difference between 'padding' and 'margin' in CSS, and when would you use one over the other?",
    difficulty: "Easy",
    roleId: "frontend-developer",
    category: "CSS",
    answer: `## Padding vs Margin

Both create space, but their location differs based on the CSS box model.

### Padding
**Padding** is the space **inside** an element's border, between the border and the content. You use it to give the content 'room to breathe' within its box.

\`\`\`css
.button {
  padding: 10px 20px; /* Adds space inside the button */
}
\`\`\`

**Use padding when:**
- You want clickable area to be larger
- You need space between content and border
- Background color should extend into the space

### Margin
**Margin** is the space **outside** an element's border. You use it to create space **between** that element and other elements on the page.

\`\`\`css
.card {
  margin: 20px; /* Adds space between cards */
}
\`\`\`

**Use margin when:**
- Separating elements from each other
- Centering elements (\`margin: 0 auto\`)
- Creating layout spacing

### Key Differences

| Property | Padding | Margin |
|----------|---------|--------|
| Location | Inside border | Outside border |
| Background | Included | Not included |
| Collapsing | No | Yes (vertical) |
| Negative values | No | Yes |`,
  },
  {
    id: 9,
    text: "Explain the three main ways to add CSS to an HTML page (inline, internal, and external stylesheets).",
    difficulty: "Easy",
    roleId: "frontend-developer",
    category: "CSS",
    answer: `## Three Ways to Add CSS

### 1. Inline CSS
Styles applied directly to an element using the \`style\` attribute.

\`\`\`html
<p style="color: blue; font-size: 16px;">Hello World</p>
\`\`\`

**Pros:** Quick, highest specificity
**Cons:** Not reusable, clutters HTML, hard to maintain

### 2. Internal (Embedded) CSS
Styles placed in a \`<style>\` tag within the \`<head>\` section.

\`\`\`html
<head>
  <style>
    p {
      color: blue;
      font-size: 16px;
    }
  </style>
</head>
\`\`\`

**Pros:** No extra file, good for single-page sites
**Cons:** Not cached, duplicated across pages

### 3. External CSS
Styles in a separate \`.css\` file linked via \`<link>\` tag.

\`\`\`html
<head>
  <link rel="stylesheet" href="styles.css">
</head>
\`\`\`

\`\`\`css
/* styles.css */
p {
  color: blue;
  font-size: 16px;
}
\`\`\`

**Pros:** Reusable, cached by browser, separation of concerns
**Cons:** Extra HTTP request

### Recommendation
**External CSS** is the best practice for most projects.`,
  },
  {
    id: 10,
    text: "What are CSS pseudo-classes and pseudo-elements? Give examples of each.",
    difficulty: "Medium",
    roleId: "frontend-developer",
    category: "CSS",
    answer: `## Pseudo-classes vs Pseudo-elements

### Pseudo-classes
Select elements based on their **state** or **position**. Use single colon (\`:\`).

\`\`\`css
/* State-based */
a:hover { color: red; }
input:focus { border-color: blue; }
button:active { transform: scale(0.98); }
input:disabled { opacity: 0.5; }

/* Position-based */
li:first-child { font-weight: bold; }
li:last-child { margin-bottom: 0; }
li:nth-child(odd) { background: #f0f0f0; }
\`\`\`

### Pseudo-elements
Create **virtual elements** that don't exist in the DOM. Use double colon (\`::\`).

\`\`\`css
/* Add content before/after */
.quote::before { content: '"'; }
.quote::after { content: '"'; }

/* Style specific parts */
p::first-line { font-weight: bold; }
p::first-letter { font-size: 2em; }
::selection { background: yellow; }
input::placeholder { color: gray; }
\`\`\`

### Comparison

| Type | Syntax | Purpose | Creates Element? |
|------|--------|---------|------------------|
| Pseudo-class | \`:hover\` | State/position | No |
| Pseudo-element | \`::before\` | Virtual element | Yes |`,
  },
  // More Frontend Questions...
  {
    id: 11,
    text: "What is React's Virtual DOM and how does it improve performance?",
    difficulty: "Medium",
    roleId: "frontend-developer",
    category: "React",
    answer: `## React's Virtual DOM

The **Virtual DOM** is a lightweight JavaScript representation of the actual DOM. React uses it to minimize expensive DOM operations.

### How It Works

1. **State Change**: When state updates, React creates a new Virtual DOM tree
2. **Diffing**: React compares new and old Virtual DOM (reconciliation)
3. **Patching**: Only changed elements are updated in the real DOM

### Performance Benefits

\`\`\`jsx
// Without Virtual DOM: Updates entire list
document.getElementById('list').innerHTML = renderList(items);

// With Virtual DOM: Only updates changed items
setItems(newItems); // React diffs and patches
\`\`\`

### Key Concepts

| Concept | Description |
|---------|-------------|
| Reconciliation | Algorithm to diff two trees |
| Fiber | React's incremental rendering engine |
| Keys | Help identify which items changed |
| Batching | Groups multiple updates together |

### When Virtual DOM Helps Most
- Frequent updates to complex UIs
- Lists with many items
- Real-time data applications`,
  },
  {
    id: 12,
    text: "Explain the difference between useState and useReducer hooks in React.",
    difficulty: "Medium",
    roleId: "frontend-developer",
    category: "React",
    answer: `## useState vs useReducer

### useState
Best for **simple, independent state** values.

\`\`\`jsx
const [count, setCount] = useState(0);
const [name, setName] = useState('');

// Update
setCount(count + 1);
setCount(prev => prev + 1); // Functional update
\`\`\`

### useReducer
Best for **complex state logic** or when next state depends on previous.

\`\`\`jsx
const initialState = { count: 0, step: 1 };

function reducer(state, action) {
  switch (action.type) {
    case 'increment':
      return { ...state, count: state.count + state.step };
    case 'setStep':
      return { ...state, step: action.payload };
    default:
      return state;
  }
}

const [state, dispatch] = useReducer(reducer, initialState);

// Update
dispatch({ type: 'increment' });
dispatch({ type: 'setStep', payload: 5 });
\`\`\`

### When to Use Which

| useState | useReducer |
|----------|------------|
| Simple values | Complex objects |
| Independent updates | Related updates |
| Few state variables | Many state variables |
| Simple logic | Complex transitions |`,
  },

  // AI & Machine Learning Questions
  {
    id: 101,
    text: "What is the difference between supervised and unsupervised learning?",
    difficulty: "Easy",
    roleId: "ai-ml",
    category: "Fundamentals",
    answer: `## Supervised vs Unsupervised Learning

### Supervised Learning
Learning from **labeled data** where the correct answer is known.

**How it works:**
- Input: Features + Labels
- Goal: Learn mapping from features to labels
- Output: Predictions on new data

**Examples:**
- Classification: Spam detection, image recognition
- Regression: House price prediction, stock forecasting

\`\`\`python
# Supervised: Predicting house prices
from sklearn.linear_model import LinearRegression
model = LinearRegression()
model.fit(X_train, y_train)  # X=features, y=prices (labels)
\`\`\`

### Unsupervised Learning
Learning from **unlabeled data** to find hidden patterns.

**How it works:**
- Input: Features only (no labels)
- Goal: Discover structure in data
- Output: Clusters, patterns, representations

**Examples:**
- Clustering: Customer segmentation
- Dimensionality reduction: PCA
- Anomaly detection

\`\`\`python
# Unsupervised: Customer segmentation
from sklearn.cluster import KMeans
model = KMeans(n_clusters=3)
model.fit(X)  # No labels needed
\`\`\`

### Comparison

| Aspect | Supervised | Unsupervised |
|--------|------------|--------------|
| Data | Labeled | Unlabeled |
| Goal | Predict | Discover |
| Evaluation | Clear metrics | Subjective |`,
  },
  {
    id: 102,
    text: "Explain the bias-variance tradeoff in machine learning.",
    difficulty: "Medium",
    roleId: "ai-ml",
    category: "Fundamentals",
    answer: `## Bias-Variance Tradeoff

The total error of a model can be decomposed into:
**Total Error = Bias² + Variance + Irreducible Error**

### Bias
Error from **oversimplified assumptions**. High bias = underfitting.

\`\`\`
Model is too simple → Misses patterns → High training error
\`\`\`

### Variance
Error from **sensitivity to training data**. High variance = overfitting.

\`\`\`
Model is too complex → Memorizes noise → Low training, high test error
\`\`\`

### The Tradeoff

| Model Complexity | Bias | Variance | Result |
|------------------|------|----------|--------|
| Too simple | High | Low | Underfitting |
| Just right | Low | Low | Good generalization |
| Too complex | Low | High | Overfitting |

### Solutions

**Reduce Bias:**
- Use more complex models
- Add more features
- Reduce regularization

**Reduce Variance:**
- Get more training data
- Use regularization (L1/L2)
- Ensemble methods (Random Forest)
- Cross-validation`,
  },
  {
    id: 103,
    text: "What is gradient descent and how does it work?",
    difficulty: "Easy",
    roleId: "ai-ml",
    category: "Optimization",
    answer: `## Gradient Descent

An **optimization algorithm** to minimize a loss function by iteratively moving toward the steepest descent.

### How It Works

1. Start with random weights
2. Calculate loss (error)
3. Compute gradient (direction of steepest increase)
4. Update weights in opposite direction
5. Repeat until convergence

### The Update Rule

\`\`\`
θ = θ - α * ∇J(θ)

Where:
θ = weights/parameters
α = learning rate
∇J(θ) = gradient of loss function
\`\`\`

### Variants

| Type | Description | Use Case |
|------|-------------|----------|
| Batch GD | Uses all data | Small datasets |
| Stochastic GD | Uses one sample | Large datasets |
| Mini-batch GD | Uses batch subset | Most common |

### Python Example

\`\`\`python
for epoch in range(epochs):
    gradient = compute_gradient(X, y, weights)
    weights = weights - learning_rate * gradient
\`\`\`

### Learning Rate Importance
- **Too high**: Overshoots minimum, diverges
- **Too low**: Very slow convergence
- **Just right**: Smooth convergence`,
  },

  // Data Analyst Questions
  {
    id: 201,
    text: "What is the difference between INNER JOIN and LEFT JOIN in SQL?",
    difficulty: "Easy",
    roleId: "data-analyst",
    category: "SQL",
    answer: `## INNER JOIN vs LEFT JOIN

### INNER JOIN
Returns only rows that have **matching values in both tables**.

\`\`\`sql
SELECT orders.id, customers.name
FROM orders
INNER JOIN customers ON orders.customer_id = customers.id;
-- Only returns orders that have a matching customer
\`\`\`

### LEFT JOIN (LEFT OUTER JOIN)
Returns **all rows from the left table** and matching rows from the right table. Unmatched rows get NULL.

\`\`\`sql
SELECT customers.name, orders.id
FROM customers
LEFT JOIN orders ON customers.id = orders.customer_id;
-- Returns ALL customers, even those without orders
\`\`\`

### Visual Comparison

\`\`\`
INNER JOIN:     LEFT JOIN:
   A ∩ B           A + (A ∩ B)
   
   ┌───┐           ┌───────┐
 ┌─┤ X ├─┐         │ A │ X │
 │ └───┘ │         └───────┘
 └───────┘
\`\`\`

### When to Use

| JOIN Type | Use When |
|-----------|----------|
| INNER | Only want matched records |
| LEFT | Want all from left + matches |
| RIGHT | Want all from right + matches |
| FULL | Want all from both tables |`,
  },
  {
    id: 202,
    text: "Explain the difference between WHERE and HAVING clauses in SQL.",
    difficulty: "Easy",
    roleId: "data-analyst",
    category: "SQL",
    answer: `## WHERE vs HAVING

### WHERE Clause
Filters rows **before** grouping. Works on individual rows.

\`\`\`sql
SELECT department, COUNT(*) as emp_count
FROM employees
WHERE salary > 50000  -- Filters BEFORE grouping
GROUP BY department;
\`\`\`

### HAVING Clause
Filters groups **after** grouping. Works on aggregated results.

\`\`\`sql
SELECT department, COUNT(*) as emp_count
FROM employees
GROUP BY department
HAVING COUNT(*) > 5;  -- Filters AFTER grouping
\`\`\`

### Execution Order

\`\`\`
1. FROM      - Choose table
2. WHERE     - Filter rows
3. GROUP BY  - Create groups
4. HAVING    - Filter groups
5. SELECT    - Choose columns
6. ORDER BY  - Sort results
\`\`\`

### Key Differences

| Aspect | WHERE | HAVING |
|--------|-------|--------|
| Timing | Before GROUP BY | After GROUP BY |
| Works on | Individual rows | Groups/aggregates |
| Aggregates | Cannot use | Can use |

### Combined Example

\`\`\`sql
SELECT department, AVG(salary) as avg_salary
FROM employees
WHERE hire_date > '2020-01-01'  -- Filter employees first
GROUP BY department
HAVING AVG(salary) > 60000;     -- Then filter groups
\`\`\``,
  },

  // Backend Developer Questions
  {
    id: 301,
    text: "What is RESTful API design and what are its main principles?",
    difficulty: "Easy",
    roleId: "backend-developer",
    category: "API Design",
    answer: `## RESTful API Design

REST (Representational State Transfer) is an architectural style for designing networked applications.

### Core Principles

**1. Stateless**
Each request contains all information needed. Server doesn't store client state.

**2. Client-Server Separation**
UI and data storage are separate concerns.

**3. Uniform Interface**
- Resource identification via URIs
- Manipulation through representations
- Self-descriptive messages
- HATEOAS (hypermedia links)

**4. Cacheable**
Responses must define themselves as cacheable or not.

### HTTP Methods

| Method | Action | Example |
|--------|--------|---------|
| GET | Read | \`GET /users\` |
| POST | Create | \`POST /users\` |
| PUT | Update (full) | \`PUT /users/1\` |
| PATCH | Update (partial) | \`PATCH /users/1\` |
| DELETE | Delete | \`DELETE /users/1\` |

### Best Practices

\`\`\`
✅ /users          (plural nouns)
✅ /users/123      (resource by ID)
✅ /users/123/orders (nested resources)

❌ /getUser        (no verbs)
❌ /user_list      (no underscores)
❌ /Users          (lowercase preferred)
\`\`\``,
  },
  {
    id: 302,
    text: "Explain the difference between SQL and NoSQL databases.",
    difficulty: "Medium",
    roleId: "backend-developer",
    category: "Databases",
    answer: `## SQL vs NoSQL Databases

### SQL (Relational)
**Structured data** in tables with predefined schemas.

**Examples:** PostgreSQL, MySQL, SQLite

\`\`\`sql
CREATE TABLE users (
  id INT PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100) UNIQUE
);
\`\`\`

**Strengths:**
- ACID compliance (consistency)
- Complex queries with JOINs
- Data integrity via constraints
- Mature tooling

### NoSQL (Non-Relational)
**Flexible schemas** for unstructured/semi-structured data.

**Types:**
- **Document:** MongoDB (JSON-like)
- **Key-Value:** Redis
- **Column:** Cassandra
- **Graph:** Neo4j

\`\`\`javascript
// MongoDB document
{
  _id: ObjectId("..."),
  name: "John",
  orders: [{ item: "Book", qty: 2 }]
}
\`\`\`

### Comparison

| Aspect | SQL | NoSQL |
|--------|-----|-------|
| Schema | Fixed | Flexible |
| Scaling | Vertical | Horizontal |
| Transactions | Strong ACID | Eventual consistency |
| Joins | Native | Manual/embedded |
| Best for | Complex relations | Big data, flexibility |`,
  },

  // General Interview Questions
  {
    id: 401,
    text: "Tell me about yourself.",
    difficulty: "Easy",
    roleId: "general",
    category: "HR",
    answer: `## How to Answer "Tell Me About Yourself"

### The Framework: Present-Past-Future

**Present:** What you do now
**Past:** How you got here
**Future:** Why this opportunity

### Sample Answer

"I'm currently a software developer at [Company] where I focus on building React applications. Over the past 3 years, I've developed expertise in frontend technologies and led a team that reduced load times by 40%.

I started my career after completing my CS degree, where I discovered my passion for creating user-friendly interfaces. Since then, I've worked on e-commerce platforms and SaaS products.

I'm excited about this role because [Company]'s focus on [specific area] aligns with my interest in [relevant skill], and I see a great opportunity to contribute while growing."

### Tips

✅ Keep it under 2 minutes
✅ Be relevant to the job
✅ Show enthusiasm
✅ End with why you're here

❌ Don't recite your resume
❌ Don't be too personal
❌ Don't ramble`,
  },
  {
    id: 402,
    text: "What is your greatest strength?",
    difficulty: "Easy",
    roleId: "general",
    category: "HR",
    answer: `## Answering "What is Your Greatest Strength?"

### Strategy: Choose + Prove + Connect

**1. Choose** a relevant strength
**2. Prove** it with a specific example
**3. Connect** it to the role

### Sample Answer

"My greatest strength is **problem-solving under pressure**. 

For example, during a product launch at my previous company, we discovered a critical bug two hours before going live. I quickly assembled the team, identified the root cause in our payment flow, and implemented a fix. We launched on time with zero customer impact.

I believe this strength would be valuable here because [role/company] often deals with [relevant challenge], and I thrive in those situations."

### Strong Choices by Role

| Role | Strengths |
|------|-----------|
| Developer | Problem-solving, attention to detail |
| Manager | Communication, delegation |
| Analyst | Data-driven thinking, accuracy |
| Sales | Relationship building, persistence |

### Avoid
❌ Generic answers ("I'm hardworking")
❌ Strengths irrelevant to the job
❌ Humble brags disguised as weaknesses`,
  },
  {
    id: 403,
    text: "What is your greatest weakness?",
    difficulty: "Easy",
    roleId: "general",
    category: "HR",
    answer: `## Answering "What is Your Greatest Weakness?"

### Strategy: Real Weakness + Self-Awareness + Improvement

**1. Real:** Choose a genuine (non-critical) weakness
**2. Aware:** Show you understand its impact
**3. Improving:** Explain what you're doing about it

### Sample Answer

"I tend to **spend too much time on details** when working on projects, which can sometimes slow me down.

I've recognized this and now use timeboxing—setting strict time limits for each task. I also ask for feedback earlier in the process instead of perfecting something in isolation. These strategies have helped me deliver faster while maintaining quality."

### Good Weaknesses to Mention

| Weakness | Why It Works |
|----------|--------------|
| Public speaking | Improvable, often not core |
| Delegation | Shows you care about quality |
| Saying no | Shows you want to help |
| Perfectionism | Can be managed |

### Avoid

❌ "I work too hard" (cliché)
❌ "I'm a perfectionist" (overused)
❌ Critical job skills
❌ "I don't have any"
❌ Red flags (anger, tardiness)`,
  },
  {
    id: 404,
    text: "Where do you see yourself in 5 years?",
    difficulty: "Easy",
    roleId: "general",
    category: "HR",
    answer: `## Answering "Where Do You See Yourself in 5 Years?"

### What They're Really Asking
- Will you stay long enough to be worth training?
- Are you ambitious but realistic?
- Does this role fit your career path?

### Strategy: Align Growth with Company

**Show ambition** that benefits the company, not just yourself.

### Sample Answer

"In 5 years, I see myself as a **senior contributor** in [field], having deepened my expertise in [relevant skill]. I want to take on more complex projects and mentor junior team members.

I'm excited about [Company] because your growth in [area] means there will be opportunities to both contribute and learn. I'd love to grow into a position where I can lead initiatives while staying technically involved."

### Framework

| Year | Focus |
|------|-------|
| 1 | Master the role, learn the codebase |
| 2-3 | Take on larger projects, mentor |
| 4-5 | Lead initiatives, technical depth |

### Avoid

❌ "In your position" (threatening)
❌ "Running my own company" (flight risk)
❌ Unrealistic titles
❌ "I don't know" (seems unambitious)`,
  },

  // System Design Questions
  {
    id: 501,
    text: "How would you design a URL shortening service like bit.ly?",
    difficulty: "Medium",
    roleId: "system-design",
    category: "System Design",
    answer: `## URL Shortener System Design

### Requirements

**Functional:**
- Shorten long URLs to short codes
- Redirect short URLs to original
- Analytics (click counts)
- Custom aliases (optional)

**Non-Functional:**
- High availability (99.9%)
- Low latency (<100ms)
- 100M URLs/month write, 10B reads

### High-Level Design

\`\`\`
Client → Load Balancer → API Servers → Database
                              ↓
                          Cache (Redis)
\`\`\`

### Short Code Generation

**Option 1: Counter + Base62**
\`\`\`
Counter: 12345 → Base62: "dnh"
Characters: a-z, A-Z, 0-9 (62 chars)
6 chars = 62^6 = 56B combinations
\`\`\`

**Option 2: MD5 Hash (first 6 chars)**
\`\`\`
MD5("https://long.url") → "abc123..."
Take first 6 characters
\`\`\`

### Database Schema

\`\`\`sql
CREATE TABLE urls (
  short_code VARCHAR(10) PRIMARY KEY,
  original_url TEXT NOT NULL,
  created_at TIMESTAMP,
  click_count INT DEFAULT 0
);
\`\`\`

### Scaling Considerations

| Component | Strategy |
|-----------|----------|
| Database | Sharding by short_code |
| Cache | Redis for hot URLs |
| Reads | CDN for redirects |`,
  },
  {
    id: 502,
    text: "Design a rate limiter for an API.",
    difficulty: "Hard",
    roleId: "system-design",
    category: "System Design",
    answer: `## Rate Limiter System Design

### Purpose
Limit the number of requests a client can make in a time window.

### Algorithms

**1. Token Bucket**
\`\`\`
- Bucket holds N tokens
- Requests consume tokens
- Tokens replenish at rate R
- Request denied if no tokens
\`\`\`

**2. Sliding Window Counter**
\`\`\`
- Count requests in time window
- Window slides with time
- Smoother than fixed window
\`\`\`

### Redis Implementation

\`\`\`python
def is_allowed(user_id, limit, window):
    key = f"rate_limit:{user_id}"
    current = redis.incr(key)
    
    if current == 1:
        redis.expire(key, window)
    
    return current <= limit
\`\`\`

### System Architecture

\`\`\`
Client → Rate Limiter → API Server
              ↓
         Redis Cluster
\`\`\`

### Response Headers

\`\`\`
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1609459200
Retry-After: 60 (when limited)
\`\`\`

### Scaling

| Concern | Solution |
|---------|----------|
| Distributed | Redis Cluster |
| Multiple rules | Hierarchical limits |
| Failure mode | Allow (fail-open) |`,
  },
];

// Helper functions
export function getQuestionsByRole(roleId: string): InterviewQuestion[] {
  if (roleId === "all") return interviewQuestions;
  return interviewQuestions.filter((q) => q.roleId === roleId);
}

export function getQuestionsByDifficulty(
  questions: InterviewQuestion[],
  difficulty: Difficulty | "all"
): InterviewQuestion[] {
  if (difficulty === "all") return questions;
  return questions.filter((q) => q.difficulty === difficulty);
}

export function searchQuestions(
  questions: InterviewQuestion[],
  query: string
): InterviewQuestion[] {
  if (!query.trim()) return questions;
  const lowerQuery = query.toLowerCase();
  return questions.filter(
    (q) =>
      q.text.toLowerCase().includes(lowerQuery) ||
      q.answer.toLowerCase().includes(lowerQuery) ||
      q.category?.toLowerCase().includes(lowerQuery)
  );
}
