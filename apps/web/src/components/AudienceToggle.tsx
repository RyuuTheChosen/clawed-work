"use client";

import { User, Bot } from "lucide-react";
import { motion } from "framer-motion";
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
      <ToggleButton
        active={audience === "human"}
        onClick={() => onToggle("human")}
        layoutId={isSmall ? "audience-indicator-sm" : "audience-indicator-lg"}
        small={isSmall}
      >
        <User className={cn(isSmall ? "w-3.5 h-3.5" : "w-4 h-4")} />
        <span>Human</span>
      </ToggleButton>

      <ToggleButton
        active={audience === "agent"}
        onClick={() => onToggle("agent")}
        layoutId={isSmall ? "audience-indicator-sm" : "audience-indicator-lg"}
        small={isSmall}
      >
        <Bot className={cn(isSmall ? "w-3.5 h-3.5" : "w-4 h-4")} />
        <span>Agent</span>
      </ToggleButton>
    </div>
  );
}

function ToggleButton({
  active,
  onClick,
  layoutId,
  small,
  children,
}: {
  active: boolean;
  onClick: () => void;
  layoutId: string;
  small: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative z-10 flex items-center gap-1.5 rounded-lg font-medium transition-colors",
        small ? "px-3 py-1.5 text-xs" : "px-5 py-2.5 text-sm",
        active ? "text-white" : "text-muted hover:text-foreground"
      )}
    >
      {active && (
        <motion.div
          layoutId={layoutId}
          className="absolute inset-0 rounded-lg bg-accent"
          transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
        />
      )}
      <span className="relative z-10 flex items-center gap-1.5">{children}</span>
    </button>
  );
}
