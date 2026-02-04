import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  FolderOpen,
  Search,
  Loader2,
  ChevronRight,
  ArrowLeft,
  Folder,
  GripVertical,
  MessageSquare,
  Users,
  Share2,
  Trash2,
  FolderInput,
  X,
  CheckSquare,
  Square,
} from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useAllFolders, FolderWithSource, FolderItem } from "@/hooks/useAllFolders";
import { interviewQuestions } from "@/data/interviewQuestionsData";
import { getQuestionsForCompany, massRecruitmentCategories } from "@/data/massRecruitmentData";
import SortableQuestionItem from "@/components/library/SortableQuestionItem";
import ShareFolderDialog from "@/components/library/ShareFolderDialog";

// Color mapping for folder colors
const folderColorClasses: Record<string, string> = {
  primary: "bg-primary/20 text-primary",
  emerald: "bg-emerald-500/20 text-emerald-500",
  amber: "bg-amber-500/20 text-amber-500",
  red: "bg-red-500/20 text-red-500",
  purple: "bg-purple-500/20 text-purple-500",
  pink: "bg-pink-500/20 text-pink-500",
};

// Source icon mapping
const sourceIcons: Record<string, React.ElementType> = {
  interview: MessageSquare,
};

const getSourceIcon = (source: string): React.ElementType => {
  if (source.startsWith("mass-recruitment-")) {
    return Users;
  }
  return sourceIcons[source] || Folder;
};

// Helper to get question details from various sources
const getQuestionDetails = (questionId: number, source: string) => {
  if (source === "interview") {
    const question = interviewQuestions.find((q) => q.id === questionId);
    return question
      ? { id: question.id, text: question.text, difficulty: question.difficulty }
      : null;
  }
  
  if (source.startsWith("mass-recruitment-")) {
    const companyId = source.replace("mass-recruitment-", "");
    for (const cat of massRecruitmentCategories) {
      const questions = getQuestionsForCompany(companyId, cat.id);
      const question = questions.find((q) => q.id === questionId);
      if (question) {
        return { id: question.id, text: question.text, difficulty: question.difficulty };
      }
    }
  }
  
  return null;
};

// Get source label for display
const getSourceLabel = (source: string): string => {
  if (source === "interview") return "Interview Questions";
  if (source.startsWith("mass-recruitment-")) {
    const companyId = source.replace("mass-recruitment-", "");
    return `Mass Recruitment - ${companyId.charAt(0).toUpperCase() + companyId.slice(1).replace(/-/g, " ")}`;
  }
  return source;
};

const Collections = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    folders,
    folderItems,
    isLoading,
    updateItemOrder,
    moveItemsToFolder,
    deleteItems,
    refreshFolders,
  } = useAllFolders();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFolder, setSelectedFolder] = useState<FolderWithSource | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareDialogFolder, setShareDialogFolder] = useState<FolderWithSource | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [moveMenuOpen, setMoveMenuOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Filter folders by search
  const filteredFolders = useMemo(() => {
    if (!searchQuery.trim()) return folders;
    const query = searchQuery.toLowerCase();
    return folders.filter(
      (f) =>
        f.name.toLowerCase().includes(query) ||
        f.sourceLabel.toLowerCase().includes(query)
    );
  }, [folders, searchQuery]);

  // Get items for selected folder with question details
  const selectedFolderItems = useMemo(() => {
    if (!selectedFolder) return [];
    const items = folderItems[selectedFolder.id] || [];
    return items
      .map((item) => {
        const details = getQuestionDetails(item.question_id, item.question_source);
        if (!details) return null;
        return {
          ...item,
          question: {
            ...details,
            source: item.question_source,
            sourceLabel: getSourceLabel(item.question_source),
          },
        };
      })
      .filter(Boolean) as (FolderItem & {
        question: { id: number; text: string; difficulty?: string; source: string; sourceLabel: string };
      })[];
  }, [selectedFolder, folderItems]);

  // Get the active item for drag overlay
  const activeItem = useMemo(() => {
    if (!activeId) return null;
    return selectedFolderItems.find((item) => item.id === activeId);
  }, [activeId, selectedFolderItems]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);
      
      if (!over || active.id === over.id || !selectedFolder) return;

      const oldIndex = selectedFolderItems.findIndex((item) => item.id === active.id);
      const newIndex = selectedFolderItems.findIndex((item) => item.id === over.id);

      if (oldIndex === -1 || newIndex === -1) return;

      const reorderedItems = arrayMove(selectedFolderItems, oldIndex, newIndex);
      
      const updates = reorderedItems.map((item, index) => ({
        id: item.id,
        sort_order: index,
      }));

      await updateItemOrder(selectedFolder.id, updates);
    },
    [selectedFolder, selectedFolderItems, updateItemOrder]
  );

  const handleBackToFolders = () => {
    setSelectedFolder(null);
    setSelectedItems(new Set());
    setIsSelectionMode(false);
  };

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    if (isSelectionMode) {
      setSelectedItems(new Set());
    }
  };

  const toggleItemSelection = (itemId: string, selected: boolean) => {
    setSelectedItems((prev) => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(itemId);
      } else {
        newSet.delete(itemId);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    setSelectedItems(new Set(selectedFolderItems.map((item) => item.id)));
  };

  const deselectAll = () => {
    setSelectedItems(new Set());
  };

  const handleDeleteSelected = async () => {
    if (!selectedFolder || selectedItems.size === 0) return;
    
    const success = await deleteItems(Array.from(selectedItems), selectedFolder.id);
    if (success) {
      toast.success(`Deleted ${selectedItems.size} question(s)`);
      setSelectedItems(new Set());
      setDeleteDialogOpen(false);
    } else {
      toast.error("Failed to delete questions");
    }
  };

  const handleMoveToFolder = async (targetFolderId: string) => {
    if (!selectedFolder || selectedItems.size === 0 || targetFolderId === selectedFolder.id) return;
    
    const success = await moveItemsToFolder(
      Array.from(selectedItems),
      selectedFolder.id,
      targetFolderId
    );
    
    if (success) {
      const targetFolder = folders.find((f) => f.id === targetFolderId);
      toast.success(`Moved ${selectedItems.size} question(s) to ${targetFolder?.name || "folder"}`);
      setSelectedItems(new Set());
      setMoveMenuOpen(false);
    } else {
      toast.error("Failed to move questions");
    }
  };

  const openShareDialog = (folder: FolderWithSource) => {
    setShareDialogFolder(folder);
    setShareDialogOpen(true);
  };

  // Login prompt
  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-md">
          <div className="flex h-16 items-center gap-4 px-4 md:px-6">
            <SidebarTrigger />
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-orange flex items-center justify-center">
                <FolderOpen className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold">My Collections</h1>
                <p className="text-sm text-muted-foreground">Organize your learning</p>
              </div>
            </div>
          </div>
        </header>
        <main className="p-6 md:p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <FolderOpen className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Sign in to view your collections</h2>
            <p className="text-muted-foreground mb-4 max-w-md">
              Create folders to organize your interview questions, DSA problems, and more.
            </p>
            <Button onClick={() => navigate("/login")}>Sign In</Button>
          </motion.div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="flex h-16 items-center gap-4 px-4 md:px-6">
          <SidebarTrigger />
          {selectedFolder ? (
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBackToFolders}
                className="flex-shrink-0"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div
                className={cn(
                  "h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0",
                  folderColorClasses[selectedFolder.color] || "bg-primary/20"
                )}
              >
                <Folder className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg md:text-xl font-bold truncate">{selectedFolder.name}</h1>
                <p className="text-xs md:text-sm text-muted-foreground truncate">
                  {selectedFolder.itemCount} questions
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openShareDialog(selectedFolder)}
                  className="gap-2"
                >
                  <Share2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Share</span>
                </Button>
                <Button
                  variant={isSelectionMode ? "secondary" : "outline"}
                  size="sm"
                  onClick={toggleSelectionMode}
                  className="gap-2"
                >
                  {isSelectionMode ? (
                    <>
                      <X className="h-4 w-4" />
                      <span className="hidden sm:inline">Cancel</span>
                    </>
                  ) : (
                    <>
                      <CheckSquare className="h-4 w-4" />
                      <span className="hidden sm:inline">Select</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-orange flex items-center justify-center">
                <FolderOpen className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold">My Collections</h1>
                <p className="text-sm text-muted-foreground">
                  All your folders in one place
                </p>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Bulk Action Bar */}
      <AnimatePresence>
        {isSelectionMode && selectedItems.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="sticky top-16 z-30 border-b border-border bg-primary/5 backdrop-blur-md"
          >
            <div className="flex items-center justify-between gap-4 p-3 px-4 md:px-6">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">
                  {selectedItems.size} selected
                </span>
                <Button variant="ghost" size="sm" onClick={selectAll}>
                  Select all
                </Button>
                <Button variant="ghost" size="sm" onClick={deselectAll}>
                  Deselect
                </Button>
              </div>
              <div className="flex items-center gap-2">
                {/* Move to folder dropdown */}
                <DropdownMenu open={moveMenuOpen} onOpenChange={setMoveMenuOpen}>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <FolderInput className="h-4 w-4" />
                      <span className="hidden sm:inline">Move to</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    {folders
                      .filter((f) => f.id !== selectedFolder?.id)
                      .map((folder) => (
                        <DropdownMenuItem
                          key={folder.id}
                          onClick={() => handleMoveToFolder(folder.id)}
                          className="gap-2"
                        >
                          <div
                            className={cn(
                              "h-6 w-6 rounded flex items-center justify-center flex-shrink-0",
                              folderColorClasses[folder.color] || "bg-primary/20"
                            )}
                          >
                            <Folder className="h-3.5 w-3.5" />
                          </div>
                          <span className="truncate">{folder.name}</span>
                        </DropdownMenuItem>
                      ))}
                    {folders.filter((f) => f.id !== selectedFolder?.id).length === 0 && (
                      <DropdownMenuItem disabled>No other folders</DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Delete button */}
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setDeleteDialogOpen(true)}
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Delete</span>
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6">
        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Folder List View */}
        {!isLoading && !selectedFolder && (
          <>
            {/* Search */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search collections..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </motion.div>

            {/* Folder Grid */}
            {filteredFolders.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-16 text-center"
              >
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Folder className="h-8 w-8 text-muted-foreground" />
                </div>
                <h2 className="text-lg font-semibold mb-2">No collections yet</h2>
                <p className="text-muted-foreground mb-4 max-w-md">
                  Create folders in Interview Questions or Mass Recruitment pages to organize your study materials.
                </p>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => navigate("/library/interview")}>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Interview Questions
                  </Button>
                  <Button variant="outline" onClick={() => navigate("/library/mass-recruitment")}>
                    <Users className="h-4 w-4 mr-2" />
                    Mass Recruitment
                  </Button>
                </div>
              </motion.div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <AnimatePresence mode="popLayout">
                  {filteredFolders.map((folder, index) => {
                    const Icon = getSourceIcon(folder.source);
                    return (
                      <motion.div
                        key={folder.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card
                          className="hover:shadow-lg transition-all cursor-pointer group hover:border-primary/40"
                          onClick={() => setSelectedFolder(folder)}
                        >
                          <CardHeader className="pb-2">
                            <div className="flex items-start gap-3">
                              <div
                                className={cn(
                                  "h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0",
                                  folderColorClasses[folder.color] || "bg-primary/20"
                                )}
                              >
                                <Folder className="h-5 w-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <CardTitle className="text-lg truncate group-hover:text-primary transition-colors">
                                  {folder.name}
                                </CardTitle>
                                <CardDescription className="truncate">
                                  {folder.description || `${folder.itemCount} questions`}
                                </CardDescription>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openShareDialog(folder);
                                  }}
                                >
                                  <Share2 className="h-4 w-4" />
                                </Button>
                                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <div className="flex items-center gap-2">
                              <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground truncate">
                                {folder.sourceLabel}
                              </span>
                              <Badge variant="secondary" className="text-xs ml-auto">
                                {folder.itemCount} items
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </>
        )}

        {/* Folder Detail View with Sortable Items */}
        {!isLoading && selectedFolder && (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            {selectedFolderItems.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-16 text-center"
              >
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Folder className="h-8 w-8 text-muted-foreground" />
                </div>
                <h2 className="text-lg font-semibold mb-2">This folder is empty</h2>
                <p className="text-muted-foreground mb-4 max-w-md">
                  Add questions to this folder from the question pages using the folder icon.
                </p>
                <Button variant="outline" onClick={handleBackToFolders}>
                  Back to Collections
                </Button>
              </motion.div>
            ) : (
              <div className="space-y-4">
                {/* Info Banner */}
                {!isSelectionMode && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border"
                  >
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Drag questions to reorder them in your collection
                    </span>
                  </motion.div>
                )}

                {/* Sortable Question List */}
                <SortableContext
                  items={selectedFolderItems.map((item) => item.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {selectedFolderItems.map((item) => (
                      <SortableQuestionItem
                        key={item.id}
                        id={item.id}
                        question={item.question}
                        showCheckbox={isSelectionMode}
                        isSelected={selectedItems.has(item.id)}
                        onSelect={(selected) => toggleItemSelection(item.id, selected)}
                      />
                    ))}
                  </div>
                </SortableContext>

                {/* Drag Overlay */}
                <DragOverlay>
                  {activeItem && (
                    <div className="p-3 rounded-lg border border-primary/50 bg-card shadow-lg">
                      <p className="text-sm font-medium truncate">{activeItem.question.text}</p>
                    </div>
                  )}
                </DragOverlay>
              </div>
            )}
          </DndContext>
        )}
      </main>

      {/* Share Dialog */}
      {shareDialogFolder && (
        <ShareFolderDialog
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
          folderId={shareDialogFolder.id}
          folderName={shareDialogFolder.name}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedItems.size} question(s)?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the selected questions from this folder. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSelected}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Collections;
