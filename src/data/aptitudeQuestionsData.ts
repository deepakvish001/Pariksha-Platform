 // Aptitude Questions Data - Comprehensive question bank organized by category
 import type { Difficulty } from "./positionResourcesData";
 
 export interface AptitudeQuestion {
   id: number;
   title: string;
   text: string;
   difficulty: Difficulty;
   categoryId: string;
   type: "conceptual" | "calculation" | "logical";
   answer: string;
   options?: { text: string; isCorrect: boolean }[];
 }
 
 export interface AptitudeCategory {
   id: string;
   name: string;
   icon: string;
   description: string;
 }
 
 // Categories for Aptitude questions
 export const aptitudeCategories: AptitudeCategory[] = [
   { id: "quantitative", name: "Quantitative Aptitude", icon: "Calculator", description: "Number systems, percentages, ratios" },
   { id: "logical", name: "Logical Reasoning", icon: "Brain", description: "Puzzles, patterns, deductions" },
   { id: "verbal", name: "Verbal Ability", icon: "BookOpen", description: "Grammar, vocabulary, comprehension" },
   { id: "data-interpretation", name: "Data Interpretation", icon: "BarChart", description: "Charts, graphs, data analysis" },
   { id: "puzzles", name: "Puzzles", icon: "Puzzle", description: "Brain teasers and logical puzzles" },
   { id: "pattern", name: "Pattern Recognition", icon: "Grid3X3", description: "Series, sequences, patterns" },
 ];
 
 // Aptitude Questions
 export const aptitudeQuestions: AptitudeQuestion[] = [
   // Quantitative Aptitude Questions (1-30)
   {
     id: 1,
     title: "Percentage Increase Calculation",
     text: "If a number is increased by 20% and then decreased by 20%, what is the net percentage change?",
     difficulty: "Easy",
     categoryId: "quantitative",
     type: "calculation",
     answer: `## Percentage Increase then Decrease
 
 ### Solution
 Let the original number be 100.
 
 **Step 1**: Increase by 20%
 - New value = 100 + 20% of 100 = 100 + 20 = 120
 
 **Step 2**: Decrease by 20%
 - Final value = 120 - 20% of 120 = 120 - 24 = 96
 
 **Net Change** = (96 - 100) / 100 × 100 = **-4%**
 
 ### Quick Formula
 For successive percentage changes of a% and b%:
 \`Net % = a + b + (a × b)/100\`
 
 = 20 + (-20) + (20 × -20)/100
 = 0 - 4 = **-4%**
 
 ### Answer: 4% decrease`,
   },
   {
     id: 2,
     title: "Simple Interest vs Compound Interest",
     text: "The difference between compound interest and simple interest on a sum of ₹8000 for 2 years at 10% per annum is?",
     difficulty: "Easy",
     categoryId: "quantitative",
     type: "calculation",
     answer: `## SI vs CI Difference
 
 ### Given
 - Principal (P) = ₹8000
 - Rate (R) = 10%
 - Time (T) = 2 years
 
 ### Simple Interest
 SI = (P × R × T) / 100
 SI = (8000 × 10 × 2) / 100 = ₹1600
 
 ### Compound Interest
 CI = P[(1 + R/100)^T - 1]
 CI = 8000[(1.1)² - 1]
 CI = 8000[1.21 - 1] = 8000 × 0.21 = ₹1680
 
 ### Difference
 CI - SI = 1680 - 1600 = **₹80**
 
 ### Quick Formula for 2 years
 Difference = P × (R/100)² = 8000 × (0.1)² = ₹80`,
   },
   {
     id: 3,
     title: "Ratio and Proportion",
     text: "If A:B = 2:3 and B:C = 4:5, find A:B:C.",
     difficulty: "Easy",
     categoryId: "quantitative",
     type: "calculation",
     answer: `## Finding Combined Ratio
 
 ### Given
 - A:B = 2:3
 - B:C = 4:5
 
 ### Method
 To combine ratios, make the common term (B) equal.
 
 **A:B = 2:3** → Multiply by 4 → A:B = 8:12
 **B:C = 4:5** → Multiply by 3 → B:C = 12:15
 
 Now B is same (12) in both:
 
 **A:B:C = 8:12:15**
 
 ### Verification
 - A:B = 8:12 = 2:3 ✓
 - B:C = 12:15 = 4:5 ✓`,
   },
   {
     id: 4,
     title: "Time and Work Problem",
     text: "A can do a work in 10 days, B can do it in 15 days. In how many days will they finish the work together?",
     difficulty: "Easy",
     categoryId: "quantitative",
     type: "calculation",
     answer: `## Time and Work
 
 ### Given
 - A completes work in 10 days
 - B completes work in 15 days
 
 ### Solution
 **A's 1-day work** = 1/10
 **B's 1-day work** = 1/15
 
 **Combined 1-day work** = 1/10 + 1/15
 = (3 + 2)/30 = 5/30 = 1/6
 
 **Days to complete together** = 6 days
 
 ### Formula
 If A does work in 'a' days and B in 'b' days:
 Together = (a × b)/(a + b) = (10 × 15)/(10 + 15) = 150/25 = **6 days**`,
   },
   {
     id: 5,
     title: "Speed, Time, and Distance",
     text: "A train 200m long crosses a platform of 300m in 25 seconds. What is the speed of the train?",
     difficulty: "Easy",
     categoryId: "quantitative",
     type: "calculation",
     answer: `## Train and Platform Problem
 
 ### Given
 - Train length = 200m
 - Platform length = 300m
 - Time to cross = 25 seconds
 
 ### Solution
 **Total distance covered** = Train length + Platform length
 = 200 + 300 = 500m
 
 **Speed** = Distance / Time
 = 500 / 25 = 20 m/s
 
 ### Converting to km/hr
 Speed in km/hr = 20 × (18/5) = **72 km/hr**
 
 ### Key Formula
 - m/s to km/hr: Multiply by 18/5
 - km/hr to m/s: Multiply by 5/18`,
   },
   {
     id: 6,
     title: "Profit and Loss",
     text: "A shopkeeper marks an article 40% above the cost price and allows a discount of 20%. Find the profit percentage.",
     difficulty: "Medium",
     categoryId: "quantitative",
     type: "calculation",
     answer: `## Markup and Discount
 
 ### Given
 - Markup = 40%
 - Discount = 20%
 
 ### Solution
 Let Cost Price (CP) = ₹100
 
 **Marked Price (MP)** = CP + 40% of CP
 = 100 + 40 = ₹140
 
 **Selling Price (SP)** = MP - 20% of MP
 = 140 - 28 = ₹112
 
 **Profit** = SP - CP = 112 - 100 = ₹12
 
 **Profit %** = (12/100) × 100 = **12%**
 
 ### Quick Formula
 Effective % = m - d - (m × d)/100
 = 40 - 20 - (40 × 20)/100
 = 40 - 20 - 8 = **12%**`,
   },
   {
     id: 7,
     title: "Average Calculation",
     text: "The average of 5 numbers is 20. If one number is excluded, the average becomes 18. Find the excluded number.",
     difficulty: "Easy",
     categoryId: "quantitative",
     type: "calculation",
     answer: `## Average Problem
 
 ### Given
 - Average of 5 numbers = 20
 - Average of remaining 4 numbers = 18
 
 ### Solution
 **Sum of 5 numbers** = 5 × 20 = 100
 
 **Sum of 4 numbers** = 4 × 18 = 72
 
 **Excluded number** = 100 - 72 = **28**
 
 ### Verification
 Sum of 4 remaining = 72
 Add excluded: 72 + 28 = 100
 Average = 100/5 = 20 ✓`,
   },
   {
     id: 8,
     title: "Age Problems",
     text: "The ratio of present ages of A and B is 4:5. After 5 years, the ratio becomes 5:6. Find the present age of A.",
     difficulty: "Medium",
     categoryId: "quantitative",
     type: "calculation",
     answer: `## Age Problem
 
 ### Given
 - Present ratio A:B = 4:5
 - After 5 years ratio = 5:6
 
 ### Solution
 Let present ages be 4x and 5x
 
 After 5 years:
 (4x + 5)/(5x + 5) = 5/6
 
 Cross multiply:
 6(4x + 5) = 5(5x + 5)
 24x + 30 = 25x + 25
 x = 5
 
 **A's present age** = 4x = 4 × 5 = **20 years**
 **B's present age** = 5x = 5 × 5 = 25 years
 
 ### Verification
 After 5 years: A = 25, B = 30
 Ratio = 25:30 = 5:6 ✓`,
   },
   {
     id: 9,
     title: "Mixture and Alligation",
     text: "In what ratio must water be mixed with milk costing ₹12 per litre to get a mixture worth ₹8 per litre?",
     difficulty: "Medium",
     categoryId: "quantitative",
     type: "calculation",
     answer: `## Alligation Method
 
 ### Given
 - Cost of milk = ₹12/litre
 - Cost of water = ₹0/litre
 - Desired mixture cost = ₹8/litre
 
 ### Alligation Rule
 \`\`\`
       Milk (12)     Water (0)
            \\        /
             \\      /
            Mean (8)
             /      \\
            /        \\
        |8-0|      |12-8|
          8           4
 \`\`\`
 
 **Ratio of Milk : Water** = 8 : 4 = **2 : 1**
 
 ### Verification
 2 litres milk + 1 litre water = 3 litres
 Cost = (2 × 12 + 1 × 0) / 3 = 24/3 = ₹8 ✓`,
   },
   {
     id: 10,
     title: "Number System - HCF and LCM",
     text: "The HCF of two numbers is 12 and their LCM is 360. If one number is 36, find the other number.",
     difficulty: "Easy",
     categoryId: "quantitative",
     type: "calculation",
     answer: `## HCF and LCM Relationship
 
 ### Given
 - HCF = 12
 - LCM = 360
 - One number = 36
 
 ### Formula
 **Product of two numbers = HCF × LCM**
 
 ### Solution
 Let the other number be x
 
 36 × x = 12 × 360
 x = (12 × 360) / 36
 x = 4320 / 36
 x = **120**
 
 ### Verification
 - HCF(36, 120) = 12 ✓
 - LCM(36, 120) = 360 ✓`,
   },
   {
     id: 11,
     title: "Boats and Streams",
     text: "A boat travels 24 km downstream in 4 hours and 24 km upstream in 6 hours. Find the speed of the boat in still water and speed of stream.",
     difficulty: "Medium",
     categoryId: "quantitative",
     type: "calculation",
     answer: `## Boats and Streams
 
 ### Given
 - Downstream: 24 km in 4 hours
 - Upstream: 24 km in 6 hours
 
 ### Solution
 **Downstream speed** = 24/4 = 6 km/hr
 **Upstream speed** = 24/6 = 4 km/hr
 
 Let speed of boat = B, speed of stream = S
 
 - Downstream: B + S = 6
 - Upstream: B - S = 4
 
 Adding: 2B = 10 → **B = 5 km/hr**
 Subtracting: 2S = 2 → **S = 1 km/hr**
 
 ### Formula
 - Speed in still water = (Downstream + Upstream) / 2
 - Speed of stream = (Downstream - Upstream) / 2`,
   },
   {
     id: 12,
     title: "Pipes and Cisterns",
     text: "Pipe A can fill a tank in 12 hours, Pipe B in 18 hours, and Pipe C can empty in 9 hours. If all three are opened, how long to fill the tank?",
     difficulty: "Medium",
     categoryId: "quantitative",
     type: "calculation",
     answer: `## Pipes and Cisterns
 
 ### Given
 - Pipe A fills in 12 hours
 - Pipe B fills in 18 hours
 - Pipe C empties in 9 hours
 
 ### Solution
 **A's 1-hour work** = 1/12 (filling)
 **B's 1-hour work** = 1/18 (filling)
 **C's 1-hour work** = -1/9 (emptying)
 
 **Combined 1-hour work** = 1/12 + 1/18 - 1/9
 
 LCM of 12, 18, 9 = 36
 = 3/36 + 2/36 - 4/36
 = 1/36
 
 **Time to fill** = **36 hours**
 
 ### Note
 Since result is positive, tank will eventually fill.`,
   },
   {
     id: 13,
     title: "Permutation and Combination",
     text: "In how many ways can 5 people be seated in a row such that two particular persons are always together?",
     difficulty: "Medium",
     categoryId: "quantitative",
     type: "calculation",
     answer: `## Permutation with Constraints
 
 ### Given
 - 5 people to be seated
 - 2 particular persons must sit together
 
 ### Solution
 **Step 1**: Treat the 2 persons as a single unit
 - Now we have 4 units (3 individuals + 1 pair)
 
 **Step 2**: Arrange 4 units
 - Ways = 4! = 24
 
 **Step 3**: The 2 persons within the pair can swap
 - Internal arrangements = 2! = 2
 
 **Total ways** = 4! × 2! = 24 × 2 = **48 ways**`,
   },
   {
     id: 14,
     title: "Probability",
     text: "Two dice are thrown. What is the probability that the sum is 7?",
     difficulty: "Easy",
     categoryId: "quantitative",
     type: "calculation",
     answer: `## Probability - Dice Problem
 
 ### Total Outcomes
 Each die has 6 faces.
 Total outcomes = 6 × 6 = 36
 
 ### Favorable Outcomes (Sum = 7)
 | Die 1 | Die 2 | Sum |
 |-------|-------|-----|
 | 1     | 6     | 7   |
 | 2     | 5     | 7   |
 | 3     | 4     | 7   |
 | 4     | 3     | 7   |
 | 5     | 2     | 7   |
 | 6     | 1     | 7   |
 
 Favorable outcomes = 6
 
 ### Probability
 P(sum = 7) = 6/36 = **1/6**
 
 ### Note
 Sum of 7 has the highest probability among all sums (2-12).`,
   },
   {
     id: 15,
     title: "Calendar Problems",
     text: "If January 1, 2000 was Saturday, what day was January 1, 2001?",
     difficulty: "Medium",
     categoryId: "quantitative",
     type: "calculation",
     answer: `## Calendar Calculation
 
 ### Given
 - January 1, 2000 = Saturday
 - 2000 is a leap year (366 days)
 
 ### Solution
 **Odd days in 2000** = 366 mod 7 = 2 days
 
 Starting from Saturday, add 2 days:
 Saturday + 2 = **Monday**
 
 ### January 1, 2001 was Monday
 
 ### Quick Reference
 - Normal year = 1 odd day
 - Leap year = 2 odd days
 
 | Odd Days | Day after Sunday |
 |----------|------------------|
 | 0        | Sunday           |
 | 1        | Monday           |
 | 2        | Tuesday          |
 | 3        | Wednesday        |`,
   },
   {
     id: 16,
     title: "Clock Problems",
     text: "At what time between 3 and 4 o'clock will the hands of a clock be together?",
     difficulty: "Medium",
     categoryId: "quantitative",
     type: "calculation",
     answer: `## Clock Hands Together
 
 ### Formula
 The minute hand gains 55 minute spaces over the hour hand in 60 minutes.
 
 Speed of minute hand relative to hour hand = 5.5°/minute
 
 ### Solution
 At 3 o'clock, hands are 15 minute spaces apart.
 (or 90° apart)
 
 Time for minute hand to catch up:
 = 15 × (60/55) minutes
 = 15 × (12/11) minutes
 = 180/11 minutes
 = **16 (4/11) minutes** past 3
 
 ### Answer
 Hands are together at **3:16:21.8** approximately
 (3 hours, 16 and 4/11 minutes)`,
   },
   {
     id: 17,
     title: "Compound Interest - Half Yearly",
     text: "Find the compound interest on ₹10,000 at 10% per annum for 1 year, compounded half-yearly.",
     difficulty: "Medium",
     categoryId: "quantitative",
     type: "calculation",
     answer: `## Compound Interest - Half Yearly
 
 ### Given
 - Principal = ₹10,000
 - Rate = 10% per annum
 - Time = 1 year
 - Compounding = Half-yearly
 
 ### Solution
 For half-yearly compounding:
 - Rate per period = 10/2 = 5%
 - Number of periods = 1 × 2 = 2
 
 **Amount** = P(1 + R/100)^n
 = 10000 × (1.05)²
 = 10000 × 1.1025
 = ₹11,025
 
 **CI** = Amount - Principal
 = 11025 - 10000
 = **₹1,025**
 
 ### Comparison
 Simple Interest = ₹1,000
 CI (annual) = ₹1,000
 CI (half-yearly) = ₹1,025`,
   },
   {
     id: 18,
     title: "Partnership Problems",
     text: "A, B, and C start a business with investments of ₹20,000, ₹30,000, and ₹40,000 respectively. After 4 months, A adds ₹10,000. Find their profit sharing ratio.",
     difficulty: "Hard",
     categoryId: "quantitative",
     type: "calculation",
     answer: `## Partnership with Varying Investment
 
 ### Given (assuming 1 year = 12 months)
 - A: ₹20,000 for 4 months, then ₹30,000 for 8 months
 - B: ₹30,000 for 12 months
 - C: ₹40,000 for 12 months
 
 ### Calculation
 **A's share** = (20000 × 4) + (30000 × 8)
 = 80,000 + 240,000 = 320,000
 
 **B's share** = 30000 × 12 = 360,000
 
 **C's share** = 40000 × 12 = 480,000
 
 ### Ratio
 A : B : C = 320,000 : 360,000 : 480,000
 = 32 : 36 : 48
 = **8 : 9 : 12**`,
   },
   {
     id: 19,
     title: "Area and Perimeter",
     text: "The perimeter of a rectangle is 60 cm and its length is twice the breadth. Find the area.",
     difficulty: "Easy",
     categoryId: "quantitative",
     type: "calculation",
     answer: `## Rectangle - Area from Perimeter
 
 ### Given
 - Perimeter = 60 cm
 - Length = 2 × Breadth
 
 ### Solution
 Let breadth = b, then length = 2b
 
 **Perimeter formula**: 2(l + b) = 60
 2(2b + b) = 60
 2(3b) = 60
 6b = 60
 b = 10 cm
 
 **Length** = 2 × 10 = 20 cm
 
 **Area** = l × b = 20 × 10 = **200 cm²**`,
   },
   {
     id: 20,
     title: "Volume and Surface Area",
     text: "A cube has a surface area of 294 cm². Find its volume.",
     difficulty: "Easy",
     categoryId: "quantitative",
     type: "calculation",
     answer: `## Cube - Volume from Surface Area
 
 ### Given
 Surface Area = 294 cm²
 
 ### Formulas
 - Surface Area of cube = 6a²
 - Volume of cube = a³
 
 ### Solution
 6a² = 294
 a² = 49
 a = 7 cm
 
 **Volume** = a³ = 7³ = **343 cm³**`,
   },
   {
     id: 21,
     title: "Unitary Method",
     text: "If 8 workers can build a wall in 10 days, how many workers are needed to build it in 4 days?",
     difficulty: "Easy",
     categoryId: "quantitative",
     type: "calculation",
     answer: `## Unitary Method - Inverse Proportion
 
 ### Given
 - 8 workers → 10 days
 - ? workers → 4 days
 
 ### Analysis
 This is inverse proportion: More workers = Less time
 
 ### Solution
 Workers × Days = Constant (Total work)
 8 × 10 = x × 4
 80 = 4x
 x = **20 workers**
 
 ### Verification
 8 workers × 10 days = 80 worker-days
 20 workers × 4 days = 80 worker-days ✓`,
   },
   {
     id: 22,
     title: "Square Root Simplification",
     text: "Simplify: √50 + √18 - √8",
     difficulty: "Easy",
     categoryId: "quantitative",
     type: "calculation",
     answer: `## Simplifying Square Roots
 
 ### Solution
 **√50** = √(25 × 2) = 5√2
 
 **√18** = √(9 × 2) = 3√2
 
 **√8** = √(4 × 2) = 2√2
 
 ### Calculation
 √50 + √18 - √8
 = 5√2 + 3√2 - 2√2
 = (5 + 3 - 2)√2
 = **6√2**
 
 ### Approximate Value
 6√2 ≈ 6 × 1.414 ≈ 8.485`,
   },
   {
     id: 23,
     title: "Indices and Powers",
     text: "Find the value of: (27)^(2/3) × (16)^(1/4)",
     difficulty: "Medium",
     categoryId: "quantitative",
     type: "calculation",
     answer: `## Indices Calculation
 
 ### Solution
 **(27)^(2/3)**
 = (3³)^(2/3)
 = 3^(3 × 2/3)
 = 3² = 9
 
 **(16)^(1/4)**
 = (2⁴)^(1/4)
 = 2^(4 × 1/4)
 = 2¹ = 2
 
 ### Final Answer
 9 × 2 = **18**
 
 ### Rule Used
 (a^m)^n = a^(m×n)`,
   },
   {
     id: 24,
     title: "Discount Series",
     text: "A shopkeeper gives two successive discounts of 20% and 10% on an article. What is the equivalent single discount?",
     difficulty: "Easy",
     categoryId: "quantitative",
     type: "calculation",
     answer: `## Successive Discounts
 
 ### Method 1: Direct Calculation
 Let MRP = ₹100
 
 After 20% discount: 100 - 20 = ₹80
 After 10% discount: 80 - 8 = ₹72
 
 Total discount = 100 - 72 = **28%**
 
 ### Method 2: Formula
 For successive discounts of a% and b%:
 
 Single equivalent = a + b - (a × b)/100
 = 20 + 10 - (20 × 10)/100
 = 30 - 2
 = **28%**`,
   },
   {
     id: 25,
     title: "Work and Wages",
     text: "A can do a piece of work in 10 days and B in 15 days. If the total wage is ₹5000, what is A's share?",
     difficulty: "Medium",
     categoryId: "quantitative",
     type: "calculation",
     answer: `## Work and Wages
 
 ### Given
 - A completes in 10 days
 - B completes in 15 days
 - Total wage = ₹5000
 
 ### Solution
 **Efficiency Ratio**:
 A : B = 1/10 : 1/15
 = 15 : 10 = 3 : 2
 
 **Wages are distributed in ratio of efficiency**
 
 A's share = 5000 × (3/5) = **₹3000**
 B's share = 5000 × (2/5) = ₹2000
 
 ### Key Insight
 More efficient worker gets higher wage proportionally.`,
   },
   {
     id: 26,
     title: "Divisibility Rules",
     text: "Which of the following is divisible by 11: 1234321, 5765475, 7438293?",
     difficulty: "Medium",
     categoryId: "quantitative",
     type: "calculation",
     answer: `## Divisibility by 11
 
 ### Rule
 A number is divisible by 11 if the difference between:
 (Sum of digits at odd positions) and (Sum of digits at even positions)
 is 0 or divisible by 11.
 
 ### Checking 1234321
 Odd positions (from right): 1+3+3+1 = 8
 Even positions: 2+4+2 = 8
 Difference = 8 - 8 = 0 ✓
 
 ### Checking 5765475
 Odd: 5+4+6+5 = 20
 Even: 7+5+7 = 19
 Difference = 1 ✗
 
 ### Checking 7438293
 Odd: 3+2+3+7 = 15
 Even: 9+8+4 = 21
 Difference = 6 ✗
 
 ### Answer: **1234321**`,
   },
   {
     id: 27,
     title: "Surds and Rationalization",
     text: "Rationalize the denominator: 1/(√5 + √3)",
     difficulty: "Medium",
     categoryId: "quantitative",
     type: "calculation",
     answer: `## Rationalization
 
 ### Given
 1/(√5 + √3)
 
 ### Solution
 Multiply by conjugate (√5 - √3)/(√5 - √3)
 
 = (√5 - √3) / [(√5 + √3)(√5 - √3)]
 
 = (√5 - √3) / [(√5)² - (√3)²]
 
 = (√5 - √3) / (5 - 3)
 
 = **(√5 - √3) / 2**
 
 ### Approximate Value
 = (2.236 - 1.732) / 2
 ≈ 0.504 / 2
 ≈ 0.252`,
   },
   {
     id: 28,
     title: "Logarithms",
     text: "Find the value of: log₂8 + log₃27 - log₅25",
     difficulty: "Medium",
     categoryId: "quantitative",
     type: "calculation",
     answer: `## Logarithm Calculation
 
 ### Solution
 **log₂8** = log₂(2³) = 3 × log₂2 = 3 × 1 = 3
 
 **log₃27** = log₃(3³) = 3 × log₃3 = 3 × 1 = 3
 
 **log₅25** = log₅(5²) = 2 × log₅5 = 2 × 1 = 2
 
 ### Final Answer
 3 + 3 - 2 = **4**
 
 ### Rule Used
 logₐ(aⁿ) = n`,
   },
   {
     id: 29,
     title: "Quadratic Equations",
     text: "Find the roots of: x² - 5x + 6 = 0",
     difficulty: "Easy",
     categoryId: "quantitative",
     type: "calculation",
     answer: `## Quadratic Equation
 
 ### Given
 x² - 5x + 6 = 0
 
 ### Method 1: Factorization
 Find two numbers that:
 - Multiply to give 6
 - Add to give -5
 
 Numbers: -2 and -3
 
 x² - 2x - 3x + 6 = 0
 x(x - 2) - 3(x - 2) = 0
 (x - 2)(x - 3) = 0
 
 **Roots: x = 2 or x = 3**
 
 ### Method 2: Quadratic Formula
 x = (-b ± √(b² - 4ac)) / 2a
 x = (5 ± √(25 - 24)) / 2
 x = (5 ± 1) / 2
 x = 3 or x = 2`,
   },
   {
     id: 30,
     title: "Arithmetic Progression",
     text: "Find the 15th term of AP: 3, 8, 13, 18, ...",
     difficulty: "Easy",
     categoryId: "quantitative",
     type: "calculation",
     answer: `## Arithmetic Progression
 
 ### Given AP: 3, 8, 13, 18, ...
 - First term (a) = 3
 - Common difference (d) = 8 - 3 = 5
 
 ### Formula for nth term
 aₙ = a + (n - 1)d
 
 ### 15th Term
 a₁₅ = 3 + (15 - 1) × 5
 = 3 + 14 × 5
 = 3 + 70
 = **73**
 
 ### Sum of first 15 terms
 S = n/2 × (first + last)
 = 15/2 × (3 + 73)
 = 15/2 × 76
 = **570**`,
   },
 
   // Logical Reasoning Questions (31-60)
   {
     id: 31,
     title: "Blood Relations",
     text: "Pointing to a woman, a man said, 'Her mother is the only daughter of my mother.' How is the man related to the woman?",
     difficulty: "Easy",
     categoryId: "logical",
     type: "logical",
     answer: `## Blood Relation Puzzle
 
 ### Analysis
 - "Only daughter of my mother" = Man's sister or Man himself (if only child)
 - But it says "daughter", so it must be the man's **sister**
 - The woman's mother = Man's sister
 
 ### Relationship Chain
 Man → Sister → Woman
 
 If man's sister is the woman's mother, then:
 Man is the woman's **maternal uncle**
 
 ### Answer: **Uncle** (Mother's Brother)`,
   },
   {
     id: 32,
     title: "Coding-Decoding",
     text: "If COMPUTER is coded as RFUVQNPC, how is PRINTER coded?",
     difficulty: "Medium",
     categoryId: "logical",
     type: "logical",
     answer: `## Coding Pattern Analysis
 
 ### Given: COMPUTER → RFUVQNPC
 
 ### Pattern Discovery
 | Original | Coded | Analysis |
 |----------|-------|----------|
 | C(3)     | R(18) | +15      |
 | O(15)    | F(6)  | -9       |
 | M(13)    | U(21) | +8       |
 | P(16)    | V(22) | +6       |
 | U(21)    | Q(17) | -4       |
 | T(20)    | N(14) | -6       |
 | E(5)     | P(16) | +11      |
 | R(18)    | C(3)  | -15      |
 
 **Pattern**: Reverse + Complement pattern
 The word is reversed and each letter mapped to its complement.
 
 ### For PRINTER:
 Reverse: RETNIRP
 Apply similar logic...
 
 **Answer: SUJOQSG** (following the established pattern)`,
   },
   {
     id: 33,
     title: "Direction Sense",
     text: "A man walks 5 km North, then turns right and walks 3 km, then turns right and walks 5 km. In which direction is he from the starting point?",
     difficulty: "Easy",
     categoryId: "logical",
     type: "logical",
     answer: `## Direction Sense
 
 ### Tracing the Path
 \`\`\`
         N
         ↑
     W ← → E
         ↓
         S
 \`\`\`
 
 1. Walk 5 km North ↑
 2. Turn right (face East), walk 3 km →
 3. Turn right (face South), walk 5 km ↓
 
 ### Final Position
 - North-South: 5 km N - 5 km S = 0 (same level)
 - East-West: 3 km East
 
 ### Answer: **East**
 
 He is 3 km East of the starting point.`,
   },
   {
     id: 34,
     title: "Ranking and Arrangement",
     text: "In a row of 40 students, Raj is 7th from the left and Mohan is 11th from the right. How many students are between them?",
     difficulty: "Easy",
     categoryId: "logical",
     type: "logical",
     answer: `## Ranking Problem
 
 ### Given
 - Total students = 40
 - Raj is 7th from left
 - Mohan is 11th from right
 
 ### Mohan's position from left
 = 40 - 11 + 1 = 30th from left
 
 ### Students between them
 = (30 - 7) - 1
 = 23 - 1
 = **22 students**
 
 ### Visual
 \`\`\`
 [1][2][3][4][5][6][Raj][8]...[30-Mohan]...[40]
                 ↑              ↑
               7th            30th
 \`\`\`
 
 Positions 8 to 29 = 22 students between them`,
   },
   {
     id: 35,
     title: "Syllogism",
     text: "Statements: All cats are dogs. All dogs are animals. Conclusions: I. All cats are animals. II. All animals are cats. Which conclusions follow?",
     difficulty: "Easy",
     categoryId: "logical",
     type: "logical",
     answer: `## Syllogism
 
 ### Statements
 1. All cats are dogs
 2. All dogs are animals
 
 ### Venn Diagram
 \`\`\`
 ┌─────────────────────┐
 │     Animals         │
 │  ┌──────────────┐   │
 │  │    Dogs      │   │
 │  │  ┌────────┐  │   │
 │  │  │  Cats  │  │   │
 │  │  └────────┘  │   │
 │  └──────────────┘   │
 └─────────────────────┘
 \`\`\`
 
 ### Analysis
 **Conclusion I**: All cats are animals
 - Cats ⊂ Dogs ⊂ Animals
 - ✓ **FOLLOWS**
 
 **Conclusion II**: All animals are cats
 - Animals is the largest set
 - Cats is the smallest set
 - ✗ **DOES NOT FOLLOW**
 
 ### Answer: Only Conclusion I follows`,
   },
   {
     id: 36,
     title: "Statement and Assumptions",
     text: "Statement: 'Enroll now for guaranteed job placement!' - An advertisement. Assumptions: I. People want jobs. II. The institute can guarantee jobs.",
     difficulty: "Medium",
     categoryId: "logical",
     type: "logical",
     answer: `## Statement and Assumptions
 
 ### Statement
 "Enroll now for guaranteed job placement!"
 
 ### Analysis
 
 **Assumption I**: People want jobs
 - For the ad to be effective, people must want jobs
 - This is a basic assumption for the ad to work
 - ✓ **IMPLICIT** (Valid assumption)
 
 **Assumption II**: The institute can guarantee jobs
 - The ad explicitly claims this
 - It's a stated claim, not a hidden assumption
 - However, for the ad to be meaningful, institute believes it can deliver
 - ✓ **IMPLICIT** (The institute assumes it can)
 
 ### Answer: Both assumptions are implicit
 
 ### Note on Assumption Testing
 An assumption is implicit if:
 1. It's not explicitly stated
 2. The statement would be meaningless without it`,
   },
   {
     id: 37,
     title: "Cause and Effect",
     text: "Statement I: Vegetable prices have increased sharply. Statement II: Rainfall has been below normal this year. Which is cause and which is effect?",
     difficulty: "Easy",
     categoryId: "logical",
     type: "logical",
     answer: `## Cause and Effect Analysis
 
 ### Statements
 I. Vegetable prices have increased sharply
 II. Rainfall has been below normal this year
 
 ### Logical Chain
 \`\`\`
 Low Rainfall → Poor Crop → Low Supply → Higher Prices
 \`\`\`
 
 ### Analysis
 - Low rainfall leads to poor agricultural output
 - Less vegetables in market
 - High demand + Low supply = Higher prices
 
 ### Answer
 - **Cause**: Statement II (Low rainfall)
 - **Effect**: Statement I (Higher vegetable prices)
 
 Statement II is the cause of Statement I`,
   },
   {
     id: 38,
     title: "Seating Arrangement",
     text: "Six persons A, B, C, D, E, F sit in a row facing north. B sits between A and E. D is not at any end. C is to the immediate right of E. Who sits at the ends?",
     difficulty: "Medium",
     categoryId: "logical",
     type: "logical",
     answer: `## Seating Arrangement
 
 ### Given Conditions
 1. B sits between A and E
 2. D is not at any end
 3. C is to the immediate right of E
 
 ### Step-by-Step Solution
 
 From conditions 1 & 3:
 - Either A-B-E-C or E-B-A with C after E
 - Combined: A-B-E-C is one possible sequence
 
 From condition 2:
 - D is not at ends, so D is in middle
 - Remaining: F
 
 ### Possible Arrangement
 \`\`\`
 F - A - B - E - C - D (D at end - invalid)
 F - D - A - B - E - C (valid)
 A - B - E - C - D - F (D not at end - valid if D is 5th)
 \`\`\`
 
 Most likely: **F** and **C** sit at the ends
 
 (Or A and F depending on exact arrangement)`,
   },
   {
     id: 39,
     title: "Circular Arrangement",
     text: "Eight people sit around a circular table. A sits opposite to B. C sits to the left of A. Who sits opposite to C?",
     difficulty: "Medium",
     categoryId: "logical",
     type: "logical",
     answer: `## Circular Arrangement
 
 ### Given
 - 8 people in a circle
 - A is opposite to B
 - C is to the left of A
 
 ### Diagram
 \`\`\`
         ?
      ?     ?
    ?    ○    B
      C     ?
         A
 \`\`\`
 
 In a circle of 8, opposite means 4 positions apart.
 
 ### Solution
 - A's position: let's say 1
 - B is opposite A: position 5
 - C is left of A: position 8
 - Opposite of C (position 8): position 4
 
 ### Answer
 The person at position 4 sits opposite to C.
 
 (Without more information, we can say it's the person **3 positions to the right of A**)`,
   },
   {
     id: 40,
     title: "Number Series",
     text: "Find the next number: 2, 6, 12, 20, 30, ?",
     difficulty: "Easy",
     categoryId: "logical",
     type: "logical",
     answer: `## Number Series
 
 ### Given: 2, 6, 12, 20, 30, ?
 
 ### Finding the Pattern
 | Term | Value | Difference |
 |------|-------|------------|
 | 1st  | 2     | -          |
 | 2nd  | 6     | +4         |
 | 3rd  | 12    | +6         |
 | 4th  | 20    | +8         |
 | 5th  | 30    | +10        |
 | 6th  | ?     | +12        |
 
 **Pattern**: Differences are increasing by 2 each time
 
 ### Alternative Pattern
 n(n+1): 1×2=2, 2×3=6, 3×4=12, 4×5=20, 5×6=30, 6×7=**42**
 
 ### Answer: **42**`,
   },
   {
     id: 41,
     title: "Letter Series",
     text: "Find the next letters: AZ, CX, EV, GT, ?",
     difficulty: "Easy",
     categoryId: "logical",
     type: "logical",
     answer: `## Letter Series
 
 ### Given: AZ, CX, EV, GT, ?
 
 ### Pattern Analysis
 **First Letter**: A → C → E → G → ?
 - Pattern: +2 each time (odd letters)
 - Next: G + 2 = **I**
 
 **Second Letter**: Z → X → V → T → ?
 - Pattern: -2 each time (even from end)
 - Next: T - 2 = **R**
 
 ### Answer: **IR**
 
 ### Sequence
 A(1), Z(26)
 C(3), X(24)
 E(5), V(22)
 G(7), T(20)
 I(9), R(18)`,
   },
   {
     id: 42,
     title: "Odd One Out",
     text: "Find the odd one: 27, 64, 125, 144, 216",
     difficulty: "Easy",
     categoryId: "logical",
     type: "logical",
     answer: `## Odd One Out
 
 ### Given: 27, 64, 125, 144, 216
 
 ### Analysis
 - 27 = 3³ (cube)
 - 64 = 4³ (cube) [also 8² but primarily cube]
 - 125 = 5³ (cube)
 - 144 = 12² (**square, NOT cube**)
 - 216 = 6³ (cube)
 
 ### Answer: **144**
 
 144 is a perfect square, while all others are perfect cubes.`,
   },
   {
     id: 43,
     title: "Analogy",
     text: "BOOK : READ :: FOOD : ?",
     difficulty: "Easy",
     categoryId: "logical",
     type: "logical",
     answer: `## Analogy
 
 ### Given: BOOK : READ :: FOOD : ?
 
 ### Relationship
 BOOK is something you READ (verb/action done with it)
 FOOD is something you **EAT** (verb/action done with it)
 
 ### Answer: **EAT**
 
 ### Pattern
 Object : Action performed with/on it`,
   },
   {
     id: 44,
     title: "Missing Number in Matrix",
     text: "Find the missing number:\n| 3 | 5 | 8 |\n| 4 | 6 | 10 |\n| 5 | 7 | ? |",
     difficulty: "Medium",
     categoryId: "logical",
     type: "logical",
     answer: `## Matrix Pattern
 
 ### Given Matrix
 | 3 | 5 | 8 |
 | 4 | 6 | 10 |
 | 5 | 7 | ? |
 
 ### Pattern Analysis
 Looking at each row:
 - Row 1: 3 + 5 = 8 ✓
 - Row 2: 4 + 6 = 10 ✓
 - Row 3: 5 + 7 = **12**
 
 ### Answer: **12**
 
 Pattern: Third column = First column + Second column`,
   },
   {
     id: 45,
     title: "Cube and Dice",
     text: "A cube has different colors on all six faces. Red is opposite to Blue. Green is adjacent to Red. Yellow is adjacent to Green. Which color is opposite to Green?",
     difficulty: "Hard",
     categoryId: "logical",
     type: "logical",
     answer: `## Cube Analysis
 
 ### Given
 - Red opposite to Blue
 - Green adjacent to Red
 - Yellow adjacent to Green
 
 ### Analysis
 In a cube:
 - Each face has 4 adjacent faces and 1 opposite face
 - Red is opposite Blue, so both are NOT adjacent to each other
 - Green is adjacent to Red → Green is also adjacent to Blue
 - The 6 faces are: Red, Blue, Green, Yellow, and 2 others (let's say White, Orange)
 
 ### Deduction
 If Green is adjacent to Red (and thus Blue):
 - Green's opposite must be one of the remaining: Yellow, White, or Orange
 - Yellow is adjacent to Green → Yellow is NOT opposite to Green
 - So opposite of Green is either White or Orange
 
 ### Answer: **Yellow is NOT opposite to Green**
 
 Without complete info, opposite of Green is likely **White or Orange** (one of the unnamed colors)`,
   },
   {
     id: 46,
     title: "Input-Output",
     text: "Input: 15 32 48 29 64. Step 1: 64 15 32 48 29. Step 2: 64 48 15 32 29. What is Step 3?",
     difficulty: "Medium",
     categoryId: "logical",
     type: "logical",
     answer: `## Input-Output Machine
 
 ### Given
 Input: 15 32 48 29 64
 Step 1: 64 15 32 48 29
 Step 2: 64 48 15 32 29
 
 ### Pattern Analysis
 **Step 1**: Largest number (64) moves to the left
 **Step 2**: Second largest (48) moves to second position
 
 ### Step 3 Prediction
 Third largest (32) should move to third position
 
 **Step 3**: 64 48 32 15 29
 
 ### Final Answer: **64 48 32 15 29**
 
 Pattern: Arranging numbers in descending order from left, one at a time.`,
   },
   {
     id: 47,
     title: "Venn Diagram Logic",
     text: "Which region represents males who are doctors but not singers, if we have three circles for Males, Doctors, and Singers?",
     difficulty: "Medium",
     categoryId: "logical",
     type: "logical",
     answer: `## Venn Diagram Analysis
 
 ### Three Circles
 - Circle A: Males
 - Circle B: Doctors
 - Circle C: Singers
 
 ### Region Needed
 Males who are Doctors but NOT Singers
 = A ∩ B ∩ C'
 
 ### Visual
 \`\`\`
     A(Males)    B(Doctors)
        \\        /
         \\______/
          |XXXX| ← This region
          |____|
             |
        C(Singers)
 \`\`\`
 
 ### Answer
 The region where circles A (Males) and B (Doctors) overlap, but EXCLUDING any overlap with circle C (Singers).
 
 This is the **crescent-shaped region** of A∩B that doesn't touch C.`,
   },
   {
     id: 48,
     title: "Logical Deduction",
     text: "If all Blips are Claps, and some Claps are Daps, can we conclude that some Blips are Daps?",
     difficulty: "Medium",
     categoryId: "logical",
     type: "logical",
     answer: `## Logical Deduction
 
 ### Statements
 1. All Blips are Claps
 2. Some Claps are Daps
 
 ### Venn Diagram
 \`\`\`
 ┌──────────────────┐
 │      Claps       │
 │  ┌────────┐      │
 │  │ Blips  │   ┌──┴──┐
 │  │        │   │Daps │
 │  └────────┘   └──┬──┘
 └──────────────────┘
 \`\`\`
 
 ### Analysis
 - Blips are entirely within Claps
 - Daps overlap with Claps
 - BUT Daps might overlap with the part of Claps that doesn't include Blips
 
 ### Conclusion
 **NO, we cannot conclude that some Blips are Daps**
 
 The Daps-Claps overlap might be entirely outside the Blips circle.`,
   },
   {
     id: 49,
     title: "Order and Ranking",
     text: "Among A, B, C, D, E: A is taller than B. C is shorter than D. B is taller than C. E is taller than A. Who is in the middle?",
     difficulty: "Medium",
     categoryId: "logical",
     type: "logical",
     answer: `## Ranking Problem
 
 ### Given
 - A > B (A taller than B)
 - D > C (C shorter than D)
 - B > C (B taller than C)
 - E > A (E taller than A)
 
 ### Building the Order
 From E > A > B > C and D > C:
 
 E > A > B > C
         D > C
 
 We need to place D. We know D > C, but how does D compare to others?
 
 ### Possible Orders
 If D is between B and C: E > A > B > D > C
 If D equals B level: E > A > B = D > C
 
 ### Most Likely Order
 **E > A > B > D > C** (or D might be elsewhere)
 
 ### Middle (3rd of 5)
 **B** is in the middle
 
 ### Answer: **B**`,
   },
   {
     id: 50,
     title: "Critical Reasoning",
     text: "Argument: 'Since the crime rate has dropped since we hired more police, the increase in police is the cause.' What is the flaw?",
     difficulty: "Hard",
     categoryId: "logical",
     type: "logical",
     answer: `## Critical Reasoning - Identifying Flaws
 
 ### Argument Structure
 - Premise: Crime rate dropped after hiring more police
 - Conclusion: More police caused the drop
 
 ### Logical Flaw
 **Post Hoc Ergo Propter Hoc** (After this, therefore because of this)
 
 This is a correlation vs causation error.
 
 ### Other Possible Causes
 1. Economic improvements
 2. Seasonal variations
 3. Demographic changes
 4. Other policies (education, rehabilitation)
 5. Changes in crime reporting
 
 ### Answer
 The flaw is **assuming causation from correlation**. Just because B followed A doesn't mean A caused B.
 
 Other factors could have caused the crime reduction, independent of police hiring.`,
   },
   {
     id: 51,
     title: "Data Sufficiency",
     text: "Is x > 0? Statement 1: x² = 16. Statement 2: x³ = 64. Are the statements sufficient?",
     difficulty: "Medium",
     categoryId: "logical",
     type: "logical",
     answer: `## Data Sufficiency
 
 ### Question: Is x > 0?
 
 ### Statement 1: x² = 16
 - x = +4 or x = -4
 - Cannot determine if x > 0
 - **INSUFFICIENT alone**
 
 ### Statement 2: x³ = 64
 - x = 4 (only one real solution for odd power)
 - x = 4 > 0 ✓
 - **SUFFICIENT alone**
 
 ### Combined Analysis
 Using both:
 - x² = 16 → x = ±4
 - x³ = 64 → x = 4
 - Combined: x = 4
 - **SUFFICIENT**
 
 ### Answer
 Statement 2 alone is sufficient.
 Statement 1 alone is not sufficient.
 
 **Answer: Statement 2 ALONE is sufficient**`,
   },
   {
     id: 52,
     title: "Inequality Deduction",
     text: "If A > B, B ≥ C, C = D, D > E, then what is the relationship between A and E?",
     difficulty: "Easy",
     categoryId: "logical",
     type: "logical",
     answer: `## Inequality Chain
 
 ### Given
 - A > B
 - B ≥ C
 - C = D
 - D > E
 
 ### Chain
 A > B ≥ C = D > E
 
 ### Conclusion
 Following the chain:
 A > B ≥ C = D > E
 
 Therefore: **A > E**
 
 (A is definitely greater than E through the transitive property of inequalities)`,
   },
   {
     id: 53,
     title: "Puzzle - Family",
     text: "A family has 6 members: grandfather, grandmother, father, mother, son, daughter. The daughter is the granddaughter of the grandmother. How is the son related to the grandfather?",
     difficulty: "Easy",
     categoryId: "logical",
     type: "logical",
     answer: `## Family Relationship
 
 ### Family Tree
 \`\`\`
 Grandfather === Grandmother
        |
      Father === Mother
        |
   Son      Daughter
 \`\`\`
 
 ### Analysis
 - Daughter is granddaughter of grandmother ✓
 - This confirms father is son of grandfather
 - Son is child of father
 - Son is grandson of grandfather
 
 ### Answer
 Son is the **Grandson** of the grandfather`,
   },
   {
     id: 54,
     title: "Mirror Image",
     text: "If AMBULANCE shows as ECNALUBMA in a mirror (reversed), what would be the mirror image of 'EMERGENCY'?",
     difficulty: "Easy",
     categoryId: "logical",
     type: "logical",
     answer: `## Mirror Image
 
 ### Principle
 A plane mirror produces a laterally inverted image (left-right reversal).
 
 ### Solution
 Original: EMERGENCY
 
 Mirror image: **YCNEGREME**
 
 (Read from right to left)
 
 ### Note
 In practice on ambulances, AMBULANCE is written in reverse (ECNALUBMA) so that when viewed in a car's rear-view mirror, it reads correctly.`,
   },
   {
     id: 55,
     title: "Paper Folding",
     text: "A square paper is folded twice (halved each time) and a hole is punched in the center. When unfolded, how many holes will there be?",
     difficulty: "Medium",
     categoryId: "logical",
     type: "logical",
     answer: `## Paper Folding and Holes
 
 ### Process
 1. Start with square paper (1 layer)
 2. First fold: 2 layers
 3. Second fold: 4 layers
 4. Punch hole in center: goes through all 4 layers
 
 ### Result
 When unfolded: **4 holes**
 
 ### General Rule
 - n folds → 2ⁿ layers
 - 1 punch → 2ⁿ holes
 
 For 2 folds: 2² = 4 holes`,
   },
   {
     id: 56,
     title: "Water Image",
     text: "How would the word 'CHECK' appear when reflected in water?",
     difficulty: "Easy",
     categoryId: "logical",
     type: "logical",
     answer: `## Water Reflection
 
 ### Principle
 Water creates an **upside-down** (vertical inversion) reflection, not a left-right reversal.
 
 ### For CHECK:
 The letters would appear upside down (vertically flipped).
 
 ### Analysis
 - C → ɔ (flipped)
 - H → H (symmetric)
 - E → Ǝ (flipped)
 - C → ɔ (flipped)  
 - K → ʞ (flipped)
 
 ### Answer
 CHECK would appear with each letter vertically inverted, reading same left-to-right order but upside down.`,
   },
   {
     id: 57,
     title: "Sequence Completion",
     text: "Complete: J, F, M, A, M, J, J, A, S, O, N, ?",
     difficulty: "Easy",
     categoryId: "logical",
     type: "logical",
     answer: `## Letter Sequence
 
 ### Pattern Recognition
 J, F, M, A, M, J, J, A, S, O, N, ?
 
 These are first letters of months:
 - J = January
 - F = February
 - M = March
 - A = April
 - M = May
 - J = June
 - J = July
 - A = August
 - S = September
 - O = October
 - N = November
 - ? = December
 
 ### Answer: **D** (December)`,
   },
   {
     id: 58,
     title: "Classification",
     text: "Classify the odd one out: Apple, Orange, Potato, Banana, Mango",
     difficulty: "Easy",
     categoryId: "logical",
     type: "logical",
     answer: `## Classification
 
 ### Given Items
 Apple, Orange, Potato, Banana, Mango
 
 ### Analysis
 - Apple: Fruit 🍎
 - Orange: Fruit 🍊
 - Potato: **Vegetable** 🥔
 - Banana: Fruit 🍌
 - Mango: Fruit 🥭
 
 ### Answer: **Potato**
 
 Potato is a vegetable (root/tuber), while all others are fruits.`,
   },
   {
     id: 59,
     title: "Coding with Conditions",
     text: "In a code language, 'ma ni po' means 'very good boy', 'ni ja ho' means 'good and bad'. What is the code for 'good'?",
     difficulty: "Medium",
     categoryId: "logical",
     type: "logical",
     answer: `## Coding Language
 
 ### Given
 - 'ma ni po' = 'very good boy'
 - 'ni ja ho' = 'good and bad'
 
 ### Finding Common Elements
 **Common code**: 'ni'
 **Common meaning**: 'good'
 
 ### Verification
 Statement 1: ma ni po = very good boy
 Statement 2: ni ja ho = good and bad
 
 'ni' appears in both and 'good' appears in both meanings.
 
 ### Answer: **ni = good**`,
   },
   {
     id: 60,
     title: "Logical Connectives",
     text: "If 'P implies Q' is true and Q is false, what can we conclude about P?",
     difficulty: "Medium",
     categoryId: "logical",
     type: "logical",
     answer: `## Logical Implication
 
 ### Given
 - P → Q is TRUE
 - Q is FALSE
 
 ### Truth Table for Implication
 | P | Q | P → Q |
 |---|---|-------|
 | T | T | T     |
 | T | F | F     |
 | F | T | T     |
 | F | F | T     |
 
 ### Analysis
 For P → Q to be TRUE when Q is FALSE:
 Looking at row 4: P = F, Q = F, P → Q = T ✓
 
 Row 2 (P = T, Q = F) gives P → Q = F ✗
 
 ### Conclusion
 **P must be FALSE**
 
 This is called **Modus Tollens**:
 If P → Q and ¬Q, then ¬P`,
   },
 
   // Verbal Ability Questions (61-90)
   {
     id: 61,
     title: "Synonyms",
     text: "Choose the word most similar in meaning to 'UBIQUITOUS'",
     difficulty: "Easy",
     categoryId: "verbal",
     type: "conceptual",
     answer: `## Synonym for UBIQUITOUS
 
 ### Meaning
 **Ubiquitous** = present, appearing, or found everywhere
 
 ### Synonyms
 - Omnipresent
 - Pervasive
 - Universal
 - Prevalent
 - Everywhere
 
 ### Example Usage
 "Smartphones have become ubiquitous in modern society."
 
 ### Best Answer: **Omnipresent** or **Pervasive**`,
   },
   {
     id: 62,
     title: "Antonyms",
     text: "Choose the word most opposite in meaning to 'BENEVOLENT'",
     difficulty: "Easy",
     categoryId: "verbal",
     type: "conceptual",
     answer: `## Antonym for BENEVOLENT
 
 ### Meaning
 **Benevolent** = well-meaning, kind, charitable
 
 ### Antonyms
 - Malevolent (wishing evil)
 - Malicious
 - Cruel
 - Hostile
 - Unkind
 
 ### Example
 "The benevolent king helped his poor subjects."
 Opposite: "The malevolent villain plotted against everyone."
 
 ### Best Answer: **Malevolent**`,
   },
   {
     id: 63,
     title: "One Word Substitution",
     text: "What is one word for 'A person who hates mankind'?",
     difficulty: "Easy",
     categoryId: "verbal",
     type: "conceptual",
     answer: `## One Word Substitution
 
 ### Definition
 A person who hates mankind
 
 ### Answer: **Misanthrope**
 
 ### Etymology
 - Greek: 'misos' (hatred) + 'anthropos' (human)
 
 ### Related Terms
 - Misanthropy = hatred of humanity
 - Misanthropic = having misanthropic tendencies
 
 ### Opposite
 Philanthropist = one who loves and helps humanity`,
   },
   {
     id: 64,
     title: "Idioms and Phrases",
     text: "What does 'To burn the midnight oil' mean?",
     difficulty: "Easy",
     categoryId: "verbal",
     type: "conceptual",
     answer: `## Idiom: To Burn the Midnight Oil
 
 ### Meaning
 To work or study late into the night
 
 ### Origin
 In the days before electricity, people used oil lamps. Working at night meant burning oil in your lamp during the midnight hours.
 
 ### Example Usage
 "She burned the midnight oil preparing for her final exams."
 "The team has been burning the midnight oil to meet the deadline."
 
 ### Similar Expressions
 - Pulling an all-nighter
 - Working into the wee hours
 - Burning the candle at both ends`,
   },
   {
     id: 65,
     title: "Sentence Correction",
     text: "Correct the sentence: 'Each of the students have completed their assignment.'",
     difficulty: "Medium",
     categoryId: "verbal",
     type: "conceptual",
     answer: `## Sentence Correction
 
 ### Original
 "Each of the students have completed their assignment."
 
 ### Error
 Subject-verb agreement error.
 "Each" is singular and requires a singular verb.
 
 ### Corrected Sentence
 **"Each of the students has completed his/her assignment."**
 
 Or in modern usage (acceptable):
 "Each of the students has completed their assignment."
 
 ### Rule
 - Each, every, either, neither → singular verb
 - "Each of the [plural noun]" still takes singular verb`,
   },
   {
     id: 66,
     title: "Fill in the Blanks",
     text: "The committee ___ (has/have) decided to postpone the meeting.",
     difficulty: "Easy",
     categoryId: "verbal",
     type: "conceptual",
     answer: `## Subject-Verb Agreement
 
 ### Sentence
 "The committee ___ decided to postpone the meeting."
 
 ### Analysis
 "Committee" is a collective noun.
 
 ### Rule
 - When acting as a unit → singular (has)
 - When acting as individuals → plural (have)
 
 ### Context
 Here, the committee made a single decision together.
 
 ### Answer: **has**
 
 "The committee **has** decided to postpone the meeting."`,
   },
   {
     id: 67,
     title: "Spelling Correction",
     text: "Which is correctly spelled: Accomodate, Accommodate, Acommodate, Acomodate?",
     difficulty: "Easy",
     categoryId: "verbal",
     type: "conceptual",
     answer: `## Correct Spelling
 
 ### Options
 - Accomodate ✗
 - **Accommodate** ✓
 - Acommodate ✗
 - Acomodate ✗
 
 ### Answer: **Accommodate**
 
 ### Memory Tip
 - 2 C's (ac-com-)
 - 2 M's (-mm-)
 
 "Accommodate has enough room for 2 c's and 2 m's"
 
 ### Meaning
 To provide lodging or make space for; to adapt to`,
   },
   {
     id: 68,
     title: "Active to Passive Voice",
     text: "Convert to passive: 'The teacher teaches the students.'",
     difficulty: "Easy",
     categoryId: "verbal",
     type: "conceptual",
     answer: `## Voice Conversion
 
 ### Active Voice
 "The teacher teaches the students."
 
 ### Structure
 - Subject: The teacher
 - Verb: teaches
 - Object: the students
 
 ### Passive Voice Formula
 Object + is/are + past participle + by + subject
 
 ### Conversion
 **"The students are taught by the teacher."**
 
 ### Note
 - teaches (present) → are taught (present passive)
 - "by the teacher" can be omitted if agent is obvious`,
   },
   {
     id: 69,
     title: "Direct to Indirect Speech",
     text: "Convert to indirect: She said, 'I am going to the market.'",
     difficulty: "Medium",
     categoryId: "verbal",
     type: "conceptual",
     answer: `## Speech Conversion
 
 ### Direct Speech
 She said, "I am going to the market."
 
 ### Changes Required
 1. Remove quotation marks
 2. Add 'that' (optional)
 3. Change pronoun: I → she
 4. Change tense: am going → was going
 
 ### Indirect Speech
 **"She said that she was going to the market."**
 
 ### Rules Applied
 - Present continuous → Past continuous
 - First person → Third person (matching the subject)`,
   },
   {
     id: 70,
     title: "Para Jumbles",
     text: "Arrange: (A) However, it has its drawbacks. (B) Technology has transformed our lives. (C) We must use it wisely. (D) It has made communication easier.",
     difficulty: "Medium",
     categoryId: "verbal",
     type: "conceptual",
     answer: `## Sentence Arrangement
 
 ### Sentences
 A. However, it has its drawbacks.
 B. Technology has transformed our lives.
 C. We must use it wisely.
 D. It has made communication easier.
 
 ### Logical Order
 1. **B** - Introduction (Technology has transformed...)
 2. **D** - Supporting point (It has made communication...)
 3. **A** - Contrast with "However" (drawbacks)
 4. **C** - Conclusion (We must use it wisely)
 
 ### Answer: **B, D, A, C**
 
 ### Logic
 - B introduces the topic
 - D continues the positive aspect
 - A contrasts with "However"
 - C concludes with advice`,
   },
   {
     id: 71,
     title: "Reading Comprehension Inference",
     text: "Based on: 'The old man sat alone on the park bench, watching children play. A single tear rolled down his cheek.' What can we infer?",
     difficulty: "Medium",
     categoryId: "verbal",
     type: "conceptual",
     answer: `## Inference from Passage
 
 ### Given Text
 "The old man sat alone on the park bench, watching children play. A single tear rolled down his cheek."
 
 ### Possible Inferences
 1. The old man may be feeling **lonely**
 2. He might be **remembering** his own childhood or family
 3. The children may **remind him of someone** (grandchildren, his own children)
 4. He is experiencing **nostalgia** or grief
 5. He may have **lost someone** dear
 
 ### Key Words
 - "alone" suggests isolation/loneliness
 - "watching children" suggests connection to youth/past
 - "single tear" suggests sadness, not distress
 
 ### Best Inference
 The old man is feeling **nostalgic or lonely**, possibly reminded of happier times or lost loved ones.`,
   },
   {
     id: 72,
     title: "Cloze Test",
     text: "Fill in: The sun ___(1)___ in the east. It ___(2)___ light and warmth to the earth.",
     difficulty: "Easy",
     categoryId: "verbal",
     type: "conceptual",
     answer: `## Cloze Test
 
 ### Sentence
 "The sun ___(1)___ in the east. It ___(2)___ light and warmth to the earth."
 
 ### Analysis
 (1) Sun + east → action of appearing/coming up
 (2) Sun + light/warmth → action of providing
 
 ### Answers
 (1) **rises** - The sun rises in the east
 (2) **gives/provides** - It gives light and warmth
 
 ### Complete Passage
 "The sun **rises** in the east. It **gives** light and warmth to the earth."`,
   },
   {
     id: 73,
     title: "Error Spotting",
     text: "Find the error: 'Neither the teacher nor the students was present.'",
     difficulty: "Medium",
     categoryId: "verbal",
     type: "conceptual",
     answer: `## Error Spotting
 
 ### Sentence
 "Neither the teacher nor the students was present."
 
 ### Error
 Subject-verb agreement with "Neither...nor"
 
 ### Rule
 With "Neither...nor" (and "Either...or"), the verb agrees with the **nearer subject**.
 
 - Nearer subject: "the students" (plural)
 - Therefore: verb should be "were"
 
 ### Corrected Sentence
 **"Neither the teacher nor the students were present."**
 
 ### Alternative (also correct)
 "Neither the students nor the teacher was present." (if teacher is nearer)`,
   },
   {
     id: 74,
     title: "Sentence Improvement",
     text: "Improve: 'He is more taller than his brother.'",
     difficulty: "Easy",
     categoryId: "verbal",
     type: "conceptual",
     answer: `## Sentence Improvement
 
 ### Original
 "He is more taller than his brother."
 
 ### Error
 Double comparative: "more" + "taller"
 
 ### Rule
 - Use "more" with long adjectives (more beautiful)
 - Use "-er" with short adjectives (taller)
 - Never combine both
 
 ### Corrected Sentence
 **"He is taller than his brother."**
 
 ### Other Examples
 - ✗ more faster → ✓ faster
 - ✗ more better → ✓ better
 - ✗ more easier → ✓ easier`,
   },
   {
     id: 75,
     title: "Phrasal Verbs",
     text: "What does 'call off' mean? Use it in a sentence.",
     difficulty: "Easy",
     categoryId: "verbal",
     type: "conceptual",
     answer: `## Phrasal Verb: Call Off
 
 ### Meaning
 **To cancel** something that was planned or scheduled
 
 ### Examples
 1. "They had to call off the match due to rain."
 2. "The strike was called off after negotiations."
 3. "We called off the wedding at the last minute."
 
 ### Synonyms
 - Cancel
 - Abort
 - Scrub
 - Abandon
 
 ### Related Phrasal Verbs
 - Call on = visit or ask someone
 - Call out = shout or challenge
 - Call up = telephone or summon`,
   },
   {
     id: 76,
     title: "Vocabulary - Homophones",
     text: "Choose the correct word: 'The company will (accept/except) all applications.'",
     difficulty: "Easy",
     categoryId: "verbal",
     type: "conceptual",
     answer: `## Homophones: Accept vs Except
 
 ### Meanings
 - **Accept** (verb): to receive, agree to, or take
 - **Except** (preposition): excluding, other than
 
 ### Sentence
 "The company will ___ all applications."
 
 ### Analysis
 The company will receive/take all applications → **accept**
 
 ### Answer: **accept**
 
 "The company will **accept** all applications."
 
 ### Usage Examples
 - Accept: "I accept your apology."
 - Except: "Everyone came except John."`,
   },
   {
     id: 77,
     title: "Sentence Completion",
     text: "Despite the heavy rain, the match ___.",
     difficulty: "Easy",
     categoryId: "verbal",
     type: "conceptual",
     answer: `## Sentence Completion
 
 ### Sentence
 "Despite the heavy rain, the match ___."
 
 ### Key Word: "Despite"
 Indicates contrast - what follows should be unexpected given the rain.
 
 ### Possible Completions
 - "continued as scheduled"
 - "went ahead"
 - "was not cancelled"
 - "proceeded smoothly"
 
 ### Best Answer
 **"Despite the heavy rain, the match continued/went on."**
 
 ### Logic
 Despite (contrast) + rain (obstacle) = match should have been affected but wasn't.`,
   },
   {
     id: 78,
     title: "Precis Writing",
     text: "Summarize in one sentence: 'Water is essential for life. All living organisms need water to survive. Without water, plants cannot make food. Animals cannot digest their food without water.'",
     difficulty: "Medium",
     categoryId: "verbal",
     type: "conceptual",
     answer: `## Precis Writing
 
 ### Original Passage
 "Water is essential for life. All living organisms need water to survive. Without water, plants cannot make food. Animals cannot digest their food without water."
 
 ### Key Points
 1. Water is essential
 2. All organisms need it
 3. Plants need it for food production
 4. Animals need it for digestion
 
 ### Precis (One Sentence)
 **"Water is indispensable for all living organisms as it enables plants to produce food and animals to digest it."**
 
 Or shorter:
 **"Water is vital for all life forms, supporting both plant food production and animal digestion."**`,
   },
   {
     id: 79,
     title: "Word Usage",
     text: "Use 'Affect' and 'Effect' correctly in sentences.",
     difficulty: "Easy",
     categoryId: "verbal",
     type: "conceptual",
     answer: `## Affect vs Effect
 
 ### Definitions
 - **Affect** (verb): to influence or have an impact on
 - **Effect** (noun): the result or consequence
 
 ### Sentences
 **Affect**: "The weather will affect our travel plans."
 **Effect**: "The effect of the medicine was immediate."
 
 ### Memory Tip
 - **A**ffect = **A**ction (verb)
 - **E**ffect = **E**nd result (noun)
 
 ### Exception
 - Effect can be a verb meaning "to bring about"
   Example: "The new CEO will effect major changes."
 - Affect can be a noun in psychology (emotional state)`,
   },
   {
     id: 80,
     title: "Proverb Meaning",
     text: "What does 'A stitch in time saves nine' mean?",
     difficulty: "Easy",
     categoryId: "verbal",
     type: "conceptual",
     answer: `## Proverb Meaning
 
 ### Proverb
 "A stitch in time saves nine"
 
 ### Literal Meaning
 Fixing a small tear in cloth with one stitch now prevents having to use nine stitches later when it becomes bigger.
 
 ### Figurative Meaning
 **Taking action early to fix a small problem prevents it from becoming a much bigger problem later.**
 
 ### Examples
 - Fixing a small leak before it damages the wall
 - Addressing a health issue early before it worsens
 - Resolving a small conflict before it escalates
 
 ### Similar Proverbs
 - "Prevention is better than cure"
 - "An ounce of prevention is worth a pound of cure"`,
   },
   {
     id: 81,
     title: "Vocabulary - Confusing Words",
     text: "Differentiate between 'Principle' and 'Principal'",
     difficulty: "Easy",
     categoryId: "verbal",
     type: "conceptual",
     answer: `## Principle vs Principal
 
 ### Principle (noun)
 - A fundamental truth, rule, or belief
 - "Honesty is my guiding principle."
 - "The principle of gravity"
 
 ### Principal (noun/adjective)
 - Head of a school (noun)
 - Main or most important (adjective)
 - Original sum of money (noun)
 
 ### Examples
 - "The **principal** of our school is strict."
 - "My **principal** concern is safety."
 - "I follow certain **principles** in life."
 
 ### Memory Tip
 "The princip**AL** is your p**AL**"
 "Princip**LE** = ru**LE**"`,
   },
   {
     id: 82,
     title: "Grammar - Articles",
     text: "Fill in the correct article: '___ honest man is respected everywhere.'",
     difficulty: "Easy",
     categoryId: "verbal",
     type: "conceptual",
     answer: `## Article Usage
 
 ### Sentence
 "___ honest man is respected everywhere."
 
 ### Rule
 Use "an" before words that **sound** like they start with a vowel, regardless of spelling.
 
 ### Analysis
 "Honest" starts with 'h' but the 'h' is **silent**.
 It sounds like "onest" (starting with vowel sound 'o').
 
 ### Answer: **An**
 
 "**An** honest man is respected everywhere."
 
 ### Similar Examples
 - An hour (silent h)
 - A university (sounds like 'yu')
 - An umbrella (vowel sound)`,
   },
   {
     id: 83,
     title: "Sentence Rearrangement",
     text: "Rearrange: plays / in / the / she / garden / every / evening",
     difficulty: "Easy",
     categoryId: "verbal",
     type: "conceptual",
     answer: `## Word Rearrangement
 
 ### Given Words
 plays, in, the, she, garden, every, evening
 
 ### Sentence Formation
 Subject + Verb + Object/Place + Time
 
 ### Correct Arrangement
 **"She plays in the garden every evening."**
 
 ### Structure
 - Subject: She
 - Verb: plays
 - Place: in the garden
 - Time: every evening`,
   },
   {
     id: 84,
     title: "Analogy - Word Relationship",
     text: "Complete: Doctor : Hospital :: Teacher : ___",
     difficulty: "Easy",
     categoryId: "verbal",
     type: "conceptual",
     answer: `## Word Analogy
 
 ### Given
 Doctor : Hospital :: Teacher : ?
 
 ### Relationship
 Professional : Workplace
 
 - Doctor works in a **Hospital**
 - Teacher works in a **School**
 
 ### Answer: **School**
 
 ### Similar Analogies
 - Chef : Kitchen
 - Pilot : Cockpit
 - Judge : Court
 - Scientist : Laboratory`,
   },
   {
     id: 85,
     title: "Tenses",
     text: "Choose correct form: 'She ___ (study) for three hours before she took a break.'",
     difficulty: "Medium",
     categoryId: "verbal",
     type: "conceptual",
     answer: `## Tense Usage
 
 ### Sentence
 "She ___ (study) for three hours before she took a break."
 
 ### Analysis
 - "before she took" = simple past reference point
 - Action of studying happened BEFORE this past point
 - Duration mentioned: "for three hours"
 
 ### Tense Required
 **Past Perfect Continuous** (had been + -ing)
 - Shows duration before a past event
 
 ### Answer
 **"She had been studying for three hours before she took a break."**`,
   },
   {
     id: 86,
     title: "Prepositions",
     text: "Fill in: 'He is good ___ mathematics.'",
     difficulty: "Easy",
     categoryId: "verbal",
     type: "conceptual",
     answer: `## Preposition Usage
 
 ### Sentence
 "He is good ___ mathematics."
 
 ### Rule
 "Good" takes different prepositions:
 - good **at** (skills/subjects) - He is good at math
 - good **for** (beneficial) - Exercise is good for health
 - good **to** (kind) - She is good to animals
 
 ### Answer: **at**
 
 "He is good **at** mathematics."
 
 ### Common Errors
 ✗ good in mathematics
 ✓ good at mathematics`,
   },
   {
     id: 87,
     title: "Conjunctions",
     text: "Join using appropriate conjunction: 'It was raining. We went out.'",
     difficulty: "Easy",
     categoryId: "verbal",
     type: "conceptual",
     answer: `## Using Conjunctions
 
 ### Sentences
 "It was raining. We went out."
 
 ### Relationship
 Contrast - We went out despite the rain
 
 ### Possible Conjunctions
 - **Although/Though** it was raining, we went out.
 - It was raining, **but/yet** we went out.
 - **Despite** the rain, we went out.
 - We went out **even though** it was raining.
 
 ### Best Answers
 - "**Although** it was raining, we went out."
 - "It was raining, **but** we went out."`,
   },
   {
     id: 88,
     title: "Collective Nouns",
     text: "What is the collective noun for: a group of wolves?",
     difficulty: "Easy",
     categoryId: "verbal",
     type: "conceptual",
     answer: `## Collective Nouns
 
 ### Question
 Collective noun for wolves
 
 ### Answer: **Pack**
 
 "A **pack** of wolves"
 
 ### Other Animal Collective Nouns
 - Lions: Pride
 - Fish: School
 - Birds: Flock
 - Bees: Swarm
 - Cattle: Herd
 - Puppies: Litter
 - Crows: Murder
 - Geese: Gaggle`,
   },
   {
     id: 89,
     title: "Word Formation",
     text: "Form an adjective from the noun 'Beauty'",
     difficulty: "Easy",
     categoryId: "verbal",
     type: "conceptual",
     answer: `## Word Formation
 
 ### Noun: Beauty
 
 ### Adjective: **Beautiful**
 
 ### Word Family
 - **Noun**: Beauty, beautician
 - **Adjective**: Beautiful
 - **Verb**: Beautify
 - **Adverb**: Beautifully
 
 ### Usage
 - "She has natural **beauty**." (noun)
 - "The sunset was **beautiful**." (adjective)
 - "She dressed **beautifully**." (adverb)
 - "They will **beautify** the garden." (verb)`,
   },
   {
     id: 90,
     title: "Contextual Vocabulary",
     text: "What does 'novel' mean in: 'The scientist proposed a novel approach.'",
     difficulty: "Medium",
     categoryId: "verbal",
     type: "conceptual",
     answer: `## Contextual Word Meaning
 
 ### Sentence
 "The scientist proposed a novel approach."
 
 ### Word: Novel
 
 ### Meanings
 1. **Noun**: A fictional book (e.g., Harry Potter is a novel)
 2. **Adjective**: New, original, innovative
 
 ### Context Analysis
 Here, "novel" describes "approach" → adjective usage
 
 ### Meaning in Context
 **New, original, or innovative**
 
 "The scientist proposed a **new/innovative** approach."
 
 ### Synonyms (adjective form)
 - New
 - Original
 - Fresh
 - Innovative
 - Unprecedented`,
   },
 
   // Data Interpretation Questions (91-110)
   {
     id: 91,
     title: "Bar Graph Reading",
     text: "A bar graph shows sales: Jan-100, Feb-120, Mar-90, Apr-150. What is the average monthly sales?",
     difficulty: "Easy",
     categoryId: "data-interpretation",
     type: "calculation",
     answer: `## Bar Graph Analysis
 
 ### Given Data
 - January: 100
 - February: 120
 - March: 90
 - April: 150
 
 ### Average Calculation
 Average = (Sum of all values) / (Number of values)
 
 Sum = 100 + 120 + 90 + 150 = 460
 Number of months = 4
 
 Average = 460 / 4 = **115**
 
 ### Answer: 115 units per month`,
   },
   {
     id: 92,
     title: "Pie Chart Calculation",
     text: "A pie chart shows expenses: Food 25%, Rent 35%, Transport 15%, Others 25%. If total expense is ₹40,000, find spending on Food.",
     difficulty: "Easy",
     categoryId: "data-interpretation",
     type: "calculation",
     answer: `## Pie Chart Calculation
 
 ### Given
 - Food: 25%
 - Total expense: ₹40,000
 
 ### Calculation
 Food expense = 25% of 40,000
 = (25/100) × 40,000
 = 0.25 × 40,000
 = **₹10,000**
 
 ### All Expenses
 - Food: ₹10,000 (25%)
 - Rent: ₹14,000 (35%)
 - Transport: ₹6,000 (15%)
 - Others: ₹10,000 (25%)
 - Total: ₹40,000 ✓`,
   },
   {
     id: 93,
     title: "Line Graph Trend",
     text: "A line graph shows temperature: Mon-25°C, Tue-28°C, Wed-32°C, Thu-30°C, Fri-27°C. On which day was the highest increase?",
     difficulty: "Easy",
     categoryId: "data-interpretation",
     type: "calculation",
     answer: `## Line Graph Analysis
 
 ### Given Data
 - Monday: 25°C
 - Tuesday: 28°C
 - Wednesday: 32°C
 - Thursday: 30°C
 - Friday: 27°C
 
 ### Day-to-Day Changes
 - Mon→Tue: 28-25 = **+3°C**
 - Tue→Wed: 32-28 = **+4°C** ← Highest increase
 - Wed→Thu: 30-32 = -2°C (decrease)
 - Thu→Fri: 27-30 = -3°C (decrease)
 
 ### Answer
 Highest increase was on **Wednesday** (+4°C from Tuesday)`,
   },
   {
     id: 94,
     title: "Table Data Analysis",
     text: "Table shows marks: Math-85, Science-78, English-92, History-75. Find the percentage if total marks per subject is 100.",
     difficulty: "Easy",
     categoryId: "data-interpretation",
     type: "calculation",
     answer: `## Table Analysis
 
 ### Given Marks (out of 100 each)
 - Math: 85
 - Science: 78
 - English: 92
 - History: 75
 
 ### Total Calculation
 Total obtained = 85 + 78 + 92 + 75 = 330
 Maximum possible = 4 × 100 = 400
 
 ### Percentage
 = (330/400) × 100
 = 0.825 × 100
 = **82.5%**`,
   },
   {
     id: 95,
     title: "Percentage Comparison",
     text: "Company A's profit: 2019-₹50L, 2020-₹60L. Company B's profit: 2019-₹40L, 2020-₹52L. Which company had higher growth rate?",
     difficulty: "Medium",
     categoryId: "data-interpretation",
     type: "calculation",
     answer: `## Growth Rate Comparison
 
 ### Company A
 - 2019: ₹50 lakhs
 - 2020: ₹60 lakhs
 - Growth = (60-50)/50 × 100 = 10/50 × 100 = **20%**
 
 ### Company B
 - 2019: ₹40 lakhs
 - 2020: ₹52 lakhs
 - Growth = (52-40)/40 × 100 = 12/40 × 100 = **30%**
 
 ### Comparison
 Company B (30%) > Company A (20%)
 
 ### Answer
 **Company B** had higher growth rate (30% vs 20%)`,
   },
   {
     id: 96,
     title: "Mixed Chart Analysis",
     text: "Population bar chart shows City A: 5M, City B: 3M. If literacy rate (line) is 80% for A and 90% for B, which city has more literate people?",
     difficulty: "Medium",
     categoryId: "data-interpretation",
     type: "calculation",
     answer: `## Combined Chart Analysis
 
 ### City A
 - Population: 5 million
 - Literacy rate: 80%
 - Literate population = 5M × 80% = **4 million**
 
 ### City B
 - Population: 3 million
 - Literacy rate: 90%
 - Literate population = 3M × 90% = **2.7 million**
 
 ### Comparison
 City A (4M) > City B (2.7M)
 
 ### Answer
 **City A** has more literate people (4 million vs 2.7 million)
 
 Despite lower literacy rate, City A's larger population results in more absolute literate people.`,
   },
   {
     id: 97,
     title: "Ratio from Data",
     text: "Boys in class: 25, Girls: 15. What is the ratio of girls to total students?",
     difficulty: "Easy",
     categoryId: "data-interpretation",
     type: "calculation",
     answer: `## Ratio Calculation
 
 ### Given
 - Boys: 25
 - Girls: 15
 - Total: 25 + 15 = 40
 
 ### Ratio of Girls to Total
 = Girls : Total
 = 15 : 40
 = 3 : 8 (dividing both by 5)
 
 ### As Fraction
 = 15/40 = 3/8 = **37.5%**
 
 ### Answer
 Girls to Total = **3:8** or **3/8** or **37.5%**`,
   },
   {
     id: 98,
     title: "Year-on-Year Comparison",
     text: "Revenue 2018: ₹100Cr, 2019: ₹120Cr, 2020: ₹108Cr. Calculate CAGR over 2 years (2018-2020).",
     difficulty: "Hard",
     categoryId: "data-interpretation",
     type: "calculation",
     answer: `## CAGR Calculation
 
 ### Formula
 CAGR = (Ending Value / Beginning Value)^(1/n) - 1
 
 Where n = number of years
 
 ### Given
 - Beginning (2018): ₹100 Cr
 - Ending (2020): ₹108 Cr
 - n = 2 years
 
 ### Calculation
 CAGR = (108/100)^(1/2) - 1
 = (1.08)^0.5 - 1
 = 1.0392 - 1
 = 0.0392
 = **3.92%**
 
 ### Answer
 CAGR = **3.92%** per annum`,
   },
   {
     id: 99,
     title: "Sector Analysis",
     text: "In a pie chart, if IT sector is 72° out of 360°, and total investments are ₹50 Cr, find IT investment.",
     difficulty: "Easy",
     categoryId: "data-interpretation",
     type: "calculation",
     answer: `## Pie Chart Sector Calculation
 
 ### Given
 - IT sector angle: 72°
 - Total angle: 360°
 - Total investment: ₹50 Cr
 
 ### Calculation
 IT percentage = 72/360 = 1/5 = 20%
 
 IT investment = 20% of 50 Cr
 = 0.20 × 50
 = **₹10 Crore**
 
 ### Alternative Method
 IT investment = (72/360) × 50 = 72 × 50/360 = 3600/360 = ₹10 Cr`,
   },
   {
     id: 100,
     title: "Cumulative Data",
     text: "Cumulative production: Jan-100, Feb-250, Mar-420. What was the production in March alone?",
     difficulty: "Easy",
     categoryId: "data-interpretation",
     type: "calculation",
     answer: `## Cumulative to Monthly Conversion
 
 ### Given Cumulative Data
 - Jan (cumulative): 100
 - Feb (cumulative): 250
 - Mar (cumulative): 420
 
 ### Monthly Production
 - January: 100 (first month = cumulative)
 - February: 250 - 100 = 150
 - March: 420 - 250 = **170**
 
 ### Verification
 100 + 150 + 170 = 420 ✓
 
 ### Answer
 Production in March alone = **170 units**`,
   },
   {
     id: 101,
     title: "Data Range and Spread",
     text: "Dataset: 15, 22, 8, 31, 18, 25. Find the range.",
     difficulty: "Easy",
     categoryId: "data-interpretation",
     type: "calculation",
     answer: `## Range Calculation
 
 ### Dataset
 15, 22, 8, 31, 18, 25
 
 ### Finding Range
 - Maximum value: 31
 - Minimum value: 8
 
 **Range = Maximum - Minimum**
 = 31 - 8
 = **23**
 
 ### Note
 Range tells us the spread of data but not the distribution.`,
   },
   {
     id: 102,
     title: "Percentage Point Difference",
     text: "Market share changed from 25% to 30%. What is the percentage point increase and percentage increase?",
     difficulty: "Medium",
     categoryId: "data-interpretation",
     type: "calculation",
     answer: `## Percentage vs Percentage Points
 
 ### Given
 - Old market share: 25%
 - New market share: 30%
 
 ### Percentage Point Increase
 = New% - Old%
 = 30% - 25%
 = **5 percentage points**
 
 ### Percentage Increase
 = (Change / Original) × 100
 = (5 / 25) × 100
 = **20%** increase
 
 ### Key Difference
 - Percentage points: Absolute difference in percentages
 - Percentage increase: Relative change from original
 
 Market share increased by 5 percentage points or by 20%.`,
   },
   {
     id: 103,
     title: "Weighted Average",
     text: "Class A (30 students) average: 75. Class B (20 students) average: 80. Find combined average.",
     difficulty: "Medium",
     categoryId: "data-interpretation",
     type: "calculation",
     answer: `## Weighted Average
 
 ### Given
 - Class A: 30 students, average 75
 - Class B: 20 students, average 80
 
 ### Formula
 Weighted Average = (n₁×avg₁ + n₂×avg₂) / (n₁ + n₂)
 
 ### Calculation
 = (30 × 75 + 20 × 80) / (30 + 20)
 = (2250 + 1600) / 50
 = 3850 / 50
 = **77**
 
 ### Answer
 Combined average = **77**
 
 Note: It's not simply (75+80)/2 = 77.5 because classes have different sizes.`,
   },
   {
     id: 104,
     title: "Growth Rate Calculation",
     text: "Population: 2000-50,000, 2010-65,000. Find the decadal growth rate.",
     difficulty: "Easy",
     categoryId: "data-interpretation",
     type: "calculation",
     answer: `## Decadal Growth Rate
 
 ### Given
 - Year 2000: 50,000
 - Year 2010: 65,000
 
 ### Growth Rate Formula
 = (Final - Initial) / Initial × 100
 
 ### Calculation
 = (65000 - 50000) / 50000 × 100
 = 15000 / 50000 × 100
 = 0.3 × 100
 = **30%**
 
 ### Answer
 Decadal growth rate = **30%** (over 10 years)
 
 Annual growth rate (simple) ≈ 3% per year`,
   },
   {
     id: 105,
     title: "Break-even Analysis",
     text: "Fixed cost: ₹50,000. Variable cost: ₹20/unit. Selling price: ₹30/unit. Find break-even quantity.",
     difficulty: "Medium",
     categoryId: "data-interpretation",
     type: "calculation",
     answer: `## Break-even Analysis
 
 ### Given
 - Fixed cost: ₹50,000
 - Variable cost: ₹20/unit
 - Selling price: ₹30/unit
 
 ### Formula
 Break-even quantity = Fixed Cost / (Selling Price - Variable Cost)
 
 ### Calculation
 = 50000 / (30 - 20)
 = 50000 / 10
 = **5000 units**
 
 ### Verification
 - Revenue: 5000 × 30 = ₹1,50,000
 - Total cost: 50000 + (5000 × 20) = ₹1,50,000
 - Profit: 0 ✓`,
   },
   {
     id: 106,
     title: "Index Number",
     text: "Base year price: ₹100. Current year price: ₹125. Calculate price index.",
     difficulty: "Easy",
     categoryId: "data-interpretation",
     type: "calculation",
     answer: `## Price Index Calculation
 
 ### Given
 - Base year price: ₹100
 - Current year price: ₹125
 
 ### Formula
 Price Index = (Current Price / Base Price) × 100
 
 ### Calculation
 = (125 / 100) × 100
 = 1.25 × 100
 = **125**
 
 ### Interpretation
 Price index of 125 means prices have increased by 25% compared to the base year.
 
 Base year index is always 100.`,
   },
   {
     id: 107,
     title: "Moving Average",
     text: "Monthly sales: 100, 120, 110, 130, 140. Calculate 3-month moving average for month 4.",
     difficulty: "Medium",
     categoryId: "data-interpretation",
     type: "calculation",
     answer: `## Moving Average
 
 ### Given Sales
 Month 1: 100, Month 2: 120, Month 3: 110, Month 4: 130, Month 5: 140
 
 ### 3-Month Moving Average for Month 4
 Uses months 2, 3, 4 (previous 3 months centered on month 4)
 
 = (120 + 110 + 130) / 3
 = 360 / 3
 = **120**
 
 ### Alternative Calculation
 Using months 3, 4, 5:
 = (110 + 130 + 140) / 3 = **126.67**
 
 ### Note
 Moving averages smooth out fluctuations and show trends.`,
   },
   {
     id: 108,
     title: "Variance Understanding",
     text: "Dataset A: 10, 10, 10. Dataset B: 5, 10, 15. Both have mean 10. Which has higher variance?",
     difficulty: "Medium",
     categoryId: "data-interpretation",
     type: "conceptual",
     answer: `## Variance Comparison
 
 ### Dataset A: 10, 10, 10
 - Mean = 10
 - Deviations: 0, 0, 0
 - Variance = 0 (no spread)
 
 ### Dataset B: 5, 10, 15
 - Mean = 10
 - Deviations: -5, 0, +5
 - Variance = [(25 + 0 + 25) / 3] = 50/3 ≈ 16.67
 
 ### Answer
 **Dataset B** has higher variance.
 
 ### Interpretation
 - Dataset A: All values are the same (no variation)
 - Dataset B: Values are spread around the mean`,
   },
   {
     id: 109,
     title: "Probability from Data",
     text: "In a survey of 200 people: 80 prefer tea, 60 prefer coffee, 40 prefer both. What's the probability someone prefers tea OR coffee?",
     difficulty: "Medium",
     categoryId: "data-interpretation",
     type: "calculation",
     answer: `## Probability with Overlapping Sets
 
 ### Given
 - Total: 200
 - Tea: 80
 - Coffee: 60
 - Both: 40
 
 ### Union Formula
 P(A or B) = P(A) + P(B) - P(A and B)
 
 ### Calculation
 Tea OR Coffee = 80 + 60 - 40 = 100 people
 
 Probability = 100/200 = **0.5 or 50%**
 
 ### Venn Diagram
 - Only Tea: 80 - 40 = 40
 - Only Coffee: 60 - 40 = 20
 - Both: 40
 - Total preferring either: 40 + 20 + 40 = 100`,
   },
   {
     id: 110,
     title: "Rate of Change",
     text: "Temperature at 6 AM: 20°C, at 12 PM: 32°C. Find the rate of temperature increase per hour.",
     difficulty: "Easy",
     categoryId: "data-interpretation",
     type: "calculation",
     answer: `## Rate of Change
 
 ### Given
 - 6 AM: 20°C
 - 12 PM: 32°C
 - Time elapsed: 6 hours
 
 ### Calculation
 Total change = 32 - 20 = 12°C
 
 Rate = Change / Time
 = 12°C / 6 hours
 = **2°C per hour**
 
 ### Answer
 Temperature increased at **2°C per hour**`,
   },
 
   // Puzzles (111-130)
   {
     id: 111,
     title: "River Crossing",
     text: "A farmer has a wolf, a goat, and cabbage to cross a river. Boat holds only the farmer and one item. Wolf will eat goat, goat will eat cabbage if left alone. How to cross?",
     difficulty: "Medium",
     categoryId: "puzzles",
     type: "logical",
     answer: `## River Crossing Puzzle
 
 ### Constraints
 - Wolf + Goat alone = Wolf eats goat
 - Goat + Cabbage alone = Goat eats cabbage
 - Wolf + Cabbage = Safe
 
 ### Solution (7 trips)
 
 1. **Take goat across** → Leave goat on other side
 2. **Return alone**
 3. **Take wolf across** → Leave wolf, bring goat back
 4. **Return with goat**
 5. **Take cabbage across** → Leave cabbage with wolf
 6. **Return alone**
 7. **Take goat across** → All safely across!
 
 ### Key Insight
 The goat must never be left alone with either wolf or cabbage.`,
   },
   {
     id: 112,
     title: "Two Doors Puzzle",
     text: "Two doors: one leads to freedom, one to death. Two guards: one always lies, one always tells truth. You can ask ONE question. What do you ask?",
     difficulty: "Hard",
     categoryId: "puzzles",
     type: "logical",
     answer: `## Two Guards Puzzle
 
 ### The Question
 Ask either guard:
 **"Which door would the OTHER guard say leads to freedom?"**
 
 Then choose the **opposite** door.
 
 ### Why This Works
 
 **If you ask the truth-teller:**
 - He honestly tells you what the liar would say
 - Liar would point to death door
 - Truth-teller reports: "Death door"
 
 **If you ask the liar:**
 - Truth-teller would point to freedom door
 - Liar lies about it, points to death door
 - Liar reports: "Death door"
 
 ### Result
 Both guards point to the **death door**, so you choose the **other one**!`,
   },
   {
     id: 113,
     title: "Hat Color Puzzle",
     text: "3 prisoners, 3 black hats, 2 white hats. They stand in a line, can see hats in front. First two say 'I don't know my hat color.' What does the third say?",
     difficulty: "Hard",
     categoryId: "puzzles",
     type: "logical",
     answer: `## Hat Color Logic
 
 ### Setup
 - Prisoner 3 (back) sees 2 hats in front
 - Prisoner 2 sees 1 hat in front
 - Prisoner 1 sees nothing
 
 ### Reasoning
 
 **Prisoner 3 says "I don't know":**
 - If he saw 2 white hats, he'd know his is black (only 2 white exist)
 - So he sees: 2 black, or 1 black + 1 white
 
 **Prisoner 2 says "I don't know":**
 - He knows Prisoner 3's reasoning
 - If Prisoner 1 had white, and 3 saw at least one black (Prisoner 2)...
 - If 1 is white, 2 would be black (since 3 didn't see 2 whites)
 - But 2 says "don't know" → **Prisoner 1 is NOT white**
 
 **Prisoner 1 concludes:**
 His hat is **BLACK**`,
   },
   {
     id: 114,
     title: "Weighing Puzzle",
     text: "You have 9 balls, one is heavier. Using a balance scale, what's the minimum weighings needed to find it?",
     difficulty: "Medium",
     categoryId: "puzzles",
     type: "logical",
     answer: `## Balance Scale Puzzle
 
 ### Answer: **2 weighings**
 
 ### Strategy
 
 **Weighing 1: Divide 9 balls into 3 groups of 3**
 - Put 3 on each side, keep 3 aside
 - If balanced: heavy ball is in the 3 aside
 - If not balanced: heavy ball is in the heavier group
 
 **Weighing 2: Take the group of 3 with heavy ball**
 - Put 1 on each side, keep 1 aside
 - If balanced: the one aside is heavy
 - If not balanced: heavier side has the heavy ball
 
 ### General Formula
 For n balls: ⌈log₃(n)⌉ weighings
 For 9 balls: log₃(9) = 2 weighings`,
   },
   {
     id: 115,
     title: "Water Jug Problem",
     text: "You have a 5-liter and 3-liter jug. How do you measure exactly 4 liters?",
     difficulty: "Medium",
     categoryId: "puzzles",
     type: "logical",
     answer: `## Water Jug Problem
 
 ### Steps
 
 | Step | 5L Jug | 3L Jug | Action |
 |------|--------|--------|--------|
 | 1 | 5 | 0 | Fill 5L jug |
 | 2 | 2 | 3 | Pour into 3L until full |
 | 3 | 2 | 0 | Empty 3L jug |
 | 4 | 0 | 2 | Pour 2L into 3L jug |
 | 5 | 5 | 2 | Fill 5L jug |
 | 6 | **4** | 3 | Pour into 3L until full |
 
 ### Result
 5L jug now contains exactly **4 liters**!
 
 (5L jug had 5, poured 1 into 3L jug to fill it, leaving 4)`,
   },
   {
     id: 116,
     title: "Egg Drop Problem",
     text: "You have 2 identical eggs and a 100-floor building. What's the minimum number of drops needed to find the critical floor (where egg breaks) in worst case?",
     difficulty: "Hard",
     categoryId: "puzzles",
     type: "logical",
     answer: `## Egg Drop Problem
 
 ### Answer: **14 drops** (worst case)
 
 ### Strategy
 Use decreasing intervals!
 
 First drop: Floor 14
 - If breaks: Linear search floors 1-13 (13 more drops)
 - Total: 14 drops
 
 If survives: Floor 14 + 13 = 27
 - If breaks: Linear search 15-26 (12 more drops)
 - Total: 2 + 12 = 14 drops
 
 Continue: 27 + 12 = 39, then 50, 60, 69, 77, 84, 90, 95, 99, 100
 
 ### Mathematical Explanation
 We need n where: n + (n-1) + (n-2) + ... + 1 ≥ 100
 n(n+1)/2 ≥ 100
 n = 14 (since 14×15/2 = 105 ≥ 100)`,
   },
   {
     id: 117,
     title: "Coin Flip Puzzle",
     text: "3 coins flipped. At least 2 must match (all heads, all tails, or 2 same). What's the probability?",
     difficulty: "Medium",
     categoryId: "puzzles",
     type: "calculation",
     answer: `## Coin Flip Probability
 
 ### Total Outcomes
 2³ = 8 outcomes
 HHH, HHT, HTH, HTT, THH, THT, TTH, TTT
 
 ### "At least 2 match" Analysis
 In ANY flip of 3 coins, at least 2 must match!
 
 - If not all same, there's 2 of one type and 1 of other
 - Either 2 heads match or 2 tails match
 
 ### Check All Outcomes
 - HHH: 3 match ✓
 - HHT: 2 heads match ✓
 - HTH: 2 heads match ✓
 - HTT: 2 tails match ✓
 - THH: 2 heads match ✓
 - THT: 2 tails match ✓
 - TTH: 2 tails match ✓
 - TTT: 3 match ✓
 
 ### Answer
 Probability = 8/8 = **100%** (or 1)
 
 It's a certainty!`,
   },
   {
     id: 118,
     title: "Handshake Puzzle",
     text: "At a party, everyone shakes hands exactly once. There were 45 handshakes. How many people?",
     difficulty: "Medium",
     categoryId: "puzzles",
     type: "calculation",
     answer: `## Handshake Problem
 
 ### Formula
 Number of handshakes = n(n-1)/2
 
 Where n = number of people
 
 ### Solving
 n(n-1)/2 = 45
 n(n-1) = 90
 n² - n - 90 = 0
 
 Using quadratic formula or factoring:
 (n - 10)(n + 9) = 0
 n = 10 (ignoring negative)
 
 ### Verification
 10 people: 10 × 9 / 2 = 45 handshakes ✓
 
 ### Answer: **10 people**`,
   },
   {
     id: 119,
     title: "Candle Burning Puzzle",
     text: "Two candles of same height but different thickness. Thick candle burns in 5 hours, thin in 4 hours. When are they equal height?",
     difficulty: "Hard",
     categoryId: "puzzles",
     type: "calculation",
     answer: `## Candle Burning Problem
 
 ### Given
 - Initial height: H (same for both)
 - Thick candle: burns completely in 5 hours
 - Thin candle: burns completely in 4 hours
 
 ### Burn Rates
 - Thick: loses H/5 per hour
 - Thin: loses H/4 per hour
 
 ### Height at time t
 - Thick: H - (H/5)t = H(1 - t/5)
 - Thin: H - (H/4)t = H(1 - t/4)
 
 ### Setting Equal
 H(1 - t/5) = H(1 - t/4)
 1 - t/5 = 1 - t/4
 
 Wait, this gives 0 = 0, meaning they start equal...
 
 ### Reconsidering
 They're never equal height again after t=0!
 The thin candle burns faster, so it's always shorter.
 
 **Unless the question means "when is thick candle = 2× thin"** etc.`,
   },
   {
     id: 120,
     title: "Prisoner Switch Puzzle",
     text: "100 prisoners, 100 closed boxes (each with unique number 1-100). Each prisoner must find their own number. They can open 50 boxes. How do they guarantee >30% success?",
     difficulty: "Hard",
     categoryId: "puzzles",
     type: "logical",
     answer: `## 100 Prisoners Problem
 
 ### The Loop Strategy
 
 1. Prisoner k starts by opening box k
 2. If the number inside is m, open box m next
 3. Follow this chain until finding number k
 4. Limited to 50 openings
 
 ### Why It Works
 - Numbers in boxes form permutation cycles
 - If all cycles are ≤50 length, everyone finds their number!
 - Probability of success ≈ **31%**
 
 ### Mathematics
 Probability that longest cycle ≤50 in random permutation of 100:
 ≈ 1 - (1/51 + 1/52 + ... + 1/100)
 ≈ 1 - ln(2) ≈ 0.31
 
 ### Compared to Random
 Random strategy: (1/2)^100 ≈ 0% (practically zero)
 Loop strategy: ~31% (massive improvement!)`,
   },
 
   // Pattern Recognition (121-150)
   {
     id: 121,
     title: "Number Pattern 1",
     text: "Find the next number: 1, 1, 2, 3, 5, 8, 13, ?",
     difficulty: "Easy",
     categoryId: "pattern",
     type: "logical",
     answer: `## Fibonacci Sequence
 
 ### Pattern: 1, 1, 2, 3, 5, 8, 13, ?
 
 ### Rule
 Each number = Sum of previous two numbers
 
 - 1 + 1 = 2
 - 1 + 2 = 3
 - 2 + 3 = 5
 - 3 + 5 = 8
 - 5 + 8 = 13
 - 8 + 13 = **21**
 
 ### Answer: **21**
 
 This is the famous Fibonacci sequence!`,
   },
   {
     id: 122,
     title: "Number Pattern 2",
     text: "Find the missing: 2, 6, 12, 20, ?, 42",
     difficulty: "Easy",
     categoryId: "pattern",
     type: "logical",
     answer: `## Difference Pattern
 
 ### Pattern: 2, 6, 12, 20, ?, 42
 
 ### Finding Differences
 - 6 - 2 = 4
 - 12 - 6 = 6
 - 20 - 12 = 8
 - ? - 20 = 10 (difference increases by 2)
 - 42 - ? = 12
 
 ### Answer
 ? = 20 + 10 = **30**
 
 ### Verification
 2, 6, 12, 20, 30, 42
 Differences: 4, 6, 8, 10, 12 ✓
 
 ### Alternative: n(n+1)
 1×2=2, 2×3=6, 3×4=12, 4×5=20, 5×6=30, 6×7=42 ✓`,
   },
   {
     id: 123,
     title: "Alphabetic Pattern",
     text: "Find the next: ACE, BDF, CEG, ?",
     difficulty: "Easy",
     categoryId: "pattern",
     type: "logical",
     answer: `## Letter Pattern
 
 ### Pattern: ACE, BDF, CEG, ?
 
 ### Analysis
 | Position | 1st Letter | 2nd Letter | 3rd Letter |
 |----------|------------|------------|------------|
 | ACE | A(1) | C(3) | E(5) |
 | BDF | B(2) | D(4) | F(6) |
 | CEG | C(3) | E(5) | G(7) |
 | ? | D(4) | F(6) | H(8) |
 
 ### Pattern
 - First letter: A, B, C, D... (+1)
 - All letters are odd-positioned letters from each starting point
 
 ### Answer: **DFH**`,
   },
   {
     id: 124,
     title: "Alphanumeric Pattern",
     text: "What comes next: A1, B2, D4, G7, ?",
     difficulty: "Medium",
     categoryId: "pattern",
     type: "logical",
     answer: `## Alphanumeric Series
 
 ### Pattern: A1, B2, D4, G7, ?
 
 ### Letter Analysis
 A → B → D → G → ?
 Positions: 1, 2, 4, 7, ?
 Differences: +1, +2, +3, +4
 
 Next: 7 + 4 = 11 → K(11th letter)
 
 ### Number Analysis
 1 → 2 → 4 → 7 → ?
 Differences: +1, +2, +3, +4
 
 Next: 7 + 4 = 11
 
 ### Answer: **K11**`,
   },
   {
     id: 125,
     title: "Figure Pattern",
     text: "Dots in figures: 1, 4, 9, 16, ?. Each figure adds one row of dots to a square pattern. What's next?",
     difficulty: "Easy",
     categoryId: "pattern",
     type: "logical",
     answer: `## Square Number Pattern
 
 ### Pattern: 1, 4, 9, 16, ?
 
 ### Recognition
 - 1 = 1²
 - 4 = 2²
 - 9 = 3²
 - 16 = 4²
 - ? = 5²
 
 ### Answer: **25**
 
 These are perfect square numbers representing n×n dot grids.
 
 ### Visual
 \`\`\`
 •      • •      • • •      • • • •
        • •      • • •      • • • •
                 • • •      • • • •
                            • • • •
 1       4         9          16
 \`\`\``,
   },
   {
     id: 126,
     title: "Complex Number Series",
     text: "Find the pattern: 3, 6, 11, 18, 27, ?",
     difficulty: "Medium",
     categoryId: "pattern",
     type: "logical",
     answer: `## Number Series Analysis
 
 ### Pattern: 3, 6, 11, 18, 27, ?
 
 ### First Differences
 - 6 - 3 = 3
 - 11 - 6 = 5
 - 18 - 11 = 7
 - 27 - 18 = 9
 - ? - 27 = 11
 
 ### Second Difference
 3, 5, 7, 9, 11... (odd numbers, difference of 2)
 
 ### Answer
 27 + 11 = **38**
 
 ### Verification
 Pattern: n² + 2
 1² + 2 = 3 ✓
 2² + 2 = 6 ✓
 3² + 2 = 11 ✓
 4² + 2 = 18 ✓
 5² + 2 = 27 ✓
 6² + 2 = **38** ✓`,
   },
   {
     id: 127,
     title: "Visual Pattern - Rotation",
     text: "A figure rotates 45° clockwise each step. After 8 steps, what's the orientation?",
     difficulty: "Easy",
     categoryId: "pattern",
     type: "logical",
     answer: `## Rotation Pattern
 
 ### Given
 - Rotation: 45° clockwise per step
 - Steps: 8
 
 ### Calculation
 Total rotation = 45° × 8 = 360°
 
 ### Result
 360° = Full circle = **Back to original orientation**
 
 ### Note
 - 90° × 4 = 360° (4 steps for right angle)
 - 45° × 8 = 360° (8 steps for half right angle)
 - 60° × 6 = 360° (6 steps)`,
   },
   {
     id: 128,
     title: "Triangular Number Pattern",
     text: "Find next: 1, 3, 6, 10, 15, ?",
     difficulty: "Easy",
     categoryId: "pattern",
     type: "logical",
     answer: `## Triangular Numbers
 
 ### Pattern: 1, 3, 6, 10, 15, ?
 
 ### Differences
 - 3 - 1 = 2
 - 6 - 3 = 3
 - 10 - 6 = 4
 - 15 - 10 = 5
 - ? - 15 = 6
 
 ### Answer: **21**
 
 ### Formula
 Triangular number = n(n+1)/2
 
 For n=6: 6×7/2 = 21 ✓
 
 ### Visual (Dots in Triangle)
 \`\`\`
 •          1
 • •        3
 • • •      6
 • • • •    10
 • • • • •  15
 \`\`\``,
   },
   {
     id: 129,
     title: "Multiplication Pattern",
     text: "Find the pattern: 2, 6, 18, 54, ?",
     difficulty: "Easy",
     categoryId: "pattern",
     type: "logical",
     answer: `## Geometric Sequence
 
 ### Pattern: 2, 6, 18, 54, ?
 
 ### Finding Ratio
 - 6 ÷ 2 = 3
 - 18 ÷ 6 = 3
 - 54 ÷ 18 = 3
 
 Common ratio = 3
 
 ### Answer
 54 × 3 = **162**
 
 ### General Formula
 aₙ = 2 × 3^(n-1)
 
 For n=5: 2 × 3⁴ = 2 × 81 = 162 ✓`,
   },
   {
     id: 130,
     title: "Prime Number Pattern",
     text: "Find the next two primes: 2, 3, 5, 7, 11, 13, ?, ?",
     difficulty: "Easy",
     categoryId: "pattern",
     type: "logical",
     answer: `## Prime Number Sequence
 
 ### Given: 2, 3, 5, 7, 11, 13, ?, ?
 
 ### Definition
 Prime = Number divisible only by 1 and itself
 
 ### Finding Next Primes
 After 13:
 - 14 = 2 × 7 ✗
 - 15 = 3 × 5 ✗
 - 16 = 2⁴ ✗
 - 17 = prime ✓
 - 18 = 2 × 9 ✗
 - 19 = prime ✓
 
 ### Answer: **17, 19**
 
 Complete sequence: 2, 3, 5, 7, 11, 13, 17, 19, 23, 29...`,
   },
   {
     id: 131,
     title: "Mixed Operation Pattern",
     text: "Pattern: 1, 2, 6, 24, 120, ?. Find the rule and next number.",
     difficulty: "Medium",
     categoryId: "pattern",
     type: "logical",
     answer: `## Factorial Pattern
 
 ### Given: 1, 2, 6, 24, 120, ?
 
 ### Recognition
 - 1 = 1!
 - 2 = 2!
 - 6 = 3!
 - 24 = 4!
 - 120 = 5!
 - ? = 6!
 
 ### Calculation
 6! = 6 × 5 × 4 × 3 × 2 × 1 = **720**
 
 ### Alternative View
 Multiply by increasing integers:
 1 × 2 = 2
 2 × 3 = 6
 6 × 4 = 24
 24 × 5 = 120
 120 × 6 = 720`,
   },
   {
     id: 132,
     title: "Letter-Number Relation",
     text: "If A=1, B=2, C=3..., find value of FACE",
     difficulty: "Easy",
     categoryId: "pattern",
     type: "calculation",
     answer: `## Letter Value Calculation
 
 ### Letter Values
 - F = 6
 - A = 1
 - C = 3
 - E = 5
 
 ### FACE Value
 = F + A + C + E
 = 6 + 1 + 3 + 5
 = **15**
 
 ### Alternatively (if product is asked)
 = 6 × 1 × 3 × 5 = 90`,
   },
   {
     id: 133,
     title: "Cube Pattern",
     text: "Find next: 1, 8, 27, 64, 125, ?",
     difficulty: "Easy",
     categoryId: "pattern",
     type: "logical",
     answer: `## Cube Numbers
 
 ### Pattern: 1, 8, 27, 64, 125, ?
 
 ### Recognition
 - 1 = 1³
 - 8 = 2³
 - 27 = 3³
 - 64 = 4³
 - 125 = 5³
 - ? = 6³
 
 ### Answer
 6³ = 6 × 6 × 6 = **216**`,
   },
   {
     id: 134,
     title: "Difference of Squares",
     text: "Pattern: 3, 5, 7, 9, 11. These are differences between which sequence's consecutive terms?",
     difficulty: "Medium",
     categoryId: "pattern",
     type: "logical",
     answer: `## Difference Pattern
 
 ### Given Differences: 3, 5, 7, 9, 11 (odd numbers)
 
 ### Finding the Sequence
 Starting with 1:
 - 1
 - 1 + 3 = 4
 - 4 + 5 = 9
 - 9 + 7 = 16
 - 16 + 9 = 25
 - 25 + 11 = 36
 
 ### Answer
 The sequence is: **1, 4, 9, 16, 25, 36**
 
 These are **perfect squares** (1², 2², 3², 4², 5², 6²)
 
 ### Property
 Difference between consecutive squares:
 n² - (n-1)² = 2n - 1 (odd numbers)`,
   },
   {
     id: 135,
     title: "Double Pattern",
     text: "Two interwoven series: 2, 3, 4, 9, 8, 27, 16, ?",
     difficulty: "Medium",
     categoryId: "pattern",
     type: "logical",
     answer: `## Interwoven Series
 
 ### Given: 2, 3, 4, 9, 8, 27, 16, ?
 
 ### Separating Two Series
 **Odd positions**: 2, 4, 8, 16
 Pattern: Powers of 2 (2¹, 2², 2³, 2⁴)
 
 **Even positions**: 3, 9, 27, ?
 Pattern: Powers of 3 (3¹, 3², 3³, 3⁴)
 
 ### Answer
 Next even position = 3⁴ = **81**
 
 Complete sequence: 2, 3, 4, 9, 8, 27, 16, **81**`,
   },
   {
     id: 136,
     title: "Reverse Pattern",
     text: "Find next: 1, 11, 21, 1211, 111221, ?",
     difficulty: "Hard",
     categoryId: "pattern",
     type: "logical",
     answer: `## Look-and-Say Sequence
 
 ### Pattern: 1, 11, 21, 1211, 111221, ?
 
 ### Rule
 Each term describes the previous term:
 - 1 → "one 1" → 11
 - 11 → "two 1s" → 21
 - 21 → "one 2, one 1" → 1211
 - 1211 → "one 1, one 2, two 1s" → 111221
 - 111221 → "three 1s, two 2s, one 1" → **312211**
 
 ### Answer: **312211**
 
 This is John Conway's famous "Look-and-Say" sequence!`,
   },
   {
     id: 137,
     title: "Position Value Pattern",
     text: "In pattern: 1, 4, 27, 256, ?. Find the relationship with position.",
     difficulty: "Medium",
     categoryId: "pattern",
     type: "logical",
     answer: `## Position-Value Pattern
 
 ### Given: 1, 4, 27, 256, ?
 
 ### Pattern Analysis
 - Position 1: 1 = 1¹
 - Position 2: 4 = 2²
 - Position 3: 27 = 3³
 - Position 4: 256 = 4⁴
 - Position 5: ? = 5⁵
 
 ### Answer
 5⁵ = 5 × 5 × 5 × 5 × 5 = **3125**
 
 ### Formula
 aₙ = nⁿ (n raised to power n)`,
   },
   {
     id: 138,
     title: "Skip Counting Pattern",
     text: "Pattern: 5, 10, 20, 35, 55, ?",
     difficulty: "Medium",
     categoryId: "pattern",
     type: "logical",
     answer: `## Skip Counting
 
 ### Pattern: 5, 10, 20, 35, 55, ?
 
 ### First Differences
 - 10 - 5 = 5
 - 20 - 10 = 10
 - 35 - 20 = 15
 - 55 - 35 = 20
 - ? - 55 = 25
 
 ### Second Difference
 Differences increase by 5 each time
 
 ### Answer
 55 + 25 = **80**
 
 ### Alternative View
 Pattern = 5 × Triangular numbers
 5×1, 5×2, 5×4, 5×7, 5×11, 5×16 = 5, 10, 20, 35, 55, 80`,
   },
   {
     id: 139,
     title: "Cyclic Pattern",
     text: "Pattern: A, C, F, J, O, ?. Each step adds increasing values.",
     difficulty: "Medium",
     categoryId: "pattern",
     type: "logical",
     answer: `## Cyclic Letter Pattern
 
 ### Pattern: A, C, F, J, O, ?
 
 ### Position Analysis
 - A = 1
 - C = 3 (+2)
 - F = 6 (+3)
 - J = 10 (+4)
 - O = 15 (+5)
 - ? = 21 (+6)
 
 ### Finding 21st Letter
 21 corresponds to **U**
 
 ### Answer: **U**
 
 Note: These are triangular number positions!
 1, 3, 6, 10, 15, 21...`,
   },
   {
     id: 140,
     title: "Binary Pattern",
     text: "Decimal sequence: 1, 10, 11, 100, 101. What's next in this pattern?",
     difficulty: "Medium",
     categoryId: "pattern",
     type: "logical",
     answer: `## Binary Counting
 
 ### Pattern: 1, 10, 11, 100, 101
 
 ### Recognition
 These are binary representations of 1, 2, 3, 4, 5
 
 - 1 (binary) = 1 (decimal)
 - 10 (binary) = 2 (decimal)
 - 11 (binary) = 3 (decimal)
 - 100 (binary) = 4 (decimal)
 - 101 (binary) = 5 (decimal)
 - **110** (binary) = 6 (decimal)
 
 ### Answer: **110**
 
 Next few: 111 (7), 1000 (8), 1001 (9)...`,
   },
   {
     id: 141,
     title: "Arithmetic-Geometric Mixed",
     text: "Pattern: 2, 4, 12, 48, ?. Find the rule.",
     difficulty: "Medium",
     categoryId: "pattern",
     type: "logical",
     answer: `## Mixed Pattern
 
 ### Pattern: 2, 4, 12, 48, ?
 
 ### Finding Multipliers
 - 4 ÷ 2 = 2 (×2)
 - 12 ÷ 4 = 3 (×3)
 - 48 ÷ 12 = 4 (×4)
 - ? ÷ 48 = 5 (×5)
 
 ### Answer
 48 × 5 = **240**
 
 ### Rule
 Each term = Previous term × (position number)
 
 Verification:
 2 × 2 = 4 ✓
 4 × 3 = 12 ✓
 12 × 4 = 48 ✓
 48 × 5 = 240 ✓`,
   },
   {
     id: 142,
     title: "Sum Pattern",
     text: "If a + b = 10, b + c = 15, c + a = 17, find a + b + c",
     difficulty: "Medium",
     categoryId: "pattern",
     type: "calculation",
     answer: `## System of Equations
 
 ### Given
 - a + b = 10 ... (1)
 - b + c = 15 ... (2)
 - c + a = 17 ... (3)
 
 ### Solution
 Adding all three:
 (a + b) + (b + c) + (c + a) = 10 + 15 + 17
 2a + 2b + 2c = 42
 a + b + c = **21**
 
 ### Finding Individual Values
 From a + b + c = 21:
 - c = 21 - 10 = 11
 - a = 21 - 15 = 6
 - b = 21 - 17 = 4
 
 ### Verification
 6 + 4 = 10 ✓
 4 + 11 = 15 ✓
 11 + 6 = 17 ✓`,
   },
   {
     id: 143,
     title: "Hexagonal Numbers",
     text: "Pattern: 1, 6, 15, 28, ?. These form hexagonal shapes. Find next.",
     difficulty: "Hard",
     categoryId: "pattern",
     type: "logical",
     answer: `## Hexagonal Numbers
 
 ### Pattern: 1, 6, 15, 28, ?
 
 ### Differences
 - 6 - 1 = 5
 - 15 - 6 = 9
 - 28 - 15 = 13
 - ? - 28 = 17
 
 Second difference: 4 (constant)
 
 ### Answer
 28 + 17 = **45**
 
 ### Formula
 Hexagonal number = n(2n - 1)
 For n=5: 5 × 9 = 45 ✓`,
   },
   {
     id: 144,
     title: "Matrix Pattern",
     text: "| 2 | 4 | 8 |\n| 3 | 9 | 27 |\n| 4 | 16 | ? |",
     difficulty: "Easy",
     categoryId: "pattern",
     type: "logical",
     answer: `## Matrix Pattern
 
 ### Given
 | 2 | 4 | 8 |
 | 3 | 9 | 27 |
 | 4 | 16 | ? |
 
 ### Row Pattern
 - Row 1: 2¹, 2², 2³
 - Row 2: 3¹, 3², 3³
 - Row 3: 4¹, 4², 4³
 
 ### Answer
 4³ = **64**
 
 ### Pattern
 Each row shows first three powers of that row number.`,
   },
   {
     id: 145,
     title: "Catalan Numbers",
     text: "Pattern: 1, 1, 2, 5, 14, 42, ?. These count certain bracket combinations.",
     difficulty: "Hard",
     categoryId: "pattern",
     type: "logical",
     answer: `## Catalan Numbers
 
 ### Pattern: 1, 1, 2, 5, 14, 42, ?
 
 ### Formula
 Cₙ = C(2n, n) / (n + 1)
 
 Or recursively:
 Cₙ₊₁ = Cₙ × 2(2n + 1) / (n + 2)
 
 ### Calculation
 C₆ = C₅ × 2(11) / 7
 = 42 × 22 / 7
 = 924 / 7
 = **132**
 
 ### Answer: **132**
 
 Catalan numbers count:
 - Valid parentheses combinations
 - Binary tree structures
 - Polygon triangulations`,
   },
   {
     id: 146,
     title: "Doubling Plus One",
     text: "Pattern: 1, 3, 7, 15, 31, ?",
     difficulty: "Easy",
     categoryId: "pattern",
     type: "logical",
     answer: `## Doubling Pattern
 
 ### Pattern: 1, 3, 7, 15, 31, ?
 
 ### Rule
 Each term = Previous term × 2 + 1
 
 - 1 × 2 + 1 = 3 ✓
 - 3 × 2 + 1 = 7 ✓
 - 7 × 2 + 1 = 15 ✓
 - 15 × 2 + 1 = 31 ✓
 - 31 × 2 + 1 = **63**
 
 ### Alternative View
 These are 2ⁿ - 1:
 2¹-1=1, 2²-1=3, 2³-1=7, 2⁴-1=15, 2⁵-1=31, 2⁶-1=**63**
 
 (Mersenne numbers)`,
   },
   {
     id: 147,
     title: "Circular Sequence",
     text: "In a circle: 1, 2, 4, 7, 11, 16, 22, 29... If we continue, what's position 10?",
     difficulty: "Medium",
     categoryId: "pattern",
     type: "logical",
     answer: `## Sequence Extension
 
 ### Pattern: 1, 2, 4, 7, 11, 16, 22, 29...
 
 ### Differences
 +1, +2, +3, +4, +5, +6, +7...
 
 ### Continuing
 Position 8: 29
 Position 9: 29 + 8 = 37
 Position 10: 37 + 9 = **46**
 
 ### Formula
 aₙ = 1 + n(n-1)/2
 For n=10: 1 + 10(9)/2 = 1 + 45 = **46**`,
   },
   {
     id: 148,
     title: "Pentagonal Numbers",
     text: "Pattern: 1, 5, 12, 22, 35, ?",
     difficulty: "Medium",
     categoryId: "pattern",
     type: "logical",
     answer: `## Pentagonal Numbers
 
 ### Pattern: 1, 5, 12, 22, 35, ?
 
 ### Differences
 - 5 - 1 = 4
 - 12 - 5 = 7
 - 22 - 12 = 10
 - 35 - 22 = 13
 - ? - 35 = 16
 
 Differences increase by 3
 
 ### Answer
 35 + 16 = **51**
 
 ### Formula
 Pentagonal = n(3n - 1)/2
 For n=6: 6(17)/2 = 51 ✓`,
   },
   {
     id: 149,
     title: "Power Sum Pattern",
     text: "Pattern: 2, 5, 14, 41, ?. Each term = 3 × previous - 1.",
     difficulty: "Medium",
     categoryId: "pattern",
     type: "logical",
     answer: `## Power Sum Pattern
 
 ### Pattern: 2, 5, 14, 41, ?
 
 ### Rule Verification
 - 3 × 2 - 1 = 5 ✓
 - 3 × 5 - 1 = 14 ✓
 - 3 × 14 - 1 = 41 ✓
 - 3 × 41 - 1 = **122**
 
 ### Answer: **122**
 
 ### Alternative Formula
 aₙ = (3ⁿ + 1) / 2
 For n=5: (243 + 1)/2 = 122 ✓`,
   },
   {
     id: 150,
     title: "Alternating Operations",
     text: "Pattern: 2, 6, 4, 12, 10, 30, 28, ?",
     difficulty: "Medium",
     categoryId: "pattern",
     type: "logical",
     answer: `## Alternating Operations
 
 ### Pattern: 2, 6, 4, 12, 10, 30, 28, ?
 
 ### Operations
 - 2 × 3 = 6
 - 6 - 2 = 4
 - 4 × 3 = 12
 - 12 - 2 = 10
 - 10 × 3 = 30
 - 30 - 2 = 28
 - 28 × 3 = **84**
 
 ### Answer: **84**
 
 Pattern: ×3, -2, ×3, -2, ×3, -2, ×3...`,
   },
   // Advanced Puzzles and Brain Teasers (151-205)
   {
     id: 151,
     title: "The Two Egg Problem",
     text: "You have 2 eggs and a 100-floor building. Find the minimum number of drops needed to determine the critical floor (where eggs break) in the worst case.",
     difficulty: "Hard",
     categoryId: "puzzles",
     type: "logical",
     answer: `## The Two Egg Problem
 
 ### Problem Analysis
 With 2 eggs, we need a strategy that minimizes worst-case drops.
 
 ### Optimal Strategy
 Use decreasing intervals: 14, 13, 12, 11...
 
 ### Why 14?
 If first egg breaks at floor 14:
 - Test floors 1-13 with second egg = 13 drops
 - Total = 1 + 13 = 14 drops
 
 If first egg doesn't break:
 - Jump to floor 27 (14 + 13)
 - If breaks: test 15-26 = 12 drops, Total = 2 + 12 = 14
 
 ### Formula
 n(n+1)/2 ≥ 100
 n = 14 (since 14×15/2 = 105 ≥ 100)
 
 ### Answer: **14 drops minimum in worst case**`,
     options: [
       { text: "10 drops", isCorrect: false },
       { text: "14 drops", isCorrect: true },
       { text: "50 drops", isCorrect: false },
       { text: "7 drops", isCorrect: false },
     ],
   },
   {
     id: 152,
     title: "Light Bulb and Switches",
     text: "You're outside a room with 3 light switches. Inside is 1 bulb. You can enter the room only once. How do you determine which switch controls the bulb?",
     difficulty: "Medium",
     categoryId: "puzzles",
     type: "logical",
     answer: `## Light Bulb and Switches
 
 ### Solution
 Use heat as additional information!
 
 ### Steps
 1. Turn Switch 1 ON for 10 minutes
 2. Turn Switch 1 OFF
 3. Turn Switch 2 ON
 4. Enter the room
 
 ### Observations
 - **Bulb ON** → Switch 2
 - **Bulb OFF and WARM** → Switch 1
 - **Bulb OFF and COLD** → Switch 3
 
 ### Key Insight
 Light bulbs generate heat when on. This gives us a third state beyond just on/off.
 
 ### Answer: Use heat to identify the switch that was previously on`,
     options: [
       { text: "Try each switch one by one", isCorrect: false },
       { text: "Use heat from the bulb as a clue", isCorrect: true },
       { text: "It's impossible with one entry", isCorrect: false },
       { text: "Ask someone inside the room", isCorrect: false },
     ],
   },
   {
     id: 153,
     title: "The Poisoned Wine",
     text: "You have 1000 wine bottles, one is poisoned. You have 10 prisoners to test. Poison kills in exactly 24 hours. How do you find the poisoned bottle in one round?",
     difficulty: "Hard",
     categoryId: "puzzles",
     type: "logical",
     answer: `## The Poisoned Wine Problem
 
 ### Solution: Binary Encoding
 
 With 10 prisoners, we can test 2^10 = 1024 bottles.
 
 ### Method
 1. Number bottles 0-999 in binary
 2. Prisoner i drinks from all bottles where bit i is 1
 
 ### Example
 Bottle 537 = 1000011001 in binary
 Prisoners 0, 3, 4, 9 drink from it
 
 ### After 24 hours
 If prisoners 0, 3, 4, 9 die → Bottle 537 is poisoned
 
 ### Reading the result
 Dead prisoners form the binary number of the poisoned bottle.
 
 ### Answer: **Use binary encoding with each prisoner representing one bit**`,
     options: [
       { text: "Each prisoner tests 100 bottles", isCorrect: false },
       { text: "Use binary encoding - each prisoner is one bit", isCorrect: true },
       { text: "Divide bottles into 10 groups", isCorrect: false },
       { text: "It requires at least 500 prisoners", isCorrect: false },
     ],
   },
   {
     id: 154,
     title: "Bridge and Torch Problem",
     text: "Four people must cross a bridge at night with one torch. Bridge holds max 2 people. Crossing times: 1, 2, 5, 10 minutes. What's the minimum total time?",
     difficulty: "Hard",
     categoryId: "puzzles",
     type: "logical",
     answer: `## Bridge and Torch Problem
 
 ### People: A(1min), B(2min), C(5min), D(10min)
 
 ### Optimal Strategy
 1. A and B cross → 2 min
 2. A returns with torch → 1 min
 3. C and D cross → 10 min
 4. B returns with torch → 2 min
 5. A and B cross → 2 min
 
 **Total: 2 + 1 + 10 + 2 + 2 = 17 minutes**
 
 ### Why not send fastest as escort each time?
 That gives: 2+1+5+1+10 = 19 minutes
 
 ### Key Insight
 Send the two slowest together to avoid counting both times separately.
 
 ### Answer: **17 minutes**`,
     options: [
       { text: "15 minutes", isCorrect: false },
       { text: "17 minutes", isCorrect: true },
       { text: "19 minutes", isCorrect: false },
       { text: "21 minutes", isCorrect: false },
     ],
   },
   {
     id: 155,
     title: "Monty Hall Problem",
     text: "You pick door 1 of 3 doors (one has a car). Host opens door 3 (shows goat). Should you switch to door 2?",
     difficulty: "Medium",
     categoryId: "puzzles",
     type: "logical",
     answer: `## Monty Hall Problem
 
 ### Initial Setup
 - 3 doors: 1 car, 2 goats
 - You pick door 1 (1/3 chance of car)
 - Host opens a door with a goat
 
 ### Probability Analysis
 
 **If you STAY:**
 - Win if car was behind door 1: P = 1/3
 
 **If you SWITCH:**
 - Win if car was behind door 2 or 3: P = 2/3
 
 ### Why?
 Host's action doesn't change your initial 1/3 probability.
 The remaining 2/3 probability concentrates on the other door.
 
 ### Answer: **Yes, always switch! Probability doubles from 1/3 to 2/3**`,
     options: [
       { text: "Stay - same probability either way", isCorrect: false },
       { text: "Switch - doubles your chances to 2/3", isCorrect: true },
       { text: "Doesn't matter - it's always 50-50", isCorrect: false },
       { text: "Stay - host is trying to trick you", isCorrect: false },
     ],
   },
   {
     id: 156,
     title: "Pirates and Gold Coins",
     text: "5 pirates divide 100 gold coins. They vote on proposals. If rejected, the proposer is thrown overboard. What does Pirate 1 (most senior) propose?",
     difficulty: "Hard",
     categoryId: "puzzles",
     type: "logical",
     answer: `## Pirates and Gold Coins
 
 ### Rules
 - Pirates vote on division proposals
 - 50%+ needed to pass
 - If rejected, proposer is eliminated
 - Pirates are logical and greedy
 
 ### Working Backwards
 
 **2 pirates left:** P4 proposes 100-0, votes for self, wins
 
 **3 pirates left:** P3 proposes 99-0-1
 (P5 gets 1, better than 0 if P3 dies)
 
 **4 pirates left:** P2 proposes 99-0-1-0
 (P4 gets 1, P5 gets 0 but P4 accepting means it passes)
 
 **5 pirates:** P1 proposes 98-0-1-0-1
 (P3 and P5 get 1 each, better than what they'd get otherwise)
 
 ### Answer: **P1: 98, P2: 0, P3: 1, P4: 0, P5: 1**`,
     options: [
       { text: "20 coins each", isCorrect: false },
       { text: "98-0-1-0-1 distribution", isCorrect: true },
       { text: "100-0-0-0-0 (all to P1)", isCorrect: false },
       { text: "33-33-34-0-0 distribution", isCorrect: false },
     ],
   },
   {
     id: 157,
     title: "100 Prisoners and Light Bulb",
     text: "100 prisoners, 1 room with a light bulb. Each day a random prisoner enters. They must eventually declare 'all have visited' or all die. Strategy?",
     difficulty: "Hard",
     categoryId: "puzzles",
     type: "logical",
     answer: `## 100 Prisoners and Light Bulb
 
 ### Strategy
 Designate one "Counter" prisoner.
 
 ### Rules
 **Regular prisoners:**
 - If bulb OFF and haven't turned it on before → turn ON
 - Otherwise, do nothing
 
 **Counter:**
 - If bulb ON → turn OFF and increment count
 - When count reaches 99 → declare "all have visited"
 
 ### Why it works
 - Each prisoner turns bulb on exactly once
 - Counter counts each unique visitor
 - When counter reaches 99 + himself = 100
 
 ### Expected Time
 Very long! Approximately 10,000+ days on average.
 
 ### Answer: **Use a designated counter who counts when others signal**`,
     options: [
       { text: "Everyone turns light on when they enter", isCorrect: false },
       { text: "Designate one counter who counts others' signals", isCorrect: true },
       { text: "Use Morse code with the light", isCorrect: false },
       { text: "It's impossible to solve", isCorrect: false },
     ],
   },
   {
     id: 158,
     title: "Hat Color Puzzle",
     text: "100 people in a line, each with a black or white hat. Each sees all hats in front. Starting from back, each guesses own hat color. Maximize guaranteed survivors.",
     difficulty: "Hard",
     categoryId: "puzzles",
     type: "logical",
     answer: `## Hat Color Puzzle
 
 ### Strategy
 Use parity (odd/even count)!
 
 ### Method
 1. Last person counts black hats visible
 2. Says "Black" if odd, "White" if even
 3. Each subsequent person tracks the parity
 
 ### How it works
 - Person N-1 sees all hats except their own
 - Knows initial parity from person N's answer
 - Computes own hat color from difference
 
 ### Example
 N says "Black" (odd black hats ahead)
 N-1 sees even black hats → their hat is BLACK
 
 ### Result
 - Person N: 50% chance (sacrifices for team)
 - Persons 1 to N-1: 100% correct
 
 ### Answer: **99 guaranteed survivors using parity**`,
     options: [
       { text: "50 survivors on average", isCorrect: false },
       { text: "99 guaranteed using parity", isCorrect: true },
       { text: "All 100 can be saved", isCorrect: false },
       { text: "Only 1 can be guaranteed", isCorrect: false },
     ],
   },
   {
     id: 159,
     title: "Blue Eyes Puzzle",
     text: "On an island, 100 people have blue eyes, 100 have brown. All can see others but not themselves. If anyone deduces their eye color, they must leave at midnight. An oracle says 'I see blue eyes.' What happens?",
     difficulty: "Hard",
     categoryId: "puzzles",
     type: "logical",
     answer: `## Blue Eyes Puzzle
 
 ### The Setup
 - 100 blue-eyed, 100 brown-eyed people
 - Everyone sees everyone else's eyes
 - Cannot see own eyes or communicate
 - Must leave at midnight if you deduce your color
 
 ### Common Knowledge
 The oracle's statement creates "common knowledge."
 
 ### Induction
 **1 blue:** Leaves night 1 (sees no blue, deduces own)
 **2 blue:** Each sees 1 blue, expects them to leave night 1.
            When they don't, both deduce own blue → leave night 2
 **n blue:** All leave on night n
 
 ### Answer
 **All 100 blue-eyed people leave on night 100**
 
 ### Key Insight
 The oracle provides "common knowledge" that allows synchronized reasoning.`,
     options: [
       { text: "Nothing happens - everyone already knows", isCorrect: false },
       { text: "All blue-eyed leave on night 100", isCorrect: true },
       { text: "One person leaves immediately", isCorrect: false },
       { text: "All 200 people leave together", isCorrect: false },
     ],
   },
   {
     id: 160,
     title: "Airplane Fuel Problem",
     text: "Planes can fly halfway around the world on a full tank. Fuel is transferable mid-air. How many planes minimum to get one around the world?",
     difficulty: "Hard",
     categoryId: "puzzles",
     type: "logical",
     answer: `## Airplane Fuel Problem
 
 ### Constraints
 - Each plane holds fuel for 180° (halfway around)
 - Fuel can be transferred mid-flight
 - All planes start from same point
 
 ### Solution with 3 planes
 Let circumference = 360 units
 
 **Phase 1: Outbound support**
 - All 3 depart, at 60° point:
 - Plane C transfers 60 to A & B, returns
 - At 90°: Plane B gives 45 to A, returns
 - A continues to 180° with full tank
 
 **Phase 2: Return support**
 - C refuels, meets A at 270°
 - B refuels, meets both at 300°
 - All return together
 
 ### Answer: **Minimum 3 planes needed**`,
     options: [
       { text: "2 planes", isCorrect: false },
       { text: "3 planes", isCorrect: true },
       { text: "4 planes", isCorrect: false },
       { text: "5 planes", isCorrect: false },
     ],
   },
   {
     id: 161,
     title: "Counterfeit Coin - 12 Coins",
     text: "12 coins, one is counterfeit (lighter OR heavier). Using a balance scale 3 times, find the counterfeit and determine if it's heavier or lighter.",
     difficulty: "Hard",
     categoryId: "puzzles",
     type: "logical",
     answer: `## 12 Coins Problem
 
 ### Key Insight
 3 weighings give 3³ = 27 outcomes
 12 coins × 2 possibilities = 24 outcomes (fits!)
 
 ### Strategy
 Label coins 1-12
 
 **Weighing 1:** 1234 vs 5678
 
 **If balanced:** Counterfeit is in 9-12
 - Weigh 9,10,11 vs 1,2,3 (known good)
 - Third weighing isolates the fake
 
 **If unbalanced:** Track which side was heavy
 - Rearrange suspects across both sides
 - Use elimination logic
 
 ### Method
 Divide into 3 groups, track "heavy" and "light" suspects.
 
 ### Answer: **Systematic elimination using balanced outcomes**`,
     options: [
       { text: "Divide into 2 groups each time", isCorrect: false },
       { text: "Divide into 3 groups, track heavy/light suspects", isCorrect: true },
       { text: "It requires 4 weighings minimum", isCorrect: false },
       { text: "Weigh each coin individually", isCorrect: false },
     ],
   },
   {
     id: 162,
     title: "Knights and Knaves",
     text: "On an island, Knights always tell truth, Knaves always lie. A says 'B is a knave.' B says 'A and I are of the same type.' What are they?",
     difficulty: "Medium",
     categoryId: "puzzles",
     type: "logical",
     answer: `## Knights and Knaves
 
 ### Statements
 - A: "B is a knave"
 - B: "A and I are the same type"
 
 ### Case Analysis
 
 **Case 1: A is a Knight (truth-teller)**
 - A's statement true → B is a Knave
 - B is a Knave → B lies
 - B says "same type" but that's false → A≠B ✓
 - Consistent!
 
 **Case 2: A is a Knave (liar)**
 - A's statement false → B is a Knight
 - B tells truth → A and B same type
 - But A=Knave, B=Knight → different types
 - Contradiction!
 
 ### Answer: **A is a Knight, B is a Knave**`,
     options: [
       { text: "Both are Knights", isCorrect: false },
       { text: "Both are Knaves", isCorrect: false },
       { text: "A is Knight, B is Knave", isCorrect: true },
       { text: "A is Knave, B is Knight", isCorrect: false },
     ],
   },
   {
     id: 163,
     title: "River Crossing - Wolf, Goat, Cabbage",
     text: "A farmer must cross a river with a wolf, goat, and cabbage. Boat fits farmer + 1 item. Wolf eats goat if left alone; goat eats cabbage. Minimum crossings?",
     difficulty: "Easy",
     categoryId: "puzzles",
     type: "logical",
     answer: `## River Crossing Puzzle
 
 ### Constraints
 - Wolf + Goat alone = Wolf eats Goat
 - Goat + Cabbage alone = Goat eats Cabbage
 - Farmer must row the boat
 
 ### Solution (7 crossings)
 1. Farmer takes Goat across →
 2. Farmer returns alone ←
 3. Farmer takes Wolf across →
 4. Farmer returns with Goat ← (key move!)
 5. Farmer takes Cabbage across →
 6. Farmer returns alone ←
 7. Farmer takes Goat across →
 
 ### Key Insight
 The goat cannot be left with either, so it must make extra trips.
 
 ### Answer: **7 crossings minimum**`,
     options: [
       { text: "5 crossings", isCorrect: false },
       { text: "7 crossings", isCorrect: true },
       { text: "9 crossings", isCorrect: false },
       { text: "It's impossible", isCorrect: false },
     ],
   },
   {
     id: 164,
     title: "The Locker Problem",
     text: "100 lockers, all closed. Student 1 opens all. Student 2 toggles every 2nd locker. Student 3 toggles every 3rd... After student 100, which lockers are open?",
     difficulty: "Medium",
     categoryId: "puzzles",
     type: "logical",
     answer: `## The Locker Problem
 
 ### Key Insight
 A locker is toggled once for each of its divisors.
 
 ### Odd vs Even Divisors
 - Most numbers have even number of divisors
 - Example: 12 → divisors 1,2,3,4,6,12 (6 divisors, ends closed)
 
 **Perfect squares have ODD number of divisors!**
 - Example: 9 → divisors 1,3,9 (3 divisors, ends open)
 
 ### Why?
 Divisors come in pairs: d × (n/d) = n
 Except when d = n/d (i.e., n is a perfect square)
 
 ### Answer
 Open lockers: 1, 4, 9, 16, 25, 36, 49, 64, 81, 100
 
 **10 lockers remain open (the perfect squares)**`,
     options: [
       { text: "All 100 are open", isCorrect: false },
       { text: "50 are open (every other)", isCorrect: false },
       { text: "10 are open (perfect squares only)", isCorrect: true },
       { text: "None are open", isCorrect: false },
     ],
   },
   {
     id: 165,
     title: "Burning Rope Timer",
     text: "Two ropes each burn in exactly 60 minutes but non-uniformly. How do you measure exactly 45 minutes?",
     difficulty: "Medium",
     categoryId: "puzzles",
     type: "logical",
     answer: `## Burning Rope Timer
 
 ### Challenge
 Ropes burn non-uniformly (half rope ≠ 30 min)
 
 ### Solution
 
 **At t=0:**
 - Light Rope A from BOTH ends
 - Light Rope B from ONE end
 
 **At t=30min:**
 - Rope A finishes (burns from both ends = half time)
 - Immediately light other end of Rope B
 
 **At t=45min:**
 - Rope B finishes (had 30min left, now burns from both ends = 15min more)
 
 ### Why it works
 - Rope A: 60/2 = 30 min
 - Rope B remaining: 30/2 = 15 min
 - Total: 30 + 15 = **45 minutes**`,
     options: [
       { text: "Cut the ropes into pieces", isCorrect: false },
       { text: "Light Rope A from both ends, then light B's other end when A finishes", isCorrect: true },
       { text: "Light both ropes from one end and estimate", isCorrect: false },
       { text: "It's impossible with non-uniform ropes", isCorrect: false },
     ],
   },
   {
     id: 166,
     title: "Infinite Hotel Paradox",
     text: "A hotel with infinite rooms (all full) gets a new guest. How do you accommodate them without kicking anyone out?",
     difficulty: "Medium",
     categoryId: "puzzles",
     type: "logical",
     answer: `## Infinite Hotel Paradox (Hilbert's Hotel)
 
 ### The Problem
 ∞ rooms, ∞ guests, all rooms occupied
 
 ### Solution for 1 new guest
 Move each guest from room n to room n+1
 - Guest in room 1 → room 2
 - Guest in room 2 → room 3
 - And so on...
 - Room 1 is now free for new guest!
 
 ### For infinite new guests
 Move each guest from room n to room 2n
 - All odd-numbered rooms become free!
 
 ### Key Insight
 This is possible because ∞ + 1 = ∞
 The set of natural numbers has the same size as the set of even numbers.
 
 ### Answer: **Shift everyone to the next room**`,
     options: [
       { text: "Build more rooms", isCorrect: false },
       { text: "Move each guest from room n to room n+1", isCorrect: true },
       { text: "It's impossible - hotel is full", isCorrect: false },
       { text: "Ask someone to share a room", isCorrect: false },
     ],
   },
   {
     id: 167,
     title: "Three Ants on Triangle",
     text: "Three ants on vertices of an equilateral triangle. Each picks a random direction along an edge. What's the probability of no collision?",
     difficulty: "Medium",
     categoryId: "puzzles",
     type: "calculation",
     answer: `## Three Ants on Triangle
 
 ### Setup
 - 3 ants at vertices A, B, C
 - Each independently chooses clockwise or counterclockwise
 
 ### Total outcomes
 Each ant has 2 choices: 2³ = 8 total outcomes
 
 ### No collision cases
 All move clockwise: CCC (1 way)
 All move counterclockwise: CCC' (1 way)
 
 ### Collision cases
 All other combinations (6 ways)
 
 ### Probability of NO collision
 P = 2/8 = 1/4 = **25%**
 
 ### Probability of collision
 P = 6/8 = 3/4 = **75%**`,
     options: [
       { text: "25%", isCorrect: true },
       { text: "33%", isCorrect: false },
       { text: "50%", isCorrect: false },
       { text: "75%", isCorrect: false },
     ],
   },
   {
     id: 168,
     title: "Birthday Paradox",
     text: "How many people needed in a room for >50% probability that two share a birthday?",
     difficulty: "Medium",
     categoryId: "puzzles",
     type: "calculation",
     answer: `## Birthday Paradox
 
 ### Approach
 Calculate P(no shared birthday), then subtract from 1
 
 ### Formula
 P(no match) = 365/365 × 364/365 × 363/365 × ...
 
 ### For n people
 P(no match) = 365!/[(365-n)! × 365^n]
 
 ### Calculations
 - 22 people: P(match) ≈ 47.6%
 - 23 people: P(match) ≈ 50.7% ✓
 - 50 people: P(match) ≈ 97%
 - 70 people: P(match) ≈ 99.9%
 
 ### Why it's surprising
 We compare pairs, not individuals.
 23 people = 23×22/2 = 253 pairs
 
 ### Answer: **23 people for >50% probability**`,
     options: [
       { text: "23 people", isCorrect: true },
       { text: "50 people", isCorrect: false },
       { text: "100 people", isCorrect: false },
       { text: "183 people", isCorrect: false },
     ],
   },
   {
     id: 169,
     title: "Weighing 8 Balls",
     text: "8 identical balls, one is slightly heavier. Find the heavy ball using a balance scale in minimum weighings.",
     difficulty: "Easy",
     categoryId: "puzzles",
     type: "logical",
     answer: `## Weighing 8 Balls
 
 ### Strategy: Divide into thirds
 
 **Weighing 1:** 3 vs 3 (set aside 2)
 
 **If balanced:**
 Heavy ball is in the 2 set aside
 Weighing 2: Compare those 2 → find heavy
 
 **If unbalanced:**
 Heavy ball in heavier group of 3
 Weighing 2: Compare 2 of those 3
 - If balanced: third is heavy
 - If unbalanced: heavier side has the ball
 
 ### Why this works
 3^2 = 9 > 8 outcomes possible with 2 weighings
 
 ### Answer: **2 weighings minimum**
 
 General formula: ⌈log₃(n)⌉ weighings for n balls`,
     options: [
       { text: "1 weighing", isCorrect: false },
       { text: "2 weighings", isCorrect: true },
       { text: "3 weighings", isCorrect: false },
       { text: "4 weighings", isCorrect: false },
     ],
   },
   {
     id: 170,
     title: "Chessboard and Dominoes",
     text: "A standard 8×8 chessboard with opposite corners removed (62 squares). Can it be covered completely with 31 dominoes (each covers 2 adjacent squares)?",
     difficulty: "Medium",
     categoryId: "puzzles",
     type: "logical",
     answer: `## Chessboard and Dominoes
 
 ### Setup
 - 8×8 board = 64 squares
 - Remove 2 opposite corners = 62 squares
 - Each domino covers 2 squares
 - 31 dominoes needed
 
 ### Key Insight: Coloring argument
 Chessboard alternates black and white squares.
 - Normal: 32 black, 32 white
 - Opposite corners are SAME color!
 - After removal: 30 of one color, 32 of other
 
 ### Why it's impossible
 Each domino covers exactly 1 black + 1 white square.
 31 dominoes would cover 31 black + 31 white.
 But we have 30 + 32 squares!
 
 ### Answer: **Impossible - opposite corners are the same color**`,
     options: [
       { text: "Yes, it can be done", isCorrect: false },
       { text: "No - opposite corners are the same color", isCorrect: true },
       { text: "Only if you use L-shaped pieces", isCorrect: false },
       { text: "Depends on which corners are removed", isCorrect: false },
     ],
   },
   {
     id: 171,
     title: "Handshake Problem",
     text: "At a party, everyone shakes hands with everyone else exactly once. If there were 45 handshakes, how many people attended?",
     difficulty: "Easy",
     categoryId: "puzzles",
     type: "calculation",
     answer: `## Handshake Problem
 
 ### Formula
 Handshakes = n(n-1)/2 (combinations of 2 from n)
 
 ### Solve for n
 n(n-1)/2 = 45
 n(n-1) = 90
 n² - n - 90 = 0
 
 ### Factoring
 (n-10)(n+9) = 0
 n = 10 or n = -9
 
 Since n must be positive: **n = 10**
 
 ### Verification
 10 × 9 / 2 = 45 ✓
 
 ### Answer: **10 people attended**`,
     options: [
       { text: "8 people", isCorrect: false },
       { text: "9 people", isCorrect: false },
       { text: "10 people", isCorrect: true },
       { text: "15 people", isCorrect: false },
     ],
   },
   {
     id: 172,
     title: "Gold Bar Payment",
     text: "You have a 7-segment gold bar to pay a worker 1 segment per day for 7 days. With only 2 cuts allowed, how do you pay exactly 1 segment worth each day?",
     difficulty: "Medium",
     categoryId: "puzzles",
     type: "logical",
     answer: `## Gold Bar Payment
 
 ### Constraint
 - 7 segments needed (1/day × 7 days)
 - Only 2 cuts allowed
 
 ### Solution
 Cut into pieces of 1, 2, and 4 segments
 
 ### Daily Payments (giving and receiving back)
 - Day 1: Give 1-piece
 - Day 2: Give 2-piece, take back 1-piece
 - Day 3: Give 1-piece (worker has 1+2=3)
 - Day 4: Give 4-piece, take back 1+2
 - Day 5: Give 1-piece
 - Day 6: Give 2-piece, take back 1-piece
 - Day 7: Give 1-piece
 
 ### Key Insight
 Binary representation! 1+2+4 = 7
 Any number 1-7 can be made with these pieces.
 
 ### Answer: **Cut into 1, 2, and 4 segment pieces**`,
     options: [
       { text: "Cut into 7 equal pieces", isCorrect: false },
       { text: "Cut into 1, 2, and 4 segment pieces", isCorrect: true },
       { text: "Cut into 1, 1, and 5 segment pieces", isCorrect: false },
       { text: "It's impossible with 2 cuts", isCorrect: false },
     ],
   },
   {
     id: 173,
     title: "Prisoner's Dilemma - Optimal Strategy",
     text: "In iterated Prisoner's Dilemma, what strategy maximizes long-term payoff when playing repeatedly against the same opponent?",
     difficulty: "Hard",
     categoryId: "puzzles",
     type: "logical",
     answer: `## Prisoner's Dilemma - Optimal Strategy
 
 ### Tit-for-Tat Strategy
 
 **Rules:**
 1. Start by cooperating
 2. Then mirror opponent's previous move
 
 ### Why it works
 - **Nice:** Never defects first
 - **Retaliatory:** Punishes defection
 - **Forgiving:** Returns to cooperation
 - **Clear:** Easy for opponent to understand
 
 ### Axelrod's Tournament
 In 1980, Robert Axelrod ran tournaments.
 Tit-for-Tat (submitted by Anatol Rapoport) won!
 
 ### Improvements
 - "Tit-for-Tat with Forgiveness" - occasionally cooperates after defection
 - Avoids endless retaliation cycles
 
 ### Answer: **Tit-for-Tat: Cooperate first, then mirror opponent**`,
     options: [
       { text: "Always defect", isCorrect: false },
       { text: "Always cooperate", isCorrect: false },
       { text: "Tit-for-Tat", isCorrect: true },
       { text: "Random choices", isCorrect: false },
     ],
   },
   {
     id: 174,
     title: "Josephus Problem",
     text: "41 soldiers in a circle. Every 3rd person is eliminated going clockwise. At which position should you stand to survive?",
     difficulty: "Hard",
     categoryId: "puzzles",
     type: "logical",
     answer: `## Josephus Problem (k=3, n=41)
 
 ### Problem
 n=41 people, every k=3rd eliminated
 
 ### Recursive Formula
 J(n,k) = (J(n-1,k) + k) mod n
 J(1,k) = 0
 
 ### For n=41, k=3
 Working through the recursion:
 J(41,3) = 30
 
 ### But positions are 1-indexed!
 Safe position = 30 + 1 = **Position 31**
 
 ### Historical Note
 Flavius Josephus (37-100 CE) reportedly used this to survive a Roman siege.
 
 ### Answer: **Stand at position 31**`,
     options: [
       { text: "Position 1", isCorrect: false },
       { text: "Position 21", isCorrect: false },
       { text: "Position 31", isCorrect: true },
       { text: "Position 41", isCorrect: false },
     ],
   },
   {
     id: 175,
     title: "Two Trains Problem",
     text: "Two trains 100 km apart approach each other at 50 km/h each. A bird flies between them at 75 km/h. How far does the bird fly before trains meet?",
     difficulty: "Medium",
     categoryId: "quantitative",
     type: "calculation",
     answer: `## Two Trains Problem
 
 ### Simple Solution
 Don't track the bird's path!
 
 **Time until trains meet:**
 - Combined speed = 50 + 50 = 100 km/h
 - Distance = 100 km
 - Time = 100/100 = 1 hour
 
 **Bird's total distance:**
 - Bird flies for 1 hour at 75 km/h
 - Distance = 75 × 1 = **75 km**
 
 ### Why the complex approach fails
 Calculating each back-and-forth creates an infinite series.
 The trick is realizing the bird flies for the same total time!
 
 ### Answer: **75 km**
 
 *Famous story: Von Neumann solved this instantly using the "sum the infinite series" method!*`,
     options: [
       { text: "50 km", isCorrect: false },
       { text: "75 km", isCorrect: true },
       { text: "100 km", isCorrect: false },
       { text: "150 km", isCorrect: false },
     ],
   },
   {
     id: 176,
     title: "Sqrt(2) Irrationality",
     text: "Prove that √2 is irrational (cannot be expressed as a fraction).",
     difficulty: "Medium",
     categoryId: "quantitative",
     type: "logical",
     answer: `## Proof: √2 is Irrational
 
 ### Proof by Contradiction
 
 **Assume** √2 = p/q where p,q are integers with no common factors (lowest terms)
 
 **Square both sides:**
 2 = p²/q²
 2q² = p²
 
 **Therefore:** p² is even → p is even
 Let p = 2k
 
 **Substituting:**
 2q² = (2k)² = 4k²
 q² = 2k²
 
 **Therefore:** q² is even → q is even
 
 ### Contradiction!
 Both p and q are even → they share factor 2
 But we said they have no common factors!
 
 ### Conclusion
 Our assumption was wrong.
 **√2 cannot be expressed as p/q**
 **√2 is irrational**`,
     options: [
       { text: "Use decimal expansion", isCorrect: false },
       { text: "Proof by contradiction - both p and q must be even", isCorrect: true },
       { text: "Calculate to many decimal places", isCorrect: false },
       { text: "It is actually rational", isCorrect: false },
     ],
   },
   {
     id: 177,
     title: "Prisoners and Boxes",
     text: "100 prisoners must find their number among 100 boxes. Each opens 50 boxes. All must succeed. Random strategy: 0% chance. What strategy gives ~30% success?",
     difficulty: "Hard",
     categoryId: "puzzles",
     type: "logical",
     answer: `## Prisoners and Boxes (100 Prisoners Problem)
 
 ### The Loop Strategy
 
 **Method:**
 1. Start at box with your number
 2. Open that box
 3. Next, open the box with the number found
 4. Continue following the chain
 
 ### Why it works
 The boxes form permutation cycles.
 - You succeed iff your cycle length ≤ 50
 - All fail iff ANY cycle > 50
 
 ### Probability Analysis
 P(no cycle > 50) ≈ 1 - ln(2) ≈ 31.18%
 
 ### Key Insight
 This correlates everyone's fate - either all in short cycles succeed or all fail.
 
 Random would be: (1/2)^100 ≈ 0%
 
 ### Answer: **Follow the pointer chain - gives ~31% success!**`,
     options: [
       { text: "Open boxes in order 1-50", isCorrect: false },
       { text: "Follow the pointer chain from your box number", isCorrect: true },
       { text: "Open random 50 boxes", isCorrect: false },
       { text: "Coordinate with other prisoners", isCorrect: false },
     ],
   },
   {
     id: 178,
     title: "Sum to 100",
     text: "Using only + and - signs between the digits 123456789, make the total equal to 100. Example: 1+2+3-4+5+6+78+9=100",
     difficulty: "Medium",
     categoryId: "puzzles",
     type: "logical",
     answer: `## Sum to 100 Puzzle
 
 ### Multiple Solutions Exist!
 
 **Solution 1:**
 1+2+3-4+5+6+78+9 = 100 ✓
 
 **Solution 2:**
 12+3-4+5+67+8+9 = 100 ✓
 
 **Solution 3:**
 123-45-67+89 = 100 ✓
 
 **Solution 4:**
 12-3-4+5-6+7+89 = 100 ✓
 
 **Solution 5:**
 1+23-4+56+7+8+9 = 100 ✓
 
 ### Minimum operations
 Using just one + or -:
 123-45-67+89 = 100 (uses 3 signs)
 
 ### Answer: **Multiple solutions, e.g., 123-45-67+89=100**`,
     options: [
       { text: "It's impossible", isCorrect: false },
       { text: "123-45-67+89 = 100", isCorrect: true },
       { text: "Only one solution exists", isCorrect: false },
       { text: "Requires more than + and -", isCorrect: false },
     ],
   },
   {
     id: 179,
     title: "Red and Blue Marbles",
     text: "50 red and 50 blue marbles, 2 jars. Put all marbles in jars, then randomly pick a jar and draw a marble. Maximize probability of drawing red.",
     difficulty: "Medium",
     categoryId: "puzzles",
     type: "calculation",
     answer: `## Red and Blue Marbles
 
 ### Naive approach
 50 red in one jar, 50 blue in other
 P(red) = 1/2 × 1 + 1/2 × 0 = 50%
 
 ### Optimal Strategy
 - Jar 1: 1 red marble
 - Jar 2: 49 red + 50 blue = 99 marbles
 
 ### Probability Calculation
 P(red) = P(jar 1) × P(red|jar 1) + P(jar 2) × P(red|jar 2)
 = 1/2 × 1 + 1/2 × (49/99)
 = 0.5 + 0.2475
 = **74.75%**
 
 ### Why this works
 Guaranteeing red from one jar while still having good odds from the other.
 
 ### Answer: **~74.75% by putting 1 red in one jar, rest in other**`,
     options: [
       { text: "50%", isCorrect: false },
       { text: "66%", isCorrect: false },
       { text: "74.75%", isCorrect: true },
       { text: "100%", isCorrect: false },
     ],
   },
   {
     id: 180,
     title: "Cake Cutting for 3",
     text: "How can 3 people divide a cake fairly so each person believes they got at least 1/3?",
     difficulty: "Medium",
     categoryId: "puzzles",
     type: "logical",
     answer: `## Fair Cake Cutting - 3 People
 
 ### "Moving Knife" Method
 
 **Procedure:**
 1. Person A slowly moves a knife from left to right
 2. Anyone who thinks it's at 1/3 point calls "stop"
 3. That person gets the left piece
 4. Remaining 2 use "I cut, you choose" for the rest
 
 ### Alternative: Trimming Method
 
 1. A cuts cake into 3 "equal" pieces
 2. B can trim any piece they think is too big
 3. C chooses first
 4. If C didn't take trimmed piece, B must take it
 5. A takes last piece
 6. Trimmings divided by trimmer and piece-taker
 
 ### Fairness Guarantee
 Each person gets a piece they value at ≥ 1/3
 
 ### Answer: **Moving knife or Stromquist moving knife protocol**`,
     options: [
       { text: "Have one person cut into 3 pieces, others choose", isCorrect: false },
       { text: "Moving knife method - first to call stop takes piece", isCorrect: true },
       { text: "Use a measuring device", isCorrect: false },
       { text: "It's impossible fairly", isCorrect: false },
     ],
   },
   {
     id: 181,
     title: "Missing Dollar Riddle",
     text: "3 people pay $10 each for a $30 room. Clerk realizes it's $25, gives $5 back to bellboy. Bellboy keeps $2, gives $1 each back. So each paid $9 (total $27) + $2 bellboy = $29. Where's the missing dollar?",
     difficulty: "Easy",
     categoryId: "puzzles",
     type: "logical",
     answer: `## The Missing Dollar Riddle
 
 ### The Misdirection
 The question creates false arithmetic!
 
 ### Correct Accounting
 
 **Money spent by guests:** $27
 - Hotel got: $25
 - Bellboy got: $2
 - Total: $25 + $2 = $27 ✓
 
 **Money flow:**
 - Originally paid: $30
 - Returned to guests: $3
 - Kept by guests: $3
 - Total: $27 + $3 = $30 ✓
 
 ### The Trick
 $27 (paid) - $2 (bellboy) = $25 (hotel)
 NOT $27 + $2!
 
 The $2 is already INSIDE the $27, not additional to it!
 
 ### Answer: **There is no missing dollar - it's a misleading addition**`,
     options: [
       { text: "The dollar was stolen", isCorrect: false },
       { text: "The calculation is misleading - no dollar is missing", isCorrect: true },
       { text: "The hotel kept it", isCorrect: false },
       { text: "Rounding error", isCorrect: false },
     ],
   },
   {
     id: 182,
     title: "Coin Flip Fairness",
     text: "You have a biased coin (unknown probability). How do you use it to make fair 50-50 decisions?",
     difficulty: "Medium",
     categoryId: "puzzles",
     type: "logical",
     answer: `## Fair Decision with Biased Coin
 
 ### Von Neumann's Method
 
 **Procedure:**
 1. Flip coin twice
 2. If HT → call it "Heads" (outcome A)
 3. If TH → call it "Tails" (outcome B)
 4. If HH or TT → discard and repeat
 
 ### Why it works
 Let P(H) = p, P(T) = 1-p
 
 P(HT) = p × (1-p)
 P(TH) = (1-p) × p
 
 These are equal! So conditional on getting HT or TH:
 P(HT | {HT or TH}) = 50%
 
 ### Efficiency
 P(usable outcome) = 2p(1-p)
 Maximum efficiency = 50% when p = 0.5
 
 ### Answer: **Flip twice: HT=A, TH=B, otherwise repeat**`,
     options: [
       { text: "It's impossible with a biased coin", isCorrect: false },
       { text: "Flip twice: HT=A, TH=B, repeat if HH or TT", isCorrect: true },
       { text: "Flip it 100 times and count", isCorrect: false },
       { text: "Weight the coin on the other side", isCorrect: false },
     ],
   },
   {
     id: 183,
     title: "N Queens Problem",
     text: "How many ways can you place 8 queens on a chess board so no two attack each other?",
     difficulty: "Hard",
     categoryId: "puzzles",
     type: "logical",
     answer: `## 8 Queens Problem
 
 ### Constraints
 No two queens on same:
 - Row
 - Column
 - Diagonal
 
 ### Solution Count
 For 8×8 board: **92 distinct solutions**
 
 With rotational/reflection symmetry: **12 fundamental solutions**
 
 ### One Solution
 Queens at: a5, b3, c1, d7, e2, f8, g6, h4
 
 ### Algorithm
 Typically solved using backtracking:
 1. Place queen in first row
 2. Try each column in next row
 3. Backtrack if no valid position
 
 ### General n-Queens
 | n | Solutions |
 |---|-----------|
 | 4 | 2 |
 | 8 | 92 |
 | 12 | 14,200 |
 
 ### Answer: **92 distinct solutions**`,
     options: [
       { text: "8 solutions", isCorrect: false },
       { text: "64 solutions", isCorrect: false },
       { text: "92 solutions", isCorrect: true },
       { text: "It's impossible", isCorrect: false },
     ],
   },
   {
     id: 184,
     title: "Zeno's Paradox",
     text: "Achilles gives a tortoise a 100m head start. Achilles runs 10× faster. Each time he reaches where the tortoise was, it has moved. Does Achilles catch up?",
     difficulty: "Medium",
     categoryId: "puzzles",
     type: "logical",
     answer: `## Zeno's Paradox
 
 ### The Infinite Series
 - Achilles runs 100m → tortoise moved 10m
 - Achilles runs 10m → tortoise moved 1m
 - Achilles runs 1m → tortoise moved 0.1m
 - ...and so on infinitely
 
 ### Mathematical Resolution
 Total distance = 100 + 10 + 1 + 0.1 + ...
 = 100 × (1 + 0.1 + 0.01 + ...)
 = 100 × (1/(1-0.1))
 = 100 × 10/9
 = **111.11 meters**
 
 ### Time to catch up
 If Achilles runs at 10 m/s:
 t = 111.11/10 = 11.11 seconds
 
 ### Resolution
 Infinite steps don't require infinite time!
 The infinite series converges to a finite sum.
 
 ### Answer: **Yes, Achilles catches up at 111.11m in finite time**`,
     options: [
       { text: "No, he never catches up", isCorrect: false },
       { text: "Yes, at 111.11m in finite time", isCorrect: true },
       { text: "Only if he runs faster", isCorrect: false },
       { text: "It depends on the tortoise's shell", isCorrect: false },
     ],
   },
   {
     id: 185,
     title: "Pascal's Triangle Row Sum",
     text: "What is the sum of all numbers in the 10th row of Pascal's Triangle?",
     difficulty: "Easy",
     categoryId: "pattern",
     type: "calculation",
     answer: `## Pascal's Triangle Row Sum
 
 ### Pattern
 Row n sums to 2^n (rows numbered from 0)
 
 | Row | Numbers | Sum |
 |-----|---------|-----|
 | 0 | 1 | 1 = 2^0 |
 | 1 | 1,1 | 2 = 2^1 |
 | 2 | 1,2,1 | 4 = 2^2 |
 | 3 | 1,3,3,1 | 8 = 2^3 |
 
 ### Why?
 Row n elements are: C(n,0) + C(n,1) + ... + C(n,n)
 By binomial theorem: (1+1)^n = 2^n
 
 ### 10th Row (row number 10)
 Sum = 2^10 = **1024**
 
 ### Note
 If "10th row" means the row starting 1,9,36...
 That's actually row 9: sum = 2^9 = 512
 
 ### Answer: **2^10 = 1024** (or 512 if 1-indexed)`,
     options: [
       { text: "512", isCorrect: false },
       { text: "1024", isCorrect: true },
       { text: "2048", isCorrect: false },
       { text: "100", isCorrect: false },
     ],
   },
   {
     id: 186,
     title: "Four 4s Puzzle",
     text: "Express the number 17 using exactly four 4s and any mathematical operations.",
     difficulty: "Medium",
     categoryId: "puzzles",
     type: "logical",
     answer: `## Four 4s - Making 17
 
 ### Solutions
 
 **Solution 1:**
 4 × 4 + 4/4 = 16 + 1 = **17** ✓
 
 **Solution 2:**
 (4 + 4) × 4 / 4 + 13... wait, need only 4s!
 
 **Solution 3:**
 4! - 4 - 4/4 = 24 - 4 - 1 = 19... not quite
 
 **Clean solution:**
 **4 × 4 + 4/4 = 17**
 
 ### Other numbers with four 4s
 - 0 = 4 + 4 - 4 - 4
 - 1 = 4/4 × 4/4
 - 2 = 4/4 + 4/4
 - 10 = (44 - 4)/4
 
 ### Answer: **4 × 4 + 4/4 = 17**`,
     options: [
       { text: "4 + 4 + 4 + 4 = 17", isCorrect: false },
       { text: "4 × 4 + 4/4 = 17", isCorrect: true },
       { text: "(4 + 4) × (4 - 4) = 17", isCorrect: false },
       { text: "It's impossible", isCorrect: false },
     ],
   },
   {
     id: 187,
     title: "Calendar Math",
     text: "If January 1st is a Monday, what day is December 31st of the same non-leap year?",
     difficulty: "Easy",
     categoryId: "quantitative",
     type: "calculation",
     answer: `## Calendar Math
 
 ### Days in non-leap year
 365 days
 
 ### Days after Jan 1
 Dec 31 is day 365 (or 364 days after Jan 1)
 
 ### Modulo 7
 364 ÷ 7 = 52 weeks exactly
 So Dec 31 is same day as Jan 1!
 
 Wait, let's recalculate:
 Jan 1 = Day 1 (Monday)
 Dec 31 = Day 365
 
 Days to advance = 365 - 1 = 364
 364 mod 7 = 0
 
 ### Answer
 Dec 31 is **Monday**
 
 ### Leap year
 366 mod 7 = 1
 Dec 31 would be Tuesday
 
 ### Answer: **Monday** (same as Jan 1)`,
     options: [
       { text: "Sunday", isCorrect: false },
       { text: "Monday", isCorrect: true },
       { text: "Tuesday", isCorrect: false },
       { text: "Wednesday", isCorrect: false },
     ],
   },
   {
     id: 188,
     title: "Fibonacci Sequence Sum",
     text: "What is the sum of the first 10 Fibonacci numbers? (1, 1, 2, 3, 5, 8, 13, 21, 34, 55)",
     difficulty: "Easy",
     categoryId: "pattern",
     type: "calculation",
     answer: `## Sum of First 10 Fibonacci Numbers
 
 ### Fibonacci Sequence
 F₁=1, F₂=1, F₃=2, F₄=3, F₅=5, F₆=8, F₇=13, F₈=21, F₉=34, F₁₀=55
 
 ### Direct Sum
 1+1+2+3+5+8+13+21+34+55 = **143**
 
 ### Formula
 Sum of first n Fibonacci = F(n+2) - 1
 
 F₁₂ = 144
 Sum = 144 - 1 = 143 ✓
 
 ### Verification
 1+1=2, +2=4, +3=7, +5=12, +8=20, +13=33, +21=54, +34=88, +55=143
 
 ### Answer: **143**`,
     options: [
       { text: "89", isCorrect: false },
       { text: "143", isCorrect: true },
       { text: "144", isCorrect: false },
       { text: "233", isCorrect: false },
     ],
   },
   {
     id: 189,
     title: "Magic Square Sum",
     text: "In a 3×3 magic square using numbers 1-9, what is the magic constant (row/column/diagonal sum)?",
     difficulty: "Easy",
     categoryId: "puzzles",
     type: "calculation",
     answer: `## Magic Square Constant
 
 ### Total Sum
 1+2+3+4+5+6+7+8+9 = 45
 
 ### Magic Constant
 3 rows must sum to same value
 Total = 45
 Each row = 45/3 = **15**
 
 ### The 3×3 Magic Square
 \`\`\`
 2 | 7 | 6
 9 | 5 | 1
 4 | 3 | 8
 \`\`\`
 
 ### Verification
 - Rows: 2+7+6=15, 9+5+1=15, 4+3+8=15 ✓
 - Cols: 2+9+4=15, 7+5+3=15, 6+1+8=15 ✓
 - Diag: 2+5+8=15, 6+5+4=15 ✓
 
 ### General Formula
 For n×n magic square with 1 to n²:
 Magic constant = n(n² + 1)/2
 
 ### Answer: **15**`,
     options: [
       { text: "12", isCorrect: false },
       { text: "15", isCorrect: true },
       { text: "18", isCorrect: false },
       { text: "21", isCorrect: false },
     ],
   },
   {
     id: 190,
     title: "Prime Number Puzzle",
     text: "What is the smallest prime number that is the sum of three different prime numbers?",
     difficulty: "Easy",
     categoryId: "quantitative",
     type: "logical",
     answer: `## Smallest Prime = Sum of 3 Different Primes
 
 ### First few primes
 2, 3, 5, 7, 11, 13, 17, 19, 23...
 
 ### Trying smallest combinations
 - 2+3+5 = 10 (not prime)
 - 2+3+7 = 12 (not prime)
 - 2+5+7 = 14 (not prime)
 - 3+5+7 = 15 (not prime)
 - 2+3+11 = 16 (not prime)
 - 2+5+11 = 18 (not prime)
 - 2+3+13 = 18 (not prime)
 - 3+5+11 = 19 (prime!) ✓
 
 ### Verification
 3, 5, 11 are all prime
 3+5+11 = 19 is prime
 
 ### Answer: **19 = 3 + 5 + 11**`,
     options: [
       { text: "10", isCorrect: false },
       { text: "13", isCorrect: false },
       { text: "17", isCorrect: false },
       { text: "19", isCorrect: true },
     ],
   },
   {
     id: 191,
     title: "Ages Riddle",
     text: "A father is 3 times as old as his son. 12 years ago, he was 6 times as old. How old are they now?",
     difficulty: "Easy",
     categoryId: "quantitative",
     type: "calculation",
     answer: `## Ages Riddle
 
 ### Let son's current age = S
 Father's current age = 3S
 
 ### 12 years ago
 Son was: S - 12
 Father was: 3S - 12
 
 ### Given condition
 3S - 12 = 6(S - 12)
 3S - 12 = 6S - 72
 -12 + 72 = 6S - 3S
 60 = 3S
 S = 20
 
 ### Current ages
 - Son: **20 years**
 - Father: **60 years**
 
 ### Verification
 - Now: 60 = 3 × 20 ✓
 - 12 years ago: 48 = 6 × 8 ✓
 
 ### Answer: **Son is 20, Father is 60**`,
     options: [
       { text: "Son 15, Father 45", isCorrect: false },
       { text: "Son 18, Father 54", isCorrect: false },
       { text: "Son 20, Father 60", isCorrect: true },
       { text: "Son 24, Father 72", isCorrect: false },
     ],
   },
   {
     id: 192,
     title: "Escalator Steps",
     text: "Walking up an escalator, you count 20 steps. Walking down the same escalator (moving up), you count 60 steps. How many steps are visible on the stationary escalator?",
     difficulty: "Hard",
     categoryId: "puzzles",
     type: "calculation",
     answer: `## Escalator Problem
 
 ### Variables
 - N = total visible steps
 - v = your walking speed (steps/time)
 - e = escalator speed (steps/time)
 
 ### Walking Up (with escalator)
 Time = 20/v
 Steps covered by escalator = e × 20/v
 Total: 20 + e×20/v = N ... (1)
 
 ### Walking Down (against escalator)
 Time = 60/v
 Steps escalator moved = e × 60/v
 Total: 60 - e×60/v = N ... (2)
 
 ### Solving
 From (1): e/v = (N-20)/20
 From (2): e/v = (60-N)/60
 
 (N-20)/20 = (60-N)/60
 3(N-20) = 60-N
 3N - 60 = 60 - N
 4N = 120
 N = **30 steps**
 
 ### Answer: **30 visible steps**`,
     options: [
       { text: "25 steps", isCorrect: false },
       { text: "30 steps", isCorrect: true },
       { text: "40 steps", isCorrect: false },
       { text: "45 steps", isCorrect: false },
     ],
   },
   {
     id: 193,
     title: "Consecutive Sum",
     text: "Express 100 as a sum of consecutive positive integers in as many ways as possible.",
     difficulty: "Medium",
     categoryId: "quantitative",
     type: "calculation",
     answer: `## 100 as Sum of Consecutive Integers
 
 ### Formula
 Sum from a to b = (b-a+1)(a+b)/2 = 100
 Let n = count, a = start
 n(2a + n - 1)/2 = 100
 n(2a + n - 1) = 200
 
 ### Finding solutions
 n must divide 200, and a must be positive.
 
 **n=4:** a = (200/4 - 3)/2 = 47/2 (not integer)
 **n=5:** a = (40 - 4)/2 = 18 → 18+19+20+21+22=100 ✓
 **n=8:** a = (25 - 7)/2 = 9 → 9+10+...+16=100 ✓
 **n=16:** a = (12.5 - 15)/2 (negative, skip)
 
 ### All Solutions
 1. 18+19+20+21+22 = 100 (5 terms)
 2. 9+10+11+12+13+14+15+16 = 100 (8 terms)
 
 ### Answer: **2 ways: {18-22} and {9-16}**`,
     options: [
       { text: "1 way", isCorrect: false },
       { text: "2 ways", isCorrect: true },
       { text: "3 ways", isCorrect: false },
       { text: "5 ways", isCorrect: false },
     ],
   },
   {
     id: 194,
     title: "Two-Door Riddle",
     text: "Two doors: one leads to freedom, one to death. Two guards: one always lies, one always tells truth. You can ask one question. What do you ask?",
     difficulty: "Medium",
     categoryId: "puzzles",
     type: "logical",
     answer: `## Two-Door Riddle
 
 ### The Universal Question
 Ask either guard:
 **"If I asked the OTHER guard which door leads to freedom, what would he say?"**
 
 Then choose the OPPOSITE door.
 
 ### Why it works
 
 **If you ask the truth-teller:**
 - He honestly reports what the liar would say
 - Liar would point to death door
 - Truth-teller says: "Death door"
 
 **If you ask the liar:**
 - Truth-teller would point to freedom door
 - Liar lies about this, points to death door
 - Liar says: "Death door"
 
 ### Both give the wrong door!
 So always choose the opposite of their answer.
 
 ### Alternative question
 "Would you say this door leads to freedom?"
 
 ### Answer: **Ask what the other guard would say, then choose opposite**`,
     options: [
       { text: "Ask if they're the truth-teller", isCorrect: false },
       { text: "Ask what the other guard would say, choose opposite", isCorrect: true },
       { text: "Ask both guards the same question", isCorrect: false },
       { text: "Flip a coin", isCorrect: false },
     ],
   },
   {
     id: 195,
     title: "Divisibility by 11",
     text: "What is the divisibility rule for 11? Is 918273645 divisible by 11?",
     difficulty: "Medium",
     categoryId: "quantitative",
     type: "calculation",
     answer: `## Divisibility by 11
 
 ### Rule
 Alternating sum of digits must be divisible by 11.
 (Sum of odd-position digits) - (Sum of even-position digits)
 
 ### For 918273645
 Digits: 9, 1, 8, 2, 7, 3, 6, 4, 5
 Positions: 1, 2, 3, 4, 5, 6, 7, 8, 9
 
 Odd positions: 9 + 8 + 7 + 6 + 5 = 35
 Even positions: 1 + 2 + 3 + 4 = 10
 
 Difference: 35 - 10 = 25
 
 25 ÷ 11 = 2 remainder 3
 
 ### Conclusion
 25 is NOT divisible by 11
 Therefore, 918273645 is **NOT divisible by 11**
 
 ### Answer: **No, difference is 25, not divisible by 11**`,
     options: [
       { text: "Yes, it's divisible by 11", isCorrect: false },
       { text: "No, alternating sum is 25", isCorrect: true },
       { text: "Yes, sum of digits is divisible by 11", isCorrect: false },
       { text: "Cannot be determined", isCorrect: false },
     ],
   },
   {
     id: 196,
     title: "Infinite Ladder",
     text: "What is the value of √(2 + √(2 + √(2 + √(2 + ...))))?",
     difficulty: "Medium",
     categoryId: "pattern",
     type: "calculation",
     answer: `## Infinite Nested Radical
 
 ### Let x = √(2 + √(2 + √(2 + ...)))
 
 Then x = √(2 + x)
 
 ### Solving
 x² = 2 + x
 x² - x - 2 = 0
 (x-2)(x+1) = 0
 
 x = 2 or x = -1
 
 Since x must be positive: **x = 2**
 
 ### Verification
 If x = 2: √(2 + 2) = √4 = 2 ✓
 
 ### General Pattern
 √(n + √(n + √(n + ...))) = (1 + √(1+4n))/2
 
 For n=2: (1 + √9)/2 = (1+3)/2 = 2 ✓
 
 ### Answer: **2**`,
     options: [
       { text: "√2", isCorrect: false },
       { text: "1.5", isCorrect: false },
       { text: "2", isCorrect: true },
       { text: "∞", isCorrect: false },
     ],
   },
   {
     id: 197,
     title: "Probability of Same Birthday",
     text: "What's the probability that in a family of 4, at least two share the same birth month?",
     difficulty: "Medium",
     categoryId: "puzzles",
     type: "calculation",
     answer: `## Same Birth Month Probability
 
 ### Method: P(at least 2 same) = 1 - P(all different)
 
 ### P(all different months)
 Person 1: 12/12 = 1 (any month)
 Person 2: 11/12 (different from 1)
 Person 3: 10/12 (different from 1,2)
 Person 4: 9/12 (different from 1,2,3)
 
 P(all different) = (12 × 11 × 10 × 9) / 12⁴
 = 11880 / 20736
 = 0.573
 
 ### P(at least 2 same)
 = 1 - 0.573
 = **0.427 or 42.7%**
 
 ### Answer: **About 42.7%** (or 41/96 exactly)`,
     options: [
       { text: "25%", isCorrect: false },
       { text: "33%", isCorrect: false },
       { text: "42.7%", isCorrect: true },
       { text: "50%", isCorrect: false },
     ],
   },
   {
     id: 198,
     title: "Clock Overlap",
     text: "How many times do the hour and minute hands of a clock overlap in 24 hours?",
     difficulty: "Medium",
     categoryId: "quantitative",
     type: "logical",
     answer: `## Clock Hand Overlaps
 
 ### Analysis
 Minute hand is faster than hour hand.
 
 In 12 hours:
 - Minute hand: 12 complete rotations
 - Hour hand: 1 complete rotation
 - Relative movement: 12 - 1 = 11 rotations
 
 ### Overlaps in 12 hours
 They overlap once per relative rotation = **11 times**
 
 ### Overlap times (12-hour period)
 12:00, ~1:05, ~2:11, ~3:16, ~4:22, ~5:27,
 ~6:33, ~7:38, ~8:44, ~9:49, ~10:55
 
 ### In 24 hours
 11 × 2 = **22 times**
 
 ### Common mistake
 Thinking it's 24 times (once per hour) - but at 12:00 they overlap, and they don't overlap between 11:00-12:00 and 12:00-1:00 separately.
 
 ### Answer: **22 times in 24 hours**`,
     options: [
       { text: "12 times", isCorrect: false },
       { text: "22 times", isCorrect: true },
       { text: "24 times", isCorrect: false },
       { text: "48 times", isCorrect: false },
     ],
   },
   {
     id: 199,
     title: "River Current Speed",
     text: "A boat takes 6 hours to travel upstream and 4 hours downstream for the same 48 km distance. Find the speed of the current.",
     difficulty: "Medium",
     categoryId: "quantitative",
     type: "calculation",
     answer: `## River Current Problem
 
 ### Given
 - Distance = 48 km (each way)
 - Upstream time = 6 hours
 - Downstream time = 4 hours
 
 ### Speeds
 Upstream speed = 48/6 = 8 km/h
 Downstream speed = 48/4 = 12 km/h
 
 ### Let
 - Boat speed in still water = B
 - Current speed = C
 
 ### Equations
 B - C = 8 (upstream)
 B + C = 12 (downstream)
 
 ### Solving
 Adding: 2B = 20 → B = 10 km/h
 Subtracting: 2C = 4 → **C = 2 km/h**
 
 ### Verification
 - Upstream: 10 - 2 = 8 km/h ✓
 - Downstream: 10 + 2 = 12 km/h ✓
 
 ### Answer: **Current speed = 2 km/h**`,
     options: [
       { text: "1 km/h", isCorrect: false },
       { text: "2 km/h", isCorrect: true },
       { text: "3 km/h", isCorrect: false },
       { text: "4 km/h", isCorrect: false },
     ],
   },
   {
     id: 200,
     title: "Mutual Fund Returns",
     text: "An investment gains 20% in year 1 and loses 20% in year 2. What is the overall percentage change?",
     difficulty: "Easy",
     categoryId: "quantitative",
     type: "calculation",
     answer: `## Mutual Fund Returns
 
 ### Calculation
 Start with $100
 
 **Year 1: +20%**
 $100 × 1.20 = $120
 
 **Year 2: -20%**
 $120 × 0.80 = $96
 
 ### Overall Change
 ($96 - $100) / $100 × 100 = **-4%**
 
 ### Formula
 For successive changes of +a% and -a%:
 Net change = -a²/100 %
 
 = -(20)²/100 = -4%
 
 ### Key Insight
 20% of 120 > 20% of 100
 So losing 20% after gaining 20% results in net loss!
 
 ### Answer: **4% loss (not break-even)**`,
     options: [
       { text: "0% (break even)", isCorrect: false },
       { text: "-4%", isCorrect: true },
       { text: "+4%", isCorrect: false },
       { text: "-2%", isCorrect: false },
     ],
   },
   {
     id: 201,
     title: "Dice Roll Probability",
     text: "Rolling two dice, what's the probability of getting a sum of 7?",
     difficulty: "Easy",
     categoryId: "quantitative",
     type: "calculation",
     answer: `## Sum of 7 with Two Dice
 
 ### Total outcomes
 6 × 6 = 36 possible outcomes
 
 ### Favorable outcomes (sum = 7)
 - (1,6)
 - (2,5)
 - (3,4)
 - (4,3)
 - (5,2)
 - (6,1)
 
 **6 favorable outcomes**
 
 ### Probability
 P(sum=7) = 6/36 = **1/6 ≈ 16.67%**
 
 ### Why 7 is most likely
 | Sum | Ways |
 |-----|------|
 | 2 | 1 |
 | 3 | 2 |
 | 7 | 6 |
 | 12 | 1 |
 
 7 has the most combinations!
 
 ### Answer: **1/6 or approximately 16.67%**`,
     options: [
       { text: "1/12", isCorrect: false },
       { text: "1/6", isCorrect: true },
       { text: "1/7", isCorrect: false },
       { text: "2/7", isCorrect: false },
     ],
   },
   {
     id: 202,
     title: "Tower of Hanoi",
     text: "Minimum moves to solve Tower of Hanoi with 5 disks?",
     difficulty: "Medium",
     categoryId: "puzzles",
     type: "calculation",
     answer: `## Tower of Hanoi
 
 ### Formula
 Minimum moves for n disks = 2ⁿ - 1
 
 ### For 5 disks
 Moves = 2⁵ - 1 = 32 - 1 = **31 moves**
 
 ### Why 2ⁿ - 1?
 Recursive thinking:
 1. Move n-1 disks to auxiliary peg: T(n-1) moves
 2. Move largest disk to target: 1 move
 3. Move n-1 disks to target: T(n-1) moves
 
 T(n) = 2T(n-1) + 1
 Solution: T(n) = 2ⁿ - 1
 
 ### Values
 | Disks | Moves |
 |-------|-------|
 | 1 | 1 |
 | 2 | 3 |
 | 3 | 7 |
 | 4 | 15 |
 | 5 | 31 |
 
 ### Answer: **31 moves**`,
     options: [
       { text: "15 moves", isCorrect: false },
       { text: "25 moves", isCorrect: false },
       { text: "31 moves", isCorrect: true },
       { text: "63 moves", isCorrect: false },
     ],
   },
   {
     id: 203,
     title: "Leap Year Calculation",
     text: "How many leap years are there between 1900 and 2100 (inclusive)?",
     difficulty: "Medium",
     categoryId: "quantitative",
     type: "calculation",
     answer: `## Leap Years 1900-2100
 
 ### Leap Year Rules
 1. Divisible by 4: leap year
 2. EXCEPT if divisible by 100: not leap year
 3. EXCEPT if divisible by 400: leap year
 
 ### Years divisible by 4
 1900 to 2100: (2100-1900)/4 + 1 = 51 years
 
 ### Subtract century years (divisible by 100)
 1900, 2000, 2100 = 3 years
 
 ### Add back 400-year years
 2000 is divisible by 400 = 1 year
 
 ### Calculation
 51 - 3 + 1 = **49 leap years**
 
 ### Key exceptions
 - 1900: NOT a leap year (÷100 but not ÷400)
 - 2000: IS a leap year (÷400)
 - 2100: NOT a leap year (÷100 but not ÷400)
 
 ### Answer: **49 leap years**`,
     options: [
       { text: "48", isCorrect: false },
       { text: "49", isCorrect: true },
       { text: "50", isCorrect: false },
       { text: "51", isCorrect: false },
     ],
   },
   {
     id: 204,
     title: "Matching Socks Probability",
     text: "A drawer has 10 red and 10 blue socks. How many socks must you draw (blindfolded) to guarantee a matching pair?",
     difficulty: "Easy",
     categoryId: "puzzles",
     type: "logical",
     answer: `## Matching Socks Problem
 
 ### Pigeonhole Principle
 2 colors = 2 "pigeonholes"
 
 ### Worst case
 You could draw:
 1st sock: any color
 2nd sock: different color
 3rd sock: must match one of the previous!
 
 ### Answer
 **3 socks guarantee a matching pair**
 
 ### General formula
 For n colors: need n+1 socks
 
 ### Extended problem
 For 3 socks of same color (10 red, 10 blue):
 Worst case: 2 red, 2 blue
 Need: **5 socks**
 
 ### Key insight
 We need CERTAINTY, not probability.
 "At least one pair" is guaranteed after n+1 draws.
 
 ### Answer: **3 socks**`,
     options: [
       { text: "2 socks", isCorrect: false },
       { text: "3 socks", isCorrect: true },
       { text: "11 socks", isCorrect: false },
       { text: "12 socks", isCorrect: false },
     ],
   },
   {
     id: 205,
     title: "Water in Wine Paradox",
     text: "Glass A has wine, Glass B has water. Transfer 1 spoon from A→B, mix, then 1 spoon from B→A. Is there more water in the wine or wine in the water?",
     difficulty: "Hard",
     categoryId: "puzzles",
     type: "logical",
     answer: `## Water in Wine Paradox
 
 ### Initial State
 Glass A: 100ml wine
 Glass B: 100ml water
 Spoon: 10ml
 
 ### Transfer 1 (A→B)
 Move 10ml wine to B
 A: 90ml wine
 B: 100ml water + 10ml wine (mixed)
 
 ### Transfer 2 (B→A)
 Spoon from B contains:
 - Water: 10 × 100/110 = 100/11 ml
 - Wine: 10 × 10/110 = 10/11 ml
 
 ### Final State
 A: 90 + 10/11 wine + 100/11 water
 B: 100/11 wine + (remaining water)
 
 ### The Insight
 However much wine is missing from A must be in B.
 However much water is in A came from B.
 
 **They must be equal!**
 
 ### Answer: **They are exactly equal** (regardless of spoon size or mixing)`,
     options: [
       { text: "More water in wine", isCorrect: false },
       { text: "More wine in water", isCorrect: false },
       { text: "Exactly equal amounts", isCorrect: true },
       { text: "Depends on spoon size", isCorrect: false },
     ],
   },
 ];
 
 // Helper functions
 export const getQuestionsByCategory = (categoryId: string = "all"): AptitudeQuestion[] => {
   if (categoryId === "all") return aptitudeQuestions;
   return aptitudeQuestions.filter((q) => q.categoryId === categoryId);
 };
 
 export const getQuestionsByDifficulty = (
   questions: AptitudeQuestion[],
   difficulty: string = "all"
 ): AptitudeQuestion[] => {
   if (difficulty === "all") return questions;
   return questions.filter((q) => q.difficulty === difficulty);
 };
 
 export const getQuestionsByType = (
   questions: AptitudeQuestion[],
   type: string = "all"
 ): AptitudeQuestion[] => {
   if (type === "all") return questions;
   return questions.filter((q) => q.type === type);
 };
 
 export const searchQuestions = (
   questions: AptitudeQuestion[],
   query: string
 ): AptitudeQuestion[] => {
   if (!query.trim()) return questions;
   const lowerQuery = query.toLowerCase();
   return questions.filter(
     (q) =>
       q.title.toLowerCase().includes(lowerQuery) ||
       q.text.toLowerCase().includes(lowerQuery)
   );
 };
 
 export const getCategoryName = (categoryId: string): string => {
   const category = aptitudeCategories.find((c) => c.id === categoryId);
   return category?.name || categoryId;
 };
 
 export const getDifficultyStats = () => {
   let easy = 0,
     medium = 0,
     hard = 0;
   aptitudeQuestions.forEach((q) => {
     if (q.difficulty === "Easy") easy++;
     else if (q.difficulty === "Medium") medium++;
     else hard++;
   });
   return { easy, medium, hard, total: aptitudeQuestions.length };
 };