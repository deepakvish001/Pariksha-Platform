import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, Building2, BookOpen, Calendar, Briefcase, AlertCircle, Phone, SkipForward } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

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

const referralOptions = [
  { value: "social_media", label: "Social Media" },
  { value: "reddit", label: "Reddit" },
  { value: "twitter", label: "Twitter/X" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "instagram", label: "Instagram" },
  { value: "youtube", label: "YouTube" },
  { value: "google", label: "Google Search" },
  { value: "friend", label: "Friend/Colleague" },
  { value: "github", label: "GitHub" },
  { value: "stackoverflow", label: "Stack Overflow" },
  { value: "blog", label: "Blog/Article" },
  { value: "other", label: "Other" },
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
  { id: "quiz", title: "Quiz", description: "Test your knowledge with interactive quizzes" },
  { id: "dsa", title: "DSA", description: "Master DSA with comprehensive practice" },
  { id: "aptitude", title: "Aptitude", description: "Practice aptitude questions for placements" },
  { id: "interview_questions", title: "Interview Questions", description: "Ace technical and behavioral interviews with..." },
  { id: "cs_questions", title: "Computer Science Questions", description: "Master core CS subjects like OS, DBMS, and CN" },
  { id: "handwritten_notes", title: "Handwritten Notes", description: "Access high-quality handwritten notes for quic..." },
  { id: "projects", title: "Projects", description: "Build impressive projects to showcase your skills" },
  { id: "cold_dms", title: "Cold DMs/ Emails", description: "Manage and track your outreach campaigns" },
  { id: "job_portals", title: "Job Portals", description: "Find and apply to jobs from multiple platforms" },
  
  { id: "interview_copilot", title: "Interview Copilot", description: "AI-powered assistant for your interview preparation" },
  { id: "companies", title: "Companies", description: "Explore company profiles and interview experiences" },
];

// Phone validation helper
const validatePhoneNumber = (phone: string): { isValid: boolean; message?: string } => {
  if (!phone) return { isValid: true }; // Optional field
  
  // Remove spaces, dashes, and parentheses
  const cleaned = phone.replace(/[\s\-\(\)]/g, "");
  
  // Check for valid formats: +91XXXXXXXXXX, 91XXXXXXXXXX, XXXXXXXXXX
  const indianPhoneRegex = /^(\+91|91)?[6-9]\d{9}$/;
  const internationalRegex = /^\+?[1-9]\d{6,14}$/;
  
  if (indianPhoneRegex.test(cleaned) || internationalRegex.test(cleaned)) {
    return { isValid: true };
  }
  
  return { 
    isValid: false, 
    message: "Please enter a valid phone number (e.g., +91 98765 43210)" 
  };
};

// Format phone number as user types
const formatPhoneNumber = (value: string): string => {
  // Remove all non-digit characters except +
  const cleaned = value.replace(/[^\d+]/g, "");
  
  // If it starts with +91, format as +91 XXXXX XXXXX
  if (cleaned.startsWith("+91") && cleaned.length > 3) {
    const rest = cleaned.slice(3);
    if (rest.length <= 5) {
      return `+91 ${rest}`;
    } else {
      return `+91 ${rest.slice(0, 5)} ${rest.slice(5, 10)}`;
    }
  }
  
  // If it starts with 91, format as 91 XXXXX XXXXX
  if (cleaned.startsWith("91") && cleaned.length > 2 && !cleaned.startsWith("+")) {
    const rest = cleaned.slice(2);
    if (rest.length <= 5) {
      return `+91 ${rest}`;
    } else {
      return `+91 ${rest.slice(0, 5)} ${rest.slice(5, 10)}`;
    }
  }
  
  // For 10 digit numbers starting with 6-9, assume Indian
  if (/^[6-9]/.test(cleaned) && cleaned.length <= 10) {
    if (cleaned.length <= 5) {
      return cleaned;
    } else {
      return `${cleaned.slice(0, 5)} ${cleaned.slice(5, 10)}`;
    }
  }
  
  return cleaned;
};

// Error message component
const FieldError = ({ message }: { message?: string }) => {
  if (!message) return null;
  return (
    <motion.p
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-1 text-sm text-destructive mt-1"
    >
      <AlertCircle className="w-3.5 h-3.5" />
      {message}
    </motion.p>
  );
};

interface FormErrors {
  currentExperience?: string;
  targetGoal?: string;
  referralSource?: string;
  collegeName?: string;
  courseName?: string;
  studyYear?: string;
  companyName?: string;
  role?: string;
  features?: string;
  mobileNumber?: string;
}

const Onboarding = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  
  // Form state
  const [fullName, setFullName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [currentExperience, setCurrentExperience] = useState("");
  const [targetGoal, setTargetGoal] = useState("");
  const [referralSource, setReferralSource] = useState("");
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  
  // Student fields
  const [collegeName, setCollegeName] = useState("");
  const [courseName, setCourseName] = useState("");
  const [branch, setBranch] = useState("");
  const [studyYear, setStudyYear] = useState("");
  
  // Professional fields
  const [companyName, setCompanyName] = useState("");
  const [role, setRole] = useState("");
  const [experienceYears, setExperienceYears] = useState("");

  const { user, profile, refreshExtendedProfile, onboardingCompleted } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect to dashboard if onboarding is already completed
  useEffect(() => {
    if (onboardingCompleted) {
      navigate("/learn", { replace: true });
    }
  }, [onboardingCompleted, navigate]);

  // Get user type based on experience selection
  const getUserType = () => {
    const selected = experienceOptions.find(opt => opt.value === currentExperience);
    return selected?.type || "";
  };

  const userType = getUserType();

  // Pre-fill full name from profile
  useEffect(() => {
    if (profile?.full_name) {
      setFullName(profile.full_name);
    }
  }, [profile]);

  // Clear errors when fields change
  useEffect(() => {
    if (currentExperience && errors.currentExperience) {
      setErrors(prev => ({ ...prev, currentExperience: undefined }));
    }
  }, [currentExperience]);

  useEffect(() => {
    if (targetGoal && errors.targetGoal) {
      setErrors(prev => ({ ...prev, targetGoal: undefined }));
    }
  }, [targetGoal]);

  useEffect(() => {
    if (referralSource && errors.referralSource) {
      setErrors(prev => ({ ...prev, referralSource: undefined }));
    }
  }, [referralSource]);

  useEffect(() => {
    if (collegeName && errors.collegeName) {
      setErrors(prev => ({ ...prev, collegeName: undefined }));
    }
  }, [collegeName]);

  useEffect(() => {
    if (courseName && errors.courseName) {
      setErrors(prev => ({ ...prev, courseName: undefined }));
    }
  }, [courseName]);

  useEffect(() => {
    if (studyYear && errors.studyYear) {
      setErrors(prev => ({ ...prev, studyYear: undefined }));
    }
  }, [studyYear]);

  useEffect(() => {
    if (companyName && errors.companyName) {
      setErrors(prev => ({ ...prev, companyName: undefined }));
    }
  }, [companyName]);

  useEffect(() => {
    if (role && errors.role) {
      setErrors(prev => ({ ...prev, role: undefined }));
    }
  }, [role]);

  useEffect(() => {
    if (selectedFeatures.length > 0 && errors.features) {
      setErrors(prev => ({ ...prev, features: undefined }));
    }
  }, [selectedFeatures]);

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhoneNumber(value);
    setMobileNumber(formatted);
    
    // Clear error on change
    if (errors.mobileNumber) {
      setErrors(prev => ({ ...prev, mobileNumber: undefined }));
    }
  };

  const handlePhoneBlur = () => {
    if (mobileNumber) {
      const validation = validatePhoneNumber(mobileNumber);
      if (!validation.isValid) {
        setErrors(prev => ({ ...prev, mobileNumber: validation.message }));
      }
    }
  };

  const toggleFeature = (featureId: string) => {
    setSelectedFeatures(prev => 
      prev.includes(featureId)
        ? prev.filter(id => id !== featureId)
        : [...prev, featureId]
    );
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!currentExperience) {
      newErrors.currentExperience = "Please select your experience level";
    }

    if (!targetGoal) {
      newErrors.targetGoal = "Please select your goal";
    }

    if (!referralSource) {
      newErrors.referralSource = "Please tell us where you found Parikshaa";
    }

    // Validate phone number
    if (mobileNumber) {
      const phoneValidation = validatePhoneNumber(mobileNumber);
      if (!phoneValidation.isValid) {
        newErrors.mobileNumber = phoneValidation.message;
      }
    }

    // Validate student fields
    if (userType === "student") {
      if (!collegeName.trim()) {
        newErrors.collegeName = "College name is required";
      }
      if (!courseName.trim()) {
        newErrors.courseName = "Course name is required";
      }
      if (!studyYear) {
        newErrors.studyYear = "Please select your year of study";
      }
    }

    // Validate professional fields
    if (userType === "professional") {
      if (!companyName.trim()) {
        newErrors.companyName = "Company name is required";
      }
      if (!role.trim()) {
        newErrors.role = "Role is required";
      }
    }

    if (selectedFeatures.length === 0) {
      newErrors.features = "Please select at least one feature";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSkip = async () => {
    // Set session flag to allow skipping for this session only
    // Next login (new session), they'll be prompted again
    sessionStorage.setItem("skippedOnboarding", "true");
    toast({
      title: "Skipped for now",
      description: "We'll ask you to complete your profile next time you log in.",
    });
    navigate("/learn", { replace: true });
  };

  const handleSubmit = async () => {
    if (!user) return;

    if (!validateForm()) {
      toast({ variant: "destructive", title: "Please fix the errors above" });
      return;
    }

    setIsLoading(true);

    // Update profile full_name if changed
    if (fullName && fullName !== profile?.full_name) {
      await supabase.from("profiles").update({ full_name: fullName }).eq("user_id", user.id);
    }

    // Clean phone number before saving
    const cleanedPhone = mobileNumber.replace(/[\s\-\(\)]/g, "");

    const { error } = await supabase.from("user_profiles_extended").insert({
      user_id: user.id,
      user_type: userType === "student" ? "student" : userType === "other" ? "other" : "professional",
      mobile_number: cleanedPhone || null,
      current_experience: currentExperience,
      target_goal: targetGoal,
      referral_source: referralSource,
      interested_features: selectedFeatures,
      college_name: userType === "student" ? collegeName : null,
      course_name: userType === "student" ? courseName : null,
      branch: userType === "student" ? branch : null,
      study_year: userType === "student" ? studyYear as any : null,
      company_name: userType === "professional" ? companyName : null,
      role: userType === "professional" ? role : null,
      experience: userType === "professional" ? experienceYears : null,
      onboarding_completed: true,
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error saving profile",
        description: error.message,
      });
    } else {
      // Refresh the extended profile to update onboardingCompleted state
      await refreshExtendedProfile();
      toast({
        title: "Profile completed!",
        description: "Welcome to Parikshaa!",
      });
      navigate("/learn", { replace: true });
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1 flex flex-col items-center px-4 py-8 md:py-12 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-4xl"
        >
          {/* Header */}
          <div className="mb-8 flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Welcome to Parikshaa</h1>
              <p className="text-muted-foreground mt-1">
                Let's get you onboarded to customize your experience.
              </p>
            </div>
            <Button
              variant="ghost"
              onClick={handleSkip}
              className="text-muted-foreground hover:text-foreground"
            >
              <SkipForward className="w-4 h-4 mr-2" />
              Skip for now
            </Button>
          </div>

          {/* Main Form Card */}
          <div className="rounded-xl border border-border bg-card/50 p-6 md:p-8 space-y-6">
            {/* Full Name & Mobile */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="onboarding-full-name" className="text-muted-foreground">Full Name</Label>
                <Input
                  id="onboarding-full-name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  className="h-12 bg-muted/50 border-border"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="onboarding-mobile" className="text-muted-foreground">Mobile Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="onboarding-mobile"
                    type="tel"
                    value={mobileNumber}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    onBlur={handlePhoneBlur}
                    placeholder="+91 98765 43210"
                    className={cn(
                      "h-12 pl-10 bg-muted/50 border-border",
                      errors.mobileNumber && "border-destructive"
                    )}
                  />
                </div>
                <FieldError message={errors.mobileNumber} />
              </div>
            </div>

            {/* Experience & Goal Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="onboarding-current-experience" className="text-muted-foreground">Your current experience *</Label>
                <Select value={currentExperience} onValueChange={setCurrentExperience}>
                  <SelectTrigger id="onboarding-current-experience" className={cn(
                    "h-12 bg-muted/50 border-border",
                    errors.currentExperience && "border-destructive"
                  )}>
                    <SelectValue placeholder="Select your experience" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {experienceOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError message={errors.currentExperience} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="onboarding-target-goal" className="text-muted-foreground">Your target/goal *</Label>
                <Select value={targetGoal} onValueChange={setTargetGoal}>
                  <SelectTrigger id="onboarding-target-goal" className={cn(
                    "h-12 bg-muted/50 border-border",
                    errors.targetGoal && "border-destructive"
                  )}>
                    <SelectValue placeholder="Select your goal" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {goalOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError message={errors.targetGoal} />
              </div>
            </div>

            {/* Conditional Student Fields */}
            <AnimatePresence>
              {userType === "student" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4 overflow-hidden"
                >
                  <div className="p-4 rounded-lg border border-primary/20 bg-primary/5 space-y-4">
                    <div className="flex items-center gap-2 text-primary">
                      <BookOpen className="w-5 h-5" />
                      <span className="font-medium">Academic Details</span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="onboarding-college" className="text-muted-foreground">College/University Name *</Label>
                        <div className="relative">
                          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                          <Input
                            id="onboarding-college"
                            value={collegeName}
                            onChange={(e) => setCollegeName(e.target.value)}
                            placeholder="e.g., IIT Delhi"
                            className={cn(
                              "h-11 pl-10 bg-muted/50 border-border",
                              errors.collegeName && "border-destructive"
                            )}
                          />
                        </div>
                        <FieldError message={errors.collegeName} />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="onboarding-course" className="text-muted-foreground">Course Name *</Label>
                        <Input
                          id="onboarding-course"
                          value={courseName}
                          onChange={(e) => setCourseName(e.target.value)}
                          placeholder="e.g., B.Tech, MBA, BCA"
                          className={cn(
                            "h-11 bg-muted/50 border-border",
                            errors.courseName && "border-destructive"
                          )}
                        />
                        <FieldError message={errors.courseName} />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="onboarding-branch" className="text-muted-foreground">Branch/Specialization</Label>
                        <Input
                          id="onboarding-branch"
                          value={branch}
                          onChange={(e) => setBranch(e.target.value)}
                          placeholder="e.g., Computer Science"
                          className="h-11 bg-muted/50 border-border"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="onboarding-study-year" className="text-muted-foreground">Year of Study *</Label>
                        <Select value={studyYear} onValueChange={setStudyYear}>
                          <SelectTrigger id="onboarding-study-year" className={cn(
                            "h-11 bg-muted/50 border-border",
                            errors.studyYear && "border-destructive"
                          )}>
                            <Calendar className="w-5 h-5 mr-2 text-muted-foreground" />
                            <SelectValue placeholder="Select year" />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-border">
                            {yearOptions.map((year) => (
                              <SelectItem key={year.value} value={year.value}>{year.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FieldError message={errors.studyYear} />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Conditional Professional Fields */}
            <AnimatePresence>
              {userType === "professional" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4 overflow-hidden"
                >
                  <div className="p-4 rounded-lg border border-primary/20 bg-primary/5 space-y-4">
                    <div className="flex items-center gap-2 text-primary">
                      <Briefcase className="w-5 h-5" />
                      <span className="font-medium">Professional Details</span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="onboarding-company" className="text-muted-foreground">Company Name *</Label>
                        <div className="relative">
                          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                          <Input
                            id="onboarding-company"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            placeholder="e.g., Google, TCS"
                            className={cn(
                              "h-11 pl-10 bg-muted/50 border-border",
                              errors.companyName && "border-destructive"
                            )}
                          />
                        </div>
                        <FieldError message={errors.companyName} />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="onboarding-role" className="text-muted-foreground">Role/Designation *</Label>
                        <Input
                          id="onboarding-role"
                          value={role}
                          onChange={(e) => setRole(e.target.value)}
                          placeholder="e.g., Software Engineer"
                          className={cn(
                            "h-11 bg-muted/50 border-border",
                            errors.role && "border-destructive"
                          )}
                        />
                        <FieldError message={errors.role} />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="onboarding-experience-years" className="text-muted-foreground">Years of Experience</Label>
                        <Select value={experienceYears} onValueChange={setExperienceYears}>
                          <SelectTrigger id="onboarding-experience-years" className="h-11 bg-muted/50 border-border">
                            <SelectValue placeholder="Select experience" />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-border">
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
                </motion.div>
              )}
            </AnimatePresence>

            {/* Referral Source */}
            <div className="space-y-2">
              <Label htmlFor="onboarding-referral-source" className="text-muted-foreground">Where did you find Parikshaa *</Label>
              <Select value={referralSource} onValueChange={setReferralSource}>
                <SelectTrigger id="onboarding-referral-source" className={cn(
                  "h-12 bg-muted/50 border-border w-full md:w-1/2",
                  errors.referralSource && "border-destructive"
                )}>
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {referralOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError message={errors.referralSource} />
            </div>

            {/* Features Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-primary">Feature you are interested to start using *</Label>
                {errors.features && (
                  <span className="flex items-center gap-1 text-sm text-destructive">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.features}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {featureOptions.map((feature) => (
                  <motion.div
                    key={feature.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => toggleFeature(feature.id)}
                    className={cn(
                      "relative p-4 rounded-lg border cursor-pointer transition-all",
                      selectedFeatures.includes(feature.id)
                        ? "border-primary bg-primary/10"
                        : "border-border bg-muted/30 hover:border-muted-foreground/50",
                      errors.features && selectedFeatures.length === 0 && "border-destructive/50"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h3 className="font-medium text-foreground">{feature.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {feature.description}
                        </p>
                      </div>
                      <Checkbox
                        checked={selectedFeatures.includes(feature.id)}
                        onCheckedChange={() => toggleFeature(feature.id)}
                        className="mt-1"
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-center pt-4">
              <Button
                onClick={handleSubmit}
                disabled={isLoading}
                className="w-full md:w-96 h-12 bg-muted hover:bg-muted/80 text-foreground border border-border"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
                ) : (
                  "Proceed to Parikshaa"
                )}
              </Button>
            </div>
          </div>

          {/* Footer Info */}
          <div className="mt-6 flex flex-col items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-card/50">
              <Settings className="w-4 h-4" />
              <span>logged in with {user?.email}</span>
            </div>
            <p>
              Something went wrong? Please email us at{" "}
              <a href="mailto:support@parikshaa.com" className="text-primary hover:underline">
                support@parikshaa.com
              </a>
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Onboarding;
