"use client";

import Link from "next/link";
import { siteConfig } from "@/config/site";
import { Button } from "@/components/ui/button";
import { 
  BrainCircuit, 
  UserCircle, 
  LogIn, 
  LogOut, 
  UserPlus, 
  LayoutDashboard, 
  Lightbulb,
  Home,
  BarChart3,
  GraduationCap,
  ListChecks
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function Header() {
  const { currentUser, logout, loading } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex flex-col sm:flex-row h-auto sm:h-16 items-center justify-between px-2 sm:px-4 gap-2 sm:gap-0">
        <Link href="/" className="flex items-center space-x-2 mb-2 sm:mb-0">
          <GraduationCap className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg">{siteConfig.name}</span>
        </Link>
        <nav className="flex items-center space-x-2 sm:space-x-4 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
          <Button asChild variant="ghost" size="sm">
            <Link href="/" className="flex items-center">
              <Home className="mr-2 h-4 w-4" />
              Home
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/create-quiz" className="flex items-center">
              <Lightbulb className="mr-2 h-4 w-4" />
              Create Quiz
            </Link>
          </Button>
          
          {!loading && (
            <>
              {currentUser ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={currentUser.photoURL || undefined} alt={currentUser.displayName || currentUser.email || "User"} />
                        <AvatarFallback>
                          <UserCircle className="h-6 w-6" />
                        </AvatarFallback>
                      </Avatar>
                      <span className="sr-only">Open user menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{currentUser.displayName || currentUser.email}</p>
                        <p className="text-xs leading-none text-muted-foreground">{currentUser.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="flex items-center w-full cursor-pointer">
                        <UserCircle className="mr-2 h-4 w-4" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" className="flex items-center w-full cursor-pointer">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/history" className="flex items-center w-full cursor-pointer">
                        <ListChecks className="mr-2 h-4 w-4" />
                        Quiz History
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/leaderboard" className="flex items-center w-full cursor-pointer">
                        <BarChart3 className="mr-2 h-4 w-4" />
                        Leaderboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout} className="cursor-pointer flex items-center w-full text-destructive focus:bg-destructive/10 focus:text-destructive">
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <>
                  <Button asChild variant="ghost" size="sm">
                    <Link href="/login" className="flex items-center">
                      <LogIn className="mr-2 h-4 w-4" />
                      Login
                    </Link>
                  </Button>
                  <Button asChild variant="default" size="sm">
                    <Link href="/signup" className="flex items-center">
                      <UserPlus className="mr-2 h-4 w-4" />
                      Sign Up
                    </Link>
                  </Button>
                </>
              )}
            </>
          )}
          {loading && (
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 animate-pulse rounded-full bg-muted-foreground/50"></div>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
