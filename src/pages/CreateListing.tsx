import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { 
  Link2, 
  Search, 
  Info, 
  AlertCircle, 
  Loader2, 
  Check, 
  ArrowRight, 
  Shield, 
  Clock, 
  Users, 
  Wallet,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '@/components/layout/Layout';

interface NFTMetadata {
  mint: string;
  name: string;
  image: string;
  collection: string;
  price: number;
  seller: string;
}

// Step-by-step explanation flow
const flowSteps = [
  {
    icon: Link2,
    title: 'Paste NFT Link',
    description: 'Provide a Magic Eden or Tensor marketplace link for the NFT you want to fractionalize.',
  },
  {
    icon: Search,
    title: 'Resolve Metadata',
    description: 'Protocol automatically resolves the NFT price and metadata from on-chain data.',
  },
  {
    icon: Clock,
    title: '72-Hour Fundraise',
    description: 'A fixed 72-hour fundraising period begins. Users can purchase ownership shares (bps).',
  },
  {
    icon: Users,
    title: 'Collective Ownership',
    description: 'Contributors purchase shares in basis points (10,000 bps = 100% ownership).',
  },
  {
    icon: Shield,
    title: 'Non-Custodial Vault',
    description: 'If 100% is reached, NFT is purchased and held in a program-controlled vault. No admin access.',
  },
];

const CreateListing: React.FC = () => {
  const { connected } = useWallet();
  const [hasAcknowledgedFlow, setHasAcknowledgedFlow] = useState(false);
  const [marketplaceUrl, setMarketplaceUrl] = useState('');
  const [isResolving, setIsResolving] = useState(false);
  const [nftData, setNftData] = useState<NFTMetadata | null>(null);
  const [deadline] = useState(72); // Fixed 72-hour deadline
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasConfirmedFees, setHasConfirmedFees] = useState(false);

  const custodyFeeBps = 100; // 1%
  const custodyFee = nftData ? nftData.price * (custodyFeeBps / 10000) : 0;
  const totalRaise = nftData ? nftData.price + custodyFee : 0;

  const handleResolveUrl = async () => {
    if (!marketplaceUrl) return;
    
    setIsResolving(true);
    setError(null);
    setNftData(null);
    setHasConfirmedFees(false);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      if (marketplaceUrl.includes('magiceden') || marketplaceUrl.includes('tensor')) {
        setNftData({
          mint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
          name: 'MadLad #4521',
          image: 'https://images.pexels.com/photos/8369524/pexels-photo-8369524.jpeg?auto=compress&cs=tinysrgb&w=600',
          collection: 'MadLads',
          price: 100,
          seller: '7nYB...3kPw',
        });
      } else {
        throw new Error('Invalid marketplace URL. Please use Magic Eden or Tensor links.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resolve NFT');
    } finally {
      setIsResolving(false);
    }
  };

  const handleCreateListing = async () => {
    if (!nftData || !connected || !hasConfirmedFees) return;

    setIsCreating(true);
    setError(null);

    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      alert('Listing created successfully! (Demo)');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create listing');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Layout>
      <section className="py-12">
        <div className="container mx-auto px-4 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Create Fractional Listing</h1>
            <p className="text-muted-foreground mb-8">
              Enable collective ownership of a high-value NFT through transparent, non-custodial fractionalization.
            </p>
          </motion.div>

          {/* Pre-Wallet Explanation Flow */}
          {!hasAcknowledgedFlow && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-6"
            >
              <div className="rounded-xl bg-card border border-border/50 p-6">
                <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                  <Info className="w-5 h-5 text-primary" />
                  How Fractional Listings Work
                </h2>

                <div className="space-y-4 mb-6">
                  {flowSteps.map((step, index) => (
                    <motion.div
                      key={step.title}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + index * 0.1 }}
                      className="flex gap-4"
                    >
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <step.icon className="w-5 h-5 text-primary" />
                        </div>
                      </div>
                      <div className="flex-1 pb-4 border-b border-border/50 last:border-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono text-primary">{String(index + 1).padStart(2, '0')}</span>
                          <h3 className="font-semibold">{step.title}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">{step.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Fee Disclosure */}
                <div className="rounded-lg bg-primary/5 border border-primary/10 p-4 mb-6">
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-primary" />
                    Protocol Fee Structure
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-success" />
                      Fixed 1% custody fee (charged only on successful purchase)
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-success" />
                      Fee is proportionally split among all contributors
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-success" />
                      Fee does NOT affect ownership percentages (bps)
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-success" />
                      Full contribution refund (principal + fee) if funding goal is not met
                    </li>
                  </ul>
                </div>

                {/* Non-Custodial Guarantee */}
                <div className="rounded-lg bg-success/5 border border-success/20 p-4 mb-6">
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2 text-success">
                    <Shield className="w-4 h-4" />
                    Non-Custodial Guarantee
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    NFTs are held in program-controlled PDAs (Program Derived Addresses). 
                    Neither FracVault admins nor the frontend can withdraw or transfer assets. 
                    All custody is enforced by immutable Solana smart contracts.
                  </p>
                </div>

                <button
                  onClick={() => setHasAcknowledgedFlow(true)}
                  className="w-full py-4 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all duration-300 glow-primary hover:glow-primary-intense flex items-center justify-center gap-2"
                >
                  I Understand, Continue
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* Wallet Connection (after flow acknowledgment) */}
          <AnimatePresence>
            {hasAcknowledgedFlow && !connected && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center py-16 rounded-xl bg-card border border-border/50"
              >
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Wallet className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Connect Your Wallet</h3>
                <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                  Connect your Solana wallet to create a fractional listing. You must own the NFT to list it.
                </p>
                <WalletMultiButton />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Listing Creation Flow */}
          <AnimatePresence>
            {hasAcknowledgedFlow && connected && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Step 1: Enter URL */}
                <div className="rounded-xl bg-card border border-border/50 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-semibold text-primary">1</span>
                    </div>
                    <h3 className="font-semibold">Enter Marketplace Link</h3>
                  </div>

                  <div className="relative mb-4">
                    <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="url"
                      placeholder="Paste Magic Eden or Tensor link..."
                      value={marketplaceUrl}
                      onChange={(e) => setMarketplaceUrl(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>

                  <button
                    onClick={handleResolveUrl}
                    disabled={!marketplaceUrl || isResolving}
                    className="w-full py-3 rounded-lg bg-secondary hover:bg-muted border border-border font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isResolving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Resolving On-Chain Metadata...
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4" />
                        Resolve NFT
                      </>
                    )}
                  </button>
                </div>

                {/* Error */}
                {error && (
                  <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}

                {/* Step 2: NFT Preview with Fee Transparency */}
                {nftData && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl bg-card border border-border/50 p-6"
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center">
                        <Check className="w-4 h-4 text-success" />
                      </div>
                      <h3 className="font-semibold">NFT Resolved Successfully</h3>
                    </div>

                    <div className="flex gap-4 mb-6">
                      <img
                        src={nftData.image}
                        alt={nftData.name}
                        className="w-24 h-24 rounded-lg object-cover"
                      />
                      <div>
                        <span className="text-xs text-muted-foreground">{nftData.collection}</span>
                        <h4 className="font-semibold text-lg">{nftData.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Seller: <span className="font-mono">{nftData.seller}</span>
                        </p>
                      </div>
                    </div>

                    {/* Explicit Fee Breakdown */}
                    <div className="rounded-lg bg-secondary/50 border border-border/50 overflow-hidden mb-4">
                      <div className="p-4 space-y-3">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">NFT Price</span>
                          <span className="font-semibold font-mono">{nftData.price.toFixed(2)} SOL</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground flex items-center gap-1">
                            Protocol Custody Fee (1%)
                            <Info className="w-3.5 h-3.5" />
                          </span>
                          <span className="font-semibold font-mono">{custodyFee.toFixed(2)} SOL</span>
                        </div>
                      </div>
                      <div className="bg-primary/5 border-t border-primary/10 p-4">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold">Total Amount to be Raised</span>
                          <span className="font-bold text-xl text-primary font-mono">{totalRaise.toFixed(2)} SOL</span>
                        </div>
                      </div>
                    </div>

                    {/* Fee Warning */}
                    <div className="rounded-lg bg-warning/5 border border-warning/20 p-4">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
                        <div className="text-xs text-warning/90">
                          <p className="font-medium mb-1">Fee Disclosure:</p>
                          <ul className="list-disc list-inside space-y-0.5 text-warning/80">
                            <li>The 1% protocol fee is non-refundable if the NFT purchase succeeds</li>
                            <li>Contributors pay proportional shares of both principal and fee</li>
                            <li>If funding goal is not met, your full contribution (principal + fee) is refunded (minus network fees)</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Step 3: Funding Period Info */}
                {nftData && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl bg-card border border-border/50 p-6"
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-semibold text-primary">2</span>
                      </div>
                      <h3 className="font-semibold">Funding Period</h3>
                    </div>

                    <div className="flex items-center justify-center gap-4 p-4 rounded-lg bg-secondary/50 mb-4">
                      <Clock className="w-8 h-8 text-primary" />
                      <div>
                        <span className="text-2xl font-bold">{deadline} Hours</span>
                        <p className="text-sm text-muted-foreground">Fixed fundraising window</p>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground">
                      Contributors have {deadline} hours to purchase ownership shares. If 10,000 bps (100%) 
                      is reached, the NFT will be purchased and transferred to the non-custodial program vault.
                    </p>
                  </motion.div>
                )}

                {/* Step 4: Confirmation */}
                {nftData && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl bg-card border border-border/50 p-6"
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-semibold text-primary">3</span>
                      </div>
                      <h3 className="font-semibold">Confirm & Create Listing</h3>
                    </div>

                    <div className="rounded-lg bg-success/5 border border-success/20 p-4 mb-4">
                      <div className="flex items-start gap-2">
                        <Shield className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                        <div className="text-xs text-success/90">
                          <p className="font-medium mb-1">Non-Custodial Guarantee:</p>
                          <p className="text-success/80">
                            Creating a listing requires you to own the NFT. The NFT remains in your wallet 
                            until 100% funding is reached. Upon success, it is transferred to a program-controlled 
                            vault with no admin withdrawal authority.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Confirmation Checkbox */}
                    <label className="flex items-start gap-3 mb-4 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={hasConfirmedFees}
                        onChange={(e) => setHasConfirmedFees(e.target.checked)}
                        className="mt-1 w-4 h-4 rounded border-border bg-secondary text-primary focus:ring-primary/50"
                      />
                      <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                        I confirm that I own this NFT, understand the 1% protocol fee structure, and acknowledge 
                        that the fee is non-refundable upon successful NFT purchase.
                      </span>
                    </label>

                    <button
                      onClick={handleCreateListing}
                      disabled={isCreating || !hasConfirmedFees}
                      className="w-full py-4 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 glow-primary hover:glow-primary-intense flex items-center justify-center gap-2"
                    >
                      {isCreating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Creating Listing...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Create Fractional Listing
                        </>
                      )}
                    </button>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
    </Layout>
  );
};

export default CreateListing;
