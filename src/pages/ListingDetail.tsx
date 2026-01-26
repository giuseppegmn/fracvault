import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Users, Clock, Shield, Copy, Check, Info, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import Layout from '@/components/layout/Layout';
import ContributionPanel from '@/components/listing/ContributionPanel';
import ProgressBar from '@/components/listing/ProgressBar';
import DeadlineTimer from '@/components/listing/DeadlineTimer';
import ProposalCard, { ProposalData } from '@/components/governance/ProposalCard';
import RewardsPanel, { RewardData } from '@/components/rewards/RewardsPanel';
import { ListingData } from '@/components/listing/ListingCard';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Grant-ready status labels
const statusLabels: Record<string, string> = {
  open: 'Open',
  funded: 'Funded',
  custodied: 'Custodied (Program Vault)',
  expired: 'Expired',
  refunded: 'Refunded',
  sold: 'Sold',
};

const statusColors: Record<string, string> = {
  open: 'bg-success/10 text-success border-success/20',
  funded: 'bg-primary/10 text-primary border-primary/20',
  custodied: 'bg-primary/10 text-primary border-primary/20',
  expired: 'bg-muted text-muted-foreground border-muted',
  refunded: 'bg-muted text-muted-foreground border-muted',
  sold: 'bg-warning/10 text-warning border-warning/20',
};

// Mock data
const mockListing: ListingData = {
  id: '1',
  nftMint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
  nftName: 'MadLad #4521',
  nftImage: 'https://images.pexels.com/photos/8369524/pexels-photo-8369524.jpeg?auto=compress&cs=tinysrgb&w=800',
  nftCollection: 'MadLads',
  priceLamports: 100_000_000_000,
  custodyFeeLamports: 1_000_000_000,
  bpsSold: 7250,
  deadline: Math.floor(Date.now() / 1000) + 86400 * 2,
  status: 'open',
  contributorCount: 23,
};

const mockProposals: ProposalData[] = [
  {
    id: '1',
    listingId: '1',
    proposalId: 1,
    proposer: '7nYBqvF8KQY9P3mJ5kLr2wXBoRgixCa6xjnB7YaB1pPw',
    salePriceLamports: 120_000_000_000,
    voteDeadline: Math.floor(Date.now() / 1000) + 86400,
    yesBps: 4200,
    noBps: 1800,
    status: 'active',
  },
];

const mockRewards: RewardData[] = [
  {
    id: '1',
    listingId: '1',
    rewardMint: 'So11111111111111111111111111111111111111112',
    tokenSymbol: 'SOL',
    tokenName: 'Wrapped SOL',
    totalAmount: 0.5,
    userClaimable: 0.025,
    userClaimed: 0,
  },
];

const mockContributors = [
  { wallet: '7nYB...3kPw', bps: 2500, principal: 25 },
  { wallet: '9xKL...7mNq', bps: 1500, principal: 15 },
  { wallet: '3pRT...8vBc', bps: 1000, principal: 10 },
  { wallet: '5wFG...2hJk', bps: 750, principal: 7.5 },
  { wallet: '8mZX...4qLp', bps: 500, principal: 5 },
];

const ListingDetail: React.FC = () => {
  const { mint } = useParams();
  const [activeTab, setActiveTab] = useState<'contribute' | 'governance' | 'rewards'>('contribute');
  const [copied, setCopied] = useState(false);

  // In production, fetch listing data based on mint
  const listing = mockListing;
  const userBps = 500; // Mock user ownership

  const priceSOL = listing.priceLamports / 1e9;
  const feeSOL = listing.custodyFeeLamports / 1e9;
  const totalSOL = priceSOL + feeSOL;
  
  // Progress is EXCLUSIVELY based on ownership shares (bps)
  const progress = (listing.bpsSold / 10000) * 100;
  const remainingBps = 10000 - listing.bpsSold;

  const copyAddress = () => {
    navigator.clipboard.writeText(listing.nftMint);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleContribute = async (bps: number) => {
    console.log('Contributing', bps, 'bps');
    await new Promise((resolve) => setTimeout(resolve, 2000));
  };

  const handleVote = async (vote: 'yes' | 'no') => {
    console.log('Voting', vote);
    await new Promise((resolve) => setTimeout(resolve, 1500));
  };

  const handleClaimReward = async (rewardId: string) => {
    console.log('Claiming reward', rewardId);
    await new Promise((resolve) => setTimeout(resolve, 1500));
  };

  return (
    <TooltipProvider>
      <Layout>
        <section className="py-8">
          <div className="container mx-auto px-4">
            {/* Back Link */}
            <Link
              to="/listings"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Listings
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - NFT Info */}
              <div className="lg:col-span-2 space-y-6">
                {/* NFT Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl bg-card border border-border/50 overflow-hidden"
                >
                  <div className="aspect-square max-h-[500px] overflow-hidden">
                    <img
                      src={listing.nftImage}
                      alt={listing.nftName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </motion.div>

                {/* Details */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="rounded-xl bg-card border border-border/50 p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <span className="text-sm text-muted-foreground">{listing.nftCollection}</span>
                      <h1 className="text-2xl font-bold">{listing.nftName}</h1>
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium border flex items-center gap-1.5 cursor-help ${statusColors[listing.status]}`}>
                          {listing.status === 'custodied' && <Shield className="w-3.5 h-3.5" />}
                          {statusLabels[listing.status]}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        {listing.status === 'custodied' && (
                          <p className="text-xs max-w-48">NFT is held in a program-controlled PDA. No admin or frontend has withdrawal authority.</p>
                        )}
                        {listing.status === 'open' && (
                          <p className="text-xs max-w-48">Active fundraising. Contribute to acquire ownership shares (bps).</p>
                        )}
                        {listing.status === 'sold' && (
                          <p className="text-xs max-w-48">NFT was sold through governance vote. Proceeds distributed to owners.</p>
                        )}
                        {listing.status === 'expired' && (
                          <p className="text-xs max-w-48">Funding deadline passed without reaching 100%. All contributions are refundable.</p>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  </div>

                  {/* Mint Address */}
                  <div className="flex items-center gap-2 mb-6">
                    <span className="text-sm text-muted-foreground font-mono">
                      {listing.nftMint.slice(0, 8)}...{listing.nftMint.slice(-8)}
                    </span>
                    <button onClick={copyAddress} className="text-muted-foreground hover:text-primary transition-colors">
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <a
                      href={`https://solscan.io/token/${listing.nftMint}?cluster=devnet`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>

                  {/* Price Grid - Explicit fee breakdown */}
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="p-4 rounded-lg bg-secondary/50">
                      <span className="text-xs text-muted-foreground block mb-1">NFT Price</span>
                      <span className="text-xl font-bold font-mono">{priceSOL} SOL</span>
                    </div>
                    <div className="p-4 rounded-lg bg-secondary/50">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="cursor-help">
                            <span className="text-xs text-muted-foreground block mb-1 flex items-center gap-1">
                              Protocol Fee (1%)
                              <Info className="w-3 h-3" />
                            </span>
                            <span className="text-xl font-bold font-mono">{feeSOL} SOL</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs max-w-48">Fixed 1% custody fee for non-custodial vault. Non-refundable upon successful NFT purchase.</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="cursor-help">
                            <span className="text-xs text-muted-foreground block mb-1 flex items-center gap-1">
                              Total Raise
                              <Info className="w-3 h-3" />
                            </span>
                            <span className="text-xl font-bold text-primary font-mono">{totalSOL} SOL</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs max-w-48">NFT Price ({priceSOL} SOL) + Protocol Fee ({feeSOL} SOL)</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>

                  {/* Protocol Fee Note */}
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/10 mb-6">
                    <Shield className="w-4 h-4 text-primary" />
                    <span className="text-xs text-primary font-medium">Protocol Fee: 1% (included in Total Raise)</span>
                  </div>

                  {/* Progress - EXCLUSIVELY based on ownership shares (bps) */}
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-muted-foreground">Ownership Progress</span>
                      <span className="font-semibold text-primary">{progress.toFixed(1)}%</span>
                    </div>
                    <ProgressBar progress={progress} className="h-3" />
                    <div className="flex justify-between items-center mt-2 text-sm text-muted-foreground">
                      <span className="font-mono">{listing.bpsSold.toLocaleString()} bps sold</span>
                      <span className="font-mono">{remainingBps.toLocaleString()} bps remaining</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      10,000 bps = 100% ownership. Protocol fee does not affect ownership percentages.
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="w-4 h-4" />
                      <span>{listing.contributorCount} contributors</span>
                    </div>
                    {listing.status === 'open' && (
                      <div className="flex items-center gap-2 text-sm text-warning">
                        <Clock className="w-4 h-4" />
                        <DeadlineTimer deadline={listing.deadline} compact />
                      </div>
                    )}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-2 text-sm text-primary cursor-help">
                          <Shield className="w-4 h-4" />
                          <span>Non-custodial</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs max-w-48">NFT will be held in program-controlled vault. No admin keys can access it.</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </motion.div>

                {/* Important Notice for Open Listings */}
                {listing.status === 'open' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="rounded-xl bg-warning/5 border border-warning/20 p-4"
                  >
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-warning mb-1">Before Contributing</p>
                        <ul className="text-warning/80 space-y-1 list-disc list-inside">
                          <li>Principal is refundable if listing doesn't reach 100% by deadline</li>
                          <li>Protocol fee (1%) is non-refundable upon successful purchase</li>
                          <li>Review deadline carefully - 72-hour funding window</li>
                        </ul>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Contributors */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="rounded-xl bg-card border border-border/50 p-6"
                >
                  <h3 className="font-semibold mb-4">Top Contributors</h3>
                  <div className="space-y-3">
                    {mockContributors.map((contributor, i) => (
                      <div
                        key={contributor.wallet}
                        className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-muted-foreground w-6">#{i + 1}</span>
                          <span className="font-mono text-sm">{contributor.wallet}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-semibold font-mono">{contributor.bps} bps</span>
                          <span className="text-xs text-muted-foreground ml-2">
                            ({((contributor.bps / 10000) * 100).toFixed(2)}%)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>

              {/* Right Column - Actions */}
              <div className="space-y-6">
                {/* Deadline Timer (for open listings) */}
                {listing.status === 'open' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl bg-card border border-border/50 p-6"
                  >
                    <h3 className="text-sm text-muted-foreground mb-3">Time Remaining</h3>
                    <DeadlineTimer deadline={listing.deadline} />
                    <p className="text-xs text-muted-foreground mt-3">
                      Contributions are refundable if 100% is not reached by deadline.
                    </p>
                  </motion.div>
                )}

                {/* Tab Navigation */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="flex rounded-lg bg-secondary p-1"
                >
                  {[
                    { id: 'contribute', label: 'Contribute' },
                    { id: 'governance', label: 'Governance' },
                    { id: 'rewards', label: 'Rewards' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as typeof activeTab)}
                      className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                        activeTab === tab.id
                          ? 'bg-card text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </motion.div>

                {/* Tab Content */}
                {activeTab === 'contribute' && (
                  <ContributionPanel listing={listing} onContribute={handleContribute} />
                )}

                {activeTab === 'governance' && (
                  <div className="space-y-4">
                    {listing.status === 'custodied' || mockProposals.length > 0 ? (
                      <>
                        {mockProposals.map((proposal) => (
                          <ProposalCard
                            key={proposal.id}
                            proposal={proposal}
                            nftName={listing.nftName}
                            userBps={userBps}
                            hasVoted={false}
                            onVote={handleVote}
                          />
                        ))}
                        {listing.status === 'custodied' && (
                          <button className="w-full py-3 rounded-lg bg-secondary hover:bg-muted border border-border font-medium transition-colors">
                            Create New Proposal
                          </button>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-8 rounded-xl bg-card border border-border/50">
                        <Shield className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                        <p className="text-muted-foreground">
                          Governance will be available once the NFT is custodied in the program vault.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'rewards' && (
                  <RewardsPanel
                    rewards={mockRewards}
                    userBps={userBps}
                    onClaim={handleClaimReward}
                  />
                )}

                {/* Custody Info Link */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Link
                    to="/how-custody-works"
                    className="flex items-center justify-center gap-2 py-3 rounded-lg bg-primary/5 border border-primary/10 text-sm text-primary font-medium hover:bg-primary/10 transition-colors"
                  >
                    <Shield className="w-4 h-4" />
                    Learn How Non-Custodial Custody Works
                  </Link>
                </motion.div>
              </div>
            </div>
          </div>
        </section>
      </Layout>
    </TooltipProvider>
  );
};

export default ListingDetail;
