
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BrainCircuit, Lightbulb, Users } from "lucide-react";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About MindMash',
  description: 'Learn more about MindMash, our mission, and how we use AI to create engaging quizzes.',
};

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <Card className="shadow-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <BrainCircuit className="h-16 w-16 text-primary" />
          </div>
          <CardTitle className="text-4xl font-bold">About MindMash</CardTitle>
          <CardDescription className="text-xl text-muted-foreground">
            Igniting Curiosity Through AI-Powered Quizzes
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 md:p-8 space-y-6 text-lg leading-relaxed">
          <section>
            <h2 className="text-2xl font-semibold mb-3 flex items-center">
              <Lightbulb className="h-7 w-7 mr-3 text-accent" />
              Our Mission
            </h2>
            <p>
              At MindMash, our mission is to make learning engaging, accessible, and personalized for everyone.
              We believe that curiosity is the spark of knowledge, and quizzes are a fantastic way to ignite that spark.
              Whether you're a student, a professional looking to brush up on skills, or just a curious mind,
              MindMash provides a dynamic platform to test and expand your understanding of any topic.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 flex items-center">
              <BrainCircuit className="h-7 w-7 mr-3 text-accent" />
              AI-Powered Quiz Generation
            </h2>
            <p>
              The heart of MindMash is our intelligent quiz generation system. We leverage advanced AI models,
              including Google's Gemini, to create unique and relevant quiz questions on virtually any subject you can imagine.
              Simply provide a topic and desired difficulty, and our AI gets to work, crafting questions with multiple-choice
              options and identifying the correct answer. This allows for an endless supply of fresh content, tailored to your
              learning needs.
            </p>
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold mb-3 flex items-center">
              <Users className="h-7 w-7 mr-3 text-accent" />
              Who We Are
            </h2>
            <p>
              MindMash was born out of a passion for education and technology. We are a small, dedicated team
              (or initially, a project developed by Firebase Studio) aiming to explore the potential of AI in creating innovative learning tools.
              We are constantly working to improve MindMash and add new features to enhance your learning experience.
            </p>
          </section>

           <section>
            <h2 className="text-2xl font-semibold mb-3">Tech Stack (Optional Showcase)</h2>
            <p className="text-muted-foreground text-base">
              MindMash is built with a modern technology stack including:
            </p>
            <ul className="list-disc list-inside text-base space-y-1 mt-2 pl-4">
              <li>Next.js (React Framework)</li>
              <li>TypeScript</li>
              <li>Tailwind CSS & ShadCN UI</li>
              <li>Firebase (Authentication, Firestore, etc.)</li>
              <li>Google Gemini API (via Genkit) for AI Quiz Generation</li>
            </ul>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
