import { Instagram, Twitter, Linkedin, Github } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import BrandLogo from "./BrandLogo";

const socialLinks = [
  { icon: Twitter, href: "#", label: "Twitter" },
  { icon: Instagram, href: "#", label: "Instagram" },
  { icon: Linkedin, href: "#", label: "LinkedIn" },
  { icon: Github, href: "#", label: "GitHub" },
];

const Footer = () => {
  return (
    <footer className="bg-background border-t border-border">
      <div className="section-container py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <BrandLogo size="sm" linkTo="/" />

          {/* Links */}
          <nav className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link to="/#features" className="hover:text-foreground transition-colors">Features</Link>
            <Link to="/#faq" className="hover:text-foreground transition-colors">FAQ</Link>
            <Link to="/login" className="hover:text-foreground transition-colors">Sign In</Link>
          </nav>

          {/* Social */}
          <div className="flex items-center gap-3">
            {socialLinks.map((social) => (
              <motion.a
                key={social.label}
                href={social.href}
                whileHover={{ scale: 1.1, y: -2 }}
                className="w-9 h-9 rounded-full bg-secondary border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors"
                aria-label={social.label}
              >
                <social.icon className="w-4 h-4" />
              </motion.a>
            ))}
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border/50 text-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Byteskill. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
