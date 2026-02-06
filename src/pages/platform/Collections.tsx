import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AnimatePresence } from "framer-motion";
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
import { GripVertical, Loader2 } from "lucide-react";
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
import { useAuth } from "@/contexts/AuthContext";
import { useAllFolders, FolderWithSource, FolderItem } from "@/hooks/useAllFolders";
import { interviewQuestions } from "@/data/interviewQuestionsData";
import { getQuestionsForCompany, massRecruitmentCategories } from "@/data/massRecruitmentData";
import SortableQuestionItem from "@/components/library/SortableQuestionItem";
import ShareFolderDialog from "@/components/library/ShareFolderDialog";
import AstraBackground from "@/components/astra/AstraBackground";
import CollectionsHeader from "@/components/collections/CollectionsHeader";
import CollectionFolderCard from "@/components/collections/CollectionFolderCard";
import CollectionsBulkActions from "@/components/collections/CollectionsBulkActions";
import CollectionsEmptyState from "@/components/collections/CollectionsEmptyState";

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
    updateFolderColor,
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

  // Calculate total items across all folders
  const totalItems = useMemo(() => {
    return folders.reduce((acc, folder) => acc + (folder.itemCount || 0), 0);
  }, [folders]);

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
    if (!selectedFolder || selectedItems.size === 0 || targetFolderId === selectedFolder.id)
      return;

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
      <div className="min-h-screen relative">
        <AstraBackground />
        <div className="relative z-10">
          <CollectionsHeader
            totalFolders={0}
            totalItems={0}
            searchQuery=""
            onSearchChange={() => {}}
            selectedFolder={null}
            onBackToFolders={() => {}}
            isSelectionMode={false}
            onToggleSelectionMode={() => {}}
            onOpenShareDialog={() => {}}
          />
          <main className="p-6">
            <CollectionsEmptyState type="not-logged-in" />
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <AstraBackground />

      <div className="relative z-10 flex flex-col min-h-screen">
        <CollectionsHeader
          totalFolders={folders.length}
          totalItems={totalItems}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedFolder={selectedFolder}
          onBackToFolders={handleBackToFolders}
          isSelectionMode={isSelectionMode}
          onToggleSelectionMode={toggleSelectionMode}
          onOpenShareDialog={() => selectedFolder && openShareDialog(selectedFolder)}
        />

        {/* Bulk Action Bar */}
        {selectedFolder && (
          <CollectionsBulkActions
            isVisible={isSelectionMode}
            selectedCount={selectedItems.size}
            onSelectAll={selectAll}
            onDeselectAll={deselectAll}
            onDelete={() => setDeleteDialogOpen(true)}
            onMoveToFolder={handleMoveToFolder}
            folders={folders}
            currentFolderId={selectedFolder.id}
            moveMenuOpen={moveMenuOpen}
            setMoveMenuOpen={setMoveMenuOpen}
          />
        )}

        <main className="flex-1 p-6 space-y-6">
          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {/* Folder List View */}
          {!isLoading && !selectedFolder && (
            <>
              {filteredFolders.length === 0 ? (
                searchQuery ? (
                  <CollectionsEmptyState
                    type="no-search"
                    searchQuery={searchQuery}
                    onClearSearch={() => setSearchQuery("")}
                  />
                ) : (
                  <CollectionsEmptyState type="no-folders" />
                )
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  <AnimatePresence mode="popLayout">
                    {filteredFolders.map((folder, index) => (
                      <CollectionFolderCard
                        key={folder.id}
                        folder={folder}
                        index={index}
                        onSelect={setSelectedFolder}
                        onShare={openShareDialog}
                        onColorChange={async (folderId, color) => {
                          const success = await updateFolderColor(folderId, color);
                          if (success) {
                            toast.success("Folder color updated");
                          }
                        }}
                      />
                    ))}
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
                <CollectionsEmptyState type="no-items" onBackToFolders={handleBackToFolders} />
              ) : (
                <div className="space-y-4">
                  {/* Info Banner */}
                  {!isSelectionMode && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]"
                    >
                      <GripVertical className="h-4 w-4 text-white/40" />
                      <span className="text-sm text-white/40">
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
                      <div className="p-3 rounded-xl border border-primary/50 bg-black/80 backdrop-blur-xl shadow-lg">
                        <p className="text-sm font-medium text-white truncate">
                          {activeItem.question.text}
                        </p>
                      </div>
                    )}
                  </DragOverlay>
                </div>
              )}
            </DndContext>
          )}
        </main>
      </div>

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
        <AlertDialogContent className="bg-black/90 border-white/10 backdrop-blur-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              Delete {selectedItems.size} question(s)?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              This will remove the selected questions from this folder. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/10 bg-white/[0.02] hover:bg-white/[0.05] text-white">
              Cancel
            </AlertDialogCancel>
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
