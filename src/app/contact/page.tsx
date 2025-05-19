"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Send, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
// import type { Metadata } from 'next'; // metadata should be in a server component or layout

// export const metadata: Metadata = { // Cannot be in client component
//   title: 'Contact Us - MindMash',
//   description: 'Get in touch with the MindMash team.',
// };

const contactFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }).max(50, { message: "Name is too long." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  message: z.string().min(10, { message: "Message must be at least 10 characters." }).max(500, { message: "Message is too long (max 500 characters)." }),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

export default function ContactPage() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      email: "",
      message: "",
    },
  });

  async function onSubmit(values: ContactFormValues) {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      if (res.ok) {
        toast({
          title: "Message Sent!",
          description: "Thanks for reaching out. We'll get back to you soon.",
        });
        form.reset();
      } else {
        const data = await res.json();
        toast({
          title: "Failed to send message.",
          description: data.error || "Please try again later.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Failed to send message.",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

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
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Name Field */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base text-muted-foreground">Full Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter your full name..." 
                          {...field} 
                          className="text-base py-6 bg-background/20 border-primary/20 focus:border-primary/50 transition-colors placeholder:text-muted-foreground/60"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Email Field */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base text-muted-foreground">Email Address</FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder="Enter your email address..." 
                          {...field} 
                          className="text-base py-6 bg-background/20 border-primary/20 focus:border-primary/50 transition-colors placeholder:text-muted-foreground/60"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Message Field */}
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base text-muted-foreground">Message</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter your main text here..."
                          className="resize-y min-h-[150px] text-base p-4 bg-background/20 border-primary/20 focus:border-primary/50 transition-colors placeholder:text-muted-foreground/60"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Submit Button */}
                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full text-lg py-6 bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 text-white shadow-lg transition-all duration-300 flex items-center justify-center gap-2"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" /> Sending...
                    </>
                  ) : (
                    <>
                      Submit Form <Send className="h-5 w-5" />
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
