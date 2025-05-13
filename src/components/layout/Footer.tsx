
import { siteConfig } from "@/config/site";
import Link from "next/link";
import { BrainCircuit, MessageSquare, Link2, ListChecks, LayoutDashboard, HelpCircle, ShieldCheck, InfoIcon, BarChart3 } from "lucide-react"; // Added BarChart3

const footerNavItems = [
  { href: "/about", label: "About Us", icon: InfoIcon },
  { href: "/contact", label: "Contact Us", icon: MessageSquare },
  { href: "/challenge", label: "Challenge a Friend", icon: Link2 },
  { href: "/history", label: "Quiz History", icon: ListChecks },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/leaderboard", label: "Leaderboard", icon: BarChart3 }, // Added Leaderboard
  { href: "/faq", label: "FAQ", icon: HelpCircle },
  { href: "/privacy-policy", label: "Privacy Policy", icon: ShieldCheck },
];

export function Footer() {
  return (
    <footer className="py-8 md:py-12 border-t border-border/40 bg-card text-card-foreground">
      <div className="container space-y-8">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-6 text-sm"> {/* Adjusted grid for better layout with more items */}
          {footerNavItems.map((item) => (
            <div key={item.href} className="flex flex-col items-start">
               <Link
                  href={item.href}
                  className="font-medium text-foreground hover:text-primary transition-colors flex items-center gap-2"
                >
                  <item.icon className="h-4 w-4 text-primary" />
                  {item.label}
                </Link>
            </div>
          ))}
        </div>
        <div className="flex flex-col items-center justify-center gap-4 pt-8 border-t border-border/40">
          <Link href="/" className="flex items-center space-x-2">
            <BrainCircuit className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg">{siteConfig.name}</span>
          </Link>
          <p className="text-balance text-center text-sm leading-loose text-muted-foreground">
            © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
