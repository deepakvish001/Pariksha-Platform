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

  const path = `/learn/dsa-studio/pattern/${found.pattern.id}`;
  const origin =
    typeof window !== "undefined" && window.location?.origin
      ? window.location.origin
      : "https://exact-web-sight.lovable.app";
  const canonical = `${origin}${path}`;
  const pageTitle = `${found.pattern.title} · Common Patterns · DSA Studio`;
  const description = (
    found.pattern.subtitle ||
    found.pattern.description ||
    "DSA pattern reference with complexity, when-to-use guidance, and curated practice problems."
  ).slice(0, 200);
  const ogImage = `${origin}/og-image.png`;

  return (
    <div className="-mx-4 md:-mx-6">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonical} />

        {/* Open Graph */}
        <meta property="og:type" content="article" />
        <meta property="og:site_name" content="Parikshaa" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={canonical} />
        <meta property="og:image" content={ogImage} />
        <meta property="article:section" content={found.category.title} />
        {found.pattern.tags.slice(0, 6).map((t) => (
          <meta key={t} property="article:tag" content={t} />
        ))}

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={ogImage} />

        {/* Structured data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "TechArticle",
            headline: found.pattern.title,
            description,
            url: canonical,
            articleSection: found.category.title,
            keywords: found.pattern.tags.join(", "),
            image: ogImage,
          })}
        </script>
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
