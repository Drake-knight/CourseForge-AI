import Link from "next/link";
import React from "react";
import { getCurrentUserSession } from "@/lib/auth";
import SignInButton from "./SignInButton";
import UserDropdown from "./UserDropdown";
import { RocketIcon } from "lucide-react";

interface NavbarProps {
  className?: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const Navbar = async ({ className = "" }: NavbarProps) => {
  const session = await getCurrentUserSession();
  const isAuthenticated = !!session?.user;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-7xl items-center">
        <div className="flex flex-1 items-center justify-between">
          <Link 
            href="/" 
            className="flex items-center gap-2 font-semibold transition-colors hover:text-foreground/80"
          >
            <RocketIcon className="h-5 w-5" />
            <span className="hidden font-bold sm:inline-block">
              Lightspeed AI
            </span>
          </Link>

          <nav className="flex items-center gap-5 text-sm">
            <Link 
              href="/gallery" 
              className="font-medium transition-colors hover:text-foreground/80"
            >
              Gallery
            </Link>
            
            {isAuthenticated && (
              <>
                <Link 
                  href="/create" 
                  className="font-medium transition-colors hover:text-foreground/80"
                >
                  Create
                </Link>
                <Link 
                  href="/settings" 
                  className="font-medium transition-colors hover:text-foreground/80"
                >
                  Settings
                </Link>
              </>
            )}
            
            <div className="flex items-center gap-3">
              
              {isAuthenticated ? (
                <UserDropdown user={session.user} />
              ) : (
                <SignInButton size="sm" variant="outline" />
              )}
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Navbar;