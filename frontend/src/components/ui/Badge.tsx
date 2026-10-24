import React from "react";

export type BadgeVariant =
  | "brand"
  | "success"
  | "warning"
  | "danger"
  | "neutral"
  | "surface";

export type BadgeSize = "sm" | "md" | "lg";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = "brand",
  size = "md",
  children,
  icon,
  className = "",
  ...props
}) => {
  const variantStyles: Record<BadgeVariant, string> = {
    brand: "bg-brand/10 text-brand border-brand/20",
    success: "bg-status-success/10 text-status-success border-status-success/20",
    warning: "bg-status-warning/10 text-status-warning border-status-warning/20",
    danger: "bg-status-danger/10 text-status-danger border-status-danger/20",
    neutral: "bg-text-main/5 text-text-muted border-accent",
    surface: "bg-surface text-text-main border-accent shadow-2xs",
  };

  const sizeStyles: Record<BadgeSize, string> = {
    sm: "text-[9.5px] px-1.5 py-0.5 tracking-wider font-bold uppercase",
    md: "text-[10.5px] px-2 py-0.5 font-bold uppercase tracking-wider",
    lg: "text-xs px-2.5 py-1 font-semibold",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 border rounded-xs ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
