import { motion } from "framer-motion";
import { Search, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ResourcesEmptyStateProps {
  searchQuery: string;
  onClearSearch: () => void;
}

const ResourcesEmptyState = ({ searchQuery, onClearSearch }: ResourcesEmptyStateProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 px-4"
    >
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl" />
        <div className="relative h-20 w-20 rounded-2xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center">
          {searchQuery ? (
            <Search className="h-8 w-8 text-white/30" />
          ) : (
            <BookOpen className="h-8 w-8 text-white/30" />
          )}
        </div>
      </div>

      <h3 className="text-xl font-semibold text-white mb-2">
        {searchQuery ? "No resources found" : "No resources available"}
      </h3>
      <p className="text-white/50 text-center max-w-md mb-6">
        {searchQuery
          ? `We couldn't find any resources matching "${searchQuery}". Try a different search term.`
          : "There are no resources to display at the moment."}
      </p>

      {searchQuery && (
        <Button
          variant="outline"
          onClick={onClearSearch}
          className="border-white/10 bg-white/[0.02] hover:bg-white/[0.05] text-white"
        >
          Clear Search
        </Button>
      )}
    </motion.div>
  );
};

export default ResourcesEmptyState;
