import { motion } from "framer-motion";
import ScrollReveal from "./ScrollReveal";

const companies = [
  { name: "Microsoft", logo: "M" },
  { name: "Google", logo: "G" },
  { name: "Amazon", logo: "A" },
  { name: "Meta", logo: "F" },
  { name: "Apple", logo: "🍎" },
  { name: "Netflix", logo: "N" },
  { name: "Stripe", logo: "S" },
  { name: "Uber", logo: "U" },
  { name: "Airbnb", logo: "A" },
  { name: "Spotify", logo: "S" },
];

const CompanyLogos = () => {
  return (
    <section className="py-16 bg-secondary/30">
      <div className="section-container">
        <ScrollReveal>
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
              Get Placed at Top Companies
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Our students have landed roles at the world's most innovative companies
            </p>
          </div>
        </ScrollReveal>

        {/* Logo Grid */}
        <ScrollReveal delay={0.1}>
          <div className="grid grid-cols-5 md:grid-cols-10 gap-4 max-w-4xl mx-auto">
            {companies.map((company, index) => (
              <motion.div
                key={company.name}
                className="flex items-center justify-center aspect-square bg-card border border-border rounded-xl p-3 transition-all hover:border-primary/50 hover:shadow-lg"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                viewport={{ once: true }}
                whileHover={{ y: -4 }}
              >
                <span className="text-xl font-bold text-muted-foreground">{company.logo}</span>
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
