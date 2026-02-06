import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bell, Check, Trash2, UserPlus, Trophy, Target, 
  TrendingUp, Filter, CheckCheck, Clock, Sparkles, Settings 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useNotifications, Notification } from "@/hooks/useNotifications";
import { formatDistanceToNow, format } from "date-fns";
import { Link } from "react-router-dom";

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "new_follower":
      return <UserPlus className="h-5 w-5 text-blue-500" />;
    case "rare_achievement":
      return <Trophy className="h-5 w-5 text-amber-500" />;
    case "velocity_reminder":
      return <TrendingUp className="h-5 w-5 text-orange-500" />;
    case "goal_milestone":
      return <Target className="h-5 w-5 text-green-500" />;
    case "streak_reminder":
      return <Sparkles className="h-5 w-5 text-purple-500" />;
    default:
      return <Bell className="h-5 w-5 text-muted-foreground" />;
  }
};

const getNotificationCategory = (type: string): "learning" | "social" | "achievements" | "all" => {
  switch (type) {
    case "velocity_reminder":
    case "goal_milestone":
    case "streak_reminder":
      return "learning";
    case "new_follower":
      return "social";
    case "rare_achievement":
      return "achievements";
    default:
      return "all";
  }
};

const NotificationItem = ({
  notification,
  onMarkRead,
  onDelete,
}: {
  notification: Notification;
  onMarkRead: () => void;
  onDelete: () => void;
}) => {
  const data = notification.data as Record<string, unknown>;

  const getActionLink = () => {
    switch (notification.type) {
      case "velocity_reminder":
        return data.roadmap_id ? `/research/roadmap/${data.roadmap_id}` : null;
      case "new_follower":
        return "/dashboard/profile";
      case "rare_achievement":
        return "/achievements";
      default:
        return null;
    }
  };

  const actionLink = getActionLink();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={cn(
        "p-4 rounded-lg border transition-all hover:shadow-sm",
        !notification.read && "bg-primary/5 border-primary/20"
      )}
    >
      <div className="flex items-start gap-4">
        <div className="p-2 rounded-full bg-muted">
          {getNotificationIcon(notification.type)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className={cn("text-sm font-medium", !notification.read && "text-primary")}>
              {notification.title}
            </h4>
            {!notification.read && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                New
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mb-2">
            {notification.message}
          </p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
            </span>
            {actionLink && (
              <Link
                to={actionLink}
                className="text-primary hover:underline"
              >
                View details →
              </Link>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {!notification.read && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onMarkRead}
              title="Mark as read"
            >
              <Check className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={onDelete}
            title="Delete notification"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

const EmptyState = ({ category }: { category: string }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="p-4 rounded-full bg-muted mb-4">
      <Bell className="h-8 w-8 text-muted-foreground" />
    </div>
    <h3 className="font-medium mb-1">No notifications</h3>
    <p className="text-sm text-muted-foreground">
      {category === "all" 
        ? "You're all caught up! Check back later for updates."
        : `No ${category} notifications yet.`}
    </p>
  </div>
);

export default function NotificationCenter() {
  const [activeTab, setActiveTab] = useState("all");
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === "all") return true;
    if (activeTab === "unread") return !n.read;
    return getNotificationCategory(n.type) === activeTab;
  });

  const categoryCounts = {
    learning: notifications.filter((n) => getNotificationCategory(n.type) === "learning").length,
    social: notifications.filter((n) => getNotificationCategory(n.type) === "social").length,
    achievements: notifications.filter((n) => getNotificationCategory(n.type) === "achievements").length,
  };

  return (
    <div className="container max-w-4xl py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="h-6 w-6" />
            Notification Center
          </h1>
          <p className="text-muted-foreground mt-1">
            Stay updated on your learning progress and achievements
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
              <CheckCheck className="h-4 w-4 mr-2" />
              Mark all read ({unreadCount})
            </Button>
          )}
          <Link to="/dashboard/notifications/preferences">
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Preferences
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <TrendingUp className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{categoryCounts.learning}</p>
                <p className="text-xs text-muted-foreground">Learning Reminders</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <UserPlus className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{categoryCounts.social}</p>
                <p className="text-xs text-muted-foreground">Social Updates</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Trophy className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{categoryCounts.achievements}</p>
                <p className="text-xs text-muted-foreground">Achievements</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="all" className="gap-2">
            All
            <Badge variant="secondary" className="ml-1">{notifications.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="unread" className="gap-2">
            Unread
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-1">{unreadCount}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="learning">Learning</TabsTrigger>
          <TabsTrigger value="social">Social</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
        </TabsList>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground">
                Loading notifications...
              </div>
            ) : filteredNotifications.length === 0 ? (
              <EmptyState category={activeTab} />
            ) : (
              <ScrollArea className="h-[500px]">
                <div className="p-4 space-y-3">
                  <AnimatePresence mode="popLayout">
                    {filteredNotifications.map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onMarkRead={() => markAsRead(notification.id)}
                        onDelete={() => deleteNotification(notification.id)}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </Tabs>
    </div>
  );
}
