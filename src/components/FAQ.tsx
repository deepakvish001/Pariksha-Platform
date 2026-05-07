import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import ScrollReveal from "./ScrollReveal";

const faqs = [
  {
    question: "Is Parikshaa free to use?",
    answer: "Yes! Parikshaa is completely free. You can access all available features including DSA sheets, progress tracking, streaks, and profile — with no credit card required.",
  },
  {
    question: "What DSA sheets are available?",
    answer: "We offer curated problem sheets from Striver's SDE Sheet, A2Z Sheet, Love Babbar's DSA Sheet, NeetCode 150, NeetCode 250, Blind 75, and more — all with built-in progress tracking.",
  },
  {
    question: "How does progress tracking work?",
    answer: "Mark problems as solved or for revision, and your progress is automatically saved. View your stats on a GitHub-style activity heatmap, track daily/weekly goals, and maintain streaks to stay consistent.",
  },
  {
    question: "Can I access Parikshaa on mobile?",
    answer: "Yes! Parikshaa is fully responsive and works on all devices. Your data syncs in real-time so you can switch between phone, tablet, and desktop seamlessly.",
  },
  {
    question: "What features are coming next?",
    answer: "We're actively building AI-powered learning assistant, learning roadmaps, resume builder, interview prep, and more. These are marked as 'Coming Soon' and will be unlocked progressively.",
  },
  {
    question: "Do I need to create an account?",
    answer: "Yes, a free account is required to save your progress across sessions. Sign up takes less than 30 seconds with email or Google authentication.",
  },
];

const FAQ = () => {
  return (
    <section className="py-24 bg-background">
      <div className="section-container">
        <ScrollReveal>
          <h2 className="section-title">Frequently Asked Questions</h2>
          <p className="section-subtitle">
            Got questions? We've got answers
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="bg-card border border-border rounded-xl px-6 data-[state=open]:border-primary/50 transition-colors"
                >
                  <AccordionTrigger className="text-left text-foreground font-medium py-5 hover:no-underline hover:text-primary">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-5 leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};

export default FAQ;
