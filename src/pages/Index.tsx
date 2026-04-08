import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import CompanyLogos from "@/components/CompanyLogos";
import Features from "@/components/Features";
import FeatureTabs from "@/components/FeatureTabs";
import HowItWorks from "@/components/HowItWorks";
import WhyChooseUs from "@/components/WhyChooseUs";
import Testimonials from "@/components/Testimonials";
import Pricing from "@/components/Pricing";
import FAQ from "@/components/FAQ";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";
import { DelayedLoginPrompt } from "@/components/DelayedLoginPrompt";

const Index = () => {
  return (
    <main className="min-h-screen bg-background">
      <DelayedLoginPrompt />
      <Navbar />
      <Hero />
      <CompanyLogos />
      <section id="features">
        <Features />
      </section>
      <FeatureTabs />
      <HowItWorks />
      <WhyChooseUs />
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
