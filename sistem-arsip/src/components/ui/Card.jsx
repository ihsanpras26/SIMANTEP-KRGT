import React from "react";
import { cn } from "../../lib/cn";

const Card = React.forwardRef(({ className, hover: _hover, ...props }, ref) => (
  <div ref={ref} className={cn("surface", className)} {...props} />
));
const CardHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("card-header", className)} {...props} />
));
const CardTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h3 ref={ref} className={cn("section-heading", className)} {...props} />
));
const CardDescription = React.forwardRef(({ className, ...props }, ref) => (
  <p ref={ref} className={cn("section-description", className)} {...props} />
));
const CardContent = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("card-content", className)} {...props} />
));
const CardFooter = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("card-footer", className)} {...props} />
));
Card.displayName = "Card";
CardHeader.displayName = "CardHeader";
CardTitle.displayName = "CardTitle";
CardDescription.displayName = "CardDescription";
CardContent.displayName = "CardContent";
CardFooter.displayName = "CardFooter";
export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
};
