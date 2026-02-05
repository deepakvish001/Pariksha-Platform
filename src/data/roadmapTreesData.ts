// Roadmap.sh-style hierarchical tree data structures

export interface RoadmapResource {
  title: string;
  url: string;
  type: 'article' | 'video' | 'course' | 'docs' | 'tool';
}

export interface RoadmapTreeNode {
  id: string;
  title: string;
  type: 'primary' | 'secondary' | 'checkpoint' | 'resource' | 'optional';
  description?: string;
  children?: RoadmapTreeNode[];
  resources?: RoadmapResource[];
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  estimatedTime?: string;
  isRecommended?: boolean;
}

export interface RoadmapTree {
  id: string;
  title: string;
  description: string;
  color: string;
  icon: string;
  nodes: RoadmapTreeNode[];
  faqs: { question: string; answer: string }[];
}

// Frontend Development Tree
export const frontendTree: RoadmapTree = {
  id: 'frontend',
  title: 'Frontend Development',
  description: 'Build beautiful, interactive user interfaces',
  color: 'from-cyan-500 to-blue-500',
  icon: 'Layout',
  nodes: [
    {
      id: 'frontend-internet',
      title: 'Internet Basics',
      type: 'primary',
      description: 'Understand how the web works',
      difficulty: 'Easy',
      estimatedTime: '1 week',
      children: [
        { id: 'frontend-how-internet', title: 'How does the internet work?', type: 'secondary', difficulty: 'Easy' },
        { id: 'frontend-http', title: 'HTTP / HTTPS', type: 'secondary', difficulty: 'Easy' },
        { id: 'frontend-dns', title: 'DNS & Domain Names', type: 'secondary', difficulty: 'Easy' },
        { id: 'frontend-hosting', title: 'Web Hosting', type: 'secondary', difficulty: 'Easy' },
      ],
    },
    {
      id: 'frontend-html',
      title: 'HTML',
      type: 'primary',
      description: 'Structure of web pages',
      difficulty: 'Easy',
      estimatedTime: '2 weeks',
      isRecommended: true,
      children: [
        { id: 'frontend-html-basics', title: 'Learn the Basics', type: 'secondary', difficulty: 'Easy' },
        { id: 'frontend-semantic', title: 'Semantic HTML', type: 'secondary', difficulty: 'Easy' },
        { id: 'frontend-forms', title: 'Forms and Validations', type: 'secondary', difficulty: 'Medium' },
        { id: 'frontend-accessibility', title: 'Accessibility', type: 'secondary', difficulty: 'Medium' },
        { id: 'frontend-seo-basics', title: 'SEO Basics', type: 'optional', difficulty: 'Easy' },
      ],
    },
    {
      id: 'frontend-css',
      title: 'CSS',
      type: 'primary',
      description: 'Styling and layouts',
      difficulty: 'Easy',
      estimatedTime: '3 weeks',
      children: [
        { id: 'frontend-css-basics', title: 'Learn the Basics', type: 'secondary', difficulty: 'Easy' },
        { 
          id: 'frontend-layouts', 
          title: 'Making Layouts', 
          type: 'secondary', 
          difficulty: 'Medium',
          children: [
            { id: 'frontend-flexbox', title: 'Flexbox', type: 'checkpoint', difficulty: 'Easy' },
            { id: 'frontend-grid', title: 'CSS Grid', type: 'checkpoint', difficulty: 'Medium' },
          ]
        },
        { id: 'frontend-responsive', title: 'Responsive Design', type: 'secondary', difficulty: 'Medium' },
        { id: 'frontend-css-arch', title: 'CSS Architecture', type: 'optional', difficulty: 'Medium' },
      ],
    },
    {
      id: 'frontend-javascript',
      title: 'JavaScript',
      type: 'primary',
      description: 'Programming the web',
      difficulty: 'Medium',
      estimatedTime: '6 weeks',
      isRecommended: true,
      children: [
        { id: 'frontend-js-syntax', title: 'Syntax and Basic Constructs', type: 'secondary', difficulty: 'Easy' },
        { id: 'frontend-dom', title: 'DOM Manipulation', type: 'secondary', difficulty: 'Medium' },
        { id: 'frontend-fetch', title: 'Fetch API / AJAX', type: 'secondary', difficulty: 'Medium' },
        { 
          id: 'frontend-es6', 
          title: 'ES6+ Features', 
          type: 'secondary', 
          difficulty: 'Medium',
          children: [
            { id: 'frontend-arrow', title: 'Arrow Functions', type: 'checkpoint', difficulty: 'Easy' },
            { id: 'frontend-destructure', title: 'Destructuring', type: 'checkpoint', difficulty: 'Easy' },
            { id: 'frontend-spread', title: 'Spread Operator', type: 'checkpoint', difficulty: 'Easy' },
            { id: 'frontend-modules', title: 'Modules (import/export)', type: 'checkpoint', difficulty: 'Easy' },
            { id: 'frontend-promises', title: 'Promises & Async/Await', type: 'checkpoint', difficulty: 'Medium' },
          ]
        },
      ],
    },
    {
      id: 'frontend-vcs',
      title: 'Version Control',
      type: 'primary',
      description: 'Track and manage code changes',
      difficulty: 'Easy',
      estimatedTime: '1 week',
      children: [
        { id: 'frontend-git', title: 'Git Basics', type: 'secondary', difficulty: 'Easy' },
        { id: 'frontend-github', title: 'GitHub / GitLab', type: 'secondary', difficulty: 'Easy' },
      ],
    },
    {
      id: 'frontend-pkg',
      title: 'Package Managers',
      type: 'primary',
      description: 'npm and yarn',
      difficulty: 'Easy',
      estimatedTime: '3 days',
    },
    {
      id: 'frontend-build',
      title: 'Build Tools',
      type: 'primary',
      description: 'Modern development tooling',
      difficulty: 'Medium',
      estimatedTime: '1 week',
      children: [
        { id: 'frontend-bundlers', title: 'Bundlers (Webpack/Vite)', type: 'secondary', difficulty: 'Medium', isRecommended: true },
        { id: 'frontend-linters', title: 'Linters & Formatters', type: 'secondary', difficulty: 'Easy' },
      ],
    },
    {
      id: 'frontend-framework',
      title: 'Pick a Framework',
      type: 'primary',
      description: 'Choose your main tool',
      difficulty: 'Medium',
      estimatedTime: '8 weeks',
      isRecommended: true,
      children: [
        { 
          id: 'frontend-react', 
          title: 'React', 
          type: 'secondary', 
          difficulty: 'Medium',
          isRecommended: true,
          children: [
            { id: 'frontend-hooks', title: 'Hooks', type: 'checkpoint', difficulty: 'Medium' },
            { id: 'frontend-state', title: 'State Management', type: 'checkpoint', difficulty: 'Medium' },
            { id: 'frontend-router', title: 'React Router', type: 'checkpoint', difficulty: 'Easy' },
          ]
        },
        { id: 'frontend-vue', title: 'Vue.js', type: 'optional', difficulty: 'Medium' },
        { id: 'frontend-angular', title: 'Angular', type: 'optional', difficulty: 'Hard' },
      ],
    },
    {
      id: 'frontend-css-fw',
      title: 'CSS Frameworks',
      type: 'primary',
      description: 'Pre-built styling solutions',
      difficulty: 'Easy',
      estimatedTime: '1 week',
      children: [
        { id: 'frontend-tailwind', title: 'Tailwind CSS', type: 'secondary', difficulty: 'Easy', isRecommended: true },
        { id: 'frontend-bootstrap', title: 'Bootstrap', type: 'optional', difficulty: 'Easy' },
        { id: 'frontend-mui', title: 'Material UI', type: 'optional', difficulty: 'Medium' },
      ],
    },
    {
      id: 'frontend-testing',
      title: 'Testing',
      type: 'primary',
      description: 'Ensure code quality',
      difficulty: 'Medium',
      estimatedTime: '2 weeks',
      children: [
        { id: 'frontend-jest', title: 'Jest', type: 'secondary', difficulty: 'Medium' },
        { id: 'frontend-rtl', title: 'React Testing Library', type: 'secondary', difficulty: 'Medium' },
        { id: 'frontend-cypress', title: 'Cypress (E2E)', type: 'optional', difficulty: 'Medium' },
      ],
    },
    {
      id: 'frontend-typescript',
      title: 'TypeScript',
      type: 'primary',
      description: 'Type-safe JavaScript',
      difficulty: 'Medium',
      estimatedTime: '2 weeks',
      isRecommended: true,
    },
    {
      id: 'frontend-pwa',
      title: 'Progressive Web Apps',
      type: 'optional',
      description: 'App-like web experiences',
      difficulty: 'Hard',
      estimatedTime: '2 weeks',
    },
    {
      id: 'frontend-ssr',
      title: 'Server-Side Rendering',
      type: 'primary',
      description: 'Performance and SEO',
      difficulty: 'Hard',
      estimatedTime: '3 weeks',
      children: [
        { id: 'frontend-nextjs', title: 'Next.js', type: 'secondary', difficulty: 'Hard', isRecommended: true },
        { id: 'frontend-nuxt', title: 'Nuxt.js', type: 'optional', difficulty: 'Hard' },
      ],
    },
  ],
  faqs: [
    { question: 'Is Frontend Development easy to learn?', answer: 'Frontend has a gentle learning curve with HTML/CSS, but mastering JavaScript and frameworks takes dedicated practice. Most beginners can build simple sites within weeks.' },
    { question: 'How long does it take to become a Frontend Developer?', answer: 'With consistent study (15-20 hours/week), you can be job-ready in 6-12 months. The key is building real projects alongside learning.' },
    { question: 'What is the Frontend Developer salary?', answer: 'Entry-level: ₹4-8 LPA, Mid-level: ₹8-15 LPA, Senior: ₹15-30+ LPA. Salaries vary by location and company type.' },
  ],
};

// Backend Development Tree
export const backendTree: RoadmapTree = {
  id: 'backend',
  title: 'Backend Development',
  description: 'Build server-side applications and APIs',
  color: 'from-emerald-500 to-teal-500',
  icon: 'Server',
  nodes: [
    {
      id: 'backend-internet',
      title: 'Internet Fundamentals',
      type: 'primary',
      difficulty: 'Easy',
      estimatedTime: '1 week',
      children: [
        { id: 'backend-how-internet', title: 'How does the internet work?', type: 'secondary', difficulty: 'Easy' },
        { id: 'backend-http', title: 'HTTP / HTTPS', type: 'secondary', difficulty: 'Easy' },
        { id: 'backend-apis', title: 'What are APIs?', type: 'secondary', difficulty: 'Easy' },
      ],
    },
    {
      id: 'backend-language',
      title: 'Pick a Language',
      type: 'primary',
      description: 'Choose your primary backend language',
      difficulty: 'Medium',
      estimatedTime: '8 weeks',
      isRecommended: true,
      children: [
        { id: 'backend-nodejs', title: 'Node.js', type: 'secondary', difficulty: 'Medium', isRecommended: true },
        { id: 'backend-python', title: 'Python', type: 'secondary', difficulty: 'Easy' },
        { id: 'backend-java', title: 'Java', type: 'optional', difficulty: 'Hard' },
        { id: 'backend-go', title: 'Go', type: 'optional', difficulty: 'Medium' },
      ],
    },
    {
      id: 'backend-vcs',
      title: 'Version Control',
      type: 'primary',
      difficulty: 'Easy',
      estimatedTime: '1 week',
      children: [
        { id: 'backend-git', title: 'Git Basics', type: 'secondary', difficulty: 'Easy' },
        { id: 'backend-github', title: 'GitHub', type: 'secondary', difficulty: 'Easy' },
      ],
    },
    {
      id: 'backend-db',
      title: 'Databases',
      type: 'primary',
      description: 'Store and retrieve data',
      difficulty: 'Medium',
      estimatedTime: '4 weeks',
      isRecommended: true,
      children: [
        {
          id: 'backend-sql',
          title: 'Relational Databases',
          type: 'secondary',
          difficulty: 'Medium',
          children: [
            { id: 'backend-postgres', title: 'PostgreSQL', type: 'checkpoint', difficulty: 'Medium', isRecommended: true },
            { id: 'backend-mysql', title: 'MySQL', type: 'checkpoint', difficulty: 'Medium' },
          ],
        },
        {
          id: 'backend-nosql',
          title: 'NoSQL Databases',
          type: 'secondary',
          difficulty: 'Medium',
          children: [
            { id: 'backend-mongodb', title: 'MongoDB', type: 'checkpoint', difficulty: 'Medium' },
            { id: 'backend-redis', title: 'Redis', type: 'checkpoint', difficulty: 'Easy' },
          ],
        },
        { id: 'backend-orm', title: 'ORMs', type: 'secondary', difficulty: 'Medium' },
      ],
    },
    {
      id: 'backend-api-design',
      title: 'API Design',
      type: 'primary',
      description: 'Build APIs that scale',
      difficulty: 'Medium',
      estimatedTime: '3 weeks',
      children: [
        { id: 'backend-rest', title: 'REST API', type: 'secondary', difficulty: 'Medium', isRecommended: true },
        { id: 'backend-graphql', title: 'GraphQL', type: 'optional', difficulty: 'Hard' },
        { id: 'backend-grpc', title: 'gRPC', type: 'optional', difficulty: 'Hard' },
      ],
    },
    {
      id: 'backend-auth',
      title: 'Authentication',
      type: 'primary',
      description: 'Secure your applications',
      difficulty: 'Medium',
      estimatedTime: '2 weeks',
      children: [
        { id: 'backend-jwt', title: 'JWT', type: 'secondary', difficulty: 'Medium' },
        { id: 'backend-oauth', title: 'OAuth 2.0', type: 'secondary', difficulty: 'Hard' },
        { id: 'backend-sessions', title: 'Session-based Auth', type: 'secondary', difficulty: 'Medium' },
      ],
    },
    {
      id: 'backend-caching',
      title: 'Caching',
      type: 'primary',
      difficulty: 'Medium',
      estimatedTime: '1 week',
      children: [
        { id: 'backend-redis-cache', title: 'Redis Caching', type: 'secondary', difficulty: 'Medium' },
        { id: 'backend-cdn', title: 'CDN', type: 'secondary', difficulty: 'Easy' },
      ],
    },
    {
      id: 'backend-security',
      title: 'Security',
      type: 'primary',
      description: 'Protect against attacks',
      difficulty: 'Hard',
      estimatedTime: '2 weeks',
      children: [
        { id: 'backend-https', title: 'HTTPS', type: 'secondary', difficulty: 'Easy' },
        { id: 'backend-owasp', title: 'OWASP Top 10', type: 'secondary', difficulty: 'Hard' },
        { id: 'backend-hashing', title: 'Hashing (bcrypt)', type: 'secondary', difficulty: 'Medium' },
      ],
    },
    {
      id: 'backend-testing',
      title: 'Testing',
      type: 'primary',
      difficulty: 'Medium',
      estimatedTime: '2 weeks',
      children: [
        { id: 'backend-unit', title: 'Unit Testing', type: 'secondary', difficulty: 'Medium' },
        { id: 'backend-integration', title: 'Integration Testing', type: 'secondary', difficulty: 'Medium' },
      ],
    },
    {
      id: 'backend-containerization',
      title: 'Containerization',
      type: 'primary',
      difficulty: 'Medium',
      estimatedTime: '2 weeks',
      children: [
        { id: 'backend-docker', title: 'Docker', type: 'secondary', difficulty: 'Medium', isRecommended: true },
        { id: 'backend-k8s', title: 'Kubernetes', type: 'optional', difficulty: 'Hard' },
      ],
    },
  ],
  faqs: [
    { question: 'Is Backend Development harder than Frontend?', answer: 'Backend involves more abstract concepts (databases, servers, security), but the learning curve depends on your background. Both have their challenges.' },
    { question: 'Which backend language should I learn first?', answer: 'Node.js if you know JavaScript, Python for beginners, Java for enterprise focus. All are valid choices with strong job markets.' },
    { question: 'What is the Backend Developer salary?', answer: 'Entry-level: ₹5-10 LPA, Mid-level: ₹10-18 LPA, Senior: ₹18-35+ LPA. Backend roles often command slightly higher salaries.' },
  ],
};

// Full Stack Tree
export const fullstackTree: RoadmapTree = {
  id: 'fullstack',
  title: 'Full Stack Development',
  description: 'Master both frontend and backend',
  color: 'from-purple-500 to-pink-500',
  icon: 'Layers',
  nodes: [
    {
      id: 'fullstack-frontend',
      title: 'Frontend Foundations',
      type: 'primary',
      difficulty: 'Medium',
      estimatedTime: '10 weeks',
      isRecommended: true,
      children: [
        { id: 'fullstack-html', title: 'HTML & CSS', type: 'secondary', difficulty: 'Easy' },
        { id: 'fullstack-js', title: 'JavaScript', type: 'secondary', difficulty: 'Medium' },
        { id: 'fullstack-react', title: 'React', type: 'secondary', difficulty: 'Medium', isRecommended: true },
        { id: 'fullstack-ts', title: 'TypeScript', type: 'secondary', difficulty: 'Medium' },
      ],
    },
    {
      id: 'fullstack-backend',
      title: 'Backend Foundations',
      type: 'primary',
      difficulty: 'Medium',
      estimatedTime: '10 weeks',
      isRecommended: true,
      children: [
        { id: 'fullstack-node', title: 'Node.js + Express', type: 'secondary', difficulty: 'Medium', isRecommended: true },
        { id: 'fullstack-db', title: 'PostgreSQL / MongoDB', type: 'secondary', difficulty: 'Medium' },
        { id: 'fullstack-api', title: 'REST API Design', type: 'secondary', difficulty: 'Medium' },
        { id: 'fullstack-auth', title: 'Authentication', type: 'secondary', difficulty: 'Medium' },
      ],
    },
    {
      id: 'fullstack-tools',
      title: 'Development Tools',
      type: 'primary',
      difficulty: 'Easy',
      estimatedTime: '2 weeks',
      children: [
        { id: 'fullstack-git', title: 'Git & GitHub', type: 'secondary', difficulty: 'Easy' },
        { id: 'fullstack-vscode', title: 'VS Code', type: 'secondary', difficulty: 'Easy' },
        { id: 'fullstack-postman', title: 'Postman / Thunder Client', type: 'secondary', difficulty: 'Easy' },
      ],
    },
    {
      id: 'fullstack-deployment',
      title: 'Deployment',
      type: 'primary',
      difficulty: 'Medium',
      estimatedTime: '2 weeks',
      children: [
        { id: 'fullstack-vercel', title: 'Vercel / Netlify', type: 'secondary', difficulty: 'Easy' },
        { id: 'fullstack-docker', title: 'Docker Basics', type: 'secondary', difficulty: 'Medium' },
        { id: 'fullstack-aws', title: 'AWS / Cloud Basics', type: 'optional', difficulty: 'Hard' },
      ],
    },
    {
      id: 'fullstack-advanced',
      title: 'Advanced Topics',
      type: 'primary',
      difficulty: 'Hard',
      estimatedTime: '4 weeks',
      children: [
        { id: 'fullstack-nextjs', title: 'Next.js', type: 'secondary', difficulty: 'Hard', isRecommended: true },
        { id: 'fullstack-graphql', title: 'GraphQL', type: 'optional', difficulty: 'Hard' },
        { id: 'fullstack-websockets', title: 'WebSockets', type: 'optional', difficulty: 'Medium' },
      ],
    },
  ],
  faqs: [
    { question: 'Should I learn frontend or backend first?', answer: 'Start with frontend (HTML/CSS/JS) - it provides immediate visual feedback which keeps motivation high. Then add backend skills.' },
    { question: 'How long to become a Full Stack Developer?', answer: '12-18 months with consistent practice. Focus on one stack (like MERN) before expanding to others.' },
    { question: 'What is the Full Stack Developer salary?', answer: 'Entry-level: ₹6-12 LPA, Mid-level: ₹12-22 LPA, Senior: ₹22-40+ LPA. Full stack developers are in high demand.' },
  ],
};

// DevOps Tree
export const devopsTree: RoadmapTree = {
  id: 'devops',
  title: 'DevOps & Cloud',
  description: 'Automate, deploy, and scale',
  color: 'from-orange-500 to-red-500',
  icon: 'Cloud',
  nodes: [
    {
      id: 'devops-linux',
      title: 'Linux Fundamentals',
      type: 'primary',
      difficulty: 'Medium',
      estimatedTime: '3 weeks',
      isRecommended: true,
      children: [
        { id: 'devops-cli', title: 'Command Line Basics', type: 'secondary', difficulty: 'Easy' },
        { id: 'devops-shell', title: 'Shell Scripting', type: 'secondary', difficulty: 'Medium' },
        { id: 'devops-ssh', title: 'SSH & Permissions', type: 'secondary', difficulty: 'Medium' },
      ],
    },
    {
      id: 'devops-networking',
      title: 'Networking Basics',
      type: 'primary',
      difficulty: 'Medium',
      estimatedTime: '2 weeks',
      children: [
        { id: 'devops-dns', title: 'DNS', type: 'secondary', difficulty: 'Easy' },
        { id: 'devops-http', title: 'HTTP / HTTPS', type: 'secondary', difficulty: 'Easy' },
        { id: 'devops-firewalls', title: 'Firewalls', type: 'secondary', difficulty: 'Medium' },
      ],
    },
    {
      id: 'devops-vcs',
      title: 'Version Control',
      type: 'primary',
      difficulty: 'Easy',
      estimatedTime: '1 week',
      children: [
        { id: 'devops-git', title: 'Git Advanced', type: 'secondary', difficulty: 'Medium' },
        { id: 'devops-github', title: 'GitHub Actions', type: 'secondary', difficulty: 'Medium', isRecommended: true },
      ],
    },
    {
      id: 'devops-containers',
      title: 'Containers',
      type: 'primary',
      difficulty: 'Medium',
      estimatedTime: '4 weeks',
      isRecommended: true,
      children: [
        { id: 'devops-docker', title: 'Docker', type: 'secondary', difficulty: 'Medium', isRecommended: true },
        { id: 'devops-compose', title: 'Docker Compose', type: 'secondary', difficulty: 'Medium' },
        { id: 'devops-k8s', title: 'Kubernetes', type: 'secondary', difficulty: 'Hard' },
      ],
    },
    {
      id: 'devops-cicd',
      title: 'CI/CD',
      type: 'primary',
      description: 'Automate testing and deployment',
      difficulty: 'Medium',
      estimatedTime: '3 weeks',
      children: [
        { id: 'devops-gha', title: 'GitHub Actions', type: 'secondary', difficulty: 'Medium', isRecommended: true },
        { id: 'devops-jenkins', title: 'Jenkins', type: 'optional', difficulty: 'Hard' },
        { id: 'devops-gitlab', title: 'GitLab CI', type: 'optional', difficulty: 'Medium' },
      ],
    },
    {
      id: 'devops-cloud',
      title: 'Cloud Providers',
      type: 'primary',
      difficulty: 'Hard',
      estimatedTime: '8 weeks',
      isRecommended: true,
      children: [
        { id: 'devops-aws', title: 'AWS', type: 'secondary', difficulty: 'Hard', isRecommended: true },
        { id: 'devops-gcp', title: 'Google Cloud', type: 'optional', difficulty: 'Hard' },
        { id: 'devops-azure', title: 'Azure', type: 'optional', difficulty: 'Hard' },
      ],
    },
    {
      id: 'devops-iac',
      title: 'Infrastructure as Code',
      type: 'primary',
      difficulty: 'Hard',
      estimatedTime: '4 weeks',
      children: [
        { id: 'devops-terraform', title: 'Terraform', type: 'secondary', difficulty: 'Hard', isRecommended: true },
        { id: 'devops-ansible', title: 'Ansible', type: 'optional', difficulty: 'Hard' },
      ],
    },
    {
      id: 'devops-monitoring',
      title: 'Monitoring & Logging',
      type: 'primary',
      difficulty: 'Medium',
      estimatedTime: '2 weeks',
      children: [
        { id: 'devops-prometheus', title: 'Prometheus', type: 'secondary', difficulty: 'Medium' },
        { id: 'devops-grafana', title: 'Grafana', type: 'secondary', difficulty: 'Medium' },
        { id: 'devops-elk', title: 'ELK Stack', type: 'optional', difficulty: 'Hard' },
      ],
    },
  ],
  faqs: [
    { question: 'Is DevOps a good career choice?', answer: 'Absolutely! DevOps engineers are in high demand with excellent salaries. The role bridges development and operations.' },
    { question: 'What should I learn first - Docker or Kubernetes?', answer: 'Start with Docker. Master containers before moving to orchestration with Kubernetes.' },
    { question: 'What is the DevOps Engineer salary?', answer: 'Entry-level: ₹8-15 LPA, Mid-level: ₹15-25 LPA, Senior: ₹25-50+ LPA. Among the highest-paid tech roles.' },
  ],
};

// Mobile Development Tree
export const mobileTree: RoadmapTree = {
  id: 'mobile',
  title: 'Mobile Development',
  description: 'Build iOS and Android apps',
  color: 'from-blue-500 to-indigo-500',
  icon: 'Smartphone',
  nodes: [
    {
      id: 'mobile-basics',
      title: 'Programming Fundamentals',
      type: 'primary',
      difficulty: 'Easy',
      estimatedTime: '4 weeks',
      children: [
        { id: 'mobile-js', title: 'JavaScript', type: 'secondary', difficulty: 'Medium' },
        { id: 'mobile-ts', title: 'TypeScript', type: 'secondary', difficulty: 'Medium' },
      ],
    },
    {
      id: 'mobile-path',
      title: 'Choose Your Path',
      type: 'primary',
      difficulty: 'Medium',
      estimatedTime: '12 weeks',
      isRecommended: true,
      children: [
        {
          id: 'mobile-cross',
          title: 'Cross-Platform',
          type: 'secondary',
          difficulty: 'Medium',
          isRecommended: true,
          children: [
            { id: 'mobile-rn', title: 'React Native', type: 'checkpoint', difficulty: 'Medium', isRecommended: true },
            { id: 'mobile-flutter', title: 'Flutter', type: 'checkpoint', difficulty: 'Medium' },
          ],
        },
        {
          id: 'mobile-native',
          title: 'Native Development',
          type: 'secondary',
          difficulty: 'Hard',
          children: [
            { id: 'mobile-swift', title: 'iOS (Swift)', type: 'checkpoint', difficulty: 'Hard' },
            { id: 'mobile-kotlin', title: 'Android (Kotlin)', type: 'checkpoint', difficulty: 'Hard' },
          ],
        },
      ],
    },
    {
      id: 'mobile-ui',
      title: 'Mobile UI/UX',
      type: 'primary',
      difficulty: 'Medium',
      estimatedTime: '3 weeks',
      children: [
        { id: 'mobile-design', title: 'Mobile Design Patterns', type: 'secondary', difficulty: 'Medium' },
        { id: 'mobile-animation', title: 'Animations', type: 'secondary', difficulty: 'Medium' },
        { id: 'mobile-gestures', title: 'Gestures & Touch', type: 'secondary', difficulty: 'Medium' },
      ],
    },
    {
      id: 'mobile-data',
      title: 'Data & State',
      type: 'primary',
      difficulty: 'Medium',
      estimatedTime: '3 weeks',
      children: [
        { id: 'mobile-storage', title: 'Local Storage', type: 'secondary', difficulty: 'Easy' },
        { id: 'mobile-api', title: 'API Integration', type: 'secondary', difficulty: 'Medium' },
        { id: 'mobile-state', title: 'State Management', type: 'secondary', difficulty: 'Medium' },
      ],
    },
    {
      id: 'mobile-publish',
      title: 'App Publishing',
      type: 'primary',
      difficulty: 'Medium',
      estimatedTime: '1 week',
      children: [
        { id: 'mobile-appstore', title: 'App Store', type: 'secondary', difficulty: 'Medium' },
        { id: 'mobile-playstore', title: 'Play Store', type: 'secondary', difficulty: 'Medium' },
      ],
    },
  ],
  faqs: [
    { question: 'Should I learn React Native or Flutter?', answer: 'React Native if you know JavaScript/React. Flutter for better performance and if you want to learn Dart.' },
    { question: 'Is mobile development still relevant?', answer: 'Absolutely! Mobile usage continues to grow. Cross-platform tools make it easier than ever.' },
    { question: 'What is the Mobile Developer salary?', answer: 'Entry-level: ₹5-10 LPA, Mid-level: ₹10-20 LPA, Senior: ₹20-40+ LPA. iOS developers often command premium.' },
  ],
};

// AI/ML Tree
export const aimlTree: RoadmapTree = {
  id: 'ai-ml',
  title: 'AI & Machine Learning',
  description: 'Build intelligent systems',
  color: 'from-violet-500 to-purple-500',
  icon: 'Brain',
  nodes: [
    {
      id: 'aiml-math',
      title: 'Mathematics Foundations',
      type: 'primary',
      difficulty: 'Hard',
      estimatedTime: '6 weeks',
      children: [
        { id: 'aiml-linear', title: 'Linear Algebra', type: 'secondary', difficulty: 'Hard' },
        { id: 'aiml-stats', title: 'Statistics & Probability', type: 'secondary', difficulty: 'Hard' },
        { id: 'aiml-calculus', title: 'Calculus', type: 'secondary', difficulty: 'Hard' },
      ],
    },
    {
      id: 'aiml-python',
      title: 'Python for ML',
      type: 'primary',
      difficulty: 'Medium',
      estimatedTime: '4 weeks',
      isRecommended: true,
      children: [
        { id: 'aiml-numpy', title: 'NumPy', type: 'secondary', difficulty: 'Medium' },
        { id: 'aiml-pandas', title: 'Pandas', type: 'secondary', difficulty: 'Medium' },
        { id: 'aiml-matplotlib', title: 'Matplotlib / Seaborn', type: 'secondary', difficulty: 'Easy' },
      ],
    },
    {
      id: 'aiml-ml',
      title: 'Machine Learning',
      type: 'primary',
      difficulty: 'Hard',
      estimatedTime: '8 weeks',
      isRecommended: true,
      children: [
        { id: 'aiml-supervised', title: 'Supervised Learning', type: 'secondary', difficulty: 'Hard' },
        { id: 'aiml-unsupervised', title: 'Unsupervised Learning', type: 'secondary', difficulty: 'Hard' },
        { id: 'aiml-sklearn', title: 'Scikit-learn', type: 'secondary', difficulty: 'Medium', isRecommended: true },
      ],
    },
    {
      id: 'aiml-dl',
      title: 'Deep Learning',
      type: 'primary',
      difficulty: 'Hard',
      estimatedTime: '8 weeks',
      children: [
        { id: 'aiml-neural', title: 'Neural Networks', type: 'secondary', difficulty: 'Hard' },
        { id: 'aiml-cnn', title: 'CNNs', type: 'secondary', difficulty: 'Hard' },
        { id: 'aiml-rnn', title: 'RNNs / LSTMs', type: 'secondary', difficulty: 'Hard' },
        { id: 'aiml-tf', title: 'TensorFlow / PyTorch', type: 'secondary', difficulty: 'Hard', isRecommended: true },
      ],
    },
    {
      id: 'aiml-nlp',
      title: 'NLP',
      type: 'optional',
      difficulty: 'Hard',
      estimatedTime: '4 weeks',
      children: [
        { id: 'aiml-transformers', title: 'Transformers', type: 'secondary', difficulty: 'Hard' },
        { id: 'aiml-llm', title: 'LLMs', type: 'secondary', difficulty: 'Hard', isRecommended: true },
      ],
    },
    {
      id: 'aiml-mlops',
      title: 'MLOps',
      type: 'primary',
      difficulty: 'Hard',
      estimatedTime: '4 weeks',
      children: [
        { id: 'aiml-deploy', title: 'Model Deployment', type: 'secondary', difficulty: 'Hard' },
        { id: 'aiml-monitoring', title: 'Model Monitoring', type: 'secondary', difficulty: 'Medium' },
      ],
    },
  ],
  faqs: [
    { question: 'Do I need a PhD for AI/ML?', answer: 'Not for most industry roles. Strong programming + ML fundamentals + good projects can land you a job.' },
    { question: 'How important is math for ML?', answer: 'Very important for understanding, but you can start with libraries and learn math gradually.' },
    { question: 'What is the AI/ML Engineer salary?', answer: 'Entry-level: ₹8-15 LPA, Mid-level: ₹15-30 LPA, Senior: ₹30-60+ LPA. Top talent commands premium.' },
  ],
};

// Data Engineering Tree
export const dataTree: RoadmapTree = {
  id: 'data',
  title: 'Data Engineering',
  description: 'Build data pipelines and infrastructure',
  color: 'from-amber-500 to-orange-500',
  icon: 'Database',
  nodes: [
    {
      id: 'data-lang',
      title: 'Programming Languages',
      type: 'primary',
      difficulty: 'Medium',
      estimatedTime: '6 weeks',
      children: [
        { id: 'data-python', title: 'Python', type: 'secondary', difficulty: 'Medium', isRecommended: true },
        { id: 'data-sql', title: 'SQL', type: 'secondary', difficulty: 'Medium', isRecommended: true },
        { id: 'data-scala', title: 'Scala', type: 'optional', difficulty: 'Hard' },
      ],
    },
    {
      id: 'data-databases',
      title: 'Databases',
      type: 'primary',
      difficulty: 'Medium',
      estimatedTime: '4 weeks',
      isRecommended: true,
      children: [
        { id: 'data-rdbms', title: 'RDBMS (PostgreSQL)', type: 'secondary', difficulty: 'Medium' },
        { id: 'data-nosql', title: 'NoSQL (MongoDB)', type: 'secondary', difficulty: 'Medium' },
        { id: 'data-columnar', title: 'Columnar (Cassandra)', type: 'secondary', difficulty: 'Hard' },
      ],
    },
    {
      id: 'data-pipelines',
      title: 'Data Pipelines',
      type: 'primary',
      difficulty: 'Hard',
      estimatedTime: '6 weeks',
      isRecommended: true,
      children: [
        { id: 'data-etl', title: 'ETL Concepts', type: 'secondary', difficulty: 'Medium' },
        { id: 'data-airflow', title: 'Apache Airflow', type: 'secondary', difficulty: 'Hard', isRecommended: true },
        { id: 'data-luigi', title: 'Luigi', type: 'optional', difficulty: 'Medium' },
      ],
    },
    {
      id: 'data-bigdata',
      title: 'Big Data',
      type: 'primary',
      difficulty: 'Hard',
      estimatedTime: '8 weeks',
      children: [
        { id: 'data-spark', title: 'Apache Spark', type: 'secondary', difficulty: 'Hard', isRecommended: true },
        { id: 'data-hadoop', title: 'Hadoop', type: 'secondary', difficulty: 'Hard' },
        { id: 'data-kafka', title: 'Kafka', type: 'secondary', difficulty: 'Hard' },
      ],
    },
    {
      id: 'data-warehouse',
      title: 'Data Warehousing',
      type: 'primary',
      difficulty: 'Hard',
      estimatedTime: '4 weeks',
      children: [
        { id: 'data-snowflake', title: 'Snowflake', type: 'secondary', difficulty: 'Medium', isRecommended: true },
        { id: 'data-redshift', title: 'Redshift', type: 'secondary', difficulty: 'Hard' },
        { id: 'data-bigquery', title: 'BigQuery', type: 'secondary', difficulty: 'Medium' },
      ],
    },
    {
      id: 'data-cloud',
      title: 'Cloud Platforms',
      type: 'primary',
      difficulty: 'Hard',
      estimatedTime: '4 weeks',
      children: [
        { id: 'data-aws', title: 'AWS Data Services', type: 'secondary', difficulty: 'Hard' },
        { id: 'data-gcp', title: 'GCP Data Services', type: 'optional', difficulty: 'Hard' },
      ],
    },
  ],
  faqs: [
    { question: 'Is Data Engineering different from Data Science?', answer: 'Yes! Data Engineers build infrastructure and pipelines. Data Scientists analyze data and build models. Both are essential.' },
    { question: 'What tools should I learn first?', answer: 'Start with Python + SQL, then learn Airflow for pipelines and Spark for big data processing.' },
    { question: 'What is the Data Engineer salary?', answer: 'Entry-level: ₹6-12 LPA, Mid-level: ₹12-25 LPA, Senior: ₹25-50+ LPA. Growing demand in all industries.' },
  ],
};

// Export all trees
export const roadmapTrees: RoadmapTree[] = [
  frontendTree,
  backendTree,
  fullstackTree,
  devopsTree,
  mobileTree,
  aimlTree,
  dataTree,
];

// Helper function to get tree by ID
export const getRoadmapTreeById = (id: string): RoadmapTree | undefined => {
  return roadmapTrees.find(tree => tree.id === id);
};

// Helper function to flatten tree nodes for progress tracking
export const flattenTreeNodes = (nodes: RoadmapTreeNode[]): RoadmapTreeNode[] => {
  const result: RoadmapTreeNode[] = [];
  
  const traverse = (nodeList: RoadmapTreeNode[]) => {
    for (const node of nodeList) {
      result.push(node);
      if (node.children) {
        traverse(node.children);
      }
    }
  };
  
  traverse(nodes);
  return result;
};

// Helper to count total nodes in a tree
export const countTreeNodes = (nodes: RoadmapTreeNode[]): number => {
  return flattenTreeNodes(nodes).length;
};
