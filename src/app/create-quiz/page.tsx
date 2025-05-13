
// Use suspense for searchParams a common pattern
import { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { QuizForm } from "@/components/quiz/QuizForm";
import { Lightbulb } from "lucide-react";

function CreateQuizPageContent() {
  return (
    <div className="max-w-3xl mx-auto">
      <Card className="shadow-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Lightbulb className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold">Craft Your Quiz</CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            Tell us what you'd like to learn or test your knowledge on.
            Our AI will generate a unique quiz just for you!
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

export const metadata = {
  title: "Create Quiz",
  description: "Generate a new quiz on any topic with customizable difficulty and length.",
};
