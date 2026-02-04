import { motion } from "framer-motion";
import ScrollReveal from "./ScrollReveal";

const companies = [
  { name: "Google", style: "font-bold text-xl tracking-tight" },
  { name: "Microsoft", style: "font-semibold text-lg" },
  { name: "Amazon", style: "font-bold text-xl italic" },
  { name: "Meta", style: "font-bold text-xl tracking-wide" },
  { name: "Apple", style: "font-light text-xl tracking-tight" },
  { name: "Netflix", style: "font-bold text-lg tracking-wider uppercase" },
  { name: "Stripe", style: "font-bold text-xl" },
  { name: "Uber", style: "font-medium text-xl tracking-tight" },
  { name: "Flipkart", style: "font-bold text-lg italic" },
  { name: "Razorpay", style: "font-semibold text-lg" },
  { name: "Swiggy", style: "font-bold text-xl" },
  { name: "Zomato", style: "font-semibold text-lg tracking-wide" },
];

const CompanyLogos = () => {
  return (
    <section className="py-16 bg-secondary/30">
      <div className="section-container">
        <ScrollReveal>
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
              Get Placed at Top Companies & Startups
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Our students have landed roles at FAANG, MAANG, and India's top startups
            </p>
          </div>
        </ScrollReveal>

        {/* Logo Grid */}
        <ScrollReveal delay={0.1}>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4 max-w-5xl mx-auto">
            {companies.map((company, index) => (
              <motion.div
                key={company.name}
                className="flex items-center justify-center bg-card border border-border rounded-xl p-4 h-16 transition-all hover:border-primary/50 hover:shadow-lg group"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                viewport={{ once: true }}
                whileHover={{ y: -4 }}
              >
                <span className={`text-muted-foreground group-hover:text-foreground transition-colors ${company.style}`}>
                  {company.name}
                </span>
              </motion.div>
            ))}
          </div>
        </ScrollReveal>

        {/* Featured Quote */}
        <ScrollReveal delay={0.2}>
          <div className="mt-12 max-w-3xl mx-auto text-center">
            <blockquote className="relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-4xl text-primary/30">"</div>
              <p className="text-lg text-muted-foreground italic leading-relaxed px-8">
                UniDash helped me land my dream internship at a top tech company. 
                The structured approach to tracking my progress made all the difference 
                in staying consistent with my preparation.
              </p>
              <footer className="mt-4">
                <span className="text-sm font-semibold text-foreground">— Arjun K.</span>
                <span className="text-sm text-muted-foreground"> • Software Engineer at Google</span>
              </footer>
            </blockquote>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};

export default CompanyLogos;
