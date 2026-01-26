import React, { useState } from 'react';
import { Search, Filter, SlidersHorizontal, Shield, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import Layout from '@/components/layout/Layout';
import ListingCard, { ListingData } from '@/components/listing/ListingCard';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Mock data for demonstration
const mockListings: ListingData[] = [
  {
    id: '1',
    nftMint: 'mad1...abc',
    nftName: 'MadLad #4521',
    nftImage: 'https://images.pexels.com/photos/8369524/pexels-photo-8369524.jpeg?auto=compress&cs=tinysrgb&w=600',
    nftCollection: 'MadLads',
    priceLamports: 100_000_000_000,
    custodyFeeLamports: 1_000_000_000,
    bpsSold: 7250,
    deadline: Math.floor(Date.now() / 1000) + 86400 * 2,
    status: 'open',
    contributorCount: 23,
  },
  {
    id: '2',
    nftMint: 'smo1...def',
    nftName: 'SMB #2891',
    nftImage: 'https://images.pexels.com/photos/8369648/pexels-photo-8369648.jpeg?auto=compress&cs=tinysrgb&w=600',
    nftCollection: 'Solana Monkey Business',
    priceLamports: 50_000_000_000,
    custodyFeeLamports: 500_000_000,
    bpsSold: 10000,
    deadline: Math.floor(Date.now() / 1000) - 86400,
    status: 'custodied',
    contributorCount: 15,
  },
  {
    id: '3',
    nftMint: 'dgen1...ghi',
    nftName: 'DeGod #7744',
    nftImage: 'https://images.pexels.com/photos/7567443/pexels-photo-7567443.jpeg?auto=compress&cs=tinysrgb&w=600',
    nftCollection: 'DeGods',
    priceLamports: 200_000_000_000,
    custodyFeeLamports: 2_000_000_000,
    bpsSold: 3200,
    deadline: Math.floor(Date.now() / 1000) + 86400 * 3,
    status: 'open',
    contributorCount: 8,
  },
  {
    id: '4',
    nftMint: 'okay1...jkl',
    nftName: 'Okay Bear #1234',
    nftImage: 'https://images.pexels.com/photos/8370752/pexels-photo-8370752.jpeg?auto=compress&cs=tinysrgb&w=600',
    nftCollection: 'Okay Bears',
    priceLamports: 80_000_000_000,
    custodyFeeLamports: 800_000_000,
    bpsSold: 0,
    deadline: Math.floor(Date.now() / 1000) - 3600,
    status: 'expired',
    contributorCount: 0,
  },
  {
    id: '5',
    nftMint: 'clnr1...mno',
    nftName: 'Claynosaurz #5678',
    nftImage: 'https://images.pexels.com/photos/8369749/pexels-photo-8369749.jpeg?auto=compress&cs=tinysrgb&w=600',
    nftCollection: 'Claynosaurz',
    priceLamports: 30_000_000_000,
    custodyFeeLamports: 300_000_000,
    bpsSold: 5500,
    deadline: Math.floor(Date.now() / 1000) + 86400,
    status: 'open',
    contributorCount: 12,
  },
  {
    id: '6',
    nftMint: 'tns1...pqr',
    nftName: 'Tensorian #9012',
    nftImage: 'https://images.pexels.com/photos/8369591/pexels-photo-8369591.jpeg?auto=compress&cs=tinysrgb&w=600',
    nftCollection: 'Tensorians',
    priceLamports: 45_000_000_000,
    custodyFeeLamports: 450_000_000,
    bpsSold: 10000,
    deadline: Math.floor(Date.now() / 1000) - 86400 * 5,
    status: 'sold',
    contributorCount: 18,
  },
];

// Grant-ready status filter labels
const statusFilterLabels: Record<string, string> = {
  all: 'All Status',
  open: 'Open',
  custodied: 'Custodied (Program Vault)',
  expired: 'Expired',
  sold: 'Sold',
};

type FilterStatus = 'all' | 'open' | 'custodied' | 'expired' | 'sold';

const Listings: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [sortBy, setSortBy] = useState<'deadline' | 'progress' | 'price'>('deadline');

  const filteredListings = mockListings
    .filter((listing) => {
      if (filterStatus !== 'all' && listing.status !== filterStatus) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          listing.nftName.toLowerCase().includes(query) ||
          listing.nftCollection.toLowerCase().includes(query)
        );
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'deadline':
          return a.deadline - b.deadline;
        case 'progress':
          return b.bpsSold - a.bpsSold;
        case 'price':
          return b.priceLamports - a.priceLamports;
        default:
          return 0;
      }
    });

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
              <h1 className="text-3xl md:text-4xl font-bold mb-2">Browse Listings</h1>
              <p className="text-muted-foreground">
                Discover and invest in fractional NFT ownership opportunities
              </p>
            </motion.div>

            {/* Protocol Info Banner */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="mb-6 p-4 rounded-lg bg-primary/5 border border-primary/10"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-primary" />
                  <div>
                    <span className="font-medium">Non-Custodial Protocol</span>
                    <p className="text-sm text-muted-foreground">
                      NFTs held in program-controlled vaults. No admin access.
                    </p>
                  </div>
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium cursor-help">
                      <span>Protocol Fee: 1%</span>
                      <Info className="w-3.5 h-3.5" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs max-w-48">
                      Fixed 1% custody fee included in Total Raise. Fee is non-refundable upon successful NFT purchase.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </motion.div>

            {/* Filters */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex flex-col md:flex-row gap-4 mb-8"
            >
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by name or collection..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-lg bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                />
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-muted-foreground" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
                  className="px-4 py-3 rounded-lg bg-card border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  {Object.entries(statusFilterLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              {/* Sort */}
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-muted-foreground" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'deadline' | 'progress' | 'price')}
                  className="px-4 py-3 rounded-lg bg-card border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="deadline">Sort by Deadline</option>
                  <option value="progress">Sort by Ownership Progress (bps)</option>
                  <option value="price">Sort by Price</option>
                </select>
              </div>
            </motion.div>

            {/* Results Count */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-6 flex items-center justify-between"
            >
              <span className="text-sm text-muted-foreground">
                {filteredListings.length} listing{filteredListings.length !== 1 ? 's' : ''} found
              </span>
              <span className="text-xs text-muted-foreground">
                Progress = Ownership shares sold (10,000 bps = 100%)
              </span>
            </motion.div>

            {/* Listings Grid */}
            {filteredListings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredListings.map((listing, index) => (
                  <ListingCard key={listing.id} listing={listing} index={index} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <p className="text-muted-foreground mb-4">No listings found matching your criteria</p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setFilterStatus('all');
                  }}
                  className="text-primary hover:underline"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
        </section>
      </Layout>
    </TooltipProvider>
  );
};

export default Listings;
