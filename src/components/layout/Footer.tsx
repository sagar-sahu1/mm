import { siteConfig } from "@/config/site";
import Link from "next/link";
import { BrainCircuit, MessageSquare, Link2, ListChecks, LayoutDashboard, HelpCircle, ShieldCheck, InfoIcon, BarChart3, GraduationCap } from "lucide-react";

const footerNavItems = [
  { href: "/about", label: "About Us", icon: InfoIcon },
  { href: "/contact", label: "Contact Us", icon: MessageSquare },
  { href: "/challenge", label: "Challenge a Friend", icon: Link2 },
  { href: "/history", label: "Quiz History", icon: ListChecks },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/leaderboard", label: "Leaderboard", icon: BarChart3 },
  { href: "/faq", label: "FAQ", icon: HelpCircle },
  { href: "/privacy-policy", label: "Privacy Policy", icon: ShieldCheck },
];

export function Footer() {
  return (
    <footer className="py-8 border-t border-border/40 bg-card text-card-foreground">
      <div className="container mx-auto max-w-5xl space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-[40vw] gap-y-8 mx-auto w-fit">
          {/* Column 1: About, Contact, Privacy, FAQ */}
          <div className="flex flex-col items-start space-y-4">
            <Link href="/about" className="text-base md:text-lg text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 w-full">
              <InfoIcon className="h-5 w-5" />
              About Us
            </Link>
            <Link href="/contact" className="text-base md:text-lg text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 w-full">
              <MessageSquare className="h-5 w-5" />
              Contact Us
            </Link>
             <Link href="/privacy-policy" className="text-base md:text-lg text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 w-full">
              <ShieldCheck className="h-5 w-5" />
              Privacy Policy
            </Link>
            <Link href="/faq" className="text-base md:text-lg text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 w-full">
              <HelpCircle className="h-5 w-5" />
              FAQ
            </Link>
          </div>
          {/* Column 2: Dashboard, Leaderboard, History, Challenge */}
          <div className="flex flex-col items-start space-y-4">
             <Link href="/dashboard" className="text-base md:text-lg text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 w-full">
              <LayoutDashboard className="h-5 w-5" />
              Dashboard
            </Link>
            <Link href="/leaderboard" className="text-base md:text-lg text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 w-full">
              <BarChart3 className="h-5 w-5" />
              Leaderboard
            </Link>
             <Link href="/history" className="text-base md:text-lg text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 w-full">
              <ListChecks className="h-5 w-5" />
              Quiz History
            </Link>
            <Link href="/challenge" className="text-base md:text-lg text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 w-full">
              <Link2 className="h-5 w-5" />
              Challenge a Friend
            </Link>
          </div>
        </div>
        {/* Horizontal Partition Line */}
        <hr className="border-purple-500 my-8" />
        <div className="flex flex-col items-center justify-center gap-4">
          {/* Logo, Name, and Slogan */}
          <div className="flex items-center justify-center space-x-2 flex-wrap gap-y-1">
            <Link href="/" className="flex items-center space-x-2">
              <GraduationCap className="h-6 w-6 text-primary" />
              <span className="font-bold text-lg">{siteConfig.name}</span>
            </Link>
            {/* Slogan */}
            <span className="text-sm italic text-muted-foreground ml-2">
              where knowledge meets intelligence
            </span>
          </div>
          <div className="text-center text-sm text-muted-foreground">
            © 2025 MindMash by Sk Shahil Akhtar & Sahil Singh. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
