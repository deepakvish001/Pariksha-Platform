import { lazy, Suspense } from "react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import { DelayedLoginPrompt } from "@/components/DelayedLoginPrompt";

const CompanyLogos = lazy(() => import("@/components/CompanyLogos"));
const ValueProps = lazy(() => import("@/components/ValueProps"));
const ProductShowcase = lazy(() => import("@/components/ProductShowcase"));
const Outcomes = lazy(() => import("@/components/Outcomes"));
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
      <LazySection><ValueProps /></LazySection>
      <LazySection><ProductShowcase /></LazySection>
      <LazySection><Outcomes /></LazySection>
      <LazySection><Testimonials /></LazySection>
      <LazySection><section id="faq"><FAQ /></section></LazySection>
      <LazySection><CTA /></LazySection>
      <LazySection><Footer /></LazySection>
    </main>
  );
};

export default Index;


