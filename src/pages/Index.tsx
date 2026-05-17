import { lazy, Suspense, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import { DelayedLoginPrompt } from "@/components/DelayedLoginPrompt";
import { captureUtm, trackLeadEvent } from "@/lib/leadTracking";

const CompanyLogos = lazy(() => import("@/components/CompanyLogos"));
const ValueProps = lazy(() => import("@/components/ValueProps"));
const ProductShowcase = lazy(() => import("@/components/ProductShowcase"));
const Outcomes = lazy(() => import("@/components/Outcomes"));
const ManualVsParikshaa = lazy(() => import("@/components/ManualVsParikshaa"));
const Testimonials = lazy(() => import("@/components/Testimonials"));
const CaseStudies = lazy(() => import("@/components/CaseStudies"));
const RoiCalculator = lazy(() => import("@/components/RoiCalculator"));
const DemoRequestForm = lazy(() => import("@/components/DemoRequestForm"));
const FAQ = lazy(() => import("@/components/FAQ"));
const CTA = lazy(() => import("@/components/CTA"));
const Footer = lazy(() => import("@/components/Footer"));
const StickyDemoCTA = lazy(() => import("@/components/StickyDemoCTA"));

const LazySection = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={null}>{children}</Suspense>
);

const Index = () => {
  useEffect(() => {
    const utm = captureUtm();
    void trackLeadEvent("landing_page_view", { utm });
  }, []);
  return (
    <main className="min-h-screen bg-background">
      <DelayedLoginPrompt />
      <Navbar />
      {/* 1. HOOK — promise + primary CTA */}
      <Hero />
      {/* 2. TRUST — logos band */}
      <LazySection><CompanyLogos /></LazySection>
      {/* 3. PROBLEM — agitate the pain of manual workflows */}
      <LazySection><ManualVsParikshaa /></LazySection>
      {/* 4. SOLUTION — show the product in action */}
      <LazySection><ProductShowcase /></LazySection>
      {/* 5. BENEFITS — distilled value props */}
      <LazySection><ValueProps /></LazySection>
      {/* 6. OUTCOMES — quantified ROI */}
      <LazySection><Outcomes /></LazySection>
      {/* 7. DEEP PROOF — case studies with metrics */}
      <LazySection><CaseStudies /></LazySection>
      {/* 8. SOCIAL PROOF — testimonials */}
      <LazySection><Testimonials /></LazySection>
      {/* 9. SELF-SERVE ROI — interactive calculator */}
      <LazySection><RoiCalculator /></LazySection>
      {/* 10. OBJECTIONS — FAQ */}
      <LazySection><section id="faq"><FAQ /></section></LazySection>
      {/* 11. CONVERT — tailored demo form */}
      <LazySection><DemoRequestForm /></LazySection>
      {/* 12. LAST PUSH — final CTA */}
      <LazySection><CTA /></LazySection>
      <LazySection><Footer /></LazySection>
      <LazySection><StickyDemoCTA /></LazySection>
    </main>
  );
};

export default Index;


