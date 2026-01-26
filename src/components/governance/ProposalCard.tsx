import React from 'react';
import { CheckCircle2, XCircle, Clock, Gavel } from 'lucide-react';
import { motion } from 'framer-motion';
import ProgressBar from '../listing/ProgressBar';

export interface ProposalData {
  id: string;
  listingId: string;
  proposalId: number;
  proposer: string;
  salePriceLamports: number;
  voteDeadline: number;
  yesBps: number;
  noBps: number;
  status: 'active' | 'approved' | 'rejected' | 'expired' | 'executed';
}

interface ProposalCardProps {
  proposal: ProposalData;
  nftName: string;
  userBps?: number;
  hasVoted?: boolean;
  onVote?: (vote: 'yes' | 'no') => Promise<void>;
}

const statusConfig = {
  active: { icon: Clock, color: 'text-primary', bg: 'bg-primary/10', label: 'Active' },
  approved: { icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10', label: 'Approved' },
  rejected: { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10', label: 'Rejected' },
  expired: { icon: Clock, color: 'text-muted-foreground', bg: 'bg-muted', label: 'Expired' },
  executed: { icon: Gavel, color: 'text-warning', bg: 'bg-warning/10', label: 'Executed' },
};

const ProposalCard: React.FC<ProposalCardProps> = ({
  proposal,
  nftName,
  userBps = 0,
  hasVoted = false,
  onVote,
}) => {
  const { icon: StatusIcon, color, bg, label } = statusConfig[proposal.status];
  const salePriceSOL = proposal.salePriceLamports / 1e9;
  const totalVoted = proposal.yesBps + proposal.noBps;
  const yesPercent = totalVoted > 0 ? (proposal.yesBps / totalVoted) * 100 : 0;
  const noPercent = totalVoted > 0 ? (proposal.noBps / totalVoted) * 100 : 0;
  const quorumPercent = (proposal.yesBps / 10000) * 100;

  const deadline = new Date(proposal.voteDeadline * 1000);
  const isExpired = Date.now() > proposal.voteDeadline * 1000;
  const canVote = proposal.status === 'active' && !hasVoted && userBps > 0 && !isExpired;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl bg-card border border-border/50 p-6"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-muted-foreground">
              Proposal #{proposal.proposalId}
            </span>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${bg} ${color}`}>
              <StatusIcon className="w-3 h-3" />
              {label}
            </span>
          </div>
          <h4 className="font-semibold">Sell {nftName}</h4>
        </div>
        <div className="text-right">
          <span className="text-xs text-muted-foreground block">Proposed Price</span>
          <span className="font-semibold text-primary">{salePriceSOL.toFixed(2)} SOL</span>
        </div>
      </div>

      {/* Proposer */}
      <div className="mb-4 p-3 rounded-lg bg-secondary/50">
        <span className="text-xs text-muted-foreground block mb-1">Proposed by</span>
        <span className="text-sm font-mono">
          {proposal.proposer.slice(0, 4)}...{proposal.proposer.slice(-4)}
        </span>
      </div>

      {/* Voting Progress */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-success">YES: {proposal.yesBps} bps ({yesPercent.toFixed(1)}%)</span>
          <span className="text-destructive">NO: {proposal.noBps} bps ({noPercent.toFixed(1)}%)</span>
        </div>
        <div className="h-3 rounded-full bg-muted overflow-hidden flex">
          <div
            className="bg-success transition-all duration-300"
            style={{ width: `${yesPercent}%` }}
          />
          <div
            className="bg-destructive transition-all duration-300"
            style={{ width: `${noPercent}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-2">
          <span>Quorum: {quorumPercent.toFixed(1)}% / 50%</span>
          <span>Total voted: {totalVoted} bps</span>
        </div>
      </div>

      {/* Deadline */}
      <div className="mb-4 text-sm text-muted-foreground">
        <Clock className="w-4 h-4 inline mr-1" />
        {isExpired ? 'Voting ended' : `Ends ${deadline.toLocaleDateString()} ${deadline.toLocaleTimeString()}`}
      </div>

      {/* Voting Buttons */}
      {canVote && onVote && (
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onVote('yes')}
            className="py-3 rounded-lg bg-success/10 text-success font-medium hover:bg-success/20 border border-success/20 transition-colors"
          >
            Vote YES ({userBps} bps)
          </button>
          <button
            onClick={() => onVote('no')}
            className="py-3 rounded-lg bg-destructive/10 text-destructive font-medium hover:bg-destructive/20 border border-destructive/20 transition-colors"
          >
            Vote NO ({userBps} bps)
          </button>
        </div>
      )}

      {hasVoted && (
        <div className="text-center py-3 rounded-lg bg-secondary text-muted-foreground">
          You have already voted
        </div>
      )}

      {!canVote && !hasVoted && userBps === 0 && proposal.status === 'active' && (
        <div className="text-center py-3 rounded-lg bg-secondary text-muted-foreground">
          You need shares to vote
        </div>
      )}
    </motion.div>
  );
};

export default ProposalCard;
