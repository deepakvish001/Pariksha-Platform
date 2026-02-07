import { BookOpen, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const MyCourses = () => {
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
      </div>
    </div>
  );
};

export default MyCourses;
