import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import FeatureTabs from "@/components/FeatureTabs";
import Checklist from "@/components/Checklist";
import Analytics from "@/components/Analytics";
import Momentum from "@/components/Momentum";
import Upcoming from "@/components/Upcoming";
import Testimonials from "@/components/Testimonials";
import Pricing from "@/components/Pricing";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <section id="features">
        <Features />
      </section>
      <FeatureTabs />
      <Checklist />
      <section id="analytics">
        <Analytics />
      </section>
      <Momentum />
      <Upcoming />
      <Testimonials />
      <section id="pricing">
        <Pricing />
      </section>
      <CTA />
      <Footer />
    </main>
  );
};

export default Index;
