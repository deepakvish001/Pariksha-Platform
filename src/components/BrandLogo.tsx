import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  animated?: boolean;
  className?: string;
  linkTo?: string;
  onClick?: () => void;
}

const sizeConfig = {
  sm: {
    logo: "w-8 h-8",
    text: "text-lg",
    glow: "blur-lg",
    glowSize: "w-8 h-8",
  },
  md: {
    logo: "w-10 h-10",
    text: "text-xl",
    glow: "blur-xl",
    glowSize: "w-10 h-10",
  },
  lg: {
    logo: "w-12 h-12",
    text: "text-2xl",
    glow: "blur-xl",
    glowSize: "w-12 h-12",
  },
  xl: {
    logo: "w-14 h-14",
    text: "text-3xl",
    glow: "blur-2xl",
    glowSize: "w-14 h-14",
  },
};

const BrandLogo = ({
  size = "md",
  showText = true,
  animated = true,
  className,
  linkTo = "/",
  onClick,
}: BrandLogoProps) => {
  const config = sizeConfig[size];

  const logoContent = (
    <motion.div
      className={cn("flex items-center gap-3", className)}
      whileHover={animated ? { scale: 1.02 } : undefined}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      {/* Logo with glow effect */}
      <div className="relative group">
        {/* Animated glow backdrop */}
        <motion.div
          className={cn(
            "absolute inset-0 bg-gradient-to-br from-primary via-orange-500 to-amber-500 rounded-xl opacity-0 group-hover:opacity-60 transition-opacity duration-500",
            config.glow,
            config.glowSize
          )}
          animate={
            animated
              ? {
                  scale: [1, 1.1, 1],
                  opacity: [0.3, 0.5, 0.3],
                }
              : undefined
          }
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Logo container with gradient border */}
        <motion.div
          className={cn(
            "relative rounded-xl overflow-hidden",
            "bg-gradient-to-br from-primary/20 via-orange-500/10 to-amber-500/20",
            "p-[2px]"
          )}
          whileHover={animated ? { rotate: [0, -2, 2, 0] } : undefined}
          transition={{ duration: 0.4, ease: "easeInOut" }}
        >
          <div className="bg-background rounded-[10px] p-0.5">
            <img
              src="/logo.png"
              alt="Parikshaa"
              className={cn(
                config.logo,
                "rounded-lg object-cover transition-transform duration-300"
              )}
            />
          </div>
        </motion.div>

        {/* Shine effect on hover */}
        <motion.div
          className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none"
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full"
            animate={{ translateX: ["−100%", "200%"] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              repeatDelay: 2,
              ease: "easeInOut",
            }}
          />
        </motion.div>
      </div>

      {/* Brand text */}
      {showText && (
        <motion.div className="flex flex-col">
          <motion.span
            className={cn(
              config.text,
              "font-bold bg-gradient-to-r from-foreground via-foreground to-foreground/80 bg-clip-text text-transparent",
              "tracking-tight"
            )}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
          >
            Parikshaa
          </motion.span>
          {size === "lg" || size === "xl" ? (
            <motion.span
              className="text-xs text-muted-foreground tracking-wide"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              Master your tech career
            </motion.span>
          ) : null}
        </motion.div>
      )}
    </motion.div>
  );

  if (onClick) {
    return (
      <button onClick={onClick} className="focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl">
        {logoContent}
      </button>
    );
  }

  if (linkTo) {
    return (
      <Link to={linkTo} className="focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl">
        {logoContent}
      </Link>
    );
  }

  return logoContent;
};

export default BrandLogo;
