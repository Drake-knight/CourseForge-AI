"use client";

import React, { useState } from "react";
import { Button } from "./ui/button";
import { signIn } from "next-auth/react";
import { FcGoogle } from "react-icons/fc";
import { Loader2 } from "lucide-react";

interface ButtonProps {
  variant?: "default" | "outline" | "ghost" | "link" | "secondary" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  showIcon?: boolean;
  label?: string;
}

const SignInButton: React.FC<ButtonProps> = ({
  variant = "default",
  size = "default",
  className = "",
  showIcon = true,
  label = "Sign in with Google",
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    try {
      setIsLoading(true);
      await signIn("google", { callbackUrl: "/dashboard" });
    } catch (error) {
      console.error("Error signing in:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={`font-medium transition-all ${className}`}
      onClick={handleSignIn}
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Connecting...
        </>
      ) : (
        <>
          {showIcon && <FcGoogle className="mr-2 h-5 w-5" />}
          {label}
        </>
      )}
    </Button>
  );
};

export default SignInButton;