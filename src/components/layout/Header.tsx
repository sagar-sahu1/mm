
import Link from "next/link";
import { siteConfig } from "@/config/site";
import { Button } from "@/components/ui/button";
import { BrainCircuit, History, UserCircle } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <BrainCircuit className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg">{siteConfig.name}</span>
        </Link>
        <nav className="flex items-center space-x-1 sm:space-x-2">
          <Button asChild variant="ghost" size="sm" className="text-xs sm:text-sm">
            <Link href="/create-quiz">Create Quiz</Link>
          </Button>
          <Button asChild variant="ghost" size="sm" className="text-xs sm:text-sm">
            <Link href="/history" className="flex items-center">
              <History className="mr-1 h-4 w-4 sm:mr-2 sm:h-5 sm:w-5" />
              History
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm" className="text-xs sm:text-sm">
            <Link href="/profile" className="flex items-center">
               <UserCircle className="mr-1 h-4 w-4 sm:mr-2 sm:h-5 sm:w-5" />
              Profile
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
