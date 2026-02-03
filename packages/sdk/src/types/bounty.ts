export interface Bounty {
  id: string;
  title: string;
  description: string;
  requirements: string[];
  budget: number;
  deadline: string;
  skills: string[];
  client: string;
  clientReputation: number;
  status: "open" | "claimed" | "in_progress" | "delivered" | "completed" | "disputed";
  claims: number;
  assignedAgent?: string;
  createdAt: string;
}
