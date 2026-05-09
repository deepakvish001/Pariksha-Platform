import { useEffect } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import ScrollReveal from "./ScrollReveal";

const faqs = [
  {
    question: "What is Parikshaa?",
    answer:
      "Parikshaa is an all-in-one platform that combines a free learning hub for students with a serious assessment & proctoring suite for colleges and companies. Learners practice DSA, SQL, system design, and aptitude; teams run secure, proctored coding rounds.",
  },
  {
    question: "Is Parikshaa free for students?",
    answer:
      "Yes — the entire learning side is free. You get curated DSA sheets, roadmaps, daily challenges, contests, an AI mentor, progress tracking, streaks, and leaderboards with no credit card required.",
  },
  {
    question: "How does proctoring work for assessments?",
    answer:
      "Parikshaa runs entirely in the browser with built-in tab-switch detection, fullscreen enforcement, event logging, and our Side Eye AI which uses your phone as a side camera. Every attempt produces a single integrity score backed by a verifiable event log.",
  },
  {
    question: "What question types can I include in a test?",
    answer:
      "Coding (with auto-grading and run-against-tests), MCQs, SQL with live execution, and long-form subjective questions — all in a single assessment. You can mix and match per section.",
  },
  {
    question: "How do colleges and companies invite candidates?",
    answer:
      "Paste a CSV or list of emails and every candidate gets a unique join link in seconds. Each invite is single-use, identity-bound, and tied to your organization slug.",
  },
  {
    question: "What DSA and interview content is available?",
    answer:
      "Striver SDE & A2Z, NeetCode 150 & 250, Blind 75, company-wise sheets, SQL question banks, system design, aptitude, and interview question libraries — all with built-in progress tracking and spaced repetition.",
  },
  {
    question: "How does progress tracking and gamification work?",
    answer:
      "Mark problems as solved or for revision and your progress syncs in real time. A GitHub-style heatmap shows daily activity, streaks keep you accountable, and an XP system unlocks 20 levels and achievement badges.",
  },
  {
    question: "Does Parikshaa work on mobile?",
    answer:
      "Yes. The learning experience is fully responsive across phone, tablet, and desktop, and your data syncs in real time. Proctored assessments are best taken on a laptop or desktop with a webcam.",
  },
  {
    question: "How accurate is Parikshaa's proctoring and what does it actually detect?",
    answer:
      "Our proctoring stack runs entirely in-browser and detects tab switches, fullscreen exits, copy/paste, multiple faces, missing face, background voices, screen-share drops, and suspicious phone usage via the Side Eye AI side camera. Every event is timestamped, hashed, and chained — so the log itself is tamper-evident and verifiable after the test ends.",
  },
  {
    question: "How does the integrity score work?",
    answer:
      "Each attempt produces a single integrity score from 0–100, computed from weighted signals: proctoring events, typing/coding behavior, similarity to other submissions, identity verification, and Side Eye sweep results. You see the score plus a full breakdown — no black-box flags. Thresholds are configurable per organization so you can tune strictness for placement drives vs. practice tests.",
  },
  {
    question: "Can I export reports for placement cells, hiring managers, or auditors?",
    answer:
      "Yes. Every assessment produces exportable reports in PDF and CSV — candidate-level (score, integrity, event timeline, code submissions, viva transcript) and assessment-level (leaderboard, score distribution, integrity heatmap, similarity clusters). Public verifiable integrity reports can also be shared via signed URL so external auditors can confirm the chain of custody without a Parikshaa account.",
  },
  {
    question: "Do I need an account to start learning?",
    answer:
      "Most learning content is browsable as a guest. To save progress, earn XP, join contests, or attempt invited assessments you'll need a free account — sign up takes under 30 seconds with email or Google.",
  },
];

const FAQ = () => {
  // Inject FAQPage JSON-LD for SEO
  useEffect(() => {
    const id = "faq-jsonld";
    const existing = document.getElementById(id);
    if (existing) existing.remove();
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = id;
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((f) => ({
        "@type": "Question",
        name: f.question,
        acceptedAnswer: { "@type": "Answer", text: f.answer },
      })),
    });
    document.head.appendChild(script);
    return () => {
      document.getElementById(id)?.remove();
    };
  }, []);

  return (
    <section className="py-24 bg-background">
      <div className="section-container">
        <ScrollReveal>
          <h2 className="section-title">Frequently Asked Questions</h2>
          <p className="section-subtitle">
            Everything you need to know before you start
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
