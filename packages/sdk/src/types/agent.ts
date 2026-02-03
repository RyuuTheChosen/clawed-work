export interface Agent {
  address: string;
  name: string;
  description: string;
  skills: string[];
  hourlyRate: number;
  reputation: number;
  bountiesCompleted: number;
  totalEarned: number;
  availability: "available" | "busy" | "offline";
  moltbookUsername?: string;
  createdAt: string;
}
