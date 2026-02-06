import { motion } from "framer-motion";
import { Sparkles, Code, BookOpen, Target, Briefcase } from "lucide-react";

const suggestedPrompts = [
  {
    icon: Briefcase,
    text: "Help me prepare for a Google interview",
    color: "from-blue-500/20 to-blue-600/10",
  },
  {
    icon: Code,
    text: "Explain binary search with examples",
    color: "from-green-500/20 to-green-600/10",
  },
  {
    icon: BookOpen,
    text: "What are the SOLID principles?",
    color: "from-purple-500/20 to-purple-600/10",
  },
  {
    icon: Target,
    text: "Create a study plan for DSA",
    color: "from-primary/20 to-orange-600/10",
  },
];

interface AstraWelcomeProps {
  onSelectPrompt: (prompt: string) => void;
  isLoading: boolean;
}

const AstraWelcome = ({ onSelectPrompt, isLoading }: AstraWelcomeProps) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="h-full flex flex-col items-center justify-center text-center px-4 py-12"
    >
      {/* Animated icon with glow */}
      <motion.div 
        className="relative mb-6"
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-orange-500 to-amber-500 rounded-full blur-2xl opacity-40 scale-150" />
        <div className="relative h-20 w-20 rounded-full bg-gradient-to-br from-primary via-orange-500 to-amber-500 flex items-center justify-center shadow-2xl shadow-primary/30">
          <Sparkles className="h-10 w-10 text-white" />
        </div>
        {/* Decorative rings */}
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.1, 0.3] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 rounded-full border border-primary/30 scale-150"
        />
        <motion.div
          animate={{ scale: [1.2, 1.4, 1.2], opacity: [0.2, 0.05, 0.2] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          className="absolute inset-0 rounded-full border border-primary/20 scale-[2]"
        />
      </motion.div>

      <motion.h2 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-3xl font-bold mb-3 bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-transparent"
      >
        Welcome to Astra AI
      </motion.h2>
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-white/50 mb-10 max-w-md text-base leading-relaxed"
      >
        I'm your personal career assistant. Ask me about interview prep, DSA problems, 
        system design, or career guidance.
      </motion.p>

      {/* Suggested prompts grid */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl"
      >
        {suggestedPrompts.map((prompt, index) => {
          const Icon = prompt.icon;
          return (
            <motion.button
              key={prompt.text}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelectPrompt(prompt.text)}
              disabled={isLoading}
              className={`
                relative group p-4 rounded-xl text-left
                bg-gradient-to-br ${prompt.color}
                border border-white/[0.05] hover:border-white/[0.1]
                backdrop-blur-xl
                transition-all duration-300
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
              <div className="absolute inset-0 rounded-xl bg-white/[0.02] opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative flex items-start gap-3">
                <div className="p-2 rounded-lg bg-white/[0.05] border border-white/[0.05]">
                  <Icon className="h-4 w-4 text-white/70" />
                </div>
                <span className="text-sm text-white/80 group-hover:text-white transition-colors leading-relaxed">
                  {prompt.text}
                </span>
              </div>
            </motion.button>
          );
        })}
      </motion.div>
    </motion.div>
  );
};

export default AstraWelcome;
