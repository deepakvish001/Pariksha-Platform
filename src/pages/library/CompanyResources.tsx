import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  Search,
  Star,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { companies, categoryColors, type Company } from "@/data/companyResourcesData";
import CompanyStatsCard from "@/components/library/CompanyStatsCard";

type TabType = "all" | "product" | "service" | "startup" | "hiring" | "favorites";
type SortField = "name" | "category" | "type";
type SortDirection = "asc" | "desc";

const ITEMS_PER_PAGE = 10;

const tabs: { id: TabType; label: string }[] = [
  { id: "all", label: "All Companies" },
  { id: "product", label: "Product Based" },
  { id: "service", label: "Service Based" },
  { id: "startup", label: "Startup" },
  { id: "hiring", label: "Hiring" },
  { id: "favorites", label: "Favorites" },
];

// Get unique categories from companies
const allCategories = [...new Set(companies.map((c) => c.category))].sort();

const CompanyResources = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    const saved = localStorage.getItem("company-favorites");
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  // Save favorites to localStorage
  useEffect(() => {
    localStorage.setItem("company-favorites", JSON.stringify([...favorites]));
  }, [favorites]);

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
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

  // Calculate stats
  const stats = useMemo(() => {
    return {
      total: companies.length,
      product: companies.filter((c) => c.type.includes("product")).length,
      service: companies.filter((c) => c.type.includes("service")).length,
      startup: companies.filter((c) => c.type.includes("startup")).length,
      hiring: companies.filter((c) => c.isHiring).length,
      favorites: favorites.size,
    };
  }, [favorites]);

  // Check if any filters are active
  const hasActiveFilters = searchQuery || categoryFilter !== "all";

  const clearAllFilters = () => {
    setSearchQuery("");
    setCategoryFilter("all");
    setCurrentPage(1);
  };

  // Handle sort toggle
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Filter and sort companies
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

    // Category filter
    if (categoryFilter !== "all") {
      result = result.filter((c) => c.category === categoryFilter);
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

    // Sorting
    result = [...result].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "category":
          comparison = a.category.localeCompare(b.category);
          break;
        case "type":
          comparison = a.type.join(",").localeCompare(b.type.join(","));
          break;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });

    return result;
  }, [searchQuery, activeTab, favorites, categoryFilter, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredCompanies.length / ITEMS_PER_PAGE);
  const paginatedCompanies = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredCompanies.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredCompanies, currentPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeTab, categoryFilter]);

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

  const getTypeLabel = (types: string[]) => {
    return types.map((t) => t.charAt(0).toUpperCase() + t.slice(1)).join(", ");
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4" />;
    return sortDirection === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="flex h-16 items-center gap-4 px-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-orange flex items-center justify-center">
              <Building2 className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Companies and Startups</h1>
              <p className="text-sm text-muted-foreground hidden sm:block">
                Select a company to explore resources and preparation materials
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="p-4 md:p-6 lg:p-8 space-y-6 w-full">
        {/* Stats Card */}
        <CompanyStatsCard
          totalCompanies={stats.total}
          productCount={stats.product}
          serviceCount={stats.service}
          startupCount={stats.startup}
          hiringCount={stats.hiring}
          favoritesCount={stats.favorites}
        />

        {/* Search and Filters Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search companies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-11 text-base bg-muted/30 border-border/50 focus:bg-background"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-48 h-11">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {allCategories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <AnimatePresence>
            {hasActiveFilters && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <Button
                  variant="outline"
                  onClick={clearAllFilters}
                  className="gap-2 h-11 whitespace-nowrap"
                >
                  <X className="h-4 w-4" />
                  Clear Filters
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex flex-wrap gap-1 border-b border-border/50 pb-2"
        >
          {tabs.map((tab) => {
            const count =
              tab.id === "favorites"
                ? favorites.size
                : tab.id === "all"
                ? companies.length
                : tab.id === "hiring"
                ? stats.hiring
                : stats[tab.id as keyof typeof stats];

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "px-4 py-2 text-sm font-medium transition-all rounded-lg flex items-center gap-2 whitespace-nowrap",
                  activeTab === tab.id
                    ? "text-foreground bg-muted"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                {tab.label}
                <Badge
                  variant="secondary"
                  className={cn(
                    "h-5 px-1.5 text-xs",
                    activeTab === tab.id ? "bg-primary/20 text-primary" : ""
                  )}
                >
                  {count}
                </Badge>
              </button>
            );
          })}
        </motion.div>

        {/* Results count */}
        <div className="text-sm text-muted-foreground">
          Showing {paginatedCompanies.length} of {filteredCompanies.length} companies
        </div>

        {/* Company Table */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="border border-border/50 rounded-lg overflow-hidden"
        >
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="w-12 text-center">#</TableHead>
                <TableHead className="w-12"></TableHead>
                <TableHead>
                  <button
                    onClick={() => handleSort("name")}
                    className="flex items-center gap-2 hover:text-foreground transition-colors"
                  >
                    Company Name
                    {getSortIcon("name")}
                  </button>
                </TableHead>
                <TableHead className="hidden md:table-cell">
                  <button
                    onClick={() => handleSort("category")}
                    className="flex items-center gap-2 hover:text-foreground transition-colors"
                  >
                    Category
                    {getSortIcon("category")}
                  </button>
                </TableHead>
                <TableHead className="hidden sm:table-cell">
                  <button
                    onClick={() => handleSort("type")}
                    className="flex items-center gap-2 hover:text-foreground transition-colors"
                  >
                    Type
                    {getSortIcon("type")}
                  </button>
                </TableHead>
                <TableHead className="w-24 text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedCompanies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-40 text-center">
                    <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">No companies found matching your criteria</p>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedCompanies.map((company, index) => {
                  const globalIndex = (currentPage - 1) * ITEMS_PER_PAGE + index + 1;
                  const isFavorite = favorites.has(company.id);

                  return (
                    <TableRow
                      key={company.id}
                      tabIndex={0}
                      onClick={() => navigate(`/library/companies/${company.id}`)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          navigate(`/library/companies/${company.id}`);
                        }
                      }}
                      className="cursor-pointer group"
                    >
                      <TableCell className="text-center text-muted-foreground font-medium">
                        {globalIndex}
                      </TableCell>
                      <TableCell className="text-center">
                        <button
                          onClick={(e) => toggleFavorite(company.id, e)}
                          className="p-1 rounded-md hover:bg-muted transition-colors"
                        >
                          <Star
                            className={cn(
                              "h-5 w-5 transition-all",
                              isFavorite
                                ? "fill-amber-400 text-amber-400"
                                : "text-muted-foreground/40 hover:text-amber-400"
                            )}
                          />
                        </button>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-lg bg-gradient-orange flex items-center justify-center shrink-0">
                            <Building2 className="h-4 w-4 text-primary-foreground" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-foreground group-hover:text-primary transition-colors truncate">
                              {company.name}
                            </p>
                            <p className="text-xs text-muted-foreground line-clamp-1 hidden lg:block">
                              {company.description}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="outline" className={cn("text-xs", getCategoryStyle(company.category))}>
                          {company.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <span className="text-sm text-muted-foreground">{getTypeLabel(company.type)}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        {company.isHiring && (
                          <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-500/40 bg-emerald-500/10">
                            <Briefcase className="h-3 w-3 mr-1" />
                            Hiring
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </motion.div>

        {/* Pagination */}
        {totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center gap-1 pt-4"
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              aria-label="Previous page"
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
                    className={cn("w-9 h-9", currentPage === page && "pointer-events-none")}
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
              aria-label="Next page"
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

export default CompanyResources;
