import { lazy, Suspense } from "react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import { DelayedLoginPrompt } from "@/components/DelayedLoginPrompt";

const CompanyLogos = lazy(() => import("@/components/CompanyLogos"));
const Features = lazy(() => import("@/components/Features"));
const Testimonials = lazy(() => import("@/components/Testimonials"));
const FAQ = lazy(() => import("@/components/FAQ"));
const CTA = lazy(() => import("@/components/CTA"));
const Footer = lazy(() => import("@/components/Footer"));

const LazySection = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<div className="min-h-[200px]" />}>{children}</Suspense>
);

const Index = () => {
  return (
    <main className="min-h-screen bg-background">
      <DelayedLoginPrompt />
      <Navbar />
      <Hero />
      <LazySection><CompanyLogos /></LazySection>
      <LazySection>
        <section id="features">
          <Features />
        </section>
      </LazySection>
      <LazySection><Testimonials /></LazySection>
      <LazySection><section id="faq"><FAQ /></section></LazySection>
      <LazySection><CTA /></LazySection>
      <LazySection><Footer /></LazySection>
    </main>
  );
};

export default Index;
