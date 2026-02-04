import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import CompanyLogos from "@/components/CompanyLogos";
import Features from "@/components/Features";
import FeatureTabs from "@/components/FeatureTabs";
import Checklist from "@/components/Checklist";
import Analytics from "@/components/Analytics";
import Momentum from "@/components/Momentum";
import WhyChooseUs from "@/components/WhyChooseUs";
import Upcoming from "@/components/Upcoming";
import Testimonials from "@/components/Testimonials";
import Pricing from "@/components/Pricing";
import FAQ from "@/components/FAQ";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <CompanyLogos />
      <section id="features">
        <Features />
      </section>
      <FeatureTabs />
      <Checklist />
      <section id="analytics">
        <Analytics />
      </section>
      <Momentum />
      <WhyChooseUs />
      <Upcoming />
      <Testimonials />
      <section id="pricing">
        <Pricing />
      </section>
      <FAQ />
      <CTA />
      <Footer />
    </main>
  );
};

export default Index;
