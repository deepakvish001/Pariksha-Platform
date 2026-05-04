import { Outlet } from "react-router-dom";

/**
 * Bare layout used while a participant is solving a problem inside an
 * active secure contest session. Intentionally renders no sidebar and no
 * dashboard chrome — just the page outlet. The page itself renders its
 * own ContestTopBar and SecureProblemHUD.
 */
export default function ContestKioskLayout() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-background text-foreground">
      <Outlet />
    </div>
  );
}
