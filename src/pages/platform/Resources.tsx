import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import AstraBackground from "@/components/astra/AstraBackground";
import ResourcesHeader from "@/components/resources/ResourcesHeader";
import ResourcesFilterBar from "@/components/resources/ResourcesFilterBar";
import ResourceCard from "@/components/resources/ResourceCard";
import ResourcesEmptyState from "@/components/resources/ResourcesEmptyState";
import { learningResources, resourceCategories, ResourceType } from "@/data/learningResourcesData";
import FromTheBlogRail from "@/components/blog/FromTheBlogRail";

const Resources = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeType, setActiveType] = useState<ResourceType>("All");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    const saved = localStorage.getItem("resource-favorites");
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  const handleToggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      localStorage.setItem("resource-favorites", JSON.stringify([...next]));
      return next;
    });
  };

  const filteredResources = useMemo(() => {
    return learningResources.filter((resource) => {
      // Type filter
      if (activeType !== "All" && resource.type !== activeType) {
        return false;
      }

      // Favorites filter
      if (showFavoritesOnly && !favorites.has(resource.id)) {
        return false;
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          resource.title.toLowerCase().includes(query) ||
          resource.description.toLowerCase().includes(query) ||
          resource.category.toLowerCase().includes(query) ||
          resource.tags.some((tag) => tag.toLowerCase().includes(query))
        );
      }

      return true;
    });
  }, [searchQuery, activeType, showFavoritesOnly, favorites]);

  const featuredResources = useMemo(() => {
    return learningResources.filter((r) => r.isFeatured).slice(0, 3);
  }, []);

  const uniqueCategories = resourceCategories.filter((c) => c !== "All");

  return (
    <div className="min-h-screen relative">
      {/* Reuse the Astra background */}
      <AstraBackground />

      {/* Content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        <ResourcesHeader
          totalResources={learningResources.length}
          totalCategories={uniqueCategories.length}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        <ResourcesFilterBar
          activeType={activeType}
          onTypeChange={setActiveType}
          showFavoritesOnly={showFavoritesOnly}
          onToggleFavorites={() => setShowFavoritesOnly(!showFavoritesOnly)}
          favoritesCount={favorites.size}
        />

        <main className="flex-1 p-6">
          {/* From the Blog rail */}
          {!searchQuery && activeType === "All" && !showFavoritesOnly && (
            <FromTheBlogRail />
          )}

          {/* Featured section */}
          {!searchQuery && activeType === "All" && !showFavoritesOnly && (
            <section className="mb-8">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 mb-4"
              >
                <div className="h-1 w-1 rounded-full bg-primary" />
                <h2 className="text-lg font-semibold text-white">Featured Resources</h2>
              </motion.div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {featuredResources.map((resource, index) => (
                  <ResourceCard
                    key={resource.id}
                    resource={resource}
                    index={index}
                    isFavorite={favorites.has(resource.id)}
                    onToggleFavorite={handleToggleFavorite}
                  />
                ))}
              </div>
            </section>
          )}

          {/* All resources */}
          <section>
            {(searchQuery || activeType !== "All" || showFavoritesOnly) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 mb-4"
              >
                <div className="h-1 w-1 rounded-full bg-primary" />
                <h2 className="text-lg font-semibold text-white">
                  {showFavoritesOnly
                    ? "Favorite Resources"
                    : activeType !== "All"
                    ? `${activeType}s`
                    : "Search Results"}
                </h2>
                <span className="text-sm text-white/40">({filteredResources.length})</span>
              </motion.div>
            )}

            {!searchQuery && activeType === "All" && !showFavoritesOnly && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 mb-4"
              >
                <div className="h-1 w-1 rounded-full bg-white/40" />
                <h2 className="text-lg font-semibold text-white">All Resources</h2>
              </motion.div>
            )}

            {filteredResources.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredResources
                  .filter((r) => !r.isFeatured || searchQuery || activeType !== "All" || showFavoritesOnly)
                  .map((resource, index) => (
                    <ResourceCard
                      key={resource.id}
                      resource={resource}
                      index={index}
                      isFavorite={favorites.has(resource.id)}
                      onToggleFavorite={handleToggleFavorite}
                    />
                  ))}
              </div>
            ) : (
              <ResourcesEmptyState
                searchQuery={searchQuery}
                onClearSearch={() => {
                  setSearchQuery("");
                  setActiveType("All");
                  setShowFavoritesOnly(false);
                }}
              />
            )}
          </section>
        </main>
      </div>
    </div>
  );
};

export default Resources;
