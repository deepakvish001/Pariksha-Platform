import { motion } from "framer-motion";
import ScrollReveal from "./ScrollReveal";

// Company logo components with brand colors
const GoogleLogo = () => (
  <svg viewBox="0 0 24 24" className="w-24 h-8">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const MicrosoftLogo = () => (
  <svg viewBox="0 0 23 23" className="w-7 h-7">
    <path fill="#F25022" d="M1 1h10v10H1z"/>
    <path fill="#7FBA00" d="M12 1h10v10H12z"/>
    <path fill="#00A4EF" d="M1 12h10v10H1z"/>
    <path fill="#FFB900" d="M12 12h10v10H12z"/>
  </svg>
);

const AmazonLogo = () => (
  <svg viewBox="0 0 100 30" className="w-20 h-7">
    <path fill="#FF9900" d="M62.5 24.5c-6 4.4-14.7 6.8-22.2 6.8-10.5 0-20-3.9-27.1-10.3-.6-.5-.1-1.2.6-.8 7.7 4.5 17.2 7.2 27.1 7.2 6.6 0 13.9-1.4 20.6-4.2 1-.5 1.9.6.9 1.3z"/>
    <path fill="#FF9900" d="M65 21.5c-.8-1-5.1-.5-7.1-.2-.6.1-.7-.4-.2-.8 3.5-2.4 9.1-1.7 9.8-.9.7.8-.2 6.5-3.4 9.2-.5.4-1 .2-.8-.4.7-1.9 2.5-6 1.7-6.9z"/>
    <text x="5" y="18" fill="#232F3E" fontSize="14" fontWeight="bold" fontFamily="Arial">amazon</text>
  </svg>
);

const MetaLogo = () => (
  <svg viewBox="0 0 100 30" className="w-16 h-8">
    <defs>
      <linearGradient id="metaGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#0082FB"/>
        <stop offset="100%" stopColor="#9B4DFF"/>
      </linearGradient>
    </defs>
    <text x="5" y="22" fill="url(#metaGrad)" fontSize="20" fontWeight="bold" fontFamily="Arial">Meta</text>
  </svg>
);

const AppleLogo = () => (
  <svg viewBox="0 0 24 24" className="w-7 h-7">
    <path fill="#555555" d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
  </svg>
);

const NetflixLogo = () => (
  <svg viewBox="0 0 111 30" className="w-20 h-7">
    <path fill="#E50914" d="M105.06 1.53h5.22v27.97h-5.22V1.53zm-9.46 0h5.22v27.97h-5.22V1.53zm-9.45 0h5.22v27.97h-5.22V1.53zM77.2 1.53h5.22v27.97H77.2V1.53zm-9.45 0h5.22v27.97h-5.22V1.53zm-9.46 0h5.22v27.97h-5.22V1.53zM49.34 1.53h5.22v27.97h-5.22V1.53zm-9.45 0h5.22v27.97h-5.22V1.53zm-9.46 0h5.22v27.97H30.43V1.53zM21 1.53h5.22v27.97H21V1.53zm-9.45 0h5.22v27.97h-5.22V1.53zM2.09 1.53h5.22v27.97H2.09V1.53z"/>
    <text x="5" y="22" fill="#E50914" fontSize="18" fontWeight="bold" fontFamily="Arial Black">NETFLIX</text>
  </svg>
);

const StripeLogo = () => (
  <svg viewBox="0 0 60 25" className="w-16 h-7">
    <text x="0" y="20" fill="#635BFF" fontSize="20" fontWeight="bold" fontFamily="Arial">Stripe</text>
  </svg>
);

const UberLogo = () => (
  <svg viewBox="0 0 60 20" className="w-14 h-6">
    <text x="0" y="16" fill="#000000" className="dark:fill-white" fontSize="18" fontWeight="bold" fontFamily="Arial">Uber</text>
  </svg>
);

const FlipkartLogo = () => (
  <svg viewBox="0 0 80 20" className="w-20 h-6">
    <text x="0" y="16" fill="#2874F0" fontSize="16" fontWeight="bold" fontStyle="italic" fontFamily="Arial">Flipkart</text>
  </svg>
);

const RazorpayLogo = () => (
  <svg viewBox="0 0 90 20" className="w-20 h-6">
    <text x="0" y="16" fill="#2D68FF" fontSize="14" fontWeight="bold" fontFamily="Arial">Razorpay</text>
  </svg>
);

const SwiggyLogo = () => (
  <svg viewBox="0 0 70 20" className="w-16 h-6">
    <text x="0" y="16" fill="#FC8019" fontSize="16" fontWeight="bold" fontFamily="Arial">Swiggy</text>
  </svg>
);

const ZomatoLogo = () => (
  <svg viewBox="0 0 70 20" className="w-16 h-6">
    <text x="0" y="16" fill="#E23744" fontSize="16" fontWeight="bold" fontFamily="Arial">zomato</text>
  </svg>
);

const companies = [
  { name: "Google", Logo: GoogleLogo },
  { name: "Microsoft", Logo: MicrosoftLogo },
  { name: "Amazon", Logo: AmazonLogo },
  { name: "Meta", Logo: MetaLogo },
  { name: "Apple", Logo: AppleLogo },
  { name: "Netflix", Logo: NetflixLogo },
  { name: "Stripe", Logo: StripeLogo },
  { name: "Uber", Logo: UberLogo },
  { name: "Flipkart", Logo: FlipkartLogo },
  { name: "Razorpay", Logo: RazorpayLogo },
  { name: "Swiggy", Logo: SwiggyLogo },
  { name: "Zomato", Logo: ZomatoLogo },
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
                className="flex items-center justify-center bg-card border border-border rounded-xl p-4 h-20 transition-all hover:border-primary/50 hover:shadow-lg group"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                viewport={{ once: true }}
                whileHover={{ y: -4, scale: 1.05 }}
              >
                <company.Logo />
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
