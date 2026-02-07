import { Star, Quote } from "lucide-react";
import { motion } from "framer-motion";
import ScrollReveal from "./ScrollReveal";

const testimonials = [
  {
    name: "Priya Sharma",
    role: "SDE at Google",
    college: "IIT Delhi",
    avatar: "PS",
    content: "Byteskill completely transformed how I prepare for interviews. The structured DSA sheets and progress tracking helped me maintain a 45-day streak. Cracked Google on my first attempt!",
    rating: 5,
    featured: true,
  },
  {
    name: "Rahul Verma",
    role: "SDE II at Amazon",
    college: "BITS Pilani",
    avatar: "RV",
    content: "The analytics feature is a game-changer. I could see exactly where my time went and optimize my study sessions. The company-wise prep was incredibly helpful.",
    rating: 5,
  },
  {
    name: "Ananya Patel",
    role: "SDE at Microsoft",
    college: "IIM Bangalore",
    avatar: "AP",
    content: "As someone juggling multiple prep resources, Byteskill brought everything together. The roadmap feature helped me plan my entire preparation journey.",
    rating: 5,
  },
  {
    name: "Vikram Singh",
    role: "SDE at Meta",
    college: "ISI Kolkata",
    avatar: "VS",
    content: "The streak system kept me accountable during my 3-month prep. Ended up cracking interviews at 4 top companies. Byteskill was my secret weapon!",
    rating: 5,
  },
  {
    name: "Sneha Reddy",
    role: "SDE at Apple",
    college: "NIT Warangal",
    avatar: "SR",
    content: "Beautiful interface that actually makes studying enjoyable. The XP system and achievements made prep feel like a game. Highly recommend!",
    rating: 5,
  },
  {
    name: "Arjun Mehta",
    role: "SDE at Netflix",
    college: "VIT Vellore",
    avatar: "AM",
    content: "I was skeptical at first, but the gamification really works. Competing with friends on streaks made preparation fun. Best prep platform I've used.",
    rating: 5,
  },
];

// Duplicate for seamless loop
const marqueeTestimonials = [...testimonials, ...testimonials];

const TestimonialCard = ({ testimonial, isFeatured = false }: { testimonial: typeof testimonials[0]; isFeatured?: boolean }) => (
  <motion.div
    className={`flex-shrink-0 w-[350px] ${isFeatured ? 'lg:w-[400px]' : ''}`}
    whileHover={{ y: -4 }}
    transition={{ duration: 0.2 }}
  >
    <div className={`h-full p-6 rounded-2xl bg-card/50 border border-border/50 backdrop-blur-sm ${isFeatured ? 'ring-2 ring-primary/30' : ''}`}>
      {/* Quote icon */}
      <Quote className="w-8 h-8 text-primary/30 mb-4" />

      {/* Content */}
      <p className="text-sm text-muted-foreground leading-relaxed mb-6">
        "{testimonial.content}"
      </p>

      {/* Rating */}
      <div className="flex gap-1 mb-4">
        {Array.from({ length: testimonial.rating }).map((_, i) => (
          <Star key={i} className="w-4 h-4 fill-primary text-primary" />
        ))}
      </div>

      {/* Author */}
      <div className="flex items-center gap-3 pt-4 border-t border-border/50">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center">
          <span className="text-sm font-bold text-white">{testimonial.avatar}</span>
        </div>
        <div>
          <p className="font-bold text-foreground">{testimonial.name}</p>
          <p className="text-xs text-primary font-medium">{testimonial.role}</p>
          <p className="text-xs text-muted-foreground">{testimonial.college}</p>
        </div>
      </div>
    </div>
  </motion.div>
);

const Testimonials = () => {
  return (
    <section className="py-24 bg-gradient-to-b from-secondary/10 to-background overflow-hidden">
      <div className="section-container">
        {/* Header */}
        <ScrollReveal>
          <div className="text-center mb-12">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-foreground mb-4">
              Trusted by
              <span className="bg-gradient-to-r from-primary to-orange-500 bg-clip-text text-transparent"> 10,000+</span> Students
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
              See what our community has to say about their success stories
            </p>
          </div>
        </ScrollReveal>
      </div>

      {/* Marquee Testimonials */}
      <div className="relative">
        {/* Gradient overlays */}
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background to-transparent z-10" />
        
        <motion.div
          className="flex gap-6 py-4"
          animate={{
            x: [0, -50 * testimonials.length * 6],
          }}
          transition={{
            x: {
              repeat: Infinity,
              repeatType: "loop",
              duration: 40,
              ease: "linear",
            },
          }}
        >
          {marqueeTestimonials.map((testimonial, index) => (
            <TestimonialCard 
              key={`${testimonial.name}-${index}`} 
              testimonial={testimonial}
              isFeatured={testimonial.featured}
            />
          ))}
        </motion.div>
      </div>

      <div className="section-container">
        {/* Stats bar */}
        <ScrollReveal delay={0.2}>
          <div className="mt-16 flex flex-wrap justify-center items-center gap-8 md:gap-16 p-8 rounded-2xl bg-card/30 border border-border/50 backdrop-blur-sm">
            {[
              { value: "10,000+", label: "Active Students" },
              { value: "4.9/5", label: "Average Rating" },
              { value: "100+", label: "Universities" },
              { value: "95%", label: "Recommend Us" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-primary to-orange-500 bg-clip-text text-transparent">
                  {stat.value}
                </p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};

export default Testimonials;
