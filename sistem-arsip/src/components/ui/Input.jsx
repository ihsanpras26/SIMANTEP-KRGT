import React, { useId } from "react";
import { cn } from "../../lib/cn";

const Input = React.forwardRef(
  (
    {
      className,
      type = "text",
      label,
      error,
      icon: Icon,
      id,
      "aria-describedby": describedBy,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const errorId = `${inputId}-error`;
    return (
      <div className="input-group">
        {label && (
          <label htmlFor={inputId} className="field-label">
            {label}
          </label>
        )}
        <div className="input-control">
          {Icon && <Icon className="input-icon" size={18} aria-hidden="true" />}
          <input
            ref={ref}
            id={inputId}
            type={type}
            className={cn(
              "field",
              Icon && "field-with-icon",
              error && "field-error",
              className,
            )}
            aria-invalid={error ? true : undefined}
            aria-describedby={
              [describedBy, error ? errorId : null].filter(Boolean).join(" ") ||
              undefined
            }
            {...props}
          />
        </div>
        {error && (
          <p id={errorId} className="field-error-message">
            {error}
          </p>
        )}
      </div>
    );
  },
);
Input.displayName = "Input";
export { Input };
