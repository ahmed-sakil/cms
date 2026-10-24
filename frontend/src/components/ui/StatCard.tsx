import React from "react";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  change?: string;
  subtitle?: string;
  icon?: LucideIcon;
  isLoading?: boolean;
  trend?: "up" | "down" | "neutral";
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  change,
  subtitle,
  icon: Icon,
  isLoading = false,
  trend = "neutral",
  className = "",
}) => {
  return (
    <div
      className={`bg-surface border border-accent rounded-sm p-4 space-y-1.5 shadow-xs transition-colors hover:border-brand/40 ${className}`}
    >
      <div className="flex items-center justify-between text-text-muted">
        <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">
          {label}
        </span>
        {Icon && (
          <div className="p-1.5 rounded-xs bg-brand/10 text-brand shrink-0">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-1.5 py-1 animate-pulse">
          <div className="h-7 w-24 bg-accent/60 rounded-xs" />
          <div className="h-3 w-32 bg-accent/40 rounded-xs" />
        </div>
      ) : (
        <>
          <div className="text-2xl font-black text-text-main font-mono tracking-tight">
            {value}
          </div>
          {(change || subtitle) && (
            <div
              className={`text-[11px] font-medium truncate ${
                trend === "up"
                  ? "text-status-success"
                  : trend === "down"
                  ? "text-status-danger"
                  : "text-text-muted"
              }`}
            >
              {change || subtitle}
            </div>
          )}
        </>
      )}
    </div>
  );
};
