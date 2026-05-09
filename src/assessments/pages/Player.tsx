import { useParams } from "react-router-dom";

export default function Player() {
  const { attemptId } = useParams();
  return (
    <div className="min-h-screen grid place-items-center p-6 text-center">
      <div className="max-w-md space-y-3">
        <h1 className="text-xl font-semibold">Player coming next</h1>
        <p className="text-sm text-muted-foreground">
          The interactive question player (MCQ, code, SQL, subjective) will land in the next step.
        </p>
        <p className="text-xs text-muted-foreground">Attempt: {attemptId}</p>
      </div>
    </div>
  );
}
