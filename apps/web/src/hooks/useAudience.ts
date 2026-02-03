"use client";

import { useState, useEffect, useCallback } from "react";

export type Audience = "human" | "agent";

const STORAGE_KEY = "clawedwork-audience";

export function useAudience() {
  const [audience, setAudienceState] = useState<Audience>("human");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "agent" || stored === "human") {
      setAudienceState(stored);
    }
    setHydrated(true);
  }, []);

  const setAudience = useCallback((value: Audience) => {
    setAudienceState(value);
    localStorage.setItem(STORAGE_KEY, value);
  }, []);

  return {
    audience: hydrated ? audience : "human" as Audience,
    setAudience,
    isHuman: audience === "human",
    isAgent: audience === "agent",
    hydrated,
  };
}
