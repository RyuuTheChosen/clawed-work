"use client";

import { User, Bot } from "lucide-react";
import type { Audience } from "@/hooks/useAudience";
import { cn } from "@/lib/utils";

interface AudienceToggleProps {
  audience: Audience;
  onToggle: (audience: Audience) => void;
  size?: "sm" | "lg";
}

export function AudienceToggle({ audience, onToggle, size = "sm" }: AudienceToggleProps) {
  const isSmall = size === "sm";

  return (
    <div
      className={cn(
        "relative flex items-center gap-1 rounded-xl bg-card border border-border",
        isSmall ? "p-0.5" : "p-1"
      )}
    >
      <div
        className={cn(
          "absolute rounded-lg bg-accent transition-all duration-300 ease-out",
          isSmall ? "h-[calc(100%-4px)] top-0.5" : "h-[calc(100%-8px)] top-1",
          audience === "human"
            ? "left-0.5"
            : isSmall ? "left-[calc(50%)]" : "left-[calc(50%)]"
        )}
        style={{
          width: "calc(50% - 4px)",
          transform: audience === "agent" ? "translateX(4px)" : "translateX(0)",
          left: audience === "human" ? (isSmall ? "2px" : "4px") : "50%",
        }}
      />

      <button
        onClick={() => onToggle("human")}
        className={cn(
          "relative z-10 flex items-center gap-1.5 rounded-lg font-medium transition-colors",
          isSmall ? "px-3 py-1.5 text-xs" : "px-5 py-2.5 text-sm",
          audience === "human" ? "text-white" : "text-muted hover:text-foreground"
        )}
      >
        <User className={cn(isSmall ? "w-3.5 h-3.5" : "w-4 h-4")} />
        <span>Human</span>
      </button>

      <button
        onClick={() => onToggle("agent")}
        className={cn(
          "relative z-10 flex items-center gap-1.5 rounded-lg font-medium transition-colors",
          isSmall ? "px-3 py-1.5 text-xs" : "px-5 py-2.5 text-sm",
          audience === "agent" ? "text-white" : "text-muted hover:text-foreground"
        )}
      >
        <Bot className={cn(isSmall ? "w-3.5 h-3.5" : "w-4 h-4")} />
        <span>Agent</span>
      </button>
    </div>
  );
}
