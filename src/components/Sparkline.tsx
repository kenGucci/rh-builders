import { useRef, useMemo } from "react";

interface SparklineProps {
  data: number[];
  color?: string;
  className?: string;
}

export default function Sparkline({ data, color = "var(--accent)", className = "" }: SparklineProps) {
  const pathRef = useRef<SVGPathElement>(null);

  const { linePath, fillPath, gradientId } = useMemo(() => {
    if (!data.length) return { linePath: "", fillPath: "", gradientId: "" };

    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const width = 100;
    const height = 28;
    const padding = 2;

    const points = data.map((val, i) => ({
      x: (i / (data.length - 1)) * width,
      y: padding + ((max - val) / range) * (height - padding * 2),
    }));

    let line = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpx1 = prev.x + (curr.x - prev.x) / 3;
      const cpx2 = curr.x - (curr.x - prev.x) / 3;
      line += ` C ${cpx1} ${prev.y}, ${cpx2} ${curr.y}, ${curr.x} ${curr.y}`;
    }

    const fill = line + ` L ${width} ${height} L 0 ${height} Z`;
    const gid = `sparkGrad-${Math.random().toString(36).slice(2, 8)}`;

    return { linePath: line, fillPath: fill, gradientId: gid };
  }, [data]);

  if (!data.length) return null;

  return (
    <span className={`sparkline ${className}`} style={{ "--sparkline-color": color } as React.CSSProperties}>
      <svg viewBox="0 0 100 28" preserveAspectRatio="none">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.2" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path className="sparkline-fill" d={fillPath} fill={`url(#${gradientId})`} />
        <path ref={pathRef} className="sparkline-path" d={linePath} />
      </svg>
    </span>
  );
}
