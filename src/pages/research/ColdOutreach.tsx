import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { SidebarTrigger } from "@/components/ui/sidebar";
import OutreachHeroSection from "@/components/outreach/OutreachHeroSection";
import OutreachFilterBar from "@/components/outreach/OutreachFilterBar";
import OutreachTemplateCard from "@/components/outreach/OutreachTemplateCard";
import OutreachTemplateDetail from "@/components/outreach/OutreachTemplateDetail";
import { useOutreachFavorites } from "@/hooks/useOutreachFavorites";
import { useOutreachCopy } from "@/hooks/useOutreachCopy";
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
  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [platform, setPlatform] = useState<OutreachPlatform | "all">("all");
  const [category, setCategory] = useState<OutreachCategory | "all">("all");
  const [successRate, setSuccessRate] = useState<SuccessRate | "all">("all");
  const [showPopular, setShowPopular] = useState(false);
  const [showShort, setShowShort] = useState(false);

  // Selected template for detail view
  const [selectedTemplate, setSelectedTemplate] = useState<OutreachTemplate | null>(null);

  // Hooks
  const { isFavorite, toggleFavorite } = useOutreachFavorites();
  const { trackCopy } = useOutreachCopy();

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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="flex h-16 items-center gap-4 px-6">
          <SidebarTrigger />
          <div>
            <h1 className="text-lg font-semibold">Cold DMs / Emails</h1>
            <p className="text-sm text-muted-foreground">Outreach templates that work</p>
          </div>
        </div>
      </header>

      <main className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
        {/* Hero Section */}
        <OutreachHeroSection />

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
    </div>
  );
};

export default ColdOutreach;
