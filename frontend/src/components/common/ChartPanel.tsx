import { useMemo } from "react";

export interface BarDatum {
  label: string;
  value: number;
  hint?: string;
  tone?: "good" | "warn" | "bad" | "neutral";
}

interface ChartPanelProps {
  title: string;
  subtitle?: string;
  type?: "bars" | "line" | "donut";
  data: BarDatum[];
  emptyText?: string;
  /** line 模式的满分线 */
  max?: number;
}

const TONE_CLASS: Record<NonNullable<BarDatum["tone"]>, string> = {
  good: "chart-bar--good",
  warn: "chart-bar--warn",
  bad: "chart-bar--bad",
  neutral: "chart-bar--neutral"
};

/** 纯 SVG/CSS 图表面板：得分趋势、错题原因、难度分布共用，无第三方请求。 */
export function ChartPanel({ title, subtitle, type = "bars", data, emptyText = "暂无可统计数据", max }: ChartPanelProps) {
  const maxValue = useMemo(() => Math.max(max ?? 0, ...data.map((item) => item.value), 1), [data, max]);

  return (
    <section className="panel chart-panel">
      <header className="chart-panel__head">
        <h2>{title}</h2>
        {subtitle ? <p>{subtitle}</p> : null}
      </header>
      {data.length === 0 ? (
        <div className="chart-panel__empty">{emptyText}</div>
      ) : type === "line" ? (
        <LineChart data={data} maxValue={maxValue} />
      ) : type === "donut" ? (
        <DonutChart data={data} />
      ) : (
        <div className="chart-bars">
          {data.map((item) => (
            <div className="chart-row" key={item.label} title={item.hint}>
              <span className="chart-row__label">{item.label}</span>
              <div className="chart-row__track">
                <div
                  className={`chart-bar ${TONE_CLASS[item.tone ?? "neutral"]}`}
                  style={{ width: `${Math.max(2, (item.value / maxValue) * 100)}%` }}
                />
              </div>
              <span className="chart-row__value">{item.value}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function LineChart({ data, maxValue }: { data: BarDatum[]; maxValue: number }) {
  const width = 460;
  const height = 180;
  const pad = 28;
  const points = data.map((item, index) => {
    const x = data.length === 1 ? width / 2 : pad + (index * (width - pad * 2)) / (data.length - 1);
    const y = height - pad - (item.value / maxValue) * (height - pad * 2);
    return { x, y, item };
  });
  const path = points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`).join(" ");
  return (
    <svg className="chart-line" viewBox={`0 0 ${width} ${height}`} role="img">
      {[0, 0.5, 1].map((ratio) => {
        const y = height - pad - ratio * (height - pad * 2);
        return <line key={ratio} x1={pad} x2={width - pad} y1={y} y2={y} className="chart-line__grid" />;
      })}
      <path d={path} className="chart-line__path" />
      {points.map((point) => (
        <g key={point.item.label}>
          <circle cx={point.x} cy={point.y} r={4} className="chart-line__dot" />
          <text x={point.x} y={point.y - 8} className="chart-line__text" textAnchor="middle">
            {point.item.value}
          </text>
          <text x={point.x} y={height - 8} className="chart-line__axis" textAnchor="middle">
            {point.item.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

function DonutChart({ data }: { data: BarDatum[] }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  return (
    <div className="chart-donut-wrap">
      <svg viewBox="0 0 160 160" className="chart-donut">
        <circle cx="80" cy="80" r={radius} fill="none" className="chart-donut__track" strokeWidth="18" />
        {total > 0
          ? data.map((item) => {
              const length = (item.value / total) * circumference;
              const segment = (
                <circle
                  key={item.label}
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="none"
                  strokeWidth="18"
                  strokeDasharray={`${length} ${circumference - length}`}
                  strokeDashoffset={-offset}
                  className={`chart-donut__seg ${TONE_CLASS[item.tone ?? "neutral"]}`}
                />
              );
              offset += length;
              return segment;
            })
          : null}
        <text x="80" y="86" textAnchor="middle" className="chart-donut__total">
          {total}
        </text>
      </svg>
      <ul className="chart-legend">
        {data.map((item) => (
          <li key={item.label}>
            <span className={`chart-legend__dot ${TONE_CLASS[item.tone ?? "neutral"]}`} />
            {item.label} <strong>{item.value}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}
