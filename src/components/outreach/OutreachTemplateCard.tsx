import { motion } from "framer-motion";
import { Copy, Star, Linkedin, Mail, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { OutreachTemplate, getCategoryLabel, getSuccessRateColor } from "@/data/coldOutreachData";

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
  const previewText = template.body
    .replace(/\{\{[^}]+\}\}/g, '[...]')
    .slice(0, 120) + '...';

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(template.body);
      onCopy();
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card 
        className="group hover:shadow-lg hover:border-primary/30 transition-all cursor-pointer h-full flex flex-col"
        onClick={onSelect}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              {template.platform === 'linkedin' ? (
                <Linkedin className="h-4 w-4 text-blue-600" />
              ) : template.platform === 'email' ? (
                <Mail className="h-4 w-4 text-muted-foreground" />
              ) : (
                <div className="flex gap-1">
                  <Linkedin className="h-4 w-4 text-blue-600" />
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
              <Badge variant="secondary" className="text-xs">
                {getCategoryLabel(template.category)}
              </Badge>
            </div>
            <Badge 
              variant="outline" 
              className={`text-xs capitalize ${getSuccessRateColor(template.successRate)}`}
            >
              {template.successRate}
            </Badge>
          </div>
          <CardTitle className="text-lg leading-tight mt-2 group-hover:text-primary transition-colors">
            {template.title}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col justify-between pt-0">
          <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
            {previewText}
          </p>
          
          <div className="space-y-3">
            {/* Tags */}
            <div className="flex flex-wrap gap-1">
              {template.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs px-2 py-0">
                  {tag}
                </Badge>
              ))}
              {template.isPopular && (
                <Badge className="text-xs px-2 py-0 bg-orange-500/10 text-orange-600 border-orange-500/20">
                  🔥 Popular
                </Badge>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1 gap-1"
                onClick={handleCopy}
              >
                <Copy className="h-3.5 w-3.5" />
                Copy
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={isFavorite ? "text-yellow-500" : "text-muted-foreground"}
                onClick={handleFavorite}
              >
                <Star className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground group-hover:text-primary"
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
