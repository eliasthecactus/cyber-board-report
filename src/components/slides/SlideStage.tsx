import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { SLIDE_HEIGHT, SLIDE_WIDTH } from "./slideConstants";

interface SlideStageProps {
  children: ReactNode;
  /**
   * "width"   — fit the slide to the container width (inline preview).
   * "contain" — fit inside the container preserving aspect ratio, on a black
   *             backdrop so unused space becomes letterbox bars (fullscreen).
   */
  mode: "width" | "contain";
}

/**
 * Renders a fixed 1280x720 slide scaled uniformly to fit the available space.
 * Keeping the slide at a constant authored size guarantees that the preview,
 * fullscreen presentation and PDF export are pixel-identical in layout.
 */
export function SlideStage({ children, mode }: SlideStageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) {
      return;
    }
    const update = () => {
      const { width, height } = el.getBoundingClientRect();
      const next =
        mode === "contain"
          ? Math.min(width / SLIDE_WIDTH, height / SLIDE_HEIGHT)
          : width / SLIDE_WIDTH;
      setScale(next > 0 ? next : 0);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [mode]);

  const scaled = (
    <div
      style={{
        width: SLIDE_WIDTH * scale,
        height: SLIDE_HEIGHT * scale,
        // Hide until measured to avoid a flash at scale 0/1.
        visibility: scale > 0 ? "visible" : "hidden",
      }}
    >
      <div
        style={{
          width: SLIDE_WIDTH,
          height: SLIDE_HEIGHT,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        {children}
      </div>
    </div>
  );

  if (mode === "contain") {
    return (
      <div ref={containerRef} className="flex h-full w-full items-center justify-center bg-black">
        {scaled}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full" style={{ height: SLIDE_HEIGHT * scale }}>
      {scaled}
    </div>
  );
}
