import { useLayoutEffect, useRef, useState, type ReactElement } from "react";

interface FixedChartProps {
  height: number;
  children: (width: number) => ReactElement;
}

/**
 * Measures its (unscaled) width synchronously in a layout effect and renders
 * the chart at that exact size. Unlike Recharts' ResponsiveContainer, which
 * waits for a ResizeObserver callback, the chart is present in the very
 * first committed frame, so PDF capture never sees an empty box.
 */
export function FixedChart({ height, children }: FixedChartProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    // offsetWidth ignores the CSS scale() applied by SlideStage.
    setWidth(ref.current?.offsetWidth ?? 0);
  }, []);

  return (
    <div ref={ref} style={{ height, width: "100%" }}>
      {width > 0 && children(width)}
    </div>
  );
}
