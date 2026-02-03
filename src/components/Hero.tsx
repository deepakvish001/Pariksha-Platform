import heroBg from "@/assets/hero-bg.jpg";
import { ArrowRight } from "lucide-react";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(${heroBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center bottom',
        }}
      >
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/40" />
      </div>

      {/* Content */}
      <div className="relative z-10 section-container text-center pt-20 pb-32">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border bg-secondary/50 mb-8 animate-fade-in">
          <span className="text-sm text-muted-foreground">✨ Trusted by 10,000+ students</span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <span className="gradient-text">Turn Learning Chaos</span>
          <br />
          <span className="text-foreground">Into Career Progress</span>
        </h1>

        {/* Subheadline */}
        <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          Replace scattered notes, random Sheets, UI frustrations, "I'll set it later" 
          reminders. This is focused learning time, structured for students — built for 
          clarity and career progress.
        </p>

        {/* CTA Button */}
        <div className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <button className="btn-primary inline-flex items-center gap-2 text-lg">
            Start Learning Clearly
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default Hero;
