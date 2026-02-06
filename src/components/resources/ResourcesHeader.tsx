import { motion } from "framer-motion";
import { BookOpen, Sparkles, Search } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface ResourcesHeaderProps {
  totalResources: number;
  totalCategories: number;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const ResourcesHeader = ({
  totalResources,
  totalCategories,
  searchQuery,
  onSearchChange,
}: ResourcesHeaderProps) => {
  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.03] bg-black/40 backdrop-blur-3xl">
      <div className="flex flex-col gap-4 p-6">
        {/* Top row */}
        <div className="flex items-center gap-4">
          <SidebarTrigger className="text-white/60 hover:text-white hover:bg-white/[0.05]" />
          
          <div className="flex items-center gap-4 flex-1">
            {/* Icon with glow */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-primary/30 rounded-2xl blur-xl" />
              <div className="relative h-12 w-12 rounded-2xl bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center shadow-lg shadow-primary/20">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
            </motion.div>

            {/* Title */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-transparent">
                  Resources
                </h1>
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Badge className="bg-primary/20 text-primary border-primary/30 gap-1 text-xs">
                    <Sparkles className="h-3 w-3" />
                    Curated
                  </Badge>
                </motion.div>
              </div>
              <p className="text-sm text-white/40">
                Premium learning materials for your tech career
              </p>
            </div>

            {/* Stats badges */}
            <div className="hidden md:flex items-center gap-3">
              <div className="px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.05]">
                <span className="text-sm text-white/60">
                  <span className="font-semibold text-white">{totalResources}</span> Resources
                </span>
              </div>
              <div className="px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.05]">
                <span className="text-sm text-white/60">
                  <span className="font-semibold text-white">{totalCategories}</span> Categories
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Search bar */}
        <div className="relative max-w-xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <Input
            placeholder="Search resources..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-11 h-11 bg-white/[0.03] border-white/[0.05] text-white placeholder:text-white/30 focus:border-primary/50 focus:ring-primary/20 rounded-xl"
          />
        </div>
      </div>
    </header>
  );
};

export default ResourcesHeader;
