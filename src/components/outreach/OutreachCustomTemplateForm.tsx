import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { categoryConfigs, OutreachCategory, OutreachPlatform } from "@/data/coldOutreachData";
import { CreateTemplateInput } from "@/hooks/useOutreachCustomTemplates";

interface OutreachCustomTemplateFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: CreateTemplateInput) => Promise<any>;
  initialData?: Partial<CreateTemplateInput>;
  isEditing?: boolean;
}

const OutreachCustomTemplateForm = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isEditing = false,
}: OutreachCustomTemplateFormProps) => {
  const [title, setTitle] = useState(initialData?.title || "");
  const [category, setCategory] = useState<OutreachCategory>(
    initialData?.category || "networking"
  );
  const [platform, setPlatform] = useState<OutreachPlatform>(
    initialData?.platform || "linkedin"
  );
  const [subject, setSubject] = useState(initialData?.subject || "");
  const [body, setBody] = useState(initialData?.body || "");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleSubmit = async () => {
    if (!title.trim() || !body.trim()) return;

    setIsSubmitting(true);
    try {
      const result = await onSubmit({
        title: title.trim(),
        category,
        platform,
        subject: platform === "email" ? subject.trim() : undefined,
        body: body.trim(),
        tags,
      });

      if (result) {
        onClose();
        // Reset form
        setTitle("");
        setCategory("networking");
        setPlatform("linkedin");
        setSubject("");
        setBody("");
        setTags([]);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const extractedPlaceholders = body.match(/\{\{([^}]+)\}\}/g)?.map((m) => m.slice(2, -2)) || [];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Template" : "Create Custom Template"}</DialogTitle>
          <DialogDescription>
            Create your own outreach template. Use {"{{placeholder}}"} syntax for dynamic fields.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Template Title *</Label>
            <Input
              id="title"
              placeholder="e.g., My Referral Request"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Category & Platform */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="outreach-category">Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as OutreachCategory)}>
                <SelectTrigger id="outreach-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categoryConfigs.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="outreach-platform">Platform</Label>
              <Select value={platform} onValueChange={(v) => setPlatform(v as OutreachPlatform)}>
                <SelectTrigger id="outreach-platform">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Subject (for email) */}
          {(platform === "email" || platform === "both") && (
            <div className="space-y-2">
              <Label htmlFor="subject">Subject Line</Label>
              <Input
                id="subject"
                placeholder="e.g., Quick question about {{role}} at {{company}}"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
          )}

          {/* Body */}
          <div className="space-y-2">
            <Label htmlFor="body">Message Body *</Label>
            <Textarea
              id="body"
              placeholder={`Hi {{name}},

I noticed you work at {{company}} and wanted to reach out...

Best,
{{your_name}}`}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="min-h-[200px] font-mono text-sm"
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{body.length} characters</span>
              {platform === "linkedin" && body.length > 500 && (
                <span className="text-destructive">Exceeds LinkedIn limit (500)</span>
              )}
            </div>
          </div>

          {/* Detected Placeholders */}
          {extractedPlaceholders.length > 0 && (
            <div className="space-y-2">
              <Label>Detected Placeholders</Label>
              <div className="flex flex-wrap gap-2">
                {extractedPlaceholders.map((p) => (
                  <Badge key={p} variant="secondary" className="text-xs">
                    {`{{${p}}}`}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="outreach-tag-input">Tags (optional)</Label>
            <div className="flex gap-2">
              <Input
                id="outreach-tag-input"
                placeholder="Add a tag..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
              />
              <Button type="button" variant="outline" onClick={handleAddTag}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="gap-1">
                    {tag}
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-destructive"
                      onClick={() => handleRemoveTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!title.trim() || !body.trim() || isSubmitting}
            >
              {isSubmitting ? "Saving..." : isEditing ? "Update Template" : "Create Template"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OutreachCustomTemplateForm;
