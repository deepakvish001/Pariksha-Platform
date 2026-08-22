import { Link, useNavigate } from "react-router-dom";
import { BookOpen, Plus, Trash2, Globe, Lock, MoreVertical, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAIContent } from "@/hooks/useAIContent";
import { formatDistanceToNow } from "date-fns";

interface CourseContent {
  overview?: string;
  difficulty?: string;
  modules?: Array<{ title: string; lessons: Array<unknown> }>;
}

const MyCourses = () => {
  const navigate = useNavigate();
  const { contents, isLoading, deleteContent, togglePublic } = useAIContent("course");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">My Courses</h1>
            <p className="text-muted-foreground mt-1">AI-generated courses with structured modules</p>
          </div>
          <Button asChild>
            <Link to="/platform/ai/generate?type=course">
              <Plus className="h-4 w-4 mr-2" />
              Create Course
            </Link>
          </Button>
        </div>

        {contents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <BookOpen className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">No courses yet</h2>
            <p className="text-muted-foreground max-w-md mb-6">
              Create your first AI-powered course to get a structured learning path on any topic.
            </p>
            <Button asChild>
              <Link to="/platform/ai/generate?type=course">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Course
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {contents.map((course) => {
              const content = course.content as CourseContent;
              return (
                <Card 
                  key={course.id} 
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(`/platform/ai/content/${course.id}`)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <CardTitle className="text-lg">{course.title}</CardTitle>
                          {content.difficulty && (
                            <Badge variant="outline" className="capitalize">
                              {content.difficulty}
                            </Badge>
                          )}
                          {course.is_public ? (
                            <Badge variant="secondary" className="gap-1">
                              <Globe className="h-3 w-3" />
                              Public
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="gap-1">
                              <Lock className="h-3 w-3" />
                              Private
                            </Badge>
                          )}
                        </div>
                        <CardDescription className="line-clamp-2">
                          {content.overview || `A course about ${course.topic}`}
                        </CardDescription>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" aria-label={`More options for ${course.title}`} className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => { e.stopPropagation(); togglePublic.mutate({ id: course.id, isPublic: !course.is_public }); }}
                          >
                            {course.is_public ? (
                              <>
                                <Lock className="h-4 w-4 mr-2" />
                                Make Private
                              </>
                            ) : (
                              <>
                                <Globe className="h-4 w-4 mr-2" />
                                Make Public
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={(e) => { e.stopPropagation(); deleteContent.mutate(course.id); }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-4">
                        {content.modules && (
                          <span className="flex items-center gap-1">
                            <GraduationCap className="h-4 w-4" />
                            {content.modules.length} modules
                          </span>
                        )}
                      </div>
                      <span>
                        Created {formatDistanceToNow(new Date(course.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyCourses;
