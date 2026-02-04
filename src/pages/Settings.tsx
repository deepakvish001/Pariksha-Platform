import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  User,
  Lock,
  Bell,
  Shield,
  Eye,
  EyeOff,
  Check,
  Camera,
  Phone,
  GraduationCap,
  Briefcase,
  Target,
  Trash2,
  AlertTriangle,
  Sun,
  Moon,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import PasswordStrengthIndicator from "@/components/PasswordStrengthIndicator";

interface ExtendedProfile {
  id: string;
  user_type: string;
  current_experience?: string;
  target_goal?: string;
  college_name?: string;
  course_name?: string;
  branch?: string;
  study_year?: string;
  company_name?: string;
  role?: string;
  experience?: string;
  mobile_number?: string;
  interested_features?: string[];
  email_notifications_enabled?: boolean;
  marketing_emails_enabled?: boolean;
  weekly_digest_enabled?: boolean;
  new_feature_alerts_enabled?: boolean;
}

const experienceOptions = [
  { value: "student", label: "Student (College/University)", type: "student" },
  { value: "recent_graduate", label: "Recent Graduate (0-1 years)", type: "professional" },
  { value: "working_professional_1_3", label: "Working Professional (1-3 years)", type: "professional" },
  { value: "mid_level", label: "Mid-level Developer (3-5 years)", type: "professional" },
  { value: "senior", label: "Senior Developer (5-8 years)", type: "professional" },
  { value: "tech_lead", label: "Tech Lead/Manager (8+ years)", type: "professional" },
  { value: "career_switcher", label: "Career Switcher (Non-tech background)", type: "professional" },
  { value: "freelancer", label: "Freelancer/Contractor", type: "other" },
  { value: "entrepreneur", label: "Entrepreneur/Founder", type: "other" },
];

const goalOptions = [
  { value: "find_jobs", label: "To find new jobs" },
  { value: "learn_skills", label: "Learn new skills" },
  { value: "build_projects", label: "Build personal projects" },
  { value: "start_business", label: "Start a business" },
  { value: "advance_career", label: "Advance current career" },
  { value: "switch_careers", label: "Switch career paths" },
  { value: "freelancing", label: "Freelancing opportunities" },
  { value: "academic", label: "Academic purposes" },
  { value: "hobby", label: "Hobby/Personal interest" },
];

const yearOptions = [
  { value: "1st Year", label: "1st Year" },
  { value: "2nd Year", label: "2nd Year" },
  { value: "3rd Year", label: "3rd Year" },
  { value: "4th Year", label: "4th Year" },
  { value: "5th Year", label: "5th Year" },
  { value: "Other", label: "Other" },
];

const featureOptions = [
  { id: "quiz", title: "Quiz" },
  { id: "dsa", title: "DSA" },
  { id: "aptitude", title: "Aptitude" },
  { id: "interview_questions", title: "Interview Questions" },
  { id: "cs_questions", title: "CS Questions" },
  { id: "handwritten_notes", title: "Notes" },
  { id: "projects", title: "Projects" },
  { id: "cold_dms", title: "Cold DMs" },
  { id: "job_portals", title: "Job Portals" },
  { id: "roadmap", title: "Roadmap" },
  { id: "interview_copilot", title: "Interview Copilot" },
  { id: "companies", title: "Companies" },
];

// Phone validation
const validatePhoneNumber = (phone: string): boolean => {
  if (!phone) return true;
  const cleaned = phone.replace(/[\s\-\(\)]/g, "");
  const indianPhoneRegex = /^(\+91|91)?[6-9]\d{9}$/;
  const internationalRegex = /^\+?[1-9]\d{6,14}$/;
  return indianPhoneRegex.test(cleaned) || internationalRegex.test(cleaned);
};

const formatPhoneNumber = (value: string): string => {
  const cleaned = value.replace(/[^\d+]/g, "");
  if (cleaned.startsWith("+91") && cleaned.length > 3) {
    const rest = cleaned.slice(3);
    if (rest.length <= 5) return `+91 ${rest}`;
    return `+91 ${rest.slice(0, 5)} ${rest.slice(5, 10)}`;
  }
  if (cleaned.startsWith("91") && cleaned.length > 2 && !cleaned.startsWith("+")) {
    const rest = cleaned.slice(2);
    if (rest.length <= 5) return `+91 ${rest}`;
    return `+91 ${rest.slice(0, 5)} ${rest.slice(5, 10)}`;
  }
  if (/^[6-9]/.test(cleaned) && cleaned.length <= 10) {
    if (cleaned.length <= 5) return cleaned;
    return `${cleaned.slice(0, 5)} ${cleaned.slice(5, 10)}`;
  }
  return cleaned;
};

const Settings = () => {
  const { user, profile, signOut, updateProfile } = useAuth();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile state
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || "");
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Extended profile state
  const [extendedProfile, setExtendedProfile] = useState<ExtendedProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [editForm, setEditForm] = useState({
    mobile_number: "",
    current_experience: "",
    target_goal: "",
    college_name: "",
    course_name: "",
    branch: "",
    study_year: "",
    company_name: "",
    role: "",
    experience: "",
    interested_features: [] as string[],
    email_notifications_enabled: true,
    marketing_emails_enabled: false,
    weekly_digest_enabled: true,
    new_feature_alerts_enabled: true,
  });
  const [phoneError, setPhoneError] = useState("");
  const [isSavingExtended, setIsSavingExtended] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isOAuthUser, setIsOAuthUser] = useState(false);

  // Delete account state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Check if user signed up with OAuth
  useEffect(() => {
    const checkAuthProvider = async () => {
      if (user) {
        const { data } = await supabase.auth.getUser();
        const identities = data.user?.identities || [];
        const hasOAuth = identities.some((id) => id.provider !== "email");
        setIsOAuthUser(hasOAuth && identities.length === 1);
      }
    };
    checkAuthProvider();
  }, [user]);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setAvatarUrl(profile.avatar_url || "");
    }
  }, [profile]);

  useEffect(() => {
    const fetchExtendedProfile = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from("user_profiles_extended")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!error && data) {
        setExtendedProfile(data as ExtendedProfile);
        setEditForm({
          mobile_number: data.mobile_number || "",
          current_experience: data.current_experience || "",
          target_goal: data.target_goal || "",
          college_name: data.college_name || "",
          course_name: data.course_name || "",
          branch: data.branch || "",
          study_year: data.study_year || "",
          company_name: data.company_name || "",
          role: data.role || "",
          experience: data.experience || "",
          interested_features: data.interested_features || [],
          email_notifications_enabled: data.email_notifications_enabled ?? true,
          marketing_emails_enabled: data.marketing_emails_enabled ?? false,
          weekly_digest_enabled: data.weekly_digest_enabled ?? true,
          new_feature_alerts_enabled: data.new_feature_alerts_enabled ?? true,
        });
      }
      setLoadingProfile(false);
    };

    fetchExtendedProfile();
  }, [user]);

  const getInitials = (name: string | null | undefined) => {
    if (!name) return user?.email?.charAt(0).toUpperCase() || "U";
    return name.split(" ").map((n) => n.charAt(0)).join("").toUpperCase().slice(0, 2);
  };

  const getUserTypeFromExperience = (exp: string) => {
    const option = experienceOptions.find((o) => o.value === exp);
    return option?.type || "other";
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      toast({ variant: "destructive", title: "Please select an image file" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ variant: "destructive", title: "Image must be less than 5MB" });
      return;
    }

    setIsUploadingAvatar(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(fileName);
      const newAvatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: newAvatarUrl })
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      setAvatarUrl(newAvatarUrl);
      toast({ title: "Avatar updated!" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Upload failed", description: error.message });
    }

    setIsUploadingAvatar(false);
  };

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    const { error } = await updateProfile({ full_name: fullName });

    if (error) {
      toast({ variant: "destructive", title: "Update failed", description: error.message });
    } else {
      toast({ title: "Profile updated" });
    }
    setIsSavingProfile(false);
  };

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhoneNumber(value);
    setEditForm((prev) => ({ ...prev, mobile_number: formatted }));
    setPhoneError("");
  };

  const toggleFeature = (featureId: string) => {
    setEditForm((prev) => ({
      ...prev,
      interested_features: prev.interested_features.includes(featureId)
        ? prev.interested_features.filter((id) => id !== featureId)
        : [...prev.interested_features, featureId],
    }));
  };

  const handleSaveExtendedProfile = async () => {
    if (!user || !extendedProfile) return;

    if (editForm.mobile_number && !validatePhoneNumber(editForm.mobile_number)) {
      setPhoneError("Please enter a valid phone number");
      return;
    }

    setIsSavingExtended(true);

    const userType = getUserTypeFromExperience(editForm.current_experience);
    const cleanedPhone = editForm.mobile_number.replace(/[\s\-\(\)]/g, "");

    const { error } = await supabase
      .from("user_profiles_extended")
      .update({
        mobile_number: cleanedPhone || null,
        current_experience: editForm.current_experience || null,
        target_goal: editForm.target_goal || null,
        user_type: userType as "student" | "professional" | "other",
        college_name: userType === "student" ? editForm.college_name : null,
        course_name: userType === "student" ? editForm.course_name : null,
        branch: userType === "student" ? editForm.branch : null,
        study_year: userType === "student" ? (editForm.study_year as any) : null,
        company_name: userType === "professional" ? editForm.company_name : null,
        role: userType === "professional" ? editForm.role : null,
        experience: userType === "professional" ? editForm.experience : null,
        interested_features: editForm.interested_features,
        email_notifications_enabled: editForm.email_notifications_enabled,
        marketing_emails_enabled: editForm.marketing_emails_enabled,
        weekly_digest_enabled: editForm.weekly_digest_enabled,
        new_feature_alerts_enabled: editForm.new_feature_alerts_enabled,
      })
      .eq("id", extendedProfile.id);

    if (error) {
      toast({ variant: "destructive", title: "Update failed", description: error.message });
    } else {
      const { data } = await supabase
        .from("user_profiles_extended")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data) setExtendedProfile(data as ExtendedProfile);
      toast({ title: "Settings saved" });
    }

    setIsSavingExtended(false);
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({ variant: "destructive", title: "Passwords don't match" });
      return;
    }

    if (newPassword.length < 6) {
      toast({ variant: "destructive", title: "Password must be at least 6 characters" });
      return;
    }

    setIsChangingPassword(true);

    try {
      // First verify current password by signing in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || "",
        password: currentPassword,
      });

      if (signInError) {
        toast({ variant: "destructive", title: "Current password is incorrect" });
        setIsChangingPassword(false);
        return;
      }

      // Update password
      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) {
        toast({ variant: "destructive", title: "Failed to update password", description: error.message });
      } else {
        toast({ title: "Password changed successfully" });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }

    setIsChangingPassword(false);
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") return;

    setIsDeleting(true);

    try {
      if (user) {
        await supabase.from("user_profiles_extended").delete().eq("user_id", user.id);
        await supabase.from("profiles").delete().eq("user_id", user.id);

        if (avatarUrl) {
          await supabase.storage
            .from("avatars")
            .remove([`${user.id}/avatar.jpg`, `${user.id}/avatar.png`, `${user.id}/avatar.webp`]);
        }
      }

      await signOut();
      toast({ title: "Account deleted", description: "Your account and data have been removed." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Deletion failed", description: error.message });
    }

    setIsDeleting(false);
    setIsDeleteDialogOpen(false);
    setDeleteConfirmText("");
  };

  const currentUserType = getUserTypeFromExperience(editForm.current_experience);

  return (
    <div className="min-h-screen bg-background">
      <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} accept="image/*" className="hidden" />

      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-lg sticky top-0 z-50">
        <div className="flex items-center justify-between h-16 px-6">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <h1 className="text-xl font-bold text-foreground">Settings</h1>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
            {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="section-container py-8 max-w-4xl mx-auto">
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="account" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Account</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              {/* Basic Info */}
              <div className="card-dark space-y-6">
                <h2 className="text-lg font-semibold">Basic Information</h2>

                <div className="flex items-center gap-6">
                  <div className="relative group">
                    <Avatar className="w-20 h-20 border-4 border-primary/20">
                      <AvatarImage src={avatarUrl || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                        {getInitials(profile?.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingAvatar}
                      className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      {isUploadingAvatar ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Camera className="w-5 h-5 text-white" />
                      )}
                    </button>
                  </div>
                  <div className="flex-1 space-y-2">
                    <Label>Full Name</Label>
                    <div className="flex gap-2">
                      <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" />
                      <Button onClick={handleSaveProfile} disabled={isSavingProfile}>
                        {isSavingProfile ? (
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={user?.email || ""} disabled className="bg-muted" />
                  <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                </div>

                <div className="space-y-2">
                  <Label>Mobile Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="tel"
                      value={editForm.mobile_number}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      placeholder="+91 98765 43210"
                      className={cn("pl-10", phoneError && "border-destructive")}
                    />
                  </div>
                  {phoneError && <p className="text-sm text-destructive">{phoneError}</p>}
                </div>
              </div>

              {/* Professional Info */}
              <div className="card-dark space-y-6">
                <h2 className="text-lg font-semibold">Professional Details</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Experience Level</Label>
                    <Select
                      value={editForm.current_experience}
                      onValueChange={(v) => setEditForm((prev) => ({ ...prev, current_experience: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select experience" />
                      </SelectTrigger>
                      <SelectContent>
                        {experienceOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Primary Goal</Label>
                    <Select
                      value={editForm.target_goal}
                      onValueChange={(v) => setEditForm((prev) => ({ ...prev, target_goal: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select goal" />
                      </SelectTrigger>
                      <SelectContent>
                        {goalOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {currentUserType === "student" && (
                  <div className="space-y-4 p-4 rounded-lg border border-primary/20 bg-primary/5">
                    <div className="flex items-center gap-2 text-primary text-sm font-medium">
                      <GraduationCap className="w-4 h-4" /> Academic Details
                    </div>
                    <div className="space-y-2">
                      <Label>College/University</Label>
                      <Input
                        value={editForm.college_name}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, college_name: e.target.value }))}
                        placeholder="e.g., IIT Delhi"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-2">
                        <Label>Course</Label>
                        <Input
                          value={editForm.course_name}
                          onChange={(e) => setEditForm((prev) => ({ ...prev, course_name: e.target.value }))}
                          placeholder="B.Tech"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Branch</Label>
                        <Input
                          value={editForm.branch}
                          onChange={(e) => setEditForm((prev) => ({ ...prev, branch: e.target.value }))}
                          placeholder="CSE"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Year</Label>
                        <Select
                          value={editForm.study_year}
                          onValueChange={(v) => setEditForm((prev) => ({ ...prev, study_year: v }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Year" />
                          </SelectTrigger>
                          <SelectContent>
                            {yearOptions.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}

                {currentUserType === "professional" && (
                  <div className="space-y-4 p-4 rounded-lg border border-primary/20 bg-primary/5">
                    <div className="flex items-center gap-2 text-primary text-sm font-medium">
                      <Briefcase className="w-4 h-4" /> Professional Details
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-2">
                        <Label>Company</Label>
                        <Input
                          value={editForm.company_name}
                          onChange={(e) => setEditForm((prev) => ({ ...prev, company_name: e.target.value }))}
                          placeholder="Google"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Role</Label>
                        <Input
                          value={editForm.role}
                          onChange={(e) => setEditForm((prev) => ({ ...prev, role: e.target.value }))}
                          placeholder="SDE"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Experience</Label>
                        <Select
                          value={editForm.experience}
                          onValueChange={(v) => setEditForm((prev) => ({ ...prev, experience: v }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Years" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0-1 years">0-1 years</SelectItem>
                            <SelectItem value="1-3 years">1-3 years</SelectItem>
                            <SelectItem value="3-5 years">3-5 years</SelectItem>
                            <SelectItem value="5-10 years">5-10 years</SelectItem>
                            <SelectItem value="10+ years">10+ years</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Interests */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-primary" />
                    <Label>Interested Features</Label>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {featureOptions.map((feature) => (
                      <label
                        key={feature.id}
                        className={cn(
                          "flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all",
                          editForm.interested_features.includes(feature.id)
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-muted-foreground/50"
                        )}
                      >
                        <Checkbox
                          checked={editForm.interested_features.includes(feature.id)}
                          onCheckedChange={() => toggleFeature(feature.id)}
                        />
                        <span className="text-sm font-medium">{feature.title}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <Button onClick={handleSaveExtendedProfile} disabled={isSavingExtended} className="w-full">
                  {isSavingExtended ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  ) : (
                    <Check className="w-4 h-4 mr-2" />
                  )}
                  Save Profile Changes
                </Button>
              </div>
            </motion.div>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="card-dark space-y-6">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  Change Password
                </h2>

                {isOAuthUser ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Lock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>You signed in with Google.</p>
                    <p className="text-sm">Password management is handled by your Google account.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="currentPassword"
                          type={showCurrentPassword ? "text" : "password"}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="••••••••"
                          className="pl-10 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="newPassword"
                          type={showNewPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="••••••••"
                          className="pl-10 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <PasswordStrengthIndicator password={newPassword} />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                          className="pl-10 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <Button
                      onClick={handleChangePassword}
                      disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
                      className="w-full"
                    >
                      {isChangingPassword ? (
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                      ) : (
                        <Lock className="w-4 h-4 mr-2" />
                      )}
                      Change Password
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="card-dark space-y-6">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Email Preferences
                </h2>

                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive important updates via email</p>
                    </div>
                    <Switch
                      checked={editForm.email_notifications_enabled}
                      onCheckedChange={(v) => setEditForm((prev) => ({ ...prev, email_notifications_enabled: v }))}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Weekly Digest</Label>
                      <p className="text-sm text-muted-foreground">Get a summary of your progress every week</p>
                    </div>
                    <Switch
                      checked={editForm.weekly_digest_enabled}
                      onCheckedChange={(v) => setEditForm((prev) => ({ ...prev, weekly_digest_enabled: v }))}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">New Feature Alerts</Label>
                      <p className="text-sm text-muted-foreground">Be the first to know about new features</p>
                    </div>
                    <Switch
                      checked={editForm.new_feature_alerts_enabled}
                      onCheckedChange={(v) => setEditForm((prev) => ({ ...prev, new_feature_alerts_enabled: v }))}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Marketing Emails</Label>
                      <p className="text-sm text-muted-foreground">Receive promotional content and offers</p>
                    </div>
                    <Switch
                      checked={editForm.marketing_emails_enabled}
                      onCheckedChange={(v) => setEditForm((prev) => ({ ...prev, marketing_emails_enabled: v }))}
                    />
                  </div>
                </div>

                <Button onClick={handleSaveExtendedProfile} disabled={isSavingExtended} className="w-full">
                  {isSavingExtended ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  ) : (
                    <Check className="w-4 h-4 mr-2" />
                  )}
                  Save Notification Preferences
                </Button>
              </div>
            </motion.div>
          </TabsContent>

          {/* Account Tab */}
          <TabsContent value="account">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="card-dark space-y-6">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Account Management
                </h2>

                <div className="space-y-4">
                  <div className="p-4 rounded-lg border border-border bg-muted/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Account Status</p>
                        <p className="text-sm text-muted-foreground">Your account is active and in good standing</p>
                      </div>
                      <div className="px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-sm font-medium">
                        Active
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg border border-border bg-muted/50">
                    <p className="font-medium">Member Since</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(profile?.created_at || Date.now()).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-destructive font-medium flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Danger Zone
                  </h3>

                  <div className="p-4 rounded-lg border border-destructive/20 bg-destructive/5">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-medium">Delete Account</p>
                        <p className="text-sm text-muted-foreground">
                          Permanently delete your account and all associated data
                        </p>
                      </div>
                      <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Delete Account Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
          setIsDeleteDialogOpen(open);
          if (!open) setDeleteConfirmText("");
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Delete Account
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                This action is <strong>permanent and cannot be undone</strong>. All your data, including your profile,
                preferences, and progress will be permanently deleted.
              </p>
              <p>
                To confirm, type <strong>DELETE</strong> below:
              </p>
              <Input
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Type DELETE to confirm"
                className="mt-2"
              />
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={deleteConfirmText !== "DELETE" || isDeleting}
            >
              {isDeleting ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Delete My Account
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Settings;
