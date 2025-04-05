import Link from "next/link";
import React from "react";
import { getCurrentUserSession } from "@/lib/auth";
import SignInButton from "./SignInButton";
import UserDropdown from "./UserDropdown";
import { RocketIcon} from "lucide-react"; 

interface NavbarProps {
  className?: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const Navbar = async ({ className = "" }: NavbarProps) => {
  const session = await getCurrentUserSession();
  const isAuthenticated = !!session?.user;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-600 bg-gradient-to-r from-purple-600 to-gray-700 backdrop-blur supports-[backdrop-filter]">
      <div className="container flex h-14 max-w-7xl items-center">
        <div className="flex w-full items-center justify-between">
          <Link 
            href="/" 
            className="flex items-center gap-2 font-semibold text-white transition-colors hover:text-white"
          >
            <RocketIcon className="h-5 w-5 text-white" />
            <span className="hidden font-bold sm:inline-block text-white">
              Lightspeed AI
            </span>
          </Link>

          <nav className="flex items-center gap-5 text-sm">
            <div className="flex items-center gap-5">
              <Link 
                href="/gallery" 
                className="font-medium bg-white text-black px-2 py-1 rounded-md transition-colors hover:bg-purple-600 hover:text-black"
              >
                Gallery
              </Link>
              
              {isAuthenticated && (
                <>
                  <Link 
                    href="/create" 
                    className="font-medium bg-white text-black px-2 py-1 rounded-md transition-colors hover:bg-purple-600 hover:text-black"
                  >
                    Create
                  </Link>
                </>
              )}
            </div>
            
            <div className="flex items-center gap-3 ml-4">
              {isAuthenticated ? (
                <>
                  <UserDropdown user={session.user} />
                </>
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