import React, { useState, useMemo } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Info, Loader2, AlertTriangle, Shield, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { ListingData } from './ListingCard';
import ProgressBar from './ProgressBar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ContributionPanelProps {
  listing: ListingData;
  onContribute?: (bps: number) => Promise<void>;
}

const presetPercentages = [1, 5, 10, 25];

const ContributionPanel: React.FC<ContributionPanelProps> = ({ 
  listing, 
  onContribute 
}) => {
  const { connected } = useWallet();
  const [bps, setBps] = useState<number>(100);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasAcknowledged, setHasAcknowledged] = useState(false);

  const maxBps = 10000 - listing.bpsSold;
  const pricePerBps = listing.priceLamports / 10000;
  const feePerBps = listing.custodyFeeLamports / 10000;

  const calculations = useMemo(() => {
    const principal = (pricePerBps * bps) / 1e9;
    const fee = (feePerBps * bps) / 1e9;
    const total = principal + fee;
    const ownership = (bps / 10000) * 100;
    return { principal, fee, total, ownership };
  }, [bps, pricePerBps, feePerBps]);

  const handleBpsChange = (value: number) => {
    const clamped = Math.min(Math.max(1, value), maxBps);
    setBps(clamped);
    setError(null);
  };

  const handlePresetClick = (percent: number) => {
    const targetBps = Math.floor((percent / 100) * 10000);
    handleBpsChange(Math.min(targetBps, maxBps));
  };

  const handleContribute = async () => {
    if (!connected || !onContribute || !hasAcknowledged) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      await onContribute(bps);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transaction failed');
    } finally {
      setIsLoading(false);
    }
  };

  const isDisabled = listing.status !== 'open' || maxBps === 0;

  return (
    <TooltipProvider>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-xl bg-card border border-border/50 p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Purchase Ownership Shares</h3>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1 text-xs text-primary cursor-help">
                <Shield className="w-3.5 h-3.5" />
                <span>Non-custodial</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs max-w-48">Your funds are held in program-controlled accounts. No admin or frontend can access them.</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {isDisabled ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              {listing.status === 'open' ? 'Fully subscribed - 10,000 bps sold' : `Listing is ${listing.status}`}
            </p>
          </div>
        ) : (
          <>
            {/* BPS Input */}
            <div className="mb-4">
              <label className="text-sm text-muted-foreground block mb-2">
                Ownership Shares (basis points)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={1}
                  max={maxBps}
                  value={bps}
                  onChange={(e) => handleBpsChange(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground font-mono text-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                  bps
                </span>
              </div>
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>Min: 1 bps (0.01%)</span>
                <span>Max available: {maxBps.toLocaleString()} bps</span>
              </div>
            </div>

            {/* Preset Buttons */}
            <div className="grid grid-cols-4 gap-2 mb-6">
              {presetPercentages.map((percent) => {
                const targetBps = Math.floor((percent / 100) * 10000);
                const isAvailable = targetBps <= maxBps;
                return (
                  <button
                    key={percent}
                    onClick={() => handlePresetClick(percent)}
                    disabled={!isAvailable}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isAvailable
                        ? 'bg-secondary hover:bg-muted border border-border'
                        : 'bg-muted/50 text-muted-foreground cursor-not-allowed'
                    }`}
                  >
                    {percent}%
                  </button>
                );
              })}
            </div>

            {/* Ownership Progress - bps only */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">Your Ownership Share</span>
                <span className="text-sm font-medium text-primary">
                  {calculations.ownership.toFixed(2)}% ({bps.toLocaleString()} bps)
                </span>
              </div>
              <ProgressBar progress={calculations.ownership} showGlow={false} />
            </div>

            {/* Cost Breakdown - Explicit fee transparency */}
            <div className="rounded-lg bg-secondary/50 border border-border/50 p-4 mb-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Principal (NFT share)</span>
                <span className="font-mono">{calculations.principal.toFixed(4)} SOL</span>
              </div>
              <div className="flex justify-between text-sm">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-muted-foreground flex items-center gap-1 cursor-help">
                      Protocol Custody Fee (1%)
                      <Info className="w-3.5 h-3.5" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs max-w-48">Fixed 1% fee for non-custodial vault custody. This fee is non-refundable if the NFT purchase succeeds.</p>
                  </TooltipContent>
                </Tooltip>
                <span className="font-mono">{calculations.fee.toFixed(4)} SOL</span>
              </div>
              <div className="border-t border-border/50 pt-3 flex justify-between">
                <span className="font-semibold">Total Payment</span>
                <span className="font-mono font-semibold text-primary">
                  {calculations.total.toFixed(4)} SOL
                </span>
              </div>
            </div>

            {/* Important Warnings - visible BEFORE irreversible action */}
            <div className="rounded-lg bg-warning/5 border border-warning/20 p-4 mb-4 space-y-2">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
                <div className="text-xs text-warning/90 space-y-1">
                  <p className="font-medium">Before you contribute:</p>
                  <ul className="list-disc list-inside space-y-0.5 text-warning/80">
                    <li>Principal is refundable if funding goal is not met by deadline</li>
                    <li>Protocol fee (1%) is non-refundable if NFT purchase succeeds</li>
                    <li>Ownership progress is tracked in basis points (10,000 bps = 100%)</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Acknowledgment Checkbox */}
            <label className="flex items-start gap-3 mb-4 cursor-pointer group">
              <input
                type="checkbox"
                checked={hasAcknowledged}
                onChange={(e) => setHasAcknowledged(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-border bg-secondary text-primary focus:ring-primary/50"
              />
              <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                I understand that my contribution will be held in a non-custodial program vault, 
                and the 1% protocol fee is non-refundable upon successful NFT purchase.
              </span>
            </label>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                {error}
              </div>
            )}

            {/* Action Button */}
            {connected ? (
              <button
                onClick={handleContribute}
                disabled={isLoading || bps < 1 || !hasAcknowledged}
                className="w-full py-4 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 glow-primary hover:glow-primary-intense flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing Transaction...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Contribute {calculations.total.toFixed(4)} SOL
                  </>
                )}
              </button>
            ) : (
              <div className="flex justify-center">
                <WalletMultiButton />
              </div>
            )}

            {/* Refund Info */}
            <div className="flex items-center justify-center gap-2 mt-4 text-xs text-muted-foreground">
              <Shield className="w-3.5 h-3.5 text-success" />
              <span>Funds refundable if listing doesn't reach 100% by deadline</span>
            </div>
          </>
        )}
      </motion.div>
    </TooltipProvider>
  );
};

export default ContributionPanel;
