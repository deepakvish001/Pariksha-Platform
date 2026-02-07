import { ArrowRight, Sparkles, Rocket, Users, Trophy, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import ScrollReveal from "./ScrollReveal";

const CTA = () => {
  return (
    <section className="relative py-32 overflow-hidden">
      {/* Enhanced Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" />
        
        {/* Large animated orbs */}
        <motion.div 
          className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-gradient-to-r from-primary/20 to-orange-500/20 rounded-full blur-[150px]"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-gradient-to-r from-orange-500/20 to-amber-500/20 rounded-full blur-[120px]"
          animate={{ 
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        
        {/* Grid overlay */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
            backgroundSize: '80px 80px'
          }}
        />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {[...Array(10)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1.5 h-1.5 bg-primary/40 rounded-full"
            style={{
              left: `${10 + i * 9}%`,
              top: `${15 + (i % 4) * 20}%`,
            }}
            animate={{
              y: [-25, 25, -25],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: 5 + i * 0.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.4,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 section-container text-center">
        <ScrollReveal>
          {/* Badge */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-primary/30 bg-primary/10 backdrop-blur-sm mb-8"
          >
            <Rocket className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Join 10,000+ students crushing their goals</span>
          </motion.div>

          <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-foreground mb-6 leading-[0.95]">
            Ready to Land Your
            <span className="block bg-gradient-to-r from-primary via-orange-500 to-amber-500 bg-clip-text text-transparent">
              Dream Job?
            </span>
          </h2>
          
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Stop juggling between tabs. Start your placement prep journey with 
            <span className="text-foreground font-semibold"> everything in one place</span>.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link 
              to="/signup" 
              className="group relative inline-flex items-center gap-2 px-10 py-5 rounded-full bg-gradient-to-r from-primary to-orange-500 text-white font-bold text-lg shadow-2xl shadow-primary/30 hover:shadow-3xl hover:shadow-primary/40 transition-all duration-300 hover:scale-105"
            >
              <span>Start Free Today</span>
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary to-orange-500 blur-xl opacity-50 group-hover:opacity-70 transition-opacity -z-10" />
            </Link>
            <button className="inline-flex items-center gap-2 px-8 py-5 rounded-full border-2 border-border bg-card/50 backdrop-blur-sm text-foreground font-semibold hover:bg-card hover:border-primary/50 transition-all duration-300">
              <Sparkles className="w-5 h-5 text-primary" />
              Explore Features
            </button>
          </div>

          {/* Trust indicators */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
            className="flex flex-wrap justify-center items-center gap-6"
          >
            {[
              { icon: Zap, text: "Free forever plan" },
              { icon: Users, text: "10K+ active users" },
              { icon: Trophy, text: "95% success rate" },
            ].map((item, index) => (
              <div key={index} className="flex items-center gap-2 px-4 py-2 rounded-full bg-card/30 border border-border/30 backdrop-blur-sm">
                <item.icon className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">{item.text}</span>
              </div>
            ))}
          </motion.div>
        </ScrollReveal>
      </div>

      {/* Gradient fades */}
      <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-background to-transparent z-10" />
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-background to-transparent z-10" />
    </section>
  );
};

export default CTA;
