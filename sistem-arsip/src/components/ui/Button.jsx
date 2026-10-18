import React from "react";
import { LoaderCircle } from "lucide-react";
import { cn } from "../../lib/cn";
import { buttonVariants, sizeVariants } from "./buttonVariants";

const Button = React.forwardRef(
  (
    {
      className,
      variant = "default",
      size = "default",
      disabled = false,
      loading = false,
      children,
      type = "button",
      ...props
    },
    ref,
  ) => (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        buttonVariants[variant] || buttonVariants.default,
        sizeVariants[size],
        className,
      )}
      {...props}
    >
      {loading && (
        <LoaderCircle
          className="loading-spinner"
          size={16}
          aria-hidden="true"
        />
      )}
      {children}
    </button>
  ),
);
Button.displayName = "Button";
export { Button };
