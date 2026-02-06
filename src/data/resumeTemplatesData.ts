// Base URL for template previews in Supabase Storage
const STORAGE_BASE_URL = "https://lvnpvfxlmzbnylwkvgnq.supabase.co/storage/v1/object/public/resume-templates";

export interface ResumeTemplate {
  id: number;
  name: string;
  description: string;
  style: 'modern' | 'traditional' | 'creative' | 'minimal' | 'two-column';
  downloads: number;
  atsCompatible: boolean;
  isFeatured: boolean;
  format: string[];
  colorScheme: string;
  fileSize?: string;
  dateAdded: string;
  tags: string[];
  previewUrl?: string;
  downloadUrl?: string;
}

// Helper to get preview URL for a template
export const getTemplatePreviewUrl = (templateId: number): string => {
  return `${STORAGE_BASE_URL}/template-${templateId}-preview.png`;
};

// Helper to get download URL for a template
export const getTemplateDownloadUrl = (templateId: number, format: string = "pdf"): string => {
  const ext = format.toLowerCase() === "google docs" ? "gdoc" : format.toLowerCase();
  return `${STORAGE_BASE_URL}/template-${templateId}.${ext}`;
};

export const resumeTemplates: ResumeTemplate[] = [
  {
    id: 1,
    name: "Modern Professional",
    description: "Clean and contemporary design perfect for tech and business roles",
    style: "modern",
    downloads: 12500,
    atsCompatible: true,
    isFeatured: true,
    format: ["PDF", "DOCX", "Google Docs"],
    colorScheme: "from-blue-500 to-indigo-600",
    fileSize: "245 KB",
    dateAdded: "2024-01-15",
    tags: ["Tech", "Business", "Professional"],
    previewUrl: getTemplatePreviewUrl(1),
  },
  {
    id: 2,
    name: "Classic Executive",
    description: "Timeless elegance for senior positions and leadership roles",
    style: "traditional",
    downloads: 8900,
    atsCompatible: true,
    isFeatured: true,
    format: ["PDF", "DOCX"],
    colorScheme: "from-slate-600 to-slate-800",
    fileSize: "198 KB",
    dateAdded: "2024-01-10",
    tags: ["Executive", "Leadership", "Corporate"],
    previewUrl: getTemplatePreviewUrl(2),
  },
  {
    id: 3,
    name: "Creative Designer",
    description: "Bold and artistic layout for creative professionals",
    style: "creative",
    downloads: 6700,
    atsCompatible: false,
    isFeatured: false,
    format: ["PDF", "AI", "Figma"],
    colorScheme: "from-pink-500 to-purple-600",
    fileSize: "512 KB",
    dateAdded: "2024-02-01",
    tags: ["Design", "Creative", "Portfolio"],
    previewUrl: getTemplatePreviewUrl(3),
  },
  {
    id: 4,
    name: "Tech Engineer",
    description: "Optimized for software engineers and technical roles",
    style: "modern",
    downloads: 15200,
    atsCompatible: true,
    isFeatured: true,
    format: ["PDF", "DOCX", "LaTeX"],
    colorScheme: "from-blue-500 to-indigo-600",
    fileSize: "156 KB",
    dateAdded: "2024-01-20",
    tags: ["Tech", "Engineering", "Developer"],
    previewUrl: getTemplatePreviewUrl(4),
  },
  {
    id: 5,
    name: "Minimalist",
    description: "Simple and elegant with focus on content",
    style: "minimal",
    downloads: 9800,
    atsCompatible: true,
    isFeatured: false,
    format: ["PDF", "DOCX", "Google Docs"],
    colorScheme: "from-gray-400 to-gray-600",
    fileSize: "89 KB",
    dateAdded: "2024-01-25",
    tags: ["Clean", "Simple", "Versatile"],
    previewUrl: getTemplatePreviewUrl(5),
  },
  {
    id: 6,
    name: "Two Column Pro",
    description: "Efficient layout maximizing space for comprehensive experience",
    style: "two-column",
    downloads: 7400,
    atsCompatible: true,
    isFeatured: false,
    format: ["PDF", "DOCX"],
    colorScheme: "from-teal-500 to-cyan-600",
    fileSize: "178 KB",
    dateAdded: "2024-02-05",
    tags: ["Comprehensive", "Detailed", "Professional"],
    previewUrl: getTemplatePreviewUrl(6),
  },
  {
    id: 7,
    name: "Fresh Graduate",
    description: "Perfect for entry-level positions and new graduates",
    style: "modern",
    downloads: 11200,
    atsCompatible: true,
    isFeatured: false,
    format: ["PDF", "DOCX", "Google Docs"],
    colorScheme: "from-blue-500 to-indigo-600",
    fileSize: "134 KB",
    dateAdded: "2024-02-10",
    tags: ["Entry-Level", "Graduate", "Internship"],
  },
  {
    id: 8,
    name: "Corporate Classic",
    description: "Traditional layout trusted by Fortune 500 companies",
    style: "traditional",
    downloads: 5600,
    atsCompatible: true,
    isFeatured: false,
    format: ["PDF", "DOCX"],
    colorScheme: "from-slate-600 to-slate-800",
    fileSize: "167 KB",
    dateAdded: "2024-02-15",
    tags: ["Corporate", "Traditional", "Formal"],
  },
  {
    id: 9,
    name: "Startup Ready",
    description: "Dynamic design for fast-paced startup environments",
    style: "modern",
    downloads: 8300,
    atsCompatible: true,
    isFeatured: true,
    format: ["PDF", "DOCX", "Google Docs"],
    colorScheme: "from-blue-500 to-indigo-600",
    fileSize: "203 KB",
    dateAdded: "2024-02-20",
    tags: ["Startup", "Tech", "Dynamic"],
  },
  {
    id: 10,
    name: "Academic Scholar",
    description: "Designed for academic positions and research roles",
    style: "traditional",
    downloads: 4200,
    atsCompatible: true,
    isFeatured: false,
    format: ["PDF", "LaTeX", "DOCX"],
    colorScheme: "from-slate-600 to-slate-800",
    fileSize: "145 KB",
    dateAdded: "2024-02-25",
    tags: ["Academic", "Research", "Education"],
  },
  {
    id: 11,
    name: "Portfolio Showcase",
    description: "Visual-first design for showcasing creative work",
    style: "creative",
    downloads: 5100,
    atsCompatible: false,
    isFeatured: false,
    format: ["PDF", "AI", "Figma"],
    colorScheme: "from-pink-500 to-purple-600",
    fileSize: "678 KB",
    dateAdded: "2024-03-01",
    tags: ["Portfolio", "Visual", "Creative"],
  },
  {
    id: 12,
    name: "Clean Slate",
    description: "Ultra-minimal design that lets your achievements shine",
    style: "minimal",
    downloads: 7600,
    atsCompatible: true,
    isFeatured: false,
    format: ["PDF", "DOCX", "Google Docs"],
    colorScheme: "from-gray-400 to-gray-600",
    fileSize: "72 KB",
    dateAdded: "2024-03-05",
    tags: ["Minimal", "Clean", "Simple"],
  },
];

export const styleConfig = {
  modern: {
    label: "Modern",
    gradient: "from-blue-500 to-indigo-600",
    icon: "Sparkles",
  },
  traditional: {
    label: "Traditional",
    gradient: "from-slate-600 to-slate-800",
    icon: "Award",
  },
  creative: {
    label: "Creative",
    gradient: "from-pink-500 to-purple-600",
    icon: "Palette",
  },
  minimal: {
    label: "Minimal",
    gradient: "from-gray-400 to-gray-600",
    icon: "Minus",
  },
  "two-column": {
    label: "Two-Column",
    gradient: "from-teal-500 to-cyan-600",
    icon: "Columns",
  },
};

export const getTemplateStats = () => {
  const total = resumeTemplates.length;
  const atsCount = resumeTemplates.filter((t) => t.atsCompatible).length;
  const totalDownloads = resumeTemplates.reduce((sum, t) => sum + t.downloads, 0);
  const atsPercentage = Math.round((atsCount / total) * 100);

  return {
    total,
    atsCount,
    totalDownloads,
    atsPercentage,
    rating: 4.8,
  };
};
