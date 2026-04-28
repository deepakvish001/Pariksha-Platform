import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import {
  MapPin,
  Calendar,
  Globe,
  Twitter,
  Linkedin,
  Github,
  Instagram,
  Code,
  ExternalLink,
  ArrowLeft,
  Loader2,
  UserX,
  Sparkles,
  Target,
  Briefcase,
  Share2,
  Copy,
  Check,
  Facebook,
  User as UserIcon,
  Trophy,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { cn } from "@/lib/utils";
 import PublicProfileAchievements from "@/components/PublicProfileAchievements";
import { useProfileFollowCounts } from "@/hooks/useProfileFollowCounts";
import { useFollows } from "@/hooks/useFollows";
import { useAuth } from "@/contexts/AuthContext";
import { Users, Heart, UserPlus, UserMinus } from "lucide-react";

interface PublicProfileData {
  username: string;
   user_id: string;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  occupation: string | null;
  website: string | null;
  skills: string[];
  interests: string[];
  goals: string[];
  aspirations: string[];
  twitter_url: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  instagram_url: string | null;
  leetcode_url: string | null;
  hackerrank_url: string | null;
  codeforces_url: string | null;
  codechef_url: string | null;
  geeksforgeeks_url: string | null;
  created_at: string;
}

const SocialLink = ({
  url,
  icon: Icon,
  label,
  color,
}: {
  url: string | null;
  icon: React.ElementType;
  label: string;
  color: string;
}) => {
  if (!url) return null;

  return (
    <motion.a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-lg border transition-all hover:scale-105",
        color
      )}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.95 }}
    >
      <Icon className="w-4 h-4" />
      <span className="text-sm font-medium">{label}</span>
      <ExternalLink className="w-3 h-3 ml-auto opacity-50" />
    </motion.a>
  );
};

const CodingProfileCard = ({
  url,
  platform,
  icon,
}: {
  url: string | null;
  platform: string;
  icon: string;
}) => {
  if (!url) return null;

  return (
    <motion.a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border hover:border-primary/50 transition-all"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
        <Code className="w-5 h-5 text-primary" />
      </div>
      <div className="flex-1">
        <p className="font-medium text-sm">{platform}</p>
        <p className="text-xs text-muted-foreground truncate max-w-[150px]">
          {url.replace(/https?:\/\/(www\.)?/, "")}
        </p>
      </div>
      <ExternalLink className="w-4 h-4 text-muted-foreground" />
    </motion.a>
  );
};

interface SideNavSection {
  id: string;
  label: string;
  icon: React.ElementType;
}

const ProfileSideNav = ({ sections }: { sections: SideNavSection[] }) => {
  const [active, setActive] = useState<string>(sections[0]?.id ?? "");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target?.id) setActive(visible[0].target.id);
      },
      { rootMargin: "-30% 0px -55% 0px", threshold: [0, 0.25, 0.5, 1] },
    );
    sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [sections]);

  const handleClick = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <aside className="hidden lg:block">
      <nav
        aria-label="Profile sections"
        className="sticky top-24 space-y-1 rounded-xl border border-border/50 bg-card/40 backdrop-blur p-2"
      >
        <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          On this profile
        </p>
        {sections.map((s) => {
          const Icon = s.icon;
          const isActive = active === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => handleClick(s.id)}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors text-left",
                isActive
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-muted/40 hover:text-foreground",
              )}
              aria-current={isActive ? "true" : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{s.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
};

const PublicProfile = () => {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<PublicProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);
  const { user } = useAuth();
  const { followersCount, followingCount, isLoading: isLoadingCounts } = useProfileFollowCounts(profile?.user_id);
  const { isFollowing, followUser, unfollowUser } = useFollows();
  const [isFollowLoading, setIsFollowLoading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!username) {
        setNotFound(true);
        setIsLoading(false);
        return;
      }

      try {
        // Fetch public profile data from secure view (excludes sensitive data like phone numbers)
        const { data: extendedData, error: extendedError } = await supabase
          .from("public_user_profiles" as any)
          .select("*")
          .eq("username", username)
          .maybeSingle() as { data: {
            user_id: string;
            username: string;
            bio: string | null;
            location: string | null;
            occupation: string | null;
            website: string | null;
            skills: string[] | null;
            interests: string[] | null;
            goals: string[] | null;
            aspirations: string[] | null;
            twitter_url: string | null;
            linkedin_url: string | null;
            github_url: string | null;
            instagram_url: string | null;
            leetcode_url: string | null;
            hackerrank_url: string | null;
            codeforces_url: string | null;
            codechef_url: string | null;
            geeksforgeeks_url: string | null;
            total_xp: number | null;
            current_level: number | null;
            xp_this_week: number | null;
            profile_completion_percentage: number | null;
            created_at: string;
          } | null; error: any };

        if (extendedError || !extendedData) {
          setNotFound(true);
          setIsLoading(false);
          return;
        }

        // Fetch basic profile info
        const { data: basicData, error: basicError } = await supabase
          .from("profiles")
          .select("full_name, avatar_url, created_at")
          .eq("user_id", extendedData.user_id)
          .maybeSingle();

        if (basicError || !basicData) {
          setNotFound(true);
          setIsLoading(false);
          return;
        }

        setProfile({
          username: extendedData.username || username,
           user_id: extendedData.user_id,
          full_name: basicData.full_name || "Anonymous",
          avatar_url: basicData.avatar_url,
          bio: extendedData.bio,
          location: extendedData.location,
          occupation: extendedData.occupation,
          website: extendedData.website,
          skills: extendedData.skills || [],
          interests: extendedData.interests || [],
          goals: extendedData.goals || [],
          aspirations: extendedData.aspirations || [],
          twitter_url: extendedData.twitter_url,
          linkedin_url: extendedData.linkedin_url,
          github_url: extendedData.github_url,
          instagram_url: extendedData.instagram_url,
          leetcode_url: extendedData.leetcode_url,
          hackerrank_url: extendedData.hackerrank_url,
          codeforces_url: extendedData.codeforces_url,
          codechef_url: extendedData.codechef_url,
          geeksforgeeks_url: extendedData.geeksforgeeks_url,
          created_at: basicData.created_at,
        });
      } catch (error) {
        console.error("Error fetching profile:", error);
        setNotFound(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [username]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const shareUrl = `${window.location.origin}/u/${profile?.username}`;
  const shareText = `Check out ${profile?.full_name}'s profile on Byteskill!`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  const handleShareTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleShareLinkedIn = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleShareFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${profile?.full_name}'s Profile`,
          text: shareText,
          url: shareUrl,
        });
      } catch (error) {
        // User cancelled or error occurred
      }
    }
  };

  const handleFollowToggle = async () => {
    if (!profile?.user_id || !user) return;
    setIsFollowLoading(true);
    try {
      if (isFollowing(profile.user_id)) {
        await unfollowUser(profile.user_id);
      } else {
        await followUser(profile.user_id);
      }
    } finally {
      setIsFollowLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
              <UserX className="w-12 h-12 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Profile Not Found</h1>
            <p className="text-muted-foreground mb-6">
              The user @{username} doesn't exist or hasn't set up their public profile yet.
            </p>
            <Link to="/">
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Go Home
              </Button>
            </Link>
          </motion.div>
        </div>
        <Footer />
      </div>
    );
  }

  const hasSocialLinks =
    profile?.twitter_url ||
    profile?.linkedin_url ||
    profile?.github_url ||
    profile?.instagram_url;

  const hasCodingProfiles =
    profile?.leetcode_url ||
    profile?.hackerrank_url ||
    profile?.codeforces_url ||
    profile?.codechef_url ||
    profile?.geeksforgeeks_url;

  const siteUrl = window.location.origin;
  const profileUrl = `${siteUrl}/u/${profile?.username}`;
  const profileTitle = `${profile?.full_name} (@${profile?.username}) | Byteskill`;
  const profileDescription = profile?.bio 
    ? profile.bio.slice(0, 155) + (profile.bio.length > 155 ? "..." : "")
    : `Check out ${profile?.full_name}'s profile on Byteskill. ${profile?.occupation ? `${profile.occupation}` : ""} ${profile?.location ? `from ${profile.location}` : ""}`.trim();

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{profileTitle}</title>
        <meta name="description" content={profileDescription} />
        <link rel="canonical" href={profileUrl} />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="profile" />
        <meta property="og:url" content={profileUrl} />
        <meta property="og:title" content={profileTitle} />
        <meta property="og:description" content={profileDescription} />
        {profile?.avatar_url && <meta property="og:image" content={profile.avatar_url} />}
        <meta property="profile:username" content={profile?.username || ""} />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:url" content={profileUrl} />
        <meta name="twitter:title" content={profileTitle} />
        <meta name="twitter:description" content={profileDescription} />
        {profile?.avatar_url && <meta name="twitter:image" content={profile.avatar_url} />}
        
        {/* JSON-LD Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Person",
            name: profile?.full_name,
            url: profileUrl,
            image: profile?.avatar_url || undefined,
            description: profile?.bio || undefined,
            jobTitle: profile?.occupation || undefined,
            address: profile?.location ? {
              "@type": "PostalAddress",
              addressLocality: profile.location
            } : undefined,
            sameAs: [
              profile?.twitter_url,
              profile?.linkedin_url,
              profile?.github_url,
              profile?.instagram_url,
              profile?.leetcode_url,
              profile?.hackerrank_url,
              profile?.codeforces_url,
              profile?.codechef_url,
              profile?.geeksforgeeks_url,
              profile?.website,
            ].filter(Boolean),
            knowsAbout: profile?.skills?.length ? profile.skills : undefined,
          })}
        </script>
      </Helmet>
      
      <Navbar />

      <main className="section-container py-8 md:py-12">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6 lg:gap-8">
          {/* Left sidebar nav */}
          <ProfileSideNav
            sections={[
              { id: "overview", label: "Overview", icon: UserIcon },
              { id: "skills", label: "Skills & Interests", icon: Sparkles },
              { id: "goals", label: "Goals", icon: Target },
              ...(hasSocialLinks ? [{ id: "social", label: "Social", icon: Globe }] : []),
              ...(hasCodingProfiles ? [{ id: "coding", label: "Coding Profiles", icon: Code }] : []),
              { id: "achievements", label: "Achievements", icon: Trophy },
            ]}
          />

          <div className="space-y-8 min-w-0">
          {/* Profile Header */}
          <section id="overview" className="scroll-mt-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="overflow-hidden">
              <div className="h-32 bg-gradient-to-r from-primary/30 via-primary/20 to-transparent" />
              <CardContent className="relative pt-0 pb-8">
                {/* Share Button - positioned in top right */}
                <div className="absolute top-4 right-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Share2 className="h-4 w-4" />
                        Share
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={handleCopyLink} className="cursor-pointer">
                        {copied ? (
                          <Check className="h-4 w-4 mr-2 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4 mr-2" />
                        )}
                        Copy Link
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleShareTwitter} className="cursor-pointer">
                        <Twitter className="h-4 w-4 mr-2" />
                        Share on X
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleShareLinkedIn} className="cursor-pointer">
                        <Linkedin className="h-4 w-4 mr-2" />
                        Share on LinkedIn
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleShareFacebook} className="cursor-pointer">
                        <Facebook className="h-4 w-4 mr-2" />
                        Share on Facebook
                      </DropdownMenuItem>
                      {typeof navigator !== "undefined" && navigator.share && (
                        <DropdownMenuItem onClick={handleNativeShare} className="cursor-pointer">
                          <Share2 className="h-4 w-4 mr-2" />
                          More Options
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex flex-col md:flex-row items-center md:items-end gap-6 -mt-16">
                  {/* Avatar */}
                  <Avatar className="h-32 w-32 border-4 border-background shadow-xl">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="text-3xl bg-primary/10 text-primary">
                      {getInitials(profile?.full_name || "U")}
                    </AvatarFallback>
                  </Avatar>

                  {/* Info */}
                  <div className="flex-1 text-center md:text-left space-y-2">
                    <div className="flex flex-col md:flex-row items-center gap-2">
                      <h1 className="text-3xl font-bold">{profile?.full_name}</h1>
                      <Badge variant="outline" className="text-primary">
                        @{profile?.username}
                      </Badge>
                    </div>
                    {profile?.bio && (
                      <p className="text-muted-foreground max-w-2xl">{profile.bio}</p>
                    )}
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-muted-foreground">
                      {profile?.occupation && (
                        <div className="flex items-center gap-1">
                          <Briefcase className="h-4 w-4" />
                          {profile.occupation}
                        </div>
                      )}
                      {profile?.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {profile.location}
                        </div>
                      )}
                      {profile?.website && (
                        <a
                          href={profile.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 hover:text-primary transition-colors"
                        >
                          <Globe className="h-4 w-4" />
                          Website
                        </a>
                      )}
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Joined {new Date(profile?.created_at || "").toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                      </div>
                    </div>

                  {/* Follow Stats */}
                  <div className="flex items-center justify-center md:justify-start gap-6 mt-4">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold">{isLoadingCounts ? "..." : followersCount}</span>
                      <span className="text-muted-foreground text-sm">Followers</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Heart className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold">{isLoadingCounts ? "..." : followingCount}</span>
                      <span className="text-muted-foreground text-sm">Following</span>
                    </div>
                  </div>

                  {/* Follow Button */}
                  {user && profile?.user_id && user.id !== profile.user_id && (
                    <div className="flex justify-center md:justify-start mt-4">
                      <Button
                        variant={isFollowing(profile.user_id) ? "outline" : "default"}
                        size="sm"
                        onClick={handleFollowToggle}
                        disabled={isFollowLoading}
                        className="gap-2"
                      >
                        {isFollowing(profile.user_id) ? (
                          <>
                            <UserMinus className="h-4 w-4" />
                            Unfollow
                          </>
                        ) : (
                          <>
                            <UserPlus className="h-4 w-4" />
                            Follow
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          </section>

          <div id="skills" className="scroll-mt-24 grid gap-6 lg:grid-cols-2">
            {/* Skills & Interests */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    Skills & Interests
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {profile?.skills && profile.skills.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">Skills</h4>
                      <div className="flex flex-wrap gap-2">
                        {profile.skills.map((skill, index) => (
                          <Badge key={index} variant="secondary" className="bg-blue-500/10 text-blue-600">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {profile?.interests && profile.interests.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">Interests</h4>
                      <div className="flex flex-wrap gap-2">
                        {profile.interests.map((interest, index) => (
                          <Badge key={index} variant="secondary" className="bg-green-500/10 text-green-600">
                            {interest}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {(!profile?.skills?.length && !profile?.interests?.length) && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No skills or interests added yet
                    </p>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Goals & Aspirations */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" />
                    Goals & Aspirations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {profile?.aspirations && profile.aspirations.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">Aspirations</h4>
                      <div className="flex flex-wrap gap-2">
                        {profile.aspirations.map((aspiration, index) => (
                          <Badge key={index} variant="secondary" className="bg-yellow-500/10 text-yellow-600">
                            {aspiration}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {profile?.goals && profile.goals.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">Goals</h4>
                      <div className="flex flex-wrap gap-2">
                        {profile.goals.map((goal, index) => (
                          <Badge key={index} variant="secondary" className="bg-purple-500/10 text-purple-600">
                            {goal}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {(!profile?.aspirations?.length && !profile?.goals?.length) && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No goals or aspirations added yet
                    </p>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Social Links */}
            {hasSocialLinks && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="w-5 h-5 text-primary" />
                      Social Links
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-2">
                    <SocialLink
                      url={profile?.twitter_url || null}
                      icon={Twitter}
                      label="Twitter"
                      color="hover:bg-sky-500/10 hover:border-sky-500/30 hover:text-sky-500"
                    />
                    <SocialLink
                      url={profile?.linkedin_url || null}
                      icon={Linkedin}
                      label="LinkedIn"
                      color="hover:bg-blue-500/10 hover:border-blue-500/30 hover:text-blue-500"
                    />
                    <SocialLink
                      url={profile?.github_url || null}
                      icon={Github}
                      label="GitHub"
                      color="hover:bg-gray-500/10 hover:border-gray-500/30"
                    />
                    <SocialLink
                      url={profile?.instagram_url || null}
                      icon={Instagram}
                      label="Instagram"
                      color="hover:bg-pink-500/10 hover:border-pink-500/30 hover:text-pink-500"
                    />
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Coding Profiles */}
            {hasCodingProfiles && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Code className="w-5 h-5 text-primary" />
                      Coding Profiles
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-2">
                    <CodingProfileCard
                      url={profile?.leetcode_url || null}
                      platform="LeetCode"
                      icon="leetcode"
                    />
                    <CodingProfileCard
                      url={profile?.hackerrank_url || null}
                      platform="HackerRank"
                      icon="hackerrank"
                    />
                    <CodingProfileCard
                      url={profile?.codeforces_url || null}
                      platform="CodeForces"
                      icon="codeforces"
                    />
                    <CodingProfileCard
                      url={profile?.codechef_url || null}
                      platform="CodeChef"
                      icon="codechef"
                    />
                    <CodingProfileCard
                      url={profile?.geeksforgeeks_url || null}
                      platform="GeeksForGeeks"
                      icon="gfg"
                    />
                  </CardContent>
                </Card>
              </motion.div>
            )}

             {/* Achievements */}
             {profile?.user_id && (
               <div id="achievements" className="scroll-mt-24">
                 <PublicProfileAchievements userId={profile.user_id} />
               </div>
             )}
          </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PublicProfile;
