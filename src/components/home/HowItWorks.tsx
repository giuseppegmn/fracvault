import React from 'react';
import { Link2, Users, Wallet, Vote, Gift } from 'lucide-react';
import { motion } from 'framer-motion';

const steps = [
  {
    number: '01',
    icon: Link2,
    title: 'Create Listing',
    description: 'Paste a Magic Eden link. The system resolves the NFT metadata and sets a 72-hour funding window.',
  },
  {
    number: '02',
    icon: Users,
    title: 'Contribute',
    description: 'Purchase shares in basis points (bps). 100 bps = 1% ownership. Pay principal + 1% custody fee.',
  },
  {
    number: '03',
    icon: Wallet,
    title: 'NFT Acquired',
    description: 'When 10,000 bps (100%) is sold, the NFT is purchased and transferred to the non-custodial vault.',
  },
  {
    number: '04',
    icon: Vote,
    title: 'Governance',
    description: 'Propose sales, vote on decisions. >50% approval executes automatically. Delegate voting power optionally.',
  },
  {
    number: '05',
    icon: Gift,
    title: 'Claim Rewards',
    description: 'Airdrops and rewards received by the vault are distributed proportionally. Claim anytime.',
  },
];

const HowItWorks: React.FC = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-dots opacity-30" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <span className="text-sm font-medium text-primary mb-2 block">How It Works</span>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Simple, Transparent Process
          </h2>
          <p className="text-muted-foreground">
            From listing creation to reward distribution, every step is fully on-chain and verifiable.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="max-w-4xl mx-auto">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative flex gap-6 pb-12 last:pb-0"
            >
              {/* Timeline */}
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 rounded-xl bg-card border border-border flex items-center justify-center relative z-10">
                  <step.icon className="w-6 h-6 text-primary" />
                </div>
                {index < steps.length - 1 && (
                  <div className="flex-1 w-px bg-gradient-to-b from-primary/50 to-transparent mt-4" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 pb-8">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xs font-mono text-primary">{step.number}</span>
                  <h3 className="text-xl font-semibold">{step.title}</h3>
                </div>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
