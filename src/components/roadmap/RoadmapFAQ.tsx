import React from "react";
import { motion } from "framer-motion";
import { HelpCircle } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface FAQ {
  question: string;
  answer: string;
}

interface RoadmapFAQProps {
  faqs: FAQ[];
  title?: string;
  className?: string;
}

const RoadmapFAQ: React.FC<RoadmapFAQProps> = ({ faqs, title, className }) => {
  if (!faqs || faqs.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className={cn("", className)}
    >
      <Card className="glass-card overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-primary/50 via-amber-500/50 to-orange-500/50" />
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-lg">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-primary/20 to-amber-500/20 flex items-center justify-center">
              <HelpCircle className="h-5 w-5 text-primary" />
            </div>
            {title || "Frequently Asked Questions"}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <Accordion type="single" collapsible className="w-full space-y-2">
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`faq-${index}`}
                className="border border-border/50 rounded-lg px-4 data-[state=open]:bg-muted/30 transition-colors duration-200"
              >
                <AccordionTrigger className="text-left hover:no-underline py-4 [&>svg]:text-primary">
                  <span className="pr-4">{faq.question}</span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-4">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default RoadmapFAQ;
