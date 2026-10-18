import { useEffect, useId, useRef, useState } from 'react';

export default function ArchiveChart({ data, unit }) {
  const id = useId();
  const container = useRef(null);
  const [width, setWidth] = useState(640);
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) =>
      setWidth(Math.max(220, Math.round(entry.contentRect.width))),
    );
    observer.observe(container.current);
    return () => observer.disconnect();
  }, []);
  const height = 252,
    left = 34,
    right = 12,
    top = 28,
    bottom = 30;
  const plotHeight = height - top - bottom;
  const largest = Math.max(1, ...data.map((point) => point.count));
  const step = Math.max(1, Math.ceil(largest / 4));
  const max = step * 4;
  const slot = (width - left - right) / Math.max(1, data.length);
  const barWidth = Math.min(52, slot * 0.55);
  const y = (value) => top + plotHeight - (value / max) * plotHeight;
  const interval = Math.max(1, Math.ceil(data.length / (width < 400 ? 7 : 14)));
  const hasData = data.some((point) => point.count);
  return (
    <div ref={container} className="report-chart">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-labelledby={id}>
        <title id={id}>
          Jumlah surat per {unit}. Nilai lengkap tersedia pada tabel rincian
          grafik.
        </title>
        {[0, 1, 2, 3, 4].map((index) => (
          <g key={index}>
            <line
              x1={left}
              x2={width - right}
              y1={y(index * step)}
              y2={y(index * step)}
              stroke="var(--line)"
              strokeDasharray={index ? '3 5' : undefined}
            />
            <text
              x={left - 9}
              y={y(index * step) + 4}
              textAnchor="end"
              fill="var(--text-muted)"
              fontSize="10"
            >
              {index * step}
            </text>
          </g>
        ))}
        {hasData &&
          data.map((point, index) => {
            const x = left + slot * index + (slot - barWidth) / 2;
            return (
              <g key={point.key} className="report-chart-bar">
                <rect
                  x={x}
                  y={point.count ? y(point.count) : y(0) - 2}
                  width={barWidth}
                  height={point.count ? (plotHeight * point.count) / max : 2}
                  rx={Math.min(5, barWidth / 3)}
                  fill={
                    point.count ? 'var(--report-chart-color)' : 'var(--line)'
                  }
                >
                  <title>
                    {point.label}: {point.count.toLocaleString('id-ID')} arsip
                  </title>
                </rect>
                {point.count > 0 && data.length <= 12 && (
                  <text
                    x={x + barWidth / 2}
                    y={y(point.count) - 9}
                    textAnchor="middle"
                    fill="var(--text-secondary)"
                    fontSize="11"
                    fontWeight="500"
                  >
                    {point.count}
                  </text>
                )}
              </g>
            );
          })}
        {data.map((point, index) =>
          index % interval === 0 || index === data.length - 1 ? (
            <text
              key={point.key}
              x={left + slot * index + slot / 2}
              y={height - 8}
              textAnchor="middle"
              fill="var(--text-muted)"
              fontSize="10"
            >
              {point.label}
            </text>
          ) : null,
        )}
        {!hasData && (
          <text
            x={(width + left) / 2}
            y={height / 2}
            textAnchor="middle"
            fill="var(--text-muted)"
            fontSize="12"
          >
            Tidak ada surat untuk ditampilkan
          </text>
        )}
      </svg>
      <details className="report-chart-data">
        <summary>Lihat angka grafik</summary>
        <div className="report-chart-data-scroll">
          <table>
            <caption className="sr-only">Rincian grafik volume surat</caption>
            <thead>
              <tr>
                <th>Periode</th>
                <th>Jumlah surat</th>
              </tr>
            </thead>
            <tbody>
              {data.map((point) => (
                <tr key={point.key}>
                  <th>{point.label}</th>
                  <td>{point.count.toLocaleString('id-ID')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
