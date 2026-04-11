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

export const sectionColors: Record<string, string> = {
  'Internet Basics': '#64748b',
  'HTML': '#f97316',
  'CSS': '#3b82f6',
  'JavaScript': '#eab308',
  'React': '#06b6d4',
  'Node.js': '#22c55e',
  'Databases': '#8b5cf6',
  'APIs': '#f43f5e',
  'DevOps': '#f59e0b',
  'Deployment': '#10b981',
};

export const sections = Object.keys(sectionColors);

// ── Roadmap node data ──
export const roadmapNodesData: RoadmapNodeData[] = [
  // Internet Basics
  { id: 'internet-how', title: 'How the Internet Works', description: 'Learn the fundamentals of how data travels across the internet, including packets, protocols, and routing.', section: 'Internet Basics', sectionColor: sectionColors['Internet Basics'], difficulty: 'Beginner', resources: [{ title: 'How the Internet Works - MDN', url: 'https://developer.mozilla.org/en-US/docs/Learn/Common_questions/How_does_the_Internet_work', type: 'docs' }, { title: 'How the Internet Works in 5 Minutes', url: 'https://www.youtube.com/watch?v=7_LPdttKXPc', type: 'video' }] },
  { id: 'http-https', title: 'HTTP / HTTPS', description: 'Understand HTTP methods, status codes, headers, and how HTTPS provides secure communication.', section: 'Internet Basics', sectionColor: sectionColors['Internet Basics'], difficulty: 'Beginner', resources: [{ title: 'HTTP Overview - MDN', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview', type: 'docs' }, { title: 'HTTP Crash Course', url: 'https://www.youtube.com/watch?v=iYM2zFP3Zn0', type: 'video' }] },
  { id: 'dns', title: 'DNS & Domain Names', description: 'Learn how domain names are resolved to IP addresses through the Domain Name System.', section: 'Internet Basics', sectionColor: sectionColors['Internet Basics'], difficulty: 'Beginner', resources: [{ title: 'What is DNS?', url: 'https://www.cloudflare.com/learning/dns/what-is-dns/', type: 'article' }, { title: 'DNS Explained', url: 'https://www.youtube.com/watch?v=Wj0od2ag5sk', type: 'video' }] },
  { id: 'browsers', title: 'How Browsers Work', description: 'Understand the rendering pipeline: parsing HTML, building DOM, CSSOM, layout, paint, and compositing.', section: 'Internet Basics', sectionColor: sectionColors['Internet Basics'], difficulty: 'Beginner', resources: [{ title: 'How Browsers Work - web.dev', url: 'https://web.dev/howbrowserswork/', type: 'article' }, { title: 'Browser Rendering', url: 'https://www.youtube.com/watch?v=SmE4OwHztCc', type: 'video' }] },

  // HTML
  { id: 'html-basics', title: 'HTML Basics', description: 'Learn HTML document structure, elements, attributes, and how to create web page content.', section: 'HTML', sectionColor: sectionColors['HTML'], difficulty: 'Beginner', resources: [{ title: 'HTML Basics - MDN', url: 'https://developer.mozilla.org/en-US/docs/Learn/Getting_started_with_the_web/HTML_basics', type: 'docs' }, { title: 'HTML Full Course', url: 'https://www.youtube.com/watch?v=pQN-pnXPaVg', type: 'video' }] },
  { id: 'html-semantic', title: 'Semantic HTML', description: 'Use meaningful HTML5 tags like header, nav, main, article, section for better accessibility and SEO.', section: 'HTML', sectionColor: sectionColors['HTML'], difficulty: 'Beginner', resources: [{ title: 'Semantic HTML - web.dev', url: 'https://web.dev/learn/html/semantic-html/', type: 'docs' }, { title: 'Semantic HTML Explained', url: 'https://www.youtube.com/watch?v=kGW8Al_cga4', type: 'video' }] },
  { id: 'html-forms', title: 'Forms & Validation', description: 'Build interactive forms with various input types, form validation, and accessibility best practices.', section: 'HTML', sectionColor: sectionColors['HTML'], difficulty: 'Beginner', resources: [{ title: 'HTML Forms - MDN', url: 'https://developer.mozilla.org/en-US/docs/Learn/Forms', type: 'docs' }, { title: 'HTML Form Validation', url: 'https://www.youtube.com/watch?v=fNcJuPIZ2WE', type: 'video' }] },
  { id: 'html-a11y', title: 'Accessibility (a11y)', description: 'Make web content accessible to everyone using ARIA roles, labels, keyboard navigation, and screen reader support.', section: 'HTML', sectionColor: sectionColors['HTML'], difficulty: 'Intermediate', resources: [{ title: 'Accessibility - MDN', url: 'https://developer.mozilla.org/en-US/docs/Web/Accessibility', type: 'docs' }, { title: 'A11y in 100 Seconds', url: 'https://www.youtube.com/watch?v=HtTyRajRuyY', type: 'video' }] },

  // CSS
  { id: 'css-basics', title: 'CSS Fundamentals', description: 'Learn selectors, properties, the box model, specificity, and how styles cascade.', section: 'CSS', sectionColor: sectionColors['CSS'], difficulty: 'Beginner', resources: [{ title: 'CSS Basics - MDN', url: 'https://developer.mozilla.org/en-US/docs/Learn/CSS/First_steps', type: 'docs' }, { title: 'CSS Crash Course', url: 'https://www.youtube.com/watch?v=yfoY53QXEnI', type: 'video' }] },
  { id: 'css-flexbox', title: 'Flexbox', description: 'Master flexible box layout for one-dimensional layouts — aligning and distributing space among items.', section: 'CSS', sectionColor: sectionColors['CSS'], difficulty: 'Beginner', resources: [{ title: 'Flexbox Guide - CSS-Tricks', url: 'https://css-tricks.com/snippets/css/a-guide-to-flexbox/', type: 'article' }, { title: 'Flexbox in 15 Minutes', url: 'https://www.youtube.com/watch?v=fYq5PXgSsbE', type: 'video' }] },
  { id: 'css-grid', title: 'CSS Grid', description: 'Build complex two-dimensional layouts with CSS Grid, defining rows, columns, and areas.', section: 'CSS', sectionColor: sectionColors['CSS'], difficulty: 'Intermediate', resources: [{ title: 'CSS Grid Guide - CSS-Tricks', url: 'https://css-tricks.com/snippets/css/complete-guide-grid/', type: 'article' }, { title: 'CSS Grid Course', url: 'https://www.youtube.com/watch?v=9zBsdzdE4sM', type: 'video' }] },
  { id: 'css-responsive', title: 'Responsive Design', description: 'Create layouts that adapt to different screen sizes using media queries, fluid units, and mobile-first approach.', section: 'CSS', sectionColor: sectionColors['CSS'], difficulty: 'Intermediate', resources: [{ title: 'Responsive Design - MDN', url: 'https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Responsive_Design', type: 'docs' }, { title: 'Responsive Design Tutorial', url: 'https://www.youtube.com/watch?v=srvUrASNj0s', type: 'video' }] },
  { id: 'css-tailwind', title: 'Tailwind CSS', description: 'Utility-first CSS framework for rapidly building custom designs without writing custom CSS.', section: 'CSS', sectionColor: sectionColors['CSS'], difficulty: 'Intermediate', isAlternative: true, resources: [{ title: 'Tailwind CSS Docs', url: 'https://tailwindcss.com/docs', type: 'docs' }, { title: 'Tailwind CSS Crash Course', url: 'https://www.youtube.com/watch?v=UBOj6rqRUME', type: 'video' }] },

  // JavaScript
  { id: 'js-basics', title: 'JavaScript Basics', description: 'Variables, data types, operators, control flow, loops, and basic syntax of JavaScript.', section: 'JavaScript', sectionColor: sectionColors['JavaScript'], difficulty: 'Beginner', resources: [{ title: 'JavaScript Guide - MDN', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide', type: 'docs' }, { title: 'JavaScript Tutorial for Beginners', url: 'https://www.youtube.com/watch?v=W6NZfCO5SIk', type: 'video' }] },
  { id: 'js-dom', title: 'DOM Manipulation', description: 'Select, create, modify, and delete HTML elements dynamically using JavaScript DOM APIs.', section: 'JavaScript', sectionColor: sectionColors['JavaScript'], difficulty: 'Beginner', resources: [{ title: 'DOM Introduction - MDN', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model/Introduction', type: 'docs' }, { title: 'DOM Crash Course', url: 'https://www.youtube.com/watch?v=0ik6X4DJKCc', type: 'video' }] },
  { id: 'js-es6', title: 'ES6+ Features', description: 'Arrow functions, destructuring, spread/rest, template literals, modules, classes, and modern JS features.', section: 'JavaScript', sectionColor: sectionColors['JavaScript'], difficulty: 'Intermediate', resources: [{ title: 'ES6 Features Overview', url: 'https://github.com/lukehoban/es6features', type: 'article' }, { title: 'ES6 JavaScript Tutorial', url: 'https://www.youtube.com/watch?v=NCwa_xi0Uuc', type: 'video' }] },
  { id: 'js-async', title: 'Async JavaScript', description: 'Callbacks, Promises, async/await, and the event loop — handling asynchronous operations effectively.', section: 'JavaScript', sectionColor: sectionColors['JavaScript'], difficulty: 'Intermediate', resources: [{ title: 'Async JavaScript - MDN', url: 'https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Asynchronous', type: 'docs' }, { title: 'Async JS Crash Course', url: 'https://www.youtube.com/watch?v=PoRJizFvM7s', type: 'video' }] },
  { id: 'js-fetch', title: 'Fetch API & HTTP Requests', description: 'Make HTTP requests from the browser using fetch API, handle responses, and work with JSON data.', section: 'JavaScript', sectionColor: sectionColors['JavaScript'], difficulty: 'Intermediate', resources: [{ title: 'Fetch API - MDN', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API', type: 'docs' }, { title: 'Fetch API Tutorial', url: 'https://www.youtube.com/watch?v=cuEtnrL9-H0', type: 'video' }] },
  { id: 'js-typescript', title: 'TypeScript', description: 'Typed superset of JavaScript adding static type checking, interfaces, generics, and better tooling.', section: 'JavaScript', sectionColor: sectionColors['JavaScript'], difficulty: 'Intermediate', resources: [{ title: 'TypeScript Handbook', url: 'https://www.typescriptlang.org/docs/handbook/', type: 'docs' }, { title: 'TypeScript Crash Course', url: 'https://www.youtube.com/watch?v=BCg4U1FzODs', type: 'video' }] },

  // React
  { id: 'react-basics', title: 'React Fundamentals', description: 'Components, JSX, props, rendering, and the component lifecycle in React.', section: 'React', sectionColor: sectionColors['React'], difficulty: 'Intermediate', resources: [{ title: 'React Quick Start', url: 'https://react.dev/learn', type: 'docs' }, { title: 'React Tutorial for Beginners', url: 'https://www.youtube.com/watch?v=SqcY0GlETPk', type: 'video' }] },
  { id: 'react-hooks', title: 'React Hooks', description: 'useState, useEffect, useContext, useRef, useMemo, useCallback — managing state and side effects.', section: 'React', sectionColor: sectionColors['React'], difficulty: 'Intermediate', resources: [{ title: 'React Hooks - React Docs', url: 'https://react.dev/reference/react/hooks', type: 'docs' }, { title: 'React Hooks Tutorial', url: 'https://www.youtube.com/watch?v=TNhaISOUy6Q', type: 'video' }] },
  { id: 'react-state', title: 'State Management', description: 'Context API, Redux, Zustand, or React Query for managing application state at scale.', section: 'React', sectionColor: sectionColors['React'], difficulty: 'Advanced', resources: [{ title: 'Managing State - React Docs', url: 'https://react.dev/learn/managing-state', type: 'docs' }, { title: 'React State Management', url: 'https://www.youtube.com/watch?v=zpUMRsAO6-Y', type: 'video' }] },
  { id: 'react-router', title: 'React Router', description: 'Client-side routing, nested routes, dynamic params, and navigation in single-page React apps.', section: 'React', sectionColor: sectionColors['React'], difficulty: 'Intermediate', resources: [{ title: 'React Router Docs', url: 'https://reactrouter.com/en/main', type: 'docs' }, { title: 'React Router Tutorial', url: 'https://www.youtube.com/watch?v=Ul3y1LXxzdU', type: 'video' }] },
  { id: 'react-forms', title: 'Forms in React', description: 'Controlled components, form libraries (React Hook Form), validation (Zod), and form handling patterns.', section: 'React', sectionColor: sectionColors['React'], difficulty: 'Intermediate', resources: [{ title: 'React Hook Form', url: 'https://react-hook-form.com/', type: 'docs' }, { title: 'React Forms Tutorial', url: 'https://www.youtube.com/watch?v=SfiOimv5_S0', type: 'video' }] },
  { id: 'react-testing', title: 'Testing React Apps', description: 'Unit and integration testing with Jest, React Testing Library, and end-to-end testing with Cypress.', section: 'React', sectionColor: sectionColors['React'], difficulty: 'Advanced', isAlternative: true, resources: [{ title: 'Testing Library Docs', url: 'https://testing-library.com/docs/react-testing-library/intro/', type: 'docs' }, { title: 'React Testing Crash Course', url: 'https://www.youtube.com/watch?v=8Xwq35cPwYg', type: 'video' }] },

  // Node.js
  { id: 'node-basics', title: 'Node.js Fundamentals', description: 'Runtime environment, modules, file system, event-driven architecture, and npm package management.', section: 'Node.js', sectionColor: sectionColors['Node.js'], difficulty: 'Intermediate', resources: [{ title: 'Node.js Getting Started', url: 'https://nodejs.org/en/learn/getting-started/introduction-to-nodejs', type: 'docs' }, { title: 'Node.js Crash Course', url: 'https://www.youtube.com/watch?v=fBNz5xF-Kx4', type: 'video' }] },
  { id: 'node-express', title: 'Express.js', description: 'Build web servers and REST APIs with Express — routing, middleware, error handling, and templates.', section: 'Node.js', sectionColor: sectionColors['Node.js'], difficulty: 'Intermediate', resources: [{ title: 'Express.js Guide', url: 'https://expressjs.com/en/guide/routing.html', type: 'docs' }, { title: 'Express.js Crash Course', url: 'https://www.youtube.com/watch?v=SccSCuHhOw0', type: 'video' }] },
  { id: 'node-auth', title: 'Authentication & Authorization', description: 'JWT, sessions, OAuth, password hashing, role-based access control for securing applications.', section: 'Node.js', sectionColor: sectionColors['Node.js'], difficulty: 'Advanced', resources: [{ title: 'JWT Introduction', url: 'https://jwt.io/introduction', type: 'docs' }, { title: 'Node Auth Tutorial', url: 'https://www.youtube.com/watch?v=mbsmsi7l3r4', type: 'video' }] },
  { id: 'node-middleware', title: 'Middleware & Error Handling', description: 'Request processing pipeline, custom middleware, centralized error handling, and logging strategies.', section: 'Node.js', sectionColor: sectionColors['Node.js'], difficulty: 'Intermediate', resources: [{ title: 'Express Middleware - Docs', url: 'https://expressjs.com/en/guide/using-middleware.html', type: 'docs' }, { title: 'Middleware Explained', url: 'https://www.youtube.com/watch?v=lY6icfhap2o', type: 'video' }] },

  // Databases
  { id: 'db-sql', title: 'SQL Fundamentals', description: 'Relational databases, SQL queries, joins, indexes, transactions, and database design principles.', section: 'Databases', sectionColor: sectionColors['Databases'], difficulty: 'Intermediate', resources: [{ title: 'SQL Tutorial - W3Schools', url: 'https://www.w3schools.com/sql/', type: 'docs' }, { title: 'SQL Full Course', url: 'https://www.youtube.com/watch?v=HXV3zeQKqGY', type: 'video' }] },
  { id: 'db-postgres', title: 'PostgreSQL', description: 'Advanced relational database with JSON support, full-text search, and excellent performance.', section: 'Databases', sectionColor: sectionColors['Databases'], difficulty: 'Intermediate', resources: [{ title: 'PostgreSQL Tutorial', url: 'https://www.postgresqltutorial.com/', type: 'docs' }, { title: 'PostgreSQL Crash Course', url: 'https://www.youtube.com/watch?v=qw--VYLpxG4', type: 'video' }] },
  { id: 'db-mongodb', title: 'MongoDB', description: 'NoSQL document database storing data as flexible JSON-like documents with dynamic schemas.', section: 'Databases', sectionColor: sectionColors['Databases'], difficulty: 'Intermediate', isAlternative: true, resources: [{ title: 'MongoDB Docs', url: 'https://www.mongodb.com/docs/manual/', type: 'docs' }, { title: 'MongoDB Crash Course', url: 'https://www.youtube.com/watch?v=ofme2o29ngU', type: 'video' }] },
  { id: 'db-orm', title: 'ORMs (Prisma / Drizzle)', description: 'Object-Relational Mapping tools for type-safe database queries, migrations, and schema management.', section: 'Databases', sectionColor: sectionColors['Databases'], difficulty: 'Intermediate', resources: [{ title: 'Prisma Docs', url: 'https://www.prisma.io/docs', type: 'docs' }, { title: 'Prisma Crash Course', url: 'https://www.youtube.com/watch?v=RebA5J-rlwg', type: 'video' }] },

  // APIs
  { id: 'api-rest', title: 'REST API Design', description: 'RESTful principles, resource naming, HTTP methods, status codes, versioning, and best practices.', section: 'APIs', sectionColor: sectionColors['APIs'], difficulty: 'Intermediate', resources: [{ title: 'REST API Tutorial', url: 'https://restfulapi.net/', type: 'article' }, { title: 'REST API Design', url: 'https://www.youtube.com/watch?v=-MTSQjw5DrM', type: 'video' }] },
  { id: 'api-graphql', title: 'GraphQL', description: 'Query language for APIs with a single endpoint, type system, and client-driven data fetching.', section: 'APIs', sectionColor: sectionColors['APIs'], difficulty: 'Advanced', isAlternative: true, resources: [{ title: 'GraphQL Docs', url: 'https://graphql.org/learn/', type: 'docs' }, { title: 'GraphQL Crash Course', url: 'https://www.youtube.com/watch?v=ed8SzALpx1Q', type: 'video' }] },
  { id: 'api-websockets', title: 'WebSockets', description: 'Real-time bidirectional communication between client and server for live features like chat.', section: 'APIs', sectionColor: sectionColors['APIs'], difficulty: 'Advanced', resources: [{ title: 'WebSocket API - MDN', url: 'https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API', type: 'docs' }, { title: 'WebSockets Tutorial', url: 'https://www.youtube.com/watch?v=8ARodQ4Wlf4', type: 'video' }] },
  { id: 'api-auth-strategies', title: 'API Authentication', description: 'API keys, OAuth 2.0, JWT tokens, session-based auth for securing your API endpoints.', section: 'APIs', sectionColor: sectionColors['APIs'], difficulty: 'Advanced', resources: [{ title: 'OAuth 2.0 Simplified', url: 'https://www.oauth.com/', type: 'article' }, { title: 'API Auth Explained', url: 'https://www.youtube.com/watch?v=GhrvZ5nUWNg', type: 'video' }] },

  // DevOps
  { id: 'devops-git', title: 'Git & GitHub', description: 'Version control, branching strategies, pull requests, code reviews, and collaborative workflows.', section: 'DevOps', sectionColor: sectionColors['DevOps'], difficulty: 'Beginner', resources: [{ title: 'Git Handbook - GitHub', url: 'https://guides.github.com/introduction/git-handbook/', type: 'docs' }, { title: 'Git & GitHub Crash Course', url: 'https://www.youtube.com/watch?v=RGOj5yH7evk', type: 'video' }] },
  { id: 'devops-docker', title: 'Docker', description: 'Containerize applications for consistent development and deployment environments.', section: 'DevOps', sectionColor: sectionColors['DevOps'], difficulty: 'Intermediate', resources: [{ title: 'Docker Getting Started', url: 'https://docs.docker.com/get-started/', type: 'docs' }, { title: 'Docker Crash Course', url: 'https://www.youtube.com/watch?v=fqMOX6JJhGo', type: 'video' }] },
  { id: 'devops-cicd', title: 'CI/CD Pipelines', description: 'Automate testing and deployment with GitHub Actions, Jenkins, or similar continuous integration tools.', section: 'DevOps', sectionColor: sectionColors['DevOps'], difficulty: 'Intermediate', resources: [{ title: 'GitHub Actions Docs', url: 'https://docs.github.com/en/actions', type: 'docs' }, { title: 'CI/CD Explained', url: 'https://www.youtube.com/watch?v=scEDHsr3APg', type: 'video' }] },
  { id: 'devops-linux', title: 'Linux Basics', description: 'Command line, file system navigation, permissions, processes, and shell scripting essentials.', section: 'DevOps', sectionColor: sectionColors['DevOps'], difficulty: 'Beginner', resources: [{ title: 'Linux Journey', url: 'https://linuxjourney.com/', type: 'article' }, { title: 'Linux Commands', url: 'https://www.youtube.com/watch?v=ZtqBQ68cfJc', type: 'video' }] },

  // Deployment
  { id: 'deploy-hosting', title: 'Web Hosting & Domains', description: 'Understanding hosting providers, domain setup, DNS configuration, and SSL certificates.', section: 'Deployment', sectionColor: sectionColors['Deployment'], difficulty: 'Beginner', resources: [{ title: 'Web Hosting Guide', url: 'https://www.cloudflare.com/learning/web-hosting/', type: 'article' }, { title: 'Deploy Your Website', url: 'https://www.youtube.com/watch?v=p1QU3kLFPdg', type: 'video' }] },
  { id: 'deploy-vercel', title: 'Vercel / Netlify', description: 'Deploy frontend apps with zero-config, automatic previews, serverless functions, and edge CDN.', section: 'Deployment', sectionColor: sectionColors['Deployment'], difficulty: 'Beginner', resources: [{ title: 'Vercel Docs', url: 'https://vercel.com/docs', type: 'docs' }, { title: 'Deploy with Vercel', url: 'https://www.youtube.com/watch?v=8lGpZkjnkt4', type: 'video' }] },
  { id: 'deploy-aws', title: 'AWS / Cloud Basics', description: 'Core cloud services: EC2, S3, Lambda, RDS — building scalable applications on AWS.', section: 'Deployment', sectionColor: sectionColors['Deployment'], difficulty: 'Advanced', isAlternative: true, resources: [{ title: 'AWS Getting Started', url: 'https://aws.amazon.com/getting-started/', type: 'docs' }, { title: 'AWS Crash Course', url: 'https://www.youtube.com/watch?v=ulprqHHWlng', type: 'video' }] },
  { id: 'deploy-monitoring', title: 'Monitoring & Logging', description: 'Application monitoring, error tracking, performance metrics, and logging with tools like Sentry.', section: 'Deployment', sectionColor: sectionColors['Deployment'], difficulty: 'Advanced', resources: [{ title: 'Sentry Docs', url: 'https://docs.sentry.io/', type: 'docs' }, { title: 'App Monitoring Guide', url: 'https://www.youtube.com/watch?v=SHDilCMd5LM', type: 'video' }] },
];

// ── Build roadmap.sh-style branching layout ──
// Central spine with section headers, topics branch left & right

const SPINE_X = 400;
const BRANCH_OFFSET = 220;
const NODE_W = 180;
const NODE_H = 36;
const SECTION_H = 40;
const Y_SECTION_GAP = 60;
const Y_BRANCH_GAP = 50;
const Y_PAIR_GAP = 50;

function buildFlowNodes() {
  const nodes: Array<{
    id: string;
    type: string;
    position: { x: number; y: number };
    data: any;
  }> = [];

  let y = 40;
  let currentSection = '';
  let sectionNodes: RoadmapNodeData[] = [];

  const flushSection = () => {
    if (!sectionNodes.length) return;
    const sec = sectionNodes[0].section;
    const color = sectionNodes[0].sectionColor;

    // Section header on spine
    const sectionId = `section-${sec.replace(/\s+/g, '-').toLowerCase()}`;
    nodes.push({
      id: sectionId,
      type: 'sectionNode',
      position: { x: SPINE_X - 90, y },
      data: { title: sec, sectionColor: color },
    });

    y += SECTION_H + 20;

    // Place nodes in pairs: left & right
    for (let i = 0; i < sectionNodes.length; i += 2) {
      const left = sectionNodes[i];
      const right = sectionNodes[i + 1];

      if (left) {
        nodes.push({
          id: left.id,
          type: 'roadmapNode',
          position: { x: SPINE_X - BRANCH_OFFSET - NODE_W / 2, y },
          data: { ...left, nodeType: 'topic' },
        });
      }
      if (right) {
        nodes.push({
          id: right.id,
          type: 'roadmapNode',
          position: { x: SPINE_X + BRANCH_OFFSET - NODE_W / 2, y },
          data: { ...right, nodeType: 'topic' },
        });
      }

      y += Y_PAIR_GAP;
    }

    y += Y_SECTION_GAP - Y_PAIR_GAP; // gap before next section
    sectionNodes = [];
  };

  roadmapNodesData.forEach((nd) => {
    if (nd.section !== currentSection) {
      flushSection();
      currentSection = nd.section;
    }
    sectionNodes.push(nd);
  });
  flushSection();

  return nodes;
}

function buildFlowEdges() {
  const edges: Array<{
    id: string;
    source: string;
    target: string;
    sourceHandle?: string;
    targetHandle?: string;
    type: string;
    animated: boolean;
    style: Record<string, any>;
  }> = [];

  // Build section order and edges between section headers
  const sectionOrder: string[] = [];
  roadmapNodesData.forEach((nd) => {
    const sid = `section-${nd.section.replace(/\s+/g, '-').toLowerCase()}`;
    if (!sectionOrder.includes(sid)) sectionOrder.push(sid);
  });

  // Connect section headers vertically (spine)
  for (let i = 0; i < sectionOrder.length - 1; i++) {
    edges.push({
      id: `spine-${i}`,
      source: sectionOrder[i],
      target: sectionOrder[i + 1],
      type: 'smoothstep',
      animated: false,
      style: { stroke: '#525252', strokeWidth: 2 },
    });
  }

  // Connect section headers to their child nodes
  let currentSection = '';
  let sectionNodes: RoadmapNodeData[] = [];

  const flushEdges = () => {
    if (!sectionNodes.length) return;
    const sid = `section-${sectionNodes[0].section.replace(/\s+/g, '-').toLowerCase()}`;
    const color = sectionNodes[0].sectionColor;

    sectionNodes.forEach((nd) => {
      edges.push({
        id: `e-${sid}-${nd.id}`,
        source: sid,
        target: nd.id,
        type: 'smoothstep',
        animated: false,
        style: { stroke: color, strokeWidth: 1.5, opacity: 0.6 },
      });
    });

    sectionNodes = [];
  };

  roadmapNodesData.forEach((nd) => {
    if (nd.section !== currentSection) {
      flushEdges();
      currentSection = nd.section;
    }
    sectionNodes.push(nd);
  });
  flushEdges();

  return edges;
}

export const flowNodes = buildFlowNodes();
export const flowEdges = buildFlowEdges();
