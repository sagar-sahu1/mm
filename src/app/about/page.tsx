import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BrainCircuit, Lightbulb, Users } from "lucide-react";
import type { Metadata } from 'next';
import Link from "next/link";

export const metadata: Metadata = {
  title: 'About MindMash',
  description: 'Learn more about MindMash, our mission, and how we use AI to create engaging quizzes.',
};

export default function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <Card className="shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-4xl font-bold text-center">
            About Us
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 md:p-8 space-y-8 text-lg leading-relaxed">
          <section>
            <h2 className="text-2xl font-semibold mb-3">Who We Are</h2>
            <p>
              We are <b>SK Shahil Akhtar</b> and <b>Sahil Singh</b>, two passionate final-year MCA postgraduates from Sarala Birla University. Our journey into building MindMash stems from a shared belief in the transformative power of technology — especially when it comes to education.<br /><br />
              <b>Shahil</b> leads the UX/UI and frontend development, crafting user-centric designs and seamless interfaces to ensure the experience is as intuitive as it is beautiful. <b>Sahil</b> specializes in backend systems and database architecture, ensuring performance, security, and scalability at every level. Known for his expertise in debugging and troubleshooting complex issues, he brings a solutions-driven mindset to every project. With a strong track record of building reliable features and optimizing systems, Sahil is a dependable problem-solver who thrives in high-pressure development environments..<br /><br />
              Beyond our core roles, we're united by a deep curiosity and drive to explore the ever-evolving world of AI tools, design platforms like Dribbble, and thought-leadership hubs like Medium. We are constantly learning, testing, and experimenting with emerging technologies to stay ahead — and to bring meaningful innovations to life.<br /><br />
              MindMash is not just a project — it's a reflection of our hunger to build something purposeful. It's our canvas to blend art, logic, and intelligence, with a vision to impact learners everywhere.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">Our Mission</h2>
            <p>
              At MindMash, we believe that education should never be confined by cost, age, or access. Our mission is simple but powerful:
            </p>
            <blockquote className="border-l-4 border-primary pl-4 my-4 italic text-primary">
              "To make learning easy, smooth, and free for all."
            </blockquote>
            <p>
              We want to break the traditional boundaries of education — to create a space where learning is fun, adaptive, and open to everyone, regardless of background. Whether you're a student preparing for exams, a professional brushing up on skills, or a lifelong learner exploring new topics, MindMash aims to meet you where you are.<br /><br />
              Our platform is designed to remove friction and bring joy to the learning process, using the power of AI to personalize and simplify how knowledge is shared and tested.
            </p>
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold mb-3">AI-Powered Quiz Generation</h2>
            <p>
              Gone are the days of spending hours creating quiz questions or relying on static, generic templates. With MindMash, we've reimagined the quiz-building experience using the capabilities of Generative AI.<br /><br />
              By integrating the <b>Gemini API</b>, our platform allows users to generate intelligent, topic-specific quizzes with just a few clicks. You can input a concept, subject, or even a block of content — and within seconds, the AI creates a structured, balanced set of quiz questions tailored to your input.<br /><br />
              Whether you're:
            </p>
            <ul className="list-disc list-inside pl-6 space-y-1">
              <li>a teacher looking to assess students creatively,</li>
              <li>a student wanting to self-evaluate before exams,</li>
              <li>or just someone hosting a friendly quiz night,</li>
            </ul>
            <p>
              ...MindMash ensures each quiz feels fresh, engaging, and customized.<br /><br />
              Our AI doesn't just generate questions — it crafts a learning experience. The questions are diverse in format (MCQs, true/false, etc.), well-paced in difficulty, and aligned with the topic's context. Plus, you can challenge friends using shareable links, making learning social and fun.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">Tech Stack</h2>
            <p className="text-muted-foreground text-base mb-2">
              To deliver a modern, responsive, and scalable web application, we've built MindMash on a strong, future-proof tech foundation:
            </p>
            <div className="overflow-x-auto">
              <table className="min-w-full text-base border border-border rounded-lg">
                <thead>
                  <tr className="bg-muted">
                    <th className="py-2 px-4 text-left">Layer</th>
                    <th className="py-2 px-4 text-left">Technology/Library</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td className="py-2 px-4">Frontend</td><td className="py-2 px-4">Next.js, React, TypeScript</td></tr>
                  <tr><td className="py-2 px-4">Styling</td><td className="py-2 px-4">Tailwind CSS, Custom CSS</td></tr>
                  <tr><td className="py-2 px-4">UI Components</td><td className="py-2 px-4">Radix UI, shadcn/ui, Lucide React</td></tr>
                  <tr><td className="py-2 px-4">State/Context</td><td className="py-2 px-4">React Context API</td></tr>
                  <tr><td className="py-2 px-4">Forms</td><td className="py-2 px-4">React Hook Form</td></tr>
                  <tr><td className="py-2 px-4">Charts</td><td className="py-2 px-4">Recharts</td></tr>
                  <tr><td className="py-2 px-4">Auth</td><td className="py-2 px-4">Next Auth or Custom Integration</td></tr>
                  <tr><td className="py-2 px-4">Backend API</td><td className="py-2 px-4">Next.js API Routes</td></tr>
                  <tr><td className="py-2 px-4">Database</td><td className="py-2 px-4">Firebase</td></tr>
                </tbody>
              </table>
            </div>
            <p className="mt-2">
              We chose these technologies not just for their popularity, but for their developer-first design, community support, scalability, and ability to create delightful user experiences.
            </p>
          </section>

           <section>
            <h2 className="text-2xl font-semibold mb-3">Final Note</h2>
            <p>
              MindMash is more than just a quiz app. It's our passion project — an intersection of design, code, AI, and the belief that learning should be joyful and universal.<br /><br />
              We're just getting started. As we continue to grow the platform, we invite learners, educators, and dreamers to join us on this journey — to build a smarter, more accessible world of education.<br /><br />
              <b>
                <Link href="/" className="text-primary underline hover:text-primary/80 transition-colors">
                  Welcome to MindMash — where knowledge meets intelligence.
                </Link>
              </b>
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
