import { useId } from "react";
import { withAlpha } from "@/lib/color";
import { useBriefTheme } from "./theme";

/*
 * Small charts drawn by hand. Compared with the chart library they need no
 * width measurement, scale with their box and stay sharp in the vector PDF.
 * Labels are always HTML: text inside an SVG loses the web font in the image export.
 */

const PAD = 10;

/** Points on a 100 × 100 canvas, with the y axis pointing down. */
function plot(values: readonly number[], scale: readonly number[]): [number, number][] {
  const low = Math.min(...scale);
  const high = Math.max(...scale);
  const span = high - low || 1;
  return values.map((value, index) => [
    (index / (values.length - 1)) * 100,
    high === low ? 50 : PAD + (1 - (value - low) / span) * (100 - 2 * PAD),
  ]);
}

/** A smooth line that never overshoots its points. */
function linePath(points: readonly [number, number][]): string {
  return points
    .map(([x, y], index) => {
      if (index === 0) {
        return `M ${x} ${y}`;
      }
      const [px, py] = points[index - 1];
      const mid = (px + x) / 2;
      return `C ${mid} ${py} ${mid} ${y} ${x} ${y}`;
    })
    .join(" ");
}

interface SparklineProps {
  values: readonly number[];
  color: string;
  /** Drawn as a dashed line and included in the scale. */
  target?: number;
  className?: string;
}

/** Area chart without axes. Renders nothing below two values. */
export function Sparkline({ values, color, target, className = "" }: SparklineProps) {
  const theme = useBriefTheme();
  const gradient = `spark-${useId().replace(/\W/g, "")}`;
  if (values.length < 2) {
    return null;
  }
  const scale = target === undefined ? values : [...values, target];
  const points = plot(values, scale);
  const line = linePath(points);
  const [lastX, lastY] = points[points.length - 1];
  const targetY = target === undefined ? null : plot([target, target], scale)[0][1];

  return (
    <div className={`relative ${className}`} aria-hidden>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible">
        <defs>
          <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={color} stopOpacity="0.32" />
            <stop offset="1" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`${line} L ${lastX} 100 L 0 100 Z`} fill={`url(#${gradient})`} />
        {targetY !== null && (
          <line
            x1="0"
            x2="100"
            y1={targetY}
            y2={targetY}
            stroke={theme.muted}
            strokeWidth="1"
            strokeDasharray="3 3"
            vectorEffect="non-scaling-stroke"
          />
        )}
        <path
          d={line}
          fill="none"
          stroke={color}
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <span
        className="absolute h-[7px] w-[7px] rounded-full"
        style={{
          left: `${lastX}%`,
          top: `${lastY}%`,
          transform: "translate(-50%, -50%)",
          backgroundColor: color,
          outline: `3px solid ${withAlpha(color, 0.25)}`,
        }}
      />
    </div>
  );
}

/** "3 of 7" as a row of marks, or as a bar when there are too many to count. */
export function PartOfWhole({ part, total, color }: { part: number; total: number; color: string }) {
  const theme = useBriefTheme();
  if (total <= 0) {
    return null;
  }
  if (total > 12) {
    return (
      <span aria-hidden className="block h-[5px] w-24 overflow-hidden rounded-full" style={{ backgroundColor: theme.line }}>
        <span
          className="block h-full rounded-full"
          style={{ width: `${(part / total) * 100}%`, backgroundColor: color }}
        />
      </span>
    );
  }
  return (
    <span aria-hidden className="flex gap-[3px]">
      {Array.from({ length: total }, (_, index) => (
        <span
          key={index}
          className="h-[5px] w-3 rounded-full"
          style={{ backgroundColor: index < part ? color : theme.line }}
        />
      ))}
    </span>
  );
}

/** One bar split by share, for the composition of a whole. */
export function StackedBar({ parts }: { parts: readonly { key: string; value: number; color: string }[] }) {
  return (
    <div aria-hidden className="flex h-2 gap-[3px]">
      {parts
        .filter((part) => part.value > 0)
        .map((part) => (
          <span key={part.key} className="rounded-full" style={{ flexGrow: part.value, backgroundColor: part.color }} />
        ))}
    </div>
  );
}
