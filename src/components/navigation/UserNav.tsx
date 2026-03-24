"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase/client";
import { doc, getDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { logout } from "@/app/actions/auth"; // <-- FIXED: Changed from logoutUser to logout
import { 
  User, LogOut, LayoutDashboard, Settings, Mail, 
  Target, Heart, Shield 
} from "lucide-react";

interface UserData {
  name: string;
  email: string;
  role: string;
  profileImageUrl?: string;
}

export default function UserNav() {
  const [isOpen, setIsOpen] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async (currentUser: any) => {
      try {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data() as UserData);
        } else {
          setUserData({ name: "User", email: currentUser.email || "", role: "HUNTER" });
        }
      } catch (error) {
        console.error("Error fetching user nav data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchUser(user);
      } else {
        setUserData(null);
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      // 1. Sign out of Firebase on the client
      await signOut(auth);
      
      // 2. Destroy the secure Next.js session cookie on the server
      await logout(); // <-- FIXED: Changed from logoutUser() to logout()
      
      // 3. Force a hard reload to reset the layout completely
      window.location.href = "/";
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="h-10 w-10 rounded-full border-2 border-kalahari/30 bg-kalahari/10 animate-pulse shadow-sm"></div>
    );
  }

  const safeUserData = userData || {
    name: "Account",
    email: "",
    role: "USER"
  };

  const initials = safeUserData.name ? safeUserData.name.substring(0, 2).toUpperCase() : "OH";
  const isAdmin = safeUserData.role === "ADMIN";
  const isOutfitter = safeUserData.role === "OUTFITTER";

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 focus:outline-none transition-transform hover:scale-105"
      >
        <div className="h-10 w-10 rounded-full border-2 border-kalahari flex items-center justify-center bg-off-white overflow-hidden shadow-sm relative">
          {safeUserData.profileImageUrl ? (
            <img src={safeUserData.profileImageUrl} alt="Profile" className="h-full w-full object-cover" />
          ) : (
            <span className="text-olive dark:text-off-white font-bold text-sm tracking-wider">{initials}</span>
          )}
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-64 bg-white border-2 border-kalahari/30 rounded-xl shadow-xl z-50 overflow-hidden flex flex-col font-body">
          
          <div className="px-4 py-3 bg-off-white border-b border-kalahari/20">
            <p className="text-sm font-bold text-olive dark:text-off-white truncate">{safeUserData.name}</p>
            {safeUserData.email && (
              <p className="text-xs font-medium text-olive dark:text-off-white/60 truncate">{safeUserData.email}</p>
            )}
            <span className="inline-block mt-1.5 px-2 py-0.5 bg-kalahari/20 text-olive dark:text-off-white text-[10px] font-bold uppercase tracking-widest rounded">
              {safeUserData.role}
            </span>
          </div>

          <div className="py-2 flex flex-col">
            {isAdmin && (
              <>
                <Link href="/dashboard" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-olive dark:text-off-white/80 hover:bg-kalahari/10 hover:text-olive dark:text-off-white transition-colors">
                  <Shield className="h-4 w-4 text-kalahari" /> Admin Portal
                </Link>
                <Link href="/dashboard/hunts" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-olive dark:text-off-white/80 hover:bg-kalahari/10 hover:text-olive dark:text-off-white transition-colors">
                  <Target className="h-4 w-4 text-kalahari" /> Market Approvals
                </Link>
              </>
            )}

            {isOutfitter && (
              <>
                <Link href="/outfitter/dashboard" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-olive dark:text-off-white/80 hover:bg-kalahari/10 hover:text-olive dark:text-off-white transition-colors">
                  <LayoutDashboard className="h-4 w-4 text-kalahari" /> My Dashboard
                </Link>
                <Link href="/outfitter/dashboard/leads" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-olive dark:text-off-white/80 hover:bg-kalahari/10 hover:text-olive dark:text-off-white transition-colors">
                  <Mail className="h-4 w-4 text-kalahari" /> Inquiries Inbox
                </Link>
                <Link href="/outfitter/dashboard/settings" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-olive dark:text-off-white/80 hover:bg-kalahari/10 hover:text-olive dark:text-off-white transition-colors">
                  <Settings className="h-4 w-4 text-kalahari" /> Profile Settings
                </Link>
              </>
            )}

            {(!isAdmin && !isOutfitter) && (
              <>
                <Link href="/wishlist" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-olive dark:text-off-white/80 hover:bg-kalahari/10 hover:text-olive dark:text-off-white transition-colors">
                  <Heart className="h-4 w-4 text-kalahari" /> My Wishlist
                </Link>
                <Link href="/settings" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-olive dark:text-off-white/80 hover:bg-kalahari/10 hover:text-olive dark:text-off-white transition-colors">
                  <User className="h-4 w-4 text-kalahari" /> My Profile
                </Link>
              </>
            )}
          </div>

          <div className="border-t border-kalahari/20 py-2">
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="h-4 w-4" /> Sign Out
            </button>
          </div>

        </div>
      )}
    </div>
  );
}