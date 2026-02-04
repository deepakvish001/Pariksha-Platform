import { motion } from "framer-motion";

const HeroIllustration = () => {
  return (
    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[450px] h-[450px] lg:w-[550px] lg:h-[550px] pointer-events-none hidden lg:block">
      <svg
        viewBox="0 0 500 500"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Background glow */}
        <defs>
          <radialGradient id="bgGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="hsl(24 95% 53% / 0.3)" />
            <stop offset="100%" stopColor="hsl(24 95% 53% / 0)" />
          </radialGradient>
          <linearGradient id="orangeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#ea580c" />
          </linearGradient>
          <linearGradient id="cardGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(0 0% 15%)" />
            <stop offset="100%" stopColor="hsl(0 0% 8%)" />
          </linearGradient>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="8" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background glow circle */}
        <motion.circle
          cx="250"
          cy="250"
          r="200"
          fill="url(#bgGlow)"
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Orbital rings */}
        <motion.ellipse
          cx="250"
          cy="250"
          rx="180"
          ry="60"
          stroke="url(#orangeGradient)"
          strokeWidth="1"
          fill="none"
          opacity="0.3"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: "250px 250px" }}
        />
        <motion.ellipse
          cx="250"
          cy="250"
          rx="140"
          ry="45"
          stroke="url(#orangeGradient)"
          strokeWidth="1.5"
          fill="none"
          opacity="0.4"
          animate={{ rotate: -360 }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: "250px 250px" }}
        />

        {/* Main dashboard card */}
        <motion.g
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: [0, -8, 0], opacity: 1 }}
          transition={{ y: { duration: 3, repeat: Infinity, ease: "easeInOut" }, opacity: { duration: 0.5 } }}
        >
          <rect x="160" y="150" width="180" height="120" rx="12" className="fill-[hsl(0,0%,100%)] dark:fill-[hsl(0,0%,12%)]" />
          <rect x="160" y="150" width="180" height="120" rx="12" stroke="#f97316" strokeWidth="1" strokeOpacity="0.3" fill="none" />
          
          {/* Card header dots */}
          <circle cx="178" cy="166" r="4" fill="#ff5f56" />
          <circle cx="192" cy="166" r="4" fill="#ffbd2e" />
          <circle cx="206" cy="166" r="4" fill="#27ca40" />
          
          {/* Code lines */}
          <rect x="175" y="185" width="80" height="6" rx="3" fill="#3b3b5c" />
          <rect x="175" y="200" width="120" height="6" rx="3" fill="#f97316" opacity="0.8" />
          <rect x="175" y="215" width="60" height="6" rx="3" fill="#3b3b5c" />
          <rect x="175" y="230" width="100" height="6" rx="3" fill="#3b3b5c" />
          <rect x="175" y="245" width="75" height="6" rx="3" fill="#f97316" opacity="0.5" />
        </motion.g>

        {/* Floating AI chip */}
        <motion.g
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: [0, 10, 0], opacity: 1 }}
          transition={{ y: { duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }, opacity: { duration: 0.5, delay: 0.2 } }}
        >
          <rect x="80" y="280" width="70" height="70" rx="8" className="fill-[hsl(0,0%,96%)] dark:fill-[hsl(0,0%,10%)]" />
          <rect x="80" y="280" width="70" height="70" rx="8" stroke="#f97316" strokeWidth="1" strokeOpacity="0.4" fill="none" />
          
          {/* Chip center */}
          <motion.circle
            cx="115"
            cy="315"
            r="15"
            fill="#f97316"
            filter="url(#softGlow)"
            animate={{ scale: [1, 1.1, 1], opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
          
          {/* Chip traces */}
          <line x1="115" y1="290" x2="115" y2="300" stroke="#f97316" strokeWidth="2" opacity="0.6" />
          <line x1="115" y1="330" x2="115" y2="340" stroke="#f97316" strokeWidth="2" opacity="0.6" />
          <line x1="90" y1="315" x2="100" y2="315" stroke="#f97316" strokeWidth="2" opacity="0.6" />
          <line x1="130" y1="315" x2="140" y2="315" stroke="#f97316" strokeWidth="2" opacity="0.6" />
        </motion.g>

        {/* Progress card */}
        <motion.g
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: [0, -6, 0], opacity: 1 }}
          transition={{ y: { duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 1 }, opacity: { duration: 0.5, delay: 0.4 } }}
        >
          <rect x="350" y="200" width="90" height="100" rx="10" className="fill-[hsl(0,0%,98%)] dark:fill-[hsl(0,0%,11%)]" />
          <rect x="350" y="200" width="90" height="100" rx="10" stroke="#f97316" strokeWidth="1" strokeOpacity="0.3" fill="none" />
          
          {/* Circular progress */}
          <circle cx="395" cy="245" r="25" stroke="#2a2a3e" strokeWidth="4" fill="none" />
          <motion.circle
            cx="395"
            cy="245"
            r="25"
            stroke="#f97316"
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
            strokeDasharray="157"
            initial={{ strokeDashoffset: 157 }}
            animate={{ strokeDashoffset: 40 }}
            transition={{ duration: 2, delay: 1, ease: "easeOut" }}
            style={{ transform: "rotate(-90deg)", transformOrigin: "395px 245px" }}
            filter="url(#softGlow)"
          />
          <text x="395" y="250" textAnchor="middle" fill="#f97316" fontSize="14" fontWeight="bold">75%</text>
          
          {/* Mini bars */}
          <rect x="365" y="280" width="15" height="8" rx="2" fill="#f97316" opacity="0.8" />
          <rect x="385" y="280" width="15" height="8" rx="2" fill="#f97316" opacity="0.5" />
          <rect x="405" y="280" width="15" height="8" rx="2" fill="#3b3b5c" />
        </motion.g>

        {/* Floating code bracket */}
        <motion.g
          animate={{ y: [0, -5, 0], rotate: [0, 3, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
          style={{ transformOrigin: "380px 130px" }}
        >
          <rect x="355" y="110" width="50" height="40" rx="6" className="fill-[hsl(0,0%,95%)] dark:fill-[hsl(0,0%,9%)]" />
          <text x="380" y="138" textAnchor="middle" fill="#f97316" fontSize="20" fontWeight="bold" fontFamily="monospace">&lt;/&gt;</text>
        </motion.g>

        {/* Floating checkmark */}
        <motion.g
          animate={{ y: [0, 8, 0], scale: [1, 1.05, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.7 }}
          style={{ transformOrigin: "115px 200px" }}
        >
          <circle cx="115" cy="200" r="22" fill="#22c55e" filter="url(#softGlow)" />
          <path d="M105 200 L112 207 L127 192" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </motion.g>

        {/* Neural connection dots */}
        {[
          { cx: 200, cy: 300, delay: 0 },
          { cx: 300, cy: 320, delay: 0.3 },
          { cx: 350, cy: 170, delay: 0.6 },
          { cx: 170, cy: 120, delay: 0.9 },
        ].map((dot, i) => (
          <motion.circle
            key={i}
            cx={dot.cx}
            cy={dot.cy}
            r="4"
            fill="#f97316"
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: dot.delay }}
            filter="url(#softGlow)"
          />
        ))}

        {/* Connection lines */}
        <motion.path
          d="M200 300 Q250 280 250 250"
          stroke="url(#orangeGradient)"
          strokeWidth="1"
          fill="none"
          opacity="0.4"
          strokeDasharray="5 5"
          animate={{ strokeDashoffset: [0, -20] }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        />
        <motion.path
          d="M300 320 Q320 280 340 250"
          stroke="url(#orangeGradient)"
          strokeWidth="1"
          fill="none"
          opacity="0.4"
          strokeDasharray="5 5"
          animate={{ strokeDashoffset: [0, -20] }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear", delay: 0.5 }}
        />
        <motion.path
          d="M170 120 Q200 140 200 150"
          stroke="url(#orangeGradient)"
          strokeWidth="1"
          fill="none"
          opacity="0.4"
          strokeDasharray="5 5"
          animate={{ strokeDashoffset: [0, -20] }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear", delay: 1 }}
        />

        {/* Sparkle effects */}
        {[
          { cx: 420, cy: 140, size: 3, delay: 0 },
          { cx: 90, cy: 370, size: 2.5, delay: 0.5 },
          { cx: 320, cy: 380, size: 2, delay: 1 },
          { cx: 450, cy: 280, size: 2.5, delay: 1.5 },
        ].map((sparkle, i) => (
          <motion.circle
            key={`sparkle-${i}`}
            cx={sparkle.cx}
            cy={sparkle.cy}
            r={sparkle.size}
            fill="#f97316"
            animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: sparkle.delay }}
          />
        ))}
      </svg>
    </div>
  );
};

export default HeroIllustration;
