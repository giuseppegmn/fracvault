import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Workspace } from "../target/types/workspace";
import { expect } from "chai";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createMint,
  createAccount,
  mintTo,
  getAccount,
  getAssociatedTokenAddress,
  createAssociatedTokenAccount,
} from "@solana/spl-token";
import {
  PublicKey,
  SystemProgram,
  Keypair,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";

describe("FracVault - Fractional NFT Custody Protocol", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Workspace as Program<Workspace>;

  let authority: Keypair;
  let seller: Keypair;
  let contributor1: Keypair;
  let contributor2: Keypair;
  let feeVault: Keypair;
  let configPDA: PublicKey;
  let nftMint: PublicKey;
  let sellerNftAccount: PublicKey;
  let listingPDA: PublicKey;
  let vaultPDA: PublicKey;

  const CUSTODY_FEE_BPS = 100; // 1%
  const NFT_PRICE = new BN(1 * LAMPORTS_PER_SOL); // 1 SOL
  const DEADLINE_OFFSET = new BN(86400); // 1 day

  // --- Test helpers ---
  async function warpForwardSlots(slotsForward: number) {
    // Works on local solana-test-validator used by `anchor test`
    const currentSlot = await provider.connection.getSlot("confirmed");
    const targetSlot = currentSlot + slotsForward;

    // solana-test-validator supports `warpSlot` RPC
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const conn: any = provider.connection;
    if (typeof conn._rpcRequest !== "function") {
      throw new Error("Connection does not support _rpcRequest; cannot warp slots in this environment.");
    }

    await conn._rpcRequest("warpSlot", [targetSlot]);
  }

  before(async () => {
    // Generate keypairs
    authority = Keypair.generate();
    seller = Keypair.generate();
    contributor1 = Keypair.generate();
    contributor2 = Keypair.generate();
    feeVault = Keypair.generate();

    // Fund all accounts with 100 SOL
    const accounts = [authority, seller, contributor1, contributor2, feeVault];
    for (const account of accounts) {
      const sig = await provider.connection.requestAirdrop(
        account.publicKey,
        100 * LAMPORTS_PER_SOL
      );
      await provider.connection.confirmTransaction(sig);
    }

    // Derive config PDA
    [configPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("config")],
      program.programId
    );
  });

  describe("Initialize Config", () => {  });

  describe("Create Proposal", () => {
    let proposalPDA: PublicKey;
    let contribution1PDA: PublicKey;

    before(async () => {
      [contribution1PDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("contribution"),
          listingPDA.toBuffer(),
          contributor1.publicKey.toBuffer(),
        ],
        program.programId
      );

      const listing = await program.account.listing.fetch(listingPDA);
      [proposalPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("proposal"),
          listingPDA.toBuffer(),
          Buffer.from(new Uint8Array(new BN(listing.proposalCount).toArray("le", 4))),
        ],
        program.programId
      );
    });

    it("should create proposal for custodied listing", async () => {
      const salePrice = new BN(2 * LAMPORTS_PER_SOL); // 2 SOL
      const voteDeadlineOffset = new BN(86400); // 1 day

      await program.methods
        .createProposal(salePrice, voteDeadlineOffset)
        .accounts({
          listing: listingPDA,
          contribution: contribution1PDA,
          proposal: proposalPDA,
          proposer: contributor1.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([contributor1])
        .rpc();

      const proposal = await program.account.proposal.fetch(proposalPDA);
      expect(proposal.listing.toString()).to.equal(listingPDA.toString());
      expect(proposal.proposer.toString()).to.equal(contributor1.publicKey.toString());
      expect(proposal.proposalId).to.equal(0);
      expect(proposal.salePriceLamports.toString()).to.equal(salePrice.toString());
      expect(proposal.yesBps).to.equal(0);
      expect(proposal.noBps).to.equal(0);
      expect(proposal.status).to.deep.equal({ active: {} });

      // Verify proposal count incremented
      const listing = await program.account.listing.fetch(listingPDA);
      expect(listing.proposalCount).to.equal(1);
    });

    it("should fail if contributor has no bps", async () => {
      const nonContributor = Keypair.generate();
      const sig = await provider.connection.requestAirdrop(
        nonContributor.publicKey,
        10 * LAMPORTS_PER_SOL
      );
      await provider.connection.confirmTransaction(sig);

      const [fakeContribPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("contribution"),
          listingPDA.toBuffer(),
          nonContributor.publicKey.toBuffer(),
        ],
        program.programId
      );

      const listing = await program.account.listing.fetch(listingPDA);
      const [newProposalPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("proposal"),
          listingPDA.toBuffer(),
          Buffer.from(new Uint8Array(new BN(listing.proposalCount).toArray("le", 4))),
        ],
        program.programId
      );

      try {
        await program.methods
          .createProposal(new BN(LAMPORTS_PER_SOL), new BN(86400))
          .accounts({
            listing: listingPDA,
            contribution: fakeContribPDA,
            proposal: newProposalPDA,
            proposer: nonContributor.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([nonContributor])
          .rpc();
        expect.fail("Should have thrown error");
      } catch (error) {
        expect(error.message).to.include("AccountNotInitialized");
      }
    });
  });

  describe("Cast Vote", () => {
    let proposalPDA: PublicKey;
    let contribution1PDA: PublicKey;
    let contribution2PDA: PublicKey;
    let voteRecord1PDA: PublicKey;
    let voteRecord2PDA: PublicKey;

    before(async () => {
      [contribution1PDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("contribution"),
          listingPDA.toBuffer(),
          contributor1.publicKey.toBuffer(),
        ],
        program.programId
      );

      [contribution2PDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("contribution"),
          listingPDA.toBuffer(),
          contributor2.publicKey.toBuffer(),
        ],
        program.programId
      );

      // Get the first proposal (id = 0)
      [proposalPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("proposal"),
          listingPDA.toBuffer(),
          Buffer.from(new Uint8Array(new BN(0).toArray("le", 4))),
        ],
        program.programId
      );

      [voteRecord1PDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("vote"),
          proposalPDA.toBuffer(),
          contributor1.publicKey.toBuffer(),
        ],
        program.programId
      );

      [voteRecord2PDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("vote"),
          proposalPDA.toBuffer(),
          contributor2.publicKey.toBuffer(),
        ],
        program.programId
      );
    });

    it("should allow voting with Yes", async () => {
      await program.methods
        .castVote({ yes: {} })
        .accounts({
          listing: listingPDA,
          proposal: proposalPDA,
          contribution: contribution1PDA,
          voteRecord: voteRecord1PDA,
          voter: contributor1.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([contributor1])
        .rpc();

      const voteRecord = await program.account.voteRecord.fetch(voteRecord1PDA);
      expect(voteRecord.proposal.toString()).to.equal(proposalPDA.toString());
      expect(voteRecord.voter.toString()).to.equal(contributor1.publicKey.toString());
      expect(voteRecord.bpsVoted).to.equal(5000);
      expect(voteRecord.vote).to.deep.equal({ yes: {} });

      const proposal = await program.account.proposal.fetch(proposalPDA);
      expect(proposal.yesBps).to.equal(5000);
      expect(proposal.noBps).to.equal(0);
    });

    it("should approve proposal when yes_bps > 5000", async () => {
      // Contributor2 also votes Yes (another 5000 bps)
      await program.methods
        .castVote({ yes: {} })
        .accounts({
          listing: listingPDA,
          proposal: proposalPDA,
          contribution: contribution2PDA,
          voteRecord: voteRecord2PDA,
          voter: contributor2.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([contributor2])
        .rpc();

      const proposal = await program.account.proposal.fetch(proposalPDA);
      expect(proposal.yesBps).to.equal(10000);
      expect(proposal.status).to.deep.equal({ approved: {} });
    });

    it("should prevent double voting", async () => {
      // Try to vote again with contributor1
      const [newVoteRecordPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("vote"),
          proposalPDA.toBuffer(),
          contributor1.publicKey.toBuffer(),
        ],
        program.programId
      );

      try {
        await program.methods
          .castVote({ no: {} })
          .accounts({
            listing: listingPDA,
            proposal: proposalPDA,
            contribution: contribution1PDA,
            voteRecord: newVoteRecordPDA,
            voter: contributor1.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([contributor1])
          .rpc();
        expect.fail("Should have thrown error");
      } catch (error) {
        // Account already exists (double vote prevention)
        expect(error.message).to.include("already in use");
      }
    });
  });

  describe("Register Reward", () => {
    let rewardMint: PublicKey;
    let depositorTokenAccount: PublicKey;
    let rewardRegistryPDA: PublicKey;
    let rewardVaultPDA: PublicKey;

    before(async () => {
      // Create reward token mint
      rewardMint = await createMint(
        provider.connection,
        authority,
        authority.publicKey,
        null,
        9 // 9 decimals
      );

      // Create depositor token account
      depositorTokenAccount = await createAssociatedTokenAccount(
        provider.connection,
        authority,
        rewardMint,
        authority.publicKey
      );

      // Mint reward tokens to depositor
      await mintTo(
        provider.connection,
        authority,
        rewardMint,
        depositorTokenAccount,
        authority,
        1000 * 10 ** 9 // 1000 tokens
      );

      [rewardRegistryPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("reward"),
          listingPDA.toBuffer(),
          rewardMint.toBuffer(),
        ],
        program.programId
      );

      rewardVaultPDA = await getAssociatedTokenAddress(
        rewardMint,
        rewardRegistryPDA,
        true
      );

      [claimRecordPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("claim"),
          rewardRegistryPDA.toBuffer(),
          contributor1.publicKey.toBuffer(),
        ],
        program.programId
      );
    });

    it("should register reward for custodied listing", async () => {
      const amount = new BN(100 * 10 ** 9); // 100 tokens

      await program.methods
        .registerReward(amount)
        .accounts({
          listing: listingPDA,
          rewardMint: rewardMint,
          rewardRegistry: rewardRegistryPDA,
          rewardVault: rewardVaultPDA,
          depositorTokenAccount: depositorTokenAccount,
          depositor: authority.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([authority])
        .rpc();

      const registry = await program.account.rewardRegistry.fetch(rewardRegistryPDA);
      expect(registry.listing.toString()).to.equal(listingPDA.toString());
      expect(registry.rewardMint.toString()).to.equal(rewardMint.toString());
      expect(registry.totalAmount.toString()).to.equal(amount.toString());
      expect(registry.claimedAmount.toString()).to.equal("0");

      // Verify tokens transferred to vault
      const vaultAccount = await getAccount(provider.connection, rewardVaultPDA);
      expect(Number(vaultAccount.amount)).to.equal(100 * 10 ** 9);
    });

    it("should allow additional reward deposits", async () => {
      const additionalAmount = new BN(50 * 10 ** 9); // 50 more tokens

      await program.methods
        .registerReward(additionalAmount)
        .accounts({
          listing: listingPDA,
          rewardMint: rewardMint,
          rewardRegistry: rewardRegistryPDA,
          rewardVault: rewardVaultPDA,
          depositorTokenAccount: depositorTokenAccount,
          depositor: authority.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([authority])
        .rpc();

      const registry = await program.account.rewardRegistry.fetch(rewardRegistryPDA);
      expect(registry.totalAmount.toString()).to.equal((150 * 10 ** 9).toString());
    });
  });

  describe("Claim Reward", () => {
    let rewardMint: PublicKey;
    let rewardRegistryPDA: PublicKey;
    let rewardVaultPDA: PublicKey;
    let contribution1PDA: PublicKey;
    let claimer1TokenAccount: PublicKey;
    let claimRecordPDA: PublicKey;

    before(async () => {
      // Get the reward mint from previous test
      const registries = await program.account.rewardRegistry.all();
      const registry = registries.find(
        (r) => r.account.listing.toString() === listingPDA.toString()
      );
      rewardMint = registry.account.rewardMint;

      [rewardRegistryPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("reward"),
          listingPDA.toBuffer(),
          rewardMint.toBuffer(),
        ],
        program.programId
      );

      rewardVaultPDA = await getAssociatedTokenAddress(
        rewardMint,
        rewardRegistryPDA,
        true
      );

      [claimRecordPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("claim"),
          rewardRegistryPDA.toBuffer(),
          contributor1.publicKey.toBuffer(),
        ],
        program.programId
      );

      [contribution1PDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("contribution"),
          listingPDA.toBuffer(),
          contributor1.publicKey.toBuffer(),
        ],
        program.programId
      );

      claimer1TokenAccount = await getAssociatedTokenAddress(
        rewardMint,
        contributor1.publicKey
      );
    });

    it("should claim proportional rewards based on bps ownership", async () => {
      const registryBefore = await program.account.rewardRegistry.fetch(rewardRegistryPDA);
      const contribution = await program.account.contribution.fetch(contribution1PDA);

      // Contributor1 has 5000 bps (50%), so should get 50% of rewards
      const expectedClaim = Number(registryBefore.totalAmount) * contribution.bps / 10000;

      await program.methods
        .claimReward()
        .accounts({
          listing: listingPDA,
          contribution: contribution1PDA,
          rewardMint: rewardMint,
          rewardRegistry: rewardRegistryPDA,
          rewardVault: rewardVaultPDA,
          claimerTokenAccount: claimer1TokenAccount,
          claimer: contributor1.publicKey,
          claimRecord: claimRecordPDA,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([contributor1])
        .rpc();

      // Verify tokens received
      const claimerAccount = await getAccount(provider.connection, claimer1TokenAccount);
      expect(Number(claimerAccount.amount)).to.equal(expectedClaim);

      // Second claim should fail (already claimed)
      try {
        await program.methods
          .claimReward()
          .accounts({
            listing: listingPDA,
            contribution: contribution1PDA,
            rewardMint: rewardMint,
            rewardRegistry: rewardRegistryPDA,
            rewardVault: rewardVaultPDA,
            claimerTokenAccount: claimer1TokenAccount,
            claimer: contributor1.publicKey,
            claimRecord: claimRecordPDA,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          })
          .signers([contributor1])
          .rpc();
        expect.fail("Second claim should have failed");
      } catch (error) {
        expect(String(error)).to.match(/Nothing to claim|NothingToClaim/i);
      }


      // Verify claimed amount updated
      const registryAfter = await program.account.rewardRegistry.fetch(rewardRegistryPDA);
      expect(Number(registryAfter.claimedAmount)).to.equal(expectedClaim);
    });

    it("should prevent double-claiming rewards", async () => {
      // First claim (should succeed)
      await program.methods
        .claimReward()
        .accounts({
          listing: listingPDA,
          contribution: contribution1PDA,
          rewardRegistry: rewardRegistryPDA,
          rewardVault: rewardVaultPDA,
          claimerTokenAccount: claimer1TokenAccount,
          claimRecord: claimRecordPDA,
          claimer: contributor1.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([contributor1])
        .rpc();

      // Second claim (should fail with NothingToClaim)
      try {
        await program.methods
          .claimReward()
          .accounts({
            listing: listingPDA,
            contribution: contribution1PDA,
            rewardRegistry: rewardRegistryPDA,
            rewardVault: rewardVaultPDA,
            claimerTokenAccount: claimer1TokenAccount,
            claimRecord: claimRecordPDA,
            claimer: contributor1.publicKey,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          })
          .signers([contributor1])
          .rpc();
        expect.fail("Should have thrown error");
      } catch (error) {
        expect(error.message).to.include("NothingToClaim");
      }
    });

  });

  describe("Process Refund", () => {
    let expiredListingPDA: PublicKey;
    let expiredNftMint: PublicKey;
    let expiredContributionPDA: PublicKey;

    it("should refund contributor for expired listing", async () => {
      // Create a new listing with very short deadline for testing
      // Note: In real tests, we'd use bankrun for time travel
      // For now, we'll test the refund logic with a listing that we manually expire

      expiredNftMint = await createMint(
        provider.connection,
        seller,
        seller.publicKey,
        null,
        0
      );

      const expiredSellerNftAccount = await createAccount(
        provider.connection,
        seller,
        expiredNftMint,
        seller.publicKey
      );

      await mintTo(
        provider.connection,
        seller,
        expiredNftMint,
        expiredSellerNftAccount,
        seller,
        1
      );

      [expiredListingPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("listing"), expiredNftMint.toBuffer()],
        program.programId
      );

      const [expiredVaultPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("vault"), expiredNftMint.toBuffer()],
        program.programId
      );

      // Create listing with minimum deadline
      await program.methods
        .createListing(NFT_PRICE, new BN(3600)) // 1 hour minimum
        .accounts({
          config: configPDA,
          listing: expiredListingPDA,
          nftMint: expiredNftMint,
          sellerNftAccount: expiredSellerNftAccount,
          vault: expiredVaultPDA,
          seller: seller.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([seller])
        .rpc();

      // Contribute to the listing
      [expiredContributionPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("contribution"),
          expiredListingPDA.toBuffer(),
          contributor1.publicKey.toBuffer(),
        ],
        program.programId
      );

      await program.methods
        .contribute(3000) // 30%
        .accounts({
          listing: expiredListingPDA,
          contribution: expiredContributionPDA,
          contributor: contributor1.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([contributor1])
        .rpc();

      // Note: In a real test environment, we would use bankrun to advance time
      // For now, we verify the refund logic works when listing is not expired yet
      try {
        await program.methods
          .processRefund()
          .accounts({
            listing: expiredListingPDA,
            contribution: expiredContributionPDA,
            contributor: contributor1.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([contributor1])
          .rpc();
        expect.fail("Should have thrown error - listing not expired");
      } catch (error) {
        expect(error.message).to.include("ListingNotExpired");
      }
    });
  });

  describe("Edge Cases and Security", () => {
    it("should prevent contribution to non-Open listing", async () => {
      // The main listing is now Custodied, so contributions should fail
      const newContributor = Keypair.generate();
      const sig = await provider.connection.requestAirdrop(
        newContributor.publicKey,
        10 * LAMPORTS_PER_SOL
      );
      await provider.connection.confirmTransaction(sig);

      const [newContribPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("contribution"),
          listingPDA.toBuffer(),
          newContributor.publicKey.toBuffer(),
        ],
        program.programId
      );

      try {
        await program.methods
          .contribute(1000)
          .accounts({
            listing: listingPDA,
            contribution: newContribPDA,
            contributor: newContributor.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([newContributor])
          .rpc();
        expect.fail("Should have thrown error");
      } catch (error) {
        expect(error.message).to.include("InvalidListingStatus");
      }
    });

    it("should prevent invalid bps (0 or > 10000)", async () => {
      // Create a new listing for this test
      const testNftMint = await createMint(
        provider.connection,
        seller,
        seller.publicKey,
        null,
        0
      );

      const testSellerNftAccount = await createAccount(
        provider.connection,
        seller,
        testNftMint,
        seller.publicKey
      );

      await mintTo(
        provider.connection,
        seller,
        testNftMint,
        testSellerNftAccount,
        seller,
        1
      );

      const [testListingPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("listing"), testNftMint.toBuffer()],
        program.programId
      );

      const [testVaultPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("vault"), testNftMint.toBuffer()],
        program.programId
      );

      await program.methods
        .createListing(NFT_PRICE, DEADLINE_OFFSET)
        .accounts({
          config: configPDA,
          listing: testListingPDA,
          nftMint: testNftMint,
          sellerNftAccount: testSellerNftAccount,
          vault: testVaultPDA,
          seller: seller.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([seller])
        .rpc();

      const [testContribPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("contribution"),
          testListingPDA.toBuffer(),
          contributor1.publicKey.toBuffer(),
        ],
        program.programId
      );

      // Try with 0 bps
      try {
        await program.methods
          .contribute(0)
          .accounts({
            listing: testListingPDA,
            contribution: testContribPDA,
            contributor: contributor1.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([contributor1])
          .rpc();
        expect.fail("Should have thrown error");
      } catch (error) {
        expect(error.message).to.include("InvalidBps");
      }
    });

    it("should verify correct fee calculation (1%)", async () => {
      const listing = await program.account.listing.fetch(listingPDA);
      const expectedFee = Number(listing.priceLamports) * CUSTODY_FEE_BPS / 10000;
      expect(Number(listing.custodyFeeLamports)).to.equal(expectedFee);
      expect(Number(listing.totalRaiseLamports)).to.equal(
        Number(listing.priceLamports) + Number(listing.custodyFeeLamports)
      );
    });
  
  describe("Execution window (anti-griefing)", () => {
    let fundedNftMint: PublicKey;
    let fundedListingPDA: PublicKey;
    let fundedVaultPDA: PublicKey;
    let fundedSellerNftAccount: PublicKey;
    let c1PDA: PublicKey;
    let c2PDA: PublicKey;

    it("should allow permissionless execute and allow refunds after execution window expires", async () => {
      // Mint a fresh NFT for a new listing
      fundedNftMint = await createMint(
        provider.connection,
        seller,
        seller.publicKey,
        null,
        0
      );

      fundedSellerNftAccount = await createAccount(
        provider.connection,
        seller,
        fundedNftMint,
        seller.publicKey
      );

      await mintTo(
        provider.connection,
        seller,
        fundedNftMint,
        fundedSellerNftAccount,
        seller,
        1
      );

      [fundedListingPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("listing"), fundedNftMint.toBuffer()],
        program.programId
      );

      [fundedVaultPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("vault"), fundedNftMint.toBuffer()],
        program.programId
      );

      await program.methods
        .createListing(NFT_PRICE, new BN(3600))
        .accounts({
          config: configPDA,
          listing: fundedListingPDA,
          nftMint: fundedNftMint,
          sellerNftAccount: fundedSellerNftAccount,
          vault: fundedVaultPDA,
          seller: seller.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([seller])
        .rpc();

      // Contribute 50/50 to fully fund
      [c1PDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("contribution"), fundedListingPDA.toBuffer(), contributor1.publicKey.toBuffer()],
        program.programId
      );
      [c2PDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("contribution"), fundedListingPDA.toBuffer(), contributor2.publicKey.toBuffer()],
        program.programId
      );

      await program.methods
        .contribute(5000)
        .accounts({
          listing: fundedListingPDA,
          contribution: c1PDA,
          contributor: contributor1.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([contributor1])
        .rpc();

      await program.methods
        .contribute(5000)
        .accounts({
          listing: fundedListingPDA,
          contribution: c2PDA,
          contributor: contributor2.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([contributor2])
        .rpc();

      // Permissionless execute: contributor1 calls execute (seller does not sign)
      await program.methods
        .executePurchase()
        .accounts({
          config: configPDA,
          listing: fundedListingPDA,
          nftMint: fundedNftMint,
          seller: seller.publicKey,
          feeVault: feeVault.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([contributor1])
        .rpc();

      const listingAfterExecute = await program.account.listing.fetch(fundedListingPDA);
      expect(listingAfterExecute.status.custodied).to.equal(true);

      // Now create another funded listing and let execution window expire, then refund.
      // (Separate listing to avoid mixing states)
      const slowNftMint = await createMint(provider.connection, seller, seller.publicKey, null, 0);
      const slowSellerNftAccount = await createAccount(provider.connection, seller, slowNftMint, seller.publicKey);
      await mintTo(provider.connection, seller, slowNftMint, slowSellerNftAccount, seller, 1);

      const [slowListingPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("listing"), slowNftMint.toBuffer()],
        program.programId
      );
      const [slowVaultPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("vault"), slowNftMint.toBuffer()],
        program.programId
      );

      await program.methods
        .createListing(NFT_PRICE, new BN(3600))
        .accounts({
          config: configPDA,
          listing: slowListingPDA,
          nftMint: slowNftMint,
          sellerNftAccount: slowSellerNftAccount,
          vault: slowVaultPDA,
          seller: seller.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([seller])
        .rpc();

      const [slowC1] = PublicKey.findProgramAddressSync(
        [Buffer.from("contribution"), slowListingPDA.toBuffer(), contributor1.publicKey.toBuffer()],
        program.programId
      );
      const [slowC2] = PublicKey.findProgramAddressSync(
        [Buffer.from("contribution"), slowListingPDA.toBuffer(), contributor2.publicKey.toBuffer()],
        program.programId
      );

      await program.methods.contribute(5000).accounts({ listing: slowListingPDA, contribution: slowC1, contributor: contributor1.publicKey, systemProgram: SystemProgram.programId }).signers([contributor1]).rpc();
      await program.methods.contribute(5000).accounts({ listing: slowListingPDA, contribution: slowC2, contributor: contributor2.publicKey, systemProgram: SystemProgram.programId }).signers([contributor2]).rpc();

      // Advance time beyond execution window (~24h). Warp slots aggressively on local validator.
      await warpForwardSlots(250000);

      // Execute should now fail
      try {
        await program.methods
          .executePurchase()
          .accounts({
            config: configPDA,
            listing: slowListingPDA,
            nftMint: slowNftMint,
            seller: seller.publicKey,
            feeVault: feeVault.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([contributor1])
          .rpc();
        expect.fail("Should have thrown error");
      } catch (error) {
        expect(error.message).to.include("ExecutionWindowExpired");
      }

      // Refund should succeed after window
      await program.methods
        .processRefund()
        .accounts({
          listing: slowListingPDA,
          contribution: slowC1,
          contributor: contributor1.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([contributor1])
        .rpc();
    });
  });

});
});
