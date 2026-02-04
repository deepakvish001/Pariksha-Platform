import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Settings, Mail } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const experienceOptions = [
  { value: "student", label: "Student (College/University)" },
  { value: "recent_graduate", label: "Recent Graduate (0-1 years)" },
  { value: "working_professional_1_3", label: "Working Professional (1-3 years)" },
  { value: "mid_level", label: "Mid-level Developer (3-5 years)" },
  { value: "senior", label: "Senior Developer (5-8 years)" },
  { value: "tech_lead", label: "Tech Lead/Manager (8+ years)" },
  { value: "career_switcher", label: "Career Switcher (Non-tech background)" },
  { value: "freelancer", label: "Freelancer/Contractor" },
  { value: "entrepreneur", label: "Entrepreneur/Founder" },
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
  { id: "roadmap", title: "Roadmap", description: "Follow structured learning paths for your goals" },
  { id: "interview_copilot", title: "Interview Copilot", description: "AI-powered assistant for your interview preparation" },
  { id: "companies", title: "Companies", description: "Explore company profiles and interview experiences" },
];

const Onboarding = () => {
  const [isLoading, setIsLoading] = useState(false);
  
  // Form state
  const [fullName, setFullName] = useState("");
  const [currentExperience, setCurrentExperience] = useState("");
  const [targetGoal, setTargetGoal] = useState("");
  const [referralSource, setReferralSource] = useState("");
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);

  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Pre-fill full name from profile
  useState(() => {
    if (profile?.full_name) {
      setFullName(profile.full_name);
    }
  });

  const toggleFeature = (featureId: string) => {
    setSelectedFeatures(prev => 
      prev.includes(featureId)
        ? prev.filter(id => id !== featureId)
        : [...prev, featureId]
    );
  };

  const handleSubmit = async () => {
    if (!user) return;

    if (!currentExperience || !targetGoal || !referralSource) {
      toast({ variant: "destructive", title: "Please fill in all required fields" });
      return;
    }

    if (selectedFeatures.length === 0) {
      toast({ variant: "destructive", title: "Please select at least one feature you're interested in" });
      return;
    }

    setIsLoading(true);

    // Update profile full_name if changed
    if (fullName && fullName !== profile?.full_name) {
      await supabase.from("profiles").update({ full_name: fullName }).eq("user_id", user.id);
    }

    const { error } = await supabase.from("user_profiles_extended").insert({
      user_id: user.id,
      user_type: currentExperience === "student" ? "student" : 
                 currentExperience === "freelancer" || currentExperience === "entrepreneur" ? "other" : "professional",
      current_experience: currentExperience,
      target_goal: targetGoal,
      referral_source: referralSource,
      interested_features: selectedFeatures,
      onboarding_completed: true,
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error saving profile",
        description: error.message,
      });
    } else {
      toast({
        title: "Profile completed!",
        description: "Welcome to UniDash!",
      });
      navigate("/dashboard", { replace: true });
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1 flex flex-col items-center px-4 py-8 md:py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-4xl"
        >
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground">Welcome to UniDash</h1>
            <p className="text-muted-foreground mt-1">
              Let's get you onboarded to customize your experience.
            </p>
          </div>

          {/* Main Form Card */}
          <div className="rounded-xl border border-border bg-card/50 p-6 md:p-8 space-y-8">
            {/* Full Name */}
            <div className="space-y-2">
              <Label className="text-muted-foreground">Full Name</Label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                className="h-12 bg-muted/50 border-border"
              />
            </div>

            {/* Experience & Goal Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Your current experience</Label>
                <Select value={currentExperience} onValueChange={setCurrentExperience}>
                  <SelectTrigger className="h-12 bg-muted/50 border-border">
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
              </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground">Your target/goal</Label>
                <Select value={targetGoal} onValueChange={setTargetGoal}>
                  <SelectTrigger className="h-12 bg-muted/50 border-border">
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
              </div>
            </div>

            {/* Referral Source */}
            <div className="space-y-2">
              <Label className="text-muted-foreground">Where did you find UniDash</Label>
              <Select value={referralSource} onValueChange={setReferralSource}>
                <SelectTrigger className="h-12 bg-muted/50 border-border w-full md:w-1/2">
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
            </div>

            {/* Features Section */}
            <div className="space-y-4">
              <Label className="text-primary">Feature you are interested to start using</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {featureOptions.map((feature) => (
                  <motion.div
                    key={feature.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => toggleFeature(feature.id)}
                    className={`relative p-4 rounded-lg border cursor-pointer transition-all ${
                      selectedFeatures.includes(feature.id)
                        ? "border-primary bg-primary/10"
                        : "border-border bg-muted/30 hover:border-muted-foreground/50"
                    }`}
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
                  "Proceed to UniDash"
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
              <a href="mailto:support@unidash.com" className="text-primary hover:underline">
                support@unidash.com
              </a>
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Onboarding;
