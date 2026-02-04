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

// SQL Questions - with detailed markdown answers
export const sqlQuestions: Question[] = [
  {
    id: 1,
    text: "What is SQL and why is it important?",
    difficulty: "Easy",
    category: "Basics",
    answer: `## SQL (Structured Query Language)

SQL is the standard language for managing and manipulating relational databases.

### Why SQL is Important:
1. **Universal Standard** - Works across all major databases (MySQL, PostgreSQL, Oracle, SQL Server)
2. **Data Management** - Create, read, update, and delete data efficiently
3. **Analytics** - Powerful querying for business intelligence
4. **Career Essential** - Required skill for developers, data analysts, and data scientists

### Basic Syntax:
\`\`\`sql
-- Select all records from a table
SELECT * FROM users;

-- Insert a new record
INSERT INTO users (name, email) VALUES ('John', 'john@email.com');

-- Update a record
UPDATE users SET name = 'Jane' WHERE id = 1;

-- Delete a record
DELETE FROM users WHERE id = 1;
\`\`\``,
  },
  {
    id: 2,
    text: "What is the difference between SQL and MySQL?",
    difficulty: "Easy",
    category: "Basics",
    answer: `## SQL vs MySQL

| Aspect | SQL | MySQL |
|--------|-----|-------|
| **Type** | Language | Database Management System |
| **Purpose** | Query & manipulate data | Store & manage databases |
| **Ownership** | ANSI Standard | Oracle Corporation |
| **Flexibility** | Works with many DBMS | Specific DBMS implementation |

### Key Points:
- **SQL** is like English - it's a language for communication
- **MySQL** is like a specific library - it understands SQL and stores your books (data)

### Example Usage:
\`\`\`sql
-- This SQL syntax works in MySQL, PostgreSQL, SQL Server, etc.
SELECT name, email 
FROM customers 
WHERE country = 'India';
\`\`\``,
  },
  {
    id: 3,
    text: "What are the different types of SQL commands?",
    difficulty: "Easy",
    category: "Basics",
    answer: `## SQL Command Categories

### 1. DDL (Data Definition Language)
Defines database structure:
\`\`\`sql
CREATE TABLE users (id INT PRIMARY KEY, name VARCHAR(100));
ALTER TABLE users ADD email VARCHAR(255);
DROP TABLE users;
TRUNCATE TABLE users;
\`\`\`

### 2. DML (Data Manipulation Language)
Manipulates data:
\`\`\`sql
INSERT INTO users VALUES (1, 'John');
UPDATE users SET name = 'Jane' WHERE id = 1;
DELETE FROM users WHERE id = 1;
\`\`\`

### 3. DQL (Data Query Language)
Retrieves data:
\`\`\`sql
SELECT * FROM users WHERE name LIKE 'J%';
\`\`\`

### 4. DCL (Data Control Language)
Controls access:
\`\`\`sql
GRANT SELECT ON users TO readonly_user;
REVOKE DELETE ON users FROM temp_user;
\`\`\`

### 5. TCL (Transaction Control Language)
Manages transactions:
\`\`\`sql
BEGIN TRANSACTION;
COMMIT;
ROLLBACK;
SAVEPOINT checkpoint1;
\`\`\``,
  },
  {
    id: 4,
    text: "What is the difference between WHERE and HAVING clauses?",
    difficulty: "Medium",
    category: "Filtering",
    answer: `## WHERE vs HAVING

### WHERE Clause
- Filters **individual rows** before grouping
- Cannot use aggregate functions
- Applied **before** GROUP BY

\`\`\`sql
-- Filter rows where salary > 50000
SELECT department, COUNT(*) 
FROM employees 
WHERE salary > 50000 
GROUP BY department;
\`\`\`

### HAVING Clause
- Filters **groups** after aggregation
- Can use aggregate functions
- Applied **after** GROUP BY

\`\`\`sql
-- Filter departments with more than 5 employees
SELECT department, COUNT(*) as emp_count 
FROM employees 
GROUP BY department 
HAVING COUNT(*) > 5;
\`\`\`

### Combined Example:
\`\`\`sql
-- Employees with salary > 50000, 
-- only departments with 10+ such employees
SELECT department, COUNT(*) as high_earners
FROM employees
WHERE salary > 50000          -- Filter rows first
GROUP BY department
HAVING COUNT(*) >= 10;        -- Filter groups after
\`\`\`

| Feature | WHERE | HAVING |
|---------|-------|--------|
| Timing | Before GROUP BY | After GROUP BY |
| Aggregates | ❌ Not allowed | ✅ Allowed |
| Performance | Faster (filters early) | Slower (processes all) |`,
  },
  {
    id: 5,
    text: "Explain primary key and foreign key.",
    difficulty: "Easy",
    category: "Constraints",
    answer: `## Primary Key vs Foreign Key

### Primary Key
A column (or set of columns) that **uniquely identifies** each row in a table.

**Properties:**
- Must be **unique** for each row
- Cannot be **NULL**
- Only **one** per table (but can be composite)

\`\`\`sql
CREATE TABLE users (
  id INT PRIMARY KEY,           -- Simple primary key
  email VARCHAR(255) UNIQUE
);

-- Composite primary key
CREATE TABLE order_items (
  order_id INT,
  product_id INT,
  quantity INT,
  PRIMARY KEY (order_id, product_id)
);
\`\`\`

### Foreign Key
A column that **references** the primary key of another table, creating a relationship.

\`\`\`sql
CREATE TABLE orders (
  id INT PRIMARY KEY,
  user_id INT,
  order_date DATE,
  FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);
\`\`\`

### Visual Relationship:
\`\`\`
users (parent)          orders (child)
+----+-------+          +----+---------+
| id | name  |          | id | user_id |
+----+-------+          +----+---------+
| 1  | John  | <------- | 1  |    1    |
| 2  | Jane  | <------- | 2  |    2    |
+----+-------+          | 3  |    1    |
                        +----+---------+
\`\`\``,
  },
  {
    id: 6,
    text: "What is normalization in SQL?",
    difficulty: "Medium",
    category: "Database Design",
    answer: `## Database Normalization

Normalization is the process of organizing data to **reduce redundancy** and **improve data integrity**.

### Normal Forms:

#### 1NF (First Normal Form)
- Each column contains **atomic** (indivisible) values
- Each column contains values of a **single type**
- Each row is **unique**

\`\`\`sql
-- ❌ Not 1NF (multiple values in one column)
| id | phones              |
|----|---------------------|
| 1  | 111-1111, 222-2222  |

-- ✅ 1NF
| id | phone    |
|----|----------|
| 1  | 111-1111 |
| 1  | 222-2222 |
\`\`\`

#### 2NF (Second Normal Form)
- Must be in 1NF
- All non-key columns depend on the **entire primary key**

#### 3NF (Third Normal Form)
- Must be in 2NF
- No **transitive dependencies** (non-key depending on non-key)

\`\`\`sql
-- ❌ Not 3NF (city depends on zip, not id)
| id | zip   | city     |
|----|-------|----------|

-- ✅ 3NF (separate tables)
users: | id | zip   |
zips:  | zip | city  |
\`\`\`

### Benefits:
- ✅ Eliminates data redundancy
- ✅ Ensures data consistency
- ✅ Reduces storage space
- ✅ Simplifies updates`,
  },
  {
    id: 7,
    text: "What is denormalization?",
    difficulty: "Medium",
    category: "Database Design",
    answer: `## Denormalization

Denormalization is the **intentional** introduction of redundancy to improve **read performance**.

### When to Denormalize:
- Read-heavy applications (analytics, reporting)
- Complex queries with many joins
- Real-time dashboards

### Example:

**Normalized (3NF):**
\`\`\`sql
-- Requires JOIN for every query
SELECT o.id, u.name, p.title
FROM orders o
JOIN users u ON o.user_id = u.id
JOIN products p ON o.product_id = p.id;
\`\`\`

**Denormalized:**
\`\`\`sql
-- Faster reads, data stored together
CREATE TABLE orders_denormalized (
  id INT PRIMARY KEY,
  user_id INT,
  user_name VARCHAR(100),       -- Duplicated from users
  product_id INT,
  product_title VARCHAR(200),   -- Duplicated from products
  order_date DATE
);

SELECT id, user_name, product_title FROM orders_denormalized;
\`\`\`

### Trade-offs:

| Aspect | Normalized | Denormalized |
|--------|------------|--------------|
| Read Speed | Slower (joins) | Faster |
| Write Speed | Faster | Slower (update multiple) |
| Storage | Less | More |
| Consistency | Easier | Harder |
| Use Case | OLTP | OLAP/Analytics |`,
  },
  {
    id: 8,
    text: "What are joins in SQL?",
    difficulty: "Easy",
    category: "Joins",
    answer: `## SQL Joins

Joins combine rows from two or more tables based on a related column.

### Types of Joins:

\`\`\`
Table A (left)    Table B (right)
+----+------+     +----+------+
| id | name |     | id | dept |
+----+------+     +----+------+
| 1  | John |     | 1  | IT   |
| 2  | Jane |     | 3  | HR   |
| 3  | Bob  |
+----+------+
\`\`\`

#### INNER JOIN
Returns only matching rows:
\`\`\`sql
SELECT a.name, b.dept 
FROM A INNER JOIN B ON a.id = b.id;
-- Result: John-IT (only id=1 matches)
\`\`\`

#### LEFT JOIN
Returns all left table rows + matches:
\`\`\`sql
SELECT a.name, b.dept 
FROM A LEFT JOIN B ON a.id = b.id;
-- Result: John-IT, Jane-NULL, Bob-NULL
\`\`\`

#### RIGHT JOIN
Returns all right table rows + matches:
\`\`\`sql
SELECT a.name, b.dept 
FROM A RIGHT JOIN B ON a.id = b.id;
-- Result: John-IT, NULL-HR
\`\`\`

#### FULL OUTER JOIN
Returns all rows from both tables:
\`\`\`sql
SELECT a.name, b.dept 
FROM A FULL OUTER JOIN B ON a.id = b.id;
-- Result: John-IT, Jane-NULL, Bob-NULL, NULL-HR
\`\`\``,
  },
  {
    id: 9,
    text: "Explain INNER JOIN.",
    difficulty: "Easy",
    category: "Joins",
    answer: `## INNER JOIN

Returns only the rows that have **matching values in both tables**.

### Syntax:
\`\`\`sql
SELECT columns
FROM table1
INNER JOIN table2 ON table1.column = table2.column;
\`\`\`

### Example:
\`\`\`sql
-- Tables
employees:  | id | name  | dept_id |
departments: | id | name |

-- Query
SELECT e.name, d.name as department
FROM employees e
INNER JOIN departments d ON e.dept_id = d.id;
\`\`\`

### Visual Representation:
\`\`\`
employees          departments
+----+------+---+  +----+-------+
| 1  | John | 1 |  | 1  | IT    |
| 2  | Jane | 2 |  | 2  | HR    |
| 3  | Bob  | 4 |  | 3  | Sales |
+----+------+---+  +----+-------+

INNER JOIN Result:
+------+------+
| John | IT   |  ← id 1 matches
| Jane | HR   |  ← id 2 matches
+------+------+
Bob (dept_id=4) excluded - no matching department
Sales (id=3) excluded - no employee in that dept
\`\`\`

### Key Points:
- Most common join type
- Only returns matching rows
- Order doesn't matter (symmetric)
- \`JOIN\` and \`INNER JOIN\` are equivalent`,
  },
  {
    id: 10,
    text: "Explain LEFT JOIN.",
    difficulty: "Easy",
    category: "Joins",
    answer: `## LEFT JOIN (LEFT OUTER JOIN)

Returns **all rows from the left table** and matched rows from the right table. Unmatched right rows return NULL.

### Syntax:
\`\`\`sql
SELECT columns
FROM left_table
LEFT JOIN right_table ON left_table.col = right_table.col;
\`\`\`

### Example:
\`\`\`sql
SELECT e.name, d.name as department
FROM employees e
LEFT JOIN departments d ON e.dept_id = d.id;
\`\`\`

### Visual:
\`\`\`
employees (left)    departments (right)
+----+------+---+   +----+-------+
| 1  | John | 1 |   | 1  | IT    |
| 2  | Jane | 2 |   | 2  | HR    |
| 3  | Bob  | 4 |   | 3  | Sales |
+----+------+---+   +----+-------+

LEFT JOIN Result:
+------+------+
| John | IT   |  ← Match found
| Jane | HR   |  ← Match found
| Bob  | NULL |  ← No match, NULL from right
+------+------+
\`\`\`

### Use Cases:
- Find employees **without** a department:
\`\`\`sql
SELECT e.name
FROM employees e
LEFT JOIN departments d ON e.dept_id = d.id
WHERE d.id IS NULL;  -- Bob has no department
\`\`\`

- Count items even when none exist:
\`\`\`sql
SELECT d.name, COUNT(e.id) as employee_count
FROM departments d
LEFT JOIN employees e ON d.id = e.dept_id
GROUP BY d.name;
\`\`\``,
  },
  {
    id: 11,
    text: "What is a subquery?",
    difficulty: "Medium",
    category: "Subqueries",
    answer: `## Subqueries (Nested Queries)

A subquery is a query nested inside another SQL statement.

### Types of Subqueries:

#### 1. Scalar Subquery (returns single value)
\`\`\`sql
SELECT name, salary,
  (SELECT AVG(salary) FROM employees) as avg_salary
FROM employees;
\`\`\`

#### 2. Row Subquery (returns single row)
\`\`\`sql
SELECT * FROM employees
WHERE (dept_id, salary) = (
  SELECT dept_id, MAX(salary) 
  FROM employees 
  GROUP BY dept_id 
  LIMIT 1
);
\`\`\`

#### 3. Table Subquery (returns multiple rows)
\`\`\`sql
-- Using IN
SELECT name FROM employees
WHERE dept_id IN (
  SELECT id FROM departments WHERE location = 'NYC'
);

-- Using EXISTS
SELECT name FROM employees e
WHERE EXISTS (
  SELECT 1 FROM projects p WHERE p.lead_id = e.id
);
\`\`\`

### Correlated vs Non-Correlated:

**Non-correlated** (independent):
\`\`\`sql
SELECT * FROM employees
WHERE salary > (SELECT AVG(salary) FROM employees);
\`\`\`

**Correlated** (references outer query):
\`\`\`sql
SELECT e.name, e.salary
FROM employees e
WHERE salary > (
  SELECT AVG(salary) FROM employees 
  WHERE dept_id = e.dept_id  -- References outer query
);
\`\`\``,
  },
  {
    id: 12,
    text: "What are indexes in SQL?",
    difficulty: "Medium",
    category: "Optimization",
    answer: `## Database Indexes

An index is a data structure that improves the speed of data retrieval operations.

### How Indexes Work:
\`\`\`
Without Index (Full Table Scan):
[1, John] → [2, Jane] → [3, Bob] → ... → [10000, Alex]
Time: O(n) - must check every row

With Index (B-Tree Lookup):
                    [M]
                   /   \\
               [D-J]   [N-Z]
              /    \\
           [A-C]  [E-H]
Time: O(log n) - binary search
\`\`\`

### Creating Indexes:
\`\`\`sql
-- Single column index
CREATE INDEX idx_email ON users(email);

-- Composite index
CREATE INDEX idx_name_dept ON employees(last_name, department);

-- Unique index
CREATE UNIQUE INDEX idx_username ON users(username);
\`\`\`

### When to Use:
✅ **Good for:**
- Columns in WHERE clauses
- Columns in JOIN conditions
- Columns in ORDER BY
- High-selectivity columns

❌ **Avoid for:**
- Small tables
- Frequently updated columns
- Low-selectivity columns (gender, boolean)

### Trade-offs:
| Benefit | Cost |
|---------|------|
| Faster SELECTs | Slower INSERTs/UPDATEs |
| Faster JOINs | More storage space |
| Faster sorting | Index maintenance overhead |`,
  },
  {
    id: 13,
    text: "What is the difference between clustered and non-clustered indexes?",
    difficulty: "Medium",
    category: "Optimization",
    answer: `## Clustered vs Non-Clustered Indexes

### Clustered Index
- **Physically reorders** the table data
- Only **one per table** (usually primary key)
- The table IS the index

\`\`\`
Clustered Index on ID:
+----+-------+--------+
| 1  | John  | IT     |  ← Data stored in order
| 2  | Jane  | HR     |
| 3  | Bob   | Sales  |
+----+-------+--------+
\`\`\`

### Non-Clustered Index
- Separate structure pointing to data
- **Multiple allowed** per table
- Contains pointers to actual rows

\`\`\`
Non-Clustered Index on Name:
Index:                    Table:
+-------+------+          +----+-------+
| Bob   | →3   | ------→  | 3  | Bob   |
| Jane  | →2   | ------→  | 2  | Jane  |
| John  | →1   | ------→  | 1  | John  |
+-------+------+          +----+-------+
\`\`\`

### Comparison:

| Feature | Clustered | Non-Clustered |
|---------|-----------|---------------|
| Count per table | 1 | Multiple |
| Storage | IS the table | Separate structure |
| Speed (range) | Faster | Slower (pointer lookup) |
| Speed (point) | Similar | Similar |
| Size | Smaller | Larger (stores pointers) |

### SQL Server Example:
\`\`\`sql
-- Clustered (on primary key by default)
CREATE CLUSTERED INDEX idx_id ON users(id);

-- Non-clustered
CREATE NONCLUSTERED INDEX idx_email ON users(email);
\`\`\``,
  },
  {
    id: 14,
    text: "What is a view in SQL?",
    difficulty: "Easy",
    category: "Views",
    answer: `## SQL Views

A view is a **virtual table** based on the result of a SELECT query. It doesn't store data physically.

### Creating a View:
\`\`\`sql
CREATE VIEW active_employees AS
SELECT id, name, department, salary
FROM employees
WHERE status = 'active';

-- Using the view
SELECT * FROM active_employees WHERE salary > 50000;
\`\`\`

### Benefits:

#### 1. Simplify Complex Queries
\`\`\`sql
-- Instead of writing this every time
SELECT e.name, d.name, m.name as manager
FROM employees e
JOIN departments d ON e.dept_id = d.id
JOIN employees m ON e.manager_id = m.id;

-- Create a view
CREATE VIEW employee_details AS
SELECT e.name, d.name as dept, m.name as manager
FROM employees e
JOIN departments d ON e.dept_id = d.id
JOIN employees m ON e.manager_id = m.id;

-- Then just use
SELECT * FROM employee_details;
\`\`\`

#### 2. Security (Column-level access)
\`\`\`sql
-- Hide sensitive columns
CREATE VIEW public_employee_info AS
SELECT id, name, department  -- No salary, SSN
FROM employees;

GRANT SELECT ON public_employee_info TO public_role;
\`\`\`

#### 3. Materialized Views (cached results)
\`\`\`sql
CREATE MATERIALIZED VIEW monthly_sales AS
SELECT month, SUM(amount) as total
FROM sales
GROUP BY month;

-- Refresh when needed
REFRESH MATERIALIZED VIEW monthly_sales;
\`\`\``,
  },
  {
    id: 15,
    text: "Explain ACID properties.",
    difficulty: "Hard",
    category: "Transactions",
    answer: `## ACID Properties

ACID ensures reliable transaction processing in databases.

### A - Atomicity
**"All or Nothing"**
- Transaction completes fully or not at all
- If any part fails, entire transaction is rolled back

\`\`\`sql
BEGIN TRANSACTION;
  UPDATE accounts SET balance = balance - 100 WHERE id = 1;
  UPDATE accounts SET balance = balance + 100 WHERE id = 2;
  -- If second UPDATE fails, first is also rolled back
COMMIT;
\`\`\`

### C - Consistency
**"Valid State to Valid State"**
- Database moves from one valid state to another
- All constraints, triggers, and rules are satisfied

\`\`\`sql
-- Constraint ensures balance never goes negative
ALTER TABLE accounts ADD CONSTRAINT chk_balance 
  CHECK (balance >= 0);
\`\`\`

### I - Isolation
**"Transactions Don't Interfere"**
- Concurrent transactions behave as if sequential
- Various isolation levels control visibility

\`\`\`sql
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
BEGIN TRANSACTION;
  -- Other transactions can't see these changes until COMMIT
  UPDATE products SET stock = stock - 1;
COMMIT;
\`\`\`

### D - Durability
**"Changes Persist"**
- Once committed, changes survive system failures
- Data written to non-volatile storage

### Isolation Levels:
| Level | Dirty Read | Non-Repeatable | Phantom |
|-------|------------|----------------|---------|
| READ UNCOMMITTED | ✓ | ✓ | ✓ |
| READ COMMITTED | ✗ | ✓ | ✓ |
| REPEATABLE READ | ✗ | ✗ | ✓ |
| SERIALIZABLE | ✗ | ✗ | ✗ |`,
  },
  {
    id: 16,
    text: "What is a transaction?",
    difficulty: "Medium",
    category: "Transactions",
    answer: `## Database Transactions

A transaction is a **sequence of operations** performed as a **single logical unit of work**.

### Transaction Lifecycle:
\`\`\`sql
BEGIN TRANSACTION;

  -- Operation 1
  UPDATE accounts SET balance = balance - 500 WHERE id = 1;
  
  -- Operation 2
  UPDATE accounts SET balance = balance + 500 WHERE id = 2;
  
  -- Check for errors
  IF @@ERROR > 0
    ROLLBACK TRANSACTION;  -- Undo everything
  ELSE
    COMMIT TRANSACTION;    -- Make permanent
\`\`\`

### Key Commands:

| Command | Purpose |
|---------|---------|
| \`BEGIN\` | Start transaction |
| \`COMMIT\` | Save changes permanently |
| \`ROLLBACK\` | Undo all changes |
| \`SAVEPOINT\` | Create checkpoint for partial rollback |

### Savepoint Example:
\`\`\`sql
BEGIN TRANSACTION;
  INSERT INTO orders VALUES (1, 'Order A');
  SAVEPOINT order_created;
  
  INSERT INTO order_items VALUES (1, 'Item 1');
  INSERT INTO order_items VALUES (1, 'Item 2');
  
  -- Something goes wrong with items
  ROLLBACK TO order_created;  -- Keep order, remove items
  
  -- Fix and retry
  INSERT INTO order_items VALUES (1, 'Fixed Item');
COMMIT;
\`\`\`

### Real-World Example (Bank Transfer):
\`\`\`sql
BEGIN TRANSACTION;
  DECLARE @balance DECIMAL;
  SELECT @balance = balance FROM accounts WHERE id = 1;
  
  IF @balance >= 1000
  BEGIN
    UPDATE accounts SET balance = balance - 1000 WHERE id = 1;
    UPDATE accounts SET balance = balance + 1000 WHERE id = 2;
    COMMIT;
  END
  ELSE
    ROLLBACK;  -- Insufficient funds
\`\`\``,
  },
  {
    id: 17,
    text: "What is the difference between DELETE, TRUNCATE, and DROP?",
    difficulty: "Medium",
    category: "Data Manipulation",
    answer: `## DELETE vs TRUNCATE vs DROP

### DELETE
Removes **specific rows** from a table.

\`\`\`sql
-- Delete with condition
DELETE FROM users WHERE status = 'inactive';

-- Delete all rows (can be rolled back)
DELETE FROM users;
\`\`\`
- ✅ Can use WHERE clause
- ✅ Can be rolled back (logged operation)
- ✅ Triggers fire for each row
- ❌ Slower for large tables
- Table structure remains

### TRUNCATE
Removes **all rows** quickly.

\`\`\`sql
TRUNCATE TABLE users;
\`\`\`
- ❌ Cannot use WHERE clause
- ❌ Cannot rollback in most databases
- ❌ Triggers don't fire
- ✅ Very fast (minimal logging)
- ✅ Resets auto-increment
- Table structure remains

### DROP
Removes the **entire table**.

\`\`\`sql
DROP TABLE users;
\`\`\`
- Removes table structure
- Removes all data
- Removes indexes, constraints, triggers
- Cannot be rolled back

### Comparison:

| Feature | DELETE | TRUNCATE | DROP |
|---------|--------|----------|------|
| Rows removed | Some/All | All | All |
| Table exists after | ✅ | ✅ | ❌ |
| WHERE clause | ✅ | ❌ | ❌ |
| Rollback | ✅ | ❌ | ❌ |
| Triggers | ✅ | ❌ | ❌ |
| Speed | Slow | Fast | Fast |
| Auto-increment | Keeps | Resets | N/A |`,
  },
  {
    id: 18,
    text: "What are constraints in SQL?",
    difficulty: "Easy",
    category: "Constraints",
    answer: `## SQL Constraints

Constraints are rules enforced on table columns to ensure data integrity.

### Types of Constraints:

#### 1. PRIMARY KEY
Uniquely identifies each row.
\`\`\`sql
CREATE TABLE users (
  id INT PRIMARY KEY,
  email VARCHAR(255)
);
\`\`\`

#### 2. FOREIGN KEY
Links to another table's primary key.
\`\`\`sql
CREATE TABLE orders (
  id INT PRIMARY KEY,
  user_id INT,
  FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
);
\`\`\`

#### 3. UNIQUE
Ensures all values are different.
\`\`\`sql
CREATE TABLE users (
  id INT PRIMARY KEY,
  email VARCHAR(255) UNIQUE
);
\`\`\`

#### 4. NOT NULL
Prevents NULL values.
\`\`\`sql
CREATE TABLE users (
  id INT PRIMARY KEY,
  name VARCHAR(100) NOT NULL
);
\`\`\`

#### 5. CHECK
Validates against a condition.
\`\`\`sql
CREATE TABLE products (
  id INT PRIMARY KEY,
  price DECIMAL CHECK (price > 0),
  quantity INT CHECK (quantity >= 0)
);
\`\`\`

#### 6. DEFAULT
Sets a default value.
\`\`\`sql
CREATE TABLE users (
  id INT PRIMARY KEY,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
\`\`\`

### Adding Constraints to Existing Tables:
\`\`\`sql
ALTER TABLE users ADD CONSTRAINT uq_email UNIQUE (email);
ALTER TABLE orders ADD CONSTRAINT fk_user 
  FOREIGN KEY (user_id) REFERENCES users(id);
\`\`\``,
  },
  {
    id: 19,
    text: "What is the difference between UNION and UNION ALL?",
    difficulty: "Medium",
    category: "Set Operations",
    answer: `## UNION vs UNION ALL

Both combine results from multiple SELECT statements.

### UNION
Combines results and **removes duplicates**.

\`\`\`sql
SELECT name FROM customers
UNION
SELECT name FROM employees;
\`\`\`

### UNION ALL
Combines results and **keeps duplicates**.

\`\`\`sql
SELECT name FROM customers
UNION ALL
SELECT name FROM employees;
\`\`\`

### Example:

\`\`\`sql
-- Table A: [1, 2, 3]
-- Table B: [2, 3, 4]

SELECT * FROM A
UNION
SELECT * FROM B;
-- Result: [1, 2, 3, 4] (duplicates removed)

SELECT * FROM A
UNION ALL
SELECT * FROM B;
-- Result: [1, 2, 3, 2, 3, 4] (all rows kept)
\`\`\`

### Comparison:

| Feature | UNION | UNION ALL |
|---------|-------|-----------|
| Duplicates | Removed | Kept |
| Performance | Slower (sorts) | Faster |
| Use case | Unique results | All results |

### Rules for Both:
- Same number of columns in each SELECT
- Columns must have compatible data types
- Column names from first SELECT are used

\`\`\`sql
-- Valid
SELECT id, name FROM employees
UNION
SELECT user_id, username FROM users;

-- Invalid (different column count)
SELECT id, name, email FROM employees
UNION
SELECT id, name FROM contractors;  -- ❌ Missing column
\`\`\``,
  },
  {
    id: 20,
    text: "What is a stored procedure?",
    difficulty: "Medium",
    category: "Procedures",
    answer: `## Stored Procedures

A stored procedure is a **precompiled collection of SQL statements** stored in the database.

### Creating a Stored Procedure:
\`\`\`sql
CREATE PROCEDURE GetEmployeesByDept
  @dept_id INT
AS
BEGIN
  SELECT id, name, salary
  FROM employees
  WHERE department_id = @dept_id
  ORDER BY name;
END;
\`\`\`

### Calling a Stored Procedure:
\`\`\`sql
EXEC GetEmployeesByDept @dept_id = 5;
-- or
CALL GetEmployeesByDept(5);  -- MySQL
\`\`\`

### With Output Parameters:
\`\`\`sql
CREATE PROCEDURE GetEmployeeCount
  @dept_id INT,
  @count INT OUTPUT
AS
BEGIN
  SELECT @count = COUNT(*)
  FROM employees
  WHERE department_id = @dept_id;
END;

-- Using it
DECLARE @result INT;
EXEC GetEmployeeCount @dept_id = 5, @count = @result OUTPUT;
SELECT @result;  -- Prints count
\`\`\`

### Benefits:

| Benefit | Description |
|---------|-------------|
| **Performance** | Precompiled, cached execution plans |
| **Security** | Users can execute without direct table access |
| **Maintainability** | Logic in one place, easy updates |
| **Reduced Network** | Single call vs multiple queries |
| **Reusability** | Call from multiple applications |

### Best Practices:
- Use meaningful names (\`usp_\` prefix for user stored procedures)
- Handle errors with TRY-CATCH
- Use transactions for data modifications
- Document parameters and purpose`,
  },
];

// Interview Questions - with detailed markdown answers
export const interviewQuestions: Question[] = [
  {
    id: 1,
    text: "What is the difference between JDK, JRE, and JVM?",
    difficulty: "Easy",
    answer: `## JDK vs JRE vs JVM

### Visual Hierarchy:
\`\`\`
+------------------------+
|         JDK            |
|  +------------------+  |
|  |       JRE        |  |
|  |  +------------+  |  |
|  |  |    JVM     |  |  |
|  |  +------------+  |  |
|  |  + Libraries   |  |
|  +------------------+  |
|  + Dev Tools (javac)   |
+------------------------+
\`\`\`

### JVM (Java Virtual Machine)
The **engine** that runs Java bytecode.
- Converts bytecode to machine code
- Provides memory management (garbage collection)
- Platform-specific (different JVM for Windows, Mac, Linux)

### JRE (Java Runtime Environment)
JVM + **libraries** needed to run Java applications.
- Includes JVM
- Contains core class libraries
- For **users** who only need to run Java programs

### JDK (Java Development Kit)
JRE + **development tools**.
- Includes JRE
- \`javac\` compiler
- \`jar\` archiver
- Debugger, profiler
- For **developers** who build Java applications

### When to Use:
| Role | What You Need |
|------|---------------|
| End User | JRE |
| Developer | JDK |

### Installation Check:
\`\`\`bash
# Check Java version (JRE)
java -version

# Check compiler version (JDK)
javac -version
\`\`\``,
  },
  {
    id: 2,
    text: "Explain 'public static void main' method.",
    difficulty: "Easy",
    answer: `## The Main Method Explained

\`\`\`java
public static void main(String[] args) {
    System.out.println("Hello, World!");
}
\`\`\`

### Breaking It Down:

#### \`public\`
- **Access modifier** - visible to everyone
- JVM needs to access it from outside the class
- If private, JVM couldn't find and execute it

#### \`static\`
- Belongs to the **class**, not an instance
- JVM can call it **without creating an object**
- Memory-efficient - no object needed to start

\`\`\`java
// This is what static enables:
MyClass.main(args);  // Called on class, not object

// Without static, JVM would need to do:
MyClass obj = new MyClass();  // ❌ Chicken-egg problem
obj.main(args);
\`\`\`

#### \`void\`
- Returns **nothing**
- Program exit status handled differently (\`System.exit()\`)

#### \`main\`
- **Entry point** - exact name JVM looks for
- Convention across many languages (C, C++, Java)

#### \`String[] args\`
- **Command-line arguments** passed to program
- Array of strings

\`\`\`java
// Running: java MyApp hello world
public static void main(String[] args) {
    System.out.println(args[0]);  // "hello"
    System.out.println(args[1]);  // "world"
    System.out.println(args.length);  // 2
}
\`\`\`

### Common Mistakes:
\`\`\`java
// ❌ Wrong method signatures
public void main(String[] args)        // Missing static
static void main(String[] args)        // Missing public
public static void main(String args)   // Not an array
public static int main(String[] args)  // Returns int
\`\`\``,
  },
  {
    id: 3,
    text: "What are the 4 pillars of OOP?",
    difficulty: "Easy",
    answer: `## Four Pillars of Object-Oriented Programming

### 1. Encapsulation 🔒
**Bundling data with methods that operate on it, hiding internal details.**

\`\`\`java
public class BankAccount {
    private double balance;  // Hidden from outside
    
    public void deposit(double amount) {
        if (amount > 0) {
            balance += amount;  // Controlled access
        }
    }
    
    public double getBalance() {
        return balance;  // Read-only access
    }
}
\`\`\`

### 2. Inheritance 👨‍👧
**A class inherits properties and methods from a parent class.**

\`\`\`java
class Animal {
    void eat() { System.out.println("Eating..."); }
}

class Dog extends Animal {
    void bark() { System.out.println("Woof!"); }
}

Dog dog = new Dog();
dog.eat();   // Inherited from Animal
dog.bark();  // Own method
\`\`\`

### 3. Polymorphism 🎭
**Same interface, different implementations.**

\`\`\`java
class Animal {
    void makeSound() { System.out.println("..."); }
}

class Dog extends Animal {
    @Override
    void makeSound() { System.out.println("Woof!"); }
}

class Cat extends Animal {
    @Override
    void makeSound() { System.out.println("Meow!"); }
}

// Runtime polymorphism
Animal animal = new Dog();
animal.makeSound();  // "Woof!"
\`\`\`

### 4. Abstraction 🎨
**Hiding complexity, showing only essential features.**

\`\`\`java
abstract class Vehicle {
    abstract void start();  // What to do, not how
}

class Car extends Vehicle {
    @Override
    void start() {
        // Complex implementation hidden
        ignition();
        fuelInjection();
        engineStart();
    }
}
\`\`\`

### Summary:
| Pillar | Purpose | Keyword |
|--------|---------|---------|
| Encapsulation | Data protection | \`private\` |
| Inheritance | Code reuse | \`extends\` |
| Polymorphism | Flexibility | \`@Override\` |
| Abstraction | Simplification | \`abstract\` |`,
  },
  {
    id: 4,
    text: "Difference between '==' and '.equals()'?",
    difficulty: "Easy",
    answer: `## == vs .equals() in Java

### \`==\` Operator
Compares **memory addresses** (reference comparison).

### \`.equals()\` Method
Compares **content/values** (logical equality).

### Example with Strings:
\`\`\`java
String a = new String("Hello");
String b = new String("Hello");
String c = a;

// Memory layout:
// a → [Memory: 1000] → "Hello"
// b → [Memory: 2000] → "Hello"
// c → [Memory: 1000] → "Hello" (same as a)

System.out.println(a == b);       // false (different addresses)
System.out.println(a == c);       // true (same address)
System.out.println(a.equals(b));  // true (same content)
\`\`\`

### String Pool Exception:
\`\`\`java
String x = "Hello";  // String pool
String y = "Hello";  // Same pool reference

System.out.println(x == y);       // true! (same pool address)
System.out.println(x.equals(y));  // true (same content)
\`\`\`

### With Primitives:
\`\`\`java
int a = 5;
int b = 5;

System.out.println(a == b);  // true (values compared)
// a.equals(b);  // ❌ Error - primitives don't have methods
\`\`\`

### Custom Objects:
\`\`\`java
class Person {
    String name;
    
    Person(String name) { this.name = name; }
    
    @Override
    public boolean equals(Object obj) {
        if (obj instanceof Person) {
            return this.name.equals(((Person) obj).name);
        }
        return false;
    }
}

Person p1 = new Person("John");
Person p2 = new Person("John");

System.out.println(p1 == p2);       // false
System.out.println(p1.equals(p2));  // true
\`\`\`

### Quick Reference:
| Type | \`==\` | \`.equals()\` |
|------|-------|--------------|
| Primitives | Value | N/A |
| Objects | Address | Content |`,
  },
  {
    id: 5,
    text: "Why is String immutable (unchangeable)?",
    difficulty: "Easy",
    answer: `## String Immutability in Java

Once created, a String object **cannot be modified**.

### What Happens When You "Change" a String:
\`\`\`java
String s = "Hello";
s = s + " World";

// Memory:
// Step 1: s → "Hello"
// Step 2: s → "Hello World" (NEW object created)
//         "Hello" still exists in memory
\`\`\`

### Reasons for Immutability:

#### 1. String Pool Optimization
\`\`\`java
String a = "Hello";
String b = "Hello";
// Both point to SAME object in String Pool

// If mutable:
a.setValue("Hi");  // Would change b too! 😱
\`\`\`

#### 2. Security
\`\`\`java
void connect(String host) {
    // Security check
    if (isValidHost(host)) {
        // If String were mutable, attacker could change
        // host value AFTER validation but BEFORE use
        openConnection(host);
    }
}
\`\`\`

#### 3. Thread Safety
\`\`\`java
// Immutable = automatically thread-safe
// Multiple threads can read same String safely
String shared = "Config Value";
// No synchronization needed
\`\`\`

#### 4. Hash Code Caching
\`\`\`java
// String caches its hashCode
// Used in HashMap, HashSet
Map<String, User> users = new HashMap<>();
users.put("john", user);

// If String changed, hashCode would change
// HashMap would lose the entry!
\`\`\`

### StringBuilder for Mutable Strings:
\`\`\`java
StringBuilder sb = new StringBuilder("Hello");
sb.append(" World");  // Modifies same object
String result = sb.toString();
\`\`\`

### Performance Tip:
\`\`\`java
// ❌ Bad (creates many temporary objects)
String s = "";
for (int i = 0; i < 1000; i++) {
    s += i;  // New String each iteration
}

// ✅ Good (single mutable object)
StringBuilder sb = new StringBuilder();
for (int i = 0; i < 1000; i++) {
    sb.append(i);
}
String s = sb.toString();
\`\`\``,
  },
  {
    id: 6,
    text: "What are Wrapper Classes?",
    difficulty: "Easy",
    answer: `## Wrapper Classes in Java

Wrapper classes convert **primitives** into **objects**.

### Primitive to Wrapper Mapping:
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

### Why We Need Wrapper Classes:

#### 1. Collections Require Objects
\`\`\`java
List<int> numbers;     // ❌ Error
List<Integer> numbers; // ✅ Works

ArrayList<Integer> list = new ArrayList<>();
list.add(5);  // Autoboxing: int → Integer
\`\`\`

#### 2. Null Values
\`\`\`java
int x = null;      // ❌ Error
Integer y = null;  // ✅ Valid - represents "no value"
\`\`\`

#### 3. Utility Methods
\`\`\`java
String s = "123";
int num = Integer.parseInt(s);     // String → int
String binary = Integer.toBinaryString(10);  // "1010"
int max = Integer.MAX_VALUE;       // 2147483647
\`\`\`

### Autoboxing and Unboxing:
\`\`\`java
// Autoboxing (primitive → object)
Integer obj = 5;  // Compiler does: Integer.valueOf(5)

// Unboxing (object → primitive)
int value = obj;  // Compiler does: obj.intValue()

// In expressions
Integer a = 10;
Integer b = 20;
int sum = a + b;  // Auto-unboxed, added, result is primitive
\`\`\`

### Gotcha - Comparison:
\`\`\`java
Integer a = 100;
Integer b = 100;
System.out.println(a == b);  // true (cached: -128 to 127)

Integer x = 200;
Integer y = 200;
System.out.println(x == y);  // false (different objects)
System.out.println(x.equals(y));  // true (same value)
\`\`\``,
  },
  {
    id: 7,
    text: "What is the 'final' keyword?",
    difficulty: "Easy",
    answer: `## The \`final\` Keyword in Java

Means **"cannot be changed"** - applies to variables, methods, and classes.

### 1. Final Variables (Constants)
\`\`\`java
final int MAX_SIZE = 100;
MAX_SIZE = 200;  // ❌ Compilation Error

// Final reference (object can change, reference can't)
final List<String> list = new ArrayList<>();
list.add("Hello");  // ✅ Modifying object is OK
list = new ArrayList<>();  // ❌ Can't reassign reference
\`\`\`

### 2. Final Methods (Cannot Override)
\`\`\`java
class Parent {
    final void important() {
        System.out.println("Cannot change this!");
    }
}

class Child extends Parent {
    @Override
    void important() {  // ❌ Compilation Error
        System.out.println("Trying to change...");
    }
}
\`\`\`

### 3. Final Classes (Cannot Extend)
\`\`\`java
final class Secure {
    // Nobody can subclass this
}

class Hacker extends Secure {  // ❌ Compilation Error
    // Can't inherit
}

// Built-in examples: String, Integer, Math
\`\`\`

### Best Practices:
\`\`\`java
// Constants (UPPER_SNAKE_CASE)
public static final double PI = 3.14159;

// Immutable method parameters
public void process(final String input) {
    input = "new value";  // ❌ Prevents accidental reassignment
}

// Effectively final (for lambdas)
String message = "Hello";  // Effectively final
Runnable r = () -> System.out.println(message);
\`\`\`

### Summary:
| Applied To | Effect |
|------------|--------|
| Variable | Value can't change |
| Method | Can't be overridden |
| Class | Can't be extended |
| Parameter | Can't be reassigned |`,
  },
  {
    id: 8,
    text: "What is a Constructor?",
    difficulty: "Easy",
    answer: `## Constructors in Java

A constructor is a **special method** that initializes an object when it's created.

### Basic Constructor:
\`\`\`java
class Person {
    String name;
    int age;
    
    // Constructor - same name as class, no return type
    Person(String name, int age) {
        this.name = name;
        this.age = age;
    }
}

// Usage
Person p = new Person("John", 25);
\`\`\`

### Types of Constructors:

#### 1. Default Constructor
\`\`\`java
class Person {
    String name;
    // Compiler adds: Person() { }
}

Person p = new Person();  // Works
\`\`\`

#### 2. Parameterized Constructor
\`\`\`java
class Person {
    String name;
    
    Person(String name) {
        this.name = name;
    }
}

Person p = new Person("John");
\`\`\`

#### 3. Copy Constructor
\`\`\`java
class Person {
    String name;
    
    Person(Person other) {
        this.name = other.name;
    }
}

Person original = new Person("John");
Person copy = new Person(original);
\`\`\`

### Constructor Chaining:
\`\`\`java
class Person {
    String name;
    int age;
    String country;
    
    Person() {
        this("Unknown", 0);  // Calls another constructor
    }
    
    Person(String name, int age) {
        this(name, age, "India");  // Chains to full constructor
    }
    
    Person(String name, int age, String country) {
        this.name = name;
        this.age = age;
        this.country = country;
    }
}
\`\`\`

### Key Rules:
| Rule | Example |
|------|---------|
| Same name as class | \`class Car { Car() {} }\` |
| No return type | Not even \`void\` |
| Called with \`new\` | \`new Car()\` |
| \`this()\` must be first | For constructor chaining |`,
  },
  {
    id: 9,
    text: "StringBuffer vs StringBuilder?",
    difficulty: "Easy",
    answer: `## StringBuffer vs StringBuilder

Both are **mutable** alternatives to String for efficient string manipulation.

### Key Difference:
| Feature | StringBuffer | StringBuilder |
|---------|--------------|---------------|
| Thread Safety | ✅ Synchronized | ❌ Not synchronized |
| Performance | Slower | Faster |
| Use Case | Multi-threaded | Single-threaded |

### StringBuffer (Thread-Safe):
\`\`\`java
// Methods are synchronized - one thread at a time
StringBuffer sb = new StringBuffer("Hello");
sb.append(" World");

// Safe for multiple threads
public synchronized StringBuffer append(String str) {
    // Only one thread can execute at a time
}
\`\`\`

### StringBuilder (Fast):
\`\`\`java
// Not synchronized - fastest option
StringBuilder sb = new StringBuilder("Hello");
sb.append(" World");

// Use for single-threaded code
// 10-15% faster than StringBuffer
\`\`\`

### Common Methods (Both Have Same API):
\`\`\`java
StringBuilder sb = new StringBuilder();

sb.append("Hello");           // Add to end
sb.insert(0, "Start: ");      // Insert at position
sb.delete(0, 5);              // Remove range
sb.reverse();                 // Reverse string
sb.replace(0, 3, "NEW");      // Replace range
sb.toString();                // Convert to String
\`\`\`

### Performance Comparison:
\`\`\`java
// String concatenation (creates many objects)
String s = "";
for (int i = 0; i < 10000; i++) {
    s += i;  // ❌ Slow - O(n²) time, many objects
}

// StringBuilder (reuses one object)
StringBuilder sb = new StringBuilder();
for (int i = 0; i < 10000; i++) {
    sb.append(i);  // ✅ Fast - O(n) time
}
String result = sb.toString();
\`\`\`

### When to Use What:
| Scenario | Use |
|----------|-----|
| Immutable string | \`String\` |
| Single thread, mutable | \`StringBuilder\` |
| Multi-thread, mutable | \`StringBuffer\` |`,
  },
  {
    id: 10,
    text: "What is the 'static' keyword?",
    difficulty: "Easy",
    answer: `## The \`static\` Keyword in Java

\`static\` means **"belongs to the class"** rather than instances.

### Static Variables (Class Variables):
\`\`\`java
class Student {
    static String schoolName = "ABC School";  // Shared
    String name;  // Instance-specific
    
    static int studentCount = 0;
    
    Student(String name) {
        this.name = name;
        studentCount++;  // Increment shared counter
    }
}

// All students share the same schoolName
Student s1 = new Student("John");
Student s2 = new Student("Jane");

System.out.println(Student.studentCount);  // 2
System.out.println(Student.schoolName);    // "ABC School"
\`\`\`

### Static Methods:
\`\`\`java
class MathUtils {
    static int add(int a, int b) {
        return a + b;
    }
}

// No object needed
int sum = MathUtils.add(5, 3);  // 8
\`\`\`

### Static Block (Initialization):
\`\`\`java
class Config {
    static Map<String, String> settings;
    
    static {
        // Runs once when class loads
        settings = new HashMap<>();
        settings.put("theme", "dark");
        settings.put("language", "en");
    }
}
\`\`\`

### Static Inner Class:
\`\`\`java
class Outer {
    static class Inner {
        // Can exist without Outer instance
    }
}

Outer.Inner inner = new Outer.Inner();  // No Outer needed
\`\`\`

### Rules & Restrictions:
| Can Access | From Static | From Instance |
|------------|-------------|---------------|
| Static members | ✅ | ✅ |
| Instance members | ❌ | ✅ |
| \`this\` keyword | ❌ | ✅ |

\`\`\`java
class Example {
    int instanceVar = 10;
    static int staticVar = 20;
    
    static void staticMethod() {
        System.out.println(staticVar);   // ✅ OK
        System.out.println(instanceVar); // ❌ Error
    }
}
\`\`\``,
  },
  {
    id: 11,
    text: "What is method overloading vs method overriding?",
    difficulty: "Medium",
    answer: `## Method Overloading vs Overriding

### Method Overloading (Compile-time Polymorphism)
**Same method name, different parameters** - in the SAME class.

\`\`\`java
class Calculator {
    // Same name, different parameter types/count
    int add(int a, int b) {
        return a + b;
    }
    
    double add(double a, double b) {
        return a + b;
    }
    
    int add(int a, int b, int c) {
        return a + b + c;
    }
}

Calculator calc = new Calculator();
calc.add(1, 2);        // Calls int version
calc.add(1.5, 2.5);    // Calls double version
calc.add(1, 2, 3);     // Calls three-param version
\`\`\`

### Method Overriding (Runtime Polymorphism)
**Same signature, different implementation** - in PARENT and CHILD class.

\`\`\`java
class Animal {
    void makeSound() {
        System.out.println("Some sound");
    }
}

class Dog extends Animal {
    @Override
    void makeSound() {
        System.out.println("Bark!");
    }
}

class Cat extends Animal {
    @Override
    void makeSound() {
        System.out.println("Meow!");
    }
}

Animal animal = new Dog();
animal.makeSound();  // "Bark!" - determined at runtime
\`\`\`

### Comparison:
| Feature | Overloading | Overriding |
|---------|-------------|------------|
| Where | Same class | Parent-Child |
| Parameters | Must differ | Must be same |
| Return type | Can differ | Must be same/covariant |
| Access | Any | Same or wider |
| Binding | Compile-time | Runtime |
| \`static\` | Can overload | Cannot override |
| \`final\` | Can overload | Cannot override |

### Quick Rules:
\`\`\`java
// Overloading: Change PARAMETERS
add(int)  → add(int, int)  ✅
add(int)  → add(double)    ✅

// Overriding: Keep SIGNATURE, change BODY
Parent: void eat() { ... }
Child:  void eat() { different... }  ✅
\`\`\``,
  },
  {
    id: 12,
    text: "What is an abstract class vs interface?",
    difficulty: "Medium",
    answer: `## Abstract Class vs Interface

### Abstract Class
A class that **cannot be instantiated** and may contain abstract methods.

\`\`\`java
abstract class Vehicle {
    String brand;
    
    // Concrete method
    void startEngine() {
        System.out.println("Engine started");
    }
    
    // Abstract method (no body)
    abstract void move();
}

class Car extends Vehicle {
    @Override
    void move() {
        System.out.println("Car drives on road");
    }
}
\`\`\`

### Interface
A **contract** defining what a class must do (not how).

\`\`\`java
interface Flyable {
    void fly();  // implicitly public abstract
    
    // Java 8+ default method
    default void land() {
        System.out.println("Landing...");
    }
    
    // Java 8+ static method
    static void checkWeather() {
        System.out.println("Weather is fine");
    }
}

class Bird implements Flyable {
    @Override
    public void fly() {
        System.out.println("Bird flaps wings");
    }
}
\`\`\`

### Key Differences:

| Feature | Abstract Class | Interface |
|---------|----------------|-----------|
| Keyword | \`extends\` | \`implements\` |
| Multiple | Single inheritance | Multiple allowed |
| Variables | Any type | Only \`public static final\` |
| Methods | Any visibility | Only \`public\` |
| Constructor | ✅ Yes | ❌ No |
| State | ✅ Instance variables | ❌ Constants only |

### When to Use:

**Abstract Class** - "IS-A" relationship with shared code:
\`\`\`java
abstract class Animal {
    protected String name;  // Shared state
    void breathe() { }      // Shared behavior
    abstract void move();   // Child-specific
}
\`\`\`

**Interface** - "CAN-DO" capability:
\`\`\`java
interface Swimmable { void swim(); }
interface Flyable { void fly(); }

class Duck implements Swimmable, Flyable {
    // Duck can do multiple things
}
\`\`\``,
  },
  {
    id: 13,
    text: "What is exception handling in Java?",
    difficulty: "Medium",
    answer: `## Exception Handling in Java

Mechanism to handle **runtime errors** gracefully.

### Try-Catch-Finally:
\`\`\`java
try {
    // Risky code
    int result = 10 / 0;
} catch (ArithmeticException e) {
    // Handle specific exception
    System.out.println("Cannot divide by zero!");
} catch (Exception e) {
    // Handle any other exception
    System.out.println("Something went wrong: " + e.getMessage());
} finally {
    // Always executes (cleanup)
    System.out.println("Cleanup complete");
}
\`\`\`

### Exception Hierarchy:
\`\`\`
Throwable
├── Error (serious, don't catch)
│   ├── OutOfMemoryError
│   └── StackOverflowError
└── Exception
    ├── Checked (must handle)
    │   ├── IOException
    │   └── SQLException
    └── RuntimeException (unchecked)
        ├── NullPointerException
        ├── ArrayIndexOutOfBoundsException
        └── ArithmeticException
\`\`\`

### Checked vs Unchecked:
\`\`\`java
// Checked - compiler forces handling
public void readFile() throws IOException {
    FileReader fr = new FileReader("file.txt");
}

// Unchecked - runtime errors
public void divide(int a, int b) {
    return a / b;  // ArithmeticException if b=0
}
\`\`\`

### Throw vs Throws:
\`\`\`java
// throw - actually throw an exception
throw new IllegalArgumentException("Invalid input");

// throws - declare that method might throw
public void process() throws IOException, SQLException {
    // ...
}
\`\`\`

### Try-With-Resources (Java 7+):
\`\`\`java
// Automatically closes resources
try (FileReader fr = new FileReader("file.txt");
     BufferedReader br = new BufferedReader(fr)) {
    String line = br.readLine();
} catch (IOException e) {
    e.printStackTrace();
}
// fr and br automatically closed
\`\`\`

### Custom Exception:
\`\`\`java
class InsufficientFundsException extends Exception {
    public InsufficientFundsException(String message) {
        super(message);
    }
}

void withdraw(double amount) throws InsufficientFundsException {
    if (amount > balance) {
        throw new InsufficientFundsException("Not enough balance");
    }
}
\`\`\``,
  },
  {
    id: 14,
    text: "What is multithreading in Java?",
    difficulty: "Hard",
    answer: `## Multithreading in Java

Executing **multiple threads simultaneously** for concurrent programming.

### Creating Threads:

#### 1. Extending Thread Class:
\`\`\`java
class MyThread extends Thread {
    @Override
    public void run() {
        System.out.println("Thread running: " + getName());
    }
}

MyThread t = new MyThread();
t.start();  // Don't call run() directly!
\`\`\`

#### 2. Implementing Runnable:
\`\`\`java
class MyRunnable implements Runnable {
    @Override
    public void run() {
        System.out.println("Runnable running");
    }
}

Thread t = new Thread(new MyRunnable());
t.start();

// Lambda version (Java 8+)
new Thread(() -> System.out.println("Lambda thread")).start();
\`\`\`

### Thread Lifecycle:
\`\`\`
NEW → start() → RUNNABLE ←→ RUNNING
                    ↓
              BLOCKED/WAITING
                    ↓
               TERMINATED
\`\`\`

### Synchronization (Thread Safety):
\`\`\`java
class Counter {
    private int count = 0;
    
    // Only one thread at a time
    synchronized void increment() {
        count++;
    }
    
    // Synchronized block (finer control)
    void incrementWithBlock() {
        synchronized(this) {
            count++;
        }
    }
}
\`\`\`

### Thread Communication:
\`\`\`java
class SharedQueue {
    private Queue<Integer> queue = new LinkedList<>();
    private int capacity = 5;
    
    synchronized void produce(int item) throws InterruptedException {
        while (queue.size() == capacity) {
            wait();  // Wait for consumer
        }
        queue.add(item);
        notifyAll();  // Wake up consumers
    }
    
    synchronized int consume() throws InterruptedException {
        while (queue.isEmpty()) {
            wait();  // Wait for producer
        }
        int item = queue.poll();
        notifyAll();  // Wake up producers
        return item;
    }
}
\`\`\`

### ExecutorService (Modern Approach):
\`\`\`java
ExecutorService executor = Executors.newFixedThreadPool(5);

for (int i = 0; i < 10; i++) {
    executor.submit(() -> {
        System.out.println(Thread.currentThread().getName());
    });
}

executor.shutdown();
\`\`\``,
  },
  {
    id: 15,
    text: "What are Java Collections Framework?",
    difficulty: "Medium",
    answer: `## Java Collections Framework

A unified architecture for **storing and manipulating groups of objects**.

### Collection Hierarchy:
\`\`\`
Iterable
└── Collection
    ├── List (ordered, duplicates allowed)
    │   ├── ArrayList
    │   ├── LinkedList
    │   └── Vector
    ├── Set (no duplicates)
    │   ├── HashSet
    │   ├── LinkedHashSet
    │   └── TreeSet (sorted)
    └── Queue
        ├── PriorityQueue
        └── LinkedList

Map (key-value pairs, not Collection)
├── HashMap
├── LinkedHashMap
├── TreeMap (sorted)
└── Hashtable
\`\`\`

### List Examples:
\`\`\`java
// ArrayList - fast random access
List<String> list = new ArrayList<>();
list.add("Apple");
list.get(0);  // O(1) access

// LinkedList - fast insert/delete
List<String> linked = new LinkedList<>();
linked.addFirst("First");  // O(1)
\`\`\`

### Set Examples:
\`\`\`java
// HashSet - fast, unordered
Set<Integer> set = new HashSet<>();
set.add(3); set.add(1); set.add(2);
// Iteration order not guaranteed

// TreeSet - sorted
Set<Integer> sorted = new TreeSet<>();
sorted.add(3); sorted.add(1); sorted.add(2);
// Iteration: 1, 2, 3
\`\`\`

### Map Examples:
\`\`\`java
Map<String, Integer> ages = new HashMap<>();
ages.put("John", 25);
ages.put("Jane", 30);

ages.get("John");  // 25
ages.containsKey("John");  // true
ages.values();  // [25, 30]
ages.keySet();  // [John, Jane]
\`\`\`

### Choosing the Right Collection:

| Need | Collection |
|------|------------|
| Fast random access | ArrayList |
| Fast insert/delete | LinkedList |
| No duplicates | HashSet |
| Sorted unique | TreeSet |
| Key-value pairs | HashMap |
| Sorted map | TreeMap |
| Thread-safe list | CopyOnWriteArrayList |
| Thread-safe map | ConcurrentHashMap |`,
  },
];

// DSA Questions - with detailed markdown answers
export const dsaQuestions: Question[] = [
  {
    id: 1,
    text: "Representing a Graph (Adjacency List & Matrix)",
    difficulty: "Easy",
    answer: `## Graph Representation

### Adjacency Matrix
2D array where \`matrix[i][j] = 1\` if edge exists between i and j.

\`\`\`java
class GraphMatrix {
    private int[][] matrix;
    private int vertices;
    
    GraphMatrix(int v) {
        vertices = v;
        matrix = new int[v][v];
    }
    
    void addEdge(int src, int dest) {
        matrix[src][dest] = 1;
        matrix[dest][src] = 1;  // For undirected
    }
}
\`\`\`

**Visualization:**
\`\`\`
Graph: 0 -- 1 -- 2
       |    
       3

Matrix:
    0  1  2  3
0 [ 0, 1, 0, 1 ]
1 [ 1, 0, 1, 0 ]
2 [ 0, 1, 0, 0 ]
3 [ 1, 0, 0, 0 ]
\`\`\`

### Adjacency List
Array of lists where each list contains neighbors.

\`\`\`java
class GraphList {
    private List<List<Integer>> adj;
    
    GraphList(int v) {
        adj = new ArrayList<>();
        for (int i = 0; i < v; i++) {
            adj.add(new ArrayList<>());
        }
    }
    
    void addEdge(int src, int dest) {
        adj.get(src).add(dest);
        adj.get(dest).add(src);  // For undirected
    }
}
\`\`\`

**Visualization:**
\`\`\`
0 → [1, 3]
1 → [0, 2]
2 → [1]
3 → [0]
\`\`\`

### Comparison:

| Operation | Matrix | List |
|-----------|--------|------|
| Space | O(V²) | O(V + E) |
| Check edge | O(1) | O(degree) |
| Add edge | O(1) | O(1) |
| Find neighbors | O(V) | O(degree) |
| Best for | Dense graphs | Sparse graphs |`,
  },
  {
    id: 2,
    text: "Two Sum",
    difficulty: "Easy",
    answer: `## Two Sum Problem

Find indices of two numbers that add up to target.

### Brute Force O(n²):
\`\`\`java
int[] twoSum(int[] nums, int target) {
    for (int i = 0; i < nums.length; i++) {
        for (int j = i + 1; j < nums.length; j++) {
            if (nums[i] + nums[j] == target) {
                return new int[]{i, j};
            }
        }
    }
    return new int[]{};
}
\`\`\`

### Optimal O(n) with HashMap:
\`\`\`java
int[] twoSum(int[] nums, int target) {
    Map<Integer, Integer> map = new HashMap<>();
    
    for (int i = 0; i < nums.length; i++) {
        int complement = target - nums[i];
        
        if (map.containsKey(complement)) {
            return new int[]{map.get(complement), i};
        }
        
        map.put(nums[i], i);
    }
    
    return new int[]{};
}
\`\`\`

### Walkthrough:
\`\`\`
nums = [2, 7, 11, 15], target = 9

i=0: complement = 9-2 = 7, map={}, add 2→0
     map = {2: 0}
     
i=1: complement = 9-7 = 2, map has 2!
     return [0, 1] ✓
\`\`\`

### Two Pointers (if sorted):
\`\`\`java
int[] twoSumSorted(int[] nums, int target) {
    int left = 0, right = nums.length - 1;
    
    while (left < right) {
        int sum = nums[left] + nums[right];
        if (sum == target) return new int[]{left, right};
        else if (sum < target) left++;
        else right--;
    }
    
    return new int[]{};
}
\`\`\`

### Complexity:
| Approach | Time | Space |
|----------|------|-------|
| Brute Force | O(n²) | O(1) |
| HashMap | O(n) | O(n) |
| Two Pointers (sorted) | O(n) | O(1) |`,
  },
  {
    id: 3,
    text: "Detecting Edge and Vertex Count",
    difficulty: "Easy",
    answer: `## Counting Vertices and Edges

### From Adjacency List:
\`\`\`java
class Graph {
    List<List<Integer>> adj;
    
    int getVertexCount() {
        return adj.size();
    }
    
    int getEdgeCount(boolean isDirected) {
        int edges = 0;
        for (List<Integer> neighbors : adj) {
            edges += neighbors.size();
        }
        // Undirected: each edge counted twice
        return isDirected ? edges : edges / 2;
    }
}
\`\`\`

### From Adjacency Matrix:
\`\`\`java
class GraphMatrix {
    int[][] matrix;
    
    int getVertexCount() {
        return matrix.length;
    }
    
    int getEdgeCount(boolean isDirected) {
        int edges = 0;
        for (int i = 0; i < matrix.length; i++) {
            for (int j = 0; j < matrix[i].length; j++) {
                if (matrix[i][j] == 1) edges++;
            }
        }
        return isDirected ? edges : edges / 2;
    }
}
\`\`\`

### From Edge List:
\`\`\`java
int[][] edges = {{0,1}, {0,2}, {1,2}};
Set<Integer> vertices = new HashSet<>();

for (int[] edge : edges) {
    vertices.add(edge[0]);
    vertices.add(edge[1]);
}

int V = vertices.size();  // Number of vertices
int E = edges.length;     // Number of edges
\`\`\`

### Graph Properties:
\`\`\`
Complete Graph: E = V(V-1)/2 (undirected)
Tree: E = V - 1
Sparse: E << V²
Dense: E ≈ V²

Handshaking Lemma: Sum of degrees = 2E
\`\`\``,
  },
  {
    id: 4,
    text: "Check if Graph is Directed or Undirected",
    difficulty: "Easy",
    answer: `## Detecting Graph Type

### For Adjacency List:
\`\`\`java
boolean isUndirected(List<List<Integer>> adj) {
    for (int u = 0; u < adj.size(); u++) {
        for (int v : adj.get(u)) {
            // Check if reverse edge exists
            if (!adj.get(v).contains(u)) {
                return false;  // Directed
            }
        }
    }
    return true;  // Undirected
}
\`\`\`

### For Adjacency Matrix:
\`\`\`java
boolean isUndirected(int[][] matrix) {
    int n = matrix.length;
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < n; j++) {
            // Check symmetry
            if (matrix[i][j] != matrix[j][i]) {
                return false;  // Directed
            }
        }
    }
    return true;  // Undirected (symmetric)
}
\`\`\`

### Visual Example:
\`\`\`
Undirected:          Directed:
0 ←→ 1               0 → 1
↓    ↓               ↓   ↓
2 ←→ 3               2 → 3

Matrix (Undirected):  Matrix (Directed):
  0 1 2 3               0 1 2 3
0[0 1 1 0]            0[0 1 1 0]
1[1 0 0 1]  SYMMETRIC  1[0 0 0 1]  NOT SYMMETRIC
2[1 0 0 1]            2[0 0 0 1]
3[0 1 1 0]            3[0 0 0 0]
\`\`\`

### Key Insight:
- **Undirected**: For every edge (u,v), there exists edge (v,u)
- **Directed**: Edge (u,v) doesn't imply edge (v,u)
- **Matrix Check**: Undirected graphs have symmetric adjacency matrices`,
  },
  {
    id: 5,
    text: "Convert Edge List to Adjacency List",
    difficulty: "Easy",
    answer: `## Edge List to Adjacency List Conversion

### Implementation:
\`\`\`java
List<List<Integer>> edgeListToAdjList(int[][] edges, int vertices, boolean isDirected) {
    List<List<Integer>> adj = new ArrayList<>();
    
    // Initialize empty lists
    for (int i = 0; i < vertices; i++) {
        adj.add(new ArrayList<>());
    }
    
    // Add edges
    for (int[] edge : edges) {
        int u = edge[0];
        int v = edge[1];
        
        adj.get(u).add(v);
        
        if (!isDirected) {
            adj.get(v).add(u);  // Add reverse edge
        }
    }
    
    return adj;
}
\`\`\`

### Example:
\`\`\`
Edge List: [[0,1], [0,2], [1,2], [2,3]]
Vertices: 4

Undirected Adjacency List:
0 → [1, 2]
1 → [0, 2]
2 → [0, 1, 3]
3 → [2]

Directed Adjacency List:
0 → [1, 2]
1 → [2]
2 → [3]
3 → []
\`\`\`

### With Weights:
\`\`\`java
// Edge format: [from, to, weight]
List<List<int[]>> weightedAdjList(int[][] edges, int vertices) {
    List<List<int[]>> adj = new ArrayList<>();
    
    for (int i = 0; i < vertices; i++) {
        adj.add(new ArrayList<>());
    }
    
    for (int[] edge : edges) {
        int u = edge[0], v = edge[1], w = edge[2];
        adj.get(u).add(new int[]{v, w});
        adj.get(v).add(new int[]{u, w});  // Undirected
    }
    
    return adj;
}
\`\`\`

### Time & Space:
| Operation | Complexity |
|-----------|------------|
| Time | O(E) |
| Space | O(V + E) |`,
  },
  {
    id: 6,
    text: "Best Time to Buy and Sell Stock",
    difficulty: "Easy",
    answer: `## Best Time to Buy and Sell Stock

Find maximum profit from buying and selling once.

### Optimal O(n) Solution:
\`\`\`java
int maxProfit(int[] prices) {
    int minPrice = Integer.MAX_VALUE;
    int maxProfit = 0;
    
    for (int price : prices) {
        // Track minimum price seen so far
        minPrice = Math.min(minPrice, price);
        
        // Calculate profit if we sell today
        int profit = price - minPrice;
        
        // Track maximum profit
        maxProfit = Math.max(maxProfit, profit);
    }
    
    return maxProfit;
}
\`\`\`

### Walkthrough:
\`\`\`
prices = [7, 1, 5, 3, 6, 4]

Day 0: price=7, min=7, profit=0, maxProfit=0
Day 1: price=1, min=1, profit=0, maxProfit=0
Day 2: price=5, min=1, profit=4, maxProfit=4 ←
Day 3: price=3, min=1, profit=2, maxProfit=4
Day 4: price=6, min=1, profit=5, maxProfit=5 ← Best!
Day 5: price=4, min=1, profit=3, maxProfit=5

Answer: 5 (Buy at 1, Sell at 6)
\`\`\`

### Key Insight:
\`\`\`
Maximum Profit = Max(prices[j] - prices[i])
where j > i

We track:
1. Minimum price seen so far (best buy point)
2. Maximum profit if we sell at current price
\`\`\`

### Edge Cases:
\`\`\`java
// Decreasing prices - no profit possible
[7, 6, 4, 3, 1] → 0

// Single element
[7] → 0

// Two elements
[1, 2] → 1
\`\`\`

### Complexity:
| Metric | Value |
|--------|-------|
| Time | O(n) |
| Space | O(1) |`,
  },
  {
    id: 7,
    text: "Valid Parentheses",
    difficulty: "Easy",
    answer: `## Valid Parentheses

Check if brackets are properly matched and nested.

### Stack Solution:
\`\`\`java
boolean isValid(String s) {
    Stack<Character> stack = new Stack<>();
    Map<Character, Character> pairs = Map.of(
        ')', '(',
        ']', '[',
        '}', '{'
    );
    
    for (char c : s.toCharArray()) {
        if (c == '(' || c == '[' || c == '{') {
            stack.push(c);
        } else {
            if (stack.isEmpty()) return false;
            if (stack.pop() != pairs.get(c)) return false;
        }
    }
    
    return stack.isEmpty();
}
\`\`\`

### Walkthrough:
\`\`\`
s = "([{}])"

Step 1: '(' → push → stack: ['(']
Step 2: '[' → push → stack: ['(', '[']
Step 3: '{' → push → stack: ['(', '[', '{']
Step 4: '}' → pop '{' matches → stack: ['(', '[']
Step 5: ']' → pop '[' matches → stack: ['(']
Step 6: ')' → pop '(' matches → stack: []

Stack empty → Valid!
\`\`\`

### Invalid Examples:
\`\`\`
"(]" → '(' pushed, ']' needs '[' but got '(' → Invalid
"([)]" → Interleaved, not nested → Invalid
"(((" → Stack not empty at end → Invalid
\`\`\`

### Optimized (No HashMap):
\`\`\`java
boolean isValid(String s) {
    Stack<Character> stack = new Stack<>();
    
    for (char c : s.toCharArray()) {
        if (c == '(') stack.push(')');
        else if (c == '[') stack.push(']');
        else if (c == '{') stack.push('}');
        else if (stack.isEmpty() || stack.pop() != c) {
            return false;
        }
    }
    
    return stack.isEmpty();
}
\`\`\`

### Complexity:
| Metric | Value |
|--------|-------|
| Time | O(n) |
| Space | O(n) |`,
  },
  {
    id: 8,
    text: "Merge Two Sorted Lists",
    difficulty: "Easy",
    answer: `## Merge Two Sorted Linked Lists

### Iterative Solution:
\`\`\`java
ListNode mergeTwoLists(ListNode l1, ListNode l2) {
    ListNode dummy = new ListNode(0);
    ListNode current = dummy;
    
    while (l1 != null && l2 != null) {
        if (l1.val <= l2.val) {
            current.next = l1;
            l1 = l1.next;
        } else {
            current.next = l2;
            l2 = l2.next;
        }
        current = current.next;
    }
    
    // Attach remaining nodes
    current.next = (l1 != null) ? l1 : l2;
    
    return dummy.next;
}
\`\`\`

### Walkthrough:
\`\`\`
l1: 1 → 2 → 4
l2: 1 → 3 → 4

Step 1: Compare 1,1 → take l1(1) → result: 1
Step 2: Compare 2,1 → take l2(1) → result: 1→1
Step 3: Compare 2,3 → take l1(2) → result: 1→1→2
Step 4: Compare 4,3 → take l2(3) → result: 1→1→2→3
Step 5: Compare 4,4 → take l1(4) → result: 1→1→2→3→4
Step 6: l1 null, attach l2 → result: 1→1→2→3→4→4
\`\`\`

### Recursive Solution:
\`\`\`java
ListNode mergeTwoLists(ListNode l1, ListNode l2) {
    if (l1 == null) return l2;
    if (l2 == null) return l1;
    
    if (l1.val <= l2.val) {
        l1.next = mergeTwoLists(l1.next, l2);
        return l1;
    } else {
        l2.next = mergeTwoLists(l1, l2.next);
        return l2;
    }
}
\`\`\`

### Complexity:
| Approach | Time | Space |
|----------|------|-------|
| Iterative | O(n+m) | O(1) |
| Recursive | O(n+m) | O(n+m) stack |`,
  },
  {
    id: 9,
    text: "Maximum Subarray (Kadane's Algorithm)",
    difficulty: "Medium",
    answer: `## Maximum Subarray - Kadane's Algorithm

Find contiguous subarray with largest sum.

### Kadane's Algorithm:
\`\`\`java
int maxSubArray(int[] nums) {
    int maxSum = nums[0];
    int currentSum = nums[0];
    
    for (int i = 1; i < nums.length; i++) {
        // Either extend previous subarray or start new
        currentSum = Math.max(nums[i], currentSum + nums[i]);
        maxSum = Math.max(maxSum, currentSum);
    }
    
    return maxSum;
}
\`\`\`

### Walkthrough:
\`\`\`
nums = [-2, 1, -3, 4, -1, 2, 1, -5, 4]

i=0: current=-2, max=-2
i=1: current=max(1, -2+1)=1, max=1
i=2: current=max(-3, 1-3)=-2, max=1
i=3: current=max(4, -2+4)=4, max=4
i=4: current=max(-1, 4-1)=3, max=4
i=5: current=max(2, 3+2)=5, max=5
i=6: current=max(1, 5+1)=6, max=6 ← Maximum!
i=7: current=max(-5, 6-5)=1, max=6
i=8: current=max(4, 1+4)=5, max=6

Answer: 6 (subarray: [4, -1, 2, 1])
\`\`\`

### Key Insight:
\`\`\`
At each position, we decide:
1. Start fresh with current element
2. Extend previous subarray

If previous sum is negative, better to start fresh!
\`\`\`

### Return Subarray Indices:
\`\`\`java
int[] maxSubArrayWithIndices(int[] nums) {
    int maxSum = nums[0], currentSum = nums[0];
    int start = 0, end = 0, tempStart = 0;
    
    for (int i = 1; i < nums.length; i++) {
        if (nums[i] > currentSum + nums[i]) {
            currentSum = nums[i];
            tempStart = i;  // Start new subarray
        } else {
            currentSum += nums[i];
        }
        
        if (currentSum > maxSum) {
            maxSum = currentSum;
            start = tempStart;
            end = i;
        }
    }
    
    return new int[]{start, end, maxSum};
}
\`\`\`

### Complexity:
| Metric | Value |
|--------|-------|
| Time | O(n) |
| Space | O(1) |`,
  },
  {
    id: 10,
    text: "Longest Common Subsequence",
    difficulty: "Medium",
    answer: `## Longest Common Subsequence (LCS)

Find length of longest subsequence common to both strings.

### Dynamic Programming Solution:
\`\`\`java
int longestCommonSubsequence(String text1, String text2) {
    int m = text1.length(), n = text2.length();
    int[][] dp = new int[m + 1][n + 1];
    
    for (int i = 1; i <= m; i++) {
        for (int j = 1; j <= n; j++) {
            if (text1.charAt(i-1) == text2.charAt(j-1)) {
                dp[i][j] = dp[i-1][j-1] + 1;
            } else {
                dp[i][j] = Math.max(dp[i-1][j], dp[i][j-1]);
            }
        }
    }
    
    return dp[m][n];
}
\`\`\`

### DP Table Visualization:
\`\`\`
text1 = "abcde", text2 = "ace"

    ""  a  c  e
""   0  0  0  0
a    0  1  1  1
b    0  1  1  1
c    0  1  2  2
d    0  1  2  2
e    0  1  2  3 ← Answer

LCS = "ace" (length 3)
\`\`\`

### Recurrence Relation:
\`\`\`
if (text1[i] == text2[j]):
    dp[i][j] = dp[i-1][j-1] + 1  // Match! Take diagonal + 1
else:
    dp[i][j] = max(dp[i-1][j], dp[i][j-1])  // Take max of top/left
\`\`\`

### Reconstruct the LCS:
\`\`\`java
String getLCS(String text1, String text2, int[][] dp) {
    StringBuilder sb = new StringBuilder();
    int i = text1.length(), j = text2.length();
    
    while (i > 0 && j > 0) {
        if (text1.charAt(i-1) == text2.charAt(j-1)) {
            sb.append(text1.charAt(i-1));
            i--; j--;
        } else if (dp[i-1][j] > dp[i][j-1]) {
            i--;
        } else {
            j--;
        }
    }
    
    return sb.reverse().toString();
}
\`\`\`

### Complexity:
| Metric | Value |
|--------|-------|
| Time | O(m × n) |
| Space | O(m × n) |
| Space Optimized | O(min(m, n)) |`,
  },
];

// Aptitude Questions - with detailed markdown answers
export const aptitudeQuestions: Question[] = [
  {
    id: 1,
    text: "A colleague on your team is consistently missing deadlines. This forces you and others to work late to cover for them. What is the best first step?",
    difficulty: "Medium",
    answer: `## Workplace Scenario: Missing Deadlines

### Best Approach: Private Conversation First

**Step 1: Have a private, empathetic conversation**
- Approach with curiosity, not accusation
- Ask open-ended questions to understand the root cause
- Example: "I've noticed you've been struggling with deadlines lately. Is everything okay? Is there anything I can help with?"

### Why This Works:
| Approach | Outcome |
|----------|---------|
| Direct confrontation | Defensive, damages relationship |
| Ignoring | Problem continues, resentment builds |
| Going to manager first | Seen as tattling, trust broken |
| **Private chat** | **Shows empathy, may reveal hidden issues** |

### Possible Root Causes:
- Personal issues (health, family)
- Unclear requirements
- Skill gaps needing training
- Burnout or overload
- Unrealistic deadlines

### If Private Conversation Doesn't Work:
1. Document specific instances
2. Involve team lead/manager
3. Suggest process improvements
4. Focus on impact, not blame

### Key Communication Tips:
- Use "I" statements: "I've been staying late because..."
- Focus on impact: "When deadlines slip, it affects..."
- Be solution-oriented: "How can we prevent this?"
- Listen actively without interrupting`,
  },
  {
    id: 2,
    text: "Find the odd one out from the following group: 1. Circle 2. Square 3. Triangle 4. Rectangle 5. Cube.",
    difficulty: "Easy",
    answer: `## Odd One Out: 2D vs 3D Shapes

### Answer: **Cube (5)**

### Reasoning:
| Shape | Dimensions | Properties |
|-------|------------|------------|
| Circle | 2D | Curved, no edges |
| Square | 2D | 4 equal sides, 4 right angles |
| Triangle | 2D | 3 sides, 3 angles |
| Rectangle | 2D | 4 sides, 4 right angles |
| **Cube** | **3D** | **6 faces, 12 edges, 8 vertices** |

### Classification:
\`\`\`
2D Shapes (Flat)      3D Shapes (Solid)
├── Circle            └── Cube ← ODD ONE OUT
├── Square                ├── Sphere
├── Triangle              ├── Cylinder
└── Rectangle             └── Pyramid
\`\`\`

### Problem-Solving Pattern:
When finding odd one out, look for:
1. **Dimensionality** (2D vs 3D) ← Applied here
2. Number of sides/edges
3. Curved vs straight edges
4. Regular vs irregular shapes
5. Category (polygon, conic section, etc.)

### Similar Questions:
- "Sphere, Cylinder, Circle, Cone, Cube" → Circle (2D)
- "Square, Rectangle, Triangle, Parallelogram, Pentagon" → Triangle (3 sides vs 4+)`,
  },
  {
    id: 3,
    text: "A man's salary is increased by 20%. If his new salary is $30,000, what was his original salary before the increase was applied?",
    difficulty: "Easy",
    answer: `## Percentage: Finding Original Value

### Given:
- New salary = $30,000
- Increase = 20%

### Solution:
\`\`\`
New Salary = Original + 20% of Original
$30,000 = Original × (1 + 0.20)
$30,000 = Original × 1.20

Original = $30,000 ÷ 1.20
Original = $25,000
\`\`\`

### Verification:
\`\`\`
Original salary: $25,000
20% increase: $25,000 × 0.20 = $5,000
New salary: $25,000 + $5,000 = $30,000 ✓
\`\`\`

### Formula Pattern:
\`\`\`
For increase:  Original = New ÷ (1 + rate)
For decrease:  Original = New ÷ (1 - rate)

Examples:
• 25% increase, New = $50,000
  Original = $50,000 ÷ 1.25 = $40,000

• 10% decrease, New = $45,000
  Original = $45,000 ÷ 0.90 = $50,000
\`\`\`

### Common Mistakes:
❌ $30,000 - 20% = $30,000 - $6,000 = $24,000
   (This is 20% of the NEW salary, not original!)

✅ $30,000 ÷ 1.20 = $25,000
   (Correctly divides by the multiplier)`,
  },
  {
    id: 4,
    text: "A and B together can complete a piece of work in 20 days. B and C together can complete the same task in 30 days. A and C together can complete the same task in 30 days. How many days will A take to complete the task alone?",
    difficulty: "Medium",
    answer: `## Time and Work: Three Workers

### Given:
- A + B complete in 20 days
- B + C complete in 30 days
- A + C complete in 30 days

### Solution Using Work Rates:

**Step 1: Convert to daily work rates**
\`\`\`
A + B = 1/20 (complete 1/20 of work per day)
B + C = 1/30
A + C = 1/30
\`\`\`

**Step 2: Add all three equations**
\`\`\`
(A+B) + (B+C) + (A+C) = 1/20 + 1/30 + 1/30
2A + 2B + 2C = 1/20 + 2/30
2(A + B + C) = 3/60 + 4/60 = 7/60
A + B + C = 7/120
\`\`\`

**Step 3: Find A's rate**
\`\`\`
A = (A + B + C) - (B + C)
A = 7/120 - 1/30
A = 7/120 - 4/120
A = 3/120 = 1/40
\`\`\`

**Step 4: Calculate days for A alone**
\`\`\`
If A completes 1/40 per day,
A takes 40 days to complete alone.
\`\`\`

### Answer: **40 days**

### Verification:
\`\`\`
A = 1/40, so B + C = 1/30 ✓
From A + B = 1/20: B = 1/20 - 1/40 = 1/40
From B + C = 1/30: C = 1/30 - 1/40 = 1/120
Check A + C = 1/40 + 1/120 = 4/120 = 1/30 ✓
\`\`\``,
  },
  {
    id: 5,
    text: "A shopkeeper sells an article for $450, making a profit of 25%. At what price should he sell the article to make a loss of 10%?",
    difficulty: "Medium",
    answer: `## Profit and Loss Problem

### Given:
- Selling Price (SP₁) = $450
- Profit = 25%
- Required: SP for 10% loss

### Solution:

**Step 1: Find Cost Price (CP)**
\`\`\`
SP = CP × (1 + Profit%)
$450 = CP × 1.25

CP = $450 ÷ 1.25
CP = $360
\`\`\`

**Step 2: Calculate SP for 10% loss**
\`\`\`
Loss = 10% = 0.10
SP₂ = CP × (1 - Loss%)
SP₂ = $360 × 0.90
SP₂ = $324
\`\`\`

### Answer: **$324**

### Verification:
\`\`\`
Cost Price: $360

At $450 (25% profit):
Profit = $450 - $360 = $90
Profit% = ($90 ÷ $360) × 100 = 25% ✓

At $324 (10% loss):
Loss = $360 - $324 = $36
Loss% = ($36 ÷ $360) × 100 = 10% ✓
\`\`\`

### Formulas Summary:
\`\`\`
Profit:
SP = CP × (1 + Profit%)
CP = SP ÷ (1 + Profit%)

Loss:
SP = CP × (1 - Loss%)
CP = SP ÷ (1 - Loss%)
\`\`\``,
  },
  {
    id: 6,
    text: "A train running at a speed of 60 km/hr crosses a pole in 9 seconds. What is the length of the train in meters?",
    difficulty: "Easy",
    answer: `## Speed, Distance, Time Problem

### Given:
- Speed = 60 km/hr
- Time to cross pole = 9 seconds

### Solution:

**Step 1: Convert speed to m/s**
\`\`\`
1 km = 1000 m
1 hr = 3600 s

60 km/hr = 60 × (1000/3600) m/s
         = 60 × (5/18) m/s
         = 300/18 m/s
         = 50/3 m/s
         ≈ 16.67 m/s
\`\`\`

**Step 2: Calculate distance (length of train)**
\`\`\`
Distance = Speed × Time
Length = (50/3) × 9
Length = 450/3
Length = 150 meters
\`\`\`

### Answer: **150 meters**

### Key Concept:
When a train crosses a **pole** (or a standing person):
- Distance traveled = Length of train
- The train completely passes the point

### Conversion Quick Reference:
\`\`\`
km/hr to m/s: Multiply by 5/18
m/s to km/hr: Multiply by 18/5

Examples:
36 km/hr = 36 × 5/18 = 10 m/s
72 km/hr = 72 × 5/18 = 20 m/s
90 km/hr = 90 × 5/18 = 25 m/s
\`\`\`

### Related Problems:
- Train crossing a platform: Distance = Train length + Platform length
- Two trains crossing each other: Relative speed matters`,
  },
  {
    id: 7,
    text: "Find the simple interest on $5,000 for 3 years at a rate of 8% per annum. How does this compare to the amount at maturity?",
    difficulty: "Easy",
    answer: `## Simple Interest Calculation

### Given:
- Principal (P) = $5,000
- Time (T) = 3 years
- Rate (R) = 8% per annum

### Solution:

**Step 1: Calculate Simple Interest**
\`\`\`
SI = (P × R × T) / 100
SI = ($5,000 × 8 × 3) / 100
SI = $120,000 / 100
SI = $1,200
\`\`\`

**Step 2: Calculate Amount at Maturity**
\`\`\`
Amount = Principal + Interest
Amount = $5,000 + $1,200
Amount = $6,200
\`\`\`

### Answer:
- **Simple Interest = $1,200**
- **Amount at Maturity = $6,200**

### Year-by-Year Breakdown:
| Year | Principal | Interest | Total |
|------|-----------|----------|-------|
| 1 | $5,000 | $400 | $5,400 |
| 2 | $5,000 | $400 | $5,800 |
| 3 | $5,000 | $400 | $6,200 |

### Simple Interest Formula:
\`\`\`
SI = P × R × T / 100

Where:
P = Principal (initial amount)
R = Rate of interest (per year)
T = Time (in years)

Amount = P + SI = P(1 + RT/100)
\`\`\`

### Key Characteristic:
In simple interest, interest is calculated only on the **original principal**, not on accumulated interest.`,
  },
  {
    id: 8,
    text: "What is the compound interest on $10,000 for 2 years at 10% per annum, compounded annually?",
    difficulty: "Easy",
    answer: `## Compound Interest Calculation

### Given:
- Principal (P) = $10,000
- Rate (R) = 10% per annum
- Time (T) = 2 years
- Compounding = Annually

### Solution:

**Formula:**
\`\`\`
A = P × (1 + R/100)^T
\`\`\`

**Calculation:**
\`\`\`
A = $10,000 × (1 + 10/100)^2
A = $10,000 × (1.10)^2
A = $10,000 × 1.21
A = $12,100
\`\`\`

**Compound Interest:**
\`\`\`
CI = Amount - Principal
CI = $12,100 - $10,000
CI = $2,100
\`\`\`

### Answer: **$2,100**

### Year-by-Year Breakdown:
| Year | Start Amount | Interest (10%) | End Amount |
|------|--------------|----------------|------------|
| 1 | $10,000 | $1,000 | $11,000 |
| 2 | $11,000 | $1,100 | $12,100 |

### Comparison with Simple Interest:
\`\`\`
Simple Interest = $10,000 × 10% × 2 = $2,000
Compound Interest = $2,100

Difference = $100 (interest on interest)
\`\`\`

### CI Formula Variations:
\`\`\`
Annually:     A = P(1 + R/100)^T
Half-yearly:  A = P(1 + R/200)^(2T)
Quarterly:    A = P(1 + R/400)^(4T)
Monthly:      A = P(1 + R/1200)^(12T)
\`\`\``,
  },
  {
    id: 9,
    text: "Two numbers are in the ratio 3:5. If 9 is subtracted from each, the new ratio becomes 12:23. What is the smaller number?",
    difficulty: "Medium",
    answer: `## Ratio Problem

### Given:
- Original ratio = 3:5
- After subtracting 9 from each: ratio = 12:23

### Solution:

**Step 1: Set up equations**
\`\`\`
Let the numbers be 3x and 5x

After subtracting 9:
(3x - 9) : (5x - 9) = 12 : 23
\`\`\`

**Step 2: Cross multiply**
\`\`\`
(3x - 9) / (5x - 9) = 12/23

23(3x - 9) = 12(5x - 9)
69x - 207 = 60x - 108
69x - 60x = 207 - 108
9x = 99
x = 11
\`\`\`

**Step 3: Find the numbers**
\`\`\`
Smaller number = 3x = 3 × 11 = 33
Larger number = 5x = 5 × 11 = 55
\`\`\`

### Answer: **33**

### Verification:
\`\`\`
Original ratio: 33:55 = 3:5 ✓

After subtracting 9:
33 - 9 = 24
55 - 9 = 46

New ratio: 24:46 = 12:23 ✓
\`\`\`

### Problem Pattern:
\`\`\`
For ratio problems with changes:
1. Express numbers as ax and bx
2. Apply the change
3. Set up proportion equation
4. Solve for x
5. Calculate actual values
\`\`\``,
  },
  {
    id: 10,
    text: "The average age of a class of 30 students is 15 years. If the teacher's age is included, the average age increases by 1 year. What is the teacher's age?",
    difficulty: "Medium",
    answer: `## Average Problem

### Given:
- Number of students = 30
- Average age of students = 15 years
- New average (with teacher) = 16 years

### Solution:

**Step 1: Calculate total age of students**
\`\`\`
Total age of students = Number × Average
                      = 30 × 15
                      = 450 years
\`\`\`

**Step 2: Calculate new total with teacher**
\`\`\`
Total people = 30 + 1 = 31
New average = 16 years
New total age = 31 × 16 = 496 years
\`\`\`

**Step 3: Find teacher's age**
\`\`\`
Teacher's age = New total - Students' total
              = 496 - 450
              = 46 years
\`\`\`

### Answer: **46 years**

### Verification:
\`\`\`
Students' total: 450 years
Teacher's age: 46 years
Combined total: 496 years

Average = 496 ÷ 31 = 16 years ✓
\`\`\`

### Key Formula:
\`\`\`
New member's value = New Total - Old Total

Where:
New Total = (Old count + 1) × New Average
Old Total = Old count × Old Average
\`\`\`

### General Pattern:
If adding one item changes average from A₁ to A₂:
\`\`\`
New item = A₂ + n(A₂ - A₁)

In this problem:
Teacher = 16 + 30(16 - 15)
        = 16 + 30 = 46 ✓
\`\`\``,
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
