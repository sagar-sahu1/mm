
"use client";

import Link from "next/link";
import { siteConfig } from "@/config/site";
import { Button } from "@/components/ui/button";
import { BrainCircuit, History, UserCircle, LogIn, LogOut, UserPlus, LayoutDashboard, Link2, Lightbulb, Info, MessageSquare } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export function Header() {
  const { currentUser, logout, loading } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <BrainCircuit className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg">{siteConfig.name}</span>
        </Link>
        <nav className="flex items-center space-x-1 sm:space-x-2">
          <Button asChild variant="ghost" size="sm" className="text-xs sm:text-sm">
            <Link href="/create-quiz" className="flex items-center">
              <Lightbulb className="mr-1 h-4 w-4 sm:mr-2 sm:h-5 sm:w-5" />
              Create Quiz
            </Link>
          </Button>
          {currentUser && (
            <>
              <Button asChild variant="ghost" size="sm" className="text-xs sm:text-sm">
                <Link href="/dashboard" className="flex items-center">
                  <LayoutDashboard className="mr-1 h-4 w-4 sm:mr-2 sm:h-5 sm:w-5" />
                  Dashboard
                </Link>
              </Button>
              <Button asChild variant="ghost" size="sm" className="text-xs sm:text-sm">
                <Link href="/history" className="flex items-center">
                  <History className="mr-1 h-4 w-4 sm:mr-2 sm:h-5 sm:w-5" />
                  History
                </Link>
              </Button>
              <Button asChild variant="ghost" size="sm" className="text-xs sm:text-sm">
                <Link href="/challenge" className="flex items-center">
                  <Link2 className="mr-1 h-4 w-4 sm:mr-2 sm:h-5 sm:w-5" />
                  Challenge
                </Link>
              </Button>
            </>
          )}
           <Button asChild variant="ghost" size="sm" className="text-xs sm:text-sm">
            <Link href="/about" className="flex items-center">
              <Info className="mr-1 h-4 w-4 sm:mr-2 sm:h-5 sm:w-5" />
              About
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm" className="text-xs sm:text-sm">
            <Link href="/contact" className="flex items-center">
              <MessageSquare className="mr-1 h-4 w-4 sm:mr-2 sm:h-5 sm:w-5" />
              Contact
            </Link>
          </Button>

          {!loading && (
            <>
              {currentUser ? (
                <>
                  <Button asChild variant="ghost" size="sm" className="text-xs sm:text-sm">
                    <Link href="/profile" className="flex items-center">
                      <UserCircle className="mr-1 h-4 w-4 sm:mr-2 sm:h-5 sm:w-5" />
                      Profile
                    </Link>
                  </Button>
                  <Button variant="ghost" size="sm" onClick={logout} className="text-xs sm:text-sm">
                    <LogOut className="mr-1 h-4 w-4 sm:mr-2 sm:h-5 sm:w-5" />
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Button asChild variant="ghost" size="sm" className="text-xs sm:text-sm">
                    <Link href="/login" className="flex items-center">
                      <LogIn className="mr-1 h-4 w-4 sm:mr-2 sm:h-5 sm:w-5" />
                      Login
                    </Link>
                  </Button>
                  <Button asChild variant="default" size="sm" className="text-xs sm:text-sm">
                    <Link href="/signup" className="flex items-center">
                       <UserPlus className="mr-1 h-4 w-4 sm:mr-2 sm:h-5 sm:w-5" />
                      Sign Up
                    </Link>
                  </Button>
                </>
              )}
            </>
          )}
           {loading && (
             <div className="flex items-center space-x-2">
                <div className="h-5 w-5 animate-pulse rounded-full bg-muted-foreground/50"></div>
                 <div className="h-5 w-10 animate-pulse rounded bg-muted-foreground/50"></div>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
