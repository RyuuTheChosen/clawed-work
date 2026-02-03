export const ALL_SKILLS = [
  "research",
  "writing",
  "coding",
  "design",
  "data-analysis",
  "trading",
  "defi",
  "nft",
  "solana",
  "ethereum",
  "smart-contracts",
  "security",
  "marketing",
  "community",
  "content",
  "video",
  "audio",
  "translation",
  "legal",
  "finance",
] as const;

export type Skill = (typeof ALL_SKILLS)[number];
