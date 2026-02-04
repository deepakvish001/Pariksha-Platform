import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Edit2, 
  Camera, 
  GraduationCap, 
  Briefcase,
  Trophy,
  Target,
  BookOpen,
  Clock,
  Globe,
  Twitter,
  Linkedin,
  Github,
  Instagram,
  FileText,
  Link as LinkIcon,
  Code,
  Plus,
  X,
  Check,
  Loader2,
  AlertCircle,
  Sparkles,
  ChevronRight,
  Save,
  ExternalLink,
  Share2
} from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
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
  aspirations?: string[];
  twitter_url?: string;
  linkedin_url?: string;
  github_url?: string;
  instagram_url?: string;
  resume_url?: string;
  other_links?: { title: string; url: string }[];
  leetcode_url?: string;
  hackerrank_url?: string;
  codeforces_url?: string;
  codechef_url?: string;
  geeksforgeeks_url?: string;
  profile_completion_percentage?: number;
}

const ProfileField = ({ 
  label, 
  value, 
  icon: Icon, 
  onEdit,
  isEmpty = false
}: { 
  label: string; 
  value?: string; 
  icon: React.ElementType;
  onEdit: () => void;
  isEmpty?: boolean;
}) => (
  <div 
    className={cn(
      "flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer group",
      isEmpty 
        ? "border-dashed border-muted-foreground/30 bg-muted/30 hover:border-primary/50 hover:bg-primary/5" 
        : "border-border bg-card hover:bg-muted/50"
    )}
    onClick={onEdit}
  >
    <div className="flex items-center gap-3">
      <div className={cn(
        "w-8 h-8 rounded-lg flex items-center justify-center",
        isEmpty ? "bg-muted" : "bg-primary/10"
      )}>
        <Icon className={cn("w-4 h-4", isEmpty ? "text-muted-foreground" : "text-primary")} />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={cn(
          "text-sm font-medium",
          isEmpty ? "text-muted-foreground italic" : "text-foreground"
        )}>
          {isEmpty ? "Not set" : value}
        </p>
      </div>
    </div>
    <Edit2 className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
  </div>
);

const ArrayField = ({
  label,
  items,
  icon: Icon,
  onEdit,
  colorClass = "bg-primary/10 text-primary"
}: {
  label: string;
  items?: string[];
  icon: React.ElementType;
  onEdit: () => void;
  colorClass?: string;
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
          <Badge key={index} variant="secondary" className={colorClass}>
            {item}
          </Badge>
        ))}
      </div>
    ) : (
      <div 
        className="p-4 rounded-lg border border-dashed border-muted-foreground/30 bg-muted/30 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all"
        onClick={onEdit}
      >
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
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || "");
  const [extendedProfile, setExtendedProfile] = useState<ExtendedProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Image cropper state
  const [cropperOpen, setCropperOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>("");
  
  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editSection, setEditSection] = useState<string>("basic");
  const [editForm, setEditForm] = useState<Partial<ExtendedProfile>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  // Temp input states for array fields
  const [tempSkill, setTempSkill] = useState("");
  const [tempInterest, setTempInterest] = useState("");
  const [tempGoal, setTempGoal] = useState("");
  const [tempAspiration, setTempAspiration] = useState("");
  const [tempLinkTitle, setTempLinkTitle] = useState("");
  const [tempLinkUrl, setTempLinkUrl] = useState("");

  // Fetch extended profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

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
    return name.split(" ").map((n) => n.charAt(0)).join("").toUpperCase().slice(0, 2);
  };

  const calculateCompletion = (profileData: ExtendedProfile | null): number => {
    if (!profileData) return 0;
    const fields = [
      profileData.mobile_number,
      profileData.bio,
      profileData.location,
      profileData.occupation,
      profileData.website,
      profileData.current_experience,
      profileData.target_goal,
      profileData.skills?.length ? "filled" : null,
      profileData.interests?.length ? "filled" : null,
      profileData.goals?.length ? "filled" : null,
      profileData.aspirations?.length ? "filled" : null,
      profileData.twitter_url,
      profileData.linkedin_url,
      profileData.github_url,
      profileData.leetcode_url,
      profileData.hackerrank_url,
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

    // Create object URL for cropper
    const imageUrl = URL.createObjectURL(file);
    setSelectedImage(imageUrl);
    setCropperOpen(true);
    
    // Reset input so same file can be selected again
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
        .upload(fileName, croppedBlob, { 
          upsert: true,
          contentType: "image/jpeg"
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      const newAvatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: newAvatarUrl })
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      setAvatarUrl(newAvatarUrl);
      toast({ title: "Avatar updated!", description: "Your profile picture has been changed." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Upload failed", description: error.message });
    } finally {
      setIsUploadingAvatar(false);
      // Cleanup object URL
      if (selectedImage) {
        URL.revokeObjectURL(selectedImage);
        setSelectedImage("");
      }
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
    
    // Username validation
    const usernameResult = validateUsername(editForm.username || "");
    if (!usernameResult.valid) errors.username = usernameResult.error!;

    // Website
    const websiteResult = validateGenericUrl(editForm.website || "");
    if (!websiteResult.valid) errors.website = websiteResult.error!;

    // Social URLs
    const twitterResult = validateTwitterUrl(editForm.twitter_url || "");
    if (!twitterResult.valid) errors.twitter_url = twitterResult.error!;

    const linkedinResult = validateLinkedInUrl(editForm.linkedin_url || "");
    if (!linkedinResult.valid) errors.linkedin_url = linkedinResult.error!;

    const githubResult = validateGitHubUrl(editForm.github_url || "");
    if (!githubResult.valid) errors.github_url = githubResult.error!;

    const instagramResult = validateInstagramUrl(editForm.instagram_url || "");
    if (!instagramResult.valid) errors.instagram_url = instagramResult.error!;

    // Resume URL
    const resumeResult = validateGenericUrl(editForm.resume_url || "");
    if (!resumeResult.valid) errors.resume_url = resumeResult.error!;

    // Coding profile URLs
    const leetcodeResult = validateLeetCodeUrl(editForm.leetcode_url || "");
    if (!leetcodeResult.valid) errors.leetcode_url = leetcodeResult.error!;

    const hackerrankResult = validateHackerRankUrl(editForm.hackerrank_url || "");
    if (!hackerrankResult.valid) errors.hackerrank_url = hackerrankResult.error!;

    const codeforcesResult = validateCodeForcesUrl(editForm.codeforces_url || "");
    if (!codeforcesResult.valid) errors.codeforces_url = codeforcesResult.error!;

    const codechefResult = validateCodeChefUrl(editForm.codechef_url || "");
    if (!codechefResult.valid) errors.codechef_url = codechefResult.error!;

    const gfgResult = validateGeeksForGeeksUrl(editForm.geeksforgeeks_url || "");
    if (!gfgResult.valid) errors.geeksforgeeks_url = gfgResult.error!;

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveProfile = async () => {
    if (!user || !extendedProfile?.id) return;

    // Validate all URLs
    if (!validateAllUrls()) {
      toast({ variant: "destructive", title: "Validation Error", description: "Please fix the errors before saving." });
      return;
    }

    setIsSaving(true);
    try {
      const completionPercent = calculateCompletion(editForm as ExtendedProfile);
      
      const { error } = await supabase
        .from("user_profiles_extended")
        .update({
          ...editForm,
          profile_completion_percentage: completionPercent,
        })
        .eq("id", extendedProfile.id);

      if (error) throw error;

      setExtendedProfile(prev => prev ? { ...prev, ...editForm, profile_completion_percentage: completionPercent } : null);
      toast({ title: "Profile updated!", description: "Your changes have been saved." });
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
    if (currentArray.includes(value.trim())) {
      toast({ variant: "destructive", title: "Already added" });
      return;
    }
    setEditForm(prev => ({ ...prev, [field]: [...currentArray, value.trim()] }));
    clearFn();
  };

  const removeArrayItem = (field: keyof ExtendedProfile, index: number) => {
    const currentArray = (editForm[field] as string[]) || [];
    setEditForm(prev => ({ ...prev, [field]: currentArray.filter((_, i) => i !== index) }));
  };

  const addOtherLink = () => {
    if (!tempLinkTitle.trim() || !tempLinkUrl.trim()) return;
    const currentLinks = editForm.other_links || [];
    setEditForm(prev => ({ 
      ...prev, 
      other_links: [...currentLinks, { title: tempLinkTitle.trim(), url: tempLinkUrl.trim() }] 
    }));
    setTempLinkTitle("");
    setTempLinkUrl("");
  };

  const removeOtherLink = (index: number) => {
    const currentLinks = editForm.other_links || [];
    setEditForm(prev => ({ ...prev, other_links: currentLinks.filter((_, i) => i !== index) }));
  };

  const completionPercent = calculateCompletion(extendedProfile);
  const incompleteFields = 16 - Math.round(completionPercent * 16 / 100);

  const stats = [
    { label: "Courses Enrolled", value: "12", icon: BookOpen, color: "text-blue-500" },
    { label: "Achievements", value: "28", icon: Trophy, color: "text-yellow-500" },
    { label: "Study Hours", value: "156", icon: Clock, color: "text-green-500" },
    { label: "Goals Completed", value: "8", icon: Target, color: "text-primary" },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageSelect}
        accept="image/*"
        className="hidden"
      />

      {/* Image Cropper Modal */}
      <ImageCropper
        open={cropperOpen}
        onOpenChange={setCropperOpen}
        imageSrc={selectedImage}
        onCropComplete={handleCroppedImage}
        aspectRatio={1}
      />

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="flex h-16 items-center gap-4 px-6">
          <SidebarTrigger />
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-orange flex items-center justify-center">
              <User className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">My Profile</h1>
              <p className="text-sm text-muted-foreground">Manage your account information</p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="p-6 md:p-8 space-y-8">
        {/* Profile Completion Banner */}
        {completionPercent < 100 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="border-primary/20 bg-gradient-to-r from-primary/5 via-primary/10 to-transparent">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="h-14 w-14 rounded-full border-4 border-primary/20 flex items-center justify-center bg-card">
                        <span className="text-lg font-bold text-primary">{completionPercent}%</span>
                      </div>
                      <Sparkles className="absolute -top-1 -right-1 w-5 h-5 text-yellow-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold flex items-center gap-2">
                        Complete your profile
                        <Badge variant="secondary" className="text-xs">{incompleteFields} fields remaining</Badge>
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        A complete profile helps you stand out and unlocks personalized features
                      </p>
                    </div>
                  </div>
                  <Button onClick={() => openEditModal("basic")} className="gap-2">
                    <Edit2 className="w-4 h-4" />
                    Complete Now
                  </Button>
                </div>
                <Progress value={completionPercent} className="mt-4 h-2" />
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Profile Header Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="overflow-hidden">
            <div className="h-32 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent" />
            <CardContent className="relative pt-0 pb-6">
              <div className="flex flex-col md:flex-row items-start md:items-end gap-6 -mt-16">
                {/* Avatar */}
                <div className="relative">
                  <Avatar className="h-32 w-32 border-4 border-background shadow-xl">
                    <AvatarImage src={avatarUrl || profile?.avatar_url || undefined} />
                    <AvatarFallback className="text-3xl bg-primary/10 text-primary">
                      {getInitials(profile?.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute bottom-0 right-0 rounded-full h-10 w-10 shadow-lg"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                  >
                    {isUploadingAvatar ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                  </Button>
                </div>

                {/* Info */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold">{profile?.full_name || "User"}</h2>
                    {extendedProfile?.username && (
                      <Badge variant="outline">@{extendedProfile.username}</Badge>
                    )}
                    <Badge>Free Plan</Badge>
                  </div>
                  {extendedProfile?.bio && (
                    <p className="text-muted-foreground">{extendedProfile.bio}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      {user?.email}
                    </div>
                    {extendedProfile?.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {extendedProfile.location}
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Member since {new Date(user?.created_at || "").toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {extendedProfile?.username && (
                    <Link to={`/u/${extendedProfile.username}`} target="_blank">
                      <Button variant="outline" size="sm" className="gap-2">
                        <Share2 className="h-4 w-4" />
                        View Public Profile
                      </Button>
                    </Link>
                  )}
                  <Button className="gap-2" onClick={() => openEditModal("basic")}>
                    <Edit2 className="h-4 w-4" />
                    Edit Profile
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid gap-4 md:grid-cols-4"
        >
          {stats.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className={`h-12 w-12 rounded-xl bg-muted flex items-center justify-center ${stat.color}`}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Basic Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Basic Information</CardTitle>
                    <CardDescription>Your personal details</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => openEditModal("basic")}>
                    <Edit2 className="w-4 h-4 mr-2" /> Edit
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <ProfileField 
                  label="Full Name" 
                  value={profile?.full_name || undefined} 
                  icon={User} 
                  onEdit={() => openEditModal("basic")}
                  isEmpty={!profile?.full_name}
                />
                <ProfileField 
                  label="Username" 
                  value={extendedProfile?.username ? `@${extendedProfile.username}` : undefined} 
                  icon={User} 
                  onEdit={() => openEditModal("basic")}
                  isEmpty={!extendedProfile?.username}
                />
                <ProfileField 
                  label="Email Address" 
                  value={user?.email || undefined} 
                  icon={Mail} 
                  onEdit={() => {}}
                />
                <ProfileField 
                  label="Mobile Number" 
                  value={extendedProfile?.mobile_number || undefined} 
                  icon={Phone} 
                  onEdit={() => openEditModal("personal")}
                  isEmpty={!extendedProfile?.mobile_number}
                />
                <ProfileField 
                  label="Bio" 
                  value={extendedProfile?.bio || undefined} 
                  icon={FileText} 
                  onEdit={() => openEditModal("personal")}
                  isEmpty={!extendedProfile?.bio}
                />
                <ProfileField 
                  label="Location" 
                  value={extendedProfile?.location || undefined} 
                  icon={MapPin} 
                  onEdit={() => openEditModal("personal")}
                  isEmpty={!extendedProfile?.location}
                />
                <ProfileField 
                  label="Occupation" 
                  value={extendedProfile?.occupation || undefined} 
                  icon={Briefcase} 
                  onEdit={() => openEditModal("personal")}
                  isEmpty={!extendedProfile?.occupation}
                />
                <ProfileField 
                  label="Website" 
                  value={extendedProfile?.website || undefined} 
                  icon={Globe} 
                  onEdit={() => openEditModal("personal")}
                  isEmpty={!extendedProfile?.website}
                />
              </CardContent>
            </Card>
          </motion.div>

          {/* Skills, Interests & Goals */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Aspirations & Skills</CardTitle>
                    <CardDescription>What you're working towards</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <ArrayField 
                  label="Aspirations" 
                  items={extendedProfile?.aspirations} 
                  icon={Sparkles} 
                  onEdit={() => openEditModal("aspirations")}
                  colorClass="bg-yellow-500/10 text-yellow-600"
                />
                <ArrayField 
                  label="Skills" 
                  items={extendedProfile?.skills} 
                  icon={Code} 
                  onEdit={() => openEditModal("skills")}
                  colorClass="bg-blue-500/10 text-blue-600"
                />
                <ArrayField 
                  label="Interests" 
                  items={extendedProfile?.interests} 
                  icon={BookOpen} 
                  onEdit={() => openEditModal("interests")}
                  colorClass="bg-green-500/10 text-green-600"
                />
                <ArrayField 
                  label="Goals" 
                  items={extendedProfile?.goals} 
                  icon={Target} 
                  onEdit={() => openEditModal("goals")}
                  colorClass="bg-purple-500/10 text-purple-600"
                />
              </CardContent>
            </Card>
          </motion.div>

          {/* Social Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Social Links</CardTitle>
                    <CardDescription>Connect your social profiles</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => openEditModal("social")}>
                    <Edit2 className="w-4 h-4 mr-2" /> Edit
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <ProfileField 
                  label="Twitter" 
                  value={extendedProfile?.twitter_url || undefined} 
                  icon={Twitter} 
                  onEdit={() => openEditModal("social")}
                  isEmpty={!extendedProfile?.twitter_url}
                />
                <ProfileField 
                  label="LinkedIn" 
                  value={extendedProfile?.linkedin_url || undefined} 
                  icon={Linkedin} 
                  onEdit={() => openEditModal("social")}
                  isEmpty={!extendedProfile?.linkedin_url}
                />
                <ProfileField 
                  label="GitHub" 
                  value={extendedProfile?.github_url || undefined} 
                  icon={Github} 
                  onEdit={() => openEditModal("social")}
                  isEmpty={!extendedProfile?.github_url}
                />
                <ProfileField 
                  label="Instagram" 
                  value={extendedProfile?.instagram_url || undefined} 
                  icon={Instagram} 
                  onEdit={() => openEditModal("social")}
                  isEmpty={!extendedProfile?.instagram_url}
                />
                <ProfileField 
                  label="Resume/CV" 
                  value={extendedProfile?.resume_url || undefined} 
                  icon={FileText} 
                  onEdit={() => openEditModal("social")}
                  isEmpty={!extendedProfile?.resume_url}
                />
              </CardContent>
            </Card>
          </motion.div>

          {/* Coding Profiles */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Coding Profiles</CardTitle>
                    <CardDescription>Your competitive programming profiles</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => openEditModal("coding")}>
                    <Edit2 className="w-4 h-4 mr-2" /> Edit
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <ProfileField 
                  label="LeetCode" 
                  value={extendedProfile?.leetcode_url || undefined} 
                  icon={Code} 
                  onEdit={() => openEditModal("coding")}
                  isEmpty={!extendedProfile?.leetcode_url}
                />
                <ProfileField 
                  label="HackerRank" 
                  value={extendedProfile?.hackerrank_url || undefined} 
                  icon={Code} 
                  onEdit={() => openEditModal("coding")}
                  isEmpty={!extendedProfile?.hackerrank_url}
                />
                <ProfileField 
                  label="CodeForces" 
                  value={extendedProfile?.codeforces_url || undefined} 
                  icon={Code} 
                  onEdit={() => openEditModal("coding")}
                  isEmpty={!extendedProfile?.codeforces_url}
                />
                <ProfileField 
                  label="CodeChef" 
                  value={extendedProfile?.codechef_url || undefined} 
                  icon={Code} 
                  onEdit={() => openEditModal("coding")}
                  isEmpty={!extendedProfile?.codechef_url}
                />
                <ProfileField 
                  label="GeeksForGeeks" 
                  value={extendedProfile?.geeksforgeeks_url || undefined} 
                  icon={Code} 
                  onEdit={() => openEditModal("coding")}
                  isEmpty={!extendedProfile?.geeksforgeeks_url}
                />
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>

      {/* Edit Profile Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Update your profile information. All fields are optional.
            </DialogDescription>
          </DialogHeader>

          <Tabs value={editSection} onValueChange={setEditSection}>
            <TabsList className="grid grid-cols-6 w-full">
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="personal">Personal</TabsTrigger>
              <TabsTrigger value="skills">Skills</TabsTrigger>
              <TabsTrigger value="social">Social</TabsTrigger>
              <TabsTrigger value="coding">Coding</TabsTrigger>
              <TabsTrigger value="goals">Goals</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Username</Label>
                <Input 
                  placeholder="your-username"
                  value={editForm.username || ""}
                  onChange={e => setEditForm(prev => ({ ...prev, username: e.target.value }))}
                  className={validationErrors.username ? "border-destructive" : ""}
                />
                {validationErrors.username ? (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {validationErrors.username}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    This will be your unique identifier. Your public profile will be at /u/{editForm.username || "username"}
                  </p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="personal" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Mobile Number</Label>
                  <Input 
                    placeholder="+91 XXXXX XXXXX"
                    value={editForm.mobile_number || ""}
                    onChange={e => setEditForm(prev => ({ ...prev, mobile_number: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input 
                    placeholder="City, Country"
                    value={editForm.location || ""}
                    onChange={e => setEditForm(prev => ({ ...prev, location: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Bio</Label>
                <Textarea 
                  placeholder="Tell us about yourself..."
                  value={editForm.bio || ""}
                  onChange={e => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Occupation</Label>
                  <Input 
                    placeholder="Software Engineer"
                    value={editForm.occupation || ""}
                    onChange={e => setEditForm(prev => ({ ...prev, occupation: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Website</Label>
                  <Input 
                    placeholder="https://yourwebsite.com"
                    value={editForm.website || ""}
                    onChange={e => setEditForm(prev => ({ ...prev, website: e.target.value }))}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="skills" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div>
                  <Label>Skills</Label>
                  <div className="flex gap-2 mt-2">
                    <Input 
                      placeholder="Add a skill (e.g., React, Python)"
                      value={tempSkill}
                      onChange={e => setTempSkill(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addArrayItem("skills", tempSkill, () => setTempSkill("")))}
                    />
                    <Button type="button" onClick={() => addArrayItem("skills", tempSkill, () => setTempSkill(""))}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {(editForm.skills || []).map((skill, index) => (
                      <Badge key={index} variant="secondary" className="gap-1 pr-1">
                        {skill}
                        <button onClick={() => removeArrayItem("skills", index)} className="ml-1 hover:text-destructive">
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Interests</Label>
                  <div className="flex gap-2 mt-2">
                    <Input 
                      placeholder="Add an interest"
                      value={tempInterest}
                      onChange={e => setTempInterest(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addArrayItem("interests", tempInterest, () => setTempInterest("")))}
                    />
                    <Button type="button" onClick={() => addArrayItem("interests", tempInterest, () => setTempInterest(""))}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {(editForm.interests || []).map((interest, index) => (
                      <Badge key={index} variant="secondary" className="gap-1 pr-1">
                        {interest}
                        <button onClick={() => removeArrayItem("interests", index)} className="ml-1 hover:text-destructive">
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="social" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Twitter className="w-4 h-4" /> Twitter</Label>
                  <Input 
                    placeholder="https://twitter.com/username"
                    value={editForm.twitter_url || ""}
                    onChange={e => setEditForm(prev => ({ ...prev, twitter_url: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Linkedin className="w-4 h-4" /> LinkedIn</Label>
                  <Input 
                    placeholder="https://linkedin.com/in/username"
                    value={editForm.linkedin_url || ""}
                    onChange={e => setEditForm(prev => ({ ...prev, linkedin_url: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Github className="w-4 h-4" /> GitHub</Label>
                  <Input 
                    placeholder="https://github.com/username"
                    value={editForm.github_url || ""}
                    onChange={e => setEditForm(prev => ({ ...prev, github_url: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Instagram className="w-4 h-4" /> Instagram</Label>
                  <Input 
                    placeholder="https://instagram.com/username"
                    value={editForm.instagram_url || ""}
                    onChange={e => setEditForm(prev => ({ ...prev, instagram_url: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><FileText className="w-4 h-4" /> Resume/CV URL</Label>
                <Input 
                  placeholder="https://drive.google.com/your-resume"
                  value={editForm.resume_url || ""}
                  onChange={e => setEditForm(prev => ({ ...prev, resume_url: e.target.value }))}
                />
              </div>
            </TabsContent>

            <TabsContent value="coding" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>LeetCode</Label>
                  <Input 
                    placeholder="https://leetcode.com/username"
                    value={editForm.leetcode_url || ""}
                    onChange={e => setEditForm(prev => ({ ...prev, leetcode_url: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>HackerRank</Label>
                  <Input 
                    placeholder="https://hackerrank.com/username"
                    value={editForm.hackerrank_url || ""}
                    onChange={e => setEditForm(prev => ({ ...prev, hackerrank_url: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>CodeForces</Label>
                  <Input 
                    placeholder="https://codeforces.com/profile/username"
                    value={editForm.codeforces_url || ""}
                    onChange={e => setEditForm(prev => ({ ...prev, codeforces_url: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>CodeChef</Label>
                  <Input 
                    placeholder="https://codechef.com/users/username"
                    value={editForm.codechef_url || ""}
                    onChange={e => setEditForm(prev => ({ ...prev, codechef_url: e.target.value }))}
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>GeeksForGeeks</Label>
                  <Input 
                    placeholder="https://geeksforgeeks.org/user/username"
                    value={editForm.geeksforgeeks_url || ""}
                    onChange={e => setEditForm(prev => ({ ...prev, geeksforgeeks_url: e.target.value }))}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="goals" className="space-y-4 mt-4">
              <div>
                <Label>Aspirations</Label>
                <div className="flex gap-2 mt-2">
                  <Input 
                    placeholder="What do you aspire to achieve?"
                    value={tempAspiration}
                    onChange={e => setTempAspiration(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addArrayItem("aspirations", tempAspiration, () => setTempAspiration("")))}
                  />
                  <Button type="button" onClick={() => addArrayItem("aspirations", tempAspiration, () => setTempAspiration(""))}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {(editForm.aspirations || []).map((aspiration, index) => (
                    <Badge key={index} variant="secondary" className="gap-1 pr-1">
                      {aspiration}
                      <button onClick={() => removeArrayItem("aspirations", index)} className="ml-1 hover:text-destructive">
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label>Goals</Label>
                <div className="flex gap-2 mt-2">
                  <Input 
                    placeholder="Add a goal"
                    value={tempGoal}
                    onChange={e => setTempGoal(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addArrayItem("goals", tempGoal, () => setTempGoal("")))}
                  />
                  <Button type="button" onClick={() => addArrayItem("goals", tempGoal, () => setTempGoal(""))}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {(editForm.goals || []).map((goal, index) => (
                    <Badge key={index} variant="secondary" className="gap-1 pr-1">
                      {goal}
                      <button onClick={() => removeArrayItem("goals", index)} className="ml-1 hover:text-destructive">
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveProfile} disabled={isSaving} className="gap-2">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DashboardProfile;
