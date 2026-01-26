import React from 'react';
import { 
  Shield, 
  Vote, 
  Gift, 
  Lock, 
  RefreshCcw, 
  TrendingUp 
} from 'lucide-react';
import { motion } from 'framer-motion';

const features = [
  {
    icon: Shield,
    title: 'Non-Custodial Vaults',
    description: 'NFTs are held in program-controlled PDAs. No admin keys can ever access your assets.',
  },
  {
    icon: Vote,
    title: 'On-Chain Governance',
    description: 'Voting power proportional to ownership. Propose and vote on sales with full transparency.',
  },
  {
    icon: Gift,
    title: 'Proportional Rewards',
    description: 'Airdrops, staking rewards, and any benefits are distributed based on your share.',
  },
  {
    icon: Lock,
    title: 'Atomic Transactions',
    description: 'All-or-nothing execution prevents partial failures and race conditions.',
  },
  {
    icon: RefreshCcw,
    title: 'Automatic Refunds',
    description: 'If funding goal is not met by deadline, all contributions are automatically refundable.',
  },
  {
    icon: TrendingUp,
    title: 'Basis Points Ownership',
    description: 'Precise ownership tracking with 10,000 bps = 100%. No hidden fees or dilution.',
  },
];

const Features: React.FC = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-card/30 to-background" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <span className="text-sm font-medium text-primary mb-2 block">Features</span>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Built for Security & Trust
          </h2>
          <p className="text-muted-foreground">
            Every aspect of FracVault is designed to maximize security, transparency, 
            and user control over their assets.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group p-6 rounded-xl bg-card border border-border/50 card-hover"
            >
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
