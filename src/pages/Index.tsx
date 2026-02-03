import Hero from "@/components/Hero";
import Features from "@/components/Features";
import FeatureTabs from "@/components/FeatureTabs";
import Checklist from "@/components/Checklist";
import Analytics from "@/components/Analytics";
import Momentum from "@/components/Momentum";
import Upcoming from "@/components/Upcoming";
import Pricing from "@/components/Pricing";
import CTA from "@/components/CTA";

const Index = () => {
  return (
    <main className="min-h-screen bg-background">
      <Hero />
      <Features />
      <FeatureTabs />
      <Checklist />
      <Analytics />
      <Momentum />
      <Upcoming />
      <Pricing />
      <CTA />
    </main>
  );
};

export default Index;
