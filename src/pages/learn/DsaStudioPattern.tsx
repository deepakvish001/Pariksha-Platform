import { useMemo } from "react";
import { useLocation, useNavigate, useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import PatternDetailContent from "@/components/dsa/PatternDetailContent";
import { useDsaPatternStorage } from "@/hooks/useDsaPatternStorage";
import { COMMON_PATTERNS } from "@/data/dsaCommonPatternsData";

export default function DsaStudioPattern() {
  const { patternId = "" } = useParams();
  const navigate = useNavigate();
  const { bookmarks, done, toggleBookmark, toggleDone } = useDsaPatternStorage();

  const found = useMemo(() => {
    for (const cat of COMMON_PATTERNS) {
      const p = cat.patterns.find((x) => x.id === patternId);
      if (p) return { category: cat, pattern: p };
    }
    return null;
  }, [patternId]);

  const location = useLocation() as { state?: { from?: string } };
  const goBack = () => {
    // If we got here from the patterns list in this session, go back so the
    // browser restores the previous DsaStudio state (active tab + scroll).
    if (location.state?.from === "patterns" && window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate("/learn/dsa-studio?tab=patterns");
  };

  if (!found) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center space-y-4">
        <Helmet>
          <title>Pattern not found · DSA Studio</title>
        </Helmet>
        <h1 className="text-xl font-semibold">Pattern not found</h1>
        <p className="text-sm text-muted-foreground">
          We couldn't find a pattern with id <span className="font-mono">{patternId}</span>.
        </p>
        <Button asChild variant="outline" className="gap-1.5">
          <Link to="/learn/dsa-studio?tab=patterns">
            <ArrowLeft className="h-4 w-4" /> Back to Common Patterns
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="-mx-4 md:-mx-6">
      <Helmet>
        <title>{found.pattern.title} · Common Patterns · DSA Studio</title>
        <meta name="description" content={found.pattern.subtitle || found.pattern.description.slice(0, 150)} />
      </Helmet>
      <PatternDetailContent
        pattern={found.pattern}
        category={found.category}
        bookmarks={bookmarks}
        done={done}
        onToggleBookmark={toggleBookmark}
        onToggleDone={toggleDone}
        onBack={goBack}
      />
    </div>
  );
}
