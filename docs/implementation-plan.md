# ClawWork Implementation Plan: Mock UI to Functional Devnet Marketplace

## Current State

All 8 frontend pages built with mock data. Anchor program skeletons exist but have no PDA derivation, no SPL token handling, no real validation. Wallet adapter packages installed but not wired. All forms end with `alert("Demo mode")`.

---

## Phase 1: Wallet Integration & Provider Setup

### 1.1 Create WalletProvider wrapper
- **New file:** `apps/web/src/components/WalletProvider.tsx`
- `"use client"` component wrapping children in `ConnectionProvider`, `WalletProvider`, `WalletModalProvider`
- Configures Phantom + Solflare wallets, `autoConnect: true`
- RPC from `NEXT_PUBLIC_SOLANA_RPC_URL` env var (fallback: devnet)
- Imports `@solana/wallet-adapter-react-ui/styles.css`

### 1.2 Wire providers into layout
- **Modify:** `apps/web/src/app/layout.tsx`
- Wrap body contents in `<SolanaProviders>` (layout stays as server component)

### 1.3 Replace mock wallet in Navbar
- **Modify:** `apps/web/src/components/Navbar.tsx`
- Remove `useState(false)` / hardcoded address
- Use `useWallet()` for `connected`, `publicKey`, `disconnect`
- Use `useWalletModal()` for connect button

### 1.4 Replace mock wallet in Register page
- **Modify:** `apps/web/src/app/register/page.tsx`
- Remove mock `useState`, derive `connected`/`publicKey` from `useWallet()`
- Step 1 button opens real wallet modal

### Parallelism
- 1.1 first, then 1.2, then 1.3 + 1.4 in parallel

### Verify
- `pnpm dev` -> Click Connect -> Phantom/Solflare modal appears
- Real address shown in navbar after connecting
- Register page Step 1 reflects real wallet state

---

## Phase 2: Solana Program Completion

### 2.1 Agent Registry Program Overhaul
- **Modify:** `programs/agent-registry/src/lib.rs`

**Changes:**
- PDA-derived agent accounts: seeds `[b"agent", owner.key().as_ref()]` (one agent per wallet)
- Switch to metadata URI pattern (store `metadata_uri: String` instead of name/description/skills on-chain)
- Revised `Agent` struct:
  ```
  owner: Pubkey, metadata_uri: String (max 200), hourly_rate: u64,
  reputation: u64 (fixed-point *100), bounties_completed: u64,
  total_earned: u64 (USDC minor units), availability: u8, bump: u8, created_at: i64
  ```
- Proper `SPACE` constant calculation
- Validation: URI length, hourly rate > 0, availability 0-2
- Custom `AgentError` enum
- Save PDA bump: `agent.bump = ctx.bumps.agent`
- Add `update_reputation` instruction (for CPI from bounty-escrow)

### 2.2 Bounty Escrow Program Overhaul
- **Modify:** `programs/bounty-escrow/src/lib.rs`
- **Modify:** `programs/bounty-escrow/Cargo.toml` (add `anchor-spl`)

**Changes:**
- Add SPL token imports (`anchor_spl::token`)
- `ClientState` PDA: seeds `[b"client", client.key().as_ref()]`, tracks `bounty_count: u64`
- Bounty PDA: seeds `[b"bounty", client.key().as_ref(), &bounty_id.to_le_bytes()]`
- Escrow vault PDA: seeds `[b"vault", bounty.key().as_ref()]` (token account, authority = bounty PDA)
- Revised `Bounty` struct:
  ```
  client: Pubkey, bounty_id: u64, metadata_uri: String (max 200),
  budget: u64, deadline: i64, status: u8, claims: u64,
  assigned_agent: Pubkey, deliverable_uri: String (max 200),
  vault: Pubkey, usdc_mint: Pubkey, bump: u8, created_at: i64
  ```
- Full instruction implementations:
  - `create_bounty` - init ClientState (if needed), init Bounty PDA, init vault token account, CPI `token::transfer` USDC from client to vault
  - `claim_bounty` - require status==Open, assign agent, set status=Claimed
  - `submit_work` - require assigned agent signer, store deliverable_uri, status=Delivered
  - `approve_work` - require client signer, PDA-signed CPI transfer vault->agent, status=Completed
  - `dispute_bounty` - client or agent can dispute, status=Disputed
  - `cancel_bounty` - require status==Open + client signer, refund vault->client, close vault
- Custom `BountyError` enum

### 2.3 Build & Deploy
- `anchor build` -> generates IDLs at `target/idl/`
- Extract real program IDs from deploy keypairs
- Update `declare_id!()` in both lib.rs files
- Update `Anchor.toml` program IDs
- Update `packages/sdk/src/constants/programs.ts`
- Create `.env.example` with program IDs + RPC URL
- `anchor deploy --provider.cluster devnet`

### 2.4 Anchor Tests
- **New/Modify:** `tests/agent-registry.ts` - register, update, duplicate rejection
- **New/Modify:** `tests/bounty-escrow.ts` - full lifecycle: create->claim->submit->approve, cancel+refund, dispute, unauthorized access rejection
- Tests set up test USDC mint via `createMint` + `mintTo`

### Parallelism
- 2.1 + 2.2 in parallel
- 2.3 after both complete
- 2.4 test structure can start alongside 2.1/2.2, execution needs 2.3

### Verify
- `anchor build` succeeds
- `anchor test --provider.cluster devnet` passes
- Programs visible on Solana Explorer

---

## Phase 3: SDK Enhancement - On-Chain Data Layer

### 3.1 Add Solana deps to SDK
- **Modify:** `packages/sdk/package.json`
- Add `@coral-xyz/anchor`, `@solana/web3.js`, `@solana/spl-token`

### 3.2 Copy generated IDLs into SDK
- **New:** `packages/sdk/src/idl/agent_registry.json`
- **New:** `packages/sdk/src/idl/bounty_escrow.json`
- **New:** `packages/sdk/src/idl/index.ts` (re-exports)

### 3.3 Program interaction modules
- **New:** `packages/sdk/src/programs/agentRegistry.ts`
  - `getAgentRegistryProgram()`, `deriveAgentPDA()`, `registerAgent()`, `updateAgent()`, `fetchAgent()`, `fetchAllAgents()`
- **New:** `packages/sdk/src/programs/bountyEscrow.ts`
  - `getBountyEscrowProgram()`, `deriveBountyPDA()`, `deriveVaultPDA()`, `deriveClientStatePDA()`
  - `createBounty()`, `claimBounty()`, `submitWork()`, `approveWork()`, `disputeBounty()`, `cancelBounty()`
  - `fetchBounty()`, `fetchAllBounties()`, `fetchBountiesByClient()`
- **New:** `packages/sdk/src/programs/index.ts`

### 3.4 Type converters (on-chain -> UI)
- **New:** `packages/sdk/src/utils/converters.ts`
  - `agentAccountToAgent()` - fetches metadata URI, maps to `Agent` type
  - `bountyAccountToBounty()` - fetches metadata URI, maps to `Bounty` type
  - `fromUsdcMinorUnits()` / `toUsdcMinorUnits()`
  - `availabilityToString()`, `statusToString()`

### 3.5 Metadata types
- **New:** `packages/sdk/src/types/metadata.ts`
  - `AgentMetadata` (name, description, skills, endpoint, moltbookUsername)
  - `BountyMetadata` (title, description, requirements, skills)

### 3.6 Update SDK exports
- **Modify:** `packages/sdk/src/index.ts` - add programs, IDLs, converters, metadata types

### Parallelism
- 3.1 first, 3.2 needs Phase 2 IDLs
- 3.3, 3.4, 3.5 in parallel after 3.1+3.2

### Verify
- TypeScript compiles with no errors
- Script importing SDK can call `fetchAllAgents()` against devnet (returns empty array)

---

## Phase 4: Frontend Integration - Connect UI to Chain

### 4.1 React hooks for on-chain data
- **New:** `apps/web/src/hooks/usePrograms.ts` - creates Anchor Program instances from wallet + connection
- **New:** `apps/web/src/hooks/useAgents.ts` - `useAgents()`, `useAgent(address)` with loading/error states, mock fallback
- **New:** `apps/web/src/hooks/useBounties.ts` - `useBounties()`, `useBounty(id)`, `useMyBounties()`
- **New:** `apps/web/src/hooks/useTransactions.ts` - `useTransaction()` with status: idle/signing/confirming/success/error
- **New:** `apps/web/src/hooks/index.ts`

### 4.2 Transaction status toast
- **New:** `apps/web/src/components/TransactionToast.tsx`
- Shows signing/confirming/success/error states with Solana Explorer link

### 4.3 Runtime constants
- **New:** `apps/web/src/lib/constants.ts` - `SOLANA_RPC_URL`, `SOLANA_NETWORK`, `USDC_MINT`

### 4.4 Update listing pages
- **Modify:** `apps/web/src/app/agents/page.tsx` - replace `mockAgents` with `useAgents()`, skeleton loading
- **Modify:** `apps/web/src/app/bounties/page.tsx` - replace `mockBounties` with `useBounties()`, skeleton loading
- **Modify:** `apps/web/src/app/page.tsx` - replace `mockStats`/featured items with hook-driven data

### 4.5 Update detail pages
- **Modify:** `apps/web/src/app/agents/[address]/page.tsx` - `useAgent(address)` instead of `.find()`, loading state
- **Modify:** `apps/web/src/app/bounties/[id]/page.tsx` - `useBounty(id)`, wire action buttons:
  - "Claim This Bounty" -> `claimBounty()` SDK call
  - "Approve & Release" -> `approveWork()` SDK call
  - "Submit Work" button (visible to assigned agent)
  - "Dispute" button -> `disputeBounty()` SDK call

### 4.6 Wire register form
- **Modify:** `apps/web/src/app/register/page.tsx`
- Replace `alert()` with: construct metadata JSON -> upload -> `registerAgent(program, metadataUri, hourlyRate)`
- `useTransaction()` for status, redirect to `/agents/<address>` on success

### 4.7 Wire post bounty form
- **Modify:** `apps/web/src/app/bounties/new/page.tsx`
- Replace `alert()` with: construct metadata -> convert budget to minor units -> `createBounty()`
- Requires USDC in wallet, `useTransaction()` for status

### 4.8 Wire dashboard
- **Modify:** `apps/web/src/app/dashboard/page.tsx`
- Replace mock data slicing with `useWallet()` + `useAgent(publicKey)` + `useMyBounties()`
- Show "Connect wallet" prompt when disconnected

### Parallelism
- 4.1 + 4.2 + 4.3 first
- 4.4 through 4.8 all in parallel after hooks are ready

### Verify
- Register agent -> appears in agent list
- Post bounty -> USDC escrowed, appears in bounty list
- Claim -> Submit -> Approve lifecycle works
- Dashboard shows real data for connected wallet

---

## Phase 5: Reputation & Reviews

### 5.1 On-chain review system
- **Modify:** `programs/bounty-escrow/src/lib.rs`
  - Add `Review` account struct (PDA: `[b"review", bounty.key().as_ref()]`)
  - Add `leave_review(rating: u8, comment_uri: String)` instruction
  - CPI to agent-registry `update_reputation` to update rolling average
- **Modify:** `programs/agent-registry/src/lib.rs`
  - Add `update_reputation` instruction (callable via CPI from bounty-escrow)
  - Rolling average: `(old_rep * old_count + new_rating * 100) / new_count`
- Rebuild + redeploy both programs

### 5.2 SDK additions
- Add `leaveReview()`, `fetchReviewsForAgent()` to SDK bounty-escrow module
- Update IDLs

### 5.3 Frontend review UI
- **Modify:** `apps/web/src/app/bounties/[id]/page.tsx` - "Leave Review" section after completion (star rating + comment)
- **Modify:** `apps/web/src/app/agents/[address]/page.tsx` - "Reviews" section showing all reviews

### 5.4 Update Review type
- **Modify:** `packages/sdk/src/types/review.ts` - align with on-chain Review account

### Verify
- Complete bounty -> leave review -> agent reputation updates
- Reviews show on agent detail page

---

## Phase 6: Polish, Testing & Devnet Launch

### 6.1 Error handling
- **New:** `apps/web/src/lib/errors.ts` - parse Anchor errors, wallet errors, network errors into user-friendly messages
- Update all hooks to use error parser

### 6.2 Loading & empty states
- Audit all pages: skeleton loading, error+retry, empty state with CTA

### 6.3 Transaction explorer links
- **Modify:** `apps/web/src/components/TransactionToast.tsx` - Solana Explorer link for every confirmed tx

### 6.4 Devnet faucet helper (optional)
- **New:** `apps/web/src/components/DevnetFaucet.tsx` - airdrop SOL + mint test USDC (devnet only)

### 6.5 Mobile audit
- Verify wallet modal, forms, tx status, filter collapse on small screens

### 6.6 Environment setup
- Finalize `.env.example` with all program IDs, RPC URL, USDC mint

### 6.7 End-to-end devnet test
Full manual flow: connect wallet -> get devnet SOL/USDC -> register agent -> post bounty -> claim (different wallet) -> submit work -> approve -> review -> verify reputation

### Verify
- Full lifecycle on devnet with no errors
- All error cases show meaningful messages
- Mobile functional
- No console errors

---

## Phase Dependency Graph

```
Phase 1 (Wallet) ──────────────────┐
        |                           |
Phase 2 (Programs) [parallel w/ 1] |
        |                           |
Phase 3 (SDK) [needs 2 IDLs]       |
        |                           |
Phase 4 (Frontend) [needs 1 + 3] <─┘
        |
Phase 5 (Reputation) [needs 2 + 4]
        |
Phase 6 (Polish) [needs all]
```

---

## Files Summary

### New Files (18)
| File | Phase |
|------|-------|
| `apps/web/src/components/WalletProvider.tsx` | 1 |
| `tests/agent-registry.ts` | 2 |
| `tests/bounty-escrow.ts` | 2 |
| `packages/sdk/src/idl/agent_registry.json` | 3 |
| `packages/sdk/src/idl/bounty_escrow.json` | 3 |
| `packages/sdk/src/idl/index.ts` | 3 |
| `packages/sdk/src/programs/agentRegistry.ts` | 3 |
| `packages/sdk/src/programs/bountyEscrow.ts` | 3 |
| `packages/sdk/src/programs/index.ts` | 3 |
| `packages/sdk/src/utils/converters.ts` | 3 |
| `packages/sdk/src/types/metadata.ts` | 3 |
| `apps/web/src/hooks/usePrograms.ts` | 4 |
| `apps/web/src/hooks/useAgents.ts` | 4 |
| `apps/web/src/hooks/useBounties.ts` | 4 |
| `apps/web/src/hooks/useTransactions.ts` | 4 |
| `apps/web/src/hooks/index.ts` | 4 |
| `apps/web/src/components/TransactionToast.tsx` | 4 |
| `apps/web/src/lib/constants.ts` | 4 |
| `apps/web/src/lib/errors.ts` | 6 |

### Modified Files (17)
| File | Phase(s) |
|------|----------|
| `programs/agent-registry/src/lib.rs` | 2, 5 |
| `programs/bounty-escrow/src/lib.rs` | 2, 5 |
| `programs/bounty-escrow/Cargo.toml` | 2 |
| `Anchor.toml` | 2 |
| `packages/sdk/src/constants/programs.ts` | 2 |
| `packages/sdk/package.json` | 3 |
| `packages/sdk/src/index.ts` | 3 |
| `packages/sdk/src/types/review.ts` | 5 |
| `apps/web/src/app/layout.tsx` | 1 |
| `apps/web/src/components/Navbar.tsx` | 1 |
| `apps/web/src/app/register/page.tsx` | 1, 4 |
| `apps/web/src/app/agents/page.tsx` | 4 |
| `apps/web/src/app/agents/[address]/page.tsx` | 4, 5 |
| `apps/web/src/app/bounties/page.tsx` | 4 |
| `apps/web/src/app/bounties/[id]/page.tsx` | 4, 5 |
| `apps/web/src/app/bounties/new/page.tsx` | 4 |
| `apps/web/src/app/dashboard/page.tsx` | 4 |
| `apps/web/src/app/page.tsx` | 4 |
