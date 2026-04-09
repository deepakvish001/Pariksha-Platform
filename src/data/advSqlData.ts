import { Section } from "./dsaLevel1Types";

export const advSqlSections: Section[] = [
  {
    id: "advsql-select--filter",
    title: "Select & Filter",
    subSections: [
      {
        id: "advsql-select--filter-problems",
        title: "Select & Filter",
        topics: [
          { id: "advsql-1", title: "Find Customers With Positive Revenue This Year", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=LeetCode+Find+Customers+With+Positive+Revenue+This+Year+SQL+solution", articleUrl: "", practiceUrl: "https://leetcode.com/problems/find-customers-with-positive-revenue-this-year/", note: "WHERE, year filtering [Premium]", isRevision: false, estTime: "15 min" },
          { id: "advsql-2", title: "Customers Who Never Order", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=LeetCode+Customers+Who+Never+Order+SQL+solution", articleUrl: "", practiceUrl: "https://leetcode.com/problems/customers-who-never-order/", note: "LEFT JOIN, IS NULL, NOT IN subquery", isRevision: false, estTime: "15 min" },
          { id: "advsql-3", title: "Calculate Special Bonus", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=LeetCode+Calculate+Special+Bonus+SQL+solution", articleUrl: "", practiceUrl: "https://leetcode.com/problems/calculate-special-bonus/", note: "CASE WHEN, MOD, LIKE, IF", isRevision: false, estTime: "15 min" },
          { id: "advsql-4", title: "Customers Who Bought Products A and B but Not C", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=LeetCode+Customers+Who+Bought+Products+A+and+B+but+Not+C+SQL+solution", articleUrl: "", practiceUrl: "https://leetcode.com/problems/customers-who-bought-products-a-and-b-but-not-c/", note: "GROUP BY, HAVING, conditional aggregation [Premium]", isRevision: false, estTime: "30 min" },
          { id: "advsql-5", title: "Highest Grade For Each Student", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=LeetCode+Highest+Grade+For+Each+Student+SQL+solution", articleUrl: "", practiceUrl: "https://leetcode.com/problems/highest-grade-for-each-student/", note: "Window function, RANK, GROUP BY, MIN [Premium]", isRevision: false, estTime: "30 min" },
        ],
      },
    ],
  },
  {
    id: "advsql-joins",
    title: "Joins",
    subSections: [
      {
        id: "advsql-joins-problems",
        title: "Joins",
        topics: [
          { id: "advsql-6", title: "Combine Two Tables", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=LeetCode+Combine+Two+Tables+SQL+solution", articleUrl: "", practiceUrl: "https://leetcode.com/problems/combine-two-tables/", note: "LEFT JOIN basics", isRevision: false, estTime: "15 min" },
          { id: "advsql-7", title: "Sellers With No Sales", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=LeetCode+Sellers+With+No+Sales+SQL+solution", articleUrl: "", practiceUrl: "https://leetcode.com/problems/sellers-with-no-sales/", note: "LEFT JOIN, IS NULL, date filtering [Premium]", isRevision: false, estTime: "15 min" },
          { id: "advsql-8", title: "Top Travellers", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=LeetCode+Top+Travellers+SQL+solution", articleUrl: "", practiceUrl: "https://leetcode.com/problems/top-travellers/", note: "LEFT JOIN, IFNULL/COALESCE, SUM, GROUP BY, ORDER BY", isRevision: false, estTime: "15 min" },
          { id: "advsql-9", title: "Sales Person", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=LeetCode+Sales+Person+SQL+solution", articleUrl: "", practiceUrl: "https://leetcode.com/problems/sales-person/", note: "NOT IN subquery, multi-table join", isRevision: false, estTime: "15 min" },
          { id: "advsql-10", title: "Evaluate Boolean Expression", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=LeetCode+Evaluate+Boolean+Expression+SQL+solution", articleUrl: "", practiceUrl: "https://leetcode.com/problems/evaluate-boolean-expression/", note: "CASE WHEN, SELF JOIN, dynamic evaluation [Premium]", isRevision: false, estTime: "30 min" },
        ],
      },
    ],
  },
  {
    id: "advsql-aggregation",
    title: "Aggregation",
    subSections: [
      {
        id: "advsql-aggregation-problems",
        title: "Aggregation",
        topics: [
          { id: "advsql-11", title: "Team Scores in Football Tournament", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=LeetCode+Team+Scores+in+Football+Tournament+SQL+solution", articleUrl: "", practiceUrl: "https://leetcode.com/problems/team-scores-in-football-tournament/", note: "CASE WHEN, SUM, GROUP BY, multi-condition aggregation [Premium]", isRevision: false, estTime: "30 min" },
          { id: "advsql-12", title: "The Latest Login in 2020", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=LeetCode+The+Latest+Login+in+2020+SQL+solution", articleUrl: "", practiceUrl: "https://leetcode.com/problems/the-latest-login-in-2020/", note: "MAX, GROUP BY, YEAR filtering [Premium]", isRevision: false, estTime: "15 min" },
          { id: "advsql-13", title: "Game Play Analysis I", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=LeetCode+Game+Play+Analysis+I+SQL+solution", articleUrl: "", practiceUrl: "https://leetcode.com/problems/game-play-analysis-i/", note: "MIN, GROUP BY, first event per user", isRevision: false, estTime: "15 min" },
          { id: "advsql-14", title: "Warehouse Manager", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=LeetCode+Warehouse+Manager+SQL+solution", articleUrl: "", practiceUrl: "https://leetcode.com/problems/warehouse-manager/", note: "JOIN, SUM, product of columns, GROUP BY [Premium]", isRevision: false, estTime: "15 min" },
          { id: "advsql-15", title: "Customer Placing the Largest Number of Orders", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=LeetCode+Customer+Placing+the+Largest+Number+of+Orders+SQL+solution", articleUrl: "", practiceUrl: "https://leetcode.com/problems/customer-placing-the-largest-number-of-orders/", note: "COUNT, GROUP BY, ORDER BY LIMIT", isRevision: false, estTime: "15 min" },
          { id: "advsql-16", title: "Find Total Time Spent by Each Employee", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=LeetCode+Find+Total+Time+Spent+by+Each+Employee+SQL+solution", articleUrl: "", practiceUrl: "https://leetcode.com/problems/find-total-time-spent-by-each-employee/", note: "SUM, GROUP BY multiple columns, date grouping [Premium]", isRevision: false, estTime: "15 min" },
          { id: "advsql-17", title: "Immediate Food Delivery I", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=LeetCode+Immediate+Food+Delivery+I+SQL+solution", articleUrl: "", practiceUrl: "https://leetcode.com/problems/immediate-food-delivery-i/", note: "AVG, CASE WHEN, percentage calculation [Premium]", isRevision: false, estTime: "15 min" },
          { id: "advsql-18", title: "Apples & Oranges", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=LeetCode+Apples+&+Oranges+SQL+solution", articleUrl: "", practiceUrl: "https://leetcode.com/problems/apples-and-oranges/", note: "CASE WHEN, SUM, pivot-style aggregation, GROUP BY [Premium]", isRevision: false, estTime: "30 min" },
          { id: "advsql-19", title: "Number of Calls Between Two Persons", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=LeetCode+Number+of+Calls+Between+Two+Persons+SQL+solution", articleUrl: "", practiceUrl: "https://leetcode.com/problems/number-of-calls-between-two-persons/", note: "LEAST/GREATEST, SUM, COUNT, symmetric pair handling [Premium]", isRevision: false, estTime: "30 min" },
          { id: "advsql-20", title: "Bank Account Summary II", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=LeetCode+Bank+Account+Summary+II+SQL+solution", articleUrl: "", practiceUrl: "https://leetcode.com/problems/bank-account-summary-ii/", note: "JOIN, SUM, GROUP BY, HAVING [Premium]", isRevision: false, estTime: "15 min" },
        ],
      },
    ],
  },
  {
    id: "advsql-sorting--grouping",
    title: "Sorting & Grouping",
    subSections: [
      {
        id: "advsql-sorting--grouping-problems",
        title: "Sorting & Grouping",
        topics: [
          { id: "advsql-21", title: "Duplicate Emails", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=LeetCode+Duplicate+Emails+SQL+solution", articleUrl: "", practiceUrl: "https://leetcode.com/problems/duplicate-emails/", note: "GROUP BY, HAVING COUNT > 1", isRevision: false, estTime: "15 min" },
          { id: "advsql-22", title: "Actors and Directors Who Cooperated At Least Three Times", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=LeetCode+Actors+and+Directors+Who+Cooperated+At+Least+Three+Times+SQL+solution", articleUrl: "", practiceUrl: "https://leetcode.com/problems/actors-and-directors-who-cooperated-at-least-three-times/", note: "GROUP BY, HAVING COUNT >= 3", isRevision: false, estTime: "15 min" },
          { id: "advsql-23", title: "Customer Order Frequency", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=LeetCode+Customer+Order+Frequency+SQL+solution", articleUrl: "", practiceUrl: "https://leetcode.com/problems/customer-order-frequency/", note: "JOIN, SUM, GROUP BY, HAVING, MONTH filtering [Premium]", isRevision: false, estTime: "15 min" },
          { id: "advsql-24", title: "Daily Leads and Partners", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=LeetCode+Daily+Leads+and+Partners+SQL+solution", articleUrl: "", practiceUrl: "https://leetcode.com/problems/daily-leads-and-partners/", note: "COUNT DISTINCT, GROUP BY multiple columns [Premium]", isRevision: false, estTime: "15 min" },
          { id: "advsql-25", title: "Friendly Movies Streamed Last Month", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=LeetCode+Friendly+Movies+Streamed+Last+Month+SQL+solution", articleUrl: "", practiceUrl: "https://leetcode.com/problems/friendly-movies-streamed-last-month/", note: "JOIN, WHERE, DISTINCT, date filtering [Premium]", isRevision: false, estTime: "15 min" },
        ],
      },
    ],
  },
  {
    id: "advsql-advanced-joins",
    title: "Advanced Joins",
    subSections: [
      {
        id: "advsql-advanced-joins-problems",
        title: "Advanced Joins",
        topics: [
          { id: "advsql-26", title: "Countries You Can Safely Invest In", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=LeetCode+Countries+You+Can+Safely+Invest+In+SQL+solution", articleUrl: "", practiceUrl: "https://leetcode.com/problems/countries-you-can-safely-invest-in/", note: "JOIN, AVG, HAVING, subquery comparison [Premium]", isRevision: false, estTime: "30 min" },
          { id: "advsql-27", title: "Consecutive Available Seats", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=LeetCode+Consecutive+Available+Seats+SQL+solution", articleUrl: "", practiceUrl: "https://leetcode.com/problems/consecutive-available-seats/", note: "SELF JOIN, ABS, consecutive detection [Premium]", isRevision: false, estTime: "15 min" },
          { id: "advsql-28", title: "Rearrange Products Table", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=LeetCode+Rearrange+Products+Table+SQL+solution", articleUrl: "", practiceUrl: "https://leetcode.com/problems/rearrange-products-table/", note: "UNION ALL, unpivot transformation [Premium]", isRevision: false, estTime: "15 min" },
          { id: "advsql-29", title: "Shortest Distance in a Line", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=LeetCode+Shortest+Distance+in+a+Line+SQL+solution", articleUrl: "", practiceUrl: "https://leetcode.com/problems/shortest-distance-in-a-line/", note: "SELF JOIN, MIN, ABS difference [Premium]", isRevision: false, estTime: "15 min" },
          { id: "advsql-30", title: "Employees With Missing Information", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=LeetCode+Employees+With+Missing+Information+SQL+solution", articleUrl: "", practiceUrl: "https://leetcode.com/problems/employees-with-missing-information/", note: "FULL OUTER JOIN / UNION, IS NULL", isRevision: false, estTime: "15 min" },
        ],
      },
    ],
  },
  {
    id: "advsql-subqueries",
    title: "Subqueries",
    subSections: [
      {
        id: "advsql-subqueries-problems",
        title: "Subqueries",
        topics: [
          { id: "advsql-31", title: "Page Recommendations", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=LeetCode+Page+Recommendations+SQL+solution", articleUrl: "", practiceUrl: "https://leetcode.com/problems/page-recommendations/", note: "NOT IN, JOIN, friend graph traversal [Premium]", isRevision: false, estTime: "30 min" },
          { id: "advsql-32", title: "Tree Node", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=LeetCode+Tree+Node+SQL+solution", articleUrl: "", practiceUrl: "https://leetcode.com/problems/tree-node/", note: "CASE WHEN, subquery, IN, IS NULL, tree classification", isRevision: false, estTime: "30 min" },
          { id: "advsql-33", title: "Game Play Analysis III", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=LeetCode+Game+Play+Analysis+III+SQL+solution", articleUrl: "", practiceUrl: "https://leetcode.com/problems/game-play-analysis-iii/", note: "Window function, SUM OVER, running total [Premium]", isRevision: false, estTime: "30 min" },
          { id: "advsql-34", title: "Grand Slam Titles", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=LeetCode+Grand+Slam+Titles+SQL+solution", articleUrl: "", practiceUrl: "https://leetcode.com/problems/grand-slam-titles/", note: "UNION ALL, unpivot, COUNT, GROUP BY, JOIN [Premium]", isRevision: false, estTime: "30 min" },
          { id: "advsql-35", title: "Leetflex Banned Accounts", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=LeetCode+Leetflex+Banned+Accounts+SQL+solution", articleUrl: "", practiceUrl: "https://leetcode.com/problems/leetflex-banned-accounts/", note: "SELF JOIN, overlapping intervals, date comparison [Premium]", isRevision: false, estTime: "30 min" },
        ],
      },
    ],
  },
  {
    id: "advsql-advanced-subqueries",
    title: "Advanced Subqueries",
    subSections: [
      {
        id: "advsql-advanced-subqueries-problems",
        title: "Advanced Subqueries",
        topics: [
          { id: "advsql-36", title: "Students With Invalid Departments", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=LeetCode+Students+With+Invalid+Departments+SQL+solution", articleUrl: "", practiceUrl: "https://leetcode.com/problems/students-with-invalid-departments/", note: "LEFT JOIN, IS NULL, referential integrity check [Premium]", isRevision: false, estTime: "15 min" },
          { id: "advsql-37", title: "Find the Team Size", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=LeetCode+Find+the+Team+Size+SQL+solution", articleUrl: "", practiceUrl: "https://leetcode.com/problems/find-the-team-size/", note: "Window function, COUNT OVER, partition [Premium]", isRevision: false, estTime: "15 min" },
          { id: "advsql-38", title: "Game Play Analysis II", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=LeetCode+Game+Play+Analysis+II+SQL+solution", articleUrl: "", practiceUrl: "https://leetcode.com/problems/game-play-analysis-ii/", note: "Window function / subquery, first device per user [Premium]", isRevision: false, estTime: "15 min" },
          { id: "advsql-39", title: "Department Highest Salary", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=LeetCode+Department+Highest+Salary+SQL+solution", articleUrl: "", practiceUrl: "https://leetcode.com/problems/department-highest-salary/", note: "Window function, DENSE_RANK, MAX, partition", isRevision: false, estTime: "30 min" },
          { id: "advsql-40", title: "The Most Recent Orders for Each Product", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=LeetCode+The+Most+Recent+Orders+for+Each+Product+SQL+solution", articleUrl: "", practiceUrl: "https://leetcode.com/problems/the-most-recent-orders-for-each-product/", note: "Window function, RANK, partition by product [Premium]", isRevision: false, estTime: "30 min" },
        ],
      },
    ],
  },
  {
    id: "advsql-window-functions--advanced",
    title: "Window Functions & Advanced",
    subSections: [
      {
        id: "advsql-window-functions--advanced-problems",
        title: "Window Functions & Advanced",
        topics: [
          { id: "advsql-41", title: "The Most Recent Three Orders", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=LeetCode+The+Most+Recent+Three+Orders+SQL+solution", articleUrl: "", practiceUrl: "https://leetcode.com/problems/the-most-recent-three-orders/", note: "ROW_NUMBER, RANK, partition, top-N per group [Premium]", isRevision: false, estTime: "30 min" },
          { id: "advsql-42", title: "Maximum Transaction Each Day", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=LeetCode+Maximum+Transaction+Each+Day+SQL+solution", articleUrl: "", practiceUrl: "https://leetcode.com/problems/maximum-transaction-each-day/", note: "RANK / ROW_NUMBER, partition by date, MAX [Premium]", isRevision: false, estTime: "30 min" },
          { id: "advsql-43", title: "Project Employees III", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=LeetCode+Project+Employees+III+SQL+solution", articleUrl: "", practiceUrl: "https://leetcode.com/problems/project-employees-iii/", note: "DENSE_RANK, window function, partition by project [Premium]", isRevision: false, estTime: "30 min" },
          { id: "advsql-44", title: "Find the Start and End Number of Continuous Ranges", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=LeetCode+Find+the+Start+and+End+Number+of+Continuous+Ranges+SQL+solution", articleUrl: "", practiceUrl: "https://leetcode.com/problems/find-the-start-and-end-number-of-continuous-ranges/", note: "Gap-and-island, ROW_NUMBER difference technique [Premium]", isRevision: false, estTime: "30 min" },
          { id: "advsql-45", title: "The Most Frequently Ordered Products for Each Customer", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=LeetCode+The+Most+Frequently+Ordered+Products+for+Each+Customer+SQL+solution", articleUrl: "", practiceUrl: "https://leetcode.com/problems/the-most-frequently-ordered-products-for-each-customer/", note: "RANK, COUNT, partition by customer, top-1 [Premium]", isRevision: false, estTime: "30 min" },
          { id: "advsql-46", title: "Biggest Window Between Visits", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=LeetCode+Biggest+Window+Between+Visits+SQL+solution", articleUrl: "", practiceUrl: "https://leetcode.com/problems/biggest-window-between-visits/", note: "LEAD window function, DATEDIFF, MAX gap [Premium]", isRevision: false, estTime: "30 min" },
          { id: "advsql-47", title: "All People Report to the Given Manager", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=LeetCode+All+People+Report+to+the+Given+Manager+SQL+solution", articleUrl: "", practiceUrl: "https://leetcode.com/problems/all-people-report-to-the-given-manager/", note: "Recursive CTE / multi-level self join, hierarchy traversal [Premium]", isRevision: false, estTime: "30 min" },
          { id: "advsql-48", title: "Find the Quiet Students in All Exams", completed: false, difficulty: "Hard", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=LeetCode+Find+the+Quiet+Students+in+All+Exams+SQL+solution", articleUrl: "", practiceUrl: "https://leetcode.com/problems/find-the-quiet-students-in-all-exams/", note: "Window function, NOT IN, MAX/MIN per group, set difference [Premium]", isRevision: false, estTime: "45 min" },
          { id: "advsql-49", title: "Find the Subtasks That Did Not Execute", completed: false, difficulty: "Hard", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=LeetCode+Find+the+Subtasks+That+Did+Not+Execute+SQL+solution", articleUrl: "", practiceUrl: "https://leetcode.com/problems/find-the-subtasks-that-did-not-execute/", note: "Recursive CTE, GENERATE_SERIES, LEFT JOIN, gap detection [Premium]", isRevision: false, estTime: "45 min" },
          { id: "advsql-50", title: "Report Contiguous Dates", completed: false, difficulty: "Hard", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=LeetCode+Report+Contiguous+Dates+SQL+solution", articleUrl: "", practiceUrl: "https://leetcode.com/problems/report-contiguous-dates/", note: "Gap-and-island, UNION, ROW_NUMBER difference, date grouping [Premium]", isRevision: false, estTime: "45 min" },
        ],
      },
    ],
  },
];

export const advSqlMeta = {
  id: "adv-sql-practice" as const,
  title: "LeetCode Advanced SQL 50",
  description: "50 advanced SQL problems from LeetCode — Window Functions, Subqueries, CTEs & more",
  lastUpdated: "April 2026",
  totalProblems: 50,
  completed: 0,
  easy: 26,
  medium: 21,
  hard: 3,
};