import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { 
  Wallet, 
  TrendingUp, 
  Gift, 
  Vote, 
  ExternalLink, 
  Shield, 
  AlertCircle,
  Clock,
  CheckCircle,
  Info,
  Coins
} from 'lucide-react';
import { motion } from 'framer-motion';
import Layout from '@/components/layout/Layout';
import ProgressBar from '@/components/listing/ProgressBar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface PortfolioItem {
  listingId: string;
  nftMint: string;
  nftName: string;
  nftImage: string;
  nftCollection: string;
  status: 'open' | 'funded' | 'custodied' | 'expired' | 'refunded' | 'sold';
  userBps: number;
  principalLamports: number;
  feeLamports: number;
  currentValueLamports: number;
  unclaimedRewards: number;
  pendingProposals: number;
}

// Mock data - empty state for demo
const mockPortfolio: PortfolioItem[] = [
  {
    listingId: '1',
    nftMint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
    nftName: 'MadLad #4521',
    nftImage: 'https://images.pexels.com/photos/8369524/pexels-photo-8369524.jpeg?auto=compress&cs=tinysrgb&w=600',
    nftCollection: 'MadLads',
    status: 'custodied',
    userBps: 500,
    principalLamports: 5_000_000_000,
    feeLamports: 50_000_000,
    currentValueLamports: 6_000_000_000,
    unclaimedRewards: 2,
    pendingProposals: 1,
  },
  {
    listingId: '2',
    nftMint: 'abc123...xyz',
    nftName: 'SMB #2891',
    nftImage: 'https://images.pexels.com/photos/8369648/pexels-photo-8369648.jpeg?auto=compress&cs=tinysrgb&w=600',
    nftCollection: 'Solana Monkey Business',
    status: 'open',
    userBps: 1000,
    principalLamports: 5_000_000_000,
    feeLamports: 50_000_000,
    currentValueLamports: 5_000_000_000,
    unclaimedRewards: 0,
    pendingProposals: 0,
  },
  {
    listingId: '3',
    nftMint: 'def456...uvw',
    nftName: 'DeGod #7744',
    nftImage: 'https://images.pexels.com/photos/7567443/pexels-photo-7567443.jpeg?auto=compress&cs=tinysrgb&w=600',
    nftCollection: 'DeGods',
    status: 'sold',
    userBps: 250,
    principalLamports: 5_000_000_000,
    feeLamports: 50_000_000,
    currentValueLamports: 7_500_000_000,
    unclaimedRewards: 0,
    pendingProposals: 0,
  },
];

// Status labels with non-custodial language
const statusLabels: Record<string, string> = {
  open: 'Open',
  funded: 'Funded',
  custodied: 'Custodied (Program Vault)',
  expired: 'Expired',
  refunded: 'Refunded',
  sold: 'Sold',
};

const statusColors: Record<string, string> = {
  open: 'bg-success/10 text-success',
  funded: 'bg-primary/10 text-primary',
  custodied: 'bg-primary/10 text-primary',
  expired: 'bg-muted text-muted-foreground',
  refunded: 'bg-muted text-muted-foreground',
  sold: 'bg-warning/10 text-warning',
};

const Portfolio: React.FC = () => {
  const { connected } = useWallet();
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  const filteredItems = mockPortfolio.filter((item) => {
    if (filter === 'active') return ['open', 'funded', 'custodied'].includes(item.status);
    if (filter === 'completed') return ['sold', 'refunded', 'expired'].includes(item.status);
    return true;
  });

  // Calculate totals
  const totalInvested = mockPortfolio.reduce((sum, item) => sum + item.principalLamports + item.feeLamports, 0) / 1e9;
  const totalValue = mockPortfolio.reduce((sum, item) => sum + item.currentValueLamports, 0) / 1e9;
  const totalBps = mockPortfolio.reduce((sum, item) => sum + item.userBps, 0);
  const totalUnclaimedRewards = mockPortfolio.reduce((sum, item) => sum + item.unclaimedRewards, 0);
  const totalPendingProposals = mockPortfolio.reduce((sum, item) => sum + item.pendingProposals, 0);

  if (!connected) {
    return (
      <Layout>
        <section className="py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-md mx-auto text-center">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <Wallet className="w-10 h-10 text-primary" />
              </div>
              <h1 className="text-2xl font-bold mb-3">Connect Your Wallet</h1>
              <p className="text-muted-foreground mb-8">
                Connect your Solana wallet to view your fractional NFT portfolio, governance votes, and claimable rewards.
              </p>
              <WalletMultiButton />

              {/* Feature Preview */}
              <div className="mt-12 text-left">
                <h3 className="text-sm font-semibold text-muted-foreground mb-4 text-center">Your portfolio will show:</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: Coins, label: 'Ownership Shares (bps)' },
                    { icon: Vote, label: 'Voting Power' },
                    { icon: Clock, label: 'Active Proposals' },
                    { icon: Gift, label: 'Claimable Rewards' },
                  ].map((feature) => (
                    <div key={feature.label} className="flex items-center gap-2 p-3 rounded-lg bg-card border border-border/50">
                      <feature.icon className="w-4 h-4 text-primary" />
                      <span className="text-sm text-muted-foreground">{feature.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <TooltipProvider>
      <Layout>
        <section className="py-12">
          <div className="container mx-auto px-4">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <h1 className="text-3xl md:text-4xl font-bold mb-2">Your Portfolio</h1>
              <p className="text-muted-foreground">
                Manage your fractional NFT holdings, governance votes, and rewards
              </p>
            </motion.div>

            {/* Summary Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8"
            >
              <div className="p-4 rounded-xl bg-card border border-border/50">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Wallet className="w-4 h-4" />
                  <span className="text-sm">Total Invested</span>
                </div>
                <span className="text-2xl font-bold">{totalInvested.toFixed(2)} SOL</span>
              </div>
              <div className="p-4 rounded-xl bg-card border border-border/50">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm">Current Value</span>
                </div>
                <span className="text-2xl font-bold text-primary">{totalValue.toFixed(2)} SOL</span>
              </div>
              <div className="p-4 rounded-xl bg-card border border-border/50">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="cursor-help">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <Coins className="w-4 h-4" />
                        <span className="text-sm">Total Ownership</span>
                        <Info className="w-3 h-3" />
                      </div>
                      <span className="text-2xl font-bold font-mono">{totalBps.toLocaleString()} bps</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs max-w-48">Total ownership shares across all holdings. 10,000 bps = 100% of one NFT.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="p-4 rounded-xl bg-card border border-border/50">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Gift className="w-4 h-4" />
                  <span className="text-sm">Unclaimed Rewards</span>
                </div>
                <span className="text-2xl font-bold">
                  {totalUnclaimedRewards > 0 ? (
                    <span className="text-success">{totalUnclaimedRewards}</span>
                  ) : (
                    <span className="text-muted-foreground">0</span>
                  )}
                </span>
              </div>
              <div className="p-4 rounded-xl bg-card border border-border/50">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Vote className="w-4 h-4" />
                  <span className="text-sm">Active Proposals</span>
                </div>
                <span className="text-2xl font-bold">
                  {totalPendingProposals > 0 ? (
                    <span className="text-warning">{totalPendingProposals}</span>
                  ) : (
                    <span className="text-muted-foreground">0</span>
                  )}
                </span>
              </div>
            </motion.div>

            {/* Governance Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="mb-8"
            >
              <div className="rounded-xl bg-card border border-border/50 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Vote className="w-5 h-5 text-primary" />
                    <h2 className="text-lg font-semibold">Governance</h2>
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground cursor-help">
                        <Shield className="w-3.5 h-3.5" />
                        <span>On-chain voting</span>
                        <Info className="w-3 h-3" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs max-w-48">All votes are recorded on-chain. Voting power equals your ownership shares (bps).</p>
                    </TooltipContent>
                  </Tooltip>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-secondary/50 border border-border/50">
                    <span className="text-xs text-muted-foreground block mb-1">Your Voting Power</span>
                    <span className="text-xl font-bold font-mono">{totalBps.toLocaleString()} bps</span>
                    <p className="text-xs text-muted-foreground mt-1">1 bps = 1 vote</p>
                  </div>
                  <div className="p-4 rounded-lg bg-secondary/50 border border-border/50">
                    <span className="text-xs text-muted-foreground block mb-1">Pending Votes</span>
                    <span className="text-xl font-bold">
                      {totalPendingProposals > 0 ? (
                        <span className="text-warning">{totalPendingProposals} proposal(s)</span>
                      ) : (
                        <span className="text-muted-foreground">None</span>
                      )}
                    </span>
                    <p className="text-xs text-muted-foreground mt-1">Proposals awaiting your vote</p>
                  </div>
                  <div className="p-4 rounded-lg bg-secondary/50 border border-border/50">
                    <span className="text-xs text-muted-foreground block mb-1">Vote Delegation</span>
                    <span className="text-xl font-bold text-muted-foreground">Not delegated</span>
                    <p className="text-xs text-muted-foreground mt-1">Delegate voting power (V1)</p>
                  </div>
                </div>

                {totalPendingProposals === 0 && (
                  <div className="mt-4 p-4 rounded-lg bg-muted/30 text-center">
                    <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No active proposals requiring your vote</p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Rewards Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-8"
            >
              <div className="rounded-xl bg-card border border-border/50 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Gift className="w-5 h-5 text-primary" />
                    <h2 className="text-lg font-semibold">Rewards & Airdrops</h2>
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground cursor-help">
                        <Shield className="w-3.5 h-3.5" />
                        <span>Proportional distribution</span>
                        <Info className="w-3 h-3" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs max-w-48">All rewards received by the vault are distributed proportionally based on your ownership shares (bps).</p>
                    </TooltipContent>
                  </Tooltip>
                </div>

                {totalUnclaimedRewards > 0 ? (
                  <div className="p-4 rounded-lg bg-success/5 border border-success/20">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-4 h-4 text-success" />
                      <span className="font-medium text-success">You have {totalUnclaimedRewards} claimable reward(s)</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Visit individual listing pages to claim your proportional share of airdrops and rewards.
                    </p>
                  </div>
                ) : (
                  <div className="p-4 rounded-lg bg-muted/30 text-center">
                    <Gift className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No rewards to claim</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Rewards appear here when custodied NFTs receive airdrops or staking rewards.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Filters */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="flex gap-2 mb-6"
            >
              {[
                { id: 'all', label: 'All Holdings' },
                { id: 'active', label: 'Active' },
                { id: 'completed', label: 'Completed' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id as typeof filter)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === f.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary hover:bg-muted'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </motion.div>

            {/* Holdings List */}
            {filteredItems.length > 0 ? (
              <div className="space-y-4">
                {filteredItems.map((item, index) => {
                  const ownership = (item.userBps / 10000) * 100;
                  const invested = (item.principalLamports + item.feeLamports) / 1e9;
                  const currentValue = item.currentValueLamports / 1e9;
                  const pnl = currentValue - invested;
                  const pnlPercent = ((currentValue - invested) / invested) * 100;

                  return (
                    <motion.div
                      key={item.listingId}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + index * 0.05 }}
                    >
                      <Link
                        to={`/listing/${item.nftMint}`}
                        className="block rounded-xl bg-card border border-border/50 p-4 card-hover"
                      >
                        <div className="flex flex-col md:flex-row gap-4">
                          {/* NFT Image */}
                          <div className="w-full md:w-24 h-48 md:h-24 rounded-lg overflow-hidden flex-shrink-0">
                            <img
                              src={item.nftImage}
                              alt={item.nftName}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <span className="text-xs text-muted-foreground">{item.nftCollection}</span>
                                <h3 className="font-semibold">{item.nftName}</h3>
                              </div>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${statusColors[item.status]}`}>
                                {item.status === 'custodied' && <Shield className="w-3 h-3" />}
                                {statusLabels[item.status]}
                              </span>
                            </div>

                            {/* Ownership Bar - bps based */}
                            <div className="mb-3">
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-muted-foreground">Your Ownership</span>
                                <span className="font-medium text-primary font-mono">{ownership.toFixed(2)}% ({item.userBps} bps)</span>
                              </div>
                              <ProgressBar progress={ownership} showGlow={false} />
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              <div>
                                <span className="text-xs text-muted-foreground block">Invested</span>
                                <span className="text-sm font-medium">{invested.toFixed(2)} SOL</span>
                              </div>
                              <div>
                                <span className="text-xs text-muted-foreground block">Current Value</span>
                                <span className="text-sm font-medium">{currentValue.toFixed(2)} SOL</span>
                              </div>
                              <div>
                                <span className="text-xs text-muted-foreground block">P&L</span>
                                <span className={`text-sm font-medium ${pnl >= 0 ? 'text-success' : 'text-destructive'}`}>
                                  {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)} SOL ({pnlPercent.toFixed(1)}%)
                                </span>
                              </div>
                              <div className="flex items-center gap-3">
                                {item.unclaimedRewards > 0 && (
                                  <span className="inline-flex items-center gap-1 text-xs bg-success/10 text-success px-2 py-1 rounded-full">
                                    <Gift className="w-3 h-3" />
                                    {item.unclaimedRewards} reward(s)
                                  </span>
                                )}
                                {item.pendingProposals > 0 && (
                                  <span className="inline-flex items-center gap-1 text-xs bg-warning/10 text-warning px-2 py-1 rounded-full">
                                    <Vote className="w-3 h-3" />
                                    {item.pendingProposals} vote(s)
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Arrow */}
                          <div className="hidden md:flex items-center">
                            <ExternalLink className="w-5 h-5 text-muted-foreground" />
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16 rounded-xl bg-card border border-border/50">
                <Wallet className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No Holdings Found</h3>
                <p className="text-muted-foreground mb-6">
                  You don't have any fractional NFT holdings yet.
                </p>
                <Link
                  to="/listings"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
                >
                  Browse Listings
                </Link>
              </div>
            )}
          </div>
        </section>
      </Layout>
    </TooltipProvider>
  );
};

export default Portfolio;
