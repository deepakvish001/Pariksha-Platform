import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import DashboardProfile from "./DashboardProfile";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  Target,
  BookOpen,
  Globe,
  Twitter,
  Linkedin,
  Github,
  Instagram,
  FileText,
  Code,
  Loader2,
  Share2,
  ArrowLeft,
  UserX,
  UserPlus,
  UserMinus,
  Users,
  Heart,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import PublicProfileAchievements from "@/components/PublicProfileAchievements";
import { useProfileFollowCounts } from "@/hooks/useProfileFollowCounts";
import { useFollows } from "@/hooks/useFollows";
import { useAuth } from "@/contexts/AuthContext";
import { PortfolioPanel } from "@/components/placement/PortfolioPanel";

// Read-only field tile that mirrors DashboardProfile's ProfileField
const ReadOnlyField = ({
  label,
  value,
  icon: Icon,
  href,
}: {
  label: string;
  value?: string | null;
  icon: React.ElementType;
  href?: string | null;
}) => {
  const isEmpty = !value;
  const inner = (
    <div
      className={cn(
        "flex items-center justify-between p-3 rounded-lg border transition-all",
        isEmpty
          ? "border-dashed border-muted-foreground/30 bg-muted/30"
          : "border-border bg-card hover:bg-muted/50",
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
            isEmpty ? "bg-muted" : "bg-primary/10",
          )}
        >
          <Icon className={cn("w-4 h-4", isEmpty ? "text-muted-foreground" : "text-primary")} />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p
            className={cn(
              "text-sm font-medium truncate",
              isEmpty ? "text-muted-foreground italic" : "text-foreground",
            )}
          >
            {isEmpty ? "Not set" : value}
          </p>
        </div>
      </div>
      {href && !isEmpty && (
        <ExternalLink className="w-4 h-4 text-muted-foreground shrink-0" />
      )}
    </div>
  );

  if (href && !isEmpty) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="block">
        {inner}
      </a>
    );
  }
  return inner;
};

const ReadOnlyArrayField = ({
  label,
  items,
  icon: Icon,
  colorClass = "bg-primary/10 text-primary",
}: {
  label: string;
  items?: string[] | null;
  icon: React.ElementType;
  colorClass?: string;
}) => (
  <div className="space-y-2">
    <div className="flex items-center gap-2">
      <Icon className="w-4 h-4 text-muted-foreground" />
      <span className="text-sm font-medium">{label}</span>
    </div>
    {items && items.length > 0 ? (
      <div className="flex flex-wrap gap-2">
        {items.map((item, i) => (
          <Badge key={i} variant="secondary" className={colorClass}>
            {item}
          </Badge>
        ))}
      </div>
    ) : (
      <div className="p-4 rounded-lg border border-dashed border-muted-foreground/30 bg-muted/30 text-center">
        <p className="text-xs text-muted-foreground">No items added</p>
      </div>
    )}
  </div>
);

interface PublicProfileData {
  username: string;
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  created_at: string;
  bio: string | null;
  location: string | null;
  occupation: string | null;
  website: string | null;
  skills: string[];
  interests: string[];
  goals: string[];
  twitter_url: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  instagram_url: string | null;
  leetcode_url: string | null;
  hackerrank_url: string | null;
  codeforces_url: string | null;
  codechef_url: string | null;
  geeksforgeeks_url: string | null;
  resume_url: string | null;
  profile_completion_percentage: number | null;
}

const PublicProfile = () => {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuth();
  const [profile, setProfile] = useState<PublicProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const { followersCount, followingCount, isLoading: isLoadingCounts } =
    useProfileFollowCounts(profile?.user_id);
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
        const { data: ext, error: extErr } = await supabase
          .from("public_user_profiles" as any)
          .select("*")
          .eq("username", username)
          .maybeSingle() as { data: any; error: any };

        if (extErr || !ext) {
          setNotFound(true);
          setIsLoading(false);
          return;
        }

        const { data: basic, error: basicErr } = await supabase
          .from("profiles")
          .select("full_name, avatar_url, created_at")
          .eq("user_id", ext.user_id)
          .maybeSingle();

        if (basicErr || !basic) {
          setNotFound(true);
          setIsLoading(false);
          return;
        }

        setProfile({
          username: ext.username || username,
          user_id: ext.user_id,
          full_name: basic.full_name || "Anonymous",
          avatar_url: basic.avatar_url,
          created_at: basic.created_at,
          bio: ext.bio,
          location: ext.location,
          occupation: ext.occupation,
          website: ext.website,
          skills: ext.skills || [],
          interests: ext.interests || [],
          goals: ext.goals || [],
          twitter_url: ext.twitter_url,
          linkedin_url: ext.linkedin_url,
          github_url: ext.github_url,
          instagram_url: ext.instagram_url,
          leetcode_url: ext.leetcode_url,
          hackerrank_url: ext.hackerrank_url,
          codeforces_url: ext.codeforces_url,
          codechef_url: ext.codechef_url,
          geeksforgeeks_url: ext.geeksforgeeks_url,
          resume_url: ext.resume_url ?? null,
          profile_completion_percentage: ext.profile_completion_percentage ?? null,
        });
      } catch (err) {
        console.error("Error fetching profile:", err);
        setNotFound(true);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [username]);

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);

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
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound || !profile) {
    return (
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
    );
  }

  // Profile-strength checklist (read-only mirror of DashboardProfile)
  const profileChecklist = [
    { key: "bio", label: "Bio", filled: !!profile.bio },
    { key: "location", label: "Location", filled: !!profile.location },
    { key: "occupation", label: "Occupation", filled: !!profile.occupation },
    { key: "skills", label: "Skills", filled: profile.skills.length > 0 },
    { key: "goals", label: "Goals", filled: profile.goals.length > 0 },
    { key: "linkedin", label: "LinkedIn", filled: !!profile.linkedin_url },
    { key: "github", label: "GitHub", filled: !!profile.github_url },
    { key: "leetcode", label: "LeetCode", filled: !!profile.leetcode_url },
  ];
  const filledCount = profileChecklist.filter((c) => c.filled).length;
  const completionPercent = Math.round((filledCount / profileChecklist.length) * 100);
  const strengthLabel =
    completionPercent >= 100
      ? "Strong"
      : completionPercent >= 60
        ? "Good"
        : completionPercent >= 30
          ? "Fair"
          : "Weak";
  const strengthColor =
    completionPercent >= 100
      ? "text-emerald-500"
      : completionPercent >= 60
        ? "text-blue-500"
        : completionPercent >= 30
          ? "text-amber-500"
          : "text-red-500";

  const siteUrl = window.location.origin;
  const profileUrl = `${siteUrl}/u/${profile.username}`;
  const profileTitle = `${profile.full_name} (@${profile.username}) | Parikshaa`;
  const profileDescription = profile.bio
    ? profile.bio.slice(0, 155) + (profile.bio.length > 155 ? "..." : "")
    : `Check out ${profile.full_name}'s profile on Parikshaa. ${profile.occupation ?? ""} ${profile.location ? `from ${profile.location}` : ""}`.trim();

  const isOwner = user?.id === profile.user_id;

  // Owner sees the full editable DashboardProfile UI on their own /u/:username
  if (isOwner) {
    return <DashboardProfile />;
  }

  return (
    <div>
      <Helmet>
        <title>{profileTitle}</title>
        <meta name="description" content={profileDescription} />
        <link rel="canonical" href={profileUrl} />
        <meta property="og:type" content="profile" />
        <meta property="og:url" content={profileUrl} />
        <meta property="og:title" content={profileTitle} />
        <meta property="og:description" content={profileDescription} />
        {profile.avatar_url && <meta property="og:image" content={profile.avatar_url} />}
        <meta property="profile:username" content={profile.username} />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={profileTitle} />
        <meta name="twitter:description" content={profileDescription} />
        {profile.avatar_url && <meta name="twitter:image" content={profile.avatar_url} />}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Person",
            name: profile.full_name,
            url: profileUrl,
            image: profile.avatar_url || undefined,
            description: profile.bio || undefined,
            jobTitle: profile.occupation || undefined,
            address: profile.location
              ? { "@type": "PostalAddress", addressLocality: profile.location }
              : undefined,
            sameAs: [
              profile.twitter_url,
              profile.linkedin_url,
              profile.github_url,
              profile.instagram_url,
              profile.leetcode_url,
              profile.hackerrank_url,
              profile.codeforces_url,
              profile.codechef_url,
              profile.geeksforgeeks_url,
              profile.website,
            ].filter(Boolean),
            knowsAbout: profile.skills.length ? profile.skills : undefined,
          })}
        </script>
      </Helmet>

      <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
        {/* Profile Strength Card */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-primary/20">
            <CardContent className="p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex items-center gap-4">
                  <div className="relative h-16 w-16 shrink-0">
                    <svg className="h-16 w-16 -rotate-90" viewBox="0 0 36 36">
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="hsl(var(--muted))"
                        strokeWidth="3"
                      />
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="hsl(var(--primary))"
                        strokeWidth="3"
                        strokeDasharray={`${completionPercent}, 100`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-sm font-bold">{completionPercent}%</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Profile Strength</p>
                    <p className={cn("text-lg font-bold", strengthColor)}>{strengthLabel}</p>
                    <p className="text-xs text-muted-foreground">
                      {filledCount}/{profileChecklist.length} fields completed
                    </p>
                  </div>
                </div>
                <div className="flex-1 border-t sm:border-t-0 sm:border-l border-border pt-3 sm:pt-0 sm:pl-4 flex items-center justify-center">
                  <div className="text-center">
                    {completionPercent >= 100 ? (
                      <>
                        <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-1" />
                        <p className="text-sm font-medium">Profile complete!</p>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        @{profile.username} is still building their profile
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-1 mt-4">
                {profileChecklist.map((item) => (
                  <div
                    key={item.key}
                    className={cn(
                      "h-1.5 flex-1 rounded-full transition-colors",
                      item.filled ? "bg-primary" : "bg-muted",
                    )}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <PortfolioPanel userId={profile.user_id} />

        {/* Profile Header Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="overflow-hidden">
            <div className="h-28 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent" />
            <CardContent className="relative pt-0 pb-5">
              <div className="flex flex-col md:flex-row items-start md:items-end gap-5 -mt-14">
                <div className="relative">
                  <Avatar className="h-28 w-28 border-4 border-background shadow-xl">
                    <AvatarImage src={profile.avatar_url || undefined} />
                    <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                      {getInitials(profile.full_name)}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="flex-1 space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-xl font-bold">{profile.full_name}</h1>
                    <Badge variant="outline">@{profile.username}</Badge>
                  </div>
                  {profile.bio && (
                    <p className="text-sm text-muted-foreground">{profile.bio}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    {profile.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {profile.location}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      Joined {new Date(profile.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm pt-1">
                    <span className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-muted-foreground" />
                      <strong>{isLoadingCounts ? "…" : followersCount}</strong>
                      <span className="text-muted-foreground">followers</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Heart className="h-3.5 w-3.5 text-muted-foreground" />
                      <strong>{isLoadingCounts ? "…" : followingCount}</strong>
                      <span className="text-muted-foreground">following</span>
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isOwner ? (
                    <Link to={`/u/${profile.username}`}>
                      <Button size="sm" variant="outline" className="gap-1.5">
                        <Share2 className="h-3.5 w-3.5" /> Edit Profile
                      </Button>
                    </Link>
                  ) : user ? (
                    <Button
                      size="sm"
                      variant={isFollowing(profile.user_id) ? "outline" : "default"}
                      onClick={handleFollowToggle}
                      disabled={isFollowLoading}
                      className="gap-1.5"
                    >
                      {isFollowing(profile.user_id) ? (
                        <>
                          <UserMinus className="h-3.5 w-3.5" /> Unfollow
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-3.5 w-3.5" /> Follow
                        </>
                      )}
                    </Button>
                  ) : null}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid gap-5 lg:grid-cols-2">
          {/* Personal Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Personal Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <ReadOnlyField
                  label="Username"
                  value={`@${profile.username}`}
                  icon={User}
                />
                <ReadOnlyField label="Location" value={profile.location} icon={MapPin} />
                <ReadOnlyField
                  label="Occupation"
                  value={profile.occupation}
                  icon={Briefcase}
                />
                <ReadOnlyField
                  label="Website"
                  value={profile.website}
                  icon={Globe}
                  href={profile.website}
                />
              </CardContent>
            </Card>
          </motion.div>

          {/* Skills & Goals */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Skills & Goals</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <ReadOnlyArrayField
                  label="Skills"
                  items={profile.skills}
                  icon={Code}
                  colorClass="bg-blue-500/10 text-blue-600"
                />
                <ReadOnlyArrayField
                  label="Interests"
                  items={profile.interests}
                  icon={BookOpen}
                  colorClass="bg-emerald-500/10 text-emerald-600"
                />
                <ReadOnlyArrayField
                  label="Goals"
                  items={profile.goals}
                  icon={Target}
                  colorClass="bg-purple-500/10 text-purple-600"
                />
              </CardContent>
            </Card>
          </motion.div>

          {/* Links & Profiles */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Links & Profiles</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  <ReadOnlyField
                    label="LinkedIn"
                    value={profile.linkedin_url}
                    icon={Linkedin}
                    href={profile.linkedin_url}
                  />
                  <ReadOnlyField
                    label="GitHub"
                    value={profile.github_url}
                    icon={Github}
                    href={profile.github_url}
                  />
                  <ReadOnlyField
                    label="Twitter"
                    value={profile.twitter_url}
                    icon={Twitter}
                    href={profile.twitter_url}
                  />
                  <ReadOnlyField
                    label="Instagram"
                    value={profile.instagram_url}
                    icon={Instagram}
                    href={profile.instagram_url}
                  />
                  <ReadOnlyField
                    label="LeetCode"
                    value={profile.leetcode_url}
                    icon={Code}
                    href={profile.leetcode_url}
                  />
                  <ReadOnlyField
                    label="HackerRank"
                    value={profile.hackerrank_url}
                    icon={Code}
                    href={profile.hackerrank_url}
                  />
                  <ReadOnlyField
                    label="CodeForces"
                    value={profile.codeforces_url}
                    icon={Code}
                    href={profile.codeforces_url}
                  />
                  <ReadOnlyField
                    label="CodeChef"
                    value={profile.codechef_url}
                    icon={Code}
                    href={profile.codechef_url}
                  />
                  <ReadOnlyField
                    label="GeeksForGeeks"
                    value={profile.geeksforgeeks_url}
                    icon={Code}
                    href={profile.geeksforgeeks_url}
                  />
                  <ReadOnlyField
                    label="Resume"
                    value={profile.resume_url}
                    icon={FileText}
                    href={profile.resume_url}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Achievements (kept from previous public profile) */}
        {profile.user_id && (
          <div className="pt-2">
            <PublicProfileAchievements userId={profile.user_id} />
          </div>
        )}
      </main>
    </div>
  );
};

export default PublicProfile;
