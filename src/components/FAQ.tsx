import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import ScrollReveal from "./ScrollReveal";

const faqs = [
  {
    question: "How does UniDash help me stay consistent with my studies?",
    answer: "UniDash uses streak tracking, daily reminders, and gamification to keep you motivated. Our analytics show your progress patterns, helping you identify when you're most productive and optimize your study schedule accordingly.",
  },
  {
    question: "Is UniDash suitable for all types of students?",
    answer: "Absolutely! Whether you're an engineering student, preparing for competitive exams, pursuing an MBA, or studying any other field, UniDash adapts to your specific needs. Our customizable task categories and flexible tracking system work for any academic discipline.",
  },
  {
    question: "Can I access UniDash on mobile devices?",
    answer: "Yes! UniDash is fully responsive and works seamlessly on all devices. Access your dashboard, track tasks, and view analytics from your phone, tablet, or desktop. Your data syncs in real-time across all devices.",
  },
  {
    question: "What happens to my data if I downgrade or cancel?",
    answer: "Your data is always yours. If you downgrade, you retain access to your historical data in read-only mode. We also provide easy data export options so you can download all your progress, notes, and analytics anytime.",
  },
  {
    question: "How is UniDash different from other productivity apps?",
    answer: "UniDash is specifically designed for Indian college students. Unlike generic productivity tools, we understand the unique challenges of competitive exams, placement preparation, and the Indian academic system. Our features are tailored to help you succeed in this context.",
  },
  {
    question: "Do you offer student discounts or scholarships?",
    answer: "Yes! We believe in making productivity tools accessible to all students. We offer a generous free tier, student discounts on yearly plans, and a scholarship program for students who demonstrate financial need. Contact our support team for more details.",
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
