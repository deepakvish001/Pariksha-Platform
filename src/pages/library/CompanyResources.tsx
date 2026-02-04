import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { Building2, Search, Star, Briefcase, ChevronLeft, ChevronRight } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { companies, categoryColors, type Company } from "@/data/companyResourcesData";

type TabType = "all" | "product" | "service" | "startup" | "hiring" | "favorites";

const ITEMS_PER_PAGE = 10;

const tabs: { id: TabType; label: string }[] = [
  { id: "all", label: "All Companies" },
  { id: "product", label: "Product Based" },
  { id: "service", label: "Service Based" },
  { id: "startup", label: "Startup" },
  { id: "hiring", label: "Hiring" },
  { id: "favorites", label: "Favorites" },
];

const CompanyResources = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    const saved = localStorage.getItem("company-favorites");
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  // Save favorites to localStorage
  useEffect(() => {
    localStorage.setItem("company-favorites", JSON.stringify([...favorites]));
  }, [favorites]);

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(id)) {
        newFavorites.delete(id);
      } else {
        newFavorites.add(id);
      }
      return newFavorites;
    });
  };

  // Filter companies based on search and active tab
  const filteredCompanies = useMemo(() => {
    let result = companies;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (company) =>
          company.name.toLowerCase().includes(query) ||
          company.description.toLowerCase().includes(query) ||
          company.category.toLowerCase().includes(query)
      );
    }

    // Tab filter
    switch (activeTab) {
      case "product":
        result = result.filter((c) => c.type.includes("product"));
        break;
      case "service":
        result = result.filter((c) => c.type.includes("service"));
        break;
      case "startup":
        result = result.filter((c) => c.type.includes("startup"));
        break;
      case "hiring":
        result = result.filter((c) => c.isHiring);
        break;
      case "favorites":
        result = result.filter((c) => favorites.has(c.id));
        break;
    }

    return result;
  }, [searchQuery, activeTab, favorites]);

  // Pagination
  const totalPages = Math.ceil(filteredCompanies.length / ITEMS_PER_PAGE);
  const paginatedCompanies = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredCompanies.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredCompanies, currentPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeTab]);

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages: (number | "ellipsis")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, "ellipsis", totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1, "ellipsis", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, "ellipsis", currentPage - 1, currentPage, currentPage + 1, "ellipsis", totalPages);
      }
    }
    return pages;
  };

  const getCategoryStyle = (category: string) => {
    return categoryColors[category] || "text-muted-foreground border-border bg-muted/50";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="flex h-16 items-center gap-4 px-6">
          <SidebarTrigger />
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-orange flex items-center justify-center">
              <Building2 className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Companies and Startups</h1>
              <p className="text-sm text-muted-foreground">
                Select a company to explore all available resources and preparation materials
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="p-6 md:p-8 space-y-6 max-w-6xl mx-auto">
        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative"
        >
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search companies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-12 text-base bg-muted/30 border-border/50 focus:bg-background"
          />
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap gap-1 border-b border-border/50 pb-2"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-4 py-2 text-sm font-medium transition-all rounded-lg",
                activeTab === tab.id
                  ? "text-foreground bg-muted"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              {tab.label}
              {tab.id === "favorites" && favorites.size > 0 && (
                <span className="ml-1.5 text-xs text-primary">({favorites.size})</span>
              )}
            </button>
          ))}
        </motion.div>

        {/* Results count */}
        <div className="text-sm text-muted-foreground">
          Showing {paginatedCompanies.length} of {filteredCompanies.length} companies
        </div>

        {/* Company List */}
        <div className="space-y-0 divide-y divide-border/50">
          {paginatedCompanies.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-16 text-center"
            >
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No companies found matching your criteria</p>
            </motion.div>
          ) : (
            paginatedCompanies.map((company, index) => {
              const globalIndex = (currentPage - 1) * ITEMS_PER_PAGE + index + 1;
              return (
                <CompanyRow
                  key={company.id}
                  company={company}
                  index={globalIndex}
                  isFavorite={favorites.has(company.id)}
                  onToggleFavorite={() => toggleFavorite(company.id)}
                  delay={index * 0.05}
                />
              );
            })
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center gap-1 pt-6"
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Previous</span>
            </Button>

            <div className="flex items-center gap-1 mx-2">
              {getPageNumbers().map((page, idx) =>
                page === "ellipsis" ? (
                  <span key={`ellipsis-${idx}`} className="px-2 text-muted-foreground">
                    ...
                  </span>
                ) : (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className={cn(
                      "w-9 h-9",
                      currentPage === page && "pointer-events-none"
                    )}
                  >
                    {page}
                  </Button>
                )
              )}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="gap-1"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </motion.div>
        )}
      </main>
    </div>
  );
};

interface CompanyRowProps {
  company: Company;
  index: number;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  delay: number;
}

const CompanyRow = ({ company, index, isFavorite, onToggleFavorite, delay }: CompanyRowProps) => {
  const getCategoryStyle = (category: string) => {
    return categoryColors[category] || "text-muted-foreground border-border bg-muted/50";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="group flex items-start gap-4 py-5 px-2 hover:bg-muted/30 transition-colors cursor-pointer rounded-lg -mx-2"
    >
      {/* Index */}
      <div className="w-8 text-sm font-medium text-muted-foreground pt-1 text-right shrink-0">
        {index}
      </div>

      {/* Favorite Star */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite();
        }}
        className="shrink-0 pt-1"
      >
        <Star
          className={cn(
            "h-5 w-5 transition-all",
            isFavorite
              ? "fill-yellow-400 text-yellow-400"
              : "text-muted-foreground/40 hover:text-yellow-400"
          )}
        />
      </button>

      {/* Company Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
            {company.name}
          </h3>
          {company.isHiring && (
            <Badge variant="outline" className="text-xs text-green-600 border-green-500/40 bg-green-500/10">
              <Briefcase className="h-3 w-3 mr-1" />
              Hiring
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
          {company.description}
        </p>
      </div>

      {/* Category Badge */}
      <Badge
        variant="outline"
        className={cn(
          "shrink-0 text-xs font-medium hidden sm:flex",
          getCategoryStyle(company.category)
        )}
      >
        {company.category}
      </Badge>
    </motion.div>
  );
};

export default CompanyResources;
