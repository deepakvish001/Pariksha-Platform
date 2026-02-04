import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Phone, GraduationCap, Briefcase, User, ArrowRight, ArrowLeft, 
  Building2, BookOpen, Calendar, Sparkles, CheckCircle
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

type UserType = "student" | "professional" | "other";
type StudyYear = "1st Year" | "2nd Year" | "3rd Year" | "4th Year" | "5th Year" | "Other";

const Onboarding = () => {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  // Form state
  const [mobileNumber, setMobileNumber] = useState("");
  const [userType, setUserType] = useState<UserType | "">("");
  
  // Student fields
  const [collegeName, setCollegeName] = useState("");
  const [courseName, setCourseName] = useState("");
  const [branch, setBranch] = useState("");
  const [studyYear, setStudyYear] = useState<StudyYear | "">("");
  
  // Professional fields
  const [companyName, setCompanyName] = useState("");
  const [role, setRole] = useState("");
  const [experience, setExperience] = useState("");
  
  // Other fields
  const [otherDescription, setOtherDescription] = useState("");

  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const totalSteps = 3;

  const handleNext = () => {
    if (step === 1 && !mobileNumber) {
      toast({ variant: "destructive", title: "Please enter your mobile number" });
      return;
    }
    if (step === 2 && !userType) {
      toast({ variant: "destructive", title: "Please select your profile type" });
      return;
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (!user) return;

    // Validate step 3 fields based on user type
    if (userType === "student" && (!collegeName || !courseName || !studyYear)) {
      toast({ variant: "destructive", title: "Please fill in all required fields" });
      return;
    }
    if (userType === "professional" && (!companyName || !role)) {
      toast({ variant: "destructive", title: "Please fill in all required fields" });
      return;
    }
    if (userType === "other" && !otherDescription) {
      toast({ variant: "destructive", title: "Please describe your role" });
      return;
    }

    setIsLoading(true);

    const { error } = await supabase.from("user_profiles_extended").insert({
      user_id: user.id,
      mobile_number: mobileNumber,
      user_type: userType as UserType,
      college_name: userType === "student" ? collegeName : null,
      course_name: userType === "student" ? courseName : null,
      branch: userType === "student" ? branch : null,
      study_year: userType === "student" ? studyYear as StudyYear : null,
      company_name: userType === "professional" ? companyName : null,
      role: userType === "professional" ? role : null,
      experience: userType === "professional" ? experience : null,
      other_description: userType === "other" ? otherDescription : null,
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

  const userTypeOptions = [
    { value: "student", label: "Student", icon: GraduationCap, description: "Currently enrolled in a college or university" },
    { value: "professional", label: "Professional", icon: Briefcase, description: "Working in a company or organization" },
    { value: "other", label: "Other", icon: User, description: "Freelancer, Founder, or something else" },
  ];

  const yearOptions: StudyYear[] = ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year", "Other"];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 flex items-center justify-center pt-16 py-12 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-lg"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/5 mb-4">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Complete Your Profile</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              Welcome{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}! 👋
            </h1>
            <p className="text-muted-foreground mt-2">
              Let's personalize your experience
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              <span>Step {step} of {totalSteps}</span>
              <span>{Math.round((step / totalSteps) * 100)}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${(step / totalSteps) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          {/* Card */}
          <div className="card-dark">
            <AnimatePresence mode="wait">
              {/* Step 1: Mobile Number */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="text-center">
                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <Phone className="w-7 h-7 text-primary" />
                    </div>
                    <h2 className="text-xl font-semibold text-foreground">Contact Information</h2>
                    <p className="text-sm text-muted-foreground mt-1">We'll use this to keep you updated</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mobile">Mobile Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="mobile"
                        type="tel"
                        placeholder="+91 98765 43210"
                        value={mobileNumber}
                        onChange={(e) => setMobileNumber(e.target.value)}
                        className="pl-10 h-12"
                      />
                    </div>
                  </div>

                  <Button onClick={handleNext} className="w-full h-12 btn-primary">
                    Continue
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </motion.div>
              )}

              {/* Step 2: User Type */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="text-center">
                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <User className="w-7 h-7 text-primary" />
                    </div>
                    <h2 className="text-xl font-semibold text-foreground">What describes you best?</h2>
                    <p className="text-sm text-muted-foreground mt-1">This helps us personalize your dashboard</p>
                  </div>

                  <RadioGroup value={userType} onValueChange={(v) => setUserType(v as UserType)}>
                    <div className="space-y-3">
                      {userTypeOptions.map((option) => (
                        <label
                          key={option.value}
                          className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                            userType === option.value
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <RadioGroupItem value={option.value} id={option.value} />
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <option.icon className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-foreground">{option.label}</p>
                            <p className="text-sm text-muted-foreground">{option.description}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </RadioGroup>

                  <div className="flex gap-3">
                    <Button onClick={handleBack} variant="outline" className="flex-1 h-12">
                      <ArrowLeft className="w-5 h-5 mr-2" />
                      Back
                    </Button>
                    <Button onClick={handleNext} className="flex-1 h-12 btn-primary">
                      Continue
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Details based on user type */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  {/* Student Form */}
                  {userType === "student" && (
                    <>
                      <div className="text-center">
                        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                          <GraduationCap className="w-7 h-7 text-primary" />
                        </div>
                        <h2 className="text-xl font-semibold text-foreground">Academic Details</h2>
                        <p className="text-sm text-muted-foreground mt-1">Tell us about your education</p>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="college">College/University Name *</Label>
                          <div className="relative">
                            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <Input
                              id="college"
                              placeholder="e.g., IIT Delhi"
                              value={collegeName}
                              onChange={(e) => setCollegeName(e.target.value)}
                              className="pl-10 h-11"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="course">Course Name *</Label>
                          <div className="relative">
                            <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <Input
                              id="course"
                              placeholder="e.g., B.Tech, MBA, BCA"
                              value={courseName}
                              onChange={(e) => setCourseName(e.target.value)}
                              className="pl-10 h-11"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="branch">Branch/Specialization</Label>
                          <Input
                            id="branch"
                            placeholder="e.g., Computer Science"
                            value={branch}
                            onChange={(e) => setBranch(e.target.value)}
                            className="h-11"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Year of Study *</Label>
                          <Select value={studyYear} onValueChange={(v) => setStudyYear(v as StudyYear)}>
                            <SelectTrigger className="h-11">
                              <Calendar className="w-5 h-5 mr-2 text-muted-foreground" />
                              <SelectValue placeholder="Select year" />
                            </SelectTrigger>
                            <SelectContent>
                              {yearOptions.map((year) => (
                                <SelectItem key={year} value={year}>{year}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Professional Form */}
                  {userType === "professional" && (
                    <>
                      <div className="text-center">
                        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                          <Briefcase className="w-7 h-7 text-primary" />
                        </div>
                        <h2 className="text-xl font-semibold text-foreground">Professional Details</h2>
                        <p className="text-sm text-muted-foreground mt-1">Tell us about your work</p>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="company">Company Name *</Label>
                          <div className="relative">
                            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <Input
                              id="company"
                              placeholder="e.g., Google, TCS, Infosys"
                              value={companyName}
                              onChange={(e) => setCompanyName(e.target.value)}
                              className="pl-10 h-11"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="role">Role/Designation *</Label>
                          <Input
                            id="role"
                            placeholder="e.g., Software Engineer"
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="h-11"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Experience</Label>
                          <Select value={experience} onValueChange={setExperience}>
                            <SelectTrigger className="h-11">
                              <SelectValue placeholder="Select experience" />
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
                    </>
                  )}

                  {/* Other Form */}
                  {userType === "other" && (
                    <>
                      <div className="text-center">
                        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                          <User className="w-7 h-7 text-primary" />
                        </div>
                        <h2 className="text-xl font-semibold text-foreground">Tell us about yourself</h2>
                        <p className="text-sm text-muted-foreground mt-1">What do you do?</p>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="description">Describe your role *</Label>
                          <Input
                            id="description"
                            placeholder="e.g., Freelancer, Founder, Content Creator"
                            value={otherDescription}
                            onChange={(e) => setOtherDescription(e.target.value)}
                            className="h-11"
                          />
                          <p className="text-xs text-muted-foreground">
                            Examples: Freelancer, Founder, Entrepreneur, Content Creator, etc.
                          </p>
                        </div>
                      </div>
                    </>
                  )}

                  <div className="flex gap-3">
                    <Button onClick={handleBack} variant="outline" className="flex-1 h-12">
                      <ArrowLeft className="w-5 h-5 mr-2" />
                      Back
                    </Button>
                    <Button onClick={handleSubmit} className="flex-1 h-12 btn-primary" disabled={isLoading}>
                      {isLoading ? (
                        <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          Complete
                          <CheckCircle className="w-5 h-5 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default Onboarding;
