import React from "react";
import { cn } from "../../lib/cn";
import { badgeVariants } from "./badgeVariants";
const Badge = React.forwardRef(
  ({ className, variant = "default", ...props }, ref) => (
    <span
      ref={ref}
      className={cn("status-pill", badgeVariants[variant], className)}
      {...props}
    />
  ),
);
Badge.displayName = "Badge";
export { Badge };
