import { cn } from '../../lib/cn';

export function StatCard({
  title,
  value,
  icon: Icon,
  caption,
  children,
  className,
}) {
  return (
    <div
      className={cn('report-metric', className)}
      role="group"
      aria-label={title}
    >
      <div className="report-metric-label">
        <span>{title}</span>
        {Icon && <Icon size={17} aria-hidden="true" />}
      </div>
      <div className="report-metric-value">
        {typeof value === 'number' ? value.toLocaleString('id-ID') : value}
      </div>
      <div className="report-metric-caption">{caption}</div>
      {children}
    </div>
  );
}
