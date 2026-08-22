import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Camera,
  Phone,
  GraduationCap,
  Briefcase,
  Target,
  Check,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import SettingsCard from "./SettingsCard";

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
  
  { id: "interview_copilot", title: "Interview Copilot" },
  { id: "companies", title: "Companies" },
];

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

const SettingsProfileTab = () => {
  const { user, profile, updateProfile } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || "");
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [extendedProfile, setExtendedProfile] = useState<ExtendedProfile | null>(null);
  const [phoneError, setPhoneError] = useState("");
  const [isSavingExtended, setIsSavingExtended] = useState(false);
  const [showSavedIndicator, setShowSavedIndicator] = useState(false);

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
  });

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
        });
      }
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
      setShowSavedIndicator(true);
      setTimeout(() => setShowSavedIndicator(false), 2000);
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
      toast({ title: "Profile saved successfully" });
    }

    setIsSavingExtended(false);
  };

  const currentUserType = getUserTypeFromExperience(editForm.current_experience);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-6"
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleAvatarUpload}
        accept="image/*"
        className="hidden"
      />

      {/* Basic Info Card */}
      <SettingsCard delay={0}>
        <div className="flex items-center gap-2 mb-6">
          <div className="p-2 rounded-lg bg-primary/10">
            <User className="w-4 h-4 text-primary" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">Basic Information</h2>
        </div>

        <div className="space-y-6">
          {/* Avatar Section */}
          <div className="flex items-center gap-6">
            <div className="relative group">
              {/* Glow ring */}
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/40 to-purple-500/40 rounded-full blur-md opacity-60 group-hover:opacity-100 transition-opacity" />
              <Avatar className="relative w-20 h-20 border-2 border-border">
                <AvatarImage src={avatarUrl || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                  {getInitials(profile?.full_name)}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingAvatar}
                className="absolute inset-0 flex items-center justify-center bg-background/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                {isUploadingAvatar ? (
                  <Loader2 className="w-5 h-5 text-foreground animate-spin" />
                ) : (
                  <Camera className="w-5 h-5 text-foreground" />
                )}
              </button>
            </div>
            <div className="flex-1 space-y-2">
              <Label className="text-muted-foreground">Full Name</Label>
              <div className="flex gap-2">
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your name"
                  className="bg-secondary/50 border-border"
                />
                <Button
                  onClick={handleSaveProfile}
                  disabled={isSavingProfile}
                  size="icon"
                  aria-label={isSavingProfile ? "Saving name" : showSavedIndicator ? "Name saved" : "Save name"}
                  className="shrink-0"
                >
                  {isSavingProfile ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : showSavedIndicator ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="text-green-500"
                    >
                      <Check className="w-4 h-4" />
                    </motion.div>
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label className="text-muted-foreground">Email</Label>
            <Input
              value={user?.email || ""}
              disabled
              className="bg-muted border-border"
            />
            <p className="text-xs text-muted-foreground">Email cannot be changed</p>
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label className="text-muted-foreground">Mobile Number</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="tel"
                value={editForm.mobile_number}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="+91 98765 43210"
                className={cn(
                  "pl-10 bg-secondary/50 border-border",
                  phoneError && "border-destructive"
                )}
              />
            </div>
            {phoneError && <p className="text-sm text-destructive">{phoneError}</p>}
          </div>
        </div>
      </SettingsCard>

      {/* Professional Details Card */}
      <SettingsCard delay={0.05}>
        <div className="flex items-center gap-2 mb-6">
          <div className="p-2 rounded-lg bg-blue-500/10">
            <Briefcase className="w-4 h-4 text-blue-500" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">Professional Details</h2>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground">Experience Level</Label>
              <Select
                value={editForm.current_experience}
                onValueChange={(v) => setEditForm((prev) => ({ ...prev, current_experience: v }))}
              >
                <SelectTrigger className="bg-secondary/50 border-border">
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
              <Label className="text-muted-foreground">Primary Goal</Label>
              <Select
                value={editForm.target_goal}
                onValueChange={(v) => setEditForm((prev) => ({ ...prev, target_goal: v }))}
              >
                <SelectTrigger className="bg-secondary/50 border-border">
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

          {/* Student Section */}
          <AnimatePresence mode="wait">
            {currentUserType === "student" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4 p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5"
              >
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
                  <GraduationCap className="w-4 h-4" /> Academic Details
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">College/University</Label>
                  <Input
                    value={editForm.college_name}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, college_name: e.target.value }))}
                    placeholder="e.g., IIT Delhi"
                    className="bg-secondary/50 border-border"
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Course</Label>
                    <Input
                      value={editForm.course_name}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, course_name: e.target.value }))}
                      placeholder="B.Tech"
                      className="bg-secondary/50 border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Branch</Label>
                    <Input
                      value={editForm.branch}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, branch: e.target.value }))}
                      placeholder="CSE"
                      className="bg-secondary/50 border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Year</Label>
                    <Select
                      value={editForm.study_year}
                      onValueChange={(v) => setEditForm((prev) => ({ ...prev, study_year: v }))}
                    >
                      <SelectTrigger className="bg-secondary/50 border-border">
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
              </motion.div>
            )}

            {currentUserType === "professional" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4 p-4 rounded-xl border border-blue-500/20 bg-blue-500/5"
              >
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-sm font-medium">
                  <Briefcase className="w-4 h-4" /> Work Details
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Company</Label>
                    <Input
                      value={editForm.company_name}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, company_name: e.target.value }))}
                      placeholder="Google"
                      className="bg-secondary/50 border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Role</Label>
                    <Input
                      value={editForm.role}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, role: e.target.value }))}
                      placeholder="SDE"
                      className="bg-secondary/50 border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Experience</Label>
                    <Select
                      value={editForm.experience}
                      onValueChange={(v) => setEditForm((prev) => ({ ...prev, experience: v }))}
                    >
                      <SelectTrigger className="bg-secondary/50 border-border">
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
              </motion.div>
            )}
          </AnimatePresence>

          {/* Interests */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              <Label className="text-muted-foreground">Interested Features</Label>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {featureOptions.map((feature) => (
                <motion.label
                  key={feature.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    "flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all",
                    editForm.interested_features.includes(feature.id)
                      ? "border-primary/50 bg-primary/10"
                      : "border-border bg-secondary/30 hover:border-primary/30"
                  )}
                >
                  <Checkbox
                    checked={editForm.interested_features.includes(feature.id)}
                    onCheckedChange={() => toggleFeature(feature.id)}
                  />
                  <span className="text-sm font-medium text-foreground">{feature.title}</span>
                </motion.label>
              ))}
            </div>
          </div>

          <Button
            onClick={handleSaveExtendedProfile}
            disabled={isSavingExtended}
            className="w-full"
          >
            {isSavingExtended ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Check className="w-4 h-4 mr-2" />
            )}
            Save Profile Changes
          </Button>
        </div>
      </SettingsCard>
    </motion.div>
  );
};

export default SettingsProfileTab;
