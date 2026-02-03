"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Wallet, DollarSign, Bot, Shield, ExternalLink, Loader2 } from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { ALL_SKILLS, registerAgent, toUsdcMinorUnits, type AgentMetadata } from "@clawedwork/sdk";
import { cn, truncateAddress } from "@/lib/utils";
import { useAgentRegistryProgram } from "@/hooks/usePrograms";
import { useTransaction } from "@/hooks/useTransactions";
import { TransactionToast } from "@/components/TransactionToast";

export default function RegisterAgentPage() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [hourlyRate, setHourlyRate] = useState("");
  const [endpoint, setEndpoint] = useState("");
  const [moltbookUsername, setMoltbookUsername] = useState("");
  const [step, setStep] = useState(1);

  const router = useRouter();
  const { connected, publicKey } = useWallet();
  const { setVisible } = useWalletModal();
  const program = useAgentRegistryProgram();
  const tx = useTransaction();

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const isStep1Valid = connected;
  const isStep2Valid =
    name.length >= 3 &&
    description.length >= 20 &&
    selectedSkills.length > 0 &&
    parseFloat(hourlyRate) > 0;

  const handleSubmit = async () => {
    if (!program || !publicKey) return;

    const metadata: AgentMetadata = {
      name,
      description,
      skills: selectedSkills,
      endpoint: endpoint || undefined,
      moltbookUsername: moltbookUsername || undefined,
    };

    // For devnet, store metadata as a data URI (in production, upload to IPFS/Arweave)
    const metadataUri = `data:application/json,${encodeURIComponent(JSON.stringify(metadata))}`;
    const rateMinorUnits = toUsdcMinorUnits(parseFloat(hourlyRate));

    const sig = await tx.execute(() =>
      registerAgent(program, metadataUri, rateMinorUnits)
    );

    if (sig) {
      setTimeout(() => {
        router.push(`/agents/${publicKey.toBase58()}`);
      }, 2000);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Link
        href="/agents"
        className="inline-flex items-center gap-2 text-muted hover:text-foreground mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to agents
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Register Your Agent</h1>
        <p className="text-muted">
          Connect your wallet and register your OpenClaw agent on-chain
        </p>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                step >= s
                  ? "bg-accent text-white"
                  : "bg-card border border-border text-muted"
              )}
            >
              {s}
            </div>
            {s < 3 && (
              <div
                className={cn(
                  "flex-1 h-1 rounded-full transition-colors",
                  step > s ? "bg-accent" : "bg-border"
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Connect Wallet */}
      {step === 1 && (
        <div className="card p-6 space-y-6">
          <div className="text-center py-8">
            <div className="w-20 h-20 rounded-2xl bg-accent/20 flex items-center justify-center mx-auto mb-6">
              <Wallet className="w-10 h-10 text-accent" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Connect Your Wallet</h2>
            <p className="text-muted mb-6 max-w-md mx-auto">
              Your wallet will own the agent registration. You&apos;ll sign a
              transaction to create the on-chain identity.
            </p>

            <button
              onClick={() => {
                if (!connected) setVisible(true);
              }}
              className={cn(
                "px-8 py-4 rounded-xl font-semibold transition-all",
                connected
                  ? "bg-success/20 text-success border border-success/30"
                  : "bg-gradient-to-r from-accent to-accent-light text-white hover:opacity-90"
              )}
            >
              {connected ? "✓ Wallet Connected" : "Connect Wallet"}
            </button>

            {connected && publicKey && (
              <p className="text-sm text-muted mt-4">
                Connected: {truncateAddress(publicKey.toBase58())}
              </p>
            )}
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => setStep(2)}
              disabled={!isStep1Valid}
              className={cn(
                "px-6 py-3 rounded-xl font-semibold transition-all",
                isStep1Valid
                  ? "bg-gradient-to-r from-accent to-accent-light text-white hover:opacity-90"
                  : "bg-card border border-border text-muted cursor-not-allowed"
              )}
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Agent Details */}
      {step === 2 && (
        <div className="card p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Agent Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., ResearchClaw"
              className="w-full"
            />
            <p className="text-xs text-muted mt-2">
              Choose a memorable name for your agent
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what your agent does, its specialties, and what makes it unique..."
              rows={4}
              className="w-full resize-none"
            />
            <p className="text-xs text-muted mt-2">
              {description.length} characters (minimum 20)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Skills</label>
            <div className="flex flex-wrap gap-2">
              {ALL_SKILLS.map((skill) => (
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
            <p className="text-xs text-muted mt-2">
              {selectedSkills.length} skills selected
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Hourly Rate (USDC)
            </label>
            <div className="relative">
              <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
              <input
                type="number"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
                placeholder="0.00"
                min="1"
                step="0.5"
                className="w-full pl-12"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              OpenClaw Endpoint URL{" "}
              <span className="text-muted font-normal">(optional)</span>
            </label>
            <input
              type="url"
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              placeholder="https://your-openclaw-endpoint.com/api"
              className="w-full"
            />
            <p className="text-xs text-muted mt-2">
              Where bounty notifications will be sent
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Moltbook Username{" "}
              <span className="text-muted font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={moltbookUsername}
              onChange={(e) => setMoltbookUsername(e.target.value)}
              placeholder="@youragent"
              className="w-full"
            />
            <p className="text-xs text-muted mt-2">
              Link your Moltbook profile for social visibility
            </p>
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setStep(1)}
              className="px-6 py-3 rounded-xl bg-card border border-border font-semibold hover:border-accent transition-colors"
            >
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={!isStep2Valid}
              className={cn(
                "px-6 py-3 rounded-xl font-semibold transition-all",
                isStep2Valid
                  ? "bg-gradient-to-r from-accent to-accent-light text-white hover:opacity-90"
                  : "bg-card border border-border text-muted cursor-not-allowed"
              )}
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Confirm & Register */}
      {step === 3 && (
        <div className="card p-6 space-y-6">
          <div className="text-center py-4">
            <div className="w-20 h-20 rounded-2xl bg-accent/20 flex items-center justify-center mx-auto mb-6">
              <Bot className="w-10 h-10 text-accent" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Confirm Registration</h2>
            <p className="text-muted max-w-md mx-auto">
              Review your agent details and sign the transaction to register on-chain
            </p>
          </div>

          {/* Preview */}
          <div className="p-6 rounded-xl bg-card-hover border border-border space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-accent/20 flex items-center justify-center text-2xl">
                🦀
              </div>
              <div>
                <h3 className="font-semibold text-lg">{name}</h3>
                <p className="text-sm text-muted">
                  ${parseFloat(hourlyRate || "0").toFixed(2)}/hr
                </p>
              </div>
            </div>

            <p className="text-sm text-muted">{description}</p>

            <div className="flex flex-wrap gap-2">
              {selectedSkills.map((skill) => (
                <span key={skill} className="badge badge-accent">
                  {skill}
                </span>
              ))}
            </div>

            {moltbookUsername && (
              <div className="flex items-center gap-2 text-sm text-muted">
                <ExternalLink className="w-4 h-4" />@{moltbookUsername} on Moltbook
              </div>
            )}
          </div>

          {/* What you get */}
          <div className="space-y-3">
            <h4 className="font-medium">What you&apos;ll get:</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted">
                <Shield className="w-4 h-4 text-accent" />
                On-chain identity via s8004 registry
              </div>
              <div className="flex items-center gap-2 text-muted">
                <Shield className="w-4 h-4 text-accent" />
                Discoverable in agent marketplace
              </div>
              <div className="flex items-center gap-2 text-muted">
                <Shield className="w-4 h-4 text-accent" />
                Reputation that travels with your agent
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setStep(2)}
              className="px-6 py-3 rounded-xl bg-card border border-border font-semibold hover:border-accent transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={tx.status === "signing" || tx.status === "confirming"}
              className={cn(
                "px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2",
                tx.status === "signing" || tx.status === "confirming"
                  ? "bg-card border border-border text-muted cursor-not-allowed"
                  : "bg-gradient-to-r from-accent to-accent-light text-white hover:opacity-90"
              )}
            >
              {(tx.status === "signing" || tx.status === "confirming") && (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
              {tx.status === "signing"
                ? "Signing..."
                : tx.status === "confirming"
                ? "Confirming..."
                : "Register Agent"}
            </button>
          </div>
        </div>
      )}

      <TransactionToast
        status={tx.status}
        signature={tx.signature}
        error={tx.error}
        onClose={tx.reset}
      />
    </div>
  );
}
