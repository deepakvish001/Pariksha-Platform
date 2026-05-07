import { ReactNode, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Sparkles, TrendingUp, Users, Zap, Star, Quote } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
}

const features = [
  { icon: TrendingUp, text: "Track your academic progress in real-time" },
  { icon: Users, text: "Join 10,000+ students worldwide" },
  { icon: Zap, text: "AI-powered study recommendations" },
  { icon: CheckCircle, text: "Seamless integration with your courses" },
];

const testimonials = [
  {
    name: "Priya Sharma",
    role: "Computer Science, IIT Delhi",
    avatar: "PS",
    content: "Parikshaa completely transformed how I manage my studies. My GPA improved by 0.8 points!",
    rating: 5,
  },
  {
    name: "Rahul Verma",
    role: "Engineering, BITS Pilani",
    avatar: "RV",
    content: "The analytics feature is a game-changer. Landed my dream internship at Google!",
    rating: 5,
  },
  {
    name: "Ananya Patel",
    role: "MBA, IIM Bangalore",
    avatar: "AP",
    content: "As someone juggling multiple projects, Parikshaa keeps everything organized perfectly.",
    rating: 5,
  },
];

const stats = [
  { value: "10K+", label: "Students" },
  { value: "4.9", label: "Rating" },
  { value: "100+", label: "Universities" },
];

const AuthLayout = ({ children, title, subtitle }: AuthLayoutProps) => {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <main className="flex-1 flex pt-16">
        {/* Left Side - Hero */}
        <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-primary/10 via-background to-orange-500/5 overflow-hidden min-h-[calc(100vh-16rem)]">
          {/* Background Effects */}
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-orange-500/15 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
          <div 
            className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
              backgroundSize: '60px 60px'
            }}
          />

          {/* Hero Content */}
          <div className="relative z-10 flex flex-col justify-center px-12 xl:px-16 py-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/5 mb-6">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">#1 Student Dashboard</span>
              </div>
              
              <h1 className="text-3xl xl:text-4xl font-bold text-foreground mb-4 leading-tight">
                {title}
              </h1>
              <p className="text-lg text-muted-foreground mb-8 max-w-md">
                {subtitle}
              </p>

              {/* Feature List */}
              <ul className="space-y-3 mb-8">
                {features.map((feature, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 + index * 0.1 }}
                    className="flex items-center gap-3"
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <feature.icon className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-sm text-muted-foreground">{feature.text}</span>
                  </motion.li>
                ))}
              </ul>

              {/* Testimonial Carousel */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-5 max-w-md"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Quote className="w-5 h-5 text-primary/50" />
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">What students say</span>
                </div>

                <div className="relative min-h-[100px]">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentTestimonial}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                    >
                      <p className="text-sm text-foreground mb-4 leading-relaxed">
                        "{testimonials[currentTestimonial].content}"
                      </p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center">
                            <span className="text-xs font-semibold text-primary">
                              {testimonials[currentTestimonial].avatar}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-foreground text-sm">
                              {testimonials[currentTestimonial].name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {testimonials[currentTestimonial].role}
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-0.5">
                          {Array.from({ length: testimonials[currentTestimonial].rating }).map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 fill-primary text-primary" />
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Carousel Dots */}
                <div className="flex justify-center gap-2 mt-4">
                  {testimonials.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentTestimonial(index)}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        index === currentTestimonial 
                          ? "bg-primary w-6" 
                          : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                      }`}
                    />
                  ))}
                </div>
              </motion.div>

              {/* Stats Bar */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.8 }}
                className="flex gap-8 mt-8"
              >
                {stats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <p className="text-xl font-bold gradient-text">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md"
          >
            {children}
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default AuthLayout;
