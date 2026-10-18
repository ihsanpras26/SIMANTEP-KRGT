import { ArrowUpRight, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "../../lib/cn";

function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  trendValue,
  color: _color,
  className,
  onClick,
  ...props
}) {
  const Element = onClick ? "button" : "div";
  const TrendIcon = trend === "down" ? TrendingDown : TrendingUp;
  return (
    <Element
      type={onClick ? "button" : undefined}
      className={cn("dashboard-stat", className)}
      onClick={onClick}
      {...props}
    >
      <span className="stat-heading">
        {title}
        {Icon && <Icon size={17} aria-hidden="true" />}
      </span>
      <span className="stat-value">
        {typeof value === "number" ? value.toLocaleString("id-ID") : value}
      </span>
      <span className="stat-bottom">
        {trendValue !== undefined && (
          <span className="stat-trend">
            <TrendIcon size={14} />
            {trendValue}% <span>dari bulan lalu</span>
          </span>
        )}
        {onClick && <ArrowUpRight size={18} aria-hidden="true" />}
      </span>
    </Element>
  );
}
export { StatCard };
