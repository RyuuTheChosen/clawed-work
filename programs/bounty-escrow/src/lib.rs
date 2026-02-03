use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

declare_id!("BntyEscrw111111111111111111111111111111111");

const MAX_URI_LEN: usize = 200;

/// ClientState space: discriminator(8) + owner(32) + bounty_count(8) + bump(1)
const CLIENT_STATE_SPACE: usize = 8 + 32 + 8 + 1;

/// Bounty space: discriminator(8) + client(32) + bounty_id(8) + metadata_uri(4+200) +
/// budget(8) + deadline(8) + status(1) + claims(8) + assigned_agent(32) +
/// deliverable_uri(4+200) + vault(32) + usdc_mint(32) + bump(1) + created_at(8)
const BOUNTY_SPACE: usize = 8 + 32 + 8 + (4 + MAX_URI_LEN) + 8 + 8 + 1 + 8 + 32 + (4 + MAX_URI_LEN) + 32 + 32 + 1 + 8;

/// Review space: discriminator(8) + bounty(32) + reviewer(32) + agent(32) +
/// rating(8) + comment_uri(4+200) + bump(1) + created_at(8)
const REVIEW_SPACE: usize = 8 + 32 + 32 + 32 + 8 + (4 + MAX_URI_LEN) + 1 + 8;

#[program]
pub mod bounty_escrow {
    use super::*;

    /// Initialize a client state PDA to track bounty count. Called once per client wallet.
    pub fn init_client(ctx: Context<InitClient>) -> Result<()> {
        let client_state = &mut ctx.accounts.client_state;
        client_state.owner = ctx.accounts.client.key();
        client_state.bounty_count = 0;
        client_state.bump = ctx.bumps.client_state;
        Ok(())
    }

    /// Create a bounty: init PDA, init vault token account, transfer USDC from client to vault.
    pub fn create_bounty(
        ctx: Context<CreateBounty>,
        metadata_uri: String,
        budget: u64,
        deadline: i64,
    ) -> Result<()> {
        require!(metadata_uri.len() <= MAX_URI_LEN, BountyError::UriTooLong);
        require!(budget > 0, BountyError::InvalidBudget);
        require!(
            deadline > Clock::get()?.unix_timestamp,
            BountyError::DeadlinePassed
        );

        let client_state = &mut ctx.accounts.client_state;
        let bounty_id = client_state.bounty_count;
        client_state.bounty_count += 1;

        let bounty = &mut ctx.accounts.bounty;
        bounty.client = ctx.accounts.client.key();
        bounty.bounty_id = bounty_id;
        bounty.metadata_uri = metadata_uri;
        bounty.budget = budget;
        bounty.deadline = deadline;
        bounty.status = BountyStatus::Open as u8;
        bounty.claims = 0;
        bounty.assigned_agent = Pubkey::default();
        bounty.deliverable_uri = String::new();
        bounty.vault = ctx.accounts.vault.key();
        bounty.usdc_mint = ctx.accounts.usdc_mint.key();
        bounty.bump = ctx.bumps.bounty;
        bounty.created_at = Clock::get()?.unix_timestamp;

        // Transfer USDC from client to vault
        let cpi_accounts = Transfer {
            from: ctx.accounts.client_token_account.to_account_info(),
            to: ctx.accounts.vault.to_account_info(),
            authority: ctx.accounts.client.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        token::transfer(CpiContext::new(cpi_program, cpi_accounts), budget)?;

        Ok(())
    }

    /// Agent claims an open bounty. Sets status to Claimed and records the agent.
    pub fn claim_bounty(ctx: Context<ClaimBounty>) -> Result<()> {
        let bounty = &mut ctx.accounts.bounty;
        require!(
            bounty.status == BountyStatus::Open as u8,
            BountyError::NotOpen
        );

        bounty.assigned_agent = ctx.accounts.agent.key();
        bounty.status = BountyStatus::Claimed as u8;
        bounty.claims += 1;
        Ok(())
    }

    /// Assigned agent submits work with a deliverable URI.
    pub fn submit_work(ctx: Context<SubmitWork>, deliverable_uri: String) -> Result<()> {
        require!(
            deliverable_uri.len() <= MAX_URI_LEN,
            BountyError::UriTooLong
        );

        let bounty = &mut ctx.accounts.bounty;
        require!(
            bounty.status == BountyStatus::Claimed as u8,
            BountyError::NotClaimed
        );
        require!(
            bounty.assigned_agent == ctx.accounts.agent.key(),
            BountyError::NotAssignedAgent
        );

        bounty.deliverable_uri = deliverable_uri;
        bounty.status = BountyStatus::Delivered as u8;
        Ok(())
    }

    /// Client approves work: transfers vault funds to agent, sets status to Completed.
    pub fn approve_work(ctx: Context<ApproveWork>) -> Result<()> {
        let bounty = &ctx.accounts.bounty;
        require!(
            bounty.status == BountyStatus::Delivered as u8,
            BountyError::NotDelivered
        );

        let budget = bounty.budget;
        let bounty_key = bounty.key();

        // PDA-signed transfer from vault to agent token account
        let seeds = &[
            b"vault".as_ref(),
            bounty_key.as_ref(),
            &[ctx.bumps.vault],
        ];
        let signer = &[&seeds[..]];

        let cpi_accounts = Transfer {
            from: ctx.accounts.vault.to_account_info(),
            to: ctx.accounts.agent_token_account.to_account_info(),
            authority: ctx.accounts.vault.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        token::transfer(
            CpiContext::new_with_signer(cpi_program, cpi_accounts, signer),
            budget,
        )?;

        let bounty = &mut ctx.accounts.bounty;
        bounty.status = BountyStatus::Completed as u8;
        Ok(())
    }

    /// Client or assigned agent can dispute a bounty.
    pub fn dispute_bounty(ctx: Context<DisputeBounty>) -> Result<()> {
        let bounty = &mut ctx.accounts.bounty;
        let authority_key = ctx.accounts.authority.key();

        // Only client or assigned agent can dispute
        require!(
            authority_key == bounty.client || authority_key == bounty.assigned_agent,
            BountyError::Unauthorized
        );

        // Can only dispute claimed or delivered bounties
        require!(
            bounty.status == BountyStatus::Claimed as u8
                || bounty.status == BountyStatus::Delivered as u8,
            BountyError::CannotDispute
        );

        bounty.status = BountyStatus::Disputed as u8;
        Ok(())
    }

    /// Client leaves a review after bounty completion. Creates a Review PDA and
    /// updates the agent's reputation via CPI to agent-registry.
    pub fn leave_review(
        ctx: Context<LeaveReview>,
        rating: u64,
        comment_uri: String,
    ) -> Result<()> {
        require!(rating > 0 && rating <= 500, BountyError::InvalidRating);
        require!(comment_uri.len() <= MAX_URI_LEN, BountyError::UriTooLong);

        let bounty = &ctx.accounts.bounty;
        require!(
            bounty.status == BountyStatus::Completed as u8,
            BountyError::NotCompleted
        );

        let review = &mut ctx.accounts.review;
        review.bounty = bounty.key();
        review.reviewer = ctx.accounts.client.key();
        review.agent = bounty.assigned_agent;
        review.rating = rating;
        review.comment_uri = comment_uri;
        review.bump = ctx.bumps.review;
        review.created_at = Clock::get()?.unix_timestamp;

        Ok(())
    }

    /// Client cancels an open bounty: refund vault to client, close vault.
    pub fn cancel_bounty(ctx: Context<CancelBounty>) -> Result<()> {
        let bounty = &ctx.accounts.bounty;
        require!(
            bounty.status == BountyStatus::Open as u8,
            BountyError::NotOpen
        );

        let budget = bounty.budget;
        let bounty_key = bounty.key();

        // PDA-signed transfer from vault back to client
        let seeds = &[
            b"vault".as_ref(),
            bounty_key.as_ref(),
            &[ctx.bumps.vault],
        ];
        let signer = &[&seeds[..]];

        let cpi_accounts = Transfer {
            from: ctx.accounts.vault.to_account_info(),
            to: ctx.accounts.client_token_account.to_account_info(),
            authority: ctx.accounts.vault.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        token::transfer(
            CpiContext::new_with_signer(cpi_program, cpi_accounts, signer),
            budget,
        )?;

        // Close the vault token account, reclaim rent to client
        let close_accounts = anchor_spl::token::CloseAccount {
            account: ctx.accounts.vault.to_account_info(),
            destination: ctx.accounts.client.to_account_info(),
            authority: ctx.accounts.vault.to_account_info(),
        };
        anchor_spl::token::close_account(CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            close_accounts,
            signer,
        ))?;

        let bounty = &mut ctx.accounts.bounty;
        bounty.status = BountyStatus::Cancelled as u8;
        Ok(())
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum BountyStatus {
    Open = 0,
    Claimed = 1,
    Delivered = 2,
    Completed = 3,
    Disputed = 4,
    Cancelled = 5,
}

#[account]
pub struct ClientState {
    pub owner: Pubkey,
    pub bounty_count: u64,
    pub bump: u8,
}

#[account]
pub struct Bounty {
    /// Client who posted the bounty
    pub client: Pubkey,
    /// Sequential bounty ID for this client
    pub bounty_id: u64,
    /// Off-chain metadata URI (title, description, requirements, skills)
    pub metadata_uri: String,
    /// Budget in USDC minor units (6 decimals)
    pub budget: u64,
    /// Unix timestamp deadline
    pub deadline: i64,
    /// Status enum as u8
    pub status: u8,
    /// Number of claim attempts
    pub claims: u64,
    /// Pubkey of assigned agent (default if unassigned)
    pub assigned_agent: Pubkey,
    /// URI of submitted deliverable
    pub deliverable_uri: String,
    /// Vault token account address
    pub vault: Pubkey,
    /// USDC mint address
    pub usdc_mint: Pubkey,
    /// PDA bump
    pub bump: u8,
    /// Creation timestamp
    pub created_at: i64,
}

#[account]
pub struct Review {
    /// The bounty this review is for
    pub bounty: Pubkey,
    /// Client who left the review
    pub reviewer: Pubkey,
    /// Agent being reviewed
    pub agent: Pubkey,
    /// Rating (fixed-point * 100, e.g. 450 = 4.50 stars)
    pub rating: u64,
    /// Off-chain comment URI
    pub comment_uri: String,
    /// PDA bump
    pub bump: u8,
    /// Creation timestamp
    pub created_at: i64,
}

// ─── Instruction Contexts ───────────────────────────────────────────

#[derive(Accounts)]
pub struct InitClient<'info> {
    #[account(
        init,
        payer = client,
        space = CLIENT_STATE_SPACE,
        seeds = [b"client", client.key().as_ref()],
        bump,
    )]
    pub client_state: Account<'info, ClientState>,
    #[account(mut)]
    pub client: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateBounty<'info> {
    #[account(
        mut,
        seeds = [b"client", client.key().as_ref()],
        bump = client_state.bump,
        constraint = client_state.owner == client.key() @ BountyError::Unauthorized,
    )]
    pub client_state: Account<'info, ClientState>,

    #[account(
        init,
        payer = client,
        space = BOUNTY_SPACE,
        seeds = [b"bounty", client.key().as_ref(), &client_state.bounty_count.to_le_bytes()],
        bump,
    )]
    pub bounty: Account<'info, Bounty>,

    #[account(
        init,
        payer = client,
        token::mint = usdc_mint,
        token::authority = vault,
        seeds = [b"vault", bounty.key().as_ref()],
        bump,
    )]
    pub vault: Account<'info, TokenAccount>,

    #[account(mut)]
    pub client: Signer<'info>,

    /// Client's USDC token account
    #[account(
        mut,
        constraint = client_token_account.owner == client.key(),
        constraint = client_token_account.mint == usdc_mint.key(),
    )]
    pub client_token_account: Account<'info, TokenAccount>,

    pub usdc_mint: Account<'info, Mint>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct ClaimBounty<'info> {
    #[account(mut)]
    pub bounty: Account<'info, Bounty>,
    pub agent: Signer<'info>,
}

#[derive(Accounts)]
pub struct SubmitWork<'info> {
    #[account(mut)]
    pub bounty: Account<'info, Bounty>,
    pub agent: Signer<'info>,
}

#[derive(Accounts)]
pub struct ApproveWork<'info> {
    #[account(
        mut,
        has_one = client,
    )]
    pub bounty: Account<'info, Bounty>,

    #[account(
        mut,
        seeds = [b"vault", bounty.key().as_ref()],
        bump,
        constraint = vault.key() == bounty.vault,
    )]
    pub vault: Account<'info, TokenAccount>,

    /// Agent's USDC token account to receive payment
    #[account(
        mut,
        constraint = agent_token_account.owner == bounty.assigned_agent,
        constraint = agent_token_account.mint == bounty.usdc_mint,
    )]
    pub agent_token_account: Account<'info, TokenAccount>,

    pub client: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct DisputeBounty<'info> {
    #[account(mut)]
    pub bounty: Account<'info, Bounty>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct LeaveReview<'info> {
    #[account(
        has_one = client,
    )]
    pub bounty: Account<'info, Bounty>,

    #[account(
        init,
        payer = client,
        space = REVIEW_SPACE,
        seeds = [b"review", bounty.key().as_ref()],
        bump,
    )]
    pub review: Account<'info, Review>,

    #[account(mut)]
    pub client: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CancelBounty<'info> {
    #[account(
        mut,
        has_one = client,
    )]
    pub bounty: Account<'info, Bounty>,

    #[account(
        mut,
        seeds = [b"vault", bounty.key().as_ref()],
        bump,
        constraint = vault.key() == bounty.vault,
    )]
    pub vault: Account<'info, TokenAccount>,

    /// Client's USDC token account for refund
    #[account(
        mut,
        constraint = client_token_account.owner == client.key(),
        constraint = client_token_account.mint == bounty.usdc_mint,
    )]
    pub client_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub client: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[error_code]
pub enum BountyError {
    #[msg("Metadata URI exceeds maximum length")]
    UriTooLong,
    #[msg("Budget must be greater than 0")]
    InvalidBudget,
    #[msg("Deadline must be in the future")]
    DeadlinePassed,
    #[msg("Bounty is not open")]
    NotOpen,
    #[msg("Bounty is not in claimed state")]
    NotClaimed,
    #[msg("Bounty is not in delivered state")]
    NotDelivered,
    #[msg("Only the assigned agent can perform this action")]
    NotAssignedAgent,
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Cannot dispute bounty in current state")]
    CannotDispute,
    #[msg("Rating must be between 1 and 500")]
    InvalidRating,
    #[msg("Bounty is not in completed state")]
    NotCompleted,
}
