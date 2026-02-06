import { motion } from "framer-motion";
import { Folder, FolderOpen, MessageSquare, Users, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface CollectionsEmptyStateProps {
  type: "no-folders" | "no-items" | "no-search" | "not-logged-in";
  searchQuery?: string;
  onClearSearch?: () => void;
  onBackToFolders?: () => void;
}

const CollectionsEmptyState = ({
  type,
  searchQuery,
  onClearSearch,
  onBackToFolders,
}: CollectionsEmptyStateProps) => {
  const navigate = useNavigate();

  const content = {
    "no-folders": {
      icon: Folder,
      title: "No collections yet",
      description:
        "Create folders in Interview Questions or Mass Recruitment pages to organize your study materials.",
      actions: (
        <div className="flex flex-wrap gap-3 justify-center">
          <Button
            variant="outline"
            onClick={() => navigate("/library/interview")}
            className="gap-2 border-white/10 bg-white/[0.02] hover:bg-white/[0.05] text-white"
          >
            <MessageSquare className="h-4 w-4" />
            Interview Questions
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/library/mass-recruitment")}
            className="gap-2 border-white/10 bg-white/[0.02] hover:bg-white/[0.05] text-white"
          >
            <Users className="h-4 w-4" />
            Mass Recruitment
          </Button>
        </div>
      ),
    },
    "no-items": {
      icon: FolderOpen,
      title: "This folder is empty",
      description:
        "Add questions to this folder from the question pages using the folder icon.",
      actions: onBackToFolders && (
        <Button
          variant="outline"
          onClick={onBackToFolders}
          className="border-white/10 bg-white/[0.02] hover:bg-white/[0.05] text-white"
        >
          Back to Collections
        </Button>
      ),
    },
    "no-search": {
      icon: Search,
      title: "No collections found",
      description: searchQuery
        ? `We couldn't find any collections matching "${searchQuery}".`
        : "No collections match your search.",
      actions: onClearSearch && (
        <Button
          variant="outline"
          onClick={onClearSearch}
          className="border-white/10 bg-white/[0.02] hover:bg-white/[0.05] text-white"
        >
          Clear Search
        </Button>
      ),
    },
    "not-logged-in": {
      icon: FolderOpen,
      title: "Sign in to view your collections",
      description:
        "Create folders to organize your interview questions, DSA problems, and more.",
      actions: (
        <Button
          onClick={() => navigate("/login")}
          className="bg-primary hover:bg-primary/90"
        >
          Sign In
        </Button>
      ),
    },
  };

  const { icon: Icon, title, description, actions } = content[type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 px-4"
    >
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl" />
        <div className="relative h-20 w-20 rounded-2xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center">
          <Icon className="h-8 w-8 text-white/30" />
        </div>
      </div>

      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-white/50 text-center max-w-md mb-6">{description}</p>

      {actions}
    </motion.div>
  );
};

export default CollectionsEmptyState;
