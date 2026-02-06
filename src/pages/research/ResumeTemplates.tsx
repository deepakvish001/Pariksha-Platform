import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Star, FileText, Heart } from "lucide-react";
import ResumeHeroSection from "@/components/resume/ResumeHeroSection";
import ResumeFilterBar, {
  StyleFilter,
  SortOption,
  QuickFilter,
} from "@/components/resume/ResumeFilterBar";
import ResumeTemplateCard from "@/components/resume/ResumeTemplateCard";
import ResumeStatsDashboard from "@/components/resume/ResumeStatsDashboard";
import RoadmapSectionDivider from "@/components/roadmap/RoadmapSectionDivider";
import { resumeTemplates, getTemplateStats } from "@/data/resumeTemplatesData";
import { useResumeFavorites, useResumeDownloads } from "@/hooks/useResumeActions";
import { useAuth } from "@/contexts/AuthContext";

const ResumeTemplates = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [styleFilter, setStyleFilter] = useState<StyleFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("downloads");
  const [quickFilter, setQuickFilter] = useState<QuickFilter>(null);

  const { favorites, isFavorite, toggleFavorite } = useResumeFavorites();
  const { trackDownload } = useResumeDownloads();

  const stats = useMemo(() => getTemplateStats(), []);

  const filteredTemplates = useMemo(() => {
    let filtered = [...resumeTemplates];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.description.toLowerCase().includes(query) ||
          t.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    // Apply style filter
    if (styleFilter !== "all") {
      filtered = filtered.filter((t) => t.style === styleFilter);
    }

    // Apply quick filters
    if (quickFilter === "ats") {
      filtered = filtered.filter((t) => t.atsCompatible);
    } else if (quickFilter === "popular") {
      filtered = filtered.filter((t) => t.downloads >= 8000);
    } else if (quickFilter === "favorites") {
      const favoriteIds = favorites.map((f) => f.template_id);
      filtered = filtered.filter((t) => favoriteIds.includes(t.id));
    }

    // Apply sorting
    switch (sortBy) {
      case "downloads":
        filtered.sort((a, b) => b.downloads - a.downloads);
        break;
      case "name":
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "date":
        filtered.sort(
          (a, b) =>
            new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime()
        );
        break;
    }

    return filtered;
  }, [searchQuery, styleFilter, sortBy, quickFilter, favorites]);

  const featuredTemplates = useMemo(
    () => filteredTemplates.filter((t) => t.isFeatured),
    [filteredTemplates]
  );

  const regularTemplates = useMemo(
    () => filteredTemplates.filter((t) => !t.isFeatured),
    [filteredTemplates]
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <ResumeHeroSection
        templateCount={stats.total}
        atsCount={stats.atsCount}
        totalDownloads={stats.totalDownloads}
      />

      {/* Main Content */}
      <main className="px-6 pb-12">
        {/* Filter Bar */}
        <ResumeFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          styleFilter={styleFilter}
          onStyleChange={setStyleFilter}
          sortBy={sortBy}
          onSortChange={setSortBy}
          quickFilter={quickFilter}
          onQuickFilterChange={setQuickFilter}
          filteredCount={filteredTemplates.length}
          totalCount={resumeTemplates.length}
          showFavoritesFilter={!!user}
          favoritesCount={favorites.length}
        />

        {/* Stats Dashboard */}
        <div className="max-w-6xl mx-auto mt-8">
          <ResumeStatsDashboard
            templateCount={stats.total}
            totalDownloads={stats.totalDownloads}
            atsPercentage={stats.atsPercentage}
            rating={stats.rating}
          />
        </div>

        {/* Favorites Section - Only show if user has favorites and not filtering by favorites */}
        {user && favorites.length > 0 && quickFilter !== "favorites" && (
          <div className="max-w-6xl mx-auto mt-8">
            <RoadmapSectionDivider
              icon={Heart}
              title="Your Favorites"
              subtitle="Templates you've saved"
              count={favorites.length}
              countLabel="saved"
              gradientFrom="from-red-500"
              gradientTo="to-pink-500"
              delay={0.5}
            />

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mt-6"
            >
              {resumeTemplates
                .filter((t) => isFavorite(t.id))
                .slice(0, 4)
                .map((template, index) => (
                  <ResumeTemplateCard
                    key={template.id}
                    template={template}
                    index={index}
                    isFavorite={true}
                    onToggleFavorite={toggleFavorite}
                    onDownload={trackDownload}
                  />
                ))}
            </motion.div>
          </div>
        )}

        {/* Featured Templates Section */}
        {featuredTemplates.length > 0 && (
          <div className="max-w-6xl mx-auto mt-8">
            <RoadmapSectionDivider
              icon={Star}
              title="Featured Templates"
              subtitle="Editor's picks for maximum impact"
              count={featuredTemplates.length}
              countLabel="templates"
              gradientFrom="from-amber-500"
              gradientTo="to-orange-500"
              delay={0.6}
            />

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mt-6"
            >
              {featuredTemplates.map((template, index) => (
                <ResumeTemplateCard
                  key={template.id}
                  template={template}
                  index={index}
                  isFeatured
                  isFavorite={isFavorite(template.id)}
                  onToggleFavorite={toggleFavorite}
                  onDownload={trackDownload}
                />
              ))}
            </motion.div>
          </div>
        )}

        {/* All Templates Section */}
        <div className="max-w-6xl mx-auto mt-12">
          <RoadmapSectionDivider
            icon={FileText}
            title="All Templates"
            subtitle="Browse our complete collection"
            count={regularTemplates.length}
            countLabel="templates"
            gradientFrom="from-blue-500"
            gradientTo="to-indigo-600"
            delay={0.8}
          />

          {regularTemplates.length > 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mt-6"
            >
              {regularTemplates.map((template, index) => (
                <ResumeTemplateCard
                  key={template.id}
                  template={template}
                  index={index}
                  isFavorite={isFavorite(template.id)}
                  onToggleFavorite={toggleFavorite}
                  onDownload={trackDownload}
                />
              ))}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <div className="h-16 w-16 mx-auto mb-4 rounded-2xl bg-muted/50 flex items-center justify-center">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No templates found</h3>
              <p className="text-muted-foreground">
                Try adjusting your filters or search query
              </p>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ResumeTemplates;
