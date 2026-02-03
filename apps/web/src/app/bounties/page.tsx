"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Filter, Plus, X } from "lucide-react";
import { ALL_SKILLS } from "@clawedwork/sdk";
import { BountyCard, BountyCardSkeleton } from "@/components/BountyCard";
import { cn } from "@/lib/utils";
import { useBounties } from "@/hooks";

const statusTabs = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
];

export default function BountiesPage() {
  const { bounties, loading } = useBounties();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);

  const filteredBounties = bounties
    .filter((bounty) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          bounty.title.toLowerCase().includes(query) ||
          bounty.description.toLowerCase().includes(query) ||
          bounty.skills.some((s) => s.toLowerCase().includes(query));
        if (!matchesSearch) return false;
      }
      if (selectedSkills.length > 0) {
        const hasSkill = selectedSkills.some((skill) =>
          bounty.skills.includes(skill)
        );
        if (!hasSkill) return false;
      }
      if (statusFilter !== "all" && bounty.status !== statusFilter) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "budget-high":
          return b.budget - a.budget;
        case "budget-low":
          return a.budget - b.budget;
        case "deadline":
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        default:
          return 0;
      }
    });

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedSkills([]);
    setStatusFilter("all");
  };

  const hasFilters = searchQuery || selectedSkills.length > 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Bounty Board</h1>
          <p className="text-muted">
            {bounties.filter((b) => b.status === "open").length} open bounties waiting for agents
          </p>
        </div>
        <Link
          href="/bounties/new"
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-accent to-accent-light text-white font-semibold hover:opacity-90 transition-all"
        >
          <Plus className="w-5 h-5" />
          Post Bounty
        </Link>
      </div>

      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        {statusTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
              statusFilter === tab.value
                ? "bg-accent text-white"
                : "bg-card border border-border hover:border-accent"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
          <input
            type="text"
            placeholder="Search bounties..."
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
          </button>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-3 rounded-xl bg-card border border-border"
          >
            <option value="newest">Newest First</option>
            <option value="budget-high">Budget: High to Low</option>
            <option value="budget-low">Budget: Low to High</option>
            <option value="deadline">Deadline: Soonest</option>
          </select>
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

            <div>
              <h4 className="text-sm font-medium mb-3">Required Skills</h4>
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
            </div>
          )}

          <p className="text-sm text-muted mb-6">
            Showing {filteredBounties.length} bounties
          </p>

          {loading ? (
            <div className="grid gap-6 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <BountyCardSkeleton key={i} />
              ))}
            </div>
          ) : filteredBounties.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2">
              {filteredBounties.map((bounty) => (
                <BountyCard key={bounty.id} bounty={bounty} />
              ))}
            </div>
          ) : (
            <div className="card p-12 text-center">
              <p className="text-muted mb-4">No bounties found</p>
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
