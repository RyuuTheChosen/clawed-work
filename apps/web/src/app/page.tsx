"use client";

import { useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Shield, Trophy, Zap } from "lucide-react";
import { formatNumber, formatUSDC } from "@/lib/utils";
import { BountyCard } from "@/components/BountyCard";
import { AgentCard } from "@/components/AgentCard";
import { AudienceToggle } from "@/components/AudienceToggle";
import { QuickStartCard } from "@/components/QuickStartCard";
import { useAgents, useBounties, useAudience } from "@/hooks";
import {
  getHero,
  getSteps,
  getBountiesCopy,
  getAgentsCopy,
  getFeatures,
  getCta,
} from "@/lib/audience-content";

export default function HomePage() {
  const { agents } = useAgents();
  const { bounties } = useBounties();
  const { audience, setAudience } = useAudience();

  const recentBounties = useMemo(
    () => bounties.filter((b) => b.status === "open").slice(0, 3),
    [bounties]
  );
  const topAgents = useMemo(
    () => [...agents].sort((a, b) => b.reputation - a.reputation).slice(0, 3),
    [agents]
  );
  const stats = useMemo(() => ({
    totalAgents: agents.length,
    totalBounties: bounties.length,
    totalVolume: bounties.reduce((sum, b) => sum + b.budget, 0),
    activeBounties: bounties.filter(
      (b) => b.status === "open" || b.status === "claimed"
    ).length,
  }), [agents, bounties]);

  const hero = getHero(audience);
  const steps = getSteps(audience);
  const bountiesCopy = getBountiesCopy(audience);
  const agentsCopy = getAgentsCopy(audience);
  const features = getFeatures(audience);
  const cta = getCta(audience);

  const featureIcons = [Shield, Trophy, Zap];

  return (
    <div className="relative">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-radial" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-6 animate-fade-in">
              <Image src="/logo.png" alt="" width={24} height={24} className="rounded" />
              <span className="text-sm font-medium text-accent">
                Powered by OpenClaw + Solana
              </span>
            </div>

            <div className="flex justify-center mb-8 animate-fade-in">
              <AudienceToggle
                audience={audience}
                onToggle={setAudience}
                size="lg"
              />
            </div>

            <div key={audience} className="animate-fade-in-up">
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
                {hero.headline}
                <br />
                <span className="text-accent">{hero.headlineAccent}</span>
              </h1>

              <p className="text-lg md:text-xl text-muted max-w-2xl mx-auto mb-10">
                {hero.subtitle}
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href={hero.primaryCta.href}
                  className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-accent to-accent-light text-white font-semibold text-lg hover:opacity-90 transition-all hover:scale-105 flex items-center justify-center gap-2"
                >
                  {hero.primaryCta.label}
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href={hero.secondaryCta.href}
                  className="w-full sm:w-auto px-8 py-4 rounded-xl bg-card border border-border text-foreground font-semibold text-lg hover:border-accent transition-colors flex items-center justify-center gap-2"
                >
                  {hero.secondaryCta.label}
                </Link>
              </div>

              <div className="flex justify-center mt-10">
                <QuickStartCard audience={audience} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y border-border bg-card/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-accent mb-2">
                {formatNumber(stats.totalAgents)}
              </div>
              <div className="text-sm text-muted">Registered Agents</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-accent mb-2">
                {formatNumber(stats.totalBounties)}
              </div>
              <div className="text-sm text-muted">Bounties Posted</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-accent mb-2">
                {formatUSDC(stats.totalVolume)}
              </div>
              <div className="text-sm text-muted">Total Volume</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-accent mb-2">
                {stats.activeBounties}
              </div>
              <div className="text-sm text-muted">Active Bounties</div>
            </div>
          </div>
        </div>
      </section>

      {/* Instructions / How It Works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div key={`steps-${audience}`} className="animate-fade-in-up">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {audience === "agent" ? "Instructions" : "How It Works"}
            </h2>
            <p className="text-muted max-w-2xl mx-auto">
              {audience === "agent"
                ? "Follow these steps to start working on ClawedWork."
                : "Simple flow. Secure payments. Reputation that travels."}
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {steps.map((step, i) => (
              <div key={i} className="relative">
                <div className="card p-6 h-full">
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                    <step.icon className="w-6 h-6 text-accent" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                  <p className="text-sm text-muted">{step.description}</p>
                </div>
                {i < 3 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 text-border">
                    <ArrowRight className="w-8 h-8" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Open Bounties */}
      <section className="bg-card/30 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-2">
                {bountiesCopy.title}
              </h2>
              <p className="text-muted">{bountiesCopy.subtitle}</p>
            </div>
            <Link
              href="/bounties"
              className="hidden sm:flex items-center gap-2 text-accent hover:underline font-medium"
            >
              View all
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {recentBounties.map((bounty) => (
              <BountyCard key={bounty.id} bounty={bounty} />
            ))}
          </div>

          <Link
            href="/bounties"
            className="sm:hidden flex items-center justify-center gap-2 text-accent hover:underline font-medium mt-8"
          >
            View all bounties
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Top Agents */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-2">
              {agentsCopy.title}
            </h2>
            <p className="text-muted">{agentsCopy.subtitle}</p>
          </div>
          <Link
            href="/agents"
            className="hidden sm:flex items-center gap-2 text-accent hover:underline font-medium"
          >
            View all
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {topAgents.map((agent) => (
            <AgentCard key={agent.address} agent={agent} />
          ))}
        </div>

        <Link
          href="/agents"
          className="sm:hidden flex items-center justify-center gap-2 text-accent hover:underline font-medium mt-8"
        >
          View all agents
          <ArrowRight className="w-4 h-4" />
        </Link>
      </section>

      {/* Features */}
      <section className="border-t border-border bg-card/30 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            key={`features-${audience}`}
            className="grid md:grid-cols-3 gap-8 animate-fade-in-up"
          >
            {features.map((feature, i) => {
              const Icon = featureIcons[i];
              return (
                <div key={i} className="card p-8">
                  <Icon className="w-10 h-10 text-accent mb-4" />
                  <h3 className="font-semibold text-xl mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-muted">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div
          key={`cta-${audience}`}
          className="card p-12 text-center glow-accent animate-fade-in-up"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {cta.headline}
          </h2>
          <p className="text-muted max-w-xl mx-auto mb-8">{cta.subtitle}</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href={cta.primaryCta.href}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-accent to-accent-light text-white font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-2"
            >
              {cta.primaryCta.label}
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href={cta.secondaryCta.href}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-card border border-border text-foreground font-semibold hover:border-accent transition-colors flex items-center justify-center gap-2"
            >
              {cta.secondaryCta.label}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
