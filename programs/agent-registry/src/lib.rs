use anchor_lang::prelude::*;

declare_id!("AgntReg1stry111111111111111111111111111111");

/// Maximum length for metadata URI
const MAX_URI_LEN: usize = 200;

/// Account space: discriminator(8) + owner(32) + uri_string(4+200) + hourly_rate(8) +
/// reputation(8) + bounties_completed(8) + total_earned(8) + availability(1) + bump(1) + created_at(8)
const AGENT_SPACE: usize = 8 + 32 + (4 + MAX_URI_LEN) + 8 + 8 + 8 + 8 + 1 + 1 + 8;

#[program]
pub mod agent_registry {
    use super::*;

    pub fn register_agent(
        ctx: Context<RegisterAgent>,
        metadata_uri: String,
        hourly_rate: u64,
    ) -> Result<()> {
        require!(metadata_uri.len() <= MAX_URI_LEN, AgentError::UriTooLong);
        require!(hourly_rate > 0, AgentError::InvalidHourlyRate);

        let agent = &mut ctx.accounts.agent;
        agent.owner = ctx.accounts.owner.key();
        agent.metadata_uri = metadata_uri;
        agent.hourly_rate = hourly_rate;
        agent.reputation = 0;
        agent.bounties_completed = 0;
        agent.total_earned = 0;
        agent.availability = AgentStatus::Available as u8;
        agent.bump = ctx.bumps.agent;
        agent.created_at = Clock::get()?.unix_timestamp;
        Ok(())
    }

    pub fn update_agent(
        ctx: Context<UpdateAgent>,
        metadata_uri: Option<String>,
        hourly_rate: Option<u64>,
        availability: Option<u8>,
    ) -> Result<()> {
        let agent = &mut ctx.accounts.agent;

        if let Some(uri) = metadata_uri {
            require!(uri.len() <= MAX_URI_LEN, AgentError::UriTooLong);
            agent.metadata_uri = uri;
        }
        if let Some(rate) = hourly_rate {
            require!(rate > 0, AgentError::InvalidHourlyRate);
            agent.hourly_rate = rate;
        }
        if let Some(avail) = availability {
            require!(avail <= 2, AgentError::InvalidAvailability);
            agent.availability = avail;
        }
        Ok(())
    }

    /// Called via CPI from bounty-escrow to update agent reputation after a review.
    pub fn update_reputation(
        ctx: Context<UpdateReputation>,
        new_rating: u64,
    ) -> Result<()> {
        require!(new_rating > 0 && new_rating <= 500, AgentError::InvalidRating);

        let agent = &mut ctx.accounts.agent;
        let old_count = agent.bounties_completed;
        let new_count = old_count + 1;

        // Rolling average: reputation stored as fixed-point * 100
        // new_rep = (old_rep * old_count + new_rating) / new_count
        if old_count == 0 {
            agent.reputation = new_rating;
        } else {
            agent.reputation = (agent.reputation * old_count + new_rating) / new_count;
        }

        agent.bounties_completed = new_count;
        Ok(())
    }

    /// Called via CPI from bounty-escrow to add earnings.
    pub fn add_earnings(
        ctx: Context<UpdateReputation>,
        amount: u64,
    ) -> Result<()> {
        let agent = &mut ctx.accounts.agent;
        agent.total_earned = agent.total_earned.checked_add(amount).unwrap();
        Ok(())
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum AgentStatus {
    Available = 0,
    Busy = 1,
    Offline = 2,
}

#[account]
pub struct Agent {
    /// Wallet that owns this agent
    pub owner: Pubkey,
    /// Off-chain metadata JSON URI (name, description, skills, endpoint, moltbook)
    pub metadata_uri: String,
    /// USDC minor units per hour
    pub hourly_rate: u64,
    /// Reputation score (fixed-point * 100, e.g. 480 = 4.80)
    pub reputation: u64,
    /// Number of bounties completed
    pub bounties_completed: u64,
    /// Total USDC earned (minor units)
    pub total_earned: u64,
    /// 0=Available, 1=Busy, 2=Offline
    pub availability: u8,
    /// PDA bump seed
    pub bump: u8,
    /// Unix timestamp of registration
    pub created_at: i64,
}

#[derive(Accounts)]
pub struct RegisterAgent<'info> {
    #[account(
        init,
        payer = owner,
        space = AGENT_SPACE,
        seeds = [b"agent", owner.key().as_ref()],
        bump,
    )]
    pub agent: Account<'info, Agent>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateAgent<'info> {
    #[account(
        mut,
        seeds = [b"agent", owner.key().as_ref()],
        bump = agent.bump,
        has_one = owner,
    )]
    pub agent: Account<'info, Agent>,
    pub owner: Signer<'info>,
}

/// Used by CPI from bounty-escrow; authority is the bounty-escrow program signer.
#[derive(Accounts)]
pub struct UpdateReputation<'info> {
    #[account(mut)]
    pub agent: Account<'info, Agent>,
    pub authority: Signer<'info>,
}

#[error_code]
pub enum AgentError {
    #[msg("Metadata URI exceeds maximum length of 200 characters")]
    UriTooLong,
    #[msg("Hourly rate must be greater than 0")]
    InvalidHourlyRate,
    #[msg("Availability must be 0 (Available), 1 (Busy), or 2 (Offline)")]
    InvalidAvailability,
    #[msg("Rating must be between 1 and 500 (fixed-point * 100)")]
    InvalidRating,
}
