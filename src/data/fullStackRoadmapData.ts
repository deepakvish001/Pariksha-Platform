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
  'Version Control': '#a855f7',
  'Package Managers': '#ec4899',
  'Build Tools': '#f97316',
  'React': '#06b6d4',
  'Testing': '#14b8a6',
  'Web Security': '#ef4444',
  'TypeScript': '#3178c6',
  'Node.js': '#22c55e',
  'Databases': '#8b5cf6',
  'APIs': '#f43f5e',
  'Caching': '#f59e0b',
  'Web Servers': '#0ea5e9',
  'Architectural Patterns': '#6366f1',
  'Containerization': '#2563eb',
  'CI/CD': '#d946ef',
  'Cloud Providers': '#0891b2',
  'DevOps': '#f59e0b',
  'Deployment': '#10b981',
};

export const sections = Object.keys(sectionColors);

const sc = sectionColors;
const r = (title: string, url: string, type: 'video' | 'docs' | 'article'): RoadmapResource => ({ title, url, type });

export const roadmapNodesData: RoadmapNodeData[] = [
  // ── Internet Basics ──
  { id: 'internet-how', title: 'How the Internet Works', description: 'Learn the fundamentals of how data travels across the internet, including packets, protocols, and routing.', section: 'Internet Basics', sectionColor: sc['Internet Basics'], difficulty: 'Beginner', resources: [r('How the Internet Works - MDN', 'https://developer.mozilla.org/en-US/docs/Learn/Common_questions/How_does_the_Internet_work', 'docs'), r('How the Internet Works in 5 Min', 'https://www.youtube.com/watch?v=7_LPdttKXPc', 'video')] },
  { id: 'http-https', title: 'HTTP / HTTPS', description: 'Understand HTTP methods, status codes, headers, and how HTTPS provides secure communication.', section: 'Internet Basics', sectionColor: sc['Internet Basics'], difficulty: 'Beginner', resources: [r('HTTP Overview - MDN', 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview', 'docs'), r('HTTP Crash Course', 'https://www.youtube.com/watch?v=iYM2zFP3Zn0', 'video')] },
  { id: 'dns', title: 'DNS & Domain Names', description: 'Learn how domain names are resolved to IP addresses through the Domain Name System.', section: 'Internet Basics', sectionColor: sc['Internet Basics'], difficulty: 'Beginner', resources: [r('What is DNS?', 'https://www.cloudflare.com/learning/dns/what-is-dns/', 'article'), r('DNS Explained', 'https://www.youtube.com/watch?v=Wj0od2ag5sk', 'video')] },
  { id: 'browsers', title: 'How Browsers Work', description: 'Understand the rendering pipeline: parsing HTML, building DOM, CSSOM, layout, paint, and compositing.', section: 'Internet Basics', sectionColor: sc['Internet Basics'], difficulty: 'Beginner', resources: [r('How Browsers Work - web.dev', 'https://web.dev/howbrowserswork/', 'article'), r('Browser Rendering', 'https://www.youtube.com/watch?v=SmE4OwHztCc', 'video')] },
  { id: 'hosting', title: 'What is Hosting?', description: 'Learn about web hosting, shared vs dedicated hosting, VPS, and cloud hosting solutions.', section: 'Internet Basics', sectionColor: sc['Internet Basics'], difficulty: 'Beginner', resources: [r('Web Hosting Explained', 'https://www.cloudflare.com/learning/web-hosting/', 'article'), r('Hosting Explained', 'https://www.youtube.com/watch?v=AXVZYzw8geg', 'video')] },

  // ── HTML ──
  { id: 'html-basics', title: 'HTML Basics', description: 'Learn HTML document structure, elements, attributes, and how to create web page content.', section: 'HTML', sectionColor: sc['HTML'], difficulty: 'Beginner', resources: [r('HTML Basics - MDN', 'https://developer.mozilla.org/en-US/docs/Learn/Getting_started_with_the_web/HTML_basics', 'docs'), r('HTML Full Course', 'https://www.youtube.com/watch?v=pQN-pnXPaVg', 'video')] },
  { id: 'html-semantic', title: 'Semantic HTML', description: 'Use meaningful HTML5 tags like header, nav, main, article, section for better accessibility and SEO.', section: 'HTML', sectionColor: sc['HTML'], difficulty: 'Beginner', resources: [r('Semantic HTML - web.dev', 'https://web.dev/learn/html/semantic-html/', 'docs'), r('Semantic HTML Explained', 'https://www.youtube.com/watch?v=kGW8Al_cga4', 'video')] },
  { id: 'html-forms', title: 'Forms & Validation', description: 'Build interactive forms with various input types, form validation, and accessibility best practices.', section: 'HTML', sectionColor: sc['HTML'], difficulty: 'Beginner', resources: [r('HTML Forms - MDN', 'https://developer.mozilla.org/en-US/docs/Learn/Forms', 'docs'), r('HTML Form Validation', 'https://www.youtube.com/watch?v=fNcJuPIZ2WE', 'video')] },
  { id: 'html-a11y', title: 'Accessibility (a11y)', description: 'Make web content accessible using ARIA roles, labels, keyboard navigation, and screen reader support.', section: 'HTML', sectionColor: sc['HTML'], difficulty: 'Intermediate', resources: [r('Accessibility - MDN', 'https://developer.mozilla.org/en-US/docs/Web/Accessibility', 'docs'), r('A11y in 100 Seconds', 'https://www.youtube.com/watch?v=HtTyRajRuyY', 'video')] },
  { id: 'html-seo', title: 'SEO Basics', description: 'Meta tags, Open Graph, structured data, sitemaps, and HTML best practices for search engine optimization.', section: 'HTML', sectionColor: sc['HTML'], difficulty: 'Beginner', resources: [r('SEO Starter Guide - Google', 'https://developers.google.com/search/docs/fundamentals/seo-starter-guide', 'docs'), r('SEO for Beginners', 'https://www.youtube.com/watch?v=DvwS7cV9GmQ', 'video')] },
  { id: 'html-conventions', title: 'Writing Clean HTML', description: 'Best practices for writing maintainable, well-structured, and standards-compliant HTML code.', section: 'HTML', sectionColor: sc['HTML'], difficulty: 'Beginner', resources: [r('HTML Best Practices', 'https://www.w3schools.com/html/html5_syntax.asp', 'docs'), r('Clean Code HTML', 'https://www.youtube.com/watch?v=P7ImDnlDab8', 'video')] },

  // ── CSS ──
  { id: 'css-basics', title: 'CSS Fundamentals', description: 'Learn selectors, properties, the box model, specificity, and how styles cascade.', section: 'CSS', sectionColor: sc['CSS'], difficulty: 'Beginner', resources: [r('CSS Basics - MDN', 'https://developer.mozilla.org/en-US/docs/Learn/CSS/First_steps', 'docs'), r('CSS Crash Course', 'https://www.youtube.com/watch?v=yfoY53QXEnI', 'video')] },
  { id: 'css-selectors', title: 'CSS Selectors', description: 'Master element, class, ID, attribute, pseudo-class, and pseudo-element selectors for precise styling.', section: 'CSS', sectionColor: sc['CSS'], difficulty: 'Beginner', resources: [r('CSS Selectors - MDN', 'https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_selectors', 'docs'), r('CSS Selectors Explained', 'https://www.youtube.com/watch?v=l1mER1bV0N0', 'video')] },
  { id: 'css-boxmodel', title: 'Box Model', description: 'Understand content, padding, border, and margin — how every element is sized and spaced in CSS.', section: 'CSS', sectionColor: sc['CSS'], difficulty: 'Beginner', resources: [r('Box Model - MDN', 'https://developer.mozilla.org/en-US/docs/Learn/CSS/Building_blocks/The_box_model', 'docs'), r('CSS Box Model', 'https://www.youtube.com/watch?v=rIO5326FgPE', 'video')] },
  { id: 'css-flexbox', title: 'Flexbox', description: 'Master flexible box layout for one-dimensional layouts — aligning and distributing space among items.', section: 'CSS', sectionColor: sc['CSS'], difficulty: 'Beginner', resources: [r('Flexbox Guide - CSS-Tricks', 'https://css-tricks.com/snippets/css/a-guide-to-flexbox/', 'article'), r('Flexbox in 15 Minutes', 'https://www.youtube.com/watch?v=fYq5PXgSsbE', 'video')] },
  { id: 'css-grid', title: 'CSS Grid', description: 'Build complex two-dimensional layouts with CSS Grid, defining rows, columns, and areas.', section: 'CSS', sectionColor: sc['CSS'], difficulty: 'Intermediate', resources: [r('CSS Grid Guide - CSS-Tricks', 'https://css-tricks.com/snippets/css/complete-guide-grid/', 'article'), r('CSS Grid Course', 'https://www.youtube.com/watch?v=9zBsdzdE4sM', 'video')] },
  { id: 'css-responsive', title: 'Responsive Design', description: 'Create layouts that adapt to different screen sizes using media queries, fluid units, and mobile-first approach.', section: 'CSS', sectionColor: sc['CSS'], difficulty: 'Intermediate', resources: [r('Responsive Design - MDN', 'https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Responsive_Design', 'docs'), r('Responsive Design Tutorial', 'https://www.youtube.com/watch?v=srvUrASNj0s', 'video')] },
  { id: 'css-animations', title: 'CSS Animations', description: 'Transitions, keyframe animations, transforms, and performance-friendly animation techniques.', section: 'CSS', sectionColor: sc['CSS'], difficulty: 'Intermediate', resources: [r('CSS Animations - MDN', 'https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_animations', 'docs'), r('CSS Animations Tutorial', 'https://www.youtube.com/watch?v=YszONjKpgg4', 'video')] },
  { id: 'css-preprocessors', title: 'CSS Preprocessors (Sass)', description: 'Variables, nesting, mixins, functions, and modular CSS using Sass/SCSS preprocessor.', section: 'CSS', sectionColor: sc['CSS'], difficulty: 'Intermediate', isAlternative: true, resources: [r('Sass Documentation', 'https://sass-lang.com/documentation/', 'docs'), r('Sass Crash Course', 'https://www.youtube.com/watch?v=_a5j7KoflTs', 'video')] },
  { id: 'css-tailwind', title: 'Tailwind CSS', description: 'Utility-first CSS framework for rapidly building custom designs without writing custom CSS.', section: 'CSS', sectionColor: sc['CSS'], difficulty: 'Intermediate', isAlternative: true, resources: [r('Tailwind CSS Docs', 'https://tailwindcss.com/docs', 'docs'), r('Tailwind CSS Crash Course', 'https://www.youtube.com/watch?v=UBOj6rqRUME', 'video')] },
  { id: 'css-bem', title: 'BEM Methodology', description: 'Block Element Modifier naming convention for writing maintainable, scalable CSS class names.', section: 'CSS', sectionColor: sc['CSS'], difficulty: 'Beginner', resources: [r('BEM Introduction', 'https://getbem.com/introduction/', 'article'), r('BEM CSS Methodology', 'https://www.youtube.com/watch?v=er1JEDuPbZQ', 'video')] },

  // ── JavaScript ──
  { id: 'js-basics', title: 'JavaScript Basics', description: 'Variables, data types, operators, control flow, loops, and basic syntax of JavaScript.', section: 'JavaScript', sectionColor: sc['JavaScript'], difficulty: 'Beginner', resources: [r('JavaScript Guide - MDN', 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide', 'docs'), r('JavaScript Tutorial for Beginners', 'https://www.youtube.com/watch?v=W6NZfCO5SIk', 'video')] },
  { id: 'js-functions', title: 'Functions & Scope', description: 'Function declarations, expressions, arrow functions, closures, scope chains, and hoisting.', section: 'JavaScript', sectionColor: sc['JavaScript'], difficulty: 'Beginner', resources: [r('Functions - MDN', 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Functions', 'docs'), r('JS Functions Deep Dive', 'https://www.youtube.com/watch?v=iLWTnMzWtj4', 'video')] },
  { id: 'js-dom', title: 'DOM Manipulation', description: 'Select, create, modify, and delete HTML elements dynamically using JavaScript DOM APIs.', section: 'JavaScript', sectionColor: sc['JavaScript'], difficulty: 'Beginner', resources: [r('DOM Introduction - MDN', 'https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model/Introduction', 'docs'), r('DOM Crash Course', 'https://www.youtube.com/watch?v=0ik6X4DJKCc', 'video')] },
  { id: 'js-events', title: 'Event Handling', description: 'Event listeners, bubbling, capturing, delegation, and custom events in the browser.', section: 'JavaScript', sectionColor: sc['JavaScript'], difficulty: 'Beginner', resources: [r('Events - MDN', 'https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Building_blocks/Events', 'docs'), r('JS Events Explained', 'https://www.youtube.com/watch?v=YiOlaiscqDY', 'video')] },
  { id: 'js-es6', title: 'ES6+ Features', description: 'Arrow functions, destructuring, spread/rest, template literals, modules, classes, and modern JS features.', section: 'JavaScript', sectionColor: sc['JavaScript'], difficulty: 'Intermediate', resources: [r('ES6 Features Overview', 'https://github.com/lukehoban/es6features', 'article'), r('ES6 JavaScript Tutorial', 'https://www.youtube.com/watch?v=NCwa_xi0Uuc', 'video')] },
  { id: 'js-async', title: 'Async JavaScript', description: 'Callbacks, Promises, async/await, and the event loop — handling asynchronous operations effectively.', section: 'JavaScript', sectionColor: sc['JavaScript'], difficulty: 'Intermediate', resources: [r('Async JavaScript - MDN', 'https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Asynchronous', 'docs'), r('Async JS Crash Course', 'https://www.youtube.com/watch?v=PoRJizFvM7s', 'video')] },
  { id: 'js-fetch', title: 'Fetch API & HTTP Requests', description: 'Make HTTP requests from the browser using fetch API, handle responses, and work with JSON data.', section: 'JavaScript', sectionColor: sc['JavaScript'], difficulty: 'Intermediate', resources: [r('Fetch API - MDN', 'https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API', 'docs'), r('Fetch API Tutorial', 'https://www.youtube.com/watch?v=cuEtnrL9-H0', 'video')] },
  { id: 'js-closures', title: 'Closures & Prototypes', description: 'Deep understanding of closures, prototypal inheritance, the prototype chain, and this keyword.', section: 'JavaScript', sectionColor: sc['JavaScript'], difficulty: 'Intermediate', resources: [r('Closures - MDN', 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures', 'docs'), r('Closures Explained', 'https://www.youtube.com/watch?v=vKJpN5FAeF4', 'video')] },
  { id: 'js-modules', title: 'JavaScript Modules', description: 'ES modules, import/export, dynamic imports, module bundling, and CommonJS vs ESM.', section: 'JavaScript', sectionColor: sc['JavaScript'], difficulty: 'Intermediate', resources: [r('JS Modules - MDN', 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules', 'docs'), r('JS Modules Explained', 'https://www.youtube.com/watch?v=cRHQNNcYf6s', 'video')] },
  { id: 'js-storage', title: 'Web Storage & Cookies', description: 'localStorage, sessionStorage, cookies, IndexedDB — client-side data persistence strategies.', section: 'JavaScript', sectionColor: sc['JavaScript'], difficulty: 'Beginner', resources: [r('Web Storage API - MDN', 'https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API', 'docs'), r('Web Storage Explained', 'https://www.youtube.com/watch?v=GihQAC1I39Q', 'video')] },

  // ── Version Control ──
  { id: 'git-basics', title: 'Git Basics', description: 'Initialize repos, stage changes, commit, view history, and understand the Git workflow.', section: 'Version Control', sectionColor: sc['Version Control'], difficulty: 'Beginner', resources: [r('Git Handbook - GitHub', 'https://guides.github.com/introduction/git-handbook/', 'docs'), r('Git Tutorial for Beginners', 'https://www.youtube.com/watch?v=8JJ101D3knE', 'video')] },
  { id: 'git-branching', title: 'Branching & Merging', description: 'Create branches, merge strategies, resolve conflicts, rebase, and cherry-pick commits.', section: 'Version Control', sectionColor: sc['Version Control'], difficulty: 'Beginner', resources: [r('Git Branching - Atlassian', 'https://www.atlassian.com/git/tutorials/using-branches', 'article'), r('Git Branching Explained', 'https://www.youtube.com/watch?v=e2IbNHi4uCI', 'video')] },
  { id: 'git-github', title: 'GitHub & Collaboration', description: 'Pull requests, code reviews, issues, forks, GitHub Actions, and collaborative workflows.', section: 'Version Control', sectionColor: sc['Version Control'], difficulty: 'Beginner', resources: [r('GitHub Docs', 'https://docs.github.com/en/get-started', 'docs'), r('Git & GitHub Crash Course', 'https://www.youtube.com/watch?v=RGOj5yH7evk', 'video')] },
  { id: 'git-advanced', title: 'Advanced Git', description: 'Interactive rebase, bisect, stash, reflog, submodules, hooks, and Git internals.', section: 'Version Control', sectionColor: sc['Version Control'], difficulty: 'Advanced', resources: [r('Pro Git Book', 'https://git-scm.com/book/en/v2', 'docs'), r('Advanced Git Tips', 'https://www.youtube.com/watch?v=qsTthZi23VE', 'video')] },

  // ── Package Managers ──
  { id: 'npm-basics', title: 'npm', description: 'Node Package Manager — installing, updating, publishing packages, and managing dependencies.', section: 'Package Managers', sectionColor: sc['Package Managers'], difficulty: 'Beginner', resources: [r('npm Docs', 'https://docs.npmjs.com/', 'docs'), r('NPM Crash Course', 'https://www.youtube.com/watch?v=jHDhaSSKv7c', 'video')] },
  { id: 'yarn', title: 'Yarn / pnpm', description: 'Alternative package managers with faster installs, workspaces, and better dependency management.', section: 'Package Managers', sectionColor: sc['Package Managers'], difficulty: 'Beginner', isAlternative: true, resources: [r('Yarn Docs', 'https://yarnpkg.com/getting-started', 'docs'), r('pnpm vs npm vs yarn', 'https://www.youtube.com/watch?v=ZIKDJBrk56k', 'video')] },

  // ── Build Tools ──
  { id: 'build-vite', title: 'Vite', description: 'Next-gen frontend build tool with instant HMR, native ES modules, and blazing fast builds.', section: 'Build Tools', sectionColor: sc['Build Tools'], difficulty: 'Intermediate', resources: [r('Vite Documentation', 'https://vite.dev/guide/', 'docs'), r('Vite Crash Course', 'https://www.youtube.com/watch?v=KCrXgy8qtjM', 'video')] },
  { id: 'build-webpack', title: 'Webpack', description: 'Module bundler for JavaScript applications — loaders, plugins, code splitting, and optimization.', section: 'Build Tools', sectionColor: sc['Build Tools'], difficulty: 'Intermediate', isAlternative: true, resources: [r('Webpack Docs', 'https://webpack.js.org/concepts/', 'docs'), r('Webpack Crash Course', 'https://www.youtube.com/watch?v=IZGNcSuwBZs', 'video')] },
  { id: 'build-eslint', title: 'ESLint & Prettier', description: 'Linting JavaScript/TypeScript code and auto-formatting for consistent code style across teams.', section: 'Build Tools', sectionColor: sc['Build Tools'], difficulty: 'Beginner', resources: [r('ESLint Getting Started', 'https://eslint.org/docs/latest/use/getting-started', 'docs'), r('ESLint & Prettier Setup', 'https://www.youtube.com/watch?v=SydnKbGc7W8', 'video')] },
  { id: 'build-babel', title: 'Babel / SWC', description: 'JavaScript compilers that transform modern JS/TS to backwards-compatible versions for browsers.', section: 'Build Tools', sectionColor: sc['Build Tools'], difficulty: 'Intermediate', isAlternative: true, resources: [r('Babel Docs', 'https://babeljs.io/docs/', 'docs'), r('SWC Overview', 'https://swc.rs/', 'docs')] },

  // ── TypeScript ──
  { id: 'ts-basics', title: 'TypeScript Basics', description: 'Type annotations, interfaces, type aliases, enums, and basic TypeScript syntax and configuration.', section: 'TypeScript', sectionColor: sc['TypeScript'], difficulty: 'Intermediate', resources: [r('TypeScript Handbook', 'https://www.typescriptlang.org/docs/handbook/', 'docs'), r('TypeScript Crash Course', 'https://www.youtube.com/watch?v=BCg4U1FzODs', 'video')] },
  { id: 'ts-generics', title: 'Generics & Utility Types', description: 'Generic functions, generic constraints, built-in utility types (Partial, Pick, Omit, Record), and advanced patterns.', section: 'TypeScript', sectionColor: sc['TypeScript'], difficulty: 'Advanced', resources: [r('Generics - TS Handbook', 'https://www.typescriptlang.org/docs/handbook/2/generics.html', 'docs'), r('TS Generics Explained', 'https://www.youtube.com/watch?v=nViEqpgwxHE', 'video')] },
  { id: 'ts-narrowing', title: 'Type Narrowing & Guards', description: 'Type guards, discriminated unions, assertion functions, and narrowing control flow in TypeScript.', section: 'TypeScript', sectionColor: sc['TypeScript'], difficulty: 'Intermediate', resources: [r('Narrowing - TS Handbook', 'https://www.typescriptlang.org/docs/handbook/2/narrowing.html', 'docs'), r('Type Guards Explained', 'https://www.youtube.com/watch?v=S8rB5_pVUr4', 'video')] },
  { id: 'ts-config', title: 'tsconfig & Project Setup', description: 'Configuring tsconfig.json, compiler options, strict mode, path aliases, and project references.', section: 'TypeScript', sectionColor: sc['TypeScript'], difficulty: 'Intermediate', resources: [r('TSConfig Reference', 'https://www.typescriptlang.org/tsconfig', 'docs'), r('TSConfig Explained', 'https://www.youtube.com/watch?v=L1dWhHgnkdQ', 'video')] },

  // ── React ──
  { id: 'react-basics', title: 'React Fundamentals', description: 'Components, JSX, props, rendering, and the component lifecycle in React.', section: 'React', sectionColor: sc['React'], difficulty: 'Intermediate', resources: [r('React Quick Start', 'https://react.dev/learn', 'docs'), r('React Tutorial for Beginners', 'https://www.youtube.com/watch?v=SqcY0GlETPk', 'video')] },
  { id: 'react-hooks', title: 'React Hooks', description: 'useState, useEffect, useContext, useRef, useMemo, useCallback — managing state and side effects.', section: 'React', sectionColor: sc['React'], difficulty: 'Intermediate', resources: [r('React Hooks - React Docs', 'https://react.dev/reference/react/hooks', 'docs'), r('React Hooks Tutorial', 'https://www.youtube.com/watch?v=TNhaISOUy6Q', 'video')] },
  { id: 'react-state', title: 'State Management', description: 'Context API, Redux, Zustand, or React Query for managing application state at scale.', section: 'React', sectionColor: sc['React'], difficulty: 'Advanced', resources: [r('Managing State - React Docs', 'https://react.dev/learn/managing-state', 'docs'), r('React State Management', 'https://www.youtube.com/watch?v=zpUMRsAO6-Y', 'video')] },
  { id: 'react-router', title: 'React Router', description: 'Client-side routing, nested routes, dynamic params, and navigation in single-page React apps.', section: 'React', sectionColor: sc['React'], difficulty: 'Intermediate', resources: [r('React Router Docs', 'https://reactrouter.com/en/main', 'docs'), r('React Router Tutorial', 'https://www.youtube.com/watch?v=Ul3y1LXxzdU', 'video')] },
  { id: 'react-forms', title: 'Forms in React', description: 'Controlled components, form libraries (React Hook Form), validation (Zod), and form handling patterns.', section: 'React', sectionColor: sc['React'], difficulty: 'Intermediate', resources: [r('React Hook Form', 'https://react-hook-form.com/', 'docs'), r('React Forms Tutorial', 'https://www.youtube.com/watch?v=SfiOimv5_S0', 'video')] },
  { id: 'react-performance', title: 'React Performance', description: 'React.memo, useMemo, useCallback, code splitting, lazy loading, and avoiding unnecessary re-renders.', section: 'React', sectionColor: sc['React'], difficulty: 'Advanced', resources: [r('Optimizing Performance - React', 'https://react.dev/learn/render-and-commit', 'docs'), r('React Performance Tips', 'https://www.youtube.com/watch?v=uojLJFt9SzY', 'video')] },
  { id: 'react-patterns', title: 'React Design Patterns', description: 'Compound components, render props, HOCs, custom hooks, and composition patterns.', section: 'React', sectionColor: sc['React'], difficulty: 'Advanced', resources: [r('React Patterns', 'https://www.patterns.dev/react', 'article'), r('React Design Patterns', 'https://www.youtube.com/watch?v=MdvzlDIdQ0o', 'video')] },
  { id: 'react-ssr', title: 'SSR / Next.js', description: 'Server-side rendering, static site generation, ISR, and the Next.js framework for production React apps.', section: 'React', sectionColor: sc['React'], difficulty: 'Advanced', isAlternative: true, resources: [r('Next.js Docs', 'https://nextjs.org/docs', 'docs'), r('Next.js Crash Course', 'https://www.youtube.com/watch?v=mTz0GXj8NN0', 'video')] },

  // ── Testing ──
  { id: 'test-basics', title: 'Testing Fundamentals', description: 'Unit, integration, and E2E testing concepts, test-driven development (TDD), and testing pyramid.', section: 'Testing', sectionColor: sc['Testing'], difficulty: 'Intermediate', resources: [r('Testing Overview - MDN', 'https://developer.mozilla.org/en-US/docs/Learn/Tools_and_testing', 'docs'), r('Testing Introduction', 'https://www.youtube.com/watch?v=u6QfIXgjwGQ', 'video')] },
  { id: 'test-jest', title: 'Jest / Vitest', description: 'JavaScript testing frameworks — writing tests, assertions, mocking, and test coverage.', section: 'Testing', sectionColor: sc['Testing'], difficulty: 'Intermediate', resources: [r('Jest Getting Started', 'https://jestjs.io/docs/getting-started', 'docs'), r('Vitest Crash Course', 'https://www.youtube.com/watch?v=7f-71kYhK00', 'video')] },
  { id: 'test-rtl', title: 'React Testing Library', description: 'Testing React components from the user perspective — queries, events, async, and best practices.', section: 'Testing', sectionColor: sc['Testing'], difficulty: 'Intermediate', resources: [r('Testing Library Docs', 'https://testing-library.com/docs/react-testing-library/intro/', 'docs'), r('React Testing Crash Course', 'https://www.youtube.com/watch?v=8Xwq35cPwYg', 'video')] },
  { id: 'test-e2e', title: 'E2E Testing (Cypress/Playwright)', description: 'End-to-end testing frameworks for testing complete user flows in real browser environments.', section: 'Testing', sectionColor: sc['Testing'], difficulty: 'Advanced', isAlternative: true, resources: [r('Playwright Docs', 'https://playwright.dev/docs/intro', 'docs'), r('Cypress Crash Course', 'https://www.youtube.com/watch?v=BQqzfHQkREo', 'video')] },

  // ── Web Security ──
  { id: 'sec-https', title: 'HTTPS & SSL/TLS', description: 'How HTTPS encrypts data, SSL/TLS handshake, certificates, and why HTTPS matters.', section: 'Web Security', sectionColor: sc['Web Security'], difficulty: 'Beginner', resources: [r('HTTPS - web.dev', 'https://web.dev/articles/why-https-matters', 'article'), r('SSL/TLS Explained', 'https://www.youtube.com/watch?v=j9QmMEWmcfo', 'video')] },
  { id: 'sec-cors', title: 'CORS', description: 'Cross-Origin Resource Sharing — how browsers enforce same-origin policy and how to configure CORS.', section: 'Web Security', sectionColor: sc['Web Security'], difficulty: 'Intermediate', resources: [r('CORS - MDN', 'https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS', 'docs'), r('CORS Explained', 'https://www.youtube.com/watch?v=4KHiSt0oLJ0', 'video')] },
  { id: 'sec-xss', title: 'XSS & CSRF Prevention', description: 'Cross-site scripting, cross-site request forgery attacks, and how to prevent them in web apps.', section: 'Web Security', sectionColor: sc['Web Security'], difficulty: 'Advanced', resources: [r('XSS Prevention - OWASP', 'https://owasp.org/www-community/attacks/xss/', 'article'), r('Web Security Basics', 'https://www.youtube.com/watch?v=IhJ3leSsahA', 'video')] },
  { id: 'sec-csp', title: 'Content Security Policy', description: 'CSP headers to mitigate XSS and data injection attacks by controlling resource loading.', section: 'Web Security', sectionColor: sc['Web Security'], difficulty: 'Advanced', resources: [r('CSP - MDN', 'https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP', 'docs'), r('CSP Explained', 'https://www.youtube.com/watch?v=txHc4zk6w3s', 'video')] },
  { id: 'sec-owasp', title: 'OWASP Top 10', description: 'The most critical web application security risks and how to protect against them.', section: 'Web Security', sectionColor: sc['Web Security'], difficulty: 'Advanced', resources: [r('OWASP Top 10', 'https://owasp.org/www-project-top-ten/', 'article'), r('OWASP Top 10 Explained', 'https://www.youtube.com/watch?v=avFR_Af0KGk', 'video')] },

  // ── Node.js ──
  { id: 'node-basics', title: 'Node.js Fundamentals', description: 'Runtime environment, modules, file system, event-driven architecture, and npm package management.', section: 'Node.js', sectionColor: sc['Node.js'], difficulty: 'Intermediate', resources: [r('Node.js Getting Started', 'https://nodejs.org/en/learn/getting-started/introduction-to-nodejs', 'docs'), r('Node.js Crash Course', 'https://www.youtube.com/watch?v=fBNz5xF-Kx4', 'video')] },
  { id: 'node-express', title: 'Express.js', description: 'Build web servers and REST APIs with Express — routing, middleware, error handling, and templates.', section: 'Node.js', sectionColor: sc['Node.js'], difficulty: 'Intermediate', resources: [r('Express.js Guide', 'https://expressjs.com/en/guide/routing.html', 'docs'), r('Express.js Crash Course', 'https://www.youtube.com/watch?v=SccSCuHhOw0', 'video')] },
  { id: 'node-auth', title: 'Authentication & Authorization', description: 'JWT, sessions, OAuth, password hashing, role-based access control for securing applications.', section: 'Node.js', sectionColor: sc['Node.js'], difficulty: 'Advanced', resources: [r('JWT Introduction', 'https://jwt.io/introduction', 'docs'), r('Node Auth Tutorial', 'https://www.youtube.com/watch?v=mbsmsi7l3r4', 'video')] },
  { id: 'node-middleware', title: 'Middleware & Error Handling', description: 'Request processing pipeline, custom middleware, centralized error handling, and logging strategies.', section: 'Node.js', sectionColor: sc['Node.js'], difficulty: 'Intermediate', resources: [r('Express Middleware - Docs', 'https://expressjs.com/en/guide/using-middleware.html', 'docs'), r('Middleware Explained', 'https://www.youtube.com/watch?v=lY6icfhap2o', 'video')] },
  { id: 'node-streams', title: 'Streams & Buffers', description: 'Readable, writable, and transform streams for efficient data processing in Node.js.', section: 'Node.js', sectionColor: sc['Node.js'], difficulty: 'Advanced', resources: [r('Streams - Node.js Docs', 'https://nodejs.org/api/stream.html', 'docs'), r('Node Streams Explained', 'https://www.youtube.com/watch?v=GlybFFMXXmQ', 'video')] },
  { id: 'node-validation', title: 'Input Validation (Zod/Joi)', description: 'Server-side input validation and sanitization with libraries like Zod, Joi, or express-validator.', section: 'Node.js', sectionColor: sc['Node.js'], difficulty: 'Intermediate', resources: [r('Zod Documentation', 'https://zod.dev/', 'docs'), r('Input Validation in Node', 'https://www.youtube.com/watch?v=oOK3UzLJ_Cs', 'video')] },
  { id: 'node-file-upload', title: 'File Uploads & Storage', description: 'Handle multipart file uploads with Multer, store files locally or in cloud storage (S3).', section: 'Node.js', sectionColor: sc['Node.js'], difficulty: 'Intermediate', resources: [r('Multer Docs', 'https://github.com/expressjs/multer', 'docs'), r('File Upload Tutorial', 'https://www.youtube.com/watch?v=EVOFt8Its6I', 'video')] },
  { id: 'node-nestjs', title: 'NestJS', description: 'Enterprise-grade Node.js framework with TypeScript, dependency injection, modules, and decorators.', section: 'Node.js', sectionColor: sc['Node.js'], difficulty: 'Advanced', isAlternative: true, resources: [r('NestJS Docs', 'https://docs.nestjs.com/', 'docs'), r('NestJS Crash Course', 'https://www.youtube.com/watch?v=wqhNoDE6pb4', 'video')] },

  // ── Databases ──
  { id: 'db-fundamentals', title: 'Database Fundamentals', description: 'Data modeling, normalization, ACID properties, and understanding relational vs non-relational databases.', section: 'Databases', sectionColor: sc['Databases'], difficulty: 'Intermediate', resources: [r('Database Design', 'https://www.guru99.com/database-normalization.html', 'article'), r('Database Design Course', 'https://www.youtube.com/watch?v=ztHopE5Wnpc', 'video')] },
  { id: 'db-sql', title: 'SQL Fundamentals', description: 'SQL queries, joins, subqueries, indexes, views, transactions, and stored procedures.', section: 'Databases', sectionColor: sc['Databases'], difficulty: 'Intermediate', resources: [r('SQL Tutorial - W3Schools', 'https://www.w3schools.com/sql/', 'docs'), r('SQL Full Course', 'https://www.youtube.com/watch?v=HXV3zeQKqGY', 'video')] },
  { id: 'db-postgres', title: 'PostgreSQL', description: 'Advanced relational database with JSON support, full-text search, CTEs, and excellent performance.', section: 'Databases', sectionColor: sc['Databases'], difficulty: 'Intermediate', resources: [r('PostgreSQL Tutorial', 'https://www.postgresqltutorial.com/', 'docs'), r('PostgreSQL Crash Course', 'https://www.youtube.com/watch?v=qw--VYLpxG4', 'video')] },
  { id: 'db-mysql', title: 'MySQL', description: 'Popular open-source relational database known for reliability and ease of use in web applications.', section: 'Databases', sectionColor: sc['Databases'], difficulty: 'Intermediate', isAlternative: true, resources: [r('MySQL Tutorial', 'https://www.mysqltutorial.org/', 'docs'), r('MySQL Crash Course', 'https://www.youtube.com/watch?v=9ylj9NR0Lcg', 'video')] },
  { id: 'db-mongodb', title: 'MongoDB', description: 'NoSQL document database storing data as flexible JSON-like documents with dynamic schemas.', section: 'Databases', sectionColor: sc['Databases'], difficulty: 'Intermediate', isAlternative: true, resources: [r('MongoDB Docs', 'https://www.mongodb.com/docs/manual/', 'docs'), r('MongoDB Crash Course', 'https://www.youtube.com/watch?v=ofme2o29ngU', 'video')] },
  { id: 'db-redis', title: 'Redis', description: 'In-memory data store used as cache, message broker, and session store for high-performance apps.', section: 'Databases', sectionColor: sc['Databases'], difficulty: 'Intermediate', resources: [r('Redis Docs', 'https://redis.io/docs/', 'docs'), r('Redis Crash Course', 'https://www.youtube.com/watch?v=jgpVdJB2sKQ', 'video')] },
  { id: 'db-orm', title: 'ORMs (Prisma / Drizzle)', description: 'Object-Relational Mapping tools for type-safe database queries, migrations, and schema management.', section: 'Databases', sectionColor: sc['Databases'], difficulty: 'Intermediate', resources: [r('Prisma Docs', 'https://www.prisma.io/docs', 'docs'), r('Prisma Crash Course', 'https://www.youtube.com/watch?v=RebA5J-rlwg', 'video')] },
  { id: 'db-migrations', title: 'Database Migrations', description: 'Version-controlled database schema changes, rollbacks, and migration strategies for production.', section: 'Databases', sectionColor: sc['Databases'], difficulty: 'Intermediate', resources: [r('Prisma Migrations', 'https://www.prisma.io/docs/concepts/components/prisma-migrate', 'docs'), r('DB Migrations Explained', 'https://www.youtube.com/watch?v=dJDBP7pPA-0', 'video')] },

  // ── APIs ──
  { id: 'api-rest', title: 'REST API Design', description: 'RESTful principles, resource naming, HTTP methods, status codes, versioning, and best practices.', section: 'APIs', sectionColor: sc['APIs'], difficulty: 'Intermediate', resources: [r('REST API Tutorial', 'https://restfulapi.net/', 'article'), r('REST API Design', 'https://www.youtube.com/watch?v=-MTSQjw5DrM', 'video')] },
  { id: 'api-graphql', title: 'GraphQL', description: 'Query language for APIs with a single endpoint, type system, and client-driven data fetching.', section: 'APIs', sectionColor: sc['APIs'], difficulty: 'Advanced', isAlternative: true, resources: [r('GraphQL Docs', 'https://graphql.org/learn/', 'docs'), r('GraphQL Crash Course', 'https://www.youtube.com/watch?v=ed8SzALpx1Q', 'video')] },
  { id: 'api-websockets', title: 'WebSockets', description: 'Real-time bidirectional communication between client and server for live features like chat.', section: 'APIs', sectionColor: sc['APIs'], difficulty: 'Advanced', resources: [r('WebSocket API - MDN', 'https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API', 'docs'), r('WebSockets Tutorial', 'https://www.youtube.com/watch?v=8ARodQ4Wlf4', 'video')] },
  { id: 'api-auth-strategies', title: 'API Authentication', description: 'API keys, OAuth 2.0, JWT tokens, session-based auth for securing your API endpoints.', section: 'APIs', sectionColor: sc['APIs'], difficulty: 'Advanced', resources: [r('OAuth 2.0 Simplified', 'https://www.oauth.com/', 'article'), r('API Auth Explained', 'https://www.youtube.com/watch?v=GhrvZ5nUWNg', 'video')] },
  { id: 'api-rate-limiting', title: 'Rate Limiting & Throttling', description: 'Protect APIs from abuse with rate limiting, request throttling, and IP-based restrictions.', section: 'APIs', sectionColor: sc['APIs'], difficulty: 'Intermediate', resources: [r('Rate Limiting Strategies', 'https://blog.logrocket.com/rate-limiting-node-js/', 'article'), r('Rate Limiting Explained', 'https://www.youtube.com/watch?v=CRGPbCbRTHA', 'video')] },
  { id: 'api-documentation', title: 'API Documentation (Swagger)', description: 'Document APIs with OpenAPI/Swagger for clear, interactive documentation and client generation.', section: 'APIs', sectionColor: sc['APIs'], difficulty: 'Intermediate', resources: [r('Swagger Docs', 'https://swagger.io/docs/', 'docs'), r('API Documentation Best Practices', 'https://www.youtube.com/watch?v=YS4e4q9oBaU', 'video')] },

  // ── Caching ──
  { id: 'cache-browser', title: 'Browser Caching', description: 'Cache-Control headers, ETags, service workers, and browser caching strategies for performance.', section: 'Caching', sectionColor: sc['Caching'], difficulty: 'Intermediate', resources: [r('HTTP Caching - MDN', 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching', 'docs'), r('Caching Explained', 'https://www.youtube.com/watch?v=HiBDZgTNpXY', 'video')] },
  { id: 'cache-server', title: 'Server-Side Caching', description: 'Redis caching, CDN caching, in-memory caching, and caching strategies (TTL, LRU, write-through).', section: 'Caching', sectionColor: sc['Caching'], difficulty: 'Advanced', resources: [r('Caching Strategies', 'https://aws.amazon.com/caching/best-practices/', 'article'), r('Server Caching Tutorial', 'https://www.youtube.com/watch?v=dGAgxozNWFE', 'video')] },
  { id: 'cache-cdn', title: 'CDN (Content Delivery Network)', description: 'Distribute static content globally for faster load times using CDN providers like Cloudflare.', section: 'Caching', sectionColor: sc['Caching'], difficulty: 'Intermediate', resources: [r('What is a CDN?', 'https://www.cloudflare.com/learning/cdn/what-is-a-cdn/', 'article'), r('CDN Explained', 'https://www.youtube.com/watch?v=Bsq5cKkS33I', 'video')] },

  // ── Web Servers ──
  { id: 'ws-nginx', title: 'Nginx', description: 'High-performance web server for reverse proxy, load balancing, and static file serving.', section: 'Web Servers', sectionColor: sc['Web Servers'], difficulty: 'Intermediate', resources: [r('Nginx Docs', 'https://nginx.org/en/docs/', 'docs'), r('Nginx Crash Course', 'https://www.youtube.com/watch?v=7VAI73roXaY', 'video')] },
  { id: 'ws-apache', title: 'Apache', description: 'Popular open-source web server with modules for authentication, URL rewriting, and more.', section: 'Web Servers', sectionColor: sc['Web Servers'], difficulty: 'Intermediate', isAlternative: true, resources: [r('Apache Docs', 'https://httpd.apache.org/docs/', 'docs'), r('Apache Tutorial', 'https://www.youtube.com/watch?v=1CDxpAzvLKY', 'video')] },

  // ── Architectural Patterns ──
  { id: 'arch-monolith', title: 'Monolithic Architecture', description: 'Single deployable unit containing all application logic — simple to build but harder to scale.', section: 'Architectural Patterns', sectionColor: sc['Architectural Patterns'], difficulty: 'Intermediate', resources: [r('Monolith vs Microservices', 'https://www.atlassian.com/microservices/microservices-architecture/microservices-vs-monolith', 'article'), r('Monolith Explained', 'https://www.youtube.com/watch?v=qYhRvH9tJKw', 'video')] },
  { id: 'arch-microservices', title: 'Microservices', description: 'Decomposing applications into small, independently deployable services communicating via APIs.', section: 'Architectural Patterns', sectionColor: sc['Architectural Patterns'], difficulty: 'Advanced', resources: [r('Microservices Guide', 'https://martinfowler.com/articles/microservices.html', 'article'), r('Microservices Explained', 'https://www.youtube.com/watch?v=rv4LlmLmVWk', 'video')] },
  { id: 'arch-serverless', title: 'Serverless Architecture', description: 'Function-as-a-Service (FaaS) with AWS Lambda, edge functions, and event-driven computing.', section: 'Architectural Patterns', sectionColor: sc['Architectural Patterns'], difficulty: 'Advanced', isAlternative: true, resources: [r('Serverless Guide', 'https://www.serverless.com/learn', 'article'), r('Serverless Explained', 'https://www.youtube.com/watch?v=W_VV2Fx32_Y', 'video')] },
  { id: 'arch-messaging', title: 'Message Queues', description: 'Asynchronous communication with RabbitMQ, Kafka, or SQS for decoupled, scalable systems.', section: 'Architectural Patterns', sectionColor: sc['Architectural Patterns'], difficulty: 'Advanced', resources: [r('Message Queues Explained', 'https://aws.amazon.com/message-queue/', 'article'), r('Message Queues Tutorial', 'https://www.youtube.com/watch?v=oUJbuFMyBDk', 'video')] },

  // ── Containerization ──
  { id: 'docker-basics', title: 'Docker Fundamentals', description: 'Images, containers, Dockerfiles, volumes, networks, and Docker Compose for multi-container apps.', section: 'Containerization', sectionColor: sc['Containerization'], difficulty: 'Intermediate', resources: [r('Docker Getting Started', 'https://docs.docker.com/get-started/', 'docs'), r('Docker Crash Course', 'https://www.youtube.com/watch?v=fqMOX6JJhGo', 'video')] },
  { id: 'docker-compose', title: 'Docker Compose', description: 'Define and run multi-container applications with YAML configuration for local development.', section: 'Containerization', sectionColor: sc['Containerization'], difficulty: 'Intermediate', resources: [r('Docker Compose Docs', 'https://docs.docker.com/compose/', 'docs'), r('Docker Compose Tutorial', 'https://www.youtube.com/watch?v=HG6yIjZapSA', 'video')] },
  { id: 'docker-k8s', title: 'Kubernetes Basics', description: 'Container orchestration — pods, services, deployments, and scaling containerized applications.', section: 'Containerization', sectionColor: sc['Containerization'], difficulty: 'Advanced', isAlternative: true, resources: [r('Kubernetes Docs', 'https://kubernetes.io/docs/tutorials/', 'docs'), r('Kubernetes Crash Course', 'https://www.youtube.com/watch?v=s_o8dwzRlu4', 'video')] },

  // ── CI/CD ──
  { id: 'cicd-github-actions', title: 'GitHub Actions', description: 'Automate workflows for testing, building, and deploying code directly from GitHub repositories.', section: 'CI/CD', sectionColor: sc['CI/CD'], difficulty: 'Intermediate', resources: [r('GitHub Actions Docs', 'https://docs.github.com/en/actions', 'docs'), r('GitHub Actions Tutorial', 'https://www.youtube.com/watch?v=R8_veQiYBjI', 'video')] },
  { id: 'cicd-jenkins', title: 'Jenkins', description: 'Open-source automation server for building CI/CD pipelines with plugins and pipeline-as-code.', section: 'CI/CD', sectionColor: sc['CI/CD'], difficulty: 'Advanced', isAlternative: true, resources: [r('Jenkins Docs', 'https://www.jenkins.io/doc/', 'docs'), r('Jenkins Tutorial', 'https://www.youtube.com/watch?v=FX322RVNGj4', 'video')] },
  { id: 'cicd-testing', title: 'Automated Testing in CI', description: 'Running unit, integration, and E2E tests automatically on every push or pull request.', section: 'CI/CD', sectionColor: sc['CI/CD'], difficulty: 'Intermediate', resources: [r('CI Testing Best Practices', 'https://docs.github.com/en/actions/automating-builds-and-tests', 'docs'), r('CI/CD Testing', 'https://www.youtube.com/watch?v=scEDHsr3APg', 'video')] },

  // ── Cloud Providers ──
  { id: 'cloud-aws', title: 'AWS Essentials', description: 'Core AWS services: EC2, S3, Lambda, RDS, IAM — building scalable cloud applications.', section: 'Cloud Providers', sectionColor: sc['Cloud Providers'], difficulty: 'Advanced', resources: [r('AWS Getting Started', 'https://aws.amazon.com/getting-started/', 'docs'), r('AWS Crash Course', 'https://www.youtube.com/watch?v=ulprqHHWlng', 'video')] },
  { id: 'cloud-gcp', title: 'Google Cloud Platform', description: 'GCP services like Compute Engine, Cloud Functions, Cloud SQL, and Firebase for web apps.', section: 'Cloud Providers', sectionColor: sc['Cloud Providers'], difficulty: 'Advanced', isAlternative: true, resources: [r('GCP Docs', 'https://cloud.google.com/docs', 'docs'), r('GCP Crash Course', 'https://www.youtube.com/watch?v=IUU6OR8yHCc', 'video')] },
  { id: 'cloud-azure', title: 'Microsoft Azure', description: 'Azure services for hosting, databases, serverless computing, and enterprise cloud solutions.', section: 'Cloud Providers', sectionColor: sc['Cloud Providers'], difficulty: 'Advanced', isAlternative: true, resources: [r('Azure Docs', 'https://learn.microsoft.com/en-us/azure/', 'docs'), r('Azure Crash Course', 'https://www.youtube.com/watch?v=NKEFWyqJ5XA', 'video')] },

  // ── DevOps ──
  { id: 'devops-linux', title: 'Linux Basics', description: 'Command line, file system navigation, permissions, processes, and shell scripting essentials.', section: 'DevOps', sectionColor: sc['DevOps'], difficulty: 'Beginner', resources: [r('Linux Journey', 'https://linuxjourney.com/', 'article'), r('Linux Commands', 'https://www.youtube.com/watch?v=ZtqBQ68cfJc', 'video')] },
  { id: 'devops-ssh', title: 'SSH & Terminal Tools', description: 'Secure Shell connections, SSH keys, tmux, and command-line tools for server management.', section: 'DevOps', sectionColor: sc['DevOps'], difficulty: 'Beginner', resources: [r('SSH Tutorial', 'https://www.ssh.com/academy/ssh', 'article'), r('SSH Crash Course', 'https://www.youtube.com/watch?v=hQWRp-FdTpc', 'video')] },
  { id: 'devops-monitoring', title: 'Monitoring & Logging', description: 'Application monitoring with Prometheus, Grafana, Sentry, and centralized logging with ELK stack.', section: 'DevOps', sectionColor: sc['DevOps'], difficulty: 'Advanced', resources: [r('Sentry Docs', 'https://docs.sentry.io/', 'docs'), r('Monitoring Guide', 'https://www.youtube.com/watch?v=SHDilCMd5LM', 'video')] },
  { id: 'devops-infra-code', title: 'Infrastructure as Code', description: 'Terraform, Ansible, and CloudFormation for provisioning and managing infrastructure programmatically.', section: 'DevOps', sectionColor: sc['DevOps'], difficulty: 'Advanced', isAlternative: true, resources: [r('Terraform Docs', 'https://developer.hashicorp.com/terraform/docs', 'docs'), r('Terraform Crash Course', 'https://www.youtube.com/watch?v=SLB_c_ayRMo', 'video')] },

  // ── Deployment ──
  { id: 'deploy-vercel', title: 'Vercel / Netlify', description: 'Deploy frontend apps with zero-config, automatic previews, serverless functions, and edge CDN.', section: 'Deployment', sectionColor: sc['Deployment'], difficulty: 'Beginner', resources: [r('Vercel Docs', 'https://vercel.com/docs', 'docs'), r('Deploy with Vercel', 'https://www.youtube.com/watch?v=8lGpZkjnkt4', 'video')] },
  { id: 'deploy-railway', title: 'Railway / Render', description: 'Full-stack deployment platforms for Node.js, databases, and background workers with easy setup.', section: 'Deployment', sectionColor: sc['Deployment'], difficulty: 'Beginner', resources: [r('Railway Docs', 'https://docs.railway.app/', 'docs'), r('Railway Tutorial', 'https://www.youtube.com/watch?v=Kx7VIy67XkI', 'video')] },
  { id: 'deploy-vps', title: 'VPS Deployment', description: 'Deploy applications on virtual private servers (DigitalOcean, Linode) with full control.', section: 'Deployment', sectionColor: sc['Deployment'], difficulty: 'Advanced', resources: [r('DigitalOcean Tutorials', 'https://www.digitalocean.com/community/tutorials', 'article'), r('VPS Deployment Guide', 'https://www.youtube.com/watch?v=oykl1Ih9pMg', 'video')] },
  { id: 'deploy-domains', title: 'Domains & DNS Config', description: 'Purchase domains, configure DNS records (A, CNAME, MX), and set up SSL certificates.', section: 'Deployment', sectionColor: sc['Deployment'], difficulty: 'Beginner', resources: [r('DNS Records Explained', 'https://www.cloudflare.com/learning/dns/dns-records/', 'article'), r('Domain Setup Tutorial', 'https://www.youtube.com/watch?v=YV5tkQYcvfg', 'video')] },
  { id: 'deploy-perf', title: 'Web Performance', description: 'Core Web Vitals, Lighthouse, lazy loading, image optimization, and performance budgets.', section: 'Deployment', sectionColor: sc['Deployment'], difficulty: 'Intermediate', resources: [r('Web Vitals - web.dev', 'https://web.dev/articles/vitals', 'article'), r('Performance Optimization', 'https://www.youtube.com/watch?v=AQqFZ5t8uNc', 'video')] },
  { id: 'deploy-pwa', title: 'Progressive Web Apps', description: 'Service workers, web app manifest, offline support, and installable web applications.', section: 'Deployment', sectionColor: sc['Deployment'], difficulty: 'Advanced', isAlternative: true, resources: [r('PWA - web.dev', 'https://web.dev/explore/progressive-web-apps', 'article'), r('PWA Tutorial', 'https://www.youtube.com/watch?v=sFsRylCQblw', 'video')] },
];

// ── Build roadmap.sh-style branching layout ──
const SPINE_X = 400;
const BRANCH_OFFSET = 220;
const NODE_W = 180;
const NODE_H = 36;
const SECTION_H = 40;
const Y_SECTION_GAP = 60;
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

    const sectionId = `section-${sec.replace(/\s+/g, '-').toLowerCase()}`;
    nodes.push({
      id: sectionId,
      type: 'sectionNode',
      position: { x: SPINE_X - 90, y },
      data: { title: sec, sectionColor: color },
    });

    y += SECTION_H + 20;

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

    y += Y_SECTION_GAP - Y_PAIR_GAP;
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
    type: string;
    animated: boolean;
    style: Record<string, any>;
  }> = [];

  const sectionOrder: string[] = [];
  roadmapNodesData.forEach((nd) => {
    const sid = `section-${nd.section.replace(/\s+/g, '-').toLowerCase()}`;
    if (!sectionOrder.includes(sid)) sectionOrder.push(sid);
  });

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

  let currentSection = '';
  let sNodes: RoadmapNodeData[] = [];

  const flushEdges = () => {
    if (!sNodes.length) return;
    const sid = `section-${sNodes[0].section.replace(/\s+/g, '-').toLowerCase()}`;
    const color = sNodes[0].sectionColor;

    sNodes.forEach((nd) => {
      edges.push({
        id: `e-${sid}-${nd.id}`,
        source: sid,
        target: nd.id,
        type: 'smoothstep',
        animated: false,
        style: { stroke: color, strokeWidth: 1.5, opacity: 0.6 },
      });
    });

    sNodes = [];
  };

  roadmapNodesData.forEach((nd) => {
    if (nd.section !== currentSection) {
      flushEdges();
      currentSection = nd.section;
    }
    sNodes.push(nd);
  });
  flushEdges();

  return edges;
}

export const flowNodes = buildFlowNodes();
export const flowEdges = buildFlowEdges();
