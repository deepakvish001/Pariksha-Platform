import { motion } from "framer-motion";
import { Copy, Star, Linkedin, Mail, ChevronRight, Check, Flame } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { OutreachTemplate, getCategoryLabel } from "@/data/coldOutreachData";
import { useState } from "react";

interface OutreachTemplateCardProps {
  template: OutreachTemplate;
  index: number;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onSelect: () => void;
  onCopy: () => void;
}

const OutreachTemplateCard = ({
  template,
  index,
  isFavorite,
  onToggleFavorite,
  onSelect,
  onCopy,
}: OutreachTemplateCardProps) => {
  const [copied, setCopied] = useState(false);
  
  const previewText = template.body
    .replace(/\{\{[^}]+\}\}/g, '[...]')
    .slice(0, 120) + '...';

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(template.body);
      onCopy();
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Copied!",
        description: "Template copied to clipboard. Don't forget to personalize it!",
      });
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite();
  };

  const getSuccessRateBadgeStyle = (rate: string) => {
    switch (rate) {
      case 'high':
        return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30';
      case 'medium':
        return 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30';
      case 'low':
        return 'bg-red-500/10 text-red-600 border-red-500/20 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/30';
      default:
        return '';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, type: "spring", stiffness: 200 }}
      whileHover={{ y: -4 }}
      className="h-full"
    >
      <Card 
        className="group relative overflow-hidden h-full flex flex-col bg-card/80 dark:bg-card/40 backdrop-blur-sm border-border/50 dark:border-primary/15 hover:border-primary/40 dark:hover:border-primary/40 hover:shadow-xl dark:hover:shadow-2xl hover:shadow-primary/5 dark:hover:shadow-primary/20 transition-all duration-300 cursor-pointer rounded-2xl"
        onClick={onSelect}
      >
        {/* Gradient overlay on hover - enhanced for dark mode */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-violet-500/5 dark:from-primary/10 dark:via-transparent dark:to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Glow effect for dark mode */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 dark:bg-gradient-to-t dark:from-primary/5 dark:to-transparent pointer-events-none" />
        
        {/* Popular badge ribbon */}
        {template.isPopular && (
          <div className="absolute -right-8 top-4 rotate-45 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-medium px-8 py-1 shadow-lg shadow-orange-500/30 dark:shadow-orange-500/50">
            <Flame className="h-3 w-3 inline mr-1" />
            Popular
          </div>
        )}
        
        <CardHeader className="relative pb-3 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Platform icon with background */}
              <div className={`flex items-center justify-center h-8 w-8 rounded-lg transition-colors ${
                template.platform === 'linkedin' 
                  ? 'bg-blue-500/10 dark:bg-blue-500/20 group-hover:bg-blue-500/20 dark:group-hover:bg-blue-500/30' 
                  : template.platform === 'email' 
                    ? 'bg-muted dark:bg-muted/50 group-hover:bg-muted/80' 
                    : 'bg-gradient-to-br from-blue-500/10 to-muted dark:from-blue-500/20 dark:to-muted/30'
              }`}>
                {template.platform === 'linkedin' ? (
                  <Linkedin className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                ) : template.platform === 'email' ? (
                  <Mail className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <div className="flex gap-0.5">
                    <Linkedin className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                    <Mail className="h-3 w-3 text-muted-foreground" />
                  </div>
                )}
              </div>
              <Badge variant="secondary" className="text-xs rounded-lg font-medium dark:bg-secondary/50">
                {getCategoryLabel(template.category)}
              </Badge>
            </div>
            <Badge 
              variant="outline" 
              className={`text-xs capitalize rounded-lg font-medium ${getSuccessRateBadgeStyle(template.successRate)}`}
            >
              {template.successRate}
            </Badge>
          </div>
          
          <h3 className="text-lg font-semibold leading-tight group-hover:text-primary transition-colors line-clamp-2">
            {template.title}
          </h3>
        </CardHeader>
        
        <CardContent className="relative flex-1 flex flex-col justify-between pt-0 gap-4">
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
            {previewText}
          </p>
          
          <div className="space-y-4">
            {/* Tags */}
            <div className="flex flex-wrap gap-1.5">
              {template.tags.slice(0, 3).map((tag) => (
                <Badge 
                  key={tag} 
                  variant="outline" 
                  className="text-xs px-2 py-0.5 rounded-md bg-muted/50 dark:bg-muted/30 border-border/50 dark:border-primary/10 font-normal"
                >
                  {tag}
                </Badge>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button 
                variant={copied ? "default" : "outline"}
                size="sm" 
                className={`flex-1 gap-1.5 rounded-xl h-9 font-medium transition-all ${
                  copied 
                    ? "bg-emerald-500 hover:bg-emerald-600 text-white border-transparent shadow-lg shadow-emerald-500/30 dark:shadow-emerald-500/40" 
                    : "hover:bg-primary hover:text-primary-foreground hover:border-primary hover:shadow-lg dark:hover:shadow-primary/30 dark:border-primary/20"
                }`}
                onClick={handleCopy}
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Copy
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
                className={`h-9 w-9 rounded-xl transition-all ${
                  isFavorite
                    ? "text-yellow-500 bg-yellow-500/10 hover:bg-yellow-500/20 dark:bg-yellow-500/20 dark:hover:bg-yellow-500/30 shadow-lg shadow-yellow-500/20 dark:shadow-yellow-500/30"
                    : "text-muted-foreground hover:text-yellow-500 hover:bg-yellow-500/10 dark:hover:bg-yellow-500/20"
                }`}
                onClick={handleFavorite}
              >
                <Star className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="View template"
                className="h-9 w-9 rounded-xl text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 dark:group-hover:bg-primary/20 transition-all"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default OutreachTemplateCard;
