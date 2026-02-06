import { createRoot } from "react-dom/client";
import { useState, useEffect, useCallback } from "react";
import App from "./App.tsx";
import LoadingScreen from "./components/LoadingScreen.tsx";
import "./index.css";

// Loading stages with their weight in the total progress
const LOADING_STAGES = {
  INIT: { name: "Initializing...", weight: 10 },
  STYLES: { name: "Loading styles...", weight: 15 },
  SCRIPTS: { name: "Loading scripts...", weight: 25 },
  ASSETS: { name: "Loading assets...", weight: 25 },
  RENDER: { name: "Preparing interface...", weight: 15 },
  COMPLETE: { name: "Almost ready...", weight: 10 },
} as const;

const AppWithLoader = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [loadingStage, setLoadingStage] = useState<string>(LOADING_STAGES.INIT.name);

  const updateProgress = useCallback((stage: keyof typeof LOADING_STAGES, stageProgress: number = 100) => {
    const stages = Object.keys(LOADING_STAGES) as (keyof typeof LOADING_STAGES)[];
    const stageIndex = stages.indexOf(stage);
    
    // Calculate cumulative progress from previous stages
    let cumulativeProgress = 0;
    for (let i = 0; i < stageIndex; i++) {
      cumulativeProgress += LOADING_STAGES[stages[i]].weight;
    }
    
    // Add current stage's partial progress
    const currentStageContribution = (LOADING_STAGES[stage].weight * stageProgress) / 100;
    const totalProgress = Math.min(cumulativeProgress + currentStageContribution, 100);
    
    setProgress(totalProgress);
    setLoadingStage(LOADING_STAGES[stage].name);
  }, []);

  useEffect(() => {
    const minLoadTime = 1800;
    const startTime = Date.now();
    let resourcesLoaded = 0;
    let totalResources = 0;

    // Start with init
    updateProgress("INIT", 100);

    // Simulate styles loading
    const stylesTimeout = setTimeout(() => {
      updateProgress("STYLES", 100);
    }, 200);

    // Track actual resource loading
    const trackResources = () => {
      const performance = window.performance;
      if (performance && performance.getEntriesByType) {
        const resources = performance.getEntriesByType("resource");
        totalResources = resources.length || 1;
        
        // Count loaded resources
        resourcesLoaded = resources.filter((r: PerformanceResourceTiming) => 
          r.responseEnd > 0
        ).length;

        const resourceProgress = Math.min((resourcesLoaded / totalResources) * 100, 100);
        
        if (resourceProgress < 50) {
          updateProgress("SCRIPTS", resourceProgress * 2);
        } else {
          updateProgress("ASSETS", (resourceProgress - 50) * 2);
        }
      }
    };

    // Poll for resource loading progress
    const resourceInterval = setInterval(trackResources, 100);

    const handleLoad = () => {
      clearInterval(resourceInterval);
      
      // Render stage
      updateProgress("RENDER", 50);
      
      setTimeout(() => {
        updateProgress("RENDER", 100);
      }, 200);

      setTimeout(() => {
        updateProgress("COMPLETE", 50);
      }, 400);

      setTimeout(() => {
        updateProgress("COMPLETE", 100);
      }, 600);

      // Calculate remaining time to meet minimum load time
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, minLoadTime - elapsed);

      setTimeout(() => {
        setIsLoading(false);
      }, remaining + 300);
    };

    // Check if document is already loaded
    if (document.readyState === "complete") {
      handleLoad();
    } else {
      window.addEventListener("load", handleLoad);
      return () => {
        window.removeEventListener("load", handleLoad);
        clearTimeout(stylesTimeout);
        clearInterval(resourceInterval);
      };
    }

    return () => {
      clearTimeout(stylesTimeout);
      clearInterval(resourceInterval);
    };
  }, [updateProgress]);

  return (
    <>
      <LoadingScreen 
        isLoading={isLoading} 
        progress={progress} 
        loadingStage={loadingStage}
      />
      <App />
    </>
  );
};

createRoot(document.getElementById("root")!).render(<AppWithLoader />);
