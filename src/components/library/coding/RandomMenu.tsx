import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Shuffle, ChevronDown, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { CODING_PROBLEMS, type CodingProblem } from "@/data/codingProblemsData";

interface Props {
  filtered: CodingProblem[];
}

const dailyPick = () => {
  const day = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  return CODING_PROBLEMS[day % CODING_PROBLEMS.length];
};

export const RandomMenu = ({ filtered }: Props) => {
  const navigate = useNavigate();

  const go = (list: CodingProblem[]) => {
    if (!list.length) return;
    const pick = list[Math.floor(Math.random() * list.length)];
    navigate(`/library/problems/${pick.slug}`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Shuffle className="h-4 w-4" />
          Random
          <ChevronDown className="h-3.5 w-3.5 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Pick a problem</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => go(filtered)}>
          From current filters ({filtered.length})
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => go(CODING_PROBLEMS)}>Any problem</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => go(CODING_PROBLEMS.filter((p) => p.difficulty === "Easy"))}>
          Random Easy
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => go(CODING_PROBLEMS.filter((p) => p.difficulty === "Medium"))}>
          Random Medium
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => go(CODING_PROBLEMS.filter((p) => p.difficulty === "Hard"))}>
          Random Hard
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate(`/library/problems/${dailyPick().slug}`)}>
          <Sparkles className="h-3.5 w-3.5 mr-2 text-amber-500" />
          Daily Challenge
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
