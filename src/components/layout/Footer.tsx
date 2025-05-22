import { siteConfig } from "@/config/site";
import Link from "next/link";
import { BrainCircuit, MessageSquare, ListChecks, LayoutDashboard, HelpCircle, ShieldCheck, InfoIcon, BarChart3, GraduationCap, Users, Swords } from "lucide-react";

const footerNavItems = [
  { href: "/about", label: "About Us", icon: InfoIcon },
  { href: "/contact", label: "Contact Us", icon: MessageSquare },
  { href: "/challenge", label: "Challenge a Friend", icon: Swords },
  { href: "/history", label: "Quiz History", icon: ListChecks },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/leaderboard", label: "Leaderboard", icon: BarChart3 },
  { href: "/faq", label: "FAQ", icon: HelpCircle },
  { href: "/privacy-policy", label: "Privacy Policy", icon: ShieldCheck },
];

export function Footer() {
  return (
    <footer className="py-8 border-t border-border/40 bg-card text-card-foreground">
      <div className="container mx-auto max-w-5xl space-y-8 px-2 sm:px-0">
        {/* Responsive grid: stack on mobile, flex row on large screens */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-row lg:justify-between lg:items-start gap-x-8 gap-y-8 lg:gap-x-64 mx-auto w-full sm:w-fit">
          {/* Column 2: Dashboard, Leaderboard, History, Challenge (now on the left) */}
          <div className="flex flex-col items-start space-y-4 min-w-[220px] lg:mr-16">
            <span className="font-semibold text-lg mb-2">Features</span>
             <Link href="/dashboard" className="text-base md:text-lg text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 w-full">
              <LayoutDashboard className="h-5 w-5" />
              Dashboard
            </Link>
            <Link href="/leaderboard" className="text-base md:text-lg text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 w-full">
              <BarChart3 className="h-5 w-5" />
              Leaderboard
            </Link>
             <Link href="/community" className="text-base md:text-lg text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 w-full">
              <Users className="h-5 w-5" />
              Community
            </Link>
            <Link href="/challenge" className="text-base md:text-lg text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 w-full">
              <Swords className="h-5 w-5" />
              Challenge a Friend
            </Link>
          </div>
          {/* Column 1: About, Contact, Privacy, FAQ (now on the right) */}
          <div className="flex flex-col items-start space-y-4 min-w-[220px]">
            <span className="font-semibold text-lg mb-2">Legals</span>
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
            © 2025 MindMash by
            <div className="flex flex-col items-center mt-1">
              <Link href="https://github.com/sagar-sahu1" className="text-primary hover:text-primary/80 transition-colors">
                Sagar Sahu
              </Link>
              <Link href="https://github.com/SahilSR81" className="text-primary hover:text-primary/80 transition-colors">
                Sahil Singh
              </Link>
            </div>
            All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
