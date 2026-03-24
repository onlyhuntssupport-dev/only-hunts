"use client";

import { useState } from "react";
import { auth } from "@/lib/firebase/client";
import { signOut } from "firebase/auth";
import { logout } from "@/app/actions/auth";
import { LogOut, Loader2 } from "lucide-react";

export default function LogoutButton() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    
    try {
      // 1. Sign out of Firebase Client (Frontend)
      await signOut(auth);

      // 2. Sign out of Next.js Server (Clears the secure cookie)
      await logout();

      // 3. Show the success pop-up
      alert("You have successfully signed out.");

      // 4. Hard redirect to the home page
      window.location.href = "/";
      
    } catch (error) {
      console.error("Error signing out:", error);
      alert("There was an issue signing out. Please try again.");
      setIsLoggingOut(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isLoggingOut}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-red-600 transition-all hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
    >
      {isLoggingOut ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <LogOut className="h-4 w-4" />
      )}
      <span className="font-medium text-sm">
        {isLoggingOut ? "Signing out..." : "Sign Out"}
      </span>
    </button>
  );
}