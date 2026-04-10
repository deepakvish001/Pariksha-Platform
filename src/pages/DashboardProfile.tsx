import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Edit2, 
  Camera, 
  Briefcase,
  Trophy,
  Target,
  BookOpen,
  Globe,
  Twitter,
  Linkedin,
  Github,
  Instagram,
  FileText,
  Code,
  Plus,
  X,
  Loader2,
  AlertCircle,
  Sparkles,
  Save,
  Share2,
  ChevronRight,
  CheckCircle2
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription 
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import ImageCropper from "@/components/ImageCropper";
import {
  validateTwitterUrl,
  validateLinkedInUrl,
  validateGitHubUrl,
  validateInstagramUrl,
  validateLeetCodeUrl,
  validateHackerRankUrl,
  validateCodeForcesUrl,
  validateCodeChefUrl,
  validateGeeksForGeeksUrl,
  validateGenericUrl,
  validateUsername,
} from "@/lib/validation";
import { useProfileFollowCounts } from "@/hooks/useProfileFollowCounts";

interface ExtendedProfile {
  id: string;
  user_id: string;
  username?: string;
  mobile_number?: string;
  bio?: string;
  location?: string;
  occupation?: string;
  website?: string;
  current_experience?: string;
  target_goal?: string;
  skills?: string[];
  interests?: string[];
  goals?: string[];
  twitter_url?: string;
  linkedin_url?: string;
  github_url?: string;
  instagram_url?: string;
  resume_url?: string;
  leetcode_url?: string;
  hackerrank_url?: string;
  codeforces_url?: string;
  codechef_url?: string;
  geeksforgeeks_url?: string;
  profile_completion_percentage?: number;
}

const ProfileField = ({ 
  label, value, icon: Icon, onEdit, isEmpty = false
}: { 
  label: string; value?: string; icon: React.ElementType; onEdit: () => void; isEmpty?: boolean;
}) => (
  <div 
    className={cn(
      "flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer group",
      isEmpty ? "border-dashed border-muted-foreground/30 bg-muted/30 hover:border-primary/50 hover:bg-primary/5" 
        : "border-border bg-card hover:bg-muted/50"
    )}
    onClick={onEdit}
  >
    <div className="flex items-center gap-3">
      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", isEmpty ? "bg-muted" : "bg-primary/10")}>
        <Icon className={cn("w-4 h-4", isEmpty ? "text-muted-foreground" : "text-primary")} />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={cn("text-sm font-medium", isEmpty ? "text-muted-foreground italic" : "text-foreground")}>
          {isEmpty ? "Not set" : value}
        </p>
      </div>
    </div>
    <Edit2 className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
  </div>
);

const ArrayField = ({
  label, items, icon: Icon, onEdit, colorClass = "bg-primary/10 text-primary"
}: {
  label: string; items?: string[]; icon: React.ElementType; onEdit: () => void; colorClass?: string;
}) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium">{label}</span>
      </div>
      <Button variant="ghost" size="sm" onClick={onEdit} className="h-7 text-xs">
        <Edit2 className="w-3 h-3 mr-1" /> Edit
      </Button>
    </div>
    {items && items.length > 0 ? (
      <div className="flex flex-wrap gap-2">
        {items.map((item, index) => (
          <Badge key={index} variant="secondary" className={colorClass}>{item}</Badge>
        ))}
      </div>
    ) : (
      <div className="p-4 rounded-lg border border-dashed border-muted-foreground/30 bg-muted/30 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all" onClick={onEdit}>
        <Plus className="w-5 h-5 mx-auto text-muted-foreground mb-1" />
        <p className="text-xs text-muted-foreground">No items added</p>
      </div>
    )}
  </div>
);

const DashboardProfile = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { followersCount, followingCount, isLoading: isLoadingCounts } = useProfileFollowCounts(user?.id);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || "");
  const [extendedProfile, setExtendedProfile] = useState<ExtendedProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editSection, setEditSection] = useState<string>("info");
  const [editForm, setEditForm] = useState<Partial<ExtendedProfile>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [tempSkill, setTempSkill] = useState("");
  const [tempInterest, setTempInterest] = useState("");
  const [tempGoal, setTempGoal] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) { setIsLoading(false); return; }
      try {
        const { data, error } = await supabase
          .from("user_profiles_extended")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();
        if (error) throw error;
        if (data) {
          setExtendedProfile(data as unknown as ExtendedProfile);
          setEditForm(data as unknown as ExtendedProfile);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  const getInitials = (name: string | null | undefined) => {
    if (!name) return user?.email?.charAt(0).toUpperCase() || "U";
    return name.split(" ").map(n => n.charAt(0)).join("").toUpperCase().slice(0, 2);
  };

  const calculateCompletion = (profileData: ExtendedProfile | null): number => {
    if (!profileData) return 0;
    const fields = [
      profileData.bio, profileData.location, profileData.occupation,
      profileData.skills?.length ? "filled" : null,
      profileData.goals?.length ? "filled" : null,
      profileData.linkedin_url, profileData.github_url, profileData.leetcode_url,
    ];
    const filled = fields.filter(f => f && f !== "").length;
    return Math.round((filled / fields.length) * 100);
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ variant: "destructive", title: "Please select an image file" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ variant: "destructive", title: "Image must be less than 5MB" });
      return;
    }
    setSelectedImage(URL.createObjectURL(file));
    setCropperOpen(true);
    event.target.value = "";
  };

  const handleCroppedImage = async (croppedBlob: Blob) => {
    if (!user) return;
    setIsUploadingAvatar(true);
    setCropperOpen(false);
    try {
      const fileName = `${user.id}/avatar.jpg`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, croppedBlob, { upsert: true, contentType: "image/jpeg" });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(fileName);
      const newAvatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      const { error: updateError } = await supabase.from("profiles").update({ avatar_url: newAvatarUrl }).eq("user_id", user.id);
      if (updateError) throw updateError;
      setAvatarUrl(newAvatarUrl);
      toast({ title: "Avatar updated!" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Upload failed", description: error.message });
    } finally {
      setIsUploadingAvatar(false);
      if (selectedImage) { URL.revokeObjectURL(selectedImage); setSelectedImage(""); }
    }
  };

  const openEditModal = (section: string) => {
    setEditSection(section);
    setEditForm(extendedProfile || {});
    setValidationErrors({});
    setIsEditModalOpen(true);
  };

  const validateAllUrls = (): boolean => {
    const errors: Record<string, string> = {};
    const checks = [
      ["username", validateUsername(editForm.username || "")],
      ["website", validateGenericUrl(editForm.website || "")],
      ["twitter_url", validateTwitterUrl(editForm.twitter_url || "")],
      ["linkedin_url", validateLinkedInUrl(editForm.linkedin_url || "")],
      ["github_url", validateGitHubUrl(editForm.github_url || "")],
      ["instagram_url", validateInstagramUrl(editForm.instagram_url || "")],
      ["resume_url", validateGenericUrl(editForm.resume_url || "")],
      ["leetcode_url", validateLeetCodeUrl(editForm.leetcode_url || "")],
      ["hackerrank_url", validateHackerRankUrl(editForm.hackerrank_url || "")],
      ["codeforces_url", validateCodeForcesUrl(editForm.codeforces_url || "")],
      ["codechef_url", validateCodeChefUrl(editForm.codechef_url || "")],
      ["geeksforgeeks_url", validateGeeksForGeeksUrl(editForm.geeksforgeeks_url || "")],
    ] as const;
    checks.forEach(([key, result]) => { if (!result.valid) errors[key as string] = result.error!; });
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveProfile = async () => {
    if (!user || !extendedProfile?.id) return;
    if (!validateAllUrls()) {
      toast({ variant: "destructive", title: "Validation Error", description: "Please fix the errors before saving." });
      return;
    }
    setIsSaving(true);
    try {
      const completionPercent = calculateCompletion(editForm as ExtendedProfile);
      const { error } = await supabase
        .from("user_profiles_extended")
        .update({ ...editForm, profile_completion_percentage: completionPercent })
        .eq("id", extendedProfile.id);
      if (error) throw error;
      setExtendedProfile(prev => prev ? { ...prev, ...editForm, profile_completion_percentage: completionPercent } : null);
      toast({ title: "Profile updated!" });
      setIsEditModalOpen(false);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Save failed", description: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  const addArrayItem = (field: keyof ExtendedProfile, value: string, clearFn: () => void) => {
    if (!value.trim()) return;
    const currentArray = (editForm[field] as string[]) || [];
    if (currentArray.includes(value.trim())) { toast({ variant: "destructive", title: "Already added" }); return; }
    setEditForm(prev => ({ ...prev, [field]: [...currentArray, value.trim()] }));
    clearFn();
  };

  const removeArrayItem = (field: keyof ExtendedProfile, index: number) => {
    const currentArray = (editForm[field] as string[]) || [];
    setEditForm(prev => ({ ...prev, [field]: currentArray.filter((_, i) => i !== index) }));
  };

  const completionPercent = calculateCompletion(extendedProfile);
  const incompleteFields = 8 - Math.round(completionPercent * 8 / 100);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <input type="file" ref={fileInputRef} onChange={handleImageSelect} accept="image/*" className="hidden" />
      <ImageCropper open={cropperOpen} onOpenChange={setCropperOpen} imageSrc={selectedImage} onCropComplete={handleCroppedImage} aspectRatio={1} />

      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="flex h-14 items-center gap-3 px-4 sm:px-6">
          <div className="h-9 w-9 rounded-xl bg-gradient-orange flex items-center justify-center">
            <User className="h-4.5 w-4.5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold">My Profile</h1>
            <p className="text-xs text-muted-foreground hidden sm:block">Manage your account information</p>
          </div>
        </div>
      </header>

      <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
        {/* Profile Completion Banner */}
        {completionPercent < 100 && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-primary/20 bg-gradient-to-r from-primary/5 via-primary/10 to-transparent">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="h-12 w-12 rounded-full border-4 border-primary/20 flex items-center justify-center bg-card">
                        <span className="text-base font-bold text-primary">{completionPercent}%</span>
                      </div>
                      <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-yellow-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm flex items-center gap-2">
                        Complete your profile
                        <Badge variant="secondary" className="text-xs">{incompleteFields} fields left</Badge>
                      </h3>
                      <p className="text-xs text-muted-foreground">A complete profile helps you stand out</p>
                    </div>
                  </div>
                  <Button size="sm" onClick={() => openEditModal("info")} className="gap-1.5">
                    <Edit2 className="w-3.5 h-3.5" /> Complete Now
                  </Button>
                </div>
                <Progress value={completionPercent} className="mt-3 h-2" />
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Profile Header Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="overflow-hidden">
            <div className="h-28 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent" />
            <CardContent className="relative pt-0 pb-5">
              <div className="flex flex-col md:flex-row items-start md:items-end gap-5 -mt-14">
                <div className="relative">
                  <Avatar className="h-28 w-28 border-4 border-background shadow-xl">
                    <AvatarImage src={avatarUrl || profile?.avatar_url || undefined} />
                    <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                      {getInitials(profile?.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <Button size="icon" variant="secondary" className="absolute bottom-0 right-0 rounded-full h-9 w-9 shadow-lg"
                    onClick={() => fileInputRef.current?.click()} disabled={isUploadingAvatar}>
                    {isUploadingAvatar ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                  </Button>
                </div>
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl font-bold">{profile?.full_name || "User"}</h2>
                    {extendedProfile?.username && <Badge variant="outline">@{extendedProfile.username}</Badge>}
                  </div>
                  {extendedProfile?.bio && <p className="text-sm text-muted-foreground">{extendedProfile.bio}</p>}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{user?.email}</span>
                    {extendedProfile?.location && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{extendedProfile.location}</span>}
                    <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />Joined {new Date(user?.created_at || "").toLocaleDateString()}</span>
                  </div>
                  {/* Follower counts inline */}
                  <div className="flex items-center gap-4 text-sm pt-1">
                    <span><strong>{isLoadingCounts ? "…" : followersCount}</strong> <span className="text-muted-foreground">followers</span></span>
                    <span><strong>{isLoadingCounts ? "…" : followingCount}</strong> <span className="text-muted-foreground">following</span></span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {extendedProfile?.username && (
                    <Link to={`/u/${extendedProfile.username}`} target="_blank">
                      <Button variant="outline" size="sm" className="gap-1.5">
                        <Share2 className="h-3.5 w-3.5" /> Public Profile
                      </Button>
                    </Link>
                  )}
                  <Button size="sm" className="gap-1.5" onClick={() => openEditModal("info")}>
                    <Edit2 className="h-3.5 w-3.5" /> Edit
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid gap-5 lg:grid-cols-2">
          {/* Basic Information */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Personal Info</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => openEditModal("info")}><Edit2 className="w-3.5 h-3.5" /></Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <ProfileField label="Username" value={extendedProfile?.username ? `@${extendedProfile.username}` : undefined} icon={User} onEdit={() => openEditModal("info")} isEmpty={!extendedProfile?.username} />
                <ProfileField label="Mobile" value={extendedProfile?.mobile_number || undefined} icon={Phone} onEdit={() => openEditModal("info")} isEmpty={!extendedProfile?.mobile_number} />
                <ProfileField label="Location" value={extendedProfile?.location || undefined} icon={MapPin} onEdit={() => openEditModal("info")} isEmpty={!extendedProfile?.location} />
                <ProfileField label="Occupation" value={extendedProfile?.occupation || undefined} icon={Briefcase} onEdit={() => openEditModal("info")} isEmpty={!extendedProfile?.occupation} />
                <ProfileField label="Website" value={extendedProfile?.website || undefined} icon={Globe} onEdit={() => openEditModal("info")} isEmpty={!extendedProfile?.website} />
              </CardContent>
            </Card>
          </motion.div>

          {/* Skills & Goals */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Skills & Goals</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <ArrayField label="Skills" items={extendedProfile?.skills} icon={Code} onEdit={() => openEditModal("skills")} colorClass="bg-blue-500/10 text-blue-600" />
                <ArrayField label="Interests" items={extendedProfile?.interests} icon={BookOpen} onEdit={() => openEditModal("skills")} colorClass="bg-emerald-500/10 text-emerald-600" />
                <ArrayField label="Goals" items={extendedProfile?.goals} icon={Target} onEdit={() => openEditModal("skills")} colorClass="bg-purple-500/10 text-purple-600" />
              </CardContent>
            </Card>
          </motion.div>

          {/* Social & Coding Links - Combined */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-2">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Links & Profiles</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => openEditModal("links")}><Edit2 className="w-3.5 h-3.5" /></Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  <ProfileField label="LinkedIn" value={extendedProfile?.linkedin_url || undefined} icon={Linkedin} onEdit={() => openEditModal("links")} isEmpty={!extendedProfile?.linkedin_url} />
                  <ProfileField label="GitHub" value={extendedProfile?.github_url || undefined} icon={Github} onEdit={() => openEditModal("links")} isEmpty={!extendedProfile?.github_url} />
                  <ProfileField label="Twitter" value={extendedProfile?.twitter_url || undefined} icon={Twitter} onEdit={() => openEditModal("links")} isEmpty={!extendedProfile?.twitter_url} />
                  <ProfileField label="LeetCode" value={extendedProfile?.leetcode_url || undefined} icon={Code} onEdit={() => openEditModal("links")} isEmpty={!extendedProfile?.leetcode_url} />
                  <ProfileField label="HackerRank" value={extendedProfile?.hackerrank_url || undefined} icon={Code} onEdit={() => openEditModal("links")} isEmpty={!extendedProfile?.hackerrank_url} />
                  <ProfileField label="CodeForces" value={extendedProfile?.codeforces_url || undefined} icon={Code} onEdit={() => openEditModal("links")} isEmpty={!extendedProfile?.codeforces_url} />
                  <ProfileField label="CodeChef" value={extendedProfile?.codechef_url || undefined} icon={Code} onEdit={() => openEditModal("links")} isEmpty={!extendedProfile?.codechef_url} />
                  <ProfileField label="GeeksForGeeks" value={extendedProfile?.geeksforgeeks_url || undefined} icon={Code} onEdit={() => openEditModal("links")} isEmpty={!extendedProfile?.geeksforgeeks_url} />
                  <ProfileField label="Resume" value={extendedProfile?.resume_url || undefined} icon={FileText} onEdit={() => openEditModal("links")} isEmpty={!extendedProfile?.resume_url} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>

      {/* Edit Profile Modal - Simplified to 3 tabs */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>Update your profile information.</DialogDescription>
          </DialogHeader>

          <Tabs value={editSection} onValueChange={setEditSection}>
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="info">Info</TabsTrigger>
              <TabsTrigger value="skills">Skills & Goals</TabsTrigger>
              <TabsTrigger value="links">Links</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Username</Label>
                <Input placeholder="your-username" value={editForm.username || ""}
                  onChange={e => setEditForm(prev => ({ ...prev, username: e.target.value }))}
                  className={validationErrors.username ? "border-destructive" : ""} />
                {validationErrors.username && (
                  <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="w-3 h-3" />{validationErrors.username}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Mobile Number</Label>
                  <Input placeholder="+91 XXXXX XXXXX" value={editForm.mobile_number || ""}
                    onChange={e => setEditForm(prev => ({ ...prev, mobile_number: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input placeholder="City, Country" value={editForm.location || ""}
                    onChange={e => setEditForm(prev => ({ ...prev, location: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Bio</Label>
                <Textarea placeholder="Tell us about yourself..." value={editForm.bio || ""}
                  onChange={e => setEditForm(prev => ({ ...prev, bio: e.target.value }))} rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Occupation</Label>
                  <Input placeholder="Software Engineer" value={editForm.occupation || ""}
                    onChange={e => setEditForm(prev => ({ ...prev, occupation: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Website</Label>
                  <Input placeholder="https://yourwebsite.com" value={editForm.website || ""}
                    onChange={e => setEditForm(prev => ({ ...prev, website: e.target.value }))} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="skills" className="space-y-5 mt-4">
              {[
                { label: "Skills", field: "skills" as const, temp: tempSkill, setTemp: setTempSkill, placeholder: "Add a skill (e.g., React, Python)" },
                { label: "Interests", field: "interests" as const, temp: tempInterest, setTemp: setTempInterest, placeholder: "Add an interest" },
                { label: "Goals", field: "goals" as const, temp: tempGoal, setTemp: setTempGoal, placeholder: "Add a goal" },
              ].map(({ label, field, temp, setTemp, placeholder }) => (
                <div key={field}>
                  <Label>{label}</Label>
                  <div className="flex gap-2 mt-2">
                    <Input placeholder={placeholder} value={temp}
                      onChange={e => setTemp(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addArrayItem(field, temp, () => setTemp("")))} />
                    <Button type="button" onClick={() => addArrayItem(field, temp, () => setTemp(""))}><Plus className="w-4 h-4" /></Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {(editForm[field] as string[] || []).map((item, index) => (
                      <Badge key={index} variant="secondary" className="gap-1 pr-1">
                        {item}
                        <button onClick={() => removeArrayItem(field, index)} className="ml-1 hover:text-destructive"><X className="w-3 h-3" /></button>
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="links" className="space-y-4 mt-4">
              <p className="text-xs text-muted-foreground">Social & coding profile links</p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "LinkedIn", key: "linkedin_url", icon: Linkedin, placeholder: "https://linkedin.com/in/username" },
                  { label: "GitHub", key: "github_url", icon: Github, placeholder: "https://github.com/username" },
                  { label: "Twitter", key: "twitter_url", icon: Twitter, placeholder: "https://twitter.com/username" },
                  { label: "Instagram", key: "instagram_url", icon: Instagram, placeholder: "https://instagram.com/username" },
                  { label: "LeetCode", key: "leetcode_url", icon: Code, placeholder: "https://leetcode.com/username" },
                  { label: "HackerRank", key: "hackerrank_url", icon: Code, placeholder: "https://hackerrank.com/username" },
                  { label: "CodeForces", key: "codeforces_url", icon: Code, placeholder: "https://codeforces.com/profile/username" },
                  { label: "CodeChef", key: "codechef_url", icon: Code, placeholder: "https://codechef.com/users/username" },
                ].map(({ label, key, icon: LinkIconComp, placeholder }) => (
                  <div key={key} className="space-y-2">
                    <Label className="flex items-center gap-2"><LinkIconComp className="w-3.5 h-3.5" /> {label}</Label>
                    <Input placeholder={placeholder} value={(editForm as any)[key] || ""}
                      onChange={e => setEditForm(prev => ({ ...prev, [key]: e.target.value }))} />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Code className="w-3.5 h-3.5" /> GeeksForGeeks</Label>
                  <Input placeholder="https://geeksforgeeks.org/user/username" value={editForm.geeksforgeeks_url || ""}
                    onChange={e => setEditForm(prev => ({ ...prev, geeksforgeeks_url: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><FileText className="w-3.5 h-3.5" /> Resume URL</Label>
                  <Input placeholder="https://drive.google.com/your-resume" value={editForm.resume_url || ""}
                    onChange={e => setEditForm(prev => ({ ...prev, resume_url: e.target.value }))} />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveProfile} disabled={isSaving} className="gap-2">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DashboardProfile;
