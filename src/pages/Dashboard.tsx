import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { 
  User, 
  LogOut, 
  Settings, 
  BookOpen, 
  Trophy, 
  Clock, 
  TrendingUp,
  Edit2,
  Check,
  X,
  Sun,
  Moon,
  GraduationCap,
  Briefcase,
  Building2,
  Phone,
  Target,
  Sparkles,
  Calendar
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

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
  referral_source?: string;
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

const experienceLabels: Record<string, string> = {
  student: "Student",
  recent_graduate: "Recent Graduate",
  working_professional_1_3: "Working Professional (1-3 yrs)",
  mid_level: "Mid-level Developer",
  senior: "Senior Developer",
  tech_lead: "Tech Lead/Manager",
  career_switcher: "Career Switcher",
  freelancer: "Freelancer",
  entrepreneur: "Entrepreneur",
};

const goalLabels: Record<string, string> = {
  find_jobs: "Find new jobs",
  learn_skills: "Learn new skills",
  build_projects: "Build projects",
  start_business: "Start a business",
  advance_career: "Advance career",
  switch_careers: "Switch careers",
  freelancing: "Freelancing",
  academic: "Academic",
  hobby: "Hobby/Personal",
};

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

const Dashboard = () => {
  const { user, profile, signOut, updateProfile } = useAuth();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(profile?.full_name || "");
  const [isUpdating, setIsUpdating] = useState(false);
  const [extendedProfile, setExtendedProfile] = useState<ExtendedProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  
  // Edit profile modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
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
  });
  const [phoneError, setPhoneError] = useState("");
  const [isSavingExtended, setIsSavingExtended] = useState(false);

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
        // Pre-fill edit form
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
        });
      }
      setLoadingProfile(false);
    };

    fetchExtendedProfile();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed out",
      description: "You've been successfully signed out.",
    });
  };

  const handleSaveProfile = async () => {
    setIsUpdating(true);
    const { error } = await updateProfile({ full_name: editName });
    
    if (error) {
      toast({
        variant: "destructive",
        title: "Update failed",
        description: error.message,
      });
    } else {
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
      setIsEditing(false);
    }
    setIsUpdating(false);
  };

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhoneNumber(value);
    setEditForm(prev => ({ ...prev, mobile_number: formatted }));
    setPhoneError("");
  };

  const getUserTypeFromExperience = (exp: string) => {
    const option = experienceOptions.find(o => o.value === exp);
    return option?.type || "other";
  };

  const handleSaveExtendedProfile = async () => {
    if (!user || !extendedProfile) return;

    // Validate phone
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
        study_year: userType === "student" ? editForm.study_year as any : null,
        company_name: userType === "professional" ? editForm.company_name : null,
        role: userType === "professional" ? editForm.role : null,
        experience: userType === "professional" ? editForm.experience : null,
      })
      .eq("id", extendedProfile.id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Update failed",
        description: error.message,
      });
    } else {
      // Refresh profile
      const { data } = await supabase
        .from("user_profiles_extended")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (data) {
        setExtendedProfile(data as ExtendedProfile);
      }

      toast({
        title: "Profile updated",
        description: "Your extended profile has been updated.",
      });
      setIsEditModalOpen(false);
    }

    setIsSavingExtended(false);
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return user?.email?.charAt(0).toUpperCase() || "U";
    return name
      .split(" ")
      .map((n) => n.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getUserTypeIcon = () => {
    if (extendedProfile?.user_type === "student") return GraduationCap;
    if (extendedProfile?.user_type === "professional") return Briefcase;
    return User;
  };

  const UserTypeIcon = getUserTypeIcon();
  const currentUserType = getUserTypeFromExperience(editForm.current_experience);

  const stats = [
    { label: "Courses", value: "12", icon: BookOpen, color: "text-blue-500" },
    { label: "Achievements", value: "28", icon: Trophy, color: "text-yellow-500" },
    { label: "Study Hours", value: "156", icon: Clock, color: "text-green-500" },
    { label: "Progress", value: "78%", icon: TrendingUp, color: "text-primary" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-lg sticky top-0 z-50">
        <div className="section-container flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-orange flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">U</span>
            </div>
            <span className="text-xl font-bold text-foreground">UniDash</span>
          </Link>

          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
            <Button variant="ghost" size="icon">
              <Settings className="w-5 h-5" />
            </Button>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="section-container py-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome back, {profile?.full_name?.split(" ")[0] || "there"}! 👋
          </h1>
          <p className="text-muted-foreground">
            Here's an overview of your learning progress
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-1 space-y-6"
          >
            {/* Basic Profile */}
            <div className="card-dark">
              <div className="flex flex-col items-center text-center">
                <Avatar className="w-24 h-24 mb-4 border-4 border-primary/20">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                    {getInitials(profile?.full_name)}
                  </AvatarFallback>
                </Avatar>

                {isEditing ? (
                  <div className="w-full space-y-3">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Your name"
                      className="text-center"
                    />
                    <div className="flex justify-center gap-2">
                      <Button
                        size="sm"
                        onClick={handleSaveProfile}
                        disabled={isUpdating}
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setIsEditing(false);
                          setEditName(profile?.full_name || "");
                        }}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-xl font-bold text-foreground">
                        {profile?.full_name || "Set your name"}
                      </h2>
                      <button
                        onClick={() => {
                          setIsEditing(true);
                          setEditName(profile?.full_name || "");
                        }}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-muted-foreground text-sm">{user?.email}</p>
                    
                    {extendedProfile && (
                      <Badge variant="secondary" className="mt-2">
                        <UserTypeIcon className="w-3 h-3 mr-1" />
                        {extendedProfile.user_type === "student" ? "Student" : 
                         extendedProfile.user_type === "professional" ? "Professional" : "Other"}
                      </Badge>
                    )}
                  </>
                )}

                <div className="w-full border-t border-border mt-6 pt-6">
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <User className="w-4 h-4" />
                    <span>Member since {new Date(profile?.created_at || Date.now()).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Extended Profile Info */}
            {!loadingProfile && extendedProfile && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="card-dark space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    Profile Details
                  </h3>
                  <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8">
                        <Edit2 className="w-3.5 h-3.5 mr-1" />
                        Edit
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Edit Profile Details</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        {/* Mobile Number */}
                        <div className="space-y-2">
                          <Label>Mobile Number</Label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              type="tel"
                              value={editForm.mobile_number}
                              onChange={(e) => handlePhoneChange(e.target.value)}
                              placeholder="+91 98765 43210"
                              className={cn("pl-9", phoneError && "border-destructive")}
                            />
                          </div>
                          {phoneError && (
                            <p className="text-sm text-destructive">{phoneError}</p>
                          )}
                        </div>

                        {/* Experience */}
                        <div className="space-y-2">
                          <Label>Current Experience</Label>
                          <Select 
                            value={editForm.current_experience} 
                            onValueChange={(v) => setEditForm(prev => ({ ...prev, current_experience: v }))}
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

                        {/* Goal */}
                        <div className="space-y-2">
                          <Label>Target Goal</Label>
                          <Select 
                            value={editForm.target_goal} 
                            onValueChange={(v) => setEditForm(prev => ({ ...prev, target_goal: v }))}
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

                        {/* Student Fields */}
                        {currentUserType === "student" && (
                          <div className="space-y-4 p-4 rounded-lg border border-primary/20 bg-primary/5">
                            <div className="flex items-center gap-2 text-primary text-sm font-medium">
                              <GraduationCap className="w-4 h-4" />
                              Academic Details
                            </div>
                            
                            <div className="space-y-2">
                              <Label>College/University</Label>
                              <Input
                                value={editForm.college_name}
                                onChange={(e) => setEditForm(prev => ({ ...prev, college_name: e.target.value }))}
                                placeholder="e.g., IIT Delhi"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-2">
                                <Label>Course</Label>
                                <Input
                                  value={editForm.course_name}
                                  onChange={(e) => setEditForm(prev => ({ ...prev, course_name: e.target.value }))}
                                  placeholder="e.g., B.Tech"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Branch</Label>
                                <Input
                                  value={editForm.branch}
                                  onChange={(e) => setEditForm(prev => ({ ...prev, branch: e.target.value }))}
                                  placeholder="e.g., CSE"
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label>Year of Study</Label>
                              <Select 
                                value={editForm.study_year} 
                                onValueChange={(v) => setEditForm(prev => ({ ...prev, study_year: v }))}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select year" />
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
                        )}

                        {/* Professional Fields */}
                        {currentUserType === "professional" && (
                          <div className="space-y-4 p-4 rounded-lg border border-primary/20 bg-primary/5">
                            <div className="flex items-center gap-2 text-primary text-sm font-medium">
                              <Briefcase className="w-4 h-4" />
                              Professional Details
                            </div>
                            
                            <div className="space-y-2">
                              <Label>Company</Label>
                              <Input
                                value={editForm.company_name}
                                onChange={(e) => setEditForm(prev => ({ ...prev, company_name: e.target.value }))}
                                placeholder="e.g., Google"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-2">
                                <Label>Role</Label>
                                <Input
                                  value={editForm.role}
                                  onChange={(e) => setEditForm(prev => ({ ...prev, role: e.target.value }))}
                                  placeholder="e.g., Software Engineer"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Experience</Label>
                                <Select 
                                  value={editForm.experience} 
                                  onValueChange={(v) => setEditForm(prev => ({ ...prev, experience: v }))}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select" />
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

                        <div className="flex justify-end gap-3 pt-4">
                          <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleSaveExtendedProfile} disabled={isSavingExtended}>
                            {isSavingExtended ? (
                              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                            ) : (
                              <Check className="w-4 h-4 mr-2" />
                            )}
                            Save Changes
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="space-y-3 text-sm">
                  {/* Experience Level */}
                  {extendedProfile.current_experience && (
                    <div className="flex items-start gap-3">
                      <UserTypeIcon className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-muted-foreground text-xs">Experience</p>
                        <p className="text-foreground">
                          {experienceLabels[extendedProfile.current_experience] || extendedProfile.current_experience}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Goal */}
                  {extendedProfile.target_goal && (
                    <div className="flex items-start gap-3">
                      <Target className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-muted-foreground text-xs">Goal</p>
                        <p className="text-foreground">
                          {goalLabels[extendedProfile.target_goal] || extendedProfile.target_goal}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Mobile Number */}
                  {extendedProfile.mobile_number && (
                    <div className="flex items-start gap-3">
                      <Phone className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-muted-foreground text-xs">Mobile</p>
                        <p className="text-foreground">{extendedProfile.mobile_number}</p>
                      </div>
                    </div>
                  )}

                  {/* Student Info */}
                  {extendedProfile.user_type === "student" && extendedProfile.college_name && (
                    <>
                      <div className="flex items-start gap-3">
                        <Building2 className="w-4 h-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-muted-foreground text-xs">College</p>
                          <p className="text-foreground">{extendedProfile.college_name}</p>
                        </div>
                      </div>
                      {extendedProfile.course_name && (
                        <div className="flex items-start gap-3">
                          <BookOpen className="w-4 h-4 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-muted-foreground text-xs">Course</p>
                            <p className="text-foreground">
                              {extendedProfile.course_name}
                              {extendedProfile.branch && ` - ${extendedProfile.branch}`}
                              {extendedProfile.study_year && ` (${extendedProfile.study_year})`}
                            </p>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Professional Info */}
                  {extendedProfile.user_type === "professional" && extendedProfile.company_name && (
                    <>
                      <div className="flex items-start gap-3">
                        <Building2 className="w-4 h-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-muted-foreground text-xs">Company</p>
                          <p className="text-foreground">{extendedProfile.company_name}</p>
                        </div>
                      </div>
                      {extendedProfile.role && (
                        <div className="flex items-start gap-3">
                          <Briefcase className="w-4 h-4 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-muted-foreground text-xs">Role</p>
                            <p className="text-foreground">
                              {extendedProfile.role}
                              {extendedProfile.experience && ` (${extendedProfile.experience})`}
                            </p>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Interested Features */}
                {extendedProfile.interested_features && extendedProfile.interested_features.length > 0 && (
                  <div className="pt-3 border-t border-border">
                    <p className="text-muted-foreground text-xs mb-2">Interested in</p>
                    <div className="flex flex-wrap gap-1.5">
                      {extendedProfile.interested_features.slice(0, 5).map((feature) => (
                        <Badge key={feature} variant="outline" className="text-xs capitalize">
                          {feature.replace(/_/g, " ")}
                        </Badge>
                      ))}
                      {extendedProfile.interested_features.length > 5 && (
                        <Badge variant="outline" className="text-xs">
                          +{extendedProfile.interested_features.length - 5} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </motion.div>

          {/* Stats Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-2"
          >
            <div className="grid sm:grid-cols-2 gap-4 mb-6">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
                  className="card-feature"
                >
                  <div className="flex items-center gap-4">
                    <div className={`icon-box ${stat.color}`}>
                      <stat.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="card-dark">
              <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                <Button variant="outline" className="justify-start h-12">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Continue Learning
                </Button>
                <Button variant="outline" className="justify-start h-12">
                  <Trophy className="w-4 h-4 mr-2" />
                  View Achievements
                </Button>
                <Button variant="outline" className="justify-start h-12">
                  <Clock className="w-4 h-4 mr-2" />
                  Study Schedule
                </Button>
                <Button variant="outline" className="justify-start h-12">
                  <Settings className="w-4 h-4 mr-2" />
                  Account Settings
                </Button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Recent Activity Placeholder */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-8"
        >
          <div className="card-dark">
            <h3 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h3>
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">No recent activity</p>
              <p className="text-sm mt-1">Start learning to see your activity here</p>
              <Button className="mt-4 btn-primary">
                Browse Courses
              </Button>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Dashboard;
