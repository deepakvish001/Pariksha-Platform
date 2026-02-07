import { HelpCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const MyQuizzes = () => {
  return (
    <div className="min-h-screen bg-background p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">My Quizzes</h1>
            <p className="text-muted-foreground mt-1">AI-generated quizzes to test your knowledge</p>
          </div>
          <Button asChild>
            <Link to="/platform/ai/generate?type=quiz">
              <Plus className="h-4 w-4 mr-2" />
              Create Quiz
            </Link>
          </Button>
        </div>

        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <HelpCircle className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">No quizzes yet</h2>
          <p className="text-muted-foreground max-w-md mb-6">
            Create your first AI-powered quiz to test and reinforce your learning.
          </p>
          <Button asChild>
            <Link to="/platform/ai/generate?type=quiz">
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Quiz
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MyQuizzes;
