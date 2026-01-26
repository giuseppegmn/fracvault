use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer, Mint};
use anchor_spl::associated_token::AssociatedToken;

declare_id!("5gc3CQE2ge6QQ6MyQzA8M7GLktquXxYAbroyW6rRfwMb");

#[program]
pub mod workspace {
    use super::*;

    // custody_fee_bps: u16, Custody fee in basis points, 100 = 1%
    pub fn initialize_config(
        ctx: Context<InitializeConfig>,
        custody_fee_bps: u16,
    ) -> Result<()> {
        require!(custody_fee_bps == 100, ErrorCode::InvalidFee);
        
        let config = &mut ctx.accounts.config;
        config.authority = ctx.accounts.authority.key();
        // Operational authority used for non-custodial safety controls (e.g., pausing contributions).
        // This key MUST NOT have the ability to move NFTs or user funds.        config.custody_fee_bps = custody_fee_bps;
        config.fee_vault = ctx.accounts.fee_vault.key();
        config.bump = ctx.bumps.config;
        
        Ok(())
    }

    // price_lamports: u64, Total price for NFT in lamports, 1000000000 = 1 SOL
    // deadline_offset: i64, Seconds until deadline (3600-604800), 86400 = 1 day
    pub fn create_listing(
        ctx: Context<CreateListing>,
        price_lamports: u64,
        deadline_offset: i64,
    ) -> Result<()> {
        let config = &ctx.accounts.config;
        require!(price_lamports > 0, ErrorCode::InvalidAmount);
        require!(deadline_offset >= 3600 && deadline_offset <= 604800, ErrorCode::InvalidDeadline);

        let nft_account = &ctx.accounts.seller_nft_account;
        require!(nft_account.amount == 1, ErrorCode::InvalidNftOwnership);

        // Escrow the NFT into the program-controlled vault at listing creation.
        // This prevents a funded listing from being griefed by a seller who disappears.
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.seller_nft_account.to_account_info(),
                    to: ctx.accounts.vault.to_account_info(),
                    authority: ctx.accounts.seller.to_account_info(),
                },
            ),
            1,
        )?;


        let custody_fee = price_lamports
            .checked_mul(config.custody_fee_bps as u64)
            .ok_or(ErrorCode::MathOverflow)?
            .checked_div(10000)
            .ok_or(ErrorCode::MathOverflow)?;

        let total_raise = price_lamports
            .checked_add(custody_fee)
            .ok_or(ErrorCode::MathOverflow)?;

        let clock = Clock::get()?;
        let deadline = clock.unix_timestamp
            .checked_add(deadline_offset)
            .ok_or(ErrorCode::MathOverflow)?;

        let listing = &mut ctx.accounts.listing;        listing.nft_mint = ctx.accounts.nft_mint.key();
        listing.nft_seller = ctx.accounts.seller.key();
        listing.price_lamports = price_lamports;
        listing.custody_fee_lamports = custody_fee;
        listing.total_raise_lamports = total_raise;
        listing.bps_sold = 0;
        listing.deadline = deadline;
        listing.funded_at = 0;
        listing.status = ListingStatus::Open;
        listing.vault = ctx.accounts.vault.key();
        listing.bump = ctx.bumps.listing;
        listing.proposal_count = 0;

        Ok(())
    }

    // bps: u16, Basis points to purchase (1-10000), 1000 = 10%

pub fn contribute(ctx: Context<Contribute>, bps: u16) -> Result<()> {
        let listing = &ctx.accounts.listing;        require!(listing.status == ListingStatus::Open, ErrorCode::InvalidListingStatus);
        require!(bps >= 1 && bps <= 10000, ErrorCode::InvalidBps);

        let clock = Clock::get()?;
        require!(clock.unix_timestamp < listing.deadline - 60, ErrorCode::ListingExpired);

        let remaining_bps = 10000u16.checked_sub(listing.bps_sold).ok_or(ErrorCode::MathOverflow)?;
        require!(bps <= remaining_bps, ErrorCode::ExceedsAvailable);

        let principal = listing.price_lamports
            .checked_mul(bps as u64)
            .ok_or(ErrorCode::MathOverflow)?
            .checked_div(10000)
            .ok_or(ErrorCode::MathOverflow)?;

        let fee_share = listing.custody_fee_lamports
            .checked_mul(bps as u64)
            .ok_or(ErrorCode::MathOverflow)?
            .checked_div(10000)
            .ok_or(ErrorCode::MathOverflow)?;

        let total_payment = principal
            .checked_add(fee_share)
            .ok_or(ErrorCode::MathOverflow)?;

        anchor_lang::system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                anchor_lang::system_program::Transfer {
                    from: ctx.accounts.contributor.to_account_info(),
                    to: ctx.accounts.listing.to_account_info(),
                },
            ),
            total_payment,
        )?;

        let contribution = &mut ctx.accounts.contribution;

        // Support multiple contributions (top-ups) from the same wallet for the same listing.
        // The PDA seed ties the contribution to (listing, contributor), so only the contributor can pay in.
        if contribution.bps == 0 {
            // First contribution initialization
            contribution.listing = ctx.accounts.listing.key();
            contribution.wallet = ctx.accounts.contributor.key();
            contribution.refund_claimed = false;
            contribution.bump = ctx.bumps.contribution;
        } else {
            // Safety: contribution must belong to this listing + wallet
            require!(contribution.listing == ctx.accounts.listing.key(), ErrorCode::InvalidContribution);
            require!(contribution.wallet == ctx.accounts.contributor.key(), ErrorCode::InvalidContribution);
            require!(!contribution.refund_claimed, ErrorCode::AlreadyRefunded);
        }

        // Accumulate
        contribution.bps = contribution.bps.checked_add(bps).ok_or(ErrorCode::MathOverflow)?;
        contribution.principal_lamports = contribution.principal_lamports.checked_add(principal).ok_or(ErrorCode::MathOverflow)?;
        contribution.fee_lamports = contribution.fee_lamports.checked_add(fee_share).ok_or(ErrorCode::MathOverflow)?;

        let listing = &mut ctx.accounts.listing;
        listing.bps_sold = listing.bps_sold.checked_add(bps).ok_or(ErrorCode::MathOverflow)?;

        if listing.bps_sold == 10000 {
            let clock2 = Clock::get()?;
            listing.status = ListingStatus::Funded;
            listing.funded_at = clock2.unix_timestamp;
        }

        Ok(())
    }

    pub fn execute_purchase(ctx: Context<ExecutePurchase>) -> Result<()> {
        let listing = &ctx.accounts.listing;
        require!(listing.status == ListingStatus::Funded, ErrorCode::InvalidListingStatus);

        // If a funded listing isn't executed within a reasonable window, allow contributors to refund.
        // This prevents "no-one-called-execute" griefing.
        let clock = Clock::get()?;
        if listing.funded_at > 0 && clock.unix_timestamp > listing.funded_at + 86400 {
            return err!(ErrorCode::ExecutionWindowExpired);
        }

        let price = listing.price_lamports;
        let fee = listing.custody_fee_lamports;

        // Ensure sufficient lamports (defensive; should be true if contributions succeeded).
        require!(
            **ctx.accounts.listing.to_account_info().try_borrow_lamports()? >= price + fee,
            ErrorCode::InsufficientListingLamports
        );

        **ctx.accounts.listing.to_account_info().try_borrow_mut_lamports()? -= price;
        **ctx.accounts.seller.to_account_info().try_borrow_mut_lamports()? += price;

        **ctx.accounts.listing.to_account_info().try_borrow_mut_lamports()? -= fee;
        **ctx.accounts.fee_vault.to_account_info().try_borrow_mut_lamports()? += fee;

        let listing = &mut ctx.accounts.listing;
        listing.status = ListingStatus::Custodied;

        Ok(())
    }


    pub fn process_refund(ctx: Context<ProcessRefund>) -> Result<()> {
        let listing = &ctx.accounts.listing;
        let contribution = &ctx.accounts.contribution;

        require!(!contribution.refund_claimed, ErrorCode::AlreadyRefunded);

        let clock = Clock::get()?;

        // Refund conditions:
        // 1) Listing never funded: after deadline.
        // 2) Listing funded but not executed: after execution window.
        let refundable = match listing.status {
            ListingStatus::Open => clock.unix_timestamp >= listing.deadline,
            ListingStatus::Expired => true,
            ListingStatus::Funded => listing.funded_at > 0 && clock.unix_timestamp >= listing.funded_at + 86400,
            _ => false,
        };
        require!(refundable, ErrorCode::NotRefundable);

        let refund_amount = contribution.principal_lamports
            .checked_add(contribution.fee_lamports)
            .ok_or(ErrorCode::MathOverflow)?;

        require!(
            **ctx.accounts.listing.to_account_info().try_borrow_lamports()? >= refund_amount,
            ErrorCode::InsufficientListingLamports
        );

        **ctx.accounts.listing.to_account_info().try_borrow_mut_lamports()? -= refund_amount;
        **ctx.accounts.contributor.to_account_info().try_borrow_mut_lamports()? += refund_amount;

        let contribution = &mut ctx.accounts.contribution;
        contribution.refund_claimed = true;

        let listing = &mut ctx.accounts.listing;
        if listing.status == ListingStatus::Open {
            listing.status = ListingStatus::Expired;
        }

        Ok(())
    }


    pub fn reclaim_nft(ctx: Context<ReclaimNft>) -> Result<()> {
        let listing = &ctx.accounts.listing;
        require!(listing.status == ListingStatus::Open || listing.status == ListingStatus::Expired || listing.status == ListingStatus::Funded, ErrorCode::InvalidListingStatus);

        // Only reclaim if not executed/custodied.
        require!(listing.status != ListingStatus::Custodied, ErrorCode::InvalidListingStatus);

        let clock = Clock::get()?;
        // If still open, must be past deadline. If funded, must be past execution window.
        if listing.status == ListingStatus::Open {
            require!(clock.unix_timestamp >= listing.deadline, ErrorCode::ListingNotExpired);
        }
        if listing.status == ListingStatus::Funded {
            require!(listing.funded_at > 0 && clock.unix_timestamp >= listing.funded_at + 86400, ErrorCode::ExecutionWindowNotExpired);
        }

        // Return the NFT from the vault to the seller's token account.
        let listing_key = ctx.accounts.listing.key();
        let nft_mint_key = ctx.accounts.nft_mint.key();
        let listing_bump = ctx.accounts.listing.bump;
        let seeds = &[
            b"listing",
            nft_mint_key.as_ref(),
            &[listing_bump],
        ];
        let signer_seeds: &[&[&[u8]]] = &[seeds];

        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.vault.to_account_info(),
                    to: ctx.accounts.seller_nft_account.to_account_info(),
                    authority: ctx.accounts.listing.to_account_info(),
                },
                signer_seeds,
            ),
            1,
        )?;

        Ok(())
    }


    // sale_price_lamports: u64, Proposed sale price in lamports, 2000000000 = 2 SOL
    // vote_deadline_offset: i64, Seconds until vote deadline, 86400 = 1 day
    pub fn create_proposal(
        ctx: Context<CreateProposal>,
        sale_price_lamports: u64,
        vote_deadline_offset: i64,
    ) -> Result<()> {
        let listing = &ctx.accounts.listing;
        let contribution = &ctx.accounts.contribution;

        require!(listing.status == ListingStatus::Custodied, ErrorCode::InvalidListingStatus);
        require!(contribution.bps > 0, ErrorCode::NoVotingPower);
        require!(sale_price_lamports > 0, ErrorCode::InvalidAmount);
        require!(vote_deadline_offset >= 3600 && vote_deadline_offset <= 604800, ErrorCode::InvalidDeadline);

        let clock = Clock::get()?;
        let vote_deadline = clock.unix_timestamp
            .checked_add(vote_deadline_offset)
            .ok_or(ErrorCode::MathOverflow)?;

        let proposal_id = listing.proposal_count;

        let proposal = &mut ctx.accounts.proposal;
        proposal.listing = ctx.accounts.listing.key();
        proposal.proposer = ctx.accounts.proposer.key();
        proposal.proposal_id = proposal_id;
        proposal.sale_price_lamports = sale_price_lamports;
        proposal.vote_deadline = vote_deadline;
        proposal.yes_bps = 0;
        proposal.no_bps = 0;
        proposal.status = ProposalStatus::Active;
        proposal.bump = ctx.bumps.proposal;

        let listing = &mut ctx.accounts.listing;
        listing.proposal_count = listing.proposal_count.checked_add(1).ok_or(ErrorCode::MathOverflow)?;

        Ok(())
    }

    // vote: Vote, Vote choice (Yes or No)
    pub fn cast_vote(ctx: Context<CastVote>, vote: Vote) -> Result<()> {
        let proposal = &ctx.accounts.proposal;
        let contribution = &ctx.accounts.contribution;

        require!(proposal.status == ProposalStatus::Active, ErrorCode::InvalidProposalStatus);
        require!(contribution.bps > 0, ErrorCode::NoVotingPower);

        let clock = Clock::get()?;
        require!(clock.unix_timestamp < proposal.vote_deadline - 60, ErrorCode::VotingEnded);

        let vote_record = &mut ctx.accounts.vote_record;
        vote_record.proposal = ctx.accounts.proposal.key();
        vote_record.voter = ctx.accounts.voter.key();
        vote_record.bps_voted = contribution.bps;
        vote_record.vote = vote.clone();
        vote_record.bump = ctx.bumps.vote_record;

        let proposal = &mut ctx.accounts.proposal;
        match vote {
            Vote::Yes => {
                proposal.yes_bps = proposal.yes_bps
                    .checked_add(contribution.bps)
                    .ok_or(ErrorCode::MathOverflow)?;
            }
            Vote::No => {
                proposal.no_bps = proposal.no_bps
                    .checked_add(contribution.bps)
                    .ok_or(ErrorCode::MathOverflow)?;
            }
        }

        if proposal.yes_bps > 5000 {
            proposal.status = ProposalStatus::Approved;
        }

        Ok(())
    }

    // amount: u64, Amount of reward tokens to register, 1000000000 = 1 token (9 decimals)
    pub fn register_reward(ctx: Context<RegisterReward>, amount: u64) -> Result<()> {
        let listing = &ctx.accounts.listing;
        require!(listing.status == ListingStatus::Custodied, ErrorCode::InvalidListingStatus);
        require!(amount > 0, ErrorCode::InvalidAmount);

        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.depositor_token_account.to_account_info(),
                    to: ctx.accounts.reward_vault.to_account_info(),
                    authority: ctx.accounts.depositor.to_account_info(),
                },
            ),
            amount,
        )?;

        let registry = &mut ctx.accounts.reward_registry;
        registry.listing = ctx.accounts.listing.key();
        registry.reward_mint = ctx.accounts.reward_mint.key();
        registry.total_amount = registry.total_amount.checked_add(amount).ok_or(ErrorCode::MathOverflow)?;
        registry.bump = ctx.bumps.reward_registry;

        Ok(())
    }

    pub fn claim_reward(ctx: Context<ClaimReward>) -> Result<()> {
        let listing = &ctx.accounts.listing;
        let contribution = &ctx.accounts.contribution;
        let registry = &ctx.accounts.reward_registry;
        let claim_record = &mut ctx.accounts.claim_record;

        require!(listing.status == ListingStatus::Custodied, ErrorCode::InvalidListingStatus);
        require!(contribution.bps > 0, ErrorCode::NoVotingPower);

        // Initialize claim record on first claim
        if claim_record.claimer == Pubkey::default() {
            claim_record.registry = registry.key();
            claim_record.claimer = ctx.accounts.claimer.key();
            claim_record.claimed_amount = 0;
            claim_record.bump = ctx.bumps.claim_record;
        } else {
            require!(claim_record.registry == registry.key(), ErrorCode::InvalidClaimRecord);
            require!(claim_record.claimer == ctx.accounts.claimer.key(), ErrorCode::InvalidClaimRecord);
        }

        // Total claimable for this claimer across the lifetime of the registry
        let claimable_total = registry.total_amount
            .checked_mul(contribution.bps as u64)
            .ok_or(ErrorCode::MathOverflow)?
            .checked_div(10000)
            .ok_or(ErrorCode::MathOverflow)?;

        let already_claimed = claim_record.claimed_amount;
        require!(claimable_total > already_claimed, ErrorCode::NothingToClaim);

        let mut claim_amount = claimable_total
            .checked_sub(already_claimed)
            .ok_or(ErrorCode::MathOverflow)?;

        // Also cap by what's actually left in the vault (defensive).
        let remaining_global = registry.total_amount
            .checked_sub(registry.claimed_amount)
            .ok_or(ErrorCode::MathOverflow)?;
        claim_amount = claim_amount.min(remaining_global);

        require!(claim_amount > 0, ErrorCode::NothingToClaim);

        let listing_key = ctx.accounts.listing.key();
        let reward_mint_key = ctx.accounts.reward_mint.key();
        let registry_bump = ctx.accounts.reward_registry.bump;
        let seeds = &[
            b"reward",
            listing_key.as_ref(),
            reward_mint_key.as_ref(),
            &[registry_bump],
        ];
        let signer_seeds: &[&[&[u8]]] = &[seeds];

        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.reward_vault.to_account_info(),
                    to: ctx.accounts.claimer_token_account.to_account_info(),
                    authority: ctx.accounts.reward_registry.to_account_info(),
                },
                signer_seeds,
            ),
            claim_amount,
        )?;

        let registry = &mut ctx.accounts.reward_registry;
        registry.claimed_amount = registry.claimed_amount
            .checked_add(claim_amount)
            .ok_or(ErrorCode::MathOverflow)?;

        claim_record.claimed_amount = claim_record.claimed_amount
            .checked_add(claim_amount)
            .ok_or(ErrorCode::MathOverflow)?;

        Ok(())
    }

}

// ============== ACCOUNT STRUCTURES ==============

#[account]
pub struct Config {
    pub authority: Pubkey,    pub custody_fee_bps: u16,
    pub fee_vault: Pubkey,
    pub bump: u8,
}

impl Config {
    pub const LEN: usize = 144;
}

#[account]
pub struct Listing {    pub nft_mint: Pubkey,
    pub nft_seller: Pubkey,
    pub price_lamports: u64,
    pub custody_fee_lamports: u64,
    pub total_raise_lamports: u64,
    pub bps_sold: u16,
    pub deadline: i64,
    pub funded_at: i64,
    pub status: ListingStatus,
    pub vault: Pubkey,
    pub bump: u8,
    pub proposal_count: u32,
}

impl Listing {
    // nft_mint: 32
    // nft_seller: 32
    // price_lamports: 8
    // custody_fee_lamports: 8
    // total_raise_lamports: 8
    // bps_sold: 2
    // deadline: 8
    // status: 1
    // vault: 32
    // bump: 1
    // proposal_count: 4
    pub const LEN: usize = 1 + 32 + 32 + 8 + 8 + 8 + 2 + 8 + 1 + 32 + 1 + 4;
}

#[account]
pub struct Contribution {
    pub listing: Pubkey,
    pub wallet: Pubkey,
    pub bps: u16,
    pub principal_lamports: u64,
    pub fee_lamports: u64,
    pub refund_claimed: bool,
    pub bump: u8,
}

impl Contribution {
    pub const LEN: usize = 32 + 32 + 2 + 8 + 8 + 1 + 1;
}

#[account]
pub struct Proposal {
    pub listing: Pubkey,
    pub proposer: Pubkey,
    pub proposal_id: u32,
    pub sale_price_lamports: u64,
    pub vote_deadline: i64,
    pub yes_bps: u16,
    pub no_bps: u16,
    pub status: ProposalStatus,
    pub bump: u8,
}

impl Proposal {
    pub const LEN: usize = 32 + 32 + 4 + 8 + 8 + 2 + 2 + 1 + 1;
}

#[account]
pub struct VoteRecord {
    pub proposal: Pubkey,
    pub voter: Pubkey,
    pub bps_voted: u16,
    pub vote: Vote,
    pub bump: u8,
}

impl VoteRecord {
    pub const LEN: usize = 32 + 32 + 2 + 1 + 1;
}

#[account]
pub struct RewardRegistry {
    pub listing: Pubkey,
    pub reward_mint: Pubkey,
    pub total_amount: u64,
    pub claimed_amount: u64,
    pub bump: u8,
}

impl RewardRegistry {
    pub const LEN: usize = 32 + 32 + 8 + 8 + 1;
}

// ============== ENUMS ==============

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum ListingStatus {
    Open,
    Funded,
    Custodied,
    Expired,
    Refunded,
    Sold,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum ProposalStatus {
    Active,
    Approved,
    Rejected,
    Expired,
    Executed,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum Vote {
    Yes,
    No,
}

// ============== CONTEXT STRUCTS ==============

#[derive(Accounts)]
pub struct InitializeConfig<'info> {
    #[account(
        init,
        seeds = [b"config"],
        bump,
        payer = authority,
        space = 8 + Config::LEN
    )]
    pub config: Account<'info, Config>,
    #[account(mut)]
    pub authority: Signer<'info>,
    /// CHECK: Fee vault address validated by authority
    pub fee_vault: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateListing<'info> {
    #[account(seeds = [b"config"], bump = config.bump)]
    pub config: Account<'info, Config>,
    #[account(
        init,
        seeds = [b"listing", nft_mint.key().as_ref()],
        bump,
        payer = seller,
        space = 8 + Listing::LEN
    )]
    pub listing: Account<'info, Listing>,
    pub nft_mint: Account<'info, Mint>,
    #[account(
        mut,
        constraint = seller_nft_account.mint == nft_mint.key() @ ErrorCode::InvalidMint,
        constraint = seller_nft_account.owner == seller.key() @ ErrorCode::InvalidNftOwnership
    )]
    pub seller_nft_account: Account<'info, TokenAccount>,
    #[account(
        init,
        seeds = [b"vault", nft_mint.key().as_ref()],
        bump,
        payer = seller,
        token::mint = nft_mint,
        // Vault authority is the listing PDA. This enables future program-signed transfers
        // (e.g., executing an approved sale) without any admin key.
        token::authority = listing
    )]
    pub vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub seller: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]

#[derive(Accounts)]
pub 

pub struct Contribute<'info> {
    #[account(
        mut,
        seeds = [b"listing", listing.nft_mint.as_ref()],
        bump = listing.bump
    )]
    pub listing: Account<'info, Listing>,
    #[account(
        init_if_needed,
        seeds = [b"contribution", listing.key().as_ref(), contributor.key().as_ref()],
        bump,
        payer = contributor,
        space = 8 + Contribution::LEN
    )]
    pub contribution: Account<'info, Contribution>,
    #[account(mut)]
    pub contributor: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ExecutePurchase<'info> {
    #[account(seeds = [b"config"], bump = config.bump)]
    pub config: Account<'info, Config>,
    #[account(
        mut,
        seeds = [b"listing", nft_mint.key().as_ref()],
        bump = listing.bump,
    )]
    pub listing: Account<'info, Listing>,
    pub nft_mint: Account<'info, Mint>,
    /// CHECK: Seller receives lamports; does not need to sign for non-custodial execution.
    #[account(mut, constraint = seller.key() == listing.nft_seller @ ErrorCode::Unauthorized)]
    pub seller: UncheckedAccount<'info>,
    /// CHECK: Fee vault validated against config
    #[account(mut, constraint = fee_vault.key() == config.fee_vault @ ErrorCode::InvalidFeeVault)]
    pub fee_vault: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ProcessRefund<'info> {
    #[account(
        mut,
        seeds = [b"listing", listing.nft_mint.as_ref()],
        bump = listing.bump
    )]
    pub listing: Account<'info, Listing>,
    #[account(
        mut,
        seeds = [b"contribution", listing.key().as_ref(), contributor.key().as_ref()],
        bump = contribution.bump,
        constraint = contribution.wallet == contributor.key() @ ErrorCode::Unauthorized
    )]
    pub contribution: Account<'info, Contribution>,
    #[account(mut)]
    pub contributor: Signer<'info>,
    pub system_program: Program<'info, System>,
}

struct ReclaimNft<'info> {
    #[account(seeds = [b"config"], bump = config.bump)]
    pub config: Account<'info, Config>,
    #[account(
        mut,
        seeds = [b"listing", nft_mint.key().as_ref()],
        bump = listing.bump,
    )]
    pub listing: Account<'info, Listing>,
    pub nft_mint: Account<'info, Mint>,
    #[account(
        mut,
        seeds = [b"vault", nft_mint.key().as_ref()],
        bump,
        constraint = vault.key() == listing.vault @ ErrorCode::InvalidVault
    )]
    pub vault: Account<'info, TokenAccount>,
    #[account(
        mut,
        constraint = seller_nft_account.mint == nft_mint.key() @ ErrorCode::InvalidMint,
        constraint = seller_nft_account.owner == listing.nft_seller @ ErrorCode::InvalidNftOwnership
    )]
    pub seller_nft_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateProposal<'info> {
    #[account(
        mut,
        seeds = [b"listing", listing.nft_mint.as_ref()],
        bump = listing.bump
    )]
    pub listing: Account<'info, Listing>,
    #[account(
        seeds = [b"contribution", listing.key().as_ref(), proposer.key().as_ref()],
        bump = contribution.bump,
        constraint = contribution.wallet == proposer.key() @ ErrorCode::Unauthorized
    )]
    pub contribution: Account<'info, Contribution>,
    #[account(
        init,
        seeds = [b"proposal", listing.key().as_ref(), &listing.proposal_count.to_le_bytes()],
        bump,
        payer = proposer,
        space = 8 + Proposal::LEN
    )]
    pub proposal: Account<'info, Proposal>,
    #[account(mut)]
    pub proposer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CastVote<'info> {
    #[account(seeds = [b"listing", listing.nft_mint.as_ref()], bump = listing.bump)]
    pub listing: Account<'info, Listing>,
    #[account(
        mut,
        seeds = [b"proposal", listing.key().as_ref(), &proposal.proposal_id.to_le_bytes()],
        bump = proposal.bump,
        constraint = proposal.listing == listing.key() @ ErrorCode::InvalidProposal
    )]
    pub proposal: Account<'info, Proposal>,
    #[account(
        seeds = [b"contribution", listing.key().as_ref(), voter.key().as_ref()],
        bump = contribution.bump,
        constraint = contribution.wallet == voter.key() @ ErrorCode::Unauthorized
    )]
    pub contribution: Account<'info, Contribution>,
    #[account(
        init,
        seeds = [b"vote", proposal.key().as_ref(), voter.key().as_ref()],
        bump,
        payer = voter,
        space = 8 + VoteRecord::LEN
    )]
    pub vote_record: Account<'info, VoteRecord>,
    #[account(mut)]
    pub voter: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RegisterReward<'info> {
    #[account(seeds = [b"listing", listing.nft_mint.as_ref()], bump = listing.bump)]
    pub listing: Account<'info, Listing>,
    pub reward_mint: Account<'info, Mint>,
    #[account(
        init_if_needed,
        seeds = [b"reward", listing.key().as_ref(), reward_mint.key().as_ref()],
        bump,
        payer = depositor,
        space = 8 + RewardRegistry::LEN
    )]
    pub reward_registry: Account<'info, RewardRegistry>,
    #[account(
        init_if_needed,
        payer = depositor,
        associated_token::mint = reward_mint,
        associated_token::authority = reward_registry
    )]
    pub reward_vault: Account<'info, TokenAccount>,
    #[account(
        mut,
        constraint = depositor_token_account.mint == reward_mint.key() @ ErrorCode::InvalidMint,
        constraint = depositor_token_account.owner == depositor.key() @ ErrorCode::Unauthorized
    )]
    pub depositor_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub depositor: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ClaimReward<'info> {
    #[account(seeds = [b"listing", listing.nft_mint.as_ref()], bump = listing.bump)]
    pub listing: Account<'info, Listing>,
    #[account(
        seeds = [b"contribution", listing.key().as_ref(), claimer.key().as_ref()],
        bump = contribution.bump,
        constraint = contribution.wallet == claimer.key() @ ErrorCode::Unauthorized
    )]
    pub contribution: Account<'info, Contribution>,
    pub reward_mint: Account<'info, Mint>,
    #[account(
        mut,
        seeds = [b"reward", listing.key().as_ref(), reward_mint.key().as_ref()],
        bump = reward_registry.bump,
        constraint = reward_registry.listing == listing.key() @ ErrorCode::InvalidRewardRegistry
    )]
    pub reward_registry: Account<'info, RewardRegistry>,
    #[account(
        mut,
        associated_token::mint = reward_mint,
        associated_token::authority = reward_registry
    )]
    pub reward_vault: Account<'info, TokenAccount>,
    #[account(
        init_if_needed,
        payer = claimer,
        associated_token::mint = reward_mint,
        associated_token::authority = claimer
    )]
    pub claimer_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub claimer: Signer<'info>,
    #[account(
        init_if_needed,
        seeds = [b"claim", reward_registry.key().as_ref(), claimer.key().as_ref()],
        bump,
        payer = claimer,
        space = 8 + ClaimRecord::LEN
    )]
    pub claim_record: Account<'info, ClaimRecord>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

// ============== ERROR CODES ==============

#[error_code]
pub enum ErrorCode {
    #[msg("Math overflow occurred")]
    MathOverflow,
    #[msg("Invalid fee - must be 100 bps")]
    InvalidFee,
    #[msg("Invalid amount")]
    InvalidAmount,
    #[msg("Invalid deadline offset")]
    InvalidDeadline,
    #[msg("Invalid NFT ownership")]
    InvalidNftOwnership,
    #[msg("Invalid mint")]
    InvalidMint,
    #[msg("Invalid listing status")]
    InvalidListingStatus,
    #[msg("Invalid basis points")]
    InvalidBps,
    #[msg("Listing has expired")]
    ListingExpired,
    #[msg("Exceeds available bps")]
    ExceedsAvailable,
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Already refunded")]
    AlreadyRefunded,
    #[msg("Listing not expired yet")]
    ListingNotExpired,
    #[msg("No voting power")]
    NoVotingPower,
    #[msg("Invalid proposal status")]
    InvalidProposalStatus,
    #[msg("Voting has ended")]
    VotingEnded,
    #[msg("Invalid vault")]
    InvalidVault,
    #[msg("Invalid fee vault")]
    InvalidFeeVault,
    #[msg("Invalid proposal")]
    InvalidProposal,
    #[msg("Invalid reward registry")]
    InvalidRewardRegistry,
    #[msg("Nothing to claim")]
    NothingToClaim,
    #[msg("Invalid contribution account")]
    InvalidContribution,
    #[msg("Not refundable under current conditions")]
    NotRefundable,
    #[msg("Execution window expired; cannot execute purchase")]
    ExecutionWindowExpired,
    #[msg("Execution window has not expired")]
    ExecutionWindowNotExpired,
    #[msg("Listing has insufficient lamports")]
    InsufficientListingLamports,
    #[msg("Invalid claim record")]
    InvalidClaimRecord,


}

#[account]
pub struct ClaimRecord {
    pub registry: Pubkey,
    pub claimer: Pubkey,
    pub claimed_amount: u64,
    pub bump: u8,
}

impl ClaimRecord {
    pub const LEN: usize = 32 + 32 + 8 + 1;
}


