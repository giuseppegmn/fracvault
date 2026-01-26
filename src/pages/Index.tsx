import React from 'react';
import Layout from '@/components/layout/Layout';
import Hero from '@/components/home/Hero';
import Features from '@/components/home/Features';
import HowItWorks from '@/components/home/HowItWorks';
import Stats from '@/components/home/Stats';

const Index: React.FC = () => {
  return (
    <Layout>
      <Hero />
      <Stats />
      <Features />
      <HowItWorks />
    </Layout>
  );
};

export default Index;
