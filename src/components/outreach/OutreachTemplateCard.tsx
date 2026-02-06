import { motion } from "framer-motion";
import { Copy, Star, Linkedin, Mail, ChevronRight, Check, Flame } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { OutreachTemplate, getCategoryLabel, getSuccessRateColor } from "@/data/coldOutreachData";
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
        return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400';
      case 'medium':
        return 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400';
      case 'low':
        return 'bg-red-500/10 text-red-600 border-red-500/20 dark:text-red-400';
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
        className="group relative overflow-hidden h-full flex flex-col bg-card/80 backdrop-blur-sm border-border/50 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 cursor-pointer rounded-2xl"
        onClick={onSelect}
      >
        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-violet-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Popular badge ribbon */}
        {template.isPopular && (
          <div className="absolute -right-8 top-4 rotate-45 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-medium px-8 py-1 shadow-lg">
            <Flame className="h-3 w-3 inline mr-1" />
            Popular
          </div>
        )}
        
        <CardHeader className="relative pb-3 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Platform icon with background */}
              <div className={`flex items-center justify-center h-8 w-8 rounded-lg ${
                template.platform === 'linkedin' 
                  ? 'bg-blue-500/10' 
                  : template.platform === 'email' 
                    ? 'bg-muted' 
                    : 'bg-gradient-to-br from-blue-500/10 to-muted'
              }`}>
                {template.platform === 'linkedin' ? (
                  <Linkedin className="h-4 w-4 text-blue-600" />
                ) : template.platform === 'email' ? (
                  <Mail className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <div className="flex gap-0.5">
                    <Linkedin className="h-3 w-3 text-blue-600" />
                    <Mail className="h-3 w-3 text-muted-foreground" />
                  </div>
                )}
              </div>
              <Badge variant="secondary" className="text-xs rounded-lg font-medium">
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
                  className="text-xs px-2 py-0.5 rounded-md bg-muted/50 border-border/50 font-normal"
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
                    ? "bg-emerald-500 hover:bg-emerald-600 text-white border-transparent" 
                    : "hover:bg-primary hover:text-primary-foreground hover:border-primary"
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
                className={`h-9 w-9 rounded-xl transition-all ${
                  isFavorite 
                    ? "text-yellow-500 bg-yellow-500/10 hover:bg-yellow-500/20" 
                    : "text-muted-foreground hover:text-yellow-500 hover:bg-yellow-500/10"
                }`}
                onClick={handleFavorite}
              >
                <Star className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-xl text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 transition-all"
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
