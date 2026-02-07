import { ArrowRight, Sparkles, Rocket, Users, Trophy, Zap, CheckCircle } from "lucide-react";
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
          className="absolute top-1/4 left-1/4 w-[700px] h-[700px] bg-gradient-to-r from-primary/25 to-orange-500/20 rounded-full blur-[180px]"
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.5, 0.3],
            x: [0, 30, 0],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-gradient-to-r from-orange-500/20 to-amber-500/25 rounded-full blur-[150px]"
          animate={{ 
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2],
            y: [0, -30, 0],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
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
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-primary/40 rounded-full"
            style={{
              left: `${8 + i * 7}%`,
              top: `${12 + (i % 4) * 22}%`,
            }}
            animate={{
              y: [-30, 30, -30],
              opacity: [0.2, 0.6, 0.2],
              scale: [1, 1.5, 1],
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

          <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black text-foreground mb-6 leading-[0.9]">
            Ready to Land Your
            <span className="block bg-gradient-to-r from-primary via-orange-500 to-amber-500 bg-clip-text text-transparent">
              Dream Job?
            </span>
          </h2>
          
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
            Stop juggling between tabs. Start your placement prep journey with 
            <span className="text-foreground font-semibold"> everything in one place</span>.
          </p>

          {/* Quick benefits */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            viewport={{ once: true }}
            className="flex flex-wrap justify-center gap-4 mb-10"
          >
            {[
              "500+ DSA Problems",
              "AI-Powered Learning",
              "Track Your Progress",
            ].map((benefit) => (
              <div key={benefit} className="flex items-center gap-2 text-sm text-foreground">
                <CheckCircle className="w-4 h-4 text-primary" />
                <span>{benefit}</span>
              </div>
            ))}
          </motion.div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link 
              to="/signup" 
              className="group relative inline-flex items-center gap-2 px-10 py-5 rounded-full bg-gradient-to-r from-primary to-orange-500 text-white font-bold text-lg shadow-2xl shadow-primary/30 hover:shadow-3xl hover:shadow-primary/40 transition-all duration-300 hover:scale-105"
            >
              <span>Start Free Today</span>
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              <motion.div 
                className="absolute inset-0 rounded-full bg-gradient-to-r from-primary to-orange-500 blur-xl opacity-50 -z-10"
                animate={{ opacity: [0.4, 0.7, 0.4], scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </Link>
            <Link 
              to="/#features"
              className="inline-flex items-center gap-2 px-8 py-5 rounded-full border-2 border-border bg-card/50 backdrop-blur-sm text-foreground font-semibold hover:bg-card hover:border-primary/50 transition-all duration-300"
            >
              <Sparkles className="w-5 h-5 text-primary" />
              Explore Features
            </Link>
          </div>

          {/* Trust indicators */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
            className="flex flex-wrap justify-center items-center gap-4 sm:gap-6"
          >
            {[
              { icon: Zap, text: "Free forever plan" },
              { icon: Users, text: "10K+ active users" },
              { icon: Trophy, text: "95% success rate" },
            ].map((item, index) => (
              <motion.div 
                key={index} 
                className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-card/40 border border-border/40 backdrop-blur-sm"
                whileHover={{ scale: 1.05 }}
              >
                <item.icon className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">{item.text}</span>
              </motion.div>
            ))}
          </motion.div>
        </ScrollReveal>
      </div>

      {/* Gradient fades */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-background to-transparent z-10" />
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent z-10" />
    </section>
  );
};

export default CTA;
