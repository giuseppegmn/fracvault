import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Shield, Users, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

const Hero: React.FC = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-grid opacity-30" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span className="text-sm font-medium text-primary">Live on Solana Devnet</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight"
          >
            Fractional Ownership
            <br />
            <span className="text-gradient">of Premium NFTs</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto"
          >
            Pool resources with others to own high-value NFTs. Fully non-custodial, 
            transparent on-chain governance, and proportional reward distribution.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
          >
            <Link
              to="/listings"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all duration-300 glow-primary hover:glow-primary-intense"
            >
              Explore Listings
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/create"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-lg bg-secondary text-secondary-foreground font-semibold hover:bg-secondary/80 border border-border transition-all duration-300"
            >
              Create Listing
            </Link>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto"
          >
            <div className="flex items-center justify-center gap-3 px-4 py-3 rounded-lg bg-card/50 border border-border/50">
              <Shield className="w-5 h-5 text-primary" />
              <span className="text-sm text-muted-foreground">Non-Custodial</span>
            </div>
            <div className="flex items-center justify-center gap-3 px-4 py-3 rounded-lg bg-card/50 border border-border/50">
              <Users className="w-5 h-5 text-primary" />
              <span className="text-sm text-muted-foreground">On-Chain Governance</span>
            </div>
            <div className="flex items-center justify-center gap-3 px-4 py-3 rounded-lg bg-card/50 border border-border/50">
              <Zap className="w-5 h-5 text-primary" />
              <span className="text-sm text-muted-foreground">1% Fixed Fee</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
