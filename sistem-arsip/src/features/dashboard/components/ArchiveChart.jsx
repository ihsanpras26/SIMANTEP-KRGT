import { useEffect, useId, useRef, useState } from "react";

const number = new Intl.NumberFormat("id-ID");

export default function ArchiveChart({ data }) {
  const titleId = useId();
  const container = useRef(null);
  const [width, setWidth] = useState(660);
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => {
      setWidth(Math.max(280, Math.round(entry.contentRect.width)));
    });
    observer.observe(container.current);
    return () => observer.disconnect();
  }, []);
  const height = width < 400 ? 200 : 250;
  const left = 36,
    right = 15,
    top = 20,
    bottom = 36;
  const graphWidth = width - left - right,
    graphHeight = height - top - bottom;
  const largest = Math.max(
    1,
    ...data.flatMap((point) => [point.Aktif || 0, point.Inaktif || 0]),
  );
  const step = Math.max(1, Math.ceil(largest / 4));
  const maximum = step * 4;
  const x = (index) =>
    left + (index * graphWidth) / Math.max(data.length - 1, 1);
  const y = (value) => top + graphHeight - (value / maximum) * graphHeight;
  const lines = ["Aktif", "Inaktif"];
  const colors = { Aktif: "#956dff", Inaktif: "#ffb829" };
  const hasData = data.some((point) => point.Aktif || point.Inaktif);

  return (
    <div ref={container} className="archive-chart">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-labelledby={titleId}
      >
        <title id={titleId}>
          Volume arsip aktif dan inaktif per periode. Rincian tersedia pada
          tabel setelah grafik.
        </title>
        {[0, 1, 2, 3, 4].map((index) => (
          <g key={index}>
            <line
              x1={left}
              x2={width - right}
              y1={y(index * step)}
              y2={y(index * step)}
              stroke="var(--line)"
              strokeDasharray={index === 0 ? undefined : "3 5"}
            />
            <text
              x={left - 12}
              y={y(index * step) + 4}
              textAnchor="end"
              fill="var(--text-muted)"
              fontSize="10"
            >
              {number.format(index * step)}
            </text>
          </g>
        ))}
        {hasData &&
          lines.map((key) => (
            <g key={key}>
              <polyline
                points={data
                  .map((point, index) => `${x(index)},${y(point[key] || 0)}`)
                  .join(" ")}
                fill="none"
                stroke={colors[key]}
                strokeWidth={key === "Aktif" ? "2.5" : "1.8"}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {data.map((point, index) => (
                <circle
                  key={point.name}
                  cx={x(index)}
                  cy={y(point[key] || 0)}
                  r="3.5"
                  fill="var(--surface)"
                  stroke={colors[key]}
                  strokeWidth="1.8"
                >
                  <title>
                    {point.name}: {number.format(point[key] || 0)} arsip{" "}
                    {key.toLowerCase()}
                  </title>
                </circle>
              ))}
            </g>
          ))}
        {data.map((point, index) => (
          <text
            key={point.name}
            x={x(index)}
            y={height - 8}
            textAnchor="middle"
            fill="var(--text-muted)"
            fontSize="10"
          >
            {point.name}
          </text>
        ))}
        {!hasData && (
          <text
            x={width / 2}
            y={height / 2 - 10}
            textAnchor="middle"
            fill="var(--text-muted)"
            fontSize="12"
          >
            Belum ada arsip pada periode ini
          </text>
        )}
      </svg>
      <div className="sr-only">
        <table>
          <caption>Rincian volume arsip</caption>
          <thead>
            <tr>
              <th>Periode</th>
              <th>Aktif</th>
              <th>Inaktif</th>
            </tr>
          </thead>
          <tbody>
            {data.map((point) => (
              <tr key={point.name}>
                <th>{point.name}</th>
                <td>{point.Aktif || 0}</td>
                <td>{point.Inaktif || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
