 // SQL Questions Data - Comprehensive question bank organized by category
 import type { Difficulty } from "./positionResourcesData";
 
 export interface SQLQuestion {
   id: number;
   title: string;
   text: string;
   difficulty: Difficulty;
   categoryId: string;
   type: "conceptual" | "query" | "scenario";
   answer: string;
 }
 
 export interface SQLCategory {
   id: string;
   name: string;
   questionCount: number;
 }
 
 // Categories for SQL questions
 export const sqlCategories: SQLCategory[] = [
   { id: "basics", name: "Basics", questionCount: 20 },
   { id: "filtering", name: "Filtering", questionCount: 15 },
   { id: "joins", name: "Joins", questionCount: 20 },
   { id: "aggregations", name: "Aggregations", questionCount: 20 },
   { id: "subqueries", name: "Subqueries", questionCount: 15 },
   { id: "window-functions", name: "Window Functions", questionCount: 20 },
   { id: "constraints", name: "Constraints", questionCount: 15 },
   { id: "database-design", name: "Database Design", questionCount: 15 },
   { id: "indexing", name: "Indexing & Optimization", questionCount: 12 },
   { id: "transactions", name: "Transactions & ACID", questionCount: 10 },
 ];
 
 // SQL Questions organized by category
 export const sqlQuestions: SQLQuestion[] = [
   // Basics Questions
   {
     id: 1,
     title: "What is SQL and why is it important?",
     text: "SQL (Structured Query Language) is used to manage and manipulate relational databases. It allows developers to create, read, update, and delete data efficiently. It's essential because almost all modern applications rely on structured data storage and retrieval.",
     difficulty: "Easy",
     categoryId: "basics",
     type: "conceptual",
     answer: `## What is SQL?
 
 **SQL (Structured Query Language)** is the standard language for interacting with relational database management systems (RDBMS).
 
 ### Key Operations (CRUD)
 - **C**reate: \`INSERT INTO\`
 - **R**ead: \`SELECT\`
 - **U**pdate: \`UPDATE\`
 - **D**elete: \`DELETE\`
 
 ### Why SQL is Important
 1. **Universal Standard**: Works across MySQL, PostgreSQL, SQL Server, Oracle
 2. **Data Integrity**: Enforces constraints and relationships
 3. **Scalability**: Handles millions of records efficiently
 4. **Analytics**: Powerful aggregation and reporting capabilities
 
 \`\`\`sql
 -- Basic example
 SELECT first_name, last_name, email
 FROM users
 WHERE status = 'active'
 ORDER BY created_at DESC;
 \`\`\``,
   },
   {
     id: 2,
     title: "What is the difference between SQL and MySQL?",
     text: "SQL is a language for querying databases, whereas MySQL is a database management system that implements SQL. In short, SQL is the language; MySQL is a tool that uses it to manage databases.",
     difficulty: "Easy",
     categoryId: "basics",
     type: "conceptual",
     answer: `## SQL vs MySQL
 
 | Aspect | SQL | MySQL |
 |--------|-----|-------|
 | Type | Query Language | Database Management System |
 | Purpose | Define, manipulate data | Store, manage, retrieve data |
 | Portability | Standard across RDBMS | Specific implementation |
 | Examples | SELECT, INSERT, UPDATE | MySQL Server, MySQL Workbench |
 
 ### Other SQL Implementations
 - **PostgreSQL**: Advanced features, JSONB support
 - **SQL Server**: Microsoft's enterprise solution
 - **SQLite**: Lightweight, file-based
 - **Oracle**: Enterprise-grade, complex licensing`,
   },
   {
     id: 3,
     title: "What are the different types of SQL commands?",
     text: "SQL commands are grouped into categories: DDL (Data Definition Language), DML (Data Manipulation Language), DCL (Data Control Language), TCL (Transaction Control Language), and DQL (Data Query Language). Each type performs a unique database operation.",
     difficulty: "Easy",
     categoryId: "basics",
     type: "conceptual",
     answer: `## Types of SQL Commands
 
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
 SELECT * FROM users WHERE active = true;
 \`\`\`
 
 ### 4. DCL (Data Control Language)
 Controls access:
 \`\`\`sql
 GRANT SELECT ON users TO analyst;
 REVOKE DELETE ON users FROM intern;
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
     title: "What is a NULL value in SQL?",
     text: "NULL represents a missing or unknown value in SQL. It is not the same as zero or an empty string. NULL requires special handling with IS NULL or IS NOT NULL operators.",
     difficulty: "Easy",
     categoryId: "basics",
     type: "conceptual",
     answer: `## NULL Values in SQL
 
 **NULL** represents the absence of a value - it's not zero, empty string, or false.
 
 ### Checking for NULL
 \`\`\`sql
 -- Correct way
 SELECT * FROM users WHERE phone IS NULL;
 SELECT * FROM users WHERE phone IS NOT NULL;
 
 -- Wrong way (won't work!)
 SELECT * FROM users WHERE phone = NULL;  -- Always returns empty
 \`\`\`
 
 ### NULL in Expressions
 \`\`\`sql
 -- Any operation with NULL returns NULL
 SELECT 5 + NULL;          -- Returns NULL
 SELECT 'Hello' || NULL;   -- Returns NULL
 
 -- Use COALESCE to handle NULL
 SELECT COALESCE(phone, 'N/A') FROM users;
 SELECT COALESCE(discount, 0) * price FROM products;
 \`\`\`
 
 ### NULL in Aggregations
 - \`COUNT(*)\` counts all rows
 - \`COUNT(column)\` excludes NULL values
 - \`SUM\`, \`AVG\` ignore NULL values`,
   },
   {
     id: 5,
     title: "Explain primary key and foreign key.",
     text: "A primary key uniquely identifies each record in a table. A foreign key establishes a link between two tables by referencing the primary key of another table, enforcing relational integrity between data sets.",
     difficulty: "Easy",
     categoryId: "constraints",
     type: "conceptual",
     answer: `## Primary Key vs Foreign Key
 
 ### Primary Key
 - Uniquely identifies each row
 - Cannot be NULL
 - Only one per table
 
 \`\`\`sql
 CREATE TABLE users (
     id SERIAL PRIMARY KEY,
     email VARCHAR(255) UNIQUE NOT NULL
 );
 \`\`\`
 
 ### Foreign Key
 - References primary key of another table
 - Enforces referential integrity
 - Can be NULL (optional relationship)
 
 \`\`\`sql
 CREATE TABLE orders (
     id SERIAL PRIMARY KEY,
     user_id INT REFERENCES users(id),
     total DECIMAL(10, 2)
 );
 \`\`\`
 
 ### Referential Actions
 \`\`\`sql
 CREATE TABLE orders (
     id SERIAL PRIMARY KEY,
     user_id INT REFERENCES users(id)
         ON DELETE CASCADE      -- Delete orders when user deleted
         ON UPDATE SET NULL     -- Set NULL if user ID changes
 );
 \`\`\``,
   },
   {
     id: 6,
     title: "What is normalization in SQL?",
     text: "Normalization organizes data to reduce redundancy and improve data integrity. It divides tables into smaller, related tables and uses relationships to maintain data consistency. The main forms include 1NF, 2NF, and 3NF.",
     difficulty: "Medium",
     categoryId: "database-design",
     type: "conceptual",
     answer: `## Database Normalization
 
 Normalization eliminates data redundancy and ensures data integrity through progressive normal forms.
 
 ### 1NF (First Normal Form)
 - Eliminate repeating groups
 - Each cell contains single value
 
 \`\`\`sql
 -- Violates 1NF (multiple values in one cell)
 | id | phones              |
 |----|---------------------|
 | 1  | 555-1234, 555-5678  |
 
 -- 1NF Compliant
 | id | phone    |
 |----|----------|
 | 1  | 555-1234 |
 | 1  | 555-5678 |
 \`\`\`
 
 ### 2NF (Second Normal Form)
 - Must be in 1NF
 - All non-key attributes depend on entire primary key
 
 ### 3NF (Third Normal Form)
 - Must be in 2NF
 - No transitive dependencies
 
 \`\`\`sql
 -- Violates 3NF
 | order_id | customer_id | customer_name |
 
 -- 3NF Compliant (separate tables)
 orders: order_id, customer_id
 customers: customer_id, customer_name
 \`\`\``,
   },
   {
     id: 7,
     title: "What is denormalization?",
     text: "Denormalization combines tables to improve read performance. It introduces controlled redundancy to reduce complex joins during queries, often used in reporting or analytics databases where read speed is prioritized over updates.",
     difficulty: "Medium",
     categoryId: "database-design",
     type: "conceptual",
     answer: `## Denormalization
 
 **Denormalization** intentionally adds redundancy to optimize read performance.
 
 ### When to Denormalize
 - Read-heavy workloads (analytics, reporting)
 - Complex joins causing performance issues
 - Real-time dashboards needing fast queries
 
 ### Example
 \`\`\`sql
 -- Normalized (requires JOIN)
 SELECT o.id, o.total, c.name
 FROM orders o
 JOIN customers c ON o.customer_id = c.id;
 
 -- Denormalized (faster read, redundant data)
 SELECT id, total, customer_name
 FROM orders_denormalized;
 \`\`\`
 
 ### Trade-offs
 | Aspect | Normalized | Denormalized |
 |--------|-----------|--------------|
 | Read Speed | Slower | Faster |
 | Write Speed | Faster | Slower |
 | Storage | Less | More |
 | Data Integrity | Higher | Requires maintenance |`,
   },
   {
     id: 8,
     title: "What are joins in SQL?",
     text: "Joins combine rows from multiple tables based on related columns. Common joins include INNER, LEFT, RIGHT, and FULL JOIN. They allow complex queries across tables, enabling data relationships to be queried efficiently.",
     difficulty: "Easy",
     categoryId: "joins",
     type: "conceptual",
     answer: `## SQL Joins
 
 Joins combine data from two or more tables based on a related column.
 
 ### Types of Joins
 
 \`\`\`sql
 -- INNER JOIN: Only matching rows
 SELECT u.name, o.total
 FROM users u
 INNER JOIN orders o ON u.id = o.user_id;
 
 -- LEFT JOIN: All left + matching right
 SELECT u.name, o.total
 FROM users u
 LEFT JOIN orders o ON u.id = o.user_id;
 
 -- RIGHT JOIN: All right + matching left
 SELECT u.name, o.total
 FROM users u
 RIGHT JOIN orders o ON u.id = o.user_id;
 
 -- FULL OUTER JOIN: All from both
 SELECT u.name, o.total
 FROM users u
 FULL OUTER JOIN orders o ON u.id = o.user_id;
 \`\`\`
 
 ### Visual Representation
 \`\`\`
 INNER:  [A ∩ B]
 LEFT:   [A] + [A ∩ B]
 RIGHT:  [A ∩ B] + [B]
 FULL:   [A] + [A ∩ B] + [B]
 \`\`\``,
   },
   {
     id: 9,
     title: "Explain INNER JOIN.",
     text: "INNER JOIN returns only the rows that have matching values in both tables. If there is no match, the row is excluded from the result set.",
     difficulty: "Easy",
     categoryId: "joins",
     type: "query",
     answer: `## INNER JOIN
 
 Returns **only matching rows** from both tables.
 
 ### Syntax
 \`\`\`sql
 SELECT columns
 FROM table1
 INNER JOIN table2 ON table1.column = table2.column;
 \`\`\`
 
 ### Example
 \`\`\`sql
 -- Get users who have placed orders
 SELECT 
     u.name,
     u.email,
     o.order_date,
     o.total
 FROM users u
 INNER JOIN orders o ON u.id = o.user_id;
 \`\`\`
 
 ### Result
 | name  | email           | order_date | total |
 |-------|-----------------|------------|-------|
 | John  | john@email.com  | 2024-01-15 | 99.99 |
 | Jane  | jane@email.com  | 2024-01-16 | 149.99|
 
 **Note**: Users without orders are NOT included.`,
   },
   {
     id: 10,
     title: "Explain LEFT JOIN and RIGHT JOIN.",
     text: "LEFT JOIN returns all rows from the left table and matched rows from the right table. RIGHT JOIN does the opposite - returns all rows from the right table and matched rows from the left table.",
     difficulty: "Easy",
     categoryId: "joins",
     type: "query",
     answer: `## LEFT JOIN vs RIGHT JOIN
 
 ### LEFT JOIN
 Returns **all rows from left table** + matching rows from right.
 
 \`\`\`sql
 -- All users, with their orders (if any)
 SELECT u.name, o.total
 FROM users u
 LEFT JOIN orders o ON u.id = o.user_id;
 \`\`\`
 
 | name  | total  |
 |-------|--------|
 | John  | 99.99  |
 | Jane  | NULL   | ← Jane has no orders
 
 ### RIGHT JOIN
 Returns matching rows from left + **all rows from right table**.
 
 \`\`\`sql
 -- All orders, with user info (if exists)
 SELECT u.name, o.total
 FROM users u
 RIGHT JOIN orders o ON u.id = o.user_id;
 \`\`\`
 
 ### Pro Tip
 RIGHT JOIN can always be rewritten as LEFT JOIN:
 \`\`\`sql
 -- These are equivalent
 A RIGHT JOIN B  ≡  B LEFT JOIN A
 \`\`\``,
   },
   {
     id: 11,
     title: "What is the difference between WHERE and HAVING clauses?",
     text: "WHERE filters rows before aggregation, while HAVING filters groups after aggregation. You use WHERE with raw data and HAVING with aggregated results like SUM or COUNT, often combined with GROUP BY.",
     difficulty: "Medium",
     categoryId: "filtering",
     type: "conceptual",
     answer: `## WHERE vs HAVING
 
 | Clause | Filters | Used With | Timing |
 |--------|---------|-----------|--------|
 | WHERE | Individual rows | Any column | Before GROUP BY |
 | HAVING | Grouped results | Aggregates | After GROUP BY |
 
 ### Example
 \`\`\`sql
 -- Find categories with more than 5 active products
 SELECT 
     category,
     COUNT(*) as product_count,
     AVG(price) as avg_price
 FROM products
 WHERE status = 'active'      -- Filter rows BEFORE grouping
 GROUP BY category
 HAVING COUNT(*) > 5;         -- Filter groups AFTER aggregation
 \`\`\`
 
 ### Order of Execution
 1. \`FROM\` - Get data from tables
 2. \`WHERE\` - Filter individual rows
 3. \`GROUP BY\` - Group rows
 4. \`HAVING\` - Filter groups
 5. \`SELECT\` - Choose columns
 6. \`ORDER BY\` - Sort results`,
   },
   {
     id: 12,
     title: "What is a subquery?",
     text: "A subquery is a query nested inside another query. It can be used in SELECT, FROM, WHERE, or HAVING clauses. Subqueries are executed first, and their results are used by the outer query.",
     difficulty: "Medium",
     categoryId: "subqueries",
     type: "query",
     answer: `## Subqueries
 
 A **subquery** (inner query) is nested within another query (outer query).
 
 ### Types of Subqueries
 
 #### 1. Scalar Subquery (returns single value)
 \`\`\`sql
 SELECT name, salary,
     (SELECT AVG(salary) FROM employees) as avg_salary
 FROM employees;
 \`\`\`
 
 #### 2. Row Subquery (returns single row)
 \`\`\`sql
 SELECT * FROM employees
 WHERE (department, salary) = (
     SELECT department, MAX(salary)
     FROM employees
     GROUP BY department
     LIMIT 1
 );
 \`\`\`
 
 #### 3. Table Subquery (returns multiple rows)
 \`\`\`sql
 SELECT * FROM employees
 WHERE department_id IN (
     SELECT id FROM departments WHERE location = 'NYC'
 );
 \`\`\`
 
 #### 4. Correlated Subquery (references outer query)
 \`\`\`sql
 SELECT e.name, e.salary
 FROM employees e
 WHERE salary > (
     SELECT AVG(salary)
     FROM employees
     WHERE department_id = e.department_id
 );
 \`\`\``,
   },
   {
     id: 13,
     title: "What is the difference between UNION and UNION ALL?",
     text: "UNION combines result sets from two queries and removes duplicates. UNION ALL combines result sets but keeps all duplicates. UNION ALL is faster because it skips the deduplication step.",
     difficulty: "Easy",
     categoryId: "basics",
     type: "conceptual",
     answer: `## UNION vs UNION ALL
 
 | Aspect | UNION | UNION ALL |
 |--------|-------|-----------|
 | Duplicates | Removed | Kept |
 | Performance | Slower | Faster |
 | Use Case | Need distinct | Need all rows |
 
 ### Example
 \`\`\`sql
 -- UNION: Removes duplicates
 SELECT city FROM customers
 UNION
 SELECT city FROM suppliers;
 -- Returns: NYC, LA, Chicago
 
 -- UNION ALL: Keeps duplicates
 SELECT city FROM customers
 UNION ALL
 SELECT city FROM suppliers;
 -- Returns: NYC, LA, NYC, Chicago, LA
 \`\`\`
 
 ### Requirements
 - Same number of columns
 - Compatible data types
 - Column names from first query
 
 ### Pro Tip
 Use UNION ALL when you know there are no duplicates or duplicates are acceptable - it's significantly faster on large datasets.`,
   },
   {
     id: 14,
     title: "Explain window functions in SQL.",
     text: "Window functions perform calculations across a set of rows related to the current row without collapsing them into a single output. Unlike GROUP BY, they preserve individual rows while computing aggregates over partitions.",
     difficulty: "Hard",
     categoryId: "window-functions",
     type: "conceptual",
     answer: `## Window Functions
 
 Window functions calculate values across a "window" of rows related to the current row, **without collapsing rows**.
 
 ### Syntax
 \`\`\`sql
 function_name() OVER (
     PARTITION BY column    -- Optional: divide into groups
     ORDER BY column        -- Optional: order within partition
     ROWS/RANGE frame       -- Optional: define window frame
 )
 \`\`\`
 
 ### Common Window Functions
 
 \`\`\`sql
 SELECT 
     name,
     department,
     salary,
     -- Aggregate window functions
     SUM(salary) OVER (PARTITION BY department) as dept_total,
     AVG(salary) OVER (PARTITION BY department) as dept_avg,
     
     -- Ranking functions
     ROW_NUMBER() OVER (ORDER BY salary DESC) as row_num,
     RANK() OVER (ORDER BY salary DESC) as rank,
     DENSE_RANK() OVER (ORDER BY salary DESC) as dense_rank,
     
     -- Value functions
     LAG(salary, 1) OVER (ORDER BY hire_date) as prev_salary,
     LEAD(salary, 1) OVER (ORDER BY hire_date) as next_salary,
     FIRST_VALUE(name) OVER (PARTITION BY dept ORDER BY salary DESC) as top_earner
 FROM employees;
 \`\`\``,
   },
   {
     id: 15,
     title: "What is the difference between RANK, DENSE_RANK, and ROW_NUMBER?",
     text: "ROW_NUMBER assigns unique sequential numbers. RANK assigns the same number to ties but skips subsequent numbers. DENSE_RANK also handles ties but doesn't skip numbers.",
     difficulty: "Medium",
     categoryId: "window-functions",
     type: "query",
     answer: `## RANK vs DENSE_RANK vs ROW_NUMBER
 
 ### Comparison
 | Salary | ROW_NUMBER | RANK | DENSE_RANK |
 |--------|------------|------|------------|
 | 100    | 1          | 1    | 1          |
 | 100    | 2          | 1    | 1          |
 | 90     | 3          | 3    | 2          |
 | 80     | 4          | 4    | 3          |
 
 ### Example
 \`\`\`sql
 SELECT 
     name,
     salary,
     ROW_NUMBER() OVER (ORDER BY salary DESC) as row_num,
     RANK() OVER (ORDER BY salary DESC) as rank,
     DENSE_RANK() OVER (ORDER BY salary DESC) as dense_rank
 FROM employees;
 \`\`\`
 
 ### When to Use Each
 - **ROW_NUMBER**: Unique identifier, pagination
 - **RANK**: Ranking with gaps (sports standings)
 - **DENSE_RANK**: Ranking without gaps (Top N queries)`,
   },
   {
     id: 16,
     title: "What is a CTE (Common Table Expression)?",
     text: "A CTE is a temporary named result set that exists only within the scope of a single statement. It improves query readability and can be referenced multiple times within the main query.",
     difficulty: "Medium",
     categoryId: "subqueries",
     type: "query",
     answer: `## Common Table Expression (CTE)
 
 A CTE is a temporary, named result set defined within a query using the \`WITH\` clause.
 
 ### Basic Syntax
 \`\`\`sql
 WITH cte_name AS (
     SELECT column1, column2
     FROM table
     WHERE condition
 )
 SELECT * FROM cte_name;
 \`\`\`
 
 ### Benefits
 1. **Readability**: Break complex queries into logical parts
 2. **Reusability**: Reference the CTE multiple times
 3. **Recursion**: Can be self-referencing
 
 ### Example: Multiple CTEs
 \`\`\`sql
 WITH 
 high_value_orders AS (
     SELECT user_id, SUM(total) as order_total
     FROM orders
     GROUP BY user_id
     HAVING SUM(total) > 1000
 ),
 active_users AS (
     SELECT id, name, email
     FROM users
     WHERE last_login > NOW() - INTERVAL '30 days'
 )
 SELECT au.name, au.email, hvo.order_total
 FROM active_users au
 JOIN high_value_orders hvo ON au.id = hvo.user_id;
 \`\`\`
 
 ### Recursive CTE
 \`\`\`sql
 WITH RECURSIVE hierarchy AS (
     -- Base case
     SELECT id, name, manager_id, 1 as level
     FROM employees WHERE manager_id IS NULL
     
     UNION ALL
     
     -- Recursive case
     SELECT e.id, e.name, e.manager_id, h.level + 1
     FROM employees e
     JOIN hierarchy h ON e.manager_id = h.id
 )
 SELECT * FROM hierarchy;
 \`\`\``,
   },
   {
     id: 17,
     title: "What are indexes and why are they important?",
     text: "Indexes are data structures that improve the speed of data retrieval operations on a database table. They work like a book's index - allowing the database to find data without scanning every row.",
     difficulty: "Medium",
     categoryId: "indexing",
     type: "conceptual",
     answer: `## Database Indexes
 
 An **index** is a data structure (typically B-tree) that speeds up data retrieval.
 
 ### Creating Indexes
 \`\`\`sql
 -- Single column index
 CREATE INDEX idx_users_email ON users(email);
 
 -- Composite index (order matters!)
 CREATE INDEX idx_orders_user_date ON orders(user_id, created_at);
 
 -- Unique index
 CREATE UNIQUE INDEX idx_users_username ON users(username);
 
 -- Partial index (PostgreSQL)
 CREATE INDEX idx_active_users ON users(email) WHERE active = true;
 \`\`\`
 
 ### When to Index
 ✅ **Do Index:**
 - Columns in WHERE clauses
 - JOIN columns
 - ORDER BY columns
 - Foreign keys
 
 ❌ **Avoid Indexing:**
 - Small tables
 - Frequently updated columns
 - Low cardinality columns (boolean, status)
 
 ### Trade-offs
 | Benefit | Cost |
 |---------|------|
 | Faster reads | Slower writes |
 | Efficient sorting | Extra storage |
 | Quick lookups | Maintenance overhead |`,
   },
   {
     id: 18,
     title: "Explain ACID properties in database transactions.",
     text: "ACID stands for Atomicity, Consistency, Isolation, and Durability. These properties ensure reliable processing of database transactions, maintaining data integrity even in case of errors or system failures.",
     difficulty: "Medium",
     categoryId: "transactions",
     type: "conceptual",
     answer: `## ACID Properties
 
 ACID ensures reliable transaction processing in databases.
 
 ### A - Atomicity
 "All or nothing" - transaction either completes fully or not at all.
 
 \`\`\`sql
 BEGIN TRANSACTION;
     UPDATE accounts SET balance = balance - 100 WHERE id = 1;
     UPDATE accounts SET balance = balance + 100 WHERE id = 2;
 COMMIT; -- Both succeed or both fail
 \`\`\`
 
 ### C - Consistency
 Database moves from one valid state to another. All rules, constraints, and triggers are satisfied.
 
 ### I - Isolation
 Concurrent transactions don't interfere with each other.
 
 **Isolation Levels:**
 1. READ UNCOMMITTED (lowest)
 2. READ COMMITTED
 3. REPEATABLE READ
 4. SERIALIZABLE (highest)
 
 ### D - Durability
 Once committed, data persists even after system failure.
 
 ### Example
 \`\`\`sql
 BEGIN;
     -- Transfer $500 from account A to B
     UPDATE accounts SET balance = balance - 500 WHERE id = 'A';
     UPDATE accounts SET balance = balance + 500 WHERE id = 'B';
     
     -- Verify: total balance unchanged (Consistency)
     -- If error, ROLLBACK (Atomicity)
 COMMIT; -- Durability: saved to disk
 \`\`\``,
   },
   {
     id: 19,
     title: "What is the GROUP BY clause?",
     text: "GROUP BY groups rows that have the same values in specified columns into summary rows. It's typically used with aggregate functions like COUNT, SUM, AVG, MAX, MIN to perform calculations on each group.",
     difficulty: "Easy",
     categoryId: "aggregations",
     type: "query",
     answer: `## GROUP BY Clause
 
 GROUP BY combines rows with identical values in specified columns and allows aggregate calculations per group.
 
 ### Basic Syntax
 \`\`\`sql
 SELECT column, AGGREGATE_FUNCTION(column)
 FROM table
 GROUP BY column;
 \`\`\`
 
 ### Examples
 \`\`\`sql
 -- Count orders per customer
 SELECT customer_id, COUNT(*) as order_count
 FROM orders
 GROUP BY customer_id;
 
 -- Multiple aggregates
 SELECT 
     department,
     COUNT(*) as employee_count,
     AVG(salary) as avg_salary,
     MAX(salary) as max_salary,
     MIN(hire_date) as first_hire
 FROM employees
 GROUP BY department;
 
 -- Group by multiple columns
 SELECT 
     YEAR(order_date) as year,
     MONTH(order_date) as month,
     SUM(total) as monthly_revenue
 FROM orders
 GROUP BY YEAR(order_date), MONTH(order_date)
 ORDER BY year, month;
 \`\`\`
 
 ### Rule
 Every column in SELECT must either be:
 1. In GROUP BY clause, or
 2. Inside an aggregate function`,
   },
   {
     id: 20,
     title: "How do you find duplicate records in a table?",
     text: "You can find duplicates using GROUP BY with HAVING COUNT(*) > 1. This groups rows by the columns you want to check for duplicates and filters to show only groups with more than one occurrence.",
     difficulty: "Easy",
     categoryId: "aggregations",
     type: "query",
     answer: `## Finding Duplicate Records
 
 ### Method 1: GROUP BY + HAVING
 \`\`\`sql
 -- Find duplicate emails
 SELECT email, COUNT(*) as count
 FROM users
 GROUP BY email
 HAVING COUNT(*) > 1;
 \`\`\`
 
 ### Method 2: Show All Duplicate Rows
 \`\`\`sql
 SELECT *
 FROM users
 WHERE email IN (
     SELECT email
     FROM users
     GROUP BY email
     HAVING COUNT(*) > 1
 );
 \`\`\`
 
 ### Method 3: Using Window Function
 \`\`\`sql
 WITH duplicates AS (
     SELECT *,
         ROW_NUMBER() OVER (PARTITION BY email ORDER BY id) as rn
     FROM users
 )
 SELECT * FROM duplicates WHERE rn > 1;
 \`\`\`
 
 ### Delete Duplicates (Keep First)
 \`\`\`sql
 DELETE FROM users
 WHERE id NOT IN (
     SELECT MIN(id)
     FROM users
     GROUP BY email
 );
 \`\`\``,
   },
   {
     id: 21,
     title: "What is a self-join?",
     text: "A self-join is when a table is joined with itself. It's useful for comparing rows within the same table or querying hierarchical data like organizational structures.",
     difficulty: "Medium",
     categoryId: "joins",
     type: "query",
     answer: `## Self-Join
 
 A **self-join** joins a table to itself using table aliases.
 
 ### Example 1: Employee-Manager Hierarchy
 \`\`\`sql
 SELECT 
     e.name as employee,
     m.name as manager
 FROM employees e
 LEFT JOIN employees m ON e.manager_id = m.id;
 \`\`\`
 
 ### Example 2: Find Employees with Same Salary
 \`\`\`sql
 SELECT 
     e1.name as employee1,
     e2.name as employee2,
     e1.salary
 FROM employees e1
 JOIN employees e2 ON e1.salary = e2.salary
 WHERE e1.id < e2.id;  -- Avoid duplicates
 \`\`\`
 
 ### Example 3: Consecutive Records
 \`\`\`sql
 -- Find consecutive login days
 SELECT 
     a.user_id,
     a.login_date as day1,
     b.login_date as day2
 FROM logins a
 JOIN logins b ON a.user_id = b.user_id 
     AND b.login_date = a.login_date + INTERVAL '1 day';
 \`\`\``,
   },
   {
     id: 22,
     title: "Explain the CASE statement.",
     text: "CASE is SQL's conditional expression, similar to if-else in programming. It evaluates conditions sequentially and returns a value when the first condition is met.",
     difficulty: "Easy",
     categoryId: "basics",
     type: "query",
     answer: `## CASE Statement
 
 CASE provides conditional logic in SQL queries.
 
 ### Simple CASE
 \`\`\`sql
 SELECT 
     name,
     CASE status
         WHEN 'A' THEN 'Active'
         WHEN 'I' THEN 'Inactive'
         WHEN 'P' THEN 'Pending'
         ELSE 'Unknown'
     END as status_label
 FROM users;
 \`\`\`
 
 ### Searched CASE
 \`\`\`sql
 SELECT 
     product_name,
     price,
     CASE
         WHEN price < 10 THEN 'Budget'
         WHEN price < 50 THEN 'Standard'
         WHEN price < 100 THEN 'Premium'
         ELSE 'Luxury'
     END as price_tier
 FROM products;
 \`\`\`
 
 ### CASE in Aggregations
 \`\`\`sql
 SELECT 
     COUNT(CASE WHEN status = 'active' THEN 1 END) as active_count,
     COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_count,
     SUM(CASE WHEN type = 'premium' THEN amount ELSE 0 END) as premium_total
 FROM users;
 \`\`\`
 
 ### CASE in ORDER BY
 \`\`\`sql
 SELECT * FROM tasks
 ORDER BY 
     CASE priority
         WHEN 'critical' THEN 1
         WHEN 'high' THEN 2
         WHEN 'medium' THEN 3
         ELSE 4
     END;
 \`\`\``,
   },
   {
     id: 23,
     title: "What is a view in SQL?",
     text: "A view is a virtual table based on the result of a SQL query. It doesn't store data itself but provides a way to simplify complex queries, restrict access to certain columns, or present data in a specific format.",
     difficulty: "Easy",
     categoryId: "database-design",
     type: "conceptual",
     answer: `## SQL Views
 
 A **view** is a virtual table defined by a SQL query.
 
 ### Creating Views
 \`\`\`sql
 CREATE VIEW active_customers AS
 SELECT id, name, email, total_orders
 FROM customers
 WHERE status = 'active';
 
 -- Use like a regular table
 SELECT * FROM active_customers WHERE total_orders > 10;
 \`\`\`
 
 ### Benefits
 1. **Simplify Queries**: Encapsulate complex joins
 2. **Security**: Expose only specific columns
 3. **Abstraction**: Hide underlying table structure
 
 ### Example: Complex View
 \`\`\`sql
 CREATE VIEW order_summary AS
 SELECT 
     c.name as customer_name,
     COUNT(o.id) as order_count,
     SUM(o.total) as total_spent,
     MAX(o.order_date) as last_order
 FROM customers c
 LEFT JOIN orders o ON c.id = o.customer_id
 GROUP BY c.id, c.name;
 \`\`\`
 
 ### Materialized Views (PostgreSQL)
 \`\`\`sql
 CREATE MATERIALIZED VIEW sales_report AS
 SELECT ... 
 WITH DATA;
 
 -- Refresh when needed
 REFRESH MATERIALIZED VIEW sales_report;
 \`\`\``,
   },
   {
     id: 24,
     title: "What is the difference between DELETE, TRUNCATE, and DROP?",
     text: "DELETE removes specific rows and can be rolled back. TRUNCATE removes all rows quickly and resets identity. DROP removes the entire table structure. Each has different use cases and transaction behaviors.",
     difficulty: "Easy",
     categoryId: "basics",
     type: "conceptual",
     answer: `## DELETE vs TRUNCATE vs DROP
 
 | Aspect | DELETE | TRUNCATE | DROP |
 |--------|--------|----------|------|
 | What | Rows | All rows | Entire table |
 | WHERE clause | ✅ Yes | ❌ No | ❌ No |
 | Rollback | ✅ Yes | ⚠️ Depends | ❌ No |
 | Speed | Slow | Fast | Fast |
 | Triggers | ✅ Fires | ❌ No | ❌ No |
 | Identity Reset | ❌ No | ✅ Yes | N/A |
 
 ### Examples
 \`\`\`sql
 -- DELETE: Remove specific rows (slow, logged)
 DELETE FROM users WHERE status = 'inactive';
 
 -- TRUNCATE: Remove all rows quickly
 TRUNCATE TABLE logs;
 
 -- DROP: Remove entire table
 DROP TABLE temp_data;
 \`\`\`
 
 ### When to Use
 - **DELETE**: Need WHERE clause, triggers, or rollback
 - **TRUNCATE**: Clear table quickly, reset auto-increment
 - **DROP**: Remove table completely`,
   },
   {
     id: 25,
     title: "How do you handle pagination in SQL?",
     text: "Pagination is typically handled using LIMIT and OFFSET clauses. LIMIT specifies maximum rows to return, while OFFSET specifies how many rows to skip. For large datasets, keyset pagination offers better performance.",
     difficulty: "Medium",
     categoryId: "filtering",
     type: "query",
     answer: `## SQL Pagination
 
 ### Method 1: LIMIT + OFFSET
 \`\`\`sql
 -- Page 1 (rows 1-10)
 SELECT * FROM products ORDER BY id LIMIT 10 OFFSET 0;
 
 -- Page 2 (rows 11-20)
 SELECT * FROM products ORDER BY id LIMIT 10 OFFSET 10;
 
 -- Page N
 SELECT * FROM products 
 ORDER BY id 
 LIMIT 10 OFFSET (page_number - 1) * 10;
 \`\`\`
 
 ### Method 2: Keyset Pagination (Better Performance)
 \`\`\`sql
 -- First page
 SELECT * FROM products 
 ORDER BY id 
 LIMIT 10;
 
 -- Next page (using last_id from previous page)
 SELECT * FROM products 
 WHERE id > :last_id
 ORDER BY id 
 LIMIT 10;
 \`\`\`
 
 ### Comparison
 | Aspect | OFFSET | Keyset |
 |--------|--------|--------|
 | Simplicity | ✅ Easy | ⚠️ Complex |
 | Random page access | ✅ Yes | ❌ No |
 | Large offset performance | ❌ Slow | ✅ Fast |
 | Consistency | ❌ Drift possible | ✅ Stable |`,
   },
   {
     id: 26,
     title: "What is a stored procedure?",
     text: "A stored procedure is a prepared SQL code that you save and reuse. It can accept parameters, contain control flow logic, and return results. Stored procedures improve performance and provide a security layer.",
     difficulty: "Medium",
     categoryId: "database-design",
     type: "conceptual",
     answer: `## Stored Procedures
 
 A **stored procedure** is precompiled SQL code stored in the database.
 
 ### Creating a Stored Procedure
 \`\`\`sql
 -- PostgreSQL
 CREATE OR REPLACE FUNCTION get_user_orders(user_id_param INT)
 RETURNS TABLE(order_id INT, total DECIMAL, order_date DATE) AS $$
 BEGIN
     RETURN QUERY
     SELECT id, total, created_at::DATE
     FROM orders
     WHERE user_id = user_id_param;
 END;
 $$ LANGUAGE plpgsql;
 
 -- Call it
 SELECT * FROM get_user_orders(123);
 \`\`\`
 
 ### MySQL Syntax
 \`\`\`sql
 DELIMITER //
 CREATE PROCEDURE GetUserOrders(IN userId INT)
 BEGIN
     SELECT * FROM orders WHERE user_id = userId;
 END //
 DELIMITER ;
 
 CALL GetUserOrders(123);
 \`\`\`
 
 ### Benefits
 1. **Performance**: Precompiled, cached execution plan
 2. **Security**: Grant EXECUTE without table access
 3. **Maintainability**: Centralized business logic
 4. **Reduced network**: Single call vs multiple queries`,
   },
   {
     id: 27,
     title: "What are SQL triggers?",
     text: "Triggers are special stored procedures that automatically execute in response to certain events on a table (INSERT, UPDATE, DELETE). They're used for auditing, data validation, and maintaining derived data.",
     difficulty: "Medium",
     categoryId: "database-design",
     type: "conceptual",
     answer: `## SQL Triggers
 
 A **trigger** automatically executes when a specified event occurs.
 
 ### Creating Triggers
 \`\`\`sql
 -- Audit trigger
 CREATE OR REPLACE FUNCTION audit_user_changes()
 RETURNS TRIGGER AS $$
 BEGIN
     INSERT INTO user_audit_log (
         user_id, action, old_data, new_data, changed_at
     ) VALUES (
         COALESCE(NEW.id, OLD.id),
         TG_OP,
         row_to_json(OLD),
         row_to_json(NEW),
         NOW()
     );
     RETURN NEW;
 END;
 $$ LANGUAGE plpgsql;
 
 CREATE TRIGGER user_audit_trigger
 AFTER INSERT OR UPDATE OR DELETE ON users
 FOR EACH ROW EXECUTE FUNCTION audit_user_changes();
 \`\`\`
 
 ### Trigger Types
 | Type | Timing |
 |------|--------|
 | BEFORE | Before the operation |
 | AFTER | After the operation |
 | INSTEAD OF | Replace the operation (views) |
 
 ### Common Use Cases
 - Audit logging
 - Auto-update timestamps
 - Enforce complex business rules
 - Maintain computed columns
 - Sync denormalized data`,
   },
   {
     id: 28,
     title: "How do you optimize a slow SQL query?",
     text: "Query optimization involves analyzing execution plans, adding appropriate indexes, rewriting queries to be more efficient, avoiding SELECT *, limiting result sets, and ensuring statistics are up to date.",
     difficulty: "Hard",
     categoryId: "indexing",
     type: "scenario",
     answer: `## SQL Query Optimization
 
 ### Step 1: Analyze Execution Plan
 \`\`\`sql
 EXPLAIN ANALYZE SELECT * FROM orders WHERE user_id = 123;
 \`\`\`
 
 ### Step 2: Common Optimizations
 
 #### ❌ Avoid SELECT *
 \`\`\`sql
 -- Bad
 SELECT * FROM users WHERE id = 1;
 
 -- Good
 SELECT id, name, email FROM users WHERE id = 1;
 \`\`\`
 
 #### ❌ Avoid Functions on Indexed Columns
 \`\`\`sql
 -- Bad (can't use index)
 SELECT * FROM orders WHERE YEAR(created_at) = 2024;
 
 -- Good (index-friendly)
 SELECT * FROM orders 
 WHERE created_at >= '2024-01-01' AND created_at < '2025-01-01';
 \`\`\`
 
 #### ✅ Add Missing Indexes
 \`\`\`sql
 -- Check for sequential scans
 CREATE INDEX idx_orders_user_id ON orders(user_id);
 CREATE INDEX idx_orders_created_user ON orders(created_at, user_id);
 \`\`\`
 
 ### Optimization Checklist
 - [ ] Check EXPLAIN plan for full table scans
 - [ ] Add indexes for WHERE, JOIN, ORDER BY columns
 - [ ] Use LIMIT for large result sets
 - [ ] Avoid N+1 queries (use JOINs)
 - [ ] Update table statistics
 - [ ] Consider query caching`,
   },
   {
     id: 29,
     title: "What is the difference between EXISTS and IN?",
     text: "EXISTS checks for row existence and returns true/false. IN compares values against a list. EXISTS is generally faster for large subqueries because it stops at the first match, while IN evaluates all values.",
     difficulty: "Medium",
     categoryId: "subqueries",
     type: "query",
     answer: `## EXISTS vs IN
 
 | Aspect | EXISTS | IN |
 |--------|--------|-----|
 | Returns | Boolean | Value match |
 | NULL handling | Works correctly | Issues with NULL |
 | Performance | Stops at first match | Evaluates all |
 | Best for | Large subqueries | Small lists |
 
 ### Examples
 \`\`\`sql
 -- Using IN
 SELECT * FROM customers
 WHERE id IN (SELECT customer_id FROM orders);
 
 -- Using EXISTS (often faster)
 SELECT * FROM customers c
 WHERE EXISTS (
     SELECT 1 FROM orders o WHERE o.customer_id = c.id
 );
 \`\`\`
 
 ### NOT EXISTS vs NOT IN
 \`\`\`sql
 -- NOT IN has NULL problem!
 SELECT * FROM customers
 WHERE id NOT IN (SELECT customer_id FROM orders);
 -- Returns empty if ANY customer_id is NULL
 
 -- NOT EXISTS handles NULL correctly
 SELECT * FROM customers c
 WHERE NOT EXISTS (
     SELECT 1 FROM orders o WHERE o.customer_id = c.id
 );
 \`\`\`
 
 ### Rule of Thumb
 - Small, static list → IN
 - Large subquery → EXISTS
 - Anything with NOT → EXISTS`,
   },
   {
     id: 30,
     title: "Write a query to find the second highest salary.",
     text: "This is a common interview question testing your knowledge of subqueries or window functions to find nth-highest values.",
     difficulty: "Medium",
     categoryId: "aggregations",
     type: "query",
     answer: `## Find Second Highest Salary
 
 ### Method 1: Subquery
 \`\`\`sql
 SELECT MAX(salary) as second_highest
 FROM employees
 WHERE salary < (SELECT MAX(salary) FROM employees);
 \`\`\`
 
 ### Method 2: LIMIT + OFFSET
 \`\`\`sql
 SELECT DISTINCT salary
 FROM employees
 ORDER BY salary DESC
 LIMIT 1 OFFSET 1;
 \`\`\`
 
 ### Method 3: DENSE_RANK (handles ties)
 \`\`\`sql
 WITH ranked AS (
     SELECT salary, DENSE_RANK() OVER (ORDER BY salary DESC) as rank
     FROM employees
 )
 SELECT DISTINCT salary as second_highest
 FROM ranked
 WHERE rank = 2;
 \`\`\`
 
 ### Method 4: Generic Nth Highest
 \`\`\`sql
 -- Get Nth highest salary
 CREATE FUNCTION getNthHighest(n INT) 
 RETURNS TABLE(salary DECIMAL) AS $$
 BEGIN
     RETURN QUERY
     SELECT DISTINCT e.salary
     FROM employees e
     ORDER BY e.salary DESC
     LIMIT 1 OFFSET n - 1;
 END;
 $$ LANGUAGE plpgsql;
 \`\`\``,
   },
   // More questions...
   {
     id: 31,
     title: "What is a CROSS JOIN?",
     text: "CROSS JOIN produces a Cartesian product of two tables - every row from the first table is combined with every row from the second table. It's rarely used but can be useful for generating combinations.",
     difficulty: "Easy",
     categoryId: "joins",
     type: "query",
     answer: `## CROSS JOIN (Cartesian Product)
 
 A **CROSS JOIN** combines every row from table A with every row from table B.
 
 ### Syntax
 \`\`\`sql
 SELECT * FROM table1 CROSS JOIN table2;
 -- OR
 SELECT * FROM table1, table2;
 \`\`\`
 
 ### Example: Generate All Combinations
 \`\`\`sql
 -- Sizes and Colors tables
 SELECT s.size, c.color
 FROM sizes s
 CROSS JOIN colors c;
 \`\`\`
 
 | size | color |
 |------|-------|
 | S    | Red   |
 | S    | Blue  |
 | M    | Red   |
 | M    | Blue  |
 | L    | Red   |
 | L    | Blue  |
 
 ### Use Cases
 - Generate all date/product combinations for reporting
 - Create test data
 - Pivot table generation
 
 ### ⚠️ Warning
 Be careful! CROSS JOIN can produce huge result sets:
 - 1000 rows × 1000 rows = 1,000,000 rows`,
   },
   {
     id: 32,
     title: "Explain the COALESCE function.",
     text: "COALESCE returns the first non-null value in a list of expressions. It's useful for providing default values when dealing with nullable columns.",
     difficulty: "Easy",
     categoryId: "basics",
     type: "query",
     answer: `## COALESCE Function
 
 **COALESCE** returns the first non-NULL value from a list of arguments.
 
 ### Syntax
 \`\`\`sql
 COALESCE(value1, value2, ..., default_value)
 \`\`\`
 
 ### Examples
 \`\`\`sql
 -- Provide default for NULL
 SELECT COALESCE(phone, 'N/A') as phone FROM users;
 
 -- Try multiple columns
 SELECT COALESCE(mobile_phone, home_phone, work_phone, 'No phone') 
 FROM contacts;
 
 -- In calculations
 SELECT 
     product_name,
     price * COALESCE(discount_percent, 0) / 100 as discount_amount
 FROM products;
 
 -- With aggregates
 SELECT COALESCE(SUM(amount), 0) as total
 FROM orders WHERE user_id = 999;  -- Returns 0 instead of NULL
 \`\`\`
 
 ### vs IFNULL / NVL
 - **COALESCE**: SQL standard, multiple arguments
 - **IFNULL** (MySQL): Two arguments only
 - **NVL** (Oracle): Two arguments only`,
   },
   {
     id: 33,
     title: "What is a composite key?",
     text: "A composite key is a primary key consisting of two or more columns that together uniquely identify a row. It's used when no single column can serve as a unique identifier.",
     difficulty: "Easy",
     categoryId: "constraints",
     type: "conceptual",
     answer: `## Composite Key
 
 A **composite key** uses multiple columns together as a primary key.
 
 ### Example
 \`\`\`sql
 CREATE TABLE order_items (
     order_id INT,
     product_id INT,
     quantity INT,
     price DECIMAL(10, 2),
     PRIMARY KEY (order_id, product_id)  -- Composite key
 );
 \`\`\`
 
 ### Use Cases
 1. **Many-to-Many Junction Tables**
 \`\`\`sql
 CREATE TABLE student_courses (
     student_id INT REFERENCES students(id),
     course_id INT REFERENCES courses(id),
     enrolled_at TIMESTAMP,
     PRIMARY KEY (student_id, course_id)
 );
 \`\`\`
 
 2. **Time-Series Data**
 \`\`\`sql
 CREATE TABLE daily_metrics (
     metric_date DATE,
     metric_name VARCHAR(50),
     value DECIMAL,
     PRIMARY KEY (metric_date, metric_name)
 );
 \`\`\`
 
 ### Indexing Composite Keys
 Order matters! (A, B) can efficiently query:
 - WHERE A = ?
 - WHERE A = ? AND B = ?
 
 But NOT: WHERE B = ? (needs separate index)`,
   },
   {
     id: 34,
     title: "How do you implement a many-to-many relationship?",
     text: "Many-to-many relationships are implemented using a junction table (also called linking or bridge table) that contains foreign keys referencing both related tables.",
     difficulty: "Medium",
     categoryId: "database-design",
     type: "scenario",
     answer: `## Many-to-Many Relationships
 
 Use a **junction table** (bridge/linking table) to connect two tables.
 
 ### Example: Students ↔ Courses
 \`\`\`sql
 -- Main tables
 CREATE TABLE students (
     id SERIAL PRIMARY KEY,
     name VARCHAR(100)
 );
 
 CREATE TABLE courses (
     id SERIAL PRIMARY KEY,
     title VARCHAR(200)
 );
 
 -- Junction table
 CREATE TABLE enrollments (
     student_id INT REFERENCES students(id) ON DELETE CASCADE,
     course_id INT REFERENCES courses(id) ON DELETE CASCADE,
     enrolled_at TIMESTAMP DEFAULT NOW(),
     grade VARCHAR(2),
     PRIMARY KEY (student_id, course_id)
 );
 \`\`\`
 
 ### Querying Many-to-Many
 \`\`\`sql
 -- Get all courses for a student
 SELECT c.title, e.grade
 FROM courses c
 JOIN enrollments e ON c.id = e.course_id
 WHERE e.student_id = 1;
 
 -- Get all students in a course
 SELECT s.name, e.enrolled_at
 FROM students s
 JOIN enrollments e ON s.id = e.student_id
 WHERE e.course_id = 101;
 
 -- Count students per course
 SELECT c.title, COUNT(e.student_id) as student_count
 FROM courses c
 LEFT JOIN enrollments e ON c.id = e.course_id
 GROUP BY c.id, c.title;
 \`\`\``,
   },
   {
     id: 35,
     title: "What is the LAG and LEAD function?",
     text: "LAG accesses data from a previous row, while LEAD accesses data from a following row within the same result set. They're window functions useful for comparing values between consecutive rows.",
     difficulty: "Medium",
     categoryId: "window-functions",
     type: "query",
     answer: `## LAG and LEAD Functions
 
 **LAG**: Access previous row's value
 **LEAD**: Access next row's value
 
 ### Syntax
 \`\`\`sql
 LAG(column, offset, default) OVER (ORDER BY column)
 LEAD(column, offset, default) OVER (ORDER BY column)
 \`\`\`
 
 ### Example: Compare with Previous
 \`\`\`sql
 SELECT 
     sale_date,
     revenue,
     LAG(revenue, 1, 0) OVER (ORDER BY sale_date) as prev_revenue,
     revenue - LAG(revenue, 1, 0) OVER (ORDER BY sale_date) as change
 FROM daily_sales;
 \`\`\`
 
 | sale_date  | revenue | prev_revenue | change |
 |------------|---------|--------------|--------|
 | 2024-01-01 | 1000    | 0            | 1000   |
 | 2024-01-02 | 1200    | 1000         | 200    |
 | 2024-01-03 | 1100    | 1200         | -100   |
 
 ### Calculate Growth Rate
 \`\`\`sql
 SELECT 
     month,
     revenue,
     ROUND(
         (revenue - LAG(revenue) OVER (ORDER BY month)) * 100.0 
         / LAG(revenue) OVER (ORDER BY month), 
         2
     ) as growth_percent
 FROM monthly_revenue;
 \`\`\``,
   },
   {
     id: 36,
     title: "How do you pivot data in SQL?",
     text: "Pivoting transforms rows into columns. It can be done using CASE statements with aggregation or the PIVOT operator (in some databases). It's useful for creating cross-tabulation reports.",
     difficulty: "Hard",
     categoryId: "aggregations",
     type: "query",
     answer: `## Pivoting Data in SQL
 
 **Pivoting** transforms row values into column headers.
 
 ### Method 1: CASE + Aggregation
 \`\`\`sql
 -- Sales by product and quarter
 SELECT 
     product_name,
     SUM(CASE WHEN quarter = 'Q1' THEN amount ELSE 0 END) as Q1,
     SUM(CASE WHEN quarter = 'Q2' THEN amount ELSE 0 END) as Q2,
     SUM(CASE WHEN quarter = 'Q3' THEN amount ELSE 0 END) as Q3,
     SUM(CASE WHEN quarter = 'Q4' THEN amount ELSE 0 END) as Q4
 FROM sales
 GROUP BY product_name;
 \`\`\`
 
 ### Result
 | product_name | Q1   | Q2   | Q3   | Q4   |
 |--------------|------|------|------|------|
 | Widget A     | 1000 | 1200 | 1100 | 1400 |
 | Widget B     | 800  | 900  | 1000 | 1100 |
 
 ### Method 2: CROSSTAB (PostgreSQL)
 \`\`\`sql
 SELECT * FROM crosstab(
     'SELECT product, quarter, amount FROM sales ORDER BY 1, 2',
     'SELECT DISTINCT quarter FROM sales ORDER BY 1'
 ) AS ct(product TEXT, Q1 INT, Q2 INT, Q3 INT, Q4 INT);
 \`\`\`
 
 ### Dynamic Pivot (Advanced)
 Requires dynamic SQL since column names aren't known at compile time.`,
   },
   {
     id: 37,
     title: "What are isolation levels in transactions?",
     text: "Isolation levels define how transaction integrity is visible to other transactions. The four levels are READ UNCOMMITTED, READ COMMITTED, REPEATABLE READ, and SERIALIZABLE, each offering different trade-offs between consistency and performance.",
     difficulty: "Hard",
     categoryId: "transactions",
     type: "conceptual",
     answer: `## Transaction Isolation Levels
 
 Isolation levels control visibility of changes between concurrent transactions.
 
 ### The Four Levels
 
 | Level | Dirty Read | Non-Repeatable Read | Phantom Read |
 |-------|-----------|---------------------|--------------|
 | READ UNCOMMITTED | ✅ | ✅ | ✅ |
 | READ COMMITTED | ❌ | ✅ | ✅ |
 | REPEATABLE READ | ❌ | ❌ | ✅ |
 | SERIALIZABLE | ❌ | ❌ | ❌ |
 
 ### Setting Isolation Level
 \`\`\`sql
 -- Per transaction
 SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
 BEGIN;
     -- Your queries
 COMMIT;
 
 -- Session level
 SET SESSION CHARACTERISTICS AS TRANSACTION ISOLATION LEVEL READ COMMITTED;
 \`\`\`
 
 ### Read Phenomena
 - **Dirty Read**: Reading uncommitted data from another transaction
 - **Non-Repeatable Read**: Same query returns different values within a transaction
 - **Phantom Read**: New rows appear between two identical queries
 
 ### Best Practices
 - **READ COMMITTED**: Default, good balance (PostgreSQL default)
 - **SERIALIZABLE**: Financial transactions, critical consistency
 - **READ UNCOMMITTED**: Rarely used, only for approximate counts`,
   },
   {
     id: 38,
     title: "How do you find gaps in sequential data?",
     text: "Finding gaps involves comparing consecutive values using self-joins, window functions (LAG/LEAD), or generating a complete sequence and finding missing values with NOT EXISTS.",
     difficulty: "Hard",
     categoryId: "window-functions",
     type: "query",
     answer: `## Finding Gaps in Sequential Data
 
 ### Method 1: LAG Window Function
 \`\`\`sql
 WITH numbered AS (
     SELECT 
         id,
         LAG(id) OVER (ORDER BY id) as prev_id
     FROM orders
 )
 SELECT prev_id + 1 as gap_start, id - 1 as gap_end
 FROM numbered
 WHERE id - prev_id > 1;
 \`\`\`
 
 ### Method 2: Self-Join
 \`\`\`sql
 SELECT a.id + 1 as gap_start
 FROM orders a
 LEFT JOIN orders b ON a.id + 1 = b.id
 WHERE b.id IS NULL
 AND a.id < (SELECT MAX(id) FROM orders);
 \`\`\`
 
 ### Method 3: Generate Series (PostgreSQL)
 \`\`\`sql
 SELECT s.id as missing_id
 FROM generate_series(
     (SELECT MIN(id) FROM orders),
     (SELECT MAX(id) FROM orders)
 ) s(id)
 LEFT JOIN orders o ON s.id = o.id
 WHERE o.id IS NULL;
 \`\`\`
 
 ### Finding Date Gaps
 \`\`\`sql
 SELECT 
     sale_date,
     LEAD(sale_date) OVER (ORDER BY sale_date) as next_date,
     LEAD(sale_date) OVER (ORDER BY sale_date) - sale_date - 1 as gap_days
 FROM daily_sales
 HAVING gap_days > 0;
 \`\`\``,
   },
   {
     id: 39,
     title: "What is a recursive CTE?",
     text: "A recursive CTE references itself to process hierarchical or tree-structured data. It has a base case (anchor member) and a recursive case that builds upon previous results until no more rows are returned.",
     difficulty: "Hard",
     categoryId: "subqueries",
     type: "query",
     answer: `## Recursive CTE
 
 A **recursive CTE** references itself to traverse hierarchical data.
 
 ### Structure
 \`\`\`sql
 WITH RECURSIVE cte_name AS (
     -- Anchor member (base case)
     SELECT initial_query
     
     UNION ALL
     
     -- Recursive member
     SELECT recursive_query
     FROM cte_name
     WHERE termination_condition
 )
 SELECT * FROM cte_name;
 \`\`\`
 
 ### Example: Employee Hierarchy
 \`\`\`sql
 WITH RECURSIVE org_chart AS (
     -- Base: CEO (no manager)
     SELECT id, name, manager_id, 1 as level, name as path
     FROM employees
     WHERE manager_id IS NULL
     
     UNION ALL
     
     -- Recursive: Find subordinates
     SELECT e.id, e.name, e.manager_id, oc.level + 1,
            oc.path || ' > ' || e.name
     FROM employees e
     JOIN org_chart oc ON e.manager_id = oc.id
 )
 SELECT * FROM org_chart ORDER BY path;
 \`\`\`
 
 ### Example: Running Total
 \`\`\`sql
 WITH RECURSIVE running AS (
     SELECT 1 as n, 1 as factorial
     UNION ALL
     SELECT n + 1, factorial * (n + 1)
     FROM running
     WHERE n < 10
 )
 SELECT * FROM running;
 \`\`\``,
   },
   {
     id: 40,
     title: "What is the difference between CHAR and VARCHAR?",
     text: "CHAR is fixed-length and pads with spaces, while VARCHAR is variable-length and only uses needed space. CHAR is slightly faster for fixed-length data, but VARCHAR is more storage-efficient for variable-length strings.",
     difficulty: "Easy",
     categoryId: "basics",
     type: "conceptual",
     answer: `## CHAR vs VARCHAR
 
 | Aspect | CHAR(n) | VARCHAR(n) |
 |--------|---------|------------|
 | Length | Fixed | Variable |
 | Storage | Always n bytes | Actual length + overhead |
 | Padding | Pads with spaces | No padding |
 | Comparison | Ignores trailing spaces | Exact match |
 
 ### Examples
 \`\`\`sql
 -- CHAR(10) storing 'Hello'
 -- Stored as: 'Hello     ' (padded to 10 chars)
 
 -- VARCHAR(10) storing 'Hello'
 -- Stored as: 'Hello' (5 chars + length byte)
 
 CREATE TABLE example (
     country_code CHAR(2),      -- Always 2 chars: 'US', 'UK'
     name VARCHAR(100)          -- Variable: 1-100 chars
 );
 \`\`\`
 
 ### When to Use
 **CHAR**: Fixed-length data
 - Country codes (US, UK)
 - State abbreviations (CA, NY)
 - MD5 hashes (32 chars)
 
 **VARCHAR**: Variable-length data
 - Names, emails, addresses
 - Most text fields`,
   },
   {
     id: 41,
     title: "What is the difference between DELETE, TRUNCATE, and DROP?",
     text: "DELETE removes specific rows with optional WHERE clause and can be rolled back. TRUNCATE removes all rows quickly without logging individual deletions. DROP removes the entire table structure and data permanently.",
     difficulty: "Medium",
     categoryId: "basics",
     type: "conceptual",
     answer: "## DELETE vs TRUNCATE vs DROP\n\n| Command | Removes | Rollback | WHERE | Speed |\n|---------|---------|----------|-------|-------|\n| DELETE | Rows | Yes | Yes | Slow |\n| TRUNCATE | All Rows | No* | No | Fast |\n| DROP | Table | No | N/A | Instant |\n\n### DELETE\n```sql\nDELETE FROM orders WHERE status = 'cancelled';\n```\n\n### TRUNCATE\n```sql\nTRUNCATE TABLE temp_data;\n```\n\n### DROP\n```sql\nDROP TABLE IF EXISTS old_backups;\n```",
   },
   {
     id: 42,
     title: "What is an alias in SQL?",
     text: "An alias is a temporary name given to a table or column for the duration of a query.",
     difficulty: "Easy",
     categoryId: "basics",
     type: "query",
     answer: "## SQL Aliases\n\n### Column Aliases\n```sql\nSELECT first_name AS \"First Name\", salary * 12 AS annual_salary FROM employees;\n```\n\n### Table Aliases\n```sql\nSELECT e.name, d.department_name FROM employees e JOIN departments d ON e.dept_id = d.id;\n```",
   },
   {
     id: 43,
     title: "What is the difference between UNION and UNION ALL?",
     text: "UNION combines result sets and removes duplicates. UNION ALL combines without removing duplicates.",
     difficulty: "Medium",
     categoryId: "basics",
     type: "query",
     answer: "## UNION vs UNION ALL\n\n| Feature | UNION | UNION ALL |\n|---------|-------|----------|\n| Duplicates | Removed | Kept |\n| Performance | Slower | Faster |\n\n```sql\nSELECT city FROM customers UNION SELECT city FROM suppliers;\nSELECT city FROM customers UNION ALL SELECT city FROM suppliers;\n```",
   },
   {
     id: 44,
     title: "What is the purpose of the DISTINCT keyword?",
     text: "DISTINCT eliminates duplicate rows from query results.",
     difficulty: "Easy",
     categoryId: "basics",
     type: "query",
     answer: "## DISTINCT Keyword\n\n```sql\nSELECT DISTINCT country FROM customers;\nSELECT COUNT(DISTINCT category) FROM products;\n```",
   },
   {
     id: 45,
     title: "What is the ORDER BY clause?",
     text: "ORDER BY sorts query results by one or more columns in ascending or descending order.",
     difficulty: "Easy",
     categoryId: "basics",
     type: "query",
     answer: "## ORDER BY Clause\n\n```sql\nSELECT * FROM products ORDER BY price DESC;\nSELECT * FROM products ORDER BY category ASC, price DESC;\nSELECT * FROM employees ORDER BY manager_id NULLS FIRST;\n```",
   },
   {
     id: 46,
     title: "What is the LIMIT clause?",
     text: "LIMIT restricts the number of rows returned. Combined with OFFSET, it enables pagination.",
     difficulty: "Easy",
     categoryId: "basics",
     type: "query",
     answer: "## LIMIT Clause\n\n```sql\nSELECT * FROM products ORDER BY sales DESC LIMIT 10;\nSELECT * FROM products ORDER BY id LIMIT 10 OFFSET 10; -- Page 2\n```",
   },
   {
     id: 47,
     title: "What are views in SQL?",
     text: "A view is a virtual table based on a SELECT query that provides a saved query for reuse.",
     difficulty: "Medium",
     categoryId: "basics",
     type: "conceptual",
     answer: "## SQL Views\n\n```sql\nCREATE VIEW active_customers AS\nSELECT id, name, email FROM customers WHERE status = 'active';\n\nSELECT * FROM active_customers;\n```\n\n**Benefits**: Simplicity, Security, Consistency",
   },
   {
     id: 48,
     title: "What is a stored procedure?",
     text: "A stored procedure is a precompiled collection of SQL statements stored in the database.",
     difficulty: "Medium",
     categoryId: "basics",
     type: "conceptual",
     answer: "## Stored Procedures\n\n```sql\nCREATE OR REPLACE PROCEDURE transfer_funds(sender_id INT, receiver_id INT, amount DECIMAL)\nLANGUAGE plpgsql AS $$\nBEGIN\n    UPDATE accounts SET balance = balance - amount WHERE id = sender_id;\n    UPDATE accounts SET balance = balance + amount WHERE id = receiver_id;\n    COMMIT;\nEND;\n$$;\n\nCALL transfer_funds(1, 2, 100.00);\n```",
   },
   {
     id: 49,
     title: "What is a trigger in SQL?",
     text: "A trigger automatically executes when specific events occur on a table.",
     difficulty: "Medium",
     categoryId: "basics",
     type: "conceptual",
     answer: "## SQL Triggers\n\n```sql\nCREATE TRIGGER users_audit\nAFTER INSERT OR UPDATE OR DELETE ON users\nFOR EACH ROW EXECUTE FUNCTION audit_changes();\n```\n\n**Use Cases**: Audit trails, validation, auto-update timestamps",
   },
   {
     id: 50,
     title: "What is a materialized view?",
     text: "A materialized view stores query results physically and must be refreshed to update.",
     difficulty: "Medium",
     categoryId: "basics",
     type: "conceptual",
     answer: "## Materialized Views\n\n```sql\nCREATE MATERIALIZED VIEW monthly_report AS\nSELECT DATE_TRUNC('month', date) AS month, SUM(amount) FROM orders GROUP BY 1;\n\nREFRESH MATERIALIZED VIEW monthly_report;\nREFRESH MATERIALIZED VIEW CONCURRENTLY monthly_report;\n```",
   },
   {
     id: 51,
     title: "How do you use the IN operator?",
     text: "IN tests whether a value matches any value in a list or subquery.",
     difficulty: "Easy",
     categoryId: "filtering",
     type: "query",
     answer: "## IN Operator\n\n```sql\nSELECT * FROM products WHERE category IN ('Electronics', 'Clothing');\nSELECT * FROM orders WHERE status NOT IN ('cancelled', 'refunded');\nSELECT * FROM customers WHERE id IN (SELECT customer_id FROM orders);\n```",
   },
   {
     id: 52,
     title: "How does the BETWEEN operator work?",
     text: "BETWEEN filters values within an inclusive range for numbers, dates, and strings.",
     difficulty: "Easy",
     categoryId: "filtering",
     type: "query",
     answer: "## BETWEEN Operator\n\n```sql\nSELECT * FROM products WHERE price BETWEEN 10 AND 50;\nSELECT * FROM orders WHERE order_date BETWEEN '2024-01-01' AND '2024-01-31';\n```",
   },
   {
     id: 53,
     title: "How do you use LIKE for pattern matching?",
     text: "LIKE uses wildcards: % matches any sequence, _ matches one character.",
     difficulty: "Easy",
     categoryId: "filtering",
     type: "query",
     answer: "## LIKE Pattern Matching\n\n```sql\nSELECT * FROM users WHERE name LIKE 'John%';  -- Starts with\nSELECT * FROM users WHERE name LIKE '%son';   -- Ends with\nSELECT * FROM users WHERE name ILIKE '%john%'; -- Case insensitive\n```",
   },
   {
     id: 54,
     title: "What is the EXISTS operator?",
     text: "EXISTS returns TRUE if a subquery returns any rows, FALSE otherwise.",
     difficulty: "Medium",
     categoryId: "filtering",
     type: "query",
     answer: "## EXISTS Operator\n\n```sql\nSELECT * FROM customers c\nWHERE EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id);\n\nSELECT * FROM customers c\nWHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id);\n```",
   },
   {
     id: 55,
     title: "How do you use CASE expressions?",
     text: "CASE provides if-then-else logic in SQL for conditional values.",
     difficulty: "Medium",
     categoryId: "filtering",
     type: "query",
     answer: "## CASE Expressions\n\n```sql\nSELECT name,\n    CASE\n        WHEN salary >= 100000 THEN 'Executive'\n        WHEN salary >= 70000 THEN 'Senior'\n        ELSE 'Junior'\n    END AS level\nFROM employees;\n```",
   },
   {
     id: 56,
     title: "How do you filter NULL values?",
     text: "Use IS NULL and IS NOT NULL. Regular operators don't work with NULL.",
     difficulty: "Easy",
     categoryId: "filtering",
     type: "query",
     answer: "## Filtering NULL Values\n\n```sql\nSELECT * FROM employees WHERE manager_id IS NULL;\nSELECT * FROM employees WHERE manager_id IS NOT NULL;\nSELECT name, COALESCE(phone, 'N/A') FROM customers;\n```",
   },
   {
     id: 57,
     title: "How do you filter by date ranges?",
     text: "Use proper date comparisons and functions for accurate date filtering.",
     difficulty: "Medium",
     categoryId: "filtering",
     type: "query",
     answer: "## Date Range Filtering\n\n```sql\nWHERE order_date >= '2024-01-01' AND order_date < '2024-02-01'\nWHERE created_at >= CURRENT_DATE - INTERVAL '7 days'\nWHERE order_date >= DATE_TRUNC('month', CURRENT_DATE)\n```",
   },
   {
     id: 58,
     title: "What are ANY and ALL operators?",
     text: "ANY returns true if any subquery value matches. ALL requires all values to match.",
     difficulty: "Medium",
     categoryId: "filtering",
     type: "query",
     answer: "## ANY and ALL\n\n```sql\nSELECT * FROM products WHERE price > ANY (SELECT price FROM electronics);\nSELECT * FROM products WHERE price > ALL (SELECT price FROM electronics);\n```\n\n| Expression | Equivalent |\n|------------|------------|\n| = ANY | IN |\n| > ANY | > MIN() |\n| > ALL | > MAX() |",
   },
   {
     id: 59,
     title: "What are regular expressions in SQL?",
     text: "Regex provides powerful pattern matching. PostgreSQL uses ~ and SIMILAR TO.",
     difficulty: "Hard",
     categoryId: "filtering",
     type: "query",
     answer: "## Regular Expressions\n\n```sql\nSELECT * FROM users WHERE email ~ '^[a-z]+@gmail\\.com$';\nSELECT * FROM users WHERE name ~* 'john';  -- Case insensitive\nSELECT REGEXP_REPLACE(phone, '[^0-9]', '', 'g') FROM contacts;\n```",
   },
   {
     id: 60,
     title: "What is the difference between AND and OR?",
     text: "AND requires all conditions true. OR requires at least one. AND has higher precedence.",
     difficulty: "Easy",
     categoryId: "filtering",
     type: "query",
     answer: "## AND vs OR\n\n```sql\nSELECT * FROM products WHERE category = 'Electronics' AND price < 500;\nSELECT * FROM products WHERE category = 'Electronics' OR category = 'Books';\n\n-- Use parentheses for clarity\nWHERE (a = 1 OR b = 2) AND c = 3\n```",
   },
   {
     id: 61,
     title: "What is a CROSS JOIN?",
     text: "CROSS JOIN produces a Cartesian product of all row combinations.",
     difficulty: "Medium",
     categoryId: "joins",
     type: "query",
     answer: "## CROSS JOIN\n\n```sql\nSELECT * FROM colors CROSS JOIN sizes;\n```\n\nColors: Red, Blue × Sizes: S, M, L = 6 rows",
   },
   {
     id: 62,
     title: "What is a SELF JOIN?",
     text: "A self join joins a table with itself for comparing rows within the same table.",
     difficulty: "Medium",
     categoryId: "joins",
     type: "query",
     answer: "## SELF JOIN\n\n```sql\nSELECT e.name AS employee, m.name AS manager\nFROM employees e LEFT JOIN employees m ON e.manager_id = m.id;\n```",
   },
   {
     id: 63,
     title: "What is a NATURAL JOIN?",
     text: "NATURAL JOIN automatically joins on columns with the same name. Use with caution.",
     difficulty: "Medium",
     categoryId: "joins",
     type: "query",
     answer: "## NATURAL JOIN\n\n```sql\nSELECT * FROM orders NATURAL JOIN customers;\n```\n\n**Better Alternative**:\n```sql\nSELECT * FROM orders JOIN customers USING (customer_id);\n```",
   },
   {
     id: 64,
     title: "How do you join multiple tables?",
     text: "Chain JOIN clauses to connect multiple tables in a single query.",
     difficulty: "Medium",
     categoryId: "joins",
     type: "query",
     answer: "## Multi-Table Joins\n\n```sql\nSELECT o.id, c.name, p.name AS product\nFROM orders o\nJOIN customers c ON o.customer_id = c.id\nJOIN order_items oi ON o.id = oi.order_id\nJOIN products p ON oi.product_id = p.id;\n```",
   },
   {
     id: 65,
     title: "What is JOIN ON vs JOIN USING?",
     text: "ON allows any condition. USING is shorthand for identical column names.",
     difficulty: "Easy",
     categoryId: "joins",
     type: "query",
     answer: "## ON vs USING\n\n```sql\nSELECT * FROM orders o JOIN customers c ON o.customer_id = c.id;\nSELECT * FROM orders JOIN customers USING (customer_id);\n```",
   },
   {
     id: 66,
     title: "How do you find unmatched rows?",
     text: "Use LEFT JOIN with NULL check, NOT EXISTS, or NOT IN.",
     difficulty: "Medium",
     categoryId: "joins",
     type: "query",
     answer: "## Finding Unmatched Rows\n\n```sql\nSELECT c.* FROM customers c\nLEFT JOIN orders o ON c.id = o.customer_id\nWHERE o.id IS NULL;\n\nSELECT * FROM customers c\nWHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id);\n```",
   },
   {
     id: 67,
     title: "What are LATERAL joins?",
     text: "LATERAL allows a subquery in FROM to reference preceding tables.",
     difficulty: "Hard",
     categoryId: "joins",
     type: "query",
     answer: "## LATERAL Joins\n\n```sql\nSELECT c.name, recent.*\nFROM customers c\nCROSS JOIN LATERAL (\n    SELECT * FROM orders WHERE customer_id = c.id ORDER BY date DESC LIMIT 3\n) recent;\n```",
   },
   {
     id: 68,
     title: "How do you optimize JOIN performance?",
     text: "Index join columns, filter early, and use EXPLAIN to analyze plans.",
     difficulty: "Hard",
     categoryId: "joins",
     type: "conceptual",
     answer: "## Optimizing JOINs\n\n```sql\nCREATE INDEX idx_orders_customer ON orders(customer_id);\n\nEXPLAIN ANALYZE SELECT * FROM orders o JOIN customers c ON o.customer_id = c.id;\n```",
   },
   {
     id: 69,
     title: "How do you handle many-to-many relationships?",
     text: "Use a junction table with foreign keys to both tables.",
     difficulty: "Medium",
     categoryId: "joins",
     type: "query",
     answer: "## Many-to-Many\n\n```sql\nCREATE TABLE enrollments (\n    student_id INT REFERENCES students(id),\n    course_id INT REFERENCES courses(id),\n    PRIMARY KEY (student_id, course_id)\n);\n```",
   },
   {
     id: 70,
     title: "What is a FULL OUTER JOIN?",
     text: "Returns all rows from both tables, with NULLs for non-matches.",
     difficulty: "Medium",
     categoryId: "joins",
     type: "query",
     answer: "## FULL OUTER JOIN\n\n```sql\nSELECT * FROM table_a a FULL OUTER JOIN table_b b ON a.id = b.a_id;\n```\n\nUseful for data reconciliation between systems.",
   },
   {
     id: 71,
     title: "What are aggregate functions?",
     text: "Aggregate functions calculate a single result from multiple rows.",
     difficulty: "Easy",
     categoryId: "aggregations",
     type: "conceptual",
     answer: "## Aggregate Functions\n\n```sql\nSELECT COUNT(*), SUM(amount), AVG(amount), MIN(amount), MAX(amount)\nFROM orders;\n```",
   },
   {
     id: 72,
     title: "How does GROUP BY work?",
     text: "GROUP BY divides rows into groups for aggregate calculations.",
     difficulty: "Easy",
     categoryId: "aggregations",
     type: "query",
     answer: "## GROUP BY\n\n```sql\nSELECT category, SUM(amount) FROM products GROUP BY category;\n```\n\n**Rule**: Every non-aggregate column in SELECT must be in GROUP BY.",
   },
   {
     id: 73,
     title: "What is COUNT(*) vs COUNT(column)?",
     text: "COUNT(*) counts all rows. COUNT(column) counts non-NULL values only.",
     difficulty: "Easy",
     categoryId: "aggregations",
     type: "query",
     answer: "## COUNT Variations\n\n```sql\nSELECT COUNT(*) FROM users;           -- All rows\nSELECT COUNT(email) FROM users;       -- Non-NULL only\nSELECT COUNT(DISTINCT country) FROM users;  -- Unique\n```",
   },
   {
     id: 74,
     title: "How do you calculate running totals?",
     text: "Use SUM() with OVER(ORDER BY) window function.",
     difficulty: "Medium",
     categoryId: "aggregations",
     type: "query",
     answer: "## Running Totals\n\n```sql\nSELECT date, amount,\n    SUM(amount) OVER (ORDER BY date) AS running_total\nFROM orders;\n```",
   },
   {
     id: 75,
     title: "What is GROUP BY ROLLUP?",
     text: "ROLLUP generates subtotals and grand totals in a single query.",
     difficulty: "Medium",
     categoryId: "aggregations",
     type: "query",
     answer: "## ROLLUP\n\n```sql\nSELECT region, product, SUM(sales)\nFROM sales GROUP BY ROLLUP(region, product);\n```\n\nReturns: detail rows, region subtotals, and grand total.",
   },
   {
     id: 76,
     title: "What is GROUP BY CUBE?",
     text: "CUBE generates all possible grouping combinations including subtotals.",
     difficulty: "Hard",
     categoryId: "aggregations",
     type: "query",
     answer: "## CUBE\n\n```sql\nSELECT region, category, SUM(sales)\nFROM sales GROUP BY CUBE(region, category);\n```\n\nROLLUP(a,b): (a,b), (a), ()\nCUBE(a,b): (a,b), (a), (b), ()",
   },
   {
     id: 77,
     title: "How do you calculate percentages?",
     text: "Divide value by SUM() OVER() to get percentage of total.",
     difficulty: "Medium",
     categoryId: "aggregations",
     type: "query",
     answer: "## Calculating Percentages\n\n```sql\nSELECT category, sales,\n    ROUND(100.0 * sales / SUM(sales) OVER (), 2) AS pct_of_total\nFROM category_sales;\n```",
   },
   {
     id: 78,
     title: "How do you find top N per group?",
     text: "Use ROW_NUMBER() with PARTITION BY, then filter by rank.",
     difficulty: "Medium",
     categoryId: "aggregations",
     type: "query",
     answer: "## Top N Per Group\n\n```sql\nWITH ranked AS (\n    SELECT *, ROW_NUMBER() OVER (PARTITION BY category ORDER BY sales DESC) AS rank\n    FROM products\n)\nSELECT * FROM ranked WHERE rank <= 3;\n```",
   },
   {
     id: 79,
     title: "What is STRING_AGG?",
     text: "STRING_AGG concatenates values from multiple rows into a single string.",
     difficulty: "Medium",
     categoryId: "aggregations",
     type: "query",
     answer: "## STRING_AGG\n\n```sql\nSELECT department, STRING_AGG(employee_name, ', ') AS employees\nFROM employees GROUP BY department;\n```",
   },
   {
     id: 80,
     title: "How do you handle divide by zero?",
     text: "Use NULLIF to convert zero to NULL, or CASE to check first.",
     difficulty: "Easy",
     categoryId: "aggregations",
     type: "query",
     answer: "## Divide by Zero\n\n```sql\nSELECT revenue / NULLIF(costs, 0) AS efficiency FROM departments;\nSELECT COALESCE(profit / NULLIF(cost, 0), 0) AS margin FROM products;\n```",
   },
   {
     id: 81,
     title: "What is a correlated subquery?",
     text: "A correlated subquery references the outer query and runs for each outer row.",
     difficulty: "Medium",
     categoryId: "subqueries",
     type: "query",
     answer: "## Correlated Subqueries\n\n```sql\nSELECT e.name, e.salary FROM employees e\nWHERE e.salary > (SELECT AVG(salary) FROM employees WHERE department = e.department);\n```",
   },
   {
     id: 82,
     title: "What is a derived table?",
     text: "A derived table is a subquery in FROM that acts as a temporary table.",
     difficulty: "Medium",
     categoryId: "subqueries",
     type: "query",
     answer: "## Derived Tables\n\n```sql\nSELECT * FROM (\n    SELECT category, AVG(price) AS avg_price FROM products GROUP BY category\n) AS category_stats WHERE avg_price > 100;\n```",
   },
   {
     id: 83,
     title: "What are CTEs?",
     text: "Common Table Expressions are named temporary result sets defined with WITH.",
     difficulty: "Medium",
     categoryId: "subqueries",
     type: "query",
     answer: "## CTEs\n\n```sql\nWITH active_customers AS (\n    SELECT id, name FROM customers WHERE status = 'active'\n)\nSELECT * FROM active_customers WHERE country = 'US';\n```",
   },
   {
     id: 84,
     title: "What are recursive CTEs?",
     text: "Recursive CTEs reference themselves to process hierarchical data.",
     difficulty: "Hard",
     categoryId: "subqueries",
     type: "query",
     answer: "## Recursive CTEs\n\n```sql\nWITH RECURSIVE org AS (\n    SELECT id, name, 1 AS level FROM employees WHERE manager_id IS NULL\n    UNION ALL\n    SELECT e.id, e.name, o.level + 1 FROM employees e JOIN org o ON e.manager_id = o.id\n)\nSELECT * FROM org;\n```",
   },
   {
     id: 85,
     title: "When to use subquery vs JOIN?",
     text: "Use JOINs for column access. Use subqueries for EXISTS/IN or aggregates.",
     difficulty: "Medium",
     categoryId: "subqueries",
     type: "conceptual",
     answer: "## Subquery vs JOIN\n\n**Use JOIN**: When you need columns from multiple tables.\n\n**Use Subquery**: For EXISTS/IN checks or aggregate comparisons.",
   },
   {
     id: 86,
     title: "What is a scalar subquery?",
     text: "A scalar subquery returns exactly one value (one row, one column).",
     difficulty: "Easy",
     categoryId: "subqueries",
     type: "query",
     answer: "## Scalar Subqueries\n\n```sql\nSELECT name, salary, (SELECT AVG(salary) FROM employees) AS company_avg\nFROM employees;\n```",
   },
   {
     id: 87,
     title: "How do you use subqueries with INSERT?",
     text: "INSERT ... SELECT copies data from one table to another.",
     difficulty: "Easy",
     categoryId: "subqueries",
     type: "query",
     answer: "## INSERT with Subquery\n\n```sql\nINSERT INTO archived_users (id, name, archived_at)\nSELECT id, name, NOW() FROM users WHERE status = 'inactive';\n```",
   },
   {
     id: 88,
     title: "How do you use subqueries with UPDATE?",
     text: "UPDATE can use subqueries in SET and WHERE clauses.",
     difficulty: "Medium",
     categoryId: "subqueries",
     type: "query",
     answer: "## UPDATE with Subquery\n\n```sql\nUPDATE products SET price = (SELECT AVG(price) FROM products) WHERE price IS NULL;\nUPDATE products SET featured = true WHERE id IN (SELECT product_id FROM bestsellers);\n```",
   },
   {
     id: 89,
     title: "How do you use subqueries with DELETE?",
     text: "DELETE uses subqueries in WHERE to identify rows to delete.",
     difficulty: "Medium",
     categoryId: "subqueries",
     type: "query",
     answer: "## DELETE with Subquery\n\n```sql\nDELETE FROM orders WHERE customer_id IN (SELECT id FROM customers WHERE status = 'deleted');\n```",
   },
   {
     id: 90,
     title: "What are GROUPING SETS?",
     text: "GROUPING SETS let you specify exactly which grouping combinations you want.",
     difficulty: "Hard",
     categoryId: "subqueries",
     type: "query",
     answer: "## GROUPING SETS\n\n```sql\nSELECT region, category, SUM(sales)\nFROM sales GROUP BY GROUPING SETS ((region, category), (region), (category), ());\n```",
   },
   {
     id: 91,
     title: "What are window functions?",
     text: "Window functions calculate across rows without collapsing them.",
     difficulty: "Medium",
     categoryId: "window-functions",
     type: "conceptual",
     answer: "## Window Functions\n\n```sql\nSELECT name, department, salary,\n    AVG(salary) OVER (PARTITION BY department) AS dept_avg,\n    RANK() OVER (PARTITION BY department ORDER BY salary DESC) AS rank\nFROM employees;\n```",
   },
   {
     id: 92,
     title: "What is RANK vs DENSE_RANK vs ROW_NUMBER?",
     text: "ROW_NUMBER is unique. RANK has gaps. DENSE_RANK has no gaps.",
     difficulty: "Medium",
     categoryId: "window-functions",
     type: "query",
     answer: "## Ranking Functions\n\nFor scores 100, 100, 90, 80:\n- ROW_NUMBER: 1, 2, 3, 4\n- RANK: 1, 1, 3, 4\n- DENSE_RANK: 1, 1, 2, 3",
   },
   {
     id: 93,
     title: "How do LAG and LEAD work?",
     text: "LAG accesses previous rows. LEAD accesses following rows.",
     difficulty: "Medium",
     categoryId: "window-functions",
     type: "query",
     answer: "## LAG and LEAD\n\n```sql\nSELECT date, sales,\n    LAG(sales) OVER (ORDER BY date) AS prev_sales,\n    sales - LAG(sales) OVER (ORDER BY date) AS change\nFROM daily_sales;\n```",
   },
   {
     id: 94,
     title: "What are FIRST_VALUE and LAST_VALUE?",
     text: "FIRST_VALUE returns first in window. LAST_VALUE returns last.",
     difficulty: "Medium",
     categoryId: "window-functions",
     type: "query",
     answer: "## FIRST_VALUE / LAST_VALUE\n\n```sql\nSELECT name, salary,\n    FIRST_VALUE(salary) OVER (PARTITION BY dept ORDER BY salary DESC) AS highest\nFROM employees;\n```",
   },
   {
     id: 95,
     title: "What is PARTITION BY?",
     text: "PARTITION BY divides rows into groups for window calculations.",
     difficulty: "Easy",
     categoryId: "window-functions",
     type: "query",
     answer: "## PARTITION BY\n\n```sql\nSELECT name, department, salary,\n    SUM(salary) OVER (PARTITION BY department) AS dept_total\nFROM employees;\n```",
   },
   {
     id: 96,
     title: "What is the window frame clause?",
     text: "Frame clause defines which rows to include: ROWS or RANGE.",
     difficulty: "Hard",
     categoryId: "window-functions",
     type: "query",
     answer: "## Window Frames\n\n```sql\nSUM(x) OVER (ORDER BY date ROWS UNBOUNDED PRECEDING)  -- Running total\nAVG(x) OVER (ORDER BY date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)  -- 7-day avg\n```",
   },
   {
     id: 97,
     title: "What is NTILE?",
     text: "NTILE divides rows into N equal groups and assigns bucket numbers.",
     difficulty: "Medium",
     categoryId: "window-functions",
     type: "query",
     answer: "## NTILE\n\n```sql\nSELECT name, salary, NTILE(4) OVER (ORDER BY salary) AS quartile\nFROM employees;\n```",
   },
   {
     id: 98,
     title: "What are CUME_DIST and PERCENT_RANK?",
     text: "CUME_DIST is cumulative distribution. PERCENT_RANK is relative rank.",
     difficulty: "Hard",
     categoryId: "window-functions",
     type: "query",
     answer: "## CUME_DIST / PERCENT_RANK\n\n```sql\nSELECT name, salary,\n    CUME_DIST() OVER (ORDER BY salary) AS cume_dist,\n    PERCENT_RANK() OVER (ORDER BY salary) AS pct_rank\nFROM employees;\n```",
   },
   {
     id: 99,
     title: "How do you name windows?",
     text: "WINDOW clause defines reusable window definitions.",
     difficulty: "Easy",
     categoryId: "window-functions",
     type: "query",
     answer: "## Named Windows\n\n```sql\nSELECT name, AVG(salary) OVER w, RANK() OVER w\nFROM employees\nWINDOW w AS (PARTITION BY department ORDER BY salary DESC);\n```",
   },
   {
     id: 100,
     title: "How do you calculate year-over-year?",
     text: "Use LAG with 12-month offset or self-joins on date components.",
     difficulty: "Medium",
     categoryId: "window-functions",
     type: "query",
     answer: "## Year-over-Year\n\n```sql\nSELECT year, month, sales,\n    LAG(sales, 12) OVER (ORDER BY year, month) AS last_year\nFROM monthly_sales;\n```",
   },
   {
     id: 101,
     title: "What are SQL constraint types?",
     text: "PRIMARY KEY, FOREIGN KEY, UNIQUE, NOT NULL, CHECK, DEFAULT.",
     difficulty: "Easy",
     categoryId: "constraints",
     type: "conceptual",
     answer: "## SQL Constraints\n\n```sql\nCREATE TABLE employees (\n    id SERIAL PRIMARY KEY,\n    name VARCHAR(100) NOT NULL,\n    email VARCHAR(255) UNIQUE,\n    salary DECIMAL CHECK (salary > 0),\n    status VARCHAR(20) DEFAULT 'active'\n);\n```",
   },
   {
     id: 102,
     title: "What is a UNIQUE constraint?",
     text: "UNIQUE ensures all values in a column are distinct. Allows NULLs.",
     difficulty: "Easy",
     categoryId: "constraints",
     type: "conceptual",
     answer: "## UNIQUE Constraint\n\n```sql\nCREATE TABLE users (email VARCHAR(255) UNIQUE);\nCREATE TABLE enrollments (\n    student_id INT, course_id INT,\n    UNIQUE (student_id, course_id)\n);\n```",
   },
   {
     id: 103,
     title: "What is a CHECK constraint?",
     text: "CHECK enforces a condition that must be true for all rows.",
     difficulty: "Easy",
     categoryId: "constraints",
     type: "query",
     answer: "## CHECK Constraint\n\n```sql\nCREATE TABLE products (\n    price DECIMAL CHECK (price > 0),\n    discount DECIMAL CHECK (discount BETWEEN 0 AND 100)\n);\nCREATE TABLE events (\n    start_date DATE, end_date DATE,\n    CHECK (end_date >= start_date)\n);\n```",
   },
   {
     id: 104,
     title: "What are ON DELETE and ON UPDATE?",
     text: "Referential actions: CASCADE, SET NULL, RESTRICT, NO ACTION.",
     difficulty: "Medium",
     categoryId: "constraints",
     type: "conceptual",
     answer: "## Referential Actions\n\n```sql\nCREATE TABLE orders (\n    user_id INT REFERENCES users(id)\n        ON DELETE CASCADE\n        ON UPDATE CASCADE\n);\n```",
   },
   {
     id: 105,
     title: "What is a composite key?",
     text: "A composite key uses multiple columns to uniquely identify rows.",
     difficulty: "Medium",
     categoryId: "constraints",
     type: "conceptual",
     answer: "## Composite Keys\n\n```sql\nCREATE TABLE order_items (\n    order_id INT, product_id INT, quantity INT,\n    PRIMARY KEY (order_id, product_id)\n);\n```",
   },
   {
     id: 106,
     title: "How do you add and remove constraints?",
     text: "Use ALTER TABLE to add or drop constraints.",
     difficulty: "Medium",
     categoryId: "constraints",
     type: "query",
     answer: "## Managing Constraints\n\n```sql\nALTER TABLE users ADD CONSTRAINT uq_email UNIQUE (email);\nALTER TABLE users DROP CONSTRAINT uq_email;\nALTER TABLE users ALTER COLUMN email SET NOT NULL;\n```",
   },
   {
     id: 107,
     title: "What is NOT NULL?",
     text: "NOT NULL ensures a column must always have a value.",
     difficulty: "Easy",
     categoryId: "constraints",
     type: "conceptual",
     answer: "## NOT NULL\n\n```sql\nCREATE TABLE users (email VARCHAR(255) NOT NULL);\nALTER TABLE users ALTER COLUMN phone SET NOT NULL;\n```",
   },
   {
     id: 108,
     title: "What is a DEFAULT constraint?",
     text: "DEFAULT provides automatic values when not specified during INSERT.",
     difficulty: "Easy",
     categoryId: "constraints",
     type: "conceptual",
     answer: "## DEFAULT\n\n```sql\nCREATE TABLE orders (\n    status VARCHAR(20) DEFAULT 'pending',\n    created_at TIMESTAMP DEFAULT NOW(),\n    uuid UUID DEFAULT gen_random_uuid()\n);\n```",
   },
   {
     id: 109,
     title: "What is a deferrable constraint?",
     text: "Deferrable constraints postpone validation until transaction commit.",
     difficulty: "Hard",
     categoryId: "constraints",
     type: "conceptual",
     answer: "## Deferrable Constraints\n\n```sql\nCREATE TABLE employees (\n    department_id INT REFERENCES departments(id)\n        DEFERRABLE INITIALLY DEFERRED\n);\n```\n\nUseful for circular references.",
   },
   {
     id: 110,
     title: "What is an exclusion constraint?",
     text: "Exclusion constraints prevent overlapping ranges like time periods.",
     difficulty: "Hard",
     categoryId: "constraints",
     type: "query",
     answer: "## Exclusion Constraints\n\n```sql\nCREATE TABLE room_bookings (\n    room_id INT, start_time TIMESTAMP, end_time TIMESTAMP,\n    EXCLUDE USING gist (room_id WITH =, tsrange(start_time, end_time) WITH &&)\n);\n```",
   },
   {
     id: 111,
     title: "What is an ER diagram?",
     text: "ER diagrams visualize entities, attributes, and relationships.",
     difficulty: "Easy",
     categoryId: "database-design",
     type: "conceptual",
     answer: "## ER Diagrams\n\n**Components**: Entities (tables), Attributes (columns), Relationships (FKs)\n\n**Cardinality**: 1:1, 1:N, M:N",
   },
   {
     id: 112,
     title: "What is surrogate vs natural key?",
     text: "Surrogate is system-generated. Natural uses existing data.",
     difficulty: "Medium",
     categoryId: "database-design",
     type: "conceptual",
     answer: "## Surrogate vs Natural Keys\n\n**Surrogate**: id SERIAL PRIMARY KEY\n**Natural**: code CHAR(2) PRIMARY KEY\n\n**Best Practice**: Use surrogate PK + unique constraint on natural key.",
   },
   {
     id: 113,
     title: "When to use UUID vs sequential ID?",
     text: "UUIDs are globally unique and hide counts. Sequential is smaller and faster.",
     difficulty: "Medium",
     categoryId: "database-design",
     type: "conceptual",
     answer: "## UUID vs Sequential\n\n**Sequential**: Smaller, faster indexing, reveals count\n**UUID**: Globally unique, secure, better for distributed systems",
   },
   {
     id: 114,
     title: "What is database partitioning?",
     text: "Partitioning divides large tables into smaller pieces.",
     difficulty: "Hard",
     categoryId: "database-design",
     type: "conceptual",
     answer: "## Partitioning\n\n```sql\nCREATE TABLE orders (id SERIAL, order_date DATE)\nPARTITION BY RANGE (order_date);\n\nCREATE TABLE orders_2024 PARTITION OF orders\n    FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');\n```",
   },
   {
     id: 115,
     title: "How do you implement soft deletes?",
     text: "Add deleted_at column and filter by NULL in queries.",
     difficulty: "Medium",
     categoryId: "database-design",
     type: "query",
     answer: "## Soft Deletes\n\n```sql\nALTER TABLE users ADD COLUMN deleted_at TIMESTAMP NULL;\nUPDATE users SET deleted_at = NOW() WHERE id = 1;\nSELECT * FROM users WHERE deleted_at IS NULL;\n```",
   },
   {
     id: 116,
     title: "How do you handle hierarchical data?",
     text: "Use adjacency list (parent_id), materialized path, or closure table.",
     difficulty: "Hard",
     categoryId: "database-design",
     type: "query",
     answer: "## Hierarchical Data\n\n```sql\nCREATE TABLE categories (id INT, name VARCHAR, parent_id INT REFERENCES categories(id));\n\nWITH RECURSIVE tree AS (...) SELECT * FROM tree;\n```",
   },
   {
     id: 117,
     title: "How do you design audit tables?",
     text: "Track changes with old/new values, operation type, timestamp, and user.",
     difficulty: "Medium",
     categoryId: "database-design",
     type: "query",
     answer: "## Audit Tables\n\n```sql\nCREATE TABLE audit_log (\n    table_name VARCHAR, record_id TEXT, operation VARCHAR,\n    old_data JSONB, new_data JSONB, changed_by UUID, changed_at TIMESTAMP\n);\n```",
   },
   {
     id: 118,
     title: "What is an index?",
     text: "An index speeds up data retrieval by providing quick lookup paths.",
     difficulty: "Easy",
     categoryId: "indexing",
     type: "conceptual",
     answer: "## Indexes\n\n```sql\nCREATE INDEX idx_users_email ON users(email);\nCREATE UNIQUE INDEX idx_users_username ON users(username);\n```\n\n**Index on**: WHERE columns, JOIN columns, ORDER BY columns",
   },
   {
     id: 119,
     title: "What are different index types?",
     text: "B-tree (default), Hash, GiST, GIN (arrays/JSONB), BRIN.",
     difficulty: "Medium",
     categoryId: "indexing",
     type: "conceptual",
     answer: "## Index Types\n\n```sql\nCREATE INDEX idx USING btree(column);  -- Default\nCREATE INDEX idx USING gin(tags);      -- Arrays, JSONB\nCREATE INDEX idx USING brin(date);     -- Time-series\n```",
   },
   {
     id: 120,
     title: "What is a composite index?",
     text: "A composite index covers multiple columns. Order matters.",
     difficulty: "Medium",
     categoryId: "indexing",
     type: "query",
     answer: "## Composite Indexes\n\n```sql\nCREATE INDEX idx ON orders(customer_id, order_date);\n```\n\n**Uses index**: WHERE customer_id = 1\n**No index**: WHERE order_date = '2024-01-01' (missing leftmost)",
   },
   {
     id: 121,
     title: "What is a partial index?",
     text: "A partial index includes only rows matching a condition.",
     difficulty: "Medium",
     categoryId: "indexing",
     type: "query",
     answer: "## Partial Indexes\n\n```sql\nCREATE INDEX idx_active ON users(email) WHERE status = 'active';\nCREATE UNIQUE INDEX uq_email ON users(email) WHERE deleted_at IS NULL;\n```",
   },
   {
     id: 122,
     title: "What is a covering index?",
     text: "A covering index includes all columns needed for index-only scans.",
     difficulty: "Hard",
     categoryId: "indexing",
     type: "query",
     answer: "## Covering Indexes\n\n```sql\nCREATE INDEX idx ON users(email) INCLUDE (name, created_at);\n```\n\nLook for \"Index Only Scan\" in EXPLAIN output.",
   },
   {
     id: 123,
     title: "How do you use EXPLAIN?",
     text: "EXPLAIN shows execution plan. EXPLAIN ANALYZE shows actual timing.",
     difficulty: "Medium",
     categoryId: "indexing",
     type: "query",
     answer: "## EXPLAIN\n\n```sql\nEXPLAIN SELECT * FROM orders WHERE customer_id = 1;\nEXPLAIN ANALYZE SELECT * FROM orders WHERE customer_id = 1;\n```\n\n**Good**: Index Scan | **Bad**: Seq Scan on large table",
   },
   {
     id: 124,
     title: "What is an expression index?",
     text: "An expression index indexes computed values like LOWER(email).",
     difficulty: "Medium",
     categoryId: "indexing",
     type: "query",
     answer: "## Expression Indexes\n\n```sql\nCREATE INDEX idx ON users(LOWER(email));\nSELECT * FROM users WHERE LOWER(email) = 'test@email.com';\n```",
   },
   {
     id: 125,
     title: "How do you index JSONB?",
     text: "Use GIN for flexible queries or expression indexes for specific keys.",
     difficulty: "Medium",
     categoryId: "indexing",
     type: "query",
     answer: "## Indexing JSONB\n\n```sql\nCREATE INDEX idx USING gin(data);  -- Flexible\nCREATE INDEX idx ON items((data->>'status'));  -- Specific key\n```",
   },
   {
     id: 126,
     title: "What are concurrent index operations?",
     text: "CONCURRENTLY builds indexes without locking writes.",
     difficulty: "Medium",
     categoryId: "indexing",
     type: "query",
     answer: "## Concurrent Indexes\n\n```sql\nCREATE INDEX CONCURRENTLY idx ON users(email);\nREINDEX INDEX CONCURRENTLY idx;\n```\n\nEssential for production databases.",
   },
   {
     id: 127,
     title: "What are ACID properties?",
     text: "Atomicity, Consistency, Isolation, Durability.",
     difficulty: "Medium",
     categoryId: "transactions",
     type: "conceptual",
     answer: "## ACID\n\n**Atomicity**: All or nothing\n**Consistency**: Valid states only\n**Isolation**: No interference\n**Durability**: Committed = persisted",
   },
   {
     id: 128,
     title: "What are isolation levels?",
     text: "READ UNCOMMITTED, READ COMMITTED, REPEATABLE READ, SERIALIZABLE.",
     difficulty: "Hard",
     categoryId: "transactions",
     type: "conceptual",
     answer: "## Isolation Levels\n\n```sql\nBEGIN ISOLATION LEVEL SERIALIZABLE;\n```\n\n| Level | Dirty Read | Non-repeatable | Phantom |\n|-------|------------|----------------|---------|\n| READ COMMITTED | ✗ | ✓ | ✓ |\n| SERIALIZABLE | ✗ | ✗ | ✗ |",
   },
   {
     id: 129,
     title: "What is a deadlock?",
     text: "Deadlock occurs when transactions wait for each other. Prevent by consistent lock order.",
     difficulty: "Medium",
     categoryId: "transactions",
     type: "conceptual",
     answer: "## Deadlocks\n\n**Prevention**:\n1. Lock in consistent order\n2. Keep transactions short\n3. Use timeouts",
   },
   {
     id: 130,
     title: "What is a savepoint?",
     text: "A savepoint is a marker you can roll back to within a transaction.",
     difficulty: "Medium",
     categoryId: "transactions",
     type: "query",
     answer: "## Savepoints\n\n```sql\nBEGIN;\nINSERT INTO orders ...;\nSAVEPOINT before_items;\nINSERT INTO items ...;  -- Error!\nROLLBACK TO before_items;\nCOMMIT;\n```",
   },
   {
     id: 131,
     title: "What is optimistic vs pessimistic locking?",
     text: "Pessimistic locks before access. Optimistic checks at commit time.",
     difficulty: "Hard",
     categoryId: "transactions",
     type: "conceptual",
     answer: "## Locking Strategies\n\n**Pessimistic**: SELECT ... FOR UPDATE\n**Optimistic**: UPDATE ... WHERE version = 5",
   },
   {
     id: 132,
     title: "What is SELECT FOR UPDATE?",
     text: "SELECT FOR UPDATE locks rows until transaction ends.",
     difficulty: "Medium",
     categoryId: "transactions",
     type: "query",
     answer: "## SELECT FOR UPDATE\n\n```sql\nBEGIN;\nSELECT * FROM accounts WHERE id = 1 FOR UPDATE;\nUPDATE accounts SET balance = balance - 100 WHERE id = 1;\nCOMMIT;\n```",
   },
   {
     id: 133,
     title: "How do you handle transaction errors?",
     text: "Catch retryable errors and retry with exponential backoff.",
     difficulty: "Medium",
     categoryId: "transactions",
     type: "conceptual",
     answer: "## Error Handling\n\n**Retryable errors**: Deadlock (40P01), Serialization (40001)\n\n**Strategy**: Catch, backoff, retry up to N times.",
   },
   {
     id: 134,
     title: "What is database sharding?",
     text: "Sharding distributes data across multiple servers for horizontal scaling.",
     difficulty: "Hard",
     categoryId: "database-design",
     type: "conceptual",
     answer: "## Sharding\n\n**Strategies**: Range-based, Hash-based, Directory-based\n\n**Challenges**: Cross-shard queries, distributed transactions",
   },
   {
     id: 135,
     title: "What is star vs snowflake schema?",
     text: "Star has direct dimension joins. Snowflake normalizes dimensions.",
     difficulty: "Medium",
     categoryId: "database-design",
     type: "conceptual",
     answer: "## Star vs Snowflake\n\n**Star**: Fewer joins, faster queries, more redundancy\n**Snowflake**: More joins, normalized dimensions, less redundancy",
   },
   {
     id: 136,
     title: "What are normal forms beyond 3NF?",
     text: "BCNF, 4NF, 5NF for progressively stricter normalization.",
     difficulty: "Hard",
     categoryId: "database-design",
     type: "conceptual",
     answer: "## Higher Normal Forms\n\n**BCNF**: Every determinant is a candidate key\n**4NF**: No multi-valued dependencies\n**5NF**: No join dependencies",
   },
   {
     id: 137,
     title: "How do you calculate median?",
     text: "Use PERCENTILE_CONT(0.5) or window functions.",
     difficulty: "Hard",
     categoryId: "aggregations",
     type: "query",
     answer: "## Median\n\n```sql\nSELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY salary) FROM employees;\n```",
   },
   {
     id: 138,
     title: "How do you pivot data?",
     text: "Use CASE expressions with aggregation to transform rows to columns.",
     difficulty: "Hard",
     categoryId: "aggregations",
     type: "query",
     answer: "## Pivoting\n\n```sql\nSELECT product,\n    SUM(CASE WHEN month = 'Jan' THEN sales END) AS jan,\n    SUM(CASE WHEN month = 'Feb' THEN sales END) AS feb\nFROM monthly_sales GROUP BY product;\n```",
   },
   {
     id: 139,
     title: "What is the FILTER clause?",
     text: "FILTER applies a condition to a specific aggregate only.",
     difficulty: "Medium",
     categoryId: "aggregations",
     type: "query",
     answer: "## FILTER Clause\n\n```sql\nSELECT\n    COUNT(*) AS total,\n    COUNT(*) FILTER (WHERE status = 'active') AS active\nFROM users;\n```",
   },
   {
     id: 140,
     title: "How do you find gaps and islands?",
     text: "Use ROW_NUMBER difference technique to identify sequences.",
     difficulty: "Hard",
     categoryId: "window-functions",
     type: "query",
     answer: "## Gaps and Islands\n\n```sql\nWITH grouped AS (\n    SELECT date, date - (ROW_NUMBER() OVER (ORDER BY date)) * INTERVAL '1 day' AS grp\n    FROM attendance\n)\nSELECT MIN(date), MAX(date), COUNT(*) FROM grouped GROUP BY grp;\n```",
   },
   {
     id: 141,
     title: "What is join elimination?",
     text: "Optimizer removes joins when joined table columns aren't needed.",
     difficulty: "Hard",
     categoryId: "joins",
     type: "conceptual",
     answer: "## Join Elimination\n\nIf FK exists and no columns selected from joined table, optimizer may skip it.",
   },
   {
     id: 142,
     title: "What are semi-join and anti-join?",
     text: "Semi-join: EXISTS (match exists). Anti-join: NOT EXISTS.",
     difficulty: "Hard",
     categoryId: "joins",
     type: "conceptual",
     answer: "## Semi/Anti-Join\n\n**Semi**: SELECT * FROM a WHERE EXISTS (SELECT 1 FROM b WHERE ...)\n**Anti**: SELECT * FROM a WHERE NOT EXISTS (...)",
   },
   {
     id: 143,
     title: "What is index bloat?",
     text: "Bloat from updates/deletes leaving dead entries. Fix with REINDEX.",
     difficulty: "Hard",
     categoryId: "indexing",
     type: "conceptual",
     answer: "## Index Bloat\n\n```sql\nREINDEX INDEX CONCURRENTLY idx_users_email;\nVACUUM ANALYZE users;\n```",
   },
   {
     id: 144,
     title: "How do you handle NULLs in window functions?",
     text: "Use IGNORE NULLS or COALESCE to handle NULL values.",
     difficulty: "Medium",
     categoryId: "window-functions",
     type: "query",
     answer: "## NULLs in Windows\n\n```sql\nLAG(price) IGNORE NULLS OVER (ORDER BY date)\nCOALESCE(value, LAG(value) OVER (ORDER BY date), 0)\n```",
   },
   {
     id: 145,
     title: "Window vs aggregate functions?",
     text: "Aggregates collapse rows. Windows preserve all rows.",
     difficulty: "Easy",
     categoryId: "window-functions",
     type: "conceptual",
     answer: "## Window vs Aggregate\n\n**Aggregate**: GROUP BY collapses rows\n**Window**: OVER() preserves all rows while adding computed columns",
   },
   {
     id: 146,
     title: "How do you join without JOIN keyword?",
     text: "Use comma-separated tables with WHERE conditions (implicit join).",
     difficulty: "Easy",
     categoryId: "joins",
     type: "query",
     answer: "## Implicit Join\n\n```sql\nSELECT o.id, c.name FROM orders o, customers c WHERE o.customer_id = c.id;\n```\n\nExplicit JOIN is preferred for clarity.",
   },
   {
     id: 147,
     title: "What is equi-join vs non-equi join?",
     text: "Equi uses equality. Non-equi uses other operators like BETWEEN.",
     difficulty: "Medium",
     categoryId: "joins",
     type: "conceptual",
     answer: "## Equi vs Non-Equi\n\n**Equi**: ON a.id = b.id\n**Non-equi**: ON e.salary BETWEEN s.min AND s.max",
   },
   {
     id: 148,
     title: "How do you join on multiple conditions?",
     text: "Combine conditions with AND in the ON clause.",
     difficulty: "Easy",
     categoryId: "joins",
     type: "query",
     answer: "## Multiple Join Conditions\n\n```sql\nSELECT * FROM items i JOIN inventory inv\n    ON i.product_id = inv.product_id AND i.warehouse_id = inv.warehouse_id;\n```",
   },
   {
     id: 149,
     title: "How do you find the mode?",
     text: "Count occurrences and select the highest count value.",
     difficulty: "Medium",
     categoryId: "aggregations",
     type: "query",
     answer: "## Finding Mode\n\n```sql\nSELECT category FROM products GROUP BY category ORDER BY COUNT(*) DESC LIMIT 1;\n```",
   },
   {
     id: 150,
     title: "What are subquery performance implications?",
     text: "EXISTS and scalar are efficient. Correlated may run per row.",
     difficulty: "Hard",
     categoryId: "subqueries",
     type: "conceptual",
     answer: "## Subquery Performance\n\n**Efficient**: EXISTS, scalar subqueries\n**Potentially slow**: Correlated subqueries (run per row)\n\nUse EXPLAIN to analyze.",
   },
   {
     id: 151,
     title: "How do you optimize window functions?",
     text: "Index ORDER BY columns, filter early, use named windows.",
     difficulty: "Hard",
     categoryId: "window-functions",
     type: "conceptual",
     answer: "## Window Optimization\n\n1. Index ORDER BY columns\n2. Filter before windowing\n3. Reuse window definitions with WINDOW clause",
   },
   {
     id: 152,
     title: "What is ROWS vs RANGE in frames?",
     text: "ROWS counts physical rows. RANGE considers value ranges.",
     difficulty: "Hard",
     categoryId: "window-functions",
     type: "query",
     answer: "## ROWS vs RANGE\n\n**ROWS**: Physical row count\n**RANGE**: Value-based grouping\n\n```sql\nROWS BETWEEN 2 PRECEDING AND CURRENT ROW  -- Exactly 3 rows\nRANGE BETWEEN INTERVAL '7 days' PRECEDING AND CURRENT ROW  -- All within 7 days\n```",
   },
 ];
 
 // Helper functions
 export const getQuestionsByCategory = (categoryId: string | null): SQLQuestion[] => {
   if (!categoryId || categoryId === "all") return sqlQuestions;
   return sqlQuestions.filter((q) => q.categoryId === categoryId);
 };
 
 export const getQuestionsByDifficulty = (
   questions: SQLQuestion[],
   difficulty: string | null
 ): SQLQuestion[] => {
   if (!difficulty || difficulty === "all") return questions;
   return questions.filter((q) => q.difficulty === difficulty);
 };
 
 export const getQuestionsByType = (
   questions: SQLQuestion[],
   type: string | null
 ): SQLQuestion[] => {
   if (!type || type === "all") return questions;
   return questions.filter((q) => q.type === type);
 };
 
 export const searchQuestions = (
   questions: SQLQuestion[],
   query: string
 ): SQLQuestion[] => {
   if (!query.trim()) return questions;
   const lowerQuery = query.toLowerCase();
   return questions.filter(
     (q) =>
       q.title.toLowerCase().includes(lowerQuery) ||
       q.text.toLowerCase().includes(lowerQuery)
   );
 };
 
 export const getCategoryName = (categoryId: string): string => {
   return sqlCategories.find((c) => c.id === categoryId)?.name || categoryId;
 };
 
 export const getDifficultyStats = () => {
   const easy = sqlQuestions.filter((q) => q.difficulty === "Easy").length;
   const medium = sqlQuestions.filter((q) => q.difficulty === "Medium").length;
   const hard = sqlQuestions.filter((q) => q.difficulty === "Hard").length;
   return { easy, medium, hard, total: sqlQuestions.length };
 };