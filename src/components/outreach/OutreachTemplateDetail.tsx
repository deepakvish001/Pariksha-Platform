import { useState, useMemo } from "react";
import { Copy, Star, Linkedin, Mail, Sparkles, AlertCircle, Check } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";
import { 
  OutreachTemplate, 
  getCategoryLabel, 
  getSuccessRateColor,
  outreachTemplates 
} from "@/data/coldOutreachData";
import OutreachAIPersonalizer from "./OutreachAIPersonalizer";

interface OutreachTemplateDetailProps {
  template: OutreachTemplate | null;
  isOpen: boolean;
  onClose: () => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onCopy: () => void;
}

const OutreachTemplateDetail = ({
  template,
  isOpen,
  onClose,
  isFavorite,
  onToggleFavorite,
  onCopy,
}: OutreachTemplateDetailProps) => {
  const [placeholderValues, setPlaceholderValues] = useState<Record<string, string>>({});
  const [showAI, setShowAI] = useState(false);
  const [copied, setCopied] = useState(false);

  const personalizedBody = useMemo(() => {
    if (!template) return '';
    let body = template.body;
    Object.entries(placeholderValues).forEach(([key, value]) => {
      if (value) {
        body = body.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
      }
    });
    return body;
  }, [template, placeholderValues]);

  const remainingPlaceholders = useMemo(() => {
    if (!template) return [];
    return template.placeholders.filter(
      p => !placeholderValues[p] || placeholderValues[p].trim() === ''
    );
  }, [template, placeholderValues]);

  const characterCount = personalizedBody.length;
  const isOverLinkedInLimit = template?.platform === 'linkedin' && characterCount > 500;

  if (!template) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(personalizedBody);
      onCopy();
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Copied!",
        description: remainingPlaceholders.length > 0 
          ? "Don't forget to fill in the remaining placeholders!"
          : "Template copied to clipboard.",
      });
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const relatedTemplates = outreachTemplates
    .filter(t => t.category === template.category && t.id !== template.id)
    .slice(0, 3);

  const highlightPlaceholders = (text: string) => {
    return text.split(/(\{\{[^}]+\}\})/).map((part, index) => {
      if (part.match(/^\{\{[^}]+\}\}$/)) {
        const placeholder = part.slice(2, -2);
        const value = placeholderValues[placeholder];
        if (value) {
          return <span key={index} className="text-primary font-medium">{value}</span>;
        }
        return (
          <span key={index} className="bg-primary/20 text-primary px-1 rounded">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="sm:max-w-xl w-full p-0 flex flex-col">
        <SheetHeader className="p-6 pb-4">
          <div className="flex items-center gap-2 mb-2">
            {template.platform === 'linkedin' ? (
              <Linkedin className="h-5 w-5 text-blue-600" />
            ) : template.platform === 'email' ? (
              <Mail className="h-5 w-5 text-muted-foreground" />
            ) : (
              <div className="flex gap-1">
                <Linkedin className="h-5 w-5 text-blue-600" />
                <Mail className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
            <Badge variant="secondary">{getCategoryLabel(template.category)}</Badge>
            <Badge variant="outline" className={getSuccessRateColor(template.successRate)}>
              {template.successRate} success
            </Badge>
          </div>
          <SheetTitle className="text-xl">{template.title}</SheetTitle>
          <SheetDescription>
            {template.useCases.join(' • ')}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 px-6">
          {/* Placeholder Inputs */}
          {template.placeholders.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <span>Personalize</span>
                {remainingPlaceholders.length === 0 && (
                  <Check className="h-4 w-4 text-green-500" />
                )}
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {template.placeholders.map((placeholder) => (
                  <div key={placeholder} className="space-y-1">
                    <Label htmlFor={`outreach-placeholder-${placeholder}`} className="text-xs capitalize">
                      {placeholder.replace(/_/g, ' ')}
                    </Label>
                    <Input
                      id={`outreach-placeholder-${placeholder}`}
                      placeholder={`Enter ${placeholder.replace(/_/g, ' ')}`}
                      value={placeholderValues[placeholder] || ''}
                      onChange={(e) => setPlaceholderValues(prev => ({
                        ...prev,
                        [placeholder]: e.target.value
                      }))}
                      className="h-8 text-sm"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Subject Line (for emails) */}
          {template.subject && (
            <div className="mb-4">
              <h3 className="font-semibold mb-2">Subject Line</h3>
              <div className="p-3 rounded-lg bg-muted/50 text-sm">
                {highlightPlaceholders(template.subject)}
              </div>
            </div>
          )}

          {/* Preview */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">Preview</h3>
              <div className="flex items-center gap-2 text-xs">
                <span className={isOverLinkedInLimit ? "text-destructive" : "text-muted-foreground"}>
                  {characterCount} chars
                </span>
                {template.platform === 'linkedin' && (
                  <span className="text-muted-foreground">/ 500 limit</span>
                )}
              </div>
            </div>
            {isOverLinkedInLimit && (
              <div className="flex items-center gap-2 text-destructive text-xs mb-2">
                <AlertCircle className="h-3 w-3" />
                Message exceeds LinkedIn's character limit
              </div>
            )}
            <div className="p-4 rounded-lg bg-muted/50 whitespace-pre-wrap text-sm leading-relaxed">
              {highlightPlaceholders(personalizedBody)}
            </div>
          </div>

          {/* Tips */}
          {template.tips.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Tips for Success</h3>
              <ul className="space-y-1.5">
                {template.tips.map((tip, index) => (
                  <li key={index} className="text-sm text-muted-foreground flex gap-2">
                    <span className="text-primary">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* AI Personalization */}
          {showAI && (
            <div className="mb-6">
              <OutreachAIPersonalizer
                template={template}
                placeholderValues={placeholderValues}
                onClose={() => setShowAI(false)}
              />
            </div>
          )}

          {/* Related Templates */}
          {relatedTemplates.length > 0 && (
            <div className="mb-6">
              <Separator className="mb-4" />
              <h3 className="font-semibold mb-3">Related Templates</h3>
              <div className="space-y-2">
                {relatedTemplates.map((t) => (
                  <div 
                    key={t.id} 
                    className="p-3 rounded-lg border bg-card hover:bg-accent/50 cursor-pointer transition-colors"
                    onClick={() => {
                      setPlaceholderValues({});
                      setShowAI(false);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{t.title}</span>
                      <Badge variant="outline" className="text-xs">
                        {t.platform}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </ScrollArea>

        {/* Actions Footer */}
        <div className="p-6 pt-4 border-t bg-background">
          <div className="flex gap-2">
            <Button 
              className="flex-1 gap-2" 
              onClick={handleCopy}
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy to Clipboard
                </>
              )}
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => setShowAI(!showAI)}
            >
              <Sparkles className="h-4 w-4" />
              AI
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
              className={isFavorite ? "text-yellow-500" : "text-muted-foreground"}
              onClick={onToggleFavorite}
            >
              <Star className={`h-5 w-5 ${isFavorite ? 'fill-current' : ''}`} />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default OutreachTemplateDetail;
