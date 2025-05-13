
// Use suspense for searchParams a common pattern
import { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { QuizForm } from "@/components/quiz/QuizForm";
import { Lightbulb } from "lucide-react";
import type { Metadata } from 'next';

function CreateQuizPageContent() {
  return (
    <div className="max-w-3xl mx-auto">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Quiz Parameters</CardTitle>
          <CardDescription className="text-muted-foreground">
            Fill in the details below to generate your custom quiz.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 md:p-8">
          <QuizForm />
        </CardContent>
      </Card>
    </div>
  );
}

export default function CreateQuizPage() {
  return (
    <Suspense fallback={<div>Loading quiz options...</div>}>
      <CreateQuizPageContent />
    </Suspense>
  );
}

export const metadata: Metadata = {
  title: "Create Quiz - MindMash",
  description: "Configure and generate a new quiz with custom parameters.",
};

