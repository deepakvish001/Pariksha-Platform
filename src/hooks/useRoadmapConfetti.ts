import { useCallback, useRef, useEffect } from "react";
import confetti from "canvas-confetti";

interface ConfettiOptions {
  sectionThreshold?: number; // Percentage to trigger section celebration (e.g., 25, 50, 75)
}

export function useRoadmapConfetti(options: ConfettiOptions = {}) {
  const { sectionThreshold = 25 } = options;
  const lastPercentageRef = useRef<number>(0);
  const celebratedMilestonesRef = useRef<Set<number>>(new Set());

  // Calculate milestones based on threshold
  const getMilestones = useCallback(() => {
    const milestones: number[] = [];
    for (let i = sectionThreshold; i <= 100; i += sectionThreshold) {
      milestones.push(i);
    }
    return milestones;
  }, [sectionThreshold]);

  // Small celebration for completing a topic
  const celebrateTopic = useCallback(() => {
    confetti({
      particleCount: 30,
      spread: 50,
      origin: { y: 0.7 },
      colors: ["#22c55e", "#10b981", "#34d399"],
      scalar: 0.8,
      gravity: 1.2,
      ticks: 100,
    });
  }, []);

  // Medium celebration for section milestones (25%, 50%, 75%)
  const celebrateSection = useCallback((percentage: number) => {
    const duration = 2000;
    const end = Date.now() + duration;

    const colors = percentage === 100 
      ? ["#fbbf24", "#f59e0b", "#d97706", "#eab308"] 
      : ["#8b5cf6", "#a855f7", "#c084fc", "#7c3aed"];

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors,
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();
  }, []);

  // Grand celebration for 100% completion
  const celebrateCompletion = useCallback(() => {
    const duration = 4000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 100, zIndex: 9999 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 80 * (timeLeft / duration);

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ["#fbbf24", "#f59e0b", "#22c55e", "#10b981", "#8b5cf6"],
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ["#fbbf24", "#f59e0b", "#22c55e", "#10b981", "#8b5cf6"],
      });
    }, 200);

    // Fire initial bursts
    setTimeout(() => {
      confetti({
        particleCount: 100,
        spread: 100,
        origin: { y: 0.6, x: 0.5 },
        colors: ["#fbbf24", "#f59e0b", "#22c55e"],
      });
    }, 0);

    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 80,
        origin: { x: 0 },
        colors: ["#8b5cf6", "#a855f7"],
      });
    }, 200);

    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 80,
        origin: { x: 1 },
        colors: ["#8b5cf6", "#a855f7"],
      });
    }, 400);
  }, []);

  // Check and trigger celebration based on progress change
  const checkAndCelebrate = useCallback((previousPercentage: number, newPercentage: number) => {
    const milestones = getMilestones();
    
    // Check if we crossed any milestone
    for (const milestone of milestones) {
      if (
        previousPercentage < milestone && 
        newPercentage >= milestone && 
        !celebratedMilestonesRef.current.has(milestone)
      ) {
        celebratedMilestonesRef.current.add(milestone);
        
        if (milestone === 100) {
          celebrateCompletion();
        } else {
          celebrateSection(milestone);
        }
        
        return milestone; // Return the milestone that was celebrated
      }
    }
    
    return null;
  }, [getMilestones, celebrateSection, celebrateCompletion]);

  // Track percentage changes and auto-celebrate
  const trackProgress = useCallback((currentPercentage: number) => {
    const previous = lastPercentageRef.current;
    const celebrated = checkAndCelebrate(previous, currentPercentage);
    lastPercentageRef.current = currentPercentage;
    return celebrated;
  }, [checkAndCelebrate]);

  // Reset celebrated milestones (useful when switching roadmaps)
  const resetCelebrations = useCallback(() => {
    celebratedMilestonesRef.current.clear();
    lastPercentageRef.current = 0;
  }, []);

  return {
    celebrateTopic,
    celebrateSection,
    celebrateCompletion,
    checkAndCelebrate,
    trackProgress,
    resetCelebrations,
  };
}
