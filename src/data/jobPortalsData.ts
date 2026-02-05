// Job Portals Data - Categories, topics, and quiz questions for job search strategies

export interface JobPortalQuestion {
  id: number;
  title: string;
  text: string;
  difficulty: "Easy" | "Medium" | "Hard";
  categoryId: string;
  topicId: string;
  answer: string;
  options?: { text: string; isCorrect: boolean }[];
}

export interface JobPortalTopic {
  id: string;
  name: string;
  categoryId: string;
  description?: string;
}

export interface JobPortalCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
}

// Job Portal Categories
export const jobPortalCategories: JobPortalCategory[] = [
  { id: "professional-networks", name: "Professional Networks", icon: "Users", color: "from-blue-500 to-cyan-500", description: "LinkedIn, networking strategies" },
  { id: "job-boards", name: "Job Boards", icon: "List", color: "from-emerald-500 to-teal-500", description: "Naukri, Indeed, Glassdoor tips" },
  { id: "startup-platforms", name: "Startup Platforms", icon: "Rocket", color: "from-purple-500 to-pink-500", description: "AngelList, startup job strategies" },
  { id: "ai-matching", name: "AI-Powered Matching", icon: "Sparkles", color: "from-amber-500 to-orange-500", description: "Instahyre, Hirist optimization" },
  { id: "freelance", name: "Freelance Platforms", icon: "Briefcase", color: "from-rose-500 to-red-500", description: "Upwork, Toptal, freelancing" },
];

// Job Portal Topics
export const jobPortalTopics: JobPortalTopic[] = [
  // Professional Networks
  { id: "linkedin-profile", name: "LinkedIn Profile Optimization", categoryId: "professional-networks", description: "Headline, summary, skills" },
  { id: "linkedin-networking", name: "LinkedIn Networking", categoryId: "professional-networks", description: "Connection strategies" },
  { id: "linkedin-content", name: "LinkedIn Content Strategy", categoryId: "professional-networks", description: "Posts, articles, engagement" },
  
  // Job Boards
  { id: "resume-keywords", name: "Resume Keywords", categoryId: "job-boards", description: "ATS optimization" },
  { id: "job-alerts", name: "Job Alerts & Search", categoryId: "job-boards", description: "Effective search strategies" },
  { id: "application-tips", name: "Application Best Practices", categoryId: "job-boards", description: "Standing out in applications" },
  
  // Startup Platforms
  { id: "startup-research", name: "Startup Research", categoryId: "startup-platforms", description: "Evaluating startups" },
  { id: "equity-offers", name: "Understanding Equity", categoryId: "startup-platforms", description: "Stock options, vesting" },
  { id: "startup-culture", name: "Startup Culture Fit", categoryId: "startup-platforms", description: "Identifying the right fit" },
  
  // AI Matching
  { id: "profile-optimization", name: "Profile Optimization", categoryId: "ai-matching", description: "AI-friendly profiles" },
  { id: "skill-tagging", name: "Skill Tagging", categoryId: "ai-matching", description: "Proper skill categorization" },
  { id: "match-scores", name: "Understanding Match Scores", categoryId: "ai-matching", description: "How AI matching works" },
  
  // Freelance
  { id: "portfolio-building", name: "Portfolio Building", categoryId: "freelance", description: "Showcasing work" },
  { id: "client-communication", name: "Client Communication", categoryId: "freelance", description: "Proposal writing" },
  { id: "rate-negotiation", name: "Rate Negotiation", categoryId: "freelance", description: "Pricing strategies" },
];

// Job Portal Questions
export const jobPortalQuestions: JobPortalQuestion[] = [
  // Professional Networks - LinkedIn
  {
    id: 1,
    title: "LinkedIn Headline Best Practice",
    text: "What is the most effective LinkedIn headline strategy for job seekers?",
    difficulty: "Easy",
    categoryId: "professional-networks",
    topicId: "linkedin-profile",
    answer: `## LinkedIn Headline Best Practices

Your headline is prime real estate - it appears in search results and connection requests.

### Winning Formula
- **Include current role + specialty + value proposition**
- Example: "Senior React Developer | Building Scalable Web Apps | Open to Opportunities"

### Key Tips
- Use industry keywords for search visibility
- Avoid just job titles - add what makes you unique
- Include "Open to Work" strategically
- Keep it under 120 characters for mobile visibility

### Bad Examples
- "Looking for opportunities"
- Just "Software Engineer"
- "Unemployed"`,
    options: [
      { text: "Include role, specialty, and value proposition with keywords", isCorrect: true },
      { text: "Just write your current job title", isCorrect: false },
      { text: "Write 'Looking for new opportunities'", isCorrect: false },
      { text: "Leave it blank to seem mysterious", isCorrect: false },
    ],
  },
  {
    id: 2,
    title: "LinkedIn Connection Strategy",
    text: "When sending connection requests to recruiters, what approach is most effective?",
    difficulty: "Medium",
    categoryId: "professional-networks",
    topicId: "linkedin-networking",
    answer: `## Effective Recruiter Connection Strategy

### The Right Approach
1. **Personalize every connection request**
2. Mention specific role or company interest
3. Reference mutual connections or shared interests
4. Keep it brief but compelling

### Template
"Hi [Name], I noticed you recruit for [Company]'s engineering team. I'm a [Your Role] with [X years] experience in [relevant skills]. Would love to connect and learn about opportunities."

### Don'ts
- Generic "I'd like to add you to my network"
- Immediately asking for referrals
- Sending to hundreds of recruiters at once`,
    options: [
      { text: "Personalize requests mentioning specific interest in their company/role", isCorrect: true },
      { text: "Send generic connection requests to as many as possible", isCorrect: false },
      { text: "Immediately ask for a job referral in the first message", isCorrect: false },
      { text: "Wait for recruiters to find you", isCorrect: false },
    ],
  },
  {
    id: 3,
    title: "LinkedIn Profile Photo",
    text: "What makes an effective LinkedIn profile photo?",
    difficulty: "Easy",
    categoryId: "professional-networks",
    topicId: "linkedin-profile",
    answer: `## LinkedIn Photo Best Practices

### Key Elements
- **Professional headshot** with face taking 60% of frame
- Neutral or simple background
- Good lighting (natural light preferred)
- Appropriate attire for your industry
- Genuine, approachable smile

### Statistics
- Profiles with photos get 21x more views
- 36x more messages than those without

### Avoid
- Group photos
- Casual vacation pics
- Outdated photos
- Heavy filters`,
    options: [
      { text: "Professional headshot with clear face, good lighting, simple background", isCorrect: true },
      { text: "A fun group photo from a party", isCorrect: false },
      { text: "Your company logo instead of face", isCorrect: false },
      { text: "A casual selfie with filters", isCorrect: false },
    ],
  },
  {
    id: 4,
    title: "LinkedIn Content Engagement",
    text: "What type of LinkedIn posts typically get the highest engagement for job seekers?",
    difficulty: "Medium",
    categoryId: "professional-networks",
    topicId: "linkedin-content",
    answer: `## High-Engagement LinkedIn Content

### Top Performing Post Types
1. **Personal career stories** - lessons learned, challenges overcome
2. **Industry insights** with your unique perspective
3. **Behind-the-scenes** of projects you've worked on
4. **Celebrations** - certifications, achievements, milestones

### Engagement Tips
- Post consistently (2-3 times per week)
- Engage with others' content first
- Use relevant hashtags (3-5 max)
- Ask questions to spark discussion
- Respond to every comment

### Algorithm Favorites
- Text-only posts with storytelling
- Carousel documents
- Native videos (not YouTube links)`,
    options: [
      { text: "Personal career stories and industry insights with your perspective", isCorrect: true },
      { text: "Resharing news articles without commentary", isCorrect: false },
      { text: "Posting only when looking for a job", isCorrect: false },
      { text: "Complaining about interview experiences", isCorrect: false },
    ],
  },
  // Job Boards
  {
    id: 5,
    title: "ATS Resume Optimization",
    text: "What is the most important factor for getting your resume past ATS (Applicant Tracking Systems)?",
    difficulty: "Medium",
    categoryId: "job-boards",
    topicId: "resume-keywords",
    answer: `## ATS Optimization Strategies

### Most Critical Factor: Keyword Matching
- Use exact keywords from job description
- Include both spelled out and abbreviated versions (e.g., "JavaScript" and "JS")
- Place keywords in context, not just lists

### ATS-Friendly Formatting
- Simple, single-column layout
- Standard section headings (Experience, Education, Skills)
- No tables, graphics, or headers/footers
- .docx or .pdf format (check job posting)

### Pro Tips
- Tailor resume for each application
- Use a keyword analyzer tool
- Keep formatting simple
- Include relevant certifications with exact names`,
    options: [
      { text: "Using exact keywords from job description in proper context", isCorrect: true },
      { text: "Using creative formatting and graphics", isCorrect: false },
      { text: "Making the resume as long as possible", isCorrect: false },
      { text: "Using fancy fonts and colors", isCorrect: false },
    ],
  },
  {
    id: 6,
    title: "Job Alert Strategy",
    text: "How should you set up job alerts for maximum effectiveness?",
    difficulty: "Easy",
    categoryId: "job-boards",
    topicId: "job-alerts",
    answer: `## Effective Job Alert Setup

### Strategy
- Create multiple specific alerts rather than one broad search
- Use different keyword combinations
- Set location radius appropriately
- Choose daily frequency for competitive roles

### Keyword Tips
- Include job title variations (Developer, Engineer, Programmer)
- Add specific technologies (React, Python, AWS)
- Include seniority levels

### Best Practices
- Apply within 24 hours of posting
- Early applicants get 8x more responses
- Track your alerts in a spreadsheet
- Regularly refine based on results`,
    options: [
      { text: "Multiple specific alerts with different keyword combinations", isCorrect: true },
      { text: "One broad alert with generic keywords", isCorrect: false },
      { text: "Only check manually once a week", isCorrect: false },
      { text: "Set alerts for every possible job title", isCorrect: false },
    ],
  },
  {
    id: 7,
    title: "Glassdoor Research",
    text: "What should you primarily research on Glassdoor before applying to a company?",
    difficulty: "Easy",
    categoryId: "job-boards",
    topicId: "application-tips",
    answer: `## Glassdoor Research Priorities

### Must-Check Items
1. **Interview process & questions** - Know what to expect
2. **Salary ranges** for your target role
3. **Company culture** reviews
4. **Work-life balance** feedback
5. **CEO approval** and leadership reviews

### Reading Reviews Wisely
- Look for patterns, not one-off complaints
- Check dates - recent reviews matter more
- Consider department-specific feedback
- Balance positive and negative reviews

### Interview Preparation
- Study reported interview questions
- Note difficulty level and duration
- Understand the interview stages`,
    options: [
      { text: "Interview process, salary ranges, culture reviews, and common questions", isCorrect: true },
      { text: "Only the office photos", isCorrect: false },
      { text: "Just the company description", isCorrect: false },
      { text: "Number of job postings", isCorrect: false },
    ],
  },
  // Startup Platforms
  {
    id: 8,
    title: "Evaluating Startup Opportunities",
    text: "What is the most important factor to evaluate when considering a startup job offer?",
    difficulty: "Hard",
    categoryId: "startup-platforms",
    topicId: "startup-research",
    answer: `## Evaluating Startup Opportunities

### Key Evaluation Factors
1. **Funding & Runway** - How long can they operate?
2. **Business Model** - Is there a path to profitability?
3. **Team** - Founders' background and track record
4. **Market** - Size and growth potential
5. **Traction** - Revenue, users, growth rate

### Red Flags
- Vague answers about funding
- High turnover (check LinkedIn)
- No clear product-market fit
- Unrealistic expectations

### Questions to Ask
- What's your current runway?
- What are your key metrics?
- What's the path to next funding round?
- How do you measure success?`,
    options: [
      { text: "Funding runway, business model viability, and team track record", isCorrect: true },
      { text: "Office perks and free food", isCorrect: false },
      { text: "How cool the company name sounds", isCorrect: false },
      { text: "Number of LinkedIn followers", isCorrect: false },
    ],
  },
  {
    id: 9,
    title: "Understanding Stock Options",
    text: "What does 'vesting schedule' mean for startup equity compensation?",
    difficulty: "Hard",
    categoryId: "startup-platforms",
    topicId: "equity-offers",
    answer: `## Stock Options Vesting Explained

### Standard Vesting Schedule
- **4-year vesting** with 1-year cliff
- After 1 year: 25% of options vest
- Remaining 75% vest monthly over 3 years

### Key Terms
- **Strike Price**: Price you pay to exercise options
- **Cliff**: Minimum time before any vesting
- **Acceleration**: Faster vesting on acquisition/IPO

### Important Considerations
- Exercise window after leaving (usually 90 days)
- Tax implications (ISO vs NSO)
- Company valuation and dilution
- Preference stack for liquidation

### Questions to Ask
- What's the current 409A valuation?
- How many shares outstanding?
- What's my percentage ownership?`,
    options: [
      { text: "A timeline for earning equity, typically 4 years with 1-year cliff", isCorrect: true },
      { text: "Choosing which clothing to wear at work", isCorrect: false },
      { text: "A waiting period before you can sell company stock", isCorrect: false },
      { text: "The company's financial calendar", isCorrect: false },
    ],
  },
  {
    id: 10,
    title: "AngelList Profile Optimization",
    text: "What makes a strong AngelList/Wellfound profile for startup job seekers?",
    difficulty: "Medium",
    categoryId: "startup-platforms",
    topicId: "startup-culture",
    answer: `## AngelList/Wellfound Profile Tips

### Profile Essentials
- **Clear headline** with your role and expertise
- Specific startup interests and preferences
- Salary and equity expectations set realistically
- Highlighted relevant startup experience

### Standout Strategies
- Show entrepreneurial side projects
- Mention experience with ambiguity
- Highlight cross-functional skills
- Demonstrate passion for startup ecosystem

### Preferences Section
- Be specific about company stage (Seed, Series A, etc.)
- Set realistic compensation expectations
- Indicate role types and remote preferences
- List target industries`,
    options: [
      { text: "Clear headline, startup interests, realistic expectations, entrepreneurial projects", isCorrect: true },
      { text: "Copy-paste your LinkedIn profile exactly", isCorrect: false },
      { text: "Focus only on big company experience", isCorrect: false },
      { text: "Leave compensation expectations blank", isCorrect: false },
    ],
  },
  // AI Matching
  {
    id: 11,
    title: "AI Platform Profile Optimization",
    text: "How do AI-powered job platforms like Instahyre match candidates to jobs?",
    difficulty: "Medium",
    categoryId: "ai-matching",
    topicId: "profile-optimization",
    answer: `## AI Job Matching Explained

### How AI Matching Works
1. **Skill extraction** from your profile/resume
2. **Experience level** analysis
3. **Keyword matching** with job requirements
4. **Behavioral signals** (activity, responsiveness)
5. **Success pattern** learning from similar profiles

### Optimization Strategies
- Use standard skill names (not creative variations)
- Keep profile updated regularly
- Respond to messages promptly (affects score)
- Complete all profile sections
- Upload updated resume periodically

### Pro Tips
- Include skill endorsements
- Add project descriptions with tech stacks
- Specify years of experience per skill
- Enable all communication channels`,
    options: [
      { text: "Skill extraction, experience analysis, keyword matching, and behavioral signals", isCorrect: true },
      { text: "Random selection from all candidates", isCorrect: false },
      { text: "Only looking at years of experience", isCorrect: false },
      { text: "Matching based on profile photo", isCorrect: false },
    ],
  },
  {
    id: 12,
    title: "Skill Tagging Best Practices",
    text: "What's the best way to list skills on AI-powered job platforms?",
    difficulty: "Easy",
    categoryId: "ai-matching",
    topicId: "skill-tagging",
    answer: `## Skill Tagging for AI Platforms

### Best Practices
- Use **exact standard names** (React.js not ReactJS or React JS)
- Include both technology and concepts
- Add years of experience for each skill
- Separate primary from secondary skills

### Skill Categories to Include
1. Programming languages
2. Frameworks & libraries
3. Databases & tools
4. Methodologies (Agile, Scrum)
5. Soft skills (Communication, Leadership)

### Common Mistakes
- Using uncommon abbreviations
- Listing too many skills (dilutes profile)
- Not updating skill levels
- Missing trending technologies`,
    options: [
      { text: "Use standard names with experience levels, categorize primary vs secondary", isCorrect: true },
      { text: "List every technology you've ever heard of", isCorrect: false },
      { text: "Use creative names for common skills", isCorrect: false },
      { text: "Only list soft skills", isCorrect: false },
    ],
  },
  // Freelance Platforms
  {
    id: 13,
    title: "Upwork Profile Success",
    text: "What factor most strongly influences success as a new freelancer on Upwork?",
    difficulty: "Medium",
    categoryId: "freelance",
    topicId: "portfolio-building",
    answer: `## Upwork New Freelancer Success

### Most Critical Factor: Portfolio Quality
- Showcase 3-5 of your best projects
- Include detailed case studies
- Show before/after results
- Add testimonials if possible

### Profile Essentials
- Professional, niche-specific title
- Compelling overview (first 2 lines matter most)
- Relevant skills with tests passed
- Competitive initial rates

### Starting Strategy
- Apply to 10-20 jobs daily initially
- Write personalized proposals
- Start with slightly lower rates
- Get those first 5-star reviews
- Gradually increase rates`,
    options: [
      { text: "Quality portfolio with detailed case studies and results", isCorrect: true },
      { text: "Setting the highest rates from day one", isCorrect: false },
      { text: "Sending generic proposals to all jobs", isCorrect: false },
      { text: "Waiting for clients to find you", isCorrect: false },
    ],
  },
  {
    id: 14,
    title: "Freelance Proposal Writing",
    text: "What makes a winning freelance job proposal?",
    difficulty: "Hard",
    categoryId: "freelance",
    topicId: "client-communication",
    answer: `## Winning Freelance Proposals

### Structure
1. **Hook** - Reference specific project detail
2. **Relevance** - Why you're perfect for this
3. **Proof** - Similar work examples
4. **Plan** - Brief approach outline
5. **Call to action** - Next steps

### Key Elements
- Personalized opening (not "Dear Hiring Manager")
- Answer their specific questions
- Include relevant portfolio links
- Show you understood the project
- Propose a realistic timeline

### Red Flags to Avoid
- Generic copy-paste proposals
- Focusing only on your needs
- Ignoring client's specific requirements
- No examples of relevant work
- Grammatical errors`,
    options: [
      { text: "Personalized hook, relevant experience, proof of work, and clear next steps", isCorrect: true },
      { text: "Long introduction about your entire career history", isCorrect: false },
      { text: "Same template for every proposal", isCorrect: false },
      { text: "Just your rate and availability", isCorrect: false },
    ],
  },
  {
    id: 15,
    title: "Freelance Rate Setting",
    text: "What's the most effective approach to setting freelance rates?",
    difficulty: "Medium",
    categoryId: "freelance",
    topicId: "rate-negotiation",
    answer: `## Freelance Rate Strategy

### Rate Calculation Factors
1. **Market research** - Check Glassdoor, Upwork average
2. **Your experience level** - Adjust accordingly
3. **Project complexity** - Premium for difficult work
4. **Client budget** - Enterprise vs startup
5. **Value delivered** - Not just hours worked

### Pricing Models
- **Hourly**: Good for ongoing work
- **Fixed**: Better for defined projects
- **Value-based**: For experienced freelancers

### Negotiation Tips
- Never give a rate without understanding scope
- Offer packages (Basic, Standard, Premium)
- Include revision limits
- Ask about budget before quoting`,
    options: [
      { text: "Research market rates, factor experience and complexity, consider value delivered", isCorrect: true },
      { text: "Always charge the lowest rate to win jobs", isCorrect: false },
      { text: "Pick a random number that sounds good", isCorrect: false },
      { text: "Match what your friends charge", isCorrect: false },
    ],
  },
  // More Advanced Questions
  {
    id: 16,
    title: "Indeed Application Strategy",
    text: "What's the optimal timing for applying to jobs on Indeed?",
    difficulty: "Medium",
    categoryId: "job-boards",
    topicId: "job-alerts",
    answer: `## Indeed Application Timing

### Optimal Strategy
- **Apply within 24 hours** of posting
- Best days: Monday-Thursday
- Best times: 6 AM - 10 AM local time
- Early applicants get 8x more interviews

### Why Timing Matters
- Recruiters review in batches
- First applications get more attention
- Positions fill quickly
- Some have rolling deadlines

### Tracking Your Applications
- Use Indeed's "My Jobs" feature
- Set up daily alerts for priority roles
- Track application status
- Follow up after 1 week if no response`,
    options: [
      { text: "Within 24 hours of posting, early morning on weekdays", isCorrect: true },
      { text: "Wait a few weeks to avoid the rush", isCorrect: false },
      { text: "Only apply on weekends", isCorrect: false },
      { text: "Timing doesn't matter at all", isCorrect: false },
    ],
  },
  {
    id: 17,
    title: "Naukri Profile Visibility",
    text: "What feature on Naukri most affects your profile visibility to recruiters?",
    difficulty: "Easy",
    categoryId: "job-boards",
    topicId: "resume-keywords",
    answer: `## Naukri Profile Visibility

### Key Visibility Factors
1. **Profile Freshness** - Update every 48 hours
2. **Resume Keywords** - Match job descriptions
3. **Headline** - Clear role and experience
4. **Profile Completion** - 100% completion bonus

### How to Stay Visible
- Update profile regularly (even small edits)
- Modify resume keywords periodically
- Keep "Active" job search status
- Respond to recruiter messages quickly

### Pro Tips
- Use Naukri's resume builder
- Add certifications
- Include detailed project descriptions
- Enable email notifications`,
    options: [
      { text: "Regular profile updates and resume freshness (every 48 hours)", isCorrect: true },
      { text: "Having a premium subscription only", isCorrect: false },
      { text: "Adding more profile photos", isCorrect: false },
      { text: "Applying to more jobs", isCorrect: false },
    ],
  },
  {
    id: 18,
    title: "Toptal Application Process",
    text: "What is unique about Toptal's freelancer vetting process?",
    difficulty: "Hard",
    categoryId: "freelance",
    topicId: "portfolio-building",
    answer: `## Toptal Vetting Process

### The Process (Claims 3% acceptance rate)
1. **Application** - English communication test
2. **Screening** - Technical interview
3. **Expert Interview** - Domain-specific deep dive
4. **Test Project** - Real-world assignment
5. **Continued Quality** - Ongoing performance reviews

### What They Evaluate
- Communication skills
- Technical expertise
- Problem-solving ability
- Professional experience
- Client management skills

### Preparation Tips
- Strong portfolio is essential
- Practice algorithm problems
- Prepare system design explanations
- Have project stories ready
- Clear, articulate communication`,
    options: [
      { text: "Multi-stage vetting: language, technical, expert interview, and test project", isCorrect: true },
      { text: "Just upload a resume and wait", isCorrect: false },
      { text: "Pay a fee to join", isCorrect: false },
      { text: "Only certifications matter", isCorrect: false },
    ],
  },
  {
    id: 19,
    title: "LinkedIn Open to Work",
    text: "Should you enable the 'Open to Work' feature on LinkedIn?",
    difficulty: "Medium",
    categoryId: "professional-networks",
    topicId: "linkedin-profile",
    answer: `## Open to Work Feature Strategy

### Two Options
1. **Visible to All** (green banner)
   - Shows you're actively looking
   - Good for career changers, recent grads
   - May concern current employer

2. **Recruiters Only**
   - Only visible to LinkedIn Recruiters
   - More discreet
   - Blocks your company's recruiters

### When to Use
- Use public banner if currently unemployed
- Use recruiter-only if employed
- Customize job preferences carefully
- Update regularly for algorithm boost

### Considerations
- Your current employer might see it
- Some see it as desperate (debated)
- Can increase recruiter messages 2x`,
    options: [
      { text: "Use recruiters-only if employed, public banner if actively searching", isCorrect: true },
      { text: "Never use it - it looks desperate", isCorrect: false },
      { text: "Always use the green banner", isCorrect: false },
      { text: "The feature doesn't help at all", isCorrect: false },
    ],
  },
  {
    id: 20,
    title: "Company Research Strategy",
    text: "What's the best approach to researching a company before applying?",
    difficulty: "Easy",
    categoryId: "job-boards",
    topicId: "application-tips",
    answer: `## Company Research Checklist

### Essential Research Areas
1. **Company website** - Mission, values, products
2. **Glassdoor** - Reviews, salary, interview process
3. **LinkedIn** - Employee count, growth, connections
4. **News** - Recent announcements, funding, challenges
5. **Crunchbase** - For startups (funding, investors)

### What to Look For
- Company growth trajectory
- Engineering blog or tech stack
- Leadership background
- Company culture indicators
- Recent product launches

### How to Use Research
- Tailor resume keywords
- Prepare relevant interview stories
- Ask informed questions
- Show genuine interest`,
    options: [
      { text: "Website, Glassdoor reviews, LinkedIn, news, and funding info", isCorrect: true },
      { text: "Only look at the job description", isCorrect: false },
      { text: "Just check if they have an office nearby", isCorrect: false },
      { text: "Research is optional", isCorrect: false },
    ],
  },
  {
    id: 21,
    title: "Remote Job Platforms",
    text: "What distinguishes remote-first job platforms like Remote.co and We Work Remotely?",
    difficulty: "Medium",
    categoryId: "job-boards",
    topicId: "job-alerts",
    answer: `## Remote-First Job Platforms

### Key Differentiators
- **Curated listings** - Only truly remote positions
- **Global opportunities** - Not location-restricted
- **Verified employers** - Quality over quantity
- **Remote culture** - Companies built for distributed work

### Top Remote Platforms
- We Work Remotely
- Remote.co
- FlexJobs (paid, vetted)
- Remotive
- Remote OK

### What to Look For
- Time zone requirements
- Equipment provisions
- Async vs sync expectations
- Benefits for remote workers
- Team size and distribution`,
    options: [
      { text: "Curated truly remote listings, global opportunities, verified remote-first employers", isCorrect: true },
      { text: "They're the same as regular job boards", isCorrect: false },
      { text: "Only contract positions available", isCorrect: false },
      { text: "Limited to specific industries", isCorrect: false },
    ],
  },
  {
    id: 22,
    title: "Hirist AI Optimization",
    text: "How does Hirist's AI-based matching work for tech candidates?",
    difficulty: "Hard",
    categoryId: "ai-matching",
    topicId: "match-scores",
    answer: `## Hirist AI Matching System

### How It Works
1. **Resume parsing** - Extracts skills, experience, education
2. **Behavioral analysis** - Activity patterns, response rates
3. **Match scoring** - Percentage fit for each job
4. **Learning** - Improves from your job preferences

### Optimization Strategies
- Complete skill assessments
- Respond to messages quickly
- Keep profile updated weekly
- Apply to relevant jobs (trains the AI)
- Take skill tests to verify abilities

### Match Score Factors
- Skill overlap percentage
- Experience level alignment
- Location preferences
- Salary expectations match
- Company size preferences`,
    options: [
      { text: "Resume parsing, behavioral analysis, match scoring, and continuous learning", isCorrect: true },
      { text: "Only looks at years of experience", isCorrect: false },
      { text: "Random job suggestions", isCorrect: false },
      { text: "Based purely on education", isCorrect: false },
    ],
  },
];

// Utility function to get questions by category
export const getJobPortalQuestionsByCategory = (categoryId: string): JobPortalQuestion[] => {
  return jobPortalQuestions.filter((q) => q.categoryId === categoryId);
};

// Utility function to get topics by category
export const getJobPortalTopicsByCategory = (categoryId: string): JobPortalTopic[] => {
  return jobPortalTopics.filter((t) => t.categoryId === categoryId);
};
