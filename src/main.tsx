import { createRoot } from "react-dom/client";
import { useState, useEffect, Suspense } from "react";
import App from "./App.tsx";
import LoadingScreen from "./components/LoadingScreen.tsx";
import "./index.css";

const AppWithLoader = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Minimum display time for the loading screen
    const minLoadTime = 1500;
    const startTime = Date.now();

    const handleLoad = () => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, minLoadTime - elapsed);
      
      setTimeout(() => {
        setIsLoading(false);
      }, remaining);
    };

    // Check if document is already loaded
    if (document.readyState === "complete") {
      handleLoad();
    } else {
      window.addEventListener("load", handleLoad);
      return () => window.removeEventListener("load", handleLoad);
    }
  }, []);

  return (
    <>
      <LoadingScreen isLoading={isLoading} />
      <App />
    </>
  );
};

createRoot(document.getElementById("root")!).render(<AppWithLoader />);
