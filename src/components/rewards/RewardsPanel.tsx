import React, { useState } from 'react';
import { Gift, Loader2, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

export interface RewardData {
  id: string;
  listingId: string;
  rewardMint: string;
  tokenSymbol: string;
  tokenName: string;
  totalAmount: number;
  userClaimable: number;
  userClaimed: number;
}

interface RewardsPanelProps {
  rewards: RewardData[];
  userBps: number;
  onClaim?: (rewardId: string) => Promise<void>;
}

const RewardsPanel: React.FC<RewardsPanelProps> = ({
  rewards,
  userBps,
  onClaim,
}) => {
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const handleClaim = async (rewardId: string) => {
    if (!onClaim) return;
    setClaimingId(rewardId);
    try {
      await onClaim(rewardId);
    } finally {
      setClaimingId(null);
    }
  };

  const totalClaimable = rewards.reduce((sum, r) => sum + r.userClaimable, 0);
  const ownershipPercent = (userBps / 10000) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl bg-card border border-border/50 p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Gift className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Rewards</h3>
        </div>
        <span className="text-sm text-muted-foreground">
          Your share: {ownershipPercent.toFixed(2)}%
        </span>
      </div>

      {rewards.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Gift className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No rewards available yet</p>
          <p className="text-sm mt-1">Rewards will appear here when the vault receives airdrops or staking rewards.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {rewards.map((reward) => (
            <div
              key={reward.id}
              className="p-4 rounded-lg bg-secondary/50 border border-border/50"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="font-semibold">{reward.tokenSymbol}</span>
                  <span className="text-sm text-muted-foreground ml-2">{reward.tokenName}</span>
                </div>
                <a
                  href={`https://solscan.io/token/${reward.rewardMint}?cluster=devnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <span className="text-xs text-muted-foreground block">Total Pool</span>
                  <span className="font-mono">{reward.totalAmount.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Your Share</span>
                  <span className="font-mono text-primary">
                    {reward.userClaimable.toLocaleString()}
                  </span>
                </div>
              </div>

              {reward.userClaimed > 0 && (
                <div className="text-xs text-muted-foreground mb-3">
                  Already claimed: {reward.userClaimed.toLocaleString()}
                </div>
              )}

              {reward.userClaimable > 0 && onClaim && (
                <button
                  onClick={() => handleClaim(reward.id)}
                  disabled={claimingId === reward.id}
                  className="w-full py-2 rounded-lg bg-primary/10 text-primary font-medium hover:bg-primary/20 border border-primary/20 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {claimingId === reward.id ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Claiming...
                    </>
                  ) : (
                    `Claim ${reward.userClaimable.toLocaleString()} ${reward.tokenSymbol}`
                  )}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {totalClaimable > 0 && (
        <div className="mt-4 pt-4 border-t border-border/50 text-center">
          <span className="text-sm text-muted-foreground">
            Total claimable value across all rewards
          </span>
        </div>
      )}
    </motion.div>
  );
};

export default RewardsPanel;
