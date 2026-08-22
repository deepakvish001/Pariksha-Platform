import { motion } from "framer-motion";
import { Star, Trash2, Edit, Copy, Linkedin, Mail } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { outreachTemplates, getCategoryLabel, getSuccessRateColor } from "@/data/coldOutreachData";
import { CustomTemplate } from "@/hooks/useOutreachCustomTemplates";

interface OutreachSavedSectionProps {
  favorites: string[];
  customTemplates: CustomTemplate[];
  onSelectTemplate: (template: any) => void;
  onEditCustomTemplate: (template: CustomTemplate) => void;
  onDeleteCustomTemplate: (id: string) => void;
  onCopy: (templateId: string) => void;
}

const OutreachSavedSection = ({
  favorites,
  customTemplates,
  onSelectTemplate,
  onEditCustomTemplate,
  onDeleteCustomTemplate,
  onCopy,
}: OutreachSavedSectionProps) => {
  const { user } = useAuth();

  const favoriteTemplates = outreachTemplates.filter((t) => favorites.includes(t.id));

  const handleCopy = async (body: string, templateId: string) => {
    try {
      await navigator.clipboard.writeText(body);
      onCopy(templateId);
      toast({
        title: "Copied!",
        description: "Template copied to clipboard.",
      });
    } catch {
      toast({
        title: "Failed to copy",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  if (!user) {
    return (
      <div className="text-center py-16">
        <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Sign in to view saved templates</h3>
        <p className="text-muted-foreground">
          Save your favorite templates and access them anytime
        </p>
      </div>
    );
  }

  if (favoriteTemplates.length === 0 && customTemplates.length === 0) {
    return (
      <div className="text-center py-16">
        <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No saved templates yet</h3>
        <p className="text-muted-foreground">
          Star templates to save them here, or create your own custom templates
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Favorited Templates */}
      {favoriteTemplates.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
            Favorited Templates
            <Badge variant="secondary">{favoriteTemplates.length}</Badge>
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {favoriteTemplates.map((template, index) => (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  className="cursor-pointer hover:shadow-md transition-all"
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelectTemplate(template)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelectTemplate(template);
                    }
                  }}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {template.platform === "linkedin" ? (
                          <Linkedin className="h-4 w-4 text-blue-600" />
                        ) : (
                          <Mail className="h-4 w-4 text-muted-foreground" />
                        )}
                        <Badge variant="secondary" className="text-xs">
                          {getCategoryLabel(template.category)}
                        </Badge>
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-xs ${getSuccessRateColor(template.successRate)}`}
                      >
                        {template.successRate}
                      </Badge>
                    </div>
                    <CardTitle className="text-base mt-2">{template.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopy(template.body, template.id);
                      }}
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Copy
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Custom Templates */}
      {customTemplates.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Edit className="h-5 w-5 text-primary" />
            Custom Templates
            <Badge variant="secondary">{customTemplates.length}</Badge>
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {customTemplates.map((template, index) => (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="hover:shadow-md transition-all">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {template.platform === "linkedin" ? (
                          <Linkedin className="h-4 w-4 text-blue-600" />
                        ) : template.platform === "email" ? (
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
                      <Badge variant="outline" className="text-xs">Custom</Badge>
                    </div>
                    <CardTitle className="text-base mt-2">{template.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-2">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {template.body.replace(/\{\{[^}]+\}\}/g, "[...]").slice(0, 80)}...
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 gap-1"
                        onClick={() => handleCopy(template.body, `custom-${template.id}`)}
                      >
                        <Copy className="h-3.5 w-3.5" />
                        Copy
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditCustomTemplate(template)}
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => onDeleteCustomTemplate(template.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default OutreachSavedSection;
