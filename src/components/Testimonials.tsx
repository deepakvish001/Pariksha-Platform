import { Star, Quote } from "lucide-react";
import { motion } from "framer-motion";
import ScrollReveal from "./ScrollReveal";

const testimonials = [
  {
    name: "Priya Sharma",
    role: "Computer Science, IIT Delhi",
    avatar: "PS",
    content: "Byteskill completely transformed how I manage my studies. I went from constantly missing deadlines to maintaining a 45-day streak. My GPA improved by 0.8 points!",
    rating: 5,
  },
  {
    name: "Rahul Verma",
    role: "Engineering, BITS Pilani",
    avatar: "RV",
    content: "The analytics feature is a game-changer. I can finally see where my time goes and optimize my study sessions. Landed my dream internship at Google!",
    rating: 5,
  },
  {
    name: "Ananya Patel",
    role: "MBA, IIM Bangalore",
    avatar: "AP",
    content: "As someone juggling multiple projects and case studies, Byteskill keeps everything organized. The roadmap feature helped me plan my entire semester effectively.",
    rating: 5,
  },
  {
    name: "Vikram Singh",
    role: "Data Science, ISI Kolkata",
    avatar: "VS",
    content: "The streak system kept me accountable during my placement prep. Ended up cracking interviews at 4 top companies. Byteskill was my secret weapon!",
    rating: 5,
  },
  {
    name: "Sneha Reddy",
    role: "Design, NID Ahmedabad",
    avatar: "SR",
    content: "Beautiful interface that actually makes me want to track my tasks. The analytics helped me realize I was most creative in the mornings!",
    rating: 5,
  },
  {
    name: "Arjun Mehta",
    role: "Electronics, VIT Vellore",
    avatar: "AM",
    content: "I was skeptical at first, but the gamification really works. Competing with friends on streaks made studying fun. Best productivity app I've used.",
    rating: 5,
  },
  {
    name: "Kavya Nair",
    role: "Medicine, AIIMS Delhi",
    avatar: "KN",
    content: "Medical school is intense, but Byteskill helped me stay on top of everything. The note-taking integration is seamless with my study workflow.",
    rating: 5,
  },
  {
    name: "Aditya Kumar",
    role: "Finance, SRCC Delhi",
    avatar: "AK",
    content: "From tracking assignments to planning for CAT prep, Byteskill handles it all. The weekly reports are incredibly insightful for self-improvement.",
    rating: 5,
  },
  {
    name: "Riya Gupta",
    role: "Law, NLSIU Bangalore",
    avatar: "RG",
    content: "Managing case readings and moot court prep used to be chaotic. Byteskill brought structure to my legal studies. Highly recommended!",
    rating: 5,
  },
];

const Testimonials = () => {
  return (
    <section className="py-24 bg-background">
      <div className="section-container">
        {/* Header */}
        <ScrollReveal>
          <h2 className="section-title">Trusted by 10,000+ students & professionals</h2>
          <p className="section-subtitle">
            See what our community has to say about their experience
          </p>
        </ScrollReveal>

        {/* Testimonials Grid - 3x3 */}
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <ScrollReveal key={testimonial.name} delay={index * 0.08}>
              <motion.div
                className="card-dark h-full flex flex-col"
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
              >
                {/* Quote icon */}
                <div className="mb-4">
                  <Quote className="w-8 h-8 text-primary/30" />
                </div>

                {/* Content */}
                <p className="text-sm text-muted-foreground leading-relaxed flex-1 mb-6">
                  "{testimonial.content}"
                </p>

                {/* Rating */}
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                  ))}
                </div>

                {/* Author */}
                <div className="flex items-center gap-3 pt-4 border-t border-border">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-sm font-semibold text-primary">{testimonial.avatar}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm">{testimonial.name}</p>
                    <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
              </motion.div>
            </ScrollReveal>
          ))}
        </div>

        {/* Stats bar */}
        <ScrollReveal delay={0.4}>
          <div className="mt-16 flex flex-wrap justify-center items-center gap-8 md:gap-16">
            {[
              { value: "10,000+", label: "Active Students" },
              { value: "4.9/5", label: "Average Rating" },
              { value: "100+", label: "Universities" },
              { value: "95%", label: "Recommend Us" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl font-bold gradient-text">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </ScrollReveal>

        {/* CTA Button */}
        <ScrollReveal delay={0.5}>
          <div className="mt-10 text-center">
            <button className="btn-primary">
              View all testimonials →
            </button>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};

export default Testimonials;
