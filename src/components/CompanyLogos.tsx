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
  <svg viewBox="0 0 24 24" className="w-8 h-8">
    <path fill="#E50914" d="M5.398 0v.006c3.028 8.556 5.37 15.175 8.348 23.596 2.344.058 4.85.398 4.854.398-2.8-7.924-5.923-16.747-8.487-24zm8.489 0v9.63L18.6 22.951c-.043-7.86-.004-15.913.002-22.95zM5.398 1.05V24c1.873-.225 2.81-.312 4.715-.398v-9.22z"/>
  </svg>
);

const StripeLogo = () => (
  <svg viewBox="0 0 60 25" className="w-16 h-7">
    <text x="0" y="20" fill="#635BFF" fontSize="20" fontWeight="bold" fontFamily="Arial">Stripe</text>
  </svg>
);

const UberLogo = () => (
  <svg viewBox="0 0 60 20" className="w-14 h-6">
    <text x="0" y="16" fill="currentColor" fontSize="18" fontWeight="bold" fontFamily="Arial">Uber</text>
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

const AdobeLogo = () => (
  <svg viewBox="0 0 24 24" className="w-8 h-8">
    <path fill="#FF0000" d="M13.966 22.624l-1.69-4.281H8.122l3.892-9.144 5.662 13.425h-3.71zm-6.073 0H0l7.893-18.623v18.623zm10.232-18.624h7.875v18.623l-7.875-18.623z"/>
  </svg>
);

const SalesforceLogo = () => (
  <svg viewBox="0 0 100 30" className="w-20 h-7">
    <text x="0" y="20" fill="#00A1E0" fontSize="14" fontWeight="bold" fontFamily="Arial">Salesforce</text>
  </svg>
);

const LinkedInLogo = () => (
  <svg viewBox="0 0 24 24" className="w-7 h-7">
    <path fill="#0A66C2" d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

const SpotifyLogo = () => (
  <svg viewBox="0 0 24 24" className="w-8 h-8">
    <path fill="#1DB954" d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
  </svg>
);

const PhonePeLogo = () => (
  <svg viewBox="0 0 80 25" className="w-20 h-6">
    <text x="0" y="18" fill="#5F259F" fontSize="14" fontWeight="bold" fontFamily="Arial">PhonePe</text>
  </svg>
);

const CREDLogo = () => (
  <svg viewBox="0 0 60 20" className="w-14 h-6">
    <text x="0" y="16" fill="#2D3436" fontSize="16" fontWeight="900" fontFamily="Arial" className="dark:fill-white">CRED</text>
  </svg>
);

const ZerodhaLogo = () => (
  <svg viewBox="0 0 80 20" className="w-18 h-6">
    <text x="0" y="16" fill="#387ED1" fontSize="14" fontWeight="bold" fontFamily="Arial">Zerodha</text>
  </svg>
);

// Row 1 companies (scroll left)
const row1Companies = [
  { name: "Google", Logo: GoogleLogo },
  { name: "Microsoft", Logo: MicrosoftLogo },
  { name: "Amazon", Logo: AmazonLogo },
  { name: "Meta", Logo: MetaLogo },
  { name: "Apple", Logo: AppleLogo },
  { name: "Netflix", Logo: NetflixLogo },
  { name: "Adobe", Logo: AdobeLogo },
  { name: "Salesforce", Logo: SalesforceLogo },
  { name: "LinkedIn", Logo: LinkedInLogo },
  { name: "Spotify", Logo: SpotifyLogo },
];

// Row 2 companies (scroll right)
const row2Companies = [
  { name: "Stripe", Logo: StripeLogo },
  { name: "Uber", Logo: UberLogo },
  { name: "Flipkart", Logo: FlipkartLogo },
  { name: "Razorpay", Logo: RazorpayLogo },
  { name: "PhonePe", Logo: PhonePeLogo },
  { name: "CRED", Logo: CREDLogo },
  { name: "Zerodha", Logo: ZerodhaLogo },
  { name: "Swiggy", Logo: SwiggyLogo },
  { name: "Zomato", Logo: ZomatoLogo },
];

const LogoMarquee = ({ companies, direction = "left" }: { companies: typeof row1Companies; direction?: "left" | "right" }) => {
  const duplicatedCompanies = [...companies, ...companies, ...companies];
  
  return (
    <div className="relative overflow-hidden py-4">
      <motion.div
        className="flex gap-8 items-center"
        animate={{
          x: direction === "left" ? [0, -33.33 * companies.length * 8] : [-33.33 * companies.length * 8, 0],
        }}
        transition={{
          x: {
            repeat: Infinity,
            repeatType: "loop",
            duration: 30,
            ease: "linear",
          },
        }}
        style={{ width: `${duplicatedCompanies.length * 150}px` }}
      >
        {duplicatedCompanies.map((company, index) => (
          <div
            key={`${company.name}-${index}`}
            className="flex items-center justify-center min-w-[120px] h-14 px-6 rounded-xl bg-card/50 border border-border/30 backdrop-blur-sm grayscale hover:grayscale-0 opacity-60 hover:opacity-100 transition-all duration-300"
          >
            <company.Logo />
          </div>
        ))}
      </motion.div>
    </div>
  );
};

const CompanyLogos = () => {
  return (
    <section className="py-16 bg-gradient-to-b from-background to-secondary/20 overflow-hidden">
      <div className="section-container">
        <ScrollReveal>
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
              Our Students Work At
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Top tech companies and unicorns trust Byteskill graduates
            </p>
          </div>
        </ScrollReveal>
      </div>

      {/* Infinite scroll marquees */}
      <div className="space-y-2">
        <LogoMarquee companies={row1Companies} direction="left" />
        <LogoMarquee companies={row2Companies} direction="right" />
      </div>

      {/* Featured Quote */}
      <div className="section-container">
        <ScrollReveal delay={0.2}>
          <div className="mt-12 max-w-3xl mx-auto text-center">
            <blockquote className="relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-5xl text-primary/30 font-serif">"</div>
              <p className="text-lg text-muted-foreground italic leading-relaxed px-8">
                Byteskill helped me land my dream internship at a top tech company. 
                The structured approach to tracking my progress made all the difference.
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
