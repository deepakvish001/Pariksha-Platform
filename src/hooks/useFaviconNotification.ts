import { useEffect, useRef, useCallback } from "react";
import { useNotifications } from "@/hooks/useNotifications";

const ORIGINAL_FAVICON = "/favicon.png";
const BADGE_COLOR = "#f97316"; // Primary orange color
const BADGE_PULSE_COLOR = "#ea580c"; // Slightly darker for pulse

export const useFaviconNotification = () => {
  const { unreadCount } = useNotifications();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const originalImageRef = useRef<HTMLImageElement | null>(null);
  const pulseIntervalRef = useRef<number | null>(null);
  const isPulsingRef = useRef(false);

  // Create canvas and load original favicon
  const setupCanvas = useCallback(() => {
    if (!canvasRef.current) {
      canvasRef.current = document.createElement("canvas");
      canvasRef.current.width = 32;
      canvasRef.current.height = 32;
    }

    if (!originalImageRef.current) {
      originalImageRef.current = new Image();
      originalImageRef.current.crossOrigin = "anonymous";
      originalImageRef.current.src = ORIGINAL_FAVICON;
    }

    return { canvas: canvasRef.current, image: originalImageRef.current };
  }, []);

  // Draw favicon with optional notification badge
  const drawFavicon = useCallback((count: number, isPulsing: boolean = false) => {
    const { canvas, image } = setupCanvas();
    const ctx = canvas.getContext("2d");
    if (!ctx || !image.complete) return;

    // Clear canvas
    ctx.clearRect(0, 0, 32, 32);

    // Draw original favicon
    ctx.drawImage(image, 0, 0, 32, 32);

    if (count > 0) {
      // Draw notification badge
      const badgeSize = count > 9 ? 16 : 14;
      const badgeX = 32 - badgeSize + 2;
      const badgeY = -2;

      // Badge background with glow effect
      ctx.shadowColor = isPulsing ? BADGE_PULSE_COLOR : BADGE_COLOR;
      ctx.shadowBlur = isPulsing ? 6 : 4;
      
      // Draw badge circle
      ctx.beginPath();
      ctx.arc(badgeX + badgeSize / 2, badgeY + badgeSize / 2, badgeSize / 2, 0, Math.PI * 2);
      ctx.fillStyle = isPulsing ? BADGE_PULSE_COLOR : BADGE_COLOR;
      ctx.fill();

      // Reset shadow
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;

      // Draw count text
      ctx.fillStyle = "#ffffff";
      ctx.font = `bold ${count > 9 ? 9 : 10}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const displayText = count > 9 ? "9+" : count.toString();
      ctx.fillText(displayText, badgeX + badgeSize / 2, badgeY + badgeSize / 2 + 1);
    }

    // Update favicon
    updateFavicon(canvas.toDataURL("image/png"));
  }, [setupCanvas]);

  // Update the actual favicon element
  const updateFavicon = useCallback((dataUrl: string) => {
    let link = document.querySelector<HTMLLinkElement>("link[rel*='icon']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = dataUrl;
    link.type = "image/png";
  }, []);

  // Reset to original favicon
  const resetFavicon = useCallback(() => {
    updateFavicon(ORIGINAL_FAVICON);
  }, [updateFavicon]);

  // Start pulse animation
  const startPulse = useCallback((count: number) => {
    if (pulseIntervalRef.current) {
      clearInterval(pulseIntervalRef.current);
    }

    let pulseState = false;
    pulseIntervalRef.current = window.setInterval(() => {
      pulseState = !pulseState;
      drawFavicon(count, pulseState);
    }, 800); // Pulse every 800ms

    isPulsingRef.current = true;
  }, [drawFavicon]);

  // Stop pulse animation
  const stopPulse = useCallback(() => {
    if (pulseIntervalRef.current) {
      clearInterval(pulseIntervalRef.current);
      pulseIntervalRef.current = null;
    }
    isPulsingRef.current = false;
  }, []);

  // Main effect to handle notification changes
  useEffect(() => {
    const { image } = setupCanvas();

    const handleImageLoad = () => {
      if (unreadCount > 0) {
        drawFavicon(unreadCount, false);
        startPulse(unreadCount);
      } else {
        stopPulse();
        resetFavicon();
      }
    };

    if (image.complete) {
      handleImageLoad();
    } else {
      image.onload = handleImageLoad;
    }

    return () => {
      stopPulse();
    };
  }, [unreadCount, setupCanvas, drawFavicon, startPulse, stopPulse, resetFavicon]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPulse();
      resetFavicon();
    };
  }, [stopPulse, resetFavicon]);

  return { unreadCount };
};
