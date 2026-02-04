import { useState, useRef } from "react";
import { motion } from "framer-motion";
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
  Clock
} from "lucide-react";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const DashboardProfile = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || "");

  const getInitials = (name: string | null | undefined) => {
    if (!name) return user?.email?.charAt(0).toUpperCase() || "U";
    return name.split(" ").map((n) => n.charAt(0)).join("").toUpperCase().slice(0, 2);
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
    }

    setIsUploadingAvatar(false);
  };

  const stats = [
    { label: "Courses Enrolled", value: "12", icon: BookOpen, color: "text-blue-500" },
    { label: "Achievements", value: "28", icon: Trophy, color: "text-yellow-500" },
    { label: "Study Hours", value: "156", icon: Clock, color: "text-green-500" },
    { label: "Goals Completed", value: "8", icon: Target, color: "text-primary" },
  ];

  const recentActivity = [
    { action: "Completed DSA Arrays module", time: "2 hours ago" },
    { action: "Earned 'Quick Learner' badge", time: "1 day ago" },
    { action: "Started System Design course", time: "2 days ago" },
    { action: "Completed SQL Basics", time: "3 days ago" },
  ];

  return (
    <SidebarProvider>
      <DashboardSidebar />
      <SidebarInset>
        <div className="min-h-screen bg-background">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleAvatarUpload}
            accept="image/*"
            className="hidden"
          />

          {/* Header */}
          <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-md">
            <div className="flex h-16 items-center gap-4 px-6">
              <SidebarTrigger className="md:hidden" />
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
                        <Camera className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Info */}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <h2 className="text-2xl font-bold">{profile?.full_name || "User"}</h2>
                        <Badge>Free Plan</Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Mail className="h-4 w-4" />
                          {user?.email}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Member since {new Date(user?.created_at || "").toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    <Button className="gap-2">
                      <Edit2 className="h-4 w-4" />
                      Edit Profile
                    </Button>
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
              {stats.map((stat, index) => (
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

            <div className="grid gap-6 md:grid-cols-2">
              {/* Skills Progress */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle>Skills Progress</CardTitle>
                    <CardDescription>Your learning journey across different areas</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {[
                      { name: "Data Structures", progress: 75 },
                      { name: "Algorithms", progress: 60 },
                      { name: "System Design", progress: 35 },
                      { name: "SQL", progress: 80 },
                      { name: "Problem Solving", progress: 70 },
                    ].map((skill) => (
                      <div key={skill.name} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{skill.name}</span>
                          <span className="text-muted-foreground">{skill.progress}%</span>
                        </div>
                        <Progress value={skill.progress} className="h-2" />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Recent Activity */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Your latest actions and achievements</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recentActivity.map((activity, index) => (
                        <div key={index} className="flex items-start gap-4 pb-4 border-b border-border/50 last:border-0 last:pb-0">
                          <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                          <div className="flex-1">
                            <p className="text-sm">{activity.action}</p>
                            <p className="text-xs text-muted-foreground">{activity.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default DashboardProfile;
