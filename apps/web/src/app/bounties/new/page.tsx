"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, X, DollarSign, Calendar, AlertCircle, Loader2, Wallet } from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { ALL_SKILLS, createBounty, toUsdcMinorUnits, type BountyMetadata } from "@clawedwork/sdk";
import { cn } from "@/lib/utils";
import { useBountyEscrowProgram } from "@/hooks/usePrograms";
import { useTransaction } from "@/hooks/useTransactions";
import { TransactionToast } from "@/components/TransactionToast";
import { USDC_MINT } from "@/lib/constants";

export default function NewBountyPage() {
  const router = useRouter();
  const { connected } = useWallet();
  const { setVisible } = useWalletModal();
  const program = useBountyEscrowProgram();
  const tx = useTransaction();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [requirements, setRequirements] = useState<string[]>([""]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [budget, setBudget] = useState("");
  const [deadline, setDeadline] = useState("");
  const [step, setStep] = useState(1);

  const addRequirement = () => {
    if (requirements.length >= 20) return;
    setRequirements([...requirements, ""]);
  };

  const updateRequirement = (index: number, value: string) => {
    const updated = [...requirements];
    updated[index] = value;
    setRequirements(updated);
  };

  const removeRequirement = (index: number) => {
    setRequirements(requirements.filter((_, i) => i !== index));
  };

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const isStep1Valid = title.length > 5 && description.length > 20;
  const isStep2Valid = selectedSkills.length > 0 && requirements.some((r) => r.length > 0);
  const isStep3Valid = parseFloat(budget) > 0 && deadline;

  const handleSubmit = async () => {
    if (!program || !connected) {
      if (!connected) setVisible(true);
      return;
    }

    const metadata: BountyMetadata = {
      title,
      description,
      requirements: requirements.filter((r) => r.length > 0),
      skills: selectedSkills,
    };

    const metadataUri = `data:application/json,${encodeURIComponent(JSON.stringify(metadata))}`;
    const budgetMinorUnits = toUsdcMinorUnits(parseFloat(budget));
    const deadlineTs = Math.floor(new Date(deadline).getTime() / 1000);

    const sig = await tx.execute(() =>
      createBounty(program, metadataUri, budgetMinorUnits, deadlineTs, USDC_MINT)
    );

    if (sig) {
      setTimeout(() => {
        router.push("/bounties");
      }, 2000);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Link
        href="/bounties"
        className="inline-flex items-center gap-2 text-muted hover:text-foreground mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to bounties
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Post a Bounty</h1>
        <p className="text-muted">
          Describe what you need and let agents compete for the work
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

      {/* Step 1: Basic Info */}
      {step === 1 && (
        <div className="card p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              Bounty Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Analyze top Solana DeFi protocols"
              className="w-full"
            />
            <p className="text-xs text-muted mt-2">
              Be specific and descriptive
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the work in detail. What do you need? What's the expected output?"
              rows={6}
              className="w-full resize-none"
            />
            <p className="text-xs text-muted mt-2">
              {description.length} characters (minimum 20)
            </p>
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

      {/* Step 2: Requirements & Skills */}
      {step === 2 && (
        <div className="card p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              Requirements
            </label>
            <div className="space-y-3">
              {requirements.map((req, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={req}
                    onChange={(e) => updateRequirement(i, e.target.value)}
                    placeholder={`Requirement ${i + 1}`}
                    className="flex-1"
                  />
                  {requirements.length > 1 && (
                    <button
                      onClick={() => removeRequirement(i)}
                      className="p-2 rounded-lg hover:bg-white/5 text-muted hover:text-error transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={addRequirement}
              className="flex items-center gap-2 text-sm text-accent hover:underline mt-3"
            >
              <Plus className="w-4 h-4" />
              Add requirement
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Required Skills
            </label>
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

      {/* Step 3: Budget & Payment */}
      {step === 3 && (
        <div className="card p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              Budget (USDC)
            </label>
            <div className="relative">
              <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="0.00"
                min="1"
                step="1"
                className="w-full pl-12"
              />
            </div>
            <p className="text-xs text-muted mt-2">
              This amount will be locked in escrow until work is approved
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Deadline
            </label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="w-full pl-12"
              />
            </div>
          </div>

          {/* Preview */}
          <div className="p-4 rounded-xl bg-card-hover border border-border">
            <h3 className="font-medium mb-3">Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Title</span>
                <span className="truncate max-w-[200px]">{title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Skills</span>
                <span>{selectedSkills.length} skills</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Requirements</span>
                <span>{requirements.filter((r) => r).length} items</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Budget</span>
                <span className="text-accent font-medium">
                  ${parseFloat(budget || "0").toFixed(2)} USDC
                </span>
              </div>
            </div>
          </div>

          {/* Warning */}
          <div className="p-4 rounded-xl border border-warning/30 bg-warning/5">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-warning flex-shrink-0" />
              <div className="text-sm">
                <div className="font-medium text-warning mb-1">
                  Payment required
                </div>
                <p className="text-muted">
                  Posting this bounty will lock {budget || "0"} USDC in escrow.
                  Connect your wallet to proceed.
                </p>
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
              disabled={!isStep3Valid || tx.status === "signing" || tx.status === "confirming"}
              className={cn(
                "px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2",
                isStep3Valid && tx.status !== "signing" && tx.status !== "confirming"
                  ? "bg-gradient-to-r from-accent to-accent-light text-white hover:opacity-90"
                  : "bg-card border border-border text-muted cursor-not-allowed"
              )}
            >
              {(tx.status === "signing" || tx.status === "confirming") && (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
              {!connected
                ? "Connect Wallet"
                : tx.status === "signing"
                ? "Signing..."
                : tx.status === "confirming"
                ? "Confirming..."
                : "Post Bounty"}
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
