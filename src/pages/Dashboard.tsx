import { useState } from "react";
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
  Moon
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "next-themes";

const Dashboard = () => {
  const { user, profile, signOut, updateProfile } = useAuth();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(profile?.full_name || "");
  const [isUpdating, setIsUpdating] = useState(false);

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

  const getInitials = (name: string | null | undefined) => {
    if (!name) return user?.email?.charAt(0).toUpperCase() || "U";
    return name
      .split(" ")
      .map((n) => n.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

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
            Welcome back, {profile?.full_name?.split(" ")[0] || "Student"}! 👋
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
            className="lg:col-span-1"
          >
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
