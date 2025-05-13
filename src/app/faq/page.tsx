
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";

const faqItems = [
  {
    question: "What is MindMash?",
    answer: "MindMash is an AI-powered quiz platform where you can generate quizzes on any topic, challenge yourself, track your progress, and challenge friends.",
  },
  {
    question: "How are quizzes generated?",
    answer: "Quizzes are generated using advanced AI models, including Google's Gemini. You provide a topic and difficulty, and the AI creates questions and multiple-choice answers.",
  },
  {
    question: "Is MindMash free to use?",
    answer: "Yes, MindMash offers a free tier to generate and take quizzes. We may introduce premium features in the future.",
  },
  {
    question: "How do I create a challenge for a friend?",
    answer: "Navigate to the 'Create Quiz' or 'Challenge a Friend' page, fill in the quiz parameters, and opt to generate a challenge link. Share this link with your friend for them to take the quiz.",
  },
  {
    question: "Can I see my past quiz results?",
    answer: "Yes, all your completed quizzes and their results are stored in your Quiz History, accessible from your dashboard or the footer link.",
  },
  {
    question: "What technology does MindMash use?",
    answer: "MindMash is built with Next.js, TypeScript, Tailwind CSS, ShadCN UI, Firebase for backend services (like authentication and database), and Google Gemini via Genkit for AI quiz generation.",
  },
  {
    question: "How is my data handled?",
    answer: "We take your privacy seriously. Please refer to our Privacy Policy page for detailed information on how we collect, use, and protect your data.",
  },
];

export default function FAQPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <Card className="shadow-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <HelpCircle className="h-16 w-16 text-primary" />
          </div>
          <CardTitle className="text-4xl font-bold">Frequently Asked Questions</CardTitle>
          <CardDescription className="text-xl text-muted-foreground">
            Find answers to common questions about MindMash.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 md:p-8">
          <Accordion type="single" collapsible className="w-full space-y-4">
            {faqItems.map((item, index) => (
              <AccordionItem value={`item-${index}`} key={index} className="border px-4 rounded-lg shadow-sm">
                <AccordionTrigger className="text-lg font-semibold text-left hover:no-underline">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-base text-muted-foreground leading-relaxed pt-2 pb-4">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
