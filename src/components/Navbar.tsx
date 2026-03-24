"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase/client";
import { doc, getDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Target, LogOut, LayoutDashboard, Loader2, Compass, User, MessageSquare, Heart, Settings, ChevronDown, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

// --- QUICK THEME TOGGLE BUTTON COMPONENT ---
function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by waiting until component mounts
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="h-9 w-9" />; // Placeholder space

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="h-9 w-9 rounded-full flex items-center justify-center border-2 border-kalahari/20 hover:border-kalahari/60 bg-off-white dark:bg-olive transition-colors group focus:outline-none focus-visible:ring-2 focus-visible:ring-kalahari"
      aria-label="Toggle Dark Mode"
    >
      {theme === "dark" ? (
        <Sun className="h-4 w-4 text-kalahari group-hover:scale-110 transition-transform" />
      ) : (
        <Moon className="h-4 w-4 text-olive dark:text-off-white/70 group-hover:text-olive dark:text-off-white group-hover:scale-110 transition-transform" />
      )}
    </button>
  );
}

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<"HUNTER" | "OUTFITTER" | null>(null);
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // --- Dropdown State ---
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown if user clicks outside of it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- THE DETECTIVE: Check our current route ---
  const isDashboard = pathname?.includes('/dashboard');
  const isAuthPage = pathname?.includes('/login') || pathname?.includes('/signup') || pathname?.includes('/register');

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
          // Fetch the user's actual database document to get the real profile picture
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setRole(userData.role);
            // Grab the uploaded profile image, fallback to auth photo, or leave null
            setProfilePic(userData.profileImageUrl || currentUser.photoURL || null);
          }
        } catch (err) {
          console.error("Error fetching user role:", err);
        }
      } else {
        setUser(null);
        setRole(null);
        setProfilePic(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    setDropdownOpen(false);
    await signOut(auth);
    router.push("/");
  };

  const handleDashboardClick = () => {
    if (role === "OUTFITTER") {
      router.push("/outfitter/dashboard");
    } else {
      router.push("/hunter/dashboard");
    }
  };

  return (
    <nav className="bg-white dark:bg-olive/95 dark:backdrop-blur-md border-b-2 border-kalahari/20 dark:border-kalahari/30 sticky top-0 z-50 shadow-sm transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* LEFT: Logo & Brand */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="h-10 w-10 bg-olive dark:bg-kalahari rounded-lg flex items-center justify-center shadow-sm group-hover:rotate-3 transition-transform">
              <Target className="h-6 w-6 text-kalahari dark:text-olive dark:text-off-white" />
            </div>
            <span className="font-black font-headline text-2xl text-olive dark:text-off-white dark:text-off-white tracking-tight transition-colors">
              Only-Hunts
            </span>
          </Link>

          {/* RIGHT: Navigation Links */}
          <div className="flex items-center gap-3 sm:gap-4">
            
            {/* Dark Mode Toggle (Always Visible) */}
            <ThemeToggle />

            {/* ONLY show Marketplace button if we are NOT on a dashboard */}
            {!isDashboard && (
              <>
                <Link href="/#marketplace">
                  <Button variant="ghost" className="text-olive dark:text-off-white dark:text-kalahari font-bold hover:bg-kalahari/10 hover:text-olive dark:text-off-white dark:hover:text-off-white text-sm sm:text-base flex px-2 sm:px-4 transition-colors">
                    <Compass className="h-4 w-4 sm:mr-2" /> <span className="hidden sm:inline">Marketplace</span>
                  </Button>
                </Link>
                {/* Vertical divider */}
                {!isAuthPage && <div className="h-6 w-px bg-kalahari/30 mx-1 sm:mx-2 hidden sm:block"></div>}
              </>
            )}

            {/* User Controls */}
            {!isAuthPage && (
              <>
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-kalahari" />
                ) : user ? (
                  
                  // LOGGED IN STATE
                  <div className="flex items-center gap-3">
                    <Button onClick={handleDashboardClick} className="bg-olive dark:bg-kalahari hover:bg-olive/90 dark:hover:bg-kalahari/90 text-kalahari dark:text-olive dark:text-off-white font-black shadow-md hidden sm:flex transition-colors">
                      <LayoutDashboard className="h-4 w-4 mr-2" /> Dashboard
                    </Button>
                    
                    {/* AVATAR DROPDOWN */}
                    <div className="relative" ref={dropdownRef}>
                      <button 
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        className="flex items-center gap-2 p-1 pr-2 rounded-full border-2 border-kalahari/20 dark:border-kalahari/40 hover:border-kalahari transition-colors bg-off-white dark:bg-olive/50 focus:outline-none"
                      >
                        <div className="h-8 w-8 bg-kalahari/20 rounded-full flex items-center justify-center text-olive dark:text-off-white dark:text-kalahari overflow-hidden">
                          {/* USE THE NEW PROFILE PIC STATE HERE */}
                          {profilePic ? (
                            <img src={profilePic} alt="User" className="h-full w-full object-cover" />
                          ) : (
                            <User className="h-4 w-4" />
                          )}
                        </div>
                        <ChevronDown className="h-4 w-4 text-olive dark:text-off-white/60 dark:text-kalahari/60" />
                      </button>

                      {/* DROPDOWN MENU CONTENT */}
                      {dropdownOpen && (
                        <div className="absolute right-0 mt-3 w-60 bg-white dark:bg-olive rounded-xl shadow-xl border-2 border-kalahari/20 dark:border-kalahari/40 overflow-hidden flex flex-col z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                          
                          {/* User Info Header */}
                          <div className="px-4 py-3 border-b-2 border-kalahari/10 dark:border-kalahari/20 bg-off-white dark:bg-black/20">
                            <p className="text-sm font-black text-olive dark:text-off-white dark:text-off-white truncate transition-colors">
                              {user.displayName || (role === "OUTFITTER" ? "Outfitter Account" : "Hunter Account")}
                            </p>
                            <p className="text-xs font-medium text-olive dark:text-off-white/60 dark:text-kalahari/80 truncate transition-colors">{user.email}</p>
                          </div>

                          {/* Menu Links */}
                          <div className="p-2 flex flex-col gap-1">
                            {/* Mobile Dashboard Link (Visible only on small screens) */}
                            <button 
                              onClick={() => { setDropdownOpen(false); handleDashboardClick(); }}
                              className="sm:hidden flex items-center px-3 py-2 text-sm font-bold text-olive dark:text-off-white/80 dark:text-off-white/80 hover:text-olive dark:text-off-white dark:hover:text-kalahari hover:bg-kalahari/10 rounded-lg transition-colors w-full text-left"
                            >
                              <LayoutDashboard className="h-4 w-4 mr-3 text-kalahari" /> Dashboard
                            </button>

                            <Link 
                              href="/messages" 
                              onClick={() => setDropdownOpen(false)}
                              className="flex items-center px-3 py-2 text-sm font-bold text-olive dark:text-off-white/80 dark:text-off-white/80 hover:text-olive dark:text-off-white dark:hover:text-kalahari hover:bg-kalahari/10 rounded-lg transition-colors"
                            >
                              <MessageSquare className="h-4 w-4 mr-3 text-kalahari" /> Messages
                            </Link>

                            {role === "OUTFITTER" ? (
                              <Link 
                                href="/outfitter/dashboard/leads" 
                                onClick={() => setDropdownOpen(false)}
                                className="flex items-center px-3 py-2 text-sm font-bold text-olive dark:text-off-white/80 dark:text-off-white/80 hover:text-olive dark:text-off-white dark:hover:text-kalahari hover:bg-kalahari/10 rounded-lg transition-colors"
                              >
                                <Target className="h-4 w-4 mr-3 text-kalahari" /> Lead Pipeline
                              </Link>
                            ) : (
                              <Link 
                                href="/hunter/dashboard" 
                                onClick={() => setDropdownOpen(false)}
                                className="flex items-center px-3 py-2 text-sm font-bold text-olive dark:text-off-white/80 dark:text-off-white/80 hover:text-olive dark:text-off-white dark:hover:text-kalahari hover:bg-kalahari/10 rounded-lg transition-colors"
                              >
                                <Heart className="h-4 w-4 mr-3 text-kalahari" /> Saved Wishlist
                              </Link>
                            )}

                            <Link 
                              href="/profile/edit" 
                              onClick={() => setDropdownOpen(false)}
                              className="flex items-center px-3 py-2 text-sm font-bold text-olive dark:text-off-white/80 dark:text-off-white/80 hover:text-olive dark:text-off-white dark:hover:text-kalahari hover:bg-kalahari/10 rounded-lg transition-colors"
                            >
                              <Settings className="h-4 w-4 mr-3 text-kalahari" /> Account Settings
                            </Link>
                          </div>

                          {/* Logout Footer */}
                          <div className="p-2 border-t-2 border-kalahari/10 dark:border-kalahari/20">
                            <button 
                              onClick={handleLogout} 
                              className="w-full flex items-center px-3 py-2 text-sm font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors text-left"
                            >
                              <LogOut className="h-4 w-4 mr-3" /> Sign Out
                            </button>
                          </div>

                        </div>
                      )}
                    </div>
                  </div>

                ) : (
                  
                  // LOGGED OUT STATE
                  <>
                    <Link href="/login">
                      <Button variant="ghost" className="text-olive dark:text-off-white dark:text-kalahari font-bold hover:bg-kalahari/10 transition-colors">
                        Sign In
                      </Button>
                    </Link>
                    <Link href="/signup">
                      <Button className="bg-olive dark:bg-kalahari hover:bg-olive/90 dark:hover:bg-kalahari/90 text-kalahari dark:text-olive dark:text-off-white font-black shadow-md transition-colors">
                        Sign Up
                      </Button>
                    </Link>
                  </>
                  
                )}
              </>
            )}

          </div>

        </div>
      </div>
    </nav>
  );
}