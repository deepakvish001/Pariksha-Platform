import { ArrowRight } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";

const CTA = () => {
  return (
    <section className="relative py-24 overflow-hidden">
      {/* Background */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(${heroBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/40" />
      </div>

      {/* Content */}
      <div className="relative z-10 section-container text-center">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-6">
          Track your college life like it<br />
          <span className="gradient-text">actually matters</span>
        </h2>
        
        <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10">
          Join thousands of students who've transformed chaos into clarity, 
          stress into structure, and learning into real career progress.
        </p>

        <button className="btn-primary inline-flex items-center gap-2 text-lg">
          Start Now
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </section>
  );
};

export default CTA;
