import { cn } from "@/lib/utils";
import * as React from "react";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "h-10 w-full rounded-md border border-border-strong bg-white px-3 text-sm",
      "focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/20",
      "disabled:opacity-50",
      className
    )}
    {...props}
  />
));
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "min-h-20 w-full rounded-md border border-border-strong bg-white px-3 py-2 text-sm",
      "focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/20",
      className
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export function Label({
  children,
  hint,
  required,
  className,
}: {
  children: React.ReactNode;
  hint?: string;
  required?: boolean;
  className?: string;
}) {
  return (
    <label className={cn("block text-sm font-medium mb-1.5", className)}>
      {children}
      {required && <span className="text-brand-red ml-0.5">*</span>}
      {hint && <span className="ml-2 text-xs text-muted font-normal">{hint}</span>}
    </label>
  );
}

export function FieldError({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return <p className="mt-1 text-xs text-brand-red">{children}</p>;
}
