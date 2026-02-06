import { motion } from "framer-motion";
import { FileSpreadsheet, Search } from "lucide-react";

interface SheetsEmptyStateProps {
  hasSearchQuery: boolean;
}

const SheetsEmptyState = ({ hasSearchQuery }: SheetsEmptyStateProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-16 px-4"
    >
      <div className="relative mb-6">
        <div className="h-20 w-20 rounded-2xl bg-muted/50 flex items-center justify-center">
          {hasSearchQuery ? (
            <Search className="h-10 w-10 text-muted-foreground/50" />
          ) : (
            <FileSpreadsheet className="h-10 w-10 text-muted-foreground/50" />
          )}
        </div>
        <motion.div
          className="absolute -inset-2 rounded-3xl bg-primary/5"
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.2, 0.5] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
      </div>
      
      <h3 className="text-lg font-semibold mb-2">
        {hasSearchQuery ? "No matching sheets found" : "No sheets available"}
      </h3>
      <p className="text-muted-foreground text-center max-w-sm">
        {hasSearchQuery 
          ? "Try adjusting your search or filter criteria to find what you're looking for."
          : "Practice sheets will appear here once they're added to your collection."
        }
      </p>
    </motion.div>
  );
};

export default SheetsEmptyState;
