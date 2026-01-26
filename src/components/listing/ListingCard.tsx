import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Users, Info, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import ProgressBar from './ProgressBar';
import DeadlineTimer from './DeadlineTimer';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export interface ListingData {
  id: string;
  nftMint: string;
  nftName: string;
  nftImage: string;
  nftCollection: string;
  priceLamports: number;
  custodyFeeLamports: number;
  bpsSold: number;
  deadline: number;
  status: 'open' | 'funded' | 'custodied' | 'expired' | 'refunded' | 'sold';
  contributorCount: number;
}

interface ListingCardProps {
  listing: ListingData;
  index?: number;
}

const statusColors = {
  open: 'bg-success/10 text-success border-success/20',
  funded: 'bg-primary/10 text-primary border-primary/20',
  custodied: 'bg-primary/10 text-primary border-primary/20',
  expired: 'bg-muted text-muted-foreground border-muted',
  refunded: 'bg-muted text-muted-foreground border-muted',
  sold: 'bg-warning/10 text-warning border-warning/20',
};

// Grant-ready, audit-friendly status labels
const statusLabels = {
  open: 'Open',
  funded: 'Funded',
  custodied: 'Custodied (Program Vault)',
  expired: 'Expired',
  refunded: 'Refunded',
  sold: 'Sold',
};

const ListingCard: React.FC<ListingCardProps> = ({ listing, index = 0 }) => {
  const priceSOL = listing.priceLamports / 1e9;
  const feeSOL = listing.custodyFeeLamports / 1e9;
  const totalSOL = priceSOL + feeSOL;
  
  // Progress is EXCLUSIVELY based on ownership shares (bps)
  // 10,000 bps = 100% - custody fee does NOT affect progress
  const progress = (listing.bpsSold / 10000) * 100;
  const remainingBps = 10000 - listing.bpsSold;

  return (
    <TooltipProvider>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: index * 0.1 }}
      >
        <Link
          to={`/listing/${listing.nftMint}`}
          className="block group"
        >
          <div className="rounded-xl bg-card border border-border/50 overflow-hidden card-hover">
            {/* NFT Image */}
            <div className="relative aspect-square overflow-hidden">
              <img
                src={listing.nftImage}
                alt={listing.nftName}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-card/90 via-transparent to-transparent" />
              
              {/* Status Badge - using grant-ready labels */}
              <div className="absolute top-3 right-3">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${statusColors[listing.status]} flex items-center gap-1`}>
                      {listing.status === 'custodied' && <Shield className="w-3 h-3" />}
                      {statusLabels[listing.status]}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    {listing.status === 'custodied' && (
                      <p className="text-xs max-w-48">NFT is held in a program-controlled PDA. No admin or frontend has withdrawal authority.</p>
                    )}
                    {listing.status === 'sold' && (
                      <p className="text-xs max-w-48">This NFT has been sold through governance vote. Proceeds distributed to owners.</p>
                    )}
                    {listing.status === 'expired' && (
                      <p className="text-xs max-w-48">Funding deadline passed. All contributions are refundable.</p>
                    )}
                    {listing.status === 'open' && (
                      <p className="text-xs max-w-48">Active fundraising. Contribute to acquire ownership shares.</p>
                    )}
                  </TooltipContent>
                </Tooltip>
              </div>

              {/* Collection Badge */}
              <div className="absolute bottom-3 left-3">
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-card/80 backdrop-blur-sm border border-border/50">
                  {listing.nftCollection}
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="p-4">
              {/* Title */}
              <h3 className="font-semibold text-lg mb-3 truncate group-hover:text-primary transition-colors">
                {listing.nftName}
              </h3>

              {/* Price Info - Clear breakdown */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <span className="text-xs text-muted-foreground block mb-0.5">NFT Price</span>
                  <span className="font-semibold">{priceSOL.toFixed(2)} SOL</span>
                </div>
                <div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <span className="text-xs text-muted-foreground block mb-0.5 flex items-center gap-1">
                          Total Raise
                          <Info className="w-3 h-3" />
                        </span>
                        <span className="font-semibold text-primary">{totalSOL.toFixed(2)} SOL</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">NFT Price ({priceSOL.toFixed(2)} SOL) + Protocol Fee ({feeSOL.toFixed(2)} SOL)</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>

              {/* Protocol Fee Indicator - ALWAYS visible */}
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-primary/5 border border-primary/10 mb-4">
                <Shield className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs text-primary font-medium">Protocol Fee: 1% (included in Total Raise)</span>
              </div>

              {/* Progress - Based exclusively on ownership shares (bps) */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">Ownership Progress</span>
                  <span className="text-sm font-medium text-primary">{progress.toFixed(1)}%</span>
                </div>
                <ProgressBar progress={progress} />
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-muted-foreground font-mono">{listing.bpsSold.toLocaleString()} bps sold</span>
                  <span className="text-xs text-muted-foreground font-mono">{remainingBps.toLocaleString()} bps remaining</span>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-border/50">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Users className="w-3.5 h-3.5" />
                  <span>{listing.contributorCount} contributors</span>
                </div>
                {listing.status === 'open' && (
                  <div className="flex items-center gap-1.5 text-xs">
                    <Clock className="w-3.5 h-3.5 text-warning" />
                    <span className="text-warning font-medium">
                      <DeadlineTimer deadline={listing.deadline} compact />
                    </span>
                  </div>
                )}
                {listing.status === 'custodied' && (
                  <div className="flex items-center gap-1.5 text-xs text-primary">
                    <Shield className="w-3.5 h-3.5" />
                    <span>Non-custodial</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Link>
      </motion.div>
    </TooltipProvider>
  );
};

export default ListingCard;
