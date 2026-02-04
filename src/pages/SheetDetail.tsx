import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  CheckSquare, 
  Square, 
  Youtube, 
  ExternalLink, 
  Pencil, 
  Star,
  ChevronDown
} from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

// Types
interface Topic {
  id: string;
  title: string;
  completed: boolean;
  resourceType: "youtube" | "article" | "link" | null;
  resourceUrl?: string;
  articleUrl?: string;
  hasNote: boolean;
  isRevision: boolean;
}

interface SubSection {
  id: string;
  title: string;
  topics: Topic[];
}

interface Section {
  id: string;
  title: string;
  subSections: SubSection[];
}

interface SheetData {
  id: string;
  title: string;
  totalProblems: number;
  completed: number;
  easy: number;
  medium: number;
  hard: number;
  sections: Section[];
}

// Mock data for Machine Learning sheet
const mockSheetData: Record<string, SheetData> = {
  "machine-learning": {
    id: "machine-learning",
    title: "Machine Learning",
    totalProblems: 184,
    completed: 0,
    easy: 13,
    medium: 143,
    hard: 28,
    sections: [
      {
        id: "prerequisites",
        title: "Prerequisites & Foundation",
        subSections: [
          {
            id: "linear-algebra",
            title: "Linear Algebra",
            topics: [
              { id: "1", title: "Vector", completed: false, resourceType: "youtube", resourceUrl: "#", hasNote: false, isRevision: false },
              { id: "2", title: "Linear combinations, span, and basis vectors", completed: false, resourceType: "youtube", resourceUrl: "#", hasNote: false, isRevision: false },
              { id: "3", title: "Linear transformations and matrices", completed: false, resourceType: "youtube", resourceUrl: "#", hasNote: false, isRevision: false },
              { id: "4", title: "Matrix multiplication as composition", completed: false, resourceType: "youtube", resourceUrl: "#", hasNote: false, isRevision: false },
              { id: "5", title: "Three-dimensional linear transformations", completed: false, resourceType: "youtube", resourceUrl: "#", hasNote: false, isRevision: false },
              { id: "6", title: "Determinant", completed: false, resourceType: "youtube", resourceUrl: "#", hasNote: false, isRevision: false },
              { id: "7", title: "Inverse matrices, column space and null space", completed: false, resourceType: "youtube", resourceUrl: "#", hasNote: false, isRevision: false },
            ],
          },
          {
            id: "calculus",
            title: "Calculus",
            topics: [
              { id: "8", title: "Derivatives and gradients", completed: false, resourceType: "youtube", resourceUrl: "#", hasNote: false, isRevision: false },
              { id: "9", title: "Chain rule and backpropagation", completed: false, resourceType: "youtube", resourceUrl: "#", hasNote: false, isRevision: false },
            ],
          },
          {
            id: "probability",
            title: "Probability and Statistics",
            topics: [
              { id: "10", title: "Probability distributions", completed: false, resourceType: "youtube", resourceUrl: "#", hasNote: false, isRevision: false },
              { id: "11", title: "Bayes theorem", completed: false, resourceType: "youtube", resourceUrl: "#", hasNote: false, isRevision: false },
            ],
          },
          {
            id: "optimization",
            title: "Optimization Theory",
            topics: [
              { id: "12", title: "Introduction to Optimization", completed: false, resourceType: "link", resourceUrl: "https://medium.com", hasNote: false, isRevision: false },
              { id: "13", title: "Difference between Derivative, Partial derivative and Gradient", completed: false, resourceType: "link", resourceUrl: "https://medium.com", hasNote: false, isRevision: false },
              { id: "14", title: "What is Gradient Descent?", completed: false, resourceType: null, articleUrl: "#", hasNote: false, isRevision: false },
            ],
          },
        ],
      },
      {
        id: "ml-fundamentals",
        title: "Machine Learning Fundamentals",
        subSections: [
          {
            id: "intro-ml",
            title: "Introduction to ML",
            topics: [
              { id: "15", title: "What is Machine Learning?", completed: false, resourceType: "youtube", resourceUrl: "#", hasNote: false, isRevision: false },
              { id: "16", title: "Types of ML: Supervised vs Unsupervised", completed: false, resourceType: "link", resourceUrl: "#", articleUrl: "#", hasNote: false, isRevision: false },
              { id: "17", title: "Train-Test Split & Cross-Validation", completed: false, resourceType: "youtube", resourceUrl: "#", articleUrl: "#", hasNote: false, isRevision: false },
              { id: "18", title: "Bias-Variance Tradeoff", completed: false, resourceType: "link", resourceUrl: "#", articleUrl: "#", hasNote: false, isRevision: false },
            ],
          },
          {
            id: "data-understanding",
            title: "Data Understanding",
            topics: [
              { id: "19", title: "Exploratory Data Analysis", completed: false, resourceType: "youtube", resourceUrl: "#", hasNote: false, isRevision: false },
              { id: "20", title: "Feature Engineering", completed: false, resourceType: "youtube", resourceUrl: "#", hasNote: false, isRevision: false },
            ],
          },
          {
            id: "data-handling",
            title: "Data Handling",
            topics: [
              { id: "21", title: "Handling Missing Values", completed: false, resourceType: "youtube", resourceUrl: "#", hasNote: false, isRevision: false },
              { id: "22", title: "Handling Outliers", completed: false, resourceType: "youtube", resourceUrl: "#", hasNote: false, isRevision: false },
            ],
          },
          {
            id: "data-visualization",
            title: "Data Visualization",
            topics: [
              { id: "23", title: "Matplotlib Basics", completed: false, resourceType: "youtube", resourceUrl: "#", hasNote: false, isRevision: false },
              { id: "24", title: "Seaborn for Statistical Plots", completed: false, resourceType: "youtube", resourceUrl: "#", hasNote: false, isRevision: false },
            ],
          },
        ],
      },
      {
        id: "python-basics",
        title: "Python - Basics",
        subSections: [
          {
            id: "python-intro",
            title: "Python Fundamentals",
            topics: [
              { id: "25", title: "Variables and Data Types", completed: false, resourceType: "youtube", resourceUrl: "#", hasNote: false, isRevision: false },
              { id: "26", title: "Control Flow", completed: false, resourceType: "youtube", resourceUrl: "#", hasNote: false, isRevision: false },
            ],
          },
        ],
      },
    ],
  },
  "strivers-sde-sheet": {
    id: "strivers-sde-sheet",
    title: "Striver's SDE Sheet",
    totalProblems: 191,
    completed: 0,
    easy: 25,
    medium: 120,
    hard: 46,
    sections: [
      {
        id: "arrays",
        title: "Arrays",
        subSections: [
          {
            id: "arrays-1",
            title: "Day 1 - Arrays Part I",
            topics: [
              { id: "1", title: "Set Matrix Zeroes", completed: false, resourceType: "youtube", resourceUrl: "#", hasNote: false, isRevision: false },
              { id: "2", title: "Pascal's Triangle", completed: false, resourceType: "youtube", resourceUrl: "#", hasNote: false, isRevision: false },
              { id: "3", title: "Next Permutation", completed: false, resourceType: "youtube", resourceUrl: "#", hasNote: false, isRevision: false },
              { id: "4", title: "Kadane's Algorithm", completed: false, resourceType: "youtube", resourceUrl: "#", hasNote: false, isRevision: false },
              { id: "5", title: "Sort an array of 0's 1's 2's", completed: false, resourceType: "youtube", resourceUrl: "#", hasNote: false, isRevision: false },
              { id: "6", title: "Stock Buy and Sell", completed: false, resourceType: "youtube", resourceUrl: "#", hasNote: false, isRevision: false },
            ],
          },
        ],
      },
    ],
  },
};

// Topic item component
function TopicRow({ topic, onToggle }: { topic: Topic; onToggle: (id: string) => void }) {
  return (
    <div className="flex items-center py-3 px-4 hover:bg-muted/50 transition-colors border-b border-border/30 last:border-b-0">
      <button
        onClick={() => onToggle(topic.id)}
        className="mr-4 text-muted-foreground hover:text-foreground transition-colors"
      >
        {topic.completed ? (
          <CheckSquare className="h-5 w-5 text-primary" />
        ) : (
          <Square className="h-5 w-5" />
        )}
      </button>
      <span className={cn("flex-1 text-sm", topic.completed && "line-through text-muted-foreground")}>
        {topic.title}
      </span>
      <div className="flex items-center gap-6">
        {/* Resource */}
        <div className="w-20 flex justify-center">
          {topic.resourceType === "youtube" && (
            <a href={topic.resourceUrl} target="_blank" rel="noopener noreferrer">
              <Youtube className="h-5 w-5 text-red-500 hover:text-red-400 transition-colors" />
            </a>
          )}
          {topic.resourceType === "link" && (
            <a 
              href={topic.resourceUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline"
            >
              medium.com
            </a>
          )}
        </div>
        {/* Article */}
        <div className="w-16 flex justify-center">
          {topic.articleUrl ? (
            <a href={topic.articleUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 text-primary hover:text-primary/80 transition-colors" />
            </a>
          ) : (
            <span className="text-xs text-muted-foreground">N/A</span>
          )}
        </div>
        {/* Note */}
        <div className="w-12 flex justify-center">
          <button className="text-muted-foreground hover:text-foreground transition-colors">
            <Pencil className="h-4 w-4" />
          </button>
        </div>
        {/* Revision */}
        <div className="w-12 flex justify-center">
          <button className={cn(
            "transition-colors",
            topic.isRevision ? "text-yellow-500" : "text-muted-foreground hover:text-yellow-500"
          )}>
            <Star className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// SubSection component
function SubSectionCard({ subSection, onToggleTopic }: { subSection: SubSection; onToggleTopic: (id: string) => void }) {
  const [isOpen, setIsOpen] = useState(true);
  const completed = subSection.topics.filter(t => t.completed).length;
  const total = subSection.topics.length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="bg-muted/30 rounded-lg overflow-hidden">
      <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-muted/50 transition-colors">
        <span className="font-medium text-sm">{subSection.title}</span>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{progress}%</span>
          <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="px-4 pb-2">
          <div className="bg-background rounded-lg border border-border/50 overflow-hidden">
            {/* Header */}
            <div className="flex items-center py-2 px-4 border-b border-border/50 text-xs text-muted-foreground font-medium">
              <span className="w-9">Status</span>
              <span className="flex-1 ml-2">Title</span>
              <div className="flex items-center gap-6">
                <span className="w-20 text-center">Resource</span>
                <span className="w-16 text-center">Article</span>
                <span className="w-12 text-center">Note</span>
                <span className="w-12 text-center">Revision</span>
              </div>
            </div>
            {/* Topics */}
            {subSection.topics.map(topic => (
              <TopicRow key={topic.id} topic={topic} onToggle={onToggleTopic} />
            ))}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// Section component
function SectionCard({ section, onToggleTopic }: { section: Section; onToggleTopic: (id: string) => void }) {
  const [isOpen, setIsOpen] = useState(true);
  const allTopics = section.subSections.flatMap(s => s.topics);
  const completed = allTopics.filter(t => t.completed).length;
  const total = allTopics.length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <Card className="overflow-hidden">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger className="flex items-center justify-between w-full p-6 hover:bg-muted/30 transition-colors">
          <h3 className="font-semibold text-lg">{section.title}</h3>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-muted-foreground" />
              <span className="text-sm text-muted-foreground">{progress}%</span>
            </div>
            <ChevronDown className={cn("h-5 w-5 transition-transform", isOpen && "rotate-180")} />
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-3">
            {section.subSections.map(subSection => (
              <SubSectionCard 
                key={subSection.id} 
                subSection={subSection} 
                onToggleTopic={onToggleTopic}
              />
            ))}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

export default function SheetDetail() {
  const { sheetId } = useParams<{ sheetId: string }>();
  const navigate = useNavigate();
  const [sheetData, setSheetData] = useState<SheetData | null>(
    sheetId ? mockSheetData[sheetId] || mockSheetData["machine-learning"] : mockSheetData["machine-learning"]
  );

  if (!sheetData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Sheet not found</p>
      </div>
    );
  }

  const handleToggleTopic = (topicId: string) => {
    setSheetData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        sections: prev.sections.map(section => ({
          ...section,
          subSections: section.subSections.map(subSection => ({
            ...subSection,
            topics: subSection.topics.map(topic =>
              topic.id === topicId ? { ...topic, completed: !topic.completed } : topic
            ),
          })),
        })),
      };
    });
  };

  // Calculate progress
  const allTopics = sheetData.sections.flatMap(s => s.subSections.flatMap(ss => ss.topics));
  const completedCount = allTopics.filter(t => t.completed).length;
  const progressPercent = allTopics.length > 0 ? (completedCount / allTopics.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="flex h-16 items-center gap-4 px-6">
          <SidebarTrigger />
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">{sheetData.title}</h1>
        </div>
      </header>

      {/* Content */}
      <main className="p-6 md:p-8 space-y-6 max-w-6xl mx-auto">
        {/* Overall Progress Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-lg">Overall Progress</h2>
                <span className="text-sm text-muted-foreground">
                  {completedCount} / {sheetData.totalProblems} completed
                </span>
              </div>
              <Progress value={progressPercent} className="h-2 mb-6" />
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-yellow-500">{sheetData.easy}</p>
                  <p className="text-sm text-muted-foreground">Easy</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-orange-500">{sheetData.medium}</p>
                  <p className="text-sm text-muted-foreground">Medium</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-500">{sheetData.hard}</p>
                  <p className="text-sm text-muted-foreground">Hard</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Sections */}
        <div className="space-y-4">
          {sheetData.sections.map((section, index) => (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <SectionCard section={section} onToggleTopic={handleToggleTopic} />
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
}
