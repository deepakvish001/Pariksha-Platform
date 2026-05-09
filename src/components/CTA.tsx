import { ArrowRight, Sparkles, Zap, Users, Trophy, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import ScrollReveal from "./ScrollReveal";

const CTA = () => {
  return (
    <section className="relative py-28 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" />
        <motion.div 
          className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-gradient-to-r from-primary/20 to-orange-500/15 rounded-full blur-[150px]"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-gradient-to-r from-orange-500/15 to-amber-500/20 rounded-full blur-[120px]"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="relative z-10 section-container text-center">
        <ScrollReveal>
          <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-foreground mb-6 leading-[0.9]">
            Your next offer is
            <span className="block bg-gradient-to-r from-primary via-orange-500 to-amber-500 bg-clip-text text-transparent">
              one click away.
            </span>
          </h2>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
            Join <span className="text-foreground font-semibold">10,000+ students</span> already turning practice into placements — and <span className="text-foreground font-semibold">200+ teams</span> hiring with proof, not guesswork.
          </p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            viewport={{ once: true }}
            className="flex flex-wrap justify-center gap-4 mb-10"
          >
            {["Free forever for students", "No credit card", "Setup in 60s"].map((benefit) => (
              <div key={benefit} className="flex items-center gap-2 text-sm text-foreground">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span>{benefit}</span>
              </div>
            ))}
          </motion.div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link 
              to="/signup" 
              className="group relative inline-flex items-center gap-2 px-10 py-5 rounded-full bg-gradient-to-r from-primary to-orange-500 text-primary-foreground font-bold text-lg shadow-2xl shadow-primary/30 hover:shadow-primary/40 transition-all duration-300 hover:scale-105"
            >
              <span>Claim Your Free Account</span>
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              to="/b2b"
              className="inline-flex items-center gap-2 px-8 py-5 rounded-full border-2 border-border bg-card/50 backdrop-blur-sm text-foreground font-semibold hover:bg-card hover:border-primary/50 transition-all duration-300"
            >
              Talk to Sales
            </Link>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
            className="flex flex-wrap justify-center items-center gap-4 sm:gap-6"
          >
            {[
              { icon: Zap, text: "No credit card" },
              { icon: Users, text: "10K+ users" },
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
    </section>
  );
};

export default CTA;
