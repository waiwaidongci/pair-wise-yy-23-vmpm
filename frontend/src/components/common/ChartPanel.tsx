interface ChartPanelProps {
  title: string;
  value?: string | number;
  segments: Array<{ label: string; value: number; tone?: string }>;
}

// 轻量 CSS 条形分布图（难度/正确率分布），避免引入重型图表依赖。
export function ChartPanel({ title, value, segments }: ChartPanelProps) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  return (
    <section className="panel">
      <div className="practice-panel-head">
        <h2>{title}</h2>
        {value !== undefined ? <strong className="chart-total">{value}</strong> : null}
      </div>
      <div className="chart-bars">
        {segments.map((segment) => {
          const percent = total ? Math.round((segment.value / total) * 100) : 0;
          return (
            <div className="chart-row" key={segment.label}>
              <span className="chart-label">{segment.label}</span>
              <div className="progress-track">
                <div className={`progress-bar ${segment.tone ?? ""}`} style={{ width: `${percent}%` }} />
              </div>
              <span className="chart-value">{segment.value}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
