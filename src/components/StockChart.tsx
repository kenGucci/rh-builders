"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface StockChartProps {
  symbol: string;
  height?: number;
  defaultRange?: string;
  initialData?: Candle[];
  live?: boolean;
}

const RANGES = ["1d", "5d", "1mo", "3mo", "6mo", "1y", "5y"];

export default function StockChart({ symbol, height = 260, defaultRange = "3mo", initialData, live = false }: StockChartProps) {
  const [range, setRange] = useState(defaultRange);
  const [data, setData] = useState<Candle[]>(initialData ?? []);
  const [loading, setLoading] = useState(!initialData || initialData.length === 0);
  const [hover, setHover] = useState<{ index: number; x: number; y: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: height });
  const skipFetchRef = useRef(!!initialData && initialData.length > 0);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (skipFetchRef.current && range === defaultRange) {
        skipFetchRef.current = false;
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(`/api/market?action=chart&symbol=${encodeURIComponent(symbol)}&range=${range}`);
        const json = await res.json();
        if (active && json.chart?.candles) setData(json.chart.candles);
      } catch {}
      finally { if (active) setLoading(false); }
    };
    load();
    return () => { active = false; };
  }, [symbol, range, defaultRange]);

  useEffect(() => {
    if (initialData && initialData.length > 0) {
      setData(initialData);
      setLoading(false);
    }
  }, [initialData]);

  useEffect(() => {
    if (!live) return;
    const interval = setInterval(() => {
      fetch(`/api/market?action=chart&symbol=${encodeURIComponent(symbol)}&range=${range}`)
        .then((r) => r.json())
        .then((json) => { if (json.chart?.candles) setData(json.chart.candles); })
        .catch(() => {});
    }, 20000);
    return () => clearInterval(interval);
  }, [symbol, range, live]);

  useEffect(() => {
    const measure = () => {
      if (!containerRef.current) return;
      setSize({ w: Math.max(0, containerRef.current.clientWidth - 16), h: height });
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [height]);

  const stats = useMemo(() => {
    if (data.length === 0) return null;
    const closes = data.map((c) => c.close);
    const first = closes[0];
    const last = closes[closes.length - 1];
    const max = Math.max(...data.map((c) => c.high));
    const min = Math.min(...data.map((c) => c.low));
    const totalVolume = data.reduce((sum, c) => sum + c.volume, 0);
    const change = last - first;
    const changePct = first > 0 ? (change / first) * 100 : 0;
    return { first, last, max, min, change, changePct, totalVolume };
  }, [data]);

  const geometry = useMemo(() => {
    if (data.length === 0 || size.w === 0) return null;
    const padL = 8, padR = 8, padT = 12, padB = 20;
    const plotW = size.w - padL - padR;
    const plotH = size.h - padT - padB;
    const max = stats!.max;
    const min = stats!.min;
    const rangeVal = max - min || 1;
    const pts = data.map((c, i) => ({
      x: padL + (i / (data.length - 1)) * plotW,
      y: padT + ((max - c.close) / rangeVal) * plotH,
    }));
    let line = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      line += ` L ${pts[i].x} ${pts[i].y}`;
    }
    const fill = `${line} L ${pts[pts.length - 1].x} ${size.h - padB} L ${pts[0].x} ${size.h - padB} Z`;

    const volMax = Math.max(...data.map((c) => c.volume)) || 1;
    const volH = 36;
    const volY = size.h - padB;
    const vol = data.map((c, i) => ({
      x: padL + (i / (data.length - 1)) * plotW,
      w: Math.max(1, plotW / data.length * 0.6),
      h: (c.volume / volMax) * volH,
    }));

    return { pts, line, fill, vol, volY, padL, plotW };
  }, [data, size, stats]);

  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!geometry || data.length === 0) return;
    const rect = svgRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const rel = (x - geometry.padL) / geometry.plotW;
    const idx = Math.max(0, Math.min(data.length - 1, Math.round(rel * (data.length - 1))));
    const px = geometry.pts[idx].x;
    const py = geometry.pts[idx].y;
    setHover({ index: idx, x: px, y: py });
  };

  const fmtDate = (t: number) => {
    const d = new Date(t * 1000);
    if (range === "1d") return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return d.toLocaleDateString([], { month: "short", day: "numeric", year: d.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined });
  };

  const fmtPrice = (p: number) => `$${p >= 1000 ? p.toLocaleString(undefined, { maximumFractionDigits: 0 }) : p >= 100 ? p.toFixed(2) : p >= 1 ? p.toFixed(2) : p.toFixed(4)}`;

  const hoverCandle = hover ? data[hover.index] : null;
  const positive = (stats?.changePct ?? 0) >= 0;
  const color = positive ? "#22c55e" : "#ef4444";

  return (
    <div className="w-full">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold text-[var(--foreground)]">{stats ? fmtPrice(stats.last) : "—"}</span>
          {stats && (
            <span className={`flex items-center gap-1 text-xs font-semibold ${positive ? "text-green-400" : "text-red-400"}`}>
              {positive ? "+" : ""}{stats.changePct.toFixed(2)}%
            </span>
          )}
        </div>
        <div className="flex gap-1">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-2 py-1 rounded-md text-[10px] font-medium transition-colors ${
                range === r
                  ? "bg-[var(--accent)] text-black"
                  : "bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--foreground)]"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div ref={containerRef} className="relative rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] p-2">
        {loading && (
          <div className="flex items-center justify-center" style={{ height }}>
            <Loader2 size={18} className="animate-spin text-[var(--accent)]" />
          </div>
        )}
        {!loading && (!geometry || data.length === 0) && (
          <div style={{ height }} />
        )}
        {!loading && geometry && (
          <svg
            ref={svgRef}
            width={size.w}
            style={{ height }}
            className="block cursor-crosshair select-none"
            onMouseMove={onMove}
            onMouseLeave={() => setHover(null)}
          >
            <defs>
              <linearGradient id={`cg-${symbol}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={color} stopOpacity="0.25" />
                <stop offset="100%" stopColor={color} stopOpacity="0" />
              </linearGradient>
            </defs>

            <path d={geometry.fill} fill={`url(#cg-${symbol})`} />
            <path d={geometry.line} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />

            {geometry.vol.map((v, i) => (
              <rect
                key={i}
                x={v.x - v.w / 2}
                y={geometry.volY - v.h}
                width={v.w}
                height={v.h}
                fill={data[i].close >= data[i].open ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)"}
              />
            ))}

            {hover && (
              <g>
                <line x1={hover.x} y1={12} x2={hover.x} y2={size.h - 20} stroke={color} strokeOpacity="0.4" strokeDasharray="3 3" />
                <circle cx={hover.x} cy={hover.y} r="4" fill={color} />
              </g>
            )}
          </svg>
        )}

        {!loading && hoverCandle && (
          <div className="pointer-events-none absolute top-2 left-1/2 -translate-x-1/2 bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-1.5 shadow-lg text-[10px] space-y-0.5 z-10">
            <div className="text-[var(--text-muted)]">{fmtDate(hoverCandle.time)}</div>
            <div className="font-semibold text-[var(--foreground)]">O {fmtPrice(hoverCandle.open)} · H {fmtPrice(hoverCandle.high)}</div>
            <div className="font-semibold text-[var(--foreground)]">L {fmtPrice(hoverCandle.low)} · C {fmtPrice(hoverCandle.close)}</div>
            <div className="text-[var(--text-muted)]">Vol {hoverCandle.volume.toLocaleString()}</div>
          </div>
        )}
      </div>
    </div>
  );
}
