
import Link from "next/link";
import { siteConfig } from "@/config/site";
import { Button } from "@/components/ui/button";
import { BrainCircuit } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <BrainCircuit className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg">{siteConfig.name}</span>
        </Link>
        <nav className="flex items-center space-x-2">
          <Button asChild variant="ghost">
            <Link href="/create-quiz">Create Quiz</Link>
          </Button>
          {/* Future: Add UserProfile dropdown here if auth is implemented */}
        </nav>
      </div>
    </header>
  );
}
