export type NodeStatus = 'done' | 'in-progress' | 'skipped' | 'pending';

export interface RoadmapResource {
  title: string;
  url: string;
  type: 'video' | 'docs' | 'article';
}

export interface RoadmapNodeData {
  id: string;
  title: string;
  description: string;
  section: string;
  sectionColor: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  resources: RoadmapResource[];
  isAlternative?: boolean;
}

// Block types for the visual layout
export type RoadmapBlock =
  | { type: 'section-label'; label: string; subtitle?: string }
  | { type: 'row'; nodes: string[]; connector?: 'solid' | 'dashed' }
  | { type: 'checkpoint'; label: string; id?: string }
  | { type: 'annotation'; text: string; side?: 'left' | 'right' | 'center' }
  | { type: 'divider'; label?: string }
  | { type: 'continue'; tracks: string[] };

const r = (title: string, url: string, type: 'video' | 'docs' | 'article'): RoadmapResource => ({ title, url, type });

// ── All topic nodes (referenced by id in blocks) ──
export const roadmapNodesData: RoadmapNodeData[] = [
  // Internet & Basics
  { id: 'internet-how', title: 'How Internet Works', description: 'Learn the fundamentals of how data travels across the internet, including packets, protocols, and routing.', section: 'Internet', sectionColor: '#64748b', difficulty: 'Beginner', resources: [r('How the Internet Works - MDN', 'https://developer.mozilla.org/en-US/docs/Learn/Common_questions/How_does_the_Internet_work', 'docs'), r('How the Internet Works in 5 Min', 'https://www.youtube.com/watch?v=7_LPdttKXPc', 'video')] },
  { id: 'http-https', title: 'HTTP / HTTPS', description: 'Understand HTTP methods, status codes, headers, and how HTTPS provides secure communication.', section: 'Internet', sectionColor: '#64748b', difficulty: 'Beginner', resources: [r('HTTP Overview - MDN', 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview', 'docs'), r('HTTP Crash Course', 'https://www.youtube.com/watch?v=iYM2zFP3Zn0', 'video')] },
  { id: 'dns', title: 'DNS', description: 'Learn how domain names are resolved to IP addresses through the Domain Name System.', section: 'Internet', sectionColor: '#64748b', difficulty: 'Beginner', resources: [r('What is DNS?', 'https://www.cloudflare.com/learning/dns/what-is-dns/', 'article'), r('DNS Explained', 'https://www.youtube.com/watch?v=Wj0od2ag5sk', 'video')] },
  { id: 'browsers', title: 'Browsers', description: 'Understand the rendering pipeline: parsing HTML, building DOM, CSSOM, layout, paint, and compositing.', section: 'Internet', sectionColor: '#64748b', difficulty: 'Beginner', resources: [r('How Browsers Work - web.dev', 'https://web.dev/howbrowserswork/', 'article'), r('Browser Rendering', 'https://www.youtube.com/watch?v=SmE4OwHztCc', 'video')] },

  // HTML, CSS, JS
  { id: 'html', title: 'HTML', description: 'Learn HTML document structure, semantic elements, forms, tables, and accessibility best practices.', section: 'Frontend', sectionColor: '#f97316', difficulty: 'Beginner', resources: [r('HTML Basics - MDN', 'https://developer.mozilla.org/en-US/docs/Learn/Getting_started_with_the_web/HTML_basics', 'docs'), r('HTML Full Course', 'https://www.youtube.com/watch?v=pQN-pnXPaVg', 'video')] },
  { id: 'css', title: 'CSS', description: 'Learn selectors, box model, Flexbox, Grid, responsive design, animations, and modern CSS features.', section: 'Frontend', sectionColor: '#3b82f6', difficulty: 'Beginner', resources: [r('CSS Basics - MDN', 'https://developer.mozilla.org/en-US/docs/Learn/CSS/First_steps', 'docs'), r('CSS Crash Course', 'https://www.youtube.com/watch?v=yfoY53QXEnI', 'video')] },
  { id: 'javascript', title: 'JavaScript', description: 'Variables, functions, DOM manipulation, events, ES6+, async/await, closures, and modules.', section: 'Frontend', sectionColor: '#eab308', difficulty: 'Beginner', resources: [r('JavaScript Guide - MDN', 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide', 'docs'), r('JavaScript Tutorial', 'https://www.youtube.com/watch?v=W6NZfCO5SIk', 'video')] },
  { id: 'npm', title: 'npm', description: 'Node Package Manager — installing, updating, publishing packages, and managing dependencies.', section: 'Frontend', sectionColor: '#eab308', difficulty: 'Beginner', resources: [r('npm Docs', 'https://docs.npmjs.com/', 'docs'), r('NPM Crash Course', 'https://www.youtube.com/watch?v=jHDhaSSKv7c', 'video')] },

  // React, Tailwind, Git
  { id: 'react', title: 'React', description: 'Components, JSX, props, hooks, state management, routing, and React design patterns.', section: 'Frontend', sectionColor: '#06b6d4', difficulty: 'Intermediate', resources: [r('React Quick Start', 'https://react.dev/learn', 'docs'), r('React Tutorial', 'https://www.youtube.com/watch?v=SqcY0GlETPk', 'video')] },
  { id: 'tailwind', title: 'Tailwind CSS', description: 'Utility-first CSS framework for rapidly building custom designs without writing custom CSS.', section: 'Frontend', sectionColor: '#06b6d4', difficulty: 'Intermediate', resources: [r('Tailwind CSS Docs', 'https://tailwindcss.com/docs', 'docs'), r('Tailwind Crash Course', 'https://www.youtube.com/watch?v=UBOj6rqRUME', 'video')] },
  { id: 'github', title: 'GitHub', description: 'Pull requests, code reviews, issues, forks, GitHub Actions, and collaborative workflows.', section: 'Frontend', sectionColor: '#64748b', difficulty: 'Beginner', resources: [r('GitHub Docs', 'https://docs.github.com/en/get-started', 'docs'), r('GitHub Crash Course', 'https://www.youtube.com/watch?v=RGOj5yH7evk', 'video')] },
  { id: 'git', title: 'Git', description: 'Version control, branching, merging, rebasing, stashing, and collaborative workflows.', section: 'Frontend', sectionColor: '#64748b', difficulty: 'Beginner', resources: [r('Git Handbook', 'https://guides.github.com/introduction/git-handbook/', 'docs'), r('Git Tutorial', 'https://www.youtube.com/watch?v=8JJ101D3knE', 'video')] },

  // TypeScript
  { id: 'typescript', title: 'TypeScript', description: 'Type annotations, interfaces, generics, utility types, and TypeScript configuration.', section: 'Frontend', sectionColor: '#3178c6', difficulty: 'Intermediate', resources: [r('TypeScript Handbook', 'https://www.typescriptlang.org/docs/handbook/', 'docs'), r('TypeScript Crash Course', 'https://www.youtube.com/watch?v=BCg4U1FzODs', 'video')] },

  // Build Tools
  { id: 'vite', title: 'Vite', description: 'Next-gen frontend build tool with instant HMR, native ES modules, and blazing fast builds.', section: 'Frontend', sectionColor: '#f97316', difficulty: 'Intermediate', resources: [r('Vite Documentation', 'https://vite.dev/guide/', 'docs'), r('Vite Crash Course', 'https://www.youtube.com/watch?v=KCrXgy8qtjM', 'video')] },
  { id: 'webpack', title: 'Webpack', description: 'Module bundler — loaders, plugins, code splitting, tree shaking, and optimization.', section: 'Frontend', sectionColor: '#f97316', difficulty: 'Intermediate', isAlternative: true, resources: [r('Webpack Docs', 'https://webpack.js.org/concepts/', 'docs'), r('Webpack Crash Course', 'https://www.youtube.com/watch?v=IZGNcSuwBZs', 'video')] },
  { id: 'eslint', title: 'ESLint & Prettier', description: 'Linting and auto-formatting for consistent, bug-free code across teams.', section: 'Frontend', sectionColor: '#a855f7', difficulty: 'Beginner', resources: [r('ESLint Docs', 'https://eslint.org/docs/latest/use/getting-started', 'docs'), r('ESLint & Prettier Setup', 'https://www.youtube.com/watch?v=SydnKbGc7W8', 'video')] },

  // Testing
  { id: 'jest', title: 'Jest / Vitest', description: 'JavaScript testing frameworks — assertions, mocking, snapshots, and coverage.', section: 'Testing', sectionColor: '#14b8a6', difficulty: 'Intermediate', resources: [r('Jest Docs', 'https://jestjs.io/docs/getting-started', 'docs'), r('Vitest Crash Course', 'https://www.youtube.com/watch?v=7f-71kYhK00', 'video')] },
  { id: 'rtl', title: 'React Testing Library', description: 'Testing React components from the user perspective — queries, events, and async patterns.', section: 'Testing', sectionColor: '#14b8a6', difficulty: 'Intermediate', resources: [r('Testing Library Docs', 'https://testing-library.com/docs/react-testing-library/intro/', 'docs'), r('React Testing Crash Course', 'https://www.youtube.com/watch?v=8Xwq35cPwYg', 'video')] },
  { id: 'cypress', title: 'Cypress / Playwright', description: 'End-to-end testing in real browser environments for complete user flow testing.', section: 'Testing', sectionColor: '#14b8a6', difficulty: 'Advanced', isAlternative: true, resources: [r('Playwright Docs', 'https://playwright.dev/docs/intro', 'docs'), r('Cypress Crash Course', 'https://www.youtube.com/watch?v=BQqzfHQkREo', 'video')] },

  // Backend - Node.js
  { id: 'nodejs', title: 'Node.js', description: 'Runtime environment, modules, file system, event loop, streams, and npm package management.', section: 'Backend', sectionColor: '#22c55e', difficulty: 'Intermediate', resources: [r('Node.js Getting Started', 'https://nodejs.org/en/learn/getting-started/introduction-to-nodejs', 'docs'), r('Node.js Crash Course', 'https://www.youtube.com/watch?v=fBNz5xF-Kx4', 'video')] },
  { id: 'express', title: 'Express.js', description: 'Build web servers and REST APIs — routing, middleware, error handling, and templates.', section: 'Backend', sectionColor: '#22c55e', difficulty: 'Intermediate', resources: [r('Express.js Guide', 'https://expressjs.com/en/guide/routing.html', 'docs'), r('Express Crash Course', 'https://www.youtube.com/watch?v=SccSCuHhOw0', 'video')] },
  { id: 'postgres', title: 'PostgreSQL', description: 'Advanced relational database with JSON support, full-text search, CTEs, and excellent performance.', section: 'Backend', sectionColor: '#8b5cf6', difficulty: 'Intermediate', resources: [r('PostgreSQL Tutorial', 'https://www.postgresqltutorial.com/', 'docs'), r('PostgreSQL Crash Course', 'https://www.youtube.com/watch?v=qw--VYLpxG4', 'video')] },
  { id: 'redis', title: 'Redis', description: 'In-memory data store for caching, sessions, message brokering, and real-time leaderboards.', section: 'Backend', sectionColor: '#ef4444', difficulty: 'Intermediate', resources: [r('Redis Docs', 'https://redis.io/docs/', 'docs'), r('Redis Crash Course', 'https://www.youtube.com/watch?v=jgpVdJB2sKQ', 'video')] },
  { id: 'jwt', title: 'JWT Auth', description: 'JSON Web Tokens for stateless authentication, refresh tokens, and secure API access.', section: 'Backend', sectionColor: '#22c55e', difficulty: 'Intermediate', resources: [r('JWT Introduction', 'https://jwt.io/introduction', 'docs'), r('JWT Auth Tutorial', 'https://www.youtube.com/watch?v=mbsmsi7l3r4', 'video')] },
  { id: 'rest-api', title: 'RESTful APIs', description: 'Design RESTful APIs with proper resource naming, HTTP methods, status codes, and versioning.', section: 'Backend', sectionColor: '#22c55e', difficulty: 'Intermediate', resources: [r('REST API Tutorial', 'https://restfulapi.net/', 'article'), r('REST API Design', 'https://www.youtube.com/watch?v=-MTSQjw5DrM', 'video')] },
  { id: 'graphql', title: 'GraphQL', description: 'Query language for APIs with a single endpoint, type system, and client-driven data fetching.', section: 'Backend', sectionColor: '#e91e8f', difficulty: 'Advanced', isAlternative: true, resources: [r('GraphQL Docs', 'https://graphql.org/learn/', 'docs'), r('GraphQL Crash Course', 'https://www.youtube.com/watch?v=ed8SzALpx1Q', 'video')] },
  { id: 'websockets', title: 'WebSockets', description: 'Real-time bidirectional communication for live features like chat, notifications, and gaming.', section: 'Backend', sectionColor: '#22c55e', difficulty: 'Advanced', resources: [r('WebSocket API - MDN', 'https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API', 'docs'), r('WebSockets Tutorial', 'https://www.youtube.com/watch?v=8ARodQ4Wlf4', 'video')] },

  // ORM & DB
  { id: 'prisma', title: 'Prisma / Drizzle', description: 'Type-safe ORM tools for database queries, migrations, and schema management.', section: 'Backend', sectionColor: '#8b5cf6', difficulty: 'Intermediate', resources: [r('Prisma Docs', 'https://www.prisma.io/docs', 'docs'), r('Prisma Crash Course', 'https://www.youtube.com/watch?v=RebA5J-rlwg', 'video')] },
  { id: 'mongodb', title: 'MongoDB', description: 'NoSQL document database with flexible schemas, aggregation pipeline, and horizontal scaling.', section: 'Backend', sectionColor: '#22c55e', difficulty: 'Intermediate', isAlternative: true, resources: [r('MongoDB Docs', 'https://www.mongodb.com/docs/manual/', 'docs'), r('MongoDB Crash Course', 'https://www.youtube.com/watch?v=ofme2o29ngU', 'video')] },

  // Security
  { id: 'cors', title: 'CORS', description: 'Cross-Origin Resource Sharing — how browsers enforce same-origin policy and how to configure CORS.', section: 'Security', sectionColor: '#ef4444', difficulty: 'Intermediate', resources: [r('CORS - MDN', 'https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS', 'docs'), r('CORS Explained', 'https://www.youtube.com/watch?v=4KHiSt0oLJ0', 'video')] },
  { id: 'xss', title: 'XSS & CSRF', description: 'Cross-site scripting and request forgery attacks — how to prevent them in web applications.', section: 'Security', sectionColor: '#ef4444', difficulty: 'Advanced', resources: [r('XSS Prevention - OWASP', 'https://owasp.org/www-community/attacks/xss/', 'article'), r('Web Security', 'https://www.youtube.com/watch?v=IhJ3leSsahA', 'video')] },
  { id: 'owasp', title: 'OWASP Top 10', description: 'The most critical web application security risks and how to protect against them.', section: 'Security', sectionColor: '#ef4444', difficulty: 'Advanced', resources: [r('OWASP Top 10', 'https://owasp.org/www-project-top-ten/', 'article'), r('OWASP Explained', 'https://www.youtube.com/watch?v=avFR_Af0KGk', 'video')] },

  // DevOps
  { id: 'linux', title: 'Linux Basics', description: 'Command line, file system, permissions, processes, shell scripting, and SSH.', section: 'DevOps', sectionColor: '#f59e0b', difficulty: 'Beginner', resources: [r('Linux Journey', 'https://linuxjourney.com/', 'article'), r('Linux Commands', 'https://www.youtube.com/watch?v=ZtqBQ68cfJc', 'video')] },
  { id: 'aws', title: 'Basic AWS Services', description: 'Core AWS services: EC2, S3, Route53, VPC, SES, Lambda for cloud deployment.', section: 'DevOps', sectionColor: '#f59e0b', difficulty: 'Advanced', resources: [r('AWS Getting Started', 'https://aws.amazon.com/getting-started/', 'docs'), r('AWS Crash Course', 'https://www.youtube.com/watch?v=ulprqHHWlng', 'video')] },
  { id: 'docker', title: 'Docker', description: 'Containerize applications with images, Dockerfiles, volumes, networks, and Docker Compose.', section: 'DevOps', sectionColor: '#2563eb', difficulty: 'Intermediate', resources: [r('Docker Getting Started', 'https://docs.docker.com/get-started/', 'docs'), r('Docker Crash Course', 'https://www.youtube.com/watch?v=fqMOX6JJhGo', 'video')] },
  { id: 'github-actions', title: 'GitHub Actions', description: 'Automate CI/CD workflows for testing, building, and deploying code from GitHub.', section: 'DevOps', sectionColor: '#d946ef', difficulty: 'Intermediate', resources: [r('GitHub Actions Docs', 'https://docs.github.com/en/actions', 'docs'), r('GitHub Actions Tutorial', 'https://www.youtube.com/watch?v=R8_veQiYBjI', 'video')] },
  { id: 'ansible', title: 'Ansible', description: 'Automation tool for configuration management, application deployment, and orchestration.', section: 'DevOps', sectionColor: '#ef4444', difficulty: 'Advanced', isAlternative: true, resources: [r('Ansible Docs', 'https://docs.ansible.com/', 'docs'), r('Ansible Tutorial', 'https://www.youtube.com/watch?v=1id6ERvfozo', 'video')] },
  { id: 'terraform', title: 'Terraform', description: 'Infrastructure as Code for provisioning and managing cloud resources declaratively.', section: 'DevOps', sectionColor: '#a855f7', difficulty: 'Advanced', isAlternative: true, resources: [r('Terraform Docs', 'https://developer.hashicorp.com/terraform/docs', 'docs'), r('Terraform Crash Course', 'https://www.youtube.com/watch?v=SLB_c_ayRMo', 'video')] },
  { id: 'nginx', title: 'Nginx', description: 'Web server for reverse proxy, load balancing, SSL termination, and static file serving.', section: 'DevOps', sectionColor: '#22c55e', difficulty: 'Intermediate', resources: [r('Nginx Docs', 'https://nginx.org/en/docs/', 'docs'), r('Nginx Crash Course', 'https://www.youtube.com/watch?v=7VAI73roXaY', 'video')] },
  { id: 'monitoring', title: 'Monitoring (Sentry)', description: 'Application monitoring, error tracking, performance metrics, and alerting.', section: 'DevOps', sectionColor: '#f59e0b', difficulty: 'Advanced', resources: [r('Sentry Docs', 'https://docs.sentry.io/', 'docs'), r('Monitoring Guide', 'https://www.youtube.com/watch?v=SHDilCMd5LM', 'video')] },

  // Deployment
  { id: 'vercel', title: 'Vercel / Netlify', description: 'Deploy frontend apps with zero-config, automatic previews, serverless functions, and edge CDN.', section: 'Deployment', sectionColor: '#10b981', difficulty: 'Beginner', resources: [r('Vercel Docs', 'https://vercel.com/docs', 'docs'), r('Deploy with Vercel', 'https://www.youtube.com/watch?v=8lGpZkjnkt4', 'video')] },
  { id: 'railway', title: 'Railway / Render', description: 'Full-stack deployment platforms for Node.js, databases, and background workers.', section: 'Deployment', sectionColor: '#10b981', difficulty: 'Beginner', resources: [r('Railway Docs', 'https://docs.railway.app/', 'docs'), r('Railway Tutorial', 'https://www.youtube.com/watch?v=Kx7VIy67XkI', 'video')] },
];

// Node lookup map
const nodeMap = new Map(roadmapNodesData.map(n => [n.id, n]));
export const getNodeById = (id: string) => nodeMap.get(id);

// ── Visual layout blocks ──
export const roadmapBlocks: RoadmapBlock[] = [
  // Internet
  { type: 'section-label', label: 'Internet Fundamentals', subtitle: 'Learn how the web works before building for it' },
  { type: 'row', nodes: ['internet-how', 'http-https', 'dns', 'browsers'] },

  // Frontend core
  { type: 'divider', label: 'Frontend Development' },
  { type: 'annotation', text: 'Start with the three pillars of the web. Master these before moving to frameworks.', side: 'right' },
  { type: 'row', nodes: ['html', 'css', 'javascript'] },
  { type: 'checkpoint', label: 'Checkpoint — Static Webpages', id: 'cp-static' },
  { type: 'annotation', text: 'Build 2-3 static websites with HTML, CSS and JS to solidify your fundamentals.', side: 'left' },

  // Package manager
  { type: 'row', nodes: ['npm'] },
  { type: 'checkpoint', label: 'Checkpoint — Interactivity & Packages', id: 'cp-packages' },

  // Framework & tooling
  { type: 'row', nodes: ['react', 'tailwind'] },
  { type: 'row', nodes: ['github', 'git'] },
  { type: 'checkpoint', label: 'Checkpoint — Frontend Apps', id: 'cp-frontend' },
  { type: 'annotation', text: 'Build a complete frontend app with React, Tailwind, and version control with Git.', side: 'right' },

  // TypeScript & Build tools
  { type: 'row', nodes: ['typescript'] },
  { type: 'row', nodes: ['vite', 'eslint'] },
  { type: 'row', nodes: ['webpack'], connector: 'dashed' },
  { type: 'checkpoint', label: 'Checkpoint — Production Frontend', id: 'cp-prod-fe' },

  // Testing
  { type: 'divider', label: 'Testing' },
  { type: 'annotation', text: 'Learn to write tests to ensure your code works correctly and catches bugs early.', side: 'left' },
  { type: 'row', nodes: ['jest', 'rtl'] },
  { type: 'row', nodes: ['cypress'], connector: 'dashed' },

  // Backend
  { type: 'divider', label: 'Backend Development' },
  { type: 'annotation', text: 'Pick Node.js since you already know JavaScript. It\'s the easiest transition to backend.', side: 'right' },
  { type: 'row', nodes: ['nodejs', 'express'] },
  { type: 'checkpoint', label: 'Checkpoint — CLI Apps', id: 'cp-cli' },

  { type: 'row', nodes: ['postgres'] },
  { type: 'row', nodes: ['mongodb'], connector: 'dashed' },
  { type: 'checkpoint', label: 'Checkpoint — Simple CRUD Apps', id: 'cp-crud' },

  { type: 'row', nodes: ['redis', 'jwt', 'rest-api'] },
  { type: 'row', nodes: ['graphql', 'websockets'], connector: 'dashed' },
  { type: 'row', nodes: ['prisma'] },
  { type: 'checkpoint', label: 'Checkpoint — Complete App', id: 'cp-complete' },
  { type: 'annotation', text: 'Use the checkpoints and don\'t forget to practice! Build project ideas at each checkpoint to solidify your knowledge.', side: 'left' },

  // Security
  { type: 'divider', label: 'Web Security' },
  { type: 'row', nodes: ['cors', 'xss', 'owasp'] },

  // DevOps
  { type: 'divider', label: 'DevOps' },
  { type: 'row', nodes: ['linux', 'aws'] },
  { type: 'checkpoint', label: 'Checkpoint — Deployment', id: 'cp-deploy' },

  { type: 'row', nodes: ['docker', 'nginx'] },
  { type: 'row', nodes: ['github-actions'] },
  { type: 'checkpoint', label: 'Checkpoint — CI / CD', id: 'cp-cicd' },

  { type: 'row', nodes: ['ansible'], connector: 'dashed' },
  { type: 'row', nodes: ['terraform'], connector: 'dashed' },
  { type: 'row', nodes: ['monitoring'] },
  { type: 'checkpoint', label: 'Checkpoint — Infrastructure', id: 'cp-infra' },

  // Deployment
  { type: 'divider', label: 'Deployment & Hosting' },
  { type: 'row', nodes: ['vercel', 'railway'] },

  // Continue
  { type: 'continue', tracks: ['Frontend', 'Backend', 'DevOps', 'AWS'] },
];

// Keep legacy exports for compatibility with progress hook
export const sectionColors: Record<string, string> = {
  'Internet': '#64748b',
  'Frontend': '#3b82f6',
  'Testing': '#14b8a6',
  'Backend': '#22c55e',
  'Security': '#ef4444',
  'DevOps': '#f59e0b',
  'Deployment': '#10b981',
};

export const sections = Object.keys(sectionColors);

// Legacy exports (empty — no longer using React Flow nodes/edges)
export const flowNodes: any[] = [];
export const flowEdges: any[] = [];
