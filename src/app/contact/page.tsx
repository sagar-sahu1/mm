"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
// import type { Metadata } from 'next'; // metadata should be in a server component or layout

// export const metadata: Metadata = { // Cannot be in client component
//   title: 'Contact Us - MindMash',
//   description: 'Get in touch with the MindMash team.',
// };

export default function ContactPage() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <div className="min-h-[calc(100vh-20rem)] flex items-center justify-center py-12 text-white localized-gradient-bg">
      <div className="w-full max-w-5xl mx-auto px-4 md:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left Section: Text */}
        <div className="text-center lg:text-left space-y-6">
          <span className="inline-block bg-muted/20 text-muted-foreground text-sm font-semibold px-4 py-1 rounded-full border border-muted-foreground/30">
            Contact Us
          </span>
          <h1 className="text-5xl md:text-6xl font-bold leading-tight text-foreground">
            Let&apos;s Get In Touch.
          </h1>
          <p className="text-lg text-muted-foreground">
            {/* Removed manual contact text */}
          </p>
        </div>

        {/* Right Section: Form */}
        <Card className="w-full bg-card/10 backdrop-blur-lg border border-primary/20 shadow-xl">
          <CardContent className="p-6 md:p-8">
            <form action="https://formsubmit.co/panchamlehri@gmail.com" method="POST" className="space-y-6">
              <div>
                <label htmlFor="name" className="text-base text-muted-foreground block mb-2">Full Name</label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Enter your full name..."
                  required
                  className="text-base py-6 bg-background/20 border-primary/20 focus:border-primary/50 transition-colors placeholder:text-muted-foreground/60"
                />
              </div>
              <div>
                <label htmlFor="email" className="text-base text-muted-foreground block mb-2">Email Address</label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email address..."
                  required
                  className="text-base py-6 bg-background/20 border-primary/20 focus:border-primary/50 transition-colors placeholder:text-muted-foreground/60"
                />
              </div>
              <div>
                <label htmlFor="message" className="text-base text-muted-foreground block mb-2">Message</label>
                <Textarea
                  id="message"
                  name="message"
                  placeholder="Enter your main text here..."
                  required
                  className="resize-y min-h-[150px] text-base p-4 bg-background/20 border-primary/20 focus:border-primary/50 transition-colors placeholder:text-muted-foreground/60"
                />
              </div>
              {/* Disable captcha */}
              <input type="hidden" name="_captcha" value="false" />
              <Button
                type="submit"
                size="lg"
                className="w-full text-lg py-6 bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 text-white shadow-lg transition-all duration-300 flex items-center justify-center gap-2"
              >
                Send <Send className="h-5 w-5" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
