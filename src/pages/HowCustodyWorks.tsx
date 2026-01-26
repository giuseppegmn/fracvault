import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Lock, Users, ArrowRight, Check, AlertCircle, ExternalLink, Layers } from 'lucide-react';
import { motion } from 'framer-motion';
import Layout from '@/components/layout/Layout';

const trustGuarantees = [
  {
    title: 'Program-Controlled Vaults',
    description: 'NFTs are held in Program Derived Addresses (PDAs) controlled exclusively by immutable smart contract logic.',
    icon: Lock,
  },
  {
    title: 'No Admin Keys',
    description: 'There are no privileged admin keys that can withdraw, transfer, or modify custodied assets.',
    icon: Shield,
  },
  {
    title: 'Governance-Only Actions',
    description: 'The only way to move a custodied NFT is through on-chain governance vote by fractional owners.',
    icon: Users,
  },
];

const technicalDetails = [
  {
    label: 'Vault Type',
    value: 'Program Derived Address (PDA)',
  },
  {
    label: 'Authority',
    value: 'Solana Program (No external signers)',
  },
  {
    label: 'Withdrawal Mechanism',
    value: 'Governance vote only (>50% bps approval)',
  },
  {
    label: 'Admin Access',
    value: 'None - No privileged keys exist',
  },
  {
    label: 'Emergency Pause',
    value: 'Blocks new listings only, never blocks refunds',
  },
  {
    label: 'Smart Contract',
    value: 'Anchor-based, open source',
  },
];

const HowCustodyWorks: React.FC = () => {
  return (
    <Layout>
      <section className="py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <Shield className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Non-Custodial Protocol</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">How Custody Works</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              FracVault is designed with security and trust minimization as core principles. 
              Understand how your assets are protected through program-controlled custody.
            </p>
          </motion.div>

          {/* Architecture Diagram */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-xl bg-card border border-border/50 p-6 mb-8"
          >
            <h2 className="text-lg font-semibold mb-6 text-center">Custody Architecture</h2>
            
            {/* Simple ASCII-style diagram */}
            <div className="bg-secondary/30 rounded-lg p-6 font-mono text-sm overflow-x-auto">
              <pre className="text-center text-muted-foreground">
{`
┌─────────────────────────────────────────────────────────────────┐
│                        USER WALLETS                              │
│    (Contributors / Fractional Owners)                            │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           │ Contribute SOL
                           │ Vote on Proposals
                           │ Claim Rewards
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FRACVAULT PROGRAM                             │
│              (Anchor Smart Contract on Solana)                   │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Listing    │  │ Contribution │  │   Proposal   │          │
│  │   Account    │  │   Account    │  │   Account    │          │
│  │    (PDA)     │  │    (PDA)     │  │    (PDA)     │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    NFT VAULT (PDA)                       │    │
│  │                                                          │    │
│  │  • Program-controlled - NO admin keys                    │    │
│  │  • NFT stored after successful funding                   │    │
│  │  • Only movable via governance vote                      │    │
│  │  • Immutable custody rules                               │    │
│  │                                                          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                           │
                           │ Governance Vote Required
                           │ (>50% bps approval)
                           ▼
┌─────────────────────────────────────────────────────────��───────┐
│                     NFT SOLD TO BUYER                            │
│              (Proceeds distributed to owners)                    │
└─────────────────────────────────────────────────────────────────┘

                    ┌─────────────────────┐
                    │   KEY POINT:        │
                    │                     │
                    │   NO ADMIN ACCESS   │
                    │   NO FRONTEND       │
                    │   WITHDRAWAL        │
                    │   CAPABILITY        │
                    │                     │
                    └─────────────────────┘
`}
              </pre>
            </div>
          </motion.div>

          {/* Trust Guarantees */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
          >
            {trustGuarantees.map((item, index) => (
              <div key={item.title} className="rounded-xl bg-card border border-border/50 p-6">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <item.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </motion.div>

          {/* What Admins CANNOT Do */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-xl bg-destructive/5 border border-destructive/20 p-6 mb-8"
          >
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-destructive" />
              What FracVault Admins CANNOT Do
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                'Withdraw NFTs from vaults',
                'Access or transfer user funds',
                'Modify listing rules after creation',
                'Override governance decisions',
                'Block refunds for expired listings',
                'Change the 1% fee structure',
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm">
                  <div className="w-5 h-5 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-destructive text-xs">✕</span>
                  </div>
                  <span className="text-muted-foreground">{item}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* What the Protocol DOES Guarantee */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="rounded-xl bg-success/5 border border-success/20 p-6 mb-8"
          >
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Check className="w-5 h-5 text-success" />
              What the Protocol Guarantees
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                'NFTs held in program-controlled PDAs',
                'Automatic refunds if funding fails',
                'Proportional reward distribution',
                'On-chain governance with transparent voting',
                'Immutable fee structure (1%)',
                'Full audit trail on Solana blockchain',
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm">
                  <div className="w-5 h-5 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-success" />
                  </div>
                  <span className="text-muted-foreground">{item}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Technical Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-xl bg-card border border-border/50 p-6 mb-8"
          >
            <h2 className="text-lg font-semibold mb-4">Technical Details</h2>
            <div className="space-y-3">
              {technicalDetails.map((detail) => (
                <div key={detail.label} className="flex justify-between py-2 border-b border-border/50 last:border-0">
                  <span className="text-muted-foreground">{detail.label}</span>
                  <span className="font-medium text-right">{detail.value}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Verify Yourself */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="rounded-xl bg-primary/5 border border-primary/20 p-6 mb-8"
          >
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary" />
              Verify It Yourself
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              FracVault is built on open-source smart contracts. You can verify our non-custodial 
              guarantees by reviewing the source code and inspecting on-chain accounts.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="#"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary hover:bg-muted border border-border text-sm font-medium transition-colors"
              >
                <Github className="w-4 h-4" />
                View Source Code
                <ExternalLink className="w-3 h-3" />
              </a>
              <a
                href="#"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary hover:bg-muted border border-border text-sm font-medium transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Solscan Explorer
              </a>
              <a
                href="#"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary hover:bg-muted border border-border text-sm font-medium transition-colors"
              >
                <Shield className="w-4 h-4" />
                Security Audit
              </a>
            </div>
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-center"
          >
            <Link
              to="/listings"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all duration-300 glow-primary hover:glow-primary-intense"
            >
              Explore Listings
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

// Github icon component (not in lucide)
const Github: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
  </svg>
);

export default HowCustodyWorks;
