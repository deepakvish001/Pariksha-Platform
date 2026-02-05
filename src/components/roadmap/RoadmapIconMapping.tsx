import { 
  FileCode, 
  Paintbrush, 
  Braces, 
  FileType,
  Layers,
  Hexagon,
  Server,
  Terminal,
  Coffee,
  Rocket,
  Cog,
  Database,
  Leaf,
  Zap,
  Share2,
  Container,
  Ship,
  Cloud,
  Workflow,
  GitBranch,
  Package,
  Boxes,
  FlaskConical,
  Globe,
  Shield,
  Webhook,
  Gauge,
  Eye,
  Smartphone,
  Brain,
  BookOpen,
  Code,
  FileJson,
  Component,
  Flame,
  Atom,
  Network,
  HardDrive,
  Cpu,
  Lock,
  Key,
  Fingerprint,
  type LucideIcon,
} from "lucide-react";

export interface IconMapping {
  keywords: string[];
  icon: LucideIcon;
  color: string;
  bg: string;
  gradient: string;
}

// Comprehensive icon mappings for 40+ technologies
export const iconMappings: IconMapping[] = [
  // Core Web Technologies
  { keywords: ['html', 'markup'], icon: FileCode, color: '#E44D26', bg: 'bg-orange-500/15', gradient: 'from-orange-500 to-red-500' },
  { keywords: ['css', 'style', 'sass', 'scss', 'less', 'tailwind'], icon: Paintbrush, color: '#2965F1', bg: 'bg-blue-500/15', gradient: 'from-blue-500 to-indigo-500' },
  { keywords: ['javascript', 'js', 'ecmascript'], icon: Braces, color: '#F7DF1E', bg: 'bg-yellow-400/15', gradient: 'from-yellow-400 to-amber-500' },
  { keywords: ['typescript', 'ts'], icon: FileType, color: '#3178C6', bg: 'bg-blue-600/15', gradient: 'from-blue-600 to-blue-800' },
  { keywords: ['json', 'data format'], icon: FileJson, color: '#6366F1', bg: 'bg-indigo-500/15', gradient: 'from-indigo-500 to-purple-500' },

  // Frontend Frameworks & Libraries
  { keywords: ['react', 'jsx', 'hooks'], icon: Atom, color: '#61DAFB', bg: 'bg-cyan-400/15', gradient: 'from-cyan-400 to-blue-500' },
  { keywords: ['vue', 'vuex', 'pinia'], icon: Component, color: '#4FC08D', bg: 'bg-emerald-500/15', gradient: 'from-emerald-500 to-green-600' },
  { keywords: ['angular', 'rxjs'], icon: Hexagon, color: '#DD0031', bg: 'bg-red-500/15', gradient: 'from-red-500 to-rose-600' },
  { keywords: ['svelte', 'sveltekit'], icon: Flame, color: '#FF3E00', bg: 'bg-orange-600/15', gradient: 'from-orange-500 to-red-600' },
  { keywords: ['next', 'nuxt', 'remix'], icon: Layers, color: '#000000', bg: 'bg-gray-800/15', gradient: 'from-gray-700 to-gray-900' },
  { keywords: ['redux', 'state management'], icon: Network, color: '#764ABC', bg: 'bg-purple-500/15', gradient: 'from-purple-500 to-violet-600' },

  // Backend & Server
  { keywords: ['node', 'express', 'deno', 'bun'], icon: Server, color: '#68A063', bg: 'bg-green-600/15', gradient: 'from-green-500 to-emerald-600' },
  { keywords: ['python', 'django', 'flask', 'fastapi'], icon: Terminal, color: '#3776AB', bg: 'bg-blue-500/15', gradient: 'from-blue-500 to-indigo-600' },
  { keywords: ['java', 'spring', 'maven'], icon: Coffee, color: '#007396', bg: 'bg-red-700/15', gradient: 'from-red-600 to-orange-600' },
  { keywords: ['go', 'golang'], icon: Rocket, color: '#00ADD8', bg: 'bg-cyan-500/15', gradient: 'from-cyan-500 to-blue-500' },
  { keywords: ['rust', 'cargo'], icon: Cog, color: '#DEA584', bg: 'bg-orange-400/15', gradient: 'from-orange-400 to-amber-600' },
  { keywords: ['php', 'laravel', 'wordpress'], icon: Code, color: '#777BB4', bg: 'bg-violet-500/15', gradient: 'from-violet-500 to-purple-600' },
  { keywords: ['ruby', 'rails'], icon: Boxes, color: '#CC342D', bg: 'bg-red-500/15', gradient: 'from-red-500 to-rose-600' },

  // Databases
  { keywords: ['sql', 'postgres', 'postgresql', 'mysql', 'database', 'sqlite'], icon: Database, color: '#336791', bg: 'bg-blue-700/15', gradient: 'from-blue-600 to-indigo-700' },
  { keywords: ['mongo', 'mongodb', 'nosql', 'document'], icon: Leaf, color: '#47A248', bg: 'bg-green-500/15', gradient: 'from-green-500 to-emerald-600' },
  { keywords: ['redis', 'cache', 'memcached'], icon: Zap, color: '#DC382D', bg: 'bg-red-500/15', gradient: 'from-red-500 to-orange-500' },
  { keywords: ['graphql', 'apollo'], icon: Share2, color: '#E10098', bg: 'bg-pink-500/15', gradient: 'from-pink-500 to-rose-600' },

  // DevOps & Cloud
  { keywords: ['docker', 'container', 'containerization'], icon: Container, color: '#2496ED', bg: 'bg-blue-500/15', gradient: 'from-blue-500 to-cyan-600' },
  { keywords: ['kubernetes', 'k8s', 'helm', 'orchestration'], icon: Ship, color: '#326CE5', bg: 'bg-blue-600/15', gradient: 'from-blue-600 to-indigo-600' },
  { keywords: ['aws', 'amazon', 's3', 'ec2', 'lambda'], icon: Cloud, color: '#FF9900', bg: 'bg-orange-400/15', gradient: 'from-orange-400 to-amber-500' },
  { keywords: ['gcp', 'google cloud', 'firebase'], icon: Cloud, color: '#4285F4', bg: 'bg-blue-500/15', gradient: 'from-blue-500 to-green-500' },
  { keywords: ['azure', 'microsoft cloud'], icon: Cloud, color: '#0089D6', bg: 'bg-blue-600/15', gradient: 'from-blue-500 to-cyan-600' },
  { keywords: ['ci', 'cd', 'pipeline', 'github actions', 'jenkins'], icon: Workflow, color: '#2088FF', bg: 'bg-blue-500/15', gradient: 'from-blue-500 to-violet-500' },
  { keywords: ['linux', 'bash', 'shell', 'unix', 'command line'], icon: Terminal, color: '#FCC624', bg: 'bg-yellow-500/15', gradient: 'from-yellow-500 to-orange-500' },

  // Tools & Version Control
  { keywords: ['git', 'version control', 'github', 'gitlab'], icon: GitBranch, color: '#F05032', bg: 'bg-orange-500/15', gradient: 'from-orange-500 to-red-500' },
  { keywords: ['npm', 'yarn', 'pnpm', 'package'], icon: Package, color: '#CB3837', bg: 'bg-red-500/15', gradient: 'from-red-500 to-rose-600' },
  { keywords: ['webpack', 'vite', 'rollup', 'build', 'bundler', 'esbuild'], icon: Boxes, color: '#8DD6F9', bg: 'bg-cyan-400/15', gradient: 'from-cyan-400 to-blue-500' },
  { keywords: ['test', 'jest', 'cypress', 'vitest', 'testing', 'playwright'], icon: FlaskConical, color: '#15C213', bg: 'bg-green-500/15', gradient: 'from-green-500 to-emerald-600' },

  // Concepts & Fundamentals
  { keywords: ['internet', 'http', 'https', 'dns', 'domain', 'hosting', 'web', 'browser'], icon: Globe, color: '#38BDF8', bg: 'bg-sky-400/15', gradient: 'from-sky-400 to-blue-500' },
  { keywords: ['security', 'secure', 'cors', 'csp', 'xss', 'csrf'], icon: Shield, color: '#EF4444', bg: 'bg-red-500/15', gradient: 'from-red-500 to-rose-600' },
  { keywords: ['auth', 'authentication', 'jwt', 'oauth', 'login', 'session'], icon: Key, color: '#8B5CF6', bg: 'bg-violet-500/15', gradient: 'from-violet-500 to-purple-600' },
  { keywords: ['api', 'rest', 'restful', 'endpoint'], icon: Webhook, color: '#6366F1', bg: 'bg-indigo-500/15', gradient: 'from-indigo-500 to-purple-600' },
  { keywords: ['performance', 'optimize', 'speed', 'metrics', 'lighthouse'], icon: Gauge, color: '#F59E0B', bg: 'bg-amber-500/15', gradient: 'from-amber-500 to-orange-500' },
  { keywords: ['accessibility', 'a11y', 'aria', 'screen reader'], icon: Eye, color: '#8B5CF6', bg: 'bg-violet-500/15', gradient: 'from-violet-500 to-purple-500' },
  { keywords: ['responsive', 'mobile', 'pwa', 'app'], icon: Smartphone, color: '#EC4899', bg: 'bg-pink-500/15', gradient: 'from-pink-500 to-rose-500' },
  { keywords: ['ai', 'ml', 'machine learning', 'deep learning', 'neural'], icon: Brain, color: '#A855F7', bg: 'bg-purple-500/15', gradient: 'from-purple-500 to-violet-600' },
  { keywords: ['seo', 'search engine', 'meta'], icon: Globe, color: '#10B981', bg: 'bg-emerald-500/15', gradient: 'from-emerald-500 to-green-600' },
  { keywords: ['storage', 'file', 'blob'], icon: HardDrive, color: '#6B7280', bg: 'bg-gray-500/15', gradient: 'from-gray-500 to-slate-600' },
  { keywords: ['encryption', 'cryptography', 'ssl', 'tls'], icon: Lock, color: '#059669', bg: 'bg-emerald-600/15', gradient: 'from-emerald-600 to-teal-600' },
  { keywords: ['biometric', 'passkey', '2fa', 'mfa'], icon: Fingerprint, color: '#0891B2', bg: 'bg-cyan-600/15', gradient: 'from-cyan-600 to-teal-600' },
  { keywords: ['microservices', 'architecture', 'design pattern'], icon: Network, color: '#7C3AED', bg: 'bg-violet-600/15', gradient: 'from-violet-600 to-purple-600' },
  { keywords: ['cpu', 'memory', 'runtime', 'process'], icon: Cpu, color: '#64748B', bg: 'bg-slate-500/15', gradient: 'from-slate-500 to-gray-600' },
];

export const getNodeIcon = (title: string, type: string): { icon: LucideIcon; color: string; bg: string; gradient: string } => {
  const lowerTitle = title.toLowerCase();
  
  // Find matching icon based on keywords
  for (const mapping of iconMappings) {
    if (mapping.keywords.some(keyword => lowerTitle.includes(keyword))) {
      return {
        icon: mapping.icon,
        color: mapping.color,
        bg: mapping.bg,
        gradient: mapping.gradient,
      };
    }
  }
  
  // Type-based fallbacks with colorful defaults
  const typeDefaults: Record<string, { icon: LucideIcon; color: string; bg: string; gradient: string }> = {
    primary: { icon: BookOpen, color: '#F97316', bg: 'bg-orange-500/15', gradient: 'from-orange-500 to-amber-500' },
    secondary: { icon: Code, color: '#6B7280', bg: 'bg-gray-500/15', gradient: 'from-gray-500 to-slate-600' },
    checkpoint: { icon: FlaskConical, color: '#8B5CF6', bg: 'bg-violet-500/15', gradient: 'from-violet-500 to-purple-600' },
    resource: { icon: Globe, color: '#3B82F6', bg: 'bg-blue-500/15', gradient: 'from-blue-500 to-indigo-500' },
    optional: { icon: Boxes, color: '#9CA3AF', bg: 'bg-gray-400/15', gradient: 'from-gray-400 to-slate-500' },
  };
  
  return typeDefaults[type] || typeDefaults.secondary;
};
