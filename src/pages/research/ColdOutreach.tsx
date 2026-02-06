import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Plus, Send, Star, BarChart3, Layers } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import OutreachHeroSection from "@/components/outreach/OutreachHeroSection";
import OutreachFilterBar from "@/components/outreach/OutreachFilterBar";
import OutreachTemplateCard from "@/components/outreach/OutreachTemplateCard";
import OutreachTemplateDetail from "@/components/outreach/OutreachTemplateDetail";
import OutreachSavedSection from "@/components/outreach/OutreachSavedSection";
import OutreachCustomTemplateForm from "@/components/outreach/OutreachCustomTemplateForm";
import OutreachUsageAnalytics from "@/components/outreach/OutreachUsageAnalytics";
import { useOutreachFavorites } from "@/hooks/useOutreachFavorites";
import { useOutreachCopy } from "@/hooks/useOutreachCopy";
import { useOutreachCustomTemplates, CustomTemplate } from "@/hooks/useOutreachCustomTemplates";
import { useAuth } from "@/contexts/AuthContext";
import {
  outreachTemplates,
  OutreachTemplate,
  OutreachCategory,
  OutreachPlatform,
  SuccessRate,
  searchTemplates,
  getShortTemplates,
} from "@/data/coldOutreachData";

const ColdOutreach = () => {
  const { user } = useAuth();
  
  // Tabs state
  const [activeTab, setActiveTab] = useState("all");

  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [platform, setPlatform] = useState<OutreachPlatform | "all">("all");
  const [category, setCategory] = useState<OutreachCategory | "all">("all");
  const [successRate, setSuccessRate] = useState<SuccessRate | "all">("all");
  const [showPopular, setShowPopular] = useState(false);
  const [showShort, setShowShort] = useState(false);

  // Selected template for detail view
  const [selectedTemplate, setSelectedTemplate] = useState<OutreachTemplate | null>(null);

  // Custom template form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<CustomTemplate | null>(null);

  // Hooks
  const { favorites, isFavorite, toggleFavorite } = useOutreachFavorites();
  const { trackCopy } = useOutreachCopy();
  const { templates: customTemplates, createTemplate, updateTemplate, deleteTemplate } = useOutreachCustomTemplates();

  // Filter templates
  const filteredTemplates = useMemo(() => {
    let results = outreachTemplates;

    // Search
    if (searchQuery) {
      results = searchTemplates(searchQuery);
    }

    // Platform
    if (platform !== "all") {
      results = results.filter(
        (t) => t.platform === platform || t.platform === "both"
      );
    }

    // Category
    if (category !== "all") {
      results = results.filter((t) => t.category === category);
    }

    // Success rate
    if (successRate !== "all") {
      results = results.filter((t) => t.successRate === successRate);
    }

    // Popular
    if (showPopular) {
      results = results.filter((t) => t.isPopular);
    }

    // Short templates
    if (showShort) {
      const shortIds = new Set(getShortTemplates(350).map((t) => t.id));
      results = results.filter((t) => shortIds.has(t.id));
    }

    return results;
  }, [searchQuery, platform, category, successRate, showPopular, showShort]);

  const savedCount = favorites.length + customTemplates.length;

  const handleEditCustomTemplate = (template: CustomTemplate) => {
    setEditingTemplate(template);
  };

  const handleDeleteCustomTemplate = async (id: string) => {
    if (confirm("Are you sure you want to delete this template?")) {
      await deleteTemplate(id);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="flex h-16 items-center justify-between gap-4 px-6">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center">
                <Send className="h-4 w-4 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-semibold">Cold DMs / Emails</h1>
                <p className="text-xs text-muted-foreground">Outreach templates that work</p>
              </div>
            </div>
          </div>
          {user && (
            <Button onClick={() => setShowCreateForm(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Create Template</span>
            </Button>
          )}
        </div>
      </header>

      <main className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
        {/* Hero Section */}
        <OutreachHeroSection />

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="all" className="gap-2">
              <Layers className="h-4 w-4" />
              <span className="hidden sm:inline">All Templates</span>
              <span className="sm:hidden">All</span>
            </TabsTrigger>
            <TabsTrigger value="saved" className="gap-2">
              <Star className="h-4 w-4" />
              <span className="hidden sm:inline">Saved</span>
              <span className="sm:hidden">Saved</span>
              {savedCount > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {savedCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Analytics</span>
              <span className="sm:hidden">Stats</span>
            </TabsTrigger>
          </TabsList>

          {/* All Templates Tab */}
          <TabsContent value="all" className="mt-6 space-y-6">
            {/* Filter Bar */}
            <OutreachFilterBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              platform={platform}
              onPlatformChange={setPlatform}
              category={category}
              onCategoryChange={setCategory}
              successRate={successRate}
              onSuccessRateChange={setSuccessRate}
              showPopular={showPopular}
              onShowPopularChange={setShowPopular}
              showShort={showShort}
              onShowShortChange={setShowShort}
            />

            {/* Results count */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {filteredTemplates.length} of {outreachTemplates.length} templates
              </p>
            </div>

            {/* Template Grid */}
            {filteredTemplates.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredTemplates.map((template, index) => (
                  <OutreachTemplateCard
                    key={template.id}
                    template={template}
                    index={index}
                    isFavorite={isFavorite(template.id)}
                    onToggleFavorite={() => toggleFavorite(template.id)}
                    onSelect={() => setSelectedTemplate(template)}
                    onCopy={() => trackCopy(template.id)}
                  />
                ))}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <p className="text-muted-foreground text-lg mb-2">No templates found</p>
                <p className="text-sm text-muted-foreground">
                  Try adjusting your filters or search query
                </p>
              </motion.div>
            )}
          </TabsContent>

          {/* Saved Templates Tab */}
          <TabsContent value="saved" className="mt-6">
            <OutreachSavedSection
              favorites={favorites}
              customTemplates={customTemplates}
              onSelectTemplate={setSelectedTemplate}
              onEditCustomTemplate={handleEditCustomTemplate}
              onDeleteCustomTemplate={handleDeleteCustomTemplate}
              onCopy={trackCopy}
            />
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="mt-6">
            <OutreachUsageAnalytics />
          </TabsContent>
        </Tabs>
      </main>

      {/* Template Detail Sheet */}
      <OutreachTemplateDetail
        template={selectedTemplate}
        isOpen={!!selectedTemplate}
        onClose={() => setSelectedTemplate(null)}
        isFavorite={selectedTemplate ? isFavorite(selectedTemplate.id) : false}
        onToggleFavorite={() => selectedTemplate && toggleFavorite(selectedTemplate.id)}
        onCopy={() => selectedTemplate && trackCopy(selectedTemplate.id)}
      />

      {/* Create Template Form */}
      <OutreachCustomTemplateForm
        isOpen={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        onSubmit={createTemplate}
      />

      {/* Edit Template Form */}
      {editingTemplate && (
        <OutreachCustomTemplateForm
          isOpen={!!editingTemplate}
          onClose={() => setEditingTemplate(null)}
          onSubmit={async (input) => {
            const success = await updateTemplate(editingTemplate.id, input);
            if (success) {
              setEditingTemplate(null);
            }
            return success;
          }}
          initialData={{
            title: editingTemplate.title,
            category: editingTemplate.category,
            platform: editingTemplate.platform,
            subject: editingTemplate.subject,
            body: editingTemplate.body,
            tags: editingTemplate.tags,
          }}
          isEditing
        />
      )}
    </div>
  );
};

export default ColdOutreach;
