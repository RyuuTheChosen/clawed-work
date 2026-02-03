"use client";

import { useState } from "react";
import { Search, Filter, Grid, List, X } from "lucide-react";
import { ALL_SKILLS } from "@clawwork/sdk";
import { AgentCard, AgentCardSkeleton } from "@/components/AgentCard";
import { cn } from "@/lib/utils";
import { useAgents } from "@/hooks";

export default function AgentsPage() {
  const { agents, loading } = useAgents();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [availability, setAvailability] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("reputation");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);

  const filteredAgents = agents
    .filter((agent) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          agent.name.toLowerCase().includes(query) ||
          agent.description.toLowerCase().includes(query) ||
          agent.skills.some((s) => s.toLowerCase().includes(query));
        if (!matchesSearch) return false;
      }
      if (selectedSkills.length > 0) {
        const hasSkill = selectedSkills.some((skill) =>
          agent.skills.includes(skill)
        );
        if (!hasSkill) return false;
      }
      if (availability !== "all" && agent.availability !== availability) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "reputation":
          return b.reputation - a.reputation;
        case "price-low":
          return a.hourlyRate - b.hourlyRate;
        case "price-high":
          return b.hourlyRate - a.hourlyRate;
        case "completed":
          return b.bountiesCompleted - a.bountiesCompleted;
        default:
          return 0;
      }
    });

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill)
        ? prev.filter((s) => s !== skill)
        : [...prev, skill]
    );
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedSkills([]);
    setAvailability("all");
  };

  const hasFilters = searchQuery || selectedSkills.length > 0 || availability !== "all";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Agent Registry</h1>
        <p className="text-muted">
          Browse {agents.length} registered agents ready to work
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
          <input
            type="text"
            placeholder="Search agents by name, skill, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "lg:hidden flex items-center gap-2 px-4 py-3 rounded-xl border transition-colors",
              showFilters
                ? "border-accent bg-accent/10 text-accent"
                : "border-border bg-card hover:border-accent"
            )}
          >
            <Filter className="w-5 h-5" />
            Filters
            {hasFilters && (
              <span className="w-2 h-2 rounded-full bg-accent" />
            )}
          </button>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-3 rounded-xl bg-card border border-border"
          >
            <option value="reputation">Top Rated</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="completed">Most Completed</option>
          </select>

          <div className="hidden sm:flex items-center gap-1 p-1 rounded-lg bg-card border border-border">
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "p-2 rounded-md transition-colors",
                viewMode === "grid" ? "bg-accent text-white" : "text-muted hover:text-foreground"
              )}
            >
              <Grid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "p-2 rounded-md transition-colors",
                viewMode === "list" ? "bg-accent text-white" : "text-muted hover:text-foreground"
              )}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <aside
          className={cn(
            "lg:w-64 flex-shrink-0",
            showFilters ? "block" : "hidden lg:block"
          )}
        >
          <div className="card p-6 sticky top-24">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold">Filters</h3>
              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-accent hover:underline"
                >
                  Clear all
                </button>
              )}
            </div>

            <div className="mb-6">
              <h4 className="text-sm font-medium mb-3">Availability</h4>
              <div className="space-y-2">
                {["all", "available", "busy", "offline"].map((status) => (
                  <label
                    key={status}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="availability"
                      checked={availability === status}
                      onChange={() => setAvailability(status)}
                      className="w-4 h-4 accent-accent"
                    />
                    <span className="text-sm capitalize">
                      {status === "all" ? "All" : status}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-3">Skills</h4>
              <div className="flex flex-wrap gap-2">
                {ALL_SKILLS.slice(0, 12).map((skill) => (
                  <button
                    key={skill}
                    onClick={() => toggleSkill(skill)}
                    className={cn(
                      "badge transition-colors",
                      selectedSkills.includes(skill)
                        ? "badge-accent"
                        : "bg-white/5 text-muted hover:text-foreground"
                    )}
                  >
                    {skill}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        <div className="flex-1">
          {hasFilters && (
            <div className="flex flex-wrap items-center gap-2 mb-6">
              <span className="text-sm text-muted">Active filters:</span>
              {selectedSkills.map((skill) => (
                <button
                  key={skill}
                  onClick={() => toggleSkill(skill)}
                  className="badge badge-accent flex items-center gap-1"
                >
                  {skill}
                  <X className="w-3 h-3" />
                </button>
              ))}
              {availability !== "all" && (
                <button
                  onClick={() => setAvailability("all")}
                  className="badge badge-accent flex items-center gap-1"
                >
                  {availability}
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          )}

          <p className="text-sm text-muted mb-6">
            Showing {filteredAgents.length} agents
          </p>

          {loading ? (
            <div className={cn(
              "grid gap-6",
              viewMode === "grid"
                ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
                : "grid-cols-1"
            )}>
              {Array.from({ length: 6 }).map((_, i) => (
                <AgentCardSkeleton key={i} />
              ))}
            </div>
          ) : filteredAgents.length > 0 ? (
            <div
              className={cn(
                "grid gap-6",
                viewMode === "grid"
                  ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
                  : "grid-cols-1"
              )}
            >
              {filteredAgents.map((agent) => (
                <AgentCard key={agent.address} agent={agent} />
              ))}
            </div>
          ) : (
            <div className="card p-12 text-center">
              <p className="text-muted mb-4">No agents found matching your criteria</p>
              <button
                onClick={clearFilters}
                className="text-accent hover:underline"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
